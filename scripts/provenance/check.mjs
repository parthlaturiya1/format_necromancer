// provenance:check (provenance.md 9.3). Lists committed file changes with no ledger entry as UNATTRIBUTED.
// Warning only: always exits 0. A file change is attributed when a ledger entry names that path
// (data.path) with a timestamp at or before the commit.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LEDGER = 'docs/provenance/ledger.jsonl';
const norm = (p) => p.replace(/\\/g, '/').replace(/^\.\//, '');

export function readLedger(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .flatMap((l) => {
      try {
        return [JSON.parse(l)];
      } catch {
        return [];
      }
    });
}

// commits: [{ hash, date (ISO), files: [path] }]; entries: ledger objects.
export function findUnattributed(commits, entries, repoRoot = root) {
  const seen = new Map(); // normalized path -> earliest ledger time (ms)
  for (const e of entries) {
    const p = e?.data?.path;
    const t = Date.parse(e?.ts);
    if (typeof p !== 'string' || Number.isNaN(t)) continue;
    const rel = norm(isAbsolute(p) ? relative(repoRoot, p) : p);
    if (!seen.has(rel) || t < seen.get(rel)) seen.set(rel, t);
  }
  const out = [];
  for (const c of commits) {
    for (const f of c.files) {
      if (norm(f) === LEDGER) continue;
      const t = seen.get(norm(f));
      if (t === undefined || t > Date.parse(c.date)) out.push({ hash: c.hash, file: f });
    }
  }
  return out;
}

export function gitCommits(cwd = root) {
  const raw = execFileSync('git', ['log', '--name-only', '--pretty=format:%x01%H%x09%aI', '--no-renames'], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return raw
    .split('\x01')
    .filter(Boolean)
    .map((block) => {
      const [first, ...rest] = block.split('\n');
      const [hash, date] = first.split('\t');
      return { hash, date, files: rest.map((s) => s.trim()).filter(Boolean) };
    });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const ledger = process.env.PROVENANCE_LEDGER || resolve(root, LEDGER);
  let commits = [];
  try {
    commits = gitCommits();
  } catch (e) {
    console.log(`provenance:check could not read git history: ${e instanceof Error ? e.message : e}`);
  }
  const entries = readLedger(ledger);
  const bad = findUnattributed(commits, entries);
  for (const b of bad) console.log(`UNATTRIBUTED ${b.hash.slice(0, 7)} ${b.file}`);
  const total = commits.reduce((n, c) => n + c.files.length, 0);
  console.log(`provenance:check: ${commits.length} commits, ${total} file changes, ${entries.length} ledger entries, ${bad.length} UNATTRIBUTED (warning only)`);
}
