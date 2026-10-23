# Roads, walls, stairs and terrain pieces.
import math, random
from mathutils import Matrix, Vector, noise
from kit_core import Kit, T, Rz, S, face_frame, arch_poly, arch_fill_poly
from kit_parts import *

ROAD_HALF = 3.2      # carriageway half width
KERB = 0.22
WALK = 1.3           # sidewalk width
CURB_H = 0.15
SKIRT = -1.2


# ---------------------------------------------------------------- sweeping
def path_straight(L, n=1, rise=0.0):
    """Samples (pos, right) along +y from y=-L/2 to +L/2 (z rising by `rise`)."""
    out = []
    for i in range(n + 1):
        t = i / n
        out.append((Vector((0, -L / 2 + L * t, rise * t)), Vector((1, 0, 0))))
    return out


def path_arc(R, deg=90, n=20, right=True):
    """Arc starting at the origin heading +y, turning right (towards +x) or left."""
    out = []
    s = 1 if right else -1
    c = Vector((s * R, 0, 0))
    for i in range(n + 1):
        a = math.radians(deg) * i / n
        p = Vector((s * (R - R * math.cos(a)), R * math.sin(a), 0))
        rgt = Vector((math.cos(a), -s * math.sin(a), 0)) if right else Vector((math.cos(a), math.sin(a), 0))
        out.append((p, rgt))
    return out


def sweep(k, path, x0, x1, z0, z1, m, i0=0, i1=None, caps=True, follow_z=True):
    """Sweep a rectangle (x0..x1 across, z0..z1 up) along path samples i0..i1."""
    pts = path[i0:(i1 + 1 if i1 is not None else None)]
    verts, faces = [], []
    for (p, r) in pts:
        base = p if follow_z else Vector((p.x, p.y, 0))
        for (x, z) in ((x0, z0), (x1, z0), (x1, z1), (x0, z1)):
            q = base + r * x
            verts.append((q.x, q.y, q.z + z))
    n = len(pts)
    for i in range(n - 1):
        a, b = i * 4, (i + 1) * 4
        for j in range(4):
            j2 = (j + 1) % 4
            faces.append((a + j, a + j2, b + j2, b + j))
    if caps:
        faces.append((3, 2, 1, 0))
        e = (n - 1) * 4
        faces.append((e, e + 1, e + 2, e + 3))
    k.poly_faces(verts, faces, m)


def road_bands(k, path, coast=None, dashes=True, seg_len=1.0, walls=None):
    """Carriageway, kerbs, sidewalks, centre dashes; coast='left'/'right' adds a sea wall."""
    sweep(k, path, -ROAD_HALF, ROAD_HALF, SKIRT, 0.0, 'asphalt')
    for s in (-1, 1):
        side = 'left' if s < 0 else 'right'
        xa, xb = sorted((s * ROAD_HALF, s * (ROAD_HALF + KERB)))
        sweep(k, path, xa, xb, SKIRT, CURB_H + 0.02, 'kerb')
        xa, xb = sorted((s * (ROAD_HALF + KERB), s * (ROAD_HALF + KERB + WALK)))
        sweep(k, path, xa, xb, SKIRT, CURB_H, 'sidewalk')
        if coast == side:
            w0 = ROAD_HALF + KERB + WALK
            xa, xb = sorted((s * w0, s * (w0 + 0.45)))
            sweep(k, path, xa, xb, -4.0, 0.95, 'stone')
            xa, xb = sorted((s * (w0 - 0.06), s * (w0 + 0.55)))
            sweep(k, path, xa, xb, 0.95, 1.1, 'plaster')
    if dashes:
        # dashes every ~3m (2m dash) along the centre
        acc, on, start = 0.0, True, 0
        for i in range(1, len(path)):
            acc += (path[i][0] - path[i - 1][0]).length
        total = acc
        nd = max(1, round(total / 5.0))
        per = (len(path) - 1) / nd
        for d in range(nd):
            a = int(round(d * per + per * 0.2))
            b = int(round(d * per + per * 0.7))
            if b <= a:
                b = a + 1
            sweep(k, path, -0.08, 0.08, -0.01, 0.012, 'plaster', a, b)


def resample_straight(L, step=1.0, rise=0.0):
    return path_straight(L, max(1, int(L / step)), rise)


