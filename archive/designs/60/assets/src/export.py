"""Export post-processed PNGs to web sizes. Usage: python export.py in.png out_base sizeA,sizeB [webp|webp+avif] [quality]
Writes out_base-<width>.webp (and .avif). Width-based; aspect preserved."""
import sys
from PIL import Image
src, base, sizes = sys.argv[1], sys.argv[2], [int(s) for s in sys.argv[3].split(',')]
fmt = sys.argv[4] if len(sys.argv) > 4 else 'webp'
q = int(sys.argv[5]) if len(sys.argv) > 5 else 80
im = Image.open(src)
for w in sizes:
    h = round(im.height * w / im.width)
    r = im.resize((w, h), Image.LANCZOS) if w != im.width else im
    r.save(f'{base}-{w}.webp', quality=q, method=6)
    if 'avif' in fmt:
        r.save(f'{base}-{w}.avif', quality=q - 22, speed=4)
    print('wrote', base, w, h)
