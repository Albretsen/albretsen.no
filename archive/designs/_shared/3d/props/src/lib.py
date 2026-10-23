# Heure Bleue props: tiny procedural modelling kit for Blender 5.x.
# Everything is built in place (object transforms stay identity), coloured by
# UV-mapping into one shared 256px palette atlas with a soft vertical gradient.
import bpy, bmesh, math, random, os
from mathutils import Vector, Matrix, Euler

PAL = [
  ('plaster', '#f4eadb'), ('pink', '#f2b5b8'), ('powder', '#a9c6e0'), ('mustard', '#d9a42b'),
  ('burgundy', '#6e1f33'), ('zinc', '#8d9bb4'), ('ink', '#232c57'), ('magenta', '#c8336e'),
  ('terracotta', '#c96f4a'), ('cypress', '#2f4a3a'), ('cypress_lt', '#3f6450'), ('olive_leaf', '#8e9c78'),
  ('olive_lt', '#a9b48f'), ('palm', '#5a8456'), ('palm_dk', '#3d6044'), ('bark', '#7d5c45'),
  ('bark_lt', '#a07a5a'), ('wood', '#b07a50'), ('stone', '#e6d8c0'), ('stone_dk', '#cbb99c'),
  ('water', '#7fa8d1'), ('water_lt', '#c3dbef'), ('iron', '#262b45'), ('white', '#fbf7f0'),
  ('glass', '#2b3050'), ('lavender', '#9b8cc8'), ('leaf', '#4c7350'), ('lemon', '#f0cf4a'),
  ('rose', '#e3709a'), ('magenta_dk', '#9e2457'), ('cream', '#efe3c8'), ('red', '#c0443c'),
  ('sand', '#e8d2ae'), ('slate', '#5b6685'), ('gold', '#c9a046'), ('mint', '#9fd0bf'),
  ('coral', '#ee8a63'), ('plaster_dk', '#e0d1bb'), ('powder_dk', '#7f9fc0'), ('pink_dk', '#d98f95'),
  ('zinc_dk', '#6d7a94'), ('terracotta_dk', '#a8553a'), ('mustard_dk', '#b8861c'), ('ink_lt', '#3a4578'),
  ('fun_yellow', '#ffe066'), ('tool_black', '#141413'), ('harbor_dark', '#1b1b1b'), ('mcp_blue', '#2547e5'),
]
IDX = {n: i for i, (n, _) in enumerate(PAL)}
GRID = 8

