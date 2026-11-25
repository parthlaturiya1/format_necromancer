import { runPipeline, type PipelineResult } from './pipeline';
import { verify, type VerificationReport } from './verify';
import type { Recovered } from './recover';

/** Messages between the UI and the engine worker (R-U5, R-U7). The reference is sent only after recovery. */
export type WorkerRequest =
  | { id: number; kind: 'run'; bytes: ArrayBuffer }
  | { id: number; kind: 'verify'; reference: { width: number; height: number; rgb: ArrayBuffer } };

export type WorkerResponse =
  | { id: number; kind: 'result'; result: PipelineResult }
  | { id: number; kind: 'verified'; verification: VerificationReport }
  | { id: number; kind: 'error'; reason: string };

/** The only thing the worker remembers: the last recovered picture, so verify can compare against it. */
export type WorkerState = { recovered: Recovered | null };
export const initialState: WorkerState = { recovered: null };

const isBuffer = (x: unknown): x is ArrayBuffer => x instanceof ArrayBuffer;

/** Pure: all worker logic. Never throws; an exception becomes an 'error' reply. */
export function handleMessage(state: WorkerState, msg: WorkerRequest): { state: WorkerState; reply: WorkerResponse } {
  const id = (msg as { id?: unknown })?.id as number;
  const fail = (reason: string): { state: WorkerState; reply: WorkerResponse } => ({ state, reply: { id, kind: 'error', reason } });
  try {
    if (msg?.kind === 'run') {
      if (!isBuffer(msg.bytes)) return fail('The run message has no byte buffer.');
      const result = runPipeline(new Uint8Array(msg.bytes));
      return { state: { recovered: result.recovered }, reply: { id, kind: 'result', result } };
    }
    if (msg?.kind === 'verify') {
      if (state.recovered === null) return fail('Nothing has been analysed yet, so there is nothing to verify. Run a file first.');
      const r = msg.reference;
      if (!r || !isBuffer(r.rgb) || !Number.isInteger(r.width) || !Number.isInteger(r.height) || r.width < 0 || r.height < 0 || r.rgb.byteLength !== r.width * r.height * 3) {
        return fail('The reference picture is malformed: its size does not match its width and height.');
      }
      const verification = verify(state.recovered, { width: r.width, height: r.height, rgb: new Uint8Array(r.rgb) });
      return { state, reply: { id, kind: 'verified', verification } };
    }
    return fail('Unknown message kind.');
  } catch (e) {
    return fail(`The engine stopped with an error: ${e instanceof Error ? e.message : 'unknown'}.`);
  }
}
