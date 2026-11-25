/**
 * Shared work counter (T-21b, security X7). It counts steps, not time, so the result is the same on every machine.
 * One meter is made per file and passed to every stage that loops over file bytes. When the total passes the
 * limit, spend() throws WorkLimitError; analyze() and recover() catch it and return unrecovered with WORK_LIMIT_REASON.
 * Unit: one step is one byte looked at, or one token decoded.
 */
export const WORK_LIMIT_REASON = 'Stopped: the file needs more work than the safety limit allows';

export class WorkLimitError extends Error {
  constructor() {
    super(WORK_LIMIT_REASON);
    this.name = 'WorkLimitError';
  }
}

export type WorkMeter = { readonly limit: number; used: number; spend(steps: number): void };

export function createWorkMeter(limit: number): WorkMeter {
  const m: WorkMeter = {
    limit,
    used: 0,
    spend(steps: number) {
      m.used += steps;
      if (m.used > m.limit) throw new WorkLimitError();
    },
  };
  return m;
}
