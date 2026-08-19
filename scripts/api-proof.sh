#!/usr/bin/env bash
# Prove the Collector ID is a production API.
# Pulls an EXISTING snapshot. Does not start a 600-page scrape.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env.local ]]; then set -a; # shellcheck disable=SC1091
  source .env.local
  set +a
elif [[ -f .env ]]; then set -a; # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${BRIGHTDATA_API_KEY:-}" ]]; then
  echo "BRIGHTDATA_API_KEY is not set" >&2
  exit 1
fi

SNAPSHOT="${1:-j_mszxp5ed9h5wao59t}"
OUT="collectors/samples/api-snapshot.json"

curl -sS "https://api.brightdata.com/dca/dataset?id=${SNAPSHOT}" \
  -H "Authorization: Bearer ${BRIGHTDATA_API_KEY}" \
  -o "$OUT"

python3 - <<'PY'
import json, sys
from pathlib import Path
raw = Path("collectors/samples/api-snapshot.json").read_text()
data = json.loads(raw)
if isinstance(data, dict) and data.get("status"):
    print("not ready:", data)
    sys.exit(2)
if not isinstance(data, list):
    print("unexpected payload type", type(data).__name__)
    sys.exit(2)
row = data[0] if data else {}
print("rows", len(data))
print("fields", sorted(row.keys()))
print("sample_title", row.get("title"))
PY
