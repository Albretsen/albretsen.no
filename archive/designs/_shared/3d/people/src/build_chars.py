# Build the townsfolk characters, each skinned to the shared townsfolk_rig.
import bpy, math, sys, os
from mathutils import Vector, Matrix
sys.path.insert(0, "/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.WMbRtIP0Fk/bin")
from lib import T, reset, COL, Part, loft, ellipsoid, box, disc, build_mesh, vc_material, link
from skeleton import load_skeleton, bone_segments

OUT = T + "out/"
ONLY = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
C = COL

TORSO_B = ["pelvis", "spine_01", "spine_02", "spine_03", "neck_01", "clavicle_l", "clavicle_r"]


def arm_b(s):
    return [f"clavicle_{s}", f"upperarm_{s}", f"lowerarm_{s}", f"hand_{s}"]


def leg_b(s):
    return ["pelvis", f"thigh_{s}", f"calf_{s}", f"foot_{s}"]


def skirt_w(p):
    t = max(0.0, min(1.0, (1.02 - p.z) / 0.42)) ** 0.8
    s = max(0.0, min(1.0, 0.5 + p.x / 0.12))
    w = [(1 - 0.92 * t, "pelvis"), (0.92 * t * s, "thigh_l"), (0.92 * t * (1 - s), "thigh_r")]
    w = [(a, b) for a, b in w if a > 0.02]
    tot = sum(a for a, _ in w)
    return [(a / tot, b) for a, b in w]


# ------------------------------------------------------------------ body pieces
def legs(parts, o):
    fem = o.get("female", False)
    k = o.get("limb", 1.0)
    for s, sx in (("l", 1), ("r", -1)):
        p = Part(f"leg_{s}", leg_b(s))
        x0 = 0.088 * sx
        tw = o.get("trouser_w", 1.0)
        rings = [
            ((x0, 0.01, 0.99), 0.090 * k * tw, 0.095 * k * tw),
            ((x0, 0.01, 0.86), 0.084 * k * tw, 0.088 * k * tw),
            ((x0 * 1.0, 0.012, 0.70), 0.070 * k * tw, 0.074 * k * tw),
            ((x0 * 0.98, 0.008, 0.53), 0.055 * k * tw, 0.058 * k * tw),
            ((x0 * 0.98, 0.022, 0.40), 0.058 * k * tw, 0.062 * k * tw),
            ((x0 * 0.98, 0.02, 0.22), 0.045 * k * tw * o.get("hem_w", 1), 0.047 * k * tw * o.get("hem_w", 1)),
            ((x0 * 0.98, 0.03, 0.11), 0.041 * k * tw * o.get("hem_w", 1), 0.043 * k * tw * o.get("hem_w", 1)),
        ]
        lc = o["legs"]  # list of 6 segment colours top->bottom
        loft(p, rings, lc, n=10, cap0=None, cap1="flat")
        parts.append(p)
        # shoe
        sh = Part(f"shoe_{s}", [f"foot_{s}", f"ball_{s}", f"calf_{s}"])
        sc = o.get("shoe", C["ink"])
        sole = o.get("sole", sc)
        sw = o.get("shoe_w", 1.0)
        rings = [
            ((x0, 0.075, 0.05), 0.048, 0.040 * sw),
            ((x0, 0.03, 0.065), 0.064, 0.050 * sw),
            ((x0, -0.07, 0.048), 0.048, 0.052 * sw),
            ((x0, -0.16, 0.036), 0.036, 0.046 * sw),
            ((x0, -0.205, 0.03), 0.026, 0.034 * sw),
        ]
        loft(sh, rings, [sc, sc, sc, sc], n=8, cap0="flat", cap1="pole", phase=0.5, cap_len=0.6)
        # sole slab
        box(sh, (x0, -0.065, 0.008), (0.088 * sw, 0.27, 0.016), sole, bevel=0.02)
        parts.append(sh)


