#!/usr/bin/env bash
# Launch the Economy of Minds webpage in a local browser.
# Usage: ./launch.sh [port]   (default port 8080)

set -e
cd "$(dirname "$0")"

PORT="${1:-8080}"
URL="http://localhost:${PORT}/"

# Open the browser shortly after the server starts.
( sleep 1
  if command -v open >/dev/null 2>&1; then open "$URL"           # macOS
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"  # Linux
  fi
) &

echo "Serving webpage at ${URL}  (Ctrl+C to stop)"
exec python3 -m http.server "$PORT"
