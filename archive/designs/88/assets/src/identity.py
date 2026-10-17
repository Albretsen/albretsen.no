import os, subprocess, math
from svgtext import path, width
OUT='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-28/designs/88/assets/identity'
CREAM='#F9F2E2'; FOREST='#1A4A32'; NIGHT='#05170F'; BRASS='#C2964D'; BRASSL='#E8CB84'; SIGNAL='#D4407C'

def star4(cx,cy,r,inner=0.28):
    pts=[]
    for i in range(8):
        a=-math.pi/2+i*math.pi/4
        rr=r if i%2==0 else r*inner
        pts.append(f"{cx+rr*math.cos(a):.2f},{cy+rr*math.sin(a):.2f}")
    return "M"+" L".join(pts)+"Z"

def glyph(ink, bg, star, ox=0, oy=0, s=1.0):
    """The A-constellation: 5 stars, 3 tension lines with knock-out gaps."""
    P={'apex':(32,13),'l':(15,51),'r':(49,51),'cl':(22.4,35),'cr':(41.6,35)}
    P={k:(ox+x*s,oy+y*s) for k,(x,y) in P.items()}
    L=[('apex','l'),('apex','r'),('cl','cr')]
    out=[]
    for a,b in L:
        (x1,y1),(x2,y2)=P[a],P[b]
        out.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{ink}" stroke-width="{2.6*s:.2f}" stroke-linecap="butt"/>')
    for k,(x,y) in P.items():
        r= 4.2 if k in('l','r') else 3.4
        if k=='apex':
            out.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{8.6*s:.2f}" fill="{bg}"/>')
            out.append(f'<path d="{star4(x,y,9.4*s)}" fill="{star}"/>')
        else:
            out.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{(r+2.4)*s:.2f}" fill="{bg}"/>')
            out.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r*s:.2f}" fill="{ink}"/>')
    return "\n  ".join(out)

def mark(fill=CREAM, ink=FOREST, shadow=BRASS, star=BRASS, border=FOREST, title='Albretsen AS'):
    # sticker tile with hard offset shadow (neo-brutalist), 72x72 viewBox
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="72" height="72" role="img" aria-label="{title}">
  <title>{title}</title>
  <rect x="7" y="7" width="62" height="62" rx="14" fill="{shadow}"/>
  <rect x="2.5" y="2.5" width="62" height="62" rx="14" fill="{fill}" stroke="{border}" stroke-width="3"/>
  {glyph(ink, fill, star, ox=1.5, oy=1.6, s=1.0)}
</svg>
'''
open(OUT+'/mark.svg','w').write(mark())
open(OUT+'/mark-night.svg','w').write(mark(fill=NIGHT, ink=CREAM, shadow=BRASS, star=BRASSL, border=CREAM))

# bare glyph (no tile) for use inline
open(OUT+'/glyph.svg','w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Albretsen AS">
  <title>Albretsen AS</title>
  {glyph('currentColor','transparent',BRASS)}
</svg>
''')

# favicon: simpler, larger stars, no shadow, works at 16px
fav=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="{FOREST}"/>
  {glyph(CREAM, FOREST, BRASSL, ox=0, oy=0.5, s=1.0).replace('stroke-width="2.60"','stroke-width="4"')}
</svg>
'''
open(OUT+'/favicon.svg','w').write(fav)

# wordmark: mark tile + ALBRETSEN (Archivo Expanded 850, outlined) + AS label
def wordmark(ink=FOREST, fill=CREAM, labelbg=FOREST, labelfg=CREAM, shadow=BRASS, star=BRASS, name='wordmark'):
    size=40; tx=86; base=50
    d=path('ALBRETSEN',size,tx,base,'display',track=0.02)
    w=width('ALBRETSEN',size,'display',track=0.02)
    lx=tx+w+12
    ld=path('AS',15,lx+10,base-9,'monob',track=0.06)
    lw=width('AS',15,'monob',track=0.06)+20
    W=math.ceil(lx+lw+10)
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} 72" width="{W}" height="72" role="img" aria-label="Albretsen AS">
  <title>Albretsen AS</title>
  <g>
    <rect x="7" y="7" width="62" height="62" rx="14" fill="{shadow}"/>
    <rect x="2.5" y="2.5" width="62" height="62" rx="14" fill="{fill}" stroke="{ink}" stroke-width="3"/>
    {glyph(ink, fill, star, ox=1.5, oy=1.6)}
  </g>
  <path d="{d}" fill="{ink}"/>
  <rect x="{lx+3:.1f}" y="{base-26+3}" width="{lw:.1f}" height="24" rx="3" fill="{shadow}"/>
  <rect x="{lx:.1f}" y="{base-26}" width="{lw:.1f}" height="24" rx="3" fill="{labelbg}" stroke="{ink}" stroke-width="2"/>
  <path d="{ld}" fill="{labelfg}"/>
</svg>
'''
    open(OUT+f'/{name}.svg','w').write(svg)
wordmark()
wordmark(ink=CREAM, fill=NIGHT, labelbg=BRASSL, labelfg=NIGHT, shadow=BRASS, star=BRASSL, name='wordmark-night')
subprocess.run(['rsvg-convert','-w','180','-h','180',OUT+'/favicon.svg','-o',OUT+'/apple-touch-icon.png'],check=True)
subprocess.run(['rsvg-convert','-w','32','-h','32',OUT+'/favicon.svg','-o',OUT+'/favicon-32.png'],check=True)
print('ok')
