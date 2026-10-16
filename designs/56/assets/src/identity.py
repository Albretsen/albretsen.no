import sys, os
sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.ARFqOUlHoH/s')
import numpy as np
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from lib import bayer

T = '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.ARFqOUlHoH'
OUT = sys.argv[1]
os.makedirs(f'{OUT}/brand', exist_ok=True)
INK = '#052517'; FOREST = '#14422b'; CREAM = '#f9f2e2'; BRASS = '#c59a44'; PULSE = '#e03c63'

A = [
 ".....##.....",
 "....####....",
 "....####....",
 "...###.##...",
 "...##..##...",
 "..###..###..",
 "..########..",
 ".##########.",
 ".###....###.",
 "###......###",
 "##........##",
 "##........##",
]
S = 4  # subcells per letter pixel
B = bayer(8)

def mark_rects(dither=True, x0=0, y0=0, unit=1.0):
    rects = []
    rows = len(A)
    for r, line in enumerate(A):
        # density: top rows dissolve (breath), bottom is solid
        d = 1.0 if r >= 6 else [0.26, 0.38, 0.5, 0.62, 0.76, 0.9][r]
        for c, ch in enumerate(line):
            if ch != '#': continue
            if not dither or d >= 1.0:
                rects.append((x0 + c*unit, y0 + r*unit, unit, unit)); continue
            su = unit / S
            for sy in range(S):
                for sx in range(S):
                    gy, gx = r*S+sy, c*S+sx
                    dd = min(1.0, 0.18 + (gy / (6.5*S))**1.3 * 0.95)
                    if dd > B[gy % 8, gx % 8]:
                        rects.append((x0 + c*unit + sx*su, y0 + r*unit + sy*su, su, su))
    return rects

def merge_rows(rects):
    """merge horizontally adjacent equal-height rects to keep the SVG small"""
    rects = sorted(rects, key=lambda r: (round(r[1], 4), r[0]))
    out = []
    for r in rects:
        if out and abs(out[-1][1]-r[1]) < 1e-6 and abs(out[-1][3]-r[3]) < 1e-6 and abs(out[-1][0]+out[-1][2]-r[0]) < 1e-6:
            o = out[-1]; out[-1] = (o[0], o[1], o[2]+r[2], o[3])
        else: out.append(r)
    return out

def path_d(rects):
    return ''.join(f'M{x:g} {y:g}h{w:g}v{h:g}h{-w:g}z' for x, y, w, h in merge_rows(rects))

# ---------------- mark ----------------
# 12x12 letter + cursor block, on a 16 x 14 artboard
def mark_svg(fg=INK, cursor=BRASS, bg=None, dither=True, pad=1):
    W, H = 12 + 3 + pad*2, 12 + pad*2
    d = path_d(mark_rects(dither, pad, pad))
    bgr = f'<rect width="{W}" height="{H}" fill="{bg}"/>' if bg else ''
    cur = f'<rect class="cursor" x="{pad+13}" y="{pad+9}" width="2" height="3" fill="{cursor}"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" shape-rendering="crispEdges" role="img" aria-label="Albretsen AS">'
            f'<title>Albretsen AS</title>{bgr}<path fill="{fg}" d="{d}"/>{cur}</svg>')

open(f'{OUT}/brand/mark.svg', 'w').write(mark_svg())
open(f'{OUT}/brand/mark-cream.svg', 'w').write(mark_svg(fg=CREAM, cursor=BRASS))

# favicon: square tile, forest ground, solid-ish A (dither still at 4x4 → reads as grey at 16px, fine at 32+)
def favicon_svg(dither):
    d = path_d(mark_rects(dither, 2.5, 3))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" shape-rendering="crispEdges">'
            f'<rect width="18" height="18" fill="{FOREST}"/><path fill="{CREAM}" d="{d}"/>'
            f'<rect x="15.5" y="12" width="1.5" height="3" fill="{BRASS}"/></svg>')
open(f'{OUT}/brand/favicon.svg', 'w').write(favicon_svg(False))
open(f'{OUT}/brand/app-tile.svg', 'w').write(favicon_svg(True))

# ---------------- wordmark ----------------
vf = TTFont(f'{T}/fonts/Bric.ttf')
inst = instancer.instantiateVariableFont(vf, {'wght': 640, 'wdth': 88, 'opsz': 96})
gs = inst.getGlyphSet(); cmap = inst.getBestCmap(); upm = inst['head'].unitsPerEm
hmtx = inst['hmtx']
mono = TTFont(f'{T}/fonts/PlexMono-Bold.ttf'); mgs = mono.getGlyphSet(); mcmap = mono.getBestCmap()

def text_path(txt, font_gs, fcmap, fhmtx, size, x, y, track=0.0, kern=None):
    pen = SVGPathPen(font_gs)
    scale = size / upm_of(font_gs)
    cx = x
    for ch in txt:
        gname = fcmap[ord(ch)]
        tp = TransformPen(pen, (scale, 0, 0, -scale, cx, y))
        font_gs[gname].draw(tp)
        cx += fhmtx[gname][0]*scale + track*size
    return pen.getCommands(), cx

def upm_of(g):
    return 1000 if g is mgs else upm

word = 'albretsen'
dW, endx = text_path(word, gs, cmap, hmtx, 100, 0, 0, track=-0.02)
dAS, endAS = text_path('AS', mgs, mcmap, mono['hmtx'], 30, endx + 16, 0, track=0.02)
# bounds approx: x-height letters, ascenders ~ -0.74em; descender none in 'albretsen'
# Wordmark: mark (scaled) + word + AS
mk = path_d(mark_rects(True, 0, 0, unit=6.4))  # 12 cells * 6.4 = 76.8 tall
gap = 30
wx = 12*6.4 + 2*6.4 + 6.4 + gap
asc = 76.8  # put baseline at y = 76.8 (mark bottom)
W = wx + endAS + 4
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -4 {W:.1f} 84" role="img" aria-label="Albretsen AS">'
       f'<title>Albretsen AS</title>'
       f'<g fill="{INK}" shape-rendering="crispEdges"><path d="{mk}"/></g>'
       f'<rect x="{13*6.4:.1f}" y="{9*6.4:.1f}" width="{2*6.4:.1f}" height="{3*6.4:.1f}" fill="{BRASS}"/>'
       f'<g transform="translate({wx:.1f} {asc})"><path fill="{INK}" d="{dW}"/><path fill="#966b27" d="{dAS}"/></g></svg>')
open(f'{OUT}/brand/wordmark.svg', 'w').write(svg)
open(f'{OUT}/brand/wordmark-cream.svg', 'w').write(svg.replace(INK, CREAM).replace('#966b27', BRASS))
# type-only wordmark (no mark) for tight spaces
svg2 = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -78 {endAS+6:.1f} 84" role="img" aria-label="Albretsen AS">'
        f'<title>Albretsen AS</title><path fill="{INK}" d="{dW}"/><path fill="#966b27" d="{dAS}"/></svg>')
open(f'{OUT}/brand/wordmark-type.svg', 'w').write(svg2)
print('ok', W)
