#!/bin/sh
# Re-bakes every 3D still in the kit into a raw PNG folder ($1), at retina (DPR 2).
# Needs: python3 -m http.server 6048 --bind 127.0.0.1 running from the repo root.
# Then run src/encode.sh <raw-folder> to write the webp/avif files.
set -e
cd "$(dirname "$0")"
O="$1"; mkdir -p "$O"
B=./bake.sh
$B "3d/mark-demo.html?still&scene=hero&t=2" "$O/hero-mark.png" 1440 810 2 40000
$B "3d/mark-demo.html?still&scene=solo&t=2" "$O/mark-solo.png" 900 900 2 40000
$B "scene=hero-select&sel=fun-libs" "$O/hero-select.png" 1440 810 2 40000
for id in mcp-emails fun-libs toolrails harbor; do
  $B "scene=portrait&id=$id" "$O/portrait-$id.png" 800 1000 2 30000
done
for id in luma polyglot-pilot pinpoint webvakt joke-central tryggere-hyring early-apps; do
  $B "scene=ghost&id=$id" "$O/ghost-$id.png" 600 600 2 30000
done
$B "3d/mark-demo.html?still&scene=solo&alpha&t=2" "$O/sprite-mark.png" 600 600 1 20000
$B "scene=sprite&kind=sphere&color=dc3aec&alpha" "$O/sprite-sphere-glow.png" 600 600 1 20000
$B "scene=sprite&kind=sphere&color=36dcec&alpha" "$O/sprite-sphere-ion.png" 600 600 1 20000
$B "scene=sprite&kind=pill&color=f295fb&alpha&rx=0&ry=0.3&rz=0" "$O/sprite-pill.png" 600 600 1 20000
$B "scene=sprite&kind=torus&color=861192&alpha&rx=0.55&ry=0.2" "$O/sprite-torus.png" 600 600 1 20000
$B "scene=sprite&kind=cube&color=fbd452&alpha&rx=0.6&ry=0.8" "$O/sprite-cube.png" 600 600 1 20000
$B "scene=sprite&kind=sphere&color=1fc893&alpha" "$O/sprite-sphere-jade.png" 600 600 1 20000
$B "scene=sprite&kind=pill&color=588cff&alpha&rx=0&ry=0.3&rz=0" "$O/sprite-pill-cobalt.png" 600 600 1 20000