def road_straight(name='road_straight', L=10.0):
    k = Kit(name, 101)
    road_bands(k, path_straight(L, 10))
    return k, dict(kind='road', footprint=[2 * (ROAD_HALF + KERB + WALK), L], height=0.2,
                   ports=[{'pos': [0, 0, L / 2], 'dir': [0, 0, 1]}, {'pos': [0, 0, -L / 2], 'dir': [0, 0, -1]}])


def road_slope(name='road_slope', L=14.0, rise=3.0):
    k = Kit(name, 102)
    road_bands(k, path_straight(L, 14, rise))
    return k, dict(kind='road', footprint=[2 * (ROAD_HALF + KERB + WALK), L], height=rise,
                   ports=[{'pos': [0, 0, L / 2], 'dir': [0, 0, 1]}, {'pos': [0, rise, -L / 2], 'dir': [0, 0, -1]}],
                   notes='climbs %.1f m over %.0f m toward -Z' % (rise, L))


def road_curve(name='road_curve', R=14.0, coast=None):
    k = Kit(name, 103)
    road_bands(k, path_arc(R, 90, 22, right=True), coast=coast)
    # glTF: entry at origin heading -Z, exit at (R, 0, -R) heading +X
    return k, dict(kind='road', footprint=[R + 5, R + 5], height=0.2,
                   ports=[{'pos': [0, 0, 0], 'dir': [0, 0, 1]}, {'pos': [R, 0, -R], 'dir': [1, 0, 0]}],
                   notes='90 degree right turn, centreline radius %.0f m; origin at the entry centreline' % R)


def road_coast(name='road_coast', L=10.0):
    k = Kit(name, 104)
    p = path_straight(L, 10)
    road_bands(k, p, coast='right')
    # pilasters on the sea wall every 5 m, and a bench niche
    w0 = ROAD_HALF + KERB + WALK
    for y in (-L / 2 + 0.3, 0.0):
        k.box((w0 + 0.22, y, 0.6), (0.7, 0.7, 1.25), 'stone', 0.03)
        k.box((w0 + 0.22, y, 1.27), (0.85, 0.85, 0.12), 'plaster', 0.02)
        k.ico((w0 + 0.22, y, 1.5), (0.22, 0.22, 0.25), 'terracotta', sub=1)
    return k, dict(kind='road', footprint=[2 * (ROAD_HALF + KERB + WALK) + 1.2, L], height=1.5,
                   ports=[{'pos': [0, 0, L / 2], 'dir': [0, 0, 1]}, {'pos': [0, 0, -L / 2], 'dir': [0, 0, -1]}],
                   notes='sea wall on the +X side')


def road_t(name='road_t'):
    """T-junction: through road along Z (10 m), branch to +X."""
    k = Kit(name, 105)
    L = 10.0
    road_bands(k, path_straight(L, 10), dashes=True)
    # branch: rotate a short straight so it heads +x; cut the right sidewalk with an asphalt patch
    half = ROAD_HALF + KERB + WALK
    with k.frame(T(half / 2 + ROAD_HALF / 2 + 0.01, 0, 0) @ Rz(-90)):
        bl = half - ROAD_HALF + 0.02
        p = path_straight(bl, 2)
        sweep(k, p, -ROAD_HALF, ROAD_HALF, SKIRT, 0.003, 'asphalt')
    # corner kerbs on the branch edges
    for s in (-1, 1):
        y = s * (ROAD_HALF + KERB / 2)
        k.slab(ROAD_HALF + 0.0, half, y - KERB / 2, y + KERB / 2, SKIRT, CURB_H + 0.02, 'kerb')
        k.slab(ROAD_HALF + 0.0, half, y + s * KERB / 2, s * (L / 2), SKIRT, CURB_H, 'sidewalk')
    # zebra crossing on the branch mouth
    for i in range(6):
        y = -ROAD_HALF + 0.55 + i * 1.05
        k.slab(ROAD_HALF + 0.4, ROAD_HALF + 2.0, y - 0.25, y + 0.25, -0.01, 0.014, 'plaster')
    return k, dict(kind='road', footprint=[2 * half, L], height=0.2,
                   ports=[{'pos': [0, 0, L / 2], 'dir': [0, 0, 1]}, {'pos': [0, 0, -L / 2], 'dir': [0, 0, -1]},
                          {'pos': [half, 0, 0], 'dir': [1, 0, 0]}])


