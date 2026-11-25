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

Schema confirmed 2026-11-25 (T-02b) against the file this IDE's own hook tool generates: `{version:"v1", hooks:[{name, trigger, description, matcher?, action:{type:"command", command, timeout}}]}`. `timeout` belongs inside `action`; the T-02 file had it on the hook, which is the likely reason no hook fired. Command hooks get the event payload as JSON on stdin. The generated schema has no `{{filePath}}` template, so file hooks rely on the stdin path. Hooks load only at session start: a hook file changed mid-session takes effect in the next session.

**Firing not yet observed.** In the T-02b session no hook fired (0 ledger lines from agent edits, 0 probe lines). Re-checked in a second pass: `createHook` output for a `PostFileSave` command hook is identical in shape to `provenance.json` (timeout inside `action`), files have no BOM and parse as JSON, and a journal edit still added no ledger line (18 lines before and after) and no `tmp-hookdebug/raw.log`. The corrected file is untested until a new session runs.

## UNKNOWN (open until a new session captures a real payload)
A probe hook `.kiro/hooks/zz-probe-save.json` writes the raw PostFileSave stdin to `tmp-hookdebug/raw.log`. Read it next session, fill these keys in, then delete the probe and `tmp-hookdebug/`.
- UNKNOWN: stdin key that holds the path for file triggers. `record.mjs` tries `path`, `file_path`, `filePath`, `tool_input.*`.
- UNKNOWN: stdin keys for task triggers, so `taskId` is `unknown` on those lines.
- UNKNOWN: file size change for create, save and delete. Not recorded.
- UNKNOWN: whether `UserPromptSubmit` stdin carries `prompt`. Stored only if present.
- UNKNOWN: whether `PostToolUse` stdin carries `tool_name` and `tool_input`.