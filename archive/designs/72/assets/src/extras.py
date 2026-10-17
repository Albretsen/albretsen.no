import os, math, random
import numpy as np
from PIL import Image, ImageFilter

A = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-12/designs/72/assets'
E = os.path.join(A, 'extras'); os.makedirs(E, exist_ok=True)
P = os.path.join(A, 'products'); os.makedirs(P, exist_ok=True)

def hexrgb(h): h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], np.float32)

# 1. Seamless clapboard tiles (white and falu red), 512x512, 8 boards.
def clapboard(color, name, boards=8, size=512):
    rng = np.random.default_rng(4)
    base = hexrgb(color)
    y = np.arange(size, dtype=np.float32)[:, None]
    bh = size / boards
    t = (y % bh) / bh
    shade = np.where(t < 0.06, 0.78 + t / 0.06 * 0.12, 0.98 + 0.06 * (1 - t))  # shadow line under each lap, light at top
    shade = shade - np.where(t > 0.97, 0.12, 0)
    # fine grain running horizontally
    grain = rng.standard_normal((1, size)).astype(np.float32)
    grain = np.convolve(grain[0], np.ones(9) / 9, 'same')[None, :] * 0.012
    noise = rng.standard_normal((size, size)).astype(np.float32) * 0.01
    img = base[None, None, :] * (shade[..., None] + grain[..., None] + noise[..., None])
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(os.path.join(E, name + '.webp'), quality=82)
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).resize((256, 256), Image.LANCZOS).save(os.path.join(E, name + '.png'), optimize=True)

clapboard('#F3EEE3', 'clapboard-white')
clapboard('#8F2B20', 'clapboard-falu')

# 2. Whitewash / snow-paper grain, tileable 256 px, used as a page overlay at low opacity.
rng = np.random.default_rng(7)
n = rng.standard_normal((256, 256)).astype(np.float32)
f = np.fft.fft2(n); ky = np.fft.fftfreq(256)[:, None]; kx = np.fft.fftfreq(256)[None, :]
k = np.sqrt(kx * kx + ky * ky) + 1e-3
lowp = np.real(np.fft.ifft2(f / (k ** 0.9)))
lowp = (lowp - lowp.mean()) / lowp.std()
fine = rng.standard_normal((256, 256)).astype(np.float32)
v = 246 + lowp * 2.2 + fine * 3
Image.fromarray(np.clip(v, 0, 255).astype(np.uint8), 'L').save(os.path.join(E, 'whitewash-grain.png'), optimize=True)

# 3. Bougainvillea sprig cut-out (SVG): a curving stem with papery three-bract clusters.
random.seed(72)
PET = ['#B8364B', '#C8475D', '#9C2A3B', '#D9677F', '#A4313F', '#8F2B20']
LEAF = ['#3E5A3F', '#4C6B47', '#35503A']
def bract(cx, cy, r, rot, col):
    out = []
    for k in range(3):
        a = math.radians(rot + k * 120)
        px = cx + r * 0.48 * math.cos(a); py = cy + r * 0.48 * math.sin(a)
        out.append(f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="{r * 0.56:.1f}" ry="{r * 0.44:.1f}" transform="rotate({math.degrees(a):.0f} {px:.1f} {py:.1f})" fill="{col}"/>')
        out.append(f'<path d="M{cx:.1f} {cy:.1f}L{cx + r * 0.85 * math.cos(a):.1f} {cy + r * 0.85 * math.sin(a):.1f}" stroke="#fff" stroke-opacity=".25" stroke-width="0.7"/>')
    out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r * 0.13:.1f}" fill="#F3E3B0"/>')
    return ''.join(out)
def bez(p0, p1, p2, p3, t):
    u = 1 - t
    return (u**3*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t**3*p3[0], u**3*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t**3*p3[1])
parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="600" height="420" role="img" aria-label="Bougainvillea sprig">']
stem = 'M20 40 C 160 20, 260 90, 330 170 S 470 330, 580 360'
parts.append(f'<path d="{stem}" fill="none" stroke="#5A4A3A" stroke-width="3.2" stroke-linecap="round"/>')
pts = []
for i in range(24): pts.append(bez((20, 40), (160, 20), (260, 90), (330, 170), i / 23))
for i in range(24): pts.append(bez((330, 170), (400, 250), (470, 330), (580, 360), i / 23))
for (x, y) in pts[::3]:
    for _ in range(2):
        lx = x + random.uniform(-26, 26); ly = y + random.uniform(-26, 26)
        ang = random.uniform(0, 360)
        c = random.choice(LEAF)
        parts.append(f'<ellipse cx="{lx:.1f}" cy="{ly:.1f}" rx="{random.uniform(10, 16):.1f}" ry="{random.uniform(5, 7):.1f}" transform="rotate({ang:.0f} {lx:.1f} {ly:.1f})" fill="{c}"/>')
for (x, y) in pts:
    for _ in range(random.randint(1, 3)):
        bx = x + random.uniform(-22, 22); by = y + random.uniform(-14, 30)
        parts.append(bract(bx, by, random.uniform(10, 16), random.uniform(0, 360), random.choice(PET)))
parts.append('</svg>')
open(os.path.join(E, 'bougainvillea-sprig.svg'), 'w').write(''.join(parts))

