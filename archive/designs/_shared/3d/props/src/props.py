import sys, os, math, random, json
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
from mathutils import Vector, Matrix
from lib import *
import lib

OUT = sys.argv[sys.argv.index('--') + 1]
ONLY = sys.argv[sys.argv.index('--') + 2:] if len(sys.argv) > sys.argv.index('--') + 2 else []
os.makedirs(OUT, exist_ok=True)
PI = math.pi

for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
atlas = make_atlas(os.path.join(OUT, 'palette.png'))
palette_mat(atlas)
EM_LAMP = emissive_mat('emissive_lamp', base='#3a3448', glow='#ffc979')
EM_STRING = emissive_mat('emissive_string', base='#4a4250', glow='#ffd28a')
EM_WIN = emissive_mat('emissive_window_warm', base='#3b4670', glow='#ffffff', rough=0.25, emit_image=window_glow())

def mesh(name, verts, faces, color='plaster', mat=None, grad=True, smooth=0):
    bm = bmesh.new(); V = [bm.verts.new(v) for v in verts]
    for f in faces:
        try: bm.faces.new([V[i] for i in f])
        except ValueError: pass
    return lib._obj(name, bm, mat, color, grad, smooth)

def paint_faces(ob, fn):
    me = ob.data; uv = me.uv_layers[0].data
    zs = [v.co.z for v in me.vertices]; z0, z1 = min(zs), max(zs); dz = max(z1 - z0, 1e-6)
    for p in me.polygons:
        c = fn(p); i = IDX[c]; cx, cy = i % GRID, i // GRID
        for li in p.loop_indices:
            z = me.vertices[me.loops[li].vertex_index].co.z
            uv[li].uv = ((cx + .5) / GRID, (cy + .1 + .8 * (z - z0) / dz) / GRID)

RESULTS = {}
def want(n): return not ONLY or n in ONLY
def done(name, nodes, emissive=(), notes='', extras=None):
    tris = finish(name, nodes, os.path.join(OUT, name + '.glb'), extras)
    RESULTS[name] = dict(tris=tris, emissive=list(emissive), notes=notes)
    print('BUILT', name, tris)

# ---------------------------------------------------------------- street lamps
def lamp_paris():
    begin('lamp_paris'); P = []
    P.append(lathe('base', [(.24, 0), (.24, .1), (.2, .14), (.17, .44), (.21, .48), (.13, .58), (.1, .92), (.075, 1.0)], seg=8, color='iron'))
    P.append(lathe('shaft', [(.075, 1.0), (.056, 3.05)], seg=8, color='iron', cap_top=False, cap_bot=False))
    P.append(lathe('collar', [(.06, 3.04), (.1, 3.1), (.1, 3.16), (.07, 3.2), (.07, 3.27), (.12, 3.31), (.12, 3.34), (0, 3.34)], seg=8, color='iron', cap_bot=False))
    for k in range(4):  # scroll brackets
        a = k * PI / 2 + PI / 4; c, s = math.cos(a), math.sin(a)
        pts = [(.06 * c, .06 * s, 3.0), (.16 * c, .16 * s, 3.02), (.22 * c, .22 * s, 3.1), (.21 * c, .21 * s, 3.2), (.15 * c, .15 * s, 3.24), (.13 * c, .13 * s, 3.3)]
        P.append(tube('scroll', pts, .014, 4, 'iron'))
    for k in range(4):  # lantern corner posts
        a = (k + .5) / 4 * 2 * PI; c, s = math.cos(a), math.sin(a)
        P.append(tube('post', [(.125 * c, .125 * s, 3.33), (.215 * c, .215 * s, 3.84)], .014, 4, 'iron'))
    P.append(lathe('roof', [(.27, 3.82), (.28, 3.86), (.2, 3.95), (.07, 4.07), (.05, 4.1)], seg=4, color='iron'))
    P.append(lathe('finial', [(.05, 4.1), (.035, 4.14), (.06, 4.18), (.03, 4.24), (0, 4.32)], seg=6, color='gold'))
    glass = lathe('lamp', [(.12, 3.34), (.21, 3.83)], seg=4, mat=EM_LAMP, color=None)
    done('lamp_paris', {'post': P, 'lamp': glass}, ['emissive_lamp'], 'Parisian cast-iron candelabra, 4.3 m. Lantern glass is node "lamp".')

