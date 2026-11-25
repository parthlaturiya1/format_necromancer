# T-13 verification: design tokens, app shell, states, worker

Run 2026-11-25, Chromium via Playwright against the built `out/`. Tests: `tests/e2e/shell.spec.ts` (6 tests) plus the existing smoke test. 7 of 7 pass.

## Results
| Check | Result |
|---|---|
| Shell renders (top bar, Bytes L1, Recovered image L2 + inspector, HUD L4, L0 canvas, L3 SVG, footer) | pass |
| Footer lines exact (R-U4) | pass (asserted in test) |
| States reachable (R-08): empty (default), loading (`/#loading`), 404 (`/404.html`, from `not-found.tsx`), 500 (`/#crash` renders `error.tsx`) | pass. `global-error.tsx` is built and styled but not triggered in a test |
| Engine worker under static export | pass: `new Worker(new URL('../../engine/worker.ts', import.meta.url), { type: 'module' })` ran a `run` on a 64-byte buffer and replied `result`. Indicator: hidden `<output data-engine-status="ready">` |
| Same check under the real CSP from `vercel.json` (ad-hoc server with those headers, not committed) | status ready, 0 console errors, 0 other-origin requests. The worker file is served from `'self'`. No CSP change, so `docs/security.md` is unchanged |
| Console errors / other-origin requests | 0 / 0 |
| Initial JS, gzipped (every .js response on the landing page, measured in the test) | 84,438 bytes = 82.5 KB. Budget 250 KB |
| axe-core 4.14.1: desktop 1440x900, phone 390x844, 404 page | 0 violations each |
| Phone: one column, no horizontal scroll | pass |
| Fonts | Inter and JetBrains Mono, variable woff2, latin subset, in `public/fonts/` with OFL licences and `SOURCES.txt`. No Google Fonts link |

## Choices
- New dev dependency: `axe-core@4.14.1` (exact, dev only, 3.4 MB unpacked, never shipped). Needed for the axe check; the test injects it from `node_modules`.
- Fonts came from the npm packages `@fontsource-variable/*` 5.3.0 via `npm pack` (not installed), because they carry the official woff2 files and the OFL licence.
- All colours live in `src/ui/tokens.css`. Other CSS uses `var(--name)` and `color-mix()` of those. "Unexplained" is a derived value (muted at 38%): design.md names it but gives no value.
- Placeholder hex bytes are decorative (seeded, `aria-hidden`), with a screen-reader sentence saying so.
- L0: Canvas 2D, about 30 fps, paused when the tab is hidden, one static frame under reduced motion, DPR capped at 2. Frame rate not measured.

## Screens
`docs/verification/screens/t13-desktop.png` (1440x900) and `t13-phone.png` (390 wide, full page). Regenerate with `SHOTS=1 npx playwright test shell`.

## Top 5 visual gaps against `docs/design-target.png`
1. **No evidence on screen.** The target has green and amber byte ranges, glowing curved lines from bytes to the image (L3) and a lit selected region. The shell is the dead-file state: grey bytes, empty L3. Arrives at T-15 and T-16.
2. **The image panel shows a grey ghost outline, not a recovered image.** The target has a bright mint ghost mid-assembly. Mine is deliberately dim and carries the empty-state headline.
3. **The HUD is hollow.** The target dot grid has lit mint and amber dots, a ringed selection, and a mint area chart with glow. Mine has empty rings and a dashed flat line. The Verification card has no badge or filled bar.
4. **The timeline has no active step.** The target has a glowing ring on "Resurrection", filled mint dots for finished steps and mint label text. Mine has six equal hollow dots.
5. **Type scale and hex density.** The target bytes are brighter and tighter, and its title is larger. Mine spread across the full panel width at low contrast, and "Format Necromancer" is 22 px.

## Not verified
- Frame rate, Lighthouse score, and the 10 s sample-to-result time (no samples yet).
- `global-error.tsx` rendering. Real devices, Safari, Firefox.
- Hover, focus and keyboard behaviour of future panels (not built).
- The visual review of the screenshots is left to a separate reviewer.

## Weakest point
The shell is clean but quiet. None of the signature visuals (evidence lines, lit grid, mint image) exist yet, so the first impression depends on T-14 to T-17.
