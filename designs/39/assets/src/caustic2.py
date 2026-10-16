import numpy as np
from caustic import lam_rgb, fbm, tonemap, to_srgb, grain, cie_xyz

def render_chunked(h, out_wh, strength, dispersion=0.08, nlam=28, offset=(0,0), weight=None, scale=1.0,
                   spectrum=None, rows=500, seed=1):
    """Splat rays through height field h. Wavelength jittered per ray (stratified) so the
    spectrum is smooth. spectrum(lam)->weight filters the light (colour only from imagery)."""
    Wo, Ho = out_wh
    Hr, Wr = h.shape
    gy, gx = np.gradient(h.astype(np.float32))
    rng = np.random.default_rng(seed)
    img = np.zeros((Ho * Wo, 3), np.float64)
    edges = np.linspace(400, 700, nlam + 1)
    for i in range(nlam):
        lc = 0.5 * (edges[i] + edges[i+1])
        sw = 1.0 if spectrum is None else float(spectrum(lc))
        if sw < 1e-4: continue
        c = lam_rgb(lc) * sw
        acc = np.zeros(Ho * Wo, np.float64)
        for r0 in range(0, Hr, rows):
            r1 = min(Hr, r0 + rows)
            ys, xs = np.mgrid[r0:r1, 0:Wr].astype(np.float32)
            lam = rng.uniform(edges[i], edges[i+1], size=xs.shape).astype(np.float32)
            k = strength * (1 + dispersion * (550 - lam) / 100.0)
            px = (xs + k * gx[r0:r1]) * scale + offset[0]
            py = (ys + k * gy[r0:r1]) * scale + offset[1]
            w0 = np.ones_like(xs) if weight is None else weight[r0:r1]
            x0 = np.floor(px).astype(np.int64); y0 = np.floor(py).astype(np.int64)
            fx = px - x0; fy = py - y0
            for dx, dy, ww in ((0,0,(1-fx)*(1-fy)),(1,0,fx*(1-fy)),(0,1,(1-fx)*fy),(1,1,fx*fy)):
                X = x0 + dx; Y = y0 + dy
                m = (X >= 0) & (X < Wo) & (Y >= 0) & (Y < Ho)
                acc += np.bincount((Y[m] * Wo + X[m]), weights=(ww * w0)[m], minlength=Ho*Wo)
        img += acc[:, None] * c[None, :]
    img = img.reshape(Ho, Wo, 3) / nlam
    img *= scale * scale
    return np.clip(img, 0, None)

def save_img(path_noext, rgb01, sizes=((1,''),), webp_q=82, avif_q=60, also_jpg=False):
    from PIL import Image
    im = Image.fromarray((np.clip(rgb01,0,1)*255+0.5).astype(np.uint8))
    for factor, suffix in sizes:
        w = int(round(im.width * factor)); hh = int(round(im.height * factor))
        imr = im if factor == 1 else im.resize((w, hh), Image.LANCZOS)
        imr.save(f'{path_noext}{suffix}.webp', quality=webp_q, method=6)
        imr.save(f'{path_noext}{suffix}.avif', quality=avif_q)
        if also_jpg: imr.save(f'{path_noext}{suffix}.jpg', quality=86, optimize=True, progressive=True)
    return im
