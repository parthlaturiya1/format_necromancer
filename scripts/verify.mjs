// The one gate (testing.md 8.1). Runs steps in order, stops at the first red,
// writes docs/verification/latest.md. STUB steps print "STUB" and pass until their task lands.
import { spawnSync } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const node = process.execPath;
const bin = (p) => [node, p];
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' };

// shortcut: secret scan is a regex over git-tracked files, not a real scanner; upgrade at T-21.
const secretScan = () => {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  const re = /(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{36,}|sk-[A-Za-z0-9]{32,}|xox[baprs]-[A-Za-z0-9-]{10,})/;
  let bad = 0;
  for (const f of files) {
    if (f.endsWith('package-lock.json') || !existsSync(f)) continue;
    const text = readFileSync(f, 'utf8');
    if (re.test(text)) {
      console.log(`possible secret in ${f}`);
      bad++;
    }
  }
  console.log(`secret scan: ${files.length} files, ${bad} findings`);
  return bad ? 1 : 0;
};

const run = (cmd) => () => spawnSync(cmd[0], cmd.slice(1), { stdio: 'inherit', env }).status ?? 1;
const shell = (line) => () => spawnSync(line, { stdio: 'inherit', env, shell: true }).status ?? 1;

// Warning only (provenance.md 9.3): UNATTRIBUTED lines are kept for latest.md, never fail the gate.
const warnings = [];
const provenanceCheck = () => {
  const r = spawnSync(node, ['scripts/provenance/check.mjs'], { encoding: 'utf8', env });
  process.stdout.write(r.stdout ?? '');
  process.stderr.write(r.stderr ?? '');
  warnings.push(...(r.stdout ?? '').split('\n').filter((l) => l.startsWith('UNATTRIBUTED')));
  return r.status === 0 ? 0 : 1;
};

// T-10: step 4 runs the fuzz set (tests/property/fuzz.test.ts); step 5 runs the mutation rule check (R-X3) and fails on a rule break.
// Validation (T-03) plus the golden report (T-06): the test regenerates docs/verification/golden-report.md and fails if rank 1 differs from the spike layout.
const goldenCorpus = () => {
  const code = spawnSync(node, ['scripts/corpus/validate.mjs'], { stdio: 'inherit', env }).status ?? 1;
  if (code !== 0) return code;
  return spawnSync(node, ['node_modules/vitest/vitest.mjs', 'run', 'tests/engine/golden-report.test.ts', 'tests/engine/golden-v2.test.ts', 'tests/engine/png.test.ts', 'tests/engine/recover.test.ts', 'tests/engine/mutations.test.ts'], { stdio: 'inherit', env }).status ?? 1;
};

// T-21c: step 8 is real. Page JS (gzipped, per route) and engine timing (1 MiB + every tuning sample) fail the gate when over D-10 limits.
// Lighthouse: not configured (would add a dependency, D-14).
const budgetLines = [];
const budgets = () => {
  let code = spawnSync(node, ['scripts/budgets/js-size.mjs'], { stdio: 'inherit', env }).status ?? 1;
  const t = spawnSync(node, ['node_modules/vitest/vitest.mjs', 'run', '--config', 'scripts/budgets/vitest.config.mts'], { stdio: 'inherit', env }).status ?? 1;
  code = code || t;
  const read = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null);
  const js = read('test-results/budgets-js.json');
  const eng = read('test-results/budgets-engine.json');
  if (js) for (const r of js.rows) budgetLines.push(`- JS ${r.route}: ${r.missing ? 'missing' : `${r.bytes} bytes gzipped, ${r.files} files`} (limit ${js.limit})`);
  if (eng) for (const r of eng.rows) budgetLines.push(`- Engine ${r.name}: ${r.ms} ms for ${r.bytes} bytes (limit ${eng.limitMs} ms)`);
  budgetLines.push('- Lighthouse: not configured (would add a dependency)');
  return code;
};

const steps = [
  ['1 Typecheck', run([...bin('node_modules/typescript/bin/tsc'), '--noEmit'])],
  ['2 Lint', run([...bin('node_modules/eslint/bin/eslint.js'), '.'])],
  ['3 Unit tests', run([...bin('node_modules/vitest/vitest.mjs'), 'run', 'tests/unit', 'src'])],
  ['4 Property tests', run([...bin('node_modules/vitest/vitest.mjs'), 'run', 'tests/property'])],
  ['5 Golden corpus', goldenCorpus],
  ['6 Build', run([...bin('node_modules/next/dist/bin/next'), 'build'])],
  ['7 Playwright e2e', run([...bin('node_modules/@playwright/test/cli.js'), 'test'])],
  ['8 Budgets', budgets],
  ['9a Audit (high/critical)', shell('npm audit --audit-level=high')],
  ['9b Secret scan', secretScan],
  ['10 provenance:check', provenanceCheck],
];

const results = [];
let failed = false;
for (const [name, fn] of steps) {
  if (failed) {
    results.push([name, 'SKIPPED']);
    continue;
  }
  console.log(`\n=== ${name} ===`);
  const t = Date.now();
  const code = fn();
  const secs = ((Date.now() - t) / 1000).toFixed(1);
  const isStub = fn.toString().includes('STUB');
  results.push([name, code === 0 ? (isStub ? `PASS (stub, ${secs}s)` : `PASS (${secs}s)`) : `FAIL (exit ${code})`]);
  if (code !== 0) failed = true;
}

const register = existsSync('docs/feature-register.md') ? readFileSync('docs/feature-register.md', 'utf8') : 'No feature register found.';
const overall = failed ? 'FAIL' : 'PASS';
const md = [
  '# Verification',
  '',
  `Overall: **${overall}**`,
  `Run: ${new Date().toISOString()}, Node ${process.version}`,
  '',
  '| Step | Result |',
  '|---|---|',
  ...results.map(([n, r]) => `| ${n} | ${r} |`),
  '',
  '## Budgets (step 8)',
  '',
  ...(budgetLines.length ? budgetLines : ['Not run.']),
  '',
  `## Provenance warnings (${warnings.length})`,
  '',
  ...(warnings.length ? warnings.map((w) => `- ${w}`) : ['None.']),
  '',
  '## Feature register',
  '',
  register,
  '',
].join('\n');
mkdirSync('docs/verification', { recursive: true });
writeFileSync('docs/verification/latest.md', md);
console.log(`\nverify: ${overall}. Wrote docs/verification/latest.md`);
process.exit(failed ? 1 : 0);
