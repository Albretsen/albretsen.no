"""Retired products: round catalogue badges ("faded stars"). Luma uses its real wordmark."""
import os, base64, math, subprocess
from svgtext import path, width
REPO='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-28'
A=REPO+'/designs/88/assets/products/retired'
os.makedirs(A,exist_ok=True)
CREAM='#F9F2E2'; PAPER='#EDE2CC'; FOREST='#1A4A32'; INK='#173F2B'; BRASS='#C2964D'; MOSS='#6C9173'
R=[
 ('luma','Lu','Luma','2026',[(0,0),(1,0.2),(2,-0.4)]),
 ('polyglot-pilot','Pp','Polyglot Pilot','2025',[(0,0),(1,-0.6),(2,0),(3,-0.6)]),
 ('pinpoint','Pi','PinPoint','2025',[(0,-0.5),(1,0.5),(2,-0.5),(1,-1.2)]),
 ('webvakt','Wv','WebVakt','2024',[(0,0),(0.7,0.6),(1.4,0),(2.1,0.6),(2.8,0)]),
 ('joke-central','Jc','Joke Central','2024',[(0,0),(1,0.5),(2,0.5),(3,0)]),
 ('tryggere-hyring','Th','Tryggere Hyring','2023',[(0,0),(1,-0.2),(2,0.2),(1.5,1)]),
 ('early-apps','Ea','Early apps','2021',[(0,0),(1,0),(2,0)]),
]
S=240
for i,(id_,mono,name,yr,cons) in enumerate(R):
    teeth=[]
    for k in range(60):
        a=k*math.pi*2/60; r=112 if k%2==0 else 106
        teeth.append(f"{120+r*math.cos(a):.1f},{120+r*math.sin(a):.1f}")
    # mini constellation
    xs=[x for x,y in cons]; span=max(xs) or 1
    pts=[(120-40+x/span*80, 64+y*14) for x,y in cons]
    cl=''.join(f'<line x1="{pts[j][0]:.1f}" y1="{pts[j][1]:.1f}" x2="{pts[j+1][0]:.1f}" y2="{pts[j+1][1]:.1f}" stroke="{BRASS}" stroke-width="1.6"/>' for j in range(len(pts)-1))
    cl+=''.join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5" fill="{CREAM}"/><circle cx="{x:.1f}" cy="{y:.1f}" r="3" fill="{INK}"/>' for x,y in pts)
    if id_=='luma':
        logo='data:image/png;base64,'+base64.b64encode(open(REPO+'/designs/_shared/products/luma/logo.png','rb').read()).decode()
        center=f'<image href="{logo}" x="62" y="96" width="116" height="32" preserveAspectRatio="xMidYMid meet"/>'
    else:
        center=f'<path d="{path(mono,58,120,134,"display",anchor="middle")}" fill="{FOREST}"/>'
    nsz=13
    while width(name.upper(),nsz,'monob',0.08)>150: nsz-=0.5
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" width="{S}" height="{S}" role="img" aria-label="{name}, since {yr}, retired">
  <title>{name}, retired</title>
  <path d="M{' L'.join(teeth)}Z" transform="translate(5 6)" fill="{FOREST}"/>
  <path d="M{' L'.join(teeth)}Z" fill="{PAPER}" stroke="{FOREST}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="120" cy="120" r="92" fill="none" stroke="{INK}" stroke-width="1.2" stroke-dasharray="1 4" opacity=".7"/>
  {cl}
  {center}
  <path d="{path(name.upper(),nsz,120,162,'monob',0.08,anchor='middle')}" fill="{INK}"/>
  <rect x="56" y="174" width="128" height="22" rx="11" fill="{CREAM}" stroke="{INK}" stroke-width="1.5"/>
  <path d="{path(yr+' · RETIRED',10,120,189,'mono',0.08,anchor='middle')}" fill="{MOSS}"/>
</svg>
'''
    open(f'{A}/{id_}.svg','w').write(svg)
subprocess.run('true',shell=True)
print('ok')