def lamp_riviera():
    begin('lamp_riviera'); P = []
    P.append(lathe('plinth', [(.24, 0), (.24, .32), (.2, .36), (.2, .4)], seg=4, color='stone'))
    P.append(lathe('post', [(.075, .4), (.07, .55), (.05, .62), (.042, 3.5)], seg=8, color='ink', cap_top=False))
    pts = []
    for i in range(13):
        t = i / 12; a = t * PI * 0.92
        pts.append((.32 - .32 * math.cos(a) + .25 * t * t, 0, 3.45 + .42 * math.sin(a) + (.0 if t < .7 else -.2 * (t - .7))))
    pts.insert(0, (0, 0, 3.3))
    P.append(tube('neck', pts, .035, 6, 'ink', smooth=50))
    tip = pts[-1]; x = tip[0]; z = tip[2]
    P.append(lathe('cap', [(.05, z - .02), (.04, z + .02), (0, z + .05)], seg=6, loc=(x, 0, 0), color='ink'))
    P.append(lathe('shade', [(.25, z - .3), (.27, z - .27), (.2, z - .16), (.08, z - .05), (.05, z - .02)], seg=10, loc=(x, 0, 0), color='mustard', cap_bot=False, cap_top=False))
    P.append(lathe('shade_in', [(.05, z - .03), (.25, z - .3)], seg=10, loc=(x, 0, 0), color='mustard_dk', cap_bot=False, cap_top=False))
    bulb = lathe('lamp', [(.2, z - .29), (.14, z - .36), (0, z - .39)], seg=10, loc=(x, 0, 0), mat=EM_LAMP, color=None, cap_top=True)
    done('lamp_riviera', {'post': P, 'lamp': bulb}, ['emissive_lamp'], 'Swan-neck coast-road lamp with a mustard shade, 3.9 m, arm reaches +X.')

# ---------------------------------------------------------------- café
def table_parts(ox=0, oy=0):
    P = []
    P.append(lathe('top', [(0, .715), (.33, .715), (.35, .73), (.35, .755), (0, .76)], seg=12, loc=(ox, oy, 0), color='white', cap_bot=False, cap_top=False))
    P.append(lathe('rim', [(.355, .725), (.355, .745)], seg=12, loc=(ox, oy, 0), color='gold', cap_bot=False, cap_top=False))
    P.append(lathe('stem', [(.05, .06), (.03, .1), (.025, .66), (.06, .7), (.08, .715)], seg=6, loc=(ox, oy, 0), color='iron'))
    for k in range(3):
        a = k * 2 * PI / 3; c, s = math.cos(a), math.sin(a)
        P.append(tube('foot', [(ox + .02 * c, oy + .02 * s, .1), (ox + .16 * c, oy + .16 * s, .05), (ox + .26 * c, oy + .26 * s, .0), (ox + .29 * c, oy + .29 * s, .02)], .018, 4, 'iron'))
    return P

def chair_parts(M):
    P = []
    P.append(lathe('seat', [(0, .44), (.19, .44), (.21, .455), (.21, .475), (0, .48)], seg=10, color='powder', M=M, cap_bot=False, cap_top=False))
    P.append(lathe('seatrim', [(.215, .44), (.215, .47)], seg=10, color='wood', M=M, cap_bot=False, cap_top=False))
    for sx in (-1, 1):
        P.append(tube('legf', [(sx * .15, -.14, .45), (sx * .2, -.2, 0)], .017, 5, 'wood', M=M))
        P.append(tube('legb', [(sx * .2, .21, 0), (sx * .16, .16, .45), (sx * .16, .19, .7), (sx * .155, .22, .86)], .017, 5, 'wood', M=M))
    hoop = [(.155 * math.cos(a), .22 + .07 * math.sin(a), .86) for a in [PI * t / 8 for t in range(9)]]
    hoop = [(-p[0], p[1], p[2]) for p in hoop]
    P.append(tube('hoop', hoop, .02, 5, 'wood', M=M, cap=False))
    P.append(tube('rail', [(p[0], p[1] - .02, .68) for p in hoop], .014, 4, 'wood', M=M, cap=False))
    # woven back band
    band = [(p[0] * .97, p[1] - .01, .78) for p in hoop]
    bm = bmesh.new()
    for off in (0, .012):
        top = [bm.verts.new((x, y + off, z + .06)) for x, y, z in band]; bot = [bm.verts.new((x, y + off, z - .06)) for x, y, z in band]
        for i in range(len(band) - 1):
            bm.faces.new((bot[i], bot[i + 1], top[i + 1], top[i]) if off else (top[i], top[i + 1], bot[i + 1], bot[i]))
    if M: xf(bm, M)
    P.append(lib._obj('band', bm, None, 'powder', True, 0))
    # ring stretcher
    P.append(lathe('ring', [(.17, .2), (.17, .215)], seg=8, M=M, color='wood', cap_bot=False, cap_top=False))
    return P

def cafe_table():
    begin('cafe_table'); done('cafe_table', {'cafe_table': table_parts()}, [], 'Round bistro table, marble top, 0.76 m.')

def cafe_chair():
    begin('cafe_chair'); done('cafe_chair', {'cafe_chair': chair_parts(None)}, [], 'Bistro chair, faces -Z (seat front toward viewer).')

def cafe_set():
    begin('cafe_set'); P = table_parts()
    P += chair_parts(MT((-.62, -.15, 0), (0, 0, -PI / 2 + .3)))
    P += chair_parts(MT((.62, .1, 0), (0, 0, PI / 2 + .2)))
    done('cafe_set', {'cafe_set': P}, [], 'Table with two chairs, footprint 1.6 x 0.8 m.')

