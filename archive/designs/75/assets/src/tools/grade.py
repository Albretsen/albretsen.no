"""Golden-hour grading for design 75 (Front Light).
Gradient-maps luminance into one amber family (cream -> burnt umber), keeps a
little of the source chroma, adds a low sun glow and fine grain."""
import os, sys, numpy as np
from PIL import Image, ImageFilter
Image.MAX_IMAGE_PIXELS = None

T = sys.argv[1]           # temp root
OUT = sys.argv[2]         # designs/75/assets
DL = os.path.join(T, 'dl')
WORK = os.path.join(T, 'work'); os.makedirs(WORK, exist_ok=True)

STOPS = [
    (0.00, '#1c0e07'), (0.16, '#3d2013'), (0.34, '#7a3d1f'), (0.52, '#b8662f'),
    (0.68, '#dc9447'), (0.82, '#efc07e'), (0.92, '#f7dfb3'), (1.00, '#fcf3e3'),
]
def hx(h): return np.array([int(h[i:i+2], 16) for i in (1, 3, 5)], float) / 255
SP = np.array([s[0] for s in STOPS]); SC = np.stack([hx(s[1]) for s in STOPS])

def gmap(l):
    out = np.empty(l.shape + (3,))
    for c in range(3):
        out[..., c] = np.interp(l, SP, SC[:, c])
    return out

def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

def lum(a): return a @ np.array([0.2126, 0.7152, 0.0722])

def grade(a, gamma=1.0, lift=0.0, gain=1.0, chroma=0.18, knee=1.0):
    l = lum(a)
    l = np.clip((l ** gamma) * gain + lift, 0, 1)
    l = np.where(l > knee, knee + (l - knee) * 0.35, l)
    l = smooth(0, 1, l) * 0.35 + l * 0.65            # gentle S-curve
    g = gmap(l)
    # keep a touch of original chroma, warmed
    src = a - lum(a)[..., None]
    g = g + src * chroma
    return np.clip(g, 0, 1)

def glow(h, w, cx, cy, r, strength, color='#fff1d0'):
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - cx) / r) ** 2 + ((yy - cy) / r) ** 2)
    k = np.exp(-d * d * 1.6) * strength
    return k[..., None] * hx(color)

