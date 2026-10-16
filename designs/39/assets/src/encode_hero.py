import sys, os, numpy as np
from PIL import Image, ImageEnhance
T='/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.N0qADh4ELv/'
A='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_d6e5fca5-3c9-9/designs/39/assets/'

def enc(im, path, q=80, aq=58):
    im.save(path+'.webp', quality=q, method=6)
    im.save(path+'.avif', quality=aq)

for name in ('prism','echo'):
    im=Image.open(T+f'final/{name}-2880.png').convert('RGB')
    enc(im, A+f'hero/{name}@2x')
    enc(im.resize((1440,900),Image.LANCZOS), A+f'hero/{name}')
    # portrait crop for phones (light sits on the right of the landscape frame)
    cx = 2050 if name=='prism' else 1900
    crop=im.crop((cx-700, 0, cx+700, 1800)).resize((1050,1350),Image.LANCZOS)
    enc(crop, A+f'hero/{name}-portrait')

# NASA: Northern Europe at night from the ISS
im=Image.open(T+'nasa/iss066e118171-orig.jpg').convert('RGB')
print(im.size)
# crop a 16:10 frame centred on Scandinavia / Baltic (upper-right of the original)
x0,y0=2600,560; w=2968; h=int(w/1.6)
c=im.crop((x0,y0,x0+w,y0+h))
# grade: pull saturation down except warm lights, lift blacks to the palette grey
arr=np.asarray(c).astype(np.float32)/255
lum=(0.2126*arr[...,0]+0.7152*arr[...,1]+0.0722*arr[...,2])[...,None]
warm=np.clip((arr[...,0]-arr[...,2])*4,0,1)[...,None]
sat=0.25+0.75*warm
arr=lum+(arr-lum)*sat
arr=0.035+arr*0.97
c=Image.fromarray((np.clip(arr,0,1)*255).astype(np.uint8))
c=c.resize((2880,1800),Image.LANCZOS)
c=c.filter(__import__('PIL.ImageFilter',fromlist=['x']).GaussianBlur(0.7)); enc(c, A+'hero/norden-night@2x', q=68, aq=50)
enc(c.resize((1440,900),Image.LANCZOS), A+'hero/norden-night')
c.resize((720,450),Image.LANCZOS).save(T+'try/v_norden.jpg',quality=88)
