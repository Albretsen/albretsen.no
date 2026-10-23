# Measure in-place locomotion ground speed: planted-foot backward velocity.
import bpy, sys
sys.path.insert(0, "/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.WMbRtIP0Fk/bin")
from lib import reset
from skeleton import load_skeleton

reset()
arm, clips = load_skeleton()
fps = bpy.context.scene.render.fps
arm.animation_data_create()
for name in ("walk", "walk_formal", "walk_carry", "jog", "run", "crouch_walk"):
    a = clips[name]
    arm.animation_data.action = a
    if hasattr(arm.animation_data, "action_slot") and a.slots:
        arm.animation_data.action_slot = a.slots[0]
    f0, f1 = (int(x) for x in a.frame_range)
    pts = []
    for f in range(f0, f1 + 1):
        bpy.context.scene.frame_set(f)
        for s in ("l", "r"):
            pb = arm.pose.bones[f"ball_{s}"]
            p = arm.matrix_world @ pb.head
            pts.append((f, s, p.y, p.z))
    vs = []
    for s in ("l", "r"):
        seq = [(f, y, z) for f, ss, y, z in pts if ss == s]
        zmin = min(z for _, _, z in seq)
        for (fa, ya, za), (fb, yb, zb) in zip(seq, seq[1:]):
            if za < zmin + 0.006 and zb < zmin + 0.006:
                vs.append((yb - ya) * fps)
    v = sum(vs) / len(vs) if vs else 0
    A = max(y for _, ss, y, _ in pts if ss == "l") - min(y for _, ss, y, _ in pts if ss == "l")
    print("AMP", name, round(A, 3), "2A/T", round(2 * A / ((f1 - f0) / fps), 3))
    print(f"SPEED {name} {v:.3f} m/s  duration {(f1 - f0) / fps:.3f}s")