# ---------------------------------------------------------------- parasol
def parasol_parts(open_=True, colors=('pink', 'plaster'), h=2.45, R=1.3):
    P = []
    P.append(lathe('base', [(.24, 0), (.24, .05), (.1, .1), (.05, .18)], seg=8, color='iron'))
    P.append(lathe('pole', [(.025, .18), (.025, h + .1)], seg=6, color='wood', cap_bot=False))
    P.append(lathe('knob', [(.0, h + .08), (.04, h + .12), (.03, h + .18), (0, h + .2)], seg=6, color='wood'))
    n = 8
    if open_:
        apex = (0, 0, h + .1)
        for k in range(n):
            a0 = k / n * 2 * PI; a1 = (k + 1) / n * 2 * PI
            def ring(r, z, a): return (r * math.cos(a), r * math.sin(a), z)
            m0, m1 = ring(R * .5, h - .07, a0), ring(R * .5, h - .07, a1)
            r0, r1 = ring(R, h - .42, a0), ring(R, h - .42, a1)
            mm = ring(R * .48, h - .1, (a0 + a1) / 2)
            rm = ring(R * .93, h - .4, (a0 + a1) / 2)
            v0, v1 = ring(R, h - .56, a0 + (a1 - a0) * .25), ring(R, h - .56, a0 + (a1 - a0) * .75)
            vm = ring(R * .985, h - .44, (a0 + a1) / 2)
            col = colors[k % 2]
            verts = [apex, m0, mm, m1, r0, rm, r1, v0, v1, vm]
            top = [(0, 1, 2), (0, 2, 3), (1, 4, 5, 2), (2, 5, 6, 3)]
            vals = [(4, 7, 9, 5), (5, 9, 8, 6)]
            ob = mesh('panel', verts, top + vals, col, grad=False)
            P.append(ob)
            under = [tuple(v[:2]) + (v[2] - .02,) for v in verts]
            P.append(mesh('under', under, [tuple(reversed(f)) for f in top + vals], col, grad=False))
            P.append(tube('rib', [(0, 0, h - .2), ring(R * .55, h - .1, a0), ring(R * .98, h - .43, a0)], .008, 3, 'wood', cap=False))
    else:
        P.append(lathe('furled', [(.04, h - 1.2), (.11, h - .7), (.09, h - .2), (.03, h + .05)], seg=8, color=colors[0], smooth=0))
        P.append(lathe('tie', [(.112, h - .62), (.112, h - .56)], seg=8, color=colors[1], cap_bot=False, cap_top=False))
    return P

def parasol():
    begin('parasol'); done('parasol', {'parasol': parasol_parts()}, [], 'Open striped café parasol, 2.6 m tall, 2.6 m across.')
def parasol_mustard():
    begin('parasol_mustard'); done('parasol_mustard', {'parasol': parasol_parts(colors=('mustard', 'white'))}, [], 'Open parasol, mustard and white stripes.')
def parasol_closed():
    begin('parasol_closed'); done('parasol_closed', {'parasol': parasol_parts(open_=False)}, [], 'Furled parasol.')

# ---------------------------------------------------------------- bench
def bench():
    begin('bench'); P = []
    side = [(-.26, 0), (-.18, 0), (-.14, .36), (.12, .36), (.17, 0), (.25, 0), (.2, .4), (.3, .84), (.24, .86), (.15, .46), (-.25, .46), (-.27, .42)]
    for x in (-.78, .78):
        P.append(prism('side', side, .05, loc=(x, 0, 0), rot=(0, 0, PI / 2), color='iron'))
    for i in range(4):
        y = -.2 + i * .1
        P.append(box('slat', (1.8, .085, .035), loc=(0, y, .46), color='wood', bevel=.008))
    th = math.atan2(.12, .37)
    for t in (.32, .57, .82):
        y = .15 + .12 * t - .035; z = .48 + .37 * t
        P.append(box('back', (1.8, .03, .09), loc=(0, y, z - .045), rot=(-th, 0, 0), color='wood', bevel=.008))
    done('bench', {'bench': P}, [], 'Promenade bench, 1.8 m, faces +Z.')

# ---------------------------------------------------------------- planters
def planter_pot():
    begin('planter_pot'); P = []
    P.append(lathe('pot', [(.2, 0), (.29, .46), (.33, .48), (.34, .5), (.34, .6), (.3, .61), (.29, .56)], seg=10, color='terracotta', cap_top=False))
    P.append(lathe('soil', [(.29, .56), (0, .57)], seg=10, color='bark', cap_bot=False))
    P.append(tube('stem', [(0, 0, .55), (.02, 0, 1.0), (-.01, .01, 1.35)], [.035, .03, .025], 5, 'bark'))
    for i, (p, r) in enumerate([((0, 0, 1.58), .42), ((.16, -.1, 1.45), .3), ((-.15, .08, 1.7), .28)]):
        P.append(blob('crown', r, p, (1, 1, .9), 'leaf' if i != 1 else 'palm', .15, seed=i + 3))
    rnd = random.Random(7)
    for i in range(7):
        a = rnd.uniform(0, 2 * PI); el = rnd.uniform(-.5, .7)
        p = (.4 * math.cos(a) * math.cos(el), .4 * math.sin(a) * math.cos(el), 1.58 + .36 * math.sin(el))
        P.append(blob('lemon', .055, p, (1, 1, 1.25), 'lemon', .05, seed=i, subdiv=0))
    done('planter_pot', {'planter_pot': P}, [], 'Terracotta pot with a little lemon tree, 2.0 m.')

