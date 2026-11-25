# Experience spec S-03: requirements

Scope: the interface, T-13 to T-18. Engine API is fixed (S-01, S-02): `runPipeline`, `verify`, `buildEvidenceReport`, `encodePng`, `decodePng` in `src/engine/`. The UI never changes engine code. Source: steering design.md, demo.md, product.md; `docs/design-target.png`.

## Shell and states (T-13)
R-U1. The app shall be a static export with one main route `/` and real 404 and 500 pages. It shall show empty and loading states.
R-U2. The app shall load no remote resource: fonts self-hosted, no analytics, no third-party script. Zero requests to other origins.
R-U3. The layers L0 to L4 shall exist as named components, styled only with tokens from one tokens file that matches design.md.
R-U4. The footer shall show the authorship line, exactly as in product.md, and "Runs in your browser. Nothing is uploaded."

## Engine in a worker (T-13, T-14)
R-U5. The UI shall run the pipeline in a Web Worker, so animation never freezes during analysis.
R-U6. When a file is dropped or picked, the app shall accept up to 10 MB and refuse larger files with a plain message (F-02). It shall never upload the file.
R-U7. Bundled samples shall be served from `public/` as static files. A bundled sample's reference PNG shall be fetched only after recovery ends.

## Panels (T-14)
R-U8. The hex panel shall be virtualised so a 1 MB file scrolls smoothly. Each byte shall be coloured by state: explained, uncertain, unexplained.
R-U9. The recovered panel shall draw the real engine output on Canvas 2D, capped at 2x resolution.

## Evidence and inspector (T-15)
R-U10. When the user selects a recovered row or region, the app shall light its bytes in the hex panel, draw an SVG evidence line between them, and show the rule and confidence (F-07).
R-U11. When the user selects bytes, the app shall select the region they explain, or say "unexplained bytes".
R-U12. Every interaction shall work by keyboard, and each region shall have a text description of its rule and confidence.

## Ritual and demo mode (T-16)
R-U13. The ritual shall play six beats in order: Dead file, Listening, Hypotheses, Evidence, Resurrection, Proof (F-06). Losing hypotheses shall dim and show why they lost.
R-U14. Demo mode shall run the real engine on a bundled sample. The same sample shall play the same way every time (F-01).
R-U15. A speed control shall offer 0.5x to 4x.
R-U16. Under reduced motion, the app shall show the same information with no animation (F-09). Parallax shall be off.
R-U17. Motion shall use only transform and opacity, with easing, 300 to 900 ms per element. Text being read shall not move.

## HUD (T-17)
R-U18. The Confidence Grid shall show one dot per recovered row, coloured by status (accent, amber, dim, red), with hover and keyboard focus showing rule and confidence, and a text-list equivalent (F-10).
R-U19. Three hand-built SVG charts shall show per-row confidence, byte coverage, and mismatches against the reference. No chart library.
R-U20. The verification badge and report shall show exact or not, the mismatch count, or "no reference available" (F-05).
R-U21. The user shall be able to download the recovered image (PNG) and the evidence report (JSON). Nothing is sent anywhere.
R-U22. The held-out result shall be shown and labelled as the blind test (F-11).

## Honest failure (T-18)
R-U23. When the pipeline returns unrecovered, the app shall end in failure red with the reason in plain words, without a crash (F-08). A bundled corrupted sample shall show this.

## Budgets (D-10)
R-U24. Initial JS under 250 KB gzipped; bundled sample to visible result under 10 s on a mid-range laptop; Lighthouse performance 90 or more; 55 fps or better during the ritual.
