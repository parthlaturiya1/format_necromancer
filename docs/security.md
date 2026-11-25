# Security notes

## CSP relaxations (D-07)
- `script-src 'unsafe-inline'` and `style-src 'unsafe-inline'`: the Next.js static export inlines small hydration scripts and styles. Replace with hashes if the export can emit them (revisit at T-22).
- `worker-src blob:`: removed 2026-11-26 (H5). Workers load from `'self'` only.

Everything else is `'self'`: no remote origins, no framing (`frame-ancestors 'none'`).

## Self-review (T-21a, verifier, 2026-11-25)
Scope: guardrails 5, 6, 11 (`.kiro/steering/product.md`), D-02, D-05, D-07, D-11 (`.kiro/steering/tech.md`). Working tree on `main`, uncommitted UI changes included. Method: reading files, text search over `src/`, `npm audit`. No browser or live deploy was checked.

### Headers and CSP (`vercel.json`)
| # | Item | Result | Evidence |
|---|---|---|---|
| H1 | `connect-src 'self'`, `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` | OK | `vercel.json` line 6 |
| H2 | No framing: `frame-ancestors 'none'` plus `X-Frame-Options: DENY` | OK | `vercel.json` lines 6, 7 |
| H3 | `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` (camera, microphone, geolocation off) | OK | `vercel.json` lines 8 to 10 |
| H4 | `script-src 'unsafe-inline'`: an injected inline script would run. Recorded relaxation, permitted by D-07, still the weakest part of the policy | ISSUE | `vercel.json` line 6; relaxation above |
| H5 | `worker-src blob:` was not needed: golden run (5 of 5, 0 console errors) passes against a server sending the vercel.json CSP without `blob:`; a control with `worker-src 'none'` fails. `blob:` removed from `worker-src` | OK (2026-11-26) | `vercel.json`; `scripts/budgets/serve-with-csp.mjs`; `docs/verification/t21c-budgets.md` |
| H6 | Headers exist only on Vercel. The static export ignores `next.config` headers (D-05), so `scripts/serve.mjs` and the optional Cloudflare mirror serve without this CSP | ISSUE | `next.config.ts` (`output: 'export'`, no headers); mirror headers NOT FOUND |
| H7 | Headers not checked on a live response | NOT VERIFIED | No deploy URL tested |

### Network calls in `src/` (guardrail 5, D-02)
Searched for `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource`, `importScripts`, `http://`, `https://`.
| # | Item | Result | Evidence |
|---|---|---|---|
| N1 | Only `fetch` calls, all to same-origin static files: the sample index, a bundled sample, its reference PNG | OK | `src/ui/Shell.tsx:68`, `:144`, `:170`, `:174` |
| N2 | No `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource`, `importScripts`, analytics or AI calls | OK | 0 matches in `src/` |
| N3 | One external URL: the GitHub README link. It is a user-clicked link, not a request, with `rel="noopener noreferrer"` | OK | `src/ui/Shell.tsx:17`, `:259` |
| N4 | The user's file is read locally (`file.arrayBuffer()`) and sent only to the worker by `postMessage` | OK | `src/ui/Shell.tsx` `loadFile`; `src/ui/worker/client.ts:49` |
| N5 | No server code: static export only | OK | `next.config.ts` (`output: 'export'`) |

### Secrets and repo hygiene (guardrail 11)
| # | Item | Result | Evidence |
|---|---|---|---|
| S1 | 459 tracked text files searched for key patterns (AWS `AKIA`, GitHub `ghp_`/`github_pat_`, `sk-`, Slack `xox`, Google `AIza`, private-key blocks): 0 hits | OK | `git ls-files`, images, `.pcx` and `package-lock.json` excluded |
| S2 | No `.env` file tracked; `.env*` is ignored | OK | `.gitignore` |
| S3 | `.kiro/` is tracked (19 files) and not ignored | OK | `git ls-files .kiro`, `git check-ignore .kiro` empty |
| S4 | `LICENSE` exists | OK | `LICENSE` |
| S5 | Full git history scanned once (`git log -p --all`, 54 commits, 42,692 diff lines): 0 findings for the verify patterns, AWS AKIA, ghp_/github_pat_, private key headers, .env-style KEY=. No .env, .pem, .key or id_* file name ever committed. The verify scan itself is still a regex over tracked files, not a real scanner | OK (2026-11-26) | `docs/verification/t21c-budgets.md`; `scripts/verify.mjs` |

### Dependencies
| # | Item | Result | Evidence |
|---|---|---|---|
| D1 | `npm audit`: `found 0 vulnerabilities`, exit 0, 2026-11-25 | OK | Run in this task; verify step 9a runs `npm audit --audit-level=high` (`scripts/verify.mjs:63`) |
| D2 | Runtime dependencies are `next`, `react`, `react-dom` only, pinned exactly | OK | `package.json` |

### File-size limit (D-11)
| # | Item | Result | Evidence |
|---|---|---|---|
| F1 | 10 MB checked on `file.size` before the file is read; the user sees "Nothing was read" | OK | `src/ui/Shell.tsx:18` (`MAX_FILE_BYTES`), `loadFile` |
| F2 | The engine repeats the check (10 MB max, 16 bytes min) and returns unrecovered with a reason | OK | `src/engine/config.ts:105-106`, `src/engine/analyze.ts:126-127`, `src/engine/pipeline.ts:17-18` |

### What a hostile file can do
| # | Item | Result | Evidence |
|---|---|---|---|
| X1 | Parsing runs in a module Web Worker with no DOM or network access | OK | `src/engine/worker.ts:2`, `src/ui/worker/client.ts:28` |
| X2 | Size fields are capped: width and height at most 8192, decoded values at most 16 Mi | OK | `src/engine/config.ts:79`, `:104`; `src/engine/recover.ts:28`, `:34`; `src/engine/detectors/box-numbers.ts:23` |
| X3 | A run that hangs is stopped after 120 s (verify after 60 s) and the worker is terminated | OK | `src/ui/worker/client.ts:20`, `:42-45`, `:59-62` |
| X4 | Crashes: 3002 fuzz cases and 297 mutation files, 0 crashes | OK | T-10 entry in `docs/provenance/ledger.jsonl`; `tests/property/fuzz.test.ts` |
| X5 | Output reaches the page through React text (escaped). No `innerHTML`, `dangerouslySetInnerHTML`, `eval` or `new Function` in `src/` | OK | 0 matches in `src/` |
| X6 | Downloads use blob URLs that are revoked after 2 s | OK | `src/ui/hud/Hud.tsx:209-216` |
| X7 | `workBudget` is checked only in the header-block detector. No bound was found for the other detectors or the recoverer, so a crafted 10 MB file may hold the tab's CPU until the 120 s timeout. The impact stays in the user's own tab | ISSUE | `src/engine/detectors/header-block.ts:24` is the only use; not measured |

### Privacy (`docs/privacy.md`)
| # | Item | Result | Evidence |
|---|---|---|---|
| P1 | No cookies or analytics; file bytes are never stored | OK | No `document.cookie` or analytics matches in `src/` |
| P2 | `sessionStorage` keeps two UI choices (`fn.speed`, `fn.reduced`). `docs/privacy.md` does not mention this | ISSUE | `src/ui/Shell.tsx:29-30`, `:76-79` |

Open issues: H4, H6, X7, P2. H7 is still unverified.
