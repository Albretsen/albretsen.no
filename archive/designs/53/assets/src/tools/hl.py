"""Halflight imaging library: OKLCH palette, duotone, halftone."""
import numpy as np, math
from PIL import Image, ImageFilter
Image.MAX_IMAGE_PIXELS = None
R = '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.Xjwh7Qx8vB/'
OUT = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_d6e5fca5-3c9-23/designs/53/assets/'

def oklch(L, C, h):
    a = C * math.cos(math.radians(h)); b = C * math.sin(math.radians(h))
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_**3, m_**3, s_**3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    def enc(x):
        x = min(max(x, 0), 1)
        return 12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055
    return tuple(round(enc(v) * 255) for v in (r, g, bb))

def hexc(rgb): return '#%02x%02x%02x' % rgb

PAL = {
 'umber':  (0.17, 0.022, 62),   # night ink, page background
 'peat':   (0.29, 0.045, 58),
 'clay':   (0.55, 0.115, 46),
 'ember':  (0.66, 0.165, 52),
 'ochre':  (0.77, 0.140, 84),   # seed
 'spark':  (0.89, 0.130, 92),
 'vellum': (0.95, 0.024, 84),
 'moss':   (0.52, 0.060, 112),
}
COL = {k: oklch(*v) for k, v in PAL.items()}

def load(path, width=None, crop=None):
    im = Image.open(path).convert('RGB')
    if crop: im = im.crop(crop)
    if width:
        h = round(im.height * width / im.width)
        im = im.resize((width, h), Image.LANCZOS)
    return im

def cover(im, W, H, fx=0.5, fy=0.5):
    s = max(W / im.width, H / im.height)
    nw, nh = math.ceil(im.width * s), math.ceil(im.height * s)
    im = im.resize((nw, nh), Image.LANCZOS)
    x = int((nw - W) * fx); y = int((nh - H) * fy)
    return im.crop((x, y, x + W, y + H))

def lum(im):
    a = np.asarray(im).astype(np.float32) / 255
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]

def tone(L, black=0.0, white=1.0, gamma=1.0):
    L = np.clip((L - black) / (white - black), 0, 1)
    return L ** gamma

def ramp(L, stops):
    """stops: list of (pos, rgb). gradient map."""
    out = np.zeros(L.shape + (3,), np.float32)
    ps = [s[0] for s in stops]; cs = [np.array(s[1], np.float32) for s in stops]
    for c in range(3):
        out[..., c] = np.interp(L, ps, [col[c] for col in cs])
    return out

def halftone(L, cell=8.0, angle=27.0, gain=1.0, soft=0.9, shape='dot'):
    """returns coverage 0..1 per pixel, dot radius from L (bright = big)."""
    H, W = L.shape
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    t = math.radians(angle); c, s = math.cos(t), math.sin(t)
    u = (xx * c + yy * s) / cell; v = (-xx * s + yy * c) / cell
    cu = np.floor(u) + 0.5; cv = np.floor(v) + 0.5
    # cell centre back to image space to sample luminance
    cx = (cu * c - cv * s) * cell; cy = (cu * s + cv * c) * cell
    ix = np.clip(cx.astype(np.int32), 0, W - 1); iy = np.clip(cy.astype(np.int32), 0, H - 1)
    Lb = np.asarray(Image.fromarray((L * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(cell * 0.35))).astype(np.float32) / 255
    val = np.clip(Lb[iy, ix] * gain, 0, 1)
    du = (u - cu); dv = (v - cv)
    if shape == 'line':
        d = np.abs(dv) * cell
        r = val * cell * 0.5
    else:
        d = np.sqrt(du * du + dv * dv) * cell
        r = np.sqrt(val) * cell * 0.62
    cov = np.clip((r - d) / soft + 0.5, 0, 1)
    return cov

def grain(shape, amt=0.03, seed=1):
    rng = np.random.default_rng(seed)
    return (rng.standard_normal(shape).astype(np.float32) * amt)

def compose(L, ink, paper, cell=8, angle=27, under=0.18, gain=1.0, grain_amt=0.025, shape='dot', glow=None):
    """paper = background, ink = dot colour. under: continuous-tone underlay strength."""
    cov = halftone(L, cell, angle, gain, shape=shape)
    a = np.clip(cov * (1 - under) + L * under, 0, 1)[..., None]
    ink = np.array(ink, np.float32); paper = np.array(paper, np.float32)
    out = paper * (1 - a) + ink * a
    if glow is not None:
        out = out + glow
    out = out + grain(L.shape, grain_amt * 255)[..., None]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

def save(im, name, q=80, sizes=None):
    """save webp at given widths. name w/o ext. sizes: list of (suffix,width)."""
    import os
    os.makedirs(os.path.dirname(OUT + name), exist_ok=True)
    res = []
    for suf, w in (sizes or [('', im.width)]):
        x = im if w == im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        p = OUT + name + suf + '.webp'
        x.save(p, 'WEBP', quality=q, method=6)
        res.append((p, os.path.getsize(p)))
    for p, s in res: print(p.split('/assets/')[1], x.size if False else '', round(s / 1024), 'KB')
    return res

if __name__ == '__main__':
    for k, v in PAL.items():
        print(k, 'oklch(%.2f %.3f %d)' % v, hexc(COL[k]))
