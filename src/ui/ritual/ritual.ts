'use client';
import { useCallback, useEffect, useState } from 'react';

export const SPEEDS = [0.5, 1, 2, 4] as const;
export type Speed = (typeof SPEEDS)[number];
export const BEATS = ['Dead file', 'Listening', 'Hypotheses', 'Evidence', 'Resurrection', 'Proof'] as const;

// design.md, Ritual timing at 1x. Beat 5 scales with the row count.
const BASE_MS = [800, 1500, 2500, 1500, 0, 1500] as const;
export const resurrectionMs = (rows: number) => Math.min(6000, Math.max(3000, 2000 + rows * 20));
/** Time of one beat at the given speed. Speed divides every time. */
export const beatMs = (beat: number, rows: number, speed: number) => (beat === 5 ? resurrectionMs(rows) : (BASE_MS[beat - 1] ?? 0)) / speed;
export const nextSpeed = (s: Speed): Speed => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length]!;

/** `?beat=N&p=0.5`: hold beat N with that share of it done. For screenshots and tests. */
export type Hold = { beat: number; p: number } | null;

export type RitualView = {
  /** 1 to 6 while the ritual is the thing on screen; 0 when there is no ritual (nothing recovered, or no file). */
  beat: number;
  finished: boolean;
  /** Counts beat changes, so a beat that starts again (a speed change) restarts its motion. */
  token: number;
  /** Length of beat 5 at this speed, in ms. */
  ms: number;
  /** Fixed share of beat 5 (held or reduced motion), or null while it plays. */
  fixed: number | null;
  next: () => void;
  skip: () => void;
};

type Rit = { key: unknown; beat: number; finished: boolean; token: number };

const start = (key: unknown, hold: Hold): Rit => ({ key, beat: hold ? hold.beat : 1, finished: hold ? hold.beat === 6 && hold.p >= 1 : false, token: 0 });

/**
 * Plays six beats from one finished result. `key` is that result (null when there is nothing to play).
 * It never waits on the engine. Under reduced motion or a hold, no timer runs: each beat is at its end state.
 * shortcut: a speed change restarts the current beat, so beat 5 can start over; fix only if it is seen in use.
 */
export function useRitual(key: unknown, rows: number, speed: Speed, reduced: boolean, hold: Hold): RitualView {
  const [rit, setRit] = useState<Rit | null>(null);
  // A new result starts a new ritual. Adjusting state while rendering is React's pattern for "reset on prop change".
  const [seen, setSeen] = useState<unknown>(null);
  if (seen !== key) {
    setSeen(key);
    setRit(key === null ? null : start(key, hold));
  }
  // The address can arrive just after the first result: a hold set later moves the ritual to it.
  const [heldFor, setHeldFor] = useState<Hold>(hold);
  if (heldFor !== hold) {
    setHeldFor(hold);
    if (hold && key !== null) setRit(start(key, hold));
  }

  const live = rit && rit.key === key && key !== null ? rit : null;
  const go = useCallback((beat: number) => {
    setRit((r) => (r ? { ...r, beat: Math.min(6, beat), finished: beat >= 6 && (reduced || beat > 6), token: r.token + 1 } : r));
  }, [reduced]);

  const beat = live?.beat ?? (key === null ? 0 : 1);
  const finished = live?.finished ?? (reduced && beat === 6);
  const liveBeat = live?.beat;
  useEffect(() => {
    if (liveBeat === undefined || finished || reduced || hold) return;
    const id = window.setTimeout(() => go(liveBeat + 1), beatMs(liveBeat, rows, speed));
    return () => window.clearTimeout(id);
  }, [liveBeat, live?.token, finished, reduced, hold, rows, speed, go]);

  const fixed = hold && beat === hold.beat ? hold.p : reduced || finished ? 1 : null;
  return {
    beat,
    finished: finished || (reduced && beat === 6),
    token: live?.token ?? 0,
    ms: resurrectionMs(rows) / speed,
    fixed,
    next: () => go(beat + 1),
    skip: () => setRit((r) => (r ? { ...r, beat: 6, finished: true, token: r.token + 1 } : r)),
  };
}
