import sys, os, math
sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.ARFqOUlHoH/s')
from lib import bayer
OUT = sys.argv[1]
os.makedirs(f'{OUT}/retired', exist_ok=True); os.makedirs(f'{OUT}/stickers', exist_ok=True); os.makedirs(f'{OUT}/patterns', exist_ok=True)
INK = '#052517'; FOREST = '#14422b'; CREAM = '#f9f2e2'; CREAM2 = '#efe5d0'; CREAM3 = '#dcd0b8'; BRASS = '#c59a44'; BRASSD = '#966b27'; PULSE = '#e03c63'; MOSS = '#587d50'
B = bayer(4)

G = {
 'polyglot-pilot': [
  "............",
  ".#########..",
  ".#.......#..",
  ".#.#...#.#..",
  ".#.##.##.#..",
  ".#.#...#.#..",
  ".#.......#..",
  ".###.#####..",
  "...#.#...##.",
  "...##...#.#.",
  ".......#..#.",
  "......####..",
 ],
 'pinpoint': [
  "....####....",
  "..##++++##..",
  ".#++++++++#.",
  ".#+++##+++#.",
  "#+++####+++#",
  "#+++####+++#",
  ".#+++##+++#.",
  ".#++++++++#.",
  "..#++++++#..",
  "...#++++#...",
  "....#++#....",
  ".....##.....",
 ],
 'webvakt': [
  "............",
  "............",
  "....####....",
  "..##....##..",
  ".#...##...#.",
  "#...####...#",
  "#...####...#",
  ".#...##...#.",
  "..##....##..",
  "....####....",
  "............",
  "............",
 ],
 'joke-central': [
  "...######...",
  "..#++++++#..",
  ".#++++++++#.",
  "#++##++##++#",
  "#++##++##++#",
  "#++++++++++#",
  "#+########+#",
  "#+#......#+#",
  ".#+#....#+#.",
  "..#+####+#..",
  "...######...",
  "............",
 ],
 'tryggere-hyring': [
  "#####.######",
  "#++++#+++++#",
  "#+++++++++##",
  "#++++++++#.#",
  "#+++++++#..#",
  "#+#++++#...#",
  "#+.#++#...#.",
  ".#..##....#.",
  ".#.......#..",
  "..#.....#...",
  "...#...#....",
  "....###.....",
 ],
 'early-apps': [
  "............",
  ".##......##.",
  ".##.....##..",
  "........#...",
  ".......#....",
  "......#.....",
  ".....#......",
  "....#.......",
  "...#........",
  "..##.....##.",
  ".##......##.",
  "............",
 ],
}

def glyph_svg(rows, fg=FOREST, mid=MOSS, size=12):
    out = []
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch == '#': out.append(f'<rect x="{x}" y="{y}" width="1" height="1" fill="{fg}"/>')
            elif ch == '+':
                # dithered fill: 2x2 subcells at 50% Bayer
                for sy in range(2):
                    for sx in range(2):
                        if 0.5 > B[(y*2+sy) % 4, (x*2+sx) % 4]:
                            out.append(f'<rect x="{x+sx*0.5}" y="{y+sy*0.5}" width="0.5" height="0.5" fill="{mid}"/>')
    return ''.join(out)

for name, rows in G.items():
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges" role="img" aria-label="{name} stand-in">'
           f'<rect width="16" height="16" fill="{CREAM2}"/>'
           f'<g transform="translate(2 2)">{glyph_svg(rows)}</g>'
           f'<path d="M0 16 L16 0" stroke="{PULSE}" stroke-width="0.6" shape-rendering="geometricPrecision"/>'
           f'</svg>')
    open(f'{OUT}/retired/{name}.svg', 'w').write(svg)

# ---------- stickers (round, with text on a circle path; fonts fall back to monospace) ----------
def ring_sticker(fname, text, center_svg, bg, fg, ring=None, fs=15):
    ring = ring or fg
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="{text.strip(' *')}">
  <defs><path id="c" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0"/></defs>
  <circle cx="100" cy="100" r="98" fill="{bg}"/>
  <circle cx="100" cy="100" r="92" fill="none" stroke="{ring}" stroke-width="1.5" stroke-dasharray="2 3"/>
  <text font-family="'IBM Plex Mono', ui-monospace, Menlo, monospace" font-size="{fs}" font-weight="700" fill="{fg}"><textPath href="#c" textLength="448" lengthAdjust="spacing">{text}</textPath></text>
  {center_svg}
