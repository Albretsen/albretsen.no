# Seamless textures: limewash wall and postcard paper, built from tileable FFT noise.
import numpy as np
from PIL import Image
A='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-17/designs/77/assets/extras'
rng=np.random.default_rng(77)
def fnoise(n, beta, seed):
    r=np.random.default_rng(seed)
    w=r.normal(size=(n,n))
    F=np.fft.fft2(w)
    fx=np.fft.fftfreq(n)[:,None]; fy=np.fft.fftfreq(n)[None,:]
    f=np.sqrt(fx**2+fy**2); f[0,0]=1
    F=F/(f**beta)
    out=np.real(np.fft.ifft2(F))
    out=(out-out.mean())/out.std()
    return out
N=1024
# limewash: large soft mottles in two tones plus fine trowel grain
m1=fnoise(N,1.6,1); m2=fnoise(N,1.2,2); g=fnoise(N,0.2,3)
base=np.array([232,191,134],np.float32)/255
rose=np.array([214,150,120],np.float32)/255
pale=np.array([246,224,182],np.float32)/255
t1=np.clip(m1*0.35+0.15,0,1)[...,None]
t2=np.clip(m2*0.30-0.05,0,1)[...,None]
img=base*(1-t1*0.6)+rose*(t1*0.6)
img=img*(1-t2*0.7)+pale*(t2*0.7)
img=img+g[...,None]*0.012
Image.fromarray((np.clip(img,0,1)*255).astype(np.uint8)).save(A+'/limewash-1024.webp',quality=80,method=6)
Image.fromarray((np.clip(img,0,1)*255).astype(np.uint8)).save(A+'/limewash-1024.jpg',quality=82)
# paper: cream stock with fibres
p1=fnoise(N,1.0,4); p2=fnoise(N,0.0,5)
cream=np.array([244,233,212],np.float32)/255
pap=cream[None,None,:]+(p1*0.010+p2*0.012)[...,None]
# fibres
y=np.arange(N)
for i in range(260):
    x0,y0=rng.integers(0,N,2); L=rng.integers(8,40); a=rng.uniform(0,np.pi)
    for t in range(L):
        xx=int(x0+np.cos(a)*t)%N; yy=int(y0+np.sin(a)*t)%N
        pap[yy,xx]-=0.035
Image.fromarray((np.clip(pap,0,1)*255).astype(np.uint8)).save(A+'/paper-1024.webp',quality=80,method=6)
print('ok')
