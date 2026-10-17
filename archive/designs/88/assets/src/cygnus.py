import numpy as np, json, os
from PIL import Image, ImageFilter
from scipy import ndimage
T=os.path.dirname(os.path.abspath(__file__))
OUT='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-28/designs/88/assets/hero'
im=Image.open(T+'/dl/cygnus.jpg').convert('RGB')
a=np.asarray(im).astype(np.float32)/255
lum=a.mean(2)
# find plate bounds: rows/cols where mean lum is dark
rows=np.where(lum.mean(1)<0.25)[0]; cols=np.where(lum.mean(0)<0.25)[0]
y0,y1=rows[0]+40,rows[-1]-150; x0,x1=cols[0]+40,cols[-1]-110
print('plate',x0,y0,x1,y1)
a=a[y0:y1,x0:x1]; lum=lum[y0:y1,x0:x1]
H,W=lum.shape
# background estimate & normalise
bg=ndimage.median_filter(lum[::8,::8],size=9)
bg=np.asarray(Image.fromarray((bg*255).astype(np.uint8)).resize((W,H),Image.BILINEAR)).astype(np.float32)/255
sig=np.clip((lum-bg)/(1-bg+1e-3),0,1)
# stars catalogue (real 1885 positions)
lab,n=ndimage.label(sig>0.35)
objs=ndimage.find_objects(lab)
sums=ndimage.sum(sig,lab,range(1,n+1))
coms=ndimage.center_of_mass(sig,lab,range(1,n+1))
stars=[]
for (cy,cx),s in zip(coms,sums):
    if s<3: continue
    stars.append([round(cx/W,5),round(cy/H,5),round(float(s),1)])
stars.sort(key=lambda s:-s[2])
print('stars',len(stars))
json.dump({'source':'The Met 283255, A Section of the Constellation Cygnus (August 13, 1885), CC0','aspect':round(W/H,5),'stars':stars[:3000]},open(OUT+'/../interactive/cygnus-1885-stars.json','w'),separators=(',',':'))

# grade
def hx(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)],np.float32)/255
night=hx('#06170F'); deep=hx('#0F3322'); brass=hx('#D9B26A'); cream=hx('#FBF4E4')
# soft background: keep paper/plate texture as subtle variation
tex=np.clip((bg-bg.mean())*3+0.5,0,1)
yy,xx=np.mgrid[0:H,0:W]
# gentle radial glow centred upper-left-ish like galactic band glow
g=np.exp(-(((xx/W-0.42)**2)/0.10+((yy/H-0.40)**2)/0.22))
base=night[None,None,:]*(1-0.75*g[...,None])+deep[None,None,:]*(0.75*g[...,None])
base=base*(0.92+0.16*tex[...,None])
# grain
rng=np.random.default_rng(7)
grain=ndimage.gaussian_filter(rng.standard_normal((H,W)).astype(np.float32),0.7)*0.012
base=base+grain[...,None]
s=sig**0.9
ids=np.arange(1,n+1); bigids=ids[sums>np.percentile(sums,99.3)]
big=np.isin(lab,bigids)*sig
bloom=ndimage.gaussian_filter(s,3)*1.2+ndimage.gaussian_filter(big,14)*6+ndimage.gaussian_filter(big,48)*14
starcol=brass[None,None,:]*(1-s[...,None])+cream[None,None,:]*s[...,None]
out=base*(1-np.clip(s,0,1)[...,None])+starcol*np.clip(s*1.25,0,1)[...,None]
out=out+brass[None,None,:]*np.clip(bloom,0,0.7)[...,None]*0.5
# vignette
v=1-0.35*(((xx/W-0.5)**2+(yy/H-0.5)**2)*2.2)
out=np.clip(out*v[...,None],0,1)
img=Image.fromarray((out*255).astype(np.uint8))
img.save(T+'/cygnus_graded.png')
print(img.size)
