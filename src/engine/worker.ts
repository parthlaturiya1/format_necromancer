/// <reference lib="webworker" />
// Module worker: new Worker(new URL('../engine/worker.ts', import.meta.url), { type: 'module' }). No DOM, no network.
import { handleMessage, initialState, type WorkerRequest, type WorkerResponse } from './worker-protocol';

const scope = self as unknown as DedicatedWorkerGlobalScope;
let state = initialState;

scope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const out = handleMessage(state, event.data);
  state = out.state;
  const reply: WorkerResponse = out.reply;
  // Move the big picture buffer to the page without a copy. The worker keeps its own copy for verify.
  const transfer: Transferable[] = [];
  if (reply.kind === 'result' && reply.result.recovered.status === 'ok') {
    const rgb = reply.result.recovered.rgb;
    reply.result.recovered.rgb = rgb.slice();
    state = { recovered: { ...reply.result.recovered, rgb } };
    transfer.push(reply.result.recovered.rgb.buffer);
  }
  scope.postMessage(reply, transfer);
};
