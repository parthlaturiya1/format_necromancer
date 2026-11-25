# T-22 Deploy checks

Date: 2026-11-25. Commit checked: 160cb87 (pushed). Live: https://format-necromancer.vercel.app

Note: the repo has no text that defines R-04 to R-07. They are read here from the owner's T-22 line: R-04 security headers live, R-05 staging previews, R-06 rollback, R-07 uptime monitor.

## Status

| Item | Status | Evidence |
|---|---|---|
| CI on 160cb87 | PASS | [run 45642970421](https://github.com/parthlaturiya1/format_necromancer/actions/runs/45642970421), job `verify` success, 15:14:50Z to 15:18:41Z (3 min 51 s). All steps green, including `npm run verify`. |
| Live = main | PASS (by content) | Live JS chunk `/_next/static/immutable/chunks/24jrn0jg5wuvo.js` contains the T-20 text "real game art". The home HTML does not (it loads from chunks). The commit hash is not exposed by the site, so "exactly 160cb87" is not proven. |
| R-04 headers live | PASS | Table below. |
| R-05 staging previews | OWNER CHECK | Vercel preview per branch/PR is a Vercel feature (cited in `docs/rollback.md`). No preview URL was opened (no Vercel login). |
| R-06 rollback | OWNER STEP | Click path and git path in `docs/rollback.md`. Not performed. |
| R-07 uptime monitor | OWNER STEP | Steps below. Monitor not created. |
| Known-good tag `good-1` | CREATED LOCALLY | Signed tag on 160cb87. Not pushed. `git tag -v` cannot verify here (no allowed-signers file, same as earlier commits). |
| Optional Cloudflare mirror | NOT DONE | Optional. Not attempted. |

## R-04 headers (curl -I, 2026-11-25 15:17 UTC)

Same on `/` (200), `/404x` (404) and a JS chunk (200).

| Header | Value |
|---|---|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'` |
| worker-src | `'self'` (no `blob:`, as expected) |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | no-referrer |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload |

Seen, not asked for: `Access-Control-Allow-Origin: *` on every response. Fine for a static site with no private data. `script-src` keeps `'unsafe-inline'` (reason in `docs/security.md`).

## Live smoke (clean Playwright Chromium, 1 worker, BASE_URL = live)

Command: `$env:BASE_URL='https://format-necromancer.vercel.app'; npx.cmd playwright test -c tests/e2e/live.config.ts` (golden-run spec, includes the blind test). Result: 5 passed (1.2 min).

| Run | Start button visible | Press to beat 6 done | Beat 1 to 6 | Exact / blind | Console errors | Foreign requests | axe serious/critical |
|---|---|---|---|---|---|---|---|
| 1440x900 full motion | 3817 ms | 13001 ms | 10646 ms | 0 of 12,321 / 0 of 13,500 differ | 0 | 0 | 0 |
| 390x844 full motion | 414 ms | 12744 ms | 10625 ms | same | 0 | 0 | 0 |
| 1440x900 reduced motion | 401 ms | 1457 ms | n/a | same | 0 | 0 | 0 |
| 390x844 reduced motion | 812 ms | 1668 ms | n/a | same | 0 | 0 | 0 |

The 3817 ms at 1440 is the first load (cold edge cache); the other three are 401 to 812 ms. One sample only, not an average.

Real game art, live: the two `real art` tests of `tests/e2e/t20.spec.ts` (real-abuse-end, real-abuse-credit) ran with a temporary config in the OS temp folder (the repo config only matches the golden spec). Result: 2 passed. Each shows "Exact match", 0 mismatches, the "Real game art (CC0)" badge, the CC0 source line, a link with `noopener`, axe clean, 0 console errors, 0 foreign requests.

Screenshots: `docs/verification/screens/t22-live-*.png` (10 files, full motion; 1440 and 390: idle, done, inspect, blind, failure).

## Owner steps

1. Push the tag: `git push origin good-1`
2. Rollback (R-06): follow `docs/rollback.md`, Rollback A. Start with Overview, Production Deployment tile, **Instant Rollback**. Then undo it (**Manage**, confirm) so new pushes go live again. Do this once as a rehearsal if you want R-06 marked tested.
3. Staging (R-05): push any branch, open a PR, confirm Vercel shows a preview URL, open it.
4. Uptime (R-07), free, no credit card per the [UptimeRobot pricing page](https://uptimerobot.com/pricing/) (Free: $0, 50 monitors, 5-minute interval, HTTP monitor, email alerts):
   1. Sign up at https://dashboard.uptimerobot.com/sign-up (Free plan).
   2. Click **New monitor**. Type: HTTP(s).
   3. URL: `https://format-necromancer.vercel.app`. Name: Format Necromancer.
   4. Interval: 5 minutes (the Free minimum).
   5. Alert contact: your email. Save.
   6. Optional: create the one Free status page and use its URL as the public "uptime monitor URL". Status page URL: UNKNOWN until created.
   Not on Free: SSL monitoring, 60-second checks (paid). Monthly email reports only for the first 3 months.
5. Optional Cloudflare mirror: not done. UNKNOWN cost and setup; skip unless wanted.

## Not verified

- Preview deployments, Instant Rollback, git revert on `main`: not run.
- Vercel plan (Hobby or Pro): UNKNOWN. It decides how far back Instant Rollback can go.
- That live serves exactly 160cb87 (only that it has T-20 content).
- Phone behaviour on a real device; only an emulated 390x844 viewport.

## Weakest point

R-05, R-06 and R-07 are paper plans, not tested. Only R-04, CI and the live smoke have evidence. The "live = main" check is by text, so a build one commit older that also has T-20 would pass it.
