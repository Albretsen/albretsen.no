"""Secondary plates: roofs, pastel deco facade, horizon, poster crop."""
import sys; sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.gnTd028yfQ')
from grade import *

def skyswap(a, thr, sun, sun_r, horizon, extra_small=3000):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    hard = (b - r) > thr
    lab, n = ndimage.label(hard)
    hard = np.isin(lab, list(set(np.unique(lab[0])) - {0}))
    ns, k = ndimage.label(~hard)
    sizes = ndimage.sum(np.ones_like(ns), ns, range(1, k + 1))
    hard |= np.isin(ns, [i + 1 for i, sz in enumerate(sizes) if sz < extra_small])
    m = ndimage.gaussian_filter(hard.astype(np.float32), 1.4)
    h, w = a.shape[:2]
    sky = dusk_sky(h, w, horizon=horizon, sun=sun, sun_r=sun_r, top='#5E4A6E', mid='#C98478', low='#F2B68A', hz='#FFE2B8')
    return m, sky

def finish(o, outw, name, sun=None, g=0.016):
    if sun: o = bloom(o, sun, .25, .6)
    o = vignette(o, .18)
    im = to_img(o)
    im = im.resize((outw, round(im.height * outw / im.width)), Image.LANCZOS)
    to_img(grain(np.asarray(im).astype(np.float32) / 255, g)).save(f'{T}/sec-{name}-master.png')

which = sys.argv[1:]
if 'roofs' in which:
    a = load(T + '/src/ParisRoofsjpg.jpg')  # 3488x2616, zinc roofs from above
    g = amber(a, contrast=1.3, pivot=0.55, gamma=1.25, keep=0.1)
    g = haze(g, .22, '#F2C39C', 0.0, 0.5)  # haze at the top (far) part
    g = g[::-1]; g = haze(g, .0, '#F2C39C'); g = g[::-1]
    finish(g, 2400, 'roofs', sun=(0.85, -0.05))
if 'deco' in which:
    a = load(T + '/src/ArtdecobuildinginSouthBeachne.jpg')  # 3840x2983 pastel deco row
    m, sky = skyswap(a, 0.10, (0.12, 0.30), 0.03, 0.9)
    g = amber(a, contrast=1.2, pivot=0.6, gamma=1.3, keep=0.22)
    o = g * (1 - m[..., None]) + sky * m[..., None]
    finish(o, 2400, 'deco', sun=(0.12, 0.30))
if 'horizon' in which:
    a = load(T + '/src/EmptybeachatMiamiBeachFlorida.jpg')  # 3840x3016
    a = a[400:400 + 2160]
    m, sky = skyswap(a, 0.06, (0.72, 0.45), 0.022, 0.62, extra_small=20000)
    g = amber(a, contrast=1.15, pivot=0.55, gamma=1.2, keep=0.12)
    o = g * (1 - m[..., None]) + sky * m[..., None]
    finish(o, 2400, 'horizon', sun=(0.72, 0.45))
if 'poster' in which:
    a = load(T + '/src/SeeAmericaWPAposterca1938j.jpg')
    h, w = a.shape[:2]
    a = a[int(h * 0.0):int(h * 0.80)]  # drop the lettering band
    warm = np.clip(a * np.array([1.04, 0.99, 0.9]), 0, 1)
    to_img(warm).resize((1200, round(a.shape[0] * 1200 / w)), Image.LANCZOS).save(T + '/sec-poster-master.png')
