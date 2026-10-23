# Ambient van: a corrugated 1950s-60s French delivery van (Citroen H-type spirit, unbadged), mustard.
#   blender -b --python van.py -- out.glb
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix
from vlib import *

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '/tmp/van.glb'
PAINT = argv[1] if len(argv) > 1 else PAL['mustard']

reset()
M = std_mats(PAINT, PAL['plaster'], PAL['burgundy'])
root = empty('van', (0, 0, 0))
FA, RA, R, WX = 1.30, -1.32, 0.36, 0.78
HW, ZB, ZT = 0.95, 0.42, 2.22   # half width, body bottom, roof


def top(f):
    if f > 0.72:
        return ZT - (ZT - 1.36) * min(1.0, (f - 0.72) / 0.26)
    return ZT


def width(f):
    w = HW
    if f < -2.05: w -= 0.07 * ((-f - 2.05) / 0.10) ** 2
    if f > 0.90: w -= 0.05 * ((f - 0.90) / 0.08) ** 2
    return w


def box_section(f, w, zb, zt, rt=0.16, rb=0.05):
    pts = [(0.0, zb), (w - rb, zb), (w - rb * 0.3, zb + rb * 0.3), (w, zb + rb)]
    for k in range(5):   # rounded roof corner
        a = math.pi / 2 * k / 4
        pts.append((w - rt + rt * math.cos(a), zt - rt + rt * math.sin(a)))
    pts.append((0.0, zt))
    ring = [P(f, s, h) for (s, h) in pts] + [P(f, -s, h) for (s, h) in reversed(pts[1:-1])]
    return ring


ST = [-2.15, -2.14, -2.11, -2.06, -1.6, -1.0, -0.4, 0.2, 0.6, 0.72, 0.84, 0.92, 0.96, 0.98]
rings = [box_section(f, width(f), ZB, top(f), rt=0.16 if top(f) > 2 else 0.10) for f in ST]
v, fc, _ = loft(rings)
bm = bm_from(v, fc); fix_normals(bm)
body = make_obj('body', bm, [M['paint']], root)
arch_cut(body, RA, R + 0.02, 0.43, M['shadow'], s_from=0.6, depth=0.5)

# bonnet: narrow tapering nose
def bon_section(f):
    t = max(0.0, (f - 0.95) / 0.62)
    zt = 1.30 - 0.36 * t ** 1.2
    return box_section(f, 0.52 - 0.04 * t, 0.46, zt, rt=0.10, rb=0.04)
v, fc, _ = loft([bon_section(f) for f in (0.94, 1.1, 1.3, 1.45, 1.57)])
bm = bm_from(v, fc); fix_normals(bm)
parts = [make_obj('bonnet', bm, [M['paint']])]

# front wings: arched shells over the front wheels + running boards
wing = [(-0.22, 0.0), (0.22, 0.0), (0.22, 0.035), (-0.22, 0.035)]
for sg in (1, -1):
    arc = []
    for k in range(13):
        a = math.radians(188 - 198 * k / 12)
        arc.append(P(FA + 0.47 * math.cos(a) * -1, sg * 0.75, R + 0.04 + 0.47 * math.sin(a)))
    arc = arc + [P(0.62, sg * 0.75, 0.46)]
    parts.append(sweep('wing', arc, wing, M['paint']))
    parts.append(box('step', (0.32, 0.55, 0.04), P(0.45, sg * 0.82, 0.46), M['trim'], 0.01, 1))
    # headlight pods on the wings
    parts.append(lathe('hl', [(0.0, -0.035), (0.05, -0.03), (0.08, -0.02), (0.088, -0.008), (0.098, -0.012),
                              (0.104, 0.0), (0.09, 0.12), (0.0, 0.14)], 16, P(1.62, sg * 0.66, 0.98), 'Y',
                       [M['head'], M['paint']], lambda k: 0 if k < 3 else 1))
    parts.append(tube('hlst', [P(1.55, sg * 0.66, 0.90), P(1.50, sg * 0.66, 0.72)], 0.02, M['trim'], 6))

# corrugations: vertical ribs on the cargo sides, fore-aft ribs on bonnet + roof
for sg in (1, -1):
    f = -2.0
    while f < 0.0:
        lo = 0.86 if abs(f - RA) < 0.47 else 0.50
        parts.append(tube('rib', [P(f, sg * (HW - 0.004), lo), P(f, sg * (HW - 0.004), 1.92)], 0.024, M['paint'], 8))
        f += 0.17
for s in (-0.6, -0.3, 0.0, 0.3, 0.6):
    parts.append(box('rrib', (0.05, 2.0, 0.03), P(-0.95, s, ZT + 0.008), M['paint'], 0.012, 1))
for s in (-0.30, -0.10, 0.10, 0.30):
    parts.append(tube('brib', [P(0.98, s, 1.29), P(1.30, s, 1.13), P(1.55, s, 0.955)], 0.014, M['paint'], 6))

