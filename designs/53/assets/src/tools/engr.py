import sys; sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.Xjwh7Qx8vB/scr')
from hl import *
from PIL import ImageFilter
import os
C = COL
W_ = R + 'work/'
os.makedirs(OUT + 'illustration', exist_ok=True)

def lightdots_im(im, cell=12, angle=27, black=.1, white=.85, gamma=1.0, under=.25, bloom=.3, stops=None, chan=None):
    a0 = np.asarray(im).astype(np.float32) / 255
    L = lum(im) if chan is None else a0[..., chan]
    L = tone(L, black, white, gamma)
    stops = stops or [(0, C['peat']), (0.3, C['clay']), (0.55, C['ember']), (0.8, C['ochre']), (1, C['vellum'])]
    ink = ramp(L, stops)
    cov = halftone(L, cell, angle)
    a = np.clip(cov * (1 - under) + L * under, 0, 1)[..., None]
    out = np.array(C['umber'], np.float32) * (1 - a) + ink * a
    H, W = L.shape
    hi = np.clip((L - 0.6) / 0.4, 0, 1)
    hb = np.asarray(Image.fromarray((hi * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(W / 50))).astype(np.float32) / 255
    out = out + hb[..., None] * np.array(C['ember'], np.float32) * bloom
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

jobs = {
 'meteors':  dict(size=(1200, 1600), black=.18, white=.75, gamma=1.2),
 'aurora-trouvelot': dict(size=(1600, 1200), black=.2, white=.8, gamma=1.3),
 'eclipse':  dict(size=(1600, 1200), black=.15, white=.85, gamma=1.1),
 'comet':    dict(size=(1200, 1600), black=.06, white=.6, gamma=.85),
}
which = sys.argv[1:] or list(jobs) + ['protuberances']
for k, j in jobs.items():
    if k not in which: continue
    im = cover(Image.open(W_ + k + '.jpg').convert('RGB'), *j['size'])
    out = lightdots_im(im, cell=11, black=j['black'], white=j['white'], gamma=j['gamma'])
    out.save(R + 'work/ht-' + k + '.png')
    save(out, 'illustration/' + k.replace('-trouvelot', ''), 72)
if 'protuberances' in which:
    im = Image.open(W_ + 'protuberances.jpg').convert('RGB')
    w, h = im.size; im = im.crop((int(w * .06), int(h * .085), int(w * .94), int(h * .97)))
    im = cover(im, 900, 1600)
    out = lightdots_im(im, cell=11, black=.35, white=.95, gamma=1.4, chan=0)
    save(out, 'illustration/protuberances', 80)
