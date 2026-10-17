"""Identity for design 73 'Long Evening': mark, wordmark (outlined Nunito 800), favicon."""
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

T = './work/'  # scratch dir: pd/seeamerica.jpg (Wikimedia Commons, LCCN 98518589), dl/Nunito.ttf
A = '../identity/'
PALM, PEACH, MAUVE, SMOG, CREAM, FALU = '#1d1f24', '#f6b48f', '#b391a8', '#7e8fb0', '#fbf5ec', '#9e3b2e'

def text_path(text, wght=800, size=100, tracking=-0.01):
    f = TTFont(T + 'dl/Nunito.ttf')
    f = instantiateVariableFont(f, {'wght': wght})
    gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    hmtx = f['hmtx']; scale = size / upm
    x = 0; parts = []; minx = miny = 1e9; maxx = maxy = -1e9
    kern = None
    for ch in text:
        gn = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[gn].draw(pen)
        d = pen.getCommands()
        bp = BoundsPen(gs); gs[gn].draw(bp)
        if bp.bounds:
            x0, y0, x1, y1 = bp.bounds
            minx = min(minx, x + x0 * scale); maxx = max(maxx, x + x1 * scale)
            miny = min(miny, -y1 * scale); maxy = max(maxy, -y0 * scale)
        if d:
            parts.append(f'<path transform="translate({x:.2f} 0) scale({scale:.5f} {-scale:.5f})" d="{d}"/>')
        x += hmtx[gn][0] * scale + tracking * size
    return parts, (minx, miny, maxx, maxy), x

def mark_svg(gable=PALM, sun=PEACH, bg=None, size=64, title='Albretsen AS'):
    # A gable (the wooden house) holding a striped, setting sun (the deco sunset).
    # The stripes are cut with a mask, so the mark stays one shape and works in one colour.
    bgrect = f'<rect width="64" height="64" rx="14" fill="{bg}"/>' if bg else ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="{size}" height="{size}" role="img" aria-label="{title}">
  <title>{title}</title>
  {bgrect}
  <defs>
    <clipPath id="m73"><rect x="0" y="0" width="64" height="41"/></clipPath>
  </defs>
  <circle cx="32" cy="40.4" r="8.8" fill="{sun}" clip-path="url(#m73)"/>
  <path d="M13 55 L32 9 L51 55" fill="none" stroke="{gable}" stroke-width="8.4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19.4 43.6 H44.6" fill="none" stroke="{gable}" stroke-width="6" stroke-linecap="round"/>
</svg>'''

def wordmark_svg(color=PALM, sun=PEACH, gable=PALM, with_mark=True):
    parts, (x0, y0, x1, y1), adv = text_path('Albretsen', 800, 100, -0.012)
    pas, b2, adv2 = text_path('AS', 700, 44, 0.04)
    gap = 14
    txt_x = 0
    out = []
    if with_mark:
        # the mark IS the A: sun-A replaces the first letter, the rest is Nunito 800
        rest, (rx0, ry0, rx1, ry1), radv = text_path('lbretsen', 800, 100, -0.012)
        capA = text_path('A', 800, 100)[1]
        cap_h = -capA[1]
        s = cap_h / (59.2 - 4.8)
        inner = mark_svg(gable, sun).split('\n', 1)[1].rsplit('</svg>', 1)[0].replace('<title>Albretsen AS</title>', '').replace('m73', 'm73w')
        out.append(f'<g transform="translate({-8.8 * s:.2f} {-59.2 * s:.2f}) scale({s:.4f})">' + inner + '</g>')
        a_w = (55.2 - 8.8) * s + 3
        out.append(f'<g fill="{color}" transform="translate({a_w:.2f} 0)">' + ''.join(rest) + '</g>')
        adv = a_w + radv
        y0 = min(y0, -cap_h)
    else:
        out.append(f'<g fill="{color}" transform="translate({txt_x:.2f} 0)">' + ''.join(parts) + '</g>')
    out.append(f'<g fill="{color}" opacity="0.62" transform="translate({txt_x + adv + gap:.2f} 0)">' + ''.join(pas) + '</g>')
    W = txt_x + adv + gap + adv2 + 2
    top = y0 - 4
    H = (y1 - top) + 6
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-2:.0f} {top:.2f} {W + 4:.2f} {H:.2f}" role="img" aria-label="Albretsen AS">
<title>Albretsen AS</title>
{chr(10).join(out)}
</svg>'''

open(A + 'mark.svg', 'w').write(mark_svg())
mono = mark_svg(gable='currentColor', sun='currentColor')
_unused = (
    '<rect width="64" height="64" fill="#fff"/>',
    '<rect width="64" height="64" fill="#fff"/>\n      <circle cx="32" cy="40" r="12.4" fill="#000"/>\n      <circle cx="32" cy="40" r="10.2" fill="#fff"/>')
open(A + 'mark-mono.svg', 'w').write(mono)
open(A + 'favicon.svg', 'w').write(mark_svg(gable=CREAM, sun=PEACH, bg=PALM, size=64))
open(A + 'wordmark.svg', 'w').write(wordmark_svg(with_mark=False))
open(A + 'lockup.svg', 'w').write(wordmark_svg(with_mark=True))
open(A + 'lockup-light.svg', 'w').write(wordmark_svg(color=CREAM, sun=PEACH, gable=CREAM, with_mark=True))
print('ok')