def hex2srgb(h):
    h = h.lstrip('#'); return [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
def s2l(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def hex2lin(h):
    return [s2l(c) for c in hex2srgb(h)] + [1.0]

def make_atlas(path):
    W = 256; cell = W // GRID
    img = bpy.data.images.new('palette', W, W, alpha=False)
    px = [0.0] * (W * W * 4)
    for i, (_, hx) in enumerate(PAL):
        cx, cy = i % GRID, i // GRID
        r, g, b = hex2srgb(hx)
        for y in range(cell):
            t = y / (cell - 1)
            k = 0.86 + 0.14 * t          # darker at the foot of each part
            for x in range(cell):
                o = ((cy * cell + y) * W + cx * cell + x) * 4
                px[o:o+4] = [min(1, r * k), min(1, g * k), min(1, b * k), 1.0]
    img.pixels = px
    img.filepath_raw = path; img.file_format = 'PNG'; img.save()
    img.colorspace_settings.name = 'sRGB'
    return img

MATS = {}
def palette_mat(atlas):
    m = bpy.data.materials.new('palette'); m.use_nodes = True
    nt = m.node_tree; bsdf = nt.nodes['Principled BSDF']
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = atlas; tex.interpolation = 'Closest'
    nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.9; bsdf.inputs['Metallic'].default_value = 0
    m.use_backface_culling = True
    MATS['palette'] = m; return m

_GLOW = {}
def window_glow():
    # warm interior: bright ceiling light, deeper amber below, curtains at the sides, a sill-line of furniture
    if 'img' in _GLOW: return _GLOW['img']
    W, H = 32, 64
    im = bpy.data.images.new('window_glow', W, H, alpha=False); px = []
    top = hex2srgb('#ffe3a6'); bot = hex2srgb('#f09a4e'); cur = hex2srgb('#f2a39a')
    for y in range(H):
        t = y / (H - 1)
        for x in range(W):
            u = x / (W - 1)
            c = [bot[i] + (top[i] - bot[i]) * t ** .8 for i in range(3)]
            e = min(u, 1 - u)
            if e < .13: c = [c[i] * .55 + cur[i] * .35 for i in range(3)]
            if t < .16 and .2 < u < .62: c = [c[i] * .35 for i in range(3)]
            px += [min(1, v) for v in c] + [1]
    im.pixels = px
    im.filepath_raw = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'raw', 'window_glow.png'); im.file_format = 'PNG'
    im.save(); _GLOW['img'] = im; return im

def emissive_mat(name, base='#2b2a3a', glow='#ffc979', image=None, rough=0.6, emit_image=None):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = rough; bsdf.inputs['Metallic'].default_value = 0
    if image:
        tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = image
        nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
        nt.links.new(tex.outputs['Color'], bsdf.inputs['Emission Color'])
    elif emit_image:
        bsdf.inputs['Base Color'].default_value = hex2lin(base)
        tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = emit_image
        nt.links.new(tex.outputs['Color'], bsdf.inputs['Emission Color'])
    else:
        bsdf.inputs['Base Color'].default_value = hex2lin(base)
        bsdf.inputs['Emission Color'].default_value = hex2lin(glow)
    bsdf.inputs['Emission Strength'].default_value = 1.0
    m['emissiveOn'] = 1.0       # exported as material extras
    m['glow'] = glow
    m.use_backface_culling = True
    MATS[name] = m; return m

def plain_mat(name, hx, rough=0.8, image=None):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; m.use_backface_culling = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = hex2lin(hx)
    if image:
        tex = m.node_tree.nodes.new('ShaderNodeTexImage'); tex.image = image
        m.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = rough
    MATS[name] = m; return m

# ------------------------------------------------------------------ objects
COLL = None
def begin(name):
    global COLL
    COLL = bpy.data.collections.new(name); bpy.context.scene.collection.children.link(COLL)

def end():
    global COLL
    for o in list(COLL.objects): bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.collections.remove(COLL); COLL = None
    for me in list(bpy.data.meshes):
        if me.users == 0: bpy.data.meshes.remove(me)

def _obj(name, bm, mat, color, grad, smooth, uvfull=False):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); COLL.objects.link(ob)
    me.materials.append(mat if mat else MATS['palette'])
    if not me.uv_layers: me.uv_layers.new(name='UVMap')
    if color is not None:
        paint(ob, color, grad)
    if smooth:
        me.shade_smooth(); me.set_sharp_from_angle(angle=math.radians(smooth))
    else:
        me.shade_flat()
    return ob

def paint(ob, color, grad=True):
    me = ob.data; uv = me.uv_layers[0].data
    i = IDX[color]; cx, cy = i % GRID, i // GRID
    zs = [v.co.z for v in me.vertices]; z0, z1 = min(zs), max(zs); dz = max(z1 - z0, 1e-6)
    for poly in me.polygons:
        for li in poly.loop_indices:
            z = me.vertices[me.loops[li].vertex_index].co.z
            h = (z - z0) / dz if grad else 0.75
            uv[li].uv = ((cx + 0.5) / GRID, (cy + 0.1 + 0.8 * h) / GRID)

def xf(bm, M):
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts[:])

def MT(loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
    return Matrix.LocRotScale(Vector(loc), Euler(rot), Vector(scale))

def box(name, size, loc=(0, 0, 0), color='plaster', rot=(0, 0, 0), bevel=0.0, M=None, mat=None, grad=True):
    sx, sy, sz = size
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    xf(bm, Matrix.LocRotScale(Vector((0, 0, 0.5 * sz)), None, Vector((sx, sy, sz))))
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=bm.edges[:] + bm.verts[:], offset=bevel, segments=1, affect='EDGES', profile=0.5, clamp_overlap=True)
    xf(bm, MT(loc, rot))
    if M: xf(bm, M)
    return _obj(name, bm, mat, color, grad, 0)