def torso(parts, o):
    fem = o.get("female", False)
    k = o.get("girth", 1.0)
    p = Part("torso", TORSO_B)
    if fem:
        prof = [(0.86, 0.150, 0.105, 0.03), (0.97, 0.170, 0.115, 0.03), (1.08, 0.130, 0.095, 0.02),
                (1.20, 0.138, 0.100, 0.0), (1.32, 0.155, 0.112, -0.012), (1.40, 0.160, 0.100, 0.0),
                (1.46, 0.128, 0.088, 0.008), (1.50, 0.080, 0.066, 0.012)]
    else:
        prof = [(0.86, 0.150, 0.105, 0.025), (0.97, 0.162, 0.110, 0.02), (1.08, 0.148, 0.102, 0.015),
                (1.20, 0.160, 0.110, 0.0), (1.32, 0.176, 0.116, -0.005), (1.40, 0.180, 0.108, 0.005),
                (1.465, 0.145, 0.092, 0.01), (1.505, 0.085, 0.068, 0.012)]
    belly = o.get("belly", 0.0)
    rings = []
    for i, (z, rx, ry, y) in enumerate(prof):
        b = belly if i in (1, 2, 3) else 0
        rings.append(((0, y - b * 0.5, z), rx * k + b * 0.4, ry * k + b))
    if "stripes" in o:
        # insert extra rings for a mariniere
        a, b2 = o["stripes"]
        new = []
        for i in range(len(rings) - 1):
            new.append(rings[i])
            if 2 <= i <= 4:
                c0, c1 = Vector(rings[i][0]), Vector(rings[i + 1][0])
                for t in (0.34, 0.67):
                    new.append((c0.lerp(c1, t), rings[i][1] + (rings[i + 1][1] - rings[i][1]) * t,
                                rings[i][2] + (rings[i + 1][2] - rings[i][2]) * t))
        new.append(rings[-1])
        rings = new
        cols = [o["torso"][0], o["torso"][1]] + [a if j % 2 == 0 else b2 for j in range(len(rings) - 4)] + [o["torso"][-1]]
    else:
        cols = o["torso"]
    f0 = len(p.f)
    loft(p, rings, cols, n=14, cap0="flat", cap1="flat", phase=0.0)
    if o.get("front"):
        fc_, fw, ztop = o["front"]
        for i in range(f0, len(p.f)):
            cen = sum((p.v[j] for j in p.f[i]), Vector()) / len(p.f[i])
            if cen.y < -0.04 and abs(cen.x) < fw and 1.0 < cen.z < ztop:
                p.fc[i] = fc_
    parts.append(p)
    # neck
    n = Part("neck", ["spine_03", "neck_01", "Head"])
    nr = o.get("neck_r", 0.054)
    loft(n, [((0, 0.012, 1.44), nr, nr), ((0, 0.01, 1.53), nr, nr * 0.95), ((0, 0.0, 1.62), nr * 0.9, nr * 0.9)],
         [o["skin"]], n=8, cap0=None, cap1=None)
    parts.append(n)


def arms(parts, o):
    k = o.get("limb", 1.0)
    for s, sx in (("l", 1), ("r", -1)):
        p = Part(f"arm_{s}", arm_b(s))
        y, z = 0.062, 1.437
        sw = o.get("sleeve_w", 1.0)
        rings = [
            ((0.165 * sx, y, z + 0.004), 0.060 * k * sw, 0.060 * k * sw),
            ((0.22 * sx, y, z), 0.058 * k * sw, 0.058 * k * sw),
            ((0.34 * sx, y, z), 0.050 * k * sw, 0.050 * k * sw),
            ((0.466 * sx, y, z), 0.042 * k * sw, 0.042 * k * sw),
            ((0.60 * sx, y, z), 0.042 * k * o.get("cuff_w", sw), 0.040 * k * o.get("cuff_w", sw)),
            ((0.725 * sx, y, z), 0.034 * k, 0.031 * k),
        ]
        loft(p, rings, o["arms"], n=10, cap0="pole", cap1=None, cap_len=0.75)
        parts.append(p)
        sh = Part(f"shoulder_{s}", [f"clavicle_{s}", f"upperarm_{s}"])
        ellipsoid(sh, (0.178 * sx, 0.06, 1.432), (0.07 * k * sw, 0.066 * k * sw, 0.066 * k * sw), o["arms"][0], seg=10, rings=7)
        parts.append(sh)
        h = Part(f"hand_{s}", [f"hand_{s}", f"lowerarm_{s}"])
        hk = o.get("hand", 1.0)
        rings = [((0.715 * sx, y, z), 0.030 * hk, 0.031 * hk), ((0.765 * sx, y - 0.004, z - 0.002), 0.026 * hk, 0.044 * hk),
                 ((0.83 * sx, y - 0.004, z - 0.004), 0.021 * hk, 0.040 * hk), ((0.865 * sx, y - 0.004, z - 0.006), 0.014 * hk, 0.028 * hk)]
        loft(h, rings, [o["skin"]], n=8, cap0="flat", cap1="pole", cap_len=0.5)
        # thumb
        loft(h, [((0.75 * sx, y - 0.03, z - 0.004), 0.013 * hk, 0.013 * hk), ((0.79 * sx, y - 0.058, z - 0.01), 0.011 * hk, 0.011 * hk)],
             [o["skin"]], n=6, cap0="flat", cap1="pole")
        parts.append(h)


