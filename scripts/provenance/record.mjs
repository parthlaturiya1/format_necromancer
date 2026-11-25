// Provenance recorder (provenance.md 9.2). Appends ONE JSON line to docs/provenance/ledger.jsonl.
// Usage: node scripts/provenance/record.mjs --event E --agent A --task T --summary "text" [--path P]
// Optional JSON on stdin (Kiro hook payload) is reduced to a small allow-list; nothing else is stored.
// Append only: the ledger is only ever opened with appendFile.
import { appendFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const ledgerPath = () => process.env.PROVENANCE_LEDGER || resolve(root, 'docs', 'provenance', 'ledger.jsonl');

// shortcut: regex redaction catches common secret shapes only; extend the list when a new shape appears.
const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----|$)/g,
  /AKIA[0-9A-Z]{16}/g,
  /gh[pousr]_[A-Za-z0-9]{20,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /sk-[A-Za-z0-9_-]{20,}/g,
  /xox[baprs]-[A-Za-z0-9-]{10,}/g,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]*/g,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/gi,
  /\b[\w-]*(password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|auth)[\w-]*\s*[=:]\s*("[^"]*"|'[^']*'|\S+)/gi,
];

export function redact(text) {
  let out = String(text ?? '');
  for (const re of SECRET_PATTERNS) out = out.replace(re, '[REDACTED]');
  return out;
}

const clip = (s, n) => (s.length > n ? `${s.slice(0, n)}...` : s);

// Reads stdin JSON; returns {} when there is none, it is a terminal, or it is not JSON.
async function readStdin(timeoutMs = 3000) {
  if (process.stdin.isTTY) return {};
  const text = await new Promise((done) => {
    let buf = '';
    const t = setTimeout(() => done(buf), timeoutMs);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (buf += c));
    process.stdin.on('end', () => (clearTimeout(t), done(buf)));
    process.stdin.on('error', () => (clearTimeout(t), done(buf)));
  });
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

// Allow-list. Post Tool Use keeps tool name and path only (9.2); prompt text only for prompt events.
export function pick(payload, event) {
  const ti = payload.tool_input && typeof payload.tool_input === 'object' ? payload.tool_input : {};
  const path = [payload.path, payload.file_path, payload.filePath, ti.path, ti.file_path, ti.filePath].find((v) => typeof v === 'string');
  const data = {};
  if (typeof payload.tool_name === 'string') data.tool = payload.tool_name;
  if (path) data.path = path;
  if (typeof payload.session_id === 'string') data.session = payload.session_id;
  if (/prompt/i.test(event) && typeof payload.prompt === 'string') data.prompt = clip(redact(payload.prompt), 500);
  return data;
}

export function head() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'none';
  }
}

const safeRead = (f) => {
  try {
    return readFileSync(f, 'utf8');
  } catch {
    return '';
  }
};

export function buildEntry(args, payload = {}) {
  const event = args.event || payload.hook_event_name || 'unknown';
  const data = pick(payload, event);
  if (args.path) data.path = args.path;
  if (event === 'Stop') {
    const m = /Overall: \*\*(\w+)\*\*/.exec(safeRead(resolve(root, 'docs', 'verification', 'latest.md')));
    data.lastVerify = m ? m[1] : 'unknown';
  }
  return {
    ts: new Date().toISOString(),
    event,
    agent: args.agent || 'kiro',
    taskId: args.task || 'unknown',
    summary: clip(redact(args.summary || ''), 500),
    head: head(),
    ...(Object.keys(data).length ? { data } : {}),
  };
}

export async function record(args, payload = {}) {
  const file = ledgerPath();
  const entry = buildEntry(args, payload);
  await mkdir(dirname(file), { recursive: true });
  await appendFile(file, `${JSON.stringify(entry)}\n`);
  return entry;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const m = /^--(event|agent|task|summary|path)$/.exec(argv[i]);
    if (m && i + 1 < argv.length) out[m[1]] = argv[++i];
  }
  return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const entry = await record(parseArgs(process.argv.slice(2)), await readStdin());
    console.log(`recorded ${entry.event} ${entry.taskId}`);
  } catch (e) {
    // A hook must never break the agent turn: report and exit 0.
    console.error(`provenance: not recorded: ${e instanceof Error ? e.message : e}`);
  }
}
