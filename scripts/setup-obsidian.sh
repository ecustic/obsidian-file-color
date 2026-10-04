#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNPACKED="$ROOT/.obsidian-unpacked"
SOURCE="${OBSIDIAN_PATH:-}"

if [[ -z "$SOURCE" ]]; then
  if [[ "$(uname -s)" == "Darwin" ]]; then
    SOURCE="/Applications/Obsidian.app"
  else
    printf '%s\n' 'Set OBSIDIAN_PATH to an installed Obsidian app/resources directory or app.asar.' >&2
    exit 1
  fi
fi

if [[ -d "$SOURCE" ]]; then
  if [[ -f "$SOURCE/Contents/Resources/app.asar" ]]; then
    ASAR="$SOURCE/Contents/Resources/app.asar"
    OBSIDIAN_ASAR="${OBSIDIAN_ASAR:-$SOURCE/Contents/Resources/obsidian.asar}"
  elif [[ -f "$SOURCE/resources/app.asar" ]]; then
    ASAR="$SOURCE/resources/app.asar"
    OBSIDIAN_ASAR="${OBSIDIAN_ASAR:-$SOURCE/resources/obsidian.asar}"
  elif [[ -f "$SOURCE/app.asar" ]]; then
    ASAR="$SOURCE/app.asar"
    OBSIDIAN_ASAR="${OBSIDIAN_ASAR:-}"
  else
    printf 'Could not find app.asar under OBSIDIAN_PATH=%s\n' "$SOURCE" >&2
    exit 1
  fi
elif [[ -f "$SOURCE" ]]; then
  ASAR="$SOURCE"
else
  printf 'Obsidian path does not exist: %s\n' "$SOURCE" >&2
  exit 1
fi

mkdir -p "$UNPACKED"
if [[ -z "${OBSIDIAN_ASAR:-}" || ! -f "$OBSIDIAN_ASAR" ]]; then
  printf 'Could not find the Obsidian app package (obsidian.asar) next to %s; set OBSIDIAN_ASAR.\n' "$ASAR" >&2
  exit 1
fi
node - "$ASAR" "$OBSIDIAN_ASAR" "$UNPACKED" <<'NODE'
const asar = require('@electron/asar')
const fs = require('fs')
const path = require('path')
const source = process.argv[2]
const appPackage = process.argv[3]
const destination = process.argv[4]
asar.extractAll(source, destination)
fs.copyFileSync(appPackage, path.join(destination, 'obsidian.asar'))
NODE
if [[ -d "$SOURCE/Contents/Frameworks/Electron Framework.framework" ]]; then
  ELECTRON_VERSION="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$SOURCE/Contents/Frameworks/Electron Framework.framework/Resources/Info.plist")"
elif [[ -n "${OBSIDIAN_ELECTRON_VERSION:-}" ]]; then
  ELECTRON_VERSION="$OBSIDIAN_ELECTRON_VERSION"
else
  printf '%s\n' 'Set OBSIDIAN_ELECTRON_VERSION to the app bundle Electron version on non-macOS hosts.' >&2
  exit 1
fi
printf '%s\n' "$ELECTRON_VERSION" > "$UNPACKED/electron-version"
printf 'Unpacked Obsidian app from %s into %s\n' "$ASAR" "$UNPACKED"
