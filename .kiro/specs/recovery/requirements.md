# Recovery and verification spec S-02: requirements

Scope: the recoverer (T-08), the verifier (T-09) and the robustness sets (T-10). Inputs: the analyzer result from S-01 (`AnalysisResult`). Source: steering product.md, tech.md, testing.md; docs/verification/golden-report-v2.md.

## Terms
- Recovered image: width x height RGB pixels built from the rank-1 hypothesis.
- Element: one recovered row (the unit of evidence, one dot in the Confidence Grid).
- Reference: the PNG in corpus/reference made by a trusted converter at build time.
- Decoder family: a small, labelled, format-aware decoder for one hypothesis family (run-length rows with an optional colour table). Disclosed in the UI and README.

## Recoverer (T-08)
R-R1. When the analyzer returns status ok, the recoverer shall build content from the rank-1 hypothesis only, using the labelled decoder for its family.
R-R2. The recoverer shall output one element per recovered row, each with exactly one Evidence record whose byte ranges cover the body bytes that produced that row.
R-R3. Each row's Evidence shall name the rule in plain words (for example "repeated-byte run: a count byte followed by a value byte") and carry a confidence from 0 to 1.
R-R4. When the hypothesis has a colour table, each row's Evidence shall also cite the table byte range used to colour it.
R-R5. The recoverer shall run self-checks and lower confidence, or mark the row unexplained, when a check fails: body bytes used exactly; row length equals stride; decoded width and height match the box numbers; no run crosses a row end unless the layout allows it.
R-R6. When a self-check fails for the whole image, the recoverer shall return status unrecovered with a plain-words reason, never a partial image claimed as correct.
R-R7. The recoverer shall be deterministic and shall not throw on any input. Errors become unrecovered with a reason.
R-R8. The recoverer shall never read the reference while building content.
R-R9. The decoder shall live in one file headed "FORMAT-AWARE (disclosed)" and shall contain no format name.

## Verifier (T-09)
R-V1. When a reference exists, the verifier shall compare recovered RGB pixels with the reference and report exact (true or false), the mismatch count, and a mismatch list (row, column, expected, actual), capped at 1000 entries with the total count kept.
R-V2. When the sizes differ, the verifier shall report not exact with a plain-words reason and shall not compare pixels.
R-V3. When no reference exists (a file the user dropped in), the verifier shall report "no reference available" and show evidence and confidence only. It shall never claim correctness.
R-V4. The verifier shall produce a report object that can be downloaded as JSON (evidence report) beside the recovered image as PNG (F-05).
R-V5. The verifier shall be deterministic and run in the browser with no network.
R-V6. Reference loading shall happen only after recovery is complete (R-R8).

## Robustness (T-10)
R-X1. When the input is corrupted, truncated, empty or over 10 MB, the pipeline shall end as unrecovered with a plain-words reason and shall not crash (R-11).
R-X2. A mutation set shall be built from tuning samples: altered magic bytes, removed magic bytes, shifted header offsets, cut tails, flipped body bytes.
R-X3. On the mutation set, every file shall be recovered exactly or reported unrecovered. It shall never be reported as recovered with confidence 0.9 or more while not exact. "Exact" means equal to the trusted converter's decode of the mutated file itself (Pillow, build time). When the trusted converter refuses the mutated file, any recovered result with confidence 0.9 or more counts as wrong, with one exception: when the mutation changes only the signature byte (first byte), the pixel data is untouched, so the truth is the source sample's reference. Recovering it exactly despite the changed signature is the intended behaviour, and the engine shall not add a signature check (guardrail 2). (Ruling 2026-11-25: a flipped body byte or an altered size can still be a valid, different picture; the source sample's reference is not the truth for it.)

## Acceptance (maps to roadmap)
- T-08: output matches the reference on every non-held-out sample (11 of 11).
- T-09: report correct on matching, mismatching and reference-less input.
- T-10: no crash across the fuzz set; mutation rule R-X3 holds.

## Known limits (say them in docs)
- The decoder is format-aware and labelled. Only the analyzer is generic.
- Exact matches on the tuning set are not a blind result. The blind test is T-12.
