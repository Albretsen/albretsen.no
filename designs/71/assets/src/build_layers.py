"""Build the matte-painting layers for design 71 ("Winter Pavilion").

Sources (CC0, Poly Haven, tonemapped JPG of the HDRIs):
  kiara_8_sunset     -> far golden mountains / cliffs  (layer: mountains)
  stierberg_sunrise  -> foreground snowfield in low sun (layer: snow)
  rolling_hills      -> golden hills for the second scene
Pavilion: rendered with three.js (src/pavilion.html) on black + white, alpha recovered exactly.

usage: python build_layers.py <tmpdir-with-dl/> <out-dir>
"""
import sys, os
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, os.path.dirname(__file__))
from reproj import view

T, OUT = sys.argv[1], sys.argv[2]
W, H = 2560, 1440


def smooth1d(a, k):
    k = int(k) | 1
    pad = np.pad(a, k // 2, mode='edge')
    return np.convolve(pad, np.ones(k) / k, mode='valid')


def save_rgba(arr, path, q=88):
    im = Image.fromarray((np.clip(arr, 0, 1) * 255 + 0.5).astype('uint8'), 'RGBA')
    im.save(path, 'WEBP', quality=q, method=6, alpha_quality=90)
    return im


def recover_alpha(pb, pw):
    # renders are linear-composited then sRGB-encoded: undo the encoding for an exact alpha
    lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    enc = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(np.clip(c, 0, None), 1 / 2.4) - 0.055)
    b = lin(np.asarray(Image.open(pb).convert('RGB')).astype(np.float32) / 255)
    w = lin(np.asarray(Image.open(pw).convert('RGB')).astype(np.float32) / 255)
    a = np.clip(1 - (w - b).mean(-1), 0, 1)
    rgb = np.where(a[..., None] > 1e-3, b / np.maximum(a[..., None], 1e-3), 0)
    # gentle filmic shoulder so whites don't clip
    rgb = rgb / (1 + 0.18 * rgb) * 1.18
    return np.dstack([np.clip(enc(np.clip(rgb, 0, 1)), 0, 1), a])


# ---------------- mountains ----------------
def mountains(src='kiara_8_sunset', yaw=22, pitch=3.0, hfov=52, thr=0.07, maxr=0.53):
    v = view(f'{T}/dl/{src}.jpg', yaw, pitch, hfov, W, H)
    r, g, b = v[..., 0], v[..., 1], v[..., 2]
    ns = ((r - b) > thr) | (v.mean(-1) < 0.55)  # land is warm or dark; the sky (even the pale horizon) is neither
    ns[: int(H * 0.25)] = False
    ridge = np.argmax(ns, axis=0).astype(np.float32)
    bad = (~ns.any(axis=0)) | (ridge > H * maxr)
    ridge[bad] = np.nan
    idx = np.arange(W)
    ridge = np.interp(idx, idx[~bad], ridge[~bad]).astype(np.float32)
    from scipy.ndimage import median_filter
    ridge = median_filter(ridge, size=81, mode='nearest')
    ridge = smooth1d(ridge, 7)
    yy = np.arange(H)[:, None].astype(np.float32)
    a = np.clip((yy - ridge[None, :] + 1.0) / 2.5, 0, 1)
    # grade: warm the cliffs toward apricot/flamingo, lift shadows, add atmospheric haze
    lum = v.mean(-1, keepdims=True)
    graded = v * np.array([1.06, 0.97, 0.96]) + 0.04
    haze = np.array([0.93, 0.80, 0.80])
    depth = np.clip((yy - ridge[None, :]) / (H * 0.25), 0, 1)[..., None]
    graded = graded * (0.78 + 0.22 * depth) + haze * (0.22 * (1 - depth))
    graded = 0.88 * graded + 0.12 * lum  # slight desaturation (matte look)
    return np.dstack([np.clip(graded, 0, 1), a]), ridge


# ---------------- snowfield ----------------
def snow(yaw=350, pitch=7, hfov=70, cy=0.668):
    v = view(f'{T}/dl/stierberg_sunrise.jpg', yaw, pitch, hfov, W, H)
    yy = np.arange(H)[:, None].astype(np.float32)
    xx = (np.arange(W)[None, :].astype(np.float32) / W - 0.5)
    crest = H * (cy + 0.018 * (xx * 2) ** 2)  # level, gently dished: symmetric
    a = np.clip((yy - crest) / 3.0, 0, 1)
    # sunlit lip just under the crest, then a cool band
    d = (yy - crest)
    lip = np.exp(-np.clip(d, 0, None) / 10.0) * (d > 0)
    cool = np.exp(-np.clip(d - 14, 0, None) / 90.0) * (d > 14)
    lum = (v * np.array([0.3, 0.55, 0.15])).sum(-1, keepdims=True)
    lo, hi = np.percentile(lum, 2), np.percentile(lum, 99.5)
    t = np.clip((lum - lo) / (hi - lo), 0, 1)
    shadow, mid, high = np.array([0.56, 0.62, 0.84]), np.array([0.86, 0.84, 0.93]), np.array([1.0, 0.965, 0.955])
    tone = np.where(t < 0.55, shadow + (mid - shadow) * (t / 0.55), mid + (high - mid) * ((t - 0.55) / 0.45))
    out = 0.8 * tone + 0.2 * v
    out = out * (1 - 0.10 * cool[..., None]) + np.array([0.70, 0.74, 0.92]) * 0.10 * cool[..., None]
    out = out + lip[..., None] * np.array([0.10, 0.07, 0.05])

    return np.dstack([np.clip(out, 0, 1), a]), crest


def pavilion(pre='pav'):
    p = recover_alpha(f'{T}/{pre}_b.png', f'{T}/{pre}_w.png')
    g = np.asarray(Image.open(f'{T}/{pre}_g.png').convert('RGB')).astype(np.float32) / 255
    return p, g


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    m, ridge = mountains()
    s, crest = snow()
    p, g = pavilion()
    np.save(f'{T}/L_m.npy', m); np.save(f'{T}/L_s.npy', s); np.save(f'{T}/L_p.npy', p); np.save(f'{T}/L_g.npy', g)
    print('A ridge rows', ridge.min(), ridge.max(), 'crest', crest.min(), crest.max())
    # scene B: golden hills, a snow plain, the ground station
    m, ridge = mountains('rolling_hills', 95, 1.0, 58, 0.05, 0.6)
    s, crest = snow(300, 9, 66, 0.70)
    p, g = pavilion('dish')
    np.save(f'{T}/B_m.npy', m); np.save(f'{T}/B_s.npy', s); np.save(f'{T}/B_p.npy', p); np.save(f'{T}/B_g.npy', g)
    print('B ridge rows', ridge.min(), ridge.max())
