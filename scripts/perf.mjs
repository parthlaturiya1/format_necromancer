// Wall-clock perf bars (D-10), median of repeated runs. Local only: perf.spec.ts skips itself on CI (software rendering) and logs why.
// PW_CPU_THROTTLE=4 npm run perf  simulates a slow machine.
import { spawnSync } from 'node:child_process';

const r = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test'], { stdio: 'inherit', env: { ...process.env, PERF: '1' } });
process.exit(r.status ?? 1);
