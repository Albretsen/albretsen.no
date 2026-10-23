# Load the UAL skeleton + clips, trim to the 25-bone townsfolk skeleton.
import bpy, math, sys
from mathutils import Vector, Matrix, Quaternion
sys.path.insert(0, "/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.WMbRtIP0Fk/bin")
from lib import T

KEEP = ["root", "pelvis", "spine_01", "spine_02", "spine_03", "neck_01", "Head",
        "clavicle_l", "upperarm_l", "lowerarm_l", "hand_l",
        "clavicle_r", "upperarm_r", "lowerarm_r", "hand_r",
        "thigh_l", "calf_l", "foot_l", "ball_l",
        "thigh_r", "calf_r", "foot_r", "ball_r"]
LOC_BONES = {"root", "pelvis"}

# clip name in the library -> (source file tag, source action)
CLIPS = {
    "idle": ("ual1", "Idle_Loop"),
    "idle_arms_folded": ("ual2", "Idle_FoldArms_Loop"),
    "walk": ("ual1", "Walk_Loop"),
    "walk_formal": ("ual1", "Walk_Formal_Loop"),
    "walk_carry": ("ual2", "Walk_Carry_Loop"),
    "jog": ("ual1", "Jog_Fwd_Loop"),
    "run": ("ual1", "Sprint_Loop"),
    "sit": ("ual1", "Sitting_Idle_Loop"),
    "sit_talk": ("ual1", "Sitting_Talking_Loop"),
    "sit_down": ("ual1", "Sitting_Enter"),
    "stand_up": ("ual1", "Sitting_Exit"),
    "talk": ("ual1", "Idle_Talking_Loop"),
    "drink": ("ual2", "Consume"),
    "phone": ("ual2", "Idle_TalkingPhone_Loop"),
    "dance": ("ual1", "Dance_Loop"),
    "lean_rail": ("ual2", "Idle_Rail_Loop"),
    "rail_call": ("ual2", "Idle_Rail_Call"),
    "lantern": ("ual2", "Idle_Lantern_Loop"),
    "water_plants": ("ual2", "Farm_Watering"),
    "yes": ("ual2", "Yes"),
    "no": ("ual2", "Idle_No_Loop"),
    "drive": ("ual1", "Driving_Loop"),
    "interact": ("ual1", "Interact"),
    "pick_up": ("ual1", "PickUp_Table"),
    "push": ("ual1", "Push_Loop"),
    "jump_start": ("ual1", "Jump_Start"),
    "jump_loop": ("ual1", "Jump_Loop"),
    "jump_land": ("ual1", "Jump_Land"),
    "roll": ("ual1", "Roll"),
    "crouch_idle": ("ual1", "Crouch_Idle_Loop"),
    "crouch_walk": ("ual1", "Crouch_Fwd_Loop"),
}


def channelbag(action):
    return action.layers[0].strips[0].channelbags[0]


def load_skeleton(with_clips=True):
    """Returns (armature object, {clipname: action}). Scene left with only the armature."""
    src = {}
    for tag in ("ual1", "ual2"):
        before = set(bpy.data.actions)
        bpy.ops.import_scene.gltf(filepath=T + f"src/{tag}.glb")
        src[tag] = {a.name.split(".")[0]: a for a in set(bpy.data.actions) - before}
    arms = [o for o in bpy.data.objects if o.type == "ARMATURE"]
    arm = arms[0]
    for o in list(bpy.data.objects):
        if o != arm:
            bpy.data.objects.remove(o, do_unlink=True)
    arm.name = "townsfolk_rig"
    arm.data.name = "townsfolk_rig"
    if arm.animation_data:
        arm.animation_data.action = None
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    for eb in list(arm.data.edit_bones):
        if eb.name not in KEEP:
            arm.data.edit_bones.remove(eb)
    bpy.ops.object.mode_set(mode="OBJECT")
    clips = {}
    if with_clips:
        for name, (tag, an) in CLIPS.items():
            a = src[tag][an]
            a.name = name
            cb = channelbag(a)
            for fc in list(cb.fcurves):
                dp = fc.data_path
                bn = dp.split('"')[1] if '"' in dp else None
                prop = dp.rsplit(".", 1)[-1]
                if bn not in KEEP or prop == "scale" or (prop == "location" and bn not in LOC_BONES):
                    cb.fcurves.remove(fc)
            a.use_fake_user = True
            clips[name] = a
    used = set(clips.values())
    for a in list(bpy.data.actions):
        if a not in used:
            bpy.data.actions.remove(a)
    for pb in arm.pose.bones:
        pb.rotation_mode = "QUATERNION"
    return arm, clips


def bone_segments(arm):
    segs = {}
    for b in arm.data.bones:
        segs[b.name] = (arm.matrix_world @ b.head_local, arm.matrix_world @ b.tail_local)
    # extend short head bone up so head/hair weight cleanly
    h, t = segs["Head"]
    segs["Head"] = (h, h + Vector((0, 0, 0.22)))
    return segs
