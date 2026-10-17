import sys; sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.Xjwh7Qx8vB/scr')
from hl import COL, hexc, OUT, R
from identity import text_path, SER, MONO
import math, os
os.makedirs(OUT + 'retired', exist_ok=True)
U, O, S, V, P, E, C = (hexc(COL[k]) for k in ('umber', 'ochre', 'spark', 'vellum', 'peat', 'ember', 'clay'))
from fontTools.ttLib import TTFont

def width_of(font, text, size, track=0):
    return text_path(font, text, size, 0, 0, track)[1]

moons = [
  ('polyglot-pilot', 'Pp', 2025, 10), ('pinpoint', 'Pi', 2025, 35), ('webvakt', 'Wv', 2024, 60),
  ('joke-central', 'Jc', 2024, 85), ('tryggere-hyring', 'Th', 2023, 110), ('early-apps', 'Ea', 2021, 135),
]
for slug, mono, year, phase in moons:
    W, H = 240, 300; cx, cy, r = 120, 120, 96
    pitch = 7.2
    ph = math.radians(phase)
    lx, lz = math.sin(ph), math.cos(ph)  # light swings round: smaller phase = more lit... (full at 0)
    els = []
    rows = int(2 * r / (pitch * .866)) + 2
    for j in range(-rows // 2, rows // 2 + 1):
        y = j * pitch * .866
        off = pitch / 2 if j % 2 else 0
        for i in range(-int(r / pitch) - 2, int(r / pitch) + 3):
            x = i * pitch + off
            d2 = (x * x + y * y) / (r * r)
            if d2 > 1: continue
            nz = math.sqrt(1 - d2); nx, ny = x / r, y / r
            ill = max(0.0, nx * lx + nz * lz)
            ill = ill ** .8
            rad = pitch * .52 * math.sqrt(ill)
            if rad < .35: continue
            col = O if ill > .55 else C
            els.append(f'<circle cx="{cx + x:.1f}" cy="{cy + y:.1f}" r="{rad:.2f}" fill="{col}"/>')
    ring = f'<circle cx="{cx}" cy="{cy}" r="{r + 6}" fill="none" stroke="{O}" stroke-opacity=".35" stroke-width="1"/>'
    tw = width_of(SER, mono, 64)
    d, _ = text_path(SER, mono, 64, cx - tw / 2, cy + 22)
    label = slug.replace('-', ' ').upper()
    yw = width_of(MONO, str(year), 15, 3)
    yd, _ = text_path(MONO, str(year), 15, cx - yw / 2, 268, 3)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="{label} (retired, {year})">\n'
           f'  <circle cx="{cx}" cy="{cy}" r="{r}" fill="{U}"/>\n  ' + ''.join(els) + f'\n  {ring}\n'
           f'  <path d="{d}" fill="{V}" stroke="{U}" stroke-width="6" paint-order="stroke"/>\n'
           f'  <path d="{yd}" fill="{O}"/>\n</svg>\n')
    open(OUT + f'retired/{slug}.svg', 'w').write(svg)
    print(slug, round(len(svg) / 1024), 'KB')
