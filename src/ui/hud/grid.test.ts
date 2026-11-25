import { describe, expect, it } from 'vitest';
import { gridCols } from './stats';

describe('gridCols (D7)', () => {
  it('forms a clean rectangle for 200 rows', () => expect(gridCols(200)).toBe(20));
  it('keeps the last row at least half full when no rectangle exists', () => {
    for (const n of [111, 97, 61, 33, 7, 5, 150]) {
      const c = gridCols(n);
      expect(c).toBeLessThanOrEqual(20);
      const last = n % c || c;
      expect(last >= Math.min(c, n) / 2 || n <= c).toBe(true);
    }
  });
});
