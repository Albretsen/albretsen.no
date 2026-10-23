# Ambient city car: a round little 1960s Italian runabout (Fiat 500 spirit), pink, canvas sunroof.
#   blender -b --python city_car.py -- out.glb
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix
from vlib import *

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '/tmp/city_car.glb'
PAINT = argv[1] if len(argv) > 1 else PAL['pink']

reset()
M = std_mats(PAINT, PAL['plaster'], PAL['burgundy'])
CANVAS = mat('canvas', '#3a4266', 0.9)
root = empty('city_car', (0, 0, 0))
FA, RA, R, WX = 0.92, -0.92, 0.26, 0.55


def W(f):
    w = 0.66
    if f > 0.90:
        u = min((f - 0.90) / 0.60, 0.999); w *= (1 - u ** 3) ** (1 / 3)
    if f < -0.90:
        u = min((-f - 0.90) / 0.60, 0.999); w *= (1 - u ** 3) ** (1 / 3)
    return w


def belt(f):
    if f > 0.55:
        return 0.80 - 0.20 * ((f - 0.55) / 0.95) ** 1.5
    if f < -0.85:
        return 0.80 - 0.10 * ((-f - 0.85) / 0.65) ** 1.8
    return 0.80


def section(f):
    w, b = W(f), belt(f)
    t = b + 0.02
    z0 = 0.22
    if abs(f) > 1.15: z0 += 0.09 * ((abs(f) - 1.15) / 0.35) ** 2
    k = 0.08 * max(0.0, (abs(f) - 1.30) / 0.20) ** 2
    t -= k; b -= 0.6 * k; z0 += k
    hc = z0 + 0.55 * (b - z0)
    half = [(0.0, z0), (w * 0.78, z0), (w * 0.93, z0 + 0.04), (w * 0.985, z0 + 0.12), (w, hc),
            (w * 0.99, hc + 0.5 * (b - 0.03 - hc)), (w * 0.96, b - 0.03), (w * 0.9, b), (w * 0.72, t - 0.004), (0.0, t)]
    ring = [P(f, s, h) for (s, h) in half] + [P(f, -s, h) for (s, h) in reversed(half[1:-1])]
    return ring


ST = [-1.50, -1.49, -1.46, -1.42, -1.36, -1.28, -1.18, -1.05, -0.9, -0.6, -0.3, 0.0, 0.3, 0.6, 0.9, 1.05,
      1.18, 1.28, 1.36, 1.42, 1.46, 1.49, 1.50]
v, fc, _ = loft([section(f) for f in ST])
bm = bm_from(v, fc); fix_normals(bm)
body = make_obj('body', bm, [M['paint']], root)
arch_cut(body, FA, R + 0.01, 0.31, M['shadow'], s_from=0.45)
arch_cut(body, RA, R + 0.01, 0.31, M['shadow'], s_from=0.45)

# ---- cabin (greenhouse) loft
CAB = [(0.66, 0.79), (0.58, 0.92), (0.48, 1.07), (0.38, 1.19), (0.27, 1.27), (0.16, 1.30), (-0.20, 1.31),
       (-0.50, 1.30), (-0.62, 1.27), (-0.74, 1.18), (-0.86, 1.04), (-0.95, 0.90), (-1.00, 0.80)]


def top_at(f):
    for (f0, h0), (f1, h1) in zip(CAB, CAB[1:]):
        if f1 <= f <= f0:
            t = (f - f0) / (f1 - f0)
            return h0 + (h1 - h0) * t
    return 0.8


WB, WT = 0.60, 0.50


def cab_ring(f, top):
    b = belt(f) - 0.03
    rise = max(0.0, top - b)
    k = min(1.0, rise / 0.35)
    wt = WB + (WT - WB) * k
    half = [(WB, b), (wt, b + rise * 0.80), (wt * 0.95, b + rise * 0.93), (wt * 0.80, top - 0.012), (wt * 0.45, top - 0.002), (0.0, top)]
    return [P(f, s, h) for (s, h) in half] + [P(f, -s, h) for (s, h) in reversed(half[:-1])] + [P(f, 0, b - 0.02)]


rings = []
for f, t in CAB:
    rings.append(cab_ring(f, t))
v, fc, _ = loft(rings)
bm = bm_from(v, fc); fix_normals(bm)
cabin = make_obj('cabin', bm, [M['paint']], root)


def side_pt(f, vv, sg):
    b = belt(f) - 0.03
    top = top_at(f)
    rise = top - b
    k = min(1.0, rise / 0.35)
    wt = WB + (WT - WB) * k
    p0 = Vector((WB, b)); p1 = Vector((wt, b + rise * 0.80))
    q = p0.lerp(p1, vv)
    return P(f, sg * q.x, q.y)


panes = []
for sg in (1, -1):
    for (f0, f1) in ((0.24, -0.14), (-0.22, -0.56)):
        panes.append(surface_pane('win', lambda u, vv, f0=f0, f1=f1, sg=sg: side_pt(f0 + (f1 - f0) * u, 0.14 + 0.80 * vv, sg),
                                  4, 1, M['glass_dark'], lambda p, sg=sg: Vector((sg * 0.006, 0, 0.0))))
# windshield and rear window lie on the sloped top surface
def top_pt(f, s):
    return P(f, s, top_at(f))
