# Product landmarks: MCP Emails post office, Fun Libs arcade, Toolrails workshop, Harbor library.
# Fronts face -Y in Blender (= +Z in glTF / three.js).
import math, os, random
import bpy, bmesh
from mathutils import Vector, Matrix

SIGNS = os.path.join(os.path.dirname(__file__), 'signs')
PI = math.pi

def setup(g):
    globals().update({k: v for k, v in g.items() if not k.startswith('__') and k not in ('ALL', 'NAMES')})

def img(name):
    i = bpy.data.images.get(name)
    if i: return i
    i = bpy.data.images.load(os.path.join(SIGNS, name)); i.name = name; return i

def screen_mat():
    im = bpy.data.images.get('screen_idle')
    if not im:
        W, H = 64, 36
        im = bpy.data.images.new('screen_idle', W, H, alpha=False); px = []
        for y in range(H):
            for x in range(W):
                t = y / (H - 1); u = x / (W - 1)
                r, g, b = .08 + .06 * t, .1 + .07 * t, .23 + .12 * t
                if abs(y - H * .5) < 1.2 and .15 < u < .85: r, g, b = .55, .42, .3
                px += [r, g, b, 1]
        im.pixels = px; im.filepath_raw = os.path.join(os.path.dirname(__file__), 'raw', 'screen_idle.png'); im.file_format = 'PNG'; im.save()
    return plain_mat('screen', '#ffffff', rough=.3, image=im)

def window(G, P, x, z0, w, h, M, glass, frame='white', shutters=None, sill='stone', bal=False, lintel=None):
    """Window on a facade at local y=0 facing -Y. z0 = bottom of the opening."""
    G.append(quad('glass', w, h, loc=(x, -.012, z0 + h / 2), mat=glass, M=M))
    ft = .09
    P.append(box('f', (w + 2 * ft, .08, ft), loc=(x, -.03, z0 + h), color=frame, M=M))
    P.append(box('f', (ft, .08, h), loc=(x - w / 2 - ft / 2, -.03, z0), color=frame, M=M))
    P.append(box('f', (ft, .08, h), loc=(x + w / 2 + ft / 2, -.03, z0), color=frame, M=M))
    P.append(box('mull', (.04, .03, h), loc=(x, -.02, z0), color=frame, M=M))
    P.append(box('mull', (w, .03, .04), loc=(x, -.02, z0 + h * .62), color=frame, M=M))
    if sill: P.append(box('sill', (w + .3, .16, .06), loc=(x, -.07, z0 - .06), color=sill, M=M, bevel=.01))
    if lintel: P.append(box('lintel', (w + .4, .1, .16), loc=(x, -.04, z0 + h + ft), color=lintel, M=M))
    if shutters:
        for s in (-1, 1):
            cx = x + s * (w / 2 + ft + w / 4 + .02)
            P.append(box('shutter', (w / 2, .04, h + .04), loc=(cx, -.03, z0 - .02), color=shutters, M=M, bevel=.008))
            for k in range(5):
                P.append(box('louvre', (w / 2 - .08, .02, .025), loc=(cx, -.06, z0 + h * (.12 + .19 * k)), color=shutters + '_dk' if shutters + '_dk' in IDX else 'ink', M=M))
    if bal:
        P.append(box('rail', (w + .3, .3, .04), loc=(x, -.16, z0 + .02), color='stone', M=M))
        P.append(box('rail', (w + .3, .04, .04), loc=(x, -.3, z0 + .9), color='iron', M=M))
        n = 7
        for k in range(n):
            P.append(box('bar', (.025, .025, .88), loc=(x - (w + .26) / 2 + k * (w + .26) / (n - 1), -.3, z0 + .04), color='iron', M=M))

def screen_panel(S, P, x, zc, w, M, frame='ink', depth=.1):
    h = w * 9 / 16
    S.append(quad('screen', w, h, loc=(x, -depth - .006, zc), mat=screen_mat(), M=M))
    P.append(box('bezel', (w + .16, depth, h + .16), loc=(x, -depth / 2, zc - h / 2 - .08), color=frame, M=M, bevel=.015))
    return h

def sign_board(N, P, x, zc, w, h, image, M, frame='ink', depth=.1, name='sign'):
    m = emissive_mat('emissive_sign_' + name, image=img(image), rough=.5)
    N.append(quad('sign', w, h, loc=(x, -depth - .006, zc), mat=m, M=M))
    P.append(box('board', (w + .14, depth, h + .14), loc=(x, -depth / 2, zc - h / 2 - .07), color=frame, M=M, bevel=.015))

