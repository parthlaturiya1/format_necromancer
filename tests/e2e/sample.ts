import { readFileSync } from 'node:fs';

type Entry = { id: string; width: number; height: number; label?: string };
const index = JSON.parse(readFileSync('public/samples/index.json', 'utf8')) as { default: string; samples: Entry[] };

/** The default demo sample, read from public/samples/index.json so one constant (copy-samples.mjs) switches it. */
export const DEFAULT = index.samples.find((s) => s.id === index.default)!;
export const sampleById = (id: string): Entry => index.samples.find((s) => s.id === id)!;
export const BLIND = index.samples.find((s) => s.id.startsWith('blind-'))!;
