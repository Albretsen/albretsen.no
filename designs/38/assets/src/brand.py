# Identity generator for design 38 "Salon Refusé".
# Needs fontTools; fonts are read from FONTDIR (Instrument Serif Italic, JetBrains Mono VF, OFL).
# usage: python brand.py FONTDIR OUTDIR
import sys, math, json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.varLib import instancer

FONTDIR, OUT = sys.argv[1], sys.argv[2]

# ---------------------------------------------------------------- colour
def oklch_to_hex(L, C, h):
    a, b = C * math.cos(math.radians(h)), C * math.sin(math.radians(h))
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    def enc(x):
        x = max(0.0, min(1.0, x))
        return 12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055
    return '#%02x%02x%02x' % tuple(round(enc(v) * 255) for v in (r, g, bb))

P = {
    'wall':      (0.36, 0.06, 168),
    'wall-deep': (0.22, 0.045, 168),
    'night':     (0.15, 0.03, 168),
    'ink':       (0.2, 0.02, 168),
    'paper':     (0.955, 0.012, 95),
    'paper-2':   (0.91, 0.02, 85),
    'gilt':      (0.74, 0.11, 82),
    'spark':     (0.8, 0.15, 168),
    'uv-ground': (0.17, 0.07, 292),
    'uv-ink':    (0.9, 0.21, 140),
    'uv-cyan':   (0.86, 0.13, 205),
    'uv-rose':   (0.74, 0.2, 340),
    'red-dot':   (0.6, 0.22, 27),
}
SPECTRUM = [168, 228, 288, 348, 48, 108]
for i, h in enumerate(SPECTRUM):
    P[f's{i}-{h}'] = (0.72, 0.15, h)
pal = {k: {'oklch': f'oklch({L} {C} {h})', 'hex': oklch_to_hex(L, C, h)} for k, (L, C, h) in P.items()}
json.dump(pal, open(f'{OUT}/palette.json', 'w'), indent=1)
X = {k: v['hex'] for k, v in pal.items()}
print(json.dumps(X, indent=1))

# ---------------------------------------------------------------- text to path
def text_path(font, text, size, x=0, y=0, tracking=0):
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font['head'].unitsPerEm
    k = size / upm; ds = []; cx = x
    for ch in text:
        gname = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        tp = TransformPen(pen, (k, 0, 0, -k, cx, y))
        gs[gname].draw(tp)
        ds.append(pen.getCommands())
        cx += gs[gname].width * k + tracking * size
    return ' '.join(d for d in ds if d), cx

serif = TTFont(f'{FONTDIR}/InstrumentSerif-Italic.ttf')
mono = instancer.instantiateVariableFont(TTFont(f'{FONTDIR}/JetBrainsMono.ttf'), {'wght': 600})

# ---------------------------------------------------------------- mark
# A nail, a taut wire, a crooked frame. The wire + the frame's top edge draw an A.
def mark_geom(tilt=-7, side=30, cx=32, cy=39.5, nail=(32, 7.5)):
    t = math.radians(tilt); h = side / 2
    def rot(px, py):
        return (cx + px * math.cos(t) - py * math.sin(t), cy + px * math.sin(t) + py * math.cos(t))
    corners = [rot(-h, -h), rot(h, -h), rot(h, h), rot(-h, h)]
    return corners, nail
corners, nail = mark_geom()
fmt = lambda p: f'{p[0]:.2f} {p[1]:.2f}'
frame_d = 'M' + ' L'.join(fmt(c) for c in corners) + ' Z'
wire_d = f'M{fmt(corners[0])} L{fmt(nail)} L{fmt(corners[1])}'
# spark inside the frame: four-point star, rotated with the frame
def star(cx, cy, r, inner=0.28, rot=-7):
    pts = []
    for i in range(8):
        a = math.radians(rot + i * 45 - 90); rr = r if i % 2 == 0 else r * inner
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return 'M' + ' L'.join(fmt(p) for p in pts) + ' Z'
fc = (sum(c[0] for c in corners) / 4, sum(c[1] for c in corners) / 4)

def mark_svg(ink, spark, bg=None, size=64, stroke=3.4, title='Albretsen AS'):
    bgr = f'<rect width="64" height="64" rx="14" fill="{bg}"/>' if bg else ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="{size}" height="{size}" role="img" aria-label="{title}"><title>{title}</title>{bgr}
<path d="{wire_d}" fill="none" stroke="{ink}" stroke-width="{stroke * 0.62:.2f}" stroke-linecap="round" stroke-linejoin="miter"/>
<path d="{frame_d}" fill="none" stroke="{ink}" stroke-width="{stroke}" stroke-linejoin="miter"/>
<path d="{star(fc[0], fc[1] + 0.5, 9.5)}" fill="{spark}"/>
<circle cx="{nail[0]}" cy="{nail[1]}" r="3.3" fill="{spark}"/>
</svg>
'''
open(f'{OUT}/mark.svg', 'w').write(mark_svg(X['ink'], X['s0-168']))
open(f'{OUT}/mark-on-dark.svg', 'w').write(mark_svg(X['paper'], X['spark']))
open(f'{OUT}/mark-gilt.svg', 'w').write(mark_svg(X['gilt'], X['spark']))
fav = mark_svg(X['paper'], X['spark'], bg=X['wall-deep'], stroke=4.4)
open(f'{OUT}/favicon.svg', 'w').write(fav)

# ---------------------------------------------------------------- wordmark
def wordmark(ink, spark, sub):
    d, end = text_path(serif, 'Albretsen', 100, x=0, y=100, tracking=-0.01)
    d2, end2 = text_path(mono, 'AS', 26, x=end + 14, y=100, tracking=0.08)
    # nail above the A apex; the A apex in Instrument Serif Italic sits at about x=50
    W = math.ceil(end2 + 4)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 0 {W + 4} 128" width="{W + 4}" height="128" role="img" aria-label="Albretsen AS"><title>Albretsen AS</title>
<circle cx="60" cy="12" r="6" fill="{spark}"/>
<path d="{d}" fill="{ink}"/>
<path d="{d2}" fill="{sub}"/>
<path d="M{end + 14:.1f} 112 H{end2:.1f}" stroke="{sub}" stroke-width="2"/>
</svg>
'''
open(f'{OUT}/wordmark.svg', 'w').write(wordmark(X['ink'], X['s0-168'], X['ink']))
open(f'{OUT}/wordmark-on-dark.svg', 'w').write(wordmark(X['paper'], X['spark'], X['gilt']))

# lockup: mark + wordmark
d, end = text_path(serif, 'Albretsen', 64, x=84, y=62, tracking=-0.01)
d2, end2 = text_path(mono, 'AS', 17, x=end + 10, y=62, tracking=0.08)
for name, ink, spark in [('lockup', X['ink'], X['s0-168']), ('lockup-on-dark', X['paper'], X['spark'])]:
    open(f'{OUT}/{name}.svg', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {math.ceil(end2 + 4)} 80" width="{math.ceil(end2 + 4)}" height="80" role="img" aria-label="Albretsen AS"><title>Albretsen AS</title>
<g transform="translate(2 6) scale(1.06)">{mark_svg(ink, spark).split('</title>')[1].replace('</svg>', '')}</g>
<path d="{d}" fill="{ink}"/><path d="{d2}" fill="{ink}" opacity=".8"/>
</svg>
''')
print('ok')