def facade_M(W, D, side):
    """side: 'front', 'left', 'right', 'back' -> matrix mapping local facade frame to that wall."""
    if side == 'front': return MT((0, -D / 2, 0))
    if side == 'back': return MT((0, D / 2, 0), (0, 0, PI))
    if side == 'left': return MT((-W / 2, 0, 0), (0, 0, -PI / 2))
    if side == 'right': return MT((W / 2, 0, 0), (0, 0, PI / 2))

def mansard(P, W, D, z0, h1=1.7, inset=.6, h2=.45, color='zinc'):
    a, b = W / 2 + .12, D / 2 + .12
    c, d = W / 2 - inset, D / 2 - inset
    e, f = c - 1.0, d - 1.0
    rect = lambda x, y, z: [(-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z)]
    P.append(loft('mansard', [rect(a, b, z0), rect(c, d, z0 + h1), rect(e, f, z0 + h1 + h2)], color=color, cap_bot=True))
    P.append(box('ridge', (2 * e + .1, 2 * f + .1, .05), loc=(0, 0, z0 + h1 + h2), color='zinc_dk'))
    P.append(box('roll', (2 * c + .12, .08, .08), loc=(0, -d, z0 + h1 - .04), color='zinc_dk'))
    P.append(box('roll', (2 * c + .12, .08, .08), loc=(0, d, z0 + h1 - .04), color='zinc_dk'))

def dormer(P, G, x, D, z0, glass, slope_in=.6, h1=1.7):
    # front of the dormer sits a little behind the eave line
    y = -D / 2 - .08
    P.append(box('dormer', (1.0, 1.1, 1.15), loc=(x, y + .55, z0 + .05), color='plaster'))
    P.append(prism('dgable', [(-.62, 0), (.62, 0), (0, .5)], 1.2, loc=(x, y + .55, z0 + 1.2), color='zinc_dk'))
    P.append(prism('dpedi', [(-.58, 0), (.58, 0), (0, .44)], .06, loc=(x, y - .03, z0 + 1.2), color='plaster'))
    window(G, P, x, z0 + .25, .6, .8, MT((0, y, 0)), glass, frame='white', sill=None)

def chimney(P, x, y, z0, h=1.4):
    P.append(box('chimney', (.55, .95, h), loc=(x, y, z0), color='plaster', bevel=.02))
    P.append(box('cap', (.65, 1.05, .1), loc=(x, y, z0 + h), color='stone_dk'))
    for k in (-1, 1):
        P.append(lathe('pot', [(.08, 0), (.07, .25), (.09, .3)], seg=6, loc=(x, y + k * .22, z0 + h + .1), color='terracotta', cap_top=False))

