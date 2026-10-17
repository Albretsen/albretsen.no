"""Hero III: 'Chart of Works' — an engraved star chart on cream stock, fractured into three
shards over a forest-night ground, with the four live products drawn as brass constellations
whose tension threads cross the cracks. Output: SVG (with embedded paper) -> PNG via rsvg."""
import math, os, base64, json, subprocess, sys
import numpy as np
from svgtext import path, width
from paper import paper
from PIL import Image
T=os.path.dirname(os.path.abspath(__file__))
REPO='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-28'
PROD=REPO+'/designs/_shared/products'
W,H=2400,1350
CREAM='#F9F2E2'; FOREST='#1A4A32'; INK='#173F2B'; NIGHT='#05170F'; BRASS='#B8893F'; BRASSL='#E8CB84'; SIGNAL='#D4407C'
rng=np.random.default_rng(int('2db2cb',16)%100000)

def b64(p,mime):
    return f'data:{mime};base64,'+base64.b64encode(open(p,'rb').read()).decode()
# paper
pp=T+'/paper_chart.jpg'
if not os.path.exists(pp):
    Image.fromarray((paper(W,H,seed=11)*255).astype(np.uint8)).save(pp,quality=90)
PAPER=b64(pp,'image/jpeg')

CX,CY,R=1530,690,1010
def polar(ra_h,dec):  # north polar stereographic-ish: dec 90 at centre, dec -30 at R
    r=R*(90-dec)/120.0
    a=math.radians(ra_h*15-90)
    return CX+r*math.cos(a), CY+r*math.sin(a)

g=[]  # chart ink layer
# graticule
for dec in range(80,-31,-10):
    r=R*(90-dec)/120
    sw=1.6 if dec in(0,) else 0.9
    dash='' if dec%30==0 else ' stroke-dasharray="2 5"'
    g.append(f'<circle cx="{CX}" cy="{CY}" r="{r:.1f}" fill="none" stroke="{INK}" stroke-opacity=".55" stroke-width="{sw}"{dash}/>')
for h in range(24):
    x1,y1=polar(h,80); x2,y2=polar(h,-30)
    g.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{INK}" stroke-opacity=".38" stroke-width=".8"/>')
# ecliptic-like curve (an offset circle) as the 'flow' band guide
ex,ey,er=CX+170,CY+110,R*0.62
g.append(f'<circle cx="{ex}" cy="{ey}" r="{er:.1f}" fill="none" stroke="{BRASS}" stroke-width="1.4" stroke-dasharray="10 4 2 4" opacity=".8"/>')
# outer scale ring at dec 20
for dec,lab in [(60,'+60'),(30,'+30'),(0,'0')]:
    x,y=polar(3.5,dec)
    g.append(f'<path d="{path(lab+"°",15,x+6,y-6,"mono")}" fill="{INK}" opacity=".7"/>')
rr=R*(90-20)/120
for i in range(360):
    a=math.radians(i-90); L=14 if i%15==0 else (8 if i%5==0 else 4)
    x1,y1=CX+rr*math.cos(a),CY+rr*math.sin(a); x2,y2=CX+(rr+L)*math.cos(a),CY+(rr+L)*math.sin(a)
    g.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{INK}" stroke-width="{1.2 if i%15==0 else .7}"/>')
    if i%15==0:
        h=i//15; tx,ty=CX+(rr+34)*math.cos(a),CY+(rr+34)*math.sin(a)
        g.append(f'<path d="{path(f"{h:02d}h",16,tx,ty+6,"mono",anchor="middle")}" fill="{INK}"/>')
# stars: field + flow band
stars=[]
for i in range(2300):
    if rng.random()<0.42:  # band
        t=rng.random()*2*math.pi; d=rng.normal(0,46)
        x=ex+(er+d)*math.cos(t); y=ey+(er+d)*math.sin(t)
    else:
        x=rng.uniform(-60,W+60); y=rng.uniform(-60,H+60)
    m=rng.power(0.35)  # many faint
    stars.append((x,y,m))
for x,y,m in stars:
    r=0.7+m*2.2
    g.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.2f}" fill="{INK}"/>')
def engraved(x,y,r,col=INK,rays=8):
    s=[f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r+3:.1f}" fill="{CREAM}"/>',f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{col}"/>']
    for k in range(rays):
        a=k*math.pi*2/rays; L=r*(2.6 if k%2==0 else 1.8)
        s.append(f'<line x1="{x+(r+2)*math.cos(a):.1f}" y1="{y+(r+2)*math.sin(a):.1f}" x2="{x+(r+2+L)*math.cos(a):.1f}" y2="{y+(r+2+L)*math.sin(a):.1f}" stroke="{col}" stroke-width="1.3"/>')
    return s
