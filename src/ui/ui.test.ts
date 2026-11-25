import { describe, expect, it } from 'vitest';
import { describeLayout } from './describe';
import { buildIndex, statesFor } from './hex/intervals';
import { initialState, reducer } from './state';

describe('interval index', () => {
  it('merges overlaps, best state wins, gaps read as unexplained', () => {
    const idx = buildIndex([
      { range: { start: 4, end: 10 }, state: 1 },
      { range: { start: 8, end: 12 }, state: 2 },
      { range: { start: 12, end: 14 }, state: 2 },
    ]);
    expect(idx).toEqual([
      { start: 4, end: 8, state: 1 },
      { start: 8, end: 14, state: 2 },
    ]);
    expect(statesFor(idx, 2, 16)).toEqual([0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 0, 0]);
  });
  it('handles no ranges', () => {
    expect(statesFor(buildIndex([]), 0, 3)).toEqual([0, 0, 0]);
  });
});

describe('state reducer', () => {
  it('walks idle -> loading -> analysing -> done and ignores out-of-order actions', () => {
    let s = reducer(initialState, { type: 'result', result: { analysis: { status: 'unrecovered', reason: 'x' }, recovered: { status: 'unrecovered', reason: 'x' } } });
    expect(s.phase).toBe('idle');
    s = reducer(s, { type: 'load', name: 'a' });
    s = reducer(s, { type: 'read', bytes: new Uint8Array(3) });
    expect(s.phase).toBe('analysing');
    s = reducer(s, { type: 'result', result: { analysis: { status: 'unrecovered', reason: 'x' }, recovered: { status: 'unrecovered', reason: 'x' } } });
    expect(s.phase).toBe('done');
    s = reducer(s, { type: 'fail', reason: 'boom' });
    expect(s).toEqual({ phase: 'failed', name: 'a', reason: 'boom' });
  });
});

describe('describeLayout', () => {
  it('uses only reported facts', () => {
    expect(describeLayout({ headerLength: 128, boxNumbers: [5, 6], rowStride: 6 })).toBe('The file holds a 128-byte header, a picture 5 wide and 6 tall, rows of 6 values.');
    expect(describeLayout({})).toBe('The engine named no layout facts.');
  });
});