# ---------------------------------------------------------------- walls / stairs
def stone_courses(k, x0, x1, z0, z1, y, m='stone', alt='stone_dark', course=0.55, rng=None):
    """Ashlar-ish face: staggered blocks slightly proud of the wall plane (wall plane y, outward -y)."""
    rng = rng or random.Random(3)
    z = z0
    row = 0
    while z < z1 - 0.05:
        h = min(course, z1 - z)
        x = x0 - (0.6 if row % 2 else 0.0)
        while x < x1 - 0.05:
            w = 1.0 + rng.random() * 0.7
            a, b = max(x, x0), min(x + w, x1)
            if b - a > 0.15:
                c = alt if rng.random() < 0.22 else m
                k.box(((a + b) / 2, y - 0.04, z + h / 2), (b - a - 0.06, 0.08, h - 0.06), c, 0.02)
            x += w
        z += course
        row += 1


def wall_retaining(name='wall_retaining', L=10.0, H=3.0, flowers=False, seed=51):
    k = Kit(name, seed)
    t = 0.7
    k.slab(-L / 2, L / 2, -t / 2, t / 2 + 1.5, -1.0, H, 'stone_dark')
    stone_courses(k, -L / 2, L / 2, -1.0, H - 0.05, -t / 2, rng=k.rng)
    k.slab(-L / 2 - 0.02, L / 2 + 0.02, -t / 2 - 0.15, t / 2, H, H + 0.22, 'plaster_warm', 0.04)
    for x in (-3.0, 0.5, 3.6):  # weep holes
        k.box((x, -t / 2 - 0.06, 0.6), (0.18, 0.06, 0.18), 'iron')
    if flowers:
        with k.frame(T(0, -t / 2 - 0.1, 0)):
            bougainvillea(k, -2.0, 0, H + 0.3, 3.0, 2.4, density=1.0)
            bougainvillea(k, 2.8, 0, H + 0.3, 1.8, 1.6, density=0.8)
    return k, dict(kind='wall', footprint=[L, t + 1.5], height=H + 0.3,
                   notes='retaining wall %.0f m long, %.0f m tall; face toward +Z, top (earth) side toward -Z' % (L, H))


def wall_low(name='wall_low', L=4.0):
    k = Kit(name, 52)
    k.slab(-L / 2, L / 2, -0.15, 0.15, -0.6, 1.1, 'plaster', 0.06)
    # terracotta tile coping: a little gabled cap
    k.prism([(-L / 2 - 0.05, 1.1), (L / 2 + 0.05, 1.1), (L / 2 + 0.05, 1.18), (-L / 2 - 0.05, 1.18)], -0.25, 0.25, 'terracotta')
    hip_roof(k, -L / 2, L / 2, -0.15, 0.15, 1.18, 0.12, over=0.1, thick=0.04, hip=False)
    for x in (-L / 2, L / 2):
        k.box((x, 0, 0.3), (0.4, 0.4, 1.8), 'plaster', 0.05)
        k.box((x, 0, 1.25), (0.5, 0.5, 0.1), 'plaster_warm')
    return k, dict(kind='wall', footprint=[L + 0.4, 0.5], height=1.3)


def stairs(name='stairs', W=2.6, rise=3.0, run=5.4, wide=False):
    """Straight flight climbing toward -Z (glTF): bottom step at +Z edge, top at y=rise."""
    k = Kit(name, 53)
    n = int(round(rise / 0.19))
    sr, rr = rise / n, run / n
    for i in range(n):
        y0 = -run / 2 + i * rr
        k.slab(-W / 2, W / 2, y0, run / 2, -0.6, sr * (i + 1), 'stone' if i % 2 == 0 else 'stone_dark' if False else 'stone', 0.015)
        k.slab(-W / 2, W / 2, y0 - 0.04, y0 + 0.06, sr * (i + 1) - 0.05, sr * (i + 1) + 0.01, 'plaster_warm')
    # cheek walls following the slope
    for s in (-1, 1):
        x0, x1 = (W / 2, W / 2 + 0.35) if s > 0 else (-W / 2 - 0.35, -W / 2)
        poly = [(-run / 2, -0.6), (run / 2, -0.6), (run / 2, rise + 0.9), (-run / 2 + 0.4, 0.9), (-run / 2, 0.9)]
        M = Rz(90)  # poly x -> world y, extrusion y -> world -x
        k.prism(poly, -x1, -x0, 'plaster', M)
        cap = [(-run / 2 - 0.05, 0.9), (-run / 2 + 0.4, 0.9), (run / 2 + 0.05, rise + 0.9), (run / 2 + 0.05, rise + 1.02),
               (-run / 2 + 0.4, 1.02), (-run / 2 - 0.05, 1.02)]
        k.prism(cap, -x1 - 0.05, -x0 + 0.05, 'plaster_warm', M)
        if wide:
            k.box(((x0 + x1) / 2, -run / 2 + 0.2, 1.2), (0.5, 0.5, 0.5), 'plaster_warm', 0.03)
            k.ico(((x0 + x1) / 2, -run / 2 + 0.2, 1.65), (0.2, 0.2, 0.26), 'terracotta', sub=1)
    # top landing
    k.slab(-W / 2 - 0.35, W / 2 + 0.35, run / 2, run / 2 + 1.0, -0.6, rise, 'stone', 0.02)
    return k, dict(kind='stairs', footprint=[W + 0.7, run + 1.0], height=rise + 1.0,
                   notes='climbs %.1f m toward -Z over %.1f m (plus a 1 m landing)' % (rise, run))


