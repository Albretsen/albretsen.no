"""Extras + retired-product plaques. python extras.py <tmpdir> <assets-dir>"""
import sys, os, math, base64
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from identity import text_path, jost, mark_svg  # noqa: E402  (identity.py also regenerates on import)
from compose import prep_pavilion

T, A = sys.argv[1], sys.argv[2]
EX = f'{A}/extras'; RT = f'{A}/products/retired'
os.makedirs(EX, exist_ok=True); os.makedirs(RT, exist_ok=True)
INK, FLAMINGO, SHELL, MINT, SKY, SNOW, CREAM, NIGHT = '#22304F', '#EE8FA6', '#F7D3DA', '#A6DCC6', '#9CC8EA', '#FBF7F2', '#F4EADB', '#18223F'
f500, f400 = jost(500), jost(400)
rng = np.random.default_rng(71)

# 1. paper grain tile (seamless: noise is periodic by construction)
n = rng.standard_normal((512, 512)).astype(np.float32)
from scipy.ndimage import gaussian_filter
fine = gaussian_filter(n, 0.6, mode='wrap'); fib = gaussian_filter(rng.standard_normal((512, 512)).astype(np.float32), (0.5, 6), mode='wrap')
g = 0.94 + fine * 0.035 + fib * 0.06  # centred near white: use with mix-blend-mode multiply
Image.fromarray((np.clip(g, 0, 1) * 255).astype('uint8'), 'L').save(f'{EX}/paper-grain.webp', 'WEBP', quality=70)

# 2. deco fan tile (seamless SVG pattern)
fan = []
for i in range(7):
    a0 = math.pi + i * math.pi / 7; a1 = a0 + math.pi / 7
    fan.append(f'<path d="M40 80 L{40 + 36 * math.cos(a0):.2f} {80 + 36 * math.sin(a0):.2f} A36 36 0 0 1 {40 + 36 * math.cos(a1):.2f} {80 + 36 * math.sin(a1):.2f} Z" fill="{[SHELL, SNOW][i % 2]}"/>')
tile = f'''<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <rect width="80" height="80" fill="{SNOW}"/>
  {''.join(fan)}
  <path d="M4 80a36 36 0 0 1 72 0" fill="none" stroke="{FLAMINGO}" stroke-width="1.4"/>
  <path d="M14 80a26 26 0 0 1 52 0" fill="none" stroke="{MINT}" stroke-width="1.4"/>
  <circle cx="40" cy="80" r="7" fill="{FLAMINGO}"/>
  <path d="M-36 40a36 36 0 0 1 72 0M44 40a36 36 0 0 1 72 0" fill="none" stroke="{SKY}" stroke-width="1" opacity=".55"/>
</svg>
'''
open(f'{EX}/deco-fan-tile.svg', 'w').write(tile)

# 3. sun-path diagram: solar altitude through the day at 59.9 N on the solstices and equinox
def altitude(lat, decl, hour):
    H = math.radians(15 * (hour - 12)); la = math.radians(lat); de = math.radians(decl)
    return math.degrees(math.asin(math.sin(la) * math.sin(de) + math.cos(la) * math.cos(de) * math.cos(H)))
W, H0, X0, Y0, sx, sy = 640, 300, 40, 250, (640 - 80) / 24, 3.6
def path(decl):
    pts = []
    for k in range(0, 241):
        hr = k / 10; a = altitude(59.9, decl, hr)
        pts.append((X0 + hr * sx, Y0 - max(a, -8) * sy))
    return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)
winter_peak = altitude(59.9, -23.44, 12)
lab = lambda t, x, y, anchor='start', fill=INK: f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="10" letter-spacing="1.6" fill="{fill}">{t}</text>'
grid = ''.join(f'<path d="M{X0 + h * sx:.1f} {Y0 + 6}V{Y0 - 60 * sy:.1f}" stroke="{INK}" stroke-opacity=".08"/>' for h in range(0, 25, 3))
grid += ''.join(f'<path d="M{X0} {Y0 - a * sy:.1f}H{W - X0}" stroke="{INK}" stroke-opacity="{.25 if a == 0 else .08}"/>' for a in (0, 15, 30, 45))
sunp = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H0}" width="{W}" height="{H0}" role="img" aria-label="Solar altitude through the day at 59.9 degrees north: midwinter, equinox and midsummer">
  <rect width="{W}" height="{H0}" rx="18" fill="{SNOW}"/>
  {grid}
  <path d="{path(23.44)}" fill="none" stroke="{SKY}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="{path(0)}" fill="none" stroke="{MINT}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="{path(-23.44)}" fill="none" stroke="{FLAMINGO}" stroke-width="3.2" stroke-linecap="round"/>
  <circle cx="{X0 + 12 * sx:.1f}" cy="{Y0 - winter_peak * sy:.1f}" r="7" fill="{FLAMINGO}"/>
  {lab(f'MIDWINTER NOON {winter_peak:.1f}°', X0 + 12 * sx + 14, Y0 - winter_peak * sy + 4, fill=INK)}
  {lab('MIDSUMMER', X0 + 12 * sx, Y0 - altitude(59.9, 23.44, 12) * sy - 10, 'middle')}
  {lab('EQUINOX', X0 + 12 * sx, Y0 - altitude(59.9, 0, 12) * sy - 10, 'middle')}
  {lab('HORIZON', W - X0, Y0 - 6, 'end')}
  {lab('00', X0, Y0 + 22, 'middle')}{lab('06', X0 + 6 * sx, Y0 + 22, 'middle')}{lab('12', X0 + 12 * sx, Y0 + 22, 'middle')}{lab('18', X0 + 18 * sx, Y0 + 22, 'middle')}{lab('24', X0 + 24 * sx, Y0 + 22, 'middle')}
  {lab('SOLAR ALTITUDE · 59.9° N', X0, 30)}
