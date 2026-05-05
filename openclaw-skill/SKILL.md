---
name: obsidian-file-color-cli
description: Use this skill when an OpenClaw agent needs to list, set, or remove Obsidian File Color mappings for files or folders in a vault.
---

# Obsidian File Color CLI

Use the CLI shipped in the installed plugin folder. Always pass `--vault <vault>`.

```bash
VAULT=/path/to/vault
CLI="$VAULT/.obsidian/plugins/obsidian-file-color/openclaw-file-color-cli.cjs"
node "$CLI" list --vault "$VAULT"
```

Set or remove a color mapping:

```bash
node "$CLI" set --vault "$VAULT" --path "Projects" --color "#4488ff"
node "$CLI" remove --vault "$VAULT" --path "Projects"
```

If the installed plugin does not include the CLI yet, use `obsidian-file-color-cli` from `PATH` or `node "$PLUGIN_REPO/openclaw-file-color-cli.cjs"` from a checkout.

## Safety

- Prefer `--dry-run` before mutating settings.
- Parse `ok`, `fileColors`, `palette`, and `error.message`.
- Vault-relative paths must not be absolute or contain `..`.

