# Hero car: a small 1960s Italian-French spider (think Alfa Duetto / Fiat 124 Spider),
# powder blue, burgundy leather, wood-rim wheel. Blender 5.x:
#   blender -b --python hero_car.py -- out.glb [paint_hex]
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix
from vlib import *

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '/tmp/hero_car.glb'
PAINT = argv[1] if len(argv) > 1 else PAL['powder']

reset()
M = std_mats(PAINT, PAL['plaster'], PAL['burgundy'])
WOOD = mat('wood', '#8f4f33', 0.55)
CANVAS = mat('canvas', '#3a4266', 0.9)
root = empty('hero_car', (0, 0, 0))

FA, RA = 1.20, -1.05          # axles (f)
WR, WX, WW = 0.30, 0.68, 0.17  # wheel radius, track half, tyre width


def g(x, w):
    return math.exp(-(x / w) ** 2)


def W(f):
    w = 0.80 + 0.02 * g(f + 1.05, 0.5)
    if f > 1.40:
        u = min((f - 1.40) / 0.62, 0.999); w *= (1 - u ** 4) ** 0.25
    if f < -1.45:
        u = min((-f - 1.45) / 0.58, 0.999); w *= (1 - u ** 5) ** 0.2
    return w


def belt(f):
    if f > 0.42:
        b = 0.80 - 0.10 * ((f - 0.42) / 1.58) ** 1.6 + 0.022 * g(f - 1.2, 0.38)
    elif f > -0.80:
        b = 0.80 - 0.008 * g(f + 0.2, 0.4)
    else:
        b = 0.80 + 0.03 * g(f + 1.1, 0.42) - 0.05 * ((-f - 0.80) / 1.2) ** 2
    return b


def section(f):
    w, b = W(f), belt(f)
    t = b + (0.018 if f > -0.8 else 0.022)
    z0 = 0.22
    if f > 1.55: z0 += 0.10 * ((f - 1.55) / 0.45) ** 2
    if f < -1.55: z0 += 0.11 * ((-f - 1.55) / 0.45) ** 2
    k = (0.07 if f > 0 else 0.045) * max(0.0, (abs(f) - 1.84) / 0.16) ** 2
    t -= k; b -= 0.6 * k; z0 += k
    hc = z0 + 0.56 * (b - z0)
    half = [
        (0.0, z0), (w * 0.80, z0), (w * 0.93, z0 + 0.03), (w * 0.985, z0 + 0.11),
        (w, hc), (w * 0.992, hc + 0.5 * (b - 0.03 - hc)), (w * 0.968, b - 0.028),
        (w * 0.905, b), (w * 0.78, b + 0.6 * (t - b)), (w * 0.45, t - 0.003), (0.0, t),
    ]
    ring = [P(f, s, h) for (s, h) in half]
    ring += [P(f, -s, h) for (s, h) in reversed(half[1:-1])]
    return ring, (w, b, t, z0, hc)


STATIONS = [-2.0, -1.985, -1.96, -1.92, -1.86, -1.78, -1.66, -1.5, -1.3, -1.1, -0.9, -0.7, -0.45,
            -0.2, 0.05, 0.3, 0.55, 0.8, 1.0, 1.2, 1.4, 1.56, 1.7, 1.8, 1.88, 1.94, 1.975, 2.0]
rings = [section(f)[0] for f in STATIONS]
v, fc, _ = loft(rings)
bm = bm_from(v, fc)
fix_normals(bm)
body = make_obj('body', bm, [M['paint']], root)

# --- wheel arches (pockets in the outer shell only)
for fa in (FA, RA):
    for sgn in (1, -1):
        c = cyl('cut', 0.36, 0.5, P(fa, sgn * 0.84, WR + 0.01), 'X', 28, M['shadow'])
        boolean(body, c); delete(c)

# --- cockpit tub: rounded box, carpet floor, burgundy walls
def rounded_box_cutter(f0, f1, sw, h0, h1, r, m_side, m_floor):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector((2 * sw, f1 - f0, h1 - h0)), verts=bm.verts)
    vert_edges = [e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > 0.01]
    bmesh.ops.bevel(bm, geom=vert_edges, offset=r, segments=4, affect='EDGES', profile=0.5)
    bmesh.ops.translate(bm, vec=P((f0 + f1) / 2, 0, (h0 + h1) / 2), verts=bm.verts)
    for fa in bm.faces:
        fa.material_index = 1 if fa.normal.z < -0.5 else 0
    return make_obj('cut', bm, [m_side, m_floor])

c = rounded_box_cutter(-0.80, 0.40, 0.655, 0.36, 1.6, 0.16, M['interior'], M['carpet'])
boolean(body, c); delete(c)

