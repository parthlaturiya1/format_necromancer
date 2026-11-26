// Copies the tuning samples and their reference PNGs into public/samples/ and writes index.json.
// Tuning samples come from listTuningSamples, which never returns held-out entries. The one held-out file (F-11) is
// copied byte for byte with its trusted reference; this script never parses or analyses it (size and 150x90 are file facts from blind-test.md).
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import { listTuningSamples } from '../corpus/list-tuning-samples.mjs';

const OUT = 'public/samples';
const DEFAULT_ID = 'real-abuse-end'; // P-1: real game art (the figure in fire), not a generated pattern
// Read before the folder is rebuilt: the committed refusal text is the fallback when Python or Pillow is missing (CI).
const PILLOW_FALLBACK = existsSync(`${OUT}/index.json`) ? JSON.parse(readFileSync(`${OUT}/index.json`, 'utf8')).samples?.find((s) => s.id === 'signature-changed')?.refusal : undefined;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const samples = listTuningSamples().map((s) => {
  const file = basename(s.path);
  const ref = basename(s.reference.path);
  copyFileSync(s.path, `${OUT}/${file}`);
  copyFileSync(s.reference.path, `${OUT}/${ref}`);
  return { id: s.id, path: `/samples/${file}`, bytes: s.bytes, reference: `/samples/${ref}`, width: s.width, height: s.height };
});

// R-U22: the held-out file and its trusted reference, copied byte for byte (never opened or analysed here), labelled as the blind test.
const BLIND = { pcx: 'corpus/heldout/heldout-01.pcx', ref: 'docs/verification/blind/heldout-reference.png' };
copyFileSync(BLIND.pcx, `${OUT}/blind-heldout-01.pcx`);
copyFileSync(BLIND.ref, `${OUT}/blind-heldout-01.png`);
samples.push({ id: 'blind-heldout-01', path: '/samples/blind-heldout-01.pcx', bytes: statSync(BLIND.pcx).size, reference: '/samples/blind-heldout-01.png', width: 150, height: 90, label: 'Blind test: held-out file, never used for tuning' });

// T-18: two demo files made from tuning samples by changing bytes here (deterministic; the held-out file is never used).
// Both are labelled in the picker. Verification of the signature sample uses the source sample's reference (R-X3 ruling):
// only the first byte differs, so the pixels are the source's pixels.
const tuning = (id) => {
  const s = samples.find((x) => x.id === id);
  if (!s) throw new Error(`tuning sample ${id} is not in the corpus`);
  return s;
};
{
  const src = tuning('shapes-rand-128x96');
  const cut = readFileSync(`${OUT}/${basename(src.path)}`).subarray(0, src.bytes - 768); // the last 768 bytes cut off
  writeFileSync(`${OUT}/corrupt-tail-cut.pcx`, cut);
  samples.push({ id: 'corrupt-tail-cut', path: '/samples/corrupt-tail-cut.pcx', bytes: cut.length, label: 'Corrupted: the last 768 bytes were cut off' });
}
{
  const src = tuning('rings-rand-111x111');
  const bytes = readFileSync(`${OUT}/${basename(src.path)}`);
  bytes[0] = (bytes[0] + 1) & 255; // the signature byte plus 1
  writeFileSync(`${OUT}/signature-changed.pcx`, bytes);
  // P-1: the standard decoder's real refusal, recorded once here by running Pillow on this exact file.
  let refusal = PILLOW_FALLBACK;
  try {
    const code = ['import PIL.Image as I', 'try:', '    I.open("signature-changed.pcx").load()', 'except Exception as e:', '    print(type(e).__name__ + ": " + str(e))'].join('\n');
    const out = execFileSync('python', ['-c', code], { cwd: OUT, encoding: 'utf8' }).trim();
    if (out) refusal = out;
  } catch { /* no Python or Pillow here: keep the committed text */ }
  if (!refusal) throw new Error('no Pillow refusal text: run this script once where Python and Pillow exist');
  samples.push({ id: 'signature-changed', path: '/samples/signature-changed.pcx', bytes: bytes.length, refusal, refusalSource: 'Pillow 13.0.0, a widely used image library', reference: src.reference, width: src.width, height: src.height, label: 'The first byte was changed; a standard decoder refuses this file' });
}
{
  // D8: the colour table and its lead byte (769 bytes) cut off. The engine still recovers it, but every row is uncertain.
  // Truth: Pillow's decode of this exact file (R-X3 ruling), built by scripts/corpus/mutate.mjs from the same tuning sample.
  const src = tuning('text-fire-160x32');
  const refPath = 'corpus/mutations/reference/text-fire-160x32.tail-cut.769.png';
  const bytes = readFileSync(`${OUT}/${basename(src.path)}`).subarray(0, src.bytes - 769);
  writeFileSync(`${OUT}/changed-lower-confidence.pcx`, bytes);
  copyFileSync(refPath, `${OUT}/changed-lower-confidence.png`);
  samples.push({ id: 'changed-lower-confidence', path: '/samples/changed-lower-confidence.pcx', bytes: bytes.length, reference: '/samples/changed-lower-confidence.png', width: src.width, height: src.height, label: 'Changed file, recovered with lower confidence: the colour table was cut off' });
}

// T-20: two real files made by other people (CC0, from the game Abuse, via OpenGameArt). Copied byte for byte after the
// sha256 is checked against corpus/wild/manifest.json. Truth is Pillow's decode (docs/verification/wild/*-reference.png).
// No year is stated: the OpenGameArt page gives a posting date, not the game's year.
{
  const wild = JSON.parse(readFileSync('corpus/wild/manifest.json', 'utf8').replace(/^\uFEFF/, ''));
  for (const [wid, id] of [['endgame-end', 'real-abuse-end'], ['credit-credit', 'real-abuse-credit']]) {
    const f = wild.files.find((x) => x.id === wid);
    if (!f) throw new Error(`${wid} is not in corpus/wild/manifest.json`);
    const bytes = readFileSync(f.file);
    const sha = createHash('sha256').update(bytes).digest('hex');
    if (sha !== f.sha256 || bytes.length !== f.bytes) throw new Error(`${wid}: hash or size differs from the manifest`);
    writeFileSync(`${OUT}/${id}.pcx`, bytes);
    copyFileSync(`docs/verification/wild/${wid}-reference.png`, `${OUT}/${id}.png`);
    samples.push({ id, path: `/samples/${id}.pcx`, bytes: bytes.length, reference: `/samples/${id}.png`, width: 320, height: 200, label: 'Real game art (CC0)', real: true });
  }
}

if (!samples.some((s) => s.id === DEFAULT_ID)) throw new Error(`default sample ${DEFAULT_ID} is not in the corpus`);
writeFileSync(`${OUT}/index.json`, JSON.stringify({ default: DEFAULT_ID, samples }, null, 2) + '\n');
console.log(`copied ${samples.length} samples to ${OUT}`);