HEAD_C = Vector((0, -0.008, 1.672))


def head(parts, o):
    hs = o.get("head", 1.0) * 1.06
    r = Vector((0.092, 0.102, 0.118)) * hs
    c = HEAD_C + Vector((0, 0, (hs - 1.06) * 0.10 - 0.008))
    p = Part("head", ["Head", "neck_01"])
    ellipsoid(p, c, r, o["skin"], seg=14, rings=10)
    # nose + ears give the face direction at small scale
    loft(p, [((0, c.y - r.y * 0.92, c.z - 0.005 * hs), 0.012 * hs, 0.016 * hs), ((0, c.y - r.y * 1.16, c.z - 0.026 * hs), 0.006 * hs, 0.009 * hs)],
         [o["skin"]], n=6, cap0="flat", cap1="pole")
    for sx in (1, -1):
        ellipsoid(p, (c.x + sx * r.x * 0.96, c.y + 0.01, c.z - 0.01), (0.012 * hs, 0.022 * hs, 0.03 * hs), o["skin"], seg=6, rings=4)
    if o.get("blush"):
        pass
    parts.append(p)
    o["_hc"], o["_hr"] = c, r


def hair(parts, o):
    style = o.get("hair")
    if not style:
        return
    c, r = o["_hc"], o["_hr"]
    col = o["hair_col"]
    p = Part("hair", ["Head"])
    rr = r * 1.09
    def cut_fn(front, side, back):
        def f(lv):
            fy = -lv.y / rr.y  # 1 at face, -1 at back
            if fy > 0:
                th = side + (front - side) * fy
            else:
                th = side + (back - side) * (-fy)
            return lv.z / rr.z > th
        return f
    if style in ("short", "bun", "ponytail", "slick", "crop", "tousled"):
        front = {"short": 0.42, "bun": 0.40, "ponytail": 0.40, "slick": 0.48, "crop": 0.5, "tousled": 0.36}[style]
        ellipsoid(p, c + Vector((0, 0.008, 0.008)), rr, col, seg=12, rings=8, cut=cut_fn(front, 0.0, -0.45))
    if style in ("bob", "long"):
        rb = Vector((rr.x * 1.06, rr.y * 1.04, rr.z * 1.02))
        ellipsoid(p, c + Vector((0, 0.012, -0.005)), rb, col, seg=12, rings=8, cut=cut_fn(0.42, -0.62, -0.75))
        if style == "long":
            loft(p, [((0, c.y + 0.07, c.z - 0.02), 0.085, 0.035), ((0, c.y + 0.085, c.z - 0.16), 0.095, 0.04),
                     ((0, c.y + 0.09, c.z - 0.27), 0.08, 0.035)], [col], n=8, cap0="flat", cap1="pole")
    if style == "fringe_ring":  # balding older man: ring around the back and sides
        ellipsoid(p, c + Vector((0, 0.006, 0)), rr, col, seg=12, rings=8,
                  cut=lambda lv: (-0.55 < lv.z / rr.z < 0.15) and lv.y > -0.35 * rr.y)
    if style == "bun":
        ellipsoid(p, c + Vector((0, 0.06, r.z * 0.85)), (0.048, 0.044, 0.04), col, seg=8, rings=5)
    if style == "ponytail":
        loft(p, [((0, c.y + r.y * 0.9, c.z + 0.04), 0.03, 0.03), ((0, c.y + r.y * 1.25, c.z - 0.02), 0.038, 0.034),
                 ((0, c.y + r.y * 1.3, c.z - 0.12), 0.03, 0.026), ((0, c.y + r.y * 1.2, c.z - 0.2), 0.012, 0.012)],
             [col], n=6, cap0="flat", cap1="pole")
    if style == "slick":
        pass
    if style == "tousled":  # short sides, a loose, slightly lifted top swept to one side
        for (x, y, z, rx, ry, rz, ax, ay) in TUFTS:
            rot = Matrix.Rotation(math.radians(ay), 3, "Y") @ Matrix.Rotation(math.radians(ax), 3, "X")
            ellipsoid(p, c + Vector((x, y, z)), (rx, ry, rz), col, seg=9 if rx > 0.04 else 7, rings=5 if rx > 0.04 else 4, rot=rot)
    parts.append(p)


