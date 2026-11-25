import type { WorkerRequest, WorkerResponse } from '../../engine/worker-protocol';
import type { PipelineResult } from '../../engine/pipeline';
import type { VerificationReport } from '../../engine/verify';
import type { DecodedPng } from '../../engine/png';

export type EngineStatus = 'starting' | 'ready' | 'error';

/**
 * Proves the engine worker loads under the static export (T-13).
 * Runs the real pipeline on a tiny buffer in the shared worker and resolves with the status. The page never waits on it to render.
 */
export function probeEngine(): Promise<EngineStatus> {
  return runEngine(new Uint8Array(64).buffer, 10000).then(() => 'ready' as const, () => 'error' as const);
}
let shared: Worker | null = null;
let seq = 100;
const pending = new Map<number, { ok: (r: WorkerResponse) => void; err: (reason: string) => void }>();

function failAll(reason: string) {
  shared?.terminate();
  shared = null;
  for (const p of pending.values()) p.err(reason);
  pending.clear();
}

function engine(): Worker {
  if (shared) return shared;
  const w = new Worker(new URL('../../engine/worker.ts', import.meta.url), { type: 'module' });
  w.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const p = pending.get(e.data.id);
    if (!p) return;
    pending.delete(e.data.id);
    if (e.data.kind === 'error') p.err(e.data.reason);
    else p.ok(e.data);
  };
  w.onerror = () => failAll('The engine stopped unexpectedly.');
  shared = w;
  return w;
}

/** Runs the real pipeline in the worker. The buffer is moved to the worker, so pass a copy. Rejects with a plain reason. */
export function runEngine(buffer: ArrayBuffer, timeoutMs = 120000): Promise<PipelineResult> {
  return new Promise((ok, err) => {
    const id = ++seq;
    const timer = setTimeout(() => failAll('The engine took too long and was stopped.'), timeoutMs);
    pending.set(id, { ok: (r) => { clearTimeout(timer); if (r.kind === 'result') ok(r.result); else err(new Error('The engine sent an unexpected reply.')); }, err: (m) => { clearTimeout(timer); err(new Error(m)); } });
    try {
      const req: WorkerRequest = { id, kind: 'run', bytes: buffer };
      engine().postMessage(req, [buffer]);
    } catch {
      clearTimeout(timer);
      pending.delete(id);
      err(new Error('The engine could not start in this browser.'));
    }
  });
}

/** Compares the last recovered picture (held by the worker) with a reference. The reference is sent only now, after recovery (R-U7). */
export function runVerify(reference: DecodedPng, timeoutMs = 60000): Promise<VerificationReport> {
  return new Promise((ok, err) => {
    const id = ++seq;
    const timer = setTimeout(() => failAll('The check took too long and was stopped.'), timeoutMs);
    pending.set(id, { ok: (r) => { clearTimeout(timer); if (r.kind === 'verified') ok(r.verification); else err(new Error('The engine sent an unexpected reply.')); }, err: (m) => { clearTimeout(timer); err(new Error(m)); } });
    try {
      const rgb = reference.rgb.slice().buffer;
      const req: WorkerRequest = { id, kind: 'verify', reference: { width: reference.width, height: reference.height, rgb } };
      engine().postMessage(req, [rgb]);
    } catch {
      clearTimeout(timer);
      pending.delete(id);
      err(new Error('The engine could not start in this browser.'));
    }
  });
}