</svg>'''
    open(f'{OUT}/stickers/{fname}.svg', 'w').write(svg)

def dither_disc(cx, cy, r, col, n=10):
    # a disc filled with a Bayer radial gradient, dense in the middle, dissolving outward (a pulse)
    cells = []; s = 2*r/n
    B8 = bayer(8)
    for j in range(n):
        for i in range(n):
            x = cx - r + i*s; y = cy - r + j*s
            d = math.hypot(x+s/2-cx, y+s/2-cy)/r
            if d > 1: continue
            if (1-d)**0.8 > B8[j % 8, i % 8]:
                cells.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{s:.2f}" height="{s:.2f}" fill="{col}"/>')
    return f'<g shape-rendering="crispEdges">{"".join(cells)}</g>'

ring_sticker('since-2016', 'ON GOOGLE PLAY SINCE 2016 * ON GOOGLE PLAY * ',
             f'<text x="100" y="114" text-anchor="middle" font-family="\'Bricolage Grotesque\', system-ui, sans-serif" font-weight="800" font-size="44" fill="{CREAM}">2016</text>',
             FOREST, CREAM, BRASS)
ring_sticker('no-marketing', '113,000+ INSTALLS * ZERO MARKETING * ',
             dither_disc(100, 100, 42, INK, 14), BRASS, INK)
ring_sticker('one-bit', 'EVERY IMAGE IS A REAL PHOTO * DITHERED * ',
             f'<g transform="translate(64 68) scale(4)" shape-rendering="crispEdges"><use href="#m"/></g>'
             + f'<text x="100" y="112" text-anchor="middle" font-family="\'IBM Plex Mono\', ui-monospace, monospace" font-weight="700" font-size="30" fill="{PULSE}">1-BIT</text>',
             CREAM, FOREST, FOREST)
# fix: one-bit sticker shouldn't reference a missing symbol
s = open(f'{OUT}/stickers/one-bit.svg').read().replace('<g transform="translate(64 68) scale(4)" shape-rendering="crispEdges"><use href="#m"/></g>', dither_disc(100, 100, 50, CREAM3, 12))
open(f'{OUT}/stickers/one-bit.svg', 'w').write(s)

# rectangular "honest label" sticker
open(f'{OUT}/stickers/status-paused.svg', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 84" role="img" aria-label="Paused, not dead">
  <rect x="2" y="2" width="256" height="80" fill="{PULSE}"/>
  <rect x="8" y="8" width="244" height="68" fill="none" stroke="{CREAM}" stroke-width="1.5" stroke-dasharray="3 3"/>
  <text x="130" y="40" text-anchor="middle" font-family="'IBM Plex Mono', ui-monospace, monospace" font-weight="700" font-size="22" letter-spacing="2" fill="{CREAM}">PAUSED,</text>
  <text x="130" y="64" text-anchor="middle" font-family="'IBM Plex Mono', ui-monospace, monospace" font-weight="400" font-size="13" textLength="220" lengthAdjust="spacingAndGlyphs" fill="{CREAM}">NOT DEAD. NOT LIVE EITHER.</text>
</svg>''')

# ---------- patterns ----------
# Bayer 8x8 at 4 tones as tileable swatches
for k, lvl in enumerate([0.125, 0.25, 0.5, 0.75]):
    B8 = bayer(8)
    cells = ''.join(f'<rect x="{x}" y="{y}" width="1" height="1"/>' for y in range(8) for x in range(8) if lvl > B8[y, x])
    open(f'{OUT}/patterns/bayer-{int(lvl*100):02d}.svg', 'w').write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="8" height="8" shape-rendering="crispEdges"><g fill="{FOREST}">{cells}</g></svg>')
# ASCII rule (divider): a ramp that breathes in and out
ramp = " .:-=+*#%@%#*+=-:. "
line = ''.join(ramp[int((0.5-0.5*math.cos(i/64*2*math.pi))*(len(ramp)//2))] for i in range(128))
open(f'{OUT}/patterns/ascii-rule.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 24" preserveAspectRatio="none"><text x="0" y="17" textLength="1280" lengthAdjust="spacing" font-family="\'IBM Plex Mono\', ui-monospace, monospace" font-size="16" fill="{FOREST}" xml:space="preserve">{line.replace("&","&amp;")}</text></svg>')
print('ok')
