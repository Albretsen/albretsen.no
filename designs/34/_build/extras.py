# Generates the vector extras for design 34 "Tension Prism":
#   extras/pattern-lattice.svg   tileable triangle lattice
#   extras/sticker-*.svg         four stickers
#   retired/*.svg                lattice-glyph stand-ins for retired products
# usage: python3 extras.py <assets-dir>
import math, os, sys, random
A = sys.argv[1]
MINT = '#39FD9E'; INK = '#060807'; PAPER = '#F4FFF8'
R3 = math.sqrt(3) / 2
rnd = random.Random(0x6c586a)
os.makedirs(os.path.join(A, 'extras'), exist_ok=True)
os.makedirs(os.path.join(A, 'retired'), exist_ok=True)

def f(n): return f'{n:.2f}'.rstrip('0').rstrip('.')
def tri_pts(k, j, s, ox=0, oy=0):
    h = s * R3; x0 = k * s / 2 + ox; y0 = j * h + oy; y1 = y0 + h
    if (k + j) % 2 == 0:
        return [(x0, y1), (x0 + s / 2, y0), (x0 + s, y1)]
    return [(x0, y0), (x0 + s, y0), (x0 + s / 2, y1)]
def shrink(p, g):
    cx = sum(x for x, _ in p) / 3; cy = sum(y for _, y in p) / 3
    return [(cx + (x - cx) * g, cy + (y - cy) * g) for x, y in p]
def d(p): return 'M' + 'L'.join(f'{f(x)} {f(y)}' for x, y in p) + 'Z'
def save(path, svg):
    open(os.path.join(A, path), 'w').write(svg); print(path, len(svg))

# ── 1. tileable lattice pattern ────────────────────────────────────────────
s = 40; h = s * R3; NX, NY = 8, 6   # period: NX*s wide, NY*h tall (NY even)
W, H = NX * s, NY * h
lines = []
for j in range(NY + 1):
    lines.append(f'M0 {f(j*h)}H{f(W)}')
for k in range(-NY, NX * 2 + 2):
    # diagonals of both directions
    x = k * s / 2
    lines.append(f'M{f(x)} 0L{f(x + H / math.tan(math.radians(60)))} {f(H)}')
    lines.append(f'M{f(x)} 0L{f(x - H / math.tan(math.radians(60)))} {f(H)}')
fills = []
for j in range(NY):
    for k in range(NX * 2):
        r = rnd.random()
        if r < 0.05:
            fills.append(f'<path fill="{MINT}" fill-opacity=".9" d="{d(shrink(tri_pts(k, j, s), .78))}"/>')
        elif r < 0.12:
            fills.append(f'<path fill="#fff" fill-opacity=".07" d="{d(tri_pts(k, j, s))}"/>')
save('extras/pattern-lattice.svg',
     f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(W)} {f(H)}" width="{f(W)}" height="{f(H)}">'
     f'<rect width="100%" height="100%" fill="{INK}"/>' + ''.join(fills) +
     f'<path d="{"".join(lines)}" stroke="#fff" stroke-opacity=".09" stroke-width="1" fill="none"/></svg>')

# ── 2. stickers ───────────────────────────────────────────────────────────
MARK = []  # mini Prism A, 5 rows, side 1, apex at 0,0
remove = {(2, 2), (4, 3), (4, 4), (4, 5)}
for r in range(5):
    for i in range(2 * r + 1):
        if (r, i) in remove: continue
        x0 = -r / 2 + (i // 2); y0 = r * R3; y1 = y0 + R3
        p = [(x0, y0), (x0 + .5, y1), (x0 - .5, y1)] if i % 2 == 0 else [(x0, y0), (x0 + 1, y0), (x0 + .5, y1)]
        MARK.append(((r, i), shrink(p, .88)))
def mark_svg(cx, cy, size, col='#fff', accent=MINT):
    sc = size / 5
    out = []
    for (r, i), p in MARK:
        q = [(cx + x * sc, cy - 5 * R3 * sc / 2 + y * sc) for x, y in p]
        c = accent if (r, i) in {(0, 0), (3, 5), (4, 7)} else col
        op = '' if c == accent else f' fill-opacity="{0.95 if i % 2 == 0 else 0.7}"'
        out.append(f'<path fill="{c}"{op} d="{d(q)}"/>')
    return ''.join(out)

# SVGs used as <img> cannot load web fonts, so each sticker embeds a tiny
# Google Fonts subset (only the glyphs it uses) as a data: URI. OFL allows this.
import urllib.request, urllib.parse, re, base64
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'
def subset(family, text, alias):
    url = 'https://fonts.googleapis.com/css2?family=' + family + '&text=' + urllib.parse.quote(''.join(sorted(set(text))))
    css = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA})).read().decode()
    furl = re.search(r'url\((https://[^)]+)\)', css).group(1)
    data = urllib.request.urlopen(urllib.request.Request(furl, headers={'User-Agent': UA})).read()
    return f"@font-face{{font-family:'{alias}';src:url(data:font/woff2;base64,{base64.b64encode(data).decode()}) format('woff2')}}"
