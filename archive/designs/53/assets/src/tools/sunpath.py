import sys; sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.Xjwh7Qx8vB/scr')
from hl import COL, hexc, OUT
from identity import text_path, SER, MONO
import math, datetime, os
os.makedirs(OUT + 'illustration', exist_ok=True)
U, O, S, V, P, E, C = (hexc(COL[k]) for k in ('umber', 'ochre', 'spark', 'vellum', 'peat', 'ember', 'clay'))
rad = math.pi / 180
def alt(dt, lat=59.9139, lon=10.7522):
    jd = dt.timestamp() / 86400 + 2440587.5; n = jd - 2451545.0
    L = (280.46 + .9856474 * n) % 360; g = ((357.528 + .9856003 * n) % 360) * rad
    lam = (L + 1.915 * math.sin(g) + .02 * math.sin(2 * g)) * rad; eps = (23.439 - .0000004 * n) * rad
    dec = math.asin(math.sin(eps) * math.sin(lam)); ra = math.atan2(math.cos(eps) * math.sin(lam), math.cos(lam))
    gmst = (18.697374558 + 24.06570982441908 * n) % 24; H = (gmst * 15 + lon) * rad - ra
    return math.asin(math.sin(lat * rad) * math.sin(dec) + math.cos(lat * rad) * math.cos(dec) * math.cos(H)) / rad

W, H = 1200, 520
x0, x1 = 90, 1150
ytop, ybot = 50, 440
amin, amax = -60, 56
def X(h): return x0 + (x1 - x0) * h / 24
def Y(a): return ytop + (ybot - ytop) * (amax - a) / (amax - amin)
els = []
# horizon
hy = Y(0)
els.append(f'<line x1="{x0}" y1="{hy:.1f}" x2="{x1}" y2="{hy:.1f}" stroke="{O}" stroke-width="1.2"/>')
# twilight band (civil, -6..0)
els.append(f'<rect x="{x0}" y="{hy:.1f}" width="{x1-x0}" height="{Y(-6)-hy:.1f}" fill="{O}" fill-opacity=".08"/>')
for h in range(0, 25, 3):
    els.append(f'<line x1="{X(h):.1f}" y1="{hy-4:.1f}" x2="{X(h):.1f}" y2="{hy+4:.1f}" stroke="{O}" stroke-width="1"/>')
    d, w = text_path(MONO, f'{h:02d}', 13, 0, 0, 1.5)
    d, _ = text_path(MONO, f'{h:02d}', 13, X(h) - w / 2, ybot + 52, 1.5)
    els.append(f'<path d="{d}" fill="{V}" fill-opacity=".6"/>')
days = [('JUN 21', datetime.datetime(2026, 6, 21), S, 1.0), ('MAR 20', datetime.datetime(2026, 3, 20), O, .8), ('DEC 21', datetime.datetime(2026, 12, 21), C, .7)]
for label, day, col, k in days:
    pts = []
    for m in range(0, 24 * 60 + 1, 12):
        t = day + datetime.timedelta(minutes=m - 60)  # local CET = UTC+1 -> utc = local - 1h
        t = t.replace(tzinfo=datetime.timezone.utc)
        a = alt(t)
        pts.append((m / 60, a))
    for h, a in pts:
        if a < amin: continue
        if a >= 0:
            r = 1.2 + 4.2 * (a / 54) ** .7
            els.append(f'<circle cx="{X(h):.1f}" cy="{Y(a):.1f}" r="{r:.2f}" fill="{col}"/>')
        else:
            els.append(f'<circle cx="{X(h):.1f}" cy="{Y(a):.1f}" r="1.1" fill="{col}" fill-opacity=".45"/>')
    # label at noon peak
    hp, ap = max(pts, key=lambda p: p[1])
    d, w = text_path(MONO, label, 13, 0, 0, 2)
    d, _ = text_path(MONO, label, 13, X(hp) - w / 2, Y(ap) - 16, 2)
    els.append(f'<path d="{d}" fill="{col}"/>')
# title
d, _ = text_path(SER, 'The sun over Oslo', 30, x0, 40)
els.append(f'<path d="{d}" fill="{V}"/>')
d, w = text_path(MONO, '59.91 N  10.75 E  CET', 12, 0, 0, 2)
d, _ = text_path(MONO, '59.91 N  10.75 E  CET', 12, x1 - w, 34, 2)
els.append(f'<path d="{d}" fill="{O}"/>')
d, _ = text_path(MONO, 'HORIZON', 11, x0 + 6, hy - 8, 2)
els.append(f'<path d="{d}" fill="{O}" fill-opacity=".8"/>')
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="Solar altitude over Oslo across a day at the solstices and the equinox">\n' + '\n'.join(els) + '\n</svg>\n'
open(OUT + 'illustration/sun-path-oslo.svg', 'w').write(svg)
print(round(len(svg) / 1024), 'KB')
