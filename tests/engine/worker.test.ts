import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decodePng } from '../../src/engine/png';
import { handleMessage, initialState, type WorkerRequest, type WorkerState } from '../../src/engine/worker-protocol';
import { nodeInflate } from './helpers/node-inflate';
// @ts-expect-error plain .mjs helper without type declarations
import { listTuningSamples } from '../../scripts/corpus/list-tuning-samples.mjs';

const sample = (listTuningSamples() as Array<{ path: string; reference: { path: string } }>)[0]!;
const buf = (u: Uint8Array): ArrayBuffer => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
const bytes = () => buf(new Uint8Array(readFileSync(sample.path)));
const run = (s: WorkerState, b: ArrayBuffer) => handleMessage(s, { id: 1, kind: 'run', bytes: b });

describe('worker protocol', () => {
  it('run on a tuning sample returns a recovered result', () => {
    const { reply } = run(initialState, bytes());
    expect(reply.kind).toBe('result');
    if (reply.kind === 'result') expect(reply.result.recovered.status).toBe('ok');
    expect(reply.id).toBe(1);
  });

  it('run on empty bytes is unrecovered, not an error', () => {
    const { reply } = run(initialState, new ArrayBuffer(0));
    expect(reply.kind).toBe('result');
    if (reply.kind === 'result') expect(reply.result.recovered.status).toBe('unrecovered');
  });

  it('a malformed run message gives a plain error', () => {
    const { reply } = handleMessage(initialState, { id: 2, kind: 'run', bytes: 'x' } as unknown as WorkerRequest);
    expect(reply).toMatchObject({ id: 2, kind: 'error' });
  });

  it('verify before any run is an error with a plain reason', () => {
    const { reply } = handleMessage(initialState, { id: 3, kind: 'verify', reference: { width: 1, height: 1, rgb: new ArrayBuffer(3) } });
    expect(reply.kind).toBe('error');
    if (reply.kind === 'error') expect(reply.reason).toMatch(/Run a file first/);
  });

  it('verify after run is exact on the matching reference', async () => {
    const { state } = run(initialState, bytes());
    const ref = await decodePng(new Uint8Array(readFileSync(sample.reference.path)), nodeInflate);
    const { reply } = handleMessage(state, { id: 4, kind: 'verify', reference: { width: ref.width, height: ref.height, rgb: buf(ref.rgb) } });
    expect(reply.kind).toBe('verified');
    if (reply.kind === 'verified') expect(reply.verification).toMatchObject({ mode: 'reference', exact: true, mismatchCount: 0 });
  });

  it('verify rejects a reference whose buffer does not fit its size', () => {
    const { state } = run(initialState, bytes());
    const { reply } = handleMessage(state, { id: 5, kind: 'verify', reference: { width: 4, height: 4, rgb: new ArrayBuffer(5) } });
    expect(reply.kind).toBe('error');
  });

  it('is deterministic: same bytes twice give deep-equal results', () => {
    const a = run(initialState, bytes()).reply;
    const b = run(initialState, bytes()).reply;
    expect(a).toEqual(b);
  });
});