</svg>
'''
open(f'{EX}/sun-path.svg', 'w').write(sunp)

# 4. snow-edge divider (real snow crest, transparent above) 1920x220
s = np.load(f'{T}/L_s.npy')
Hs = s.shape[0]
rows = np.where(s[..., 3].mean(1) > 0.02)[0]; r0 = rows.min() - 4
strip = s[r0:r0 + 330]
im = Image.fromarray((np.clip(strip, 0, 1) * 255).astype('uint8'), 'RGBA').resize((1920, round(330 * 1920 / 2560)), Image.LANCZOS)
im.save(f'{EX}/snow-edge.webp', 'WEBP', quality=78, alpha_quality=85, method=6)

# 5. speed-lines divider
open(f'{EX}/speed-lines.svg', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 40" width="240" height="40" aria-hidden="true">
  <circle cx="120" cy="12" r="7" fill="{FLAMINGO}"/>
  <rect x="40" y="20" width="160" height="3" rx="1.5" fill="{INK}"/>
  <rect x="70" y="27" width="100" height="3" rx="1.5" fill="{SKY}"/>
  <rect x="98" y="34" width="44" height="3" rx="1.5" fill="{MINT}"/>
</svg>
''')

# 6. stamp (perforated) with a vector miniature of the pavilion
perf = ''.join(f'<circle cx="{x}" cy="0" r="5"/><circle cx="{x}" cy="300" r="5"/>' for x in range(10, 240, 20)) + \
       ''.join(f'<circle cx="0" cy="{y}" r="5"/><circle cx="240" cy="{y}" r="5"/>' for y in range(10, 300, 20))
dw, ww = text_path(f500, 'ALBRETSEN AS', 15, 0.3, 0, 0)
d2, w2 = text_path(f400, 'NORWAY  2026', 10, 0.3, 0, 0)
stamp = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 300" width="240" height="300" role="img" aria-label="Albretsen AS stamp">
  <defs><mask id="perf"><rect width="240" height="300" fill="#fff"/><g fill="#000">{perf}</g></mask>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7F8FC0"/><stop offset=".75" stop-color="#F2B6C0"/></linearGradient></defs>
  <g mask="url(#perf)">
    <rect width="240" height="300" fill="{SNOW}"/>
    <rect x="18" y="18" width="204" height="204" fill="url(#sky)"/>
    <circle cx="176" cy="132" r="13" fill="#FFE3C4"/>
    <path d="M18 156 L60 128 L92 140 L128 120 L170 146 L222 136 V222 H18 Z" fill="#D9907F"/>
    <rect x="18" y="168" width="204" height="54" fill="#F3D3DE"/>
    <g transform="translate(120 172)">
      <rect x="-62" y="-22" width="124" height="22" rx="10" fill="{FLAMINGO}"/>
      <rect x="-68" y="-26" width="136" height="5" rx="2" fill="{SNOW}"/>
      <rect x="-14" y="-40" width="28" height="40" fill="{MINT}"/>
      <rect x="-10" y="-46" width="20" height="6" fill="{MINT}"/>
      <circle cx="0" cy="-30" r="4.5" fill="#FFE7C2"/>
      <rect x="-5" y="-14" width="10" height="14" fill="{SNOW}"/>
      {''.join(f'<rect x="{x}" y="-18" width="7" height="10" fill="#FFE7C2"/>' for x in (-52, -40, -28, 21, 33, 45))}
      <rect x="-26" y="-57" width="52" height="5" rx="1" fill="{SNOW}"/>
    </g>
    <rect x="18" y="18" width="204" height="204" fill="none" stroke="{INK}" stroke-width="1"/>
    <g transform="translate({120 - ww / 2:.1f} 252)"><path d="{dw}" fill="{INK}"/></g>
    <g transform="translate({120 - w2 / 2:.1f} 274)"><path d="{d2}" fill="{INK}" opacity=".6"/></g>
  </g>
