#!/bin/sh
# Bake a page to PNG with headless Chrome (SwiftShader WebGL).
# Usage: bake.sh <url> <out.png> <css-width> <css-height> [scale=1] [wait-ms=20000] [transparent=0]
url="$1"; out="$2"; w="$3"; h="$4"; s="${5:-1}"; wait="${6:-20000}"; tr="${7:-0}"
profile=$(mktemp -d)
bgflag=""; [ "$tr" = "1" ] && bgflag="--default-background-color=00000000"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars $bgflag \
  --force-device-scale-factor="$s" --user-data-dir="$profile" --window-size="$w,$h" \
  --virtual-time-budget="$wait" --screenshot="$out" "$url" >/dev/null 2>&1
rm -rf "$profile"
[ -f "$out" ] && echo "wrote $out" || { echo "bake failed"; exit 1; }
