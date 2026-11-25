# Experience spec S-03: design

Target: `docs/design-target.png` (composition, hierarchy, depth, Confidence Grid; not pixel for pixel). Tokens and motion rules: `.kiro/steering/design.md`.

## Screen (desktop)
- Top bar: logo and title, file line ("sample-07, 4,812 bytes, format unknown"), six-beat step timeline, speed control.
- Left (L1): Bytes panel. Offsets, hex grid, the current hypothesis label, legend (explained, uncertain, unexplained).
- Middle (L2): Recovered image panel, progress ("Rows rebuilt 18 of 28"), and below it the inspector card (region, rule, byte range, confidence).
- Right (L4 HUD): Confidence grid, Confidence by row chart, Verification card. Coverage bar and mismatch sparkline sit in the Verification card.
- L3: SVG evidence lines from selected bytes to the selected rows.
- L0: faint drifting bytes on Canvas 2D behind everything.
- Footer: "Runs in your browser. Nothing is uploaded." and the authorship line.
Phone: one column, in the order Bytes, Image, Inspector, HUD. Evidence lines become a highlight only (no cross-panel lines).

## Files (experience-designer writes only these)
- `src/app/`: `page.tsx`, `layout.tsx`, `not-found.tsx`, `error.tsx`, `global-error.tsx`.
- `src/ui/tokens.css` (all tokens), `src/ui/layers/` (L0 to L4), `src/ui/panels/` (HexPanel, ImagePanel, Inspector), `src/ui/hud/` (ConfidenceGrid, charts, Verification), `src/ui/ritual/` (beat state machine, speed), `src/ui/worker/` (client for the engine worker).
- `src/engine/worker.ts` exists in the engine layout; if missing, the experience task stops and asks (boundary rule).
- `public/samples/`: copies of bundled samples, one corrupted copy, the blind-test file and its reference, made by a build script, not by hand.
- Tests: unit tests beside UI files; e2e in `tests/e2e/` (written by the verifier at T-19).

## State
One reducer: `idle -> loading -> analysing -> ritual(beat 1..6) -> done | failed`. The worker posts the full `PipelineResult` once. The ritual then plays from that result. It never waits on the engine between beats, so beats are deterministic.

## Ritual timing (at 1x)
| Beat | Shows | Time |
|---|---|---|
| 1 Dead file | dim grey bytes | 0.8 s |
| 2 Listening | scan sweep, detectors pulse | 1.5 s |
| 3 Hypotheses | 2 to 3 ranked cards; losers dim with reason | 2.5 s |
| 4 Evidence | lines draw from rows to bytes | 1.5 s |
| 5 Resurrection | rows assemble grey to accent; grid lights | 3 to 6 s (scales with row count) |
| 6 Proof | badge lands, report opens, charts draw | 1.5 s |
Speed divides all times. Reduced motion jumps to the end state of each beat, with a "Next beat" button.

## Hex panel
Virtualised rows of 16 bytes; only visible rows render. Byte state comes from evidence ranges (merged once into an interval index). Selecting a byte range uses the same index.

## Accessibility
Every panel is a landmark with a heading. Grid dots and rows are buttons with labels like "Row 7, run rule, confidence 0.96". Focus moves the inspector. Contrast meets WCAG AA with the tokens.

## Security headers
Already in `vercel.json` (T-01). CSP stays `connect-src 'self'`. Workers load from `'self'` (`worker-src 'self' blob:` only if the bundler needs it; record any relaxation in docs/security.md).

## Risks
- Bundle budget with React plus Next: measure at T-13, before panels are added.
- Worker loading under a static export: prove it with a tiny worker in T-13.
- Canvas text never used for evidence; text stays in the DOM.
