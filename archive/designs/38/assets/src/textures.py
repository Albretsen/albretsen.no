# Procedural textures for design 38. numpy + Pillow.  usage: python textures.py OUTDIR
import sys, numpy as np
from PIL import Image, ImageFilter
OUT = sys.argv[1]
rng = np.random.default_rng(0x500a48)

def tile_noise(n, octaves, base=4, persist=0.55):
    """Seamless fractal value noise via FFT-free tiling: sum of upscaled wrapped random grids."""
    acc = np.zeros((n, n), np.float32); amp = 1; tot = 0
    for o in range(octaves):
        g = base * 2 ** o
        r = rng.random((g, g)).astype(np.float32)
        r = np.pad(r, ((0, 1), (0, 1)), mode='wrap')
        img = Image.fromarray((r * 255).astype(np.uint8)).resize((n + n // g, n + n // g), Image.BICUBIC)
        a = np.asarray(img).astype(np.float32)[:n, :n] / 255
        acc += a * amp; tot += amp; amp *= persist
    return acc / tot

# 1. jade plaster wall, seamless, 1024
n = 1024
h = tile_noise(n, 7, base=4, persist=0.6)
fine = tile_noise(n, 3, base=128, persist=0.5)
# light from upper left: emboss
hx = np.roll(h, -1, 1) - h; hy = np.roll(h, -1, 0) - h
shade = np.clip(0.5 + (hx + hy) * 9, 0, 1)
L = 0.33 + (h - 0.5) * 0.06 + (shade - 0.5) * 0.08 + (fine - 0.5) * 0.03
base = np.array([0x16, 0x47, 0x37], np.float32) / 255  # oklch(.36 .06 168)
col = base[None, None, :] * (L[..., None] / 0.36)
Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8)).save(f'{OUT}/plaster-jade.webp', quality=74, method=6)

# 2. grain tile with alpha, 256 seamless (overlay)
g = rng.normal(0.5, 0.18, (256, 256)).clip(0, 1)
a = (np.abs(g - 0.5) * 2 * 255 * 0.5).astype(np.uint8)
v = (g > 0.5).astype(np.uint8) * 255
Image.fromarray(np.dstack([v, v, v, a])).save(f'{OUT}/grain-256.png', optimize=True)

# 3. light pool: museum spot scallop on a wall (sharp arched top, soft fall-off), alpha
W, H = 1000, 1300
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
cx, cy, rx, ry = W / 2, H * 0.62, W * 0.44, H * 0.56
e = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
edge = np.clip((1 - e) / 0.07, 0, 1)
fall = np.clip(1 - (yy - H * 0.3) / (H * 0.7), 0, 1) ** 1.7
edge = edge * np.where(yy < H * 0.3, 1, fall)
hot = np.exp(-(((xx - cx) / (rx * 0.55)) ** 2 + ((yy - H * 0.3) / (ry * 0.55)) ** 2))
alpha = edge * (0.22 + 0.42 * hot)
alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255
rgb = np.dstack([np.full_like(alpha, 255), np.full_like(alpha, 243), np.full_like(alpha, 220)]).astype(np.uint8)
Image.fromarray(np.dstack([rgb, (alpha * 255).astype(np.uint8)])).save(f'{OUT}/light-pool.png', optimize=True)

# 4. gaffer tape strips (matte black + paper masking), torn ends, alpha
def tape(w, hgt, color, sheen, seed, name):
    r = np.random.default_rng(seed)
    a = np.ones((hgt, w), np.float32)
    for side in (0, 1):  # torn ends
        prof = np.cumsum(r.normal(0, 2.2, hgt)); prof -= prof.mean(); prof = np.clip(prof, -14, 14) + 18
        for y in range(hgt):
            k = int(prof[y])
            if side == 0: a[y, :k] = 0
            else: a[y, w - k:] = 0
    # fibre streaks
    fib = r.normal(0, 1, (hgt, w // 6)).astype(np.float32)
    fib = np.asarray(Image.fromarray(((fib * 0.2 + 0.5).clip(0, 1) * 255).astype(np.uint8)).resize((w, hgt), Image.BILINEAR)).astype(np.float32) / 255 - 0.5
    yy = np.linspace(0, 1, hgt)[:, None]
    lum = 1 + fib * 0.18 + sheen * np.exp(-((yy - 0.3) / 0.12) ** 2)
    rgb = np.clip(np.array(color, np.float32)[None, None, :] * lum[..., None], 0, 255).astype(np.uint8)
    img = Image.fromarray(np.dstack([rgb, (a * 240).astype(np.uint8)]))
    img = img.rotate(r.uniform(-4, 4), resample=Image.BICUBIC, expand=True)
    img.save(f'{OUT}/{name}.png', optimize=True)
tape(560, 120, (34, 36, 35), 0.25, 1, 'tape-gaffer')
tape(480, 110, (226, 214, 180), 0.08, 2, 'tape-masking')
print('textures ok')
