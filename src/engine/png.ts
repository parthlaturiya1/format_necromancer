/**
 * Minimal PNG decoder (T-08), no dependency. Reads 8-bit grey, grey+alpha, RGB, RGBA and palette images,
 * not interlaced, and returns RGB (alpha dropped). Used only to load references after recovery.
 * The zlib step is passed in so the browser can use DecompressionStream and tests can use Node zlib.
 * shortcut: no 16-bit, no interlace, no tRNS; add them if a reference needs them (T-09).
 */
export type Inflate = (compressed: Uint8Array) => Promise<Uint8Array>;
export type DecodedPng = { width: number; height: number; rgb: Uint8Array };

/** Inflate with the browser's DecompressionStream (zlib format). */
export const browserInflate: Inflate = async (data) => {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const u32 = (b: Uint8Array, o: number) => ((b[o]! << 24) | (b[o + 1]! << 16) | (b[o + 2]! << 8) | b[o + 3]!) >>> 0;

/** Decode a PNG. Throws an Error with a plain reason on anything it does not support. */
export async function decodePng(png: Uint8Array, inflate: Inflate): Promise<DecodedPng> {
  if (png.length < 33 || SIGNATURE.some((v, i) => png[i] !== v)) throw new Error('Not a PNG file.');
  let width = 0;
  let height = 0;
  let colorType = -1;
  let palette: Uint8Array | null = null;
  const idat: Uint8Array[] = [];
  let o = 8;
  while (o + 12 <= png.length) {
    const len = u32(png, o);
    const type = String.fromCharCode(png[o + 4]!, png[o + 5]!, png[o + 6]!, png[o + 7]!);
    const data = png.subarray(o + 8, o + 8 + len);
    if (data.length !== len) throw new Error('PNG chunk runs past the end of the file.');
    if (type === 'IHDR') {
      width = u32(data, 0);
      height = u32(data, 4);
      colorType = data[9]!;
      if (data[8] !== 8) throw new Error('Only 8-bit PNG is supported.');
      if (data[12] !== 0) throw new Error('Interlaced PNG is not supported.');
    } else if (type === 'PLTE') palette = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    o += 12 + len;
  }
  const channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 } as Record<number, number | undefined>)[colorType];
  if (!channels || width === 0 || height === 0) throw new Error('Missing or unsupported PNG header.');
  if (colorType === 3 && !palette) throw new Error('Palette PNG has no palette.');
  const joined = new Uint8Array(idat.reduce((a, c) => a + c.length, 0));
  idat.reduce((at, c) => (joined.set(c, at), at + c.length), 0);
  const raw = await inflate(joined);
  const rowBytes = width * channels;
  if (raw.length !== (rowBytes + 1) * height) throw new Error('PNG pixel data has the wrong length.');

  const px = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (rowBytes + 1)]!;
    const src = y * (rowBytes + 1) + 1;
    const dst = y * rowBytes;
    for (let i = 0; i < rowBytes; i++) {
      const a = i >= channels ? px[dst + i - channels]! : 0;
      const b = y > 0 ? px[dst - rowBytes + i]! : 0;
      const c = y > 0 && i >= channels ? px[dst - rowBytes + i - channels]! : 0;
      let add: number;
      if (filter === 0) add = 0;
      else if (filter === 1) add = a;
      else if (filter === 2) add = b;
      else if (filter === 3) add = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else throw new Error(`Unknown PNG filter ${filter}.`);
      px[dst + i] = (raw[src + i]! + add) & 255;
    }
  }

  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const s = i * channels;
    const d = i * 3;
    if (colorType === 3) {
      const p = px[s]! * 3;
      if (p + 3 > palette!.length) throw new Error('PNG colour index is outside the palette.');
      rgb[d] = palette![p]!;
      rgb[d + 1] = palette![p + 1]!;
      rgb[d + 2] = palette![p + 2]!;
    } else if (colorType === 0 || colorType === 4) rgb[d] = rgb[d + 1] = rgb[d + 2] = px[s]!;
    else {
      rgb[d] = px[s]!;
      rgb[d + 1] = px[s + 1]!;
      rgb[d + 2] = px[s + 2]!;
    }
  }
  return { width, height, rgb };
}

export type Deflate = (data: Uint8Array) => Promise<Uint8Array>;

/** Deflate (zlib format) with the browser's CompressionStream. Tests pass Node zlib instead. */
export const browserDeflate: Deflate = async (data) => {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (b: Uint8Array) => {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]!) & 255]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** Encode RGB pixels as an 8-bit RGB PNG (filter 0, one IDAT) for download. */
export async function encodePng(width: number, height: number, rgb: Uint8Array, deflate: Deflate): Promise<Uint8Array> {
  if (!(Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0)) throw new Error('The picture size is not valid.');
  if (rgb.length !== width * height * 3) throw new Error('The pixel data does not match the picture size.');
  const raw = new Uint8Array((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) raw.set(rgb.subarray(y * width * 3, (y + 1) * width * 3), y * (width * 3 + 1) + 1);
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width);
  dv.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const chunks = [chunk('IHDR', ihdr), chunk('IDAT', await deflate(raw)), chunk('IEND', new Uint8Array(0))];
  const out = new Uint8Array(8 + chunks.reduce((a, c) => a + c.length, 0));
  out.set(SIGNATURE);
  let at = 8;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}