def planter_versailles():
    begin('planter_versailles'); P = []
    w = .72; h = .7
    for sx in (-1, 1):
        for sy in (-1, 1):
            P.append(box('leg', (.08, .08, h + .06), loc=(sx * (w / 2 - .04), sy * (w / 2 - .04), 0), color='ink', bevel=.01))
            P.append(blob('ball', .055, (sx * (w / 2 - .04), sy * (w / 2 - .04), h + .12), color='gold', subdiv=1, jitter=0))
    P.append(box('panel', (w - .06, w - .06, h - .1), loc=(0, 0, .06), color='white'))
    for a in range(4):
        P.append(box('rail', (w - .1, .03, .05), loc=(0, -(w / 2 - .03), h - .08), rot=(0, 0, a * PI / 2), color='ink'))
        P.append(box('rail', (w - .1, .03, .05), loc=(0, -(w / 2 - .03), .08), rot=(0, 0, a * PI / 2), color='ink'))
    # the soil stands 8 mm proud of the panel's top (.66): level with it, the two tops z-fought
    P.append(box('soil', (w - .1, w - .1, .02), loc=(0, 0, h - .052), color='bark'))
    P.append(tube('stem', [(0, 0, h - .05), (0, 0, 1.45)], .035, 5, 'bark'))
    P.append(blob('topiary', .48, (0, 0, 1.75), color='cypress_lt', jitter=.04, subdiv=2, seed=2))
    done('planter_versailles', {'planter_versailles': P}, [], 'Versailles planter box with a clipped ball tree, 2.2 m.')

def planter_box():
    begin('planter_box'); P = []
    P.append(box('box', (1.3, .42, .42), color='terracotta', bevel=.015))
    P.append(box('lip', (1.36, .48, .05), loc=(0, 0, .4), color='terracotta_dk', bevel=.01))
    P.append(box('soil', (1.24, .36, .02), loc=(0, 0, .42), color='bark'))
    rnd = random.Random(4)
    for i in range(5):
        P.append(blob('bush', .22, (-.5 + i * .25, rnd.uniform(-.04, .04), .5), (1.1, .8, .7), 'leaf', .2, seed=i))
    for i in range(26):
        x = rnd.uniform(-.58, .58); y = rnd.uniform(-.13, .13); hgt = rnd.uniform(.38, .62)
        lean = (rnd.uniform(-.08, .08), rnd.uniform(-.05, .05))
        P.append(tube('stalk', [(x, y, .5), (x + lean[0], y + lean[1], .5 + hgt * .7)], .006, 3, 'leaf', cap=False))
        P.append(lathe('spike', [(0, 0), (.028, .05), (.022, .16), (0, .2)], seg=4, loc=(x + lean[0], y + lean[1], .5 + hgt * .7), color='lavender', grad=True))
    done('planter_box', {'planter_box': P}, [], 'Long terracotta trough of lavender, 1.3 m.')

# ---------------------------------------------------------------- trees
def flame(name, H, R, seed, color, base=(0, 0, 0), seg=7, rings=10):
    rnd = random.Random(seed); prof = []
    bm = bmesh.new(); R_ = []
    for i in range(rings + 1):
        t = i / rings
        r = R * (math.sin(PI * min(1, (.06 + .94 * t) ** .75)) ** .85) * (1 + rnd.uniform(-.08, .08)) if i < rings else 0
        z = H * t; ph = rnd.uniform(0, 1)
        cx = base[0] + .04 * H * math.sin(t * 3 + seed) * t; cy = base[1] + .03 * H * math.cos(t * 2.3 + seed) * t
        if r <= 0: R_.append([bm.verts.new((cx, cy, base[2] + z))]); continue
        R_.append([bm.verts.new((cx + r * math.cos((k + ph) / seg * 2 * PI), cy + r * math.sin((k + ph) / seg * 2 * PI), base[2] + z + rnd.uniform(-.05, .05) * H / rings)) for k in range(seg)])
    for A, B in zip(R_, R_[1:]):
        for k in range(seg):
            if len(B) == 1: bm.faces.new((A[k], A[(k + 1) % seg], B[0]))
            else: bm.faces.new((A[k], A[(k + 1) % seg], B[(k + 1) % seg], B[k]))
    bm.faces.new(list(reversed(R_[0])))
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return lib._obj(name, bm, None, color, True, 0)

def cypress(name='cypress', H=7.0, seed=1):
    begin(name); P = []
    P.append(lathe('trunk', [(.14, 0), (.1, .5)], seg=6, color='bark'))
    P.append(flame('flame', H - .3, .62 * H / 7, seed, 'cypress', (0, 0, .3)))
    P.append(flame('lobe', (H - .3) * .72, .42 * H / 7, seed + 5, 'cypress_lt', (.2 * H / 7, -.14 * H / 7, .45)))
    P.append(flame('lobe', (H - .3) * .55, .36 * H / 7, seed + 9, 'cypress', (-.18 * H / 7, .1 * H / 7, .5)))
    done(name, {name: P}, [], f'Italian cypress, {H:g} m. Flat-shaded flame with two offset lobes.')

