---
inclusion: manual
---
# Provenance (Part 9)

## 9.1 Authorship trail
- Public repo under the owner's account from the first commit, signed commits (D-13).
- AUTHORSHIP.md: owner's role (product direction, decisions, review, testing) and Kiro's role (all code); project creation date (after October 30, 2026); statement of no pre-existing code; every other AI app used, each marked "review only, no code copied".
- README and AUTHORSHIP.md carry the name Parth Radheshyam Laturiya, matching the Devpost profile and ID; LICENSE carries it once added (T-24).
- docs/build-journal.md updated every session.

## 9.2 Provenance Recorder (a script, zero credits)
`scripts/provenance/record.mjs` appends one JSON line to `docs/provenance/ledger.jsonl`: ISO timestamp, event, agent, task ID, short summary, git HEAD.
Hooks feed it. Create them by asking Kiro in chat, use the schema this Kiro version generates, and test that each fires: Prompt Submit (prompt text; redact anything that looks like a secret); Post Tool Use (tool name and file path only); File Create, File Save, File Delete (path and size change); Agent Stop (end of turn, git HEAD, result of last verify); Pre and Post Task Execution (spec task ID).
Kiro's file hooks fire only for changes the agent makes, not manual editor changes. That is the point: the ledger lists exactly what Kiro did. Ledger lines are append only.

## 9.3 `npm run provenance:check`
Compares git history with the ledger and lists any committed file change with no ledger entry as UNATTRIBUTED. Unattributed changes show as warnings in verify and are disclosed in AUTHORSHIP.md, never hidden. Owner rule: do not edit files by hand; ask Kiro.

## 9.4 Footage: three kinds, three sources
- Ledger shows what Kiro did (script).
- `npm run capture` uses Playwright to record video and screenshots of the golden run, saved to docs/provenance/captures/ at every Gate. Keep the folder small.
- Owner screen-records Kiro's own window each session (OS recorder or OBS). Raw files stay local, not committed. Owner uploads two or three short clips as unlisted videos and links them in AUTHORSHIP.md.
Nothing inside the app can film Kiro, and nothing in this project may claim it can.

## 9.5 Proof Room (stretch, F-13, T-23)
A `/proof` route rendering the committed ledger and captures as a read-only timeline: spec, tasks, commits, verification runs. No network. Build only after Gate 2.

## 9.6 Using other AI models
Kiro writes all code. Other AI apps may review. On request Kiro writes `docs/review-packets/NNN.md`: what changed, what it claims, test results, three questions. No secrets. Owner pastes the packet into another AI app and brings the critique back as a Task Card. The conductor judges each point on its merits, may reject with a reason, never applies critique blindly. AUTHORSHIP.md records what changed because of it.
