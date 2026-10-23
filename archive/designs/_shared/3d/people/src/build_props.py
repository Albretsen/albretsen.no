# Hand props for the townsfolk: props.glb, one top-level node per prop, origin at the grip.
import bpy, math, sys
from mathutils import Vector, Matrix
sys.path.insert(0, "/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.WMbRtIP0Fk/bin")
from lib import T, reset, COL as C, Part, loft, ellipsoid, box, disc, vc_material, link, lin, srgb

reset()
VC = vc_material("townsfolk_props", rough=0.6)
EM = {
    "emissive_phone": vc_material("emissive_phone", emissive=(lin(srgb("#141a33")), lin(srgb("#cfe6ff")))),
    "emissive_lantern": vc_material("emissive_lantern", emissive=(lin(srgb("#4a3a22")), lin(srgb("#ffc979")))),
}


def make(name, parts):
    """parts: list of (Part, material_name or None)."""
    verts, faces, cols, mats = [], [], [], []
    matlist = [VC]
    for part, mname in parts:
        mi = 0
        if mname:
            m = EM[mname]
            if m not in matlist:
                matlist.append(m)
            mi = matlist.index(m)
        base = len(verts)
        verts += [tuple(v) for v in part.v]
        for f, c in zip(part.f, part.fc):
            faces.append(tuple(i + base for i in f))
            cols.append(c)
            mats.append(mi)
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    for m in matlist:
        me.materials.append(m)
    attr = me.color_attributes.new("Color", "FLOAT_COLOR", "CORNER")
    for p in me.polygons:
        p.material_index = mats[p.index]
        p.use_smooth = True
        for li in p.loop_indices:
            c = cols[p.index]
            attr.data[li].color = (*c, 1)
    me.set_sharp_from_angle(angle=math.radians(40))
    ob = link(bpy.data.objects.new(name, me))
    tris = sum(len(p.vertices) - 2 for p in me.polygons)
    print("PROP", name, tris)
    return ob


def P(name="p"):
    return Part(name, [])


# phone: length along Z, screen on -X face, origin at centre
b, s = P(), P()
box(b, (0, 0, 0), (0.009, 0.072, 0.148), C["black"], bevel=0.008)
box(s, (-0.0047, 0, 0.004), (0.0008, 0.062, 0.128), C["black"])
make("phone", [(b, None), (s, "emissive_phone")])

# coffee cup (espresso-ish), axis +Z, origin at grip height
c = P()
loft(c, [((0, 0, -0.035), 0.033, 0.033), ((0, 0, 0.0), 0.038, 0.038), ((0, 0, 0.04), 0.042, 0.042)], [C["white"], C["white"]], n=12, cap0="flat", cap1=None)
loft(c, [((0, 0, 0.04), 0.042, 0.042), ((0, 0, 0.034), 0.036, 0.036)], [C["white"]], n=12, cap0=None, cap1="flat")
disc(c, (0, 0, 0.026), 0.036, 0.004, C["coffee"], n=12)
loft(c, [((0.035, 0, 0.022), 0.006, 0.006), ((0.06, 0, 0.012), 0.007, 0.007), ((0.062, 0, -0.008), 0.007, 0.007), ((0.036, 0, -0.018), 0.006, 0.006)], [C["white"]], n=6, cap0="flat", cap1="flat")
box(c, (0, 0, -0.01), (0.07, 0.003, 0.012), C["terracotta"])  # a terracotta band
make("coffee_cup", [(c, None)])

# wine glass, axis +Z, origin at the stem
g = P()
disc(g, (0, 0, -0.07), 0.034, 0.004, C["glass"], n=12)
loft(g, [((0, 0, -0.066), 0.005, 0.005), ((0, 0, 0.02), 0.005, 0.005)], [C["glass"]], n=6, cap0=None, cap1=None)
loft(g, [((0, 0, 0.018), 0.012, 0.012), ((0, 0, 0.04), 0.038, 0.038), ((0, 0, 0.075), 0.040, 0.040), ((0, 0, 0.1), 0.033, 0.033)],
     [C["wine"], C["glass"], C["glass"]], n=12, cap0="pole", cap1=None)
disc(g, (0, 0, 0.055), 0.038, 0.002, C["wine"], n=12)
make("wine_glass", [(g, None)])

# tray with two cups and a carafe, origin at tray centre (bottom)
t = P()
disc(t, (0, 0, 0), 0.2, 0.012, C["steel"], n=20)
loft(t, [((0, 0, 0.012), 0.2, 0.2), ((0, 0, 0.03), 0.205, 0.205)], [C["steel"]], n=20, cap0=None, cap1=None)
for x, y in ((0.08, 0.05), (-0.06, 0.08)):
    disc(t, (x, y, 0.012), 0.05, 0.006, C["white"], n=12)
    loft(t, [((x, y, 0.018), 0.03, 0.03), ((x, y, 0.07), 0.038, 0.038)], [C["white"]], n=10, cap0="flat", cap1=None)
    disc(t, (x, y, 0.058), 0.034, 0.003, C["coffee"], n=10)
