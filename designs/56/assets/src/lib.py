import numpy as np
from PIL import Image, ImageFilter
Image.MAX_IMAGE_PIXELS = None
T = '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.ARFqOUlHoH'

_cache = {}
def pano(name):
    if name not in _cache:
        im = Image.open(f'{T}/dl/{name}.jpg').convert('RGB')
        if im.width > 8192: im = im.resize((8192, 4096), Image.LANCZOS)
        _cache[name] = np.asarray(im)
    return _cache[name]

def view(name, yaw, pitch, fov, w, h, ss=2):
    """Gnomonic (rectilinear) projection of an equirect panorama."""
    P = pano(name); H, W, _ = P.shape
    W2, H2 = w*ss, h*ss
    f = (W2/2) / np.tan(np.radians(fov)/2)
    xs = np.arange(W2) - W2/2 + 0.5; ys = np.arange(H2) - H2/2 + 0.5
    X, Y = np.meshgrid(xs, ys)
    Z = np.full_like(X, f)
    # direction: x right, y down, z forward
    d = np.stack([X, -Y, Z], -1); d /= np.linalg.norm(d, axis=-1, keepdims=True)
    p = np.radians(pitch); cy, sy = np.cos(p), np.sin(p)
    dy = d[..., 1]*cy + d[..., 2]*sy; dz = -d[..., 1]*sy + d[..., 2]*cy; dx = d[..., 0]
    lon = np.arctan2(dx, dz) + np.radians(yaw); lat = np.arcsin(np.clip(dy, -1, 1))
    u = ((lon/(2*np.pi) + 0.5) % 1.0) * W; v = (0.5 - lat/np.pi) * H
    u0 = np.floor(u).astype(int) % W; v0 = np.clip(np.floor(v).astype(int), 0, H-1)
    u1 = (u0+1) % W; v1 = np.clip(v0+1, 0, H-1)
    fu = (u-np.floor(u))[..., None]; fv = (v-np.floor(v))[..., None]
    out = (P[v0, u0]/255.0*(1-fu)*(1-fv) + P[v0, u1]/255.0*fu*(1-fv) + P[v1, u0]/255.0*(1-fu)*fv + P[v1, u1]/255.0*fu*fv)
    img = Image.fromarray((np.clip(out, 0, 1)*255).astype(np.uint8))
    return img.resize((w, h), Image.LANCZOS) if ss != 1 else img

def hexrgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], np.float32)

def lum(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32)/255
    a = a**2.2
    return (0.2126*a[..., 0] + 0.7152*a[..., 1] + 0.0722*a[..., 2])**(1/2.2)

def levels(L, lo=0.0, hi=1.0, gamma=1.0):
    return np.clip((L-lo)/(hi-lo), 0, 1)**gamma

def bayer(n):
    M = np.array([[0, 2], [3, 1]], np.float32)
    while M.shape[0] < n:
        M = np.block([[4*M, 4*M+2], [4*M+3, 4*M+1]])
    return (M + 0.5) / M.size

def ordered(L, n=8):
    B = bayer(n); h, w = L.shape
    t = np.tile(B, (h//n+1, w//n+1))[:h, :w]
    return (L > t).astype(np.float32)

def ordered_multi(L, levels_n=3, n=8):
    """Quantise to levels_n tones with ordered dither between them; returns index map."""
    B = bayer(n); h, w = L.shape
    t = np.tile(B, (h//n+1, w//n+1))[:h, :w]
    v = L*(levels_n-1)
    base = np.floor(v); frac = v-base
    idx = base + (frac > t)
    return np.clip(idx, 0, levels_n-1).astype(np.int32)

def atkinson(L):
    a = L.copy().astype(np.float32); h, w = a.shape
    out = np.zeros_like(a)
    for y in range(h):
        row = a[y]
        for x in range(w):
            old = row[x]; new = 1.0 if old > 0.5 else 0.0
            out[y, x] = new; e = (old-new)/8
            if x+1 < w: row[x+1] += e
            if x+2 < w: row[x+2] += e
            if y+1 < h:
                if x > 0: a[y+1, x-1] += e
                a[y+1, x] += e
                if x+1 < w: a[y+1, x+1] += e
            if y+2 < h: a[y+2, x] += e
    return out

def colorize(idx, colors):
    pal = np.stack([hexrgb(c) for c in colors])
    return Image.fromarray(pal[idx.astype(int)].astype(np.uint8))

def upscale(img, k):
    return img.resize((img.width*k, img.height*k), Image.NEAREST)

def unsharp(img, r=2, p=80):
    return img.filter(ImageFilter.UnsharpMask(radius=r, percent=p, threshold=2))


def autolev(L, plo=1.5, phi=98.5, gamma=1.0):
    lo, hi = np.percentile(L, plo), np.percentile(L, phi)
    return np.clip((L-lo)/(hi-lo+1e-6), 0, 1)**gamma
