import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runPipeline } from '../engine/pipeline';
import { shortRule } from './describe';
import { buildFailureRegions, buildRegions } from './regions';

describe('shortRule (F10)', () => {
  it('keeps short text, cuts long text at a sentence, a clause or a word, never on a dangling word', () => {
    expect(shortRule('Short rule.')).toBe('Short rule.');
    expect(shortRule('First sentence is here and long enough to keep. Second sentence goes on and on and on and on and on and on and on and on.')).toBe('First sentence is here and long enough to keep.');
    const row = 'Row 0: bytes 128 to 134 read with the run rule (a marker byte with mask 192 set gives a count, the next byte is the value repeated; any other byte is one value) into 160 colour indexes.';
    const cut = shortRule(row);
    expect(cut.length).toBeLessThanOrEqual(112);
    expect(cut).not.toMatch(/\b(a|an|the|gives|of|to|with)\u2026$/);
  });
});

describe('buildFailureRegions (R-U23)', () => {
  it('lights the analysis evidence of a file that did not recover, and nothing for a recovered one', () => {
    const cutFile = runPipeline(new Uint8Array(readFileSync('public/samples/corrupt-tail-cut.pcx')));
    expect(cutFile.recovered.status).toBe('unrecovered');
    expect(buildFailureRegions(cutFile).length).toBeGreaterThan(0);
    const good = runPipeline(new Uint8Array(readFileSync('public/samples/tiny-rand-7x5.pcx')));
    expect(buildFailureRegions(good)).toEqual([]);
    expect(buildRegions(cutFile)).toEqual([]);
  });
  it('shows the signature sample as exact-capable: it recovers', () => {
    expect(runPipeline(new Uint8Array(readFileSync('public/samples/signature-changed.pcx'))).recovered.status).toBe('ok');
  });
});
