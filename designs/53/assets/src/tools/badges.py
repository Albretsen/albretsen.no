import sys; sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.Xjwh7Qx8vB/scr')
from hl import COL, hexc, OUT
from identity import mark_elems, SER, MONO
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import math, os
os.makedirs(OUT + 'stickers', exist_ok=True)
U, O, S, V, E, C = (hexc(COL[k]) for k in ('umber', 'ochre', 'spark', 'vellum', 'ember', 'clay'))
f = TTFont(MONO); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm; hm = f['hmtx']

def ring_text(text, cx, cy, R, size, track=0.0):
    sc = size / upm
    adv = [hm[cmap[ord(c)]][0] * sc + track for c in text]
    total = sum(adv); circ = 2 * math.pi * R
    # stretch tracking to fill the circle exactly
    extra = (circ - total) / len(text)
    paths = []; s = 0
    for c, a in zip(text, adv):
        a2 = a + extra
        mid = s + a2 / 2
        th = mid / circ * 2 * math.pi - math.pi / 2
        x = cx + R * math.cos(th); y = cy + R * math.sin(th)
        rot = th + math.pi / 2
        gw = hm[cmap[ord(c)]][0] * sc
        pen = SVGPathPen(gs)
        cr, sr = math.cos(rot), math.sin(rot)
        # glyph local: x from -gw/2, baseline at +size*.35 (centre the cap height on the ring)
        ox, oy = -gw / 2, size * .36
        tp = TransformPen(pen, (sc * cr, sc * sr, sc * sr * 1, -sc * cr, x + ox * cr - oy * sr, y + ox * sr + oy * cr))
        # transform: [a b c d e f] maps (gx,gy)->(a*gx + c*gy + e, b*gx + d*gy + f); flip y for font space
        tp = TransformPen(pen, (sc * cr, sc * sr, sc * sr, -sc * cr, x + ox * cr - oy * sr, y + ox * sr + oy * cr))
        gs[cmap[ord(c)]].draw(tp)
        paths.append(pen.getCommands())
        s += a2
    return ' '.join(paths)

def badge(name, text, bg, fg, ring, markcol):
    S_ = 240; c = 120
    d = ring_text(text, c, c, 92, 15)
    body = (f'<circle cx="{c}" cy="{c}" r="118" fill="{bg}"/>'
            f'<circle cx="{c}" cy="{c}" r="111" fill="none" stroke="{ring}" stroke-width="1"/>'
            f'<circle cx="{c}" cy="{c}" r="73" fill="none" stroke="{ring}" stroke-width="1"/>'
            f'<path d="{d}" fill="{fg}"/>' + mark_elems(cx=c, cy=c - 4, r=40, col=markcol))
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S_} {S_}" width="{S_}" height="{S_}" role="img" aria-label="{text.strip(" ·")}">{body}</svg>\n'
    open(OUT + f'stickers/{name}.svg', 'w').write(svg); print(name, round(len(svg) / 1024), 'KB')

badge('badge-play-2016', 'ON GOOGLE PLAY SINCE 2016 · ALBRETSEN AS · ', U, V, O, O)
badge('badge-59n', 'BUILT AT 59° NORTH · OSLO · NORWAY · ', O, U, U, U)
