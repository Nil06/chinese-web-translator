#!/usr/bin/env sh
set -eu

mkdir -p "${MT_CONFIG_DIR}" "${MT_MODEL_DIR}" "${MT_LOG_DIR}"

CWT_MODELS="${CWT_MODELS:-${ZH_LENS_MODELS:-zh-Hans_en en_zh-Hans en_fr fr_en}}"
CWT_OFFLINE_ONLY="${CWT_OFFLINE_ONLY:-${ZH_LENS_OFFLINE_ONLY:-0}}"

if [ "${CWT_OFFLINE_ONLY}" != "1" ]; then
  # Idempotent: MTranServer skips files that already exist in MT_MODEL_DIR.
  mtranserver --model-dir "${MT_MODEL_DIR}" --config-dir "${MT_CONFIG_DIR}" --download ${CWT_MODELS}
fi

exec mtranserver \
  --host "${MT_HOST:-0.0.0.0}" \
  --port "${MT_PORT:-8989}" \
  --config-dir "${MT_CONFIG_DIR}" \
  --model-dir "${MT_MODEL_DIR}" \
  --log-dir "${MT_LOG_DIR}" \
  --no-ui \
  --offline \
  --log-level "${MT_LOG_LEVEL:-warn}" \
  --no-check-update
