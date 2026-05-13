#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/dist"
VERSION="$(node -p "require('${ROOT_DIR}/extension/manifest.json').version")"
ARCHIVE="${OUT_DIR}/chinese-web-translator-${VERSION}.zip"

mkdir -p "${OUT_DIR}"
rm -f "${ARCHIVE}"

cd "${ROOT_DIR}/extension"
zip -r "${ARCHIVE}" . -x '*.DS_Store'

echo "Wrote ${ARCHIVE}"
