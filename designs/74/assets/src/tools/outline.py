# Outline text from a (variable) font into SVG path data with tracking.
# usage: outline.py font.woff2 "TEXT" weight size tracking_em -> prints JSON {d, width, ascent}
import sys, json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.varLib.instancer import instantiateVariableFont
font_path, text, weight, size, track = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
f = TTFont(font_path)
if 'fvar' in f: f = instantiateVariableFont(f, {'wght': weight})
gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm; sc = size / upm
hmtx = f['hmtx']; x = 0; pen = SVGPathPen(gs)
for i, ch in enumerate(text):
    if ch == ' ': x += hmtx[cmap[32]][0] * sc + size * track; continue
    g = cmap[ord(ch)]
    tp = TransformPen(pen, (sc, 0, 0, -sc, x, 0)); gs[g].draw(tp)
    x += hmtx[g][0] * sc + (size * track if i < len(text) - 1 else 0)
cap = f['OS/2'].sCapHeight * sc if hasattr(f['OS/2'], 'sCapHeight') else size * 0.7
print(json.dumps({'d': pen.getCommands(), 'width': round(x, 2), 'cap': round(cap, 2)}))