# ---------------------------------------------------------------- terrain
def terrace_block(name='terrace_block', W=10.0, Dp=14.0, H=3.0, seed=61):
    """One terrace module: flat top at y=0, stone retaining face toward +Z dropping H, earth body below."""
    k = Kit(name, seed)
    fy = -Dp / 2
    k.slab(-W / 2, W / 2, fy + 0.6, Dp / 2, -H - 3.0, 0.0, 'earth')
    k.slab(-W / 2, W / 2, fy, fy + 0.6, -H - 3.0, -0.0, 'stone_dark')
    stone_courses(k, -W / 2, W / 2, -H - 0.4, -0.05, fy, rng=k.rng)
    k.slab(-W / 2, W / 2, fy - 0.12, fy + 0.6, 0.0, 0.18, 'plaster_warm', 0.03)
    # lane along the front edge, garden soil behind
    k.slab(-W / 2, W / 2, fy + 0.6, fy + 3.0, -0.05, 0.03, 'sidewalk')
    for i in range(7):
        x = -W / 2 + (i + 0.5) * W / 7
        k.slab(x - 0.6, x + 0.6, fy + 0.7, fy + 2.9, 0.03, 0.045, 'kerb')
    return k, dict(kind='terrain', footprint=[W, Dp], height=H,
                   notes='flat top at y=0; retaining face toward +Z drops %.0f m; tile in X every %.0f m and step rows by %.0f m back, %.0f m up' % (H, W, Dp, H))


def _grid_terrain(k, sx, sy, nx, ny, hfun, colour_fun):
    verts, faces = [], []
    for j in range(ny + 1):
        for i in range(nx + 1):
            x = -sx / 2 + sx * i / nx
            y = -sy / 2 + sy * j / ny
            verts.append((x, y, hfun(x, y)))
    by_mat = {}
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            b, c, d = a + 1, a + nx + 2, a + nx + 1
            # split along the flatter diagonal so ledges stay crisp
            pa, pb, pc, pd = (Vector(verts[q]) for q in (a, b, c, d))
            if abs(pa.z - pc.z) <= abs(pb.z - pd.z):
                tris = [(a, b, c), (a, c, d)]
            else:
                tris = [(a, b, d), (b, c, d)]
            n = (pc - pa).cross(pd - pb).normalized()  # quad normal: one colour per quad
            if n.z < 0:
                n = -n
            cx, cy, cz = (pa.x + pc.x) / 2, (pa.y + pc.y) / 2, (pa.z + pb.z + pc.z + pd.z) / 4
            by_mat.setdefault(colour_fun(n, cx, cy, cz), []).extend(tris)
    for m, fs in by_mat.items():
        k.poly_faces(verts, fs, m)


def _strata(z, n):
    band = int(math.floor(z / 2.6 + noise.noise(Vector((0, 0, z * 0.1))) * 0.6))
    return 'rock_dark' if band % 3 == 0 else 'rock'


def _ledges(c, n=4, sharp=0.3):
    """Turn a 0..1 ramp into n stacked ledges (rock strata stepping up)."""
    c = max(0.0, min(1.0, c)) * n
    i = math.floor(c)
    f = c - i
    s = max(0.0, min(1.0, (f - (1 - sharp)) / sharp))
    return min(n, i + s * s * (3 - 2 * s)) / n


