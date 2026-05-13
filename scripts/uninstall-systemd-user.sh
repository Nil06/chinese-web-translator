#!/usr/bin/env bash
set -euo pipefail

SERVICE_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
SERVICE_FILE="${SERVICE_DIR}/chinese-web-translator.service"

systemctl --user disable --now chinese-web-translator.service || true
rm -f "${SERVICE_FILE}"
systemctl --user daemon-reload

echo "Removed Chinese Web Translator user service."
