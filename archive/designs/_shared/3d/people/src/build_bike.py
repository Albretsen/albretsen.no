# Paris step-through city bicycle with basket, matching the townsfolk 'cycle' clip.
# Contract: crank centre (0,0,0.30) r=0.165, pedals x=+-0.11, saddle top (0,0.25,0.86), grips (+-0.25,-0.33,1.04).
# Clip 'ride': 30 frames @24 fps, one crank turn, two wheel turns -> rolls 4.15 m per loop = 3.32 m/s.
import bpy, math, sys
from mathutils import Vector, Matrix
sys.path.insert(0, "/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.WMbRtIP0Fk/bin")
from lib import T, reset, COL as C, Part, loft, ellipsoid, box, disc, vc_material, link, lin, srgb

reset()
sc = bpy.context.scene
sc.render.fps = 24
sc.frame_start, sc.frame_end = 0, 30
VC = vc_material("townsfolk_bike", rough=0.55)
EMH = vc_material("emissive_headlight", emissive=(lin(srgb("#3a3424")), lin(srgb("#ffe2a8"))))
EMT = vc_material("emissive_taillight", emissive=(lin(srgb("#3a1418")), lin(srgb("#ff4a3a"))))

R, HUB_F, HUB_R = 0.33, Vector((0, -0.62, 0.33)), Vector((0, 0.44, 0.33))
CRANK = Vector((0, 0, 0.30))
FRAME = C["burgundy"]


def obj(name, parts, origin=(0, 0, 0)):
    verts, faces, cols, mats = [], [], [], []
    ml = [VC]
    o = Vector(origin)
    for part, m in parts:
        if m and m not in ml:
            ml.append(m)
        mi = ml.index(m) if m else 0
        base = len(verts)
        verts += [tuple(v - o) for v in part.v]
        for f, c in zip(part.f, part.fc):
            faces.append(tuple(i + base for i in f)); cols.append(c); mats.append(mi)
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    for m in ml:
        me.materials.append(m)
    at = me.color_attributes.new("Color", "FLOAT_COLOR", "CORNER")
    for p in me.polygons:
        p.material_index = mats[p.index]
        p.use_smooth = True
        for li in p.loop_indices:
            at.data[li].color = (*cols[p.index], 1)
    me.set_sharp_from_angle(angle=math.radians(45))
    ob = link(bpy.data.objects.new(name, me))
    ob.location = o
    print("PART", name, sum(len(p.vertices) - 2 for p in me.polygons))
    return ob


def tube(p, a, b, r, col, n=8):
    loft(p, [(a, r, r), (b, r, r)], [col], n=n, cap0="flat", cap1="flat")


def path(p, pts, r, col, n=8):
    loft(p, [(q, r, r) for q in pts], [col] * (len(pts) - 1), n=n, cap0="flat", cap1="flat")


root = link(bpy.data.objects.new("bicycle", None))

# ---- frame
fr = Part("frame", [])
seat_top = Vector((0, 0.205, 0.80))
head_lo, head_hi = Vector((0, -0.5, 0.62)), Vector((0, -0.535, 0.78))
tube(fr, CRANK, seat_top, 0.019, FRAME)
path(fr, [CRANK, Vector((0, -0.2, 0.42)), head_lo], 0.021, FRAME)          # low step-through down tube
path(fr, [Vector((0, 0.11, 0.56)), Vector((0, -0.2, 0.53)), Vector((0, -0.48, 0.70))], 0.016, FRAME)  # curved second tube
tube(fr, head_lo, head_hi, 0.024, FRAME)
for sx in (1, -1):
    tube(fr, CRANK + Vector((sx * 0.03, 0, 0)), HUB_R + Vector((sx * 0.05, 0, 0)), 0.011, FRAME)
    tube(fr, seat_top + Vector((sx * 0.015, -0.01, -0.03)), HUB_R + Vector((sx * 0.05, 0, 0)), 0.011, FRAME)
    tube(fr, head_lo + Vector((sx * 0.03, 0, 0)), HUB_F + Vector((sx * 0.05, 0, 0)), 0.013, FRAME)  # fork
# seat post + saddle
tube(fr, seat_top, Vector((0, 0.245, 0.835)), 0.012, C["steel"])
loft(fr, [((0, 0.34, 0.85), 0.06, 0.022), ((0, 0.27, 0.855), 0.075, 0.025), ((0, 0.17, 0.85), 0.03, 0.02), ((0, 0.12, 0.845), 0.02, 0.016)],
     [C["coffee"]] * 3, n=8, cap0="flat", cap1="pole", frame=lambda d: (Vector((1, 0, 0)), Vector((0, 0, 1))))
