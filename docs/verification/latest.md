# Verification

Overall: **PASS**
Run: 2026-11-25T10:50:31.125Z, Node v26.13.1

| Step | Result |
|---|---|
| 1 Typecheck | PASS (2.3s) |
| 2 Lint | PASS (5.8s) |
| 3 Unit tests | PASS (2.2s) |
| 4 Property tests | PASS (1.2s) |
| 5 Golden corpus | PASS (0.9s) |
| 6 Build | PASS (6.1s) |
| 7 Playwright e2e | PASS (3.5s) |
| 8 Budgets | PASS (stub, 0.0s) |
| 9a Audit (high/critical) | PASS (2.1s) |
| 9b Secret scan | PASS (0.2s) |
| 10 provenance:check | PASS (0.2s) |

## Provenance warnings (95)

- UNATTRIBUTED 6460710 docs/verification/latest.md
- UNATTRIBUTED 6460710 package.json
- UNATTRIBUTED 6460710 scripts/verify.mjs
- UNATTRIBUTED 6460710 src/engine/analyze.ts
- UNATTRIBUTED 6460710 src/engine/config.ts
- UNATTRIBUTED 6460710 src/engine/detectors/box-numbers.ts
- UNATTRIBUTED 6460710 src/engine/detectors/header-block.ts
- UNATTRIBUTED 6460710 src/engine/detectors/row-stride.ts
- UNATTRIBUTED 6460710 src/engine/trial-decode.ts
- UNATTRIBUTED 6460710 tests/engine/analyze.test.ts
- UNATTRIBUTED 6460710 tests/engine/golden-report.test.ts
- UNATTRIBUTED 6460710 tests/property/analyze.test.ts
- UNATTRIBUTED 4775ce6 docs/verification/latest.md
- UNATTRIBUTED 4775ce6 src/engine/evidence.ts
- UNATTRIBUTED 4775ce6 src/engine/types.ts
- UNATTRIBUTED 4775ce6 tests/engine/evidence.test.ts
- UNATTRIBUTED 4775ce6 tests/property/evidence.test.ts
- UNATTRIBUTED 4775ce6 vitest.config.mts
- UNATTRIBUTED 05dab4e .kiro/specs/engine/design.md
- UNATTRIBUTED 05dab4e .kiro/specs/engine/requirements.md
- UNATTRIBUTED 05dab4e .kiro/specs/engine/tasks.md
- UNATTRIBUTED 1527778 docs/verification/latest.md
- UNATTRIBUTED ada6685 corpus/README.md
- UNATTRIBUTED ada6685 corpus/heldout/heldout-01.pcx
- UNATTRIBUTED ada6685 corpus/manifest.schema.json
- UNATTRIBUTED ada6685 corpus/reference/checker1-gray-65x33.png
- UNATTRIBUTED ada6685 corpus/reference/checker8-ocean-80x80.png
- UNATTRIBUTED ada6685 corpus/reference/diag-ocean-256x16.png
- UNATTRIBUTED ada6685 corpus/reference/hgrad-gray-64x48.png
- UNATTRIBUTED ada6685 corpus/reference/rings-rand-111x111.png
- UNATTRIBUTED ada6685 corpus/reference/shapes-rand-128x96.png
- UNATTRIBUTED ada6685 corpus/reference/solid-gray-32x32.png
- UNATTRIBUTED ada6685 corpus/reference/stripes-rand-200x40.png
- UNATTRIBUTED ada6685 corpus/reference/text-fire-160x32.png
- UNATTRIBUTED ada6685 corpus/reference/tiny-rand-7x5.png
- UNATTRIBUTED ada6685 corpus/reference/vgrad-fire-97x61.png
- UNATTRIBUTED ada6685 corpus/samples/checker1-gray-65x33.pcx
- UNATTRIBUTED ada6685 corpus/samples/checker8-ocean-80x80.pcx
- UNATTRIBUTED ada6685 corpus/samples/diag-ocean-256x16.pcx
- UNATTRIBUTED ada6685 corpus/samples/hgrad-gray-64x48.pcx
- UNATTRIBUTED ada6685 corpus/samples/rings-rand-111x111.pcx
- UNATTRIBUTED ada6685 corpus/samples/shapes-rand-128x96.pcx
- UNATTRIBUTED ada6685 corpus/samples/solid-gray-32x32.pcx
- UNATTRIBUTED ada6685 corpus/samples/stripes-rand-200x40.pcx
- UNATTRIBUTED ada6685 corpus/samples/text-fire-160x32.pcx
- UNATTRIBUTED ada6685 corpus/samples/tiny-rand-7x5.pcx
- UNATTRIBUTED ada6685 corpus/samples/vgrad-fire-97x61.pcx
- UNATTRIBUTED ada6685 docs/verification/latest.md
- UNATTRIBUTED ada6685 package.json
- UNATTRIBUTED ada6685 scripts/corpus/generate.py
- UNATTRIBUTED ada6685 scripts/corpus/list-tuning-samples.mjs
- UNATTRIBUTED ada6685 scripts/corpus/requirements.txt
- UNATTRIBUTED ada6685 scripts/corpus/validate.mjs
- UNATTRIBUTED ada6685 scripts/verify.mjs
- UNATTRIBUTED ada6685 tests/unit/corpus.test.ts
- UNATTRIBUTED 51f0d26 .kiro/hooks/provenance.json
- UNATTRIBUTED 51f0d26 docs/provenance/README.md
- UNATTRIBUTED 51f0d26 docs/verification/latest.md
- UNATTRIBUTED 51f0d26 package.json
- UNATTRIBUTED 51f0d26 scripts/provenance/check.mjs
- UNATTRIBUTED 51f0d26 scripts/provenance/record.mjs
- UNATTRIBUTED 51f0d26 scripts/verify.mjs
- UNATTRIBUTED 51f0d26 tests/unit/provenance.test.ts
- UNATTRIBUTED 550e27d .github/workflows/verify.yml
- UNATTRIBUTED 550e27d .gitignore
- UNATTRIBUTED 550e27d .npmrc
- UNATTRIBUTED 550e27d README.md
- UNATTRIBUTED 550e27d docs/security.md
- UNATTRIBUTED 550e27d docs/verification/latest.md
- UNATTRIBUTED 550e27d eslint.config.mjs
- UNATTRIBUTED 550e27d next.config.ts
- UNATTRIBUTED 550e27d package-lock.json
- UNATTRIBUTED 550e27d package.json
- UNATTRIBUTED 550e27d playwright.config.ts
- UNATTRIBUTED 550e27d scripts/serve.mjs
- UNATTRIBUTED 550e27d scripts/verify.mjs
- UNATTRIBUTED 550e27d src/app/layout.tsx
- UNATTRIBUTED 550e27d src/app/page.tsx
- UNATTRIBUTED 550e27d tests/e2e/smoke.spec.ts
- UNATTRIBUTED 550e27d tests/property/toolchain.test.ts
- UNATTRIBUTED 550e27d tests/unit/toolchain.test.ts
- UNATTRIBUTED 550e27d tsconfig.json
- UNATTRIBUTED 550e27d vercel.json
- UNATTRIBUTED 550e27d vitest.config.mts
- UNATTRIBUTED 6a2c00b .kiro/agents/engine-engineer.md
- UNATTRIBUTED 6a2c00b .kiro/agents/verifier.md
- UNATTRIBUTED 6a2c00b .kiro/steering/demo.md
- UNATTRIBUTED 6a2c00b .kiro/steering/design.md
- UNATTRIBUTED 6a2c00b .kiro/steering/product.md
- UNATTRIBUTED 6a2c00b .kiro/steering/provenance.md
- UNATTRIBUTED 6a2c00b .kiro/steering/roadmap.md
- UNATTRIBUTED 6a2c00b .kiro/steering/tech.md
- UNATTRIBUTED 6a2c00b .kiro/steering/testing.md
- UNATTRIBUTED 6a2c00b AGENTS.md
- UNATTRIBUTED 6a2c00b docs/feature-register.md

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

