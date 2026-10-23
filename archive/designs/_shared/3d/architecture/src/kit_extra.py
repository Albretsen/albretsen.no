# Small civic pieces: plaza fountain, belvedere, town gate.
import math
from mathutils import Matrix, Vector
from kit_core import Kit, T, Rz, S, face_frame, arch_poly, arch_fill_poly
from kit_parts import *
from kit_buildings import FOUND, pergola


def fountain(name='fountain', seed=81):
    """Octagonal plaza fountain: stone basin, water, a column with two bowls and a gilded finial."""
    k = Kit(name, seed)
    k.cyl((0, 0, -0.3), 3.0, 3.0, 0.42, 8, 'stone_dark', phase=22.5)          # step
    k.cyl((0, 0, 0.1), 2.35, 2.35, 0.62, 8, 'stone', phase=22.5)              # basin wall
    k.cyl((0, 0, 0.72), 2.5, 2.5, 0.12, 8, 'plaster_warm', phase=22.5)        # coping
    k.cyl((0, 0, 0.5), 2.14, 2.14, 0.24, 8, 'powder_deep', phase=22.5)        # water
    k.cyl((0, 0, 0.5), 0.42, 0.32, 1.1, 8, 'stone', phase=22.5)
    k.cyl((0, 0, 1.55), 0.25, 1.2, 0.4, 10, 'stone')                          # lower bowl
    k.cyl((0, 0, 1.92), 1.1, 1.1, 0.06, 10, 'powder')
    k.cyl((0, 0, 1.95), 0.2, 0.16, 0.9, 8, 'stone')
    k.cyl((0, 0, 2.8), 0.14, 0.62, 0.25, 8, 'stone')                          # upper bowl
    k.cyl((0, 0, 3.02), 0.55, 0.55, 0.05, 8, 'powder')
    k.ico((0, 0, 3.35), (0.2, 0.2, 0.3), 'bronze', sub=1)
    for i in range(4):  # four bronze masks on the column, each with a water arc
        a = math.radians(i * 90 + 45)
        k.box((0.4 * math.cos(a), 0.4 * math.sin(a), 1.25), (0.18, 0.18, 0.18), 'bronze', rot=Rz(math.degrees(a)))
        for j in range(5):
            t = (j + 1) / 6
            r = 0.5 + 1.3 * t
            k.ico((r * math.cos(a), r * math.sin(a), 1.22 - 0.72 * t * t), (0.07, 0.07, 0.07), 'powder', sub=0)
    return k, dict(kind='civic', footprint=[6, 6], height=3.6)


def belvedere(name='belvedere', seed=82):
    """A viewing terrace: stone podium, balustrade on three sides, pergola with bougainvillea, two benches."""
    k = Kit(name, seed)
    W, D, P = 8.0, 6.0, 0.9
    k.slab(-W / 2, W / 2, -D / 2, D / 2, -FOUND, P, 'stone', 0.04)
    for i in range(3):
        k.box((0, -D / 2 - 0.03, -0.4 + i * 0.45), (W, 0.06, 0.06), 'stone_dark')
    k.slab(-W / 2 - 0.1, W / 2 + 0.1, -D / 2 - 0.1, D / 2 + 0.1, P - 0.1, P + 0.05, 'plaster_warm', 0.03)
    k.slab(-W / 2 + 0.2, W / 2 - 0.2, -D / 2 + 0.2, D / 2 - 0.2, P + 0.05, P + 0.07, 'terracotta')
    balustrade(k, -W / 2 + 0.15, -D / 2 + 0.15, W / 2 - 0.15, -D / 2 + 0.15, P + 0.05)
    balustrade(k, -W / 2 + 0.15, -D / 2 + 0.15, -W / 2 + 0.15, D / 2 - 1.6, P + 0.05)
    balustrade(k, W / 2 - 0.15, -D / 2 + 0.15, W / 2 - 0.15, D / 2 - 0.15, P + 0.05)
    for i in range(5):  # steps up at the back-left corner
        k.slab(-W / 2, -W / 2 + 1.4, D / 2 - 1.4, D / 2 + 1.5 - i * 0.3, -0.5, P * (i + 1) / 5, 'stone', 0.02)
    for x in (-W / 2 + 0.15, W / 2 - 0.15):
        k.box((x, -D / 2 + 0.15, P + 0.65), (0.4, 0.4, 1.2), 'plaster', 0.03)
        planter(k, x, -D / 2 + 0.15, P + 1.25, s=0.8)
    pergola(k, -W / 2 + 0.6, W / 2 - 0.6, -0.4, D / 2 - 0.3, P + 0.05, h=2.5)
    with k.frame(T(0, D / 2 - 0.25, 0)):
        bougainvillea(k, 1.6, 0, P + 2.9, 3.4, 1.6, out=-1, density=1.0)
        bougainvillea(k, -2.2, 0, P + 2.9, 2.0, 2.2, out=-1, density=0.8)
    for x in (-1.6, 1.6):
        bench(k, x, 0.8, P + 0.07, 180)
    return k, dict(kind='civic', footprint=[W + 1.5, D + 1.6], height=P + 3.0,
                   notes='open side (the view) faces +Z; benches face +Z; steps at the back left')