# tousled top: (x, y, z offset from head centre, radii, tilt about X, tilt about Y); -y is the face
TUFTS = [
    (0.000, 0.000, 0.094, 0.090, 0.100, 0.054, 0, 0),        # lifted top volume
    (0.008, -0.060, 0.098, 0.066, 0.046, 0.036, -22, -6),    # front, pushed up and over
    (-0.034, -0.078, 0.074, 0.044, 0.026, 0.024, -34, 16),   # loose fringe swept to his right
    (0.030, 0.030, 0.130, 0.030, 0.028, 0.016, 8, -14),      # two strands out of place on the crown
    (-0.020, -0.024, 0.140, 0.028, 0.026, 0.015, -6, 12),
]


def hat(parts, o):
    kind = o.get("hat")
    if not kind:
        return
    c, r = o["_hc"], o["_hr"]
    col = o["hat_col"]
    p = Part("hat", ["Head"])
    rot = None
    if kind == "beret":
        rot = Matrix.Rotation(math.radians(-14), 3, "Y") @ Matrix.Rotation(math.radians(-8), 3, "X")
        ellipsoid(p, c + Vector((0.012, 0.01, r.z * 0.78)), (r.x * 1.32, r.y * 1.25, 0.048), col, seg=12, rings=6, rot=rot)
        loft(p, [((0.012, 0.01, c.z + r.z * 0.78 + 0.045), 0.006, 0.006), ((0.012, 0.01, c.z + r.z * 0.78 + 0.07), 0.005, 0.005)], [col], n=5, cap0=None, cap1="pole")
    elif kind == "flat_cap":
        ellipsoid(p, c + Vector((0, 0.0, r.z * 0.55)), (r.x * 1.18, r.y * 1.22, 0.075), col, seg=12, rings=6,
                  cut=lambda lv: lv.z > -0.01)
        rot = Matrix.Rotation(math.radians(-10), 3, "X")
        box(p, (0, c.y - r.y * 1.08, c.z + r.z * 0.5), (r.x * 1.7, 0.08, 0.014), col, bevel=0.025, rot=rot)
    elif kind == "cap":
        ellipsoid(p, c + Vector((0, 0.005, r.z * 0.3)), (r.x * 1.12, r.y * 1.12, r.z * 0.92), col, seg=12, rings=7,
                  cut=lambda lv: lv.z > 0.0)
        rot = Matrix.Rotation(math.radians(-8), 3, "X")
        box(p, (0, c.y - r.y * 1.25, c.z + r.z * 0.3), (r.x * 1.4, 0.12, 0.012), o.get("hat_col2", col), bevel=0.03, rot=rot)
    elif kind == "sun_hat":
        disc(p, (0, c.y + 0.005, c.z + r.z * 0.45), 0.21, 0.012, col, n=16)
        loft(p, [((0, c.y + 0.005, c.z + r.z * 0.45), r.x * 1.12, r.y * 1.12), ((0, c.y + 0.005, c.z + r.z * 0.8), r.x * 1.05, r.y * 1.05),
                 ((0, c.y + 0.005, c.z + r.z * 1.05), r.x * 0.9, r.y * 0.9)], [o.get("hat_col2", col), col], n=12, cap0=None, cap1="flat")
    elif kind == "headband":
        loft(p, [((0, c.y + 0.004, c.z + r.z * 0.18), r.x * 1.1, r.y * 1.1), ((0, c.y + 0.004, c.z + r.z * 0.42), r.x * 1.03, r.y * 1.03)],
             [col], n=12, cap0=None, cap1=None)
        # inner faces so it shows from both sides
    parts.append(p)


