# T-21b: engine work limit (security X7)

Problem (X7): `workBudget` was checked only in `src/engine/detectors/header-block.ts`. Every other loop over file bytes ran without a limit.

## Loops whose cost depends on the input

| Loop | Cost on n bytes | Now |
|---|---|---|
| header-block: trial decode per (header, tail, mask) | up to 63 x n | charged by real steps |
| box-numbers scan | at most 129 | charged |
| row-stride header scan, per (header, box) | at most 512 | charged |
| repetition: byte runs plus 8 structure sizes | 9 x n | charged up front |
| run-pairs: 3 prefix widths | 3 x n | charged up front |
| palette: prefix sums, scan, distinct checks | 2 x n x 4 + up to 128 x 256 x 4 | charged up front |
| table-like: 9 record widths | 9 x n | charged up front |
| recover: token decode, row bookkeeping, pixel loop | n + stride x height + width x height | charged before it runs |
| verify: pixel compare | width x height, at most 16.7 million | not metered. It only runs after recover, on a picture the output cap already limits, and the reference comes from the caller. |

## The counter

`src/engine/work.ts`: one `WorkMeter` per file, made in `runPipeline` and passed to `analyze` and `recover`. It counts steps (one byte looked at, or one token decoded). It has no clock. Past the limit it throws `WorkLimitError` inside the engine. `analyze` and `recover` catch it and return unrecovered with:
"Stopped: the file needs more work than the safety limit allows." Nothing escapes.

Budget `workBudget` = 40,000,000 steps (value unchanged, now covers the whole pipeline). About 0.4 s on this machine (all-literal 10 MB file stopped at 403 ms).
- Tuning samples: largest analysis uses 737,021 steps (under 2% of the budget). Test asserts under 10%.
- Blind file (4,019 bytes), analyze + recover: 300,572 steps, still exact (0 of 13,500 pixels differ).
- 10 MB: does NOT finish under it when many guesses decode (63 header guesses alone cost about 630 million). It stops with the reason above. A 10 MB file where no guess decodes ends sooner with the older reason.

## Output cap

`trialDecode` takes `maxOutput` (header-block passes `maxOutputValues`, 16,777,216). A body that chains counts past it is not a candidate. The recoverer already refuses stride x height above the same cap and a body that gives more than height x stride values. Counts are at most 127 per token, so a 10 MB body could ask for about 1.3 billion values. It now stops after about 16.7 million.

## Adversarial results (this machine, 10 MB each, built in memory, `tests/engine/work-limit.test.ts`)

| Input | Time | Result |
|---|---|---|
| all literal bytes (every header guess decodes) | 403 ms | unrecovered, work limit |
| marker/count pairs that expand hugely | 271 ms | unrecovered, no decode fits |
| size numbers at every offset | 513 ms | unrecovered, work limit |
| smooth ramp (palette busy) | 475 ms | unrecovered, work limit |
| near-repeating records (table, repetition busy) | 454 ms | unrecovered, work limit |
| long ambiguous tail | 450 ms | unrecovered, work limit |
| random bytes | 3 ms | unrecovered, no decode fits |
| random, no marker bytes | 358 ms | unrecovered, work limit |
| all zero | 373 ms | unrecovered, work limit |

All under the 3 s limit, all with a reason. Detectors alone on 10 MB busy patterns, unlimited meter: 1.9 to 3.0 s and 304,146,561 steps, so about 7 to 10 ns per step. That is why 40 million steps stay near 0.4 s.

Also tested: a tiny budget (1000) returns the plain reason through `analyze` and `runPipeline` without throwing; the meter is shared and trips on the first step over; `trialDecode` stops early past the output cap.

## Existing checks

Full `npm.cmd run verify`: PASS. Golden 11 of 11 exact, detector guard and baselines unchanged (not regenerated), mutation and fuzz tests green.

## Notes for docs/security.md X7 (for the owner to apply)

- X7 can be marked fixed in the engine: one shared step counter covers all detectors, the recoverer and the pixel loop; output is capped at 16,777,216 values.
- Remaining limit: a crafted file can still use the user's own tab for about 0.5 s (budget 40 million steps) before it stops, down from up to the 120 s timeout.
- Not metered: verify (bounded by the output cap) and the PNG reference decoder (png.ts), which was not reviewed in this task.
- The budget counts steps, not time. A slower machine takes longer for the same steps.
