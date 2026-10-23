# Buildings of the Heure Bleue kit. Each function returns (Kit, meta).
import math
from mathutils import Matrix, Vector
from kit_core import Kit, T, Rz, S, face_frame, arch_poly, arch_fill_poly
from kit_parts import *

FOUND = 2.5  # every building carries a plinth this deep below its origin, for slopes


def plinth(k, W, D, m='stone_dark', h=0.5):
    k.slab(-W / 2 - 0.08, W / 2 + 0.08, -D / 2 - 0.08, D / 2 + 0.08, -FOUND, h, m, 0.02)


# ======================================================================= PARIS
def paris(name, bays=5, bay=2.75, floors=4, D=11.0, wall='stone', ground='shops', awn=('mustard', 'plaster'),
          gh=4.0, fh=3.1, dormer_style='gable', corner=False, side_windows=True, seed=1, balcony_floors=(1,), pots=3):
    k = Kit(name, seed)
    W = bays * bay
    Ht = gh + floors * fh
    plinth(k, W, D, 'stone_dark', 0.35)
    k.slab(-W / 2, W / 2, -D / 2, D / 2, 0.3, Ht, wall, 0.05)
    xs = [-W / 2 + bay * (i + 0.5) for i in range(bays)]

    # ----- front facade
    with k.frame(face_frame('front', D / 2)):
        # rusticated ground floor bands
        for i in range(1, 7):
            k.box((0, -0.02, 0.3 + i * (gh - 0.6) / 7), (W, 0.05, 0.07), 'stone_dark')
        door_bay = bays // 2
        for i, x in enumerate(xs):
            if ground == 'shops':
                fw = bay - 0.55
                if i == door_bay:
                    door(k, x, 1.5, 3.1, 'burgundy', wall, arched=True, z=0.35, step=False)
                else:
                    frame4(k, x, 0.75, fw, 2.55, 0.14, 0.14, 'ink')
                    k.box((x, -0.07, 0.55), (fw + 0.28, 0.14, 0.4), 'ink')
                    glass(k, x, 0.75, fw, 2.55, 0.05)
                    k.box((x, -0.08, 0.75 + 2.55 * 0.78), (fw, 0.04, 0.06), 'ink')
                    k.box((x, -0.08, 0.75 + 2.55 / 2), (0.06, 0.04, 2.55 * 0.78), 'ink')
            else:
                if i == door_bay:
                    door(k, x, 1.5, 3.1, 'ink', wall, arched=True, z=0.35, step=False)
                else:
                    paris_window(k, x, 1.0, 1.15, 2.2, wall, keystone=True, balconette=False)
        if ground == 'shops':
            # fascia board + awnings over the shop bays
            k.box((0, -0.12, gh - 0.55), (W - 0.2, 0.24, 0.5), 'ink', 0.02)
            for i, x in enumerate(xs):
                if i != door_bay:
                    awning(k, x, gh - 0.85, bay - 0.4, 1.25, 0.55, awn[0], awn[1])
        # first-floor cornice
        k.box((0, -0.16, gh + 0.05), (W + 0.2, 0.32, 0.22), wall, 0.03)
        # upper floors
        for f in range(floors):
            z0 = gh + f * fh
            if f > 0:
                k.box((0, -0.05, z0 + 0.02), (W, 0.1, 0.12), wall)
            cont = f in balcony_floors or f == floors - 1
            for x in xs:
                paris_window(k, x, z0 + 0.35, 1.15, 2.15 if f < floors - 1 else 1.95, wall,
                             keystone=(f < 2), balconette=not cont)
            if cont:
                k.box((0, -0.45, z0 + 0.25), (W - 0.2, 0.9, 0.14), wall, 0.03)
                for x in xs:  # corbels
                    for s in (-0.7, 0.7):
                        k.box((x + s, -0.25, z0 + 0.05), (0.18, 0.5, 0.3), wall, taper=(1, 1.6))
                railing(k, -W / 2 + 0.2, W / 2 - 0.2, z0 + 0.32, -0.86, h=0.85, spacing=0.17)
                railing_side(k, -0.9, -0.05, -W / 2 + 0.16, z0 + 0.32, h=0.85)
                railing_side(k, -0.9, -0.05, W / 2 - 0.16, z0 + 0.32, h=0.85)
        # corner quoins/pilasters
        for s in (-1, 1):
            k.box((s * (W / 2 - 0.2), -0.04, gh + floors * fh / 2), (0.4, 0.08, floors * fh), wall)
    # top cornice
    k.slab(-W / 2 - 0.3, W / 2 + 0.3, -D / 2 - 0.3, D / 2 + 0.3, Ht, Ht + 0.3, wall, 0.06)
    k.slab(-W / 2 - 0.5, W / 2 + 0.5, -D / 2 - 0.5, D / 2 + 0.5, Ht + 0.3, Ht + 0.48, wall, 0.06)

    # ----- side and back facades (simpler)
    for side, half, length in (('back', D / 2, W), ('left', W / 2, D), ('right', W / 2, D)):
        if side != 'back' and not side_windows:
            continue
        with k.frame(face_frame(side, half)):
            n = bays if side == 'back' else max(1, int(length / 3.4))
            cols = [-length / 2 + length * (i + 0.5) / n for i in range(n)]
            for f in range(floors):
                z0 = gh + f * fh
                for x in cols:
                    if side != 'back' and abs(x) < 0.5 and n % 2 == 1:
                        pass
                    glass(k, x, z0 + 0.5, 1.0, 1.9, 0.04)
                    frame4(k, x, z0 + 0.5, 1.0, 1.9, 0.12, 0.08, wall)
                    k.box((x, -0.06, z0 + 0.5 + 0.95), (0.05, 0.04, 1.9), 'plaster')
            for x in cols[:: max(1, n // 2)]:
                glass(k, x, 1.0, 1.0, 2.0, 0.04)
                frame4(k, x, 1.0, 1.0, 2.0, 0.12, 0.08, wall)

    # ----- mansard roof
    top = mansard(k, W, D, Ht + 0.48, h1=3.0, h2=0.65, in1=0.95, in2=2.2)
    zr = Ht + 0.48
    for side, half, length in (('front', D / 2, W), ('back', D / 2, W)):
        with k.frame(face_frame(side, half)):
            for x in xs:
                dormer(k, x, zr + 0.55, 1.1, 1.55, 1.7, wall, 'zinc_dark', dormer_style, y_front=0.18)
    for side in ('left', 'right'):
        if D > 9:
            with k.frame(face_frame(side, W / 2)):
                dormer(k, 0, zr + 0.55, 1.0, 1.45, 1.7, wall, 'zinc_dark', 'round' if dormer_style == 'gable' else 'gable', y_front=0.18)
    # chimney stacks across the ridge
    cx = [-W / 2 + 1.6, W / 2 - 1.6] if W > 9 else [W / 2 - 1.4]
    for x in cx:
        chimney(k, x, 0, top - 0.3, 1.0, D - 4.6, 1.5, wall, pots=pots)
    meta = dict(kind='paris', footprint=[W + 1.0, D + 1.0], height=round(top + 2.0, 1))
    return k, meta


def paris_rotunda(name='paris_rotunda', seed=7):
    """Corner building: two short wings and a round corner tower with a ribbed zinc dome and lantern."""
    k, meta = paris(name, bays=3, bay=2.75, floors=4, D=10.0, ground='shops', awn=('burgundy', 'plaster'),
                    seed=seed, balcony_floors=(1,), side_windows=False)
    W, D = 3 * 2.75, 10.0
    gh, fh, floors = 4.0, 3.1, 4
    Ht = gh + floors * fh
    # the tower sits on the front-right corner
    r = 3.0
    cx, cy = W / 2 + 0.6, -D / 2 + 0.6
    seg = 16
    k.cyl((cx, cy, -FOUND), r + 0.1, r + 0.1, FOUND + 0.35, seg, 'stone_dark', phase=11.25)
    k.cyl((cx, cy, 0.3), r, r, Ht - 0.3, seg, 'stone', phase=11.25)
    k.cyl((cx, cy, gh), r + 0.18, r + 0.18, 0.25, seg, 'stone', phase=11.25)
    k.cyl((cx, cy, Ht), r + 0.35, r + 0.35, 0.3, seg, 'stone', phase=11.25)
    k.cyl((cx, cy, Ht + 0.3), r + 0.5, r + 0.5, 0.18, seg, 'stone', phase=11.25)
    # windows around the outward half
    for j, a in enumerate([-160, -125, -90, -55, -20, 15]):
        M = T(cx, cy, 0) @ Rz(a + 90) @ T(0, -r, 0)
        with k.frame(M):
            if j in (2,):
                pass
            for f in range(floors):
                z0 = gh + f * fh
                paris_window(k, 0, z0 + 0.35, 0.95, 2.05, 'stone', keystone=(f < 2), balconette=True)
            # ground floor shop
            frame4(k, 0, 0.75, 1.3, 2.5, 0.14, 0.14, 'ink')
            glass(k, 0, 0.75, 1.3, 2.5, 0.05)
    # drum + dome (stacked rings) + ribs + lantern
    z = Ht + 0.48
    k.cyl((cx, cy, z), r * 0.92, r * 0.92, 1.0, seg, 'stone', phase=11.25)
    z += 1.0
    rings = 6
    prev_r, prev_z = r * 0.95, z
    for i in range(1, rings + 1):
        a = (math.pi / 2) * i / rings
        rr = r * 0.95 * math.cos(a) + 0.55 * math.sin(a) * (i == rings)
        rr = max(rr, 0.55)
        zz = z + r * 1.25 * math.sin(a)
        k.cyl((cx, cy, prev_z), prev_r, rr, zz - prev_z, seg, 'zinc', cap=False, phase=11.25)
        prev_r, prev_z = rr, zz
    for i in range(8):  # ribs
        ang = i * math.pi / 4 + math.radians(11.25)
        pts = []
        for j in range(rings + 1):
            a = (math.pi / 2) * j / rings
            rr = max(r * 0.97 * math.cos(a), 0.58)
            pts.append(Vector((cx + rr * math.cos(ang), cy + rr * math.sin(ang), z + r * 1.25 * math.sin(a))))
        for p0, p1 in zip(pts, pts[1:]):
            from kit_parts import _cap
            _cap(k, p0, p1, 'zinc_dark', r=0.07, seg=4)
    # lantern
    zl = prev_z
    k.cyl((cx, cy, zl), 0.6, 0.6, 1.2, 8, 'stone')
    for i in range(8):
        a = math.radians(i * 45 + 22.5)
        with k.frame(T(cx, cy, zl) @ Rz(math.degrees(a) + 90) @ T(0, -0.6, 0)):
            glass(k, 0, 0.25, 0.28, 0.7, 0.02)
    k.cyl((cx, cy, zl + 1.2), 0.85, 0.1, 0.9, 8, 'zinc_dark')
    k.cyl((cx, cy, zl + 2.1), 0.03, 0.03, 0.9, 4, 'iron')
    k.ico((cx, cy, zl + 3.05), (0.18, 0.18, 0.18), 'bronze', sub=1)
    meta['footprint'] = [W + 2 * 1.5, D + 1.5]
    meta['height'] = round(zl + 3.3, 1)
    return k, meta


# ================================================================== MEDITERRANEAN
def parapet(k, x0, x1, y0, y1, z, h=0.55, t=0.22, m='plaster', cap='plaster_warm'):
    k.slab(x0, x1, y0, y0 + t, z, z + h, m, 0.05)
    k.slab(x0, x1, y1 - t, y1, z, z + h, m, 0.05)
    k.slab(x0, x0 + t, y0, y1, z, z + h, m, 0.05)
    k.slab(x1 - t, x1, y0, y1, z, z + h, m, 0.05)
    k.slab(x0 - 0.05, x1 + 0.05, y0 - 0.05, y0 + t + 0.05, z + h, z + h + 0.08, cap)
    k.slab(x0 - 0.05, x1 + 0.05, y1 - t - 0.05, y1 + 0.05, z + h, z + h + 0.08, cap)
    k.slab(x0 - 0.05, x0 + t + 0.05, y0, y1, z + h, z + h + 0.08, cap)
    k.slab(x1 - t - 0.05, x1 + 0.05, y0, y1, z + h, z + h + 0.08, cap)


def base_band(k, W, D, m='plaster_shade', h=0.85):
    """Painted soubassement: a slightly proud band round the foot of the walls."""
    k.slab(-W / 2 - 0.04, W / 2 + 0.04, -D / 2 - 0.04, D / 2 + 0.04, 0.2, h, m, 0.02)


def cube(k, x0, x1, y0, y1, z0, z1, m='plaster', bevel=0.09):
    k.slab(x0, x1, y0, y1, z0, z1, m, bevel)


def pergola(k, x0, x1, y0, y1, z, h=2.3, m='wood'):
    for x in (x0 + 0.1, x1 - 0.1):
        for y in (y0 + 0.1, y1 - 0.1):
            k.box((x, y, z + h / 2), (0.14, 0.14, h), 'plaster', 0.02)
    k.slab(x0, x1, y0, y0 + 0.14, z + h, z + h + 0.16, m)
    k.slab(x0, x1, y1 - 0.14, y1, z + h, z + h + 0.16, m)
    n = int((x1 - x0) / 0.45)
    for i in range(n + 1):
        x = x0 + (x1 - x0) * i / n
        k.slab(x - 0.04, x + 0.04, y0 - 0.2, y1 + 0.2, z + h + 0.16, z + h + 0.26, m)


def outdoor_stair(k, x, y0, z0, z1, run, w=0.9, m='plaster', dir=1):
    """Stair along +x*dir hugging a wall (wall at y0, stair outward -y)."""
    n = max(3, int((z1 - z0) / 0.2))
    for i in range(n):
        zt = z0 + (z1 - z0) * (i + 1) / n
        xs = x + dir * run * i / n
        k.slab(min(xs, xs + dir * run / n), max(xs, xs + dir * run / n), y0 - w, y0, z0, zt, m, 0.02)
    # a little wall/rail
    k.prism([(x, z0), (x + dir * run, z1), (x + dir * run, z1 + 0.7), (x, z0 + 0.7)] if dir > 0 else
            [(x + dir * run, z1), (x, z0), (x, z0 + 0.7), (x + dir * run, z1 + 0.7)], y0 - w - 0.14, y0 - w, m)


def med_cube_small(name='med_cube_small', seed=11):
    k = Kit(name, seed)
    W, D, H = 6.4, 6.0, 3.6
    plinth(k, W, D, 'plaster_shade', 0.25)
    cube(k, -W / 2, W / 2, -D / 2, D / 2, 0.2, H)
    base_band(k, W, D, "powder")
    parapet(k, -W / 2, W / 2, -D / 2, D / 2, H - 0.05)
    # roof: little stair-head box + pergola
    cube(k, W / 2 - 2.2, W / 2 - 0.2, D / 2 - 2.2, D / 2 - 0.2, H, H + 2.2)
    with k.frame(T(W / 2 - 1.2, D / 2 - 2.2, H)):
        door(k, 0, 0.8, 1.9, 'powder_deep', 'plaster', arched=True, step=False)
    pergola(k, -W / 2 + 0.3, 0.6, -D / 2 + 0.3, D / 2 - 0.3, H)
    with k.frame(face_frame('front', D / 2)):
        door(k, -1.2, 1.0, 2.2, 'powder_deep', 'plaster', arched=True, z=0.2)
        med_window(k, 1.4, 1.1, 0.9, 1.1, 'powder', bars=True)
        bougainvillea(k, -2.3, 0, H + 0.4, 2.0, 2.6)
    with k.frame(face_frame('right', W / 2)):
        med_window(k, 0, 1.1, 0.8, 1.0, 'powder')
    with k.frame(face_frame('left', W / 2)):
        med_window(k, -0.8, 1.1, 0.8, 1.0, 'powder')
    with k.frame(face_frame('back', D / 2)):
        med_window(k, 1, 1.1, 0.8, 1.0, 'powder')
    planter(k, 1.6, -D / 2 - 0.6, 0.0)
    return k, dict(kind='med', footprint=[W + 0.6, D + 1.4], height=H + 2.6)


def med_cube_stack(name='med_cube_stack', seed=12):
    k = Kit(name, seed)
    W, D = 9.0, 7.0
    plinth(k, W, D, 'plaster_shade', 0.25)
    cube(k, -W / 2, W / 2, -D / 2, D / 2, 0.2, 3.4)
    base_band(k, W, D)
    parapet(k, -W / 2, W / 2, -D / 2, D / 2, 3.35, 0.6)
    # upper cube set back to the right
    ux0, ux1, uy0, uy1 = -0.5, W / 2, -D / 2 + 1.6, D / 2
    cube(k, ux0, ux1, uy0, uy1, 3.3, 6.5)
    parapet(k, ux0, ux1, uy0, uy1, 6.45, 0.5)
    cube(k, ux1 - 2.0, ux1 - 0.2, uy1 - 1.8, uy1 - 0.2, 6.5, 8.4, 'plaster_warm')  # roof kiosk
    with k.frame(T(ux1 - 1.1, uy1 - 1.8, 6.5)):
        door(k, 0, 0.7, 1.6, 'mustard', 'plaster', arched=False, step=False)
    with k.frame(face_frame('front', D / 2)):
        door(k, -2.4, 1.1, 2.3, 'mustard', 'plaster', arched=True, z=0.2)
        med_window(k, -0.4, 1.1, 1.0, 1.2, 'mustard')
        med_window(k, 2.6, 1.1, 1.0, 1.2, 'mustard')
        # terrace railing on the lower roof in front of upper cube
        bougainvillea(k, 3.8, 0, 3.9, 1.6, 2.0, density=0.9)
    with k.frame(T(0, uy0, 0)):
        med_window(k, 1.0, 4.3, 1.2, 1.5, 'mustard', arched=True)
        med_window(k, 3.2, 4.3, 0.8, 1.1, 'mustard')
    pergola(k, -W / 2 + 0.25, -0.6, -D / 2 + 0.25, uy0 + 1.0, 3.4, h=2.2)
    bougainvillea(k, -3.0, -D / 2 + 0.1, 5.9, 2.6, 2.2, density=1.0)
    with k.frame(face_frame('left', W / 2)):
        outdoor_stair(k, -D / 2 + 0.3, 0, 0.2, 3.4, 4.6, 0.9, 'plaster', 1)
        med_window(k, 1.9, 1.1, 0.8, 1.0, 'mustard')
    with k.frame(face_frame('right', W / 2)):
        med_window(k, -1, 1.1, 0.8, 1.0, 'mustard')
        med_window(k, 1.2, 4.3, 0.8, 1.0, 'mustard')
    with k.frame(face_frame('back', D / 2)):
        med_window(k, 0, 1.1, 0.8, 1.0, 'mustard')
        med_window(k, -2.2, 4.3, 0.8, 1.0, 'mustard')
    return k, dict(kind='med', footprint=[W + 1.0, D + 1.0], height=8.5)


def med_villa_tiled(name='med_villa_tiled', seed=13):
    """Two storeys, hip terracotta roof, ground-floor arcade loggia, burgundy shutters."""
    k = Kit(name, seed)
    W, D, H = 10.0, 7.5, 6.6
    plinth(k, W, D, 'plaster_shade', 0.3)
    # loggia: recessed back wall + three arches across the front
    LD = 2.0
    cube(k, -W / 2, W / 2, -D / 2 + LD, D / 2, 0.25, H)
    k.slab(-W / 2 - 0.04, W / 2 + 0.04, -D / 2 + LD - 0.04, D / 2 + 0.04, 0.2, 0.9, "terracotta_dark", 0.02)
    cube(k, -W / 2, W / 2, -D / 2, -D / 2 + LD, 3.3, H)  # upper floor over loggia
    k.slab(-W / 2 + 0.3, W / 2 - 0.3, -D / 2 + 0.3, -D / 2 + LD, 0.25, 0.32, 'terracotta_dark')  # tiled floor
    with k.frame(T(0, -D / 2, 0)):
        aw, top = 2.3, 3.3
        n = 3
        span = W - 0.0
        for i in range(n + 1):
            x = -W / 2 + span * i / n
            pw = 0.7 if i in (0, n) else 0.55
            px = x + (pw / 2 if i == 0 else (-pw / 2 if i == n else 0))
            k.slab(px - pw / 2, px + pw / 2, -0.0, LD, 0.25, top, 'plaster', 0.06)
        for i in range(n):
            x = -W / 2 + span * (i + 0.5) / n
            ow = span / n - 0.6
            k.prism(arch_fill_poly(ow, 2.65, top, 8, x, 0.25), 0.0, LD * 0.45, 'plaster')
        k.slab(-W / 2, W / 2, -0.12, 0.2, top - 0.1, top + 0.12, 'plaster_warm', 0.04)
    with k.frame(T(0, -D / 2 + LD, 0)):
        door(k, 0, 1.2, 2.3, 'burgundy', 'plaster', arched=False, z=0.3, step=False)
        med_window(k, -3.2, 1.0, 1.0, 1.3, None, frame='plaster_warm')
        med_window(k, 3.2, 1.0, 1.0, 1.3, None, frame='plaster_warm')
    with k.frame(face_frame('front', D / 2)):
        for x in (-3.3, 0, 3.3):
            med_window(k, x, 4.2, 1.0, 1.5, 'burgundy')
        # balcony on centre window
        k.box((0, -0.35, 4.05), (1.9, 0.7, 0.12), 'plaster_warm', 0.03)
        railing(k, -0.9, 0.9, 4.1, -0.66, h=0.8, spacing=0.15)
        bougainvillea(k, -4.4, 0.0, 5.9, 1.4, 4.6, density=1.1)
    for side in ('left', 'right'):
        with k.frame(face_frame(side, W / 2)):
            med_window(k, 0.8, 4.2, 0.9, 1.3, 'burgundy')
            med_window(k, 0.8, 1.0, 0.9, 1.3, 'burgundy')
    with k.frame(face_frame('back', D / 2)):
        for x in (-2.5, 2.5):
            med_window(k, x, 4.2, 0.9, 1.3, 'burgundy')
            med_window(k, x, 1.0, 0.9, 1.3, 'burgundy')
    k.slab(-W / 2 - 0.15, W / 2 + 0.15, -D / 2 - 0.15, D / 2 + 0.15, H - 0.05, H + 0.15, 'plaster_warm', 0.04)
    hip_roof(k, -W / 2, W / 2, -D / 2, D / 2, H + 0.15, 2.2, over=0.5, genoise=True)
    chimney(k, 2.6, 1.0, H + 1.2, 0.8, 0.6, 1.8, 'plaster', pots=1)
    return k, dict(kind='med', footprint=[W + 1.0, D + 1.0], height=H + 3.0)


def med_house_gable(name='med_house_gable', seed=14, wall='pink', shutter='powder', door_c='ink'):
    """Narrow two-storey house, pastel, gable roof, balcony with iron rail, flowering door."""
    k = Kit(name, seed)
    W, D, H = 6.0, 8.0, 6.4
    plinth(k, W, D, 'plaster_shade', 0.3)
    cube(k, -W / 2, W / 2, -D / 2, D / 2, 0.25, H, wall)
    base_band(k, W, D, "pink_deep" if wall == "pink" else "stone_dark")
    # quoins/corner bands in white
    for sx in (-1, 1):
        k.box((sx * (W / 2 - 0.15), -D / 2 - 0.03, H / 2), (0.3, 0.08, H - 0.3), 'plaster')
    k.slab(-W / 2 - 0.05, W / 2 + 0.05, -D / 2 - 0.06, D / 2 + 0.06, 3.2, 3.38, 'plaster', 0.03)
    with k.frame(face_frame('front', D / 2)):
        door(k, -1.2, 1.1, 2.4, door_c, 'plaster', arched=True, z=0.3)
        med_window(k, 1.4, 1.1, 0.9, 1.3, shutter)
        med_window(k, -1.2, 4.0, 1.0, 1.7, shutter)
        med_window(k, 1.4, 4.0, 1.0, 1.7, shutter)
        k.box((0, -0.45, 3.85), (W - 0.8, 0.9, 0.12), 'plaster', 0.03)
        railing(k, -W / 2 + 0.5, W / 2 - 0.5, 3.9, -0.86, h=0.85, spacing=0.15)
        railing_side(k, -0.9, -0.05, -W / 2 + 0.45, 3.9, h=0.85)
        railing_side(k, -0.9, -0.05, W / 2 - 0.45, 3.9, h=0.85)
        bougainvillea(k, -1.2, 0.0, 3.2, 2.2, 1.0, density=1.0)
        planter(k, 2.3, 0.4 - 0.4, 3.96, s=0.7)
    for side in ('left', 'right'):
        with k.frame(face_frame(side, W / 2)):
            med_window(k, -1.6, 1.1, 0.8, 1.1, shutter)
            med_window(k, 1.8, 4.0, 0.8, 1.1, shutter)
    with k.frame(face_frame('back', D / 2)):
        med_window(k, 0, 4.0, 0.8, 1.1, shutter)
    # gable roof, ridge front-to-back (gable end faces the street)
    hip_roof(k, -W / 2, W / 2, -D / 2, D / 2, H, 1.9, over=0.4, hip=False, genoise=True)
    gable_wall(k, -W / 2, W / 2, H, 1.9, -D / 2 + 0.1, 0.2, wall)
    gable_wall(k, -W / 2, W / 2, H, 1.9, D / 2 - 0.1, 0.2, wall)
    with k.frame(face_frame('front', D / 2)):
        k.prism(arch_poly(0.5, 0.6, 6, 0, H + 0.35), -0.02, -0.08, 'plaster')
        k.prism(arch_poly(0.34, 0.45, 6, 0, H + 0.42), -0.08, -0.1, win_mat(k))
    chimney(k, 0, 2.2, H + 0.6, 0.7, 0.7, 1.9, wall, pots=1)
    return k, dict(kind='med', footprint=[W + 0.8, D + 1.2], height=H + 2.6)


def med_tower_house(name='med_tower_house', seed=15):
    """Three-storey whitewashed house with a mirador tower and arched openings."""
    k = Kit(name, seed)
    W, D = 8.0, 7.0
    plinth(k, W, D, 'plaster_shade', 0.3)
    cube(k, -W / 2, W / 2, -D / 2, D / 2, 0.25, 6.4)
    base_band(k, W, D)
    parapet(k, -W / 2, W / 2, -D / 2, D / 2, 6.35, 0.55)
    # tower on the left-back
    tx0, tx1, ty0, ty1 = -W / 2 + 0.2, -W / 2 + 3.6, -0.6, D / 2 - 0.2
    cube(k, tx0, tx1, ty0, ty1, 6.3, 9.0)
    k.slab(tx0 - 0.15, tx1 + 0.15, ty0 - 0.15, ty1 + 0.15, 9.0, 9.2, 'plaster_warm', 0.04)
    # mirador: open arched loggia on top of tower
    for x in (tx0 + 0.2, tx1 - 0.2):
        for y in (ty0 + 0.2, ty1 - 0.2):
            k.box((x, y, 10.3), (0.4, 0.4, 2.2), 'plaster', 0.04)
    for side, xc, yc, L in (('front', (tx0 + tx1) / 2, ty0, tx1 - tx0), ('back', (tx0 + tx1) / 2, ty1, tx1 - tx0)):
        rot = 0 if side == 'front' else 180
        with k.frame(T(xc, yc, 0) @ Rz(rot)):
            k.prism(arch_fill_poly(L - 0.8, 1.9, 11.4, 8, 0, 9.2), -0.1, 0.2, 'plaster')
    for side, xc, yc, L in (('left', tx0, (ty0 + ty1) / 2, ty1 - ty0), ('right', tx1, (ty0 + ty1) / 2, ty1 - ty0)):
        rot = -90 if side == 'left' else 90
        with k.frame(T(xc, yc, 0) @ Rz(rot)):
            k.prism(arch_fill_poly(L - 0.8, 1.9, 11.4, 8, 0, 9.2), -0.1, 0.2, 'plaster')
    k.slab(tx0 - 0.1, tx1 + 0.1, ty0 - 0.1, ty1 + 0.1, 11.4, 11.6, 'plaster_warm', 0.04)
    hip_roof(k, tx0, tx1, ty0, ty1, 11.6, 1.5, over=0.35, genoise=True)
    # a bell-shaped lamp in the mirador
    k.cyl(((tx0 + tx1) / 2, (ty0 + ty1) / 2, 10.8), 0.06, 0.25, 0.35, 8, 'emissive_window_2')
    k.box(((tx0 + tx1) / 2, (ty0 + ty1) / 2, 11.2), (0.03, 0.03, 0.4), 'iron')
    with k.frame(face_frame('front', D / 2)):
        door(k, 1.6, 1.2, 2.5, 'powder_deep', 'plaster', arched=True, z=0.25)
        med_window(k, -2.0, 1.1, 0.9, 1.2, 'powder', bars=True)
        med_window(k, -2.0, 4.0, 1.0, 1.5, 'powder')
        med_window(k, 1.6, 4.0, 1.0, 1.5, 'powder')
        # small balcony
        k.box((1.6, -0.32, 3.85), (1.6, 0.64, 0.12), 'plaster', 0.03)
        railing(k, 0.85, 2.35, 3.9, -0.6, h=0.8, spacing=0.15)
        bougainvillea(k, 3.5, 0, 6.6, 1.2, 4.2, density=1.0)
    with k.frame(T(0, ty0, 0)):
        med_window(k, -2.2, 7.0, 0.8, 1.2, 'powder', arched=True)
    for side in ('left', 'right'):
        with k.frame(face_frame(side, W / 2)):
            med_window(k, 1.5, 1.1, 0.8, 1.1, 'powder')
            med_window(k, -1.0, 4.0, 0.8, 1.1, 'powder')
    with k.frame(face_frame('back', D / 2)):
        med_window(k, 2, 1.1, 0.8, 1.1, 'powder')
        med_window(k, 2, 4.0, 0.8, 1.1, 'powder')
    planter(k, 2.9, -D / 2 - 0.5, 0.0)
    return k, dict(kind='med', footprint=[W + 0.8, D + 1.4], height=13.2)


# ===================================================================== CIVIC
def church(name='church', seed=21):
    """Whitewashed church: gable nave with rose window, tall bell tower with belfry, clock and dome."""
    k = Kit(name, seed)
    NW, ND, NH = 8.0, 15.0, 7.5
    plinth(k, NW + 0.6, ND, 'stone_dark', 0.35)
    cube(k, -NW / 2, NW / 2, -ND / 2, ND / 2, 0.3, NH, 'plaster', 0.08)
    # buttresses along the sides
    for sx in (-1, 1):
        for y in (-3.5, 0.5, 4.5):
            k.box((sx * (NW / 2 + 0.25), y, 2.4), (0.5, 0.7, 4.8), 'plaster', 0.06, taper=(0.6, 1))
    hip_roof(k, -NW / 2, NW / 2, -ND / 2, ND / 2, NH, 3.0, over=0.45, hip=False)
    gable_wall(k, -NW / 2, NW / 2, NH, 3.0, -ND / 2 + 0.1, 0.2, 'plaster')
    gable_wall(k, -NW / 2, NW / 2, NH, 3.0, ND / 2 - 0.1, 0.2, 'plaster')
    with k.frame(face_frame('front', ND / 2)):
        # raised gable front (espadaña-like) with stepped cornice
        k.prism([(-NW / 2 - 0.2, NH - 0.2), (NW / 2 + 0.2, NH - 0.2), (NW / 2 + 0.2, NH + 0.4), (0, NH + 3.6),
                 (-NW / 2 - 0.2, NH + 0.4)], -0.25, 0.05, 'plaster_warm')
        k.box((0, -0.12, NH + 3.8), (0.12, 0.1, 0.9), 'iron')
        k.box((0, -0.12, NH + 3.95), (0.5, 0.1, 0.1), 'iron')
        door(k, 0, 1.8, 3.4, 'burgundy', 'stone', arched=True, z=0.35)
        # rose window
        k.cyl((0, -0.05, NH - 1.3), 1.15, 1.15, 0.22, 16, 'stone', rot=RX(90), phase=11.25)
        k.cyl((0, -0.26, NH - 1.3), 0.92, 0.92, 0.04, 16, 'emissive_window_1', rot=RX(90), phase=11.25)
        for i in range(8):
            a = math.radians(i * 22.5)
            k.box((0, -0.2, NH - 1.3), (1.8, 0.04, 0.05), 'stone', rot=Matrix.Rotation(a, 4, 'Y'))
        for x in (-2.8, 2.8):
            med_window(k, x, 2.2, 0.7, 2.0, None, frame='stone', arched=True)
    for side in ('left', 'right'):
        with k.frame(face_frame(side, NW / 2)):
            for x in (-5.5, -1.5, 2.5, 6.0):
                med_window(k, x, 3.0, 0.8, 2.6, None, frame='stone', arched=True)
    with k.frame(face_frame('back', ND / 2)):
        med_window(k, 0, 3.0, 0.9, 2.6, None, frame='stone', arched=True)
    # bell tower: front-right corner, slightly forward
    tw = 4.2
    cx, cy = NW / 2 + tw / 2 - 0.4, -ND / 2 + tw / 2 - 0.6
    k.slab(cx - tw / 2 - 0.1, cx + tw / 2 + 0.1, cy - tw / 2 - 0.1, cy + tw / 2 + 0.1, -FOUND, 0.4, 'stone_dark', 0.03)
    k.slab(cx - tw / 2, cx + tw / 2, cy - tw / 2, cy + tw / 2, 0.3, 15.0, 'plaster', 0.08)
    for z in (5.0, 10.0):
        k.slab(cx - tw / 2 - 0.12, cx + tw / 2 + 0.12, cy - tw / 2 - 0.12, cy + tw / 2 + 0.12, z, z + 0.22, 'plaster_warm', 0.03)
    # belfry with arched openings on four sides, a bell inside
    bz0, bz1 = 15.0, 19.0
    k.slab(cx - tw / 2 - 0.15, cx + tw / 2 + 0.15, cy - tw / 2 - 0.15, cy + tw / 2 + 0.15, bz0 - 0.1, bz0 + 0.15, 'plaster_warm', 0.03)
    for ang in (0, 90, 180, 270):
        with k.frame(T(cx, cy, 0) @ Rz(ang) @ T(0, -tw / 2, 0)):
            k.prism(arch_fill_poly(tw - 1.2, 2.9, bz1, 10, 0, bz0 + 0.15), -0.0, 0.35, 'plaster')
            k.slab(-tw / 2, -tw / 2 + 0.6, 0, 0.6, bz0 + 0.15, bz1, 'plaster', 0.04)
            k.slab(tw / 2 - 0.6, tw / 2, 0, 0.6, bz0 + 0.15, bz1, 'plaster', 0.04)
            railing(k, -tw / 2 + 0.6, tw / 2 - 0.6, bz0 + 0.15, 0.1, h=0.7, spacing=0.22)
    k.slab(cx - tw / 2 + 0.6, cx + tw / 2 - 0.6, cy - tw / 2 + 0.6, cy + tw / 2 - 0.6, bz0, bz0 + 0.15, 'terracotta_dark')
    k.cyl((cx, cy, bz0 + 1.0), 0.75, 0.32, 1.1, 10, 'bronze', phase=18)
    k.cyl((cx, cy, bz0 + 0.85), 0.8, 0.8, 0.18, 10, 'bronze', phase=18)
    k.box((cx, cy, bz0 + 2.3), (0.12, 1.6, 0.18), 'wood')
    # clock faces (glow at night) on front and side
    for ang in (0, 90):
        with k.frame(T(cx, cy, 0) @ Rz(ang) @ T(0, -tw / 2, 0)):
            k.cyl((0, 0.02, 12.6), 1.0, 1.0, 0.14, 16, 'stone', rot=RX(90))
            k.cyl((0, -0.1, 12.6), 0.82, 0.82, 0.06, 16, 'emissive_clock', rot=RX(90))
            k.box((0.0, -0.17, 12.85), (0.07, 0.03, 0.55), 'ink')
            k.box((0.18, -0.17, 12.6), (0.4, 0.03, 0.07), 'ink', rot=Matrix.Rotation(math.radians(-20), 4, 'Y'))
            for i in range(12):
                a = math.radians(i * 30)
                k.box((0.68 * math.sin(a), -0.15, 12.6 + 0.68 * math.cos(a)), (0.06, 0.03, 0.12), 'ink',
                      rot=Matrix.Rotation(a, 4, 'Y'))
            k.prism(arch_poly(0.5, 1.2, 6, 0, 6.8), 0, -0.1, 'stone')
            k.prism(arch_poly(0.34, 1.0, 6, 0, 6.9), -0.1, -0.12, win_mat(k))
    # crown: cornice, octagonal drum, glazed-tile dome, lantern, cross
    k.slab(cx - tw / 2 - 0.3, cx + tw / 2 + 0.3, cy - tw / 2 - 0.3, cy + tw / 2 + 0.3, bz1, bz1 + 0.35, 'plaster_warm', 0.05)
    for sx in (-1, 1):  # corner finials
        for sy in (-1, 1):
            px, py = cx + sx * (tw / 2), cy + sy * (tw / 2)
            k.box((px, py, bz1 + 0.6), (0.4, 0.4, 0.5), 'plaster')
            k.ico((px, py, bz1 + 1.0), (0.2, 0.2, 0.28), 'terracotta', sub=1)
    k.cyl((cx, cy, bz1 + 0.35), 1.7, 1.7, 1.3, 8, 'plaster', phase=22.5)
    rings, r, z = 5, 1.75, bz1 + 1.65
    pr, pz = r, z
    for i in range(1, rings + 1):
        a = (math.pi / 2) * i / rings
        rr = max(r * math.cos(a) ** 0.8, 0.32)
        zz = z + 2.3 * math.sin(a)
        k.cyl((cx, cy, pz), pr, rr, zz - pz, 8, 'terracotta' if i % 2 else 'mustard', cap=False, phase=22.5)
        pr, pz = rr, zz
    k.cyl((cx, cy, pz), 0.32, 0.32, 0.6, 8, 'plaster', phase=22.5)
    k.cyl((cx, cy, pz + 0.6), 0.42, 0.05, 0.6, 8, 'terracotta_dark', phase=22.5)
    k.box((cx, cy, pz + 1.6), (0.08, 0.08, 1.2), 'iron')
    k.box((cx, cy, pz + 1.85), (0.5, 0.08, 0.08), 'iron')
    meta = dict(kind='civic', footprint=[NW + tw + 1.5, ND + 1.5], height=round(pz + 2.3, 1))
    return k, meta


def cafe(name='cafe', seed=31):
    """Hillside café: pink two-storey building on a stone podium with a balustraded terrace,
    tables, striped parasols, string lights and a glowing CAFÉ sign."""
    k = Kit(name, seed)
    W, D, H = 10.0, 6.5, 6.4
    P = 1.2           # podium height (the terrace floor)
    TD = 6.0          # terrace depth in front of the building
    by0 = -D / 2 + TD / 2  # building shifted back so origin is the centre of the whole footprint
    fy0, fy1 = -(D + TD) / 2, (D + TD) / 2
    # podium (retaining wall in stone, with steps up)
    k.slab(-W / 2 - 0.3, W / 2 + 0.3, fy0, fy1, -FOUND, P, 'stone', 0.04)
    k.slab(-W / 2 - 0.4, W / 2 + 0.4, fy0 - 0.1, fy1 + 0.1, P - 0.12, P + 0.05, 'plaster_warm', 0.03)
    k.slab(-W / 2 - 0.2, W / 2 + 0.2, fy0, fy0 + TD, P + 0.05, P + 0.08, 'terracotta')
    for i in range(6):  # side steps on the left
        z = P * (i + 1) / 6
        k.slab(-W / 2 - 1.8, -W / 2 - 0.3, fy0 + 0.2 + i * 0.32, fy0 + 0.2 + (i + 1) * 0.32 + 0.0, -0.4, z, 'stone', 0.02)
    # building
    bys, bye = fy0 + TD, fy1
    k.slab(-W / 2, W / 2, bys, bye, P, P + H, 'pink', 0.08)
    k.slab(-W / 2 - 0.12, W / 2 + 0.12, bys - 0.12, bye + 0.12, P + 3.4, P + 3.58, 'plaster', 0.03)
    parapet(k, -W / 2, W / 2, bys, bye, P + H - 0.05, 0.5, m='pink', cap='plaster')
    with k.frame(T(0, bys, 0)):
        # big café windows/doors on the terrace level
        for x in (-3.4, -1.15, 1.15, 3.4):
            frame4(k, x, P + 0.15, 1.7, 2.6, 0.14, 0.14, 'burgundy')
            glass(k, x, P + 0.15, 1.7, 2.6, 0.05)
            k.box((x, -0.07, P + 0.15 + 1.95), (1.7, 0.04, 0.06), 'burgundy')
        awning(k, 0, P + 3.25, W - 0.6, 1.6, 0.6, 'burgundy', 'plaster', stripe=0.5)
        for x in (-3.2, 0, 3.2):
            med_window(k, x, P + 4.2, 1.0, 1.4, 'powder')
        # sign board + glowing letters
        k.box((0, -0.12, P + 3.95), (3.2, 0.1, 0.0001 + 0.02), 'burgundy')
    k.text('CAFÉ', (0, bys - 0.45, P + H - 0.05 + 0.75), 0.95, 0.12, 'emissive_sign')
    k.slab(-1.7, 1.7, bys - 0.42, bys - 0.32, P + H + 0.45, P + H + 0.55, 'iron')
    for x in (-1.6, 1.6):
        k.slab(x - 0.03, x + 0.03, bys - 0.4, bys - 0.32, P + H - 0.1, P + H + 0.5, 'iron')
    for side in ('left', 'right'):
        with k.frame(T(0, (bys + bye) / 2, 0) @ face_frame(side, W / 2)):
            med_window(k, 0, P + 1.0, 0.9, 1.3, 'powder')
            med_window(k, 0, P + 4.2, 0.9, 1.3, 'powder')
    with k.frame(T(0, bye, 0) @ Rz(180)):
        med_window(k, -2.5, P + 4.2, 0.9, 1.3, 'powder')
        door(k, 2.5, 1.0, 2.2, 'burgundy', 'plaster', arched=False, z=P, step=False)
    # balustrade along the terrace edge
    def balusters(x0, y0, x1, y1):
        L = math.hypot(x1 - x0, y1 - y0)
        n = int(L / 0.32)
        for i in range(n + 1):
            t = i / n
            x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            k.cyl((x, y, P + 0.08), 0.07, 0.11, 0.3, 6, 'plaster')
            k.cyl((x, y, P + 0.38), 0.11, 0.06, 0.4, 6, 'plaster')
        k.slab(min(x0, x1) - 0.1, max(x0, x1) + 0.1, min(y0, y1) - 0.1, max(y0, y1) + 0.1, P + 0.78, P + 0.92, 'plaster', 0.03)
    balusters(-W / 2 - 0.15, fy0 + 0.05, W / 2 + 0.15, fy0 + 0.05)
    balusters(W / 2 + 0.15, fy0 + 0.05, W / 2 + 0.15, bys - 0.2)
    balusters(-W / 2 - 0.15, fy0 + 1.6, -W / 2 - 0.15, bys - 0.2)
    for x in (-W / 2 - 0.15, W / 2 + 0.15):
        k.box((x, fy0 + 0.05, P + 0.6), (0.36, 0.36, 1.2), 'plaster', 0.03)
        planter(k, x, fy0 + 0.05, P + 1.2, s=0.8)
    # tables, chairs, parasols
    rng = k.rng
    spots = [(-3.0, fy0 + 1.8), (0.0, fy0 + 2.4), (3.1, fy0 + 1.7), (-1.6, fy0 + 4.3), (1.9, fy0 + 4.4)]
    for i, (x, y) in enumerate(spots):
        z = P + 0.08
        k.cyl((x, y, z), 0.25, 0.25, 0.05, 8, 'iron')
        k.cyl((x, y, z), 0.04, 0.04, 0.72, 6, 'iron')
        k.cyl((x, y, z + 0.72), 0.42, 0.42, 0.05, 10, 'plaster')
        for a in (0, 120, 240):
            ar = math.radians(a + rng.random() * 30)
            chx, chy = x + 0.72 * math.cos(ar), y + 0.72 * math.sin(ar)
            with k.frame(T(chx, chy, z) @ Rz(math.degrees(ar) + 90)):
                k.box((0, 0, 0.45), (0.42, 0.42, 0.05), 'burgundy')
                k.box((0, 0.2, 0.75), (0.42, 0.04, 0.55), 'burgundy')
                for sx in (-0.18, 0.18):
                    for sy in (-0.18, 0.18):
                        k.box((sx, sy, 0.22), (0.03, 0.03, 0.45), 'iron')
        if i in (0, 2, 4):
            # parasol: pole + 8-gore canopy alternating colours
            k.cyl((x, y, z + 0.77), 0.025, 0.025, 1.6, 4, 'wood')
            seg = 8
            R0, hc, zc = 1.45, 0.45, z + 2.15
            for g in range(seg):
                a0, a1 = 2 * math.pi * g / seg, 2 * math.pi * (g + 1) / seg
                verts = [(x, y, zc + hc), (x + R0 * math.cos(a0), y + R0 * math.sin(a0), zc),
                         (x + R0 * math.cos(a1), y + R0 * math.sin(a1), zc)]
                c = ('mustard' if g % 2 else 'plaster') if i != 2 else ('powder' if g % 2 else 'plaster')
                k.poly_faces(verts + [(v[0], v[1], v[2] - 0.04) for v in verts], [(0, 1, 2), (3, 5, 4), (1, 4, 5, 2)], c)
                # valance tab
                mx, my = x + R0 * math.cos((a0 + a1) / 2), y + R0 * math.sin((a0 + a1) / 2)
                k.poly_faces([(x + R0 * math.cos(a0), y + R0 * math.sin(a0), zc), (x + R0 * math.cos(a1), y + R0 * math.sin(a1), zc),
                              (mx * 1.0, my, zc - 0.2)], [(0, 1, 2), (0, 2, 1)], c)
    # string lights: poles at the terrace corners, catenaries to the facade
    poles = [(-W / 2 - 0.15, fy0 + 0.05), (W / 2 + 0.15, fy0 + 0.05)]
    for (x, y) in poles:
        k.cyl((x, y, P + 1.2), 0.05, 0.05, 2.6, 6, 'iron')
    anchors = [(-W / 2 + 0.3, bys - 0.05), (-1.5, bys - 0.05), (1.5, bys - 0.05), (W / 2 - 0.3, bys - 0.05)]
    runs = [(poles[0], anchors[0]), (poles[0], anchors[1]), (poles[1], anchors[2]), (poles[1], anchors[3]),
            (poles[0], poles[1])]
    for (a, b) in runs:
        za, zb = P + 3.75, P + 3.3
        if b in poles:
            zb = P + 3.75
        n = 9
        prev = None
        for i in range(n + 1):
            t = i / n
            sag = 0.45 * 4 * t * (1 - t)
            p = Vector((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, za + (zb - za) * t - sag))
            if prev is not None:
                from kit_parts import _cap
                _cap(k, prev, p, 'iron', r=0.015, seg=3)
            if 0 < i < n:
                k.ico((p.x, p.y, p.z - 0.09), (0.07, 0.07, 0.09), 'emissive_lamp_string', sub=0)
            prev = p
    meta = dict(kind='civic', footprint=[W + 2.6, D + TD + 0.5], height=P + H + 1.6)
    return k, meta


def hotel(name='hotel', seed=41):
    """Pink Riviera grand hotel: arcaded ground floor, balconies with striped awnings,
    zinc mansard with dormers and a rooftop HOTEL sign."""
    k = Kit(name, seed)
    W, D = 16.0, 11.0
    gh, fh, floors = 4.4, 3.2, 3
    Ht = gh + floors * fh
    plinth(k, W, D, 'stone_dark', 0.4)
    k.slab(-W / 2, W / 2, -D / 2, D / 2, 0.35, Ht, 'pink', 0.07)
    # ground floor arcade in plaster
    bays = 5
    bay = W / bays
    xs = [-W / 2 + bay * (i + 0.5) for i in range(bays)]
    with k.frame(face_frame('front', D / 2)):
        k.box((0, -0.06, gh / 2 + 0.2), (W + 0.1, 0.12, gh - 0.1), 'plaster', 0.03)
        for i, x in enumerate(xs):
            if i == 2:
                door(k, x, 1.8, 3.2, 'ink', 'stone', arched=True, z=0.4, step=True)
            else:
                k.prism(arch_poly(bay - 1.0 + 0.36, 3.2 + 0.18, 8, x, 0.4), -0.1, -0.2, 'stone')
                k.prism(arch_poly(bay - 1.0, 3.2, 8, x, 0.4), -0.2, -0.24, win_mat(k))
                k.box((x, -0.26, 0.4 + 1.6), (0.06, 0.04, 3.2), 'ink')
        # entrance canopy (marquise)
        k.box((xs[2], -1.0, gh - 0.55), (3.2, 2.0, 0.16), 'ink', 0.03)
        k.box((xs[2], -2.0, gh - 0.4), (3.2, 0.08, 0.3), 'mustard')
        for s in (-1, 1):
            k.box((xs[2] + s * 1.5, -1.95, (gh - 0.6) / 2 + 0.2), (0.08, 0.08, gh - 0.6 - 0.2), 'iron')
        k.text('HÔTEL', (xs[2], -2.08, gh - 0.42 - 0.13), 0.28, 0.04, 'emissive_sign')
        k.box((0, -0.18, gh + 0.05), (W + 0.3, 0.36, 0.24), 'plaster', 0.03)
        for f in range(floors):
            z0 = gh + f * fh
            for i, x in enumerate(xs):
                frame4(k, x, z0 + 0.35, 1.3, 2.25, 0.14, 0.1, 'plaster')
                glass(k, x, z0 + 0.35, 1.3, 2.25, 0.03)
                k.box((x, -0.05, z0 + 0.35 + 1.12), (0.06, 0.03, 2.25), 'plaster')
                # every bay has a balcony with a striped awning
                k.box((x, -0.5, z0 + 0.28), (2.2, 1.0, 0.14), 'plaster', 0.03)
                railing(k, x - 1.05, x + 1.05, z0 + 0.32, -0.97, h=0.85, spacing=0.15)
                railing_side(k, -0.97, -0.05, x - 1.05, z0 + 0.32, h=0.85)
                railing_side(k, -0.97, -0.05, x + 1.05, z0 + 0.32, h=0.85)
                awning(k, x, z0 + 2.95, 2.0, 0.95, 0.5, 'burgundy' if f % 2 == 0 else 'mustard', 'plaster', stripe=0.34, valance=0.2)
            if f > 0:
                k.box((0, -0.05, z0 + 0.02), (W, 0.1, 0.14), 'plaster')
        for s in (-1, 1):
            k.box((s * (W / 2 - 0.25), -0.05, gh + floors * fh / 2), (0.5, 0.1, floors * fh), 'plaster')
    for side, half, length in (('left', W / 2, D), ('right', W / 2, D), ('back', D / 2, W)):
        with k.frame(face_frame(side, half)):
            n = max(2, int(length / 3.2))
            for f in range(floors + 1):
                z0 = 0.9 if f == 0 else gh + (f - 1) * fh + 0.45
                for i in range(n):
                    x = -length / 2 + length * (i + 0.5) / n
                    frame4(k, x, z0, 1.1, 1.9, 0.12, 0.08, 'plaster')
                    glass(k, x, z0, 1.1, 1.9, 0.03)
    k.slab(-W / 2 - 0.35, W / 2 + 0.35, -D / 2 - 0.35, D / 2 + 0.35, Ht, Ht + 0.45, 'plaster', 0.06)
    zr = Ht + 0.45
    top = mansard(k, W, D, zr, h1=2.8, h2=0.6, in1=0.9, in2=2.0)
    for side, half in (('front', D / 2), ('back', D / 2)):
        with k.frame(face_frame(side, half)):
            for x in xs:
                dormer(k, x, zr + 0.5, 1.1, 1.45, 1.7, 'plaster', 'zinc_dark', 'round', y_front=0.18)
    # rooftop sign on an iron frame
    sy = 0.0
    k.text('HOTEL', (0, sy - 0.06, top + 0.35), 1.5, 0.16, 'emissive_sign')
    k.slab(-3.3, 3.3, sy + 0.05, sy + 0.15, top + 0.2, top + 0.3, 'iron')
    for x in (-3.0, -1.0, 1.0, 3.0):
        k.slab(x - 0.04, x + 0.04, sy + 0.05, sy + 0.15, top - 0.3, top + 1.6, 'iron')
    for x in (-W / 2 + 1.8, W / 2 - 1.8):
        chimney(k, x, 0, top - 0.3, 1.0, D - 4.6, 1.3, 'plaster', pots=3)
    meta = dict(kind='civic', footprint=[W + 1.0, D + 4.5], height=round(top + 2.0, 1))
    return k, meta
