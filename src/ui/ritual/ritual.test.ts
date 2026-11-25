import { describe, expect, it } from 'vitest';
import { beatMs, nextSpeed, resurrectionMs } from './ritual';

describe('ritual timing (design.md table)', () => {
  it('plays the fixed beats at the listed times at 1x', () => {
    expect([1, 2, 3, 4, 6].map((b) => beatMs(b, 111, 1))).toEqual([800, 1500, 2500, 1500, 1500]);
  });
  it('scales beat 5 with the row count, between 3 and 6 seconds', () => {
    expect(resurrectionMs(5)).toBe(3000);
    expect(resurrectionMs(111)).toBe(4220);
    expect(resurrectionMs(5000)).toBe(6000);
  });
  it('speed divides every time', () => {
    for (const b of [1, 2, 3, 4, 5, 6]) expect(beatMs(b, 111, 4)).toBe(beatMs(b, 111, 1) / 4);
    expect(beatMs(2, 111, 0.5)).toBe(3000);
  });
  it('the speed pill cycles 0.5, 1, 2, 4 and back', () => {
    expect([0.5, 1, 2, 4].map((s) => nextSpeed(s as 0.5 | 1 | 2 | 4))).toEqual([1, 2, 4, 0.5]);
  });
});
