#!/bin/sh
# Bakes the hero stills from dawn-press.js. Needs the static server on :6043 (repo root).
# Usage: bake/bake-heroes.sh <tmpdir>
set -e
here=$(cd "$(dirname "$0")" && pwd)
tmp="$1"; out="$here/../assets/hero"; mkdir -p "$out"
B=http://127.0.0.1:6043/designs/43/bake/press.html
PEAKS="img=src/commons-mountains-colorful-sky-nathan-anderson.jpg&seed=5&grade=dawn&gamma=0.75&memory=0.3"
LIMB="orbits=1&seed=11"
[ -n "$SKIP" ] || "$here/render.sh" "$B?$PEAKS" "$tmp/h1.png" 1600 900 2 8000
[ -n "$SKIP" ] || "$here/render.sh" "$B?$PEAKS" "$tmp/h1m.png" 780 1100 2 8000
[ -n "$SKIP" ] || "$here/render.sh" "$B?$LIMB" "$tmp/h2.png" 1600 900 2 8000
[ -n "$SKIP" ] || "$here/render.sh" "$B?$LIMB" "$tmp/h2m.png" 780 1100 2 8000
PY="$tmp/venv/bin/python"
enc() { "$PY" "$here/enc.py" "$1" "$2" "$3" 84; }
enc "$tmp/h1.png"  "$out/hero-peaks@2x.webp" 3200
enc "$tmp/h1.png"  "$out/hero-peaks.webp" 1600
enc "$tmp/h1.png"  "$out/hero-peaks.avif" 1600
enc "$tmp/h1m.png" "$out/hero-peaks-portrait@2x.webp" 1560
enc "$tmp/h2.png"  "$out/hero-limb@2x.webp" 3200
enc "$tmp/h2.png"  "$out/hero-limb.webp" 1600
enc "$tmp/h2.png"  "$out/hero-limb.avif" 1600
enc "$tmp/h2m.png" "$out/hero-limb-portrait@2x.webp" 1560
ls -la "$out"
