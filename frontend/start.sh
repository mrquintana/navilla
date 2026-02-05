#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

npm run build

PORT=${PORT:-4173}
exec npm run preview -- --host 0.0.0.0 --port "$PORT"
