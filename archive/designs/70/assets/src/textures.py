#!/usr/bin/env python3
"""Procedural textures: seamless lime-wash plaster, paper grain, and two soft shadow overlays
(louvred shutter, bougainvillea leaves) used as 'light' layers that the sun can move.
usage: textures.py ASSETS_DIR"""
import sys, os
import numpy as np
from PIL import Image, ImageFilter
A = sys.argv[1]; os.makedirs(f'{A}/extras', exist_ok=True)
rng = np.random.default_rng(70)

def tile_noise(n, freq):
    """Seamless value noise via FFT-filtered white noise (periodic by construction)."""
    w = rng.normal(size=(n, n))
    fy = np.fft.fftfreq(n)[:, None]; fx = np.fft.fftfreq(n)[None, :]
    f = np.sqrt(fx ** 2 + fy ** 2)
    spec = np.fft.fft2(w) * np.exp(-(f * n / freq) ** 2)
    out = np.real(np.fft.ifft2(spec)); out -= out.mean(); out /= out.std() + 1e-9
    return out

# ---- lime-wash plaster: broad trowel clouds + fine sand grain, warm white
N = 768
cloud = tile_noise(N, 6) * 0.55 + tile_noise(N, 18) * 0.3 + tile_noise(N, 60) * 0.15
grain = tile_noise(N, 300)
# trowel strokes: anisotropic noise stretched along a diagonal
st = tile_noise(N, 40)
st = np.roll(st, 0, 0)
base = np.array([246, 241, 232], np.float32) / 255
lum = 1 + cloud * 0.011 + grain * 0.008 + st * 0.005
img = np.clip(base[None, None, :] * lum[..., None] + np.array([0.004, 0.0, -0.006]) * cloud[..., None], 0, 1)
Image.fromarray((img * 255 + 0.5).astype(np.uint8)).save(f'{A}/extras/limewash-768.webp', quality=82, method=6)
Image.fromarray((img * 255 + 0.5).astype(np.uint8)).save(f'{A}/extras/limewash-768.jpg', quality=84, optimize=True, progressive=True)

# ---- paper grain overlay (alpha), 256 seamless, for multiply on any surface
g = tile_noise(256, 120) * 0.6 + tile_noise(256, 30) * 0.4
a = np.clip(0.5 + g * 0.18, 0, 1)
rgba = np.zeros((256, 256, 4), np.uint8); rgba[..., :3] = 42; rgba[..., 3] = (np.abs(g) * 22).clip(0, 255).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(f'{A}/extras/grain-256.png', optimize=True)

# ---- louvre shadow: soft horizontal slats inside a window-shaped patch, as a transparent warm-shadow layer
W, H = 1200, 900
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
slats = 0.5 + 0.5 * np.sin(yy / H * np.pi * 2 * 26)
slats = np.clip((slats - 0.35) * 3, 0, 1)
win = ((xx > 180) & (xx < 1020) & (yy > 60) & (yy < 840)).astype(np.float32)
win = np.asarray(Image.fromarray((win * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(18))).astype(np.float32) / 255
lightmask = win * slats
lm = np.asarray(Image.fromarray((lightmask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
# encode as warm LIGHT on transparent (screen/soft-light) — the shadow is everywhere else
rgba = np.zeros((H, W, 4), np.uint8)
rgba[..., 0] = 255; rgba[..., 1] = 214; rgba[..., 2] = 160; rgba[..., 3] = (lm * 200).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(f'{A}/extras/louvre-light.png', optimize=True)
Image.fromarray(rgba, 'RGBA').save(f'{A}/extras/louvre-light.webp', quality=80, method=6)

# ---- leaf-dapple shadow (cool shadow on transparent), seamless 1024
M = 1024
n = tile_noise(M, 14) * 0.7 + tile_noise(M, 40) * 0.3
leaf = np.clip((n - 0.25) * 2.2, 0, 1)
leaf = np.asarray(Image.fromarray((leaf * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4))).astype(np.float32) / 255
rgba = np.zeros((M, M, 4), np.uint8)
rgba[..., 0] = 60; rgba[..., 1] = 70; rgba[..., 2] = 92; rgba[..., 3] = (leaf * 90).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(f'{A}/extras/leaf-shadow-1024.webp', quality=80, method=6)
for f in sorted(os.listdir(f'{A}/extras')):
    print(f, os.path.getsize(f'{A}/extras/{f}') // 1024, 'K')
