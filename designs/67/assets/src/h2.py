"""Hero 2: 'Facade' - symmetric Haussmann-era elevation with shutters and arcade (PD photo)."""
import sys; sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.gnTd028yfQ')
from grade import *
OUT = T + '/h2'
src = Image.open(T + '/src/Paris75001RuedeRivolino232fa.jpg').convert('RGB')
a = np.asarray(src).astype(np.float32) / 255
H0, W0 = a.shape[:2]
def fill_rect(a, x0, y0, x1, y1):
    U = a[y0 - 8:y0].mean(0, keepdims=True)[:, x0:x1]; D = a[y1:y1 + 8].mean(0, keepdims=True)[:, x0:x1]
    t = np.linspace(0, 1, y1 - y0)[:, None, None]
    f = U * (1 - t) + D * t
    rng = np.random.default_rng(1); f = f + rng.normal(0, .012, f.shape[:2])[..., None]
    a[y0:y1, x0:x1] = ndimage.gaussian_filter(f, (3, 6, 0))
# shop signage in the arcade
for bx in [(330, 3430, 512, 3600), (618, 3430, 850, 3600), (1080, 3630, 1530, 3760), (0, 3470, 170, 3580), (3150, 3400, 3312, 3500)]:
    fill_rect(a, *bx)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
hard = (b - r) > float(sys.argv[1]) if len(sys.argv) > 1 else (b - r) > 0.10
lab, n = ndimage.label(hard)
hard = np.isin(lab, list(set(np.unique(lab[0])) - {0}))
ns, k = ndimage.label(~hard)
sizes = ndimage.sum(np.ones_like(ns), ns, range(1, k + 1))
hard |= np.isin(ns, [i + 1 for i, sz in enumerate(sizes) if sz < 3000])
mask = ndimage.gaussian_filter(hard.astype(np.float32), 1.4)

def render(box, outw, sun, name, sun_r=0.03, horizon=0.9, extend_top=0):
    x0, y0, x1, y1 = box
    sub = a[y0:y1, x0:x1]; m = mask[y0:y1, x0:x1]
    if extend_top:
        pad = np.repeat(sub[:1], extend_top, 0); sub = np.concatenate([pad, sub], 0)
        m = np.concatenate([np.ones((extend_top, m.shape[1]), np.float32), m], 0)
    h, w = sub.shape[:2]
    gimg = amber(sub, contrast=1.25, pivot=0.58, gamma=1.3, keep=0.16)
    sky = dusk_sky(h, w, horizon=horizon, sun=sun, sun_r=sun_r,
                   top='#5E4A6E', mid='#C98478', low='#F2B68A', hz='#FFE2B8')
    o = gimg * (1 - m[..., None]) + sky * m[..., None]
    o = bloom(o, sun, .30, .7)
    o = haze(o, .08, '#F4C49A', .4, 1.0)
    o = vignette(o, .2)
    im = to_img(o).resize((outw, round(h * outw / w)), Image.LANCZOS)
    im = to_img(grain(np.asarray(im).astype(np.float32) / 255, 0.016))
    im.save(f'{OUT}-{name}-master.png'); return im

if __name__ == '__main__':
    to_img(np.dstack([mask] * 3)).resize((W0 // 4, H0 // 4)).save(OUT + '-mask.jpg')
    # postcard front, 3:4 portrait: full width, roofline to the arcade capitals
    render((0, 0, W0, int(W0 * 4 / 3) - 600), 2000, (0.5, 0.14), 'card', sun_r=0.035, horizon=0.30, extend_top=600)
    # wide: upper floors + chimneys with a tall sky
    render((0, 0, W0, 1263), 3200, (0.655, 0.62), 'wide', sun_r=0.036, horizon=0.8, extend_top=600)
