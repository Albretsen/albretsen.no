"""Product visuals: each live/building product as a die-cut sticker pressed onto a crop of the
graded 1885 Cygnus plate, its constellation (traced from the real logo geometry) above it.
Retired products: small round catalogue badges."""
import os, base64, subprocess, math, io
import numpy as np
from PIL import Image
from svgtext import path, width
T=os.path.dirname(os.path.abspath(__file__))
REPO='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-28'
PROD=REPO+'/designs/_shared/products'
A=REPO+'/designs/88/assets'
CREAM='#F9F2E2'; PAPER='#EDE2CC'; FOREST='#1A4A32'; INK='#173F2B'; NIGHT='#05170F'; BRASS='#C2964D'; BRASSL='#E8CB84'; SIGNAL='#D4407C'
def b64file(p):
    mime='image/svg+xml' if p.endswith('.svg') else 'image/png'
    return f'data:{mime};base64,'+base64.b64encode(open(p,'rb').read()).decode()
def b64img(im,q=82):
    bio=io.BytesIO(); im.save(bio,'JPEG',quality=q); return 'data:image/jpeg;base64,'+base64.b64encode(bio.getvalue()).decode()

cy=Image.open(T+'/cygnus_graded.png').convert('RGB')
CW,CH=cy.size
W,H=1000,1250
P=[
 dict(id='mcp-emails',code='ALB-01',name='MCP Emails',line='Email for AI agents.',status='LIVE',since='2026',fig=('$782','MRR'),
      logo=PROD+'/mcp-emails/logo-mark.svg',crop=(0.05,0.05),
      pts=[(4,11),(44,11),(44,39),(4,39),(24,27),(39,6)],lines=[(0,1),(1,2),(2,3),(3,0),(0,4),(4,1)],hero=5,facts=['17 TOOLS','~100 PROVIDERS','AGPL']),
 dict(id='fun-libs',code='ALB-02',name='Fun Libs',line='A fill-in-the-blanks word game.',status='LIVE',since='2019',fig=('113,000+','INSTALLS'),
      logo=PROD+'/fun-libs/icon.png',crop=(0.45,0.30),
      pts=[(290,414),(512,414),(734,414),(290,609),(533,609)],lines=[(0,1),(1,2),(3,4)],hero=2,facts=['BUILT AT 17','NO MARKETING','V5 · 2026']),
 dict(id='toolrails',code='ALB-03',name='Toolrails',line='One MCP URL, every tool.',status='BUILDING',since='2026',fig=('4','CONNECTORS'),
      logo=PROD+'/toolrails/icon.svg',crop=(0.10,0.55),
      pts=[(6,12.5),(21.5,12.5),(6,19.5),(21.5,19.5),(16.5,7.5),(25,16),(16.5,24.5)],lines=[(0,1),(2,3),(4,5),(5,6)],hero=5,facts=['TOOL SEARCH','INJECTION GUARD']),
 dict(id='harbor',code='ALB-04',name='Harbor',line='Knowledge shared by people and AI.',status='PAUSED',since='2026',fig=('549','COMMITS'),
      logo=PROD+'/harbor/harbor-mark.svg',crop=(0.40,0.62),
      pts=[(12,26),(24,14),(28.5,14),(32,19.5),(35.5,14),(40,14),(52,26),(52,40),(40,52),(24,52),(12,40),(32,35)],lines=[(i,(i+1)%11) for i in range(11)],hero=11,facts=['SELF-HOSTABLE','AI EDITS HELD']),
]
statuscol={'LIVE':SIGNAL,'BUILDING':BRASS,'PAUSED':'#6C9173'}
def star4(cx,cy,r,inner=0.22):
    pts=[]
    for i in range(8):
        a=-math.pi/2+i*math.pi/4; rr=r if i%2==0 else r*inner
        pts.append(f"{cx+rr*math.cos(a):.1f},{cy+rr*math.sin(a):.1f}")
    return "M"+" L".join(pts)+"Z"

