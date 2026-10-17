"""Keep only alpha components >= 3% of the largest; re-trim; rewrite webp in place."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage
for f in sys.argv[1:]:
    im = Image.open(f).convert('RGBA')
    a = np.asarray(im).copy()
    m = a[..., 3] > 20
    lab, n = ndimage.label(m)
    if n > 1:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        keep = [i + 1 for i, s in enumerate(sizes) if s >= sizes.max() * 0.03]
        km = ndimage.binary_dilation(np.isin(lab, keep), iterations=3)
        a[..., 3] = np.where(km, a[..., 3], 0)
    out = Image.fromarray(a, 'RGBA')
    bb = out.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    out = out.crop((max(bb[0] - 4, 0), max(bb[1] - 4, 0), min(bb[2] + 4, out.width), min(bb[3] + 4, out.height)))
    out.save(f, 'WEBP', quality=82, method=6)
    print(f, n, out.size)