# 4. Low-sun disc with its long shadow (SVG), a small illustration for section breaks.
open(os.path.join(E, 'low-sun.svg'), 'w').write('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 160" width="480" height="160" role="img" aria-label="Low winter sun over snow">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86A9D3"/><stop offset=".62" stop-color="#E4D6DA"/><stop offset="1" stop-color="#F7C49B"/></linearGradient>
<linearGradient id="snow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C9D3E3"/><stop offset=".7" stop-color="#F3E9E2"/><stop offset="1" stop-color="#FFE9D2"/></linearGradient>
<linearGradient id="sh" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#4B5663" stop-opacity=".55"/><stop offset="1" stop-color="#4B5663" stop-opacity="0"/></linearGradient>
<radialGradient id="glow" cx=".82" cy=".66" r=".4"><stop offset="0" stop-color="#FFE4C2" stop-opacity=".9"/><stop offset="1" stop-color="#FFE4C2" stop-opacity="0"/></radialGradient></defs>
<rect width="480" height="106" fill="url(#sky)"/><rect width="480" height="106" fill="url(#glow)"/>
<circle cx="396" cy="100" r="15" fill="#FFF1DE"/>
<rect y="104" width="480" height="56" fill="url(#snow)"/>
<path d="M232 106 L 244 106 L 40 150 L 8 150 Z" fill="url(#sh)"/>
<rect x="232" y="64" width="12" height="42" rx="2" fill="#2F3D36"/><path d="M226 72 Q238 30 250 72 Z" fill="#2F3D36"/>
</svg>''')

# 5. Magazine folio furniture (SVG): running head and page numbers for the spread.
open(os.path.join(E, 'folio.svg'), 'w').write('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 40" width="1200" height="40" role="img" aria-label="Folio">
<g font-family="Albert Sans, system-ui, sans-serif" font-size="11" letter-spacing="2.2" fill="#4B5663">
<text x="0" y="24">ALBRETSEN AS</text><text x="600" y="24" text-anchor="middle" fill="#8F2B20">&#9675;</text><text x="1200" y="24" text-anchor="end">NO. 01 &#8212; WINTER LIGHT</text></g>
<path d="M0 34H1200" stroke="#4B5663" stroke-opacity=".25"/></svg>''')

# 6. Retired products: small enamel door plaques, one per product, in the house palette.
retired = [
    ('luma', 'Luma', '2026', 'circle'),
    ('polyglot-pilot', 'Polyglot Pilot', '2025', 'speech'),
    ('pinpoint', 'PinPoint', '2025', 'pin'),
    ('webvakt', 'WebVakt', '2024', 'eye'),
    ('joke-central', 'Joke Central', '2024', 'smile'),
    ('tryggere-hyring', 'Tryggere Hyring', '2023', 'shield'),
    ('early-apps', 'Early apps', '2021', 'percent'),
]
ICON = {
    'circle': '<circle cx="40" cy="34" r="11" fill="none" stroke="#323A44" stroke-width="2.4"/><circle cx="46" cy="40" r="3" fill="#8F2B20"/>',
    'speech': '<path d="M27 25h26a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H38l-7 6v-6h-4a4 4 0 0 1-4-4V29a4 4 0 0 1 4-4z" fill="none" stroke="#323A44" stroke-width="2.4" stroke-linejoin="round"/><path d="M31 33h18M31 38h11" stroke="#8F2B20" stroke-width="2.4" stroke-linecap="round"/>',
    'pin': '<path d="M40 50s-11-11-11-19a11 11 0 0 1 22 0c0 8-11 19-11 19z" fill="none" stroke="#323A44" stroke-width="2.4" stroke-linejoin="round"/><circle cx="40" cy="31" r="3.6" fill="#8F2B20"/>',
    'eye': '<path d="M24 35s6-10 16-10 16 10 16 10-6 10-16 10-16-10-16-10z" fill="none" stroke="#323A44" stroke-width="2.4" stroke-linejoin="round"/><circle cx="40" cy="35" r="4.5" fill="#8F2B20"/>',
    'smile': '<circle cx="40" cy="35" r="13" fill="none" stroke="#323A44" stroke-width="2.4"/><path d="M34 38q6 6 12 0" fill="none" stroke="#8F2B20" stroke-width="2.4" stroke-linecap="round"/><circle cx="35" cy="31" r="1.6" fill="#323A44"/><circle cx="45" cy="31" r="1.6" fill="#323A44"/>',
    'shield': '<path d="M40 22l12 4v9c0 8-6 13-12 15-6-2-12-7-12-15v-9z" fill="none" stroke="#323A44" stroke-width="2.4" stroke-linejoin="round"/><path d="M35 36l4 4 7-8" fill="none" stroke="#8F2B20" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    'percent': '<path d="M30 46L50 24" stroke="#323A44" stroke-width="2.4" stroke-linecap="round"/><circle cx="32" cy="28" r="4" fill="none" stroke="#8F2B20" stroke-width="2.4"/><circle cx="48" cy="42" r="4" fill="none" stroke="#8F2B20" stroke-width="2.4"/>',
}
os.makedirs(os.path.join(P, 'retired'), exist_ok=True)
for pid, name, year, icon in retired:
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="160" height="200" role="img" aria-label="{name}, retired {year}">
<rect x="2" y="2" width="76" height="96" rx="38" fill="#F6F1E7" stroke="#C8B9A4" stroke-width="1.5"/>
<rect x="7" y="7" width="66" height="86" rx="33" fill="none" stroke="#323A44" stroke-opacity=".35" stroke-width="1"/>
<g opacity=".86">{ICON[icon]}</g>
<text x="40" y="67" text-anchor="middle" font-family="Albert Sans, system-ui, sans-serif" font-size="{7.2 if len(name) < 12 else 6}" letter-spacing=".6" fill="#323A44">{name.upper()}</text>
<text x="40" y="78" text-anchor="middle" font-family="DM Mono, ui-monospace, monospace" font-size="6" fill="#8F2B20">{year}</text>
<circle cx="40" cy="89" r="1.6" fill="#C8B9A4"/></svg>'''
    open(os.path.join(P, 'retired', pid + '.svg'), 'w').write(svg)
print('ok')
