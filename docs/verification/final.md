# T-25 Final verification (Gate 3)

Date: 2026-11-26. Verifier. Commit under test: 8445a58 (main = origin/main). Live: https://format-necromancer.vercel.app

**Verdict: FAIL for Gate 3 as written, in one line: R-01 (CI green on main) is red.** Everything else I could test passed: five consecutive fresh-clone greens, live check at two sizes, security headers. Details below.

## 1. Fresh clone x5 (README "Run locally" only)

Method: `git clone https://github.com/parthlaturiya1/format_necromancer.git` into a new folder under the temp dir, `npm.cmd ci`, `npx.cmd playwright install chromium`, `npm.cmd run verify`. One clone at a time, folder deleted after each run, one Playwright worker (the config's own). Node v26.13.1, Windows. CI uses Node 22: **not tested here**.

Attempt 1 failed, so the count reset. Attempts 2 to 6 are five consecutive greens.

| Attempt | Start (IST) | Commit | ci | verify total | Result | Free MB before / after |
|---|---|---|---|---|---|---|
| 1 | ~15:20 | 8445a58 | ok 49 s | 347 s | **FAIL**, step 7 e2e | 5607 / 4409 |
| 2 | 15:26:41 | 8445a58 | ok 29 s | 318 s | PASS | 4568 / 4755 |
| 3 | 15:32:53 | 8445a58 | ok 28 s | 247 s | PASS | 4604 / 4950 |
| 4 | 15:37:52 | 8445a58 | ok 25 s | 270 s | PASS | 4759 / 4908 |
| 5 | 15:43:06 | 8445a58 | ok 26 s | 274 s | PASS | 4947 / 5297 |
| 6 | 15:48:28 | 8445a58 | ok 26 s | 272 s | PASS | 5282 / 5391 |

(Attempt 1 start time is approximate: the first start at 15:17 was killed by a tool timeout I set wrongly, and I re-ran from a fresh clone. It is not counted. Attempt 1 memory "before" was read after the clone.)

Verify steps, runs 2 to 6 (seconds):

| Step | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|
| 1 Typecheck | 3.0 | 3.4 | 3.4 | 3.5 | 3.1 |
| 2 Lint | 6.4 | 10.1 | 7.1 | 6.8 | 7.7 |
| 3 Unit | 2.2 | 3.9 | 2.7 | 2.5 | 2.5 |
| 4 Property | 2.6 | 4.7 | 3.1 | 2.8 | 2.8 |
| 5 Golden | 1.5 | 1.3 | 1.8 | 1.6 | 1.5 |
| 6 Build | 9.1 | 10.8 | 9.6 | 9.8 | 10.0 |
| 7 e2e | 289.9 | 207.8 | 239.7 | 243.8 | 241.8 |
| 8 Budgets | 0.8 | 1.6 | 0.6 | 0.7 | 0.7 |
| 9a Audit | 1.1 | 1.8 | 0.9 | 1.0 | 1.0 |
| 9b Secret scan | 0.5 | 1.1 | 0.5 | 0.6 | 0.5 |
| 10 provenance | 0.1 | 0.3 | 0.1 | 0.1 | 0.1 |

Attempt 1 steps: 1 to 6 PASS (5.2, 10.5, 3.4, 3.0, 1.6, 13.7 s), 7 FAIL (exit 1), 8 to 10 SKIPPED. 70 e2e passed, 23 skipped, 1 failed.

### The flake (attempt 1)
`tests/e2e/panels.spec.ts:82` "1 MB file: hex keeps a small DOM and scrolls without long tasks". Assertion `expect(longMax).toBeLessThan(50)` received 54 (ms, longest browser task). Passed in the next five runs. Cause: a wall-clock limit of 50 ms on a cold first run (first run after install, fresh disk cache, other processes using memory). It is a timing flake, not a logic bug, but the limit leaves about 4 ms of margin on this host. No retry added. Risk: the same test can fail on CI or on a judge's slower laptop.

## 2. README defects (findings; I did not fix them)
1. The "Run locally" code block lists `npm ci`, `npm run verify`, `npm run dev`. The Playwright browser install is only in the sentence below the block. A literal reader running the block top to bottom meets the e2e step without the browser. I installed it first; I did not test verify without it.
2. The README does not say that `npm run verify` takes about 4 to 6 minutes. A judge may think it hung.
3. README says Node 22.12 or newer. I only ran Node 26.13.1. Node 22 is unverified (CI uses it).
4. On Windows with script execution disabled, `npm` must be `npm.cmd`. README does not mention it (host-specific).

## 3. Deployed URL, clean profile (new browser context each run)

Live config run: `BASE_URL=https://format-necromancer.vercel.app npx playwright test -c tests/e2e/live.config.ts`: 5 of 5 passed (50 s). Extra live run with a temp config over p1.spec.ts and t18.spec.ts: 23 of 23 passed (corrupted sample, signature sample, blind test button, phone failure screen, no-overflow at 1440, 1280, 390).

| Check | 1440x900 | 390x844 |
|---|---|---|
| Start button visible (full motion golden run) | 4083 ms (first, cold) | 350 ms |
| Press to finished, full motion | 7349 ms | 7344 ms |
| Press to finished, reduced motion | 1549 ms | 1180 ms |
| Separate clean-context probe: button, press to done | 62 ms, 7502 ms | 62 ms, 7512 ms |
| Beats 1..6 | yes | yes |
| Result | Exact match, 0 of 64,000 pixels differ | same |
| Blind test | 0 of 13,500 pixels differ | same |
| Corrupted sample | ends unrecovered, reason in words (t18) | phone failure screen fits (t18) |
| Signature-changed sample | Pillow refuses, engine Exact (p1, t18) | no overflow (p1) |
| axe | 0 violations | 0 violations |
| Console errors | 0 | 0 |
| Foreign requests | 0 | 0 |
| Screenshot | screens/t25-live-desktop.png | screens/t25-live-phone.png |

Build served: it is the F-1/P-1 build. The page text contains "Recovers a dead file from its bytes alone." (HTML and probe, both sizes). "Try real game art" shows on desktop only; the phone probe found no such text (not checked whether it is hidden by design). First-load HTML 37,910 bytes.

Headers (curl, GET /): HTTP 200; CSP `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`; Strict-Transport-Security max-age 63072000 preload; X-Frame-Options DENY; X-Content-Type-Options nosniff; Referrer-Policy no-referrer; Permissions-Policy camera/microphone/geolocation off. `/nope` returns 404. `Cache-Control: max-age=0, must-revalidate`.

## 4. Ship-readiness checklist (testing.md 8.4)

| ID | Result | Evidence |
|---|---|---|
| R-01 CI green on main | **FAIL** | GitHub API, run 45664134160: commit 8445a58 on main, workflow "verify", completed, conclusion failure, step "Run npm run verify" failed (annotation: "Process completed with exit code 1"). Run 45664141038 (commit 160cb87, branch good-1) and run 45653958103 (commit 8858128, main) succeeded. The job log needs a sign-in (HTTP 403), so I could not read the failing step. Between 8858128 and 8445a58 the diff adds f1-fps.spec.ts and UI changes. Likely cause (not proven): a timing-limited e2e test failing on the CI runner, like attempt 1 here. |
| R-02 No high/critical audit | PASS | verify step 9a PASS x5 |
| R-03 Secret scan clean | PASS | verify step 9b PASS x5 |
| R-04 Security headers live | PASS | headers above |
| R-05 Preview deploy, known-good tag | PARTIAL, OWNER | tag good-1 exists on GitHub (refs/tags/good-1). Preview URL needs a Vercel login (t22-deploy.md): owner step. |
| R-06 Rollback tested once | OWNER | docs/rollback.md says "Not tested". |
| R-07 Uptime monitor | OWNER | no evidence of a monitor. |
| R-08 404/500/empty/loading | PASS | live /nope 404; shell.spec.ts green x5 |
| R-09 Privacy note and LICENSE | PASS | LICENSE and docs/privacy.md exist |
| R-10 README quick-start, fresh clone passes | PASS with defects | 5 consecutive greens, defects in section 2 |
| R-11 Hostile-file fuzzing | PASS | docs/verification/robustness-report.md (3002 cases, 0 crashes, T-10); property tests green x5 |
| R-12 Accessibility | PASS | axe 0 violations at five states, both sizes, live |

## 5. Gate 3 per testing.md 8.3
- Five consecutive green fresh-clone runs using only the README: **met** (attempts 2 to 6), with README defects.
- Smoke test of live URL from a clean profile at laptop and phone sizes: **met**.
- Ship-readiness: **not met**: R-01 red on main. R-06 and R-07 owner steps open.

Fix before submitting: find why CI fails on 8445a58 (owner can open https://github.com/parthlaturiya1/format_necromancer/actions/runs/45664134160), then get CI green. I did not change anything.

## 6. Scorecard (1 to 10, my own judgment)

| Criterion | Score | One line of evidence |
|---|---|---|
| Potential Impact | 6 | One format (PCX) recovered exactly; blind test and signature-changed file show the idea; scope is narrow. |
| Technological Implementation | 7 | Engine and UI pass 3002 fuzz cases, golden 11 of 11, 5 clean fresh-clone runs; CI red on main and a 4 ms-margin timing test pull it down. |
| Design | 8 | Six-beat reveal, evidence per element, axe 0 violations at both sizes, honest failure screen. |
| Innovation | 7 | Recover a format from bytes alone with evidence and a verified match; not compared to other work by me. |
| Presentation | 7 | Live site loads fast (7.4 s press to result) and has the promise line; README quick-start has gaps, CI badge would be red. |

Three weakest points:
1. CI is red on main (8445a58); the log is not readable without sign-in, so the cause is unproven.
2. Timing-limited tests (long task under 50 ms) failed once in six clean runs; flaky on slow machines.
3. README order omits the Playwright install in the code block; Node 22 never tested by me; rollback and uptime unverified.

## 7. Not verified
Node 22; Vercel preview; rollback; uptime monitor; CI failure cause; verify without the Playwright install; a real 10 MB file; phone "Try real game art" text; 0.5x and 4x speeds live.