def fonts(mono_text='', disp_text=''):
    css = ''
    if mono_text: css += subset('Geist+Mono:wght@600', mono_text, 'SGM')
    if disp_text: css += subset('Anybody:wdth,wght@125,900', disp_text, 'SAB')
    return f'<style>{css}</style>'
FONT_MONO = "'SGM','Geist Mono',ui-monospace,monospace"
FONT_DISP = "'SAB','Anybody','Arial Black',sans-serif"
# a) circular seal, mint
seal = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">'
        f'<defs><path id="c" d="M200 200m-148 0a148 148 0 1 1 296 0a148 148 0 1 1-296 0"/></defs>'
        + fonts('ALBRETSEN AS ✦ NORWAY ✦ SOFTWARE THAT PAYS ✦ ') +
        f'<circle cx="200" cy="200" r="196" fill="{MINT}"/><circle cx="200" cy="200" r="182" fill="none" stroke="{INK}" stroke-width="2"/>'
        f'<circle cx="200" cy="200" r="114" fill="{INK}"/>'
        f'<text font-family="{FONT_MONO}" font-size="27" font-weight="600" letter-spacing="5.4" fill="{INK}">'
        f'<textPath href="#c">ALBRETSEN AS ✦ NORWAY ✦ SOFTWARE THAT PAYS ✦ </textPath></text>'
        + mark_svg(200, 206, 120, col='#fff', accent=MINT) + '</svg>')
save('extras/sticker-seal.svg', seal)

# b) triangle badge "on Google Play since 2016"
T = 380; th = T * R3
tri = [(200, 20), (200 + T / 2, 20 + th), (200 - T / 2, 20 + th)]
inner = shrink(tri, .84)
def edge_path(p0, p1, off):
    # path along an edge, offset inward
    return f'M{f(p0[0])} {f(p0[1])}L{f(p1[0])} {f(p1[1])}'
ins = shrink(tri, .9)
badge = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 370" width="400" height="370">'
         f'<defs><path id="e1" d="{edge_path(ins[2], ins[0], 0)}"/><path id="e2" d="{edge_path(ins[0], ins[1], 0)}"/></defs>'
         + fonts('ON GOOGLE PLAY SINCE', '2016') +
         f'<path d="{d(tri)}" fill="{INK}" stroke="{MINT}" stroke-width="6" stroke-linejoin="round"/>'
         f'<path d="{d(inner)}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1.5"/>'
         f'<text font-family="{FONT_MONO}" font-size="17" font-weight="600" letter-spacing="3" fill="{MINT}" dy="-8">'
         f'<textPath href="#e1" startOffset="50%" text-anchor="middle">ON GOOGLE PLAY</textPath></text>'
         f'<text font-family="{FONT_MONO}" font-size="17" font-weight="600" letter-spacing="3" fill="{MINT}" dy="-8">'
         f'<textPath href="#e2" startOffset="50%" text-anchor="middle">SINCE</textPath></text>'
         f'<text x="200" y="300" text-anchor="middle" font-family="{FONT_DISP}" font-stretch="125%" font-weight="900" font-size="104" fill="#fff">2016</text>'
         f'<path d="M150 318H250" stroke="{MINT}" stroke-width="4"/></svg>')
save('extras/sticker-since-2016.svg', badge)

# c) terminal pill: the MCP command
cmd = 'claude mcp add albretsen https://albretsen.no/mcp'
pill = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 96" width="760" height="96">'
        + fonts(cmd) +
        f'<rect x="2" y="2" width="756" height="92" rx="46" fill="{INK}" stroke="{MINT}" stroke-width="3"/>'
        f'<path d="M44 32l18 16-18 16" fill="none" stroke="{MINT}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
        f'<text x="80" y="56" font-family="{FONT_MONO}" font-size="21" font-weight="600" fill="#fff" textLength="596" lengthAdjust="spacingAndGlyphs">{cmd}</text>'
        f'<rect x="700" y="34" width="14" height="28" fill="{MINT}"/></svg>')
