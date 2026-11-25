"""Build-time only (T-10, R-X3). Decodes every file in corpus/mutations/manifest.json with Pillow,
the trusted converter, and writes corpus/mutations/reference/<name>.png. Records path and sha256 in
the manifest, or "refused" with Pillow's error text when Pillow will not decode the file (its
expected outcome is then 'unrecovered'). Truncated-image loading stays OFF (Pillow default).
Run after scripts/corpus/mutate.mjs: python scripts/corpus/mutation-reference.py"""
import hashlib
import json
from pathlib import Path

import PIL
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MUT = ROOT / "corpus" / "mutations"


def main():
    mpath = MUT / "manifest.json"
    m = json.loads(mpath.read_text())
    out = MUT / "reference"
    out.mkdir(parents=True, exist_ok=True)
    ok = refused = 0
    for e in m["entries"]:
        src = ROOT / e["file"]
        png = out / (src.stem + ".png")
        try:
            with Image.open(src) as dec:
                dec.load()
                dec.save(png, format="PNG", optimize=False)
            e["reference"] = {"path": png.relative_to(ROOT).as_posix(), "sha256": hashlib.sha256(png.read_bytes()).hexdigest()}
            ok += 1
        except Exception as err:  # any refusal by the trusted converter is recorded, never hidden
            if png.exists():
                png.unlink()
            # Keep only the error kind and repo-relative text: no local paths in a public repo.
            msg = str(err).replace(str(src), e["file"]).replace(str(src).replace("\\", "\\\\"), e["file"])
            e["reference"] = {"refused": f"{type(err).__name__}: {msg}"}
            refused += 1
    m["referenceTool"] = f"Pillow {PIL.__version__} decode of the mutated file itself, saved as PNG"
    mpath.write_text(json.dumps(m, indent=1) + "\n", newline="\n")
    print(f"mutation references: {ok} decoded, {refused} refused")


if __name__ == "__main__":
    main()
