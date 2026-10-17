#!/usr/bin/env python3
"""Writes the hand-built SVG illustrations: bougainvillea sprig, shutter pair, arch frame,
horizon rule, sun path diagram, and retired-product stand-in tiles.
usage: illustrations.py ASSETS_DIR"""
import math, random, sys, os
A = sys.argv[1]
os.makedirs(f'{A}/extras', exist_ok=True); os.makedirs(f'{A}/products/retired', exist_ok=True)
INK = '#2A2420'; POPPY = '#E4572E'; SAGE = '#8E9D80'; SAGE_D = '#5F6F58'; LIME = '#F6F1E8'; SAND = '#E9DCC6'
BOUG = '#C2306B'; BOUG_L = '#E0558A'; BOUG_D = '#8E1F4E'; LEAF = '#4E6B3A'; LEAF_D = '#33492A'

def f(v): return ('%.1f' % v).rstrip('0').rstrip('.')

# ---------------------------------------------------------------- bougainvillea sprig
rnd = random.Random(70)
def bract(cx, cy, ang, size, col, dark):
    # one papery heart-shaped bract with a mid-vein
    pts = []
    s = size
    ca, sa = math.cos(ang), math.sin(ang)
    def T(x, y): return (cx + x * ca - y * sa, cy + x * sa + y * ca)
    p0 = T(0, 0); p1 = T(-0.62 * s, -0.55 * s); p2 = T(-0.42 * s, -1.08 * s); p3 = T(0, -0.92 * s)
    p4 = T(0.42 * s, -1.08 * s); p5 = T(0.62 * s, -0.55 * s)
    d = (f'M{f(p0[0])} {f(p0[1])}C{f(p1[0])} {f(p1[1])} {f(p2[0])} {f(p2[1])} {f(p3[0])} {f(p3[1])}'
         f'C{f(p4[0])} {f(p4[1])} {f(p5[0])} {f(p5[1])} {f(p0[0])} {f(p0[1])}Z')
    v = T(0, -0.8 * s)
    return (f'<path d="{d}" fill="{col}"/>'
            f'<path d="M{f(p0[0])} {f(p0[1])}L{f(v[0])} {f(v[1])}" stroke="{dark}" stroke-width="{f(max(0.6, s*0.05))}" stroke-linecap="round" opacity=".55"/>')

def leaf(cx, cy, ang, size, col):
    ca, sa = math.cos(ang), math.sin(ang)
    def T(x, y): return (cx + x * ca - y * sa, cy + x * sa + y * ca)
    a = T(0, 0); b = T(size, 0); c1 = T(size * 0.35, -size * 0.38); c2 = T(size * 0.75, -size * 0.3)
    c3 = T(size * 0.75, size * 0.28); c4 = T(size * 0.35, size * 0.36)
    return (f'<path d="M{f(a[0])} {f(a[1])}C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(b[0])} {f(b[1])}'
            f'C{f(c3[0])} {f(c3[1])} {f(c4[0])} {f(c4[1])} {f(a[0])} {f(a[1])}Z" fill="{col}"/>'
            f'<path d="M{f(a[0])} {f(a[1])}L{f(b[0])} {f(b[1])}" stroke="#1F2E19" stroke-width=".7" opacity=".45"/>')

def cluster(x, y, s):
    out = []
    n = rnd.choice([3, 3, 4, 5])
    for i in range(n):
        ang = -math.pi + i * (2 * math.pi / n) + rnd.uniform(-0.3, 0.3)
        col = rnd.choice([BOUG, BOUG, BOUG_L, '#B02A61'])
        out.append(bract(x, y, ang + math.pi / 2, s * rnd.uniform(0.85, 1.1), col, BOUG_D))
    out.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(s*0.12)}" fill="#F3E7C8"/>')
    return ''.join(out)

# main stem as a quadratic curve across the top, drooping
stem = []
W, H = 900, 360
def stem_pt(t):
    x = 30 + t * 840
    y = 40 + math.sin(t * math.pi) * 120 + t * 60
    return x, y
