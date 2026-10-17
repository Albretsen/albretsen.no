import numpy as np
from PIL import Image, ImageFilter
T='/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.dTFilSTfcL'
OUT=T+'/plates'
import os; os.makedirs(OUT,exist_ok=True)

def load(name, crop):
    im=Image.open(f'{T}/dl/{name}.jpg').convert('RGB')
    w,h=im.size; l,t,r,b=crop
    im=im.crop((int(w*l),int(h*t),int(w*(1-r)),int(h*(1-b))))
    return im

def arr(im): return np.asarray(im).astype(np.float32)/255.0
def img(a): return Image.fromarray((np.clip(a,0,1)*255+0.5).astype(np.uint8))

def lum(a): return a[...,0]*0.2126+a[...,1]*0.7152+a[...,2]*0.0722

def split(a, sh, hi, amt_s=0.35, amt_h=0.25):
    L=lum(a)[...,None]
    ws=(1-L)**2*amt_s; wh=L**2*amt_h
    sh=np.array(sh,np.float32); hi=np.array(hi,np.float32)
    # soft-light style tint: multiply toward colour while preserving luminance
    out=a*(1-ws)+ (sh*L*2.2)*ws
    out=out*(1-wh)+ (1-(1-out)*(1-hi))*wh
    return out

def curve(a, lift=0.0, gamma=1.0, gain=1.0, sat=1.0):
    a=lift+(1-lift)*a
    a=np.power(np.clip(a,0,1),gamma)*gain
    L=lum(a)[...,None]
    return L+(a-L)*sat

def glow(a, cx, cy, rad, col, amt):
    h,w,_=a.shape
    y,x=np.mgrid[0:h,0:w].astype(np.float32)
    d=np.sqrt(((x/w-cx)*w/h)**2+(y/h-cy)**2)
    g=np.exp(-(d/rad)**2)[...,None]*amt
    col=np.array(col,np.float32)
    return 1-(1-a)*(1-col*g)

def vgrad(a, top, bot, amt):
    h,w,_=a.shape
    t=np.linspace(0,1,h,dtype=np.float32)[:,None,None]
    c=np.array(top,np.float32)*(1-t)+np.array(bot,np.float32)*t
    return a*(1-amt)+a*c*amt*1.6

def grain(a, amt=0.018, seed=1):
    rng=np.random.default_rng(seed)
    n=rng.normal(0,1,a.shape[:2]).astype(np.float32)[...,None]
    return a+n*amt

def save(a,name,W=2400):
    im=img(a)
    if im.width>W: im=im.resize((W,int(im.height*W/im.width)),Image.LANCZOS)
    im.save(f'{OUT}/{name}.jpg',quality=93)
    print(name,im.size)

# Dawn: Dahl, View over Hallingdal (1844). Cold blue valley turning gold at the ridge.
a=arr(load('hallingdal',(0.025,0.03,0.025,0.035)))
a=curve(a,lift=0.06,gamma=0.86,gain=1.06,sat=1.05)
a=split(a,(0.16,0.32,0.70),(1.0,0.78,0.46),0.75,0.32)
a=glow(a,0.56,0.30,0.38,(1.0,0.72,0.42),0.55)
a=glow(a,0.56,0.33,0.12,(1.0,0.90,0.70),0.45)
save(grain(a,0.012,1),'view-dawn')

# Morning: Fearnley, Gudvangen (1839). Cliffs in cold shade, first sun on the snow line.
a=arr(load('fearnley',(0.035,0.075,0.055,0.065)))
a=curve(a,lift=0.05,gamma=0.82,gain=1.05,sat=0.92)
a=split(a,(0.18,0.34,0.66),(1.0,0.84,0.56),0.70,0.30)
a=glow(a,0.70,0.10,0.45,(1.0,0.82,0.55),0.40)
save(grain(a,0.012,2),'view-fjord')

# Noon: Cezanne, The Gulf of Marseille Seen from L'Estaque (ca. 1885). Riviera, terracotta and sea.
a=arr(load('estaque',(0.012,0.015,0.012,0.015)))
a=curve(a,lift=0.02,gamma=0.95,gain=1.03,sat=1.12)
a=split(a,(0.25,0.38,0.62),(1.0,0.90,0.70),0.25,0.12)
save(grain(a,0.010,3),'view-noon')

# Golden hour: Claude Lorrain, Sunrise (1646-47). Low gold through the trees.
a=arr(load('lorrain',(0.025,0.03,0.025,0.03)))
a=curve(a,lift=0.05,gamma=0.80,gain=1.10,sat=1.08)
a=split(a,(0.30,0.28,0.50),(1.0,0.78,0.45),0.45,0.35)
a=glow(a,0.42,0.42,0.40,(1.0,0.70,0.35),0.55)
save(grain(a,0.012,4),'view-gold')

# Extras: olives (Van Gogh), Gardanne (Cezanne), Sainte-Victoire, North Cape, Collettes
for nm,cr,pars in [
  ('olives',(0.02,0.02,0.02,0.02),dict(lift=0.02,gamma=0.95,gain=1.02,sat=1.05)),
  ('gardanne',(0.025,0.02,0.025,0.02),dict(lift=0.02,gamma=0.95,gain=1.02,sat=1.10)),
  ('victoire',(0.02,0.02,0.02,0.02),dict(lift=0.02,gamma=0.95,gain=1.03,sat=1.08)),
  ('balke',(0.01,0.01,0.01,0.01),dict(lift=0.05,gamma=0.85,gain=1.08,sat=1.0)),
  ('collettes',(0.03,0.03,0.03,0.03),dict(lift=0.0,gamma=1.0,gain=1.0,sat=1.05)),
  ('dahlsunset',(0.03,0.03,0.03,0.03),dict(lift=0.04,gamma=0.86,gain=1.06,sat=1.05)),
]:
    a=arr(load(nm,cr)); a=curve(a,**pars)
    if nm=='balke': a=split(a,(0.20,0.30,0.58),(0.95,0.90,1.0),0.6,0.2)
    save(grain(a,0.010,7),'plate-'+nm,2000)
