import sys; sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.Xjwh7Qx8vB/scr')
from hl import *
from PIL import ImageFilter
import os, math
os.makedirs(OUT + 'texture', exist_ok=True)
rng = np.random.default_rng(84)

# 1. film grain, tileable (noise is tileable by construction), mid-grey for overlay/soft-light
n = rng.standard_normal((512, 512)).astype(np.float32)
g = np.clip(128 + n * 38, 0, 255).astype(np.uint8)
Image.fromarray(g).save(OUT + 'texture/grain.webp', 'WEBP', quality=60)

# 2. vellum paper: soft tileable fibre (sum of wrapped blurred noises) in vellum tones
def tile_blur(a, r):
    big = np.tile(a, (3, 3))
    b = np.asarray(Image.fromarray(big).filter(ImageFilter.GaussianBlur(r))).astype(np.float32)
    h, w = a.shape
    return b[h:2 * h, w:2 * w]
base = rng.random((1024, 1024)).astype(np.float32) * 255
f1 = tile_blur(base.astype(np.uint8), 1.2); f2 = tile_blur(base.astype(np.uint8), 6); f3 = tile_blur((rng.random((1024, 1024)) * 255).astype(np.uint8), 40)
t = (f1 - 128) * .35 + (f2 - 128) * 1.6 + (f3 - 128) * 2.2
v = np.array(COL['vellum'], np.float32)
out = v[None, None, :] + t[..., None] * np.array([1, .96, .85])[None, None, :] * .55
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(OUT + 'texture/vellum.webp', 'WEBP', quality=72)

# 3. halftone gradient tile (SVG): a horizon band of dots that fades both ways, for section dividers
O = hexc(COL['ochre'])
els = []
W, H, p = 240, 48, 8
for j in range(H // p + 1):
    for i in range(W // p + 1):
        x = i * p + (p / 2 if j % 2 else 0); y = j * p
        t = abs(y - H / 2) / (H / 2)
        r = (p * .46) * (1 - t) ** 1.4
        if r > .35: els.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.2f}"/>')
open(OUT + 'texture/dot-horizon.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" fill="{O}">' + ''.join(els) + '</svg>\n')

# 4. radial halftone "sun" (SVG), scalable: concentric dot rings shrinking outward
els = []
S = 600; c = S / 2
for ring in range(1, 30):
    R = ring * 10.5
    n = max(6, int(2 * math.pi * R / 10.5))
    rad = 4.9 * (1 - ring / 30) ** 1.25
    for k in range(n):
        a = 2 * math.pi * k / n + ring * .17
        els.append(f'<circle cx="{c + R * math.cos(a):.1f}" cy="{c + R * math.sin(a):.1f}" r="{rad:.2f}"/>')
open(OUT + 'texture/dot-sun.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" width="{S}" height="{S}" fill="{O}"><circle cx="{c}" cy="{c}" r="6"/>' + ''.join(els) + '</svg>\n')
for f in os.listdir(OUT + 'texture'): print(f, round(os.path.getsize(OUT + 'texture/' + f) / 1024), 'KB')
