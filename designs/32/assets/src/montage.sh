#!/bin/sh
# Rasterise all SVG icons into a contact strip for visual QA. Usage: montage.sh <assets-dir> <tmpdir> <python>
A="$1"; T="$2"; PY="$3"
mkdir -p "$T/m"
for f in "$A"/products/retired/*.svg "$A"/extras/icons/*.svg "$A"/extras/sticker-*.svg "$A"/extras/tape.svg; do
  rsvg-convert -h 160 "$f" -o "$T/m/$(basename "$f" .svg).png"
done
"$PY" -c "
import glob
from PIL import Image
fs=sorted(glob.glob('$T/m/*.png')); W=8; c=Image.new('RGB',(W*220,((len(fs)+W-1)//W)*200),(10,25,54))
for i,f in enumerate(fs):
    im=Image.open(f).convert('RGBA'); c.paste(im,((i%W)*220+10,(i//W)*200+20),im)
c.save('$T/montage.png')"
rm -rf "$T/m"