# ---------------------------------------------------------------- MCP Emails: post office
def lm_mcpemails():
    begin('lm_mcpemails'); P = []; G0 = []; G1 = []; N = []; S = []
    W, D = 7.0, 5.6
    gw = emissive_mat('emissive_window_ground', base='#3b4670', glow='#ffffff', rough=.25, emit_image=window_glow())
    uw = emissive_mat('emissive_window_upper', base='#3b4670', glow='#ffffff', rough=.25, emit_image=window_glow())
    P.append(box('plinth', (W + .2, D + .2, .3), color='stone_dk', bevel=.02))
    P.append(box('ground', (W, D, 3.4), loc=(0, 0, .3), color='stone'))
    F = facade_M(W, D, 'front')
    for i in range(6):
        P.append(box('rustic', (W + .02, D + .02, .035), loc=(0, 0, .75 + i * .5), color='stone_dk'))
    P.append(box('belt', (W + .24, D + .24, .2), loc=(0, 0, 3.7), color='plaster', bevel=.02))
    P.append(box('upper', (W, D, 2.8), loc=(0, 0, 3.9), color='powder'))
    P.append(box('cornice', (W + .34, D + .34, .24), loc=(0, 0, 6.7), color='plaster', bevel=.03))
    for sx in (-1, 1):
        P.append(box('pilaster', (.32, .1, 2.8), loc=(sx * (W / 2 - .16), -D / 2 - .05, 3.9), color='plaster'))
    mansard(P, W, D, 6.94)
    for x in (-1.75, 1.75): dormer(P, G1, x, D, 6.95, uw)
    chimney(P, -2.6, .9, 8.2); chimney(P, 2.6, .9, 8.2)
    # ground floor: door, window, screen; fascia sign over the door
    P.append(box('door', (1.4, .06, 2.4), loc=(0, -.03, .3), color='ink', M=F))
    for dx in (-.35, .35):
        for z in (.5, 1.55):
            P.append(box('dpanel', (.5, .03, .85), loc=(dx, -.07, z), color='ink_lt', M=F))
    P.append(box('dframe', (1.7, .12, .14), loc=(0, -.05, 2.7), color='plaster', M=F))
    for sx in (-1, 1): P.append(box('dframe', (.14, .12, 2.4), loc=(sx * .77, -.05, .3), color='plaster', M=F))
    P.append(box('step', (2.0, .5, .12), loc=(0, -.25, .3), color='stone_dk', M=F))
    P.append(box('step', (2.3, .5, .3), loc=(0, -.55, 0), color='stone_dk', M=F))
    sign_board(N, P, 0, 3.2, 3.0, .75, 'sign_mcp.jpg', F, frame='ink', name='mcpemails')
    window(G0, P, -2.35, .95, 1.25, 1.9, F, gw, frame='white', lintel='plaster')
    screen_panel(S, P, 2.35, 1.95, 1.7, F, frame='ink')
    P.append(box('noticecap', (2.0, .2, .1), loc=(2.35, -.1, 2.55), color='plaster', M=F))
    # upper floor: three French windows with balconettes
    for x in (-2.35, 0, 2.35): window(G1, P, x, 4.3, .95, 1.85, F, uw, frame='white', bal=True, sill=None, lintel='plaster')
    # sides
    for side in ('left', 'right'):
        M = facade_M(W, D, side)
        window(G0, P, 0, .95, 1.1, 1.9, M, gw, frame='white', lintel='plaster')
        window(G1, P, 0, 4.3, .95, 1.85, M, uw, frame='white', bal=True, sill=None, lintel='plaster')
    # post box (French yellow) beside the steps
    pb = MT((-1.45, -D / 2 - .5, 0))
    P.append(lathe('pbpost', [(.06, 0), (.05, .7)], seg=6, M=pb, color='ink'))
    P.append(box('pbox', (.46, .36, .62), loc=(0, 0, .7), color='mustard', M=pb, bevel=.06))
    P.append(box('pbtop', (.5, .4, .06), loc=(0, 0, 1.32), color='mustard_dk', M=pb, bevel=.02))
    P.append(box('slot', (.26, .02, .04), loc=(0, -.19, 1.12), color='ink', M=pb))
    P.append(box('pbbadge', (.18, .02, .12), loc=(0, -.19, .88), color='mcp_blue', M=pb))
    # wall lanterns either side of the door
    L = []
    for sx in (-1, 1):
        lm = MT((sx * 1.05, -D / 2, 0))
        P.append(box('lbr', (.05, .25, .05), loc=(0, -.12, 2.35), color='iron', M=lm))
        L.append(lathe('lamp', [(.07, 2.12), (.11, 2.38), (0, 2.38)], seg=4, M=lm @ MT((0, -.25, 0)), mat=EM_LAMP, color=None))
        P.append(lathe('lcap', [(.13, 2.38), (.02, 2.5)], seg=4, M=lm @ MT((0, -.25, 0)), color='iron'))
    done('lm_mcpemails', {'building': P, 'windows_ground': G0, 'windows_upper': G1, 'lamps': L, 'sign': N, 'screen': S},
         ['emissive_window_ground', 'emissive_window_upper', 'emissive_lamp', 'emissive_sign_mcpemails'],
         'MCP Emails post office: Paris zinc mansard, French-yellow post box, fascia sign with the real mcpemails wordmark. 7 x 5.6 m, 9.3 m tall. "screen" is 1.7 x 0.96 m (16:9) by the door.',
         extras={'product': 'MCP Emails', 'screenAspect': 16 / 9})

