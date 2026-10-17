"""Hero 3: 'The long arcade' - one-point perspective colonnade for the single slow dolly (PD photo)."""
import sys; sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.gnTd028yfQ')
from grade import *
OUT = T + '/h3'
a = load(T + '/src/PalaisRoyalParisMai2006001jpg.jpg')
h, w = a.shape[:2]
g = amber(a, contrast=1.2, pivot=0.5, gamma=1.05, keep=0.12, lift=0.03)
# raking late light through the arches on the left: soft diagonal shafts
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
u = (1 - xx / w) * 0.9 + (yy / h) * 0.45
shafts = (np.sin(u * 16 + 1.3) * 0.5 + 0.5) ** 7
shafts = ndimage.gaussian_filter(shafts, 18) * smooth(0.45, 0.98, xx / w) * smooth(0.98, 0.3, yy / h)
c = hx('#FFC98A')
g = 1 - (1 - g) * (1 - c * (shafts * 0.38)[..., None])
# vanishing-point glow (the end of the arcade is bright)
vp = (0.53, 0.6)
g = bloom(g, vp, .35, .22)
g = vignette(g, .3)
im = to_img(g)
im = to_img(grain(np.asarray(im).astype(np.float32) / 255, 0.018))
im.save(OUT + '-master.png')
