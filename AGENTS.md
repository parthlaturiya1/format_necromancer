---
title: Format Necromancer agent guide
inclusion: always
---
# AGENTS.md: Format Necromancer (Kiroween 2026, Resurrection)

Browser-only app that recovers a dead file format (PCX) from bytes alone, shows evidence per element, verifies against a reference. Owner: Parth Radheshyam Laturiya. Steering lives in `.kiro/steering/`. Roadmap: `.kiro/steering/roadmap.md`.

## Roster (Part 4)
| Agent | Mission | May write | Must not touch | Done when |
|---|---|---|---|---|
| conductor (main Kiro session, not a custom agent) | Plan within a task, integrate, ask, keep docs current | AGENTS.md, .kiro/, docs/, config, scripts, CI; any file during an integration task the Task Card names | Detector logic and UI components, unless the Task Card says integration | Task Card satisfied and verifier says PASS |
| engine-engineer | Build and tune analyzer, recoverer, verifier | src/engine/, tests/engine/, tests/property/**, corpus tooling | src/ui/, src/app/ | Targeted tests green, golden corpus no worse |
| experience-designer | Build interface, motion, tokens | src/ui/, src/app/, styles, public/**, unit tests beside UI files | src/engine/** | Screenshot checked, accessibility and e2e green |
| verifier | Check every diff and the whole product independently | New tests under tests/, tests/e2e/, docs/verification/**, docs/feature-register.md | src/** (reports problems, never fixes) | Returns PASS or FAIL with evidence, per feature |
| provenance recorder (script and hooks, not an agent) | Log what Kiro did, zero credits | docs/provenance/ledger.jsonl, append only | Everything else | Each hook event adds one line |

Custom agents live in `.kiro/agents/` (engine-engineer, verifier; experience-designer only if on schedule).

## Rules for agents
- One agent per task. The Task Card names it. Two agents never edit the same file in one task.
- A change across a boundary: stop and ask the owner.
- First action: read AGENTS.md, the steering file for your area, and the Task Card's files. Cite file paths for every claim about the repo. Write NOT FOUND instead of guessing.
- Strongest model for conductor, engine-engineer, verifier; cheaper for mechanical edits. Run the verifier on a different model family from the engine-engineer if available.
- The verifier has no permission to write under src/.

## Ask protocol (Part 0, rule 3)
Ask the owner before proceeding when: a request is ambiguous in a way that would change more than one file; two instructions conflict; a guardrail would be broken; you want to add a dependency, a route, server code or anything that could cost money; you need to change a test you did not write; the same check has failed three times. Format: at most three numbered questions, multiple choice, each with your recommended default and what changes if the owner picks differently. Then stop and wait. If not blocked, do not ask: state your assumption in one line and continue. Never ask what this prompt or the repo already answers.

## Operating rules (Part 0)
1. Locked decisions D-01 to D-15 are final (tech.md). If one blocks you, ask.
2. Never guess. Unknown library, API, Kiro feature or format fact: write UNKNOWN, then look it up or ask.
4. One task per request. Name the task ID, do only that, stop.
5. No outside code. You write all code. Pasted code from another tool is not committed: ask if it is a reference, then write your own.
6. Reply format: Changed (files). Verified (what ran and passed, in numbers). Not verified. Next. Weakest point. Never write that nothing can go wrong.
7. Stalls: do not re-read a file already read this task. Targeted tests while working, full verify once per task. Tool fails twice the same way: stop and report the error text. Three failed repair loops: stop and ask.
8. Public repo: never write secrets or personal details into .kiro, docs, prompts or the ledger.

## Task Card format
```
TASK: T-xx
AGENT: <name>
READ FIRST: <files>
DO: <one sentence>
DONE WHEN: <from the roadmap>
DO NOT: <anything off limits>
```

## B. Session start
Read AGENTS.md. Run git status and show the last 5 commits. Read docs/feature-register.md and docs/verification/latest.md. In five lines tell the owner: the last finished task, the next task on the roadmap, anything failing, any question. Then stop and wait for a Task Card.

## C. Session end
Run `npm run verify` once. Append three lines to docs/build-journal.md (what we did, credits used left blank, lesson). Confirm the ledger has today's entries. Commit. Reply in five lines: done, verified, not verified, next task, weakest point.

## D. Tripwires and efficiency
1. Before installing a package run `npm view <name> version`. State why and its size cost, pin the exact version. Never install a package you only remember by name.
2. Before using a config key, API or flag you are not certain of, find it in installed type definitions or official docs, or write a ten-line test. Otherwise write UNKNOWN.
3. Before saying a command passed, it must have run in this task and you must have seen the result.
4. Before editing a file, check it is on your agent's write list.
5. Before finishing, `git diff --stat` must match the Task Card, no unrelated files.
6. If you cannot proceed, write BLOCKED, the specific reason and one question. Never send an empty reply, filler or a made-up result.
7. Plan in five lines or fewer, then act. Read only the READ FIRST files and what your plan names. Batch related edits, run the smallest test that proves the change, then verify once. Do not print file contents back. Keep replies to the Part 0 format.
