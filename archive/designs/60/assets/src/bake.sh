#!/bin/sh
# Bake a still from bake.html with a transparent background (needs a static server on :6060 at the repo root).
# Usage: bake.sh "<query>" out.png width height
url="http://127.0.0.1:6060/designs/60/assets/src/bake.html?$1"; out="$2"; w="$3"; h="$4"
profile=$(mktemp -d)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --default-background-color=00000000 \
  --user-data-dir="$profile" --window-size="$w,$h" --virtual-time-budget=30000 \
  --screenshot="$out" "$url" >/dev/null 2>&1
rm -rf "$profile"; [ -f "$out" ] && echo "wrote $out"
