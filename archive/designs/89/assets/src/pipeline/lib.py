import numpy as np
from PIL import Image, ImageFilter

def smooth(x,a,b):
    t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)

def rgb2hsv(a):
    r,g,b=a[...,0],a[...,1],a[...,2]
    mx=a.max(-1); mn=a.min(-1); d=mx-mn+1e-6
    h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))/6
    s=np.where(mx>0,(mx-mn)/(mx+1e-6),0); return h%1,s,mx

def hsv2rgb(h,s,v):
    i=(np.floor(h*6)%6).astype(int); f=h*6-np.floor(h*6)
    p=v*(1-s); q=v*(1-f*s); t=v*(1-(1-f)*s)
    r=np.choose(i,[v,q,p,p,t,v]); g=np.choose(i,[t,v,v,q,p,p]); b=np.choose(i,[p,p,t,v,v,q])
    return np.stack([r,g,b],-1)

def hueshift(a, center, width, target, satmul=1.0, vmul=1.0, minsat=0.08):
    """a float array 0..1. rotate hues near center toward target."""
    h,s,v=rgb2hsv(a)
    dist=np.abs(((h-center+0.5)%1)-0.5)
    w=np.clip(1-dist/width,0,1); w=w*w*(3-2*w)
    w=w*smooth(s,minsat*0.5,minsat*2)
    nh=(h+w*(((target-h+0.5)%1)-0.5))%1
    ns=np.clip(s*(1+w*(satmul-1)),0,1); nv=np.clip(v*(1+w*(vmul-1)),0,1)
    return hsv2rgb(nh,ns,nv)

def inpaint_cols(a, box, seed=3):
    """vertical interpolation fill for flat wall areas; box in pixel coords"""
    a=a.copy(); x0,y0,x1,y1=box
    top=a[y0-4:y0].mean(0); bot=a[y1:y1+4].mean(0)
    t=np.linspace(0,1,y1-y0)[:,None,None]
    fill=top[None,x0:x1]*(1-t)+bot[None,x0:x1]*t
    rng=np.random.default_rng(seed); fill=fill+rng.normal(0,0.012,fill.shape)
    # feather horizontally
    a[y0:y1,x0:x1]=fill
    return a

def to_img(a): return Image.fromarray((np.clip(a,0,1)*255+0.5).astype(np.uint8))
def to_arr(im): return np.asarray(im.convert('RGB')).astype(np.float32)/255

def blur(a, r):
    im=to_img(a) if a.ndim==3 else Image.fromarray((np.clip(a,0,1)*255).astype(np.uint8))
    b=np.asarray(im.filter(ImageFilter.GaussianBlur(r))).astype(np.float32)/255
    return b

def lum(a): return (a*np.array([0.2126,0.7152,0.0722])).sum(-1)

def screen(a,b): return 1-(1-a)*(1-b)

def prism_fringe(a, mask, shift, strength=0.5):
    """chromatic fringes around bright mask: red pushed one way, blue the other"""
    R=np.roll(mask,shift,1); B=np.roll(mask,-shift,1); G=mask
    R[:,:shift]=0; B[:,-shift:]=0
    fr=np.stack([np.clip(R-G,0,1)*1.0+np.clip(R-B,0,1)*0.3, np.clip(G-np.maximum(R,B),0,1)*0.6+np.clip(G-B,0,1)*0.25, np.clip(B-G,0,1)*1.0],-1)
    return screen(a, fr*strength)

def vignette(a, k=0.22, cy=0.55):
    H,W=a.shape[:2]; yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
    v=((xx/W-0.5)**2+(yy/H-cy)**2)
    return a*(1-k*smooth(v,0.12,0.45))[...,None]

def splittone(a, sh, hi, ks=0.28, kh=0.2):
    L=lum(a)[...,None]
    ws=1-smooth(L,0,0.5); wh=smooth(L,0.5,1)
    a=a*(1-ks*ws)+np.array(sh)*ks*ws
    a=a*(1-kh*wh)+np.array(hi)*kh*wh
    return a

def bayer(n):
    if n==1: return np.array([[0]])
    m=bayer(n//2)
    return np.block([[4*m,4*m+2],[4*m+3,4*m+1]])

def dither_palette(a, pal, cell, strength=0.12):
    """downsample by cell, ordered-dither to palette (list of rgb 0..1), upscale nearest"""
    H,W=a.shape[:2]; w,h=W//cell,H//cell
    small=to_arr(to_img(a).resize((w,h),Image.BOX))
    B=(bayer(8)/64.0-0.5)
    th=np.tile(B,(h//8+1,w//8+1))[:h,:w][...,None]
    s=small+th*strength
    P=np.array(pal)
    # perceptual-ish distance with weights
    d=((s[:,:,None,:]-P[None,None])**2*np.array([0.30,0.59,0.11])).sum(-1)
    idx=d.argmin(-1)
    q=P[idx]
    up=to_img(q).resize((w*cell,h*cell),Image.NEAREST)
    return to_arr(up), q, idx
