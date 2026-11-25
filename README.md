# Format Necromancer

Browser-only app that recovers a dead file format (PCX) from bytes alone, shows the evidence for every element, and checks the result against a reference. Nothing is uploaded.

Created by Parth Radheshyam Laturiya. Direction, product decisions and review by the owner; code written by Kiro.

## Judge quick-start
TODO (T-24): live URL, one-click sample, expected result.

## Develop
Requires Node 22.12 or newer.

```
npm ci
npx playwright install chromium
npm run verify
```

`npm run verify` runs the full gate and writes `docs/verification/latest.md`.
