// One-off generator for scripts/golden/baseline.json. Reads the T-06 golden report as committed in 6460710
// (git show), so later reruns of the report cannot change it. Never edit baseline.json by hand.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const md = execFileSync('git', ['show', '6460710:docs/verification/golden-report.md'], { encoding: 'utf8' });
const samples = {};
for (const block of md.split(/^### /m).slice(1)) {
  const id = block.match(/^([\w-]+-\d+x\d+) /)[1];
  const r = block.match(/Rank 1 \(h1\): box (\d+)x(\d+)(?: at byte \d+)?, row length (\d+|none), header (\d+) bytes, run mask (0x[0-9a-f]+), end table (\d+) bytes at (\d+|-)/);
  const c = block.match(/Confidence: ([\d.]+)\. Evidence records: (\d+)\./);
  samples[id] = {
    boxNumbers: [+r[1], +r[2]],
    rowStride: r[3] === 'none' ? null : +r[3],
    headerLength: +r[4],
    runMarkerMask: parseInt(r[5], 16),
    tableTailLength: +r[6],
    tableTailOffset: r[7] === '-' ? null : +r[7],
    confidence: +c[1],
    evidenceCount: +c[2],
  };
}
writeFileSync('scripts/golden/baseline.json', JSON.stringify({ source: 'T-06 golden-report.md at commit 6460710', samples }, null, 2) + '\n');
console.log(Object.keys(samples).length, 'samples');
