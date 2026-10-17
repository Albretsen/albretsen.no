"""Cut a specimen out of a scanned plate: key out paper, fill holes, feather, trim.
usage: cutout.py src.jpg out.png fx0 fy0 fx1 fy1 [thresh] [keep_largest]"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, out = sys.argv[1], sys.argv[2]
fx0, fy0, fx1, fy1 = map(float, sys.argv[3:7])
th = float(sys.argv[7]) if len(sys.argv) > 7 else 26
keep = int(sys.argv[8]) if len(sys.argv) > 8 else 1

im = Image.open(src).convert('RGB')
W, H = im.size
box = (int(fx0 * W), int(fy0 * H), int(fx1 * W), int(fy1 * H))
im = im.crop(box)
a = np.asarray(im.filter(ImageFilter.GaussianBlur(2.2))).astype(np.float32)
h, w, _ = a.shape
border = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
paper = np.median(border, axis=0)
# perceptual-ish distance: weight chroma & luminance
d = a - paper
lum = d @ np.array([0.3, 0.59, 0.11])
chroma = d - lum[..., None]
dist = np.sqrt((lum * 1.0) ** 2 + (np.linalg.norm(chroma, axis=-1) * 1.6) ** 2)
fg = (dist > th).astype(np.uint8) * 255
m = Image.fromarray(fg, 'L')
# close small gaps
k = 13 if keep else 5
m = m.filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k))
m = m.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))
# flood background from the border; whatever isn't reached is the object (holes filled)
pad = Image.new('L', (w + 2, h + 2), 0)
pad.paste(m, (1, 1))
ImageDraw.floodfill(pad, (0, 0), 128)
p = np.asarray(pad)[1:-1, 1:-1]
obj = (p != 128); print("obj", obj.mean(), np.asarray(m).mean())
alpha = Image.fromarray((obj * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.4))
rgba = im.convert('RGBA')
rgba.putalpha(alpha)
bb = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
rgba = rgba.crop((max(bb[0] - 6, 0), max(bb[1] - 6, 0), min(bb[2] + 6, w), min(bb[3] + 6, h)))
rgba.save(out)
print(out, rgba.size, 'paper', paper.round())
