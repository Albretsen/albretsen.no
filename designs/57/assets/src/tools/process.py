"""Escape Vector image treatments. Usage: python process.py SRC_DIR OUT_DIR"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

INK = np.array([7, 7, 7], float)
INK2 = np.array([22, 19, 19], float)
BURN = np.array([243, 64, 70], float)
BURN_LO = np.array([165, 30, 39], float)
PAPER = np.array([249, 246, 245], float)
WHITE = np.array([255, 255, 255], float)
rng = np.random.default_rng(5405)


def load(n):
    return Image.open(os.path.join(SRC, n)).convert('RGB')


def lum(a):
    return (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]) / 255.0


def curve(l, lo=0.02, hi=0.98, gamma=1.0):
    l = np.clip((l - lo) / (hi - lo), 0, 1)
    return l ** gamma


def ramp(l, stops):
    """stops: list of (pos, rgb)"""
    out = np.zeros(l.shape + (3,))
    for (p0, c0), (p1, c1) in zip(stops[:-1], stops[1:]):
        m = (l >= p0) & (l <= p1)
        t = ((l - p0) / max(p1 - p0, 1e-6))[m][:, None]
        out[m] = c0 * (1 - t) + c1 * t
    return out


def grain(a, amt=6.0):
    n = rng.normal(0, amt, a.shape[:2])[..., None]
    return a + n


def save(arr, name, sizes, alpha=None, q=82):
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    if alpha is not None:
        img.putalpha(Image.fromarray(np.clip(alpha * 255, 0, 255).astype(np.uint8)))
    for suffix, w in sizes:
        im = img
        if w and w < img.width:
            im = img.resize((w, round(img.height * w / img.width)), Image.LANCZOS)
        im.save(os.path.join(OUT, f"{name}{suffix}.webp"), 'WEBP', quality=q, method=6)
    return img


MONO = [(0, INK), (0.55, np.array([150, 147, 146.])), (1, WHITE)]
BURN_RAMP = [(0, INK), (0.35, BURN_LO), (0.7, BURN), (1, np.array([255, 236, 232.]))]

# 1. Earthrise: mono moon, Earth re-coloured as the single burn element.
a = np.asarray(load('earthrise.jpg')).astype(float)
l = curve(lum(a), 0.03, 0.95, 1.1)
mx, mn = a.max(-1), a.min(-1)
sat = (mx - mn) / (mx + 1)
blue = (a[..., 2] - a[..., 0]) / 255
mask = np.clip((sat - 0.18) * 5, 0, 1) * np.clip(blue * 6, 0, 1)
mimg = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(5))
mask = np.asarray(mimg) / 255.0
# whole Earth disc incl. white clouds: dilate strongly but only in top half region
mono = ramp(l, MONO)
burn = ramp(curve(lum(a), 0.0, 0.85, 0.8), BURN_RAMP)
out = mono * (1 - mask[..., None]) + burn * mask[..., None]
out = grain(out, 5)
H, W = out.shape[:2]
# crop to 16:9 keeping earth + horizon
ch = int(W * 9 / 16)
y0 = max(0, H - ch - 40)
out = out[y0:y0 + ch]
save(out, 'hero-earthrise', [('', 2340), ('-1440', 1440), ('-720', 720)])

# 2. Far side of the Moon disc with alpha, mono with a burn rim on the lit edge.
m = load('farside.jpg')
m = m.resize((2400, 2400), Image.LANCZOS)
a = np.asarray(m).astype(float)
l = lum(a)
yy, xx = np.mgrid[0:2400, 0:2400]
# find disc
ys, xs = np.where(l > 0.06)
cy, cx = (ys.min() + ys.max()) / 2, (xs.min() + xs.max()) / 2
r = max(ys.max() - ys.min(), xs.max() - xs.min()) / 2
d = np.sqrt((yy - cy) ** 2 + (xx - cx) ** 2)
alpha = np.clip((r - d) / 2.0, 0, 1)
lc = curve(l, 0.08, 0.92, 1.25)
mono = ramp(lc, [(0, INK2), (0.5, np.array([128, 124, 123.])), (1, WHITE)])
# raking terminator: darken towards lower-left, burn rim at upper-right edge
nx, ny = (xx - cx) / r, (yy - cy) / r
shade = np.clip(0.55 + 0.6 * (nx * 0.7 - ny * 0.7), 0.0, 1.0)
mono = mono * (0.25 + 0.75 * shade[..., None])
rim = np.clip(1 - (r - d) / 60, 0, 1) * np.clip(nx * 0.7 - ny * 0.7, 0, 1)
mono = mono * (1 - rim[..., None] * 0.8) + BURN * rim[..., None] * 0.8
mono = grain(mono, 2)
pad = int(2400 - 2 * r) // 2
crop = (int(cx - r - 4), int(cy - r - 4), int(cx + r + 4), int(cy + r + 4))
img = Image.fromarray(np.clip(mono, 0, 255).astype(np.uint8))
img.putalpha(Image.fromarray((alpha * 255).astype(np.uint8)))
img = img.crop(crop)
for s, w in [('', 1600), ('-800', 800), ('-400', 400)]:
    img.resize((w, w), Image.LANCZOS).save(os.path.join(OUT, f'hero-farside{s}.webp'), 'WEBP', quality=70, method=6)

# 3. Astronaut cut-out (STS-41B), mono suit, red stripes kept as burn.
a = np.asarray(load('mmu.jpg')).astype(float)
L = lum(a) * 255
bluish = a[..., 2] - (a[..., 0] + a[..., 1]) / 2
bgc = ((L < 70) | (bluish > 28)).astype(np.uint8) * 255
bimg = Image.fromarray(bgc).copy()
for p in [(0, 0), (2044, 0), (0, 2044), (2044, 2044), (1000, 0), (0, 1000), (2044, 1000), (1000, 2044), (300, 2044), (1700, 2044)]:
    if bimg.getpixel(p) == 255:
        ImageDraw.floodfill(bimg, p, 128)
bg = (np.asarray(bimg) == 128)
fgb = Image.fromarray((~bg * 255).astype(np.uint8)).copy()
ImageDraw.floodfill(fgb, (1000, 900) if fgb.getpixel((1000, 900)) == 255 else (900, 800), 128)
fg = Image.fromarray(((np.asarray(fgb) == 128) * 255).astype(np.uint8))
fg = fg.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
alpha = np.asarray(fg) / 255.0
red = np.clip((a[..., 0] - (a[..., 1] + a[..., 2]) / 2 - 40) / 50, 0, 1)
l = curve(lum(a), 0.05, 0.97, 1.15)
mono = ramp(l, [(0, INK), (0.5, np.array([140, 137, 136.])), (1, WHITE)])
out = mono * (1 - red[..., None]) + BURN * red[..., None]
out = grain(out, 3)
ys, xs = np.where(alpha > 0.1)
box = (xs.min() - 8, ys.min() - 8, xs.max() + 8, ys.max() + 8)
img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
img.putalpha(Image.fromarray((alpha * 255).astype(np.uint8)))
img = img.crop(box)
for s, w in [('', 1600), ('-800', 800)]:
    im = img.resize((w, round(img.height * w / img.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, f'hero-astronaut{s}.webp'), 'WEBP', quality=84, method=6)

# 4. Pillars of Creation, burn duotone.
p = load('pillars.jpg')
p = p.resize((2400, round(p.height * 2400 / p.width)), Image.LANCZOS)
a = np.asarray(p).astype(float)
l = curve(lum(a), 0.04, 0.9, 1.35)
out = ramp(l, [(0, INK), (0.28, np.array([60, 14, 18.])), (0.6, BURN), (0.88, np.array([255, 205, 198.])), (1, WHITE)])
out = grain(out, 3)
save(out, 'hero-pillars', [('', 1920), ('-960', 960)], q=72)

# 5. Apollo 17 horizon strip, mono.
a = np.asarray(load('apollo17pano.jpg')).astype(float)
l = curve(lum(a), 0.04, 0.96, 1.05)
out = grain(ramp(l, MONO), 4)
save(out, 'horizon-apollo17', [('', 3840), ('-1920', 1920)])


# 6. Trouvelot plates: crop paper margins, burn or mono duotone.
def plate(name, box, ramp_stops, outname, width, g=1.0, lo=0.05, hi=0.9):
    im = load(name)
    W, H = im.size
    im = im.crop(tuple(int(v) for v in (box[0] * W, box[1] * H, box[2] * W, box[3] * H)))
    a = np.asarray(im).astype(float)
    l = curve(lum(a), lo, hi, g)
    out = grain(ramp(l, ramp_stops), 4)
    save(out, outname, [('', width), (f'-{width // 2}', width // 2)])


plate('mars.jpg', (0.06, 0.04, 0.94, 0.86), BURN_RAMP, 'plate-mars', 1600, 1.1, 0.08, 0.95)
plate('saturn.jpg', (0.04, 0.05, 0.96, 0.84), MONO, 'plate-saturn', 1600, 1.05, 0.12, 0.95)
plate('comet.jpg', (0.075, 0.075, 0.925, 0.86), [(0, INK), (0.6, np.array([170, 150, 148.])), (0.85, BURN), (1, WHITE)], 'plate-comet', 1600, 1.2, 0.15, 0.85)
plate('zodiacal.jpg', (0.07, 0.04, 0.93, 0.86), MONO, 'plate-zodiacal', 1200, 1.1, 0.12, 0.85)


# 7. Haeckel radiolarians: white paper -> alpha, ink lines, cutout stickers.
def cutout(name, box, outname, width, color):
    im = load(name)
    W, H = im.size
    im = im.crop(tuple(int(v) for v in (box[0] * W, box[1] * H, box[2] * W, box[3] * H)))
    a = np.asarray(im).astype(float)
    l = lum(a)
    ink = np.clip((0.80 - l) / 0.55, 0, 1) ** 0.85
    ink[ink < 0.08] = 0
    rgb = np.ones(a.shape) * color
    img = Image.fromarray(rgb.astype(np.uint8))
    img.putalpha(Image.fromarray((ink * 255).astype(np.uint8)))
    for s, w in [('', width), (f'-{width // 2}', width // 2)]:
        im2 = img.resize((w, round(img.height * w / img.width)), Image.LANCZOS)
        im2.save(os.path.join(OUT, f'{outname}{s}.webp'), 'WEBP', quality=80, method=6)


cutout('circogonia.jpg', (0.0, 0.0, 1.0, 1.0), 'radiolarian-icosa-ink', 900, INK)
cutout('circogonia.jpg', (0.0, 0.0, 1.0, 1.0), 'radiolarian-icosa-burn', 900, BURN)
print('done')
