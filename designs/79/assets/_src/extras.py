import sys, os, json, math
import numpy as np
from PIL import Image
A = sys.argv[1]
OUT = os.path.join(A, 'extras')
rng = np.random.default_rng(4)

# 1. grain tile: neutral film grain with alpha, tiles seamlessly (wrap-around blur)
n = rng.normal(0, 1, (256, 256))
k = np.exp(-np.arange(-2, 3) ** 2 / 1.2); k /= k.sum()
for ax in (0, 1):
    n = sum(np.roll(n, i - 2, axis=ax) * k[i] for i in range(5))
n = (n - n.mean()) / n.std()
v = np.clip(128 + n * 60, 0, 255).astype(np.uint8)
a = np.clip(np.abs(n) * 16, 0, 255).astype(np.uint8)
Image.fromarray(np.dstack([v, v, v, a]), 'RGBA').save(os.path.join(OUT, 'grain.png'), optimize=True)

# 2. the sky through one day: shared stops for motion, the sky ribbon and the theme
HOURS = [
    ('05:00', 'Before light', '#0C1A2B', '#2E4A6E'),
    ('06:10', 'First light', '#1B3557', '#F2A35E'),
    ('07:00', 'Sunrise', '#6F93BF', '#F6C27A'),
    ('09:30', 'Morning', '#8DB6DD', '#F3E3C7'),
    ('12:00', 'Noon', '#6FA3D6', '#D6E7F2'),
    ('15:30', 'Afternoon', '#8CB2D2', '#F1DDB8'),
    ('18:20', 'Long light', '#A8B7C9', '#F3A55E'),
    ('19:40', 'Dusk', '#6B4C7E', '#F2A07A'),
    ('21:00', 'Blue hour', '#1E2F55', '#8A6E95'),
    ('23:30', 'Lamps on', '#08121F', '#13263C'),
]
json.dump([{'time': t, 'name': nm, 'top': a_, 'horizon': b_} for t, nm, a_, b_ in HOURS],
          open(os.path.join(OUT, 'sky-hours.json'), 'w'), indent=2)

W, H = 1200, 360
cw = W / len(HOURS)
defs, bars = [], []
for i, (t, nm, top, hz) in enumerate(HOURS):
    defs.append(f'<linearGradient id="h{i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top}"/><stop offset=".78" stop-color="{hz}"/><stop offset="1" stop-color="{hz}"/></linearGradient>')
    x = i * cw
    bars.append(f'<rect x="{x:.1f}" y="0" width="{cw + .5:.1f}" height="280" fill="url(#h{i})"/>')
    # sun or moon position along an arc through the day
    frac = i / (len(HOURS) - 1)
    alt = [0, .05, .2, .58, 1, .72, .32, .07, 0, 0][i]  # sun altitude through the day
    cy = 262 - alt * 200
    lum = 'night' if i in (0, 8, 9) else 'day'
    if lum == 'day':
        bars.append(f'<circle cx="{x + cw / 2:.1f}" cy="{cy:.1f}" r="9" fill="#FFF4DC"/><circle cx="{x + cw / 2:.1f}" cy="{cy:.1f}" r="22" fill="#FFF4DC" opacity=".18"/>')
    else:
        bars.append(f'<circle cx="{x + cw / 2:.1f}" cy="{62 + i:.1f}" r="7" fill="#E9E4D6"/><circle cx="{x + cw / 2 + 3.5:.1f}" cy="{60 + i:.1f}" r="6" fill="url(#h{i})"/>')
    bars.append(f'<text x="{x + 12:.1f}" y="312" font-family="Schibsted Grotesk, system-ui, sans-serif" font-size="13" letter-spacing="1.5" fill="#1C1A17" opacity=".75">{t}</text>')
    bars.append(f'<text x="{x + 12:.1f}" y="338" font-family="Instrument Serif, Georgia, serif" font-size="19" fill="#1C1A17">{nm}</text>')
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="The sky through one day, from before light to lamps on">
<title>Sky hours</title><defs>{''.join(defs)}</defs>
<rect width="{W}" height="{H}" fill="#F4EBDD"/>{''.join(bars)}
<line x1="0" y1="280" x2="{W}" y2="280" stroke="#1C1A17" stroke-opacity=".25"/>
</svg>
'''
open(os.path.join(OUT, 'sky-hours.svg'), 'w').write(svg)

# 3. horizon rule: a divider with a half sun just rising on the line
rule = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 40" width="480" height="40" aria-hidden="true">
<defs><linearGradient id="hr" x1="0" x2="1"><stop offset="0" stop-color="currentColor" stop-opacity="0"/><stop offset=".3" stop-color="currentColor" stop-opacity=".5"/><stop offset=".7" stop-color="currentColor" stop-opacity=".5"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient>
<clipPath id="above"><rect x="0" y="0" width="480" height="28"/></clipPath></defs>
<g clip-path="url(#above)"><circle cx="240" cy="28" r="11" fill="#E8622A"/><circle cx="240" cy="28" r="19" fill="#F3B252" opacity=".25"/></g>
<rect x="0" y="27.5" width="480" height="1" fill="url(#hr)"/>
<rect x="222" y="31" width="36" height="1" fill="#E8622A" opacity=".55"/><rect x="230" y="34" width="20" height="1" fill="#E8622A" opacity=".35"/><rect x="236" y="37" width="8" height="1" fill="#E8622A" opacity=".2"/>
</svg>
'''
open(os.path.join(OUT, 'horizon-rule.svg'), 'w').write(rule)

# 4. sun-arc glyphs: tiny clock-faces for the hour of each section (sprite of <symbol>s)
syms = []
for i, (t, nm, top, hz) in enumerate(HOURS):
    frac = i / (len(HOURS) - 1)
    ang = math.pi * (1 - frac)
    sx, sy = 16 + 12 * math.cos(ang), 20 - 12 * math.sin(ang)
    night = i in (0, 8, 9)
    body = (f'<circle cx="{sx:.2f}" cy="{max(sy, 6):.2f}" r="3" fill="none" stroke="currentColor" stroke-width="1.4"/>' if night
            else f'<circle cx="{sx:.2f}" cy="{sy:.2f}" r="3.2" fill="currentColor"/>')
    syms.append(f'<symbol id="arc-{t.replace(":", "")}" viewBox="0 0 32 26"><title>{t} {nm}</title><path d="M4 20 A12 12 0 0 1 28 20" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="1.5 2.2" opacity=".55"/><path d="M1 20.5 H31" stroke="currentColor" stroke-width="1.2"/>{body}</symbol>')
open(os.path.join(OUT, 'sun-arcs.svg'), 'w').write('<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n' + '\n'.join(syms) + '\n</svg>\n')
print('ok')
