import sys; sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.Xjwh7Qx8vB/scr')
from hl import COL, hexc, OUT, R
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
import os
os.makedirs(OUT + 'identity', exist_ok=True)
U, O, S, V, P, E = (hexc(COL[k]) for k in ('umber', 'ochre', 'spark', 'vellum', 'peat', 'ember'))

def text_path(fontfile, text, size, x=0, y=0, track=0):
    f = TTFont(fontfile); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    hmtx = f['hmtx']; sc = size / upm
    d = []; cx = x
    kern = {}
    for ch in text:
        gn = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        tp = TransformPen(pen, (sc, 0, 0, -sc, cx, y))
        gs[gn].draw(tp)
        d.append(pen.getCommands())
        cx += hmtx[gn][0] * sc + track
    return ' '.join(d), cx - track

# ---- the mark: a sun on the horizon, its reflection set as halftone ----
def mark_elems(cx=32, cy=33, r=22, col=O, dotcol=None, rows=None, pitch=None, gap=None):
    """sun on the horizon; its reflection as a tapering halftone (glitter path)."""
    dotcol = dotcol or col
    k = r / 22.0
    pitch = pitch or 4.4 * k
    gap = gap if gap is not None else 1.6 * k
    el = [f'<path d="M{cx-r:.2f} {cy:.2f}A{r:.2f} {r:.2f} 0 0 1 {cx+r:.2f} {cy:.2f}Z" fill="{col}"/>']
    nrows = 5
    for i in range(nrows):
        t = i / (nrows - 1)
        y = cy + gap + pitch * 0.5 + i * pitch * 0.87
        half = r * (1 - 0.5 * t)
        off = (pitch / 2) if i % 2 else 0
        n = int(half / pitch) + 1
        for j in range(-n, n + 1):
            x = j * pitch + off
            if abs(x) > half: continue
            u = abs(x) / half
            rad = pitch * 0.5 * (1 - 0.78 * t) * (1 - u ** 2) ** 0.5
            if rad < 0.28 * k: continue
            el.append(f'<circle cx="{cx + x:.2f}" cy="{y:.2f}" r="{rad:.2f}" fill="{dotcol}"/>')
    return '\n  '.join(el)

def svg(w, h, body, extra=''):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"{extra}>\n  {body}\n</svg>\n'

open(OUT + 'identity/mark.svg', 'w').write(svg(64, 64, mark_elems(), ' role="img" aria-label="Albretsen AS"'))
open(OUT + 'identity/mark-currentcolor.svg', 'w').write(svg(64, 64, mark_elems(col='currentColor')))
open(OUT + 'identity/mark-ink.svg', 'w').write(svg(64, 64, mark_elems(col=U)))
fav = f'<rect width="64" height="64" rx="14" fill="{U}"/>\n  ' + mark_elems(cx=32, cy=30, r=20, col=O)
open(OUT + 'identity/favicon.svg', 'w').write(svg(64, 64, fav))

SER = R + 'dl/InstrumentSerif-Regular.ttf'; MONO = R + 'dl/GeistMono.ttf'
word, wx = text_path(SER, 'Albretsen', 72, 0, 64, track=0.5)
asd, ax = text_path(MONO, 'AS', 15, wx + 12, 64, track=3)
W = round(ax + 2)
open(OUT + 'identity/wordmark.svg', 'w').write(svg(W, 84, f'<path fill="{V}" d="{word}"/>\n  <path fill="{O}" d="{asd}"/>', ' role="img" aria-label="Albretsen AS"'))
open(OUT + 'identity/wordmark-ink.svg', 'w').write(svg(W, 84, f'<path fill="{U}" d="{word}"/>\n  <path fill="{E}" d="{asd}"/>'))
open(OUT + 'identity/wordmark-currentcolor.svg', 'w').write(svg(W, 84, f'<path fill="currentColor" d="{word}"/>\n  <path fill="currentColor" d="{asd}"/>'))
# lockup: mark + wordmark
m = mark_elems(cx=40, cy=46, r=30)
word2, wx2 = text_path(SER, 'Albretsen', 72, 92, 70, track=0.5)
asd2, ax2 = text_path(MONO, 'AS', 15, wx2 + 12, 70, track=3)
LW = round(ax2 + 4)
open(OUT + 'identity/lockup.svg', 'w').write(svg(LW, 100, m + f'\n  <path fill="{V}" d="{word2}"/>\n  <path fill="{O}" d="{asd2}"/>', ' role="img" aria-label="Albretsen AS"'))
open(OUT + 'identity/lockup-ink.svg', 'w').write(svg(LW, 100, mark_elems(cx=40, cy=46, r=30, col=E) + f'\n  <path fill="{U}" d="{word2}"/>\n  <path fill="{E}" d="{asd2}"/>'))
print('wordmark', W, 'lockup', LW)
