"""Outline text in Jost at a given weight with tracking; prints JSON {d, width, ascent} in font units scaled to size."""
import sys, json
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

font_path, text, weight, size, tracking = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
f = TTFont(font_path)
if 'fvar' in f:
    f = instantiateVariableFont(f, {'wght': weight})
gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
s = size / upm
pen = SVGPathPen(gs)
x = 0.0
for i, ch in enumerate(text):
    if ch == ' ':
        x += f['hmtx'][cmap[32]][0] * s + tracking * size
        continue
    gn = cmap[ord(ch)]
    tp = TransformPen(pen, (s, 0, 0, -s, x, 0))
    gs[gn].draw(tp)
    x += f['hmtx'][gn][0] * s
    if i < len(text) - 1:
        x += tracking * size
cap = f['OS/2'].sCapHeight * s
print(json.dumps({'d': pen.getCommands(), 'width': round(x, 2), 'cap': round(cap, 2)}))
