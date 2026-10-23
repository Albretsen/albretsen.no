# Shared helpers for building Heure Bleue townspeople in Blender (headless).
import bpy, bmesh, math
from mathutils import Vector, Matrix

T = "/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.WMbRtIP0Fk/"

# ---------------------------------------------------------------- palette
def srgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

def lin(c):
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

PAL = {
    # style guide palette
    "plaster": "#f4eadb", "pink": "#f2b5b8", "powder": "#a9c6e0", "mustard": "#d9a42b",
    "burgundy": "#6e1f33", "zinc": "#8d9bb4", "ink": "#232c57", "magenta": "#c8336e",
    "terracotta": "#c96f4a", "cypress": "#2f4a3a",
    # people extras (kept close to the palette)
    "white": "#fbf6ee", "black": "#1b1f33", "linen": "#e6d6bc", "sand": "#d8c3a0",
    "skin1": "#f1c7a6", "skin2": "#d9a07a", "skin3": "#a8704e", "skin4": "#6f4632",
    "hair_dark": "#2b2230", "hair_brown": "#5a3a2a", "hair_auburn": "#8a3e26", "hair_blond": "#d9b25e",
    "hair_grey": "#c9c6c4", "hair_white": "#ece8e2", "navy": "#2c3a6b", "olive": "#6f7445",
    "denim": "#4f6d9a", "sage": "#9db59a", "coral": "#e8806b", "cream": "#fff4d6",
    "dog_tan": "#c58b52", "dog_dark": "#3a2a24", "dog_white": "#f3ece2", "rubber": "#2a2a33",
    "steel": "#b8c2d0", "glass": "#cfe3ef", "wine": "#7a1630", "coffee": "#4a2c20",
}
COL = {k: lin(srgb(v)) for k, v in PAL.items()}

