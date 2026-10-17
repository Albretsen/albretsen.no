#!/usr/bin/env python3
"""Builds the identity SVGs (mark, wordmark, lockup, favicon) with the wordmark set in
EB Garamond and converted to outlines, so the SVGs need no font at runtime.
usage: identity.py /path/to/EBGaramond[wght].ttf OUTDIR
"""
import sys, os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

INK = '#2A2420'; POPPY = '#E4572E'; SAND = '#EFE4D2'; LIME = '#F6F1E8'; SAGE = '#5F6F58'

def instance(w):
    f = TTFont(src)
    return instantiateVariableFont(f, {'wght': w})

def text_path(font, text, size, x0=0, y0=0, tracking=0.0):
    """Return (svg path d, advance width) for text at size with baseline at y0."""
    cmap = font.getBestCmap(); gs = font.getGlyphSet(); upm = font['head'].unitsPerEm
    s = size / upm
    hmtx = font['hmtx']
    kern = {}
    # simple GPOS pair kerning is skipped; Garamond spacing is good at display sizes with light tracking
    d = []; x = x0
    for ch in text:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs, ntos=lambda v: ('%.1f' % v).rstrip('0').rstrip('.'))
        tp = TransformPen(pen, (s, 0, 0, -s, x, y0))
        gs[g].draw(tp)
        d.append(pen.getCommands())
        x += hmtx[g][0] * s + tracking * size
    return ' '.join(d), x - x0 - tracking * size

# ---- mark: an arch that is also an A; the horizon is the crossbar, the sun sits on it
MARK_INNER = f'''
  <path d="M15 57V29.5a17 17 0 0 1 34 0V57" fill="none" stroke="{{ink}}" stroke-width="6.6" stroke-linecap="butt"/>
  <path d="M18.3 41.5h27.4" stroke="{{ink}}" stroke-width="2.6"/>
  <path d="M25.2 40a6.8 6.8 0 0 1 13.6 0z" fill="{{sun}}"/>'''

def mark(ink=INK, sun=POPPY):
    return MARK_INNER.replace('{ink}', ink).replace('{sun}', sun)

open(f'{out}/mark.svg', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Albretsen AS">
  <title>Albretsen AS</title>{mark()}
</svg>
''')
open(f'{out}/mark-light.svg', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Albretsen AS">
  <title>Albretsen AS</title>{mark(LIME, '#F08A5D')}
</svg>
''')

f500 = instance(470)
d, w = text_path(f500, 'Albretsen', 100, 0, 100, tracking=0.012)
W = int(w + 4)
open(f'{out}/wordmark.svg', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} 128" width="{W}" height="128" role="img" aria-label="Albretsen">
  <title>Albretsen</title>
  <path fill="{INK}" d="{d}"/>
</svg>
''')
open(f'{out}/wordmark-currentcolor.svg', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} 128" width="{W}" height="128" role="img" aria-label="Albretsen">
  <title>Albretsen</title>
  <path fill="currentColor" d="{d}"/>
</svg>
''')

# ---- lockup: mark + Albretsen + small tracked AS
f400 = instance(430)
d2, w2 = text_path(f400, 'Albretsen', 64, 84, 62, tracking=0.012)
d3, w3 = text_path(instance(560), 'AS', 22, 84 + w2 + 14, 62, tracking=0.14)
LW = int(84 + w2 + 14 + w3 + 6)
open(f'{out}/lockup.svg', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {LW} 80" width="{LW}" height="80" role="img" aria-label="Albretsen AS">
  <title>Albretsen AS</title>
  <g transform="translate(0 4) scale(1.1)">{mark()}</g>
  <path fill="{INK}" d="{d2}"/>
  <path fill="{SAGE}" d="{d3}"/>
</svg>
''')

# ---- favicon: mark on a warm lime square with soft corners; dark scheme flips it
open(f'{out}/favicon.svg', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <style>
    .bg{{fill:{SAND}}} .ink{{stroke:{INK}}} .sun{{fill:{POPPY}}}
    @media (prefers-color-scheme: dark) {{ .bg{{fill:#22293A}} .ink{{stroke:{LIME}}} .sun{{fill:#F08A5D}} }}
  </style>
  <rect class="bg" width="64" height="64" rx="14"/>
  <g transform="translate(6.4 5.8) scale(0.8)">
    <path class="ink" d="M15 57V29.5a17 17 0 0 1 34 0V57" fill="none" stroke-width="8.5"/>
    <path class="ink" d="M18.8 41.5h26.4" stroke-width="3.6"/>
    <path class="sun" d="M25.2 40a6.8 6.8 0 0 1 13.6 0z"/>
  </g>
</svg>
''')
# flat version (no media query) used to rasterise the PNG touch icon
open(f'{out}/favicon-flat.svg', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect fill="{SAND}" width="64" height="64"/>
  <g transform="translate(6.4 5.8) scale(0.8)">
    <path stroke="{INK}" d="M15 57V29.5a17 17 0 0 1 34 0V57" fill="none" stroke-width="8.5"/>
    <path stroke="{INK}" d="M18.8 41.5h26.4" stroke-width="3.6"/>
    <path fill="{POPPY}" d="M25.2 40a6.8 6.8 0 0 1 13.6 0z"/>
  </g>
</svg>
''')
print('ok', W, LW)