def palm(name='palm', H=6.2, seed=2, lean=.9):
    begin(name); P = []; rnd = random.Random(seed)
    N = 16; pts = []; rs = []
    for i in range(N + 1):
        t = i / N
        pts.append((lean * t * t, .15 * math.sin(t * 2.4), H * t))
        rs.append((.22 - .09 * t) * (1.1 if i % 2 else .93))
    P.append(tube('trunk', pts, rs, 6, 'bark_lt', twist=.35))
    top = Vector(pts[-1])
    P.append(lathe('boot', [(.16, 0), (.2, .18), (.12, .36), (0, .42)], seg=6, loc=top - Vector((0, 0, .2)), color='bark'))
    for i in range(3):
        a = i * 2.1
        P.append(blob('nut', .1, top + Vector((.15 * math.cos(a), .15 * math.sin(a), -.12)), color='bark', subdiv=0, seed=i))
    nf = 11
    for f in range(nf):
        a = f / nf * 2 * PI + rnd.uniform(-.15, .15)
        d = Vector((math.cos(a), math.sin(a), 0)); side = Vector((-d.y, d.x, 0))
        L = rnd.uniform(2.1, 2.7); rise = rnd.uniform(.4, .9); droop = rnd.uniform(1.6, 2.4)
        S = 8; up = []; dn = []
        rows = []
        for s in range(S + 1):
            u = s / S
            c = top + Vector((0, 0, .15)) + d * (L * u) + Vector((0, 0, rise * u - droop * u * u))
            w = .36 * math.sin(PI * min(1, u ** .7)) if s < S else 0
            rows.append((c + Vector((0, 0, .07 * (w > 0))), c + side * w - Vector((0, 0, .06)), c - side * w - Vector((0, 0, .06))))
        verts = []; faces = []; faces_b = []
        for (cc, l, r) in rows: verts += [tuple(cc), tuple(l), tuple(r)]
        for s in range(S):
            i0 = s * 3; i1 = (s + 1) * 3
            faces.append((i0, i0 + 1, i1 + 1, i1)); faces.append((i0 + 2, i0, i1, i1 + 2))
        P.append(mesh('frond', verts, faces, 'palm' if f % 2 else 'palm_dk', grad=False))
        vb = [(x, y, z - .025) for x, y, z in verts]
        P.append(mesh('frond_b', vb, [tuple(reversed(q)) for q in faces], 'palm_dk', grad=False))
    done(name, {name: P}, [], f'Canary/date palm, {H:g} m, trunk leans +X.')

def olive(name='olive', seed=3):
    begin(name); P = []; rnd = random.Random(seed)
    P.append(tube('trunk', [(0, 0, -.05), (.06, .02, .5), (-.04, .05, .95), (.05, 0, 1.25)], [.2, .17, .15, .13], 6, 'bark', twist=.6))
    for k, (dx, dy, dz) in enumerate([(.7, .2, 1.0), (-.6, .35, 1.1), (.1, -.65, 1.05), (-.2, -.1, 1.35)]):
        P.append(tube('branch', [(.05, 0, 1.2), (.05 + dx * .5, dy * .5, 1.2 + dz * .5), (.05 + dx, dy, 1.2 + dz)], [.11, .07, .04], 5, 'bark_lt'))
    spots = [(.7, .2, 2.25, .6), (-.6, .35, 2.35, .6), (.1, -.65, 2.25, .55), (-.1, .05, 2.75, .62), (.5, -.4, 2.6, .48), (-.55, -.4, 2.1, .45), (.25, .65, 2.5, .48), (-.3, .7, 2.0, .4), (.95, -.1, 2.0, .38)]
    for i, (x, y, z, r) in enumerate(spots):
        P.append(blob('canopy', r, (x, y, z), (1.05, 1.05, .72), 'olive_leaf' if i % 3 else 'olive_lt', .07, seed=seed * 10 + i))
    done(name, {name: P}, [], 'Olive tree, 3.3 m, silvery canopy over a twisted trunk.')

# ---------------------------------------------------------------- bougainvillea
FLOWERS = ['magenta', 'rose', 'magenta_dk', 'magenta']
def bloom(P, rnd, n, fx, fz, fy, rr, seed0):
    """scatter n flower clusters; fx/fz/fy draw a position, rr a radius"""
    for i in range(n):
        x, z = fx(), fz(); r = rr()
        P.append(blob('flowers', r, (x, fy(x, z), z), (1.15, .7, .9), FLOWERS[rnd.randrange(4)], .2, seed=seed0 + i, subdiv=2 if r > .27 else 1))