</svg>
'''
open(f'{EX}/stamp.svg', 'w').write(stamp)

# 7. cut-outs
for pre, name in (('L', 'pavilion'), ('B', 'ground-station')):
    p = np.load(f'{T}/{pre}_p.npy')
    pc, pa = prep_pavilion(p)
    # drop the long cast shadow, keep only the object + its contact shade
    rgba = np.dstack([pc, pa])
    ys, xs = np.where(pa[..., 0] > 0.6)
    box = (max(xs.min() - 30, 0), max(ys.min() - 30, 0), min(xs.max() + 30, p.shape[1]), min(ys.max() + 30, p.shape[0]))
    im = Image.fromarray((np.clip(rgba, 0, 1) * 255).astype('uint8'), 'RGBA').crop(box)
    im.thumbnail((1200, 1200), Image.LANCZOS)
    im.save(f'{EX}/{name}-cutout.webp', 'WEBP', quality=84, alpha_quality=90, method=6)
    print(name, im.size)

# 8. rooftop sign as a header ornament
dS, wS = text_path(f500, 'ALBRETSEN', 48, 0.34, 0, 0)
posts = ''.join(f'<rect x="{x:.1f}" y="62" width="3" height="40" fill="{INK}"/>' for x in (wS * 0.12, wS * 0.37, wS * 0.63, wS * 0.88))
open(f'{EX}/rooftop-sign.svg', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 0 {wS + 20:.1f} 104" width="{wS + 20:.0f}" height="104" role="img" aria-label="Albretsen">
  {posts}
  <g transform="translate(0 56)"><path d="{dS}" fill="currentColor"/></g>
</svg>
''')

# ---------- retired product plaques (stand-ins in the house style) ----------
icons = {
    'polyglot-pilot': f'<text x="0" y="0" font-family="Instrument Serif, Georgia, serif" font-size="30" text-anchor="middle" dominant-baseline="central" fill="{INK}">Aa</text>',
    'pinpoint': f'<path d="M0 16c-8-10-12-15-12-22a12 12 0 0 1 24 0c0 7-4 12-12 22z" fill="{FLAMINGO}"/><circle cx="0" cy="-6" r="4.5" fill="{SNOW}"/>',
    'webvakt': f'<path d="M-18 0c6-9 12-13 18-13s12 4 18 13c-6 9-12 13-18 13s-12-4-18-13z" fill="none" stroke="{INK}" stroke-width="2.6"/><circle r="6" fill="{FLAMINGO}"/>',
    'joke-central': f'<circle r="15" fill="none" stroke="{INK}" stroke-width="2.6"/><path d="M-8 3a8 8 0 0 0 16 0" fill="none" stroke="{FLAMINGO}" stroke-width="3" stroke-linecap="round"/><circle cx="-5" cy="-5" r="2" fill="{INK}"/><circle cx="5" cy="-5" r="2" fill="{INK}"/>',
    'tryggere-hyring': f'<path d="M0-16l13 5v8c0 9-6 15-13 19-7-4-13-10-13-19v-8z" fill="none" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/><path d="M-6 0l4 4 8-9" fill="none" stroke="{FLAMINGO}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    'early-apps': f'<rect x="-12" y="-16" width="24" height="32" rx="4" fill="none" stroke="{INK}" stroke-width="2.6"/><text x="0" y="5" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="15" fill="{FLAMINGO}">%</text>',
}
retired = [
    ('luma', 'LUMA', '2026', SHELL), ('polyglot-pilot', 'POLYGLOT PILOT', '2025', MINT), ('pinpoint', 'PINPOINT', '2025', SKY),
    ('webvakt', 'WEBVAKT', '2024', SHELL), ('joke-central', 'JOKE CENTRAL', '2024', MINT), ('tryggere-hyring', 'TRYGGERE HYRING', '2023', SKY),
    ('early-apps', 'EARLY APPS', '2021', SHELL),
]
luma_logo = base64.b64encode(open(os.path.join(A, '../../_shared/products/luma/logo.png'), 'rb').read()).decode()
for pid, label, year, col in retired:
    size = 17 if len(label) < 12 else 14
    dl, wl = text_path(f500, label, size, 0.3, 0, 0)
    dy, wy = text_path(f400, f'SINCE {year} · RETIRED', 9, 0.3, 0, 0)
    if pid == 'luma':  # real logo, unchanged
        emblem = f'<image href="data:image/png;base64,{luma_logo}" x="-62" y="-17" width="124" height="34.4" preserveAspectRatio="xMidYMid meet"/>'
    else:
        emblem = icons[pid]
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="320" height="180" role="img" aria-label="{label.title()}, retired">
  <rect x="2" y="2" width="316" height="176" rx="22" fill="{col}"/>
  <rect x="12" y="12" width="296" height="156" rx="15" fill="none" stroke="{INK}" stroke-width="1.4"/>
  <rect x="17" y="17" width="286" height="146" rx="11" fill="none" stroke="{SNOW}" stroke-width="1"/>
  <circle cx="34" cy="90" r="4" fill="{SNOW}" stroke="{INK}" stroke-width="1"/><circle cx="286" cy="90" r="4" fill="{SNOW}" stroke="{INK}" stroke-width="1"/>
  <g transform="translate(160 62)">{emblem}</g>
  <g transform="translate({160 - wl / 2:.1f} 122)"><path d="{dl}" fill="{INK}"/></g>
  <g transform="translate({160 - wy / 2:.1f} 146)"><path d="{dy}" fill="{INK}" opacity=".55"/></g>
</svg>
'''
    open(f'{RT}/{pid}.svg', 'w').write(svg)
print('extras ok')
