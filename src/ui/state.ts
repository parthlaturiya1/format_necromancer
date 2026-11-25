import type { PipelineResult } from '../engine/pipeline';

/** Reference picture status for a bundled sample. The check itself arrives in T-17. */
export type RefStatus = 'none' | 'loaded' | 'missing';

export type AppState =
  | { phase: 'idle' }
  | { phase: 'loading'; name: string }
  | { phase: 'analysing'; name: string; bytes: Uint8Array }
  | { phase: 'done'; name: string; bytes: Uint8Array; result: PipelineResult; reference: RefStatus }
  | { phase: 'failed'; name: string; reason: string };

export type Action =
  | { type: 'load'; name: string }
  | { type: 'read'; bytes: Uint8Array }
  | { type: 'result'; result: PipelineResult }
  | { type: 'reference'; status: RefStatus }
  | { type: 'fail'; name?: string; reason: string }
  | { type: 'reset' };

export const initialState: AppState = { phase: 'idle' };

/** idle -> loading -> analysing -> done | failed. An action that does not fit the phase is ignored. */
export function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'load':
      return { phase: 'loading', name: a.name };
    case 'read':
      return s.phase === 'loading' ? { phase: 'analysing', name: s.name, bytes: a.bytes } : s;
    case 'result':
      return s.phase === 'analysing' ? { phase: 'done', name: s.name, bytes: s.bytes, result: a.result, reference: 'none' } : s;
    case 'reference':
      return s.phase === 'done' ? { ...s, reference: a.status } : s;
    case 'fail':
      return { phase: 'failed', name: a.name ?? ('name' in s ? s.name : 'file'), reason: a.reason };
    case 'reset':
      return initialState;
  }
}