# --- doors (with a dark shut-line gap)
doors = []
for sgn, nm in ((1, 'door_l'), (-1, 'door_r')):
    F0, F1, H0 = -0.42, 0.80, 0.27
    inner = box('cut', (0.6, F1 - F0, 1.4), P((F0 + F1) / 2, sgn * 0.90, H0 + 0.7), M['interior'])
    inner.data.materials.append(M['shadow'])
    for pg in inner.data.polygons:
        pg.material_index = 0 if abs(pg.normal.x) > 0.5 else 1
    d = copy_obj(body, nm)
    boolean(d, inner, 'INTERSECT'); delete(inner)
    gap = box('cut', (0.6, F1 - F0 + 0.024, 1.4), P((F0 + F1) / 2, sgn * 0.90, H0 - 0.012 + 0.7), M['shadow'])
    boolean(body, gap); delete(gap)
    d.parent = root
    doors.append((sgn, d, F1))

clean(body)

# --- windshield: wrap-around glass in a thin chrome frame
def ws_bottom(s):
    return P(0.40 - 0.06 * (s / 0.66) ** 2, s, 0.818 - 0.004 * (s / 0.66) ** 2)

def ws_top(s):
    return P(0.08 - 0.05 * (s / 0.62) ** 2, s * 0.94, 1.23)

cols = [-0.66, -0.55, -0.35, -0.12, 0.12, 0.35, 0.55, 0.66]
gv = [ws_bottom(s) for s in cols] + [ws_top(s) for s in cols]
n = len(cols)
gf = [[i, i + 1, n + i + 1, n + i] for i in range(n - 1)]
bm = bm_from(gv, gf)
bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.008)
glass = make_obj('windshield', bm, [M['glass']], root)
frame = [tube('fr', [ws_bottom(-0.66), ws_top(-0.66)], 0.016, M['chrome'], 8),
         tube('fr', [ws_bottom(0.66), ws_top(0.66)], 0.016, M['chrome'], 8),
         tube('fr', [ws_top(s) for s in cols], 0.016, M['chrome'], 8),
         tube('fr', [ws_bottom(s) + Vector((0, 0, 0.004)) for s in cols], 0.012, M['chrome'], 6)]
mirror_c = box('mirror', (0.16, 0.025, 0.05), (ws_top(0) + Vector((0, 0.03, -0.045))), M['chrome'], 0.01, 2)
frame_ob = join('windshield_frame', frame + [mirror_c], root)

# --- trim: bumpers, grille, lights, plate, side spears
trim = []
bar = [(-0.02, -0.035), (0.02, -0.035), (0.034, -0.012), (0.034, 0.012), (0.02, 0.035), (-0.02, 0.035)]

def bumper(front):
    sg = 1 if front else -1
    h = 0.40 if front else 0.42
    fs = [1.66, 1.76, 1.84, 1.90, 1.95, 1.985] if front else [1.62, 1.72, 1.82, 1.89, 1.94, 1.98]
    side = [(sg * f, W(sg * f) + 0.012) for f in fs]
    endf = sg * (2.0 + 0.022)
    path = [P(f, -s, h) for (f, s) in side]
    path += [P(endf, -0.38, h), P(endf + sg * 0.008, 0, h), P(endf, 0.38, h)]
    path += [P(f, s, h) for (f, s) in reversed(side)]
    trim.append(sweep('bumper', path, bar, M['chrome']))
    for s in (-0.30, 0.30):   # overriders
        trim.append(box('over', (0.05, 0.05, 0.14), P(endf + sg * 0.01, s, h + 0.02), M['chrome'], 0.018, 2))

bumper(True); bumper(False)

# headlights: chrome bezel + lens (emissive); lathe axis Y, lens bulging to -Y (forward)
for s in (-0.39, 0.39):
    prof = [(0.0, -0.040), (0.045, -0.036), (0.072, -0.024), (0.080, -0.012), (0.092, -0.016),
            (0.100, -0.006), (0.100, 0.05)]
    trim.append(lathe('hl', prof, 20, P(1.975, s, 0.535), 'Y', [M['head'], M['chrome']],
                      lambda k: 0 if k < 3 else 1))

# grille: dark oval mouth, chrome surround and bars
gpts = []
for i in range(17):
    a = math.pi * 2 * i / 16
    gpts.append(P(2.0, 0.24 * math.cos(a), 0.50 + 0.055 * math.sin(a)))