save('extras/sticker-mcp-command.svg', pill)

# d) tilted label: 113,000+ installs (Fun Libs fact), paper with mint facet strip
lab = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 220" width="520" height="220">'
       + fonts('FUN LIBS INSTALLS · NO MARKETING', '113,000+') +
       f'<g transform="rotate(-6 260 110)"><rect x="20" y="40" width="480" height="140" rx="10" fill="{PAPER}"/>'
       + ''.join(f'<path fill="{MINT if (k % 3) else INK}" d="{d([(40 + k*18, 168), (49 + k*18, 152), (58 + k*18, 168)] if k % 2 == 0 else [(49 + (k-1)*18 + 9, 152), (67 + (k-1)*18 + 9, 152), (58 + (k-1)*18 + 9, 168)])}"/>' for k in range(0, 25)) +
       f'<text x="40" y="118" font-family="{FONT_DISP}" font-stretch="125%" font-weight="900" font-size="64" fill="{INK}">113,000+</text>'
       f'<text x="44" y="146" font-family="{FONT_MONO}" font-size="15" font-weight="600" letter-spacing="2" fill="{INK}" textLength="420">FUN LIBS INSTALLS · NO MARKETING</text></g></svg>')
save('extras/sticker-installs.svg', lab)

# ── 3. retired stand-ins: lattice glyphs, each a different crystal ─────────
def glyph(name, label, year, cells, accent):
    rows = 4; S = 52
    parts = []
    for r in range(rows):
        for i in range(2 * r + 1):
            x0 = 160 - r * S / 2 + (i // 2) * S; y0 = 40 + r * S * R3; y1 = y0 + S * R3
            p = [(x0, y0), (x0 + S / 2, y1), (x0 - S / 2, y1)] if i % 2 == 0 else [(x0, y0), (x0 + S, y0), (x0 + S / 2, y1)]
            p = shrink(p, .86)
            if (r, i) in accent:
                parts.append(f'<path fill="{MINT}" d="{d(p)}"/>')
            elif (r, i) in cells:
                parts.append(f'<path fill="#fff" fill-opacity="{.92 if i % 2 == 0 else .62}" d="{d(p)}"/>')
            else:
                parts.append(f'<path fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1.2" d="{d(p)}"/>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320" role="img" aria-label="{label} (retired)">'
           + fonts(f'{year} · RETIRED', label) +
           f'<rect width="320" height="320" rx="28" fill="{INK}"/>' + ''.join(parts) +
           f'<text x="24" y="262" font-family="{FONT_DISP}" font-weight="900" font-size="22" fill="#fff">{label}</text>'
           f'<text x="24" y="292" font-family="{FONT_MONO}" font-size="13" font-weight="600" letter-spacing="2" fill="{MINT}">{year} · RETIRED</text></svg>')
    save(f'retired/{name}.svg', svg)

ALL = {(r, i) for r in range(4) for i in range(2 * r + 1)}
glyph('polyglot-pilot', 'Polyglot Pilot', '2025', {c for c in ALL if c[1] % 2 == 0}, {(3, 1), (3, 3), (3, 5), (2, 1), (2, 3)})   # two interleaved lattices: languages
glyph('pinpoint', 'PinPoint', '2025', set(), {(1, 1), (2, 2), (3, 3)})                                                         # a pin dropping through the grid
glyph('webvakt', 'WebVakt', '2024', {(1, 0), (1, 2), (2, 0), (2, 4), (3, 0), (3, 6), (2, 1), (2, 3)}, {(2, 2)})                  # an eye: ring of facets watching a centre
glyph('joke-central', 'Joke Central', '2024', {(3, 0), (3, 6), (3, 1), (3, 5)}, {(3, 2), (3, 3), (3, 4), (0, 0)})               # a grin along the bottom row
glyph('tryggere-hyring', 'Tryggere Hyring', '2023', ALL - {(3, 0), (3, 6), (0, 0)}, {(1, 1)})                                      # a shield, apex clipped
glyph('early-apps', 'Early apps', '2021', {(0, 0), (3, 0), (3, 6)}, {(3, 3)})                                                   # three first corners
print('done')
