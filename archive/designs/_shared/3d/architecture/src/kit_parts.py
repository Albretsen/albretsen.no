# Reusable architectural parts. All facade parts work in a facade frame:
# x along the wall, wall plane at y = 0, outward = -y, z up.
import math
from mathutils import Matrix, Vector
from kit_core import Kit, T, Rz, S, face_frame, arch_poly, arch_fill_poly

RX = lambda deg: Matrix.Rotation(math.radians(deg), 4, 'X')
RY = lambda deg: Matrix.Rotation(math.radians(deg), 4, 'Y')


def win_mat(k):
    k.win_count += 1
    return 'emissive_window_%d' % (1 + k.rng.randrange(3))


def glass(k, x, z, w, h, proud=0.03, m=None):
    """Window pane: a single front-facing quad (2 tris)."""
    y = -proud
    k.quad([(x - w / 2, y, z), (x + w / 2, y, z), (x + w / 2, y, z + h), (x - w / 2, y, z + h)], m or win_mat(k))


def strip(k, x, z, w, h, y, m):
    """Flat front-facing strip (mullions, transoms): 2 tris."""
    k.quad([(x - w / 2, y, z - h / 2), (x + w / 2, y, z - h / 2), (x + w / 2, y, z + h / 2), (x - w / 2, y, z + h / 2)], m)


def frame4(k, x, z, w, h, t, proud, m, bevel=0.0):
    """Surround around an opening (outer size w+2t, h+2t) with a reveal: 24 tris."""
    k.ring(x, z, w, h, t, proud, m)


def railing(k, x0, x1, z, y, h=0.95, spacing=0.24, m='iron', bar=0.04, ends=True):
    L = x1 - x0
    k.box(((x0 + x1) / 2, y, z + h), (L, 0.06, 0.06), m)
    k.box(((x0 + x1) / 2, y, z + 0.1), (L, 0.04, 0.04), m)
    n = max(2, int(L / spacing))
    for i in range(n + 1):
        if not ends and i in (0, n):
            continue
        x = x0 + L * i / n
        k.bar((x, y, z + h / 2 + 0.05), bar, h - 0.05, m)
    # a little scroll in the middle: a lozenge
    if L > 1.4:
        k.box(((x0 + x1) / 2, y, z + h * 0.55), (0.3, 0.03, 0.3), m, rot=Matrix.Rotation(math.radians(45), 4, 'Y'))


def railing_side(k, y0, y1, x, z, h=0.95, spacing=0.25, m='iron'):
    """Railing running along y (for balcony returns)."""
    L = abs(y1 - y0)
    yc = (y0 + y1) / 2
    k.box((x, yc, z + h), (0.06, L, 0.06), m)
    n = max(1, int(L / spacing))
    for i in range(1, n + 1):
        y = y0 + (y1 - y0) * i / n
        k.bar((x, y, z + h / 2 + 0.05), 0.04, h - 0.05, m)


# ----------------------------------------------------------------- windows
def paris_window(k, x, z, w, h, surround='stone', mull='plaster', keystone=True, balconette=True):
    frame4(k, x, z, w, h, 0.16, 0.1, surround)
    k.box((x, -0.11, z - 0.2), (w + 0.5, 0.22, 0.1), surround)  # sill
    if keystone:
        k.box((x, -0.13, z + h + 0.12), (0.26, 0.14, 0.34), surround, taper=(1.35, 1))
        k.box((x, -0.08, z + h + 0.36), (w + 0.7, 0.16, 0.12), surround)  # hood moulding
    glass(k, x, z, w, h, 0.02)
    # french-window mullion + transom
    strip(k, x, z + h / 2, 0.07, h, -0.03, mull)
    strip(k, x, z + h * 0.72, w, 0.07, -0.031, mull)
    if balconette:
        railing(k, x - w / 2 - 0.12, x + w / 2 + 0.12, z - 0.15, -0.24, h=0.8, spacing=0.23)
        k.box((x, -0.14, z - 0.12), (w + 0.3, 0.26, 0.06), surround)


