"""Grades the NASA photographs into the design-59 look.
Usage: python grade.py <srcDir> <outDir>   (needs pillow + numpy)
Writes PNG masters; ffmpeg converts them to webp/avif afterwards.
"""
import sys, os
import numpy as np
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

INK = np.array([0x0f, 0x0b, 0x22]) / 255
VIOLET = np.array([0x6c, 0x35, 0xec]) / 255
GLOW = np.array([0xba, 0xb0, 0xff]) / 255
PAPER = np.array([0xf3, 0xf2, 0xfb]) / 255
LIME = np.array([0xce, 0xfd, 0x3e]) / 255


def load(name):
    return np.asarray(Image.open(os.path.join(src, name)).convert('RGB')).astype(np.float32) / 255


def save(a, name):
    Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(out, name))


def lum(a):
    return (a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722)[..., None]


def gradient_map(l, stops):
    """stops: list of (pos, rgb)"""
    l = l[..., 0]
    res = np.zeros(l.shape + (3,), np.float32)
    for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
        m = (l >= p0) & (l <= p1)
        t = ((l - p0) / max(p1 - p0, 1e-6))[..., None]
        res[m] = (c0 * (1 - t) + c1 * t)[m]
    return res


def curve(a, lo=0.0, hi=1.0, gamma=1.0):
    return np.clip((a - lo) / (hi - lo), 0, 1) ** gamma


def grain(shape, amt, seed=59):
    rng = np.random.default_rng(seed)
    n = rng.normal(0, 1, shape[:2]).astype(np.float32)
    return n[..., None] * amt


# 1. Cover photograph: protein crystals grown on STS-50 (NASA MSFC 9262354)
a = load('9262354-orig.jpg')  # 2009 x 3000
a = a[40:2720, :, :]  # drop the LED counter at the bottom for the clean cover crop
h, w = a.shape[:2]
# 3:4 crop
th = int(w * 4 / 3)
y0 = max(0, (h - th) // 2)
a = a[y0:y0 + th]
# white-balance: map the median background colour onto the paper colour
Lr = lum(a)[..., 0]
mask = Lr > np.percentile(Lr, 55)
bgc = np.median(a[mask], axis=0)
a = np.clip(a * (PAPER * 0.97 / bgc), 0, 1.2)
a = np.clip((a - 0.5) * 1.12 + 0.5, 0, 1)  # contrast
L = lum(a)
# background (bright, low-chroma) toward paper with a violet cast; keep crystal colour
sat = a.max(-1, keepdims=True) - a.min(-1, keepdims=True)
bg = np.clip((L - 0.55) * 4, 0, 1) * np.clip(1 - sat * 4, 0, 1)
tone = gradient_map(curve(L, 0.04, 0.98, 1.1), [(0, INK), (0.45, VIOLET * 0.9), (0.8, GLOW), (1, PAPER)])
graded = a * 0.84 + tone * 0.16
graded = graded * (1 - bg * 0.65) + (PAPER * 0.93 + VIOLET * 0.07) * bg * 0.65
graded = curve(graded, 0.02, 1.0, 1.08)
graded += grain(graded.shape, 0.018)
im = Image.fromarray((np.clip(graded, 0, 1) * 255).astype(np.uint8))
im.resize((2000, 2667), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2, 40, 2)).save(os.path.join(out, 'cover-crystal@2x.png'))
im.resize((1000, 1333), Image.LANCZOS).save(os.path.join(out, 'cover-crystal.png'))

# 1b. The LED counter strip, kept as an editorial detail
a = load('9262354-orig.jpg')
strip = a[2740:2990, 260:1740]
save(strip, 'led-counter.png')

# 2. Inside spread: aurora over the Earth's limb (NASA JSC iss058e005282)
a = load('iss058e005282-orig.jpg')  # 5568 x 3712
a = a[300:300 + 2784, 0:5568]  # 2:1
L = lum(a)
tone = gradient_map(curve(L, 0.0, 0.85, 0.9), [(0, INK * 0.6), (0.35, VIOLET * 0.55), (0.75, GLOW), (1, PAPER)])
g = a[..., 1:2] - np.maximum(a[..., 0:1], a[..., 2:3])  # aurora mask (green dominance)
aur = np.clip(g * 6, 0, 1)
graded = a * 0.45 + tone * 0.55
graded = graded * (1 - aur) + (a * 0.4 + LIME * 0.75 * np.clip(L * 3, 0, 1)) * aur
graded = curve(graded, 0.0, 0.95, 1.05)
graded += grain(graded.shape, 0.012, 7)
im = Image.fromarray((np.clip(graded, 0, 1) * 255).astype(np.uint8))
im.resize((3200, 1600), Image.LANCZOS).save(os.path.join(out, 'spread-aurora@2x.png'))
im.resize((1600, 800), Image.LANCZOS).save(os.path.join(out, 'spread-aurora.png'))

# 3. Texture: canavalin crystal surface, atomic force microscopy (NASA MSFC 0101744)
a = load('0101744-orig.jpg')[:900, :900]
a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.2))).astype(np.float32) / 255
L = curve(lum(a), 0.08, 0.92, 1.0)
spiral = gradient_map(L, [(0, INK), (0.5, VIOLET), (0.85, GLOW), (1, PAPER)])
im = Image.fromarray((np.clip(spiral, 0, 1) * 255).astype(np.uint8))
im.resize((1800, 1800), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 30, 2)).save(os.path.join(out, 'texture-spiral@2x.png'))
im.save(os.path.join(out, 'texture-spiral.png'))
# lime/ink print variant for a sticker-sheet style section
spiral2 = gradient_map(L, [(0, INK), (0.55, INK * 0.5 + VIOLET * 0.5), (1, LIME)])
Image.fromarray((np.clip(spiral2, 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, 'texture-spiral-lime.png'))

# 4. Paper grain tile (seamless), 512px
rng = np.random.default_rng(11380)
n = rng.normal(0, 1, (512, 512)).astype(np.float32)
f = np.fft.fft2(n)
fy = np.fft.fftfreq(512)[:, None]; fx = np.fft.fftfreq(512)[None, :]
r = np.sqrt(fx ** 2 + fy ** 2) + 1e-3
fib = np.real(np.fft.ifft2(f / (r ** 0.6)))  # pink-ish noise = paper fibre
fib = (fib - fib.mean()) / fib.std()
fine = n
tex = 0.5 + fib * 0.06 + fine * 0.035
rgb = PAPER[None, None, :] * (1 + fib[..., None] * 0.022 + fine[..., None] * 0.012)
save(np.clip(rgb, 0, 1), 'paper-grain.png')
# alpha grain overlay (ink dots) for use over any colour
alpha = np.clip(np.abs(fine) - 1.6, 0, 1) * 0.55 + np.clip(fib - 1.5, 0, 1) * 0.2
ov = np.zeros((512, 512, 4), np.uint8)
ov[..., :3] = (INK * 255).astype(np.uint8)
ov[..., 3] = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
Image.fromarray(ov, 'RGBA').save(os.path.join(out, 'grain-overlay.png'))
print('graded')
