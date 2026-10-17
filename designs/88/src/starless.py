# Builds the "emptied plate": the graded Cygnus crops with their stars lifted out,
# so the canvas particle system (real star positions measured from the same plate)
# can take their place without doubling. A grey opening removes point sources; the
# broad brass halos survive as soft glow, which is what the plate keeps when a star leaves.
# Usage: python -I src/starless.py designs/88
import sys, numpy as np
from PIL import Image
from scipy import ndimage

A = sys.argv[1]


def run(src, name, widths):
    im = Image.open(f'{A}/assets/hero/{src}').convert('RGB')
    a = np.asarray(im).astype(np.float32)
    # smooth sky background: median of a 1/8 thumbnail, upsampled
    small = im.resize((im.width // 8, im.height // 8), Image.BOX)
    s = np.asarray(small).astype(np.float32)
    s = np.stack([ndimage.median_filter(s[..., c], size=31) for c in range(3)], -1)
    bg = np.asarray(Image.fromarray(np.clip(s, 0, 255).astype(np.uint8)).resize(im.size, Image.BILINEAR)).astype(np.float32)
    bg = ndimage.gaussian_filter(bg, sigma=(6, 6, 0))
    # clamp everything brighter than the sky (stars and halos) down to it, keep grain below
    out = np.minimum(a, bg * 1.04 + 2)
    o = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    for w in widths:
        h = round(o.height * w / o.width)
        r = o.resize((w, h), Image.LANCZOS)
        r.save(f'{A}/img/{name}-{w}.avif', quality=50, speed=4)
        r.save(f'{A}/img/{name}-{w}.webp', quality=70, method=6)


run('cygnus-plate-wide-2400.webp', 'plate-empty-wide', [1600, 2400])
run('cygnus-plate-tall-1200.webp', 'plate-empty-tall', [750, 1200])