def headland(name='headland', seed=71):
    """A promontory across the bay: stepped pink-ochre rock strata, a grassy rolling top (about 170 x 95 m, 46 m high)."""
    k = Kit(name, seed)
    sx, sy, H = 170.0, 95.0, 46.0
    off = Vector((seed * 3.1, seed * 1.7, 0))

    def h(x, y):
        u, v = x / (sx * 0.46), (y + 6) / (sy * 0.42)
        taper = 1.0 - 0.5 * max(0.0, u)          # narrows toward the point (+x)
        f = 1 - (u * u + (v / taper) ** 2)
        f += noise.noise(Vector((x * 0.012, y * 0.012, 0)) + off) * 0.12
        c = max(0.0, min(1.0, f / 0.55))
        top = H * (0.55 + 0.45 * max(0.0, 1 - (u + 0.25) ** 2)) + noise.noise(Vector((x * 0.04, y * 0.04, 3)) + off) * 2.5
        return -3.0 + _ledges(c, 4, 0.35) * (top + 3.0)

    def col(n, x, y, z):
        if z < -1.0:
            return 'rock_dark'
        if n.z > 0.8:
            return 'grass' if z > H * 0.45 else 'earth'
        return _strata(z, n)
    _grid_terrain(k, sx, sy, 68, 38, h, col)
    return k, dict(kind='terrain', footprint=[sx, sy], height=H + 4,
                   notes='sits in the sea with its base 3 m below y=0; the point faces +X')


def hill_backdrop(name='hill_backdrop', seed=72):
    """A broad hill rising behind the town (220 x 110 m, up to ~55 m): grass with stepped olive terraces."""
    k = Kit(name, seed)
    sx, sy = 220.0, 110.0
    off = Vector((seed * 2.3, 11.0, 0))

    def h(x, y):
        u = (y + sy / 2) / sy  # 0 at front (glTF +Z) .. 1 at back
        ridge = 55 * (u ** 1.15) * (0.78 + 0.22 * math.cos(x / sx * math.pi * 1.6))
        n = noise.noise(Vector((x * 0.015, y * 0.015, 0)) + off) * 5
        hh = max(0.0, ridge + n * min(1, u * 3))
        return _ledges(hh / 60.0, 10, 0.6) * 60.0 - 0.5

    def col(n, x, y, z):
        if n.z < 0.4:
            return _strata(z, n)
        return 'grass_dark' if n.z < 0.88 else 'grass'
    _grid_terrain(k, sx, sy, 64, 36, h, col)
    return k, dict(kind='terrain', footprint=[sx, sy], height=58, notes='front edge (+Z) is low; rises toward -Z')


def rocks_coast(name='rocks_coast', seed=73):
    k = Kit(name, seed)
    r = k.rng
    for i in range(9):
        a = r.random() * math.tau
        d = r.random() ** 0.7 * 7
        s = 1.0 + r.random() * 2.4
        x, y = math.cos(a) * d, math.sin(a) * d
        k.ico((x, y, s * 0.25 - 0.8), (s, s * (0.7 + r.random() * 0.4), s * (0.55 + r.random() * 0.3)),
              'rock' if r.random() < 0.6 else 'rock_dark', sub=1, jitter=0.5, rot=Rz(r.random() * 360))
    return k, dict(kind='terrain', footprint=[18, 18], height=3, notes='base sits ~1 m below y=0, for the waterline')


def terrain_slope(name='terrain_slope', W=10.0, Dp=14.0, H=3.0):
    """Ground that ramps from y=0 at the +Z edge to y=H at the -Z edge (matches road_slope)."""
    k = Kit(name, 74)
    pts = []
    for x in (-W / 2, W / 2):
        pts += [(x, -Dp / 2, 0.0), (x, Dp / 2, H), (x, -Dp / 2, -4.0), (x, Dp / 2, -4.0)]
    k.hull(pts, 'earth')
    # grass top as a thin skin
    verts = [(-W / 2, -Dp / 2, 0.02), (W / 2, -Dp / 2, 0.02), (W / 2, Dp / 2, H + 0.02), (-W / 2, Dp / 2, H + 0.02)]
    k.poly_faces(verts, [(0, 1, 2, 3)], 'grass')
    return k, dict(kind='terrain', footprint=[W, Dp], height=H)
