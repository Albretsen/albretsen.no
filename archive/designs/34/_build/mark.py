# Generates the Albretsen "Prism A" mark: a 5-row triangular lattice (25 facets)
# with the counter and the leg-gap knocked out. Usage: python3 mark.py <outdir>
import math, sys, os
out = sys.argv[1]
S = 100.0; H = S * math.sqrt(3) / 2; ROWS = 5
MINT = '#39FD9E'; INK = '#060807'
remove = {(2, 2), (4, 3), (4, 4), (4, 5)}

def tri(r, i):
    x0 = -r * S / 2 + (i // 2) * S
    y0 = r * H; y1 = y0 + H
    if i % 2 == 0:
        return [(x0, y0), (x0 + S / 2, y1), (x0 - S / 2, y1)]
    return [(x0, y0), (x0 + S, y0), (x0 + S / 2, y1)]

def shade(r, i):
    up = i % 2 == 0
    cx = sum(p[0] for p in tri(r, i)) / 3
    v = (1.0 if up else 0.80) - 0.06 * (cx / (S * ROWS / 2)) - 0.035 * r
    return max(0.55, min(1, v))

def shrink(pts, f):
    cx = sum(p[0] for p in pts) / 3; cy = sum(p[1] for p in pts) / 3
    return [(cx + (x - cx) * f, cy + (y - cy) * f) for x, y in pts]

def d(pts):
    return 'M' + 'L'.join(f'{x:.2f} {y:.2f}' for x, y in pts) + 'Z'

W = S * ROWS; HH = H * ROWS

def build(mode, gap, bg=None, pad=0.0, mono=None):
    vb_x = -W / 2 - pad * W; vb_y = -pad * W; vw = W * (1 + 2 * pad); vh = HH + 2 * pad * W
    if bg:
        vh = vw; vb_y = -(vw - HH) / 2 - 8
    parts = []
    if bg:
        parts.append(f'<rect x="{vb_x:.2f}" y="{vb_y:.2f}" width="{vw:.2f}" height="{vh:.2f}" rx="{vw*0.22:.2f}" fill="{bg}"/>')
    for r in range(ROWS):
        for i in range(2 * r + 1):
            if (r, i) in remove:
                continue
            if mode == 'solid':
                parts.append(f'<path fill="currentColor" d="{d(shrink(tri(r, i), 1.015))}"/>')
                continue
            pts = shrink(tri(r, i), gap)
            if (r, i) == (0, 0):
                fill = f'fill="{MINT}"'
            elif (r, i) in {(3, 5), (4, 7)}:
                fill = f'fill="{MINT}" fill-opacity="{0.85 if (r, i) == (3, 5) else 0.6}"'
            else:
                fill = f'fill="#FFFFFF" fill-opacity="{shade(r, i):.2f}"'
            parts.append(f'<path {fill} d="{d(pts)}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb_x:.2f} {vb_y:.2f} {vw:.2f} {vh:.2f}" role="img" aria-label="Albretsen AS">'
            '<title>Albretsen AS</title>' + ''.join(parts) + '</svg>')

def favicon_small():
    # 16/32 px: facets merge into a solid white A, only the apex stays mint
    pad = 0.12; vb_x = -W / 2 - pad * W; vw = W * (1 + 2 * pad); vb_y = -(vw - HH) / 2 - 8
    parts = [f'<rect x="{vb_x:.2f}" y="{vb_y:.2f}" width="{vw:.2f}" height="{vw:.2f}" rx="{vw*0.22:.2f}" fill="{INK}"/>']
    for r in range(ROWS):
        for i in range(2 * r + 1):
            if (r, i) in remove:
                continue
            fill = MINT if (r, i) == (0, 0) else '#FFFFFF'
            parts.append(f'<path fill="{fill}" d="{d(shrink(tri(r, i), 1.06))}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb_x:.2f} {vb_y:.2f} {vw:.2f} {vw:.2f}" role="img" aria-label="Albretsen AS">'
            + ''.join(parts) + '</svg>')

open(os.path.join(out, 'favicon-small.svg'), 'w').write(favicon_small())
open(os.path.join(out, 'mark.svg'), 'w').write(build('facet', 0.9))
open(os.path.join(out, 'mark-solid.svg'), 'w').write(build('solid', 1))
open(os.path.join(out, 'favicon.svg'), 'w').write(build('facet', 0.86, bg=INK, pad=0.16))
print('ok')
