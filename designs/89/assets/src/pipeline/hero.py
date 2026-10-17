"""usage: hero.py a|b src out width [mix]"""
import sys, numpy as np
from PIL import Image
sys.path.insert(0, __file__.rsplit('/',1)[0])
from lib import *

def hexrgb(h): h=h.lstrip('#'); return [int(h[i:i+2],16)/255 for i in (0,2,4)]
def gradmap(L, stops):
    xs=[s[0] for s in stops]; cols=np.array([hexrgb(s[1]) for s in stops])
    return np.stack([np.interp(L,xs,cols[:,c]) for c in range(3)],-1)

RAMPS={
 # candy dusk: plum -> berry -> rose -> apricot (seed 36) -> cream
 'a':[(0,'#1d1430'),(0.18,'#3d2350'),(0.38,'#8a4a78'),(0.58,'#e0838a'),(0.76,'#f7b27a'),(0.9,'#ffe2b8'),(1,'#fff8ee')],
 'b':[(0,'#170f26'),(0.16,'#33204a'),(0.36,'#7c3f6e'),(0.55,'#d97a86'),(0.72,'#f6a96b'),(0.88,'#ffdca8'),(1,'#fffaf0')],
}

which,src,out,width=sys.argv[1],sys.argv[2],sys.argv[3],int(sys.argv[4])
mix=float(sys.argv[5]) if len(sys.argv)>5 else 0.62
im=Image.open(src).convert('RGB')
W,H=im.size
if which=="a":
    im=im.crop((int(.06*W),0,W,int(.97*H)))
elif which=="x":
    a=to_arr(im)
    a=inpaint_cols(a,(int(.704*W),int(.148*H),int(.770*W),int(.318*H)))
    im=to_img(a).crop((int(.05*W),0,W,H))
elif which=='b':
    im=im.crop((int(W*0.17),0,int(W*0.915),H))
im=im.resize((width,round(im.size[1]*width/im.size[0])),Image.LANCZOS)
a=to_arr(im)
L=lum(a)
# local contrast-preserving luminance with a soft curve
Lc=np.clip(L,0,1)**0.78
gm=gradmap(Lc,RAMPS[which])
# keep a bit of original colour (mint chair, gold) but desaturated toward the map
orig=splittone(a,[0.25,0.15,0.35],[1.0,0.85,0.65],0.25,0.15)
a=orig*(1-mix)+gm*mix
bright=smooth(L,0.55,0.95)
bl=blur(bright,width/70)
a=screen(a, bl[...,None]*np.array([0.30,0.17,0.10]))
a=prism_fringe(a, blur(bright,width/900), max(2,width//260), 0.5)
a=vignette(a,0.28)
to_img(a).save(out,quality=92)
print(out,to_img(a).size)
