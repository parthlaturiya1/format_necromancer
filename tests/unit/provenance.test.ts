import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const recordPath = resolve('scripts/provenance/record.mjs');
const checkPath = resolve('scripts/provenance/check.mjs');
// Dynamic import by variable keeps tsc (allowJs false) from needing types for .mjs.
const load = async (p: string) => (await import(/* @vite-ignore */ `file:///${p.replace(/\\/g, '/')}`)) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const runRecord = (ledger: string, args: string[], input?: string) =>
  spawnSync(process.execPath, [recordPath, ...args], { env: { ...process.env, PROVENANCE_LEDGER: ledger }, input: input ?? '', encoding: 'utf8' });

describe('record.mjs', () => {
  it('appends one line per call and never rewrites earlier lines', () => {
    const ledger = join(mkdtempSync(join(tmpdir(), 'prov-')), 'ledger.jsonl');
    writeFileSync(ledger, '{"old":true}\n');
    runRecord(ledger, ['--event', 'A', '--task', 'T-02', '--summary', 'one']);
    runRecord(ledger, ['--event', 'B', '--agent', 'x', '--summary', 'two']);
    const lines = readFileSync(ledger, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('{"old":true}');
    const e = JSON.parse(lines[1]!);
    expect(e).toMatchObject({ event: 'A', agent: 'kiro', taskId: 'T-02', summary: 'one' });
    expect(typeof e.head).toBe('string');
    expect(Number.isNaN(Date.parse(e.ts))).toBe(false);
  });

  it('redacts secret-looking strings in summary and prompt', () => {
    const ledger = join(mkdtempSync(join(tmpdir(), 'prov-')), 'ledger.jsonl');
    const key = 'AKIA' + 'ABCDEFGHIJKLMNOP';
    runRecord(ledger, ['--event', 'UserPromptSubmit', '--summary', `use ${key} and password=hunter2 and ghp_${'a'.repeat(30)}`], JSON.stringify({ prompt: 'token: abc123secret' }));
    const raw = readFileSync(ledger, 'utf8');
    expect(raw).not.toContain(key);
    expect(raw).not.toContain('hunter2');
    expect(raw).not.toContain('abc123secret');
    expect(raw).toContain('[REDACTED]');
  });

  it('keeps only tool name and path from a PostToolUse payload', () => {
    const ledger = join(mkdtempSync(join(tmpdir(), 'prov-')), 'ledger.jsonl');
    runRecord(ledger, ['--event', 'PostToolUse'], JSON.stringify({ tool_name: 'fs_write', tool_input: { path: 'src/a.ts', text: 'BODY' }, tool_response: 'BODY' }));
    const e = JSON.parse(readFileSync(ledger, 'utf8'));
    expect(e.data).toEqual({ tool: 'fs_write', path: 'src/a.ts' });
    expect(JSON.stringify(e)).not.toContain('BODY');
  });
});

describe('check.mjs findUnattributed', () => {
  const commits = [{ hash: 'abc1234', date: '2026-11-25T10:00:00Z', files: ['src/a.ts', 'src/b.ts', 'docs/provenance/ledger.jsonl'] }];

  it('flags files with no ledger entry and passes attributed ones', async () => {
    const { findUnattributed } = await load(checkPath);
    const entries = [{ ts: '2026-11-25T09:00:00Z', data: { path: 'src/a.ts' } }];
    expect(findUnattributed(commits, entries, resolve('.'))).toEqual([{ hash: 'abc1234', file: 'src/b.ts' }]);
  });

  it('treats an entry written after the commit as not attributing it, and accepts absolute paths', async () => {
    const { findUnattributed } = await load(checkPath);
    const late = [{ ts: '2026-11-25T11:00:00Z', data: { path: 'src/a.ts' } }];
    expect(findUnattributed(commits, late, resolve('.')).map((x: { file: string }) => x.file)).toContain('src/a.ts');
    const abs = [{ ts: '2026-11-25T09:00:00Z', data: { path: resolve('src/b.ts') } }];
    expect(findUnattributed(commits, abs, resolve('.')).map((x: { file: string }) => x.file)).toEqual(['src/a.ts']);
  });

  it('exits 0 when run as a script', () => {
    const r = spawnSync(process.execPath, [checkPath], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('provenance:check:');
  });
});
