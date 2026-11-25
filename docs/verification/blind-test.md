# T-12 Blind test: held-out file

Frozen commit: `dd7610fbae3d8489d5396dee6dede4ee3afe9af3`. `git status` was clean before the run.
Run by the verifier agent, which wrote none of the engine code. Nothing was tuned.

## Verdict
**EXACT.** The engine rebuilt the held-out picture, and every pixel equals the trusted decode (0 mismatches of 13,500 pixels).

## Hashes
| Item | sha256 |
|---|---|
| `corpus/heldout/heldout-01.pcx` (4019 bytes) | `05aef0a1686c37e1d3953241634f986fbd8f102db9dd6cd90e3a4bad51c2a547` (equals `corpus/manifest.json`) |
| `docs/verification/blind/heldout-recovered.png` | `33f00bcdb295d0742b280ab2acea2cd68e2f69720c7bab60f269facde8401e40` |
| `docs/verification/blind/heldout-reference.png` (Pillow 13.0.0) | `09b3147f34435d01a031eaf8b842b993087c87469ec90ef2e2c73cd8266fdfe2` |
| raw recovered RGB (temporary, deleted after compare) | `df17f0de92ef72df88c48140c0bf6ce7d2973845defaa366d582c982a32ccb3b` |

## Time order (local, 2026-11-25, IST)
1. Frozen state recorded (commit, clean tree, file hash equals manifest).
2. 16:57:07 to 16:57:09: pipeline run ONCE on the held-out file (`tests/blind/run.test.ts`, phase `recover`). Result and recovered PNG saved. No reference existed yet.
3. 16:57:14 to 16:57:15: only after step 2, Python 3 with Pillow 13.0.0 decoded the file (mode P, 150 x 90) to the reference PNG.
4. Compare run (phase `compare`) used `verify()` from `src/engine/verify.ts` on the saved recovered pixels against the reference.

## Result in numbers
| Measure | Value |
|---|---|
| Status | ok |
| Size | 150 x 90 |
| Rank-1 layout | header 128, run marker mask 0xC0 (192), box numbers 150, 90, row stride 150, table tail at 3250, length 769 |
| Confidence | 1 |
| Row status counts | 90 ok, 0 uncertain, 0 unexplained |
| Hypotheses | 12 (1 winner, 11 losers) |
| Loser reasons | all 11: "Lower confidence (0.4 against 1): no size numbers were found in its header." |
| Evidence | 8 from analysis, 90 from recovery (one per row) |
| Engine time | 17.7 ms |
| Compare | exact: true, mismatchCount 0, no mismatches listed |

Raw files: `docs/verification/blind/heldout-result.json`, `heldout-compare.json`.

## What this proves
- On one file the engine never saw during tuning, the whole path (analyze, recover, verify) gave a pixel-exact picture.
- The truth came from a different tool (Pillow), made after the recovery.

## What this does not prove
- It is one file. One pass says nothing about a rate.
- The held-out file comes from the same generator as the tuning set, so it is the same kind of file. This does not show the engine works on real-world files or other generators.
- The runner is throwaway (`tests/blind/`), outside `verify`. Pillow is the trusted truth only for what Pillow decodes.

No engine change was made after this run.
