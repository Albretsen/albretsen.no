"""Set 'Albretsen' in Instrument Serif (OFL) and convert to outlines.
usage: python wordmark.py <font.ttf> <assets dir>"""
import sys, re, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

font = TTFont(sys.argv[1]); out = sys.argv[2]
gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font['head'].unitsPerEm
hmtx = font['hmtx']
INK, CHALK = '#1c2427', '#e6eaec'

def setline(text, size, track=0, kern=None):
    kern = kern or {}
    s = size / upm; x = 0; d = ''
    for i, ch in enumerate(text):
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, 0)))
        d += pen.getCommands()
        x += hmtx[g][0] * s + track + kern.get(text[i:i + 2], 0)
    return d, x - track

def fmt(d):
    return re.sub(r'(\d+\.\d{2})\d+', r'\1', d)

# wordmark alone, cap height ~ 0.7 * size
size = 64
d, w = setline('Albretsen', size, track=0.4, kern={'Al': -0.6})
asc = 0.74 * size; desc = 0.22 * size
W = round(w + 4, 1); H = round(asc + desc, 1)
def word_svg(color):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 {-asc:.1f} {W} {H}" width="{W}" height="{H}">'
            f'<title>Albretsen</title><path fill="{color}" d="{fmt(d)}"/></svg>\n')
open(os.path.join(out, 'identity/wordmark.svg'), 'w').write(word_svg(INK))
open(os.path.join(out, 'identity/wordmark-chalk.svg'), 'w').write(word_svg(CHALK))

# lockup: mark (64 box scaled to cap height) + wordmark + small "AS"
mark = open(os.path.join(out, 'identity/mark.svg')).read()
inner = re.search(r'<svg[^>]*>(?:<title>.*?</title>)?(.*)</svg>', mark, re.S).group(1)
d_as, w_as = setline('AS', size * 0.42, track=1.6)
def lockup(color):
    m = inner.replace('#1c2427', color)
    ms = 0.98  # mark drawn at 64 * ms
    gap = 16
    total = 64 * ms + gap + w + 12 + w_as
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -4 {total + 4:.1f} 72" width="{total + 4:.0f}" height="72">'
            f'<title>Albretsen AS</title>'
            f'<g transform="scale({ms})">{m}</g>'
            f'<path fill="{color}" transform="translate({64 * ms + gap:.1f} 50)" d="{fmt(d)}"/>'
            f'<path fill="{color}" opacity=".62" transform="translate({64 * ms + gap + w + 12:.1f} 50)" d="{fmt(d_as)}"/>'
            '</svg>\n')
open(os.path.join(out, 'identity/lockup.svg'), 'w').write(lockup(INK))
open(os.path.join(out, 'identity/lockup-chalk.svg'), 'w').write(lockup(CHALK))
print('ok', W, H)
