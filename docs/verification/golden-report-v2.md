# Golden report v2 (T-07 analyzer v2)

Rank-1 layout equals the T-06 layout (which equals the Gate 0 spike layout) on **11 of 11** tuning samples. Rank-1 confidence fell on **0** samples.

Samples on which each generic detector fired: repeat-runs 11, repeat-structures 4, run-pairs 7, palette 6, table-records 11.

The detectors add supporting evidence only. They do not change any confidence or ranking, because rank-1 confidence was already 1 on every sample (T-06), so there was no room to raise it. A detector that fires on no sample, or on all of them, did not help tell samples apart.

This is a tuned score, not a blind one. The tie-break, the search lists and the new detector thresholds in `src/engine/config.ts` are guesses chosen with these samples in view. All samples share one generator. The held-out file was not read. The analyzer returns layouts, not pixels.

### hgrad-gray-64x48 (1053 bytes)
- Rank-1 confidence: T-06 1, T-07 1. Evidence records: T-06 5, T-07 8.
- Rank-1 layout equals T-06 (and so the spike): **yes**.
- Generic detectors fired: 
  - palette (confidence 0.902): 32..800, 847..895. 2 block(s) of 256, 16 three-byte entries whose neighbours change by at most 24 per byte on average and are almost all different.
  - repeat-runs (confidence 0.099): 15..40, 40..64, 73..128. 3 stretch(es) of one repeated byte, each at least 16 bytes long, 104 bytes in all.
  - table-records (confidence 0.31): 0..216, 240..1042. 2 region(s) of fixed-width records (widths 24, 2 bytes) where between 25% and 90% of bytes equal the byte one record earlier.

### vgrad-fire-97x61 (8339 bytes)
- Rank-1 confidence: T-06 1, T-07 1. Evidence records: T-06 5, T-07 9.
- Rank-1 layout equals T-06 (and so the spike): **yes**.
- Generic detectors fired: 
  - palette (confidence 0.906): 88..472, 472..856, 856..1240, 1240..1624, 1624..2008, 2008..2392, 2392..2776, 2776..3160, 3160..3544, 3544..3928, 3928..4312, 4312..4696, 4696..5080, 5080..5464, 5464..5848, 5849..6233. 16 block(s) of 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128 three-byte entries whose neighbours change by at most 24 per byte on average and are almost all different.
  - repeat-runs (confidence 0.013): 15..40, 40..64, 73..129. 3 stretch(es) of one repeated byte, each at least 16 bytes long, 105 bytes in all.
  - run-pairs (confidence 1): 128..7570. In the body, 732 bytes whose top 3 bit(s) are all set are followed by a byte that is not one (100% of such bytes; random data would give about 88%).
  - table-records (confidence 0.236): 0..150, 192..264, 320..392, 448..520, 1024..1096, 1152..1224, 1280..1352, 1408..1480, 1536..1608, 1664..1736, 1792..1864, 2368..2440, 2496..2568, 2624..2696, 2752..2824, 7488..8280. 16 region(s) of fixed-width records (widths 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 24 bytes) where between 25% and 90% of bytes equal the byte one record earlier.

### shapes-rand-128x96 (2514 bytes)
- Rank-1 confidence: T-06 1, T-07 1. Evidence records: T-06 5, T-07 7.
- Rank-1 layout equals T-06 (and so the spike): **yes**.
- Generic detectors fired: 
  - repeat-runs (confidence 0.041): 15..40, 40..64, 73..128. 3 stretch(es) of one repeated byte, each at least 16 bytes long, 104 bytes in all.
  - table-records (confidence 0.222): 0..288, 544..580, 640..676, 768..822, 864..918, 1536..1752. 6 region(s) of fixed-width records (widths 32, 4, 4, 6, 6, 24 bytes) where between 25% and 90% of bytes equal the byte one record earlier.

