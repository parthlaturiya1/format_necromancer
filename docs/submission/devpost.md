# Devpost write-up: Format Necromancer (draft v1, T-26)

Status: DRAFT for the owner. Paste each section into the matching Devpost field. Lines marked **OWNER CHECK** need your answer or a fact only you know. Every number links to a report in the repo.

Note: the official rules page (kiroween.devpost.com/rules) returned 403 to our fetch on 2026-11-26. The Kiro questions below follow the 2025 list (vibe coding, hooks, specs, steering, MCP) plus the 2026 additions we know of (Kiro Crew, custom agents, Powers). **OWNER CHECK:** open the submission form and match each answer to its exact question. Add any question we missed.

## Basics

| Field | Value |
|---|---|
| Project name | Format Necromancer |
| Tagline (under 60 chars) | Recovers a dead file from its bytes alone. |
| Category | Resurrection |
| Live app | https://format-necromancer.vercel.app |
| Repo | https://github.com/parthlaturiya1/format_necromancer (public, `.kiro/` committed, MIT) |
| Video | **OWNER CHECK:** YouTube or Vimeo link, public, under 3:00 |
| Built with | typescript, react, next.js, web-workers, canvas, vitest, fast-check, playwright, axe-core, vercel, github-actions, kiro |
| Student entry | **OWNER CHECK:** LinkedIn, student email, year, degree, school |

## Inspiration

Old files outlive the programs that wrote them. Small museums, archives and people with old disks find picture files that nothing on their computer opens, and the documentation is gone. Today they guess which tool might work. We wanted a tool that works out the layout from the bytes, shows its evidence for every part, and says plainly when it cannot be sure.

## What it does

You drop in a file (or press **Resurrect a sample**). In six steps (Dead file, Listening, Hypotheses, Evidence, Resurrection, Proof) the app:

1. Reads the bytes and looks for structure: a header block, size numbers, repeat runs, a palette, row stride.
2. Builds several layout guesses and scores each one on its evidence.
3. Rebuilds the picture row by row from the best guess.
4. Lets you click any row or byte to see which bytes made it, the rule used and a confidence value.
5. Checks the result against a trusted decoder when a reference exists, and reports mismatching pixels.
6. When a file is too damaged, shows no picture and says why, with the guesses it found before it failed.

Everything runs in your browser. Nothing is uploaded.

The default sample is real CC0 art from the 1990s game Abuse (Crack dot Com, via OpenGameArt): 49,047 bytes rebuilt with 0 of 64,000 pixels different.

## Results (all measured, all in the repo)

