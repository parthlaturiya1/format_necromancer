---
inclusion: fileMatch
fileMatchPattern: ["src/ui/**", "src/app/**", "**/*.css"]
---
# Design (Part 6). Take principles; never copy layouts, code or assets.

## References
| Reference | Take | Leave |
|---|---|---|
| Kaitai Struct WebIDE (most important; github.com/kaitai-io/kaitai_struct_webide/wiki/Features) | Click a field in the tree and its bytes highlight in the hex view, and the reverse. A panel reads selected bytes as integers, floats, text. | Its plain look. It needs a person to write the format description; ours infers it. |
| pytai (pypi.org/project/pytai-hex) | Right-click bytes to locate the structure they belong to. | Desktop styling. |
| Awwwards 3D list (look only) | Depth, large confident type, motion at chosen moments. | Slow loads, scroll-jacking, anything hiding the evidence. |
| Awwwards 2026 sites (Bruno Simon, EverSwap, OceanX 2025, Agrumea Farm) | Optional: depth and pacing. | Branding and assets. |
| Byte-plot images (hilbert curve byte plot) | Whole file as a small texture; explained regions glow, unexplained stay dark; HUD minimap. | Security-research styling. |
| Dark glass dashboards | Translucent panels, 1 px borders, soft blur, one accent colour. | Neon overload, rainbow gradients. |
Owner liked: dark glass dashboards with translucent layered panels; a compact dot-grid panel on the right (our Confidence Grid); modernized charts. Design target: `docs/design-target.png` (original mock). Attach it in Kiro chat for interface work. Target for composition, hierarchy, depth and the Confidence Grid, not pixel for pixel. Other sites' screenshots stay off the repo.

## Layers
- L0: faint drifting bytes (Canvas 2D; lazy Three.js depth field at T-20 if D-04 passes), slowest parallax.
- L1: hex panel. L2: recovered content panel, soft glass with depth. L3: SVG evidence lines linking L1 and L2.
- L4: HUD: Confidence Grid right, confidence meter, step timeline, verification badge, byte-plot minimap.
Depth from scale, blur, opacity, not clutter. Pointer parallax subtle, capped at a few pixels, off under reduced motion.

## Confidence Grid (HUD, right)
Compact dot matrix, one dot per recovered row or region. Accent = steady, amber = uncertain, dim = unexplained, red = failed. Hover shows rule and confidence; click jumps to bytes. Dots light in sequence during beat 5. Keyboard reachable, with a text-list equivalent.

## Charts
Hand-built SVG, no chart library. 1.5 px lines, area fills fading from accent to transparent, soft glow on the line, three faint grid lines, no borders, tabular numerals, direct labels not legends, tooltips on hover and keyboard focus, draw-in at beat 6 only. Build three: per-row confidence (area), byte coverage (segmented bar: explained, uncertain, unexplained), mismatches against reference (sparkline that should sit flat at zero).

## Tokens (defined once in design.md; no ad-hoc styling elsewhere)
Large type, generous spacing, one focal point per moment.
| Token | Value |
|---|---|
| bg-0 / bg-1 | #05060A / #0B0D14 |
| glass fill / border | rgba(255,255,255,0.04) / rgba(255,255,255,0.08), blur 18px |
| text / muted | #E8ECF4 / #8A93A6 |
| accent (recovered, confident) | #6EF3C5 |
| uncertain | #FFB454 |
| failure (failure only) | #FF5C6C |
| Typefaces | Inter and JetBrains Mono, self-hosted |

## Six motion beats (motion appears only at these)
1. Dead file: bytes dim and grey; reads as unreadable.
2. Listening: a scan sweeps the bytes while detectors pulse.
3. Hypotheses: two or three competing layout guesses as ranked cards with live confidence. As detectors reject wrong ones, each card dims and shows why it lost. Hovering a card lights its byte ranges.
4. Evidence: SVG lines draw from regions to the bytes behind them.
5. Resurrection: content assembles row by row from the bytes, grey to accent; Confidence Grid lights in sequence.
6. Proof: verification badge lands, report opens, charts draw in.
High confidence glows steadily, uncertain content flickers amber, unexplained bytes stay dim.

## Motion quality
Animate transform and opacity only. Easing, never linear. 300 to 900 ms per element. Text never moves while being read. Pause L0 when tab hidden. Cap canvas resolution at 2x. Speed control 0.5x to 4x; reduced-motion mode shows the same information without animation.

## Accessibility
Keyboard navigation for every interaction, readable contrast, a text equivalent for every visual (each recovered region has a text description of its rule and confidence).

Signature screenshot: hex bytes left, recovered content right, glowing evidence lines between, Confidence Grid at the right edge.