for p in P:
    # background crop of the plate
    cw=int(CW*0.5); chh=int(cw*H/W)
    x0=int(CW*p['crop'][0]); y0=int(CH*p['crop'][1]); x0=min(x0,CW-cw); y0=min(y0,CH-chh)
    bg=cy.crop((x0,y0,x0+cw,y0+chh)).resize((W,H),Image.LANCZOS)
    bgd=b64img(bg,80)
    # constellation in upper area box (120..880, 80..560)
    xs=[x for x,y in p['pts']]; ys=[y for x,y in p['pts']]
    mnx,mxx,mny,mxy=min(xs),max(xs),min(ys),max(ys)
    s=min(620/(mxx-mnx),380/(mxy-mny))
    ox=W/2-(mnx+mxx)/2*s; oy=330-(mny+mxy)/2*s
    pts=[(ox+x*s,oy+y*s) for x,y in p['pts']]
    cons=[]
    for a,b in p['lines']:
        (x1,y1),(x2,y2)=pts[a],pts[b]
        cons.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{BRASSL}" stroke-width="2.2" stroke-opacity=".85"/>')
    for i,(x,y) in enumerate(pts):
        if i==p['hero']:
            cons.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="38" fill="url(#glow)"/><path d="{star4(x,y,26)}" fill="{CREAM}"/>')
        else:
            cons.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="20" fill="url(#glow)" opacity=".7"/><circle cx="{x:.1f}" cy="{y:.1f}" r="12" fill="{NIGHT}"/><circle cx="{x:.1f}" cy="{y:.1f}" r="6.5" fill="{CREAM}"/>')
    # catalogue tick label near hero star
    hx_,hy_=pts[p['hero']]
    cons.append(f'<path d="{path(p["code"]+" · α",15,hx_+34,hy_-22,"mono",0.06)}" fill="{BRASSL}"/>')
    # sticker
    sx,sy,sw,sh=150,660,700,470
    logo=b64file(p['logo'])
    if p['id']=='harbor':
        logo='data:image/svg+xml;base64,'+base64.b64encode(open(p['logo']).read().replace('currentColor',FOREST).encode()).decode()
    name=p['name']; nsz=64
    while width(name,nsz,'bold')>sw-210: nsz-=2
    facts='  ·  '.join(p['facts'])
    sc=statuscol[p['status']]
    stw=width(p['status'],15,'monob',0.08)+44
    fold=70
    sticker=f'''<g transform="rotate(-2.4 500 900)">
  <path d="M{sx+12},{sy+16} h{sw} v{sh-fold} l-{fold},{fold} h-{sw-fold} z" fill="#000" opacity=".5"/>
  <path d="M{sx},{sy} h{sw} v{sh-fold} l-{fold},{fold} h-{sw-fold} z" fill="{CREAM}" stroke="{FOREST}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M{sx+sw},{sy+sh-fold} l-{fold},{fold} l{8},-{fold-8} z" fill="{PAPER}" stroke="{FOREST}" stroke-width="4" stroke-linejoin="round"/>
  <rect x="{sx+36}" y="{sy+40}" width="132" height="132" rx="20" fill="#fff" stroke="{FOREST}" stroke-width="4"/>
  <image href="{logo}" x="{sx+48}" y="{sy+52}" width="108" height="108"/>
  <path d="{path(p['code']+'  /  EST. '+p['since'],15,sx+196,sy+70,'monob',0.08)}" fill="{BRASS}"/>
  <path d="{path(name,nsz,sx+194,sy+70+nsz+6,'bold')}" fill="{FOREST}"/>
  <path d="{path(p['line'],28,sx+38,sy+236,'serif')}" fill="{INK}"/>
  <line x1="{sx+36}" y1="{sy+268}" x2="{sx+sw-36}" y2="{sy+268}" stroke="{FOREST}" stroke-width="2" stroke-dasharray="2 6"/>
  <path d="{path(facts,13,sx+38,sy+302,'mono',0.06)}" fill="{INK}"/>
  <rect x="{sx+36+4}" y="{sy+336+4}" width="{stw:.0f}" height="40" rx="20" fill="{FOREST}"/>
  <rect x="{sx+36}" y="{sy+336}" width="{stw:.0f}" height="40" rx="20" fill="{CREAM}" stroke="{FOREST}" stroke-width="3"/>
  <circle cx="{sx+56}" cy="{sy+356}" r="6" fill="{sc}"/>
  <path d="{path(p['status'],15,sx+70,sy+362,'monob',0.08)}" fill="{FOREST}"/>
</g>'''
    # round figure seal overlapping the top-right corner of the sticker
    fv,fl=p['fig']; fsz=54
    while width(fv,fsz,'display')>176: fsz-=2
    seal_pts=[]
    for i in range(48):
        a=i*math.pi*2/48; r=118 if i%2==0 else 108
        seal_pts.append(f"{r*math.cos(a):.1f},{r*math.sin(a):.1f}")
    seal=f'''<g transform="translate(812 660) rotate(8)">
  <path d="M{' L'.join(seal_pts)}Z" transform="translate(8 10)" fill="#000" opacity=".45"/>
  <path d="M{' L'.join(seal_pts)}Z" fill="{BRASSL}" stroke="{FOREST}" stroke-width="4" stroke-linejoin="round"/>
  <circle r="86" fill="none" stroke="{FOREST}" stroke-width="2" stroke-dasharray="1 5"/>
  <path d="{path(fv,fsz,0,fsz*0.32,'display',anchor='middle')}" fill="{FOREST}"/>
  <path d="{path(fl,14,0,46,'monob',0.12,anchor='middle')}" fill="{FOREST}"/>
</g>'''
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<defs><radialGradient id="glow"><stop offset="0" stop-color="{BRASSL}" stop-opacity=".9"/><stop offset=".35" stop-color="{BRASS}" stop-opacity=".35"/><stop offset="1" stop-color="{BRASS}" stop-opacity="0"/></radialGradient>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="{NIGHT}" stop-opacity="0"/><stop offset="1" stop-color="{NIGHT}" stop-opacity=".55"/></linearGradient></defs>
<image href="{bgd}" width="{W}" height="{H}"/>
<rect width="{W}" height="{H}" fill="url(#fade)"/>
{''.join(cons)}
{sticker}
{seal}
<path d="{path('ALBRETSEN AS · CATALOGUE OF WORKS',13,40,50,'mono',0.12)}" fill="{BRASSL}" opacity=".8"/>
</svg>'''
    sp=T+f'/prod_{p["id"]}.svg'
    open(sp,'w').write(svg)
    subprocess.run(['rsvg-convert',sp,'-o',T+f'/prod_{p["id"]}.png'],check=True)
    im=Image.open(T+f'/prod_{p["id"]}.png').convert('RGB')
    for w in (1000,600):
        r=im.resize((w,round(H*w/W)),Image.LANCZOS)
        base=A+f'/products/{p["id"]}-{w}'
        r.save(base+'.avif',quality=58,speed=4); r.save(base+'.webp',quality=78,method=6)
        if w==600: r.save(base+'.jpg',quality=82,optimize=True,progressive=True)
    print(p['id'],'ok')