def lathe(name, prof, seg=8, loc=(0, 0, 0), color='plaster', rot=(0, 0, 0), smooth=0, M=None, mat=None,
          cap_top=True, cap_bot=True, phase=0.5, sx=1.0, sy=1.0, grad=True):
    """prof: list of (r, z) bottom to top. r==0 collapses to a pole."""
    bm = bmesh.new(); rings = []
    for r, z in prof:
        if r <= 1e-6:
            rings.append([bm.verts.new((0, 0, z))])
        else:
            ring = []
            for k in range(seg):
                a = (k + phase) / seg * 2 * math.pi
                ring.append(bm.verts.new((r * math.cos(a) * sx, r * math.sin(a) * sy, z)))
            rings.append(ring)
    for A, B in zip(rings, rings[1:]):
        for k in range(seg):
            if len(A) == 1 and len(B) == 1: continue
            if len(A) == 1: bm.faces.new((A[0], B[k], B[(k + 1) % seg]) if True else None)
            elif len(B) == 1: bm.faces.new((A[k], A[(k + 1) % seg], B[0]))
            else: bm.faces.new((A[k], A[(k + 1) % seg], B[(k + 1) % seg], B[k]))
    if cap_bot and len(rings[0]) > 1: bm.faces.new(list(reversed(rings[0])))
    if cap_top and len(rings[-1]) > 1: bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    xf(bm, MT(loc, rot))
    if M: xf(bm, M)
    return _obj(name, bm, mat, color, grad, smooth)

def _frames(pts):
    P = [Vector(p) for p in pts]; T = []
    for i in range(len(P)):
        a = P[max(i - 1, 0)]; b = P[min(i + 1, len(P) - 1)]
        T.append((b - a).normalized())
    up = Vector((0, 0, 1)) if abs(T[0].z) < 0.9 else Vector((1, 0, 0))
    N = [T[0].cross(up).normalized()]
    for i in range(1, len(P)):
        n = N[-1] - T[i] * N[-1].dot(T[i])
        N.append(n.normalized() if n.length > 1e-6 else N[-1])
    return P, T, N

def tube(name, pts, radius=0.05, sides=6, color='iron', smooth=0, cap=True, M=None, mat=None, grad=True, twist=0.0):
    P, T, N = _frames(pts)
    rs = radius if isinstance(radius, (list, tuple)) else [radius] * len(P)
    bm = bmesh.new(); rings = []
    for i, p in enumerate(P):
        B = T[i].cross(N[i]).normalized(); ring = []
        for k in range(sides):
            a = (k + 0.5) / sides * 2 * math.pi + twist * i
            ring.append(bm.verts.new(p + (N[i] * math.cos(a) + B * math.sin(a)) * rs[i]))
        rings.append(ring)
    for A, Bv in zip(rings, rings[1:]):
        for k in range(sides):
            bm.faces.new((A[k], A[(k + 1) % sides], Bv[(k + 1) % sides], Bv[k]))
    if cap:
        bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    if M: xf(bm, M)
    return _obj(name, bm, mat, color, grad, smooth)

def blob(name, radius, loc=(0, 0, 0), scale=(1, 1, 1), color='leaf', jitter=0.12, seed=1, subdiv=2, M=None, mat=None, grad=True, rot=(0, 0, 0)):
    rnd = random.Random(seed)
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=1.0)
    for v in bm.verts:
        v.co *= 1 + rnd.uniform(-jitter, jitter)
    xf(bm, MT(loc, rot, (radius * scale[0], radius * scale[1], radius * scale[2])))
    if M: xf(bm, M)
    return _obj(name, bm, mat, color, grad, 0)

