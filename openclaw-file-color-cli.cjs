#!/usr/bin/env node
"use strict";

process.env.OPENCLAW_PLUGIN_CONFIG = JSON.stringify({
  pluginId: "obsidian-file-color",
  installedId: "obsidian-file-color",
  bin: "obsidian-file-color-cli",
  domain: "file-colors",
  capabilities: ["settings", "file-color-settings"],
  commands: ["list", "set", "remove"],
});
require("./openclaw-plugin-cli.cjs");
