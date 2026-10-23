# Heure Bleue architecture kit: modelling helpers for Blender (bmesh).
# Blender is Z-up; the glTF exporter turns that into +Y up, and Blender -Y
# becomes glTF +Z, so every building's FRONT faces Blender -Y (glTF +Z).
import math, random
import bpy, bmesh
from mathutils import Matrix, Vector

# ------------------------------------------------------------------ palette
def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4))

PAL = {
    'plaster': '#f4eadb', 'plaster_warm': '#efe1c8', 'plaster_shade': '#ddcbbd',
    'pink': '#f2b5b8', 'pink_deep': '#e3959b', 'powder': '#a9c6e0', 'powder_deep': '#7fa3c8',
    'mustard': '#d9a42b', 'burgundy': '#6e1f33', 'zinc': '#8d9bb4', 'zinc_dark': '#6b7894',
    'ink': '#232c57', 'magenta': '#c8336e', 'magenta_light': '#e0679b', 'terracotta': '#c96f4a',
    'terracotta_dark': '#a85638', 'cypress': '#2f4a3a', 'leaf': '#5c7a55', 'stone': '#ead6b5',
    'stone_dark': '#cdb594', 'iron': '#33293a', 'wood': '#7a5a4a', 'asphalt': '#5b6080',
    'sidewalk': '#e6d8c6', 'kerb': '#cfc0ad', 'earth': '#d9b8a0', 'grass': '#9aa274', 'grass_dark': '#86915f',
    'rock': '#c99f8b', 'rock_dark': '#a47d70', 'bronze': '#b9893a',
}
EMISSIVE = {  # name: (base colour, emissive colour)
    'emissive_window_1': ('#2a2c4c', '#ffc979'),
    'emissive_window_2': ('#2a2c4c', '#ffcf8a'),
    'emissive_window_3': ('#2a2c4c', '#ffb48a'),
    'emissive_sign': ('#d9a42b', '#ffd27a'),
    'emissive_lamp_string': ('#efe1c8', '#ffc979'),
    'emissive_clock': ('#f4eadb', '#ffe2a8'),
}
_mats = {}

def mat(name):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    if name in EMISSIVE:
        base, em = EMISSIVE[name]
        bsdf.inputs['Base Color'].default_value = (*hex_rgb(base), 1)
        bsdf.inputs['Emission Color'].default_value = (*hex_rgb(em), 1)
        bsdf.inputs['Emission Strength'].default_value = 1.0
        bsdf.inputs['Roughness'].default_value = 0.35
    else:
        bsdf.inputs['Base Color'].default_value = (*hex_rgb(PAL[name]), 1)
        bsdf.inputs['Roughness'].default_value = 0.6 if name.startswith('zinc') else 0.85
    bsdf.inputs['Metallic'].default_value = 0.0
    _mats[name] = m
    return m

# ------------------------------------------------------------------ builder
_tmp_mesh = None

def _tmp():
    global _tmp_mesh
    if _tmp_mesh is None:
        _tmp_mesh = bpy.data.meshes.new('_tmp')
    return _tmp_mesh

def Rz(deg):
    return Matrix.Rotation(math.radians(deg), 4, 'Z')

def T(x, y, z):
    return Matrix.Translation((x, y, z))

def S(x, y, z):
    return Matrix.Diagonal((x, y, z, 1))