pts = [stem_pt(i / 60) for i in range(61)]
stem.append('<path d="M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in pts) + f'" fill="none" stroke="#5B4632" stroke-width="3.2" stroke-linecap="round"/>')
leaves, flowers = [], []
for i in range(30):
    t = rnd.uniform(0.02, 0.98); x, y = stem_pt(t)
    # little side twigs
    ang = rnd.uniform(0.3, 2.8)
    L = rnd.uniform(18, 70)
    ex, ey = x + math.cos(ang) * L, y + math.sin(ang) * L
    stem.append(f'<path d="M{f(x)} {f(y)}Q{f((x+ex)/2+rnd.uniform(-8,8))} {f((y+ey)/2)} {f(ex)} {f(ey)}" fill="none" stroke="#5B4632" stroke-width="1.6" stroke-linecap="round"/>')
    for k in range(rnd.randint(1, 3)):
        leaves.append(leaf(ex, ey, ang + rnd.uniform(-1.0, 1.0), rnd.uniform(18, 34), rnd.choice([LEAF, LEAF_D, '#5C7A44'])))
    if rnd.random() < 0.8:
        flowers.append(cluster(ex + rnd.uniform(-10, 10), ey + rnd.uniform(-6, 12), rnd.uniform(14, 24)))
for i in range(14):
    t = rnd.uniform(0, 1); x, y = stem_pt(t)
    flowers.append(cluster(x + rnd.uniform(-16, 16), y + rnd.uniform(-10, 16), rnd.uniform(16, 26)))
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="A garland of bougainvillea">'
       + ''.join(stem) + ''.join(leaves) + ''.join(flowers) + '</svg>\n')
open(f'{A}/extras/bougainvillea-garland.svg', 'w').write(svg)

# ---------------------------------------------------------------- shutter pair (sage, louvred, half open)
def louvres(x, y, w, h):
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" fill="{SAGE}"/>',
           f'<rect x="{x+7}" y="{y+8}" width="{w-14}" height="{h-16}" fill="#7F8F72"/>']
    yy = y + 10
    while yy < y + h - 12:
        out.append(f'<path d="M{x+7} {yy}h{w-14}v5H{x+7}z" fill="#A3B195"/><path d="M{x+7} {yy+5}h{w-14}v1.6H{x+7}z" fill="#5F6F58" opacity=".55"/>')
        yy += 9
    out.append(f'<rect x="{x}" y="{y+h*0.48}" width="{w}" height="7" fill="{SAGE}"/>')
    return ''.join(out)
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 300" width="320" height="300" role="img" aria-label="Sage green louvred shutters on a white wall">'
       f'<rect width="320" height="300" fill="{LIME}"/>'
       f'<rect x="96" y="40" width="128" height="200" fill="#3A3833"/><rect x="104" y="48" width="112" height="184" fill="#4B4A44"/>'
       f'<path d="M104 48h112v184H104z" fill="#7A93A6" opacity=".35"/>'
       f'<g transform="translate(96 40) skewY(-6) scale(.62 1) translate(-110 0)">{louvres(0,0,108,200)}</g>'
       f'<g transform="translate(224 40) skewY(6) scale(.62 1)">{louvres(0,0,108,200)}</g>'
       f'<path d="M88 246h144v8H88z" fill="#E4DCCD"/><path d="M88 254h144v3H88z" fill="#CFC5B3"/>'
       '</svg>\n')
open(f'{A}/extras/shutters.svg', 'w').write(svg)

# ---------------------------------------------------------------- arch frame / mask
open(f'{A}/extras/arch-mask.svg', 'w').write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width="400" height="560" preserveAspectRatio="none">'
    '<path d="M0 560V200A200 200 0 0 1 400 200V560Z" fill="#000"/></svg>\n')
open(f'{A}/extras/arch-outline.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width="400" height="560" fill="none" role="img" aria-label="Arch outline">'
    f'<path d="M8 560V200A192 192 0 0 1 392 200V560" stroke="{INK}" stroke-width="1.5"/>'
    f'<path d="M26 560V200A174 174 0 0 1 374 200V560" stroke="{INK}" stroke-width=".75" opacity=".45"/></svg>\n')

# ---------------------------------------------------------------- horizon rule (section divider)
open(f'{A}/extras/horizon-rule.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 40" width="1200" height="40" role="img" aria-label="Horizon">'
    f'<path d="M0 28H1200" stroke="{INK}" stroke-width="1" opacity=".55"/>'
    f'<path d="M584 28a16 16 0 0 1 32 0z" fill="{POPPY}"/>'
    f'<g stroke="{INK}" stroke-width=".75" opacity=".35"><path d="M520 34H680"/><path d="M548 38H652"/></g></svg>\n')