# ---------------------------------------------------------------- Fun Libs: games arcade
def lm_funlibs():
    begin('lm_funlibs'); P = []; G0 = []; G1 = []; N = []; S = []; B = []
    W, D, H = 7.0, 5.6, 5.4
    gw = emissive_mat('emissive_window_ground', base='#3b4670', glow='#ffffff', rough=.25, emit_image=window_glow())
    uw = emissive_mat('emissive_window_upper', base='#3b4670', glow='#ffffff', rough=.25, emit_image=window_glow())
    mq = emissive_mat('emissive_marquee', base='#5a4a3a', glow='#ffe39a')
    ar = emissive_mat('emissive_arcade', base='#1d2244', glow='#9fd0ff', rough=.2)
    F = facade_M(W, D, 'front')
    P.append(box('plinth', (W + .1, D + .1, .35), color='terracotta_dk'))
    P.append(box('body', (W, D, H - .35), loc=(0, 0, .35), color='pink'))
    P.append(box('coping', (W + .2, D + .2, .16), loc=(0, 0, H), color='plaster'))
    deco = [(-3.6, 0), (3.6, 0), (3.6, .35), (2.5, .35), (2.5, .75), (1.5, .75), (1.5, 1.15), (-1.5, 1.15), (-1.5, .75), (-2.5, .75), (-2.5, .35), (-3.6, .35)]
    P.append(prism('parapet', deco, .3, loc=(0, -D / 2 + .05, H + .1), color='plaster'))
    for k in range(3):
        for s in (-1, 1):
            P.append(box('speed', (1.4 - k * .3, .06, .07), loc=(s * (2.6 + k * .15), -.03, 3.6 + k * .2), color='white', M=F))
    # storefront
    x0, x1, z0, z1 = -1.1, 3.0, .45, 2.95
    G0.append(quad('shop', x1 - x0, z1 - z0, loc=((x0 + x1) / 2, -.012, (z0 + z1) / 2), mat=gw, M=F))
    for i in range(5):
        x = x0 + i * (x1 - x0) / 4
        P.append(box('mull', (.1, .1, z1 - z0 + .1), loc=(x, -.05, z0 - .05), color='ink', M=F))
    P.append(box('transom', (x1 - x0 + .1, .1, .1), loc=((x0 + x1) / 2, -.05, z1), color='ink', M=F))
    P.append(box('stall', (x1 - x0 + .1, .1, .1), loc=((x0 + x1) / 2, -.05, z0 - .05), color='ink', M=F))
    P.append(box('kick', (x1 - x0 + .1, .06, .45), loc=((x0 + x1) / 2, -.03, 0), color='burgundy', M=F))
    for cx in (-.55, .5, 1.55, 2.5):  # arcade cabinets seen through the shop window
        P.append(prism('icab', [(-.28, 0), (.28, 0), (.28, 1.25), (.18, 1.45), (.28, 1.75), (-.28, 1.75)], .02, loc=(cx, -D / 2 - .02, z0), color='ink', grad=False))
        B.append(quad('iscreen', .34, .28, loc=(cx, -.035, z0 + 1.42), mat=ar, M=F))
    # door
    G0.append(quad('door', 1.1, 2.4, loc=(-2.3, -.012, .35 + 1.2), mat=gw, M=F))
    for x in (-2.9, -1.7): P.append(box('dj', (.1, .1, 2.5), loc=(x, -.05, .35), color='ink', M=F))
    P.append(box('dh', (1.3, .1, .1), loc=(-2.3, -.05, 2.8), color='ink', M=F))
    P.append(box('push', (.6, .04, .05), loc=(-2.3, -.1, 1.4), color='gold', M=F))
    # striped awning over the whole ground floor
    n = 14; aw = 6.6; out = 1.05; drop = .5; za = 3.25
    for i in range(n):
        x = -aw / 2 + (i + .5) * aw / n
        col = 'burgundy' if i % 2 == 0 else 'white'
        ang = math.atan2(drop, out); L = math.hypot(out, drop)
        P.append(box('stripe', (aw / n + .002, L, .03), loc=(x, -out / 2, za - drop / 2), rot=(ang, 0, 0), color=col, M=F, grad=False))
        P.append(prism('flap', [(-aw / n / 2, 0), (aw / n / 2, 0), (0, -.2)], .02, loc=(x, -D / 2 - out, za - drop), color=col, grad=False))
    for s in (-1, 1):
        P.append(tube('awarm', [(s * 3.2, -D / 2, za - .8), (s * 3.2, -D / 2 - out, za - drop)], .02, 4, 'iron'))
    # upper floor: screen centred, two shuttered windows
    screen_panel(S, P, 0, 4.35, 2.2, F, frame='ink')
    for x in (-2.55, 2.55): window(G1, P, x, 3.75, .75, 1.35, F, uw, frame='white', shutters='mustard', sill='plaster')
    for side in ('left', 'right'):
        M = facade_M(W, D, side)
        for x in (-1.3, 1.3): window(G1, P, x, 3.75, .75, 1.35, M, uw, frame='white', shutters='mustard', sill='plaster')
        window(G0, P, 0, .9, 1.4, 1.6, M, gw, frame='ink', sill='plaster')
    # rooftop badge sign with marquee bulbs (the real Fun Libs icon)
    sz = 2.1; zc = H + 1.25 + sz / 2; yb = .4
    for s in (-1, 1):
        P.append(box('leg', (.12, .12, zc - sz / 2 - H + .1), loc=(s * .8, yb + .1, H), color='ink'))
        P.append(tube('brace', [(s * .8, yb + .15, zc - sz / 2), (s * .8, yb + 1.2, H + .05)], .04, 4, 'ink'))
    P.append(box('mframe', (sz + .62, .1, sz + .62), loc=(0, yb - .05, zc - sz / 2 - .31), color='ink'))
    sign_board(N, P, 0, zc, sz, sz, 'badge_fun.jpg', MT((0, yb, 0)), frame='ink', depth=.14, name='funlibs')
    nb = 7
    for i in range(nb):
        t = (i + .5) / nb; e = sz / 2 + .2
        for (bx, bz) in ((-e + 2 * e * t, zc + e), (-e + 2 * e * t, zc - e), (-e, zc - e + 2 * e * t), (e, zc - e + 2 * e * t)):
            B.append(blob('bulb', .05, (bx, yb - .17, bz), color=None, mat=mq, subdiv=0, jitter=0))
    sign_board(N, P, -2.3, 3.45, 1.0, .25, 'sign_fun.jpg', F, frame='ink', depth=.06, name='funlibs')
    # an arcade cabinet on the pavement
    cm = MT((-3.05, -D / 2 - .55, 0), (0, 0, .25))
    P.append(box('cab', (.62, .62, 1.05), color='ink', M=cm, bevel=.02))
    P.append(prism('cabtop', [(-.31, 0), (.31, 0), (.31, .6), (-.31, .75)], .62, rot=(0, 0, PI / 2), loc=(0, 0, 1.05), color='ink', M=cm))
    P.append(box('stripe', (.64, .64, .06), loc=(0, 0, .55), color='fun_yellow', M=cm))
    P.append(box('panel', (.66, .3, .06), loc=(0, -.4, .95), rot=(.3, 0, 0), color='burgundy', M=cm))
    B.append(quad('cabscreen', .5, .42, loc=(0, -.32, 1.35), rot=(-.25, 0, 0), mat=ar, M=cm))
    for bx in (-.15, 0, .15): P.append(blob('btn', .03, (bx, -.45, 1.0), color='fun_yellow', M=cm, subdiv=0, jitter=0))
    done('lm_funlibs', {'building': P, 'windows_ground': G0, 'windows_upper': G1, 'lights': B, 'sign': N, 'screen': S},
         ['emissive_window_ground', 'emissive_window_upper', 'emissive_marquee', 'emissive_arcade', 'emissive_sign_funlibs'],
         'Fun Libs games arcade: pink Art Deco storefront, striped awning, rooftop marquee with the real yellow Fun Libs icon, a pavement arcade cabinet. 7 x 5.6 m, 9 m to the sign. "screen" 2.2 x 1.24 m above the awning.',
         extras={'product': 'Fun Libs', 'screenAspect': 16 / 9})