### checker8-ocean-80x80 (2497 bytes)
- Rank-1 confidence: T-06 1, T-07 1. Evidence records: T-06 5, T-07 10.
- Rank-1 layout equals T-06 (and so the spike): **yes**.
- Generic detectors fired: 
  - palette (confidence 0.902): 1641..2409, 2442..2490. 2 block(s) of 256, 16 three-byte entries whose neighbours change by at most 24 per byte on average and are almost all different.
  - repeat-runs (confidence 0.042): 15..40, 40..64, 73..128. 3 stretch(es) of one repeated byte, each at least 16 bytes long, 104 bytes in all.
  - repeat-structures (confidence 0.641): 128..288, 288..448, 448..608, 608..768, 768..928, 928..1088, 1088..1248, 1248..1408, 1408..1568, 1568..1728. 10 stretch(es) where a block of the same size repeats back to back at least 4 times, 1600 bytes in all.
  - run-pairs (confidence 1): 128..1728. In the body, 400 bytes whose top 3 bit(s) are all set are followed by a byte that is not one (100% of such bytes; random data would give about 88%).
  - table-records (confidence 0.53): 0..1734. 1 region(s) of fixed-width records (widths 6 bytes) where between 25% and 90% of bytes equal the byte one record earlier.

### checker1-gray-65x33 (4147 bytes)
- Rank-1 confidence: T-06 1, T-07 1. Evidence records: T-06 5, T-07 9.
- Rank-1 layout equals T-06 (and so the spike): **yes**.
- Generic detectors fired: 
  - repeat-runs (confidence 0.025): 15..40, 40..64, 73..128. 3 stretch(es) of one repeated byte, each at least 16 bytes long, 104 bytes in all.
  - repeat-structures (confidence 0.671): 128..224, 226..322, 325..421, 423..519, 522..618, 620..716, 719..815, 817..913, 916..1012, 1014..1110, 1113..1209, 1211..1307, 1310..1406, 1408..1504, 1507..1603, 1605..1701. 29 stretch(es) where a block of the same size repeats back to back at least 4 times, 2784 bytes in all.
  - run-pairs (confidence 1): 128..3378. In the body, 1072 bytes whose top 3 bit(s) are all set are followed by a byte that is not one (100% of such bytes; random data would give about 88%).
  - table-records (confidence 0.709): 0..3480. 1 region(s) of fixed-width records (widths 24 bytes) where between 25% and 90% of bytes equal the byte one record earlier.

### stripes-rand-200x40 (4097 bytes)
- Rank-1 confidence: T-06 1, T-07 1. Evidence records: T-06 5, T-07 8.
- Rank-1 layout equals T-06 (and so the spike): **yes**.
- Generic detectors fired: 
  - repeat-runs (confidence 0.025): 15..40, 40..64, 73..128. 3 stretch(es) of one repeated byte, each at least 16 bytes long, 104 bytes in all.
  - run-pairs (confidence 1): 128..3328. In the body, 160 bytes whose top 3 bit(s) are all set are followed by a byte that is not one (100% of such bytes; random data would give about 88%).
  - table-records (confidence 0.496): 0..3372. 1 region(s) of fixed-width records (widths 12 bytes) where between 25% and 90% of bytes equal the byte one record earlier.

### text-fire-160x32 (1968 bytes)
- Rank-1 confidence: T-06 1, T-07 1. Evidence records: T-06 5, T-07 10.
- Rank-1 layout equals T-06 (and so the spike): **yes**.
- Generic detectors fired: 
  - palette (confidence 0.914): 1089..1857, 1865..1913, 1913..1961. 3 block(s) of 256, 16, 16 three-byte entries whose neighbours change by at most 24 per byte on average and are almost all different.
  - repeat-runs (confidence 0.053): 15..40, 40..64, 73..128. 3 stretch(es) of one repeated byte, each at least 16 bytes long, 104 bytes in all.
  - repeat-structures (confidence 0.132): 128..206, 348..364, 546..558, 605..617, 670..682, 721..733, 782..794, 845..857, 862..874, 960..976, 1132..1198. 11 stretch(es) where a block of the same size repeats back to back at least 4 times, 260 bytes in all.
  - run-pairs (confidence 0.975): 128..1199. In the body, 310 bytes whose top 3 bit(s) are all set are followed by a byte that is not one (98% of such bytes; random data would give about 88%).
  - table-records (confidence 0.331): 0..1380, 1776..1954. 2 region(s) of fixed-width records (widths 4, 2 bytes) where between 25% and 90% of bytes equal the byte one record earlier.

