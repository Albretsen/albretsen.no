import sys, os, math, numpy as np
from PIL import Image
A = sys.argv[1]
E = os.path.join(A, 'extras'); os.makedirs(E, exist_ok=True)
MARK = 'M28.63 11.14Q32.00 5.00 35.37 11.14L57.59 51.62Q60.00 56.00 55.00 56.00L48.00 56.00Q45.00 56.00 43.52 53.39L33.97 36.48Q32.00 33.00 30.03 36.48L20.48 53.39Q19.00 56.00 16.00 56.00L9.00 56.00Q4.00 56.00 6.41 51.62Z'

# grain tile (overlay at ~6% opacity, mix-blend-mode: overlay)
rng = np.random.default_rng(0xbbc66a)
g = rng.normal(128, 42, (256, 256)).clip(0, 255).astype(np.uint8)
Image.fromarray(g, 'L').save(os.path.join(E, 'grain-256.png'), optimize=True)

# select grid pattern (tileable 48px): dots + every 4th crossing a small plus
open(os.path.join(E, 'pattern-select-grid.svg'), 'w').write('''<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
<title>Select grid: tileable stage pattern</title>
<g fill="#423144">''' + ''.join(f'<circle cx="{x}" cy="{y}" r="1.1"/>' for x in range(24, 192, 48) for y in range(24, 192, 48) if not (x == 120 and y == 72)) + '''</g>
<path d="M120 66v12M114 72h12" stroke="#dc3aec" stroke-width="1.4" stroke-linecap="round"/>
</svg>
''')

# circular badge: on Google Play since 2016
txt = 'ON GOOGLE PLAY SINCE 2016 · ALBRETSEN AS · '
open(os.path.join(E, 'badge-since-2016.svg'), 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="On Google Play since 2016">
<defs>
<path id="r" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0"/>
<radialGradient id="b" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#3a1840"/><stop offset="1" stop-color="#120813"/></radialGradient>
<linearGradient id="m" x1=".2" y1="0" x2=".75" y2="1"><stop offset="0" stop-color="#f6b7fb"/><stop offset=".4" stop-color="#dc3aec"/><stop offset="1" stop-color="#861192"/></linearGradient>
</defs>
<circle cx="100" cy="100" r="96" fill="url(#b)"/>
<circle cx="100" cy="100" r="95" fill="none" stroke="#dc3aec" stroke-opacity=".7"/>
<circle cx="100" cy="100" r="56" fill="none" stroke="#423144"/>
<text font-family="Geist Mono, ui-monospace, monospace" font-size="12.6" font-weight="600" letter-spacing="2.4" fill="#f8f1f8"><textPath href="#r">{txt}</textPath></text>
<g transform="translate(70 66) scale(.94)"><path d="{MARK}" fill="url(#m)"/><circle cx="32" cy="50.5" r="4.6" fill="#36dcec"/></g>
</svg>
''')

# status chips (one sheet, each chip is its own <g id>; also exported separately)
chips = [('live', 'LIVE', '#1fc893'), ('building', 'BUILDING', '#36dcec'), ('paused', 'PAUSED', '#fbd452'), ('retired', 'RETIRED', '#ae9faf')]
for cid, label, col in chips:
    w = 26 + len(label) * 9.2
    open(os.path.join(E, f'chip-{cid}.svg'), 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} 28" width="{w:.0f}" height="28" role="img" aria-label="{label}">
<rect x=".5" y=".5" width="{w-1:.0f}" height="27" rx="13.5" fill="#160b17" stroke="{col}" stroke-opacity=".55"/>
<circle cx="14" cy="14" r="4" fill="{col}"/>{'<circle cx="14" cy="14" r="7.5" fill="none" stroke="' + col + '" stroke-opacity=".35"/>' if cid in ('live', 'building') else ''}
<text x="25" y="18.4" font-family="Geist Mono, ui-monospace, monospace" font-size="11" font-weight="600" letter-spacing="1.6" fill="{col}">{label}</text>
</svg>
''')

# P1 select tag
open(os.path.join(E, 'tag-p1.svg'), 'w').write('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 40" width="56" height="40" role="img" aria-label="P1">
<path d="M6 2h44a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H33l-5 7-5-7H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z" fill="#dc3aec"/>
<text x="28" y="21.5" text-anchor="middle" font-family="Unbounded, Geist, sans-serif" font-size="13" font-weight="700" letter-spacing=".5" fill="#0b050c">P1</text>
</svg>
''')

# orbit rings decoration: the select-ring around a character, drawn in perspective
rings = []
for i, (rx, ry, op, dash) in enumerate([(280, 64, .9, ''), (330, 80, .45, 'stroke-dasharray="2 10"'), (390, 98, .25, '')]):
    rings.append(f'<ellipse cx="400" cy="200" rx="{rx}" ry="{ry}" fill="none" stroke="url(#s)" stroke-width="{1.6 - i*0.4:.1f}" stroke-opacity="{op}" {dash}/>')
dots = ''.join(f'<circle cx="{400 + 280*math.cos(a):.1f}" cy="{200 + 64*math.sin(a):.1f}" r="{r}" fill="{c}"/>' for a, r, c in [(0.4, 5, '#36dcec'), (2.6, 3.5, '#f295fb'), (4.2, 4, '#fbd452')])
open(os.path.join(E, 'orbit-rings.svg'), 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400" role="img" aria-label="Selection orbit">
<defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#dc3aec" stop-opacity="0"/><stop offset=".3" stop-color="#dc3aec"/><stop offset=".7" stop-color="#36dcec"/><stop offset="1" stop-color="#36dcec" stop-opacity="0"/></linearGradient>
<filter id="g" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<g filter="url(#g)">{''.join(rings)}{dots}</g>
</svg>
''')
print('ok')
