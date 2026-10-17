"""Grade the source photographs into the 'Long Light' palette and export responsive sizes."""
import numpy as np, os, sys
from PIL import Image
OUT = sys.argv[1]  # designs/79/assets
rng = np.random.default_rng(79)

def hexc(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])

def grade(a, sh='#1d2a2a', hi='#ffd9a0', amt=0.10, contrast=0.12, lift=0.03, lift_col='#1b1712', sat=1.0, grain=0.018):
    lum = (a @ np.array([0.2126, 0.7152, 0.0722]))[..., None]
    sw = (1 - lum) ** 2; hw = lum ** 2
    a = a + (hexc(sh) - 0.5) * sw * amt * 2 + (hexc(hi) - 0.5) * hw * amt * 2
    # gentle S curve around mid grey
    a = np.clip(a, 0, 1)
    a = a + contrast * (a - 0.5) * (1 - np.abs(2 * a - 1))
    # matte lift toward a warm ink, film-like
    a = hexc(lift_col) * lift + a * (1 - lift)
    lum = (a @ np.array([0.2126, 0.7152, 0.0722]))[..., None]
    a = lum + (a - lum) * sat
    if grain:
        g = rng.normal(0, 1, a.shape[:2])[..., None]
        a = a + g * grain * (0.35 + 0.65 * (1 - np.abs(2 * lum - 1)))
    return np.clip(a, 0, 1)

def load(p, crop=None, maxw=3000):
    im = Image.open(p).convert('RGB')
    if crop: im = im.crop(crop)
    if im.width > maxw: im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    return np.asarray(im).astype(np.float64) / 255

def export(a, name, sizes, jpg_sizes, q_avif=52, q_webp=74, q_jpg=80, folder='hero'):
    im = Image.fromarray((a * 255 + 0.5).clip(0, 255).astype(np.uint8))
    d = os.path.join(OUT, folder); os.makedirs(d, exist_ok=True)
    for w in sizes:
        r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        r.save(os.path.join(d, f'{name}-{w}.avif'), quality=q_avif, speed=4)
        r.save(os.path.join(d, f'{name}-{w}.webp'), quality=q_webp, method=6)
        if w in jpg_sizes:
            r.save(os.path.join(d, f'{name}-{w}.jpg'), quality=q_jpg, optimize=True, progressive=True)
    print(name, im.size)
    return im

full = [640, 1280, 1920, 2560]
# 1. First Light (fjord before sunrise) - the interactive hero's base still
a = load('src/LofotenNorwayUnsplas.jpg')
a = grade(a, sh='#0d1b2e', hi='#ffd7a8', amt=0.06, contrast=0.08, lift=0.025, lift_col='#0b1626', sat=1.04, grain=0.014)
im = export(a, 'first-light', full, [1280, 1920])
# shader texture (one size, WebGL friendly) and the night-free base
tex = im.resize((2048, 1365), Image.LANCZOS)
os.makedirs(os.path.join(OUT, 'interactive'), exist_ok=True)
tex.save(os.path.join(OUT, 'interactive', 'first-light-tex.jpg'), quality=82, optimize=True, progressive=False)
tex.save(os.path.join(OUT, 'interactive', 'first-light-tex.webp'), quality=78, method=6)

# 2. Long Light (palm boulevard, late sun)
a = load('src/PalmtreeboulevardUns.jpg')
a = grade(a, sh='#16302c', hi='#ffc98a', amt=0.12, contrast=0.10, lift=0.045, lift_col='#2a1a14', sat=1.06, grain=0.02)
export(a, 'long-light', full, [1280, 1920])

# 3. Marine Layer (fog over sage hills) - crop the photographer's watermark at the bottom right
src = Image.open('src/SunsetbeyondthefogUn.jpg')
a = load('src/SunsetbeyondthefogUn.jpg', crop=(0, 0, src.width, int(src.height * 0.955)))
a = grade(a, sh='#1f3326', hi='#fbe6c4', amt=0.10, contrast=0.06, lift=0.05, lift_col='#23261c', sat=0.96, grain=0.018)
export(a, 'marine-layer', [1280, 1920, 2560], [1280])

# 4. After Hours (palms against a pastel dusk) - the night-theme image
a = load('src/VeniceBeachpalmtrees.jpg')
a = grade(a, sh='#1a1030', hi='#ffd2a0', amt=0.05, contrast=0.04, lift=0.02, lift_col='#160d22', sat=1.0, grain=0.02)
export(a, 'after-hours', [1280, 1920, 2560], [1280])

# 5. Blue Hour Ridge (violet mountain dawn) - section backdrop for night mode
a = load('src/Morningmood1Unsplash.jpg')
a = grade(a, sh='#0b0f22', hi='#ffc7a2', amt=0.06, contrast=0.05, lift=0.03, lift_col='#0e0d1e', sat=1.0, grain=0.02)
export(a, 'blue-ridge', [1280, 1920], [1280])
