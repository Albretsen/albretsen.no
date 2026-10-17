"""Convert text to SVG path data using a (variable) woff2 font. Prints JSON {d, width, ascent, descent}."""
import sys, json, io
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

def text_path(fontfile, text, wght=None, size=100, tracking=0.0, x0=0.0, y0=0.0):
    f = TTFont(fontfile)
    if wght is not None and 'fvar' in f:
        f = instancer.instantiateVariableFont(f, {'wght': wght})
    gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    sc = size / upm
    pen = SVGPathPen(gs)
    x = 0.0
    kern = {}
    names = [cmap[ord(c)] for c in text]
    for i, gn in enumerate(names):
        tp = TransformPen(pen, (sc, 0, 0, -sc, x0 + x, y0))
        gs[gn].draw(tp)
        x += gs[gn].width * sc + tracking * size
    asc = f['hhea'].ascent * sc; desc = f['hhea'].descent * sc
    capH = getattr(f['OS/2'], 'sCapHeight', 0) * sc
    xH = getattr(f['OS/2'], 'sxHeight', 0) * sc
    return {'d': pen.getCommands(), 'width': x - tracking * size, 'ascent': asc, 'descent': desc, 'cap': capH, 'xh': xH}

if __name__ == '__main__':
    fontfile, text, wght, size, tracking = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
    print(json.dumps(text_path(fontfile, text, wght, size, tracking)))