def bougainvillea_wall():
    begin('bougainvillea_wall'); P = []; rnd = random.Random(11)
    P.append(tube('trunk', [(.35, -.07, 0), (.25, -.1, .5), (.38, -.12, 1.0), (.1, -.14, 1.5)], [.07, .06, .05, .03], 5, 'bark', twist=.5))
    for k, (x, z, r) in enumerate([(-.75, 1.75, .55), (.05, 2.0, .6), (.8, 1.7, .55), (-.4, 1.15, .5), (.45, 1.05, .5), (1.15, 1.0, .4), (-1.1, 1.05, .4)]):
        P.append(blob('leaves', r, (x, -.2, z), (1.15, .5, .8), 'leaf' if k % 2 else 'palm_dk', .15, seed=k + 40))
    def fx(): return rnd.uniform(-1.3, 1.35)
    def fz(): return 2.35 - 1.9 * rnd.random() ** 1.4
    def fy(x, z): return -.36 - .06 * rnd.random()
    bloom(P, rnd, 22, fx, fz, fy, lambda: rnd.uniform(.17, .34), 20)
    # a few trailing sprays below the mass
    for i in range(5):
        x = rnd.uniform(-.9, 1.2); z = rnd.uniform(.35, .75)
        P.append(blob('flowers', rnd.uniform(.12, .18), (x, -.3, z), (1, .7, 1.2), FLOWERS[i % 4], .2, seed=90 + i, subdiv=1))
    done('bougainvillea_wall', {'bougainvillea_wall': P}, [], 'Bougainvillea climbing a wall: 2.8 m wide, 2.6 m tall, back at z=0, grows toward +Z.')

def bougainvillea_spill():
    begin('bougainvillea_spill'); P = []; rnd = random.Random(5)
    for k, (x, z, r) in enumerate([(-.7, .1, .5), (.1, .15, .55), (.85, .05, .5), (-.3, -.55, .45), (.5, -.6, .42), (.1, -1.15, .35)]):
        P.append(blob('leaves', r, (x, -.18 if z < 0 else .0, z), (1.15, .55, .85), 'leaf' if k % 2 else 'palm_dk', .15, seed=k + 80))
    def fx(): return rnd.uniform(-1.2, 1.3)
    def fz(): return .45 - 2.1 * rnd.random() ** 1.6
    def fy(x, z): return (-.34 if z < .1 else -.2) - .05 * rnd.random()
    bloom(P, rnd, 22, fx, fz, fy, lambda: rnd.uniform(.16, .32), 60)
    done('bougainvillea_spill', {'bougainvillea_spill': P}, [], 'Bougainvillea spilling over a wall top: origin on the wall-top edge, hangs ~1.8 m down the +Z face.')

def bougainvillea_bush():
    begin('bougainvillea_bush'); P = []; rnd = random.Random(9)
    P.append(tube('stem', [(0, 0, 0), (.05, 0, .45)], .06, 5, 'bark'))
    for k, (x, y, z, r) in enumerate([(0, 0, .85, .6), (.45, .15, .7, .42), (-.4, .2, .75, .42), (.1, -.4, .75, .4), (0, .1, 1.25, .45)]):
        P.append(blob('leaves', r, (x, y, z), (1, 1, .85), 'leaf' if k % 2 else 'palm_dk', .15, seed=k + 100))
    for i in range(16):
        a = rnd.uniform(0, 2 * PI); el = rnd.uniform(-.2, 1.2); R = .62
        p = (R * math.cos(a) * math.cos(el), R * math.sin(a) * math.cos(el), .9 + .55 * math.sin(el))
        r = rnd.uniform(.16, .3)
        P.append(blob('flowers', r, p, (1, 1, .85), FLOWERS[i % 4], .2, seed=110 + i, subdiv=2 if r > .27 else 1))
    done('bougainvillea_bush', {'bougainvillea_bush': P}, [], 'Free-standing bougainvillea mound, 1.7 m.')

