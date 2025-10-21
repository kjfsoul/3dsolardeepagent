#!/usr/bin/env bash
set -euo pipefail
git config core.hooksPath .githooks
chmod -R +x .githooks
echo "✅ Git hooks activated via core.hooksPath = .githooks"
