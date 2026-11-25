import fc from 'fast-check';
import { describe, it } from 'vitest';

describe('toolchain properties', () => {
  it('reversing a byte array twice returns it', () => {
    fc.assert(
      fc.property(fc.uint8Array(), (bytes) => {
        const twice = Uint8Array.from(bytes).reverse().reverse();
        return twice.length === bytes.length && twice.every((b, i) => b === bytes[i]);
      }),
    );
  });
});
