"""Subset the OFL fonts to WOFF2 and convert wordmark text to SVG paths."""
import sys, os, shutil, json
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
OUT = sys.argv[1]
F = 'fonts'
uni = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2190-2199,U+2212,U+2215'
for src, dst, extra in [('InstrumentSerif-Regular.ttf', 'instrument-serif-regular.woff2', []),
                        ('InstrumentSerif-Italic.ttf', 'instrument-serif-italic.woff2', []),
                        ('SchibstedGrotesk-VF.ttf', 'schibsted-grotesk-vf.woff2', [])]:
    subset.main([os.path.join(F, src), f'--unicodes={uni}', '--flavor=woff2', '--layout-features=*',
                 f'--output-file={os.path.join(OUT, "fonts", dst)}'])
    print(dst, os.path.getsize(os.path.join(OUT, 'fonts', dst)))
shutil.copy(os.path.join(F, 'OFL-InstrumentSerif.txt'), os.path.join(OUT, 'fonts'))
shutil.copy(os.path.join(F, 'OFL-SchibstedGrotesk.txt'), os.path.join(OUT, 'fonts'))

def text_path(fontfile, text, size, x0=0, y0=0, tracking=0, wght=None):
    f = TTFont(os.path.join(F, fontfile))
    if wght is not None and 'fvar' in f:
        from fontTools.varLib.instancer import instantiateVariableFont
        f = instantiateVariableFont(f, {'wght': wght})
    gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    s = size / upm; x = x0; paths = []
    kern = {}
    for ch in text:
        gn = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        tp = TransformPen(pen, (s, 0, 0, -s, x, y0))
        gs[gn].draw(tp)
        paths.append(pen.getCommands())
        x += gs[gn].width * s + tracking
    asc = f['hhea'].ascent * s; desc = f['hhea'].descent * s
    return ' '.join(paths), x - tracking, asc, desc

res = {}
res['albretsen'] = text_path('InstrumentSerif-Regular.ttf', 'Albretsen', 100)
res['as'] = text_path('SchibstedGrotesk-VF.ttf', 'AS', 26, tracking=4, wght=560)
res['A'] = text_path('InstrumentSerif-Regular.ttf', 'A', 100)
res['italicA'] = text_path('InstrumentSerif-Italic.ttf', 'A', 100)
json.dump({k: {'d': v[0], 'w': v[1], 'asc': v[2], 'desc': v[3]} for k, v in res.items()}, open('paths.json', 'w'))
for k, v in res.items(): print(k, round(v[1], 1), round(v[2], 1), round(v[3], 1))
