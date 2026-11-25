import type { WorkerRequest, WorkerResponse } from '../../engine/worker-protocol';

export type EngineStatus = 'starting' | 'ready' | 'error';

/**
 * Proves the engine worker loads under the static export (T-13).
 * Sends a 'run' on a tiny buffer and resolves with the status. The page never waits on it to render.
 */
export function probeEngine(timeoutMs = 10000): Promise<EngineStatus> {
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('../../engine/worker.ts', import.meta.url), { type: 'module' });
    } catch {
      resolve('error');
      return;
    }
    const done = (s: EngineStatus) => { clearTimeout(timer); worker.terminate(); resolve(s); };
    const timer = setTimeout(() => done('error'), timeoutMs);
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => done(e.data.kind === 'result' ? 'ready' : 'error');
    worker.onerror = () => done('error');
    const req: WorkerRequest = { id: 1, kind: 'run', bytes: new Uint8Array(64).buffer };
    worker.postMessage(req);
  });
}
