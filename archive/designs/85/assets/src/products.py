"""Real product logo printed on atlas paper, under a ray-traced glass paperweight dome."""
import sys, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
sys.path.insert(0, sys.argv[1]+'/py')
from common import *
from glassify import make_paper, smooth
from lens import refract
S=sys.argv[1]; logo=sys.argv[2]; out=sys.argv[3]; N=int(sys.argv[4]); logo_frac=float(sys.argv[5]); rounded=float(sys.argv[6]) if len(sys.argv)>6 else 0
seed=int(sys.argv[7]) if len(sys.argv)>7 else 2
sc=N/1200
H=W=N
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
P=make_paper(H,W,sc*0.9,grid=True,seed=seed)
cx=cy=N/2
# printed scale ring (atlas ticks) around the dome base
rb=0.36*N
d=np.sqrt((xx-cx)**2+(yy-cy)**2); ang=np.arctan2(yy-cy,xx-cx)
ring=np.exp(-((d-rb*1.12)/(0.9*sc+0.4))**2)
ticks=(np.abs(((ang/(2*np.pi)*120)%1)-0.5)>0.47)*(d>rb*1.12)*(d<rb*1.12+14*sc)
majt=(np.abs(((ang/(2*np.pi)*12)%1)-0.5)>0.494)*(d>rb*1.12)*(d<rb*1.12+30*sc)
ink=np.clip(ring*0.8+ticks*0.6+majt*0.9,0,1)
P=P*(1-ink[...,None]*0.85)+INK*ink[...,None]*0.85
# logo
L=Image.open(logo).convert('RGBA')
lw=int(N*logo_frac); L.thumbnail((lw,lw),Image.LANCZOS)
if rounded>0:
    m=Image.new('L',L.size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,L.width-1,L.height-1),radius=int(L.width*rounded),fill=255)
    al=np.minimum(np.asarray(L)[...,3],np.asarray(m)); L.putalpha(Image.fromarray(al))
la=np.asarray(L,dtype=np.float32)/255
ox,oy=int(cx-L.width/2),int(cy-L.height/2)
reg=P[oy:oy+L.height,ox:ox+L.width]
lc=srgb2lin(la[...,:3]); a=la[...,3:4]
# printed: multiply-ish for darks, but keep colours true
reg[:]=reg*(1-a)+ (lc*0.97+reg*0.03)*a
# shadow + caustic of the dome
lx,ly=-0.5,-0.75
sx,sy=cx-lx*rb*0.18, cy-ly*rb*0.18
ds=np.sqrt((xx-sx)**2+(yy-sy)**2)
sh=np.exp(-(np.clip(ds-rb*0.92,0,None)/(rb*0.14))**2)*(d>rb*0.85)
B=P*(1-0.35*sh[...,None])
cxs,cys=cx-lx*rb*0.75, cy-ly*rb*0.75
crescent=0.55*np.exp(-((d-rb*1.0)/(rb*0.025))**2)*np.clip(((xx-cx)*(-lx)+(yy-cy)*(-ly))/rb,0,1)**2
B=B+(GLOW*0.8)*crescent[...,None]
# dome
hc=0.52*rb; Rs=(rb*rb+hc*hc)/(2*hc)
inside=d<rb
z=np.sqrt(np.clip(Rs*Rs-d*d,0,None))-(Rs-hc)
nzv=(z+Rs-hc)/Rs; nxv=(xx-cx)/Rs; nyv=(yy-cy)/Rs
N1=np.stack([nxv,nyv,nzv]); I=np.zeros_like(N1); I[2]=-1
cols=[]
for ci,ior in enumerate((1.508,1.516,1.526)):
    T,_=refract(I,N1,1/ior)
    t=z/np.maximum(-T[2],1e-3)
    hx=xx+T[0]*t; hy=yy+T[1]*t
    cols.append(bilinear(P[...,ci:ci+1],hx,hy)[...,0])
col=np.stack(cols,-1)
cosi=nzv
F=0.04+0.96*(1-cosi)**5
R=np.stack([2*nzv*nxv,2*nzv*nyv,2*nzv*nzv-1])
env=0.1+0.9*smooth(0.15,0.9,-R[1]*0.7-R[0]*0.5+R[2]*0.25)
Lv=np.array([-0.45,-0.62,0.64]); Lv/=np.linalg.norm(Lv)
spec=np.clip(R[0]*Lv[0]+R[1]*Lv[1]+R[2]*Lv[2],0,1)**300
spec2=np.clip(R[0]*-0.3+R[1]*0.6+R[2]*0.74,0,1)**80
edge=d/rb
rimg=np.exp(-np.clip((edge**16)*2.0,0,6)[...,None]*np.array([0.65,0.2,0.5]))
inner_ring=np.exp(-((edge-0.965)/0.02)**2)
g=col*rimg*(1-F[...,None])+env[...,None]*F[...,None]*0.85+3.2*spec[...,None]+0.5*spec2[...,None]
g=g*(1-0.35*inner_ring[...,None])+ (GLASS*0.25)*np.exp(-((edge-0.93)/0.03)**2)[...,None]
aa=np.clip((rb-d)/1.3,0,1)[...,None]
o=B*(1-aa)+g*aa
vign=1-0.12*((((xx-cx)/W)**2+((yy-cy)/H)**2)*2)[...,None]
o=o*vign+grain(H,W,0.005)
save(o,out,90); print('ok',out)