# ---------------------------------------------------------------- fountain
def fountain():
    begin('fountain'); P = []; W = []
    P.append(lathe('basin', [(1.55, 0), (1.55, .1), (1.46, .14), (1.46, .5), (1.56, .55), (1.56, .64), (1.32, .66), (1.32, .44)], seg=8, color='stone', cap_top=False, phase=0))
    P.append(lathe('column', [(.32, .44), (.3, .6), (.16, .72), (.12, 1.0), (.14, 1.18), (.22, 1.3)], seg=8, color='stone', cap_bot=False, cap_top=False, phase=0))
    P.append(lathe('bowl1', [(.22, 1.3), (.6, 1.38), (.85, 1.5), (.88, 1.58), (.78, 1.58), (.7, 1.52)], seg=12, color='stone', cap_bot=False, cap_top=False))
    P.append(lathe('column2', [(.12, 1.52), (.08, 1.7), (.07, 1.95), (.12, 2.02)], seg=8, color='stone', cap_bot=False, cap_top=False))
    P.append(lathe('bowl2', [(.12, 2.02), (.38, 2.1), (.44, 2.18), (.36, 2.18), (.3, 2.14)], seg=10, color='stone', cap_bot=False, cap_top=False))
    P.append(lathe('finial', [(.06, 2.12), (.09, 2.22), (.06, 2.32), (.02, 2.4), (0, 2.42)], seg=6, color='stone_dk'))
    W.append(lathe('pool', [(1.33, .5), (0, .5)], seg=8, color='water', cap_top=False, cap_bot=False, phase=0, grad=False))
    W.append(lathe('pool1', [(.79, 1.54), (0, 1.54)], seg=12, color='water', cap_top=False, cap_bot=False, grad=False))
    W.append(lathe('pool2', [(.37, 2.15), (0, 2.15)], seg=10, color='water', cap_top=False, cap_bot=False, grad=False))
    for k in range(8):
        a = (k + .5) / 8 * 2 * PI; c, s = math.cos(a), math.sin(a)
        W.append(tube('fall', [(.87 * c, .87 * s, 1.56), (.97 * c, .97 * s, 1.4), (1.04 * c, 1.04 * s, 1.0), (1.07 * c, 1.07 * s, .5)], [.03, .035, .04, .05], 4, 'water_lt'))
    for k in range(6):
        a = k / 6 * 2 * PI; c, s = math.cos(a), math.sin(a)
        W.append(tube('fall', [(.43 * c, .43 * s, 2.16), (.5 * c, .5 * s, 2.0), (.55 * c, .55 * s, 1.55)], [.02, .025, .03], 4, 'water_lt'))
    W.append(lathe('jet', [(.05, 2.38), (.03, 2.7), (0, 2.82)], seg=5, color='water_lt'))
    done('fountain', {'fountain': P, 'water': W}, [], 'Tiered stone fountain, 3.1 m across, 2.8 m tall. Water is its own node "water" for shimmer/animation.')

# ---------------------------------------------------------------- kiosk
def kiosk():
    begin('kiosk'); P = []; G = []
    P.append(lathe('plinth', [(1.05, 0), (1.05, .15), (.98, .18)], seg=8, color='stone'))
    body = lathe('body', [(.95, .18), (.95, .5), (.92, .52), (.92, 2.4)], seg=8, color='ink', cap_top=False, cap_bot=False)
    P.append(body)
    # posters on 6 of 8 faces (the front -Y face holds the window)
    cols = ['pink', 'mustard', 'powder', 'coral', 'mint', 'plaster', 'magenta']
    for k in range(8):
        a = k / 8 * 2 * PI  # face centres (verts sit at (k+.5)/8)
        if abs(math.cos(a - (-PI / 2))) > .95: continue
        r = .92 * math.cos(PI / 8) + .012
        c, s = math.cos(a), math.sin(a)
        P.append(box('poster', (.58, .02, .78), loc=(r * c, r * s, 1.25), rot=(0, 0, a + PI / 2), color=cols[k % len(cols)], grad=False))
        P.append(box('poster2', (.58, .02, .36), loc=(r * c, r * s, .7), rot=(0, 0, a + PI / 2), color=cols[(k + 3) % len(cols)], grad=False))
    a = -PI / 2; r = .92 * math.cos(PI / 8)
    G.append(quad('window', .6, .75, loc=(0, -r - .01, 1.5), mat=EM_WIN))
    P.append(box('counter', (.7, .22, .05), loc=(0, -r - .1, 1.08), color='wood'))
    P.append(box('awning', (.72, .3, .03), loc=(0, -r - .14, 1.93), rot=(.35, 0, 0), color='mustard'))
    P.append(lathe('cornice', [(.92, 2.4), (1.05, 2.46), (1.05, 2.56), (1.0, 2.58)], seg=8, color='ink', cap_bot=False, cap_top=False))
    P.append(lathe('band', [(1.0, 2.58), (1.0, 2.82)], seg=8, color='mustard', cap_bot=False, cap_top=False))
    P.append(lathe('roof', [(1.0, 2.82), (1.22, 2.86), (1.25, 2.92), (1.05, 3.18), (.62, 3.45), (.28, 3.6), (.14, 3.66)], seg=8, color='zinc', cap_bot=True))
    P.append(lathe('finial', [(.14, 3.66), (.08, 3.72), (.1, 3.82), (.03, 3.9), (.05, 3.98), (0, 4.1)], seg=6, color='gold'))
    for k in range(8):  # scalloped valance under the roof edge
        a0 = (k + .5) / 8 * 2 * PI; a1 = (k + 1.5) / 8 * 2 * PI; am = (a0 + a1) / 2; R = 1.24
        v = [(R * math.cos(a0), R * math.sin(a0), 2.86), (R * math.cos(a1), R * math.sin(a1), 2.86), (R * .985 * math.cos(am), R * .985 * math.sin(am), 2.72)]
        P.append(mesh('scallop', v, [(0, 1, 2), (2, 1, 0)], 'zinc_dk', grad=False))
    done('kiosk', {'kiosk': P, 'window': G}, ['emissive_window_warm'], 'Parisian newspaper kiosk, 4.1 m. Serving window faces +Z.')

