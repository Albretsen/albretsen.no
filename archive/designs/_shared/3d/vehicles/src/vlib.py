# Shared Blender helpers for the Heure Bleue vehicles.
# Car space: f = forward, s = left, h = up (metres). Blender: X = s, Y = -f, Z = h,
# so after glTF export (+Y up) every vehicle faces +Z and its left side is +X.
import bpy, bmesh, math
from mathutils import Vector, Matrix

PAL = {
    'plaster': '#f4eadb', 'pink': '#f2b5b8', 'powder': '#a9c6e0', 'mustard': '#d9a42b',
    'burgundy': '#6e1f33', 'zinc': '#8d9bb4', 'ink': '#232c57', 'magenta': '#c8336e',
    'terracotta': '#c96f4a', 'cypress': '#2f4a3a',
}


def P(f, s, h):
    return Vector((s, -f, h))


def srgb_to_lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexlin(hx):
    hx = hx.lstrip('#')
    return tuple(srgb_to_lin(int(hx[i:i + 2], 16) / 255) for i in (0, 2, 4))


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()


_mats = {}


def mat(name, hx, rough=0.7, metal=0.0, emit=None, alpha=None):
    """Palette material. emissive_* materials get a dark base and an emissive colour
    (the runtime sets emissiveIntensity to 0 until dusk)."""
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    b = m.node_tree.nodes.get('Principled BSDF')
    r, g, bl = hexlin(hx)
    b.inputs['Base Color'].default_value = (r, g, bl, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        er, eg, eb = hexlin(emit)
        b.inputs['Emission Color'].default_value = (er, eg, eb, 1)
        b.inputs['Emission Strength'].default_value = 1.0
    if alpha is not None:
        b.inputs['Alpha'].default_value = alpha
        try:
            m.surface_render_method = 'BLENDED'
        except Exception:
            m.blend_method = 'BLEND'
    m.diffuse_color = (r, g, bl, 1 if alpha is None else alpha)
    _mats[name] = m
    return m


def std_mats(paint_hex, accent_hex=None, interior_hex=None):
    return {
        'paint': mat('paint', paint_hex, 0.45),
        'paint_accent': mat('paint_accent', accent_hex or PAL['plaster'], 0.5),
        'chrome': mat('chrome', '#e6e8ee', 0.28, 0.25),
        'tyre': mat('tyre', '#2a2b36', 0.9),
        'trim': mat('trim_dark', '#2b2f4a', 0.8),
        'shadow': mat('shadow', '#1a1c2c', 1.0),
        'interior': mat('interior', interior_hex or PAL['burgundy'], 0.75),
        'carpet': mat('interior_dark', '#3b2a37', 0.95),
        'plaster': mat('plaster', PAL['plaster'], 0.7),
        'glass': mat('glass', '#bcd6ee', 0.08, 0.0, alpha=0.32),
        'glass_dark': mat('glass_tint', '#3d4a72', 0.12),
        'head': mat('emissive_headlight', '#d8dde6', 0.2, emit='#fff1d0'),
        'tail': mat('emissive_taillight', '#7a1c22', 0.35, emit='#ff4a36'),
        'dash': mat('emissive_dash', '#2b2f4a', 0.5, emit='#ffc979'),
    }


# ------------------------------------------------------------------ mesh building
def make_obj(name, bm, mats, parent=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if parent:
        ob.parent = parent
    return ob


def bm_from(verts, faces, mat_idx=None):
    bm = bmesh.new()
    vs = [bm.verts.new(v) for v in verts]
    for i, f in enumerate(faces):
        try:
            face = bm.faces.new([vs[j] for j in f])
            if mat_idx:
                face.material_index = mat_idx[i]
        except ValueError:
            pass
    bm.normal_update()
    return bm


def loft(rings, cap0=True, cap1=True, closed=True):
    """rings: list of lists of Vectors, equal length. Returns (verts, faces, face_info)
    face_info[i] = (station_index, ring_index) or ('cap', 0|1)."""
    n = len(rings[0])
    verts = [v for r in rings for v in r]
    faces, info = [], []
    for i in range(len(rings) - 1):
        for j in range(n if closed else n - 1):
            a = i * n + j
            b = i * n + (j + 1) % n
            faces.append([a, b, b + n, a + n])
            info.append((i, j))
    if cap0:
        faces.append(list(range(n))[::-1]); info.append(('cap', 0))
    if cap1:
        last = (len(rings) - 1) * n
        faces.append([last + j for j in range(n)]); info.append(('cap', 1))
    return verts, faces, info


def fix_normals(bm):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)


def box(name, size, center, m, bevel=0.0, segs=1, parent=None, rot=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=list(bm.edges) + list(bm.verts), offset=bevel, segments=segs,
                        affect='EDGES', profile=0.5)
    if rot:
        bmesh.ops.rotate(bm, verts=bm.verts, cent=Vector((0, 0, 0)), matrix=rot)
    bmesh.ops.translate(bm, vec=Vector(center), verts=bm.verts)
    return make_obj(name, bm, [m], parent)


def cyl(name, r, depth, center, axis='X', segs=16, m=None, r2=None, parent=None, caps=True, mats=None):
    """Cylinder/cone. axis in 'X','Y','Z' (Blender axes)."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=caps, cap_tris=False, segments=segs, radius1=r,
                          radius2=r if r2 is None else r2, depth=depth)
    if axis == 'X':
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'Y'))
    elif axis == 'Y':
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'X'))
    bmesh.ops.translate(bm, vec=Vector(center), verts=bm.verts)
    return make_obj(name, bm, mats or [m], parent)


def lathe(name, prof, segs, center=(0, 0, 0), axis='X', mats=None, mat_of_seg=None, parent=None, flip=False):
    """prof: list of (r, x) around the axis. mat_of_seg(k) -> material index per profile segment."""
    verts, faces, idx = [], [], []
    for i in range(segs):
        a = 2 * math.pi * i / segs
        ca, sa = math.cos(a), math.sin(a)
        for (r, x) in prof:
            if axis == 'X':
                verts.append(Vector((x, r * ca, r * sa)))
            elif axis == 'Y':
                verts.append(Vector((r * ca, x, r * sa)))
            else:
                verts.append(Vector((r * ca, r * sa, x)))
    n = len(prof)
    for i in range(segs):
        i2 = (i + 1) % segs
        for k in range(n - 1):
            a, b = i * n + k, i * n + k + 1
            c, d = i2 * n + k + 1, i2 * n + k
            # skip degenerate quads on the axis
            faces.append([a, b, c, d] if not flip else [d, c, b, a])
            idx.append(mat_of_seg(k) if mat_of_seg else 0)
    bm = bm_from([v + Vector(center) for v in verts], faces, idx)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    # drop zero-area faces left by collapsed axis points
    bad = [f for f in bm.faces if f.calc_area() < 1e-9]
    bmesh.ops.delete(bm, geom=bad, context='FACES')
    fix_normals(bm)
    return make_obj(name, bm, mats, parent)


def tube(name, pts, r, m, segs=8, parent=None, caps=True):
    """Round tube along a polyline of Vectors."""
    pts = [Vector(p) for p in pts]
    rings = []
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        up = Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((1, 0, 0))
        nx = t.cross(up).normalized()
        ny = nx.cross(t).normalized()
        rings.append([p + (nx * math.cos(2 * math.pi * k / segs) + ny * math.sin(2 * math.pi * k / segs)) * r
                      for k in range(segs)])
    v, f, _ = loft(rings, caps, caps)
    bm = bm_from(v, f)
    fix_normals(bm)
    return make_obj(name, bm, [m], parent)


def sweep(name, pts, prof, m, parent=None, up=Vector((0, 0, 1)), caps=True):
    """Sweep a 2D profile [(x across, y up)] along a polyline (profile frame: side normal, up)."""
    pts = [Vector(p) for p in pts]
    rings = []
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        nx = t.cross(up).normalized()
        ny = nx.cross(t).normalized()
        rings.append([p + nx * a + ny * b for (a, b) in prof])
    v, f, _ = loft(rings, caps, caps)
    bm = bm_from(v, f)
    fix_normals(bm)
    return make_obj(name, bm, [m], parent)


def empty(name, loc, parent=None):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.2
    e.location = loc
    bpy.context.scene.collection.objects.link(e)
    if parent:
        e.parent = parent
    return e


# ------------------------------------------------------------------ operations
def boolean(ob, cutter, op='DIFFERENCE', transfer=True):
    md = ob.modifiers.new('bool', 'BOOLEAN')
    md.operation = op
    md.object = cutter
    try:
        md.solver = 'EXACT'
    except Exception:
        pass
    try:
        md.material_mode = 'TRANSFER' if transfer else 'INDEX'
    except Exception:
        pass
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    ob.modifiers.remove(md)
    old = ob.data
    ob.data = me
    bpy.data.meshes.remove(old)
    return ob


def copy_obj(ob, name):
    c = ob.copy()
    c.data = ob.data.copy()
    c.name = name
    bpy.context.scene.collection.objects.link(c)
    return c


def delete(ob):
    bpy.data.objects.remove(ob, do_unlink=True)


def join(name, obs, parent=None):
    obs = [o for o in obs if o]
    bpy.ops.object.select_all(action='DESELECT')
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    with bpy.context.temp_override(active_object=obs[0], object=obs[0],
                                   selected_objects=obs, selected_editable_objects=obs):
        bpy.ops.object.join()
    ob = obs[0]
    ob.name = name
    ob.data.name = name
    if parent:
        mw = ob.matrix_world.copy()
        ob.parent = parent
        ob.matrix_world = mw
    return ob


def set_origin(ob, world_pt):
    """Move the object origin to world_pt without moving the geometry."""
    world_pt = Vector(world_pt)
    local = ob.matrix_world.inverted() @ world_pt
    ob.data.transform(Matrix.Translation(-local))
    ob.matrix_world = ob.matrix_world @ Matrix.Translation(local)


def mirror_x(ob, name):
    """Mirrored copy across s=0 (geometry mirrored, identity transform kept)."""
    c = copy_obj(ob, name)
    c.data.transform(Matrix.Scale(-1, 4, (1, 0, 0)))
    c.data.flip_normals()
    c.location.x = -c.location.x
    return c


def finish(ob, angle=32):
    me = ob.data
    for p in me.polygons:
        p.use_smooth = True
    try:
        me.set_sharp_from_angle(angle=math.radians(angle))
    except Exception:
        pass
    me.validate()
    me.update()


def clean(ob, dist=1e-4):
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=dist)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-5)
    bm.to_mesh(ob.data)
    bm.free()


def tris(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons) if ob.type == 'MESH' else 0


def export(path):
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_yup=True,
                              export_apply=True, export_extras=True, use_selection=False,
                              export_animations=False, export_cameras=False, export_lights=False)
    total = sum(tris(o) for o in bpy.data.objects)
    print('EXPORTED', path, 'tris', total)
    return total


def car_wheel(name, sgn, loc, R, Wd, mats, whitewall=False, parent=None, lugs=5, segs=20):
    """Lathe wheel around X. mats: [chrome, rim, tyre, shadow(, whitewall)]. Outer side faces +X*sgn."""
    hw = Wd / 2
    prof = [(0.0, hw - 0.01), (R * 0.17, hw - 0.012), (R * 0.32, hw - 0.02), (R * 0.38, hw - 0.03),
            (R * 0.45, hw - 0.032), (R * 0.60, hw - 0.026), (R * 0.64, hw - 0.01), (R * 0.72, hw + 0.0),
            (R * 0.84, hw + 0.002), (R * 0.96, hw - 0.008), (R, hw - 0.03), (R, -hw + 0.03),
            (R * 0.96, -hw + 0.008), (R * 0.84, -hw), (R * 0.64, -hw + 0.01), (R * 0.5, -hw + 0.02),
            (0.0, -hw + 0.02)]

    def mi(k):
        if k < 4: return 0
        if k < 6: return 1
        if whitewall and k == 7: return 4
        if k < 14: return 2
        return 3
    wo = lathe(name, prof, segs, (0, 0, 0), 'X', mats, mi)
    parts = [wo]
    for i in range(lugs):
        a = 2 * math.pi * i / lugs
        parts.append(cyl('lug', R * 0.035, 0.02, (hw - 0.02, R * 0.24 * math.cos(a), R * 0.24 * math.sin(a)),
                         'X', 6, mats[0]))
    wo = join(name, parts)
    if sgn < 0:
        wo.data.transform(Matrix.Scale(-1, 4, (1, 0, 0)))
        wo.data.flip_normals()
    wo.location = loc
    wo.parent = parent
    finish(wo, 40)
    return wo


def arch_cut(body, f, h, r, m, s_from=0.5, depth=0.6):
    for sg in (1, -1):
        c = cyl('cut', r, depth, P(f, sg * (s_from + depth / 2), h), 'X', 28, m)
        boolean(body, c)
        delete(c)


def surface_pane(name, pts_fn, nu, nv, m, offset, parent=None):
    """A thin pane following a surface: pts_fn(u, v) -> Vector for u, v in [0, 1]; offset(Vector) -> Vector."""
    verts = [pts_fn(i / nu, j / nv) for j in range(nv + 1) for i in range(nu + 1)]
    verts = [v + offset(v) for v in verts]
    faces = [[j * (nu + 1) + i, j * (nu + 1) + i + 1, (j + 1) * (nu + 1) + i + 1, (j + 1) * (nu + 1) + i]
             for j in range(nv) for i in range(nu)]
    bm = bm_from(verts, faces)
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.006)
    fix_normals(bm)
    return make_obj(name, bm, [m], parent)
