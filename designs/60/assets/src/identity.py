"""Generate the Albretsen AS identity: iso-voxel mark, wordmark (Unbounded outlines), lockup, favicon.
Usage: python identity.py <Unbounded-700.ttf> <outdir>"""
import sys, math
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

font_path, out = sys.argv[1], sys.argv[2]
C = dict(paper='#eef2f7', mist='#cad2db', fog='#8494a8', slate='#3c4958', rim='#1c2735', void='#05080c',
         voltHi='#80bcff', volt='#0790ff', voltLo='#0559a8')

S = math.sqrt(3) / 2
def iso(x, y, z, s=1.0):
    # x to the lower-right, z to the lower-left, y up
    return ((x - z) * S * s, ((x + z) * 0.5 - y) * s)

def faces(x, y, z):
    """three visible faces of the unit voxel at (x,y,z) as polygons in 3D"""
    top = [(x, y + 1, z), (x + 1, y + 1, z), (x + 1, y + 1, z + 1), (x, y + 1, z + 1)]
    left = [(x, y, z + 1), (x + 1, y, z + 1), (x + 1, y + 1, z + 1), (x, y + 1, z + 1)]   # +z face
    right = [(x + 1, y, z), (x + 1, y + 1, z), (x + 1, y + 1, z + 1), (x + 1, y, z + 1)]  # +x face
    return dict(top=top, left=left, right=right)

def poly(pts, s, ox, oy, fill):
    d = ' '.join(f'{ox + iso(*p, s)[0]:.2f},{oy + iso(*p, s)[1]:.2f}' for p in pts)
    return f'<polygon points="{d}" fill="{fill}" stroke="{fill}" stroke-width="0.6" stroke-linejoin="round"/>'

def mark_svg(size=256, theme='dark', lines=True):
    tones = {'top': C['paper'], 'left': C['fog'], 'right': C['slate']} if theme == 'dark' else {'top': C['slate'], 'left': '#1c2735', 'right': C['void']}
    hot = {'top': C['voltHi'], 'left': C['volt'], 'right': C['voltLo']}
    N = 3
    vox = [(x, y, z) for x in range(N) for y in range(N) for z in range(N)]
    vox.remove((2, 2, 2))  # the near-top corner block is missing...
    s = size / 7.2
    ox, oy = size / 2, size / 2 + 0.36 * s
    # painter's order: far to near (small x+z, small y first)
    vox.sort(key=lambda v: (v[0] + v[2] + v[1], v[1]))
    parts = []
    filled = set(vox)
    nb = {'top': (0, 1, 0), 'left': (0, 0, 1), 'right': (1, 0, 0)}
    for v in vox:
        for k, f in faces(*v).items():
            n = tuple(a + b for a, b in zip(v, nb[k]))
            if n in filled: continue  # hidden face: skip, so no hairline seams
            parts.append(poly(f, s, ox, oy, tones[k]))
    # ...because it popped out: lifted out of its slot, nudged off-axis (tension)
    fx, fy, fz = 2.0, 4.75, 2.0
    parts.append('<g class="pp-pop-lines">')  # spring lines: it is moving, not stacked
    for a, b, l in (((0.1, 0.9, 1.2), (0.9, 0.1, 1.2), (0.5, 0.5, 0.95)) if lines else ()):
        x1, y1 = iso(2 + a, 3.18, 2 + b, s); x2, y2 = iso(2 + a, 3.18 + l, 2 + b, s)
        parts.append(f'<line x1="{ox + x1:.2f}" y1="{oy + y1:.2f}" x2="{ox + x2:.2f}" y2="{oy + y2:.2f}" stroke="{C["volt"]}" stroke-width="{0.13 * s:.2f}" stroke-linecap="round"/>')
    parts.append('</g><g class="pp-pop-cube">')
    for k, f in faces(fx, fy, fz).items():
        parts.append(poly(f, s, ox, oy, hot[k]))
        pass
    parts.append('</g>')
    return parts

def wrap(parts, w, h, title, bg=None, vb=None):
    vb = vb or f'0 0 {w} {h}'
    bgr = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{h}" role="img" aria-label="{title}"><title>{title}</title>{bgr}{"".join(parts)}</svg>\n'

# ---- mark
open(f'{out}/logo-mark.svg', 'w').write(wrap(mark_svg(256), 256, 256, 'Albretsen AS mark'))
open(f'{out}/logo-mark-light.svg', 'w').write(wrap(mark_svg(256, 'light'), 256, 256, 'Albretsen AS mark (for light backgrounds)'))

# ---- wordmark from Unbounded outlines
f = TTFont(font_path); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
def text_path(txt, size, x0, y0, track=-0.02):
    scale = size / upm; x = 0; ds = []
    for ch in txt:
        gname = cmap[ord(ch)]; g = gs[gname]
        pen = SVGPathPen(gs)
        tp = TransformPen(pen, (scale, 0, 0, -scale, x0 + x, y0))
        g.draw(tp); ds.append(pen.getCommands())
        x += g.width * scale + track * size
    return ' '.join(ds), x - track * size

word = 'albretsen'
d, wlen = text_path(word, 100, 0, 100)
# tiny iso voxel as the full stop, in volt
def tiny_cube(cx, cy, s):
    fs = faces(0, 0, 0); hot = {'top': C['voltHi'], 'left': C['volt'], 'right': C['voltLo']}
    return [poly(fs[k], s, cx, cy, hot[k]) for k in ('top', 'left', 'right')]
cube_s = 17
W_ = wlen + 34
parts = [f'<path d="{d}" fill="{C["paper"]}"/>'] + tiny_cube(wlen + 19, 100 - cube_s * 0.5, cube_s)
open(f'{out}/wordmark.svg', 'w').write(wrap(parts, round(W_), 128, 'albretsen', vb=f'0 0 {W_:.1f} 128'))
parts_l = [f'<path d="{d}" fill="{C["void"]}"/>'] + tiny_cube(wlen + 19, 100 - cube_s * 0.5, cube_s)
open(f'{out}/wordmark-light.svg', 'w').write(wrap(parts_l, round(W_), 128, 'albretsen', vb=f'0 0 {W_:.1f} 128'))

# ---- lockup: mark + wordmark + AS
mk = mark_svg(160)
d2, w2 = text_path(word, 64, 176, 102)
d3, w3 = text_path('AS', 22, 176 + w2 + 14, 102, track=0.08)
LW = 176 + w2 + 14 + w3 + 8
lock = [f'<g>{"".join(mk)}</g>', f'<path d="{d2}" fill="{C["paper"]}"/>', f'<path d="{d3}" fill="{C["volt"]}"/>']
open(f'{out}/lockup.svg', 'w').write(wrap(lock, round(LW), 160, 'Albretsen AS', vb=f'0 0 {LW:.1f} 160'))

# ---- favicon: mark on a void rounded square
fav = mark_svg(64, lines=False)
open(f'{out}/favicon.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><title>Albretsen AS</title>'
    f'<rect width="64" height="64" rx="14" fill="{C["void"]}"/><g transform="translate(1 1.5) scale(0.97)">{"".join(fav)}</g></svg>\n')
print('identity ok', wlen)
