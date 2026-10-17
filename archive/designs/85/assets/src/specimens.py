import sys, json, numpy as np
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, sys.argv[1]+'/py')
from common import *
from glassify import glassify, make_paper, smooth
S=sys.argv[1]; OUT=sys.argv[2]; src=sys.argv[3]; prefix=sys.argv[4]; n=int(sys.argv[5])
im=load_gray(S+'/dl/'+src,0.03)
w,h=im.size; s0=1100/w
sm=np.asarray(im.resize((1100,int(h*s0)),Image.LANCZOS),dtype=np.float32)/255
a0=smooth(0.10,0.80,sm)
m=ndi.binary_fill_holes(ndi.gaussian_filter(a0,2.5)>0.22)
m=ndi.binary_opening(m,iterations=2)
lab,k=ndi.label(m)
objs=ndi.find_objects(lab)
areas=ndi.sum(m,lab,range(1,k+1))
order=np.argsort(-areas)
full=np.asarray(im,dtype=np.float32)/255
meta=[]; c=0
for idx in order:
    if c>=n: break
    sl=objs[idx]; y0,y1=sl[0].start,sl[0].stop; x0,x1=sl[1].start,sl[1].stop
    if y0<3 or x0<3 or y1>m.shape[0]-3 or x1>m.shape[1]-3: continue  # touches border: cut
    bw,bh=x1-x0,y1-y0
    if max(bw,bh)/min(bw,bh)>2.6: continue
    pad=10
    X0,Y0,X1,Y1=[int(v/s0) for v in (x0-pad,y0-pad,x1+pad,y1+pad)]
    crop=full[max(0,Y0):Y1,max(0,X0):X1]
    cm=(lab[max(0,y0-pad):y1+pad,max(0,x0-pad):x1+pad]==idx+1).astype(np.uint8)*255
    T=520; sc=T/max(crop.shape)
    cw,ch=int(crop.shape[1]*sc),int(crop.shape[0]*sc)
    cr=np.asarray(Image.fromarray((crop*255).astype(np.uint8)).resize((cw,ch),Image.LANCZOS),dtype=np.float32)/255
    mm=np.asarray(Image.fromarray(cm).resize((cw,ch),Image.BILINEAR),dtype=np.float32)/255>0.5
    mm=ndi.binary_erosion(mm,iterations=2)
    a=smooth(0.10,0.80,cr)*mm
    # pad canvas
    P_=24; H,W=ch+2*P_,cw+2*P_
    A=np.zeros((H,W),np.float32); A[P_:-P_,P_:-P_]=a
    M=np.zeros((H,W),bool); M[P_:-P_,P_:-P_]=mm
    P=make_paper(H,W,0.5,grid=False,seed=c+7)
    g,mf=glassify(A,P,sc=0.55,mask=M,R=24,D=95,detail=0.42)
    alpha=np.clip(ndi.gaussian_filter(M.astype(np.float32),0.8),0,1)
    rgb=(lin2srgb(g)*255+0.5).astype(np.uint8)
    rgba=np.dstack([rgb,(alpha*255).astype(np.uint8)])
    name=f'{prefix}-{c+1:02d}'
    Image.fromarray(rgba).save(f'{OUT}/{name}-glass.webp',quality=86,method=6)
    inkrgb=np.zeros((H,W,3),np.uint8); inkrgb[...]=(9,23,16)
    ia=np.clip(A*1.0,0,1)
    Image.fromarray(np.dstack([inkrgb,(ia*255).astype(np.uint8)])).save(f'{OUT}/{name}-ink.webp',quality=90,method=6)
    # radius for physics: equivalent circle
    meta.append({'id':name,'w':W,'h':H,'r':float(np.sqrt(M.sum()/np.pi))})
    c+=1
json.dump(meta,open(f'{OUT}/{prefix}.json','w'),indent=1)
print(meta)
