# Golden report (T-06 analyzer v1)

Rank-1 layout equals the Gate 0 spike layout on **11 of 11** tuning samples.

This is a tuned score, not a blind one. The tie-break (larger area, then rounder header) and the search lists in `src/engine/config.ts` come from the spike, which chose them after seeing these samples. All samples share one generator. The held-out file was not read. The analyzer returns layouts, not pixels. The trial decode in `src/engine/trial-decode.ts` is format-aware and disclosed.

### hgrad-gray-64x48 (1053 bytes)
- Rank 1 (h1): box 64x48 at byte 4, row length 64, header 128 bytes, run mask 0xc0, end table 769 bytes at 284.
- Confidence: 1. Evidence records: 8. Hypotheses: 12.
- Matches the spike layout: **yes**.
- Why the others lost:
  - h2 (confidence 0.4, header 256, mask 0x80, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h3 (confidence 0.4, header 256, mask 0xc0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h4 (confidence 0.4, header 256, mask 0xe0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - 8 more, each with a recorded reason.

### vgrad-fire-97x61 (8339 bytes)
- Rank 1 (h1): box 97x61 at byte 4, row length 98, header 128 bytes, run mask 0xc0, end table 769 bytes at 7570.
- Confidence: 1. Evidence records: 9. Hypotheses: 12.
- Matches the spike layout: **yes**.
- Why the others lost:
  - h2 (confidence 0.4, header 512, mask 0x80, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h3 (confidence 0.4, header 512, mask 0xc0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h4 (confidence 0.4, header 512, mask 0xe0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - 8 more, each with a recorded reason.

### shapes-rand-128x96 (2514 bytes)
- Rank 1 (h1): box 128x96 at byte 4, row length 128, header 128 bytes, run mask 0xc0, end table 769 bytes at 1745.
- Confidence: 1. Evidence records: 7. Hypotheses: 12.
- Matches the spike layout: **yes**.
- Why the others lost:
  - h2 (confidence 0.4, header 512, mask 0x80, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h3 (confidence 0.4, header 512, mask 0xc0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h4 (confidence 0.4, header 512, mask 0x80, table 769, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - 8 more, each with a recorded reason.

### checker8-ocean-80x80 (2497 bytes)
- Rank 1 (h1): box 80x80 at byte 4, row length 80, header 128 bytes, run mask 0xc0, end table 769 bytes at 1728.
- Confidence: 1. Evidence records: 10. Hypotheses: 12.
- Matches the spike layout: **yes**.
- Why the others lost:
  - h2 (confidence 0.4, header 512, mask 0x80, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h3 (confidence 0.4, header 512, mask 0xc0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h4 (confidence 0.4, header 512, mask 0xe0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - 8 more, each with a recorded reason.

### checker1-gray-65x33 (4147 bytes)
- Rank 1 (h1): box 65x33 at byte 4, row length 66, header 128 bytes, run mask 0xc0, end table 769 bytes at 3378.
- Confidence: 1. Evidence records: 9. Hypotheses: 12.
- Matches the spike layout: **yes**.
- Why the others lost:
  - h2 (confidence 0.4, header 512, mask 0x80, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h3 (confidence 0.4, header 512, mask 0xc0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h4 (confidence 0.4, header 512, mask 0xe0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - 8 more, each with a recorded reason.

### stripes-rand-200x40 (4097 bytes)
- Rank 1 (h1): box 200x40 at byte 4, row length 200, header 128 bytes, run mask 0xc0, end table 769 bytes at 3328.
- Confidence: 1. Evidence records: 8. Hypotheses: 12.
- Matches the spike layout: **yes**.
- Why the others lost:
  - h2 (confidence 0.4, header 512, mask 0x80, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h3 (confidence 0.4, header 512, mask 0xc0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h4 (confidence 0.4, header 512, mask 0xe0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - 8 more, each with a recorded reason.

### text-fire-160x32 (1968 bytes)
- Rank 1 (h1): box 160x32 at byte 4, row length 160, header 128 bytes, run mask 0xc0, end table 769 bytes at 1199.
- Confidence: 1. Evidence records: 10. Hypotheses: 12.
- Matches the spike layout: **yes**.
- Why the others lost:
  - h2 (confidence 0.9, header 64, mask 0xc0, table 769, box 160x32): Lower confidence (0.9 against 1): its row length is not stored in the header.
  - h3 (confidence 0.4, header 512, mask 0x80, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h4 (confidence 0.4, header 512, mask 0xc0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - 8 more, each with a recorded reason.

### rings-rand-111x111 (5480 bytes)
- Rank 1 (h1): box 111x111 at byte 4, row length 112, header 128 bytes, run mask 0xc0, end table 769 bytes at 4711.
- Confidence: 1. Evidence records: 8. Hypotheses: 12.
- Matches the spike layout: **yes**.
- Why the others lost:
  - h2 (confidence 0.4, header 512, mask 0x80, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h3 (confidence 0.4, header 512, mask 0xc0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h4 (confidence 0.4, header 512, mask 0x80, table 769, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - 8 more, each with a recorded reason.

### diag-ocean-256x16 (5849 bytes)
- Rank 1 (h1): box 256x16 at byte 4, row length 256, header 128 bytes, run mask 0xc0, end table 769 bytes at 5080.
- Confidence: 1. Evidence records: 9. Hypotheses: 12.
- Matches the spike layout: **yes**.
- Why the others lost:
  - h2 (confidence 0.9, header 64, mask 0xc0, table 769, box 256x16): Lower confidence (0.9 against 1): its row length is not stored in the header.
  - h3 (confidence 0.4, header 512, mask 0xc0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h4 (confidence 0.4, header 512, mask 0xc0, table 769, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - 8 more, each with a recorded reason.

### solid-gray-32x32 (961 bytes)
- Rank 1 (h1): box 32x32 at byte 4, row length 32, header 128 bytes, run mask 0xc0, end table 769 bytes at 192.
- Confidence: 1. Evidence records: 9. Hypotheses: 12.
- Matches the spike layout: **yes**.
- Why the others lost:
  - h2 (confidence 0.9, header 64, mask 0xc0, table 769, box 32x32): Lower confidence (0.9 against 1): its row length is not stored in the header.
  - h3 (confidence 0.4, header 128, mask 0x80, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h4 (confidence 0.4, header 128, mask 0xc0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - 8 more, each with a recorded reason.

### tiny-rand-7x5 (938 bytes)
- Rank 1 (h1): box 7x5 at byte 4, row length 8, header 128 bytes, run mask 0xc0, end table 769 bytes at 169.
- Confidence: 1. Evidence records: 7. Hypotheses: 12.
- Matches the spike layout: **yes**.
- Why the others lost:
  - h2 (confidence 0.4, header 128, mask 0x80, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h3 (confidence 0.4, header 128, mask 0xc0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - h4 (confidence 0.4, header 128, mask 0xe0, table 768, box none): Lower confidence (0.4 against 1): no size numbers were found in its header.
  - 8 more, each with a recorded reason.