# ---------------------------------------------------------------- Toolrails: workshop
def lm_toolrails():
    begin('lm_toolrails'); P = []; G0 = []; G1 = []; N = []; S = []
    W, D, H = 7.4, 6.0, 3.6
    gw = emissive_mat('emissive_window_ground', base='#3b4670', glow='#ffffff', rough=.25, emit_image=window_glow())
    uw = emissive_mat('emissive_window_upper', base='#3b4670', glow='#ffffff', rough=.25, emit_image=window_glow())
    sky = emissive_mat('emissive_skylight', base='#7f95bd', glow='#ffe0a8', rough=.2)
    F = facade_M(W, D, 'front')
    P.append(box('body', (W, D, H), color='plaster'))
    P.append(box('dado', (W + .03, D + .03, .7), color='terracotta'))
    # saw-tooth roof, glazing faces the street
    for k in range(3):
        y0 = -D / 2 + k * D / 3
        tooth = [(0, 0), (0, 1.25), (D / 3, 0)]
        P.append(prism('tooth', tooth, W + .25, loc=(0, y0, H), rot=(0, 0, PI / 2), color='zinc'))
        G1.append(quad('north', W - .2, .78, loc=(0, y0 - .02, H + .5), mat=sky))
        for i in range(9):
            x = -W / 2 + .1 + i * (W - .2) / 8
            P.append(box('mull', (.06, .05, .86), loc=(x, y0 - .04, H + .07), color='iron'))
        P.append(box('transom', (W - .1, .05, .06), loc=(0, y0 - .04, H + .9), color='iron'))
        P.append(box('gutter', (W + .3, .18, .12), loc=(0, y0 - .02, H - .02), color='zinc_dk'))
    # big doorway with lit interior and a sliding barn door
    ox, ow, oh = -1.3, 2.6, 2.9
    G0.append(quad('interior', ow, oh, loc=(ox, -.012, oh / 2), mat=gw, M=F))
    P.append(box('header', (ow + .5, .2, .3), loc=(ox, -.1, oh), color='wood', M=F, bevel=.02))
    # workshop interior seen against the light: bench, shelves, a hanging lamp
    sil = dict(color='iron', M=F, grad=False)
    P.append(box('ibench', (1.5, .02, .08), loc=(ox + .3, -.02, .88), **sil))
    for bx in (-.35, .95): P.append(box('ileg', (.07, .02, .88), loc=(ox + bx, -.02, 0), **sil))
    P.append(box('ivice', (.2, .02, .16), loc=(ox + .8, -.02, .96), **sil))
    for zz in (1.5, 2.0): P.append(box('ishelf', (.7, .02, .05), loc=(ox - .8, -.02, zz), **sil))
    for k, (bx, bh) in enumerate([(-1.05, .3), (-.9, .22), (-.65, .34), (-.6, .18)]):
        P.append(box('ibox', (.14, .02, bh), loc=(ox + bx, -.02, 1.55 + .5 * (k % 2)), **sil))
    P.append(box('icord', (.02, .02, .55), loc=(ox + .3, -.02, oh - .55), **sil))
    P.append(prism('ishade', [(-.22, 0), (.22, 0), (.08, .16), (-.08, .16)], .02, loc=(ox + .3, -D / 2 - .02, oh - .72), color='iron', grad=False))
    for s in (-1, 1): P.append(box('jamb', (.18, .18, oh), loc=(ox + s * (ow / 2 + .09), -.09, 0), color='wood', M=F))
    P.append(box('track', (5.6, .08, .08), loc=(ox - 1.3, -.22, oh + .32), color='iron', M=F))
    dx = ox - ow - .1
    for i in range(6):
        P.append(box('plank', (ow / 6 - .02, .06, oh), loc=(dx - ow / 2 + (i + .5) * ow / 6, -.26, .05), color='wood' if i % 2 else 'bark_lt', M=F))
    for zz in (.35, oh - .25):
        P.append(box('rail', (ow, .04, .16), loc=(dx, -.31, zz), color='mustard', M=F))
    P.append(box('brace', (math.hypot(ow, oh - .6), .04, .14), loc=(dx, -.31, oh / 2 - .07), rot=(0, math.atan2(oh - .6, ow), 0), color='mustard', M=F))
    for s in (-1, 1): P.append(blob('wheel', .07, (dx + s * .9, -.26, oh + .2), color='iron', M=F, subdiv=0, jitter=0))
    # fascia sign over the doorway + projecting blade sign with the icon
    sign_board(N, P, ox, H - .45, 2.6, .65, 'sign_tool.jpg', F, frame='tool_black', depth=.08, name='toolrails')
    bm = MT((W / 2 - .6, -D / 2, 0))
    P.append(box('arm', (.06, 1.1, .06), loc=(0, -.55, 2.95), color='iron', M=bm))
    P.append(tube('armstay', [(0, 0, 2.5), (0, -.8, 2.97)], .02, 4, 'iron', M=bm))
    for cy in (-.35, -.95): P.append(box('chain', (.02, .02, .22), loc=(0, cy, 2.73), color='iron', M=bm))
    bmx = bm @ MT((0, -.65, 2.3), (0, 0, PI / 2))
    sign_board(N, P, 0, 0, .78, .78, 'badge_tool.jpg', bmx, frame='tool_black', depth=.03, name='toolrails')
    sign_board(N, P, 0, 0, .78, .78, 'badge_tool.jpg', bmx @ MT((0, 0, 0), (0, 0, PI)), frame='tool_black', depth=.03, name='toolrails')
    # screen as a framed shop board, and a window
    screen_panel(S, P, 1.75, 1.75, 1.8, F, frame='wood')
    for side in ('left', 'right'):
        M = facade_M(W, D, side)
        for x in (-1.6, 1.6): window(G0, P, x, 1.0, 1.4, 1.6, M, gw, frame='iron', sill='stone')
    # rails out of the doorway with a little tool trolley
    for s in (-1, 1):
        P.append(box('railbar', (.06, 3.4, .07), loc=(ox + s * .55, -D / 2 - 1.5, 0), color='slate'))
    for i in range(7):
        P.append(box('sleeper', (1.5, .16, .05), loc=(ox, -D / 2 - .1 - i * .5, 0), color='wood'))
    tm = MT((ox, -D / 2 - 1.8, .07))
    P.append(box('cart', (1.2, .8, .18), loc=(0, 0, .14), color='red', M=tm, bevel=.02))
    for sx in (-1, 1):
        for sy in (-1, 1):
            P.append(lathe('cw', [(.0, -.03), (.12, -.03), (.12, .03), (0, .03)], seg=8, rot=(0, PI / 2, 0), loc=(sx * .55, sy * .28, .12), color='iron', M=tm))
    P.append(box('toolbox', (.6, .32, .28), loc=(-.15, 0, .32), color='mustard', M=tm, bevel=.02))
    P.append(box('handle', (.3, .04, .12), loc=(-.15, 0, .6), color='iron', M=tm))
    P.append(box('crate', (.4, .4, .4), loc=(.35, .1, .32), color='wood', M=tm, bevel=.02))
    # crates and a workbench at the side
    P.append(box('bench', (1.6, .6, .08), loc=(W / 2 + .45, 0, .85), rot=(0, 0, PI / 2), color='wood'))
    for sy in (-.7, .7):
        P.append(box('bleg', (.5, .08, .85), loc=(W / 2 + .45, sy, 0), rot=(0, 0, PI / 2), color='bark'))
    P.append(box('vice', (.2, .25, .15), loc=(W / 2 + .45, -.5, .93), color='slate'))
    P.append(box('crate', (.55, .55, .55), loc=(W / 2 + .45, 1.4, 0), color='wood', bevel=.02))
    P.append(box('crate', (.45, .45, .45), loc=(W / 2 + .5, 1.45, .55), rot=(0, 0, .3), color='bark_lt', bevel=.02))
    done('lm_toolrails', {'building': P, 'windows_ground': G0, 'windows_upper': G1, 'sign': N, 'screen': S},
         ['emissive_window_ground', 'emissive_window_upper', 'emissive_skylight', 'emissive_sign_toolrails'],
         'Toolrails workshop: saw-tooth zinc roof with street-facing glazing, sliding barn door, rails running out of the doorway with a tool trolley, fascia and blade signs with the real Toolrails icon. 7.4 x 6 m, 4.9 m tall. "screen" 1.8 x 1.01 m right of the door.',
         extras={'product': 'Toolrails', 'screenAspect': 16 / 9})

