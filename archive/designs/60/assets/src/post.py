"""Post-process baked renders: bloom, atmosphere glow, film grain, vignette.
Usage: python post.py in.png out.png [--glow cx,cy,r] [--grain 0.035] [--bloom 0.8] [--alpha]
Runs in a venv with pillow + numpy. Part of the Pocket Planet kit (design 60)."""
import sys, numpy as np
from PIL import Image, ImageFilter

args = sys.argv[1:]
src, dst = args[0], args[1]
opt = {}
i = 2
while i < len(args):
    if args[i] == '--alpha': opt['alpha'] = True; i += 1
    else: opt[args[i][2:]] = args[i + 1]; i += 2

im = Image.open(src).convert('RGBA')
a = np.asarray(im).astype(np.float32) / 255.0
rgb, alpha = a[..., :3], a[..., 3:4]
H, W = rgb.shape[:2]
lin = rgb ** 2.2

# bloom: bright, saturated-blue or near-white pixels bleed light (three radii, additive)
lum = lin @ np.array([0.2126, 0.7152, 0.0722], np.float32)
blue = np.clip(lin[..., 2] - lin[..., 0], 0, 1)
mask = np.clip((lum - 0.35) * 2.2, 0, 1)[..., None] * lin + (blue ** 1.2)[..., None] * lin * 0.9
mask_img = Image.fromarray((np.clip(mask, 0, 1) ** (1 / 2.2) * 255).astype(np.uint8))
bloom = np.zeros_like(lin)
for r, w in ((W / 220, 0.55), (W / 70, 0.35), (W / 22, 0.28)):
    b = np.asarray(mask_img.filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255.0
    bloom += (b ** 2.2) * w
strength = float(opt.get('bloom', 0.85))
lin = lin + bloom * strength

# atmosphere glow behind the subject (electric accent, OKLCH 0.65 0.19 252 = #0790ff)
if 'glow' in opt:
    cx, cy, r = [float(v) for v in opt['glow'].split(',')]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt((xx / W - cx) ** 2 * (W / H) ** 2 + (yy / H - cy) ** 2) / r
    halo = np.exp(-((d - 1.0) ** 2) / 0.05) * 0.10 + np.exp(-d * d * 0.9) * 0.035
    acc = np.array([0.0024, 0.24, 1.0], np.float32)  # linear #0790ff
    lin = lin + halo[..., None] * acc * (1 - np.clip(lum, 0, 1))[..., None]

# vignette
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
v = 1 - 0.38 * (((xx / W - 0.5) ** 2 + (yy / H - 0.5) ** 2) * 2.2)
lin = lin * np.clip(v, 0.55, 1)[..., None]

out = np.clip(lin, 0, 1) ** (1 / 2.2)
# film grain (spark word: grain) — luminance noise, slightly stronger in shadows
g = float(opt.get('grain', 0.03))
rng = np.random.default_rng(60)
n = rng.normal(0, 1, (H, W)).astype(np.float32)
n = np.asarray(Image.fromarray(((n * 0.25 + 0.5).clip(0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255 - 0.5
out = np.clip(out + (n * 4 * g)[..., None] * (1.2 - out), 0, 1)
res = np.concatenate([out, alpha], -1) if 'alpha' in opt else out
Image.fromarray((res * 255 + 0.5).astype(np.uint8)).save(dst)
print('post', dst, W, H)
