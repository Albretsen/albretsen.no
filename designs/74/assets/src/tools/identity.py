import json, re, subprocess, sys, os
OUT = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-14/designs/74/assets/identity/'
FONT = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-14/designs/74/assets/fonts/josefin-sans-var.woff2'
os.makedirs(OUT, exist_ok=True)
def outline(text, w, size, track):
    r = subprocess.run([sys.executable, '-I', os.path.dirname(__file__) + '/outline.py', FONT, text, str(w), str(size), str(track)], capture_output=True, text=True, check=True)
    j = json.loads(r.stdout); j['d'] = re.sub(r'-?\d+\.\d+', lambda m: f"{float(m.group()):.1f}".rstrip('0').rstrip('.'), j['d']); return j
INK, PAPER, OCHRE, OCHRE_L, TERRA, SEA, LAV, PLUM = '#2E2240', '#F5EBDC', '#D9A441', '#F2C66D', '#C2603E', '#2F6E9E', '#A99BD1', '#2E2240'

# ---- the mark: an arched opening; inside, a sun behind a peak whose horizon cut makes an A
def mark(flat=False, size=64):
    sh = '' if flat else '''<filter id="s" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.1" flood-color="#1e1028" flood-opacity=".35"/></filter>'''
    f = '' if flat else ' filter="url(#s)"'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="{size}" height="{size}" role="img" aria-label="Albretsen AS">
<title>Albretsen AS</title>
<defs>{sh}<clipPath id="arch"><path d="M8 62V30a24 24 0 0 1 48 0v32z"/></clipPath></defs>
<path d="M8 62V30a24 24 0 0 1 48 0v32z" fill="{LAV}"/>
<g clip-path="url(#arch)">
<circle cx="32" cy="31" r="12" fill="{OCHRE_L}"{f}/>
<path d="M2 62L20 41 26 46 34 34 62 62z" fill="{TERRA}"{f}/>
<path d="M12 62L32 22 52 62z" fill="{SEA}"{f}/>
<path d="M20.5 45h23l1.5 3H19z" fill="{PAPER}"/>
</g>
<path d="M8 62V30a24 24 0 0 1 48 0v32" fill="none" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>
</svg>'''
open(OUT + 'mark.svg', 'w').write(mark())
open(OUT + 'favicon.svg', 'w').write(mark(flat=True))

# ---- wordmarks
wm = outline('ALBRETSEN', 600, 100, 0.3); AS = outline('AS', 500, 34, 0.9)
W = wm['width']; cap = wm['cap']
def wordmark(color, name):
    # horizontal: ALBRETSEN, a small sun disc, then AS on the same baseline
    asx = W + 64
    total = asx + AS['width'] + 4
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 {-cap-6:.0f} {total+8:.0f} {cap+12:.0f}" role="img" aria-label="Albretsen AS">
<title>Albretsen AS</title>
<path fill="{color}" d="{wm['d']}"/>
<circle cx="{W+30:.1f}" cy="{-cap/2:.1f}" r="9" fill="{OCHRE}"/>
<path fill="{color}" transform="translate({asx:.1f} 0)" d="{AS['d']}"/>
</svg>'''
    open(OUT + name, 'w').write(svg)
wordmark(INK, 'wordmark.svg'); wordmark(PAPER, 'wordmark-paper.svg')
# stacked signage lockup: mark over ALBRETSEN over a rule with A S
def stacked(color, name):
    w = W; mh = 150
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -20 {w+40:.0f} {mh+cap+130:.0f}" role="img" aria-label="Albretsen AS">
<title>Albretsen AS</title>
<g transform="translate({w/2-mh/2:.1f} 0) scale({mh/64:.4f})">{mark().split('<title>Albretsen AS</title>')[1].replace('</svg>','')}</g>
<path fill="{color}" transform="translate(0 {mh+40+cap:.1f})" d="{wm['d']}"/>
<g transform="translate(0 {mh+cap+86:.1f})"><rect x="0" y="-12" width="{w/2-AS['width']/2-30:.1f}" height="2.5" fill="{color}"/>
<rect x="{w/2+AS['width']/2+30:.1f}" y="-12" width="{w/2-AS['width']/2-30:.1f}" height="2.5" fill="{color}"/>
<path fill="{color}" transform="translate({w/2-AS['width']/2:.1f} 0)" d="{AS['d']}"/></g>
</svg>'''
    open(OUT + name, 'w').write(svg)
stacked(INK, 'lockup-stacked.svg')
print('ok', W, cap)