def grain(h, w, s=0.014, seed=7):
    rng = np.random.default_rng(seed)
    n = rng.normal(0, 1, (h // 2 + 1, w // 2 + 1)).astype(np.float32)
    n = np.asarray(Image.fromarray(((n * 40) + 128).clip(0, 255).astype(np.uint8)).resize((w, h), Image.BILINEAR)).astype(float)
    return ((n - 128) / 40 * s)[..., None]

def save_set(img, name, widths, q=80, alpha=False, folder='hero'):
    d = os.path.join(OUT, folder); os.makedirs(d, exist_ok=True)
    W, H = img.size
    for w in widths:
        h = round(H * w / W)
        r = img.resize((w, h), Image.LANCZOS)
        if alpha:
            r.save(os.path.join(d, f'{name}-{w}.webp'), quality=q, method=6)
            pass
        else:
            r = r.convert('RGB')
            r.save(os.path.join(d, f'{name}-{w}.webp'), quality=q, method=6)
            r.save(os.path.join(d, f'{name}-{w}.jpg'), quality=q + 2, optimize=True, progressive=True)
            r.save(os.path.join(WORK, f'{name}-{w}.png'))
        print(name, w, h)

def fjord():
    im = Image.open(os.path.join(DL, 'praek.tiff')).convert('RGB')
    im = im.crop((64, 48, 3380, 2360))
    a = np.asarray(im).astype(float) / 255
    h, w, _ = a.shape
    l0 = lum(a)
    # sky mask from blurred luminance, above the waterline only
    lb = np.asarray(Image.fromarray((l0 * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(float) / 255
    yy = np.mgrid[0:h, 0:w][0]
    water = 1640 - 48
    sky = smooth(0.605, 0.655, lb) * (1 - smooth(h * 0.448, h * 0.458, yy))
    # remove isolated bright specks (waterfall) below the gap
    xg = np.mgrid[0:h, 0:w][1]
    sky = np.where((yy < h * 0.2) & (xg > w * 0.37) & (xg < w * 0.6), np.maximum(sky, smooth(0.15, 0.25, lb)), sky)
    skyimg = Image.fromarray((sky * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9)).filter(ImageFilter.GaussianBlur(1.2))
    sky = np.asarray(skyimg).astype(float) / 255
    g = grade(a, gamma=1.25, gain=1.0, chroma=0.07, knee=0.7)
    # sky: sand at the zenith turning to cream at the horizon
    t = (yy / h)
    ts = np.clip(t / 0.47, 0, 1)
    skygrad = gmap(0.775 + 0.20 * ts ** 1.8)
    skycol = g * 0.25 + skygrad * 0.75
    # low sun sitting in the V of the fjord
    cx, cy = w * 0.466, h * 0.447
    sun = glow(h, w, cx, cy, w * 0.11, 0.55) + glow(h, w, cx, cy, w * 0.035, 0.32, '#fffaf0')
    rr = np.sqrt((np.mgrid[0:h, 0:w][1] - cx) ** 2 + (yy - cy) ** 2)
    R = w * 0.021
    disc = 1 - smooth(R - 2.5, R + 2.5, rr)
    skycol = np.clip(skycol + sun, 0, 1)
    skycol = skycol * (1 - disc[..., None]) + hx('#fff7e6') * disc[..., None]
    g = g * (1 - sky[..., None]) + skycol * sky[..., None]
    # warm atmospheric haze over everything near the sun (light wrap)
    g = np.clip(g + glow(h, w, cx, cy, w * 0.30, 0.10, '#f4b56a') * (1 - sky[..., None] * 0.6), 0, 1)
    # the sun's path on the water: a long soft streak below the gap
    xx = np.mgrid[0:h, 0:w][1]
    wl = water
    streak = np.exp(-((xx - cx) / (w * 0.028)) ** 2) * np.exp(-((yy - wl) / (h * 0.22)) ** 2) * (yy > wl - 4)
    rng = np.random.default_rng(11)
    nz = Image.fromarray((rng.random((h // 6 + 1, w // 60 + 1)) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    shimmer = 0.55 + 0.45 * (np.asarray(nz).astype(float) / 255)
    streak = streak * smooth(wl - 4, wl + 30, yy)
    g = np.clip(g + (streak * shimmer * 0.30)[..., None] * hx('#ffe2a8'), 0, 1)
    # vignette to umber at the bottom (water) for text legibility
    vig = smooth(0.55, 1.0, t)[..., None] * 0.35
    g = g * (1 - vig) + hx('#1c0e07') * vig
    g = np.clip(g + grain(h, w, 0.012), 0, 1)
    out = Image.fromarray((g * 255).astype(np.uint8))
    out.save(os.path.join(WORK, 'fjord-full.png'))
    save_set(out, 'fjord', [960, 1600, 2400], q=78)
    # front layer: everything that is NOT sky (cliffs + water), with alpha
    alpha = Image.fromarray(((1 - sky) * 255).astype(np.uint8))
    front = out.copy(); front.putalpha(alpha)
    save_set(front, 'fjord-front', [960, 1600, 2400], q=80, alpha=True)
    # portrait crop centred on the gap
    pw = int(h * 0.62); x0 = int(cx - pw * 0.52)
    p = out.crop((x0, 0, x0 + pw, h))
    save_set(p, 'fjord-portrait', [640, 1080], q=78)
    pf = front.crop((x0, 0, x0 + pw, h))
    save_set(pf, 'fjord-front-portrait', [640, 1080], q=80, alpha=True)
    # split: RIGHT layer = sunlit far mountain + distant ridge (+ water), without the near left cliff
    from PIL import ImageDraw
    # split along a polyline that follows the near cliff's sunlit edge (UV of this crop)
    PL = [(0.36, 0), (0.345, 0.13), (0.392, 0.235), (0.415, 0.30), (0.43, 0.38), (0.435, 0.46), (0.45, 0.52), (0.475, 0.58), (0.485, 0.68), (0.49, 1.0)]
    ys = np.array([q[1] for q in PL]) * h; xs = np.array([q[0] for q in PL]) * w
    edge = np.interp(np.arange(h), ys, xs)
    xx2 = np.mgrid[0:h, 0:w][1]
    left = ((xx2 < edge[:, None]) & (yy < water - 8)).astype(float)
    left = np.asarray(Image.fromarray((left * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(float) / 255
    print('left share', left.mean())
    ra = (1 - sky) * (1 - left)
    right = out.copy(); right.putalpha(Image.fromarray((ra * 255).astype(np.uint8)))
    save_set(right, 'fjord-front-right', [960, 1600, 2400], q=80, alpha=True)
    save_set(right.crop((x0, 0, x0 + pw, h)), 'fjord-front-right-portrait', [640, 1080], q=80, alpha=True)

def orbit():
    im = Image.open(os.path.join(DL, 'nasa_limb.jpg')).convert('RGB')
    W, H = im.size
    im = im.crop((0, 0, W, int(H * 0.86)))
    a = np.asarray(im).astype(float) / 255
    h, w, _ = a.shape
    g = grade(a, gamma=0.85, gain=1.08, chroma=0.10)
    g = np.clip(g + grain(h, w, 0.016, 3), 0, 1)
    out = Image.fromarray((g * 255).astype(np.uint8))
    save_set(out, 'orbit', [960, 1600, 2400], q=78)

def town():
    im = Image.open(os.path.join(DL, 'odda.tif')).convert('RGB')
    im = im.crop((64, 48, 3360, 2330))
    a = np.asarray(im).astype(float) / 255
    h, w, _ = a.shape
    g = grade(a, gamma=0.9, gain=1.05, chroma=0.2)
    g = np.clip(g + glow(h, w, w * 0.9, h * 0.12, w * 0.35, 0.25, '#f6c88a') + grain(h, w, 0.012, 5), 0, 1)
    out = Image.fromarray((g * 255).astype(np.uint8))
    out.save(os.path.join(WORK, 'town-full.png'))
    save_set(out, 'town', [960, 1600], q=78)

def glacier():
    im = Image.open(os.path.join(DL, 'folgefonn.jpg')).convert('RGB')
    im = im.crop((0, 0, im.size[0], int(im.size[1] * 0.46)))  # sky and ridge only
    a = np.asarray(im).astype(float) / 255
    h, w, _ = a.shape
    g = grade(a, gamma=1.1, gain=1.0, chroma=0.15)
    g = np.clip(g + grain(h, w, 0.012, 9), 0, 1)
    out = Image.fromarray((g * 255).astype(np.uint8))
    out.save(os.path.join(WORK, 'ridge-full.png'))
    save_set(out, 'ridge', [960, 1600], q=78)

def lake():
    im = Image.open(os.path.join(DL, 'lyngen.tif')).convert('RGB')
    im = im.crop((62, 50, 3355, 2330))
    a = np.asarray(im).astype(float) / 255
    h, w, _ = a.shape
    g = grade(a, gamma=1.15, gain=1.0, chroma=0.08, knee=0.78)
    g = np.clip(g + glow(h, w, w * 0.16, h * 0.30, w * 0.30, 0.22, '#fbe3b4') + grain(h, w, 0.012, 13), 0, 1)
    out = Image.fromarray((g * 255).astype(np.uint8))
    save_set(out, 'lake', [960, 1600], q=78)

def village():
    im = Image.open(os.path.join(DL, 'vik.tif')).convert('RGB')
    im = im.crop((62, 50, 3350, 2340))
    a = np.asarray(im).astype(float) / 255
    h, w, _ = a.shape
    g = grade(a, gamma=1.1, gain=1.02, chroma=0.10, knee=0.8)
    g = np.clip(g + glow(h, w, w * 0.78, h * 0.22, w * 0.32, 0.22, '#fbe3b4') + grain(h, w, 0.012, 17), 0, 1)
    out = Image.fromarray((g * 255).astype(np.uint8))
    save_set(out, 'village', [960, 1600], q=78)

if __name__ == '__main__':
    for job in sys.argv[3:]:
        globals()[job]()