def prism(name, poly, depth, loc=(0, 0, 0), rot=(0, 0, 0), color='iron', M=None, mat=None, grad=True, bevel=0.0):
    """poly: 2D (x, z) outline, extruded along +Y by depth, centred on y=0."""
    bm = bmesh.new()
    vs = [bm.verts.new((x, -depth / 2, z)) for x, z in poly]
    f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    nv = [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, depth, 0), verts=nv)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=1, affect='EDGES', profile=0.5, clamp_overlap=True)
    xf(bm, MT(loc, rot))
    if M: xf(bm, M)
    return _obj(name, bm, mat, color, grad, 0)

def loft(name, rings, color='zinc', cap_top=True, cap_bot=False, M=None, mat=None, grad=True):
    """rings: list of [(x, y, z), ...] with equal counts."""
    bm = bmesh.new(); R = [[bm.verts.new(p) for p in ring] for ring in rings]; n = len(rings[0])
    for A, B in zip(R, R[1:]):
        for k in range(n):
            bm.faces.new((A[k], A[(k + 1) % n], B[(k + 1) % n], B[k]))
    if cap_top: bm.faces.new(R[-1])
    if cap_bot: bm.faces.new(list(reversed(R[0])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    if M: xf(bm, M)
    return _obj(name, bm, mat, color, grad, 0)

def quad(name, w, h, loc=(0, 0, 0), rot=(0, 0, 0), mat=None, color=None, M=None, double=False):
    """Upright quad in the XZ plane facing -Y, UVs 0..1 (u right, v up)."""
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in ((-w/2, 0, -h/2), (w/2, 0, -h/2), (w/2, 0, h/2), (-w/2, 0, h/2))]
    f = bm.faces.new(vs)
    uvl = bm.loops.layers.uv.new('UVMap')
    for l, uv in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))): l[uvl].uv = uv
    f.normal_update()
    if f.normal.y > 0: f.normal_flip()
    xf(bm, MT(loc, rot))
    if M: xf(bm, M)
    return _obj(name, bm, mat, color, False, 0)

def join(name, objs):
    objs = [o for o in objs if o]
    if len(objs) == 1:
        objs[0].name = name; objs[0].data.name = name; return objs[0]
    ctx = {'active_object': objs[0], 'selected_editable_objects': objs, 'selected_objects': objs}
    with bpy.context.temp_override(**ctx):
        bpy.ops.object.join()
    o = objs[0]; o.name = name; o.data.name = name
    return o

def mirror_x(objs):
    """Duplicate objects mirrored in X (returns new list)."""
    out = []
    for o in objs:
        bm = bmesh.new(); bm.from_mesh(o.data)
        bmesh.ops.scale(bm, vec=(-1, 1, 1), verts=bm.verts[:])
        bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
        me = bpy.data.meshes.new(o.name + '_m'); bm.to_mesh(me); bm.free()
        for m in o.data.materials: me.materials.append(m)
        n = bpy.data.objects.new(o.name + '_m', me); COLL.objects.link(n); out.append(n)
    return out

def dup(o, M):
    me = o.data.copy(); bm = bmesh.new(); bm.from_mesh(me); xf(bm, M); bm.to_mesh(me); bm.free()
    n = bpy.data.objects.new(o.name + '_d', me); COLL.objects.link(n); return n

def finish(asset, nodes, path, extras=None):
    """nodes: {node_name: [objs]} -> joined meshes parented to an empty root named asset."""
    root = bpy.data.objects.new(asset, None); COLL.objects.link(root)
    if extras:
        for k, v in extras.items(): root[k] = v
    for nn, objs in nodes.items():
        o = join(nn, objs if isinstance(objs, list) else [objs])
        o.parent = root
    for o in bpy.context.scene.objects: o.select_set(False)
    for o in COLL.objects: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_extras=True,
                              export_yup=True, export_apply=True, export_animations=False, export_cameras=False,
                              export_lights=False, export_image_format='AUTO', export_materials='EXPORT')
    tris = sum(len(p.vertices) - 2 for o in COLL.objects if o.type == 'MESH' for p in o.data.polygons)
    end()
    return tris
