"""Encode a PNG to webp/avif at a given width. Needs Pillow.
Usage: python enc.py in.png out.(webp|avif|png|jpg) width [quality] [crop WxH+X+Y]"""
import sys
from PIL import Image

src, out, width = sys.argv[1], sys.argv[2], int(sys.argv[3])
q = int(sys.argv[4]) if len(sys.argv) > 4 else 84
im = Image.open(src)
if len(sys.argv) > 5:
    wh, x, y = sys.argv[5].split('+')
    w, h = map(int, wh.split('x'))
    im = im.crop((int(x), int(y), int(x) + w, int(y) + h))
has_alpha = im.mode in ('RGBA', 'LA') and im.getextrema()[-1][0] < 255
im = im.convert('RGBA' if has_alpha else 'RGB')
if width and width != im.width:
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
ext = out.rsplit('.', 1)[-1].lower()
if ext == 'webp':
    im.save(out, 'WEBP', quality=q, method=6)
elif ext == 'avif':
    im.save(out, 'AVIF', quality=q - 22 if q > 40 else q)
elif ext in ('jpg', 'jpeg'):
    im.convert('RGB').save(out, 'JPEG', quality=q, optimize=True, progressive=True)
else:
    im.save(out, 'PNG', optimize=True)
print(out, im.size)
