// Shared helper: the ONLY way tuning code may list corpus samples. Never returns held-out entries.
// It reads manifest.json only; it never opens the held-out folder (guardrail 10).
import { readFileSync } from 'node:fs';

export function listTuningSamples(manifestPath = 'corpus/manifest.json') {
  const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
  return m.samples.filter((s) => s.heldOut === false);
}