# ---------------------------------------------------------------- scene
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def link(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob

# ---------------------------------------------------------------- geometry builder
class Part:
    """Accumulates verts/faces with a colour per face and a bone list for weighting."""

    def __init__(self, name, bones, smooth=True, weight_fn=None):
        self.name, self.bones, self.smooth, self.weight_fn = name, bones, smooth, weight_fn
        self.v, self.f, self.fc = [], [], []

    def add_vert(self, p):
        self.v.append(Vector(p))
        return len(self.v) - 1

    def face(self, idx, col):
        self.f.append(tuple(idx))
        self.fc.append(col)


def frame_for(d):
    d = d.normalized()
    ref = Vector((1, 0, 0)) if abs(d.z) > 0.7 else Vector((0, 0, 1))
    u = (ref - d * ref.dot(d)).normalized()
    v = d.cross(u).normalized()
    return u, v


def loft(part, rings, cols, n=8, cap0="pole", cap1="pole", phase=0.5, cap_len=0.35, frame=None):
    """rings: list of (center, rx, ry) or (center, rx, ry, dict(off=Vector)) ; cols: colour per segment
    (len(rings)-1) plus optional cap colours via cols[-1]/cols[0]. rx is along frame u, ry along v."""
    pts = [Vector(r[0]) for r in rings]
    rid = []
    for i, r in enumerate(rings):
        c, rx, ry = Vector(r[0]), r[1], r[2]
        if i == 0:
            d = pts[1] - pts[0]
        elif i == len(rings) - 1:
            d = pts[-1] - pts[-2]
        else:
            d = (pts[i + 1] - pts[i - 1])
        u, v = frame(d) if frame else frame_for(d)
        sq = r[3] if len(r) > 3 else 1.0  # squareness exponent (<1 boxier)
        ids = []
        for k in range(n):
            t = 2 * math.pi * (k + phase) / n
            ct, st = math.cos(t), math.sin(t)
            if sq != 1.0:
                ct = math.copysign(abs(ct) ** sq, ct)
                st = math.copysign(abs(st) ** sq, st)
            ids.append(part.add_vert(c + u * (rx * ct) + v * (ry * st)))
        rid.append(ids)
    for i in range(len(rings) - 1):
        a, b = rid[i], rid[i + 1]
        col = cols[min(i, len(cols) - 1)]
        for k in range(n):
            k2 = (k + 1) % n
            part.face((a[k], a[k2], b[k2], b[k]), col)
    def cap(ids, c, d, rr, col, kind, flip):
        if kind is None:
            return
        if kind == "flat":
            part.face(tuple(reversed(ids)) if not flip else tuple(ids), col)
            return
        p = part.add_vert(c + d.normalized() * rr * cap_len)
        for k in range(n):
            k2 = (k + 1) % n
            part.face((ids[k2], ids[k], p) if not flip else (ids[k], ids[k2], p), col)
    cap(rid[0], pts[0], pts[0] - pts[1], min(rings[0][1], rings[0][2]), cols[0], cap0, False)
    cap(rid[-1], pts[-1], pts[-1] - pts[-2], min(rings[-1][1], rings[-1][2]), cols[-1], cap1, True)
    return rid


def ellipsoid(part, c, r, col, seg=10, rings=7, cut=None, colfn=None, rot=None):
    """UV ellipsoid. cut(local_vec)->bool keep face. colfn(local_center)->colour."""
    c = Vector(c)
    grid = []
    top = part.add_vert(c + Vector((0, 0, r[2])) if rot is None else c + rot @ Vector((0, 0, r[2])))
    bot = None
    loc = {}
    for i in range(1, rings):
        th = math.pi * i / rings
        row = []
        for j in range(seg):
            ph = 2 * math.pi * (j + 0.5) / seg
            lv = Vector((math.sin(th) * math.cos(ph) * r[0], math.sin(th) * math.sin(ph) * r[1], math.cos(th) * r[2]))
            gv = c + (rot @ lv if rot is not None else lv)
            idx = part.add_vert(gv)
            loc[idx] = lv
            row.append(idx)
        grid.append(row)
    loc[top] = Vector((0, 0, r[2]))
    bot = part.add_vert(c + (rot @ Vector((0, 0, -r[2])) if rot is not None else Vector((0, 0, -r[2]))))
    loc[bot] = Vector((0, 0, -r[2]))
    faces = []
    for j in range(seg):
        j2 = (j + 1) % seg
        faces.append((top, grid[0][j], grid[0][j2]))
    for i in range(rings - 2):
        for j in range(seg):
            j2 = (j + 1) % seg
            faces.append((grid[i][j], grid[i + 1][j], grid[i + 1][j2], grid[i][j2]))
    for j in range(seg):
        j2 = (j + 1) % seg
        faces.append((bot, grid[-1][j2], grid[-1][j]))
    for fc in faces:
        cen = sum((loc[i] for i in fc), Vector()) / len(fc)
        if cut and not cut(cen):
            continue
        part.face(fc, colfn(cen) if colfn else col)


def box(part, c, size, col, bevel=0.0, rot=None):
    """Axis box (optionally chamfered on vertical edges via 8-gon). size = full extents."""
    c = Vector(c)
    sx, sy, sz = (s / 2 for s in size)
    if bevel <= 0:
        corners = [(-sx, -sy), (sx, -sy), (sx, sy), (-sx, sy)]
    else:
        b = bevel
        corners = [(-sx + b, -sy), (sx - b, -sy), (sx, -sy + b), (sx, sy - b), (sx - b, sy), (-sx + b, sy), (-sx, sy - b), (-sx, -sy + b)]
    def P(x, y, z):
        v = Vector((x, y, z))
        return c + (rot @ v if rot is not None else v)
    lo = [part.add_vert(P(x, y, -sz)) for x, y in corners]
    hi = [part.add_vert(P(x, y, sz)) for x, y in corners]
    n = len(corners)
    for k in range(n):
        k2 = (k + 1) % n
        part.face((lo[k], lo[k2], hi[k2], hi[k]), col)
    part.face(tuple(hi), col)
    part.face(tuple(reversed(lo)), col)


def disc(part, c, r, h, col, n=12, rot=None, col_top=None):
    c = Vector(c)
    def P(v):
        return c + (rot @ v if rot is not None else v)
    lo = [part.add_vert(P(Vector((r * math.cos(2 * math.pi * k / n), r * math.sin(2 * math.pi * k / n), 0)))) for k in range(n)]
    hi = [part.add_vert(P(Vector((r * math.cos(2 * math.pi * k / n), r * math.sin(2 * math.pi * k / n), h)))) for k in range(n)]
    for k in range(n):
        k2 = (k + 1) % n
        part.face((lo[k], lo[k2], hi[k2], hi[k]), col)
    part.face(tuple(hi), col_top or col)
    part.face(tuple(reversed(lo)), col)


# ---------------------------------------------------------------- armature
def seg_dist(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-9)))
    return (a + ab * t - p).length, t


