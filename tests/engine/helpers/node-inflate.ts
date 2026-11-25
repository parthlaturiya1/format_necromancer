import { inflateSync } from 'node:zlib';
import type { Inflate } from '../../../src/engine/png';

/** Test-side inflate for png.ts: Node zlib. The browser build passes browserInflate instead. */
export const nodeInflate: Inflate = async (data) => new Uint8Array(inflateSync(data));
