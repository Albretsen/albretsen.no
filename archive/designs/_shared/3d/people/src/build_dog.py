# A small terrier with its own rig and hand-keyed clips: idle, walk, run, sit, sniff.
import bpy, math, sys, os
from mathutils import Vector, Matrix, Euler, Quaternion
sys.path.insert(0, "/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.WMbRtIP0Fk/bin")
from lib import T, reset, COL as C, Part, loft, ellipsoid, box, build_mesh, vc_material, link

reset()
bpy.context.scene.render.fps = 24

# ---------------------------------------------------------------- rig
arm_data = bpy.data.armatures.new("dog_rig")
arm = link(bpy.data.objects.new("dog", arm_data))
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
EB = arm_data.edit_bones
B = {}
def bone(name, h, t, parent=None, roll=0.0):
    b = EB.new(name)
    b.head, b.tail, b.roll = Vector(h), Vector(t), roll
    if parent:
        b.parent = B[parent]
        b.use_connect = False
    B[name] = b
    return b
bone("root", (0, 0, 0), (0, -0.1, 0))
bone("hips", (0, 0.15, 0.31), (0, 0.0, 0.32), "root")
bone("chest", (0, 0.0, 0.32), (0, -0.13, 0.33), "hips")
bone("neck", (0, -0.13, 0.34), (0, -0.2, 0.43), "chest")
bone("head", (0, -0.2, 0.43), (0, -0.31, 0.44), "neck")
bone("ear_l", (0.035, -0.2, 0.49), (0.05, -0.21, 0.54), "head")
bone("ear_r", (-0.035, -0.2, 0.49), (-0.05, -0.21, 0.54), "head")
bone("tail_1", (0, 0.16, 0.34), (0, 0.22, 0.41), "hips")
bone("tail_2", (0, 0.22, 0.41), (0, 0.25, 0.49), "tail_1")
for s, x in (("l", 0.055), ("r", -0.055)):
    bone(f"front_upper_{s}", (x, -0.1, 0.29), (x, -0.105, 0.16), "chest")
    bone(f"front_lower_{s}", (x, -0.105, 0.16), (x, -0.1, 0.03), f"front_upper_{s}")
    bone(f"back_upper_{s}", (x, 0.13, 0.29), (x, 0.1, 0.17), "hips")
    bone(f"back_lower_{s}", (x, 0.1, 0.17), (x, 0.13, 0.03), f"back_upper_{s}")
bpy.ops.object.mode_set(mode="OBJECT")
segs = {b.name: (b.head_local.copy(), b.tail_local.copy()) for b in arm_data.bones}

# ---------------------------------------------------------------- mesh
W, TAN, DARK, COLLAR = C["dog_white"], C["dog_tan"], C["dog_dark"], C["burgundy"]
parts = []
body = Part("body", ["hips", "chest", "neck", "tail_1"])
loft(body, [((0, 0.19, 0.33), 0.055, 0.06), ((0, 0.14, 0.325), 0.085, 0.085), ((0, 0.04, 0.32), 0.085, 0.08),
            ((0, -0.07, 0.33), 0.092, 0.09), ((0, -0.14, 0.35), 0.08, 0.08)], [TAN, W, W, W], n=10, cap0="pole", cap1=None)
parts.append(body)
neck = Part("neck", ["chest", "neck", "head"])
loft(neck, [((0, -0.12, 0.34), 0.07, 0.07), ((0, -0.18, 0.4), 0.058, 0.058), ((0, -0.21, 0.45), 0.05, 0.05)], [W, W], n=10, cap0=None, cap1=None)
parts.append(neck)
col = Part("collar", ["neck"])
loft(col, [((0, -0.165, 0.375), 0.066, 0.066), ((0, -0.18, 0.395), 0.064, 0.064)], [COLLAR], n=10, cap0=None, cap1=None)
box(col, (0, -0.215, 0.36), (0.022, 0.012, 0.026), C["mustard"])
parts.append(col)
hd = Part("head", ["head"])
def head_col(lv):
    return TAN if (abs(lv.x) > 0.02 and lv.z > -0.02) else W
ellipsoid(hd, (0, -0.225, 0.465), (0.06, 0.065, 0.058), W, seg=10, rings=7, colfn=head_col)
loft(hd, [((0, -0.26, 0.455), 0.04, 0.035), ((0, -0.31, 0.445), 0.03, 0.026), ((0, -0.335, 0.44), 0.022, 0.02)], [W, W], n=8, cap0=None, cap1="flat")
ellipsoid(hd, (0, -0.337, 0.447), (0.014, 0.01, 0.011), DARK, seg=6, rings=4)
for sx in (1, -1):
    ellipsoid(hd, (sx * 0.03, -0.272, 0.48), (0.008, 0.006, 0.008), DARK, seg=6, rings=4)
