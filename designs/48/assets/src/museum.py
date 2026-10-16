import sys, numpy as np
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]

def srgb(h): return np.array([int(h[i:i+2], 16) for i in (1, 3, 5)], dtype=np.float32) / 255

# 1. Tiffany vase: nocturne duotone (void -> glow -> paper) with grain
v = Image.open(f'{src}/vase-orig.jpg').convert('L')
a = np.asarray(v, dtype=np.float32) / 255
a = np.clip((a - 0.04) / 0.9, 0, 1) ** 1.15
stops = [(0, srgb('#0b050c')), (0.35, srgb('#3a0f40')), (0.62, srgb('#b02cc0')), (0.85, srgb('#f295fb')), (1, srgb('#fff4ff'))]
def ramp(x):
    o = np.zeros(x.shape + (3,), np.float32)
    for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
        m = (x >= p0) & (x <= p1); t = ((x - p0) / (p1 - p0))[m][:, None]
        o[m] = c0 * (1 - t) + c1 * t
    return o
rgb = ramp(a)
rng = np.random.default_rng(66)
rgb += rng.normal(0, 0.018, rgb.shape[:2])[..., None]
Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(f'{out}/met-vase-nocturne.png')

# 2. Scarab: cut out from the light backdrop, keep its real colour
s = Image.open(f'{src}/scarab-orig.jpg').convert('RGB')
s = s.crop((800, 1100, 2700, 2250))  # object region (original px)
arr = np.asarray(s, dtype=np.float32) / 255
lum = arr.mean(2); sat = arr.max(2) - arr.min(2)
mask = ((lum < 0.62) | (sat > 0.16)).astype(np.float32)
m = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(9))
sm = m.resize((m.width // 4, m.height // 4)).filter(ImageFilter.MaxFilter(25)).filter(ImageFilter.MinFilter(25)).resize(m.size)
m = Image.fromarray(np.maximum(np.asarray(m), np.asarray(sm))).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(2))
ma = np.asarray(m, dtype=np.float32) / 255
ma = np.clip((ma - 0.35) / 0.3, 0, 1)
rgba = np.dstack([arr, ma])
im = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA')
bbox = im.getbbox(); im = im.crop(bbox)
im.save(f'{out}/met-scarab-cutout.png')

# 3. La Farge Nocturne: crop the painted field, lift into the night palette slightly
l = Image.open(f'{src}/lafarge-orig.jpg').convert('RGB')
W, H = l.size
l = l.crop((int(W * 0.17), int(H * 0.16), int(W * 0.84), int(H * 0.80)))
la = np.asarray(l, dtype=np.float32) / 255
la = la ** 1.35  # deepen for night
tint = srgb('#2a0f30')
la = la * 0.9 + tint * 0.12
Image.fromarray((np.clip(la, 0, 1) * 255).astype(np.uint8)).save(f'{out}/met-lafarge-nocturne.png')
print('ok', bbox)
