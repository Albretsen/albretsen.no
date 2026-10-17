"""Hero 3: the shore at the moment the sun touches the water. Highsmith Monterey sunset, Portra/Ektar grade."""
import sys
import numpy as np, cv2
from film import *

im = load('src/monterey3.jpg', 3200)
h, w = im.shape[:2]
L = lum(im)
yy = np.arange(h, dtype=np.float32)[:, None] * np.ones((1, w), np.float32)
lin = srgb_to_lin(im)
# grey clouds -> lilac shadows, bright cloud edges -> flamingo; keep the sun hot
k = smoothstep(0.15, 0.75, L)[..., None]
t_lo = srgb_to_lin(hexrgb('#9a8fbf'))
t_hi = srgb_to_lin(hexrgb('#ffc9c2'))
t = t_lo * (1 - k) + t_hi * k
g_ = lum(lin)[..., None]
lin2 = g_ + (lin - g_) * 1.15
out = lin_to_srgb(lin2 * t * 1.38)
# keep original warm sun core
core = smoothstep(0.8, 0.97, L)[..., None]
out = out * (1 - core) + im * core
# sand foreground cooler mauve
sand = smoothstep(0.78, 0.95, yy / h)[..., None]
out = out * (1 - sand * 0.25) + out * hexrgb('#c8a0b8') * sand * 0.25
out = portra(out, lift=0.04, warm=0.025, sat=1.0)
out = halation(out, thresh=0.75, col='#ff6a50', amt=0.25)
out = bloom(out, 0.7, 0.03, 0.35)
out = vignette(out, 0.2)
out = grain(out, 0.016, 1.3, seed=11)
save(sys.argv[1] if len(sys.argv) > 1 else 'out_shore.jpg', out, 94)
