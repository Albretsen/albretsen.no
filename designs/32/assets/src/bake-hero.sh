#!/bin/sh
# Bakes the hero stills and parallax layers into $1 (a temp dir) as PNG.
# Then run src/encode.py to produce webp/avif into assets/hero.
OUT="$1"; B="$(dirname "$0")/bake.sh"; U="http://127.0.0.1:6032/designs/32/assets/src/render.html"
"$B" "$U?scene=wallpaper" "$OUT/wallpaper.png" 1440 900 2 60000
"$B" "$U?scene=desktop" "$OUT/desktop.png" 1440 900 2 60000
# parallax layers (transparent, overscanned camera so tilt never shows an edge)
for L in sky aurora,sun far mid near plane; do
  n=$(echo "$L" | tr ',' '-')
  "$B" "$U?scene=layer&only=$L&camz=37" "$OUT/layer-$n.png" 1440 900 2 60000 1
done
