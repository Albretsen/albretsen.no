#!/usr/bin/env python3
"""Photographic grade for the raw renders: white balance, split-tone, gentle film curve,
highlight bloom, fine grain and a soft vignette. Then exports responsive AVIF/WebP/JPEG.

usage: grade.py in.png out_basename [--wb r,g,b] [--sat s] [--grain g] [--sizes 2400,1600,960] [--crop x,y,w,h]
Writes out_basename-<w>.{avif,webp,jpg}. AVIF is encoded with ffmpeg + libsvtav1.
"""
import argparse, subprocess, os, tempfile
import numpy as np
from PIL import Image, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument('inp'); ap.add_argument('out')
ap.add_argument('--wb', default='0.96,0.985,1.05')
ap.add_argument('--sat', type=float, default=0.9)
ap.add_argument('--grain', type=float, default=0.018)
ap.add_argument('--bloom', type=float, default=0.18)
ap.add_argument('--vig', type=float, default=0.16)
ap.add_argument('--lift', type=float, default=0.025)
ap.add_argument('--gamma', type=float, default=1.0)
ap.add_argument('--sizes', default='2400,1600,960')
ap.add_argument('--crop', default=None)
ap.add_argument('--formats', default='avif,webp,jpg')
ap.add_argument('--q', type=int, default=80)
ap.add_argument('--png', action='store_true')
a = ap.parse_args()

im = Image.open(a.inp).convert('RGB')
if a.crop:
    x, y, w, h = map(int, a.crop.split(','))
    im = im.crop((x, y, x + w, y + h))
x = np.asarray(im).astype(np.float32) / 255.0
lin = x ** 2.2
lin *= np.array([float(v) for v in a.wb.split(',')], np.float32)
x = np.clip(lin, 0, None) ** (1 / 2.2)
# saturation
L = (x * np.array([0.2126, 0.7152, 0.0722], np.float32)).sum(-1, keepdims=True)
x = L + (x - L) * a.sat
# split tone: cool sage-blue shadows, warm peach highlights
sh = np.clip(1 - L * 1.6, 0, 1); hi = np.clip((L - 0.55) * 2.2, 0, 1)
x += sh * np.array([-0.012, 0.004, 0.018], np.float32) + hi * np.array([0.018, 0.006, -0.014], np.float32)
# gentle film curve with lifted blacks
x = np.clip(x, 0, 1)
x = x ** a.gamma
x = x * x * (3 - 2 * x) * 0.35 + x * 0.65
x = a.lift + x * (1 - a.lift * 1.4)
# bloom from highlights
if a.bloom > 0:
    br = np.clip((x - 0.72) / 0.28, 0, 1) * x
    bimg = Image.fromarray((np.clip(br, 0, 1) * 255).astype(np.uint8))
    r = max(4, im.width // 90)
    b = np.asarray(bimg.filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255
    b2 = np.asarray(bimg.filter(ImageFilter.GaussianBlur(r * 4))).astype(np.float32) / 255
    x = 1 - (1 - x) * (1 - a.bloom * (0.6 * b + 0.4 * b2))
# vignette
H, W = x.shape[:2]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
d = ((xx / W - 0.5) ** 2 * 1.0 + (yy / H - 0.5) ** 2 * 1.2) ** 0.5
x *= (1 - a.vig * np.clip(d - 0.25, 0, 1) ** 1.5 * 2.2)[..., None]
base = np.clip(x, 0, 1)

os.makedirs(os.path.dirname(a.out) or '.', exist_ok=True)
rng = np.random.default_rng(70)
for s in [int(v) for v in a.sizes.split(',')]:
    hh = int(round(H * s / W / 8.0)) * 8  # multiple of 8 so AVIF/WebP/JPEG share exact dimensions
    img = Image.fromarray((base * 255 + 0.5).astype(np.uint8)).resize((s, hh), Image.LANCZOS)
    y = np.asarray(img).astype(np.float32) / 255
    if a.grain > 0:
        g = rng.normal(0, 1, (hh, s)).astype(np.float32)
        g = np.asarray(Image.fromarray(((g * 0.25 + 0.5).clip(0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255 - 0.5
        lum = (y * np.array([0.2126, 0.7152, 0.0722])).sum(-1, keepdims=True)
        y = y + g[..., None] * 4 * a.grain * (0.5 + 0.8 * lum * (1 - lum) * 4) / 2.5
    img = Image.fromarray((np.clip(y, 0, 1) * 255 + 0.5).astype(np.uint8))
    stem = f'{a.out}-{s}'
    fm = a.formats.split(',')
    if a.png: img.save(stem + '.png', optimize=True)
    if 'jpg' in fm: img.save(stem + '.jpg', quality=a.q, optimize=True, progressive=True, subsampling='4:2:0')
    if 'webp' in fm: img.save(stem + '.webp', quality=a.q - 2, method=6)
    if 'avif' in fm:
        tmp = tempfile.mktemp(suffix='.png'); img.save(tmp)
        subprocess.run(['ffmpeg', '-hide_banner', '-y', '-loglevel', 'error', '-i', tmp, '-c:v', 'libsvtav1', '-crf', str(int(60 - a.q * 0.4)),
                        '-preset', '6', '-pix_fmt', 'yuv420p', '-frames:v', '1', '-svtav1-params', 'tune=0', '-f', 'avif', stem + '.avif'], check=False, env=dict(os.environ, SVT_LOG='1'), stderr=subprocess.DEVNULL)
        os.remove(tmp)
    print(stem, ' '.join(f'{f}:{os.path.getsize(stem + "." + f)//1024}K' for f in fm if os.path.exists(stem + '.' + f)))
