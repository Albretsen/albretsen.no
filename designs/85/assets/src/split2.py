import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, sys.argv[1]+'/py')
from common import *
from glassify import *
S=sys.argv[1]; W=int(sys.argv[2]); H=int(sys.argv[3]); cy=float(sys.argv[4])
src=sys.argv[5]; tag=sys.argv[6]; shift=float(sys.argv[7]); zoom=float(sys.argv[8]) if len(sys.argv)>8 else 1.0
mid_frac=float(sys.argv[9]) if len(sys.argv)>9 else 0.5
sc=W/2400*zoom
im=load_gray(S+'/dl/'+src)
w,h=im.size; PW=int(W*zoom); nh=int(h*PW/w)
im=im.resize((PW,nh),Image.LANCZOS)
top=int(np.clip(cy*nh-H/2,0,nh-H))
left0=int(np.clip((PW-W)/2-shift*W,0,PW-W))
L=np.asarray(im.crop((left0,top,left0+W,top+H)),dtype=np.float32)/255
a=smooth(0.10,0.80,L)
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
P=make_paper(H,W,W/2400,grid=True)
Pplain=make_paper(H,W,W/2400,grid=False)
inkc=INK*(1+0.35*ndi.gaussian_filter(np.random.default_rng(5).standard_normal((H,W)).astype(np.float32),2)[...,None])
pap=Pplain*(1-a[...,None]*0.96)+inkc*a[...,None]*0.96
gl,mf=glassify(a,P,sc)
mid=W*mid_frac
mask=smooth(mid-1.5,mid+1.5,xx)[...,None]
comp=pap*(1-mask)+gl*mask
# seam: a thin upright glass blade
sw=34*W/2400
dx=(xx-mid)/sw
inb=np.abs(dx)<1
prof=np.sign(dx)*(1-np.sqrt(np.clip(1-dx*dx,0,1)))
out=[]
for i,k in enumerate((1.0,1.1,1.2)):
    out.append(bilinear(comp[...,i:i+1],xx+prof*sw*1.4*k,yy)[...,0])
blade=np.stack(out,-1)*np.array([0.93,0.99,0.95])
res=np.where(inb[...,None],blade,comp)
hl=np.exp(-((xx-mid+sw*0.62)/(1.3*W/2400+0.5))**2)*0.9+np.exp(-((xx-mid-sw*0.95)/(1.0*W/2400+0.5))**2)*0.35
dk=np.exp(-((xx-mid-sw*0.75)/(2.0*W/2400+0.5))**2)*0.25+np.exp(-((xx-mid+sw*0.98)/(1.2*W/2400+0.5))**2)*0.2
res=res*(1-dk[...,None])+np.array([1,1,0.98])*hl[...,None]
cast=1-0.10*np.exp(-((xx-mid-sw*1.2)/(sw*1.6)).clip(0,None))*(xx>mid+sw)
res=res*cast[...,None]
res=res+grain(H,W,0.006)
save(res,S+f'/out/{tag}-{W}.jpg',92)
save(pap,S+f'/out/{tag}-paper-{W}.jpg',90)
save(gl+grain(H,W,0.005),S+f'/out/{tag}-glass-{W}.jpg',90)
print('done')
