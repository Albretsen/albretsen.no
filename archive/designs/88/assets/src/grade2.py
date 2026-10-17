import numpy as np, os
from PIL import Image
from scipy import ndimage
T=os.path.dirname(os.path.abspath(__file__))
def hx(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)],np.float32)/255

# --- Dürer: forest ink on cream, brass in mid-tones
im=Image.open(T+'/dl/durer_n.jpg').convert('L')
a=np.asarray(im).astype(np.float32)/255
lo,hi=np.percentile(a,1),np.percentile(a,90)
t=np.clip((a-lo)/(hi-lo),0,1)
ink=hx('#123826'); cream=hx('#F6EDD9'); brass=hx('#B98E45')
H,W=a.shape
rng=np.random.default_rng(3)
fib=ndimage.gaussian_filter(rng.standard_normal((H,W)).astype(np.float32),(1.2,6))*0.03
paper=cream[None,None,:]+fib[...,None]
mid=np.exp(-((t-0.55)**2)/0.03)[...,None]*0.18
out=ink[None,None,:]*(1-t[...,None])+paper*t[...,None]
out=out*(1-mid)+brass[None,None,:]*mid
Image.fromarray((np.clip(out,0,1)*255).astype(np.uint8)).save(T+'/durer_graded.png')

# --- Moon daguerreotype: lift blacks to forest night, keep brass mat
im=Image.open(T+'/dl/moon.jpg').convert('RGB')
a=np.asarray(im).astype(np.float32)/255
L=a.mean(2,keepdims=True)
night=hx('#071C13')
w=np.clip(1-L*3.2,0,1)  # weight for darkest areas
a=L+(a-L)*0.78
out=a*(1-w*0.85)+night[None,None,:]*w*0.85
out=np.clip(out,0,1)
Image.fromarray((out*255).astype(np.uint8)).save(T+'/moon_graded.png')
print('ok')
