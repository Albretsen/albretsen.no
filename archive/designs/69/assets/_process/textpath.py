"""Text -> SVG path data using Albert Sans at a given weight. usage: textpath.py TEXT WEIGHT SIZE TRACKING_EM"""
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen


def text_path(text, weight=300, size=100, tracking=0.0, font='fonts/AlbertSans-VF.ttf'):
    f = TTFont(font)
    f = instantiateVariableFont(f, {'wght': weight})
    gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    s = size / upm
    x = 0; ds = []
    for ch in text:
        gn = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        tp = TransformPen(pen, (s, 0, 0, -s, x, 0))
        gs[gn].draw(tp)
        ds.append(pen.getCommands())
        x += gs[gn].width * s + tracking * size
    x -= tracking * size
    asc = f['OS/2'].sCapHeight * s
    return ' '.join(ds), x, asc


if __name__ == '__main__':
    d, w, cap = text_path(sys.argv[1], int(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]))
    print(w, cap); print(d[:200])
