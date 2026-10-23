# Ambient scooter: a 1960s Italian step-through scooter (Vespa spirit, unbadged), cream with burgundy seat.
#   blender -b --python scooter.py -- out.glb
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix
from vlib import *

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '/tmp/scooter.glb'
PAINT = argv[1] if len(argv) > 1 else '#efe3cf'

reset()
M = std_mats(PAINT, PAL['powder'], PAL['burgundy'])
root = empty('scooter', (0, 0, 0))
R, FW, RW = 0.20, 0.74, -0.55   # wheel radius, front / rear wheel f


def ell_ring(f, w, h0, h1, n=16, flat_bottom=0.25):
    pts = []
    cz, rz = (h0 + h1) / 2, (h1 - h0) / 2
    for k in range(n):
        a = 2 * math.pi * k / n - math.pi / 2
        x, z = math.cos(a), math.sin(a)
        z = max(z, -1 + flat_bottom * (1 - abs(x))) if z < 0 else z
        sx = math.copysign(abs(x) ** 0.8, x)   # slightly squarer section
        pts.append(P(f, w * sx, cz + rz * z))
    return pts


# rear cowl: a bulbous shell over the engine, wider at the hips
COWL = [(-0.92, 0.04, 0.50, 0.58), (-0.89, 0.12, 0.42, 0.66), (-0.82, 0.19, 0.34, 0.71), (-0.70, 0.235, 0.29, 0.735),
        (-0.55, 0.255, 0.27, 0.74), (-0.38, 0.25, 0.27, 0.735), (-0.22, 0.22, 0.28, 0.72), (-0.10, 0.17, 0.29, 0.69),
        (-0.04, 0.12, 0.30, 0.64), (-0.02, 0.05, 0.31, 0.58)]
v, fc, _ = loft([ell_ring(f, w, a, b) for (f, w, a, b) in COWL])
bm = bm_from(v, fc); fix_normals(bm)
cowl = make_obj('body', bm, [M['paint']], root)
# rear wheel pocket on the left (the engine side is closed)
c = cyl('cut', 0.25, 0.3, P(RW, 0.0, R), 'X', 24, M['shadow'])
boolean(cowl, c); delete(c)

parts = []
# floorboard with rubber strips
parts.append(box('floor', (0.34, 0.52, 0.05), P(0.20, 0, 0.27), M['paint'], 0.02, 2))
for s in (-0.11, -0.055, 0.0, 0.055, 0.11):
    parts.append(box('strip', (0.018, 0.46, 0.012), P(0.20, s, 0.298), M['trim'], 0.004, 1))
parts.append(box('tunnel', (0.14, 0.40, 0.10), P(0.20, 0, 0.32), M['paint'], 0.04, 2))

# leg shield: a curved panel, concave toward the rider
rows = []
for j, h in enumerate([0.27, 0.40, 0.55, 0.70, 0.84, 0.95, 1.00]):
    half = 0.24 - 0.05 * (max(0, h - 0.84) / 0.16) ** 2 * 3
    half = max(0.14, half)
    rows.append([P(0.47 + 0.10 * (h - 0.27) / 0.73 - 0.07 * (s / 0.24) ** 2, s, h)
                 for s in [half * x for x in (-1, -0.7, -0.35, 0, 0.35, 0.7, 1)]])
verts = [p for r in rows for p in r]
faces = [[j * 7 + i, j * 7 + i + 1, (j + 1) * 7 + i + 1, (j + 1) * 7 + i] for j in range(len(rows) - 1) for i in range(6)]
bm = bm_from(verts, faces)
bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.025)
fix_normals(bm)
parts.append(make_obj('shield', bm, [M['paint']]))
# chrome edge on the shield
parts.append(tube('sedge', [rows[j][0] for j in range(len(rows))] + [rows[-1][3]] + [rows[j][6] for j in reversed(range(len(rows)))],
                  0.009, M['chrome'], 5, caps=False))
# horn grille badge on the shield front
parts.append(box('horn', (0.10, 0.02, 0.07), P(0.62, 0, 0.82), M['chrome'], 0.012, 2))

