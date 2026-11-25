# T-24c Related work: sources

Each README line, the URL opened, the date, and the supporting phrase. Opened by the T-24c worker on 2026-11-25. Phrases are short and paraphrased where not quoted.

| README line | URL opened | Date | Supporting phrase |
|---|---|---|---|
| Kaitai: declarative language, .ksy, compiled to parsers | https://github.com/kaitai-io/kaitai_struct ; https://kaitai.io/ | 2026-11-25 | "declarative language"; "described in Kaitai Struct language (.ksy file)"; compiled with kaitai-struct-compiler |
| Kaitai Web IDE exists | https://github.com/kaitai-io/kaitai_struct | 2026-11-25 | "official visualizers are Web IDE and the console visualizer ksv" (the Web IDE page itself was not opened) |
| Kaitai contrast: description written first | https://github.com/kaitai-io/kaitai_struct | 2026-11-25 | step 1 of "Using KS in your project": "Describe the format - i.e. create a .ksy file". No inference feature is mentioned on the pages read. |
| ImHex: hex editor, pattern language | https://github.com/WerWolv/ImHex | 2026-11-25 | "A Hex Editor for Reverse Engineers"; "Custom C++-like pattern language for parsing highlighting a file's content" |
| ImHex: auto-load by MIME type and magic | https://github.com/WerWolv/ImHex | 2026-11-25 | "Automatic loading based on MIME types and magic values" (loads a written pattern; not layout inference) |
| PolyFile: identify and map structure | https://github.com/trailofbits/polyfile | 2026-11-25 | "identify and map the semantic and syntactic structure of files"; "Python implementation of libmagic"; title: "instrumented parsing from Kaitai struct and an interactive hex viewer" |
| PolyFile contrast: magic matchers and existing parsers | https://github.com/trailofbits/polyfile | 2026-11-25 | "future recursive coverage will come from format parsers"; "A few matchers also search for their magic" |
| Oscura: Python hardware RE framework | https://pypi.org/pypi/oscura/json (PyPI metadata, v0.14.0); https://pypi.org/project/oscura/0.13.0/ appeared only in search | 2026-11-25 | "Python framework for hardware reverse engineering: signal analysis, protocol decoding, and automated dissector generation" |
| Oscura does inference | https://pypi.org/pypi/oscura/json | 2026-11-25 | "Protocol Inference - CRC recovery, state machine extraction, field detection, format identification, magic byte discovery"; "Statistical boundary inference" |
| Oscura repo 404 | https://github.com/oscura-re/oscura | 2026-11-25 | HTTP 404 on fetch; the repo URL is the one PyPI lists as Homepage |
| No-benchmark sentence | none | 2026-11-25 | Our own statement. Nothing was run. |

## Limits

- The Kaitai Web IDE page (ide.kaitai.io) was not opened. It is named only because the Kaitai README names it.
- The PyPI project HTML page returned a client challenge page. Oscura text comes from the PyPI JSON metadata (the package's own description).
- ImHex and PolyFile pages were fetched in truncated mode (first ~4 KB); other features of those tools may exist that we did not read.
- No other tool's inability is claimed.
