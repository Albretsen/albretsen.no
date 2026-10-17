"""dither.py src out_lowres.png cell [preview.png] — ordered-dither a photo to the Prism Room candy palette at 1/cell resolution"""
import sys
sys.path.insert(0, __file__.rsplit('/',1)[0])
from lib import *
from PIL import Image
PAL = ['#160c21','#2a1935','#572953','#8a3f6e','#ee6b47','#ff9a7d','#ff99c2','#bea6eb','#8deaca','#faea89','#86cbf3','#e8d8e6','#fff5ea']
pal = [[int(h[i:i+2],16)/255 for i in (1,3,5)] for h in PAL]
src, out, cell = sys.argv[1], sys.argv[2], int(sys.argv[3])
a = to_arr(Image.open(src))
up, q, idx = dither_palette(a, pal, cell, strength=0.16)
# save as true palette PNG (tiny)
P = Image.new('P', (q.shape[1], q.shape[0]))
flat = []
for c in pal: flat += [round(v*255) for v in c]
P.putpalette(flat + [0]*(768-len(flat)))
P.putdata(idx.flatten().tolist())
P.save(out, optimize=True)
print(out, P.size)
if len(sys.argv) > 4: to_img(up).save(sys.argv[4])
