import sys; sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.Xjwh7Qx8vB/scr')
from hl import *
D = R + 'dl/'
C = COL
import os
os.makedirs(R + 'work', exist_ok=True)

def autocrop(path, thr=0.55, frac=0.6, inset=0.025, chan=None):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im.resize((im.width // 8, im.height // 8))).astype(np.float32) / 255
    L = a.mean(axis=2) if chan is None else a[..., chan]
    dark = L < thr
    cols = np.where(dark.mean(axis=0) > frac)[0]; rows = np.where(dark.mean(axis=1) > frac)[0]
    x0, x1, y0, y1 = cols[0] * 8, cols[-1] * 8, rows[0] * 8, rows[-1] * 8
    w, h = x1 - x0, y1 - y0
    box = (int(x0 + w * inset), int(y0 + h * inset), int(x1 - w * inset), int(y1 - h * inset))
    print(os.path.basename(path), im.size, box)
    return im.crop(box)

for name in ['meteors', 'aurora-trouvelot', 'comet', 'eclipse']:
    im = autocrop(D + name + '.jpg', frac=0.5)
    im.thumbnail((2000, 2000)); im.save(R + 'work/' + name + '.jpg', quality=92)
im = autocrop(D + 'protuberances.jpg', thr=0.7, frac=0.5, chan=1)
im.thumbnail((2000, 2000)); im.save(R + 'work/protuberances.jpg', quality=92)
