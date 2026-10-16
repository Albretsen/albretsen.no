"""Spectral caustic renderer for design 39 ("Cold Boot / Prism Echo").
Light passes through a refractive height-field; each wavelength bends by a
slightly different amount (dispersion), so bright caustic lines split into
thin rainbows. Everything else stays grey.
"""
import numpy as np

def cie_xyz(lam):
    # Wyman, Sloan, Shirley 2013 multi-lobe fit of CIE 1931 2deg observer
    def g(x, mu, s1, s2):
        s = np.where(x < mu, s1, s2)
        return np.exp(-0.5 * ((x - mu) / s) ** 2)
    x = 1.056*g(lam,599.8,37.9,31.0) + 0.362*g(lam,442.0,16.0,26.7) - 0.065*g(lam,501.1,20.4,26.2)
    y = 0.821*g(lam,568.8,46.9,40.5) + 0.286*g(lam,530.9,16.3,31.1)
    z = 1.217*g(lam,437.0,11.8,36.0) + 0.681*g(lam,459.0,26.0,13.8)
    return np.array([x, y, z])

M = np.array([[3.2406,-1.5372,-0.4986],[-0.9689,1.8758,0.0415],[0.0557,-0.2040,1.0570]])

_L = np.linspace(405, 695, 64)
_WB = (M @ cie_xyz(_L)).mean(axis=1)

def lam_rgb(lam):
    return (M @ cie_xyz(lam)) / _WB

def fbm(shape, beta=3.2, lo=0.0, hi=1.0, seed=0):
    rng = np.random.default_rng(seed)
    H, W = shape
    ky = np.fft.fftfreq(H)[:, None]; kx = np.fft.rfftfreq(W)[None, :]
    k = np.sqrt(kx**2 + ky**2); k[0, 0] = 1
    spec = (rng.normal(size=k.shape) + 1j*rng.normal(size=k.shape)) / k**(beta/2)
    kk = k / k.max()
    spec *= ((kk >= lo) & (kk <= hi))
    spec[0, 0] = 0
    f = np.fft.irfft2(spec, s=shape)
    return (f / f.std()).astype(np.float32)

def render(h, out_wh, strength, dispersion=0.06, nlam=18, offset=(0, 0), weight=None, scale=None):
    """h: height field sampled at ray grid (Hr,Wr). Returns linear RGB (H,W,3)."""
    Wo, Ho = out_wh
    Hr, Wr = h.shape
    gy, gx = np.gradient(h)
    ys, xs = np.mgrid[0:Hr, 0:Wr].astype(np.float32)
    sx, sy = (Wo / Wr, Ho / Hr) if scale is None else (scale, scale)
    img = np.zeros((Ho * Wo, 3), np.float64)
    lams = np.linspace(405, 695, nlam)
    norm = 0
    w0 = np.ones_like(h) if weight is None else weight
    for lam in lams:
        k = strength * (1 + dispersion * (550 - lam) / 100.0)
        px = (xs + k * gx) * sx + offset[0]
        py = (ys + k * gy) * sy + offset[1]
        x0 = np.floor(px).astype(np.int64); y0 = np.floor(py).astype(np.int64)
        fx = px - x0; fy = py - y0
        acc = np.zeros(Ho * Wo, np.float64)
        for dx, dy, ww in ((0,0,(1-fx)*(1-fy)),(1,0,fx*(1-fy)),(0,1,(1-fx)*fy),(1,1,fx*fy)):
            X = x0 + dx; Y = y0 + dy
            m = (X >= 0) & (X < Wo) & (Y >= 0) & (Y < Ho)
            acc += np.bincount((Y[m] * Wo + X[m]), weights=(ww * w0)[m], minlength=Ho*Wo)
        c = lam_rgb(lam)
        img += acc[:, None] * c[None, :]
        norm += 1
    img = img.reshape(Ho, Wo, 3) / norm
    img *= (sx * sy)  # mean intensity ~1
    return np.clip(img, 0, None)

def blur(img, r):
    # cheap separable box blur x3 (approx gaussian)
    from scipy.ndimage import gaussian_filter
    if img.ndim == 3:
        return np.stack([gaussian_filter(img[..., c], r) for c in range(3)], -1)
    return gaussian_filter(img, r)

def to_srgb(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= 0.0031308, 12.92*x, 1.055*np.power(x, 1/2.4) - 0.055)

def tonemap(x, exposure=1.0):
    x = x * exposure
    # ACES-ish filmic (Narkowicz)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x*(a*x+b))/(x*(c*x+d)+e), 0, 1)

def grain(shape, amt, seed=7):
    rng = np.random.default_rng(seed)
    return (rng.normal(size=shape[:2]).astype(np.float32) * amt)[..., None]
