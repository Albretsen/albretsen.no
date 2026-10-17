"""Retired-product stand-ins: powered-down isometric dioramas (ghost tones, one dim volt detail each).
Usage: python retired.py <outdir>"""
import sys
from isosvg import Scene, svg, MAT

out = sys.argv[1]
W = H = 320

def base(sc):
    sc.box(0, -0.7, 0, 4, 0.7, 4, 'dark', key=(-10, 0))
    # etched tile grid on the base top
    def grid(s):
        lines = []
        for i in range(1, 4):
            for a, b in (((i, 0, 0), (i, 0, 4)), ((0, 0, i), (4, 0, i))):
                lines.append(f'<line x1="{s.pt(a).split(",")[0]}" y1="{s.pt(a).split(",")[1]}" x2="{s.pt(b).split(",")[0]}" y2="{s.pt(b).split(",")[1]}" stroke="#2f3d50" stroke-width="1"/>')
        return ''.join(lines)
    sc.overlay((-9, 0), grid)

def on_left(sc, pts, fill, key, width=None):
    """polygon or polyline drawn on a +z facing plane; pts are 3D"""
    if width:
        d = ' '.join(sc.pt(p) for p in pts)
        sc.overlay(key, f'<polyline points="{d}" fill="none" stroke="{fill}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>')
    else:
        sc.overlay(key, sc.face_poly(pts, fill))

def scene():
    return Scene(s=34, ox=W / 2, oy=196 - 68)

def save(name, sc, title):
    open(f'{out}/{name}.svg', 'w').write(svg(W, H, sc.render(), title))

# Polyglot Pilot: two speech bubbles, one in another language
sc = scene(); base(sc)
sc.box(0.2, 1.0, 0.8, 2.6, 1.6, 0.5, 'stone')
sc.box(0.5, 0.5, 0.8, 0.5, 0.5, 0.5, 'stone')
sc.box(1.2, 2.1, 2.8, 2.4, 1.3, 0.5, 'ghost')
sc.box(3.0, 1.6, 2.8, 0.5, 0.5, 0.5, 'ghost')
for i in range(3):
    x = 1.75 + i * 0.6
    on_left(sc, [(x, 2.6, 3.31), (x + 0.32, 2.6, 3.31), (x + 0.32, 2.92, 3.31), (x, 2.92, 3.31)], MAT['dimvolt'][0], (99, i))
for i, w in enumerate((1.5, 1.0)):
    y = 2.1 - i * 0.45
    on_left(sc, [(0.6, y, 1.31), (0.6 + w, y, 1.31), (0.6 + w, y + 0.18, 1.31), (0.6, y + 0.18, 1.31)], MAT["paper"][1], (4.8, i))
save('retired-polyglot-pilot', sc, 'Polyglot Pilot (retired) stand-in')

# PinPoint: a pin on a photo tile, and a wrong guess
sc = scene(); base(sc)
sc.box(0.5, 0, 0.5, 2.4, 0.12, 1.8, 'paper')  # the photo
sc.box(0.65, 0.12, 0.65, 2.1, 0.02, 1.5, 'ghost')
sc.box(2.95, 0, 2.75, 0.3, 2.2, 0.3, 'paper')
sc.box(2.6, 2.2, 2.4, 1.0, 1.0, 1.0, 'dimvolt')
sc.box(0.6, 0, 3.1, 0.7, 0.14, 0.18, 'stone'); sc.box(0.86, 0, 2.85, 0.18, 0.14, 0.7, 'stone')
save('retired-pinpoint', sc, 'PinPoint (retired) stand-in')

# WebVakt: a monitor watching a page for a change
sc = scene(); base(sc)
sc.box(1.6, 0, 1.9, 0.8, 0.3, 0.6, 'stone'); sc.box(1.85, 0.3, 2.0, 0.3, 0.8, 0.3, 'stone')
sc.box(0.3, 1.1, 1.8, 3.4, 2.4, 0.4, 'stone')
on_left(sc, [(0.5, 1.3, 2.21), (3.5, 1.3, 2.21), (3.5, 3.3, 2.21), (0.5, 3.3, 2.21)], MAT['dark'][1], (50, 0))
for i, (w, c) in enumerate(((2.2, MAT['ghost'][0]), (1.6, MAT['dimvolt'][1]), (2.5, MAT['ghost'][0]), (1.2, MAT['ghost'][0]))):
    y = 2.85 - i * 0.42
    on_left(sc, [(0.75, y, 2.22), (0.75 + w, y, 2.22), (0.75 + w, y + 0.2, 2.22), (0.75, y + 0.2, 2.22)], c, (51, i))
save('retired-webvakt', sc, 'WebVakt (retired) stand-in')

# Daily Jokes / Joke Central: a grinning block with a popped confetti voxel
sc = scene(); base(sc)
sc.box(0.9, 0, 0.9, 2.2, 2.2, 2.2, 'stone')
on_left(sc, [(1.45, 1.45, 3.11), (1.7, 1.45, 3.11), (1.7, 1.7, 3.11), (1.45, 1.7, 3.11)], MAT['paper'][0], (60, 0))
on_left(sc, [(2.3, 1.45, 3.11), (2.55, 1.45, 3.11), (2.55, 1.7, 3.11), (2.3, 1.7, 3.11)], MAT['paper'][0], (60, 1))
on_left(sc, [(1.3, 1.05, 3.11), (1.6, 0.7, 3.11), (2.4, 0.7, 3.11), (2.7, 1.05, 3.11)], MAT['paper'][0], (60, 2), width=5)
sc.box(2.9, 2.9, 0.6, 0.45, 0.45, 0.45, 'dimvolt'); sc.box(0.3, 2.6, 2.6, 0.3, 0.3, 0.3, 'ghost')
save('retired-joke-central', sc, 'Daily Jokes / Joke Central (retired) stand-in')

# Tryggere Hyring: a document slab with a check
sc = scene(); base(sc)
sc.box(0.8, 0, 1.6, 2.4, 3.0, 0.4, 'stone')
for i, w in enumerate((1.6, 1.2, 1.7)):
    y = 2.4 - i * 0.4
    on_left(sc, [(1.1, y, 2.01), (1.1 + w, y, 2.01), (1.1 + w, y + 0.15, 2.01), (1.1, y + 0.15, 2.01)], MAT['ghost'][0], (40, i))
on_left(sc, [(1.3, 0.75, 2.01), (1.65, 0.45, 2.01), (2.5, 1.2, 2.01)], MAT['dimvolt'][0], (41, 0), width=6)
sc.box(0.2, 0, 0.3, 0.9, 0.9, 0.9, 'ghost')
save('retired-tryggere-hyring', sc, 'Tryggere Hyring (retired) stand-in')

# Early apps (IAGO HMS, Rentekalkulator, Prosentkalkulator): a calculator slab
sc = scene(); base(sc)
sc.box(0.6, 0, 0.5, 2.8, 0.5, 3.0, 'stone')
sc.box(0.85, 0.5, 0.7, 2.3, 0.08, 0.7, 'dark', key=(30, 0))
k = 0
for r in range(3):
    for c in range(3):
        mat = 'dimvolt' if (r, c) == (2, 2) else 'ghost'
        sc.box(0.9 + c * 0.8, 0.5, 1.6 + r * 0.6, 0.55, 0.14, 0.45, mat, key=(31 + r + c * 0.1, k)); k += 1
save('retired-early-apps', sc, 'Early apps (retired) stand-in')
print('retired ok')
