"""Sun-faded stand-in tiles for retired products (no surviving brand assets).
Each is a small glazed tile whose colour has bleached in the sun: a serif monogram and a faded diagonal."""
import sys, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
OUT = os.path.join(sys.argv[1], 'products', 'retired'); os.makedirs(OUT, exist_ok=True)
f = TTFont('fonts/InstrumentSerif-Regular.ttf'); fi = TTFont('fonts/InstrumentSerif-Italic.ttf')

def glyphs(font, text, size):
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); s = size / font['head'].unitsPerEm
    x = 0; out = []
    xs = []
    for ch in text:
        g = gs[cmap[ord(ch)]]; xs.append(x); x += g.width * s
    total = x
    # bounds for vertical centring
    bp = BoundsPen(gs)
    for i, ch in enumerate(text):
        gs[cmap[ord(ch)]].draw(TransformPen(bp, (s, 0, 0, -s, xs[i], 0)))
    x0, y0, x1, y1 = bp.bounds
    for i, ch in enumerate(text):
        pen = SVGPathPen(gs)
        gs[cmap[ord(ch)]].draw(TransformPen(pen, (s, 0, 0, -s, xs[i] - (x0 + x1) / 2, -(y0 + y1) / 2)))
        out.append(pen.getCommands())
    return ' '.join(out)

items = [
    ('polyglot-pilot', 'Pp', fi, '#D9B8A0', '#B9866A', 'Polyglot Pilot, 2025'),
    ('pinpoint', 'P', f, '#C8D5C0', '#8EA383', 'PinPoint, 2025'),
    ('webvakt', 'W', f, '#C9D9E4', '#86A5BE', 'WebVakt, 2024'),
    ('joke-central', 'J', fi, '#EBD6A6', '#C9A15A', 'Daily Jokes / Joke Central, 2024'),
    ('tryggere-hyring', 'Th', f, '#D7CCD9', '#A493A8', 'Tryggere Hyring, 2023'),
    ('early-apps', '%', f, '#E6DCCB', '#B8A88E', 'IAGO HMS, Rentekalkulator, Prosentkalkulator, 2021'),
]
for slug, txt, font, bg, ink, title in items:
    d = glyphs(font, txt, 62 if len(txt) == 1 else 50)
    extra = ''
    if slug == 'pinpoint':  # a tiny pin dot over the P, the game's one idea
        extra = f'<circle cx="51" cy="17" r="4" fill="{ink}"/>'
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80" role="img" aria-label="{title} (retired)"><title>{title} (retired)</title>
<defs><linearGradient id="f-{slug}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<rect x="2" y="2" width="76" height="76" rx="18" fill="{bg}"/>
<rect x="2" y="2" width="76" height="76" rx="18" fill="url(#f-{slug})"/>
<rect x="2.5" y="2.5" width="75" height="75" rx="17.5" fill="none" stroke="#fff" stroke-opacity=".5"/>
<g transform="translate(40 41)"><path d="{d}" fill="{ink}"/></g>{extra}
</svg>
'''
    open(os.path.join(OUT, slug + '.svg'), 'w').write(svg)
print('ok')
