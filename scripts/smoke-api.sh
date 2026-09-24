#!/usr/bin/env bash
# Post-deploy smoke test for the public API.
# Usage: scripts/smoke-api.sh https://<api-id>.execute-api.<region>.amazonaws.com
set -uo pipefail

API="${1:?usage: smoke-api.sh <api-url>}"
API="${API%/}"
failures=0

check() { # check <description> <command...>
  local name=$1; shift
  if "$@"; then echo "PASS  $name"; else echo "FAIL  $name"; failures=$((failures + 1)); fi
}
status_is() { [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$API$1")" = "$2" ]; }

# Warm up once so the timing check measures a warm invocation (cold start is covered by SC-002 separately).
curl -s -o /dev/null --max-time 20 "$API/products"

products=$(curl -s --max-time 15 "$API/products")
headers=$(curl -s -D - -o /dev/null --max-time 15 "$API/products" | tr 'A-Z' 'a-z')
read -r warm_status warm_seconds < <(curl -s -o /dev/null -w '%{http_code} %{time_total}' --max-time 15 "$API/products")

check "GET /products returns the 4 seeded products" \
  test "$(printf '%s' "$products" | grep -o '"availableUnits"' | wc -l | tr -d ' ')" = 4
check "GET /docs serves the API documentation" status_is /docs 200
check "GET /products/abc is rejected with 400" status_is /products/abc 400
check "responses send x-content-type-options: nosniff" grep -q 'x-content-type-options: nosniff' <<<"$headers"
check "responses send a content-security-policy" grep -q '^content-security-policy:' <<<"$headers"
check "responses hide x-powered-by" bash -c 'grep -q "^http/[0-9.]* 200" <<<"$0" && ! grep -q "^x-powered-by:" <<<"$0"' "$headers"
check "warm GET /products answers in < 1 s (${warm_seconds}s)" awk -v s="$warm_status" -v t="$warm_seconds" 'BEGIN { exit !(s == 200 && t < 1) }'

echo
if [ "$failures" -gt 0 ]; then echo "$failures check(s) failed"; exit 1; fi
echo "All checks passed"
