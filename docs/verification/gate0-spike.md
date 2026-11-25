# Gate 0 spike (T-04)

Result: **11 of 11 tuning samples recovered exactly** (0 mismatching RGB values). Held-out file not opened. The spike code was deleted after this run, as the roadmap says.

## Sample
Headline sample: `vgrad-fire-97x61` (vertical gradient, 8339 bytes). Inference saw its bytes only. The reference PNG was read after inference, for comparison.

## What the detectors found (vgrad-fire-97x61)
- Header-like block: first 128 bytes (smallest power-of-two boundary where the rest decodes exactly).
- Size block: four small 16-bit numbers at offset 4 give a 97 x 61 box.
- Row stride: 98 bytes (a 16-bit number in the header, just above the width). Rows hold 98 values; 97 are pixels.
- Run-length bytes: bytes with the top two bits set carry a count in the low 6 bits, then one value. Trial decoding picked this over two other masks.
- Palette-like tail: last 768 bytes (256 x 3), at offset 7571, plus 1 separator byte before it.
- Match: true. Mismatches: 0 of 17751 RGB values.

## All samples (same code, no per-sample settings)
    hgrad-gray-64x48: match true mismatches 0 | 64x48 stride 64 header 128 boxAt 4 tail 769 paletteAt 285 mask 0xc0 candidates 3
    vgrad-fire-97x61: match true mismatches 0 | 97x61 stride 98 header 128 boxAt 4 tail 769 paletteAt 7571 mask 0xc0 candidates 4
    shapes-rand-128x96: match true mismatches 0 | 128x96 stride 128 header 128 boxAt 4 tail 769 paletteAt 1746 mask 0xc0 candidates 2
    checker8-ocean-80x80: match true mismatches 0 | 80x80 stride 80 header 128 boxAt 4 tail 769 paletteAt 1729 mask 0xc0 candidates 1
    checker1-gray-65x33: match true mismatches 0 | 65x33 stride 66 header 128 boxAt 4 tail 769 paletteAt 3379 mask 0xc0 candidates 6
    stripes-rand-200x40: match true mismatches 0 | 200x40 stride 200 header 128 boxAt 4 tail 769 paletteAt 3329 mask 0xc0 candidates 1
    text-fire-160x32: match true mismatches 0 | 160x32 stride 160 header 128 boxAt 4 tail 769 paletteAt 1200 mask 0xc0 candidates 1
    rings-rand-111x111: match true mismatches 0 | 111x111 stride 112 header 128 boxAt 4 tail 769 paletteAt 4712 mask 0xc0 candidates 3
    diag-ocean-256x16: match true mismatches 0 | 256x16 stride 256 header 128 boxAt 4 tail 769 paletteAt 5081 mask 0xc0 candidates 5
    solid-gray-32x32: match true mismatches 0 | 32x32 stride 32 header 128 boxAt 4 tail 769 paletteAt 193 mask 0xc0 candidates 583
    tiny-rand-7x5: match true mismatches 0 | 7x5 stride 8 header 128 boxAt 4 tail 769 paletteAt 170 mask 0xc0 candidates 5
    recovered exactly: 11 of 11

Count: 11 of 11 exact.

## Honest notes
- **Generic:** header-size search, box finder (4 small numbers), stride finder, palette-tail test, alignment preference, and trial decoding that must use every body byte exactly.
- **Format-aware:** the decoder (`decode-rle.mjs`). It encodes the run rule (marker bits plus count, then value) and the use of a 256-entry colour table. It is disclosed as a labelled decoder. The marker masks (0xC0, 0x80, 0xE0) and header/tail sizes (768, 769, 0) were written in by me as search lists, so they are guesses I chose, not discoveries from the bytes. The box detector (four numbers: min x, min y, max x, max y) is also a guess about layout.
- No specification text was read. I did write these guesses from general knowledge of how such files tend to look, so "without prior knowledge" is not true. The claim "without the specification file or its text" is true.
- The first run gave 9 of 11. Two samples picked a wrong, smaller header. I then added tie-break rules (prefer larger decoded area, prefer a round header size) after seeing the failures on the tuning samples. After one more fix that gave 11 of 11. These rules are tuned on the 11 samples, so 11 of 11 is a tuned score, not a blind score.
- 11 samples are all from one generator (same writer, same 128-byte header). They share a layout, so this is weak evidence about other files.

## Not verified
- Held-out file: not run (never opened).
- Files with altered headers: not tried.
- Corrupt, truncated or empty input: not tried (this spike does not handle them).

## Go / no-go for Gate 0
**Go, with a limit.** The idea works end to end on our corpus: bytes in, exact pixels out, compared against a reference. Before Gate 0 is called passed: run the held-out file once, with detector code frozen, and try altered headers. Weakest point: tie-break rules were tuned on the tuning samples, and the decoder plus search lists carry format knowledge.
