# Ambient bicycle: a step-through town bike, burgundy frame, wicker basket with a baguette and bougainvillea.
#   blender -b --python bicycle.py -- out.glb
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix
from vlib import *

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '/tmp/bicycle.glb'
PAINT = argv[1] if len(argv) > 1 else PAL['burgundy']

reset()
M = std_mats(PAINT, PAL['plaster'], PAL['burgundy'])
WICKER = mat('wicker', '#c99a5b', 0.85)
BREAD = mat('bread', '#d9a42b', 0.8)
BLOOM = mat('bloom', PAL['magenta'], 0.7)
LEAF = mat('leaf', '#5f7d58', 0.8)
LEATHER = mat('leather', '#7a4a32', 0.6)
root = empty('bicycle', (0, 0, 0))
R = 0.34
RW, FW = -0.53, 0.56
BB = P(-0.02, 0, 0.29)
ST_TOP = P(-0.20, 0, 0.80)
HT_TOP, HT_BOT = P(0.40, 0, 0.93), P(0.45, 0, 0.73)
RH, FH = P(RW, 0, R), P(FW, 0, R)
T = 0.019

frame = []
# step-through down tube: a low curve from the head tube to the bottom bracket
frame.append(tube('down', [HT_BOT, P(0.30, 0, 0.55), P(0.12, 0, 0.36), BB], T, M['paint'], 8))
frame.append(tube('down2', [HT_TOP + Vector((0, 0.0, -0.05)), P(0.24, 0, 0.66), P(0.02, 0, 0.47), P(-0.14, 0, 0.42)], T * 0.9, M['paint'], 8))
frame.append(tube('seat', [BB, ST_TOP], T, M['paint'], 8))
frame.append(tube('head', [HT_TOP, HT_BOT], T * 1.3, M['paint'], 8))
for sg in (1, -1):
    frame.append(tube('chainstay', [BB + Vector((sg * 0.03, 0, 0)), RH + Vector((sg * 0.06, 0, 0))], T * 0.7, M['paint'], 6))
    frame.append(tube('seatstay', [ST_TOP + Vector((sg * 0.02, 0, -0.06)), RH + Vector((sg * 0.06, 0, 0))], T * 0.65, M['paint'], 6))
# mudguards (rear; front one turns with the bars)
def guard(c, a0, a1, n=12):
    pts = []
    for k in range(n):
        a = math.radians(a0 + (a1 - a0) * k / (n - 1))
        pts.append(c + Vector((0, -math.cos(a) * (R + 0.04), math.sin(a) * (R + 0.04))))
    return sweep('guard', pts, [(-0.035, 0.0), (0.035, 0.0), (0.04, 0.012), (0.0, 0.022), (-0.04, 0.012)], M['plaster'])
frame.append(guard(RH, 175, 20))
# chain guard + rear rack + reflector
frame.append(box('chainguard', (0.012, 0.50, 0.07), P(-0.27, -0.07, 0.33), M['paint'], 0.02, 2))
frame.append(tube('rack', [P(-0.22, 0.08, 0.80), P(-0.62, 0.08, 0.78), P(-0.62, -0.08, 0.78), P(-0.22, -0.08, 0.80)], 0.008, M['chrome'], 5))
frame.append(tube('rackleg', [P(-0.58, 0.08, 0.78), RH + Vector((0.07, 0, 0))], 0.006, M['chrome'], 5))
frame.append(tube('rackleg', [P(-0.58, -0.08, 0.78), RH + Vector((-0.07, 0, 0))], 0.006, M['chrome'], 5))
frame.append(box('tl', (0.06, 0.02, 0.04), P(-0.64, 0, 0.76), M['tail'], 0.01, 2))
# saddle + post
frame.append(tube('post', [ST_TOP, P(-0.23, 0, 0.94)], 0.012, M['chrome'], 6))
frame.append(lathe('saddle', [(0.0, 0.0), (0.06, 0.0), (0.09, 0.02), (0.085, 0.045), (0.0, 0.05)], 12,
                   (0, 0, 0), 'Z', [LEATHER]))
sd = frame[-1]
sd.data.transform(Matrix.Diagonal((1.0, 1.6, 1.0, 1.0)))
sd.location = P(-0.24, 0, 0.94)
for sg in (1, -1):
    frame.append(tube('spring', [P(-0.30, sg * 0.04, 0.94), P(-0.30, sg * 0.04, 0.90)], 0.010, M['chrome'], 5))
frame.append(tube('stand', [P(-0.10, -0.04, 0.29), P(-0.24, -0.16, 0.0)], 0.009, M['trim'], 5))
body = join('frame', frame, root)
finish(body, 40)

# crank (rotates about X at the bottom bracket)
cp = [cyl('ring', 0.09, 0.012, BB + Vector((-0.045, 0, 0)), 'X', 18, M['chrome'])]
for sg in (1, -1):
    end = BB + Vector((sg * 0.07, 0, -sg * 0.16))
    cp.append(box('arm', (0.012, 0.03, 0.17), BB + Vector((sg * 0.06, 0, -sg * 0.08)), M['chrome'], 0.006, 1))
    cp.append(box('pedal', (0.10, 0.06, 0.02), end + Vector((sg * 0.05, 0, 0)), M['trim'], 0.006, 1))
