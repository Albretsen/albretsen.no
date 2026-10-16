#!/bin/sh
# Headless Chrome screenshot, so agents can see what they built.
# Usage: scripts/shot.sh <url> <out.png> [width] [height] [wait-ms]
# WebGL works through SwiftShader. Each call uses a throwaway profile.
url="$1"; out="$2"; w="${3:-1440}"; h="${4:-900}"; wait="${5:-5000}"
profile=$(mktemp -d)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars \
  --user-data-dir="$profile" --window-size="$w,$h" --virtual-time-budget="$wait" \
  --screenshot="$out" "$url" >/dev/null 2>&1
rm -rf "$profile"
[ -f "$out" ] && echo "wrote $out" || { echo "screenshot failed"; exit 1; }
