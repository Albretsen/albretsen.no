"""Photo plates + paper grain for design 43. Needs Pillow + numpy.
Usage: python plates.py <designs/43 dir>"""
import sys, os
import numpy as np
from PIL import Image, ImageFilter

root = sys.argv[1]
src = os.path.join(root, 'bake', 'src')
out = os.path.join(root, 'assets', 'extras')
os.makedirs(out, exist_ok=True)

def gradient_map(img, stops):
    a = np.asarray(img.convert('L'), dtype=np.float32) / 255.0
    xs = np.array([s[0] for s in stops], dtype=np.float32)
    res = np.zeros(a.shape + (3,), dtype=np.float32)
    for c in range(3):
        res[..., c] = np.interp(a, xs, np.array([s[1][c] for s in stops], dtype=np.float32))
    return Image.fromarray(res.clip(0, 255).astype(np.uint8), 'RGB')

def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

# "Lagoon print": the Dawn's photo treatment. Shadows in deep lagoon ink, light in warm paper.
LAGOON = [(0.0, hexrgb('#24566b')), (0.18, hexrgb('#32728a')), (0.45, hexrgb('#7fbccb')), (0.72, hexrgb('#d6eef1')), (0.9, hexrgb('#fbe7d3')), (1.0, hexrgb('#fffaf1'))]

def plate(name, file, crop=None, width=1600, gamma=0.8):
    im = Image.open(os.path.join(src, file)).convert('RGB')
    if crop:
        w, h = im.size
        im = im.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
    arr = np.asarray(im, dtype=np.float32) / 255.0
    arr = arr ** gamma
    im = Image.fromarray((arr * 255).astype(np.uint8))
    g = gradient_map(im, LAGOON)
    # a whisper of halftone-free print grain
    rng = np.random.default_rng(7)
    a = np.asarray(g, dtype=np.float32)
    a += rng.normal(0, 3.2, a.shape[:2])[..., None]
    g = Image.fromarray(a.clip(0, 255).astype(np.uint8))
    for scale, suffix in ((1, '@2x'), (0.5, '')):
        w = int(width * scale)
        r = g.resize((w, round(g.height * w / g.width)), Image.LANCZOS)
        r.save(os.path.join(out, f'{name}{suffix}.webp'), 'WEBP', quality=82, method=6)
    print(name, g.size)

plate('plate-orbital-sunrise', 'nasa-iss073e1068530.jpg', crop=(0.0, 0.18, 1.0, 0.82), width=1920)
plate('plate-earth-limb', 'nasa-iss072e838362.jpg', crop=(0.0, 0.0, 1.0, 1.0), width=1920)
plate('plate-peaks', 'commons-mountains-colorful-sky-nathan-anderson.jpg', crop=(0, 0.1, 1, 0.95), width=2000, gamma=0.7)

# Paper grain: ambientCG Paper003 colour map, flattened (high-pass) and tinted to the Dawn's paper.
p = Image.open(os.path.join(src, 'ambientcg-paper003-color.jpg')).convert('L')
a = np.asarray(p, dtype=np.float32)
blur = np.asarray(p.filter(ImageFilter.GaussianBlur(24)), dtype=np.float32)
hp = (a - blur)  # fine fibre detail only, tile-safe at the 1K size
hp = hp / (np.abs(hp).max() + 1e-6)
base = np.array(hexrgb('#f6fbfc'), dtype=np.float32)
tinted = base[None, None, :] + hp[..., None] * np.array([20, 16, 12], dtype=np.float32)
Image.fromarray(tinted.clip(0, 255).astype(np.uint8)).resize((512, 512), Image.LANCZOS).save(os.path.join(out, 'paper-grain.webp'), 'WEBP', quality=80, method=6)
# overlay version: neutral grey around 128 for mix-blend-mode: soft-light / overlay on any colour
ov = 128 + hp * 60
Image.fromarray(ov.clip(0, 255).astype(np.uint8), 'L').resize((512, 512), Image.LANCZOS).save(os.path.join(out, 'paper-grain-overlay.webp'), 'WEBP', quality=80, method=6)
print('paper ok')
