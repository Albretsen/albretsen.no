import os, re, sys, json, subprocess
ROOT = sys.argv[1]          # designs/75/assets
T = sys.argv[2]
PY = os.path.join(T, 'venv/bin/python')
FONT = os.path.join(ROOT, 'fonts/jost-variable.woff2')
ID = os.path.join(ROOT, 'identity'); os.makedirs(ID, exist_ok=True)

UMBER = '#3D2013'; AMBER = '#DC9447'; LINEN = '#FBF3E4'; COPPER = '#B8662F'; SAND = '#F4DDB4'

def tp(text, w, size, tr):
    out = subprocess.check_output([PY, '-I', os.path.join(T, 'scripts/textpath.py'), FONT, text, str(w), str(size), str(tr)])
    j = json.loads(out)
    j['d'] = re.sub(r'(\d+\.\d{2})\d+', r'\1', j['d'])
    return j

def mark_body(stroke, sun, sw=3.4, r=8.2):
    # A-shaped peak, horizon crossbar, half sun resting on the horizon. Leg ends cut flat.
    cid = 'c' + str(abs(hash((stroke, sun, sw))) % 10000)
    return f'''<defs><clipPath id="{cid}"><rect x="0" y="0" width="64" height="53"/></clipPath></defs>
  <path d="M{32 - r} 40 A{r} {r} 0 0 1 {32 + r} 40 Z" fill="{sun}"/>
  <path clip-path="url(#{cid})" d="M9.5 56 L32 11 L54.5 56" fill="none" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="miter" stroke-miterlimit="10"/>
  <path d="M16.5 40 H47.5" stroke="{stroke}" stroke-width="{sw * 0.62:.2f}"/>'''

def write(name, s):
    with open(os.path.join(ID, name), 'w') as f: f.write(s)
    print('wrote', name)

for name, st, sun in [('mark.svg', UMBER, AMBER), ('mark-linen.svg', LINEN, AMBER)]:
    write(name, f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Albretsen AS">
  {mark_body(st, sun)}
</svg>
''')

# favicon: mark on a linen tile with an amber hairline, readable at 16px (thicker strokes)
write('favicon.svg', f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="{LINEN}"/>
  <g transform="translate(32 33) scale(0.92) translate(-32 -32)">{mark_body(UMBER, AMBER, 5)}</g>
</svg>
''')

# wordmark, single line: ALBRETSEN AS
a = tp('ALBRETSEN', 460, 100, 0.34)
b = tp('AS', 460, 100, 0.34)
gap = 150
W = a['width'] + gap + b['width']; H = a['cap']
for name, c1, c2 in [('wordmark.svg', UMBER, COPPER), ('wordmark-linen.svg', LINEN, '#EDBB7C')]:
    write(name, f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {-H - 2:.1f} {W:.1f} {H + 4:.1f}" width="{W / 4:.0f}" height="{(H + 4) / 4:.0f}" role="img" aria-label="Albretsen AS">
  <path fill="{c1}" d="{a['d']}"/>
  <path fill="{c2}" transform="translate({a['width'] + gap:.1f} 0)" d="{b['d']}"/>
</svg>
''')

# signage stack: mark, ALBRETSEN, rule - AS - rule
s = tp('ALBRETSEN', 430, 100, 0.42)
k = tp('AS', 430, 46, 0.6)
w = s['width']; cap = s['cap']; kc = k['cap']
mw = 150
y0 = 0
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -40 {w + 80:.0f} {mw + 60 + cap + 70 + kc + 80:.0f}" width="{(w + 80) / 4:.0f}" height="{(mw + 60 + cap + 70 + kc + 80) / 4:.0f}" role="img" aria-label="Albretsen AS">']
svg.append(f'<g transform="translate({w / 2 - mw / 2:.1f} 0) scale({mw / 64:.4f})">{mark_body(UMBER, AMBER, 2.6)}</g>')
svg.append(f'<path fill="{UMBER}" transform="translate(0 {mw + 60 + cap:.1f})" d="{s["d"]}"/>')
ky = mw + 60 + cap + 70 + kc
svg.append(f'<path fill="{COPPER}" transform="translate({w / 2 - k["width"] / 2:.1f} {ky:.1f})" d="{k["d"]}"/>')
ry = ky - kc / 2
svg.append(f'<path stroke="{COPPER}" stroke-width="3" d="M0 {ry:.1f} H{w / 2 - k["width"] / 2 - 40:.1f} M{w / 2 + k["width"] / 2 + 40:.1f} {ry:.1f} H{w:.1f}"/>')
svg.append('</svg>\n')
write('wordmark-signage.svg', '\n  '.join(svg))

# horizontal lockup: mark + wordmark
lw = 120
write('lockup.svg', f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {lw + 56 + W:.0f} {lw}" width="{(lw + 56 + W) / 4:.0f}" height="{lw / 4:.0f}" role="img" aria-label="Albretsen AS">
  <g transform="scale({lw / 64:.4f})">{mark_body(UMBER, AMBER, 3)}</g>
  <g transform="translate({lw + 56} {lw / 2 + H / 2:.1f})"><path fill="{UMBER}" d="{a['d']}"/><path fill="{COPPER}" transform="translate({a['width'] + gap:.1f} 0)" d="{b['d']}"/></g>
</svg>
''')

# big outlined name for the hero (set behind the cliffs), thin weight, wide tracking
h = tp('ALBRETSEN', 300, 100, 0.22)
write('name-hero.svg', f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {-h['cap'] - 1:.1f} {h['width']:.1f} {h['cap'] + 2:.1f}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Albretsen">
  <path fill="{LINEN}" d="{h['d']}"/>
</svg>
''')
