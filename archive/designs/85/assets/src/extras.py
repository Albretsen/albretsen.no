import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, sys.argv[1]+'/py')
from common import *
A=sys.argv[2]
rng=np.random.default_rng(11)
N=512
def wrapnoise(s,shape=(N,N)):
    return ndi.gaussian_filter(rng.standard_normal(shape).astype(np.float32),s,mode='wrap')
t=wrapnoise(0.7)*0.5*0.035+wrapnoise(6)*6*0.02+ndi.gaussian_filter(rng.standard_normal((N,N)).astype(np.float32),(1.2,3.5),mode='wrap')*4*0.02
fl=(ndi.gaussian_filter((rng.random((N,N))>0.9993).astype(np.float32),1.2,mode='wrap')*6).clip(0,1)
P=PAPER*(1+t[...,None])*(1-0.25*fl[...,None])
a=(lin2srgb(P)*255+0.5).astype(np.uint8)
Image.fromarray(a).save(A+'/extras/paper-tile.webp',quality=82,method=6)
Image.fromarray(a).save(A+'/extras/paper-tile.jpg',quality=84)
# caustic: light through a rippled glass sheet, accumulated photon density
M=1024
h=ndi.gaussian_filter(rng.standard_normal((M,M)).astype(np.float32),20,mode='wrap')*40
gy,gx=np.gradient(h)
k=3200.0
yy,xx=np.mgrid[0:M,0:M].astype(np.float32)
img=np.zeros((M,M),np.float32)
for oy in (0,0.25,0.5,0.75):
    for ox in (0,0.25,0.5,0.75):
        gxs=ndi.map_coordinates(gx,[yy+oy,xx+ox],order=1,mode='grid-wrap'); gys=ndi.map_coordinates(gy,[yy+oy,xx+ox],order=1,mode='grid-wrap')
        X=((xx+ox+gxs*k)%M).astype(np.int32); Y=((yy+oy+gys*k)%M).astype(np.int32)
        np.add.at(img,(Y.ravel(),X.ravel()),1)
img=ndi.gaussian_filter(img,1.3,mode="wrap"); img=img/np.percentile(img,98.5)
img=np.clip(img,0,1.4)
I=np.clip((img-0.12)/0.9,0,1)**0.9
col=np.array([160,240,143],np.float32)  # glow
rgba=np.zeros((M,M,4),np.uint8); rgba[...,:3]=col; rgba[...,3]=(I*255).astype(np.uint8)
Image.fromarray(rgba).resize((768,768),Image.LANCZOS).save(A+'/extras/caustic-tile.webp',quality=80,method=6)
print('ok')
