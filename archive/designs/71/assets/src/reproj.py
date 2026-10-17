import numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
_cache = {}


def load(p):
    if p not in _cache:
        _cache[p] = np.asarray(Image.open(p).convert('RGB')).astype(np.float32) / 255
    return _cache[p]


def view(p, yaw, pitch, hfov, W, H, cx=0.5, cy=0.5):
    """Rectilinear view from an equirect. cx/cy = principal point (fraction) for shifted lens."""
    eq = load(p)
    h, w, _ = eq.shape
    f = (W / 2) / np.tan(np.radians(hfov) / 2)
    xs = np.arange(W) - W * cx + 0.5
    ys = np.arange(H) - H * cy + 0.5
    X, Y = np.meshgrid(xs, ys)
    d = np.stack([X, -Y, np.full_like(X, f)], -1)
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    cp, sp = np.cos(np.radians(pitch)), np.sin(np.radians(pitch))
    y2 = d[..., 1] * cp + d[..., 2] * sp
    z2 = -d[..., 1] * sp + d[..., 2] * cp
    x2 = d[..., 0]
    lon = np.arctan2(x2, z2) + np.radians(yaw)
    lat = np.arcsin(np.clip(y2, -1, 1))
    u = ((lon / (2 * np.pi)) % 1.0) * w
    v = (0.5 - lat / np.pi) * h
    x0 = np.floor(u).astype(int)
    y0 = np.clip(np.floor(v).astype(int), 0, h - 2)
    fx = (u - np.floor(u))[..., None]
    fy = np.clip(v - y0, 0, 1)[..., None]
    x0 %= w
    x1 = (x0 + 1) % w
    a = eq[y0, x0] * (1 - fx) + eq[y0, x1] * fx
    b = eq[y0 + 1, x0] * (1 - fx) + eq[y0 + 1, x1] * fx
    return a * (1 - fy) + b * fy
