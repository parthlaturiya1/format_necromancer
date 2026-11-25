import type { WorkerRequest, WorkerResponse } from '../../engine/worker-protocol';
import type { PipelineResult } from '../../engine/pipeline';

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
const pending = new Map<number, { ok: (r: PipelineResult) => void; err: (reason: string) => void }>();

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
    if (e.data.kind === 'result') p.ok(e.data.result);
    else p.err(e.data.kind === 'error' ? e.data.reason : 'The engine sent an unexpected reply.');
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
    pending.set(id, { ok: (r) => { clearTimeout(timer); ok(r); }, err: (m) => { clearTimeout(timer); err(new Error(m)); } });
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
