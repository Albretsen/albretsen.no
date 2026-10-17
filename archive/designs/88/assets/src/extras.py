import os, math, json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from paper import paper, hx
from svgtext import path, width
T=os.path.dirname(os.path.abspath(__file__))
A='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-28/designs/88/assets/extras'
os.makedirs(A+'/details',exist_ok=True)
CREAM='#F9F2E2'; PAPER='#EDE2CC'; FOREST='#1A4A32'; INK='#173F2B'; NIGHT='#05170F'; BRASS='#C2964D'; BRASSL='#E8CB84'; SIGNAL='#D4407C'; MOSS='#6C9173'

# 1. tileable paper
p=paper(512,512,seed=21,tile=True)
p=np.clip((p-p.mean((0,1)))*2.6+p.mean((0,1)),0,1)  # stronger tooth for a tile
Image.fromarray((p*255).astype(np.uint8)).save(A+'/paper-cream-512.webp',quality=80)
# 2. tileable night plate grain
rng=np.random.default_rng(5)
n=ndimage.gaussian_filter(rng.standard_normal((512,512)).astype(np.float32),0.8,mode='wrap')*0.05
cl=ndimage.gaussian_filter(rng.standard_normal((512,512)).astype(np.float32),30,mode='wrap')*6
base=hx('#07190F')[None,None,:]*(1+n[...,None]+cl[...,None]*0.05)
dust=(rng.random((512,512))>0.9985).astype(np.float32); dust=ndimage.gaussian_filter(dust,0.7,mode='wrap')*2.2
base=base+hx(BRASSL)[None,None,:]*np.clip(dust,0,1)[...,None]
Image.fromarray((np.clip(base,0,1)*255).astype(np.uint8)).save(A+'/plate-night-512.webp',quality=80)

# 3. Dürer details (hidden-detail hover cards), circular loupe crops
du=Image.open(T+'/durer_graded.png').convert('RGB')
crops={'ursa-major':(330,820,650,1140),'cygnus-bird':(800,860,1080,1140),'astronomer-nw':(30,170,370,510),'astronomer-se':(1300,1420,1620,1740),'corona':(700,1040,940,1280)}
for k,(x0,y0,x1,y1) in crops.items():
    c=du.crop((x0,y0,x1,y1)).resize((480,480),Image.LANCZOS)
    c.save(A+f'/details/durer-{k}.webp',quality=80)
# contact sheet for checking
sheet=Image.new('RGB',(480*5,480),'white')
for i,k in enumerate(crops): sheet.paste(Image.open(A+f'/details/durer-{k}.webp'),(i*480,0))
sheet.save(T+'/c9.png')

# 4. sticker/label sprite (symbols)
def chip(id_,label,dot):
    w=width(label,13,'monob',0.08)+46
    return f'''<symbol id="{id_}" viewBox="0 0 {w+4:.0f} 36"><rect x="4" y="4" width="{w:.0f}" height="30" rx="15" fill="{FOREST}"/><rect x="1" y="1" width="{w:.0f}" height="30" rx="15" fill="{CREAM}" stroke="{FOREST}" stroke-width="2"/><circle cx="18" cy="16" r="5" fill="{dot}"/><path d="{path(label,13,30,21,'monob',0.08)}" fill="{FOREST}"/></symbol>'''
def label(id_,code,txt):
    w=max(width(txt,22,'bold'),width(code,10,'monob',0.1))+36
    return f'''<symbol id="{id_}" viewBox="0 0 {w+6:.0f} 70"><rect x="6" y="6" width="{w:.0f}" height="62" rx="6" fill="{FOREST}"/><rect x="1" y="1" width="{w:.0f}" height="62" rx="6" fill="{CREAM}" stroke="{FOREST}" stroke-width="2.5"/><path d="{path(code,10,18,22,'monob',0.1)}" fill="{BRASS}"/><path d="{path(txt,22,18,50,'bold')}" fill="{FOREST}"/></symbol>'''
tape=f'''<symbol id="tape" viewBox="0 0 160 44"><path d="M4 6 L8 2 L12 6 L16 2 L20 6 L24 2 L140 2 L144 6 L148 2 L152 6 L156 2 L156 40 L152 36 L148 40 L144 36 L140 40 L24 40 L20 36 L16 40 L12 36 L8 40 L4 36 Z" fill="{BRASSL}" fill-opacity=".78" stroke="{BRASS}" stroke-width="1"/><path d="M30 12 H130 M30 21 H110 M30 30 H120" stroke="{BRASS}" stroke-opacity=".35" stroke-width="1"/></symbol>'''
arrow=f'''<symbol id="arrow" viewBox="0 0 64 64"><rect x="6" y="6" width="56" height="56" rx="12" fill="{FOREST}"/><rect x="2" y="2" width="56" height="56" rx="12" fill="{BRASSL}" stroke="{FOREST}" stroke-width="2.5"/><path d="M18 30 H42 M32 20 L42 30 L32 40" fill="none" stroke="{FOREST}" stroke-width="4" stroke-linecap="square"/></symbol>'''
def mag(i):
    r=[9,7,5.5,4,3,2][i]
    rays=''
    if i<2:
        for k in range(8):
            a=k*math.pi/4; L=(9 if k%2==0 else 5)*(1 if i==0 else .75)
            rays+=f'<line x1="{20+(r+2)*math.cos(a):.1f}" y1="{20+(r+2)*math.sin(a):.1f}" x2="{20+(r+2+L)*math.cos(a):.1f}" y2="{20+(r+2+L)*math.sin(a):.1f}" stroke="currentColor" stroke-width="1.4"/>'
    return f'<symbol id="mag-{i+1}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="{r}" fill="currentColor"/>{rays}</symbol>'
sprite=f'''<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
{chip('chip-live','LIVE',SIGNAL)}{chip('chip-building','BUILDING',BRASS)}{chip('chip-paused','PAUSED',MOSS)}{chip('chip-retired','RETIRED','#9AA79E')}
{label('label-catalogue','ALB · CATALOGUE','Chart of Works')}{label('label-note','FIELD NOTE','Writing')}
{tape}{arrow}{''.join(mag(i) for i in range(6))}
</svg>
'''
open(A+'/stickers.svg','w').write(sprite)

# 5. fracture divider with tension thread
rng=np.random.default_rng(88)
pts=[(0,40)]; x=0
while x<1600:
    x+=rng.uniform(30,90); pts.append((min(x,1600),40+rng.normal(0,12)))
d='M'+' L'.join(f'{x:.1f},{y:.1f}' for x,y in pts)
up=' L'.join(f'{x:.1f},{y-3:.1f}' for x,y in pts); dn=' L'.join(f'{x:.1f},{y+3:.1f}' for x,y in reversed(pts))
div=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 80" preserveAspectRatio="none" width="1600" height="80" aria-hidden="true">
  <path d="M{up} L{dn} Z" fill="{NIGHT}"/>
  <path d="M120,30 Q800,70 1480,34" fill="none" stroke="{BRASS}" stroke-width="2" stroke-dasharray="0.1 9" stroke-linecap="round"/>
</svg>
'''
open(A+'/fracture-divider.svg','w').write(div)
print('ok')
