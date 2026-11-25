# Experience spec S-03: tasks

Agent for all: experience-designer. Screenshot checked against `docs/design-target.png`. One task per request.

- [ ] T-13 Tokens, app shell, layers L0 to L4 as skeletons, 404, 500, empty and loading states
  - tokens.css, layout, footer line, tiny worker proven under static export, bundle size measured
  - Requirements: R-U1 to R-U5; checklist R-08
- [ ] T-14 Hex panel (virtualised) and recovered panel
  - real engine output through the worker; file drop with 10 MB limit; public/samples build script
  - Requirements: R-U6 to R-U9
- [ ] T-15 Evidence lines (SVG) and the two-way inspector
  - Requirements: R-U10 to R-U12 (F-07)
- [ ] T-16 Six-beat ritual, speed control, reduced motion, deterministic demo mode
  - Requirements: R-U13 to R-U17 (F-01, F-06, F-09)
- [ ] T-17 HUD: Confidence Grid, three SVG charts, verification badge and report, downloads, blind-test label
  - Requirements: R-U18 to R-U22 (F-05, F-10, F-11)
- [ ] T-18 Honest-failure screen and the corrupt-sample flow
  - Requirements: R-U23 (F-08)

Out of scope: full e2e and accessibility audit (T-19, verifier), Three.js layer (T-20, optional), deploy (T-22).
Note: `src/engine/worker.ts` belongs to the engine-engineer. If T-13 needs it and it is missing, add a small engine item first.
Done for this spec: owner approves requirements.md, design.md, tasks.md.