def skirt(parts, o, name, z0, z1, r0, r1, col, arc=None, y0=0.02, n=12, hem=None):
    p = Part(name, [], weight_fn=skirt_w)
    if arc is None:
        rings = [((0, y0, z0), r0[0], r0[1]), ((0, y0, (z0 + z1) / 2), (r0[0] + r1[0]) / 2 * 1.03, (r0[1] + r1[1]) / 2 * 1.03), ((0, y0, z1), r1[0], r1[1])]
        cols = [col, col]
        f0 = len(p.f)
        loft(p, rings, cols, n=n, cap0=None, cap1=None)
        # inner faces (reversed, slightly darker) so the cone is never see-through
        dark = tuple(c * 0.6 for c in col)
        for i in range(f0, len(p.f)):
            p.face(tuple(reversed(p.f[i])), dark)
    else:
        a0, a1 = arc
        m = 7
        for zi, (za, zb, ra, rb) in enumerate([(z0, z1, r0, r1)]):
            ids = []
            for j, (z, rr) in enumerate(((za, ra), (zb, rb))):
                row = []
                for i in range(m):
                    t = a0 + (a1 - a0) * i / (m - 1)
                    row.append(p.add_vert((math.cos(t) * rr[0], y0 + math.sin(t) * rr[1], z)))
                ids.append(row)
            for i in range(m - 1):
                p.face((ids[0][i], ids[1][i], ids[1][i + 1], ids[0][i + 1]), col)
                p.face((ids[0][i + 1], ids[1][i + 1], ids[1][i], ids[0][i]), col)
    parts.append(p)


