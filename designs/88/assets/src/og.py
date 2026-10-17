import os, base64, io, subprocess, math
from PIL import Image
from svgtext import path, width
T=os.path.dirname(os.path.abspath(__file__))
A='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-28/designs/88/assets'
CREAM='#F9F2E2'; FOREST='#1A4A32'; NIGHT='#05170F'; BRASS='#C2964D'; BRASSL='#E8CB84'; SIGNAL='#D4407C'
cy=Image.open(T+'/cygnus_graded.png').convert('RGB')
W,H=cy.size
c=cy.crop((0,int(H*0.38),W,int(H*0.38)+int(W*630/1200))).resize((1200,630),Image.LANCZOS)
bio=io.BytesIO(); c.save(bio,'JPEG',quality=88)
bg='data:image/jpeg;base64,'+base64.b64encode(bio.getvalue()).decode()
wm=open(A+'/identity/wordmark-night.svg').read()
wm='data:image/svg+xml;base64,'+base64.b64encode(wm.encode()).decode()
line1='I build software'; line2='that pays for itself.'
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
<defs><linearGradient id="f" x1="0" x2="1"><stop offset="0" stop-color="{NIGHT}" stop-opacity=".85"/><stop offset=".6" stop-color="{NIGHT}" stop-opacity=".2"/><stop offset="1" stop-color="{NIGHT}" stop-opacity="0"/></linearGradient></defs>
<image href="{bg}" width="1200" height="630"/>
<rect width="1200" height="630" fill="url(#f)"/>
<image href="{wm}" x="64" y="60" width="{445*0.95:.0f}" height="{72*0.95:.0f}"/>
<path d="{path(line1,78,64,330,'display')}" fill="{CREAM}"/>
<path d="{path(line2,78,64,420,'display')}" fill="{BRASSL}"/>
<g transform="translate(64 500) rotate(-2)">
  <rect x="5" y="5" width="420" height="54" rx="27" fill="{BRASS}"/>
  <rect width="420" height="54" rx="27" fill="{CREAM}" stroke="{FOREST}" stroke-width="3"/>
  <circle cx="30" cy="27" r="7" fill="{SIGNAL}"/>
  <path d="{path('ALBRETSEN.NO · SINCE 2016',16,50,33,'monob',0.08)}" fill="{FOREST}"/>
</g>
<path d="{path('PLATE: CYGNUS, 13.08.1885 · THE MET, CC0',11,1136,600,'mono',0.1,anchor='end')}" fill="{BRASSL}" opacity=".7"/>
</svg>'''
open(T+'/og.svg','w').write(svg)
subprocess.run(['rsvg-convert',T+'/og.svg','-o',T+'/og.png'],check=True)
Image.open(T+'/og.png').convert('RGB').save(A+'/identity/og-1200x630.jpg',quality=86,optimize=True,progressive=True)
print(width('ALBRETSEN',40,'display',0.02))