# ---------------------------------------------------------------- Harbor: library / archive
def lm_harbor():
    begin('lm_harbor'); P = []; G0 = []; G1 = []; N = []; S = []
    W, D, H = 9.0, 7.0, 5.4
    gw = emissive_mat('emissive_window_ground', base='#3b4670', glow='#ffffff', rough=.25, emit_image=window_glow())
    uw = emissive_mat('emissive_window_upper', base='#3b4670', glow='#ffffff', rough=.25, emit_image=window_glow())
    F = facade_M(W, D, 'front')
    P.append(box('plinth', (W + .3, D + .3, .5), color='stone_dk'))
    P.append(box('body', (W, D, H), loc=(0, 0, .5), color='plaster'))
    P.append(box('cornice', (W + .4, D + .4, .3), loc=(0, 0, H + .5), color='white', bevel=.03))
    P.append(box('attic', (W - .2, D - .2, .5), loc=(0, 0, H + .8), color='plaster'))
    P.append(box('attic_cap', (W, D, .12), loc=(0, 0, H + 1.3), color='white'))
    for sx in (-1, 1):
        P.append(box('quoin', (.4, .12, H), loc=(sx * (W / 2 - .2), -D / 2 - .06, .5), color='white'))
    # portico
    pw = 6.0; pd = 2.0; py = -D / 2 - pd / 2
    P.append(box('stylobate', (pw, pd, .5), loc=(0, py, 0), color='stone'))
    P.append(box('step', (pw, .4, .33), loc=(0, -D / 2 - pd - .2, 0), color='stone'))
    P.append(box('step', (pw, .4, .17), loc=(0, -D / 2 - pd - .6, 0), color='stone'))
    for x in (-2.4, -.8, .8, 2.4):
        cy = -D / 2 - pd + .35
        P.append(box('abase', (.66, .66, .12), loc=(x, cy, .5), color='white'))
        P.append(lathe('col', [(.29, .62), (.26, .72), (.25, .8), (.2, 4.25)], seg=10, loc=(x, cy, 0), color='white', cap_bot=False, cap_top=False, smooth=40))
        P.append(lathe('capital', [(.2, 4.25), (.25, 4.32), (.31, 4.42), (.31, 4.46), (0, 4.46)], seg=10, loc=(x, cy, 0), color='white', cap_bot=False))
        P.append(box('abacus', (.72, .72, .12), loc=(x, cy, 4.46), color='white'))
    P.append(box('architrave', (pw, pd, .35), loc=(0, py, 4.58), color='white'))
    P.append(box('frieze', (pw, pd - .1, .9), loc=(0, py + .05, 4.93), color='plaster'))
    P.append(box('dentil', (pw + .2, pd + .1, .18), loc=(0, py - .05, 5.83), color='white'))
    P.append(prism('pediment', [(-3.1, 0), (3.1, 0), (0, 1.25)], pd + .1, loc=(0, py - .05, 6.01), color='plaster'))
    for s in (-1, 1):
        ang = math.atan2(1.25, 3.1); L = math.hypot(3.1, 1.25) + .25
        P.append(box('rake', (L, pd + .25, .14), loc=(s * 1.55, py - .05, 6.01 + .62 - .07), rot=(0, s * ang, 0), color='zinc'))
    sign_board(N, P, 0, 5.38, 3.4, .85, 'sign_harbor.jpg', MT((0, py - pd / 2 + .06, 0)), frame='harbor_dark', depth=.06, name='harbor')
    P.append(blob('acroter', .14, (0, py - .05, 7.35), color='gold', subdiv=1, jitter=0))
    # entrance, screen and windows under the portico
    P.append(box('door', (1.5, .08, 2.9), loc=(0, -.04, .5), color='ink', M=F))
    for dx in (-.37, .37):
        for z in (.75, 2.0):
            P.append(box('dpanel', (.55, .03, 1.0), loc=(dx, -.09, z), color='ink_lt', M=F))
    P.append(box('dsurround', (2.0, .14, .18), loc=(0, -.07, 3.4), color='white', M=F))
    for s in (-1, 1): P.append(box('dsurround', (.18, .14, 2.9), loc=(s * .84, -.07, .5), color='white', M=F))
    G0.append(quad('fanlight', 1.5, .45, loc=(0, -.012, 3.18), mat=gw, M=F))
    screen_panel(S, P, 1.6, 1.95, 1.3, F, frame='harbor_dark')
    window(G0, P, -1.6, 1.2, .9, 1.6, F, gw, frame='white', sill='stone')
    for x in (-3.75, 3.75): window(G0, P, x, 1.3, .95, 2.9, F, gw, frame='white', sill='stone', lintel='white')
    for side in ('left', 'right'):
        M = facade_M(W, D, side)
        for x in (-1.9, 0, 1.9): window(G0, P, x, 1.3, .95, 2.9, M, gw, frame='white', sill='stone', lintel='white')
    # reading-room dome on a windowed drum
    dz = H + 1.42
    P.append(lathe('drum', [(1.7, dz), (1.7, dz + .9)], seg=12, loc=(0, .4, 0), color='plaster', cap_bot=False, cap_top=False))
    P.append(lathe('drumcap', [(1.7, dz + .9), (1.85, dz + .95), (1.85, dz + 1.05), (1.75, dz + 1.08)], seg=12, loc=(0, .4, 0), color='white', cap_bot=False, cap_top=False))
    for k in range(12):
        a = (k + .5) / 12 * 2 * PI  # face centres
        r = 1.7 * math.cos(PI / 12) + .005
        G1.append(quad('oculus', .42, .55, loc=(r * math.cos(a), .4 + r * math.sin(a), dz + .45), rot=(0, 0, a + PI / 2), mat=uw))
    P.append(lathe('dome', [(1.75, dz + 1.08), (1.66, dz + 1.45), (1.42, dz + 1.85), (1.02, dz + 2.2), (.5, dz + 2.42), (.3, dz + 2.46)], seg=12, loc=(0, .4, 0), color='zinc', cap_bot=False))
    for k in range(12):
        a = k / 12 * 2 * PI
        pts = [(r_ * math.cos(a), .4 + r_ * math.sin(a), z_) for r_, z_ in ((1.77, dz + 1.08), (1.68, dz + 1.45), (1.44, dz + 1.85), (1.04, dz + 2.2), (.52, dz + 2.42))]
        P.append(tube('rib', pts, .035, 3, 'zinc_dk', cap=False))
    P.append(lathe('lantern', [(.3, dz + 2.46), (.3, dz + 2.8), (.38, dz + 2.86), (.06, dz + 3.05)], seg=6, loc=(0, .4, 0), color='white', cap_bot=False))
    P.append(lathe('finial', [(.06, dz + 3.05), (.1, dz + 3.15), (0, dz + 3.35)], seg=6, loc=(0, .4, 0), color='gold', cap_bot=False))
    # urns at the foot of the steps
    for s in (-1, 1):
        P.append(box('ped', (.5, .5, .7), loc=(s * 3.3, -D / 2 - pd - .55, 0), color='stone'))
        P.append(lathe('urn', [(.12, .7), (.2, .8), (.28, 1.05), (.25, 1.2), (.3, 1.24), (.26, 1.26)], seg=8, loc=(s * 3.3, -D / 2 - pd - .55, 0), color='stone_dk', cap_top=False))
        P.append(blob('urnplant', .3, (s * 3.3, -D / 2 - pd - .55, 1.4), (1, 1, .8), 'leaf', .2, seed=3 + s))
    done('lm_harbor', {'building': P, 'windows_ground': G0, 'windows_upper': G1, 'sign': N, 'screen': S},
         ['emissive_window_ground', 'emissive_window_upper', 'emissive_sign_harbor'],
         'Harbor library and archive: neoclassical portico, the real Harbor wordmark on the frieze, zinc reading-room dome with a ring of lit oculi. 9 x 7 m (+2.8 m portico and steps), 10.2 m tall. "screen" 1.3 x 0.73 m under the portico, right of the door.',
         extras={'product': 'Harbor', 'screenAspect': 16 / 9})

ALL = [lm_mcpemails, lm_funlibs, lm_toolrails, lm_harbor]
NAMES = ['lm_mcpemails', 'lm_funlibs', 'lm_toolrails', 'lm_harbor']
