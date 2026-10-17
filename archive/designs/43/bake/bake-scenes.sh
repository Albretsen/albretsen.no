#!/bin/sh
# Bakes every three.js still from bake/scene.html. Needs the static server on :6043.
# Usage: bake/bake-scenes.sh <tmpdir> [only-this-scene]
set -e
here=$(cd "$(dirname "$0")" && pwd)
tmp="$1"; only="$2"; A="$here/../assets"
PY="$tmp/venv/bin/python"
shot() { # scene w h out [query]
  [ -n "$only" ] && [ "$only" != "$1" ] && return 0
  "$here/try.sh" "$1" "$tmp/sc-$4.png" "$2" "$3" 2 "$5"
}
enc() { [ -f "$1" ] && "$PY" "$here/enc.py" "$1" "$2" "$3" "${4:-84}" || true; }

mkdir -p "$A/hero" "$A/products" "$A/retired" "$A/extras"
# hero object
shot hero-a 1600 900 hero-crystal
shot hero-a 780 1100 hero-crystal-portrait
enc "$tmp/sc-hero-crystal.png" "$A/hero/hero-crystal@2x.webp" 3200
enc "$tmp/sc-hero-crystal.png" "$A/hero/hero-crystal.webp" 1600
enc "$tmp/sc-hero-crystal.png" "$A/hero/hero-crystal.avif" 1600
enc "$tmp/sc-hero-crystal-portrait.png" "$A/hero/hero-crystal-portrait@2x.webp" 1560

# live products: 4:3 "front-page photographs"
for s in mcp funlibs toolrails harbor; do
  shot $s 1200 900 $s
  enc "$tmp/sc-$s.png" "$A/products/$s@2x.webp" 2400
  enc "$tmp/sc-$s.png" "$A/products/$s.webp" 1200
done

# retired: transparent specimens
for s in luma polyglot pinpoint webvakt jokes tryggere early; do
  shot $s 600 600 $s alpha=1
  enc "$tmp/sc-$s.png" "$A/retired/$s@2x.webp" 1200 88
  enc "$tmp/sc-$s.png" "$A/retired/$s.webp" 600 88
done

# extras: floating stickers
shot cloud 900 520 cloud alpha=1
enc "$tmp/sc-cloud.png" "$A/extras/cloud@2x.webp" 1800 88
shot planet 800 800 planet alpha=1
enc "$tmp/sc-planet.png" "$A/extras/planet@2x.webp" 1600 88
enc "$tmp/sc-planet.png" "$A/extras/planet.webp" 800 88
shot crystal 800 800 crystal alpha=1
enc "$tmp/sc-crystal.png" "$A/extras/crystal-a@2x.webp" 1600 88
enc "$tmp/sc-crystal.png" "$A/extras/crystal-a.webp" 800 88
echo done