def med_window(k, x, z, w, h, shutter=None, frame='plaster', sill='terracotta', arched=False, bars=False):
    t = 0.14
    if arched:
        k.prism(arch_poly(w + 2 * t, h + t, 6, x, z - t), 0, -0.1, frame)
        k.prism(arch_poly(w, h, 6, x, z), -0.1, -0.13, win_mat(k))
    else:
        frame4(k, x, z, w, h, t, 0.16, frame)
        glass(k, x, z, w, h, 0.04)
        strip(k, x, z + h / 2, 0.06, h, -0.05, frame)
    k.box((x, -0.12, z - 0.07), (w + 0.36, 0.24, 0.1), sill, 0.02)
    if shutter:
        sw = w / 2 + 0.04
        for s in (-1, 1):
            cx = x + s * (w / 2 + t + sw / 2 + 0.02)
            k.box((cx, -0.04, z + h / 2), (sw, 0.06, h + 0.04), shutter)
            for zz in (0.25, 0.5, 0.75):  # louvre bands (darker lines read as slats)
                strip(k, cx, z + h * zz, sw * 0.82, 0.035, -0.072, 'ink')
    if bars:
        for i in range(3):
            k.bar((x - w / 2 + w * (i + 1) / 4, -0.17, z + h / 2), 0.04, h, 'iron')


def door(k, x, w, h, m='burgundy', surround='plaster', arched=True, z=0.0, step=True):
    if arched:
        k.prism(arch_poly(w + 0.36, h + 0.18, 8, x, z), 0, -0.12, surround)
        k.prism(arch_poly(w, h, 8, x, z), -0.12, -0.16, m)
        # transom glass: lit fanlight
        r = w / 2
        k.prism(arch_poly(w * 0.8, r * 0.8 + 0.02, 6, x, z + h - r * 0.8 - 0.02), -0.16, -0.17, win_mat(k))
    else:
        frame4(k, x, z, w, h, 0.15, 0.12, surround)
        k.box((x, -0.06, z + h / 2), (w, 0.08, h), m)
        k.box((x, -0.11, z + h * 0.55), (w * 0.7, 0.04, h * 0.5), m)
    if step:
        k.box((x, -0.35, z - 0.05), (w + 0.6, 0.7, 0.2), 'stone_dark', 0.02)


def awning(k, x, z, w, depth=1.3, drop=0.55, c1='mustard', c2='plaster', stripe=0.42, valance=0.28):
    n = max(2, round(w / stripe))
    sw = w / n
    ang = math.degrees(math.atan2(drop, depth))
    L = math.hypot(depth, drop)
    zb = z - drop
    for i in range(n):
        c = c1 if i % 2 == 0 else c2
        xa, xb = x - w / 2 + sw * i, x - w / 2 + sw * (i + 1)
        # sloped canvas (top + underside), then a scalloped valance (front + back)
        v = [(xa, 0, z), (xb, 0, z), (xb, -depth, zb), (xa, -depth, zb),
             (xa, -depth, zb - valance), (xb, -depth, zb - valance), ((xa + xb) / 2, -depth, zb - valance - 0.1)]
        k.poly_faces(v, [(0, 3, 2, 1), (0, 1, 2, 3), (3, 4, 6, 5, 2), (2, 5, 6, 4, 3)], c)
    # side cheeks
    for xs in (x - w / 2, x + w / 2):
        v = [(xs, 0, z), (xs, -depth, zb), (xs, -depth, zb - valance)]
        k.poly_faces(v, [(0, 1, 2), (0, 2, 1)], c1)


