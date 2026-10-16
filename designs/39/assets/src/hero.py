"""Hero renders for design 39. usage: hero.py <which> <width> <outdir>"""
import sys, os, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from caustic import fbm, tonemap, to_srgb, grain
from caustic2 import render_chunked, save_img
from scipy.ndimage import gaussian_filter
from scipy.spatial import cKDTree

which, Wout, outdir = sys.argv[1], int(sys.argv[2]), sys.argv[3]
os.makedirs(outdir, exist_ok=True)
PSEED = int(os.environ.get('PSEED', '40'))
TAG = os.environ.get('TAG', '')
ASPECT = float(sys.argv[4]) if len(sys.argv) > 4 else 1.6
W = Wout; H = int(round(W / ASPECT))
S = int(os.environ.get("SS", 2 if W > 1500 else 3))
MG = 0.15
Wr, Hr = int(W*(1+2*MG))*S//1, int(H*(1+2*MG))*S//1
ys, xs = np.mgrid[0:Hr, 0:Wr].astype(np.float32)
u = (xs/S - W*MG)/W; v = (ys/S - H*MG)/W   # v in width units
BG = np.array([0.0065, 0.0064, 0.0062])      # ~ #141414 in sRGB after transfer

def finish(L, exp, bg=BG, grain_amt=0.008, vignette=0.0):
    l = tonemap(L, exp)
    lin = bg + l*(1-bg)
    if vignette:
        r = np.hypot((np.arange(W)/W-0.6)[None,:], (np.arange(H)/H-0.5)[:,None]*H/W)
        lin = lin*(1-vignette*np.clip(r/0.75,0,1)**2)[...,None]
    img = to_srgb(lin)
    rng = np.random.default_rng(3)
    img = img + rng.normal(size=img.shape[:2])[...,None].astype(np.float32)*grain_amt
    return np.clip(img, 0, 1)

def facets(seed, n, region, tilt, soft):
    rng = np.random.default_rng(seed)
    pts = np.c_[rng.uniform(region[0],region[1],n), rng.uniform(region[2],region[3],n)]
    _, idx = cKDTree(pts).query(np.c_[u.ravel(), v.ravel()])
    idx = idx.reshape(u.shape)
    g = rng.normal(size=(n,2))*tilt
    h = g[idx,0]*(u-pts[idx,0]) + g[idx,1]*(v-pts[idx,1])
    return gaussian_filter(h, soft*S)

def bump(cx, cy, s, a):
    return a*np.exp(-((u-cx)**2+(v-cy)**2)/(2*s*s))

k = W*S  # height units -> ray px
SF = W*S/2880.0
if which == 'prism':
    h = facets(PSEED, 26, (0.45,1.0,0.0,0.62), 0.55, 0.9*W/960)
    h += bump(0.74, 0.31, 0.16, 0.05)
    rr = np.hypot((u-0.72)/1.0, (v-0.31)/0.85)
    wt = np.exp(-(rr/0.17)**4)
    L = render_chunked(h*k, (W,H), strength=330*SF, dispersion=0.13, nlam=30, weight=wt,
                       offset=(-W*MG,-H*MG), scale=1/S)
    img = finish(L*0.6, 0.36, vignette=0.2)
elif which == 'echo':
    h = (bump(0.70,0.30,0.10,1.0) + bump(0.86,0.20,0.06,-0.55) + bump(0.62,0.47,0.07,0.6)
         + bump(0.93,0.46,0.08,0.45) + bump(0.55,0.16,0.035,-0.25) + bump(0.78,0.52,0.02,0.12)
         + bump(0.97,0.08,0.03,0.2))
    r = np.hypot(u-0.70, v-0.30)
    h += 0.010*np.sin(r*95)*np.exp(-r/0.16)*np.clip(r/0.03,0,1)
    wt = 1/(1+np.exp(-(u-0.40)/0.06))
    L = render_chunked(h*k, (W,H), strength=45*SF, dispersion=0.09, nlam=30, weight=wt,
                       offset=(-W*MG,-H*MG), scale=1/S)
    img = finish(L, 0.13, vignette=0.3)
elif which.startswith('focus'):
    # boot: light comes into focus. frame index after colon
    t = float(which.split(':')[1])
    h = facets(PSEED, 26, (0.45,1.0,0.0,0.62), 0.55, 0.9*W/960)
    h += bump(0.74, 0.31, 0.16, 0.05)
    rr = np.hypot((u-0.72)/1.0, (v-0.31)/0.85)
    wt = np.exp(-(rr/0.17)**4)
    tt = max(0.0, (t-0.15)/0.85)
    e = 0.5-0.5*np.cos(np.pi*tt)
    L = render_chunked(h*k, (W,H), strength=330*e*SF, dispersion=0.13, nlam=20, weight=wt,
                       offset=(-W*MG,-H*MG), scale=1/S)
    img = finish(L*0.6, 0.36*min(1.0, (t/0.15)**2 if t < 0.15 else 1.0), vignette=0.2)
else:
    raise SystemExit('unknown')

name = which.replace(':','-') + TAG
from PIL import Image
Image.fromarray((img*255+0.5).astype(np.uint8)).save(f'{outdir}/{name}-{W}.png')
print('done', name, W, H)
