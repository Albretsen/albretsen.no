#!/bin/sh
# Bakes the four product dioramas into $1 as PNG. Usage: bake-products.sh <outdir> [scale=1]
OUT="$1"; S="${2:-1}"; B="$(dirname "$0")/bake.sh"; U="http://127.0.0.1:6032/designs/32/assets/src/render.html"
for id in mcp-emails fun-libs toolrails harbor; do
  "$B" "$U?scene=product&id=$id" "$OUT/p-$id.png" 800 600 "$S" 60000
done
