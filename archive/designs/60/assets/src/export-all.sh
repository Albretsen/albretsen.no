#!/bin/sh
# Post + export all baked renders. Usage: export-all.sh <tmpdir-with-raw-pngs> <python>
T="$1"; PY="$2"; here=$(cd "$(dirname "$0")" && pwd); A="$here/.."
"$PY" -I "$here/post.py" "$T/hero-raw.png" "$T/hero-post.png" --glow 0.65,0.5,0.3
"$PY" -I "$here/export.py" "$T/hero-post.png" "$A/hero/hero-planet" 1600,3200 webp+avif 80
"$PY" -I "$here/post.py" "$T/surf-raw.png" "$T/surf-post.png" --grain 0.03
"$PY" -I "$here/export.py" "$T/surf-post.png" "$A/hero/hero-surface" 1600,3200 webp+avif 80
"$PY" -I "$here/post.py" "$T/planet-raw.png" "$T/planet-post.png" --alpha --grain 0.02 --bloom 0.5
"$PY" -I "$here/export.py" "$T/planet-post.png" "$A/hero/planet-cutout" 1000,2000 webp 82
for p in mcp-emails fun-libs toolrails harbor; do
  "$PY" -I "$here/post.py" "$T/big/p-$p.png" "$T/big/p-$p-post.png" --glow 0.5,0.56,0.36 --grain 0.025 --bloom 0.6
  "$PY" -I "$here/export.py" "$T/big/p-$p-post.png" "$A/products/product-$p" 800,1600 webp 80
done
