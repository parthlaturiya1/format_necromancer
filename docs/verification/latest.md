# Verification

Overall: **PASS**
Run: 2026-11-25T11:04:39.688Z, Node v26.13.1

| Step | Result |
|---|---|
| 1 Typecheck | PASS (2.0s) |
| 2 Lint | PASS (2.8s) |
| 3 Unit tests | PASS (1.9s) |
| 4 Property tests | PASS (2.3s) |
| 5 Golden corpus | PASS (1.1s) |
| 6 Build | PASS (4.8s) |
| 7 Playwright e2e | PASS (2.7s) |
| 8 Budgets | PASS (stub, 0.0s) |
| 9a Audit (high/critical) | PASS (1.4s) |
| 9b Secret scan | PASS (0.2s) |
| 10 provenance:check | PASS (0.3s) |

## Provenance warnings (126)

- UNATTRIBUTED 88c3471 docs/verification/latest.md
- UNATTRIBUTED 88c3471 scripts/golden/recover-baseline.json
- UNATTRIBUTED 88c3471 scripts/verify.mjs
- UNATTRIBUTED 88c3471 src/engine/config.ts
- UNATTRIBUTED 88c3471 src/engine/decoders/run-length-rows.ts
- UNATTRIBUTED 88c3471 src/engine/pipeline.ts
- UNATTRIBUTED 88c3471 src/engine/png.ts
- UNATTRIBUTED 88c3471 src/engine/recover.ts
- UNATTRIBUTED 88c3471 src/engine/trial-decode.ts
- UNATTRIBUTED 88c3471 tests/engine/golden-report.test.ts
- UNATTRIBUTED 88c3471 tests/engine/helpers/node-inflate.ts
- UNATTRIBUTED 88c3471 tests/engine/png.test.ts
- UNATTRIBUTED 88c3471 tests/engine/recover.test.ts
- UNATTRIBUTED 88c3471 tests/property/recover.test.ts
- UNATTRIBUTED 3fd25e9 .kiro/specs/recovery/design.md
- UNATTRIBUTED 3fd25e9 .kiro/specs/recovery/requirements.md
- UNATTRIBUTED 3fd25e9 .kiro/specs/recovery/tasks.md
- UNATTRIBUTED 988c521 docs/verification/latest.md
- UNATTRIBUTED 988c521 package.json
- UNATTRIBUTED 988c521 scripts/golden/baseline.json
- UNATTRIBUTED 988c521 scripts/golden/make-baseline.mjs
- UNATTRIBUTED 988c521 scripts/verify.mjs
- UNATTRIBUTED 988c521 src/engine/analyze.ts
- UNATTRIBUTED 988c521 src/engine/config.ts
- UNATTRIBUTED 988c521 src/engine/detectors/palette.ts
- UNATTRIBUTED 988c521 src/engine/detectors/repetition.ts
- UNATTRIBUTED 988c521 src/engine/detectors/run-length.ts
- UNATTRIBUTED 988c521 src/engine/detectors/table-like.ts
- UNATTRIBUTED 988c521 tests/engine/generic-detectors.test.ts
- UNATTRIBUTED 988c521 tests/engine/golden-v2.test.ts
- UNATTRIBUTED 988c521 tests/property/analyze.test.ts
- UNATTRIBUTED ef79114 docs/verification/latest.md
- UNATTRIBUTED ef79114 package.json
- UNATTRIBUTED ef79114 scripts/verify.mjs
- UNATTRIBUTED ef79114 src/engine/analyze.ts
- UNATTRIBUTED ef79114 src/engine/config.ts
- UNATTRIBUTED ef79114 src/engine/detectors/box-numbers.ts
- UNATTRIBUTED ef79114 src/engine/detectors/header-block.ts
- UNATTRIBUTED ef79114 src/engine/detectors/row-stride.ts
- UNATTRIBUTED ef79114 src/engine/trial-decode.ts
- UNATTRIBUTED ef79114 tests/engine/analyze.test.ts
- UNATTRIBUTED ef79114 tests/engine/golden-report.test.ts
- UNATTRIBUTED ef79114 tests/property/analyze.test.ts
- UNATTRIBUTED a27383f docs/verification/latest.md
- UNATTRIBUTED a27383f src/engine/evidence.ts
- UNATTRIBUTED a27383f src/engine/types.ts
- UNATTRIBUTED a27383f tests/engine/evidence.test.ts
- UNATTRIBUTED a27383f tests/property/evidence.test.ts
- UNATTRIBUTED a27383f vitest.config.mts
- UNATTRIBUTED 94a098f .kiro/specs/engine/design.md
- UNATTRIBUTED 94a098f .kiro/specs/engine/requirements.md
- UNATTRIBUTED 94a098f .kiro/specs/engine/tasks.md
- UNATTRIBUTED 00a17f9 docs/verification/latest.md
- UNATTRIBUTED 955c6fe corpus/README.md
- UNATTRIBUTED 955c6fe corpus/heldout/heldout-01.pcx
- UNATTRIBUTED 955c6fe corpus/manifest.schema.json
- UNATTRIBUTED 955c6fe corpus/reference/checker1-gray-65x33.png
- UNATTRIBUTED 955c6fe corpus/reference/checker8-ocean-80x80.png
- UNATTRIBUTED 955c6fe corpus/reference/diag-ocean-256x16.png
- UNATTRIBUTED 955c6fe corpus/reference/hgrad-gray-64x48.png
- UNATTRIBUTED 955c6fe corpus/reference/rings-rand-111x111.png
- UNATTRIBUTED 955c6fe corpus/reference/shapes-rand-128x96.png
- UNATTRIBUTED 955c6fe corpus/reference/solid-gray-32x32.png
- UNATTRIBUTED 955c6fe corpus/reference/stripes-rand-200x40.png
- UNATTRIBUTED 955c6fe corpus/reference/text-fire-160x32.png
- UNATTRIBUTED 955c6fe corpus/reference/tiny-rand-7x5.png
- UNATTRIBUTED 955c6fe corpus/reference/vgrad-fire-97x61.png
- UNATTRIBUTED 955c6fe corpus/samples/checker1-gray-65x33.pcx
- UNATTRIBUTED 955c6fe corpus/samples/checker8-ocean-80x80.pcx
- UNATTRIBUTED 955c6fe corpus/samples/diag-ocean-256x16.pcx
- UNATTRIBUTED 955c6fe corpus/samples/hgrad-gray-64x48.pcx
- UNATTRIBUTED 955c6fe corpus/samples/rings-rand-111x111.pcx
- UNATTRIBUTED 955c6fe corpus/samples/shapes-rand-128x96.pcx
- UNATTRIBUTED 955c6fe corpus/samples/solid-gray-32x32.pcx
- UNATTRIBUTED 955c6fe corpus/samples/stripes-rand-200x40.pcx
- UNATTRIBUTED 955c6fe corpus/samples/text-fire-160x32.pcx
- UNATTRIBUTED 955c6fe corpus/samples/tiny-rand-7x5.pcx
- UNATTRIBUTED 955c6fe corpus/samples/vgrad-fire-97x61.pcx
- UNATTRIBUTED 955c6fe docs/verification/latest.md
- UNATTRIBUTED 955c6fe package.json
- UNATTRIBUTED 955c6fe scripts/corpus/generate.py
- UNATTRIBUTED 955c6fe scripts/corpus/list-tuning-samples.mjs
- UNATTRIBUTED 955c6fe scripts/corpus/requirements.txt
- UNATTRIBUTED 955c6fe scripts/corpus/validate.mjs
- UNATTRIBUTED 955c6fe scripts/verify.mjs
- UNATTRIBUTED 955c6fe tests/unit/corpus.test.ts
- UNATTRIBUTED c3d3f82 .kiro/hooks/provenance.json
- UNATTRIBUTED c3d3f82 docs/provenance/README.md
- UNATTRIBUTED c3d3f82 docs/verification/latest.md
- UNATTRIBUTED c3d3f82 package.json
- UNATTRIBUTED c3d3f82 scripts/provenance/check.mjs
- UNATTRIBUTED c3d3f82 scripts/provenance/record.mjs
- UNATTRIBUTED c3d3f82 scripts/verify.mjs
- UNATTRIBUTED c3d3f82 tests/unit/provenance.test.ts
- UNATTRIBUTED 0f93547 .github/workflows/verify.yml
- UNATTRIBUTED 0f93547 .gitignore
- UNATTRIBUTED 0f93547 .npmrc
- UNATTRIBUTED 0f93547 README.md
- UNATTRIBUTED 0f93547 docs/security.md
- UNATTRIBUTED 0f93547 docs/verification/latest.md
- UNATTRIBUTED 0f93547 eslint.config.mjs
- UNATTRIBUTED 0f93547 next.config.ts
- UNATTRIBUTED 0f93547 package-lock.json
- UNATTRIBUTED 0f93547 package.json
- UNATTRIBUTED 0f93547 playwright.config.ts
- UNATTRIBUTED 0f93547 scripts/serve.mjs
- UNATTRIBUTED 0f93547 scripts/verify.mjs
- UNATTRIBUTED 0f93547 src/app/layout.tsx
- UNATTRIBUTED 0f93547 src/app/page.tsx
- UNATTRIBUTED 0f93547 tests/e2e/smoke.spec.ts
- UNATTRIBUTED 0f93547 tests/property/toolchain.test.ts
- UNATTRIBUTED 0f93547 tests/unit/toolchain.test.ts
- UNATTRIBUTED 0f93547 tsconfig.json
- UNATTRIBUTED 0f93547 vercel.json
- UNATTRIBUTED 0f93547 vitest.config.mts
- UNATTRIBUTED 540f898 .kiro/agents/engine-engineer.md
- UNATTRIBUTED 540f898 .kiro/agents/verifier.md
- UNATTRIBUTED 540f898 .kiro/steering/demo.md
- UNATTRIBUTED 540f898 .kiro/steering/design.md
- UNATTRIBUTED 540f898 .kiro/steering/product.md
- UNATTRIBUTED 540f898 .kiro/steering/provenance.md
- UNATTRIBUTED 540f898 .kiro/steering/roadmap.md
- UNATTRIBUTED 540f898 .kiro/steering/tech.md
- UNATTRIBUTED 540f898 .kiro/steering/testing.md
- UNATTRIBUTED 540f898 AGENTS.md
- UNATTRIBUTED 540f898 docs/feature-register.md