for i in range(26):
    x=rng.uniform(80,W-80); y=rng.uniform(60,H-60)
    g+=engraved(x,y,rng.uniform(3,5.5))

# product constellations (brass), shapes traced from the real logos' geometry
def P(pts,ox,oy,s): return [(ox+x*s,oy+y*s) for x,y in pts]
consts={
 'mcp-emails':{'pts':P([(4,11),(44,11),(44,39),(4,39),(24,27),(39,6)],1130,250,5.2),'lines':[(0,1),(1,2),(2,3),(3,0),(0,4),(4,1)],'hero':5},
 'toolrails':{'pts':P([(6,12.5),(21.5,12.5),(6,19.5),(21.5,19.5),(16.5,7.5),(25,16),(16.5,24.5)],1880,260,10),'lines':[(0,1),(2,3),(4,5),(5,6)],'hero':5},
 'harbor':{'pts':P([(12,26),(24,14),(28.5,14),(32,19.5),(35.5,14),(40,14),(52,26),(52,40),(40,52),(24,52),(12,40),(32,35)],1060,760,5.6),'lines':[(0,1),(1,2),(2,3),(3,4),(4,5),(5,6),(6,7),(7,8),(8,9),(9,10),(10,0)],'hero':11},
 'fun-libs':{'pts':P([(290,414),(512,414),(734,414),(290,609),(533,609)],1560,640,0.5),'lines':[(0,1),(1,2),(3,4)],'hero':2},
}
cl=[]
for k,c in consts.items():
    for a,b in c['lines']:
        (x1,y1),(x2,y2)=c['pts'][a],c['pts'][b]
        cl.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{BRASS}" stroke-width="3"/>')
    for i,(x,y) in enumerate(c['pts']):
        if i==c['hero']:
            cl+=engraved(x,y,6.5,col=FOREST)
        else:
            cl.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="9" fill="{CREAM}"/><circle cx="{x:.1f}" cy="{y:.1f}" r="5.2" fill="{FOREST}"/>')
g+=cl

# stickers (labels) with real logos
logos={
 'mcp-emails':(PROD+'/mcp-emails/logo-mark.svg','image/svg+xml'),
 'toolrails':(PROD+'/toolrails/icon.svg','image/svg+xml'),
 'harbor':(PROD+'/harbor/harbor-mark.svg','image/svg+xml'),
 'fun-libs':(PROD+'/fun-libs/icon.png','image/png'),
}
meta={'mcp-emails':('ALB-01','MCP Emails','LIVE · $782 MRR',SIGNAL),'toolrails':('ALB-03','Toolrails','BUILDING · 4 CONNECTORS',BRASS),
      'harbor':('ALB-04','Harbor','PAUSED · 549 COMMITS',INK),'fun-libs':('ALB-02','Fun Libs','LIVE · 113,000+ INSTALLS',SIGNAL)}
anchor={'mcp-emails':(1380,170,-2.5),'toolrails':(1940,520,2),'harbor':(780,1010,-1.5),'fun-libs':(1640,1010,1.8)}
def sticker(k):
    code,name,sub,dot=meta[k]; x,y,rot=anchor[k]
    nw=width(name,30,'bold'); sw=width(sub,12,'mono',0.04)
    w=max(nw+86,sw+86)+20; h=92
    href,mime=logos[k]
    if k=='harbor':
        svgsrc=open(href).read().replace('currentColor',FOREST)
        logo='data:image/svg+xml;base64,'+base64.b64encode(svgsrc.encode()).decode()
    else: logo=b64(href,mime)
    s=f'''<g transform="translate({x},{y}) rotate({rot})">
  <rect x="7" y="7" width="{w:.0f}" height="{h}" rx="10" fill="{FOREST}"/>
  <rect x="0" y="0" width="{w:.0f}" height="{h}" rx="10" fill="{CREAM}" stroke="{FOREST}" stroke-width="3"/>
  <rect x="14" y="16" width="60" height="60" rx="8" fill="#fff" stroke="{FOREST}" stroke-width="2"/>
  <image href="{logo}" x="20" y="22" width="48" height="48"/>
  <path d="{path(code,11,88,30,'monob',0.08)}" fill="{BRASS}"/>
  <path d="{path(name,30,88,62,'bold')}" fill="{FOREST}"/>
  <circle cx="94" cy="76" r="4" fill="{dot}"/>
  <path d="{path(sub,11,104,80,'mono',0.04)}" fill="{INK}"/>
</g>'''
    return s
