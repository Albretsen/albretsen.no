# Build townsfolk-anims.glb: shared 23-bone skeleton + all clips (incl. custom wave and cycle).
import bpy, math, sys
from mathutils import Vector, Matrix, Quaternion
sys.path.insert(0, "/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.WMbRtIP0Fk/bin")
from lib import T, reset
from skeleton import load_skeleton, channelbag, KEEP

OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else T + "out/"

reset()
arm, clips = load_skeleton()
scene = bpy.context.scene
print("FPS", scene.render.fps, scene.render.fps_base)
P = arm.pose.bones
REST = {b.name: b for b in arm.data.bones}


def sample(action, f):
    out = {}
    for fc in channelbag(action).fcurves:
        bn = fc.data_path.split('"')[1]
        prop = fc.data_path.rsplit(".", 1)[-1]
        out.setdefault(bn, {}).setdefault(prop, {})[fc.array_index] = fc.evaluate(f)
    return out


def apply(s):
    for pb in P:
        d = s.get(pb.name, {})
        q = d.get("rotation_quaternion")
        pb.rotation_quaternion = Quaternion([q[i] for i in range(4)]) if q else Quaternion()
        l = d.get("location")
        pb.location = Vector([l[i] for i in range(3)]) if l else Vector()
    bpy.context.view_layer.update()


def aim(bn, direction, twist_ref=None):
    pb = P[bn]
    M = pb.matrix.copy()
    cur = M.col[1].xyz.normalized()
    q = cur.rotation_difference(Vector(direction).normalized())
    R = q.to_matrix() @ M.to_3x3()
    N = R.to_4x4()
    N.translation = M.translation
    pb.matrix = N
    bpy.context.view_layer.update()


def move(bn, pos):
    pb = P[bn]
    M = pb.matrix.copy()
    M.translation = Vector(pos)
    pb.matrix = M
    bpy.context.view_layer.update()


def head_pos(bn):
    return P[bn].matrix.translation.copy()


def length(a, b):
    return (REST[b].head_local - REST[a].head_local).length


def ik2(b1, b2, end_bone, target, pole):
    A = head_pos(b1)
    L1, L2 = length(b1, b2), length(b2, end_bone)
    t = Vector(target)
    d = (t - A).length
    d = min(d, (L1 + L2) * 0.999)
    dirv = (t - A).normalized()
    ca = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)
    ca = max(-1, min(1, ca))
    sa = math.sqrt(1 - ca * ca)
    pole = Vector(pole)
    perp = (pole - dirv * pole.dot(dirv)).normalized()
    J = A + dirv * L1 * ca + perp * L1 * sa
    aim(b1, J - A)
    aim(b2, A + dirv * d - head_pos(b2))


def record(name, frames, fn, loop=True):
    """fn(f) poses the rig; frames is the count. Keys rotation for all bones + pelvis location."""
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    slot = act.slots.new(id_type="OBJECT", name="townsfolk_rig")
    layer = act.layers.new("Layer")
    strip = layer.strips.new(type="KEYFRAME")
    cb = strip.channelbags.new(slot)
    curves = {}
    for pb in P:
        for i in range(4):
            curves[(pb.name, "rotation_quaternion", i)] = cb.fcurves.new(f'pose.bones["{pb.name}"].rotation_quaternion', index=i)
    for bn in ("pelvis",):
        for i in range(3):
            curves[(bn, "location", i)] = cb.fcurves.new(f'pose.bones["{bn}"].location', index=i)
    prev = {}
    n = frames + 1 if loop else frames
    for f in range(n):
        fn(f % frames if loop else f)
        for pb in P:
            q = pb.rotation_quaternion.copy()
            if pb.name in prev and prev[pb.name].dot(q) < 0:
                q = -q
            prev[pb.name] = q
            for i in range(4):
                curves[(pb.name, "rotation_quaternion", i)].keyframe_points.insert(f, q[i], options={"FAST"})
        for i in range(3):
            curves[("pelvis", "location", i)].keyframe_points.insert(f, P["pelvis"].location[i], options={"FAST"})
    for fc in cb.fcurves:
        for k in fc.keyframe_points:
            k.interpolation = "LINEAR"
    clips[name] = act
    return act