loft(t, [((0.0, -0.09, 0.012), 0.04, 0.04), ((0.0, -0.09, 0.09), 0.045, 0.045), ((0.0, -0.09, 0.15), 0.018, 0.018), ((0.0, -0.09, 0.2), 0.02, 0.02)],
     [C["wine"], C["glass"], C["glass"]], n=10, cap0="flat", cap1="flat")
make("tray", [(t, None)])

# cane: crook at the origin, shaft down to the ground (0.86 m)
k = P()
loft(k, [((0, 0, 0.0), 0.011, 0.011), ((0, 0, -0.86), 0.01, 0.01)], [C["coffee"]], n=8, cap0=None, cap1="flat")
loft(k, [((0, 0, 0.0), 0.011, 0.011), ((0, 0, 0.04), 0.011, 0.011), ((0, -0.04, 0.07), 0.011, 0.011), ((0, -0.09, 0.05), 0.011, 0.011), ((0, -0.1, 0.02), 0.011, 0.011)],
     [C["coffee"]], n=8, cap0=None, cap1="pole")
loft(k, [((0, 0, -0.86), 0.012, 0.012), ((0, 0, -0.875), 0.012, 0.012)], [C["rubber"]], n=8, cap0="flat", cap1="flat")
make("cane", [(k, None)])

# lantern: handle loop at origin, lantern hanging below
l, lg = P(), P()
loft(l, [((0, 0, 0.0), 0.006, 0.006), ((0.03, 0, -0.01), 0.006, 0.006), ((0.035, 0, -0.05), 0.006, 0.006)], [C["ink"]], n=6, cap0="flat", cap1="flat")
loft(l, [((0, 0, 0.0), 0.006, 0.006), ((-0.03, 0, -0.01), 0.006, 0.006), ((-0.035, 0, -0.05), 0.006, 0.006)], [C["ink"]], n=6, cap0="flat", cap1="flat")
loft(l, [((0, 0, -0.04), 0.012, 0.012), ((0, 0, -0.055), 0.06, 0.06), ((0, 0, -0.075), 0.055, 0.055)], [C["ink"]], n=8, cap0="pole", cap1="flat", phase=0.0)
box(l, (0, 0, -0.205), (0.1, 0.1, 0.018), C["ink"], bevel=0.015)
for sx, sy in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
    box(l, (sx * 0.042, sy * 0.042, -0.14), (0.01, 0.01, 0.13), C["ink"])
box(lg, (0, 0, -0.14), (0.078, 0.078, 0.125), C["cream"])
make("lantern", [(l, None), (lg, "emissive_lantern")])

# baguette: centre at grip, along Z
bg = P()
loft(bg, [((0, 0, -0.32), 0.012, 0.012), ((0, 0, -0.26), 0.026, 0.024), ((0, 0, 0.26), 0.026, 0.024), ((0, 0, 0.32), 0.012, 0.012)],
     [C["mustard"], C["mustard"], C["mustard"]], n=8, cap0="pole", cap1="pole")
for i in range(5):
    box(bg, (0, -0.022, -0.2 + i * 0.1), (0.03, 0.008, 0.04), C["sand"], rot=Matrix.Rotation(math.radians(25), 3, "Y"))
box(bg, (0, 0, -0.05), (0.06, 0.055, 0.17), C["linen"])  # paper sleeve
make("baguette", [(bg, None)])

# newspaper: folded, grip at the spine
n = P()
box(n, (0, 0, 0.0), (0.006, 0.3, 0.2), C["linen"])
for i in range(4):
    box(n, (-0.0035, -0.05 + i * 0.05 if i else 0.0, 0.05 - i * 0.03), (0.001, 0.18 if i else 0.25, 0.012 if i else 0.04), C["ink"])
make("newspaper", [(n, None)])

# watering can: handle at origin, body below/in front
w = P()
loft(w, [((0, 0.02, -0.2), 0.075, 0.075), ((0, 0.02, -0.08), 0.07, 0.07)], [C["zinc"]], n=12, cap0="flat", cap1="flat")
loft(w, [((0, 0.02, -0.08), 0.008, 0.008), ((0, 0.02, 0.0), 0.008, 0.008), ((0, 0.1, -0.02), 0.008, 0.008), ((0, 0.1, -0.09), 0.008, 0.008)], [C["zinc"]], n=6, cap0="flat", cap1="flat")
loft(w, [((0, -0.04, -0.17), 0.016, 0.016), ((0, -0.2, -0.06), 0.01, 0.01), ((0, -0.23, -0.04), 0.022, 0.022)], [C["zinc"], C["steel"]], n=8, cap0="flat", cap1="flat")
make("watering_can", [(w, None)])

import os
os.makedirs(T + "out", exist_ok=True)
bpy.ops.export_scene.gltf(filepath=T + "out/props.glb", export_format="GLB", export_yup=True,
                          export_vertex_color="ACTIVE", export_animations=False)
print("DONE")