# stem + swept-back handlebar
stem_top = Vector((0, -0.535, 0.98))
tube(fr, head_hi, stem_top, 0.014, C["steel"])
for sx in (1, -1):
    path(fr, [stem_top, Vector((sx * 0.12, -0.52, 1.0)), Vector((sx * 0.22, -0.42, 1.03)), Vector((sx * 0.25, -0.33, 1.04))], 0.011, C["steel"])
    tube(fr, Vector((sx * 0.25, -0.38, 1.038)), Vector((sx * 0.252, -0.27, 1.042)), 0.016, C["coffee"])  # grips
# fenders (plaster) as arc ribbons
def fender(c, a0, a1):
    pts = [c + Vector((0, -math.cos(a) * (R + 0.04), math.sin(a) * (R + 0.04))) for a in [a0 + (a1 - a0) * i / 9 for i in range(10)]]
    loft(fr, [(q, 0.008, 0.032) for q in pts], [C["plaster"]] * 9, n=6, cap0="flat", cap1="flat",
         frame=lambda d: (d.cross(Vector((1, 0, 0))).normalized(), Vector((1, 0, 0))))
fender(HUB_F, math.radians(20), math.radians(150))
fender(HUB_R, math.radians(25), math.radians(175))
# rear rack + chain guard
for sx in (1, -1):
    tube(fr, Vector((sx * 0.07, 0.25, 0.72)), Vector((sx * 0.07, 0.6, 0.72)), 0.008, C["steel"])
    tube(fr, Vector((sx * 0.07, 0.55, 0.72)), HUB_R + Vector((sx * 0.06, 0.0, 0.02)), 0.008, C["steel"])
box(fr, (0, 0.43, 0.725), (0.15, 0.36, 0.012), C["steel"])
loft(fr, [((0.045, -0.05, 0.36), 0.03, 0.006), ((0.045, 0.2, 0.36), 0.025, 0.006), ((0.045, 0.42, 0.35), 0.022, 0.006)], [C["ink"], C["ink"]], n=6,
     cap0="flat", cap1="flat", frame=lambda d: (Vector((0, 0, 1)), Vector((1, 0, 0))))
# kick stand stub + basket with a baguette
bk = Part("basket", [])
bc = Vector((0, -0.74, 0.86))
loft(bk, [(bc + Vector((0, 0, -0.08)), 0.13, 0.1, 0.5), (bc + Vector((0, 0, 0.0)), 0.15, 0.115, 0.5), (bc + Vector((0, 0, 0.09)), 0.16, 0.12, 0.5)],
     [C["sand"], C["mustard"]], n=12, cap0="flat", cap1=None, phase=0.0)
loft(bk, [(bc + Vector((0, 0, 0.09)), 0.16, 0.12, 0.5), (bc + Vector((0, 0, 0.07)), 0.14, 0.1, 0.5)], [C["sand"]], n=12, cap0=None, cap1="flat", phase=0.0)
rot = Matrix.Rotation(math.radians(-30), 3, "X") @ Matrix.Rotation(math.radians(12), 3, "Y")
loft(bk, [(bc + rot @ Vector((0.04, 0, -0.05)), 0.02, 0.02), (bc + rot @ Vector((0.04, 0, 0.0)), 0.03, 0.028), (bc + rot @ Vector((0.04, 0, 0.26)), 0.03, 0.028), (bc + rot @ Vector((0.04, 0, 0.3)), 0.015, 0.015)],
     [C["mustard"], C["mustard"], C["mustard"]], n=8, cap0="pole", cap1="pole")
loft(bk, [(bc + Vector((-0.06, 0.03, 0.06)), 0.035, 0.035), (bc + Vector((-0.06, 0.03, 0.13)), 0.04, 0.04)], [C["magenta"]], n=8, cap0="flat", cap1="pole")  # flowers
for i in range(5):
    ellipsoid(bk, bc + Vector((-0.09 + 0.03 * (i % 3), 0.0 + 0.02 * (i % 2), 0.16 + 0.015 * (i % 2))), (0.022, 0.022, 0.018), C["magenta"] if i % 2 else C["pink"], seg=6, rings=4)
