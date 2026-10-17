import sys, numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
src, out, sunfrac = sys.argv[1], sys.argv[2], float(sys.argv[3])
im = Image.open(src).convert('RGB')
W,H = im.size
a = np.asarray(im.resize((W//8,H//8))).astype(np.float32)
lum = a.mean(2)
up = lum[:H//16]           # upper half only
yy,xx = np.unravel_index(np.argmax(up), up.shape)
sx = xx*8; sy = yy*8
print('sun at', sx, sy, 'of', W, H)
# crop: horizon is H/2. take rows from top=H*0.5 - ch*0.92 ... H/2 + ch*0.08
cw = int(W*0.36); ch = int(cw*9/16)
top = int(H/2 - ch*0.93); left = int(sx - cw*sunfrac)
arr = np.asarray(im)
cols = [(left+i) % W for i in range(cw)]
crop = arr[top:top+ch][:, cols]
Image.fromarray(crop).resize((2560,1440), Image.LANCZOS).save(out, quality=95)
print('crop', cw, ch, top, left)
