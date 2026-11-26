# Format Necromancer: 3-minute video script (v1)

Target length 2:50 (hard limit 3:00). About 380 spoken words at a calm pace.

## How we make it

| Part | Who | What |
|---|---|---|
| Voice | Owner | Record the lines below as ONE MP3 (or one MP3 per section, named `01.mp3` to `07.mp3`). Quiet room, phone 20 cm from your mouth, no music. Pause 1 second between sections. |
| Kiro footage | Owner | 25 s screen recording of Kiro (shot list in section 6). MP4 or MKV, 1080p if possible. |
| App footage | Kiro | Recorded from the live URL with Playwright, demo mode, 1440x900 and phone size. |
| Edit | Kiro | ffmpeg: cuts the app footage to your voice timing, adds captions burned in, exports `format-necromancer-demo.mp4` (1080p, H.264, under 3:00). |

Rules: no music with a copyright, captions on, every number on screen comes from a report in the repo, no claim the app does not make.

## The script

### 1. Hook (0:00 to 0:15)

ON SCREEN: The live site. A dim wall of hex bytes. File name `real-abuse-end.pcx, 49,047 bytes`.

SAY:
> This file is from a game made in the 1990s. Most programs today won't open it. No manual. No specification. Just bytes.
> Watch it come back from the dead.

### 2. Who and why (0:15 to 0:35)

ON SCREEN: The first screen, then the "Who it is for" line from the README.

SAY:
> Museums, archives and people with old disks find files like this every day. The program that made them is gone.
> There are about 104,000 museums in the world. Today, they guess which tool might open a file.
> Format Necromancer works it out from the bytes alone, in your browser. Nothing is uploaded.

### 3. The ritual, live (0:35 to 1:20)

ON SCREEN: Press **Resurrect a sample**. The six steps play at 1x: Dead file, Listening, Hypotheses, Evidence, Resurrection, Proof. The picture builds row by row. The Confidence Grid fills with green dots.

SAY (over the steps, about 8 s per step):
> First it listens. It looks for repeats, sizes and tables in the bytes.
> Then it makes guesses. Here, twelve possible layouts.
> It weighs the evidence for each one, and picks the best.
> Then it rebuilds the picture, row by row. Every green dot is one row it is sure of.
> And there it is. Real art from the game Abuse, back from 49,047 bytes.

### 4. Proof (1:20 to 1:55)

ON SCREEN: Click row 0. The bytes light up and a line joins them to the picture. The Row panel shows the rule and "Confidence 1.00". Then zoom on the Verification panel: **Exact match**, **0 of 64,000 pixels differ**.

SAY:
> Click any row. You see the exact bytes that made it, the rule it used, and how sure it is.
> Then it checks itself against a trusted decoder.
> Zero of 64,000 pixels differ. An exact match.
> It also rebuilt a blind test file it had never seen, and five real game files. All exact.

ON SCREEN (small text, 3 s): `5 of 5 real CC0 files exact · blind test exact · docs/verification/`

### 5. Honest failure (1:55 to 2:15)

ON SCREEN: Choose sample **corrupt-tail-cut**. It ends in red: **No picture was rebuilt**, with the reason and the guesses it found.

SAY:
> Now a broken file. The end is cut off.
> It does not make up a picture. It says what went wrong, in plain words, and shows what it found before it failed.
> When it can't be sure, it tells you.

### 6. How Kiro built it (2:15 to 2:45)

ON SCREEN: The owner's Kiro footage (25 s), in this order:
1. The `.kiro` folder open: `specs/` (engine, recovery, experience), `steering/` (7 files), `agents/` (engine-engineer, verifier). About 6 s.
2. One spec's `requirements.md` scrolling (EARS lines). About 5 s.
3. Kiro Crew: the conductor board with work items, then a worker session. About 6 s.
4. A terminal running `npm run verify` and the green result, or the GitHub Actions green check. About 5 s.
5. `docs/provenance/ledger.jsonl` open. About 3 s.

SAY:
> I'm a student. I gave the direction and made the decisions. Kiro wrote every line of code.
> Three specs, seven steering files, and two custom agents: one builds, one checks, and the checker may not touch the code.
> Kiro Crew split the work into tasks and sent each one to its own session. Property tests ran thousands of broken files through it. Zero crashes.
> Every task is logged.

### 7. Close (2:45 to 2:55)

ON SCREEN: The finished screen with the real art, then the URL in large text: `format-necromancer.vercel.app`.

SAY:
> Format Necromancer. Dead files, back to life, with proof.
> Try it yourself, at the link below.

## Checks before we export

- Every spoken number is in a report: 104,000 museums (UNESCO, README), 49,047 bytes and 0 of 64,000 (live app), 5 of 5 real files (wild-test.md), blind test exact (blind-test.md), 3,002 fuzz cases with 0 crashes (robustness-report.md).
- "Most programs today won't open it": keep it soft. Do not say "nothing can open it". Pillow can, and we use it as the reference.
- "Twelve possible layouts": check the live run says "Hypothesis 1 of 12" for real-abuse-end on the day we record.
- Hooks: do not show or claim a Kiro hook firing. They could not be enabled in this Kiro version (AUTHORSHIP.md).
- Length: under 3:00 after the edit. If the voice runs long, cut the last sentence of section 4 first.
