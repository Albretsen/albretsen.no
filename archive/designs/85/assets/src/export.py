import sys, os, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
S=sys.argv[1]; A=sys.argv[2]
def multi(src, dst, widths, jq=82, wq=80, aq=58, formats=('avif','webp','jpg')):
    im=Image.open(src).convert('RGB')
    for w in widths:
        h=round(im.height*w/im.width)
        r=im.resize((w,h),Image.LANCZOS) if w!=im.width else im
        for f in formats:
            p=f'{dst}-{w}.{f}'
            if f=='jpg': r.save(p,quality=jq,optimize=True,progressive=True)
            elif f=='webp': r.save(p,quality=wq,method=6)
            elif f=='avif': r.save(p,quality=aq,speed=4)
            print(p, os.path.getsize(p)//1024,'KB')
H=A+'/hero/'
multi(S+'/out/split-2400.jpg',H+'split',[2400,1600,960])
multi(S+'/out/split-paper-2400.jpg',H+'split-paper',[1600],formats=('webp','jpg'))
multi(S+'/out/split-glass-2400.jpg',H+'split-glass',[1600],formats=('webp','jpg'))
multi(S+'/out/splitp-1000.jpg',H+'split-portrait',[1000,640])
multi(S+'/out/chorus-2400.jpg',H+'chorus',[2400,1600,960])
multi(S+'/out/chorusp-1000.jpg',H+'chorus-portrait',[1000,640])
# tiny LQIP placeholders (base64-able)
for n in ('split','chorus'):
    im=Image.open(S+f'/out/{n}-2400.jpg').convert('RGB').resize((32,18),Image.LANCZOS)
    im.save(H+f'{n}-lqip.webp',quality=50)
P=A+'/products/'
for n in ('mcp-emails','fun-libs','toolrails','harbor','luma'):
    src={'mcp-emails':'p-mcp','fun-libs':'p-funlibs','toolrails':'p-toolrails','harbor':'p-harbor','luma':'p-luma'}[n]
    ws=[1200,600] if n!='luma' else [600]
    multi(S+f'/out/{src}.jpg',P+n,ws,formats=('avif','webp','jpg'))