def town_gate(name='town_gate', seed=83):
    """Arched town gate spanning a road: rusticated piers, round arch, an attic lettered ALBRETSEN,
    a hanging lantern and a bell cote. The road passes along Z through the 9.6 m opening."""
    k = Kit(name, seed)
    OW, OH, Dp = 9.6, 6.6, 2.4
    PW = 2.4
    W = OW + 2 * PW
    TOP = OH + 2.6
    zc = OH - OW / 2
    for s in (-1, 1):
        x0, x1 = sorted((s * OW / 2, s * (OW / 2 + PW)))
        k.slab(x0, x1, -Dp / 2, Dp / 2, -1.0, TOP, 'stone', 0.05)
        for i in range(8):  # rusticated courses
            z = 0.5 + i * 0.62
            if z > zc + 0.6:
                break
            k.slab(x0 - 0.05, x1 + 0.05, -Dp / 2 - 0.05, Dp / 2 + 0.05, z, z + 0.08, 'stone_dark')
        k.slab(x0 - 0.12, x1 + 0.12, -Dp / 2 - 0.12, Dp / 2 + 0.12, -0.3, 0.5, 'stone_dark', 0.03)
        k.slab(x0 - 0.08, x1 + 0.08, -Dp / 2 - 0.08, Dp / 2 + 0.08, zc - 0.1, zc + 0.15, 'plaster_warm', 0.02)  # impost
    k.prism(arch_fill_poly(OW, OH, TOP, 12, 0, 0), -Dp / 2, Dp / 2, 'stone')
    for yf, sg in ((-Dp / 2, -1), (Dp / 2, 1)):  # voussoir ring + keystone on both faces
        r0, r1 = OW / 2, OW / 2 + 0.5
        ring = [(r1 * math.cos(math.pi * i / 12), zc + r1 * math.sin(math.pi * i / 12)) for i in range(13)]
        ring += [(r0 * math.cos(math.pi * i / 12), zc + r0 * math.sin(math.pi * i / 12)) for i in range(12, -1, -1)]
        k.prism(ring, yf, yf + sg * 0.08, 'plaster_warm')
        k.box((0, yf + sg * 0.1, OH + 0.25), (0.6, 0.2, 0.8), 'plaster_warm', taper=(1.3, 1))
    k.slab(-W / 2 - 0.3, W / 2 + 0.3, -Dp / 2 - 0.3, Dp / 2 + 0.3, TOP, TOP + 0.35, 'plaster_warm', 0.05)
    k.slab(-W / 2 + 0.6, W / 2 - 0.6, -Dp / 2 + 0.1, Dp / 2 - 0.1, TOP + 0.35, TOP + 2.0, 'plaster', 0.06)
    k.slab(-W / 2 + 0.45, W / 2 - 0.45, -Dp / 2 - 0.05, Dp / 2 + 0.05, TOP + 2.0, TOP + 2.25, 'plaster_warm', 0.04)
    for yf, ang in ((-Dp / 2 + 0.1, 0), (Dp / 2 - 0.1, 180)):
        with k.frame(T(0, yf, 0) @ Rz(ang)):
            k.text('ALBRETSEN', (0, -0.04, TOP + 0.85), 0.62, 0.06, 'ink')
    # hanging lantern under the arch
    k.box((0, 0, OH - 0.25), (0.04, 0.04, 0.5), 'iron')
    k.cyl((0, 0, OH - 0.5), 0.28, 0.06, 0.18, 6, 'iron')
    k.cyl((0, 0, OH - 1.0), 0.16, 0.24, 0.5, 6, 'emissive_lamp_string')
    # bell cote
    bz = TOP + 2.25
    k.slab(-1.0, 1.0, -0.5, 0.5, bz, bz + 0.35, 'plaster', 0.03)
    k.prism(arch_fill_poly(1.1, 1.3, bz + 1.95, 8, 0, bz + 0.35), -0.35, 0.35, 'plaster')
    for s in (-1, 1):
        x0, x1 = sorted((s * 0.55, s * 1.0))
        k.slab(x0, x1, -0.35, 0.35, bz + 0.35, bz + 1.95, 'plaster', 0.03)
    k.cyl((0, 0, bz + 0.75), 0.34, 0.14, 0.5, 8, 'bronze')
    k.prism([(-1.15, bz + 1.95), (1.15, bz + 1.95), (0, bz + 2.8)], -0.5, 0.5, 'terracotta')
    for s in (-1, 1):  # urns with clipped bay on the corners
        k.cyl((s * (W / 2 - 0.2), 0, TOP + 0.35), 0.18, 0.3, 0.55, 8, 'terracotta')
        k.ico((s * (W / 2 - 0.2), 0, TOP + 1.05), (0.3, 0.3, 0.32), 'leaf', sub=1, jitter=0.2)
    return k, dict(kind='civic', footprint=[W + 0.6, Dp + 0.6], height=round(bz + 2.9, 1),
                   notes='spans a road running along Z (clear opening 9.6 m wide, 6.6 m high); the attic reads ALBRETSEN on both faces')