def auto_weights(p, bones, segs, power=4.0):
    ds = []
    for bn in bones:
        a, b = segs[bn]
        d, _ = seg_dist(p, a, b)
        ds.append((max(d, 0.004) ** -power, bn))
    ds.sort(reverse=True)
    ds = ds[:3]
    s = sum(w for w, _ in ds)
    out = [(w / s, bn) for w, bn in ds]
    out = [(w, bn) for w, bn in out if w > 0.04]
    s = sum(w for w, _ in out)
    return [(w / s, bn) for w, bn in out]


def build_mesh(name, parts, arm_ob, segs, auto_smooth_deg=55, gradient=True):
    """Join parts into one skinned mesh object with a COLOR_0 vertex colour attribute."""
    verts, faces, fcols, vweights, smooth = [], [], [], [], []
    for part in parts:
        base = len(verts)
        for p in part.v:
            verts.append(p)
            if part.weight_fn:
                vweights.append(part.weight_fn(p))
            else:
                vweights.append(auto_weights(p, part.bones, segs))
        for fc, col in zip(part.f, part.fc):
            faces.append(tuple(i + base for i in fc))
            fcols.append(col)
            smooth.append(part.smooth)
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.validate(clean_customdata=False)
    ob = link(bpy.data.objects.new(name, me))
    # face-corner colours (so colour seams stay crisp)
    attr = me.color_attributes.new("Color", "FLOAT_COLOR", "CORNER")
    for poly in me.polygons:
        c = fcols[poly.index]
        for li in poly.loop_indices:
            z = verts[me.loops[li].vertex_index].z
            g = 0.80 + 0.20 * min(1.0, max(0.0, z / 1.7)) ** 0.8 if gradient else 1.0
            attr.data[li].color = (c[0] * g, c[1] * g, c[2] * g, 1.0)
    me.color_attributes.active_color = attr
    me.color_attributes.render_color_index = 0
    for poly in me.polygons:
        poly.use_smooth = smooth[poly.index]
    try:
        me.set_sharp_from_angle(angle=math.radians(auto_smooth_deg))
    except Exception as e:
        print("sharp", e)
    # weights
    groups = {}
    for vi, ws in enumerate(vweights):
        for w, bn in ws:
            g = groups.get(bn) or ob.vertex_groups.new(name=bn)
            groups[bn] = g
            g.add([vi], w, "REPLACE")
    ob.parent = arm_ob
    mod = ob.modifiers.new("Armature", "ARMATURE")
    mod.object = arm_ob
    return ob


def vc_material(name="people", rough=0.85, emissive=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = rough
    if emissive is None:
        ca = nt.nodes.new("ShaderNodeVertexColor")
        ca.layer_name = "Color"
        nt.links.new(ca.outputs["Color"], bsdf.inputs["Base Color"])
    else:
        base, em = emissive
        bsdf.inputs["Base Color"].default_value = (*base, 1)
        bsdf.inputs["Emission Color"].default_value = (*em, 1)
        bsdf.inputs["Emission Strength"].default_value = 0.0
    return m


def flat_material(name, col, rough=0.8):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*col, 1)
    b.inputs["Roughness"].default_value = rough
    return m
