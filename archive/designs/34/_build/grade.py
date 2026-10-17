# Grades a photograph into the Tension Prism palette: black, white, one mint.
# Neutral tones go to an ink→white ramp; saturated (spectral) tones collapse
# into the single primary, so a rainbow becomes one mint band.
# usage: grade.py <in> <out.png> <width> [crop x0,y0,x1,y1 as fractions] [mintgain]
import sys
import numpy as np
from PIL import Image, ImageFilter
src, dst, width = sys.argv[1], sys.argv[2], int(sys.argv[3])
crop = [float(v) for v in sys.argv[4].split(',')] if len(sys.argv) > 4 and sys.argv[4] != '-' else None
gain = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
im = Image.open(src).convert('RGB')
if crop:
    W, H = im.size
    im = im.crop((int(crop[0] * W), int(crop[1] * H), int(crop[2] * W), int(crop[3] * H)))
h = round(im.size[1] * width / im.size[0])
im = im.resize((width, h), Image.LANCZOS)
a = np.asarray(im).astype(np.float32) / 255.0
lin = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
L = 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]
mx, mn = a.max(-1), a.min(-1)
sat = np.clip((mx - mn) / (mx + 1e-4), 0, 1)
sat = np.clip((sat - 0.18) / 0.5, 0, 1) ** 1.2
# tone curve: deep blacks, crisp whites
t = np.clip(L, 0, 1) ** (1 / 2.2)
t = np.clip((t - 0.04) / 0.92, 0, 1)
t = t * t * (3 - 2 * t)
ink = np.array([6, 8, 7]) / 255.0
white = np.array([244, 255, 248]) / 255.0
mint = np.array([57, 253, 158]) / 255.0
mono = ink + (white - ink) * t[..., None]
glow = np.clip(t * 1.6 * gain, 0, 1)[..., None]
mintc = ink + (mint - ink) * glow
out = mono * (1 - sat[..., None]) + mintc * sat[..., None]
# fine grain
rng = np.random.default_rng(0x6c586a)
out = np.clip(out + rng.normal(0, 0.012, out.shape[:2])[..., None], 0, 1)
Image.fromarray((out * 255).astype(np.uint8)).save(dst)
print(dst, out.shape)
