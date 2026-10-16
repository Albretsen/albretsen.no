# Stickers, wall label and retired-product stand-ins for design 38. Text is outlined (no font needed).
# usage: python stickers.py FONTDIR OUTDIR_EXTRAS OUTDIR_PRODUCTS
import sys, math, json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.varLib import instancer

FD, OUT, PROD = sys.argv[1:4]
serif = TTFont(f'{FD}/InstrumentSerif-Italic.ttf')
mono = instancer.instantiateVariableFont(TTFont(f'{FD}/JetBrainsMono.ttf'), {'wght': 600})
monoR = instancer.instantiateVariableFont(TTFont(f'{FD}/JetBrainsMono.ttf'), {'wght': 400})
brico = instancer.instantiateVariableFont(TTFont(f'{FD}/Bricolage.ttf'), {'wght': 800, 'wdth': 75, 'opsz': 96})

def text(font, s, size, x=0, y=0, track=0, anchor='start'):
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); k = size / font['head'].unitsPerEm
    width = sum(gs[cmap[ord(c)]].width * k + track * size for c in s) - track * size
    if anchor == 'middle': x -= width / 2
    if anchor == 'end': x -= width
    out = []; cx = x
    for c in s:
        g = cmap[ord(c)]; pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (k, 0, 0, -k, cx, y))); out.append(pen.getCommands())
        cx += gs[g].width * k + track * size
    return ' '.join(o for o in out if o), width

def text_on_circle(font, s, size, cx, cy, r, start=-90, track=0.12):
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); k = size / font['head'].unitsPerEm
    out = []; ang = math.radians(start)
    for c in s:
        g = cmap[ord(c)]; adv = gs[g].width * k
        a = ang + (adv / 2) / r
        x, y = cx + r * math.cos(a), cy + r * math.sin(a)
        rot = math.degrees(a) + 90
        pen = SVGPathPen(gs); gs[g].draw(TransformPen(pen, (k, 0, 0, -k, -adv / 2, 0)))
        out.append(f'<path transform="translate({x:.2f} {y:.2f}) rotate({rot:.2f})" d="{pen.getCommands()}"/>')
        ang += (adv + track * size) / r
    return ''.join(out)

pal = json.load(open(f'{OUT}/../brand/palette.json'))
X = {k: v['hex'] for k, v in pal.items()}

