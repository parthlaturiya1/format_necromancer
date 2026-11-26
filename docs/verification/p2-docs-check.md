# P-2: README claims and evidence

Each claim in the changed README parts, the file that backs it, and whether it is backed. "Backed" means I read the pointer and the number matches.

| README claim | Evidence | Backed |
|---|---|---|
| One sentence: recovers a dead file from its bytes alone, no specification, nothing uploaded | Product line in `.kiro/steering/product.md`; "Nothing uploaded" in `docs/privacy.md`; the "no specification" claim has a disclosed limit (format-aware decoder) in README "The honest claim" | Backed, with that disclosed limit |
| 5 of 5 real CC0 Abuse files exact against Pillow | `wild-test.md` Verdict and Files table: 5 exact, 0 mismatches, CC0 on the source page | Backed |
| Results row W-1: "truth: Pillow 13.0.0", run once each, no tuning, one source | `wild-test.md` "Time order" step 3 (Pillow 13.0.0) and Verdict | Backed |
| Blind test exact, 0 of 13,500 pixels | `blind-test.md` (row already in README, unchanged) | Backed (not re-run) |
| 297 changed files, 0 wrong at confidence 0.9 or more | `robustness-report.md` (unchanged row) | Backed (not re-run) |
| Runs in the browser, no network during analysis | `t19-golden-run.md` "Network during analysis": nothing fetched after the reference PNG. The bundled sample bytes are fetched from the same origin at the press. | Backed, for analysis only |
| Large files: valid 10.4 MB exact in 1,591 ms | `t21d-large-files.md` table, row "noise 3200x2600" | Backed |
| Nine 10 MB attack files end unrecovered with a reason, slowest 2,762 ms | `t21d-large-files.md` attacks table (9 rows, max 2,762 ms) | Backed. The task text said "under about 1.2 s"; the report says up to 2.8 s, so the report number is used. |
| "Stub" line removed; budgets are real | `t21c-budgets.md`, `latest.md` step 8 PASS; the README row "Budgets (T-21c)" cites it. Lighthouse not configured is kept. | Backed |
| Kiro IDE did two tasks: T-11b and T-21a | Commits `53fda9a` (T-11b, Kiro IDE) and `7479c95` (T-21a, Kiro IDE) in `git log` | Backed |
| Provenance warning count: see `latest.md` | No number is stated in README or AUTHORSHIP now | Backed |
| AUTHORSHIP ledger summary lists tasks through T-21d, T-20, T-22, W-1 | `docs/provenance/ledger.jsonl`: 31 lines, 28 with a task ID (counted); agent and task pairs read line by line. P-1 and P-2 are not yet in the ledger and the file says so. | Backed |
| One "Created by" line (the top copy kept, the bottom removed) | `README.md` has one match; wording equals `.kiro/steering/product.md` line 15 | Backed |
| 104,000 museums, 2021, UNESCO | UNESCO article "UNESCO report points to options for the future" (search result text: 104,000 museums). The page itself was not fetched, only the search snippet was read. | Partly backed: snippet only |
| IFLA library numbers (80,000 and 408,000) | Not found on any page I could open (the IFLA map returned HTTP 403, searches found no source). **Removed from the README.** | Removed, not claimed |
| Default sample may be generated or real art; steps are the same | Wording is true either way. Real art is in `t20-polish.md`; P-1 is not landed. | Backed |
| Build journal entries | Commit hashes and times from `git log --date=iso`; "surprised us" items from `review-t14.md` (N1), `robustness-report.md`, `t19-golden-run.md`, `wild-test.md`, `t21d-large-files.md`, `judge-review-2.md` | Backed, except the held-out guard item, which comes from the commit subjects `de158ae` and `f614bf8` only |

Not checked: the live site first screen after P-1; whether the screenshot `t17-done.png` still matches the final UI; the UN News link (no UN News page with the 104,000 number was found, so UNESCO is cited instead).
