"""Identity: mark, wordmark (Jost Medium outlines, spaced capitals), favicon, OG image.
python identity.py <tmpdir-with-ttfs> <assets-dir>"""
import sys, os, subprocess
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

T, A = sys.argv[1], sys.argv[2]
ID = f'{A}/identity'
os.makedirs(ID, exist_ok=True)

INK, FLAMINGO, MINT, SKY, SNOW, SHELL = '#22304F', '#EE8FA6', '#A6DCC6', '#9CC8EA', '#FBF7F2', '#F7D3DA'


def jost(wght):
    f = TTFont(f'{T}/jost-var-latin.ttf')
    return instancer.instantiateVariableFont(f, {'wght': wght})


def text_path(font, text, size, tracking_em, x=0, y=0):
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font['head'].unitsPerEm
    s = size / upm
    d = []; cx = x
    hmtx = font['hmtx']
    for i, ch in enumerate(text):
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        tp = TransformPen(pen, (s, 0, 0, -s, cx, y))
        gs[g].draw(tp)
        d.append(pen.getCommands())
        cx += hmtx[g][0] * s + (tracking_em * size if i < len(text) - 1 else 0)
    return ' '.join(d), cx - x


# ---------- mark: an arched window onto a low sun over snow ----------
def mark_svg(bg=None, ink=INK, sun=FLAMINGO, lines=(SKY, MINT, SKY), size=64, title='Albretsen AS'):
    r = f'<rect width="64" height="64" rx="14" fill="{bg}"/>' if bg else ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="{size}" height="{size}" role="img" aria-label="{title}">
  <title>{title}</title>{r}
  <defs><clipPath id="w"><path d="M16 56V28a16 16 0 0 1 32 0v28z"/></clipPath></defs>
  <g clip-path="url(#w)">
    <circle cx="32" cy="38" r="9.5" fill="{sun}"/>
    <rect x="10" y="38" width="44" height="20" fill="{bg or SNOW}"/>
    <rect x="21" y="42.2" width="22" height="2.4" rx="1.2" fill="{lines[0]}"/>
    <rect x="24.5" y="47.2" width="15" height="2.4" rx="1.2" fill="{lines[1]}"/>
    <rect x="28" y="52.2" width="8" height="2.4" rx="1.2" fill="{lines[2]}"/>
  </g>
  <path d="M16 56V28a16 16 0 0 1 32 0v28" fill="none" stroke="{ink}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11 56h42" stroke="{ink}" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M16 38h32" stroke="{ink}" stroke-width="1.6"/>
</svg>
'''


open(f'{ID}/mark.svg', 'w').write(mark_svg())
open(f'{ID}/mark-night.svg', 'w').write(mark_svg(ink=SNOW, sun='#FFC9A0', lines=(SKY, MINT, SKY)).replace(f'fill="{SNOW}"/>\n    <rect x="21"', 'fill="#18223F"/>\n    <rect x="21"'))
open(f'{ID}/favicon.svg', 'w').write(mark_svg(bg=INK, ink=SNOW, sun=FLAMINGO, lines=(SKY, MINT, SKY), size=32))

# ---------- wordmark ----------
f500 = jost(500); f400 = jost(400)
d1, w1 = text_path(f500, 'ALBRETSEN', 40, 0.34, 0, 44)
d2, w2 = text_path(f400, 'AS', 40, 0.34, 0, 0)
gap = 26
total = w1 + gap + 2 + gap + w2
wm = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total:.1f} 56" width="{total:.0f}" height="56" role="img" aria-label="Albretsen AS">
  <title>Albretsen AS</title>
  <path d="{d1}" fill="currentColor"/>
  <rect x="{w1 + gap:.1f}" y="14" width="2" height="31" fill="{FLAMINGO}"/>
  <g transform="translate({w1 + gap + 2 + gap:.1f} 44)"><path d="{d2}" fill="currentColor" opacity="0.62"/></g>
</svg>
'''
open(f'{ID}/wordmark.svg', 'w').write(wm.replace('fill="currentColor"', f'fill="{INK}"', 1).replace('fill="currentColor" opacity', f'fill="{INK}" opacity'))
open(f'{ID}/wordmark-currentcolor.svg', 'w').write(wm)
open(f'{ID}/wordmark-snow.svg', 'w').write(wm.replace('currentColor', SNOW))

# lockup: mark + wordmark
lock = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total + 92:.1f} 64" width="{total + 92:.0f}" height="64" role="img" aria-label="Albretsen AS">
  <title>Albretsen AS</title>
  {mark_svg().split('</title>')[1].replace('</svg>', '').replace('<defs><clipPath id="w">', '<defs><clipPath id="lw">').replace('url(#w)', 'url(#lw)')}
  <g transform="translate(92 4)">
    <path d="{d1}" fill="{INK}"/>
    <rect x="{w1 + gap:.1f}" y="14" width="2" height="31" fill="{FLAMINGO}"/>
    <g transform="translate({w1 + gap + 2 + gap:.1f} 44)"><path d="{d2}" fill="{INK}" opacity="0.62"/></g>
  </g>
</svg>
'''
open(f'{ID}/lockup.svg', 'w').write(lock)

subprocess.run(['rsvg-convert', '-w', '180', '-h', '180', f'{ID}/favicon.svg', '-o', f'{ID}/apple-touch-icon-180.png'], check=True)
subprocess.run(['rsvg-convert', '-w', '32', '-h', '32', f'{ID}/favicon.svg', '-o', f'{ID}/favicon-32.png'], check=True)

# ---------- Open Graph 1200x630 ----------
from PIL import Image, ImageDraw, ImageFont
src = Image.open(f'{T}/hero-pinkhour-master.png').convert('RGB')
# crop 1200:630 around the building, slightly lower so the sky holds the type
w = src.width; h = round(w * 630 / 1200)
og = src.crop((0, src.height - h - 40, w, src.height - 40)).resize((1200, 630), Image.LANCZOS)
dr = ImageDraw.Draw(og, 'RGBA')
# render wordmark SVG large in snow colour
subprocess.run(['rsvg-convert', '-w', '520', f'{ID}/wordmark-currentcolor.svg', '-o', f'{T}/wm.png'], check=True)
wmimg = Image.open(f'{T}/wm.png').convert('RGBA')
alpha = wmimg.split()[3]
white = Image.new('RGBA', wmimg.size, (251, 247, 242, 255)); white.putalpha(alpha)
og.alpha_composite = None
og = og.convert('RGBA'); og.alpha_composite(white, ((1200 - wmimg.width) // 2, 64))
serif = ImageFont.truetype(f'{T}/instrument-serif-italic-latin.ttf', 40)
dr = ImageDraw.Draw(og)
line = 'Quiet software that pays for itself.'
tw = dr.textlength(line, font=serif)
dr.text(((1200 - tw) / 2, 128), line, font=serif, fill=(251, 247, 242, 235))
og.convert('RGB').save(f'{ID}/og-image.jpg', 'JPEG', quality=86, optimize=True, progressive=True)
print('ok', total)
