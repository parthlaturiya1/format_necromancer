// Copies the tuning samples and their reference PNGs into public/samples/ and writes index.json.
// Tuning samples come from listTuningSamples, which never returns held-out entries. The one held-out file (F-11) is
// copied byte for byte with its trusted reference; this script never parses or analyses it (size and 150x90 are file facts from blind-test.md).
import { copyFileSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { listTuningSamples } from '../corpus/list-tuning-samples.mjs';

const OUT = 'public/samples';
const DEFAULT_ID = 'rings-rand-111x111'; // the most striking: concentric colour rings

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
  samples.push({ id: 'signature-changed', path: '/samples/signature-changed.pcx', bytes: bytes.length, reference: src.reference, width: src.width, height: src.height, label: 'The first byte was changed; a standard decoder refuses this file' });
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

if (!samples.some((s) => s.id === DEFAULT_ID)) throw new Error(`default sample ${DEFAULT_ID} is not in the corpus`);
writeFileSync(`${OUT}/index.json`, JSON.stringify({ default: DEFAULT_ID, samples }, null, 2) + '\n');
console.log(`copied ${samples.length} samples to ${OUT}`);