parts.append(hd)
for s, sx in (("l", 1), ("r", -1)):
    e = Part(f"ear_{s}", [f"ear_{s}", "head"], smooth=False)
    loft(e, [((sx * 0.04, -0.2, 0.505), 0.024, 0.01), ((sx * 0.058, -0.222, 0.525), 0.02, 0.008), ((sx * 0.066, -0.25, 0.505), 0.006, 0.004)],
         [TAN, TAN], n=4, cap0="flat", cap1="pole")
    parts.append(e)
    for lim, y0, y1, yk in (("front", -0.1, -0.1, -0.105), ("back", 0.13, 0.13, 0.1)):
        L = Part(f"{lim}_{s}", [f"{lim}_upper_{s}", f"{lim}_lower_{s}", "hips" if lim == "back" else "chest"])
        x = sx * 0.055
        top = 0.06 if lim == "back" else 0.045
        loft(L, [((x, y0, 0.31), top, 0.055), ((x, yk, 0.17), 0.028, 0.03), ((x, y1, 0.08), 0.022, 0.024), ((x, y1 - 0.01, 0.025), 0.024, 0.028)],
             [TAN if lim == "back" else W, W, W], n=8, cap0="pole", cap1="flat")
        box(L, (x, y1 - 0.025, 0.012), (0.044, 0.06, 0.024), W, bevel=0.012)
        parts.append(L)
tl = Part("tail", ["tail_1", "tail_2"])
loft(tl, [((0, 0.17, 0.35), 0.022, 0.022), ((0, 0.22, 0.41), 0.018, 0.018), ((0, 0.25, 0.49), 0.012, 0.012)], [W, TAN], n=6, cap0="flat", cap1="pole")
parts.append(tl)
ob = build_mesh("dog_mesh", parts, arm, segs, gradient=False)
ob.data.materials.append(vc_material("townsfolk_dog"))
print("DOG tris", sum(len(p.vertices) - 2 for p in ob.data.polygons))

# ---------------------------------------------------------------- clips
P = arm.pose.bones
for pb in P:
    pb.rotation_mode = "XYZ"
def key_pose(f, pose, root_z=0.0, root_y=0.0):
    for pb in P:
        r = pose.get(pb.name, (0, 0, 0))
        pb.rotation_euler = Euler([math.radians(a) for a in r])
        pb.keyframe_insert("rotation_euler", frame=f)
    P["root"].location = (0, 0, root_z)
    P["root"].keyframe_insert("location", frame=f)

def clip(name, frames, fn):
    a = bpy.data.actions.new(name)
    a.use_fake_user = True
    arm.animation_data_create()
    arm.animation_data.action = a
    for f in range(frames + 1):
        pose, rz = fn(f / frames * 2 * math.pi, f)
        key_pose(f, pose, rz)
    arm.animation_data.action = None
    return a

S = math.sin
def idle(t, f):
    return {"chest": (S(t) * 1.5, 0, 0), "neck": (S(t) * 3, 0, S(t * 0.5) * 8), "head": (0, 0, S(t * 0.5) * 6),
            "tail_1": (10, 0, S(t * 4) * 25), "tail_2": (5, 0, S(t * 4 - 0.8) * 25), "ear_l": (S(t) * 4, 0, 0), "ear_r": (S(t + 1) * 4, 0, 0)}, S(t * 2) * 0.002
clip("idle", 48, idle)

def gait(amp, bob, speed_tail):
    def fn(t, f):
        a = {}
        for s, ph in (("l", 0), ("r", math.pi)):
            fp, bp = t + ph, t + ph + math.pi  # diagonal pairs
            a[f"front_upper_{s}"] = (S(fp) * amp, 0, 0)
            a[f"front_lower_{s}"] = (-max(0, S(fp + 1.2)) * amp * 1.1, 0, 0)
            a[f"back_upper_{s}"] = (S(bp) * amp * 0.9, 0, 0)
            a[f"back_lower_{s}"] = (max(0, S(bp - 1.2)) * amp * 1.1, 0, 0)
        a["chest"] = (S(2 * t) * 2, 0, S(t) * 3)
        a["neck"] = (-S(2 * t) * 4, 0, 0)
        a["tail_1"] = (20, 0, S(t * speed_tail) * 20)
        a["tail_2"] = (10, 0, S(t * speed_tail - 0.8) * 20)
        a["ear_l"] = a["ear_r"] = (S(2 * t) * 10, 0, 0)
        return a, abs(S(t)) * bob
    return fn
clip("walk", 14, gait(26, 0.012, 2))
clip("run", 10, gait(48, 0.035, 1))

def sit(t, f):
    return {"hips": (-40, 0, 0), "chest": (0, 0, 0), "neck": (25, 0, S(t * 0.5) * 6), "head": (8, 0, 0),
            "front_upper_l": (40, 0, 0), "front_upper_r": (40, 0, 0),
            "back_upper_l": (80, 0, 0), "back_lower_l": (-150, 0, 0), "back_upper_r": (80, 0, 0), "back_lower_r": (-150, 0, 0),
            "tail_1": (-40, 0, S(t * 3) * 20), "tail_2": (0, 0, S(t * 3 - 0.8) * 20)}, -0.07
clip("sit", 48, sit)

def sniff(t, f):
    return {"chest": (-8, 0, 0), "neck": (-45 + S(t * 4) * 5, 0, S(t) * 18), "head": (-20, 0, S(t * 2) * 8),
            "front_upper_l": (-10, 0, 0), "front_upper_r": (-10, 0, 0), "front_lower_l": (8, 0, 0), "front_lower_r": (8, 0, 0),
            "tail_1": (25, 0, S(t * 3) * 25), "tail_2": (10, 0, S(t * 3 - 0.8) * 25)}, -0.01
clip("sniff", 48, sniff)

bpy.ops.object.select_all(action="DESELECT")
arm.select_set(True)
ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=T + "out/dog.glb", export_format="GLB", use_selection=True, export_yup=True,
                          export_animations=True, export_animation_mode="ACTIONS", export_skins=True,
                          export_vertex_color="ACTIVE", export_force_sampling=True)
print("DONE")
