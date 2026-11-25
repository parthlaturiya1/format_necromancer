// Copies the tuning samples and their reference PNGs into public/samples/ and writes index.json.
// Tuning samples only: listTuningSamples never returns held-out entries and this script never reads the held-out set.
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
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

if (!samples.some((s) => s.id === DEFAULT_ID)) throw new Error(`default sample ${DEFAULT_ID} is not in the corpus`);
writeFileSync(`${OUT}/index.json`, JSON.stringify({ default: DEFAULT_ID, samples }, null, 2) + '\n');
console.log(`copied ${samples.length} samples to ${OUT}`);
