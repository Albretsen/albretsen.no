"""Hero 1: cliffs after the sun has gone. Day-for-dusk regrade of a Highsmith Big Sur photograph."""
import sys
import numpy as np, cv2
from film import *

W = int(sys.argv[2]) if len(sys.argv) > 2 else 3200
im = load('src/bigsur7.jpg', W)
h, w = im.shape[:2]
L = lum(im)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
yy = np.arange(h, dtype=np.float32)[:, None] * np.ones((1, w), np.float32)
xx = np.arange(w, dtype=np.float32)[None, :] * np.ones((h, 1), np.float32)

# --- horizon: on the far-right column, sky -> sea transition (largest drop in L) ---
col = cv2.GaussianBlur(L[:, int(w * 0.93):int(w * 0.99)].mean(1).astype(np.float32).reshape(-1, 1), (1, 0), 4).ravel()
seg = col[int(h * 0.3):int(h * 0.6)]
horizon = int(h * 0.3) + int(np.argmin(np.diff(seg)))
print('horizon', horizon, horizon / h)

# --- per-row sky model from the right edge, extrapolated ---
skyrow = np.zeros((h, 3), np.float32)
ref = im[:, int(w * 0.9):, :].mean(1)
skyrow[:horizon] = ref[:horizon]
skyrow[horizon:] = ref[horizon - 4]
dist = np.sqrt(((im - skyrow[:, None, :]) ** 2).sum(-1))
alpha_sky = np.clip(1 - (dist - 0.025) / 0.09, 0, 1)
alpha_sky *= (yy < horizon + 3)
alpha_sky = cv2.morphologyEx(alpha_sky.astype(np.float32), cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
holes = (alpha_sky < 0.5).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(holes)
for i in range(1, n):
    if stats[i, cv2.CC_STAT_AREA] < h * w * 0.0008:
        alpha_sky[lab == i] = 1.0
# everything above the first solid land pixel in each column is sky (kills dust/vignette specks)
landb = cv2.morphologyEx((alpha_sky < 0.5).astype(np.uint8), cv2.MORPH_OPEN, np.ones((15, 15), np.uint8))
landb[horizon + 3:, :] = 1
first = np.argmax(landb > 0, axis=0)
# far-left columns: the source sky is vignetted there, so judge sky by brightness above the treeline
landd = cv2.morphologyEx((L < 0.42).astype(np.uint8), cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
from scipy.ndimage import median_filter
first_d = median_filter(np.argmax(landd > 0, axis=0), 25)
left = (np.arange(w) < int(w * 0.16))[None, :]
bright = smoothstep(0.40, 0.50, L)
alpha_sky = np.where(left & (yy < first_d[None, :] + 8), np.maximum(alpha_sky, bright), alpha_sky).astype(np.float32)
first = np.where(left[0], 0, first)
alpha_sky = np.where(yy < (first[None, :] - 4), 1.0, alpha_sky).astype(np.float32)
alpha_sky = cv2.GaussianBlur(alpha_sky, (0, 0), 1.2)

# --- sea mask ---
near_h = yy < horizon + h * 0.09
sea = ((b - r) > 0.10) & (yy >= horizon - 2) & ((L < 0.62) | near_h)
sea = sea.astype(np.uint8)
n, lab = cv2.connectedComponents(sea)
areas = np.bincount(lab.ravel()); areas[0] = 0
sea = (lab == areas.argmax()).astype(np.float32)
sea = cv2.morphologyEx(sea, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
blue = smoothstep(0.04, 0.12, b - r)
sea_dil = cv2.dilate(sea, np.ones((9, 9), np.uint8))
sea_soft = np.maximum(feather(sea, 1.5), sea_dil * blue)
sea_soft = feather(sea_soft, 1.0) * (1 - alpha_sky)

# --- new sky: afterglow ---
stops = [(0.0, '#5f7fb8'), (0.22, '#8eaad6'), (0.46, '#bcd3dc'), (0.62, '#e3d6d2'), (0.76, '#f3b9bf'), (0.9, '#f8a4a6'), (0.97, '#ffbf98'), (1.0, '#ffd3a6')]
SUNX = 0.86
skyimg = afterglow_sky(h, w, horizon, sun_x=SUNX, stops=stops, glow_col='#ffd2a2', glow_amt=0.5, glow_w=0.42)
# thin stratus streaks catching flamingo light
rng = np.random.default_rng(0x3565d6)
nz = rng.normal(0, 1, (h // 6, w // 6)).astype(np.float32)
nz = cv2.GaussianBlur(nz, (0, 0), sigmaX=60, sigmaY=2.2)
nz = cv2.resize(nz, (w, h), interpolation=cv2.INTER_CUBIC)
nz = (nz - nz.mean()) / (nz.std() + 1e-6)
t = yy / horizon
band = np.exp(-((t - 0.70) / 0.10) ** 2) + 0.6 * np.exp(-((t - 0.83) / 0.05) ** 2)
cl = np.clip(nz * 0.8 - 0.55, 0, 1) * band
skyimg = skyimg * (1 - cl[..., None] * 0.5) + hexrgb('#ff8fa8') * cl[..., None] * 0.5

# --- land relight (linear light) ---
lin = srgb_to_lin(im)
Ll = lum(im)
tint_lo = srgb_to_lin(hexrgb('#7c6c9e'))   # lilac sky fill in shadows
tint_hi = srgb_to_lin(hexrgb('#ffb3ae'))   # warm rose on lit slopes
k = smoothstep(0.25, 0.75, Ll)[..., None]
tint = tint_lo * (1 - k) + tint_hi * k
greyl = lum(lin)[..., None]
lin_d = greyl + (lin - greyl) * 0.6           # mute greens
land_lin = lin_d * tint * 0.62
land = lin_to_srgb(land_lin)
# atmospheric perspective toward the horizon: far ridges dissolve into the low sky
haze_amt = np.clip(1 - np.abs(yy - horizon) / (h * 0.16), 0, 1) ** 1.6 * smoothstep(0.25, 0.95, xx / w)
haze = gradient_stops(np.clip(yy / horizon, 0, 1), stops)
land = land * (1 - haze_amt[..., None] * 0.6) + haze * haze_amt[..., None] * 0.6

# --- sea: reflect the sky, keep wave texture ---
Ld = L
hp = Ld - cv2.GaussianBlur(Ld, (0, 0), 5)
ty = np.clip((yy - horizon) / (h - horizon), 0, 1)
refl_t = np.clip(1 - ty * 1.5, 0, 1)
seacol = gradient_stops(refl_t, [(0.0, '#283158'), (0.35, '#4a5287'), (0.7, '#86719a'), (0.9, '#c895a4'), (1.0, '#e9b3a4')])
gx = np.exp(-((xx / w - SUNX) / (0.035 + ty * 0.08)) ** 2) * np.exp(-ty * 5)
glit = np.clip(hp * 12, 0, 1)
seacol = seacol + gx[..., None] * hexrgb('#ffb090') * (0.12 + glit[..., None] * 0.5)
hpw = smoothstep(0.015, 0.09, ty)[..., None]
seacol = seacol + hp[..., None] * np.array([1.6, 1.35, 1.4]) * (0.55 + refl_t[..., None] * 0.8) * hpw
seacol = np.clip(seacol, 0, 1)

a_sky = alpha_sky[..., None]; a_sea = sea_soft[..., None]
out = land * (1 - a_sky - a_sea).clip(0, 1) + skyimg * a_sky + seacol * a_sea

out = portra(out, lift=0.03, warm=0.02, sat=0.98)
out = halation(out, thresh=0.82, col='#ff7a6a', amt=0.15)
out = bloom(out, 0.78, 0.03, 0.25)
out = vignette(out, 0.2)
out = grain(out, 0.016, 1.3)
save(sys.argv[1] if len(sys.argv) > 1 else 'out_cliffs.jpg', out, 94)