bm = bmesh.new()
vs = [bm.verts.new(p) for p in gpts[:-1]]
fc_ = bm.faces.new(vs)
r = bmesh.ops.extrude_face_region(bm, geom=[fc_])
bmesh.ops.translate(bm, vec=P(0.012, 0, 0) - P(0, 0, 0), verts=[e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)])
fix_normals(bm)
trim.append(make_obj('grille', bm, [M['trim']]))
trim.append(tube('gsur', [p + P(0.012, 0, 0) - P(0, 0, 0) for p in gpts], 0.011, M['chrome'], 6, caps=False))
for hh in (0.475, 0.50, 0.525):
    trim.append(tube('gbar', [P(2.014, -0.22 * math.sqrt(max(0, 1 - ((hh - 0.5) / 0.055) ** 2)), hh),
                              P(2.014, 0.22 * math.sqrt(max(0, 1 - ((hh - 0.5) / 0.055) ** 2)), hh)],
                     0.006, M['chrome'], 5))

# taillights + plate + boot handle + fuel cap + exhaust
for s in (-0.40, 0.40):
    trim.append(box('tl', (0.17, 0.03, 0.065), P(-2.0, s, 0.585), M['tail'], 0.012, 2))
    trim.append(box('tlr', (0.185, 0.02, 0.08), P(-1.993, s, 0.585), M['chrome'], 0.012, 2))
trim.append(box('plate', (0.34, 0.012, 0.095), P(-2.004, 0, 0.50), M['plaster'], 0.006, 1))
trim.append(box('handle', (0.12, 0.03, 0.02), P(-1.93, 0, 0.705), M['chrome'], 0.008, 2))
trim.append(cyl('fuel', 0.045, 0.02, P(-1.25, 0.62, belt(-1.25) + 0.02), 'Z', 14, M['chrome']))
trim.append(cyl('exhaust', 0.026, 0.25, P(-1.95, -0.42, 0.25), 'Y', 10, M['chrome']))

body = join('body', [body] + trim, root)
clean(body, 1e-5)

# --- door details: handle + mirror (left), handle (right); hinge origins
for sgn, d, F1 in doors:
    extra = [box('dh', (0.025, 0.11, 0.022), P(-0.30, sgn * (W(-0.3) - 0.01), belt(-0.3) - 0.07), M['chrome'], 0.008, 2)]
    if sgn > 0:
        base = P(0.62, sgn * 0.745, belt(0.62) + 0.005)
        extra.append(tube('mst', [base, base + Vector((sgn * 0.05, 0, 0.09))], 0.009, M['chrome'], 6))
        hm = lathe('mh', [(0.0, 0.05), (0.03, 0.045), (0.042, 0.02), (0.042, -0.02), (0.0, -0.025)], 12,
                   (0, 0, 0), 'Y', [M['chrome']])
        hm.location = base + Vector((sgn * 0.06, 0, 0.12))
        extra.append(hm)
    dj = join(d.name, [d] + extra, root)
    set_origin(dj, P(F1, sgn * 0.78, 0.5))
    finish(dj)

# --- interior
inter = []
for s in (-0.33, 0.33):
    inter.append(box('cush', (0.46, 0.50, 0.12), P(-0.42, s, 0.42), M['interior'], 0.04, 3))
    back = box('back', (0.46, 0.10, 0.50), (0, 0, 0), M['interior'], 0.045, 3)
    back.rotation_euler = (math.radians(-16), 0, 0)
    back.location = P(-0.71, s, 0.68)
    inter.append(back)
    roll = cyl('roll', 0.05, 0.44, (0, 0, 0), 'X', 12, M['interior'])
    roll.location = P(-0.71 - 0.24 * math.sin(math.radians(16)), s, 0.68 + 0.24 * math.cos(math.radians(16)))
    inter.append(roll)
    inter.append(box('seam', (0.47, 0.035, 0.02), P(-0.43 + 0.05, s, 0.48), M['plaster'], 0.008, 1))
inter.append(box('tunnel', (0.18, 0.95, 0.12), P(-0.10, 0, 0.40), M['carpet'], 0.04, 2))
inter.append(tube('gear', [P(0.12, 0, 0.45), P(0.08, 0, 0.62)], 0.009, M['chrome'], 6))
inter.append(lathe('knob', [(0.0, 0.03), (0.025, 0.02), (0.03, 0.0), (0.025, -0.02), (0.0, -0.03)], 10,
                   P(0.08, 0, 0.635), 'Z', [WOOD]))
# dashboard: painted top roll, dark fascia, gauges
inter.append(box('dash', (1.30, 0.20, 0.16), P(0.36, 0, 0.74), M['paint'], 0.05, 3))
inter.append(box('fascia', (1.22, 0.02, 0.10), P(0.255, 0, 0.72), WOOD, 0.01, 1))
for s, rr in ((0.40, 0.050), (0.26, 0.050), (-0.05, 0.03), (0.07, 0.03)):
    inter.append(cyl('gauge', rr, 0.012, P(0.243, s, 0.725), 'Y', 16, M['dash']))
    inter.append(lathe('gring', [(rr, 0.008), (rr + 0.009, 0.004), (rr + 0.009, -0.006)], 16,
                       P(0.243, s, 0.725), 'Y', [M['chrome']]))
