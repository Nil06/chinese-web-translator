#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
MTRANSERVER_VERSION="${MTRANSERVER_VERSION:-4.0.33}"

npx --yes "mtranserver@${MTRANSERVER_VERSION}" \
  --host "${CWT_HOST:-${ZH_LENS_HOST:-127.0.0.1}}" \
  --port "${CWT_PORT:-${ZH_LENS_PORT:-8989}}" \
  --no-ui \
  --offline \
  --log-level "${CWT_LOG_LEVEL:-${ZH_LENS_LOG_LEVEL:-warn}}"
