"""Builds assets/motion/mark-sunrise.json: a Lottie of the Halflight mark.
Markers: 'intro' (0-150) spark on the horizon, the sun rises, the reflection prints dot by dot;
'loop' (150-270) the reflection breathes like light on water (seamless)."""
import sys, json, math, os
sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.Xjwh7Qx8vB/scr')
from hl import COL, OUT
os.makedirs(OUT + 'motion', exist_ok=True)
K = 8.0  # 64-unit mark -> 512 comp
def rgb(k): return [c / 255 for c in COL[k]] + [1]
OCH, SPK = rgb('ochre'), rgb('spark')
FR, OP = 60, 270
cx, cy, r = 32 * K, 33 * K, 22 * K

def st(v): return {'a': 0, 'k': v}
def anim(keys, ox=.33, ix=.2, iy=1.0):
    out = []
    for n, (t, v) in enumerate(keys):
        kf = {'t': t, 's': v if isinstance(v, list) else [v]}
        if n < len(keys) - 1:
            kf['o'] = {'x': [ox], 'y': [0]}; kf['i'] = {'x': [ix], 'y': [iy]}
        out.append(kf)
    return {'a': 1, 'k': out}
def tr(p=None, s=None, o=None):
    return {'ty': 'tr', 'p': p or st([0, 0]), 'a': st([0, 0]), 's': s or st([100, 100]), 'r': st(0), 'o': o or st(100), 'sk': st(0), 'sa': st(0)}
def layer(ind, nm, shapes, ks=None, mask=None):
    L = {'ddd': 0, 'ind': ind, 'ty': 4, 'nm': nm, 'sr': 1,
         'ks': ks or {'o': st(100), 'r': st(0), 'p': st([0, 0, 0]), 'a': st([0, 0, 0]), 's': st([100, 100, 100])},
         'ao': 0, 'shapes': shapes, 'ip': 0, 'op': OP, 'st': 0, 'bm': 0}
    if mask: L['hasMask'] = True; L['masksProperties'] = [mask]
    return L
def ellipse_group(d, col, p=None, s=None, o=None):
    return {'ty': 'gr', 'nm': 'g', 'it': [{'ty': 'el', 'nm': 'e', 'd': 1, 'p': st([0, 0]), 's': st([d, d])},
            {'ty': 'fl', 'nm': 'f', 'c': st(col), 'o': st(100), 'r': 1, 'bm': 0}, tr(p, s, o)]}

layers = []; ind = 1
# spark: a point of light on the horizon, flares then hands over to the sun
layers.append(layer(ind, 'spark', [ellipse_group(26, SPK, st([cx, cy]),
    anim([(0, [0, 0]), (14, [140, 140]), (30, [60, 60]), (52, [0, 0])]),
    anim([(0, 0), (8, 100), (40, 100), (52, 0)]))])); ind += 1
# horizon flash: a hairline that draws outward from the spark
layers.append(layer(ind, 'horizon', [{'ty': 'gr', 'nm': 'g', 'it': [
    {'ty': 'rc', 'nm': 'r', 'd': 1, 'p': st([0, 0]), 's': anim([(6, [0, 3]), (34, [2 * r + 40, 3]), (70, [2 * r, 2])]), 'r': st(2)},
    {'ty': 'fl', 'nm': 'f', 'c': st(SPK), 'o': st(100), 'r': 1, 'bm': 0},
    tr(st([cx, cy + 1]), None, anim([(6, 0), (14, 100), (60, 100), (84, 0)]))]}])); ind += 1
# the sun rises from behind the horizon (masked to the sky)
mask = {'inv': False, 'mode': 'a', 'nm': 'sky', 'o': st(100), 'x': st(0),
        'pt': st({'i': [[0, 0]] * 4, 'o': [[0, 0]] * 4, 'v': [[0, 0], [512, 0], [512, cy], [0, cy]], 'c': True})}
layers.append(layer(ind, 'sun', [ellipse_group(2 * r, OCH, anim([(18, [cx, cy + r]), (78, [cx, cy])], .4, .15))], mask=mask)); ind += 1

# reflection: tapering halftone rows (same geometry as identity/mark.svg)
k = r / (22 * K)
pitch = 4.4 * K * k; gap = 1.6 * K * k
dots = []
for i in range(5):
    t = i / 4
    y = cy + gap + pitch * .5 + i * pitch * .87
    half = r * (1 - .5 * t)
    off = pitch / 2 if i % 2 else 0
    n = int(half / pitch) + 1
    for j in range(-n, n + 1):
        x = j * pitch + off
        if abs(x) > half: continue
        u = abs(x) / half
        rad = pitch * .5 * (1 - .78 * t) * (1 - u * u) ** .5
        if rad < .28 * K * k: continue
        dots.append((i, x, y, rad, u))
for (i, x, y, rad, u) in dots:
    t0 = 60 + i * 9 + round(u * 14)
    # breathing loop: seamless 120-frame sine, phase by column
    ph = (x / r) * math.pi
    loop = []
    for s in range(0, 121, 15):
        v = 100 - 22 * (1 + math.sin(2 * math.pi * s / 120 + ph)) / 2
        loop.append((150 + s, [v, v]))
    v150 = loop[0][1][0]
    keys = [(t0, [0, 0]), (t0 + 22, [118, 118]), (t0 + 34, [100, 100]), (140, [100, 100]), (150, [v150, v150])] + loop[1:]
    layers.append(layer(ind, f'dot{ind}', [ellipse_group(2 * rad, OCH, st([cx + x, y]), anim(keys, .3, .25))])); ind += 1

doc = {'v': '5.9.0', 'fr': FR, 'ip': 0, 'op': OP, 'w': 512, 'h': 512, 'nm': 'Halflight mark: sunrise', 'ddd': 0, 'assets': [],
       'markers': [{'tm': 0, 'cm': 'intro', 'dr': 150}, {'tm': 150, 'cm': 'loop', 'dr': 120}],
       'layers': list(reversed(layers))}
s = json.dumps(doc, separators=(',', ':'))
open(OUT + 'motion/mark-sunrise.json', 'w').write(s)
print(len(dots), 'dots', round(len(s) / 1024), 'KB')
