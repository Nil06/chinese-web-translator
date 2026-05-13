#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
SERVICE_FILE="${SERVICE_DIR}/chinese-web-translator.service"

mkdir -p "${SERVICE_DIR}"

sed "s#__PROJECT_DIR__#${ROOT_DIR}#g" \
  "${ROOT_DIR}/systemd/chinese-web-translator.service" > "${SERVICE_FILE}"

systemctl --user daemon-reload
systemctl --user enable --now chinese-web-translator.service

cat <<MSG
Installed user service:
  ${SERVICE_FILE}

Status:
  systemctl --user status chinese-web-translator.service

Logs:
  journalctl --user -u chinese-web-translator.service -f

If you want it to start before your first graphical login, enable linger:
  loginctl enable-linger "$USER"
MSG
