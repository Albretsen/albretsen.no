#!/usr/bin/env bash
set -euo pipefail

cd /opt/albretsen.no

echo "[release] branch: $(git rev-parse --abbrev-ref HEAD)"
echo "[release] commit: $(git rev-parse --short HEAD)"

echo "[release] pulling latest..."
git pull

echo "[release] installing deps if needed"
npm install --no-fund --no-audit

echo "[release] build"
npm run build

echo "[release] restarting production service"
systemctl restart albretsen-no.service

echo "[release] waiting for service to come up..."
sleep 5
if systemctl is-active --quiet albretsen-no.service; then
  echo "[release] service is running — done"
else
  echo "[release] ERROR: service failed to start"
  systemctl status albretsen-no.service --no-pager
  exit 1
fi
