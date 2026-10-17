"""Hero 2: two deco towers holding the last light. Highsmith photograph, signs removed, sky replaced, relit."""
import sys
import numpy as np, cv2
from film import *

im = load('src/towers.jpg', 3200)
h, w = im.shape[:2]

# --- remove hotel signage ---
rng0 = np.random.default_rng(1)
def noise_like(shape, ref):
    return rng0.normal(0, 1, shape).astype(np.float32)[..., None] * ref
# Tower name: the face is shaded left-to-right, so interpolate vertically between clean rows;
# the cornice band the letter tops overlap is horizontal, so fill it row-wise from the left.
x0, x1, yc, y0, y1 = 542, 766, 1938, 1996, 2236
for y in range(yc, y0):
    im[y, x0:x1] = np.median(im[y, x0 - 8:x0 - 2], 0)
top = cv2.GaussianBlur(im[y0 - 4:y0, x0 - 20:x1 + 4].mean(0)[None], (0, 0), 3)[0][20:20 + x1 - x0]
bot = cv2.GaussianBlur(im[y1:y1 + 4, x0 - 20:x1 + 4].mean(0)[None], (0, 0), 3)[0][20:20 + x1 - x0]
v = np.linspace(0, 1, y1 - y0, dtype=np.float32)[:, None, None]
im[y0:y1, x0:x1] = (1 - v) * top[None] + v * bot[None] + noise_like((y1 - y0, x1 - x0), 0.010)
y0 = yc
# soften seams
reg = np.zeros((h, w), np.float32); reg[y0:y1, x0:x1] = 1
# Neon script sign: vertical clone of the clean wall strip below (flutes are vertical)
sx0, sx1, sy0, sy1 = 2195, 2800, 2528, 2692
strip = im[2696:2738, sx0:sx1].copy()
n = sy1 - sy0
idx = np.arange(n) % (2 * strip.shape[0])
idx = np.where(idx < strip.shape[0], idx, 2 * strip.shape[0] - 1 - idx)
im[sy0:sy1, sx0:sx1] = strip[idx]
reg[sy0:sy1, sx0:sx1] = 1
# feather the patch borders
regb = cv2.GaussianBlur(reg, (0, 0), 2)[..., None]
im = np.clip(im, 0, 1)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
L = lum(im)
yy = np.arange(h, dtype=np.float32)[:, None] * np.ones((1, w), np.float32)
xx = np.arange(w, dtype=np.float32)[None, :] * np.ones((h, 1), np.float32)

# --- sky mask: saturated navy ---
skym = (b > 2.2 * r + 0.03) & (b > 1.7 * g + 0.02)
skym = skym.astype(np.uint8)
n, lab = cv2.connectedComponents(skym)
areas = np.bincount(lab.ravel())
keep = (set(np.unique(lab[0:4, :])) | set(np.nonzero(areas > 60)[0])) - {0}
skym = np.isin(lab, list(keep)).astype(np.float32)
skym[reg > 0] = 0
alpha = feather(skym, 1.3)[..., None]

# --- afterglow sky (low horizon below frame bottom, tops of towers catch it) ---
horizon = int(h * 0.92)
stops = [(0.0, '#4f6fae'), (0.25, '#7f9fd0'), (0.48, '#b6cfe0'), (0.62, '#d9e2d6'), (0.75, '#f2ccc8'), (0.88, '#f6a9ae'), (1.0, '#ffc59c')]
sky = afterglow_sky(h, w, horizon, sun_x=0.95, stops=stops, glow_col='#ffd0a0', glow_amt=0.4, glow_w=0.5)

# --- relight buildings: lit faces flamingo/peach, shade faces mint-lilac ---
lin = srgb_to_lin(im)
Ll = L
k = smoothstep(0.25, 0.8, Ll)[..., None]
t_hi = srgb_to_lin(hexrgb('#ffb9a6'))
t_lo = srgb_to_lin(hexrgb('#8fa6c4'))
t = t_lo * (1 - k) + t_hi * k
g_ = lum(lin)[..., None]
lin2 = g_ + (lin - g_) * 0.85
bld = lin_to_srgb(lin2 * t * 1.02)
# vertical falloff: tops brighter (last light), lower floors already in dusk
fall = (0.75 + 0.35 * np.clip(1 - yy / h, 0, 1))[..., None]
bld = bld * fall
out = bld * (1 - alpha) + sky * alpha
out = portra(out, lift=0.035, warm=0.02, sat=0.97)
out = halation(out, thresh=0.8, col='#ff7a6a', amt=0.14)
out = vignette(out, 0.16)
out = grain(out, 0.016, 1.3, seed=9)
save(sys.argv[1] if len(sys.argv) > 1 else 'out_towers.jpg', out, 94)
