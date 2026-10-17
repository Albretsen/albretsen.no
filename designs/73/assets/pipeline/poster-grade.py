"""Poster pass for 'Long Evening' renders.
Uses real screen-print grain lifted from a public-domain WPA poster scan
("See America", LCCN 98518589, Wikimedia Commons / LoC, public domain).
"""
import sys, numpy as np
from PIL import Image, ImageFilter

T = './work/'  # scratch dir: pd/seeamerica.jpg (Wikimedia Commons, LCCN 98518589), dl/Nunito.ttf
rng = np.random.default_rng(73)

def f32(im): return np.asarray(im.convert('RGB'), dtype=np.float32) / 255.0
def img(a): return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))

_grain = None
def poster_grain(size=768):
    """Tileable high-pass grain built from flat ink + paper patches of the PD scan."""
    global _grain
    if _grain is not None: return _grain
    src = Image.open(T + 'pd/seeamerica.jpg')
    patches = [(870, 1235, 1230, 1375), (245, 1060, 320, 1480), (880, 1240, 1100, 1370)]
    tile = np.zeros((size, size), np.float32); weight = np.zeros_like(tile)
    for _ in range(900):
        x0, y0, x1, y1 = patches[rng.integers(len(patches))]
        pw, ph = min(64, x1 - x0), min(64, y1 - y0)
        px = rng.integers(x0, x1 - pw + 1); py = rng.integers(y0, y1 - ph + 1)
        p = f32(src.crop((px, py, px + pw, py + ph))).mean(axis=2)
        p = p - np.asarray(Image.fromarray((p * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.2)), np.float32) / 255
        if rng.random() < .5: p = p[:, ::-1]
        if rng.random() < .5: p = p[::-1]
        tx, ty = rng.integers(0, size), rng.integers(0, size)
        win = np.outer(np.hanning(ph), np.hanning(pw)).astype(np.float32)
        for dy in (0, -size):
            for dx in (0, -size):
                ys, xs = ty + dy, tx + dx
                y0c, x0c = max(ys, 0), max(xs, 0); y1c, x1c = min(ys + ph, size), min(xs + pw, size)
                if y1c <= y0c or x1c <= x0c: continue
                sl = p[y0c - ys:y1c - ys, x0c - xs:x1c - xs]; w = win[y0c - ys:y1c - ys, x0c - xs:x1c - xs]
                tile[y0c:y1c, x0c:x1c] += sl * w; weight[y0c:y1c, x0c:x1c] += w
    tile = tile / np.maximum(weight, 1e-3)
    tile = tile / (tile.std() + 1e-6)
    _grain = tile
    return tile

def tiled(t, h, w, scale=1.0):
    if scale != 1.0:
        s = int(t.shape[0] * scale)
        t = np.asarray(Image.fromarray(((t - t.min()) / (t.max() - t.min()) * 255).astype(np.uint8)).resize((s, s), Image.BICUBIC), np.float32) / 255
        t = (t - t.mean()) / (t.std() + 1e-6)
    reps = (h // t.shape[0] + 1, w // t.shape[1] + 1)
    return np.tile(t, reps)[:h, :w]

def hexc(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255

def grade(a, warm=0.0, lift='#1d1f24', grain=0.02, clump=0.02, vign=0.08, seed=0, sat=1.12, contrast=1.05):
    h, w, _ = a.shape
    # 1. ink floor: nothing goes to pure black, shadows become palm-black ink
    floor = hexc(lift)
    a = a + floor * (1 - np.clip(a / 0.35, 0, 1)) ** 2
    # 2. gentle S-curve, keep it airy
    a = a + 0.06 * np.sin((a - 0.5) * np.pi) * (1 - a) * a * 4
    # 3. warmth toward peach in highlights (late light)
    if warm:
        lum = a.mean(axis=2, keepdims=True)
        a = a + warm * lum ** 2 * (hexc('#ffd9b8') - a) * 0.5
    # 3b. a little more ink density: saturation + contrast around mid grey
    lum = (a * np.array([0.2126, 0.7152, 0.0722], np.float32)).sum(axis=2, keepdims=True)
    a = lum + (a - lum) * sat
    a = 0.5 + (a - 0.5) * contrast
    # 4. real screen-print grain from the PD scan (luminance-weighted: strongest in mid tones)
    g = tiled(poster_grain(), h, w, scale=1.6 * w / 2400)
    lum = a.mean(axis=2, keepdims=True)
    mid = 1 - (2 * lum - 1) ** 2
    a = a + grain * g[..., None] * (0.35 + 0.65 * mid)
    # 5. clumped airbrush spatter: low-frequency noise thresholded into tiny ink specks
    r = np.random.default_rng(seed)
    n = r.random((h // 2, w // 2)).astype(np.float32)
    n = np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((w, h), Image.NEAREST), np.float32) / 255
    blob = np.asarray(Image.fromarray((r.random((h // 40, w // 40)) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), np.float32) / 255
    speck = ((n > 0.985) & (blob > 0.55)).astype(np.float32)
    a = a - clump * speck[..., None] * (a - floor) * 3
    # 6. soft vignette (paper falloff, not a photographic one)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = ((xx / w - 0.5) ** 2 * 1.1 + (yy / h - 0.48) ** 2 * 1.6)
    a = a * (1 - vign * np.clip(d * 2.2, 0, 1)[..., None] ** 1.5)
    return np.clip(a, 0, 1)

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    warm = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
    a = f32(Image.open(src))
    # print softness: a hair of blur, like ink sitting in paper
    a = f32(img(a).filter(ImageFilter.GaussianBlur(0.45)))
    out = grade(a, warm=warm)
    img(out).save(dst)
    print('graded', dst)
