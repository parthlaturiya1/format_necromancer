# Rollback and staging

Production: https://format-necromancer.vercel.app (Vercel, built from `main`).
Known-good tag: `good-1` (commit 160cb87).

## Staging (R-05)

Vercel builds a preview deployment for every branch and pull request. Each has its own URL. Test a change there, then merge to `main` to ship it. Preview deployments are not eligible for Instant Rollback (they were never on the production domain). Source: [Vercel Instant Rollback, "Eligible deployments"](https://vercel.com/docs/instant-rollback).

Not verified by the agent: no Vercel login, so no preview URL was opened. Owner check: push a branch, open the PR, confirm Vercel posts a preview URL, open it.

## Rollback A: Vercel Instant Rollback (R-06, owner step)

Fastest. It runs in seconds and needs no new build. Source: [Vercel Instant Rollback](https://vercel.com/docs/instant-rollback) (page dated 2026-07-07).

1. Sign in to Vercel. Open the project `format-necromancer`.
2. On the Overview page, find the Production Deployment tile. Click **Instant Rollback**.
3. In the dialog, pick the previous deployment. (Hobby plan: only the one just before the current. Pro: **Choose another deployment**.)
4. Click **Continue**. Read the domains list. Click **Confirm Rollback**.
   Same action from the list: Deployments, filter by `main`, click the three dots on the target row, **Instant Rollback**.

Warning from Vercel: after a rollback, new pushes to `main` do NOT go live until you undo the rollback.

Undo: Overview, production tile, **Manage**, pick the deployment, **Confirm**. Or CLI: `vercel promote <deployment-url>`.

## Rollback B: git (works without the dashboard)

```
git checkout main
git pull
git revert <bad-commit>        # one commit; for a range: git revert <old>..<new>
git push origin main
```

Vercel builds the revert and publishes it to production in a few minutes. To return to the known-good state exactly:

```
git revert --no-commit 160cb87..HEAD
git commit -S -m "Revert to good-1"
git push origin main
```

Never use `git push --force` on `main`.

## After any rollback, check

1. `curl.exe -I https://format-necromancer.vercel.app` returns 200 and the same security headers (CSP with `worker-src 'self'`, X-Frame-Options, HSTS).
2. Live smoke: `$env:BASE_URL='https://format-necromancer.vercel.app'; npx.cmd playwright test -c tests/e2e/live.config.ts` passes 5 of 5.
3. Open the site: press **Resurrect a sample**, see "Exact match".
4. GitHub Actions `verify` is green on the commit that is live.
5. Vercel only: if you used Instant Rollback, remember to undo it later or pushes stay offline.

## Tested?

Rollback B (git) was tested on production on 2026-11-26 (R-06 drill, owner-requested):

| Step | Commit | Vercel status (GitHub API) | Live check |
|---|---|---|---|
| Before | `3e0f020` | success | `samples/index.json` default `real-abuse-end` |
| Roll back to good-1 (`git revert --no-commit 160cb87..HEAD`, tree identical to `good-1`) | `bfbc4b2` | success 12:45:46Z | default `rings-rand-111x111`; 200; CSP `worker-src 'self'`, X-Frame-Options DENY, HSTS; live smoke 5 of 5 passed ("0 of 12,321 pixels differ") |
| Roll forward (revert of `bfbc4b2`, tree identical to `3e0f020`) | `5cb7ace` | success 12:49:33Z | default `real-abuse-end`; live smoke 5 of 5 passed ("0 of 64,000 pixels differ") |

Time from push to live: under 3 minutes each way. No force push. History keeps both drill commits.

Not tested: Rollback A (Vercel Instant Rollback). It needs a Vercel login. It is optional now that the git path is proven.
