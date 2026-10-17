#!/bin/sh
# Bake the four product plinths. Usage: bake-products.sh <outdir> <size>
here=$(dirname "$0")
for p in mcp-emails fun-libs toolrails harbor; do
  sh "$here/bake.sh" "scene=product:$p&bloom=0" "$1/p-$p.png" "$2" "$2"
done