class Kit:
    """Accumulates parts (each built in its own bmesh) into one mesh with material slots."""

    def __init__(self, name, seed=1):
        self.name = name
        self.bm = bmesh.new()
        self.mats = []
        self.rng = random.Random(seed)
        self.M = Matrix.Identity(4)  # current frame
        self.win_count = 0

    def mi(self, name):
        if name not in self.mats:
            self.mats.append(name)
        return self.mats.index(name)

    # frame stack -------------------------------------------------------
    def frame(self, M):
        k = _Frame(self, M)
        return k

    # commit a temp bmesh -----------------------------------------------
    def _commit(self, tb, matname, M=None):
        idx = self.mi(matname)
        for f in tb.faces:
            f.material_index = idx
            f.smooth = False
        bmesh.ops.transform(tb, matrix=self.M @ (M or Matrix.Identity(4)), verts=tb.verts)
        # recalculate normals on closed parts only
        me = _tmp()
        tb.to_mesh(me)
        tb.free()
        n0 = len(self.bm.faces)
        self.bm.from_mesh(me)
        # from_mesh resets material index map to ours (indices are kept)

    # primitives --------------------------------------------------------
    def box(self, c, s, m, bevel=0.0, rot=None, taper=None):
        """Axis-aligned box centred at c with size s (in current frame); optional bevel."""
        tb = bmesh.new()
        bmesh.ops.create_cube(tb, size=1.0)
        if taper:  # scale the top face (x,y) for a battered/tapered box
            for v in tb.verts:
                if v.co.z > 0:
                    v.co.x *= taper[0]; v.co.y *= taper[1]
        bmesh.ops.transform(tb, matrix=S(*s), verts=tb.verts)
        if bevel > 0:
            bw = min(bevel, min(s) * 0.45)
            bmesh.ops.bevel(tb, geom=list(tb.edges), offset=bw, offset_type='OFFSET', segments=1,
                            profile=0.5, affect='EDGES', clamp_overlap=True)
        M = T(*c)
        if rot is not None:
            M = M @ rot
        self._commit(tb, m, M)

    def quad(self, pts, m, M=None):
        tb = bmesh.new()
        vs = [tb.verts.new(p) for p in pts]
        tb.faces.new(vs)
        self._commit(tb, m, M)

    def ring(self, x, z, w, h, t, proud, m, y=0.0):
        """Window surround in a facade frame: a rectangular frame with an opening, 24 tris."""
        tb = bmesh.new()
        def rect(dx, dz, yy):
            return [tb.verts.new((x + sx * dx, y + yy, z + h / 2 + sz * dz)) for sx, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        O0 = rect(w / 2 + t, h / 2 + t, 0.0)
        O1 = rect(w / 2 + t, h / 2 + t, -proud)
        I1 = rect(w / 2, h / 2, -proud)
        I0 = rect(w / 2, h / 2, 0.0)
        for i in range(4):
            j = (i + 1) % 4
            tb.faces.new((O1[i], O1[j], I1[j], I1[i]))   # front of the frame
            tb.faces.new((O0[i], O0[j], O1[j], O1[i]))   # outer sides
            tb.faces.new((I1[i], I1[j], I0[j], I0[i]))   # reveal
        self._commit(tb, m)

    def bar(self, c, w, h, m):
        """Thin vertical triangular prism (no caps), 6 tris: balusters and railings."""
        tb = bmesh.new()
        r = w * 0.65
        pts = [(c[0] + r * math.cos(a), c[1] + r * math.sin(a)) for a in (math.radians(-90), math.radians(30), math.radians(150))]
        lo = [tb.verts.new((px, py, c[2] - h / 2)) for px, py in pts]
        hi = [tb.verts.new((px, py, c[2] + h / 2)) for px, py in pts]
        for i in range(3):
            j = (i + 1) % 3
            tb.faces.new((lo[i], lo[j], hi[j], hi[i]))
        self._commit(tb, m)

    def slab(self, x0, x1, y0, y1, z0, z1, m, bevel=0.0):
        self.box(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), (abs(x1 - x0), abs(y1 - y0), abs(z1 - z0)), m, bevel)

    def cyl(self, c, r1, r2, h, seg, m, rot=None, cap=True, phase=0.0, bevel=0.0):
        tb = bmesh.new()
        bmesh.ops.create_cone(tb, cap_ends=cap, cap_tris=False, segments=seg, radius1=r1, radius2=r2, depth=h,
                              matrix=Rz(phase))
        if bevel > 0:
            bmesh.ops.bevel(tb, geom=[e for e in tb.edges if len(e.link_faces) == 2 and e.calc_face_angle(0) > 0.6],
                            offset=bevel, offset_type='OFFSET', segments=1, profile=0.5, affect='EDGES', clamp_overlap=True)
        M = T(*c)
        if rot is not None:
            M = M @ rot
        self._commit(tb, m, M @ T(0, 0, h / 2))  # base at c

    def ico(self, c, s, m, sub=1, jitter=0.0, rot=None):
        tb = bmesh.new()
        bmesh.ops.create_icosphere(tb, subdivisions=sub, radius=1.0)
        if jitter:
            for v in tb.verts:
                v.co *= 1 + (self.rng.random() - 0.5) * jitter
        M = T(*c) @ (rot or Matrix.Identity(4)) @ S(*s)
        self._commit(tb, m, M)

    def hull(self, pts, m, M=None):
        tb = bmesh.new()
        vs = [tb.verts.new(p) for p in pts]
        res = bmesh.ops.convex_hull(tb, input=vs, use_existing_faces=False)
        kill = list({g for g in res['geom_interior'] + res['geom_unused'] if isinstance(g, bmesh.types.BMVert)})
        if kill:
            bmesh.ops.delete(tb, geom=kill, context='VERTS')
        bmesh.ops.dissolve_limit(tb, angle_limit=0.001, verts=tb.verts, edges=tb.edges)
        self._commit(tb, m, M)

    def prism(self, poly, y0, y1, m, M=None):
        """Extrude a 2D polygon given in the XZ plane (x, z) from y=y0 to y=y1 (concave allowed)."""
        tb = bmesh.new()
        vs = [tb.verts.new((x, y0, z)) for x, z in poly]
        f = tb.faces.new(vs)
        ext = bmesh.ops.extrude_face_region(tb, geom=[f])
        nv = [g for g in ext['geom'] if isinstance(g, bmesh.types.BMVert)]
        bmesh.ops.translate(tb, vec=(0, y1 - y0, 0), verts=nv)
        bmesh.ops.recalc_face_normals(tb, faces=tb.faces)
        self._commit(tb, m, M)

    def poly_faces(self, verts, faces, m, M=None):
        tb = bmesh.new()
        vs = [tb.verts.new(v) for v in verts]
        for f in faces:
            try:
                tb.faces.new([vs[i] for i in f])
            except ValueError:
                pass
        self._commit(tb, m, M)

    def text(self, body, c, size, depth, m, rot=None, align='CENTER'):
        cu = bpy.data.curves.new('txt', 'FONT')
        cu.body = body
        cu.size = size
        cu.extrude = depth / 2
        cu.resolution_u = 2
        cu.align_x = align
        cu.fill_mode = 'BOTH'
        ob = bpy.data.objects.new('txt', cu)
        bpy.context.scene.collection.objects.link(ob)
        dg = bpy.context.evaluated_depsgraph_get()
        me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
        tb = bmesh.new()
        tb.from_mesh(me)
        bmesh.ops.remove_doubles(tb, verts=tb.verts, dist=0.0005)
        bpy.data.objects.remove(ob)
        bpy.data.curves.remove(cu)
        bpy.data.meshes.remove(me)
        # text lies in XY, facing +Z: stand it up in XZ, facing -Y
        M = T(*c) @ (rot or Matrix.Identity(4)) @ Matrix.Rotation(math.radians(90), 4, 'X')
        self._commit(tb, m, M)

    # finish -------------------------------------------------------------
    def build(self, weld=True):
        bm = self.bm
        if weld:
            bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0004)
        me = bpy.data.meshes.new(self.name)
        bm.to_mesh(me)
        bm.free()
        for n in self.mats:
            me.materials.append(mat(n))
        for p in me.polygons:
            p.use_smooth = False
        ob = bpy.data.objects.new(self.name, me)
        bpy.context.scene.collection.objects.link(ob)
        return ob