# ----------------------------------------------------------------- roofs
def hip_roof(k, x0, x1, y0, y1, z, rise, over=0.45, thick=0.16, m='terracotta', cap='terracotta_dark', hip=True,
             genoise=False):
    """Hip (or gable when hip=False) roof with real thickness and ridge caps.
    genoise: the Provençal stepped tile cornice under the eaves."""
    if genoise:
        k.slab(x0 - over * 0.62, x1 + over * 0.62, y0 - over * 0.62, y1 + over * 0.62, z - 0.14, z + 0.01, 'terracotta_dark', 0.02)
        k.slab(x0 - over * 0.32, x1 + over * 0.32, y0 - over * 0.32, y1 + over * 0.32, z - 0.3, z - 0.14, 'plaster_warm', 0.02)
    ax0, ax1, ay0, ay1 = x0 - over, x1 + over, y0 - over, y1 + over
    wx, wy = ax1 - ax0, ay1 - ay0
    along_x = wx >= wy
    cx, cy = (ax0 + ax1) / 2, (ay0 + ay1) / 2
    if hip:
        inset = min(wx, wy) / 2
        if along_x:
            r0, r1 = (ax0 + inset * 0.95, cy), (ax1 - inset * 0.95, cy)
        else:
            r0, r1 = (cx, ay0 + inset * 0.95), (cx, ay1 - inset * 0.95)
        pts = []
        for dz in (0, thick):
            pts += [(ax0, ay0, z + dz), (ax1, ay0, z + dz), (ax1, ay1, z + dz), (ax0, ay1, z + dz),
                    (r0[0], r0[1], z + rise + dz), (r1[0], r1[1], z + rise + dz)]
        k.hull(pts, m)
        # ridge + hip caps
        a = Vector((r0[0], r0[1], z + rise + thick)); b = Vector((r1[0], r1[1], z + rise + thick))
        _cap(k, a, b, cap)
        for corner, r in (((ax0, ay0), r0), ((ax1, ay0), r1 if along_x else r0), ((ax1, ay1), r1), ((ax0, ay1), r0 if along_x else r1)):
            _cap(k, Vector((corner[0], corner[1], z + thick)), Vector((r[0], r[1], z + rise + thick)), cap)
    else:
        if along_x:
            ridge = [(ax0, cy), (ax1, cy)]
        else:
            ridge = [(cx, ay0), (cx, ay1)]
        # gable: two slabs
        if along_x:
            for (ya, yb) in ((ay0, cy), (cy, ay1)):
                pts = []
                for dz in (0, thick):
                    pts += [(ax0, ya, z + dz + (rise if ya == cy else 0)), (ax1, ya, z + dz + (rise if ya == cy else 0)),
                            (ax0, yb, z + dz + (rise if yb == cy else 0)), (ax1, yb, z + dz + (rise if yb == cy else 0))]
                k.hull(pts, m)
        else:
            for (xa, xb) in ((ax0, cx), (cx, ax1)):
                pts = []
                for dz in (0, thick):
                    pts += [(xa, ay0, z + dz + (rise if xa == cx else 0)), (xa, ay1, z + dz + (rise if xa == cx else 0)),
                            (xb, ay0, z + dz + (rise if xb == cx else 0)), (xb, ay1, z + dz + (rise if xb == cx else 0))]
                k.hull(pts, m)
        a = Vector((ridge[0][0], ridge[0][1], z + rise + thick)); b = Vector((ridge[1][0], ridge[1][1], z + rise + thick))
        _cap(k, a, b, cap)


def _cap(k, a, b, m, r=0.11, seg=6):
    d = b - a
    L = d.length
    if L < 1e-3:
        return
    q = d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    k.cyl(tuple(a), r, r, L, seg, m, rot=q, phase=30)


def gable_wall(k, x0, x1, z, rise, y, thick, m):
    """Triangular gable infill in the XZ plane at y (for gable roofs along y)."""
    k.prism([(x0, z), (x1, z), ((x0 + x1) / 2, z + rise)], y - thick / 2, y + thick / 2, m)


def mansard(k, W, D, z, h1=3.0, h2=0.7, in1=0.9, in2=1.9, over=0.18, m='zinc', ribs=True):
    pts = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            pts += [(sx * (W / 2 + over), sy * (D / 2 + over), z),
                    (sx * (W / 2 - in1), sy * (D / 2 - in1), z + h1),
                    (sx * (W / 2 - in2), sy * (D / 2 - in2), z + h1 + h2)]
    k.hull(pts, m)
    # gutter / base band
    k.slab(-W / 2 - over - 0.08, W / 2 + over + 0.08, -D / 2 - over - 0.08, D / 2 + over + 0.08, z - 0.05, z + 0.18, 'zinc_dark')
    # crest band at the break line
    k.slab(-W / 2 + in1 - 0.06, W / 2 - in1 + 0.06, -D / 2 + in1 - 0.06, D / 2 - in1 + 0.06, z + h1 - 0.04, z + h1 + 0.1, 'zinc_dark')
    if ribs:
        ang = math.degrees(math.atan2(in1 + over, h1))
        L = math.hypot(in1 + over, h1)
        n = int(W / 0.9)
        for side, sgn in (('front', -1), ('back', 1)):
            for i in range(1, n):
                x = -W / 2 + W * i / n
                y = sgn * (D / 2 + over - (in1 + over) / 2)
                with k.frame(T(x * (1 - 0.5 * (in1 + over) / (W / 2 + over)), y, z + h1 / 2) @ RX(sgn * ang)):
                    k.bar((0, 0, 0), 0.08, L, 'zinc_dark')
    return z + h1 + h2


def dormer(k, x, z, w=1.15, h=1.5, depth=1.6, body='stone', cap='zinc_dark', style='gable', y_front=0.0):
    """Dormer in a front-roof frame: front face at y=y_front (outward -y)."""
    k.box((x, y_front + depth / 2, z + h / 2), (w + 0.3, depth, h), body, 0.03)
    if style == 'gable':
        k.prism([(x - w / 2 - 0.3, z + h), (x + w / 2 + 0.3, z + h), (x, z + h + 0.75)], y_front - 0.08, y_front + depth, cap)
    else:  # segmental hood
        r = (w + 0.6) / 2
        pts = [(x + r * math.cos(math.pi * i / 6), z + h + 0.55 * r * math.sin(math.pi * i / 6)) for i in range(7)]
        k.prism(pts, y_front - 0.08, y_front + depth, cap)
    with k.frame(T(0, y_front, 0)):
        glass(k, x, z + 0.15, w - 0.25, h - 0.3, 0.04)
        k.box((x, -0.05, z + 0.15 + (h - 0.3) / 2), (0.05, 0.03, h - 0.3), 'plaster')


