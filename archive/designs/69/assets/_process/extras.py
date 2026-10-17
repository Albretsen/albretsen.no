import os, numpy as np
from PIL import Image
from film import *
OUT = 'A/extras'; os.makedirs(OUT, exist_ok=True)

# 1. Tileable film grain (luminance noise in alpha) for CSS overlay
rng = np.random.default_rng(0x3565d6)
n = rng.normal(0, 1, (256, 256)).astype(np.float32)
f = np.fft.fft2(n); yy, xx = np.meshgrid(np.fft.fftfreq(256), np.fft.fftfreq(256), indexing='ij')
f *= np.exp(-(xx ** 2 + yy ** 2) / (2 * 0.22 ** 2))  # soften slightly, stays tileable
n = np.real(np.fft.ifft2(f)); n = (n - n.mean()) / n.std()
g = np.clip(128 + n * 38, 0, 255).astype(np.uint8)
Image.fromarray(np.dstack([g, g, g, np.full_like(g, 255)]), 'RGBA').convert('L').save(f'{OUT}/grain.png', optimize=True)

# 2. Detail frames (square crops from the graded masters)
def crop(src, box, name, size=900):
    im = Image.open(src).convert('RGB').crop(box).resize((size, size), Image.LANCZOS)
    im.save(f'{OUT}/{name}.webp', quality=80, method=6); im.save(f'{OUT}/{name}.jpg', quality=82, optimize=True, progressive=True)
crop('m_towers.jpg', (1250, 2700, 2050, 3500), 'detail-windows')
crop('m_towers.jpg', (60, 1450, 1060, 2450), 'detail-fins')
crop('m_shore.jpg', (800, 1130, 1800, 2130), 'detail-foam')
crop('m_cliffs.jpg', (1250, 1250, 2050, 2050), 'detail-rocks')

# 3. Orbit: NASA ISS sunset limb, graded into the palette (the descent starts above the sky)
im = load('src/isslimb.jpg')
L = lum(im)
lin = srgb_to_lin(im)
k = smoothstep(0.05, 0.7, L)[..., None]
t = srgb_to_lin(hexrgb('#7d88c8')) * (1 - k) + srgb_to_lin(hexrgb('#ffc0b8')) * k
out = lin_to_srgb(lin * t * 1.6)
out = out + (1 - smoothstep(0.0, 0.08, L))[..., None] * hexrgb('#141633') * 0.9  # space: deep dusk ink, not black
out = portra(out, lift=0.02, warm=0.02, sat=0.72)
out = halation(out, 0.7, col='#ff7a6a', amt=0.25)
save('m_orbit.jpg', out)
o = Image.open('m_orbit.jpg')
o.thumbnail((1600, 1600)); o.save(f'{OUT}/orbit-1600.webp', quality=80, method=6); o.save(f'{OUT}/orbit-1600.jpg', quality=82, optimize=True, progressive=True)
print('ok', o.size)
