#!/usr/bin/env bash
set -euo pipefail

cd /opt/albretsen.no

echo "[release] branch: $(git rev-parse --abbrev-ref HEAD)"
echo "[release] commit: $(git rev-parse --short HEAD)"

echo "[release] installing deps if needed"
npm install --no-fund --no-audit

echo "[release] lint"
npm run lint

echo "[release] build"
npm run build

echo "[release] ready to serve dist/ on port 3000"