def save(path, w, h, body):
    open(path, 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{body}</svg>\n')

# 1. red dot — the gallery "sold" dot. For live products earning money.
save(f'{OUT}/sticker-red-dot.svg', 64, 64, f'''<defs><radialGradient id="g" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ff6a5c"/><stop offset=".6" stop-color="{X['red-dot']}"/><stop offset="1" stop-color="#b4161c"/></radialGradient></defs>
<circle cx="32" cy="33.5" r="26" fill="#000" opacity=".22"/><circle cx="32" cy="32" r="26" fill="url(#g)"/><ellipse cx="24" cy="21" rx="9" ry="5" fill="#fff" opacity=".28" transform="rotate(-30 24 21)"/>''')

# 2. round stamp: SHIPPING SINCE 2016 · GOOGLE PLAY · ALBRETSEN AS ·
RING = 'ON GOOGLE PLAY SINCE 2016 · ALBRETSEN AS · '
_k = 13 / mono['head'].unitsPerEm; _adv = sum(mono.getGlyphSet()[mono.getBestCmap()[ord(c)]].width * _k for c in RING)
ring = text_on_circle(mono, RING, 13, 100, 100, 72, start=-90, track=(2 * math.pi * 72 - _adv) / len(RING) / 13)
year, _ = text(brico, '2016', 52, 100, 120, anchor='middle')
save(f'{OUT}/sticker-since-2016.svg', 200, 200, f'''<circle cx="100" cy="100" r="96" fill="{X['spark']}"/><circle cx="100" cy="100" r="88" fill="none" stroke="{X['ink']}" stroke-width="2"/><circle cx="100" cy="100" r="57" fill="none" stroke="{X['ink']}" stroke-width="2"/>
<g fill="{X['ink']}">{ring}</g><path d="{year}" fill="{X['ink']}"/><circle cx="100" cy="67" r="4.5" fill="{X['ink']}"/>''')

# 3. "PLEASE TOUCH" — inverted museum rule, slapped on at an angle. Invites hover.
t1, w1 = text(brico, 'PLEASE', 46, 0, 0); t2, w2 = text(brico, 'TOUCH', 46, 0, 0)
sub, ws = text(mono, 'THE WORKS', 12, 0, 0, track=0.25)
W = 230
save(f'{OUT}/sticker-please-touch.svg', 260, 170, f'''<g transform="translate(130 85) rotate(-6) translate(-115 -62)">
<rect x="3" y="5" width="{W}" height="124" rx="6" fill="#000" opacity=".25"/><rect width="{W}" height="124" rx="6" fill="{X['s3-348']}"/>
<rect x="6" y="6" width="{W-12}" height="112" rx="3" fill="none" stroke="{X['ink']}" stroke-width="1.5" stroke-dasharray="4 4"/>
<path transform="translate({(W - w1) / 2:.1f} 52)" d="{t1}" fill="{X['ink']}"/><path transform="translate({(W - w2) / 2:.1f} 96)" d="{t2}" fill="{X['ink']}"/>
<path transform="translate({(W - ws) / 2:.1f} 113)" d="{sub}" fill="{X['ink']}"/></g>''')

# 4. "WET CODE" caution sticker, yellow-green spectrum step
t, wt = text(brico, 'WET CODE', 38, 0, 0)
s2, w2 = text(mono, 'DEPLOYED TODAY · DO NOT LEAN', 8.6, 0, 0, track=0.1)
W = max(wt, w2) + 44
save(f'{OUT}/sticker-wet-code.svg', math.ceil(W) + 10, 96, f'''<g transform="translate(5 6) rotate(3 {W/2} 40)"><rect width="{W:.1f}" height="80" rx="40" fill="{X['s5-108']}"/>
<path transform="translate({(W - wt) / 2:.1f} 46)" d="{t}" fill="{X['ink']}"/><path transform="translate({(W - w2) / 2:.1f} 63)" d="{s2}" fill="{X['ink']}"/></g>''')

# 5. museum wall label template (SVG, outlined) — the builder can also rebuild it in HTML.
def wall_label(path, title, lines, w=360, h=200):
    tt, _ = text(serif, title, 34, 22, 52)
    body = ''.join(f'<path d="{text(monoR, ln, 12.5, 22, 86 + i * 20)[0]}"/>' for i, ln in enumerate(lines))
    save(path, w, h, f'''<rect x="2" y="4" width="{w-4}" height="{h-4}" fill="#000" opacity=".18"/><rect width="{w-4}" height="{h-4}" fill="{X['paper']}"/>
<path d="{tt}" fill="{X['ink']}"/><g fill="#4d4b44">{body}</g><circle cx="{w-28}" cy="28" r="7" fill="{X['red-dot']}"/>''')
wall_label(f'{OUT}/wall-label-mcp-emails.svg', 'MCP Emails, 2026', ['Email for AI agents.', '17 tools · about 100 email providers', 'open source (AGPL)', 'mcpemails.com'])

# 6. retired stand-ins: small "storeroom" prints, one per retired product, each a mini generative glyph
RET = [
    ('luma', 'Luma', 2026, 228, 'tension'),
    ('polyglot-pilot', 'Polyglot Pilot', 2025, 288, 'spark'),
    ('pinpoint', 'PinPoint', 2025, 348, 'weightless'),
    ('webvakt', 'WebVakt', 2024, 48, 'strata'),
    ('joke-central', 'Joke Central', 2024, 108, 'spark'),
    ('tryggere-hyring', 'Tryggere Hyring', 2023, 168, 'tension'),
    ('early-apps', 'Early apps', 2021, 228, 'strata'),
]
def oklch(L, C, h):
    from importlib import import_module
    a, b = C * math.cos(math.radians(h)), C * math.sin(math.radians(h))
    l_, m_, s_ = L + .3963377774 * a + .2158037573 * b, L - .1055613458 * a - .0638541728 * b, L - .0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    rgb = (4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.7076147010 * s)
    enc = lambda x: 12.92 * x if x <= .0031308 else 1.055 * x ** (1 / 2.4) - .055
    return '#%02x%02x%02x' % tuple(round(max(0, min(1, enc(max(0, v)))) * 255) for v in rgb)

import random
for pid, name, year, hue, kind in RET:
    rnd = random.Random(pid)
    home, deep, ink = oklch(.66, .14, hue), oklch(.42, .1, hue), X['ink']
    W, H = 240, 300
    g = []
    cx, cy = 120, 120
    if kind == 'tension':
        nails = [40 + i * 53 + rnd.uniform(-10, 10) for i in range(4)]
        for i in range(11):
            a, b = rnd.sample(nails, 2); sag = rnd.uniform(15, 70)
            g.append(f'<path d="M{a:.1f} 70 Q{(a+b)/2:.1f} {70+sag*2:.1f} {b:.1f} 70" fill="none" stroke="{rnd.choice([home, deep, ink])}" stroke-width="{rnd.uniform(1.2,3.5):.1f}"/>')
        for n in nails: g.append(f'<circle cx="{n:.1f}" cy="70" r="3" fill="{ink}"/>')
    elif kind == 'spark':
        for i in range(70):
            a = rnd.uniform(0, 6.283); r0 = rnd.uniform(8, 30); r1 = r0 + rnd.uniform(10, 75)
            g.append(f'<path d="M{cx+r0*math.cos(a):.1f} {cy+r0*math.sin(a):.1f} L{cx+r1*math.cos(a):.1f} {cy+r1*math.sin(a):.1f}" stroke="{rnd.choice([home, home, deep, ink])}" stroke-width="{rnd.uniform(.8,2.6):.1f}" stroke-linecap="round"/>')
    elif kind == 'weightless':
        for i in range(16):
            r = rnd.uniform(4, 26); x = rnd.uniform(40, 200); y = rnd.uniform(40, 200)
            f = rnd.choice([home, deep, ink, 'none'])
            g.append(f'<line x1="{x:.1f}" y1="{y+r:.1f}" x2="{x:.1f}" y2="215" stroke="{home}" stroke-width=".8" opacity=".6"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{f}" stroke="{ink if f == "none" else "none"}" stroke-width="1.4"/>')
    else:
        prev = None
        for i in range(9):
            y0 = 40 + i * 20
            pts = [(x, y0 + 10 * math.sin(x / 30 + i * 1.3 + rnd.random())) for x in range(30, 211, 10)]
            d = 'M' + ' L'.join(f'{x} {y:.1f}' for x, y in pts)
            if prev:
                poly = 'M' + ' L'.join(f'{x} {y:.1f}' for x, y in prev) + ' L' + ' L'.join(f'{x} {y:.1f}' for x, y in reversed(pts)) + 'Z'
                g.append(f'<path d="{poly}" fill="{rnd.choice([home, deep, X["paper"], ink])}"/>')
            prev = pts
    nm, nw = text(serif, name, 24, 24, 262)
    yr, _ = text(monoR, f'{year} · retired', 10.5, 24, 282, track=0.06)
    save(f'{PROD}/retired-{pid}.svg', W, H, f'''<rect width="{W}" height="{H}" fill="{X['paper']}"/>
<clipPath id="c{pid}"><rect x="24" y="24" width="192" height="200"/></clipPath><rect x="24" y="24" width="192" height="200" fill="{oklch(.93, .03, hue)}"/>
<g clip-path="url(#c{pid})">{''.join(g)}</g><rect x="24" y="24" width="192" height="200" fill="none" stroke="{ink}" stroke-opacity=".15"/>
<path d="{nm}" fill="{ink}"/><path d="{yr}" fill="#6a675e"/>''')
print('stickers ok')