# folded soft top behind the seats
st = []
for i, s in enumerate([-0.66, -0.6, -0.4, -0.15, 0.15, 0.4, 0.6, 0.66]):
    pass
tp = [(-0.62, 0.0), (-0.60, 0.07), (-0.45, 0.10), (0.0, 0.11), (0.45, 0.10), (0.60, 0.07), (0.62, 0.0)]
fold = sweep('softtop', [P(-0.90, s, belt(-0.9)) for s in (-0.64, -0.5, 0.0, 0.5, 0.64)],
             [(-0.07, -0.02), (0.07, -0.02), (0.075, 0.05), (0.05, 0.09), (0.0, 0.10), (-0.05, 0.09), (-0.075, 0.05)],
             CANVAS, up=Vector((0, 0, 1)))
inter.append(fold)
interior = join('interior', inter, root)
# bake child transforms into a single object
finish(interior)

# --- steering wheel (local spin axis: Blender +Y -> glTF -Z)
R0 = 0.19
ring = [(R0 + 0.016 * math.cos(2 * math.pi * k / 8), 0.016 * math.sin(2 * math.pi * k / 8)) for k in range(9)]
rim = lathe('rim', [(r, x) for (r, x) in ring], 28, (0, 0, 0), 'Y', [WOOD])
sw = [rim, cyl('hub', 0.045, 0.05, (0, 0.01, 0), 'Y', 14, M['chrome'])]
for a in (0, 180, 90):
    sp = box('spoke', (R0, 0.008, 0.022), (0, 0, 0), M['chrome'], 0.003, 1)
    sp.data.transform(Matrix.Translation((R0 / 2, 0, 0)))
    sp.rotation_euler = (0, math.radians(a), 0)
    sw.append(sp)
for o in sw[2:]:
    o.data.transform(o.matrix_basis); o.matrix_basis = Matrix()
steer = join('steering_wheel', sw, root)
steer.location = P(0.06, 0.33, 0.83)
steer.rotation_euler = (math.radians(-24), 0, 0)
hub_w = steer.location
col_dir = Matrix.Rotation(math.radians(-24), 3, 'X') @ Vector((0, -1, 0))
column = tube('column', [hub_w + col_dir * 0.02, hub_w + col_dir * 0.30], 0.022, M['trim'], 8)
interior = join('interior', [interior, column], root)

# --- wheels
def wheel(name, sgn, fa):
    prof = [(0.0, 0.074), (0.05, 0.072), (0.095, 0.064), (0.115, 0.054), (0.135, 0.052),
            (0.180, 0.058), (0.192, 0.074), (0.25, 0.086), (0.288, 0.078), (0.300, 0.056),
            (0.300, -0.056), (0.288, -0.078), (0.25, -0.086), (0.192, -0.074), (0.16, -0.06),
            (0.0, -0.06)]
    mi = lambda k: 0 if k < 3 else (1 if k < 5 else (2 if k < 14 else 3))
    wo = lathe(name, prof, 20, (0, 0, 0), 'X', [M['chrome'], M['paint'], M['tyre'], M['shadow']], mi)
    parts = [wo]
    for i in range(5):   # lug nuts so the spin reads
        a = 2 * math.pi * i / 5
        parts.append(cyl('lug', 0.011, 0.02, (0.075, 0.072 * math.cos(a), 0.072 * math.sin(a)), 'X', 6, M['chrome']))
    wo = join(name, parts)
    if sgn < 0:
        wo.data.transform(Matrix.Scale(-1, 4, (1, 0, 0)))
        wo.data.flip_normals()
    wo.location = P(fa, sgn * WX, WR)
    wo.parent = root
    finish(wo, 40)
    return wo

wheel('wheel_fl', 1, FA); wheel('wheel_fr', -1, FA)
wheel('wheel_rl', 1, RA); wheel('wheel_rr', -1, RA)

# --- anchors for builders
empty('seat_driver', P(-0.42, 0.33, 1.10), root)       # first-person eye
empty('seat_passenger', P(-0.42, -0.33, 1.10), root)
empty('exit_l', P(-0.1, 1.45, 0.0), root)              # where the driver stands after getting out
empty('light_head_l', P(2.02, 0.39, 0.535), root)
empty('light_head_r', P(2.02, -0.39, 0.535), root)
empty('light_tail_l', P(-2.02, 0.40, 0.585), root)
empty('light_tail_r', P(-2.02, -0.40, 0.585), root)

for o in (body, glass, frame_ob, steer):
    finish(o)
finish(glass, 60)
export(OUT)
for o in bpy.data.objects:
    if o.type == 'MESH':
        print('  ', o.name, tris(o))
