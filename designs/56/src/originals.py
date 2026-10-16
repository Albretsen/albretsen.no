"""originals.py — design 56 "Honest Pixels", page build.
Renders the *undithered* photograph behind every moodboard tile, using the exact
same view (yaw, pitch, fov) as assets/src/imagery.py, so the site can show the
truth next to each algorithm. Also renders a wide frozen-lake strip for the footer
and the mossy creek as a photograph for the products section.

usage: python -I originals.py <dir-with-polyhaven-tonemapped-jpgs> <out-dir>
Sources (CC0, Poly Haven): misty_pines, mossy_forest, birchwood, frozen_lake
  https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/<id>.jpg
"""
import sys
import numpy as np
from PIL import Image, ImageFilter
Image.MAX_IMAGE_PIXELS = None
SRC, OUT = sys.argv[1], sys.argv[2]
DEEP, CREAM = (5, 37, 23), (249, 242, 226)

_c = {}
def pano(n):
    if n not in _c:
        im = Image.open(f'{SRC}/{n}.jpg').convert('RGB')
        if im.width > 8192: im = im.resize((8192, 4096), Image.LANCZOS)
        _c[n] = np.asarray(im)
    return _c[n]

def view(name, yaw, pitch, fov, w, h):
    """Gnomonic (rectilinear) projection of an equirect panorama (same maths as assets/src/lib.py)."""
    P = pano(name); H, W, _ = P.shape
    f = (w/2) / np.tan(np.radians(fov)/2)
    X, Y = np.meshgrid(np.arange(w) - w/2 + .5, np.arange(h) - h/2 + .5)
    d = np.stack([X, -Y, np.full_like(X, f)], -1); d /= np.linalg.norm(d, axis=-1, keepdims=True)
    p = np.radians(pitch); cy, sy = np.cos(p), np.sin(p)
    dy = d[..., 1]*cy + d[..., 2]*sy; dz = -d[..., 1]*sy + d[..., 2]*cy; dx = d[..., 0]
    lon = np.arctan2(dx, dz) + np.radians(yaw); lat = np.arcsin(np.clip(dy, -1, 1))
    u = ((lon/(2*np.pi) + .5) % 1.0) * W; v = (.5 - lat/np.pi) * H
    u0 = np.floor(u).astype(int) % W; v0 = np.clip(np.floor(v).astype(int), 0, H-1)
    u1 = (u0+1) % W; v1 = np.clip(v0+1, 0, H-1)
    fu = (u-np.floor(u))[..., None]; fv = (v-np.floor(v))[..., None]
    o = (P[v0, u0]*(1-fu)*(1-fv) + P[v0, u1]*fu*(1-fv) + P[v1, u0]*(1-fu)*fv + P[v1, u1]*fu*fv)/255
    return Image.fromarray((np.clip(o, 0, 1)*255).astype(np.uint8))

def grade(img, amount=0.28):
    """honest photo, nudged 28% toward the palette (forest shadows, cream highlights)"""
    a = np.asarray(img).astype(np.float32)/255
    L = (a @ np.array([.2126, .7152, .0722], dtype=np.float32))[..., None]
    tone = np.array(DEEP)/255*(1-L) + np.array(CREAM)/255*L
    o = np.clip((a*(1-amount) + tone*amount - .02)*1.04, 0, 1)
    o += np.random.default_rng(7).normal(0, .012, o.shape[:2])[..., None]
    return Image.fromarray((np.clip(o, 0, 1)*255).astype(np.uint8)).filter(ImageFilter.UnsharpMask(1.5, 40, 3))

def save(img, name, q=72):
    img.save(f'{OUT}/{name}.webp', 'WEBP', quality=q, method=6); print(name, img.size)

# same views as assets/src/imagery.py (tiles section), supersampled 2x then reduced
TILES = {
    'pines-3tone':     ('misty_pines', -40, 8, 60),
    'moss-atkinson':   ('mossy_forest', 10, -25, 55),
    'birch-4tone':     ('birchwood', 5, 8, 40),
    'lake-lines':      ('frozen_lake', 75, -6, 62),
    'canopy-halftone': ('misty_pines', 30, 72, 100),
}
for k, (n, yaw, pitch, fov) in TILES.items():
    save(grade(view(n, yaw, pitch, fov, 960, 1200).resize((480, 600), Image.LANCZOS)), k)

save(grade(view('mossy_forest', -15, -18, 82, 2400, 1500).resize((1600, 1000), Image.LANCZOS)), 'creek-photo', q=68)
save(grade(view('frozen_lake', 60, -4, 100, 3600, 900).resize((2000, 500), Image.LANCZOS)), 'lake-strip', q=68)
