"""Encode masters to webp/avif with Pillow. Usage: python conv.py src.png out.webp|out.avif quality [width]"""
import sys
from PIL import Image
src, out, q = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src)
if len(sys.argv) > 4:
    w = int(sys.argv[4]); im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
if out.endswith('.webp'):
    im.save(out, 'WEBP', quality=q, method=6)
elif out.endswith('.avif'):
    im.save(out, 'AVIF', quality=q, speed=4)
elif out.endswith('.jpg'):
    im.convert('RGB').save(out, 'JPEG', quality=q, optimize=True, progressive=True)
else:
    im.save(out, optimize=True)
print(out)
