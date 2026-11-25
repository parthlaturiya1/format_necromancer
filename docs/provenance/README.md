# Provenance recorder

`ledger.jsonl` is append only: one JSON line per Kiro event. Never edit or delete lines.
Line keys: `ts`, `event`, `agent`, `taskId`, `summary` (secrets redacted), `head` (git HEAD), optional `data` (`tool`, `path`, `session`, `prompt`, `lastVerify`).

- Record by hand: `node scripts/provenance/record.mjs --event E --agent A --task T-02 --summary "text" [--path P]`. Optional hook JSON on stdin.
- Check: `npm run provenance:check` lists committed file changes with no ledger entry as `UNATTRIBUTED`. Warning only, exit 0. `npm run verify` copies them into `docs/verification/latest.md`.

## Hooks: `.kiro/hooks/provenance.json`
Format source: [Hooks](https://kiro.dev/docs/hooks/) (schema `version: "v1"`, `hooks[].name/trigger/action/timeout`) and [What's new in 1.0: Hooks](https://kiro.dev/docs/ide/whats-new-v1/hooks/) (trigger names). Read 2026-11-25.

| Wanted | Trigger used |
|---|---|
| Prompt Submit | `UserPromptSubmit` |
| Post Tool Use | `PostToolUse` |
| File Create / Save / Delete | `PostFileCreate` / `PostFileSave` / `PostFileDelete` |
| Agent Stop | `Stop` |
| Pre / Post Task Execution | `PreTaskExec` / `PostTaskExec` |

**Not tested.** Hook firing needs the Kiro IDE; none of these hooks was run inside Kiro. Only `record.mjs` was run directly.

## UNKNOWN
- UNKNOWN: stdin JSON keys for the file triggers. File hooks pass `--path "{{filePath}}"` (template variable named in the docs); if Kiro does not fill it, the path is wrong or empty.
- UNKNOWN: stdin keys for task triggers. No spec task ID is recorded, so `taskId` is `unknown` on those lines.
- UNKNOWN: file size change for create/save/delete. Not recorded.
- UNKNOWN: whether `UserPromptSubmit` stdin carries `prompt`. One third-party capture shows an empty prompt in IDE 1.0.242. The prompt is stored only if present.
- UNKNOWN: `PostToolUse` `tool_input` may be empty in the IDE (third-party capture), so the path may be missing. Only tool name and path are kept.
- UNKNOWN: whether `.kiro/hooks/` accepts several hooks in one file on every surface; the docs say it does.