# seat + rack + taillight
parts.append(box('seat', (0.26, 0.62, 0.09), P(-0.42, 0, 0.785), M['interior'], 0.04, 3))
parts.append(box('seatbase', (0.24, 0.58, 0.03), P(-0.42, 0, 0.735), M['trim'], 0.01, 1))
parts.append(tube('rack', [P(-0.72, -0.13, 0.76), P(-0.92, -0.12, 0.70), P(-0.92, 0.12, 0.70), P(-0.72, 0.13, 0.76)], 0.009, M['chrome'], 5))
parts.append(box('tl', (0.10, 0.03, 0.06), P(-0.925, 0, 0.56), M['tail'], 0.014, 2))
parts.append(box('plate', (0.16, 0.01, 0.09), P(-0.93, 0, 0.45), M['plaster'], 0.005, 1))
# side stand + exhaust
parts.append(tube('stand', [P(-0.10, 0.10, 0.27), P(-0.16, 0.13, 0.0)], 0.012, M['trim'], 5))
parts.append(tube('stand', [P(-0.10, -0.10, 0.27), P(-0.16, -0.13, 0.0)], 0.012, M['trim'], 5))
parts.append(cyl('exhaust', 0.04, 0.32, P(-0.70, -0.18, 0.24), 'Y', 10, M['trim']))
body = join('body', [cowl] + parts, root)
clean(body, 1e-5); finish(body, 38)

# --- handlebar node (rotates about Z around the headset): headset, headlight, bars, front fender, fork
HS = P(0.56, 0, 0.96)
hp = []
hp.append(box('headset', (0.20, 0.16, 0.12), P(0.54, 0, 1.03), M['paint'], 0.05, 3))
hp.append(lathe('hl', [(0.0, -0.03), (0.038, -0.027), (0.058, -0.016), (0.064, -0.004), (0.072, -0.008),
                       (0.076, 0.0), (0.07, 0.07)], 16, P(0.63, 0, 1.03), 'Y', [M['head'], M['chrome']],
                lambda k: 0 if k < 3 else 1))
hp.append(tube('bars', [P(0.48, -0.33, 1.05), P(0.53, -0.12, 1.05), P(0.53, 0.12, 1.05), P(0.48, 0.33, 1.05)], 0.014, M['chrome'], 6))
for s in (-0.30, 0.30):
    hp.append(cyl('grip', 0.02, 0.10, P(0.49, s, 1.05), 'X', 8, M['trim']))
    ms = P(0.52, s * 0.8, 1.06)
    hp.append(tube('mst', [ms, ms + Vector((s * 0.10, 0.02, 0.13))], 0.006, M['chrome'], 5))
    mh = cyl('mhead', 0.035, 0.015, ms + Vector((s * 0.11, 0.02, 0.15)), 'Y', 12, M['chrome'])
    hp.append(mh)
hp.append(tube('column', [P(0.55, 0, 1.0), P(0.60, 0, 0.42), P(0.64, 0, 0.30)], 0.034, M['paint'], 8))
arc = []
for k in range(11):
    a = math.radians(175 - 150 * k / 10)
    arc.append(P(FW - 0.26 * math.cos(a), 0, R + 0.02 + 0.26 * math.sin(a)))
hp.append(sweep('fender', arc, [(-0.07, 0.0), (0.07, 0.0), (0.075, 0.025), (0.0, 0.05), (-0.075, 0.025)], M['paint']))
hp.append(tube('link', [P(0.64, 0.07, 0.30), P(FW, 0.07, R)], 0.016, M['trim'], 6))
handle = join('handlebar', hp, root)
set_origin(handle, HS)
finish(handle, 38)

# wheels: small, with split rims
car_wheel('wheel_f', 1, P(FW, 0.0, R), R, 0.09, [M['chrome'], M['paint_accent'], M['tyre'], M['shadow']], parent=root, lugs=4, segs=16)
car_wheel('wheel_r', 1, P(RW, 0.0, R), R, 0.09, [M['chrome'], M['paint_accent'], M['tyre'], M['shadow']], parent=root, lugs=4, segs=16)
empty('seat_rider', P(-0.34, 0, 0.83), root)
empty('seat_pillion', P(-0.62, 0, 0.83), root)
empty('light_head', P(0.70, 0, 1.03), root)
empty('light_tail', P(-0.95, 0, 0.56), root)
export(OUT)