### rings-rand-111x111 (5480 bytes)
- Rank-1 confidence: T-06 1, T-07 1. Evidence records: T-06 5, T-07 8.
- Rank-1 layout equals T-06 (and so the spike): **yes**.
- Generic detectors fired: 
  - repeat-runs (confidence 0.019): 15..40, 40..64, 73..128. 3 stretch(es) of one repeated byte, each at least 16 bytes long, 104 bytes in all.
  - run-pairs (confidence 1): 128..4711. In the body, 158 bytes whose top 3 bit(s) are all set are followed by a byte that is not one (100% of such bytes; random data would give about 88%).
  - table-records (confidence 0.222): 0..216, 512..530, 560..578, 592..610, 864..914, 928..964, 992..1028, 1104..1158, 1216..1348, 1408..1444, 1472..3364, 3424..3474, 3520..3588, 3840..3908, 3920..3954, 4192..4258. 16 region(s) of fixed-width records (widths 24, 2, 2, 2, 2, 4, 4, 6, 4, 4, 4, 2, 4, 4, 2, 2 bytes) where between 25% and 90% of bytes equal the byte one record earlier.

### diag-ocean-256x16 (5849 bytes)
- Rank-1 confidence: T-06 1, T-07 1. Evidence records: T-06 5, T-07 9.
- Rank-1 layout equals T-06 (and so the spike): **yes**.
- Generic detectors fired: 
  - palette (confidence 0.906): 87..471, 471..855, 873..1065, 1065..1257, 1298..1490, 1490..1682, 1682..1874, 1914..2106, 2106..2298, 2298..2490, 2533..2725, 2846..3038, 3159..3351, 3471..3663. 14 block(s) of 128, 128, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64 three-byte entries whose neighbours change by at most 24 per byte on average and are almost all different.
  - repeat-runs (confidence 0.018): 15..40, 40..64, 73..128. 3 stretch(es) of one repeated byte, each at least 16 bytes long, 104 bytes in all.
  - run-pairs (confidence 0.997): 128..5080. In the body, 391 bytes whose top 3 bit(s) are all set are followed by a byte that is not one (100% of such bytes; random data would give about 88%).
  - table-records (confidence 0.229): 0..150, 320..456, 640..784, 896..1040, 1216..1352, 1536..1680, 1792..1936, 2432..2576, 2752..2888, 3072..3216, 3392..3528, 3712..3856, 3968..4112, 4320..4470, 4608..4752, 5088..5835. 16 region(s) of fixed-width records (widths 6, 8, 16, 16, 8, 16, 16, 16, 8, 16, 8, 16, 16, 6, 16, 3 bytes) where between 25% and 90% of bytes equal the byte one record earlier.

### solid-gray-32x32 (961 bytes)
- Rank-1 confidence: T-06 1, T-07 1. Evidence records: T-06 5, T-07 9.
- Rank-1 layout equals T-06 (and so the spike): **yes**.
- Generic detectors fired: 
  - palette (confidence 0.902): 105..873, 906..954. 2 block(s) of 256, 16 three-byte entries whose neighbours change by at most 24 per byte on average and are almost all different.
  - repeat-runs (confidence 0.108): 15..40, 40..64, 73..128. 3 stretch(es) of one repeated byte, each at least 16 bytes long, 104 bytes in all.
  - repeat-structures (confidence 0.067): 127..191. 1 stretch(es) where a block of the same size repeats back to back at least 4 times, 64 bytes in all.
  - table-records (confidence 0.333): 0..136, 192..946. 2 region(s) of fixed-width records (widths 8, 2 bytes) where between 25% and 90% of bytes equal the byte one record earlier.

### tiny-rand-7x5 (938 bytes)
- Rank-1 confidence: T-06 1, T-07 1. Evidence records: T-06 5, T-07 7.
- Rank-1 layout equals T-06 (and so the spike): **yes**.
- Generic detectors fired: 
  - repeat-runs (confidence 0.111): 15..40, 40..64, 73..128. 3 stretch(es) of one repeated byte, each at least 16 bytes long, 104 bytes in all.
  - table-records (confidence 0.227): 0..216. 1 region(s) of fixed-width records (widths 24 bytes) where between 25% and 90% of bytes equal the byte one record earlier.
