"""Glass ball lenses resting on an ink-printed plate. Real ray-traced refraction (two interfaces), dispersion, shadow + focused caustic."""
import sys, json, numpy as np
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, sys.argv[1]+'/py')
from common import *
from glassify import smooth, make_paper

def ink_plate(S, src, W, H, zoom=1.0, cx=0.5, cy=0.5, crop=0.02, invert=False):
    im=load_gray(S+'/dl/'+src, crop)
    w,h=im.size; PW=int(W*zoom); nh=int(h*PW/w)
    if nh<H: nh=H; PW=int(w*H/h)
    im=im.resize((PW,nh),Image.LANCZOS)
    left=int(np.clip(cx*PW-W/2,0,PW-W)); top=int(np.clip(cy*nh-H/2,0,nh-H))
    L=np.asarray(im.crop((left,top,left+W,top+H)),dtype=np.float32)/255
    if invert: L=1-L
    return smooth(0.10,0.80,L)

def refract(I,N,eta):
    c=-(I*N).sum(0); k=1-eta*eta*(1-c*c)
    T=eta*I+(eta*c-np.sqrt(np.clip(k,0,None)))*N
    R=I+2*c*N
    return np.where(k[None]<0,R,T), k<0

def render_lenses(bg, lenses, sc, lift=1.6, light=(-0.5,-0.75), tint=True, iors=(1.512,1.518,1.526)):
    H,W,_=bg.shape
    yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
    lx,ly=light
    # shadows + caustics first (on the paper)
    B=bg.copy()
    for (cx,cy,r) in lenses:
        sx,sy=cx-lx*r*(0.9+lift*0.6), cy-ly*r*(0.9+lift*0.6)
        d=np.sqrt((xx-sx)**2+(yy-sy)**2)
        sh=np.exp(-(np.clip(d-r*0.75,0,None)/(r*0.32))**2)*smooth(r*1.25,r*0.2,d)
        sh=np.clip(np.exp(-(np.clip(d-r*0.45,0,None)/(r*(0.45+lift*0.25)))**2),0,1)*(1/(1+lift*0.35))
        B=B*(1-0.62*sh[...,None]*np.array([1.0,0.9,0.95]))
        fx,fy=sx+lx*r*0.05, sy+ly*r*0.05
        df=np.sqrt((xx-fx)**2+(yy-fy)**2)
        caus=np.exp(-(df/(r*0.13))**2)*1.3+np.exp(-(df/(r*0.34))**2)*0.25
        ring=np.exp(-((d-r*0.62)/(r*0.06))**2)*0.25*sh
        B=B+(GLOW*1.0)*(caus*sh)[...,None]+(SPOT*0.4)*ring[...,None]+np.array([1,1,0.95])*(np.exp(-(df/(r*0.05))**2)*0.9)[...,None]
    out=B.copy()
    for (cx,cy,r) in sorted(lenses,key=lambda l:l[2]):
        x0,x1=int(max(0,cx-r-2)),int(min(W,cx+r+2)); y0,y1=int(max(0,cy-r-2)),int(min(H,cy+r+2))
        X=xx[y0:y1,x0:x1]; Y=yy[y0:y1,x0:x1]
        dx=(X-cx)/r; dy=(Y-cy)/r; rr=dx*dx+dy*dy
        inside=rr<1
        dz=np.sqrt(np.clip(1-rr,0,1))
        N1=np.stack([dx,dy,dz])  # unit
        I=np.zeros_like(N1); I[2]=-1
        cols=[]
        for ci,ior in enumerate(iors):
            T1,_=refract(I,N1,1/ior)
            P1=N1.copy()  # on unit sphere centred at 0 (relative coords, units of r)
            s=-2*(P1*T1).sum(0)
            P2=P1+T1*s
            N2=-P2
            T2,tir=refract(T1,N2,ior)
            # sphere centre at height r above plane => plane at z=-1 in unit coords
            tt=(-1-lift-P2[2])/np.minimum(T2[2],-1e-3)
            hx=P2[0]+T2[0]*tt; hy=P2[1]+T2[1]*tt
            smp=bilinear(bg[...,ci:ci+1],cx+hx*r,cy+hy*r)[...,0]
            cols.append(smp)
        col=np.stack(cols,-1)
        cosi=dz
        F=0.04+0.96*(1-cosi)**5
        # environment: soft overhead window + dark room
        R=np.stack([2*dz*dx,2*dz*dy,2*dz*dz-1])
        env=0.08+0.9*smooth(0.2,0.9,-R[1]*0.7-R[0]*0.5+R[2]*0.2)
        env=env[...,None]*np.array([1.0,1.0,0.98])
        Lv=np.array([-0.45,-0.62,0.64]); Lv/=np.linalg.norm(Lv)
        spec=np.clip(R[0]*Lv[0]+R[1]*Lv[1]+R[2]*Lv[2],0,1)**260
        spec2=np.clip(R[0]*0.6+R[1]*0.25+R[2]*0.76,0,1)**60
        absorb=np.exp(-(dz*2)[...,None]*np.array([0.035,0.006,0.026])) if tint else 1
        edge=np.exp(-np.clip(((1-dz)**2.5)*9.0,0,6)[...,None]*np.array([0.55,0.22,0.45]))
        g=col*absorb*edge*(1-F[...,None])+env*F[...,None]*0.9+3.0*spec[...,None]+0.35*spec2[...,None]*np.array([0.9,1,0.9])
        aa=np.clip((1-np.sqrt(rr))*r/1.2,0,1)[...,None]
        out[y0:y1,x0:x1]=out[y0:y1,x0:x1]*(1-aa)+g*aa
    return out

if __name__=='__main__':
    S=sys.argv[1]; W=int(sys.argv[2]); H=int(sys.argv[3]); tag=sys.argv[4]; cfg=json.loads(sys.argv[5])
    sc=W/2400
    a=ink_plate(S,cfg['src'],W,H,cfg.get('zoom',1.0),cfg.get('cx',0.5),cfg.get('cy',0.5))
    P=make_paper(H,W,sc,grid=cfg.get('grid',False))
    inkc=INK
    bg=P*(1-a[...,None]*0.95)+inkc*a[...,None]*0.95
    lenses=[(x*W,y*H,r*H) for x,y,r in cfg['lenses']]
    o=render_lenses(bg,lenses,sc)
    vign=1-0.18*((((np.mgrid[0:H,0:W][1]-W*0.5)/W)**2+((np.mgrid[0:H,0:W][0]-H*0.5)/H)**2)*1.6)[...,None]
    o=o*vign+grain(H,W,0.006)
    save(o,S+f'/out/{tag}-{W}.jpg',92)
    print('ok')
