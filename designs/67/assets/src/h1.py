"""Hero 1: 'Spires at the amber hour' (Highsmith, Miami Beach deco towers, PD)."""
import sys; sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.gnTd028yfQ')
from grade import *
OUT = sys.argv[1] if len(sys.argv) > 1 else T + '/h1'
src = Image.open(T + '/src/ArtDecodetailinMiamiBeachFlo.jpg').convert('RGB')  # 3840x4975
W0, H0 = src.size
a = np.asarray(src).astype(np.float32) / 255

def fill_rect(a, x0, y0, x1, y1, axis=1):
    """Remove signage: interpolate across the rectangle from its borders (row-wise)."""
    x0, y0, x1, y1 = [int(v) for v in (x0, y0, x1, y1)]
    reg = a[y0:y1, x0:x1].copy()
    if axis == 1:
        L = a[y0:y1, x0 - 6:x0].mean(1, keepdims=True); R = a[y0:y1, x1:x1 + 6].mean(1, keepdims=True)
        t = np.linspace(0, 1, x1 - x0)[None, :, None]
        fill = L * (1 - t) + R * t
    else:
        U = a[y0 - 6:y0, x0:x1].mean(0, keepdims=True); D = a[y1:y1 + 6, x0:x1].mean(0, keepdims=True)
        t = np.linspace(0, 1, y1 - y0)[:, None, None]
        fill = U * (1 - t) + D * t
    fill = ndimage.gaussian_filter(fill, (2, 2, 0))
    # keep fine texture from the original's high-frequency noise only
    a[y0:y1, x0:x1] = fill
    return a

sx, sy = W0 / 960, H0 / 1244
# NATIONAL sign on the right tower face (approx in 960-space: x 665-835, y 755-800)
a = fill_rect(a, 662 * sx, 752 * sy, 840 * sx, 803 * sy, axis=0)
# vertical letters on the left fin (x 160-232, y 585-660)
a = fill_rect(a, 160 * sx, 582 * sy, 232 * sx, 662 * sy, axis=0)
# small medallion on mid building (x 515-535, y 960-990)
a = fill_rect(a, 512 * sx, 958 * sy, 538 * sx, 992 * sy, axis=1)

r, g, b = a[..., 0], a[..., 1], a[..., 2]
hard = (b - r) > 0.12
lab, n = ndimage.label(hard)
hard = np.isin(lab, list(set(np.unique(lab[0])) - {0}))
# absorb small non-sky blobs (birds, dome speckle) into the sky
ns, k = ndimage.label(~hard)
sizes = ndimage.sum(np.ones_like(ns), ns, range(1, k + 1))
small = np.isin(ns, [i + 1 for i, sz in enumerate(sizes) if sz < 4000])
hard = hard | small
hard[1900:2328, 2880:3240] = True  # drop the silver dome + antenna: clean parapet against sky
mask = ndimage.gaussian_filter(hard.astype(np.float32), 1.6)

def render(box, outw, sun, name, horizon=1.0, sun_r=0.032):
    x0, y0, x1, y1 = box
    sub = a[y0:y1, x0:x1]; m = mask[y0:y1, x0:x1]
    h, w = sub.shape[:2]
    gimg = amber(sub, contrast=1.32, pivot=0.62, gamma=1.4, keep=0.14)
    # sunlit faces: lift towards gold, shadows towards umber-violet
    L = lum(sub)
    gimg = gimg * (0.92 + 0.12 * smooth(0.55, 0.95, L))[..., None]
    sky = dusk_sky(h, w, horizon=horizon, sun=sun, sun_r=sun_r,
                   top='#5E4A6E', mid='#C98478', low='#F2B68A', hz='#FFE2B8')
    o = gimg * (1 - m[..., None]) + sky * m[..., None]
    o = bloom(o, sun, .28, .55)
    o = haze(o, .10, '#F4C49A', .55, 1.0)
    o = vignette(o, .18)
    im = to_img(o)
    im = im.resize((outw, round(h * outw / w)), Image.LANCZOS)
    o2 = grain(np.asarray(im).astype(np.float32) / 255, 0.016)
    im = to_img(o2)
    im.save(f'{OUT}-{name}-master.png')
    return im

# landscape 16:9 from full width: rows chosen so spire top sits ~40% down
s = W0 / 3200
render((0, int(1150 * 1), W0, int(1150 + 2160)), 3200, (0.47, 0.70), 'wide')
# portrait 4:5 crop, left tower + gap, for mobile
render((150, 600, 2550, 4867), 1440, (0.74, 0.40), 'tall', sun_r=0.02)

# Cut-out: the towers alone (alpha = not-sky), for compositing over the live WebGL sky
def cutout(box, name):
    x0, y0, x1, y1 = box
    sub = a[y0:y1, x0:x1]; m = mask[y0:y1, x0:x1]
    gimg = amber(sub, contrast=1.32, pivot=0.62, gamma=1.4, keep=0.14)
    L = lum(sub); gimg = gimg * (0.92 + 0.12 * smooth(0.55, 0.95, L))[..., None]
    gimg = haze(gimg, .10, '#F4C49A', .55, 1.0)
    rgba = np.dstack([gimg, 1 - m])
    im = Image.fromarray((np.clip(rgba, 0, 1) * 255 + .5).astype(np.uint8), 'RGBA')
    top = int(im.height * 0.28); im = im.crop((0, top, im.width, im.height))
    D = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-7/designs/67/assets/extras'
    for w in (1024, 1600, 2400):
        r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        r.save(f'{D}/{name}-{w}.webp', quality=74, method=6)
        r.save(f'{D}/{name}-{w}.avif', quality=52, speed=4)
        print(name, r.size)
cutout((0, 1150, W0, 1150 + 2160), 'spires-cutout')
