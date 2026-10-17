"""Shape text with HarfBuzz and emit SVG path data (variable font instances)."""
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.varLib import instancer
import io
T = '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.gnTd028yfQ'
_cache = {}

def font(name, axes):
    key = (name, tuple(sorted(axes.items())))
    if key in _cache: return _cache[key]
    f = TTFont(f'{T}/fonts/{name}.ttf')
    inst = instancer.instantiateVariableFont(f, axes)
    b = io.BytesIO(); inst.save(b); data = b.getvalue()
    tt = TTFont(io.BytesIO(data))
    _cache[key] = (data, tt)
    return _cache[key]

def text_path(text, name, axes, size, x=0, y=0, tracking=0, features=None):
    """Returns (path_d, advance_width) for text at font-size `size`, baseline at y."""
    data, tt = font(name, axes)
    face = hb.Face(data); f = hb.Font(face)
    upem = face.upem
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(f, buf, features or {'kern': True, 'liga': True})
    gs = tt.getGlyphSet(); order = tt.getGlyphOrder()
    s = size / upem
    pen = SVGPathPen(gs, lambda v: f'{v:.2f}'.rstrip('0').rstrip('.'))
    cx = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        gname = order[info.codepoint]
        tp = TransformPen(pen, (s, 0, 0, -s, x + (cx + pos.x_offset) * s, y - pos.y_offset * s))
        gs[gname].draw(tp)
        cx += pos.x_advance + tracking * upem
    return pen.getCommands(), cx * s - tracking * upem * s

def metrics(name, axes):
    data, tt = font(name, axes)
    os2 = tt['OS/2']; return tt['head'].unitsPerEm, os2.sCapHeight, os2.sxHeight
