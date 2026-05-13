#!/usr/bin/env bash
set -euo pipefail

MTRANSERVER_VERSION="${MTRANSERVER_VERSION:-4.0.33}"
CWT_MODELS="${CWT_MODELS:-${ZH_LENS_MODELS:-zh-Hans_en en_zh-Hans en_fr fr_en}}"

npx --yes "mtranserver@${MTRANSERVER_VERSION}" --download ${CWT_MODELS}
