---
inclusion: always
---
# Product (Part 2) and guardrails (Part 7)

## Story
- Problem: archives, libraries, museums and people hold old disks full of files no current software opens; documentation is gone.
- Product: Format Necromancer recovers content from a dead file format using only the file's bytes. It studies samples, works out the structure, rebuilds the content (an image or table), shows evidence for every piece, proves the result against a trusted reference.
- Pitch: drop in a file nothing can open, watch the bytes resolve into the real thing, see which bytes and which rule produced every part.
- Differentiator: the reveal. Reaction to design for: "It worked that out from the bytes?"
- Audience: staff and volunteers at small archives, libraries, museums, and anyone with old disks. Never invent statistics; cite only sourced numbers.
- The claim, and no more: generic detectors (structure, repetition, palettes) carry no format name and no spec constants. A small labelled decoder per hypothesis family turns an inferred layout into pixels; disclose it is format-aware. Never claim it opens any old file; one held-out file never proves generality. Honest claim: recovered without using the specification, tested on a held-out file and on files with altered headers.
- Not building: many formats, accounts, a backend, live AI calls, a mobile app (web app must still work in a phone browser).
- Mood: spooky-elegant, never a cheap Halloween skin.
- Authorship line (say exactly this in README, UI footer, AUTHORSHIP.md): Created by Parth Radheshyam Laturiya. Direction, product decisions and review by the owner; code written by Kiro. Never claim more or less.
- Self-review as a judge scoring Potential Impact, Technological Implementation, Design, Innovation, Presentation. Name the one place a task would lose points.

## Guardrails: never
1. Never output recovered content without evidence and a confidence value. Failures are shown, not hidden.
2. Never put format names or spec constants in the inference layer. Decoders are small, labelled, disclosed. Format names live only in corpus metadata and demo config.
3. Never tune against the held-out blind-test file, never open it while writing detectors.
4. Never fake anything: no hard-coded outputs, canned results or mock verifier. Demo mode runs the real engine on bundled samples.
5. Never make a network or AI call at runtime. No analytics. Files never leave the browser. App stays free and open to judges until January 29, 2027.
6. Never add server code, a database, accounts or anything that could cost money. If a task seems to need one, stop and ask.
7. Never weaken a test, threshold or type to make something pass. If a test is wrong, say why and fix it in its own commit.
8. Never add a dependency without one line on why and its size cost.
9. Never build cut-list items (extra samples, background polish, optional explanation text, a second format) before the gates ahead have passed.
10. Never copy designs, code or assets from reference sites. No copyrighted music, fonts or images. Every sample has a source and license in corpus/manifest.json.
11. Never gitignore .kiro, never commit secrets, have a visible LICENSE by T-24.
12. Never claim in README, UI or write-up something the product does not do, or that another tool cannot do something you have not verified.
13. Never accept code written by hand or by another tool, and never edit or delete ledger lines.
14. Never say "verified" unless a command ran and you saw its output.

## Guardrails: always
1. Strict TypeScript, no errors, lint clean.
2. Commit before each task. Revert a bad result instead of re-prompting it.
3. Targeted edits only; no unrequested refactors or whole-file regeneration.
4. Run the tests yourself and report numbers.
5. Corrupted, truncated, empty or oversized input never crashes the engine: return an unrecovered result with a reason.
6. Respect reduced motion, keyboard navigation, contrast; every visual has a text equivalent.
7. End of each working session add three lines to docs/build-journal.md: what we did, credits used (blank), lesson, plus any moment Kiro surprised us.
8. Keep the D-10 budgets.
9. Finish every task by saying where it would lose points.
10. When this prompt conflicts with the repo or reality, say so and ask.