# ---------------------------------------------------------------- poster column
def poster_column():
    begin('poster_column'); P = []
    P.append(lathe('base', [(.72, 0), (.72, .16), (.66, .22), (.62, .3)], seg=12, color='ink'))
    body = lathe('body', [(.6, .3), (.6, .45), (.6, 1.35), (.6, 1.45), (.6, 2.35), (.6, 2.5)], seg=12, color='cream', cap_bot=False, cap_top=False)
    cols = ['pink', 'mustard', 'powder', 'coral', 'burgundy', 'mint', 'magenta', 'lemon', 'powder_dk']
    def f(p):
        z = p.center.z; a = math.atan2(p.center.y, p.center.x); k = int(((a + PI) / (2 * PI)) * 12) % 12
        if .46 < z < 1.34: return cols[(k // 2) % len(cols)]
        if 1.46 < z < 2.34: return cols[(k // 3 + 4) % len(cols)]
        return 'cream'
    paint_faces(body, f); P.append(body)
    P.append(lathe('cornice', [(.6, 2.5), (.7, 2.56), (.72, 2.66), (.66, 2.7)], seg=12, color='ink', cap_bot=False, cap_top=False))
    P.append(lathe('frieze', [(.66, 2.7), (.66, 2.9)], seg=12, color='mustard', cap_bot=False, cap_top=False))
    P.append(lathe('dome', [(.66, 2.9), (.74, 2.94), (.72, 3.0), (.6, 3.2), (.4, 3.38), (.16, 3.48), (.1, 3.5)], seg=12, color='ink'))
    P.append(lathe('finial', [(.1, 3.5), (.05, 3.56), (.08, 3.64), (0, 3.78)], seg=6, color='gold'))
    done('poster_column', {'poster_column': P}, [], 'Colonne Morris poster column, 3.8 m.')

# ---------------------------------------------------------------- string lights
def catenary(x0, x1, z, sag, n):
    pts = []
    for i in range(n + 1):
        t = i / n; x = x0 + (x1 - x0) * t
        pts.append((x, 0, z - sag * (1 - (2 * t - 1) ** 2)))
    return pts

def bulbs(pts, count, skip_ends=True):
    out = []
    n = len(pts) - 1
    for i in range(count):
        t = (i + .5) / count; f = t * n; a = int(f); b = min(a + 1, n); u = f - a
        p = [pts[a][j] * (1 - u) + pts[b][j] * u for j in range(3)]
        out.append(lathe('bulb', [(0, -.02), (.045, -.06), (.05, -.1), (.03, -.15), (0, -.17)], seg=5, loc=p, mat=EM_STRING, color=None))
    return out

def string_lights():
    begin('string_lights'); P = []
    for x in (-4, 4):
        P.append(lathe('post', [(.07, 0), (.06, 3.4), (0, 3.48)], seg=6, loc=(x, 0, 0), color='wood'))
        P.append(lathe('foot', [(.18, 0), (.16, .08), (.08, .14)], seg=6, loc=(x, 0, 0), color='iron'))
    pts = catenary(-4, 4, 3.3, .55, 24)
    P.append(tube('wire', pts, .008, 3, 'iron', cap=False))
    B = bulbs(pts, 14)
    done('string_lights', {'string_lights': P, 'bulbs': B}, ['emissive_string'], 'Festoon lights strung between two posts, 8 m span, 3.4 m posts.')

def string_lights_span():
    begin('string_lights_span'); P = []
    pts = catenary(-4, 4, 0, .6, 24)
    P.append(tube('wire', pts, .008, 3, 'iron', cap=False))
    B = bulbs(pts, 14)
    done('string_lights_span', {'wire': P, 'bulbs': B}, ['emissive_string'], 'Festoon span without posts: anchors at x=-4 and x=+4 at y=0 (origin is the anchor height), sags 0.6 m. Scale X to fit other spans.')

ALL = [lamp_paris, lamp_riviera, cafe_table, cafe_chair, cafe_set, parasol, parasol_mustard, parasol_closed, bench,
       planter_pot, planter_versailles, planter_box, cypress, lambda: cypress('cypress_small', 4.6, 7), palm,
       lambda: palm('palm_tall', 8.0, 9, -1.1), olive, bougainvillea_wall, bougainvillea_spill, bougainvillea_bush,
       fountain, kiosk, poster_column, string_lights, string_lights_span]
NAMES = ['lamp_paris', 'lamp_riviera', 'cafe_table', 'cafe_chair', 'cafe_set', 'parasol', 'parasol_mustard', 'parasol_closed', 'bench',
         'planter_pot', 'planter_versailles', 'planter_box', 'cypress', 'cypress_small', 'palm', 'palm_tall', 'olive',
         'bougainvillea_wall', 'bougainvillea_spill', 'bougainvillea_bush', 'fountain', 'kiosk', 'poster_column', 'string_lights', 'string_lights_span']

if __name__ == '__main__':
    import landmarks
    landmarks.setup(globals())
    for fn, n in zip(ALL + landmarks.ALL, NAMES + landmarks.NAMES):
        if want(n): fn()
    with open(os.path.join(OUT, '_build.json'), 'w') as f: json.dump(RESULTS, f, indent=1)
