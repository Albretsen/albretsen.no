import os, sys, numpy as np
from PIL import Image
OUT = os.path.join(sys.argv[1], 'extras'); os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(75)

def periodic_noise(n, scale, octaves=4):
    """Tileable fractal noise via random phases in the frequency domain."""
    acc = np.zeros((n, n))
    for o in range(octaves):
        f = np.fft.fftfreq(n)[:, None] ** 2 + np.fft.fftfreq(n)[None, :] ** 2
        f = np.sqrt(f) + 1e-6
        spec = (rng.normal(size=(n, n)) + 1j * rng.normal(size=(n, n))) * np.exp(-(f * n / (scale * 2 ** o)) ** 2)
        layer = np.real(np.fft.ifft2(spec))
        layer = (layer - layer.mean()) / (layer.std() + 1e-9)
        acc += layer * 0.5 ** o
    return acc / acc.std()

def fibres(n, count=900):
    img = np.zeros((n, n))
    for _ in range(count):
        x, y = rng.uniform(0, n, 2); ang = rng.uniform(0, np.pi); L = rng.uniform(6, 28)
        t = np.linspace(0, L, int(L * 2))
        xs = (x + np.cos(ang) * t + np.sin(t * 0.3) * 1.2).astype(int) % n
        ys = (y + np.sin(ang) * t).astype(int) % n
        img[ys, xs] += rng.uniform(0.3, 1.0)
    return img

n = 512
base = np.array([0xFB, 0xF3, 0xE4], float) / 255
mott = periodic_noise(n, 3)
fine = rng.normal(0, 1, (n, n))
fib = fibres(n)
l = 1 + mott * 0.012 + fine * 0.010 - fib * 0.035
paper = np.clip(base[None, None, :] * l[..., None] + np.array([0, -0.004, -0.012]) * mott[..., None], 0, 1)
Image.fromarray((paper * 255).astype(np.uint8)).save(os.path.join(OUT, 'paper-linen.webp'), quality=82)
Image.fromarray((paper * 255).astype(np.uint8)).save(os.path.join(OUT, 'paper-linen.jpg'), quality=84)

# transparent film grain overlay (use with mix-blend-mode: multiply or overlay)
g = rng.normal(0, 1, (256, 256))
a = np.clip(np.abs(g) * 22, 0, 60).astype(np.uint8)
v = np.where(g > 0, 255, 40).astype(np.uint8)
rgba = np.stack([v, (v * 0.85).astype(np.uint8), (v * 0.7).astype(np.uint8), a], -1)
Image.fromarray(rgba, 'RGBA').save(os.path.join(OUT, 'grain.png'), optimize=True)

# contour lines of an imagined peak (SVG): marching squares on a smooth height field
from math import isfinite
N = 160
yy, xx = np.mgrid[0:N, 0:N] / N
h = np.exp(-(((xx - 0.52) / 0.20) ** 2 + ((yy - 0.62) / 0.28) ** 2)) * 1.0
h += np.exp(-(((xx - 0.30) / 0.14) ** 2 + ((yy - 0.70) / 0.2) ** 2)) * 0.55
h += np.exp(-(((xx - 0.78) / 0.16) ** 2 + ((yy - 0.75) / 0.22) ** 2)) * 0.45
h += periodic_noise(N, 4, 3) * 0.035
segs = []
def lerp(a, b, va, vb, lv):
    t = (lv - va) / (vb - va) if vb != va else 0.5
    return a + (b - a) * t
paths = []
for lv in np.linspace(0.08, 1.0, 22):
    d = []
    for j in range(N - 1):
        for i in range(N - 1):
            v = [h[j, i], h[j, i + 1], h[j + 1, i + 1], h[j + 1, i]]
            c = sum(1 << k for k in range(4) if v[k] > lv)
            if c in (0, 15): continue
            pts = []
            corners = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
            for k in range(4):
                a_, b_ = k, (k + 1) % 4
                if (v[a_] > lv) != (v[b_] > lv):
                    x = lerp(corners[a_][0], corners[b_][0], v[a_], v[b_], lv)
                    y = lerp(corners[a_][1], corners[b_][1], v[a_], v[b_], lv)
                    pts.append((x * 10, y * 10))
            if len(pts) >= 2:
                d.append(f'M{pts[0][0]:.1f} {pts[0][1]:.1f}L{pts[1][0]:.1f} {pts[1][1]:.1f}')
                if len(pts) == 4:
                    d.append(f'M{pts[2][0]:.1f} {pts[2][1]:.1f}L{pts[3][0]:.1f} {pts[3][1]:.1f}')
    sw = 1.6 if round(lv * 100) % 5 == 0 else 0.9
    paths.append(f'<path d="{"".join(d)}" stroke-width="{sw}"/>')
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1590 1590" width="1590" height="1590" aria-hidden="true">
<g fill="none" stroke="#B8662F" stroke-opacity=".55" stroke-linecap="round" vector-effect="non-scaling-stroke">
{chr(10).join(paths)}
</g></svg>
'''
open(os.path.join(OUT, 'contours.svg'), 'w').write(svg)
print('ok', len(svg))
