#!/bin/sh
# Bake a still from render.html with headless Chrome (SwiftShader WebGL).
# Usage: bake.sh <query | path-under-assets?query> <out.png> <css-width> <css-height> [dpr] [wait-ms]
# Example: bake.sh "scene=hero-mark" hero.png 1440 810 2
q="$1"; case "$q" in *.html*) url="http://127.0.0.1:6048/designs/48/assets/$q";; *) url="http://127.0.0.1:6048/designs/48/assets/src/render.html?$q";; esac; out="$2"; w="$3"; h="$4"; dpr="${5:-2}"; wait="${6:-20000}"
profile=$(mktemp -d)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars \
  --force-device-scale-factor="$dpr" --default-background-color=00000000 \
  --user-data-dir="$profile" --window-size="$w,$h" --virtual-time-budget="$wait" \
  --screenshot="$out" "$url" >/dev/null 2>&1
rm -rf "$profile"
[ -f "$out" ] && echo "wrote $out" || { echo "bake failed"; exit 1; }
