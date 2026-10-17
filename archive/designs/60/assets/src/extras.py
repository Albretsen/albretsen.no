"""Extras: grain tile, terrazzo tile, iso grid pattern, orbit divider, stickers (text outlined from Unbounded / Geist Mono).
Usage: python extras.py <fontsdir> <terrazzo_color.jpg> <outdir>"""
import sys, math, numpy as np
from PIL import Image, ImageFilter
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

fonts, terr, out = sys.argv[1], sys.argv[2], sys.argv[3]
S = math.sqrt(3) / 2
V = dict(void='#05080c', ink='#080e15', deep='#0e1721', rim='#1c2735', slate='#3c4958', fog='#798898', mist='#cad2db', paper='#eef2f7',
         volt='#0790ff', voltHi='#80bcff', voltLo='#0559a8')

class Face:
    def __init__(self, path):
        self.f = TTFont(path); self.gs = self.f.getGlyphSet(); self.cmap = self.f.getBestCmap(); self.upm = self.f['head'].unitsPerEm
    def width(self, txt, size, track=0):
        return sum(self.gs[self.cmap[ord(c)]].width for c in txt) * size / self.upm + track * size * (len(txt) - 1)
    def path(self, txt, size, x0, y0, track=0):
        sc = size / self.upm; x = 0; ds = []
        for ch in txt:
            g = self.gs[self.cmap[ord(ch)]]; pen = SVGPathPen(self.gs)
            g.draw(TransformPen(pen, (sc, 0, 0, -sc, x0 + x, y0))); ds.append(pen.getCommands()); x += g.width * sc + track * size
        return ' '.join(ds)
    def centered(self, txt, size, cx, y, track=0, fill='#fff'):
        w = self.width(txt, size, track)
        return f'<path d="{self.path(txt, size, cx - w / 2, y, track)}" fill="{fill}"/>'

UB = Face(f'{fonts}/Unbounded.ttf'); UB5 = Face(f'{fonts}/Unbounded500.ttf'); GM = Face(f'{fonts}/GeistMono.ttf')

