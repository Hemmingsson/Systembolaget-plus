#!/usr/bin/env sh
set -eu
# DEX is optional local agent tooling, installed separately from the extension.
if ! command -v dex >/dev/null 2>&1; then
  echo 'DEX is not installed. Supply a compatible dex CLI on PATH to use agent tasks.' >&2
  exit 1
fi
exec dex "$@"
