# T-21d: work limit scales with file size

Problem: T-21b set one fixed limit of 40 million steps (about 0.4 s) for every file. Valid 8-bit PCX files above about 0.5 to 1 MB were refused with "Stopped: the file needs more work than the safety limit allows", although D-10 allows 3 s for 1 MB and D-11 allows 10 MB input.

## Before and after

Before: the lead's numbers on Pillow-made PCX at 2371568. After: this task, files built in memory by the test-only encoder `tests/engine/helpers/pcx-fixture.ts`, `runPipeline`, Node v26, this machine while other agents ran builds beside it. "Exact" means the RGB equals the encoder's own pixels through its palette, byte for byte.

| Input | Size | Before | After |
|---|---|---|---|
| smooth 640x480 | 20 KB (30 KB Pillow) | ok, 96 ms | exact, 46 ms |
| smooth 3000x2000 | 377 KB (260 KB Pillow) | ok, 451 ms | exact, 138 ms |
| noise 800x600 | 600 KB (470 KB Pillow) | ok, 459 ms | exact, 190 ms |
| noise 1600x1200 | 2.4 MB (1.9 MB Pillow) | UNRECOVERED, 446 ms | exact, 269 ms |
| noise 2600x2000 | 6.5 MB (5.2 MB Pillow) | UNRECOVERED | exact, 683 ms |
| noise 3200x2600 | 10.4 MB | not measured | exact, 1,591 ms |

The test encoder never uses a run for a single value under 0xC0, so its noisy files are bigger than Pillow's for the same picture.

Attacks (`tests/engine/work-limit.test.ts`, 10 MB each, same run):

| Input | Time | Result |
|---|---|---|
| all literal bytes | 1,399 ms | unrecovered, work limit |
| marker/count pairs that expand hugely | 47 ms | unrecovered, no decode fits |
| size numbers at every offset | 1,445 ms | unrecovered, no size numbers |
| smooth ramp (palette busy) | 2,762 ms | unrecovered, no size numbers |
| near-repeating records | 1,581 ms | unrecovered, no size numbers |
| long ambiguous tail | 1,516 ms | unrecovered, no size numbers |
| random bytes | 34 ms | unrecovered, no decode fits |
| random, no marker bytes | 1,251 ms | unrecovered, no size numbers |
| all zero | 572 ms | unrecovered, work limit |

All end under 3 s with a reason. Several now finish their analysis instead of stopping at the limit, because the analysis became cheaper.

## New budget rule

`limit = workBudget + workBudgetPerByte x input length` = 60,000,000 + 36 x bytes (`src/engine/work.ts` `workLimit`, values in `src/engine/config.ts`). Still counted in steps, never time, so the same file gets the same answer on every machine.

Why these numbers: a valid file costs about 33 steps per byte after the changes below (header walk 3, repetition 9, run pairs 3, palette 5, tables 9, recover about 3; measured 273 million steps for the detectors on 10 MB). 36 per byte gives a valid 10 MB file room to finish. The base of 60 million covers small files with big pictures (smooth 3000x2000 is 377 KB but decodes 6 million pixels). The largest of 10 MB plus the base is 437 million steps; the slowest attack here took 2.8 s. The 11 tuning samples use at most 350,691 steps.

## What was made cheaper (same answers)

| Part | Before | After |
|---|---|---|
| header-block | 63 full trial decodes (7 headers x 3 tails x 3 masks), up to 63 x n | one walk per mask (3 x n); other headers and tails read off it (`decodedLengths` in `src/engine/trial-decode.ts`) |
| repetition, structures | every byte for each of 8 sizes | probes every (copies-1) x size bytes, then measures a stretch outward; stretch reads are charged on top |
| palette | prefix sums built 4 times | built once; windows far over the limit are jumped |
| recover decode | token object and division per byte | single literal handled inline |

`tests/engine/faster-detectors.test.ts` compares the new header-block, repetition and palette detectors with copies of the 2371568 versions (`tests/engine/helpers/ref/`) on 60 inputs: all equal.

## Checks

- `tests/engine/large-files.test.ts`: 6 of 6 exact under 3 s. `tests/engine/work-limit.test.ts`: 14 of 14. `tests/engine/faster-detectors.test.ts`: 60 of 60.
- Changed in a T-21b test (`work-limit.test.ts`): meters now use `workLimit(config, length)`; the tiny-budget case sets `workBudgetPerByte: 0` so it stays tiny; the tuning-sample bound is "under half the base" (was "under a tenth of 40 million"). No time bar was changed.
- `npm.cmd run verify`: steps 1 to 6 PASS (typecheck, lint, unit, property, golden incl. R-X3 mutation rule, build). See the commit for the final run.

## Weak points

- Times are wall-clock on one busy machine and vary up to about 2x between runs; the smooth-ramp attack (2.8 s) has the least room under the 3 s bar. A slower machine takes longer for the same steps.
- A file whose run tokens never fall into step with the first header walk (two-byte runs shifted by one byte) costs one walk per header; still bounded by the limit.
