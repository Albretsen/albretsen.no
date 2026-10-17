"""matte.py BLACK.png WHITE.png OUTDIR name1 name2 ... ; splits into 500px cells, difference matte, trims."""
import sys, os
import numpy as np
from PIL import Image
b = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float)
w = np.asarray(Image.open(sys.argv[2]).convert('RGB')).astype(float)
out = sys.argv[3]; names = sys.argv[4:]
alpha = 1 - (w - b).mean(-1) / 255.0
alpha = np.clip(alpha, 0, 1)
rgb = np.where(alpha[..., None] > 0.004, b / np.maximum(alpha[..., None], 1e-3), 0)
rgba = np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8)
img = Image.fromarray(rgba, 'RGBA')
for i, n in enumerate(names):
    c = img.crop((i * 500, 0, i * 500 + 500, 500))
    bb = c.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    c = c.crop(bb)
    c.save(os.path.join(out, f'{n}.webp'), 'WEBP', quality=88, method=6)
    print(n, c.size)