def svg(w, h, body, title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'

# ---------- grain tile (tileable, transparent luminance noise for CSS overlays)
rng = np.random.default_rng(5)
n = rng.normal(0, 1, (256, 256)).astype(np.float32)
n = (n - n.min()) / (n.max() - n.min())
a = (np.abs(n - 0.5) * 2) ** 1.4 * 70
img = np.zeros((256, 256, 4), np.uint8)
img[..., :3] = np.where(n[..., None] > 0.5, 255, 0)
img[..., 3] = a.clip(0, 255).astype(np.uint8)
Image.fromarray(img).save(f'{out}/grain-256.png', optimize=True)

# ---------- terrazzo texture (CC0 ambientCG Terrazzo005), regraded into the palette, tileable 512
t = np.asarray(Image.open(terr).convert('L').resize((512, 512), Image.LANCZOS)).astype(np.float32) / 255
t = (t - t.mean()) / t.std()
lo = np.array([0x0e, 0x17, 0x21], np.float32); hi = np.array([0x3c, 0x49, 0x58], np.float32)
k = np.clip(0.35 + t * 0.22, 0, 1)[..., None]
col = lo + (hi - lo) * k
speck = (t > 2.2)[..., None]
col = np.where(speck, np.array([0x07, 0x90, 0xff], np.float32) * 0.55 + col * 0.45, col)
Image.fromarray(col.astype(np.uint8)).save(f'{out}/terrazzo-ink-512.webp', quality=82)

# ---------- iso grid pattern (tileable SVG): 60deg lattice with a voxel every so often
w, h = 2 * S * 40, 40
lines = (f'<path d="M0 {h/2} L{w/2} 0 L{w} {h/2} L{w/2} {h} Z" fill="none" stroke="{V["rim"]}" stroke-width="1"/>')
open(f'{out}/iso-grid.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.2f}" height="{h}" viewBox="0 0 {w:.2f} {h}"><title>Isometric grid tile</title>{lines}</svg>\n')

# ---------- orbit divider: a wide isometric ellipse of blocks, with one block out of line
W, H = 1600, 220
parts = []
for i in range(84):
    a = i / 84 * math.tau
    x = W / 2 + math.cos(a) * 760; y = H / 2 + math.sin(a) * 76
    if i % 13 == 6: continue
    s = 6 + 5 * (0.5 + 0.5 * math.sin(a))
    hot = i % 21 == 0
    oy = -34 if i == 63 else 0  # the one that jumped the track
    fill = V['volt'] if hot or i == 63 else (V['slate'] if math.sin(a) < 0 else V['fog'])
    pts = f'{x:.1f},{y+oy-s:.1f} {x+s*S:.1f},{y+oy-s/2:.1f} {x+s*S:.1f},{y+oy+s/2:.1f} {x:.1f},{y+oy+s:.1f} {x-s*S:.1f},{y+oy+s/2:.1f} {x-s*S:.1f},{y+oy-s/2:.1f}'
    parts.append(f'<polygon points="{pts}" fill="{fill}" opacity="{0.55 + 0.45 * (0.5 + 0.5 * math.sin(a)):.2f}"/>')
open(f'{out}/orbit-divider.svg', 'w').write(svg(W, H, ''.join(parts), 'Orbit divider'))

# ---------- stickers (die-cut: white keyline + soft drop)
def hexpts(cx, cy, r):
    return ' '.join(f'{cx + r * math.cos(math.radians(a - 90)):.1f},{cy + r * math.sin(math.radians(a - 90)):.1f}' for a in range(0, 360, 60))
defs = '<defs><filter id="d" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".45"/></filter></defs>'

# 1. Shipping since 2016 (Google Play developer since 2016): an iso cube sticker
cx, cy, r = 160, 160, 128
body = defs + f'<g filter="url(#d)" transform="rotate(-6 160 160)"><polygon points="{hexpts(cx, cy, r + 10)}" fill="{V["paper"]}" stroke="{V["paper"]}" stroke-width="12" stroke-linejoin="round"/>'
top = f'{cx},{cy - r} {cx + r * S},{cy - r / 2} {cx},{cy} {cx - r * S},{cy - r / 2}'
left = f'{cx - r * S},{cy - r / 2} {cx},{cy} {cx},{cy + r} {cx - r * S},{cy + r / 2}'
right = f'{cx},{cy} {cx + r * S},{cy - r / 2} {cx + r * S},{cy + r / 2} {cx},{cy + r}'
body += f'<polygon points="{top}" fill="{V["volt"]}"/><polygon points="{left}" fill="{V["deep"]}"/><polygon points="{right}" fill="{V["rim"]}"/>'
body += f'<g transform="translate({cx} {cy - r / 2}) matrix({S:.4f} 0.5 -{S:.4f} 0.5 0 0)">{UB.centered("2016", 33, 0, 12, fill=V["paper"])}</g>'
body += f'<g transform="translate({cx - r * S / 2} {cy + r / 4}) matrix({S:.4f} 0.5 0 1 0 0)">{UB5.centered("SHIPPING", 15, 0, -6, 0.06, V["mist"])}{UB5.centered("SINCE", 15, 0, 14, 0.06, V["mist"])}</g>'
body += f'<g transform="translate({cx + r * S / 2} {cy + r / 4}) matrix({S:.4f} -0.5 0 1 0 0)">{GM.centered("GOOGLE", 13, 0, -6, 0.1, V["voltHi"])}{GM.centered("PLAY", 13, 0, 12, 0.1, V["voltHi"])}</g></g>'
open(f'{out}/sticker-since-2016.svg', 'w').write(svg(340, 340, f'<g transform="translate(10 10)">{body}</g>', "Sticker: shipping since 2016"))

# 2. Made in Norway: a pill with a tiny iso cube
w2 = UB.width('MADE IN NORWAY', 22, 0.04) + 120
body = defs + f'<g filter="url(#d)" transform="translate(6 14) rotate(3 {w2 / 2 + 20} 60)"><rect x="20" y="22" width="{w2:.1f}" height="76" rx="38" fill="{V["paper"]}"/><rect x="28" y="30" width="{w2 - 16:.1f}" height="60" rx="30" fill="{V["void"]}"/>'
c2x, c2y, rr = 70, 60, 17
body += (f'<polygon points="{c2x},{c2y - rr} {c2x + rr * S:.1f},{c2y - rr / 2} {c2x},{c2y} {c2x - rr * S:.1f},{c2y - rr / 2}" fill="{V["voltHi"]}"/>'
         f'<polygon points="{c2x - rr * S:.1f},{c2y - rr / 2} {c2x},{c2y} {c2x},{c2y + rr} {c2x - rr * S:.1f},{c2y + rr / 2}" fill="{V["volt"]}"/>'
         f'<polygon points="{c2x},{c2y} {c2x + rr * S:.1f},{c2y - rr / 2} {c2x + rr * S:.1f},{c2y + rr / 2} {c2x},{c2y + rr}" fill="{V["voltLo"]}"/>')
body += f'<path d="{UB.path("MADE IN NORWAY", 22, 100, 69, 0.04)}" fill="{V["paper"]}"/></g>'
open(f'{out}/sticker-norway.svg', 'w').write(svg(round(w2 + 80), 150, body, 'Sticker: made in Norway'))

# 3. 113,000+ installs (Fun Libs) : round badge with circular text
R0 = 120
ring_txt = ' FUN LIBS · INSTALLS · NO MARKETING ·'
body = defs + f'<g filter="url(#d)" transform="rotate(-10 150 150)"><circle cx="150" cy="150" r="{R0 + 14}" fill="{V["paper"]}"/><circle cx="150" cy="150" r="{R0 + 4}" fill="{V["volt"]}"/><circle cx="150" cy="150" r="{R0 - 30}" fill="{V["void"]}"/>'
n = len(ring_txt);
for i, ch in enumerate(ring_txt):
    if ch == ' ': continue
    ang = i / n * 360
    body += f'<g transform="rotate({ang:.2f} 150 150)">{GM.centered(ch, 17, 150, 150 - R0 + 22, 0, V["void"])}</g>'
body += UB.centered('113,000+', 27, 150, 160, -0.02, V['paper']) + GM.centered('installs', 14, 150, 184, 0.08, V['voltHi']) + '</g>'
open(f'{out}/sticker-113k.svg', 'w').write(svg(300, 300, body, 'Sticker: 113,000+ installs'))

# 4. The MCP command: a terminal tab sticker
cmd = 'claude mcp add albretsen https://albretsen.no/mcp'
wc = GM.width(cmd, 18) + 80
body = defs + f'<g filter="url(#d)" transform="rotate(-2 {wc / 2} 70)"><rect x="12" y="12" width="{wc:.1f}" height="108" rx="18" fill="{V["paper"]}"/><rect x="20" y="20" width="{wc - 16:.1f}" height="92" rx="12" fill="{V["ink"]}"/>'
body += ''.join(f'<circle cx="{44 + i * 18}" cy="42" r="5" fill="{c}"/>' for i, c in enumerate((V['slate'], V['slate'], V['volt'])))
body += f'<path d="{GM.path("$", 18, 40, 86)}" fill="{V["volt"]}"/><path d="{GM.path(cmd, 18, 62, 86)}" fill="{V["mist"]}"/><rect x="{62 + GM.width(cmd, 18) + 4:.1f}" y="70" width="10" height="20" fill="{V["volt"]}"/></g>'
open(f'{out}/sticker-mcp-command.svg', 'w').write(svg(round(wc + 24), 132, body, 'Sticker: claude mcp add albretsen'))
print('extras ok')