def extras(parts, o):
    c, r = o["_hc"], o["_hr"]
    for ex in o.get("extras", []):
        kind = ex[0]
        if kind == "glasses":
            p = Part("glasses", ["Head"], smooth=False)
            col = ex[1]
            y = c.y - r.y * 0.98
            for sx in (1, -1):
                box(p, (sx * 0.036, y, c.z + 0.012), (0.042, 0.012, 0.03), col)
            box(p, (0, y, c.z + 0.02), (0.03, 0.01, 0.008), col)
            parts.append(p)
        elif kind == "bowtie":
            p = Part("bowtie", ["neck_01", "spine_03"], smooth=False)
            for sx in (1, -1):
                box(p, (sx * 0.022, -0.05, 1.47), (0.04, 0.02, 0.03), ex[1])
            parts.append(p)
        elif kind == "scarf":
            p = Part("scarf", ["neck_01", "spine_03"])
            loft(p, [((0, 0.006, 1.455), 0.07, 0.068), ((0, 0.006, 1.51), 0.062, 0.06)], [ex[1]], n=10, cap0="flat", cap1="flat")
            loft(p, [((0.04, -0.06, 1.47), 0.02, 0.04), ((0.05, -0.115, 1.36), 0.016, 0.04), ((0.05, -0.12, 1.25), 0.012, 0.038)],
                 [ex[1]], n=6, cap0="flat", cap1="flat", frame=lambda d: (Vector((0, 1, 0)).cross(d).normalized(), Vector((1, 0, 0)) ))
            parts.append(p)
        elif kind == "collar":
            p = Part("collar", ["spine_03", "neck_01"], smooth=False)
            for sx in (1, -1):
                box(p, (sx * 0.045, -0.055, 1.475), (0.06, 0.02, 0.05), ex[1], rot=Matrix.Rotation(math.radians(sx * 25), 3, "Y"))
            parts.append(p)
        elif kind == "backpack":
            p = Part("backpack", ["spine_02", "spine_03"])
            loft(p, [((0, 0.12, 1.08), 0.13, 0.06, 0.6), ((0, 0.135, 1.22), 0.135, 0.07, 0.6), ((0, 0.13, 1.38), 0.12, 0.06, 0.6)],
                 [ex[1], ex[1]], n=8, cap0="flat", cap1="pole", cap_len=0.3)
            box(p, (0, 0.205, 1.16), (0.16, 0.03, 0.12), ex[2], bevel=0.02)
            for sx in (1, -1):
                box(p, (sx * 0.1, -0.112, 1.33), (0.026, 0.01, 0.2), ex[3] if len(ex) > 3 else ex[2], rot=Matrix.Rotation(math.radians(-6), 3, "X"))
            parts.append(p)
        elif kind == "satchel":
            p = Part("satchel", ["pelvis", "spine_01"], smooth=False)
            box(p, (0.16, -0.02, 0.92), (0.05, 0.2, 0.15), ex[1], bevel=0.015)
            # strap across chest
            loft(p, [((0.17, -0.02, 0.98), 0.012, 0.004), ((0.0, -0.12, 1.2), 0.013, 0.004), ((-0.15, -0.02, 1.43), 0.012, 0.004)],
                 [ex[2]], n=4, cap0="flat", cap1="flat")
            parts.append(p)
        elif kind == "pearls":
            p = Part("pearls", ["spine_03", "neck_01"])
            for i in range(9):
                t = math.pi * (0.15 + 0.7 * i / 8)
                ellipsoid(p, (math.cos(t) * 0.06, -math.sin(t) * 0.058 + 0.01, 1.455 - math.sin(t) * 0.03), (0.009, 0.009, 0.009), ex[1], seg=5, rings=3)
            parts.append(p)
        elif kind == "belt":
            p = Part("belt", ["pelvis", "spine_01"])
            loft(p, [((0, 0.02, 0.985), 0.168, 0.116), ((0, 0.02, 1.02), 0.163, 0.113)], [ex[1]], n=10, cap0=None, cap1=None)
            parts.append(p)
        elif kind == "lapels":
            p = Part("lapels", ["spine_03", "spine_02"], smooth=False)
            for sx in (1, -1):
                box(p, (sx * 0.05, -0.112, 1.33), (0.035, 0.012, 0.2), ex[1], rot=Matrix.Rotation(math.radians(sx * 14), 3, "Y"))
            parts.append(p)
        elif kind == "tee_neck":  # round crew neckline of the tee, inside the open overshirt
            p = Part("tee_neck", ["spine_03", "neck_01"])
            loft(p, [((0, 0.008, 1.488), 0.068, 0.062), ((0, 0.010, 1.522), 0.061, 0.057)], [ex[1]], n=10, cap0="flat", cap1=None)
            parts.append(p)
        elif kind == "watch":  # thin band on the left wrist with a small round face
            p = Part("watch", ["lowerarm_l"], smooth=False)
            y, z, x = 0.062, 1.437, 0.688
            loft(p, [((x - 0.008, y, z), 0.0385, 0.0375), ((x + 0.008, y, z), 0.0375, 0.0365)], [ex[1]], n=8, cap0="flat", cap1="flat",
                 frame=lambda d: (Vector((0, 1, 0)), Vector((0, 0, 1))))
            disc(p, (x, y, z + 0.035), 0.0125, 0.006, ex[1], n=8, col_top=ex[2])
            parts.append(p)
        elif kind == "rolled_cuffs":  # sleeves pushed up to just below the elbow
            for s_, sx in (("l", 1), ("r", -1)):
                p = Part(f"cuff_{s_}", [f"lowerarm_{s_}", f"upperarm_{s_}"])
                y, z = 0.062, 1.437
                loft(p, [((0.456 * sx, y, z), 0.047, 0.047), ((0.474 * sx, y, z), 0.050, 0.050), ((0.502 * sx, y, z), 0.046, 0.046)],
                     [ex[1], ex[1]], n=10, cap0="flat", cap1="flat")
                parts.append(p)
        elif kind == "pocket":  # chest patch pocket on his left
            p = Part("pocket", ["spine_03", "spine_02"], smooth=False)
            box(p, (0.085, -0.116, 1.31), (0.06, 0.01, 0.065), ex[1], rot=Matrix.Rotation(math.radians(-8), 3, "X"))
            parts.append(p)
        elif kind == "shirtfront":
            p = Part("shirtfront", ["spine_03", "spine_02"], smooth=False)
            box(p, (0, -0.108, 1.33), (0.07, 0.012, 0.24), ex[1])
            parts.append(p)


def build_person(arm, segs, name, o):
    parts = []
    head(parts, o)
    legs(parts, o)
    torso(parts, o)
    arms(parts, o)
    hair(parts, o)
    hat(parts, o)
    if o.get("skirt"):
        skirt(parts, o, "skirt", *o["skirt"])
    if o.get("coat"):
        skirt(parts, o, "coat_hem", *o["coat"])
    if o.get("apron"):
        skirt(parts, o, "apron", *o["apron"])
    extras(parts, o)
    ob = build_mesh(name, parts, arm, segs)
    ob.data.materials.append(MAT)
    return ob


