#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL=${1:-${BACKEND_URL:-}}
FRONTEND_URL=${2:-${FRONTEND_URL:-}}

if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
  echo "Usage: scripts/validate-deploy.sh <backend_url> <frontend_url>" >&2
  echo "Example: scripts/validate-deploy.sh https://api.example.com https://app.example.com" >&2
  echo "Or set BACKEND_URL and FRONTEND_URL env vars." >&2
  exit 1
fi

if [[ "$BACKEND_URL" != http* ]] || [[ "$FRONTEND_URL" != http* ]]; then
  echo "Error: URLs must include scheme (https://)." >&2
  exit 1
fi

echo "== Backend health check =="
curl -fsS "$BACKEND_URL/api/health" >/dev/null

echo "== CORS preflight check =="
headers=$(curl -is -X OPTIONS "$BACKEND_URL/api/health-status" \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type")

echo "$headers" | rg -n "^HTTP/|access-control-allow-origin|access-control-allow-methods" || true

if ! echo "$headers" | rg -q "access-control-allow-origin: $FRONTEND_URL"; then
  echo "CORS check failed: access-control-allow-origin did not match $FRONTEND_URL" >&2
  exit 1
fi

if ! echo "$headers" | rg -q "access-control-allow-methods: .*GET"; then
  echo "CORS check failed: allow-methods missing GET" >&2
  exit 1
fi

echo "== Frontend smoke check =="
front_status=$(curl -Is "$FRONTEND_URL" | head -n 1)
echo "$front_status"

if ! echo "$front_status" | rg -q "200|301|302"; then
  echo "Frontend check failed: unexpected status" >&2
  exit 1
fi

echo "All checks passed."
