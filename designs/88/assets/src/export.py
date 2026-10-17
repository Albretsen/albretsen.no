import os, json
from PIL import Image
T=os.path.dirname(os.path.abspath(__file__))
A='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-28/designs/88/assets'
Image.MAX_IMAGE_PIXELS=None
manifest={}
def save(im,name,widths,q=(55,74,80)):
    out=[]
    for w in widths:
        h=round(im.height*w/im.width)
        r=im.resize((w,h),Image.LANCZOS)
        base=f'{A}/hero/{name}-{w}'
        r.save(base+'.avif',quality=q[0],speed=4)
        r.save(base+'.webp',quality=q[1],method=6)
        exts=['avif','webp']
        if w==min(widths):
            r.convert('RGB').save(base+'.jpg',quality=q[2],optimize=True,progressive=True); exts.append('jpg')
        out.append({'w':w,'h':h,'formats':exts,'kb':{e:round(os.path.getsize(base+'.'+e)/1024) for e in exts}})
    manifest[name]=out
cy=Image.open(T+'/cygnus_graded.png').convert('RGB')
W,H=cy.size
# wide 16:9 crop around the bright stars band
ch=round(W*9/16); y0=round(H*0.29)
save(cy.crop((0,y0,W,y0+ch)),'cygnus-plate-wide',[2400,1600,960])
# tall 4:5 for mobile
th=H-20; tw=round(th*4/5); tx=(W-tw)//2; ty=10
save(cy.crop((tx,ty,tx+tw,ty+th)),'cygnus-plate-tall',[1200,750])
ch2=Image.open(T+'/chart.png').convert('RGB')
save(ch2,'chart-of-works',[2400,1600,960])
du=Image.open(T+'/durer_graded.png').convert('RGB')
save(du,'durer-forest',[1400,800])
mo=Image.open(T+'/moon_graded.png').convert('RGB')
save(mo,'moon-run-plate',[1100,640])
# moon crop: the plate interior, landscape
mw,mh=mo.size
save(mo.crop((round(mw*0.17),round(mh*0.15),round(mw*0.84),round(mh*0.15)+round(mw*0.67*10/16))),'moon-run-wide',[1600,960])
json.dump(manifest,open(A+'/hero/sizes.json','w'),indent=1)
print(json.dumps(manifest,indent=0))
