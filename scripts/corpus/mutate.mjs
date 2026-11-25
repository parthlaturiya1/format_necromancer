// Mutation builder (T-10, R-X2). Reads TUNING samples only, through list-tuning-samples.mjs (never the held-out folder).
// Writes corpus/mutations/*.bin and corpus/mutations/manifest.json. Deterministic: fixed seed, fixed order.
// The manifest records kind, source sample and parameters. The expected outcome is one rule for every file
// ("exact or unrecovered"), checked in tests/engine/mutations.test.ts, never a per-file answer.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { listTuningSamples } from './list-tuning-samples.mjs';

const SEED = 20261125;
const OUT = 'corpus/mutations';
const HEADER = 128;
const TAIL = 769;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const samples = listTuningSamples();
const entries = [];
let seq = 0;
for (const s of samples) {
  const src = new Uint8Array(readFileSync(s.path));
  const rand = rng(SEED + seq * 7919);
  const add = (kind, param, bytes) => {
    const file = `${s.id}.${kind}.${param}.bin`;
    writeFileSync(`${OUT}/${file}`, bytes);
    entries.push({ file: `${OUT}/${file}`, kind, param, source: s.id, bytes: bytes.length });
  };
  const copy = () => src.slice();
  seq++;

  const a = copy();
  a[0] = (a[0] + 1) & 255;
  add('first-byte-changed', 'plus1', a);
  const z = copy();
  z[0] = 0;
  add('first-byte-zeroed', '0', z);

  for (let n = 1; n <= 4; n++) {
    const ins = new Uint8Array(src.length + n);
    ins.set(src, n);
    for (let i = 0; i < n; i++) ins[i] = Math.floor(rand() * 256);
    add('header-shifted-insert', String(n), ins);
    add('header-shifted-remove', String(n), src.slice(n));
  }

  for (const cut of [1, 2, 768, 769]) add('tail-cut', String(cut), src.slice(0, src.length - cut));

  for (let n = 1; n <= 8; n++) {
    const b = copy();
    const seen = new Set();
    while (seen.size < n) {
      const at = HEADER + Math.floor(rand() * (src.length - HEADER - TAIL));
      if (seen.has(at)) continue;
      seen.add(at);
      b[at] ^= 1 + Math.floor(rand() * 255);
    }
    add('body-flip', String(n), b);
  }

  // Size numbers sit at bytes 4..11 as four 16-bit little-endian values (x0, y0, x1, y1). Altered, never read as a format name by the engine.
  for (const [name, at, delta] of [['x1-plus1', 8, 1], ['x1-minus1', 8, -1], ['y1-plus1', 10, 1], ['y1-minus1', 10, -1], ['x1-times2', 8, 0]]) {
    const b = copy();
    const v = b[at] | (b[at + 1] << 8);
    const nv = delta === 0 ? Math.min(v * 2 + 1, 0xffff) : Math.max(0, v + delta);
    b[at] = nv & 255;
    b[at + 1] = nv >> 8;
    add('size-altered', name, b);
  }
}

const manifest = { version: 1, seed: SEED, rule: 'each file must be exact or unrecovered; never recovered, not exact, with confidence >= 0.9', entries };
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 1) + '\n');
console.log(`mutations: ${entries.length} files, ${entries.reduce((n, e) => n + e.bytes, 0)} bytes`);
