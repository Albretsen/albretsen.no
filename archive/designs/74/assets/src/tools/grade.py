import sys, numpy as np
from PIL import Image
def hx(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)],np.float32)/255
def gmap(l, stops):
    xs=[s[0] for s in stops]; out=np.zeros(l.shape+(3,),np.float32)
    for c in range(3): out[...,c]=np.interp(l,xs,[hx(s[1])[c] for s in stops])
    return out
MAPS={
 'afterglow':[(0,'#2a2040'),(0.25,'#54457a'),(0.42,'#8d74ad'),(0.55,'#c78ea8'),(0.66,'#eb9f92'),(0.8,'#f6c08a'),(0.92,'#ffe1a6'),(1,'#fff6e0')],
 'day':[(0,'#1d4e78'),(0.35,'#2f74a8'),(0.6,'#77aed3'),(0.8,'#cfe2ee'),(0.92,'#fff4dc'),(1,'#fffaf0')],
 'dusk':[(0,'#33284d'),(0.4,'#7d6aa6'),(0.62,'#b9a0cc'),(0.8,'#efb7b0'),(0.92,'#ffd7a6'),(1,'#fff3dc')],
}
src,out,mode,amt,gamma=sys.argv[1],sys.argv[2],sys.argv[3],float(sys.argv[4]),float(sys.argv[5])
a=np.asarray(Image.open(src).convert('RGB')).astype(np.float32)/255
l=(a*[0.299,0.587,0.114]).sum(2)
lo,hi=np.percentile(l,1),np.percentile(l,99.7)
ln=np.clip((l-lo)/(hi-lo),0,1)**gamma
g=gmap(ln,MAPS[mode])
res=a*(1-amt)+g*amt
m=res.mean(2,keepdims=True); res=m+(res-m)*1.15
res=np.clip(res,0,1)
Image.fromarray((res*255).astype(np.uint8)).save(out,quality=95)