## Feature register

# Feature register
Maintained by the verifier. Every status starts UNVERIFIED.

| ID | Feature | Done when | Status |
|---|---|---|---|
| F-01 | Resurrect a bundled sample (deterministic demo mode) | One click runs the real engine on a bundled sample and plays all six beats | UNVERIFIED |
| F-02 | Drop in a file | Files up to 10 MB accepted, larger refused with a clear message, nothing uploaded | UNVERIFIED |
| F-03 | Ranked hypotheses | Each recognisable sample gets at least one hypothesis with byte ranges | UNVERIFIED |
| F-04 | Evidence on every element | Property test: ranges in bounds, confidence 0 to 1, no element without evidence | UNVERIFIED |
| F-05 | Verification report | Exact or not, with a mismatch list; a "no reference available" mode; recovered image and evidence report downloadable | UNVERIFIED |
| F-06 | Six-beat ritual | All beats play in order; speed control 0.5x to 4x | UNVERIFIED |
| F-07 | Two-way inspector | Click a region to light its bytes, click bytes to select their region; rule and confidence shown | UNVERIFIED |
| F-08 | Honest failure | A corrupted sample ends as unrecovered with a plain-words reason, no crash | UNVERIFIED |
| F-09 | Reduced-motion mode | Same information, no animation | UNVERIFIED |
| F-10 | Confidence dot grid and charts | One dot per recovered row or region; hand-built SVG charts | UNVERIFIED |
| F-11 | Blind-test result | The held-out file result is shown and labelled | UNVERIFIED |
| F-12 | Real states | 404, 500, empty and loading states | UNVERIFIED |
| F-13 | Proof Room (stretch) | /proof renders the ledger and captures, read-only, offline | UNVERIFIED |
| F-14 | Judge quick-start | README opens with the URL, a 30-second try, where .kiro is, how Kiro was used | UNVERIFIED |

