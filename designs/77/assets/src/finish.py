# Painterly finishing pass: canvas weave, grain, slight softening, so the drawn set and the oil painting read as one surface.
import sys, numpy as np
from PIL import Image, ImageFilter
src, dst = sys.argv[1], sys.argv[2]
strength = float(sys.argv[3]) if len(sys.argv)>3 else 1.0
im = Image.open(src).convert('RGB')
im = im.filter(ImageFilter.GaussianBlur(0.55))
a = np.asarray(im).astype(np.float32)/255
h, w, _ = a.shape
y, x = np.mgrid[0:h, 0:w].astype(np.float32)
weave = (np.sin(x*1.9)*np.sin(y*2.1))*0.5 + (np.sin(x*0.37+y*0.11))*0.25
rng = np.random.default_rng(77)
n = rng.normal(0, 1, (h, w)).astype(np.float32)
nb = np.asarray(Image.fromarray(((n*0.25+0.5).clip(0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)/255-0.5
tex = (weave*0.012 + n*0.014 + nb*0.05)*strength
a = a + tex[..., None]*(0.6+0.4*a)
# gentle filmic shoulder
pass
pass
Image.fromarray((a.clip(0,1)*255+0.5).astype(np.uint8)).save(dst)
