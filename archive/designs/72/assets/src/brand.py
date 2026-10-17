# Builds identity SVGs for design 72 from Albert Sans (outlined) and geometry.
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

A = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-12/designs/72/assets'
FONT = os.path.join(A, 'fonts/albert-sans-latin-var.woff2')

def outline(text, wght, size, tracking=0.0):
    f = TTFont(FONT)
    f = instantiateVariableFont(f, {'wght': wght})
    gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    sc = size / upm
    x = 0; paths = []
    for ch in text:
        gn = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        tp = TransformPen(pen, (sc, 0, 0, -sc, x, 0))
        gs[gn].draw(tp)
        paths.append(pen.getCommands())
        x += gs[gn].width * sc + tracking * size
    asc = f['hhea'].ascent * sc
    capH = getattr(f['OS/2'], 'sCapHeight', 700) * sc
    return ' '.join(paths), x - tracking * size, capH

SLATE = '#323A44'; FALU = '#8F2B20'; OCHRE = '#C8902F'; CREAM = '#F6F1E7'

# The mark: an arched doorway (whitewashed arch, falu red) with a low winter sun
# resting on the threshold, a single horizon line. Reads at 16 px.
def mark(bg=None, size=64):
    s = []
    s.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="{size}" height="{size}" role="img" aria-label="Albretsen AS">')
    if bg: s.append(f'<rect width="64" height="64" rx="14" fill="{bg}"/>')
    s.append(f'<path d="M14 56V30a18 18 0 0 1 36 0v26z" fill="{FALU}"/>')
    s.append(f'<clipPath id="d"><path d="M20 56V31a12 12 0 0 1 24 0v25z"/></clipPath>')
    s.append(f'<path d="M20 56V31a12 12 0 0 1 24 0v25z" fill="{CREAM}"/>')
    s.append(f'<g clip-path="url(#d)"><circle cx="32" cy="50" r="7.5" fill="{OCHRE}"/><rect x="18" y="49.2" width="28" height="8" fill="{CREAM}"/><rect x="18" y="49.2" width="28" height="1.6" fill="{SLATE}"/></g>')
    s.append('</svg>')
    return ''.join(s)

def wordmark(color=SLATE, with_mark=True, with_as=True):
    d, w, cap = outline('Albretsen', 300, 48, 0.01)
    d2, w2, _ = outline('AS', 400, 15, 0.16)
    pad = 6
    mx = 0
    parts = []
    if with_mark:
        parts.append(f'<g transform="translate(0 -4) scale(0.9)">{mark()[mark().index(">")+1:-6]}</g>')
        mx = 58 + 14
    H = 64
    base = 46
    parts.append(f'<path transform="translate({mx} {base})" fill="{color}" d="{d}"/>')
    W = mx + w
    if with_as:
        parts.append(f'<path transform="translate({W + 10} {base})" fill="{color}" opacity=".7" d="{d2}"/>')
        W += 10 + w2
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W + pad:.0f} {H}" width="{W + pad:.0f}" height="{H}" role="img" aria-label="Albretsen AS">' + ''.join(parts) + '</svg>'

os.makedirs(os.path.join(A, 'brand'), exist_ok=True)
open(os.path.join(A, 'brand/mark.svg'), 'w').write(mark())
open(os.path.join(A, 'brand/mark-tile.svg'), 'w').write(mark(bg=CREAM))
open(os.path.join(A, 'brand/favicon.svg'), 'w').write(mark(bg=CREAM))
open(os.path.join(A, 'brand/wordmark.svg'), 'w').write(wordmark())
open(os.path.join(A, 'brand/wordmark-text.svg'), 'w').write(wordmark(with_mark=False))
open(os.path.join(A, 'brand/wordmark-light.svg'), 'w').write(wordmark(color='#FBF8F2'))
print('ok')