stk=[sticker(k) for k in consts]

# tension threads (cross the fractures)
def thread(a,b,sag=40):
    (x1,y1),(x2,y2)=a,b; mx,my=(x1+x2)/2,(y1+y2)/2+sag
    return f'<path d="M{x1:.1f},{y1:.1f} Q{mx:.1f},{my:.1f} {x2:.1f},{y2:.1f}" fill="none" stroke="{BRASS}" stroke-width="2.4" stroke-dasharray="0.1 8" stroke-linecap="round"/>'
threads=[thread(consts['mcp-emails']['pts'][5],consts['toolrails']['pts'][4],-30),
         thread(consts['mcp-emails']['pts'][4],consts['harbor']['pts'][3],20),
         thread(consts['harbor']['pts'][7],consts['fun-libs']['pts'][3],30),
         thread(consts['toolrails']['pts'][6],consts['fun-libs']['pts'][2],-20)]

# cartouche bottom-left (calm side)
cart=f'''<g transform="translate(96,1130)">
  <rect x="6" y="6" width="560" height="128" rx="6" fill="{FOREST}"/>
  <rect x="0" y="0" width="560" height="128" rx="6" fill="{CREAM}" stroke="{FOREST}" stroke-width="2.5"/>
  <path d="{path('SHEET 01 / 04',12,24,34,'monob',0.1)}" fill="{BRASS}"/>
  <path d="{path('Chart of Works',36,24,80,'display')}" fill="{FOREST}"/>
  <path d="{path('ALBRETSEN AS · EPOCH 2016–2026 · DRAWN BY HAND IN CODE',11,24,108,'mono',0.04)}" fill="{INK}"/>
</g>'''

# fracture shards (jagged split lines across the sheet)
def jag(x0,x1,seed):
    r=np.random.default_rng(seed); pts=[]
    for i in range(14):
        y=-40+i*(H+80)/13; x=x0+(x1-x0)*i/13+r.normal(0,16)
        pts.append((x,y))
    return pts
f1=jag(900,1010,4); f2=jag(1780,1700,9)
def poly(pts): return 'M'+' L'.join(f'{x:.1f},{y:.1f}' for x,y in pts)+'Z'
s1=[(-50,-50)]+f1+[(-50,H+50)]
s2=f1+list(reversed(f2))
s3=f2+[(W+50,H+50),(W+50,-50)]
shards=[(s1,'translate(0,0)'),(s2,'translate(22,-3)'),(s3,'translate(50,4)')]

ground=[f'<rect width="{W}" height="{H}" fill="#0B2E1E"/>']
for i in range(500):
    x=rng.uniform(0,W); y=rng.uniform(0,H)
    ground.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rng.uniform(.4,1.6):.2f}" fill="{BRASSL}" opacity="{rng.uniform(.3,.9):.2f}"/>')

body=[]
defs=[]
for i,(pts,tf) in enumerate(shards):
    defs.append(f'<clipPath id="s{i}"><path d="{poly(pts)}"/></clipPath>')
for i,(pts,tf) in enumerate(shards):
    body.append(f'''<g transform="{tf}">
  <path d="{poly(pts)}" transform="translate(6,8)" fill="#000" opacity=".45"/>
  <g clip-path="url(#s{i})">
    <image href="{PAPER}" x="-60" y="-60" width="{W+120}" height="{H+120}" preserveAspectRatio="none"/>
    <use href="#ink"/>
  </g>
  <path d="{poly(pts)}" fill="none" stroke="{CREAM}" stroke-width="2"/>
</g>''')
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<defs>{''.join(defs)}<g id="ink">{''.join(g)}</g></defs>
{''.join(ground)}
{''.join(body)}
{''.join(threads)}
{''.join(stk)}
{cart}
</svg>'''
open(T+'/chart.svg','w').write(svg)
subprocess.run(['rsvg-convert',T+'/chart.svg','-o',T+'/chart.png'],check=True)
json.dump({k:{'points':[[round(x/W,4),round(y/H,4)] for x,y in c['pts']],'lines':c['lines'],'hero':c['hero']} for k,c in consts.items()},open(T+'/consts.json','w'))
print('ok')
