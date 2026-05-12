#!/usr/bin/env bash
# Fetch OpenAPI specs from the three running services into docs/api/*.json.
# Requires `docker compose up -d` first.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT/docs/api"
mkdir -p "$OUT_DIR"

declare -A SPECS=(
  [iam]="http://localhost:3001/api/v1/openapi.json"
  [supplier]="http://localhost:3002/api/v1/openapi.json"
  [po]="http://localhost:3003/api/v1/openapi.json"
)

for name in "${!SPECS[@]}"; do
  url="${SPECS[$name]}"
  out="$OUT_DIR/$name.json"
  echo "Fetching $name -> $out"
  if ! curl -fsS "$url" -o "$out"; then
    echo "ERROR: failed to fetch $url. Is 'docker compose up -d' running and healthy?" >&2
    exit 1
  fi
done

echo "OK. Wrote ${#SPECS[@]} specs to $OUT_DIR"
