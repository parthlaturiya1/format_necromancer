import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs helper without types
import { listTuningSamples } from '../../scripts/corpus/list-tuning-samples.mjs';
// @ts-expect-error plain .mjs helper without types
import { validate } from '../../scripts/corpus/validate.mjs';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    if (n === 'node_modules' || n === '__pycache__') return [];
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

describe('corpus', () => {
  it('manifest validates and hashes match', () => {
    expect(validate()).toEqual([]);
  });

  it('tuning list has 10+ samples and none held out', () => {
    const list = listTuningSamples() as { heldOut: boolean; path: string }[];
    expect(list.length).toBeGreaterThanOrEqual(10);
    expect(list.every((s) => s.heldOut === false && !s.path.includes('heldout'))).toBe(true);
  });

  it('no script or test other than the validator and the one-time blind run names the held-out folder', () => {
    // Pattern built from parts so this file does not match itself.
    // Allowed readers: the validator (hashes only) and the T-12 blind run (run once, recorded in
    // docs/verification/blind-test.md, never part of tuning). Any other reader fails this test.
    // scripts/samples/copy-samples.mjs copies the held-out file and its trusted reference to public/samples for the
    // F-11 blind-test display, after the one-time T-12 run; it never reads or analyses the bytes.
    const allowed = ['scripts/corpus/validate.mjs', 'tests/blind/run.test.ts', 'scripts/samples/copy-samples.mjs'];
    const re = new RegExp(['corpus', '[\\\\/]+', 'held', 'out'].join(''), 'i');
    const offenders = [...walk('scripts'), ...walk('tests')]
      .filter((f) => !allowed.some((a) => f.replace(/\\/g, '/').endsWith(a)))
      .filter((f) => re.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
