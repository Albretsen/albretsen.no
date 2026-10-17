import sys; sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.Xjwh7Qx8vB/scr')
from hl import *
from PIL import ImageFilter
D = R + 'dl/'
C = COL

def lightdots(src, W, H, fx=.5, fy=.5, cell=10, angle=27, black=.02, white=.85, gamma=.8, under=.22, stops=None, bloom=.35, gain=1.0):
    im = cover(load(src), W, H, fx, fy)
    L = tone(lum(im), black, white, gamma)
    stops = stops or [(0, C['peat']), (0.3, C['clay']), (0.55, C['ember']), (0.8, C['ochre']), (1, C['vellum'])]
    ink = ramp(L, stops)
    cov = halftone(L, cell, angle, gain)
    a = np.clip(cov * (1 - under) + L * under, 0, 1)[..., None]
    paper = np.array(C['umber'], np.float32)
    out = paper * (1 - a) + ink * a
    # bloom: blurred highlights in ochre, cinematic halation
    hi = np.clip((L - 0.6) / 0.4, 0, 1)
    hb = np.asarray(Image.fromarray((hi * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(W / 40))).astype(np.float32) / 255
    out = out + hb[..., None] * np.array(C['ember'], np.float32) * bloom
        # vignette
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    vg = 1 - 0.35 * (((xx / W - .5) ** 2 + (yy / H - .5) ** 2) * 2.2)
    out = out * np.clip(vg, 0, 1)[..., None]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)), L

def darkdots(src, W, H, fx=.5, fy=.5, cell=10, angle=27, black=.1, white=.95, gamma=1.0, under=.15):
    im = cover(load(src), W, H, fx, fy)
    a0 = np.asarray(im).astype(np.float32) / 255
    L = tone(a0.max(axis=2) * .7 + lum(im) * .3, black, white, gamma)
    Dk = 1 - L
    cov = halftone(Dk, cell, angle)
    a = np.clip(cov * (1 - under) + Dk * under, 0, 1)[..., None]
    ink = ramp(Dk, [(0, C['clay']), (0.5, C['peat']), (1, C['umber'])])
    paper = np.array(C['vellum'], np.float32)
    out = paper * (1 - a) + ink * a 
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)), L

def plate(L, name, w=1600):
    """grey luminance plate for the WebGL shader (single channel, small)."""
    im = Image.fromarray((L * 255).astype(np.uint8)).convert('L').filter(ImageFilter.GaussianBlur(2))
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(OUT + 'shader/' + name + '.webp', 'WEBP', quality=70, method=6)
    import os; print('shader/' + name, round(os.path.getsize(OUT + 'shader/' + name + '.webp') / 1024), 'KB')

import os
os.makedirs(OUT + 'hero', exist_ok=True); os.makedirs(OUT + 'shader', exist_ok=True)
which = sys.argv[1:] or ['dawn', 'night', 'dusk', 'day']
if 'dawn' in which:
    im, L = lightdots(D + 'iss073e1068530.jpg', 2880, 1620, fx=.18, fy=.5, cell=16, black=.05, white=.75, gamma=1.15, bloom=.5)
    save(im, 'hero/hero-dawn', 78, [('@2x', 2880), ('', 1440)]); plate(L, 'plate-dawn')
if 'night' in which:
    im, L = lightdots(D + 'lofoten-flakstad.jpg', 2880, 1620, fx=.5, fy=.55, cell=16, black=.06, white=.8, gamma=1.1, bloom=.3)
    save(im, 'hero/hero-night', 78, [('@2x', 2880), ('', 1440)]); plate(L, 'plate-night')
if 'dusk' in which:
    im, L = lightdots(D + 'iss071e439624.jpg', 2880, 1206, fx=.5, fy=.42, cell=16, black=.03, white=.8, gamma=.95, bloom=.45)
    save(im, 'hero/hero-dusk-scope', 78, [('@2x', 2880), ('', 1440)]); plate(L, 'plate-dusk')
if 'day' in which:
    im, L = darkdots(D + 'lofotenberg.jpg', 2200, 1238, fx=.5, fy=.35, cell=15, black=.3, white=.92, gamma=1.6)
    save(im, 'hero/hero-day', 80, [('@2x', 2200), ('', 1100)]); plate(L, 'plate-day', 1600)
