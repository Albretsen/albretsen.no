"""Shared grading helpers: afterglow sky, Portra-ish film curve, halation, grain."""
import numpy as np
import cv2


def hexrgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255.0


def srgb_to_lin(x):
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)


def lin_to_srgb(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * x ** (1 / 2.4) - 0.055)


def load(path, maxw=None):
    im = cv2.imread(path, cv2.IMREAD_COLOR)[:, :, ::-1].astype(np.float32) / 255.0
    if maxw and im.shape[1] > maxw:
        s = maxw / im.shape[1]
        im = cv2.resize(im, (maxw, int(im.shape[0] * s)), interpolation=cv2.INTER_AREA)
    return im


def save(path, im, q=92):
    out = (np.clip(im, 0, 1) * 255 + 0.5).astype(np.uint8)[:, :, ::-1]
    cv2.imwrite(path, out, [cv2.IMWRITE_JPEG_QUALITY, q])


def lum(im):
    return im[..., 0] * 0.2126 + im[..., 1] * 0.7152 + im[..., 2] * 0.0722


def gradient_stops(t, stops):
    """t: array 0..1, stops: [(pos, hex)] -> rgb array"""
    pos = np.array([s[0] for s in stops], np.float32)
    cols = np.array([hexrgb(s[1]) for s in stops], np.float32)
    out = np.zeros(t.shape + (3,), np.float32)
    for c in range(3):
        out[..., c] = np.interp(t, pos, cols[:, c])
    return out


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)


def afterglow_sky(h, w, horizon, sun_x, stops, glow_col='#ffd9b0', glow_amt=0.55, glow_w=0.35):
    """Sky of size h x w, horizon at pixel row `horizon` (sky gradient spans 0..horizon).
    sun_x: 0..1 horizontal position of the set sun (glow centre)."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    t = np.clip(yy / max(horizon, 1), 0, 1)
    sky = gradient_stops(t, stops)
    # horizontal glow: ellipse centred at sun, hugging horizon
    dx = (xx / w - sun_x) / glow_w
    dy = (horizon - yy) / (h * 0.55)
    d = np.sqrt(dx * dx + np.maximum(dy, 0) ** 2 * 3.0)
    g = np.exp(-d * d * 1.6) * glow_amt
    sky = sky * (1 - g[..., None]) + hexrgb(glow_col) * g[..., None]
    return sky


def portra(im, lift=0.035, shoulder=0.92, warm=0.02, sat=0.92):
    """Soft film curve: lifted blacks, gentle shoulder, warm highlights, cool-ish shadows."""
    x = np.clip(im, 0, 1)
    # filmic S curve via smooth toe and shoulder
    y = lift + (1 - lift) * x
    y = y + 0.06 * np.sin(np.pi * 2 * y) * 0.5  # mild S around mid
    k = 1 - shoulder
    over = np.maximum(y - shoulder, 0)
    y = np.where(y > shoulder, shoulder + k * np.tanh(over / k), y)
    y = np.clip(y, 0, 1)
    L = lum(y)[..., None]
    y = L + (y - L) * sat
    # split tone
    hi = smoothstep(0.45, 1.0, L)
    lo = 1 - smoothstep(0.0, 0.45, L)
    y = y + hi * np.array([warm, warm * 0.45, -warm * 0.6], np.float32)
    y = y + lo * np.array([-0.006, 0.004, 0.018], np.float32)
    return np.clip(y, 0, 1)


def halation(im, thresh=0.78, radius=0.012, col='#ff6a4a', amt=0.22):
    h, w = im.shape[:2]
    L = lum(im)
    m = np.clip((L - thresh) / (1 - thresh), 0, 1).astype(np.float32)
    r = max(3, int(w * radius)) | 1
    b = cv2.GaussianBlur(m, (0, 0), r / 2.5)
    return np.clip(im + b[..., None] * hexrgb(col) * amt, 0, 1)


def bloom(im, thresh=0.7, sigma=0.02, amt=0.25):
    h, w = im.shape[:2]
    L = lum(im)
    m = np.clip((L - thresh) / (1 - thresh), 0, 1)[..., None] * im
    b = cv2.GaussianBlur(m.astype(np.float32), (0, 0), w * sigma)
    return np.clip(1 - (1 - im) * (1 - b * amt), 0, 1)


def grain(im, amt=0.035, size=1.2, seed=7):
    import os
    amt = amt * float(os.environ.get("GRAIN", "1"))
    if amt <= 0:
        return im
    h, w = im.shape[:2]
    rng = np.random.default_rng(seed)
    n = rng.normal(0, 1, (h, w)).astype(np.float32)
    if size > 1:
        n = cv2.GaussianBlur(n, (0, 0), size * 0.5)
        n /= n.std() + 1e-6
    L = lum(im)
    weight = (0.35 + 0.65 * (1 - np.abs(L - 0.45) * 1.6)).clip(0.15, 1)  # most in mids
    chroma = rng.normal(0, 1, (h // 2 + 1, w // 2 + 1, 3)).astype(np.float32)
    chroma = cv2.resize(chroma, (w, h))
    out = im + (n * weight)[..., None] * amt + chroma * amt * 0.08
    return np.clip(out, 0, 1)


def vignette(im, amt=0.22, col='#2a1f3d'):
    h, w = im.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx / w - 0.5) * 1.1) ** 2 + ((yy / h - 0.5) * 1.0) ** 2)
    v = smoothstep(0.35, 0.85, d) * amt
    return im * (1 - v[..., None]) + hexrgb(col) * v[..., None] * 0.6 + im * v[..., None] * 0.4 * 0


def feather(mask, sigma):
    return cv2.GaussianBlur(mask.astype(np.float32), (0, 0), sigma)
