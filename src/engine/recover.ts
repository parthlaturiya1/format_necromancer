import { defaultConfig, type EngineConfig } from './config';
import { decodeRunLengthRows } from './decoders/run-length-rows';
import { createEvidence } from './evidence';
import type { AnalysisResult, ByteRange, Evidence } from './types';

export type RowStatus = 'ok' | 'uncertain' | 'unexplained';
export type RecoveredRow = { index: number; evidenceId: string; status: RowStatus };
export type Recovered =
  | { status: 'ok'; width: number; height: number; rgb: Uint8Array; rows: RecoveredRow[]; evidence: Evidence[]; hypothesisId: string; confidence: number }
  | { status: 'unrecovered'; reason: string };

const round3 = (x: number) => Math.round(x * 1000) / 1000;
const unrecovered = (reason: string): Recovered => ({ status: 'unrecovered', reason });

/** Colour entries are 3 bytes; a one-byte index can name at most this many. */
const MAX_TABLE_ENTRIES = 256;

function run(bytes: Uint8Array, analysis: AnalysisResult, config: EngineConfig): Recovered {
  if (analysis.status !== 'ok') return unrecovered(`There is nothing to rebuild: ${analysis.reason}`);
  const hyp = analysis.hypotheses.find((h) => h.rank === 1) ?? analysis.hypotheses[0];
  if (!hyp) return unrecovered('The analyzer returned no hypothesis.');
  const n = bytes.length;
  const l = hyp.layout;

  // Whole-image self-checks (R-R5, R-R6): any failure means no image is claimed.
  if (!l.boxNumbers || l.boxNumbers.length < 2) return unrecovered('The best hypothesis has no size numbers, so the picture size is unknown.');
  const [width, height] = [l.boxNumbers[0]!, l.boxNumbers[1]!];
  if (!(Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0 && width <= config.maxDimension && height <= config.maxDimension)) {
    return unrecovered(`The size numbers ${width} by ${height} are not a believable picture size.`);
  }
  const stride = l.rowStride;
  if (stride === undefined) return unrecovered('The best hypothesis has no row length.');
  if (!(Number.isInteger(stride) && stride >= width && stride <= width + config.maxStridePad)) return unrecovered(`The row length ${stride} does not fit a width of ${width}.`);
  if (stride * height > config.maxOutputValues) return unrecovered(`${height} rows of ${stride} values are more than the ${config.maxOutputValues} value limit.`);
  const header = l.headerLength ?? 0;
  const mask = l.runMarkerMask;
  if (mask === undefined) return unrecovered('The best hypothesis has no run marker rule.');
  const tailLength = l.tableTailLength ?? 0;
  const bodyEnd = n - tailLength;
  if (tailLength > 0 && l.tableTailOffset !== bodyEnd) return unrecovered('The end table does not sit at the end of the file.');
  if (!(Number.isInteger(header) && header >= 0 && header < bodyEnd)) return unrecovered('The header leaves no body bytes.');

  const decoded = decodeRunLengthRows(bytes, header, bodyEnd, mask, stride, height);
  if (!decoded.ok) return unrecovered(decoded.reason);

  // Colour table (R-R4): the last whole entries of the end block, at most 256.
  const entries = Math.min(MAX_TABLE_ENTRIES, Math.floor(tailLength / 3));
  const tableRange: ByteRange | null = entries > 0 ? { start: n - entries * 3, end: n } : null;

  const rgb = new Uint8Array(width * height * 3);
  const rows: RecoveredRow[] = [];
  const evidence: Evidence[] = [];
  let worst = 1;
  for (let r = 0; r < height; r++) {
    const row = decoded.rows[r]!;
    let conf = hyp.confidence;
    const notes: string[] = [];
    const crossings = (row.runFromAbove ? 1 : 0) + (row.runIntoBelow ? 1 : 0);
    if (crossings > 0) {
      conf -= crossings * config.rowRunCrossPenalty;
      notes.push(`a run crosses ${crossings === 2 ? 'both row ends' : row.runFromAbove ? 'its start' : 'its end'}`);
    }
    // T-10 self-checks (R-X3): each lowers every row, so a layout with an unexplained part is never shown as ok.
    if (hyp.confidence < 1) {
      conf -= config.partialSupportPenalty;
      notes.push('the layout lacks a supporting fact');
    }
    if (stride - width >= 2) {
      conf -= config.widePadPenalty;
      notes.push(`each row has ${stride - width} values past the width that nothing explains`);
    }
    if (tailLength > 0 && tailLength % 3 === 0) {
      conf -= config.tableNoLeadPenalty;
      notes.push('nothing marks where the colour table starts, so a table cut or moved by one byte would look the same');
    }
    if (!tableRange) {
      conf -= config.noTablePenalty;
      notes.push('there is no colour table, so each index is shown as a grey level');
    }
    let outside = false;
    for (let x = 0; x < width; x++) {
      const idx = row.indexes[x]!;
      const o = (r * width + x) * 3;
      if (tableRange) {
        if (idx >= entries) {
          outside = true;
          continue; // stays black
        }
        const t = tableRange.start + idx * 3;
        rgb[o] = bytes[t]!;
        rgb[o + 1] = bytes[t + 1]!;
        rgb[o + 2] = bytes[t + 2]!;
      } else {
        rgb[o] = rgb[o + 1] = rgb[o + 2] = idx;
      }
    }
    if (outside) {
      conf = Math.min(conf, config.unexplainedBelow / 2);
      notes.push('a colour index points past the end of the colour table');
    }
    conf = round3(Math.max(0, Math.min(1, conf)));
    const status: RowStatus = conf < config.unexplainedBelow ? 'unexplained' : conf < config.uncertainBelow ? 'uncertain' : 'ok';
    worst = Math.min(worst, conf);
    const ranges: ByteRange[] = [row.range];
    if (tableRange) ranges.push(tableRange);
    const elementId = `row-${r}`;
    evidence.push(
      createEvidence({
        elementId,
        byteRanges: ranges,
        rule: `Row ${r}: bytes ${row.range.start} to ${row.range.end} read with the run rule (a marker byte with mask ${mask} set gives a count, the next byte is the value repeated; any other byte is one value) into ${stride} colour indexes, the first ${width} used${tableRange ? `, coloured from the table at bytes ${tableRange.start} to ${tableRange.end}` : ''}${notes.length ? `. Checks: ${notes.join('; ')}` : '. All checks passed'}.`,
        confidence: conf,
        hypothesisId: hyp.id,
      }),
    );
    rows.push({ index: r, evidenceId: elementId, status });
  }
  return { status: 'ok', width, height, rgb, rows, evidence, hypothesisId: hyp.id, confidence: round3(worst) };
}

/**
 * Rebuild the picture from the rank-1 hypothesis only (R-R1). Takes the file bytes and the analyzer result,
 * nothing else: no reference image is in scope (R-R8). Never throws; deterministic (R-R7).
 */
export function recover(bytes: Uint8Array, analysis: AnalysisResult, config: EngineConfig = defaultConfig): Recovered {
  try {
    return run(bytes, analysis, config);
  } catch (e) {
    return unrecovered(`The recoverer failed on this input: ${e instanceof Error ? e.message : 'unknown error'}.`);
  }
}
