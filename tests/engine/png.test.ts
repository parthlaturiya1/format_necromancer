// T-08: the PNG decoder is checked against all 11 tuning references first. Samples come only from list-tuning-samples.mjs.
import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { decodePng } from '../../src/engine/png';
// @ts-expect-error plain .mjs helper without type declarations
import { listTuningSamples } from '../../scripts/corpus/list-tuning-samples.mjs';
import { nodeInflate } from './helpers/node-inflate';

type Sample = { id: string; width: number; height: number; reference: { path: string } };

describe('decodePng', () => {
  const samples: Sample[] = listTuningSamples();
  it('has 11 tuning samples', () => expect(samples.length).toBe(11));
  for (const s of samples) {
    it(`decodes ${s.id} to ${s.width}x${s.height}`, async () => {
      const img = await decodePng(new Uint8Array(readFileSync(s.reference.path)), nodeInflate);
      expect([img.width, img.height]).toEqual([s.width, s.height]);
      expect(img.rgb.length).toBe(s.width * s.height * 3);
    });
  }

  // Hand-made PNGs for filters 1 to 4 and colour types 2 and 6. CRCs are not checked by the decoder.
  const chunk = (type: string, data: Uint8Array) => {
    const out = new Uint8Array(12 + data.length);
    const dv = new DataView(out.buffer);
    dv.setUint32(0, data.length);
    out.set([...type].map((c) => c.charCodeAt(0)), 4);
    out.set(data, 8);
    return out;
  };
  const make = (w: number, h: number, ct: number, rows: number[][]) => {
    const ihdr = new Uint8Array(13);
    new DataView(ihdr.buffer).setUint32(0, w);
    new DataView(ihdr.buffer).setUint32(4, h);
    ihdr[8] = 8;
    ihdr[9] = ct;
    const raw = Uint8Array.from(rows.flat());
    const parts = [Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', new Uint8Array(deflateSync(raw))), chunk('IEND', new Uint8Array(0))];
    const all = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
    parts.reduce((at, p) => (all.set(p, at), at + p.length), 0);
    return all;
  };
  it('undoes filters sub, up, average and paeth on RGB', async () => {
    // 2x4 RGB. Row 0 sub, row 1 up, row 2 average, row 3 paeth. Expected values worked out by hand.
    const png = make(2, 4, 2, [
      [1, 10, 20, 30, 1, 1, 1], // sub: px0 = 10,20,30; px1 = +1 each = 11,21,31
      [2, 1, 1, 1, 1, 1, 1], // up: 11,21,31 / 12,22,32 -> px0 = 11,21,31 ; px1 = 12,22,32
      [3, 2, 2, 2, 2, 2, 2], // average
      [4, 0, 0, 0, 0, 0, 0], // paeth
    ]);
    const img = await decodePng(png, nodeInflate);
    expect([...img.rgb.slice(0, 6)]).toEqual([10, 20, 30, 11, 21, 31]);
    expect([...img.rgb.slice(6, 12)]).toEqual([11, 21, 31, 12, 22, 32]);
    // average, pixel 0: floor((0 + up)/2) + 2 for up = 11,21,31
    expect([...img.rgb.slice(12, 15)]).toEqual([7, 12, 17]);
    expect(img.rgb.length).toBe(24);
  });
  it('drops alpha on RGBA and rejects junk', async () => {
    const img = await decodePng(make(1, 1, 6, [[0, 1, 2, 3, 255]]), nodeInflate);
    expect([...img.rgb]).toEqual([1, 2, 3]);
    await expect(decodePng(new Uint8Array(40), nodeInflate)).rejects.toThrow();
  });
});