panes.append(surface_pane('ws', lambda u, vv: top_pt(0.60 - 0.36 * vv, (u - 0.5) * 2 * 0.47), 4, 4, M['glass_dark'],
                          lambda p: Vector((0, -0.004, 0.006))))
panes.append(surface_pane('rw', lambda u, vv: top_pt(-0.66 - 0.24 * vv, (u - 0.5) * 2 * 0.40), 4, 3, M['glass_dark'],
                          lambda p: Vector((0, 0.004, 0.006))))
# canvas sunroof
panes.append(surface_pane('sunroof', lambda u, vv: top_pt(0.12 - 0.58 * vv, (u - 0.5) * 2 * 0.30), 2, 6, CANVAS,
                          lambda p: Vector((0, 0, 0.008))))
for i in range(5):
    f = 0.08 - i * 0.12
    panes.append(tube('rib', [top_pt(f, -0.30) + Vector((0, 0, 0.011)), top_pt(f, 0.30) + Vector((0, 0, 0.011))],
                      0.008, CANVAS, 5))

# ---- trim
trim = []
for s in (-0.42, 0.42):   # fender-mounted headlights
    trim.append(lathe('hl', [(0.0, -0.03), (0.04, -0.027), (0.062, -0.017), (0.068, -0.006), (0.078, -0.01),
                             (0.084, 0.0), (0.084, 0.06)], 18, P(1.40, s, 0.585), 'Y', [M['head'], M['chrome']],
                      lambda k: 0 if k < 3 else 1))
for sg in (1, -1):   # chrome moustache
    trim.append(tube('whisker', [P(1.497, 0.03 * sg, 0.52), P(1.47, 0.16 * sg, 0.535), P(1.42, 0.27 * sg, 0.55)],
                     0.008, M['chrome'], 5))
trim.append(cyl('badge', 0.028, 0.012, P(1.50, 0, 0.52), 'Y', 12, M['chrome']))
for front in (True, False):
    sg = 1 if front else -1
    endf = sg * 1.52
    path = [P(sg * 1.42, -0.46, 0.36), P(endf, -0.30, 0.36), P(endf + sg * 0.006, 0, 0.36), P(endf, 0.30, 0.36), P(sg * 1.42, 0.46, 0.36)]
    trim.append(sweep('bumper', path, [(-0.012, -0.02), (0.012, -0.02), (0.018, 0), (0.012, 0.02), (-0.012, 0.02), (-0.018, 0)], M['chrome']))
    for s in (-0.22, 0.22):
        trim.append(box('over', (0.04, 0.04, 0.11), P(endf + sg * 0.01, s, 0.39), M['chrome'], 0.015, 2))
for s in (-0.47, 0.47):
    trim.append(box('tl', (0.05, 0.04, 0.12), P(-1.43, s, 0.60), M['tail'], 0.016, 2))
trim.append(box('plate', (0.30, 0.012, 0.09), P(-1.505, 0, 0.47), M['plaster'], 0.005, 1))
for i in range(5):   # engine louvres
    trim.append(box('louvre', (0.30, 0.014, 0.012), P(-1.32 - i * 0.03, 0, belt(-1.32 - i * 0.03) - 0.005 - i * 0.012),
                    M['trim'], 0.004, 1))
for sg in (1, -1):
    trim.append(box('dh', (0.02, 0.09, 0.02), P(-0.10, sg * 0.655, 0.72), M['chrome'], 0.006, 2))
    trim.append(tube('dline', [P(0.62, sg * 0.662, 0.40), P(0.62, sg * 0.662, 0.775)], 0.004, M['shadow'], 4))
    trim.append(tube('dline', [P(-0.30, sg * 0.662, 0.40), P(-0.30, sg * 0.662, 0.775)], 0.004, M['shadow'], 4))
    trim.append(tube('sill', [P(0.75, sg * 0.645, 0.30), P(-0.65, sg * 0.645, 0.30)], 0.012, M['chrome'], 6))
    base = P(0.55, sg * 0.66, 0.80)
    trim.append(tube('mst', [base, base + Vector((sg * 0.06, 0, 0.07))], 0.007, M['chrome'], 5))
    m_ = lathe('mh', [(0.0, 0.035), (0.025, 0.03), (0.032, 0.0), (0.0, -0.02)], 10, (0, 0, 0), 'Y', [M['chrome']])
    m_.location = base + Vector((sg * 0.07, 0, 0.09)); trim.append(m_)
body = join('body', [body, cabin] + panes + trim, root)
clean(body, 1e-5)
finish(body)

for nm, sg, fa in (('wheel_fl', 1, FA), ('wheel_fr', -1, FA), ('wheel_rl', 1, RA), ('wheel_rr', -1, RA)):
    car_wheel(nm, sg, P(fa, sg * WX, R), R, 0.15, [M['chrome'], M['plaster'], M['tyre'], M['shadow']], parent=root, lugs=4, segs=18)

empty('light_head_l', P(1.47, 0.42, 0.585), root)
empty('light_head_r', P(1.47, -0.42, 0.585), root)
empty('light_tail_l', P(-1.46, 0.47, 0.60), root)
empty('light_tail_r', P(-1.46, -0.47, 0.60), root)
export(OUT)
