#!/bin/sh
# Exports the low-poly GLBs via headless Chrome --dump-dom. Needs the static server on :6043.
here=$(cd "$(dirname "$0")" && pwd)
out="$here/../assets/3d"; mkdir -p "$out"
for o in crystal planet; do
  profile=$(mktemp -d)
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
    --user-data-dir="$profile" --virtual-time-budget=10000 --dump-dom "http://127.0.0.1:6043/designs/43/bake/export-glb.html?o=$o" 2>/dev/null \
    | sed -n 's/.*GLB:\([A-Za-z0-9+/=]*\):END.*/\1/p' | base64 -d > "$out/$o.glb"
  rm -rf "$profile"
  ls -la "$out/$o.glb"
done
