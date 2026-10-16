#!/usr/bin/env python3
"""Post-process for design 45: archive plates -> teal duotones & specimen cut-outs,
procedural textures, and webp/avif encoding of the 3D bakes.
usage: python -I process.py <downloads_dir> <bakes_dir> <assets_dir>   (needs pillow + numpy)"""
import sys, os, math
import numpy as np
from PIL import Image, ImageFilter

DL, BK, OUT = sys.argv[1:4]
T = {50:'#f2fdfa',100:'#dcf7f1',200:'#b7ebdf',300:'#87dac9',400:'#4bc1ad',500:'#08a28f',600:'#008171',700:'#006154',800:'#034239',900:'#042822',950:'#031612',990:'#020907'}
rgb = lambda h: np.array([int(h[i:i+2], 16) for i in (1, 3, 5)], dtype=np.float32)
os.makedirs(f'{OUT}/extras/specimens', exist_ok=True)

def save(im, path, q=82, avif=False):
    im.save(path + '.webp', 'WEBP', quality=q, method=6)
    if avif: im.save(path + '.avif', 'AVIF', quality=q - 22)
    print('wrote', path)

def ramp(lum, stops):
    """map 0..1 luminance through a list of (pos, hex) colour stops"""
    pos = np.array([p for p, _ in stops]); cols = np.stack([rgb(c) for _, c in stops])
    out = np.zeros(lum.shape + (3,), np.float32)
    for ch in range(3): out[..., ch] = np.interp(lum, pos, cols[:, ch])
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))

def lum_of(path):
    a = np.asarray(Image.open(path).convert('L'), dtype=np.float32) / 255.0
    return a

# --- 1. plates as teal duotones -------------------------------------------
sp = lum_of(f'{DL}/Haeckel_Spumellaria.jpg')[16:-16, 16:-16]
dark = ramp(sp, [(0, T[990]), (0.25, T[900]), (0.6, T[500]), (0.85, T[200]), (1, T[50])])
for w, suf in ((800, '@1x'), (1400, '@2x')):
    save(dark.resize((w, round(w * dark.height / dark.width)), Image.LANCZOS), f'{OUT}/extras/plate-spumellaria-night{suf}', 78)
di = lum_of(f'{DL}/Haeckel_Diatomea.jpg')[24:-24, 24:-24]
light = ramp(di, [(0, T[50]), (0.3, T[100]), (0.6, T[400]), (0.85, T[700]), (1, T[900])])
for w, suf in ((800, '@1x'), (1400, '@2x')):
    save(light.resize((w, round(w * light.height / light.width)), Image.LANCZOS), f'{OUT}/extras/plate-diatomea-day{suf}', 78)
st = lum_of(f'{DL}/thystream.jpg')
eng = ramp(st, [(0, T[900]), (0.45, T[600]), (0.8, T[200]), (1, T[50])])
save(eng, f'{OUT}/extras/engraving-in-thy-stream', 84)

# --- 2. specimen cut-outs (luminance -> alpha) -----------------------------
im = Image.open(f'{DL}/Haeckel_Spumellaria.jpg').convert('L')
crops = {'star': (0, 0, 560, 590), 'tendril': (560, 0, 1350, 790), 'burst': (1330, 0, 1920, 610),
         'urchin': (0, 2130, 560, 2690), 'trefoil': (1390, 2120, 1920, 2690)}
for name, box in crops.items():
    c = np.asarray(im.crop(box), dtype=np.float32) / 255.0
    a = np.clip((c - 0.12) / 0.7, 0, 1) ** 0.9
    h, w = a.shape; yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    a *= np.clip((1.02 - r) / 0.12, 0, 1)  # feather the crop edge so neighbours never peek in
    for tone, col in (('light', T[50]), ('ink', T[700])):
        px = np.zeros((h, w, 4), np.uint8); px[..., :3] = rgb(col); px[..., 3] = (a * 255).astype(np.uint8)
        out = Image.fromarray(px, 'RGBA'); out.thumbnail((420, 420), Image.LANCZOS)
        out.save(f'{OUT}/extras/specimens/{name}-{tone}.webp', 'WEBP', quality=74, method=6)
    print('specimen', name)

# --- 3. procedural textures -----------------------------------------------
rng = np.random.default_rng(0x47d63d)
# 3a. grain tile (tileable white noise, softened) — mid-grey for overlay/soft-light blending
g = rng.normal(0.5, 0.16, (256, 256)).clip(0, 1)
Image.fromarray((g * 255).astype(np.uint8), 'L').save(f'{OUT}/extras/grain-256.png', optimize=True)
# 3b. tileable caustics: sum of warped sines on a torus domain
# after the well-known tileable water-caustic iteration (Dave Hoskins / joltz0r, shadertoy MdlXz8)
N = 1024; y, x = np.mgrid[0:N, 0:N] / N * 2 * math.pi
px, py = x - 250.0, y - 250.0; ix, iy = px.copy(), py.copy(); acc = np.ones((N, N)); inten = 0.005; tm = 12.3
for n in range(5):
    t = tm * (1 - 3.5 / (n + 1))
    ix, iy = px + np.cos(t - ix) + np.sin(t + iy), py + np.sin(t - iy) + np.cos(t + ix)
    acc += 1.0 / np.sqrt((px / (np.sin(ix + t) / inten)) ** 2 + (py / (np.cos(iy + t) / inten)) ** 2)
acc /= 5; acc = 1.17 - acc ** 1.4; c = np.abs(acc) ** 8; c = np.clip(c / np.percentile(c, 99.5), 0, 1)
caus = ramp(np.clip(c * 1.2, 0, 1), [(0, T[100]), (0.5, T[200]), (1, T[50])]).filter(ImageFilter.GaussianBlur(1.2))
caus.save(f'{OUT}/extras/caustics-tile.webp', 'WEBP', quality=80, method=6)
cd = ramp(np.clip(c * 1.2, 0, 1), [(0, T[990]), (0.6, T[800]), (1, T[400])]).filter(ImageFilter.GaussianBlur(1.2))
cd.save(f'{OUT}/extras/caustics-tile-night.webp', 'WEBP', quality=80, method=6)

# --- 4. encode the 3D bakes -------------------------------------------------
def enc(src, dst, sizes, q=82, avif=True, alpha=False):
    im = Image.open(f'{BK}/{src}.png'); im = im.convert('RGBA' if alpha else 'RGB')
    for w, suf in sizes:
        r = im if w == im.width else im.resize((w, round(w * im.height / im.width)), Image.LANCZOS)
        save(r, f'{OUT}/{dst}{suf}', q, avif)
os.makedirs(f'{OUT}/hero', exist_ok=True); os.makedirs(f'{OUT}/products', exist_ok=True)
enc('river-light', 'hero/river-day', ((1440, '@1x'), (2880, '@2x')), 80)
enc('river-dark', 'hero/river-night', ((1440, '@1x'), (2880, '@2x')), 80)
enc('diatom', 'hero/radiolarian', ((1440, '@1x'), (2880, '@2x')), 80)
for p in ('mcp-emails', 'fun-libs', 'toolrails', 'harbor'):
    enc(f'product-{p}', f'products/{p}', ((800, '@1x'), (1600, '@2x')), 82)
enc('retired', 'products/retired-riverbed', ((1200, '@1x'), (2400, '@2x')), 80)
for o in ('orbit', 'chorus', 'capsule', 'specimen'):
    enc(f'object-{o}', f'extras/object-{o}', ((500, '@1x'), (1000, '@2x')), 84, avif=False, alpha=True)
print('done')
