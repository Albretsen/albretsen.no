#!/bin/sh
# Bakes only the transparent physics sprites into $1 (subset of bake-all.sh).
set -e
cd "$(dirname "$0")"
O="$1"; mkdir -p "$O"
B=./bake.sh
$B "3d/mark-demo.html?still&scene=solo&alpha&t=2" "$O/sprite-mark.png" 600 600 1 20000
$B "scene=sprite&kind=sphere&color=dc3aec&alpha" "$O/sprite-sphere-glow.png" 600 600 1 20000
$B "scene=sprite&kind=sphere&color=36dcec&alpha" "$O/sprite-sphere-ion.png" 600 600 1 20000
$B "scene=sprite&kind=pill&color=f295fb&alpha&rx=0&ry=0.3&rz=0" "$O/sprite-pill.png" 600 600 1 20000
$B "scene=sprite&kind=torus&color=861192&alpha&rx=0.55&ry=0.2" "$O/sprite-torus.png" 600 600 1 20000
$B "scene=sprite&kind=cube&color=fbd452&alpha&rx=0.6&ry=0.8" "$O/sprite-cube.png" 600 600 1 20000
$B "scene=sprite&kind=sphere&color=1fc893&alpha" "$O/sprite-sphere-jade.png" 600 600 1 20000
$B "scene=sprite&kind=pill&color=588cff&alpha&rx=0&ry=0.3&rz=0" "$O/sprite-pill-cobalt.png" 600 600 1 20000
