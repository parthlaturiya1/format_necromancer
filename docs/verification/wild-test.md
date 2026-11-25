# W-1 Real-world PCX files: blind run

Frozen commit: `6efddfb7f9509e9461372782b34564bfa97902f1`. The engine ran from a clean `git worktree` of that commit (`git status` clean, no diff in `src/`). The main tree had other workers' uncommitted edits in `src/engine/`, so it was not used.
Run by the engine-engineer role. **No engine change was made for or after this run.** No detector, threshold or config was touched.

## Verdict
**5 of 5 files were rebuilt pixel-exact** (0 mismatches each), run once each with the default config.
Be careful with this: all five are 8-bit palette PCX with run-length coding, the family the engine targets. They come from one source (one game, one export tool). No file outside that family was found with a clear licence, so none was tested.

## Source and licence (same for all five)
| Item | Value |
|---|---|
| Page | https://opengameart.org/content/abuse-art |
| Download | https://opengameart.org/sites/default/files/abuse_images.zip (2,405,605 bytes, sha256 `d3369b11e6f6475c1ec2025872204251336e14b499fe791419fc0d1f2ed39138`) |
| Author | Exported by Clint Bellanger (OpenGameArt user `clint-bellanger`, posted 2010-06-18). The art is from the game Abuse (Crack dot Com). |
| Licence | CC0 1.0 Universal, https://creativecommons.org/publicdomain/zero/1.0/ . The page lists it in its License(s) field. The page text also says the Abuse art was released into the public domain. |
| Retrieved | 2026-11-25 |

Not checked: the page's claim itself. I did not verify Crack dot Com's original release, only what the page states. The zip holds 1,122 PCX files, all 8-bit, 1 plane, RLE. Five were picked by size and variety before any run. No file was picked after a result.
The download was done once at build time. The run used no network.

## Files and results
| id | Source file in zip | Bytes | sha256 | Size | Result | Confidence | Rows ok / uncertain / unexplained | Mismatches | Engine ms |
|---|---|---|---|---|---|---|---|---|---|
| `ant-ant` | `ant/ANT.PCX` | 3689 | `a441fb3a...c10fc` | 320 x 200 | exact | 1 | 200 / 0 / 0 | 0 | 25.0 |
| `exp1-fire0005` | `exp1/FIRE0005.PCX` | 5212 | `1ffc7bb1...6663` | 320 x 200 | exact | 1 | 200 / 0 / 0 | 0 | 20.1 |
| `consfnt-fnt5x7` | `consfnt/FNT5X7.PCX` | 5566 | `8db997d0...0539` | 160 x 56 | exact | 1 | 56 / 0 / 0 | 0 | 13.8 |
| `endgame-end` | `endgame/END.PCX` | 49047 | `ec00b4b7...ec90` | 320 x 200 | exact | 1 | 200 / 0 / 0 | 0 | 47.3 |
| `credit-credit` | `credit/CREDIT.PCX` | 83207 | `7d4f8444...710a` | 320 x 200 | exact | 1 | 200 / 0 / 0 | 0 | 54.4 |

Kind of every file: 8-bit palette, 1 plane, RLE. Inside the tuned family. Full hashes: `corpus/wild/manifest.json`. Each file gets 12 hypotheses; rank 1 in all five: header 128, run marker mask 192, box numbers equal to the true size, row stride equal to the width, table tail of 769 bytes at the end. Per-file output: `docs/verification/wild/*-result.json`, `*-compare.json`, `*-recovered.png`, `*-reference.png`.

## Time order (local, 2026-11-25, IST)
1. Frozen state recorded (commit, clean worktree, manifest hashes).
2. 20:00:19 to 20:00:21: pipeline run ONCE per file (`tests/wild/run.test.ts`, phase `recover`). Results and recovered PNGs saved. No reference existed yet. (An earlier launch at 19:59:52 crashed while reading the manifest, before the engine ran on any file. It was a byte-order-mark bug in the runner.)
3. 20:00:27: only after step 2, Python with Pillow 13.0.0 decoded each file (mode P) to the reference PNG.
4. Compare phase used `verify()` from `src/engine/verify.ts`. The first compare launch failed on a missing environment variable and a deleted temp file. The runner's compare phase was changed to read the saved recovered PNG instead. The engine was not run again.

## What this proves
- On five real files made by someone else, with no tuning, the engine's output equals Pillow's decode in every pixel.
- The truth came from a different tool, made after the recovery.

## What this does not prove
- It is not a rate. Five files from one game is a small, narrow sample.
- All files are the targeted family. This says nothing about 24-bit, 1-bit, 4-bit or multi-plane PCX, or damaged files.
- Compare reads the recovered PNG written by the engine's own PNG encoder, then decodes it with the engine's PNG decoder. A fault there that cancels out would be missed. Pillow's decode of the original was the independent part.
- Pillow is the truth only for what Pillow decodes.
- Other candidates were not used because their rights were unclear (test images in Pillow and in `kryptan/pcx` carry the project licence, not a stated licence for each image). Wikimedia Commons search returned no PCX files.

## Reproduce
Download the zip above, extract the five files, compare sha256 with `corpus/wild/manifest.json`. Then run `tests/wild/run.test.ts` from a clean checkout of `6efddfb` with `WILD_CORPUS`, `WILD_OUT` and `WILD_PHASE=recover`, make the Pillow PNGs, then `WILD_PHASE=compare`. The runner is outside `verify`.