# grille: dark recess with vertical bars
parts.append(box('grille', (0.70, 0.03, 0.40), P(1.575, 0, 0.70), M['trim'], 0.02, 2))
for i in range(9):
    s = -0.30 + i * 0.075
    parts.append(box('gbar', (0.02, 0.03, 0.38), P(1.592, s, 0.70), M['chrome'], 0.006, 1))
parts.append(sweep('bumper', [P(1.60, -0.85, 0.48), P(1.66, -0.4, 0.48), P(1.665, 0, 0.48), P(1.66, 0.4, 0.48), P(1.60, 0.85, 0.48)],
                   [(-0.012, -0.03), (0.012, -0.03), (0.018, 0), (0.012, 0.03), (-0.012, 0.03), (-0.018, 0)], M['chrome']))
parts.append(sweep('rbumper', [P(-2.18, -0.9, 0.45), P(-2.19, 0, 0.45), P(-2.18, 0.9, 0.45)],
                   [(-0.012, -0.03), (0.012, -0.03), (0.018, 0), (0.012, 0.03), (-0.012, 0.03), (-0.018, 0)], M['chrome']))

# windows: split windscreen on the slanted face, cab door windows, small rear windows
def slant_pt(u, vv, s0, s1):
    f = 0.74 + (0.95 - 0.74) * (1 - vv) * 0.95
    return P(f, s0 + (s1 - s0) * u, top(f) + 0.006)
for (s0, s1) in ((-0.84, -0.05), (0.05, 0.84)):
    parts.append(surface_pane('ws', lambda u, vv, s0=s0, s1=s1: P(0.965 - 0.20 * vv, s0 + (s1 - s0) * u, 1.40 + 0.70 * vv),
                              2, 2, M['glass_dark'], lambda p: Vector((0, -0.012, 0.004))))
for sg in (1, -1):
    parts.append(surface_pane('dw', lambda u, vv, sg=sg: P(0.20 + 0.42 * u, sg * HW, 1.40 + 0.48 * vv), 1, 1, M['glass_dark'],
                              lambda p, sg=sg: Vector((sg * 0.008, 0, 0))))
    parts.append(tube('dline', [P(0.68, sg * (HW + 0.004), 0.45), P(0.68, sg * (HW + 0.004), 1.95), P(0.12, sg * (HW + 0.004), 1.95), P(0.12, sg * (HW + 0.004), 0.45)], 0.005, M['shadow'], 4))
    parts.append(box('dh', (0.025, 0.10, 0.025), P(0.20, sg * (HW + 0.012), 1.20), M['chrome'], 0.008, 2))
    base = P(0.95, sg * (HW - 0.02), 1.55)
    parts.append(tube('mst', [base, base + Vector((sg * 0.18, -0.02, 0.0))], 0.010, M['trim'], 5))
    parts.append(box('mh', (0.03, 0.10, 0.16), base + Vector((sg * 0.20, -0.02, 0.0)), M['chrome'], 0.015, 2))
    parts.append(surface_pane('rwin', lambda u, vv, sg=sg: P(-2.16, sg * (0.18 + 0.52 * u), 1.45 + 0.5 * vv), 1, 1, M['glass_dark'],
                              lambda p: Vector((0, 0.01, 0))))
    parts.append(box('tl', (0.10, 0.03, 0.14), P(-2.165, sg * 0.80, 0.70), M['tail'], 0.02, 2))
parts.append(tube('rdoor', [P(-2.16, 0, 0.45), P(-2.16, 0, 2.08)], 0.006, M['shadow'], 4))
parts.append(box('plate', (0.34, 0.012, 0.10), P(-2.17, 0, 0.62), M['plaster'], 0.005, 1))
# side sign panel (plaster) on the cargo box; builders can recolour 'paint_accent'
for sg in (1, -1):
    parts.append(box('sign', (0.02, 1.40, 0.40), P(-1.05, sg * (HW + 0.03), 1.62), M['paint_accent'], 0.01, 1))
parts.append(box('under', (1.5, 3.4, 0.10), P(-0.6, 0, 0.40), M['shadow']))

body = join('body', [body] + parts, root)
clean(body, 1e-5)
finish(body)
for nm, sg, fa in (('wheel_fl', 1, FA), ('wheel_fr', -1, FA), ('wheel_rl', 1, RA), ('wheel_rr', -1, RA)):
    car_wheel(nm, sg, P(fa, sg * WX, R), R, 0.20, [M['chrome'], M['paint'], M['tyre'], M['shadow']], parent=root, lugs=5, segs=20)
empty('light_head_l', P(1.70, 0.66, 0.98), root)
empty('light_head_r', P(1.70, -0.66, 0.98), root)
empty('light_tail_l', P(-2.19, 0.80, 0.70), root)
empty('light_tail_r', P(-2.19, -0.80, 0.70), root)
export(OUT)