class _Frame:
    def __init__(self, kit, M):
        self.kit, self.M = kit, M

    def __enter__(self):
        self.prev = self.kit.M
        self.kit.M = self.prev @ self.M
        return self.kit

    def __exit__(self, *a):
        self.kit.M = self.prev


def face_frame(side, half):
    """Frame for a facade. Local coords: x along the facade, -y outward, z up; plane at y=0."""
    ang = {'front': 0, 'right': 90, 'back': 180, 'left': -90}[side]
    return Rz(ang) @ T(0, -half, 0)


def arch_poly(w, h, seg=8, x0=0.0, z0=0.0):
    """Round-headed opening outline (x, z), base at z0, centred on x0."""
    r = w / 2
    pts = [(x0 - r, z0), (x0 + r, z0), (x0 + r, z0 + h - r)]
    for i in range(1, seg):
        a = math.pi * i / seg
        pts.append((x0 + r * math.cos(a), z0 + h - r + r * math.sin(a)))
    pts.append((x0 - r, z0 + h - r))
    return pts


def arch_fill_poly(w, h, top, seg=8, x0=0.0, z0=0.0):
    """Wall piece above an arch: rectangle (x0±w/2, z0+h-r .. top) minus the semicircle."""
    r = w / 2
    zs = z0 + h - r
    pts = [(x0 + r, zs), (x0 + r, top), (x0 - r, top), (x0 - r, zs)]
    for i in range(seg - 1, 0, -1):
        a = math.pi * i / seg
        pts.append((x0 + r * math.cos(a), zs + r * math.sin(a)))
    return pts
