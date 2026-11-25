# Robustness report (T-10)

Requirements: R-X1 to R-X3 in `.kiro/specs/recovery/requirements.md` (R-X3 as updated by the owner's ruling of 2026-11-25), checklist R-11 in `.kiro/steering/testing.md`. Tuning samples only, listed through `scripts/corpus/list-tuning-samples.mjs`. The held-out file was not read.

Raw numbers, rewritten on every run: `docs/verification/robustness-fuzz.json`, `docs/verification/robustness-mutations.json`.

## Fuzz (R-X1): 3002 cases, 0 crashes

Test: `tests/property/fuzz.test.ts`, fast-check, seed 20261125, 600 runs per property. Each case must not throw and must end ok, or unrecovered with a non-empty plain-words reason. Each case must finish in under 3 seconds. The slowest case in the T-10 run took 40 ms (a 5849-byte sample with a random byte run).

| Group | Cases | Crashes |
|---|---|---|
| Random bytes, length 0 to 3000 | 600 | 0 |
| 1 to 15 bytes | 600 | 0 |
| Tuning sample cut at a random length | 600 | 0 |
| One byte changed in a tuning sample | 600 | 0 |
| Random run of 1 to 64 bytes written into a tuning sample | 600 | 0 |
| Empty input | 1 | 0 |
| 10 MB + 1 buffer made in memory (ends unrecovered) | 1 | 0 |

## Mutation set (R-X2)

Builder: `scripts/corpus/mutate.mjs` (seed 20261125, deterministic). Output: 297 files in `corpus/mutations/`, about 1.0 MB, plus `corpus/mutations/manifest.json`. Each entry records kind, parameter and source sample. The manifest holds one rule, not a per-file answer.

Kinds per tuning sample: first byte plus 1; first byte set to 0; 1 to 4 random bytes added at the start; 1 to 4 bytes removed from the start; tail cut by 1, 2, 768 and 769 bytes; 1 to 8 body bytes changed; size numbers changed (x1 plus 1, x1 minus 1, y1 plus 1, y1 minus 1, x1 doubled).

Truth: `scripts/corpus/mutation-reference.py` decodes every mutated file with Pillow 13.0.0 at build time (`npm run corpus:mutate`). It writes `corpus/mutations/reference/*.png` and records path and sha256 in the manifest. When Pillow refuses a file, it records "refused" and the error kind, and the expected outcome is unrecovered. Pillow decoded 91 files and refused 206.

Harness-only exception (conductor ruling, 2026-11-25): Pillow refuses the 22 first-byte files because of the signature byte, but their pixels are untouched. Their truth is the source sample's reference. This rule lives only in `tests/engine/mutations.test.ts`. The engine has no signature check.

## Rule check (R-X3): 0 files wrong with confidence 0.9 or more

Test: `tests/engine/mutations.test.ts`, run in verify step 5. It recovers first and loads the reference only after recovery (R-R8). It fails on any file that is recovered, not exact, with confidence 0.9 or more. The threshold is `uncertainBelow` (0.9) in `src/engine/config.ts`, unchanged.

| Kind | Files | Pillow refused | Exact | Unrecovered | Wrong, conf < 0.9 (max) | Wrong, conf >= 0.9 |
|---|---|---|---|---|---|---|
| First byte changed | 11 | 11 | 11 | 0 | 0 | 0 |
| First byte zeroed | 11 | 11 | 11 | 0 | 0 | 0 |
| Header shifted, bytes added | 44 | 44 | 0 | 38 | 6 (0.5) | 0 |
| Header shifted, bytes removed | 44 | 44 | 0 | 33 | 11 (0.85) | 0 |
| Tail cut | 44 | 6 | 8 | 21 | 15 (0.8) | 0 |
| Body bytes changed | 88 | 68 | 16 | 71 | 1 (0.5) | 0 |
| Size numbers changed | 55 | 22 | 11 | 32 | 12 (0.8) | 0 |
| **All** | **297** | **206** | **57** | **195** | **45 (0.85)** | **0** |

Disclosed: 45 files are recovered, not exact, with confidence below 0.9. The rule allows these. Their rows show as uncertain or unexplained, never ok. The list is in `robustness-mutations.json` under `lowConfidenceWrong`.

### Side table: old rule, against the source sample's reference (disclosed, not gated)

| Kind | Files | Exact | Unrecovered | Wrong, conf < 0.9 | Wrong, conf >= 0.9 |
|---|---|---|---|---|---|
| First byte changed / zeroed | 22 | 22 | 0 | 0 | 0 |
| Header shifted, added | 44 | 0 | 38 | 6 | 0 |
| Header shifted, removed | 44 | 0 | 33 | 11 | 0 |
| Tail cut | 44 | 3 | 21 | 20 | 0 |
| Body bytes changed | 88 | 0 | 71 | 1 | 16 |
| Size numbers changed | 55 | 0 | 32 | 12 | 11 |

The 27 high-confidence misses under the old rule are files that are still valid, different pictures. For example, one changed literal byte is one changed pixel, and Pillow agrees with the engine on them. This is why the owner moved the truth to Pillow's decode of the mutated file.

## Engine changes and why

Before T-10, 52 files broke the new rule at confidence 0.9 or more (22 first-byte, 30 others). Each fix is a general self-check in the recoverer. None looks at mutation kinds or file names. All weights are guesses, listed in `src/engine/config.ts`.

1. **No mark where the colour table starts** (`tableNoLeadPenalty`, 0.2). When the end table's length divides by 3, no lone lead byte marks its start. A table cut or moved by one byte then looks the same, and colours come out shifted (tail cut by 1, header shifts). Every row now loses 0.2.
2. **Unexplained extra row values** (`widePadPenalty`, 0.2). When the row length is 2 or more past the width, those columns are explained by nothing (seen with width numbers altered). Every row loses 0.2.
3. **Missing support** (`partialSupportPenalty`, 0.1). When the hypothesis lacks a supporting fact (hypothesis confidence below 1, for example the row length is not stored in the header), every row loses 0.1. A partly supported layout is never shown as ok.
4. **Runs crossing row ends cost more** (`rowRunCrossPenalty`, 0.05 to 0.15). A run that crosses a row end means the row length is not confirmed by the encoding. At 0.05 a row with one crossing stayed at 0.95 (ok), and wrong pictures from a mis-read height or header passed at 0.9 to 0.95. At 0.15, one crossing drops a row below 0.9.

Tried and dropped: a row-length "conflicting number" check in `src/engine/detectors/row-stride.ts`. It lowered golden confidence on the 4 odd-width samples, because there the stored screen width differs from the stored row length. Reverted.

T-08 unit test change (own commit): `tests/engine/recover.test.ts` built its colour table as 768 bytes with no lead byte, and expected one run crossing to keep a row ok at 0.95. Under R-X3 both are unsafe. The same table shape is what a cut-by-one tail looks like, and the 0.95 crossing case is the shape of the mis-read-height misses. The fixture now has a lead byte, and the crossing test expects 0.85 and uncertain. Every other assertion is the same.

## Golden no-worse

`tests/engine/golden-report.test.ts`: still **11 of 11** exact against the reference. `tests/engine/golden-v2.test.ts`: rank-1 layouts and confidences equal the T-06 baseline. No tuning-sample row is uncertain.

## Weakest point

The four weights are guesses tuned while looking at this mutation set, so the set is not a blind test. Two of them (no lead byte, wide padding) encode facts about how this family of files is laid out. They are as format-aware as the disclosed run decoder. A file whose real table has no lead byte would now be shown as uncertain.
