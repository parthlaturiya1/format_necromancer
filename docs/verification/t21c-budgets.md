# T-21c: real budgets, CI badge, CSP worker check, history secret scan

Date 2026-11-25 (IST evening; the security rows are dated 2026-11-26 for the Gate 2 day). Base HEAD 6efddfb. Node v26.13.1 local, CI uses Node 22. No new dependency (D-14).

## 1. Budgets (verify step 8 is real)
Code: `scripts/budgets/js-size.mjs`, `scripts/budgets/engine-timing.test.ts`, `scripts/budgets/vitest.config.mts`, called from `scripts/verify.mjs`. Step 8 fails if any number is over its limit. The numbers go into the "Budgets (step 8)" section of `docs/verification/latest.md`.

JS method: every `<script src>` and `<link rel=preload as=script>` in each exported page's HTML, each file gzipped once with node zlib (level 9), summed. The `noModule` polyfill script is counted (stricter). Lazy chunks not named in the HTML are not counted.

| Page JS, gzipped | Files | Bytes | Limit | Result |
|---|---|---|---|---|
| `/` (landing) | 11 | 201,889 | 250,000 | ok |
| `/404` | 9 | 181,692 | 250,000 | ok |
| `/_not-found` | 9 | 181,692 | 250,000 | ok |

The T-17 report says 173,030 bytes for the landing page. This method gives about 29 KB more: it counts the polyfill script and the UI has grown since T-17. Both are under the limit.

| Engine, analyze + recover, Node | Bytes | ms | Limit |
|---|---|---|---|
| generated 1 MiB noise | 1,048,576 | 4.5 | 3000 |
| hgrad-gray-64x48 + noise to 1 MiB | 1,048,576 | 2.9 | 3000 |
| 11 tuning samples (slowest vgrad-fire-97x61) | 938 to 8,339 | 2.4 to 40.9 | 3000 |

Lighthouse: not configured (would add a dependency).

## 2. CI
`.github/workflows/verify.yml` already runs `npm run verify` on push and pull request: Node 22, `npm ci`, `npx playwright install --with-deps chromium`, then verify, then uploads `latest.md`. Unchanged. A badge is at the top of `README.md`. Not checked: a CI run on GitHub (nothing is pushed, so the badge shows no status until the first run).

## 3. H5: is `worker-src blob:` needed? No
`scripts/budgets/serve-with-csp.mjs` serves `out/` with the `vercel.json` CSP, optionally minus `blob:` in `worker-src`.

| Run | Result |
|---|---|
| Golden run (`tests/e2e/live.config.ts`, BASE_URL set) against CSP with `worker-src 'self'` | 5 of 5 pass, console_errors 0, foreign_requests 0, axe 0 violations |
| Control: `worker-src 'none'` (`--control-no-worker`), one golden test | fails (the worker cannot start) |

The control shows the test notices a blocked worker. `blob:` was removed from `worker-src` in `vercel.json`. The blob URL for downloads uses `img-src`/anchor, not a worker, and is unchanged. Not checked: the live Vercel site after deploy.

## 4. S5: git history secret scan
Command: `git log -p --all` over 54 commits (42,692 diff lines), matched line by line. Patterns: the verify regex, AWS `AKIA[0-9A-Z]{16}`, `gh[pousr]_` (36+), `github_pat_`, private key headers, `+KEY|SECRET|TOKEN|PASSWORD = value` lines.

| Pattern | Matches |
|---|---|
| verify regex (AKIA, private key, gh*_, sk-, xox*) | 0 |
| AWS AKIA | 0 |
| GitHub ghp_/gho_/ghu_/ghs_/ghr_ | 0 |
| GitHub github_pat_ | 0 |
| Private key header | 0 |
| .env-style KEY/SECRET/TOKEN/PASSWORD = value | 0 |
| File names ever committed: .env, .pem, .key, id_rsa, id_ed25519, .p12 | 0 |

Nothing found, so no value was printed. Limit: the scan reads only added lines of text diffs, and pattern matching misses secrets with no known shape. The verify step 9b scan is still a regex over tracked files.

## Verify run
`npm run verify` on this tree: steps 1 to 6 PASS, step 7 FAIL on two tests in files I did not touch: `tests/e2e/hud.spec.ts` phone page length (1,539 px, limit 1,500) and `tests/e2e/t18.spec.ts` phone failure screen. Both re-fail alone. `src/ui/*` and `public/samples/` had uncommitted edits by another worker during the run. Steps 8 to 10 were therefore skipped by the gate. I ran step 8's two commands by hand with the numbers above, both exit 0. A first verify run also hit a port 4173 clash with another worker's verify.

## Not verified
- Step 8 inside a green full verify (blocked by the two UI failures above).
- That step 8 fails when a budget is broken: not forced by a deliberate break.
- GitHub Actions run, Lighthouse, live site CSP.

## Weakest point
The engine timing uses noise and generated samples that are small. The 1 MiB cases finish in 4.5 and 2.9 ms because the analyzer finds nothing to chase, so they do not prove a 1 MiB real PCX is fast.
