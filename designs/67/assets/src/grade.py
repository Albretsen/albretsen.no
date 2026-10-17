"""Amber Hour grading pipeline for design 67.
Gradient-map every photograph into one warm amber family (burnt umber -> cream),
replace blue skies with a procedural peach/mauve dusk haze, add sun bloom + grain."""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

T = '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.gnTd028yfQ'

def hx(h):
    h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], np.float32) / 255

# The amber family, shadow -> highlight
AMBER = [(0.00, '#1E0F08'), (0.16, '#3B1D0E'), (0.34, '#6E3816'), (0.52, '#A65E27'),
         (0.68, '#D18E4A'), (0.82, '#EDBF84'), (0.92, '#F8DFB6'), (1.00, '#FFF6E6')]

def lut(stops, n=1024):
    xs = np.array([s[0] for s in stops]); cs = np.stack([hx(s[1]) for s in stops])
    t = np.linspace(0, 1, n)
    return np.stack([np.interp(t, xs, cs[:, i]) for i in range(3)], 1)

AMB_LUT = lut(AMBER)

def load(p, box=None, size=None):
    im = Image.open(p).convert('RGB')
    if box: im = im.crop(box)
    if size: im = im.resize(size, Image.LANCZOS)
    return np.asarray(im).astype(np.float32) / 255

def lum(a): return a[..., 0] * .2126 + a[..., 1] * .7152 + a[..., 2] * .0722

def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

def sky_mask(a, thresh=0.06, bright=0.0, feather=2.5, top_connected=True):
    """Blue sky: blue dominates red. Keep only regions touching the top edge."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    blueness = b - r
    m = smooth(thresh * 0.5, thresh * 1.6, blueness) * smooth(bright - .05, bright + .05, lum(a))
    if top_connected:
        lab, n = ndimage.label(m > 0.5)
        keep = set(np.unique(lab[0])) - {0}
        hard = np.isin(lab, list(keep))
        hard = ndimage.binary_fill_holes(hard) if False else hard
        m = np.where(hard, np.maximum(m, .0), 0) * 1.0
        # soft edge, but only grow inside the soft candidate
        m = ndimage.gaussian_filter(hard.astype(np.float32), feather) * smooth(thresh*0.2, thresh, blueness).clip(.0, 1)
        m = np.maximum(m, hard * 1.0 * 0.0)
        m = np.clip(m * 1.15, 0, 1)
    return m

def dusk_sky(h, w, horizon=0.85, sun=(0.7, 0.8), sun_r=0.05, top='#6F5878', mid='#D98E78', low='#F6C79A', hz='#FFE7C4', glow=1.0):
    """Procedural LA-dusk haze: mauve zenith -> peach -> pale gold horizon, with a soft sun."""
    y = np.linspace(0, 1, h)[:, None] / horizon
    y = np.clip(y, 0, 1)
    stops = [(0, top), (0.45, mid), (0.78, low), (1.0, hz)]
    L = lut(stops, 2048)
    sky = L[(y * 2047).astype(int)][:, :, :] * np.ones((1, w, 1), np.float32)
    sky = np.broadcast_to(sky, (h, w, 3)).copy()
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.hypot((xx / w - sun[0]) * (w / h), yy / h - sun[1])
    halo = np.exp(-(d / (sun_r * 6)) ** 2) * 0.55 * glow + np.exp(-(d / (sun_r * 18)) ** 2) * 0.22 * glow
    disc = smooth(sun_r * 1.02, sun_r * 0.92, d)
    sunc = hx('#FFF3DC')
    sky = sky + halo[..., None] * (hx('#FFD9A0') - sky) * 1.0
    sky = sky * (1 - disc[..., None]) + sunc * disc[..., None]
    # faint horizontal haze bands (LA smog strata)
    bands = (np.sin(yy / h * 90 + np.sin(xx / w * 3) * 1.5) * 0.5 + 0.5) ** 4 * 0.009
    sky = sky + bands[..., None] * smooth(0.3, 0.8, yy / h)[..., None]
    return np.clip(sky, 0, 1)

def amber(a, contrast=1.0, pivot=0.5, gamma=1.0, keep=0.18, lift=0.0):
    L = lum(a)
    L = np.clip((L - pivot) * contrast + pivot, 0, 1) ** gamma
    L = lift + L * (1 - lift)
    g = AMB_LUT[(L * 1023).astype(int)]
    # keep a little of the original hue, warmed
    warm = a * np.array([1.08, 0.98, 0.82], np.float32)
    return np.clip(g * (1 - keep) + warm * keep, 0, 1)

def bloom(a, sun_xy, strength=0.35, radius=0.5):
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.hypot((xx / w - sun_xy[0]) * (w / h), yy / h - sun_xy[1])
    g = np.exp(-(d / radius) ** 2) * strength
    c = hx('#FFD39A')
    return np.clip(1 - (1 - a) * (1 - c * g[..., None]), 0, 1)  # screen

def haze(a, amount=0.18, color='#F3C9A2', start=0.5, end=1.0):
    h = a.shape[0]
    y = np.linspace(0, 1, h)[:, None, None]
    m = smooth(start, end, y) * amount
    return a * (1 - m) + hx(color) * m

def vignette(a, s=0.22):
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.hypot((xx / w - .5) * 1.2, yy / h - .5)
    v = 1 - smooth(0.35, 0.85, d) * s
    return a * v[..., None]

def grain(a, amt=0.028, seed=7):
    rng = np.random.default_rng(seed)
    n = rng.normal(0, 1, a.shape[:2]).astype(np.float32)
    n = ndimage.gaussian_filter(n, 0.6)
    n = n / (n.std() + 1e-6)
    L = lum(a)
    w = amt * (0.4 + 0.6 * (1 - np.abs(L - 0.5) * 2))  # strongest in midtones
    return np.clip(a + (n * w)[..., None], 0, 1)

def to_img(a): return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))

def export(im, base, widths, q=(80, 72, 58)):
    """Write base-{w}.jpg/.webp/.avif for each width."""
    out = []
    for w in widths:
        h = round(im.height * w / im.width)
        r = im.resize((w, h), Image.LANCZOS)
        r.save(f'{base}-{w}.jpg', quality=q[0], optimize=True, progressive=True, subsampling='4:2:0')
        r.save(f'{base}-{w}.webp', quality=q[1], method=6)
        r.save(f'{base}-{w}.avif', quality=q[2], speed=4)
        out.append((w, h))
    return out