# ---------------------------------------------------------------- wave (right hand, over idle)
idle = clips["idle"]
def wave(f):
    apply(sample(idle, f))
    ph = 2 * math.pi * 4 * f / 60.0
    aim("upperarm_r", (-0.62, -0.28, 0.62))
    aim("lowerarm_r", (-0.08 + 0.42 * math.sin(ph), -0.22, 1.0))
    aim("hand_r", (-0.08 + 0.62 * math.sin(ph - 0.6), -0.3, 1.0))
    aim("Head", (-0.12, -0.12, 1.0))
record("wave", 60, wave)

# ---------------------------------------------------------------- cycle (seated on the townsfolk bicycle)
# Bicycle geometry contract (see bicycle.glb): crank centre (0, 0, 0.30), crank 0.165, pedals x=+-0.11,
# saddle top (0, 0.24, 0.90), grips (+-0.25, -0.34, 1.04).
CR, CRZ, PEL = 0.165, 0.30, Vector((0, 0.27, 0.955))
GRIP = {"l": Vector((0.25, -0.33, 1.04)), "r": Vector((-0.25, -0.33, 1.04))}
N_CYC = 30
def cycle(f):
    apply(sample(idle, 0))
    for bn in ("upperarm_l", "upperarm_r"):
        pass
    move("pelvis", PEL)
    lean = math.radians(18)
    aim("pelvis", (0, -math.sin(lean * 0.6), math.cos(lean * 0.6)))
    move("pelvis", PEL)
    for bn, a in (("spine_01", 20), ("spine_02", 24), ("spine_03", 26)):
        r = math.radians(a)
        aim(bn, (0, -math.sin(r), math.cos(r)))
    aim("neck_01", (0, -0.25, 1))
    aim("Head", (0, -0.05, 1))
    th = 2 * math.pi * f / N_CYC
    for side, sx, off in (("l", 1, 0.0), ("r", -1, math.pi)):
        a = th + off
        pedal = Vector((0.11 * sx, -CR * math.sin(a), CRZ + CR * math.cos(a)))
        ankle = pedal + Vector((0, 0.035, 0.085))
        ik2(f"thigh_{side}", f"calf_{side}", f"foot_{side}", ankle, (0.12 * sx, -1, 0.15))
        aim(f"foot_{side}", (0, -1, -0.32 - 0.25 * math.sin(a)))
        aim(f"ball_{side}", (0, -1, 0))
        ik2(f"upperarm_{side}", f"lowerarm_{side}", f"hand_{side}", GRIP[side], (0.6 * sx, 0.6, -1))
        aim(f"hand_{side}", (0.25 * sx, -1, -0.15))
record("cycle", N_CYC, cycle)

# ---------------------------------------------------------------- report seat height for sit
apply(sample(clips["sit"], 0))
print("SIT pelvis head", tuple(round(x, 3) for x in head_pos("pelvis")), "thigh", tuple(round(x, 3) for x in head_pos("calf_l")))
apply(sample(clips["drive"], 0))
print("DRIVE pelvis head", tuple(round(x, 3) for x in head_pos("pelvis")), "hands", tuple(round(x, 3) for x in head_pos("hand_l")))
apply(sample(clips["lean_rail"], 0))
print("RAIL hands", tuple(round(x, 3) for x in head_pos("hand_l")), tuple(round(x, 3) for x in head_pos("hand_r")))
apply({})

for a in bpy.data.actions:
    print("CLIP", a.name, tuple(int(x) for x in a.frame_range))

import os
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action="DESELECT")
arm.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=OUT + "townsfolk-anims.glb", export_format="GLB", use_selection=True,
    export_animations=True, export_animation_mode="ACTIONS", export_force_sampling=True,
    export_optimize_animation_size=True, export_anim_slide_to_zero=True, export_def_bones=False,
    export_skins=True, export_morph=False, export_extras=False, export_yup=True)
print("EXPORTED")
