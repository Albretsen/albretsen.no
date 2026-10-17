import math, random, os
A = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-14/designs/74/assets/extras/'
os.makedirs(A, exist_ok=True)
PAPER, INK, OCHRE, TERRA, SEA, LAV = '#F5EBDC', '#2E2240', '#D9A441', '#C2603E', '#2F6E9E', '#A99BD1'

# 1. Breeze block: a seamless 96px tile, mid-century screen-wall pattern (circle in a square, four petals)
open(A + 'breeze-block.svg', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
<title>Breeze block tile</title>
<rect width="96" height="96" fill="{PAPER}"/>
<g fill="#E7D6BE"><path d="M8 8h80v80H8z" fill="none" stroke="#E2CFB4" stroke-width="2"/>
<path fill-rule="evenodd" d="M12 12h72v72H12z M48 16a32 32 0 0 0-32 32 32 32 0 0 0 32 32 32 32 0 0 0 32-32 32 32 0 0 0-32-32z"/>
<path d="M48 18c6 12 6 18 0 30-6-12-6-18 0-30zM48 78c-6-12-6-18 0-30 6 12 6 18 0 30zM18 48c12-6 18-6 30 0-12 6-18 6-30 0zM78 48c-12 6-18 6-30 0 12-6 18-6 30 0z"/></g>
<path d="M48 16a32 32 0 0 1 32 32" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"/>
</svg>''')

# 2. Boulevard divider: a row of lamps receding toward a vanishing point, 1600 x 120
lamps = []
for i in range(14):
    t = (i / 13) ** 1.7; x = 40 + t * 1520; s = 0.35 + t * 1.0; h = 70 * s; base = 112
    lamps.append(f'<g transform="translate({x:.1f} {base}) scale({s:.3f})"><rect x="-1.6" y="-70" width="3.2" height="70" fill="{INK}"/><path d="M0-70q2-9 12-8v2q-9-1-10.4 8z" fill="{INK}"/><ellipse cx="13" cy="-74.5" rx="4.2" ry="3" fill="#FFE6B0"/><circle cx="13" cy="-73" r="18" fill="url(#g)"/></g>')
open(A + 'boulevard-divider.svg', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 120" preserveAspectRatio="xMidYMax meet" role="img" aria-label="A boulevard of lamps">
<title>Boulevard divider</title><defs><radialGradient id="g"><stop offset="0" stop-color="#FFC979" stop-opacity=".75"/><stop offset="1" stop-color="#FFC979" stop-opacity="0"/></radialGradient></defs>
<rect x="0" y="111" width="1600" height="2" fill="{INK}" opacity=".5"/>{''.join(lamps)}</svg>''')

# 3. Cut edges: torn-free, knife-cut horizon edges for section transitions (sit at the bottom of a section)
def edge(name, seed, fill, amp, peaks):
    random.seed(seed); pts = []
    for x in range(0, 1601, 8):
        y = 60 + sum(math.sin(x * f + p) * a for f, p, a in [(0.004, seed, amp), (0.011, seed * 2, amp * 0.35), (0.031, seed * 3, amp * 0.12)])
        for px, py, w in peaks:
            d = abs(x - px) / w
            if d < 1: y -= py * (1 - d) ** 1.15
        pts.append(f'{x},{y:.1f}')
    d = 'M0,160 L' + ' L'.join(pts) + ' L1600,160 Z'
    open(A + name, 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 160" preserveAspectRatio="none" aria-hidden="true">
<defs><filter id="s" x="-5%" y="-40%" width="110%" height="180%"><feDropShadow dx="0" dy="-3" stdDeviation="5" flood-color="#1e1028" flood-opacity=".22"/></filter></defs>
<path d="{d}" fill="{fill}" filter="url(#s)"/><path d="M{' L'.join(pts)}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/></svg>''')
edge('edge-ridge.svg', 3, PAPER, 10, [(1180, 70, 260), (1360, 40, 160)])
edge('edge-hills.svg', 7, PAPER, 16, [])
edge('edge-ridge-plum.svg', 5, INK, 10, [(420, 60, 240)])

# 4. Sun-time chip: the small signage plate that names the hour (static artwork; text set live in HTML)
open(A + 'sun-dial.svg', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="Sun dial">
<title>Sun dial</title>
<circle cx="100" cy="100" r="92" fill="{PAPER}" stroke="{INK}" stroke-width="3"/>
{''.join(f'<rect x="99" y="14" width="2" height="{12 if h % 6 else 20}" fill="{INK}" transform="rotate({h*15} 100 100)"/>' for h in range(24))}
<path d="M30 100a70 70 0 0 1 140 0z" fill="{LAV}" opacity=".35"/>
<rect x="20" y="99" width="160" height="2" fill="{INK}"/>
<circle cx="100" cy="100" r="5" fill="{INK}"/>
<g id="sun" transform="rotate(-35 100 100)"><circle cx="100" cy="38" r="13" fill="{OCHRE}"/></g>
</svg>''')
print('ok')