# ------------------------------------------------------------------ the townsfolk
S = C
def spec():
    L = {}
    L["player"] = dict(
        desc="The visitor you walk around as: mustard field jacket, ink trousers, white trainers, small backpack.",
        skin=S["skin2"], hair="crop", hair_col=S["hair_dark"],
        torso=[S["ink"], S["ink"], S["mustard"], S["mustard"], S["mustard"], S["mustard"]],
        arms=[S["mustard"]] * 4 + [S["mustard"]], cuff_w=1.08,
        legs=[S["ink"]] * 6, shoe=S["white"], sole=S["terracotta"],
        extras=[("backpack", S["cypress"], S["sand"], S["ink"])], front=(S["white"], 0.06, 1.47))
    L["jogger"] = dict(
        desc="Morning and dusk runner: pink tank top, ink leggings, ponytail, headband.", female=True,
        skin=S["skin3"], hair="ponytail", hair_col=S["hair_dark"], hat="headband", hat_col=S["pink"],
        torso=[S["ink"], S["ink"], S["pink"], S["pink"], S["pink"], S["pink"]],
        arms=[S["skin3"]] * 5, legs=[S["ink"]] * 4 + [S["skin3"]] * 2, trouser_w=0.95,
        shoe=S["white"], sole=S["coral"], limb=0.92)
    L["waiter"] = dict(
        desc="Cafe waiter: white shirt, black waistcoat, bow tie, long white apron (pairs with the tray prop and walk_carry).",
        skin=S["skin1"], hair="slick", hair_col=S["hair_dark"],
        torso=[S["black"], S["black"], S["black"], S["black"], S["black"], S["white"]],
        arms=[S["white"]] * 5, legs=[S["black"]] * 6, shoe=S["black"],
        apron=(1.0, 0.36, (0.175, 0.125), (0.2, 0.15), S["white"], (math.radians(200), math.radians(340))),
        extras=[("bowtie", S["black"])], front=(S["white"], 0.05, 1.47))
    L["older_woman"] = dict(
        desc="Older lady: powder-blue coat, burgundy beret, white bob, pearls.", female=True,
        skin=S["skin1"], hair="bob", hair_col=S["hair_white"], hat="beret", hat_col=S["burgundy"],
        torso=[S["powder"]] * 6, arms=[S["powder"]] * 5, cuff_w=1.12, legs=[S["powder"]] * 2 + [S["skin1"]] * 4, trouser_w=0.85,
        coat=(1.0, 0.52, (0.155, 0.112), (0.215, 0.17), S["powder"], None, 0.02, 12, S["navy"]), shoe=S["burgundy"],
        extras=[("pearls", S["cream"])], girth=1.03)
    L["older_man"] = dict(
        desc="Older gentleman: zinc jacket, sand trousers, flat cap, glasses (pairs with the cane prop and walk_formal).",
        skin=S["skin2"], hair="fringe_ring", hair_col=S["hair_grey"], hat="flat_cap", hat_col=S["cypress"],
        torso=[S["navy"], S["navy"], S["zinc"], S["zinc"], S["zinc"], S["zinc"], S["zinc"]], arms=[S["zinc"]] * 5,
        legs=[S["navy"]] * 6, shoe=S["coffee"], belly=0.03,
        extras=[("glasses", S["black"])], front=(S["white"], 0.06, 1.47))
    L["dog_walker"] = dict(
        desc="Dog walker: cypress-green jacket, linen trousers, auburn bun, crossbody bag (pairs with dog.glb and the leash helper).", female=True,
        skin=S["skin1"], hair="bun", hair_col=S["hair_auburn"],
        torso=[S["linen"], S["linen"], S["cypress"], S["cypress"], S["cypress"], S["cypress"]], arms=[S["cypress"]] * 5,
        legs=[S["linen"]] * 6, shoe=S["terracotta"], hem_w=1.12,
        extras=[("satchel", S["terracotta"], S["coffee"]), ("scarf", S["mustard"])])
    L["cyclist"] = dict(
        desc="Cyclist: powder shirt with rolled sleeves, navy shorts, red cap (pairs with bicycle.glb and the cycle clip).",
        skin=S["skin2"], hair="short", hair_col=S["hair_brown"], hat="cap", hat_col=S["terracotta"], hat_col2=S["terracotta"],
        torso=[S["navy"], S["navy"], S["powder"], S["powder"], S["powder"], S["powder"]],
        arms=[S["powder"], S["powder"], S["powder"], S["skin2"], S["skin2"]],
        legs=[S["navy"]] * 3 + [S["skin2"]] * 3, shoe=S["white"], sole=S["ink"])
    L["child"] = dict(
        desc="Child in a Breton striped top and red shorts; rig is scaled to 0.62.", scale=0.62,
        skin=S["skin1"], hair="short", hair_col=S["hair_blond"], head=1.42, limb=1.18, girth=1.08, hand=1.2,
        torso=[S["burgundy"], S["burgundy"], S["white"], S["white"], S["white"], S["white"]], stripes=(S["white"], S["navy"]),
        arms=[S["white"], S["navy"], S["white"], S["navy"], S["white"]], legs=[S["burgundy"]] * 3 + [S["skin1"]] * 3,
        shoe=S["navy"], sole=S["white"], neck_r=0.052, shoe_w=1.15)
    L["stroller_dress"] = dict(
        desc="Evening stroller: magenta sundress, straw sun hat, dark bob.", female=True,
        skin=S["skin4"], hair="bob", hair_col=S["hair_dark"], hat="sun_hat", hat_col=S["sand"], hat_col2=S["ink"],
        torso=[S["magenta"]] * 6, arms=[S["magenta"], S["skin4"], S["skin4"], S["skin4"], S["skin4"]],
        legs=[S["skin4"]] * 6, skirt=(1.03, 0.5, (0.135, 0.105), (0.23, 0.2), S["magenta"]), shoe=S["sand"], sole=S["coffee"])
    L["stroller_linen"] = dict(
        desc="Stroller in a linen suit and powder shirt, sunglasses.",
        skin=S["skin3"], hair="short", hair_col=S["hair_dark"],
        torso=[S["linen"], S["linen"], S["linen"], S["linen"], S["linen"], S["linen"]], arms=[S["linen"]] * 5,
        legs=[S["linen"]] * 6, shoe=S["coffee"],
        extras=[("glasses", S["black"])], front=(S["powder"], 0.06, 1.47))
    L["asgeir"] = dict(
        desc="Asgeir, founder of Albretsen AS: ink overshirt open over a white tee, sleeves pushed up, sand chinos, white sneakers, thin dark watch, tousled dark-blond hair.",
        skin=S["skin1"], hair="tousled", hair_col=S["hair_ash"], girth=0.95, limb=0.96, trouser_w=0.93, hem_w=0.94,
        torso=[S["sand"], S["ink"], S["ink"], S["ink"], S["ink"], S["ink"], S["ink"]],
        arms=[S["ink"], S["ink"], S["ink"], S["skin1"], S["skin1"]],
        legs=[S["sand"]] * 6, shoe=S["white"], sole=S["white"],
        extras=[("tee_neck", S["white"]), ("collar", S["ink"]), ("rolled_cuffs", S["ink"]), ("pocket", S["navy"]), ("watch", S["black"], S["plaster"])],
        front=(S["white"], 0.052, 1.475))
    return L


reset()
arm, _ = load_skeleton(with_clips=False)
segs = bone_segments(arm)
MAT = vc_material("townsfolk")
os.makedirs(OUT, exist_ok=True)
L = spec()
for name, o in L.items():
    if ONLY and name not in ONLY:
        continue
    a = arm.copy()
    a.data = arm.data.copy()
    link(a)
    a.name = name
    a.data.name = name + "_rig"
    sc = o.get("scale", 1.0)
    ob = build_person(a, segs, name + "_mesh", o)
    a.scale = (sc, sc, sc)
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    print("CHAR", name, "tris", tris)
    bpy.ops.object.select_all(action="DESELECT")
    a.select_set(True)
    ob.select_set(True)
    bpy.ops.export_scene.gltf(filepath=OUT + f"{name}.glb", export_format="GLB", use_selection=True,
                              export_animations=False, export_skins=True, export_yup=True,
                              export_vertex_color="ACTIVE", export_all_vertex_colors=False)
    with open(OUT + f"{name}.json", "w") as f:
        import json
        json.dump({"name": name, "tris": tris, "desc": o["desc"]}, f)
print("DONE")
