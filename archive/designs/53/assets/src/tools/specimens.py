import sys; sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.Xjwh7Qx8vB/scr')
from hl import *
from PIL import ImageFilter
import os
os.makedirs(OUT + 'objects', exist_ok=True)
src = Image.open(R + 'dl/Haeckel_Diatomea.jpg').convert('RGB')
specs = {'diatom-wheel': (1164, 1280, 480), 'diatom-disc': (1935, 372, 345), 'diatom-star': (390, 372, 350)}
for name, (cx, cy, r) in specs.items():
    im = src.crop((cx - r, cy - r, cx + r, cy + r)).resize((560, 560), Image.LANCZOS)
    L = tone(lum(im), .12, .9, 1.0)
    H, W = L.shape
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt((xx - W / 2) ** 2 + (yy - H / 2) ** 2) / (W / 2)
    mask = np.clip((0.985 - d) / 0.02, 0, 1)
    ink = ramp(L, [(0, COL['clay']), (0.5, COL['ochre']), (1, COL['vellum'])])
    a = np.clip(L * 1.25, 0, 1) * mask
    rgba = np.dstack([ink, a * 255]).astype(np.uint8)
    out = Image.fromarray(rgba, 'RGBA')
    p = OUT + 'objects/' + name + '.webp'
    out.save(p, 'WEBP', quality=70, method=6)
    print(name, round(os.path.getsize(p) / 1024), 'KB')

# eclipse cut-out: halftone corona as a free-floating object with alpha
im = Image.open(R + 'work/eclipse.jpg').convert('RGB')
w, h = im.size; s = int(h * .92)
cx, cy = int(w * .5), int(h * .5)
im = im.crop((cx - s // 2, cy - s // 2, cx + s // 2, cy + s // 2)).resize((800, 800), Image.LANCZOS)
L = tone(lum(im), .2, .85, 1.2)
cov = halftone(L, 8, 27)
a = np.clip(cov * .9 + L * .2, 0, 1)
H, W = L.shape
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
d = np.sqrt((xx - W / 2) ** 2 + (yy - H / 2) ** 2) / (W / 2)
a = a * np.clip((1 - d) / .25, 0, 1)
ink = ramp(L, [(0, COL['clay']), (0.5, COL['ember']), (0.8, COL['ochre']), (1, COL['spark'])])
out = Image.fromarray(np.dstack([ink, a * 255]).astype(np.uint8), 'RGBA')
out.save(OUT + 'objects/corona.webp', 'WEBP', quality=68, method=6)
print('corona', round(os.path.getsize(OUT + 'objects/corona.webp') / 1024), 'KB')
