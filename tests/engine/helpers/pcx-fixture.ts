/**
 * TEST FIXTURE GENERATOR (T-21d). Not engine code, not shipped. Builds a valid 8-bit PCX in memory
 * from a deterministic pixel source, so large-file tests need no committed big files and no Python.
 * Layout written: 128-byte header, run-length body (marker 0xC0 | count, count 1..63), 0x0C + 768-byte palette.
 * `pixels` are returned too, so a test compares the engine output to what was encoded, not to the engine.
 */
export type PcxFixture = { bytes: Uint8Array; width: number; height: number; indexes: Uint8Array; palette: Uint8Array };

/** Fixed-seed xorshift32. Deterministic. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s;
  };
}

export type PixelKind = 'smooth' | 'noise';

export function makePcx(width: number, height: number, kind: PixelKind, seed = 1): PcxFixture {
  const rng = makeRng(seed);
  const indexes = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      indexes[y * width + x] = kind === 'noise' ? rng() & 0xff : ((x >> 5) + (y >> 5) * 3) & 0xff;
    }
  }
  const palette = new Uint8Array(768);
  for (let i = 0; i < 256; i++) {
    palette[i * 3] = i;
    palette[i * 3 + 1] = (i * 5) & 0xff;
    palette[i * 3 + 2] = 255 - i;
  }
  const bpl = width + (width % 2); // bytes per line must be even
  const body = new Uint8Array(height * bpl * 2 + 16);
  let o = 0;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    let x = 0;
    while (x < bpl) {
      const v = x < width ? indexes[row + x]! : 0;
      let run = 1;
      while (run < 63 && x + run < bpl && (x + run < width ? indexes[row + x + run]! : 0) === v) run++;
      if (run > 1 || v >= 0xc0) body[o++] = 0xc0 | run;
      body[o++] = v;
      x += run;
    }
  }
  const out = new Uint8Array(128 + o + 769);
  out[0] = 10;
  out[1] = 5;
  out[2] = 1;
  out[3] = 8;
  out[8] = (width - 1) & 0xff;
  out[9] = (width - 1) >> 8;
  out[10] = (height - 1) & 0xff;
  out[11] = (height - 1) >> 8;
  out[65] = 1;
  out[66] = bpl & 0xff;
  out[67] = bpl >> 8;
  out.set(body.subarray(0, o), 128);
  out[128 + o] = 0x0c;
  out.set(palette, 129 + o);
  return { bytes: out, width, height, indexes, palette };
}

/** The RGB the engine should return: the palette applied to each index. */
export function expectedRgb(f: PcxFixture): Uint8Array {
  const rgb = new Uint8Array(f.width * f.height * 3);
  for (let i = 0; i < f.indexes.length; i++) {
    const t = f.indexes[i]! * 3;
    rgb[i * 3] = f.palette[t]!;
    rgb[i * 3 + 1] = f.palette[t + 1]!;
    rgb[i * 3 + 2] = f.palette[t + 2]!;
  }
  return rgb;
}
