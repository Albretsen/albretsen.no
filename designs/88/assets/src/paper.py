import numpy as np, os, sys
from PIL import Image
from scipy import ndimage
T=os.path.dirname(os.path.abspath(__file__))
def hx(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)],np.float32)/255
def paper(W,H,seed=1,base='#F6EDD9',tile=False):
    rng=np.random.default_rng(seed)
    n=lambda s,sig: ndimage.gaussian_filter(rng.standard_normal((H,W)).astype(np.float32),sig,mode='wrap' if tile else 'reflect')
    fib=n(0,(0.8,3.5))*0.6+n(0,(3.5,0.8))*0.4
    cloud=n(0,40)*18+n(0,12)*4
    speck=(rng.random((H,W))>0.9993).astype(np.float32)
    speck=ndimage.gaussian_filter(speck,0.8)*3
    v=fib*0.018+cloud*0.012-speck*0.25
    col=hx(base)[None,None,:]*(1+v[...,None])
    # warm tint in clouds
    col=col+np.array([0.006,0.002,-0.008])[None,None,:]*cloud[...,None]*0.4
    return np.clip(col,0,1)
if __name__=='__main__':
    W,H=int(sys.argv[2]),int(sys.argv[3])
    a=paper(W,H,tile=len(sys.argv)>4)
    Image.fromarray((a*255).astype(np.uint8)).save(sys.argv[1],quality=88)