# ---------------------------------------------------------------- sun path diagram (for the live-sky widget)
arc = []
for i in range(0, 181, 3):
    t = i / 180; x = 40 + t * 520; y = 170 - math.sin(t * math.pi) * 130
    arc.append(f'{f(x)} {f(y)}')
open(f'{A}/extras/sun-path.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200" width="600" height="200" fill="none" role="img" aria-label="The arc of the sun across a day">'
    f'<path d="M20 170H580" stroke="{INK}" stroke-width="1"/>'
    f'<path d="M{" L".join(arc)}" stroke="{INK}" stroke-width="1" stroke-dasharray="2 5" stroke-linecap="round"/>'
    f'<circle cx="300" cy="40" r="9" fill="{POPPY}"/>'
    f'<g fill="{INK}" font-family="EB Garamond, Georgia, serif" font-size="14" text-anchor="middle" letter-spacing="1.5">'
    f'<text x="40" y="192">RISE</text><text x="300" y="192">NOON</text><text x="560" y="192">SET</text></g></svg>\n')

# ---------------------------------------------------------------- retired product stand-ins
glyphs = {
    'polyglot-pilot': f'<path d="M38 62h26a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8h-8l-8 8v-8h-10a8 8 0 0 1-8-8V70a8 8 0 0 1 8-8z" stroke="{SAGE_D}" stroke-width="2.4" fill="none"/><path d="M58 76h22a8 8 0 0 1 8 8v10a8 8 0 0 1-8 8h-4v7l-7-7h-11a8 8 0 0 1-8-8" stroke="{POPPY}" stroke-width="2.4" fill="none"/>',
    'pinpoint': f'<path d="M60 108s-20-20-20-36a20 20 0 0 1 40 0c0 16-20 36-20 36z" stroke="{SAGE_D}" stroke-width="2.4" fill="none"/><circle cx="60" cy="72" r="7" fill="{POPPY}"/>',
    'webvakt': f'<path d="M30 82c8-14 18-21 30-21s22 7 30 21c-8 14-18 21-30 21s-22-7-30-21z" stroke="{SAGE_D}" stroke-width="2.4" fill="none"/><circle cx="60" cy="82" r="9" fill="{POPPY}"/>',
    'joke-central': f'<circle cx="60" cy="80" r="24" stroke="{SAGE_D}" stroke-width="2.4" fill="none"/><path d="M48 86a14 14 0 0 0 24 0" stroke="{POPPY}" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="51" cy="74" r="2.4" fill="{SAGE_D}"/><circle cx="69" cy="74" r="2.4" fill="{SAGE_D}"/>',
    'tryggere-hyring': f'<path d="M60 56l22 8v16c0 14-10 24-22 28-12-4-22-14-22-28V64z" stroke="{SAGE_D}" stroke-width="2.4" fill="none"/><path d="M50 81l7 7 14-15" stroke="{POPPY}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    'early-apps': f'<circle cx="47" cy="68" r="7" stroke="{SAGE_D}" stroke-width="2.4" fill="none"/><circle cx="73" cy="96" r="7" stroke="{SAGE_D}" stroke-width="2.4" fill="none"/><path d="M78 62L42 102" stroke="{POPPY}" stroke-width="2.6" stroke-linecap="round"/>',
}
names = {'polyglot-pilot': 'Polyglot Pilot', 'pinpoint': 'PinPoint', 'webvakt': 'WebVakt', 'joke-central': 'Joke Central',
         'tryggere-hyring': 'Tryggere Hyring', 'early-apps': 'Early apps'}
for k, g in glyphs.items():
    open(f'{A}/products/retired/{k}.svg', 'w').write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150" width="120" height="150" role="img" aria-label="{names[k]} (retired)">'
        f'<path d="M6 150V60a54 54 0 0 1 108 0v90z" fill="{SAND}"/>'
        f'<path d="M12 150V60a48 48 0 0 1 96 0v90" fill="none" stroke="{INK}" stroke-width=".8" opacity=".35"/>'
        f'{g}'
        f'<text x="60" y="136" text-anchor="middle" font-family="EB Garamond, Georgia, serif" font-size="9" letter-spacing=".7" fill="{INK}">{names[k].upper()}</text>'
        '</svg>\n')
print('ok')
