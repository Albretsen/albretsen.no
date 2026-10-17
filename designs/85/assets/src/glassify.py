"""Turn an ink mask into glass objects lying on paper. Shared by hero + product renders."""
import numpy as np
from scipy import ndimage as ndi
from common import *

def smooth(e0,e1,x):
    t=np.clip((x-e0)/(e1-e0),0,1); return t*t*(3-2*t)

def make_paper(H,W,sc,grid=True,seed=1,gridcol=None):
    yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
    tex=paper_tex(H,W,seed)[...,None]
    P=PAPER*(1+tex)
    if grid:
        g=56*sc
        gl=np.minimum(np.abs(((xx+g/2)%g)-g/2),np.abs(((yy+g/2)%g)-g/2))
        g2=g*5
        gl2=np.minimum(np.abs(((xx+g2/2)%g2)-g2/2),np.abs(((yy+g2/2)%g2)-g2/2))
        gr=np.exp(-(gl/(0.8*sc+0.35))**2)*0.10+np.exp(-(gl2/(1.1*sc+0.45))**2)*0.22
        gc=SPOTD if gridcol is None else gridcol
        P=P*(1-gr[...,None])+gc*gr[...,None]*0.9
    return P

def glassify(a, P, sc, light=(-0.45,-0.7,0.56), R=38, detail=0.20, D=80, shadow_off=(26,38), tint=1.0, mask=None):
    """a: ink lines 0..1 (HxW), P: background paper HxWx3 (linear). Returns rgb, mask."""
    H,W=a.shape
    if mask is None:
        m=ndi.gaussian_filter(a,3*sc)>0.22
        m=ndi.binary_fill_holes(m)
        m=ndi.binary_opening(m,iterations=max(1,int(2*sc)))
        lab,n=ndi.label(m); sizes=ndi.sum(m,lab,range(1,n+1))
        keep=np.isin(lab,1+np.where(sizes>(900*sc*sc))[0]); m=keep
    else:
        m=mask
    mf=ndi.gaussian_filter(m.astype(np.float32),1.0)
    dist=ndi.distance_transform_edt(m).astype(np.float32)
    dome=1-(1-np.clip(dist/(R*sc),0,1))**2
    dome=ndi.gaussian_filter(dome,1.2*sc)
    big=np.sqrt(np.clip(dist/(170*sc),0,1))
    dome=dome*0.75+big*0.55
    h=dome*1.0 - detail*ndi.gaussian_filter(a,1.3*sc)*m + 0.04*ndi.gaussian_filter(a,5*sc)*m
    gy,gx=np.gradient(h)
    K=R*sc*0.9
    nx,ny,nz=-gx*K,-gy*K,np.ones_like(gx)
    ln=np.sqrt(nx*nx+ny*ny+nz*nz); nx/=ln; ny/=ln; nz/=ln
    yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
    # shadow + caustic on paper
    ox,oy=shadow_off[0]*sc,shadow_off[1]*sc
    msh=ndi.shift(mf,(oy,ox),order=1)
    sh=ndi.gaussian_filter(msh,14*sc)
    lap=-ndi.laplace(ndi.gaussian_filter(h,5*sc))
    cs=ndi.shift((np.clip(dist/(60*sc),0,1)**3)*m,(oy*0.8,ox*0.8),order=1)
    cs=ndi.gaussian_filter(cs,2.2*sc); cs=cs/(cs.max()+1e-6)
    core=ndi.shift(ndi.gaussian_filter(dome*m,6*sc),(oy*0.7,ox*0.7),order=1)
    Pg=P*(1-0.30*sh[...,None]*np.array([1.0,0.93,0.97]))
    Pg=Pg+ (GLOW*0.42)*(np.clip(cs*1.6,0,1)**1.5*sh)[...,None]*tint + (SPOT*0.06)*(core*sh)[...,None]*tint
    # refraction
    ch=[]
    for i,k in enumerate((1.0,1.08,1.17)):
        ch.append(bilinear(Pg[...,i:i+1],xx+nx*D*sc*k,yy+ny*D*sc*k)[...,0])
    refr=np.stack(ch,-1)
    thick=h.clip(0,None)
    absorb=np.exp(-thick[...,None]*np.array([0.10,0.02,0.08])*tint)
    edge_green=np.exp(-(np.clip((1-nz)*5,0,3))[...,None]*np.array([1.0,0.42,0.85]))
    body=refr*absorb*edge_green
    Lx,Ly,Lz=light; ll=np.sqrt(Lx*Lx+Ly*Ly+Lz*Lz); Lx/=ll;Ly/=ll;Lz/=ll
    Rx,Ry,Rz=2*nz*nx,2*nz*ny,2*nz*nz-1
    spec=np.clip(Rx*Lx+Ry*Ly+Rz*Lz,0,1)**120
    spec2=np.clip(Rx*0.55+Ry*0.35+Rz*0.76,0,1)**18
    fres=np.clip((1-nz)**1.6*1.6,0,1)
    env=0.4+0.6*smooth(-0.2,0.6,-Ry)  # softbox overhead
    g=body*(1-0.8*fres)[...,None] + np.array([1,1,0.97])*(fres*env*0.55)[...,None] + 2.4*spec[...,None] + (GLASS*0.18)*spec2[...,None]
    out=Pg*(1-mf[...,None])+g*mf[...,None]
    return out, mf
