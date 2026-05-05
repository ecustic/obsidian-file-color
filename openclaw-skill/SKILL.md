---
name: obsidian-file-color-cli
description: Use this skill when an OpenClaw agent needs to list, set, or remove Obsidian File Color mappings for files or folders in a vault.
---

# Obsidian File Color CLI

Use this repo's CLI to update File Color settings. Always pass `--vault <vault>`.

```bash
PLUGIN_REPO=/path/to/obsidian-file-color
npm --prefix "$PLUGIN_REPO" run cli-build
node "$PLUGIN_REPO/openclaw-file-color-cli.cjs" list --vault <vault>
```

Set or remove a color mapping:

```bash
node "$PLUGIN_REPO/openclaw-file-color-cli.cjs" set --vault <vault> --path "Projects" --color "#4488ff"
node "$PLUGIN_REPO/openclaw-file-color-cli.cjs" remove --vault <vault> --path "Projects"
```

If installed or linked, `obsidian-file-color-cli ...` may be used instead.

## Safety

- Prefer `--dry-run` before mutating settings.
- Parse `ok`, `fileColors`, `palette`, and `error.message`.
- Vault-relative paths must not be absolute or contain `..`.