def chimney(k, x, y, z, w=1.4, d=0.7, h=1.6, m='stone', pots=3):
    k.box((x, y, z + h / 2), (w, d, h), m, 0.03)
    k.box((x, y, z + h + 0.06), (w + 0.16, d + 0.16, 0.12), m)
    for i in range(pots):
        px = x - w / 2 + w * (i + 0.5) / pots
        k.cyl((px, y, z + h + 0.12), 0.13, 0.11, 0.45, 6, 'terracotta')


# ----------------------------------------------------------------- planting
def bougainvillea(k, x, y, z, width, drop, out=-1, density=1.0, leafy=0.35):
    """Cascade of magenta bracts draped down a wall from (x, z) in a facade frame."""
    r = k.rng
    n = int((14 + width * drop * 7) * density)
    # a wide crown along the top edge that splits into two or three hanging tongues
    nt = 1 + int(width / 1.3)
    tongues = [(x + (i + 0.5 - nt / 2) * width / nt + (r.random() - 0.5) * 0.4, 0.55 + r.random() * 0.45) for i in range(nt)]

    def spot(depth_bias):
        tx, tl = tongues[r.randrange(nt)]
        v = r.random() ** depth_bias
        u = r.random() - 0.5
        px = (x + u * width) * (1 - v) + (tx + u * 0.7) * v
        pz = z - v * drop * tl + (0.25 if v < 0.15 else 0) * r.random()
        return px, pz, v

    for i in range(max(3, int(n * leafy))):  # leaves: a flat dark mass hugging the wall
        px, pz, v = spot(1.1)
        s = 0.34 - 0.12 * v
        k.ico((px, y + out * 0.1, pz), (s * 1.2, 0.12, s), 'leaf', sub=0, jitter=0.3, rot=RY(r.random() * 360))
    for i in range(n):  # bracts: small, flattened, two magentas
        px, pz, v = spot(1.25)
        s = (0.13 + r.random() * 0.11) * (1.05 - 0.35 * v)
        m = 'magenta' if r.random() < 0.6 else 'magenta_light'
        k.ico((px, y + out * (0.2 + 0.14 * (1 - v) + r.random() * 0.08), pz), (s, s * 0.55, s * 0.85), m, sub=0,
              jitter=0.3, rot=RY(r.random() * 360))


def balustrade(k, x0, y0, x1, y1, z, m='plaster', spacing=0.32, h=0.92):
    """Turned balusters (two 6-sided cones) under a handrail, from (x0,y0) to (x1,y1) at height z."""
    L = math.hypot(x1 - x0, y1 - y0)
    n = max(1, int(L / spacing))
    for i in range(n + 1):
        t = i / n
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        k.cyl((x, y, z), 0.07, 0.11, h * 0.33, 6, m)
        k.cyl((x, y, z + h * 0.33), 0.11, 0.06, h * 0.52, 6, m)
    k.slab(min(x0, x1) - 0.1, max(x0, x1) + 0.1, min(y0, y1) - 0.1, max(y0, y1) + 0.1, z + h * 0.85, z + h, m, 0.03)


def bench(k, x, y, z, rotz=0, m='wood'):
    with k.frame(T(x, y, z) @ Rz(rotz)):
        for i in range(3):
            k.box((0, -0.18 + i * 0.16, 0.45), (1.6, 0.12, 0.05), m)
        for i in range(2):
            k.box((0, 0.2, 0.62 + i * 0.16), (1.6, 0.04, 0.1), m)
        for sx in (-0.7, 0.7):
            k.box((sx, 0, 0.22), (0.06, 0.5, 0.44), 'iron')
            k.box((sx, 0.21, 0.6), (0.06, 0.05, 0.4), 'iron')


def planter(k, x, y, z, m='terracotta', plant='leaf', s=1.0):
    k.cyl((x, y, z), 0.22 * s, 0.3 * s, 0.45 * s, 8, m)
    k.ico((x, y, z + 0.7 * s), (0.36 * s, 0.36 * s, 0.42 * s), plant, sub=1, jitter=0.25)
