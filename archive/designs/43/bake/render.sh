#!/bin/sh
# Retina headless screenshot. Usage: bake/render.sh <url> <out.png> <w> <h> [scale] [wait-ms]
url="$1"; out="$2"; w="$3"; h="$4"; s="${5:-2}"; wait="${6:-6000}"
profile=$(mktemp -d)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars \
  --force-device-scale-factor="$s" --default-background-color=00000000 \
  --user-data-dir="$profile" --window-size="$w,$h" --virtual-time-budget="$wait" \
  --screenshot="$out" "$url" >/dev/null 2>&1
rm -rf "$profile"
[ -f "$out" ] && echo "wrote $out" || { echo "render failed"; exit 1; }
