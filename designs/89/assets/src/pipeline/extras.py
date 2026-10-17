"""extras.py outdir — procedural texture/ephemera for Prism Room"""
import sys, os, json, numpy as np
sys.path.insert(0, __file__.rsplit('/',1)[0])
from lib import *
from PIL import Image, ImageDraw, ImageFilter
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
hx = lambda h: tuple(int(h[i:i+2],16) for i in (1,3,5))
INK, INK2, PLUM, PAPER = hx('#160c21'), hx('#2a1935'), hx('#572953'), hx('#fff5ea')
SPEC = [hx(c) for c in ['#ff9a7d','#ff99c2','#bea6eb','#86cbf3','#8deaca']]

# 1. Bayer dither ramp tile: ink -> plum, 8x8 matrix, 64x64 tile (render with image-rendering:pixelated)
B = bayer(8)/64.0
tile = np.zeros((64,64,4), np.uint8)
for y in range(64):
    for x in range(64):
        t = x/63
        on = t > B[y%8, x%8]
        c = PLUM if on else INK2
        tile[y,x] = (*c, 255)
Image.fromarray(tile).save(f'{out}/dither-ramp.png', optimize=True)
# 1b. transparent dither 50% tile (overlay)
t2 = np.zeros((8,8,4), np.uint8)
for y in range(8):
    for x in range(8):
        if B[y,x] < .5: t2[y,x] = (*INK, 255)
Image.fromarray(t2).save(f'{out}/dither-50.png', optimize=True)

# 2. grain: tileable 256 monochrome noise with alpha (soft-light overlay)
rng = np.random.default_rng(89)
n = rng.normal(0.5, 0.18, (256,256)).clip(0,1)
g = np.zeros((256,256,4), np.uint8); g[...,:3] = (n*255)[...,None].astype(np.uint8); g[...,3] = 38
Image.fromarray(g).save(f'{out}/grain.png', optimize=True)

# 3. light leak: window-light parallelograms with prism edges, transparent PNG 1600x900
W,H = 1600, 900
m = Image.new('L', (W,H), 0); d = ImageDraw.Draw(m)
def pane(x0,y0,w,h,sk):
    d.polygon([(x0,y0),(x0+w,y0+sk),(x0+w,y0+sk+h),(x0,y0+h)], fill=255)
for i,(x,y) in enumerate([(380,120),(700,220),(380,520),(700,620)]):
    pane(x,y,280,330 if i<2 else 230,120)
m = m.filter(ImageFilter.GaussianBlur(10))
a = np.asarray(m).astype(np.float32)/255
core = np.zeros((H,W,4), np.float32)
core[...,0]=1; core[...,1]=0.86; core[...,2]=0.66; core[...,3]=a*0.85
sh = 14
R = np.roll(a, sh, 1); Bc = np.roll(a, -sh, 1)
fr = np.zeros_like(core)
fr[...,0] = 1.0; fr[...,1] = 0.55; fr[...,2] = 0.75
edge_r = np.clip(R-a,0,1); edge_b = np.clip(Bc-a,0,1)
leak = core.copy()
leak[...,:3] = core[...,:3]*a[...,None] + np.array([1,.6,.7])*edge_r[...,None] + np.array([.55,.8,1])*edge_b[...,None]
leak[...,3] = np.clip(a*0.85 + edge_r*0.7 + edge_b*0.7, 0, 1)
leak[...,:3] = leak[...,:3] / np.maximum(leak[...,3:4],1e-3)
img = Image.fromarray((np.clip(leak,0,1)*255).astype(np.uint8), 'RGBA').filter(ImageFilter.GaussianBlur(3))
img.save(f'{out}/light-leak.png', optimize=True)
img.save(f'{out}/light-leak.webp', quality=80, method=6)

# 4. sparkle sprite sheet: 4 frames x 9px, upscaled 8 => 288x72
frames = [
 ['.........','.........','.........','....#....','...###...','....#....','.........','.........','.........'],
 ['.........','.........','....#....','....#....','..##o##..','....#....','....#....','.........','.........'],
 ['....#....','....#....','.........','....o....','##.ooo.##','....o....','.........','....#....','....#....'],
 ['.........','.#.....#.','.........','.........','....o....','.........','.........','.#.....#.','.........'],
]
sheet = Image.new('RGBA', (9*4, 9), (0,0,0,0)); px = sheet.load()
for f,rows in enumerate(frames):
    for y,r in enumerate(rows):
        for x,c in enumerate(r):
            if c=='#': px[f*9+x,y] = (*PAPER,255)
            if c=='o': px[f*9+x,y] = (*SPEC[0],255)
sheet.resize((288,72), Image.NEAREST).save(f'{out}/sparkle-sheet.png', optimize=True)

# 5. pixel cursors (grab / grabbing) 16x16 -> svg
CUR = {
 'cursor-grab': ['....kk.kk.......','...kppkppk......','...kppkppkkk....','...kppkppkppk...','.kkkppppppppk...','kppkppppppppk...','kppppppppppk....','.kpppppppppk....','..kppppppppk....','...kppppppk.....','....kkkkkk......'],
 'cursor-grabbing': ['................','................','....kkkkkk......','...kppppppkk....','..kpppppppppk...','.kkppppppppppk..','kppppppppppppk..','.kpppppppppppk..','..kppppppppppk..','...kppppppppk...','....kkkkkkkk....'],
}
for name, rows in CUR.items():
    body=''
    for y,r in enumerate(rows):
        for x,c in enumerate(r):
            if c in 'kp': body += f'<rect x="{x}" y="{y}" width="1" height="1" fill="{"#160c21" if c=="k" else "#fff5ea"}"/>'
    open(f'{out}/{name}.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="32" height="32" shape-rendering="crispEdges">{body}</svg>\n')

# 6. pixel chip frame (9-slice, 12x12 grid; use as border-image with slice 4)
rows = ['..kkkkkkkk..','.kppppppppk.','kppppppppppk','kppppppppppk','kppppppppppk','kppppppppppk','kppppppppppk','kppppppppppk','kppppppppppk','kppppppppppk','.kppppppppk.','..kkkkkkkk..']
body=''
for y,r in enumerate(rows):
    for x,c in enumerate(r):
        if c=='k': body+=f'<rect x="{x}" y="{y}" width="1" height="1" fill="#160c21"/>'
        if c=='p': body+=f'<rect x="{x}" y="{y}" width="1" height="1" fill="#fff5ea"/>'
open(f'{out}/chip-frame.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="48" height="48" shape-rendering="crispEdges">{body}</svg>\n')

# 7. spectrum rule: 5-colour pixel divider (svg, stretchable)
segs=''.join(f'<rect x="{i*2}" y="0" width="2" height="1" fill="{c}"/>' for i,c in enumerate(['#ff9a7d','#ff99c2','#bea6eb','#86cbf3','#8deaca']))
open(f'{out}/spectrum-rule.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 1" width="200" height="20" preserveAspectRatio="none" shape-rendering="crispEdges">{segs}</svg>\n')
print('extras done')