| Check | Result | Report |
|---|---|---|
| Real files, 5 | 5 of 5 exact against Pillow 13.0.0. CC0 Abuse files, run once each, no tuning. | `docs/verification/wild-test.md` |
| Blind test, 1 held-out file | Exact, 0 of 13,500 pixels differ | `docs/verification/blind-test.md` |
| Mutated files, 297 | 0 wrong at confidence 0.9 or more | `docs/verification/robustness-report.md` |
| Fuzz, 3,002 cases | 0 crashes, slowest 40 ms | `docs/verification/robustness-report.md` |
| Large file | A valid 10.4 MB file rebuilt exact in 1,591 ms | `docs/verification/t21d-large-files.md` |
| CI | `npm run verify` green on GitHub Actions | [Actions](https://github.com/parthlaturiya1/format_necromancer/actions) |

The honest claim: the detectors are generic and carry no format name. A small, labelled decoder per layout family turns the inferred layout into pixels, and it knows that family's shape. One format is covered today: PCX images. The app does not claim to open any old file.

## How we built it

I'm a student and built this solo. I gave the direction, made the decisions and reviewed the work. Kiro wrote every line of code. The repo started empty on 2026-11-25. There are 63 commits, all signed from `c354ac9` on.

The stack: TypeScript strict, Next.js static export, React, Web Workers for the engine, Canvas for the picture, Vitest and fast-check for unit and property tests, Playwright with axe for end-to-end and accessibility tests, Vercel hosting and GitHub Actions CI.

One command, `npm run verify`, runs the whole gate in order: typecheck, lint, unit tests, property tests, corpus regression, build, end-to-end tests, speed budgets, security checks and the provenance check. It writes `docs/verification/latest.md`.

## How we used Kiro

### Spec-driven development

We wrote three specs in `.kiro/specs/`: `engine`, `recovery` and `experience`. Each has requirements in EARS form, a design and a task list. The engine spec came first, and it was written before any engine code. The tests and the sample corpus came before the engine too, so every later task had a pass or fail from the start.

Compared with vibe coding: the spec made Kiro stop and ask when a requirement was unclear, instead of guessing. One example is what counts as "truth" for a damaged file. We decided it in writing (ruling R-X3): a changed file is judged against Pillow's decode of that same changed file. Without it, the tests would have rewarded guessing.

### Steering

There are seven steering files in `.kiro/steering/` (product, tech, design, testing, provenance, demo, roadmap), plus `AGENTS.md`. Three load on every request. The rest load by file match or on demand. The rule that mattered most was "never claim in README, UI or write-up something the product does not do". It kept every number tied to a report. A reviewer later caught the README contradicting itself, and the rule told Kiro to fix the claim, not the number.

### Custom agents

There are two custom agents in `.kiro/agents/`:
- `engine-engineer` builds and tunes the analyzer, recoverer and verifier. It may not touch the UI.
- `verifier` checks every change and the whole product. It may not write under `src/`, so it reports problems and never fixes them.

Keeping the checker from editing the code it checks was the best decision we made. In T-19 the verifier planted a UI break on purpose, and the golden-run test caught it on the first try.

### Kiro Crew

A conductor session split the roadmap into work items. Each item went to its own worker session, with one acceptance condition per item. Fresh reviewer sessions, which had not seen the code, scored the design (reviews R-1 to R-5) and the whole entry as Kiroween judges would (J-1, J-2). A reviewer caught a bug no test did: the text said "a 128-byte header" while the hex view showed those bytes in grey.

### Kiro IDE

Two tasks were done in the Kiro IDE: T-11b (a guard that detects changed detector settings) and T-21a (a security self-review, `docs/security.md`).

### Agent hooks

We planned hooks to log every Kiro action. In this Kiro version every hook stayed "(disabled)", even ones made in the IDE's own form, and no hook firing was ever seen. We did not hide that. A script (`scripts/provenance/record.mjs`) appends one line per task to `docs/provenance/ledger.jsonl`. `npm run provenance:check` lists committed changes with no ledger line as `UNATTRIBUTED`, and the count is published in `latest.md`. The full story is in `AUTHORSHIP.md`.

### MCP

**OWNER CHECK:** the plan named Playwright MCP for screenshots. We found no record that an MCP server was used in this build. If none was, say so: "No MCP server was used. Screenshots and accessibility checks ran through Playwright tests instead." Do not claim MCP use without a record.

### Kiro Powers

**OWNER CHECK:** we have no record that a Power was used. If none was, say so plainly.

### Property-based testing

fast-check drove 3,002 random and broken inputs through the engine, with 0 crashes. Property tests also check that evidence ranges stay inside the file, and that the same input always gives the same output.

## Challenges we ran into

- **A safety limit that was a bug.** A work limit meant to stop attack files also refused valid files over about 0.5 to 1 MB. We made the limit scale with the file. Now a valid 10.4 MB file is rebuilt exactly, and nine 10 MB attack files still stop with a reason.
- **The signature byte.** Changing a PCX file's first byte makes standard decoders refuse it, so there was no trusted answer. We ruled that those files are checked against the original reference. The engine still recovers them exactly.
- **CI only failed on GitHub.** Several end-to-end tests counted elements once, before the page had drawn them. They passed on a fast laptop and failed on a 2-core runner. We changed them to wait for the page, without raising any limit. We also made every failing step print a public error line, so a failure can be read without signing in.
- **Hooks never fired.** See above. We disclosed it and built a script-based ledger.

## Accomplishments we're proud of

- 5 of 5 real 1990s game files rebuilt exact, on the first run, with no tuning.
- The app refuses to guess. A cut file gets no picture and a plain reason.
- Every claim in the README links to a report in the repo.

## What we learned

- Write the checks first. A gate that exists before the code gives every task a clear pass or fail.
- Try to break your own gate. A gate that cannot fail proves nothing.
- A reviewer who has not seen the code catches what the builder stops seeing.
- Decide what "truth" means before you measure.

## What's next

- More layout families (1-bit, 4-bit, 24-bit and multi-plane pictures), each with its own blind test.
- More real files from more sources, so results can become a rate, not five examples.
- A second dead format, using the same evidence-first method.

## Limits (keep this section)

The blind-test file comes from the same generator as the tuning files. The five real files come from one game and one export tool, all in the one family the engine targets. Five files are not a rate. The engine has not been tested on damaged real files. Frame rate depends on host memory and was not measured on a real phone GPU.
