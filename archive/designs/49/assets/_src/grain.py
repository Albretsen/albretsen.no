"""Tileable paper tooth: fine grain + a few faint fibres, as a transparent overlay.
usage: grain.py out.webp"""
import sys
import numpy as np
from PIL import Image

N = 512
rng = np.random.default_rng(216)
def wrapblur(a, r):
    out = np.zeros_like(a)
    for dx in range(-r, r + 1):
        for dy in range(-r, r + 1):
            out += np.roll(np.roll(a, dx, 0), dy, 1)
    return out / (2 * r + 1) ** 2
fine = rng.random((N, N))
mid = wrapblur(rng.random((N, N)), 2)
mid = (mid - mid.mean()) / mid.std()
alpha = (fine - 0.5) * 0.5 + mid * 0.25
# fibres: short wrapped strokes
fib = np.zeros((N, N))
for _ in range(45):
    x, y = rng.integers(0, N, 2); ang = rng.random() * np.pi; L = rng.integers(12, 46)
    for t in range(L):
        fib[int(y + np.sin(ang) * t) % N, int(x + np.cos(ang) * t) % N] += 1
fib = wrapblur(fib, 1)
alpha = alpha + fib * 1.2
alpha = np.clip((alpha - alpha.min()) / (alpha.max() - alpha.min()), 0, 1)
alpha = np.clip((alpha - 0.45) * 1.8, 0, 1) ** 1.4 * 46   # max ~18% opacity
img = np.zeros((N, N, 4), np.uint8)
img[..., :3] = (28, 36, 39)
img[..., 3] = alpha.astype(np.uint8)
Image.fromarray(img, 'RGBA').save(sys.argv[1], 'WEBP', quality=80, method=6)
print('ok')
