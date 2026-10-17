import numpy as np
from PIL import Image
from scipy import ndimage as ndi

def srgb2lin(x): return np.where(x<=0.04045,x/12.92,((x+0.055)/1.055)**2.4)
def lin2srgb(x):
    x=np.clip(x,0,1); return np.where(x<=0.0031308,12.92*x,1.055*x**(1/2.4)-0.055)
def hexc(h):
    h=h.lstrip('#'); return srgb2lin(np.array([int(h[i:i+2],16)/255 for i in (0,2,4)]))

PAPER=hexc('#f7f5ea'); PAPER2=hexc('#eae6d8'); INK=hexc('#0b1711')
SPOT=hexc('#2f9e3c'); SPOTD=hexc('#005e26'); SPOTI=hexc('#00301a'); GLASS=hexc('#d1f2d7'); GLOW=hexc('#a6f08f')

def load_gray(path, crop=0.02):
    im=Image.open(path).convert('L'); w,h=im.size
    im=im.crop((int(w*crop),int(h*crop),int(w*(1-crop)),int(h*(1-crop))))
    return im

def bilinear(img, x, y):
    """img HxWxC, x,y float coord arrays -> sampled, clamp edges"""
    H,W=img.shape[:2]
    x=np.clip(x,0,W-1.001); y=np.clip(y,0,H-1.001)
    x0=np.floor(x).astype(np.int32); y0=np.floor(y).astype(np.int32)
    fx=(x-x0)[...,None]; fy=(y-y0)[...,None]
    a=img[y0,x0]; b=img[y0,x0+1]; c=img[y0+1,x0]; d=img[y0+1,x0+1]
    return (a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy

def paper_tex(H,W,seed=1):
    rng=np.random.default_rng(seed)
    n=rng.standard_normal((H,W)).astype(np.float32)
    fine=ndi.gaussian_filter(n,0.7)*0.5
    mid=ndi.gaussian_filter(rng.standard_normal((H,W)).astype(np.float32),6)*6
    # fibres: anisotropic noise
    fib=ndi.gaussian_filter(rng.standard_normal((H,W)).astype(np.float32),(1.2,3.5))*4
    t=fine*0.035+mid*0.02+fib*0.02
    return t

def save(img_lin, path, q=88):
    a=(lin2srgb(img_lin)*255+0.5).astype(np.uint8)
    im=Image.fromarray(a); im.save(path, quality=q); return im

def grain(H,W,amt=0.012,seed=3):
    rng=np.random.default_rng(seed)
    return (rng.standard_normal((H,W,1)).astype(np.float32))*amt
