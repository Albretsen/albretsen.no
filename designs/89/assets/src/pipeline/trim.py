import sys,os,json
from PIL import Image
src,prod_dir,spr_dir=sys.argv[1:4]
PRODUCTS={'mcp-emails','toolrails','fun-libs','harbor','luma'}
meta={}
for f in sorted(os.listdir(src)):
    if not f.endswith('.png'): continue
    n=f[:-4]; im=Image.open(os.path.join(src,f)).convert('RGBA'); im=im.crop(im.getbbox())
    d=prod_dir if n in PRODUCTS else spr_dir
    name=('sprite-'+n) if n in PRODUCTS else n
    p=os.path.join(d,name+'.png'); im.save(p,optimize=True)
    meta[name]={'w':im.size[0],'h':im.size[1],'pixel':6}
    print(p,im.size,os.path.getsize(p)//1024,'K')
json.dump(meta,open(os.path.join(spr_dir,'sprites.json'),'w'),indent=1)