tube(bk, bc + Vector((0, 0.12, 0.0)), head_hi + Vector((0, 0, 0.0)), 0.008, C["steel"])
lamp, lampg, tail = Part("lamp", []), Part("lampg", []), Part("tail", [])
loft(lamp, [((0, -0.87, 0.80), 0.035, 0.035), ((0, -0.93, 0.80), 0.04, 0.04)], [C["ink"]], n=10, cap0="flat", cap1=None)
disc(lampg, (0, -0.93, 0.80), 0.034, 0.004, C["cream"], n=10, rot=Matrix.Rotation(math.radians(90), 3, "X"))
box(tail, (0, 0.64, 0.70), (0.06, 0.02, 0.035), C["coral"])
for p, m in ((fr, None), (bk, None), (lamp, None), (lampg, EMH), (tail, EMT)):
    pass
frame_ob = obj("frame", [(fr, None), (bk, None), (lamp, None), (lampg, EMH), (tail, EMT)])
frame_ob.parent = root


# ---- wheels
def wheel(name, hub):
    w = Part(name, [])
    n = 20
    def ringpts(r):
        return [Vector((0, math.cos(2 * math.pi * k / n) * r, math.sin(2 * math.pi * k / n) * r)) for k in range(n + 1)]
    loft(w, [(q, 0.024, 0.024) for q in ringpts(R - 0.012)], [C["rubber"]] * n, n=6, cap0=None, cap1=None,
         frame=lambda d: (Vector((1, 0, 0)), Vector((1, 0, 0)).cross(d).normalized()))
    loft(w, [(q, 0.006, 0.012) for q in ringpts(R - 0.04)], [C["plaster"]] * n, n=4, cap0=None, cap1=None,
         frame=lambda d: (Vector((1, 0, 0)), Vector((1, 0, 0)).cross(d).normalized()))
    for k in range(6):
        a = 2 * math.pi * k / 6
        tube(w, Vector((0, 0, 0)), Vector((0, math.cos(a), math.sin(a))) * (R - 0.045), 0.0035, C["steel"], n=4)
    disc(w, (-0.03, 0, 0), 0.022, 0.06, C["steel"], n=8, rot=Matrix.Rotation(math.radians(90), 3, "Y"))
    o = obj(name, [(w, None)])
    o.location = hub
    o.parent = root
    return o

wf, wr = wheel("wheel_f", HUB_F), wheel("wheel_r", HUB_R)

# ---- crank + pedals
cr = Part("crank", [])
disc(cr, (0.05, 0, 0), 0.085, 0.008, C["steel"], n=16, rot=Matrix.Rotation(math.radians(90), 3, "Y"))
box(cr, (0.075, 0, 0.165 / 2), (0.012, 0.022, 0.165), C["steel"])
box(cr, (-0.075, 0, -0.165 / 2), (0.012, 0.022, 0.165), C["steel"])
crank = obj("crank", [(cr, None)])
crank.location = CRANK
crank.parent = root
pedals = []
for sx, z in ((1, 0.165), (-1, -0.165)):
    pp = Part("pedal", [])
    box(pp, (0, 0, 0), (0.085, 0.06, 0.018), C["ink"], bevel=0.008)
    o = obj("pedal_l" if sx > 0 else "pedal_r", [(pp, None)])
    o.parent = crank
    o.location = (sx * 0.12, 0, z)
    pedals.append(o)

# ---- ride clip (one crank turn, two wheel turns)
for f in range(0, 31):
    t = f / 30
    for o, k in ((wf, 2), (wr, 2)):
        o.rotation_euler = (2 * math.pi * k * t, 0, 0)
        o.keyframe_insert("rotation_euler", frame=f)
    crank.rotation_euler = (2 * math.pi * t, 0, 0)
    crank.keyframe_insert("rotation_euler", frame=f)
    for p in pedals:
        p.rotation_euler = (-2 * math.pi * t, 0, 0)
        p.keyframe_insert("rotation_euler", frame=f)
for o in (wf, wr, crank, *pedals):
    for fc in o.animation_data.action.layers[0].strips[0].channelbags[0].fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

for o in (wf, wr, crank, *pedals):
    act = o.animation_data.action
    act.name = "ride_" + o.name
    tr = o.animation_data.nla_tracks.new()
    tr.name = "ride"
    tr.strips.new("ride", 0, act)
    o.animation_data.action = None
bpy.ops.export_scene.gltf(filepath=T + "out/bicycle.glb", export_format="GLB", export_yup=True,
                          export_animations=True, export_animation_mode="NLA_TRACKS",
                          export_force_sampling=True, export_vertex_color="ACTIVE")
print("DONE")
