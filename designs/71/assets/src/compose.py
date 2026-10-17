"""Composite the matte-painting layers into a graded still.

compose(T, prefix, h, sunx) -> float32 HxWx3
  h    = sun height in [-1, 1]  (0.2 low winter sun, -0.06 pink hour, -0.6 night)
  sunx = horizontal sun position (0..1); the moon sits mirrored at 1 - sunx
The same model (sky palette by sun height, relight, glow) is implemented in GLSL in
interactive/sky-dial.js so the stills and the live hero match.
CLI: python compose.py <tmpdir> <h> <out.png> [sunx] [prefix]
"""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter


def mix(a, b, t):
    return a + (b - a) * t


def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def C(hx):
    return np.array([int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5)], np.float32)


def blur(a, r):
    return gaussian_filter(a.astype(np.float32), sigma=(r, r, 0))


def prep_pavilion(p):
    """Lift the pastels and soften CG crispness (also used for the interactive layer)."""
    pc = p[..., :3]
    pl = (pc * np.array([0.3, 0.55, 0.15])).sum(-1, keepdims=True)
    pc = np.clip(pl + (pc - pl) * 1.18, 0, 1) * 1.07 + 0.015
    pa = p[..., 3:4]
    pc = blur(pc * pa, 0.7) / np.maximum(blur(pa, 0.7), 1e-3)
    pa = blur(pa, 0.5)
    return np.clip(pc, 0, 1), np.clip(pa, 0, 1)


def palette(h):
    day = ss(0.05, 0.6, h)
    dusk = 1 - ss(-0.25, 0.1, h)
    deep = ss(-0.05, -0.5, h)
    top = mix(mix(C('#9DB9E2'), C('#86B4E4'), day), mix(C('#4C5C95'), C('#0E1630'), deep), dusk)
    hor = mix(mix(C('#F8C7BE'), C('#F3D3D3'), day), mix(C('#EE9DAE'), C('#2A3866'), deep), dusk)
    return top, hor, day


def compose(T, PRE, h, SUNX=0.8, grain=True):
    m = np.load(f'{T}/{PRE}_m.npy'); s = np.load(f'{T}/{PRE}_s.npy'); p = np.load(f'{T}/{PRE}_p.npy'); g = np.load(f'{T}/{PRE}_g.npy')
    H, W = m.shape[:2]
    yy = (np.arange(H)[:, None] / H).astype(np.float32)
    xx = (np.arange(W)[None, :] / W).astype(np.float32)
    top, hor, day = palette(h)
    sky = mix(top, hor, (ss(0.0, 0.62, yy)[..., None]) ** 1.4)

    sy = 0.62 - 0.5 * h
    d = np.sqrt(((xx - SUNX) * W / H) ** 2 + (yy - sy) ** 2)[..., None]
    vis = ss(-0.12, 0.05, h)
    sky = sky + vis * (mix(C('#FFE3B0'), C('#FFF8EA'), day) * (1 - ss(0.026, 0.03, d)) * 0.9
                       + C('#FFC8A8') * np.exp(-d / 0.09) * 0.45 + C('#FFB2BE') * np.exp(-d / 0.35) * 0.18)
    sky = np.clip(sky, 0, 1.2)

    night = 1 - ss(-0.35, -0.05, h)
    if night > 0:
        rng = np.random.default_rng(71)
        st = np.zeros((H, W), np.float32)
        n = int(900 * W * H / (2560 * 1440))
        ys = (rng.random(n) ** 1.6 * 0.6 * H).astype(int); xs = (rng.random(n) * W).astype(int)
        st[ys, xs] = rng.random(n) * 0.9 + 0.1
        st = gaussian_filter(st, 0.8) * 2.2
        sky = sky + night * st[..., None] * C('#FFF4F0')
        md = np.sqrt(((xx - (1 - SUNX)) * W / H) ** 2 + (yy - 0.2) ** 2)[..., None]
        sky = sky + night * (C('#F6F1E6') * (1 - ss(0.018, 0.021, md)) + C('#9FB3E6') * np.exp(-md / 0.08) * 0.25)

    def grade(rgb, amount=1.0):
        warm = mix(C('#FFFFFF'), C('#FFE7DA'), 1 - day)
        out = rgb * warm
        out = mix(out, out * C('#C79AC0') * 1.25, (1 - ss(-0.05, 0.12, h)) * (1 - night) * amount)
        out = mix(out, (out.mean(-1, keepdims=True) * 0.6 + out * 0.4) * C('#3B4A86') * 1.25 + C('#141C3A') * 0.4, night)
        return out

    img = sky
    mr = mix(grade(m[..., :3]), hor, 0.18 + 0.25 * night)
    img = mix(img, mr, m[..., 3:4])
    img = mix(img, grade(s[..., :3]), s[..., 3:4])
    pc, pa = prep_pavilion(p)
    pr = grade(pc, 0.45)
    edge = np.clip(blur(1 - pa, 6) * pa, 0, 1)
    pr = pr + blur(img, 14) * edge * 0.55  # light wrap: the matte-painter's trick for seating a CG element
    img = mix(img, pr, pa)
    glow = 1 - ss(-0.15, 0.12, h)
    if glow > 0:
        gb = g + blur(g, 10) * 0.9 + blur(g, 46) * 0.7
        pool = blur(np.roll(g, int(H * 0.06), axis=0) * np.array([1.0, 0.75, 0.6]), 30) * (s[..., 3:4] * (1 - pa))
        img = img + (gb * np.array([1.0, 0.86, 0.72]) * 0.95 + pool * 2.2) * glow
    vg = 1 - 0.18 * (((xx - 0.5) * 1.3) ** 2 + ((yy - 0.55) * 1.6) ** 2)
    img = img * vg[..., None]
    if grain:
        rng = np.random.default_rng(3)
        img = img + rng.standard_normal((H, W, 1)).astype(np.float32) * 0.012
    return np.clip(img, 0, 1)


if __name__ == '__main__':
    T, h, OUT = sys.argv[1], float(sys.argv[2]), sys.argv[3]
    SUNX = float(sys.argv[4]) if len(sys.argv) > 4 else 0.80
    PRE = sys.argv[5] if len(sys.argv) > 5 else 'L'
    img = compose(T, PRE, h, SUNX)
    Image.fromarray((img * 255 + 0.5).astype('uint8')).save(OUT)