crank = join('crank', cp, root)
set_origin(crank, BB)
finish(crank)

# handlebar node: fork, stem, swept-back bars, front guard, basket with a baguette and flowers, lamp
hp = []
for sg in (1, -1):
    hp.append(tube('fork', [HT_BOT + Vector((sg * 0.025, 0, 0)), FH + Vector((sg * 0.05, 0, 0.02)), FH + Vector((sg * 0.05, 0, 0))], 0.012, M['paint'], 6))
hp.append(tube('stem', [HT_TOP, HT_TOP + Vector((0, 0.0, 0.08)), P(0.37, 0, 1.03)], 0.012, M['chrome'], 6))
hp.append(tube('bars', [P(0.20, -0.28, 1.03), P(0.30, -0.25, 1.04), P(0.37, -0.10, 1.03), P(0.37, 0.10, 1.03),
                        P(0.30, 0.25, 1.04), P(0.20, 0.28, 1.03)], 0.011, M['chrome'], 6))
for sg in (1, -1):
    hp.append(cyl('grip', 0.017, 0.10, P(0.21, sg * 0.28, 1.03), 'Y', 8, LEATHER))
hp.append(guard(FH, 160, 35))
# basket
BK = P(0.62, 0, 0.88)
bk = []
for i in range(6):
    hh = 0.0 + i * 0.04
    bk.append(tube('wring', [BK + Vector((x, y, hh)) for (x, y) in
                             [(-0.17, -0.12), (-0.17, 0.12), (0.17, 0.12), (0.17, -0.12), (-0.17, -0.12)]], 0.008, WICKER, 4, caps=False))
for (x, y) in [(-0.17, -0.12), (-0.17, 0.12), (0.17, 0.12), (0.17, -0.12), (0, -0.12), (0, 0.12), (-0.17, 0), (0.17, 0)]:
    bk.append(tube('wpost', [BK + Vector((x, y, -0.005)), BK + Vector((x, y, 0.205))], 0.008, WICKER, 4))
bk.append(box('wbase', (0.34, 0.24, 0.015), BK, WICKER, 0.006, 1))
bread = lathe('bread', [(0.0, -0.30), (0.022, -0.28), (0.032, -0.18), (0.034, 0.0), (0.032, 0.18), (0.022, 0.28), (0.0, 0.30)],
              10, (0, 0, 0), 'X', [BREAD])
bread.rotation_euler = (0, math.radians(-50), math.radians(-70))
bread.location = BK + Vector((0.06, 0.02, 0.24))
bk.append(bread)
for i, (x, y, z) in enumerate([(-0.10, -0.06, 0.22), (-0.04, -0.08, 0.25), (-0.11, 0.03, 0.24), (-0.06, 0.0, 0.28), (0.0, -0.05, 0.22), (-0.12, -0.02, 0.29), (0.03, 0.06, 0.21), (-0.08, 0.07, 0.25)]):
    b = bpy.data.objects.new  # noqa
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.05 if i % 2 == 0 else 0.04)
    bmesh.ops.translate(bm, vec=BK + Vector((x, y, z)), verts=bm.verts)
    bk.append(make_obj('bloom', bm, [BLOOM if i % 2 == 0 else LEAF]))
hp += bk
hp.append(tube('bkstay', [BK + Vector((0, 0.10, 0.0)), FH + Vector((0, 0.0, 0.05))], 0.006, M['chrome'], 4))
hp.append(lathe('lamp', [(0.0, -0.02), (0.022, -0.018), (0.03, -0.008), (0.032, 0.0), (0.028, 0.05), (0.0, 0.06)],
                12, BK + Vector((0, -0.14, 0.04)), 'Y', [M['head'], M['chrome']], lambda k: 0 if k < 2 else 1))
handle = join('handlebar', hp, root)
set_origin(handle, (HT_TOP + HT_BOT) / 2)
finish(handle, 40)

# wheels: thin tyres, plaster rims, wire spokes
def bike_wheel(name, c):
    prof = [(R - 0.035, 0.012), (R - 0.02, 0.018), (R - 0.004, 0.016), (R + 0.0, 0.0), (R - 0.004, -0.016),
            (R - 0.02, -0.018), (R - 0.035, -0.012), (R - 0.035, 0.012)]
    t = lathe(name, prof, 28, (0, 0, 0), 'X', [M['plaster'], M['tyre']], lambda k: 1 if 1 <= k <= 4 else 0)
    parts = [t, cyl('hub', 0.025, 0.08, (0, 0, 0), 'X', 10, M['chrome'])]
    for i in range(18):
        a = 2 * math.pi * i / 18
        sg = 1 if i % 2 else -1
        parts.append(tube('spoke', [Vector((sg * 0.035, 0, 0)), Vector((sg * 0.008, math.cos(a) * (R - 0.035), math.sin(a) * (R - 0.035)))],
                          0.0025, M['chrome'], 3, caps=False))
    w = join(name, parts)
    w.location = c
    w.parent = root
    finish(w, 40)
    return w

bike_wheel('wheel_r', RH)
bike_wheel('wheel_f', FH)
empty('seat_rider', P(-0.25, 0, 0.99), root)
empty('light_head', BK + Vector((0, -0.18, 0.04)), root)
empty('light_tail', P(-0.66, 0, 0.76), root)
export(OUT)
