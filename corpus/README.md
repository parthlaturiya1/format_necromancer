# Corpus

Our own synthetic PCX images (8-bit palette, drawn by code, CC0-1.0). No downloaded art.

- `samples/`: 11 tuning samples. `reference/`: PNG made by Pillow decoding each PCX (tool is named in the manifest).
- `heldout/`: 1 sealed sample. Never open it in tuning code. Only `scripts/corpus/validate.mjs` hashes it. It has no reference PNG here, and the manifest lists only its path and sha256.
- List samples for tuning only through `scripts/corpus/list-tuning-samples.mjs`.

## Regenerate

```
python -m pip install --user -r scripts/corpus/requirements.txt
python scripts/corpus/generate.py
npm run corpus:validate
```

Pillow is pinned (13.0.0) and used at build time only. The corpus is about 60 KB.

## Determinism

No clock and no unseeded randomness; palettes use fixed seeds. Running the generator twice gives identical file hashes (checked for T-03). A different Pillow version may change PCX or PNG bytes, so the manifest hashes then change. Regenerate and review.
