// Copies the tuning samples and their reference PNGs into public/samples/ and writes index.json.
// Tuning samples come from listTuningSamples, which never returns held-out entries. The one held-out file (F-11) is
// copied byte for byte with its trusted reference; this script never parses or analyses it (size and 150x90 are file facts from blind-test.md).
import { copyFileSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
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

if (!samples.some((s) => s.id === DEFAULT_ID)) throw new Error(`default sample ${DEFAULT_ID} is not in the corpus`);
writeFileSync(`${OUT}/index.json`, JSON.stringify({ default: DEFAULT_ID, samples }, null, 2) + '\n');
console.log(`copied ${samples.length} samples to ${OUT}`);
