"""Retired-product stamps, ticket, luggage label, postmarks, perforation, key fob. All text outlined."""
import os, re, sys, json, base64, subprocess, io
from PIL import Image
ROOT, T = sys.argv[1], sys.argv[2]
SH = os.path.join(ROOT, '../../_shared/products')
PY = os.path.join(T, 'venv/bin/python')
JOST = os.path.join(ROOT, 'fonts/jost-variable.woff2')
MONO = os.path.join(ROOT, 'fonts/ibm-plex-mono-500.woff2')
EX = os.path.join(ROOT, 'extras'); PR = os.path.join(ROOT, 'products/retired')
os.makedirs(EX, exist_ok=True); os.makedirs(PR, exist_ok=True)
C = dict(linen='#FBF3E4', sand='#F4DDB4', peach='#F2CDA8', apricot='#EDBB7C', amber='#DC9447',
         copper='#B8662F', sienna='#7A3D1F', umber='#3D2013', night='#1C0E07')

def tp(text, size, tr=0.2, font=JOST, w=460):
    out = subprocess.check_output([PY, '-I', os.path.join(T, 'scripts/textpath.py'), font, text, str(w), str(size), str(tr)])
    j = json.loads(out); j['d'] = re.sub(r'(\d+\.\d{2})\d+', r'\1', j['d']); return j

def text(t, x, y, size, fill, anchor='start', tr=0.2, font=JOST, w=460):
    j = tp(t, size, tr, font, w)
    if anchor == 'middle': x -= j['width'] / 2
    elif anchor == 'end': x -= j['width']
    return f'<path fill="{fill}" transform="translate({x:.1f} {y:.1f})" d="{j["d"]}"/>'

def perf_path(w, h, r=5, step=16):
    """Stamp outline with semicircular perforation bites along every edge."""
    nx = max(2, round(w / step)); ny = max(2, round(h / step))
    sx, sy = w / nx, h / ny
    d = [f'M0 0']
    for i in range(nx):
        x0 = i * sx; d.append(f'L{x0 + sx / 2 - r:.2f} 0 A{r} {r} 0 0 0 {x0 + sx / 2 + r:.2f} 0')
    d.append(f'L{w} 0')
    for i in range(ny):
        y0 = i * sy; d.append(f'L{w} {y0 + sy / 2 - r:.2f} A{r} {r} 0 0 0 {w} {y0 + sy / 2 + r:.2f}')
    d.append(f'L{w} {h}')
    for i in reversed(range(nx)):
        x0 = i * sx; d.append(f'L{x0 + sx / 2 + r:.2f} {h} A{r} {r} 0 0 0 {x0 + sx / 2 - r:.2f} {h}')
    d.append(f'L0 {h}')
    for i in reversed(range(ny)):
        y0 = i * sy; d.append(f'L0 {y0 + sy / 2 + r:.2f} A{r} {r} 0 0 0 0 {y0 + sy / 2 - r:.2f}')
    d.append('Z'); return ''.join(d)

GLYPHS = {
    # simple stand-in glyphs, drawn in a 60x60 box, stroke-based
    'polyglot-pilot': '<rect x="6" y="10" width="30" height="22" rx="4"/><path d="M14 32 L12 40 L22 32"/><rect x="24" y="24" width="30" height="22" rx="4" fill="{f}"/><path d="M46 46 L48 54 L38 46"/><path d="M13 21 h16 M31 35 h16"/>',
    'pinpoint': '<path d="M30 54 C 18 40 14 32 14 25 a16 16 0 0 1 32 0 c0 7 -4 15 -16 29Z"/><circle cx="30" cy="25" r="6"/>',
    'webvakt': '<rect x="6" y="10" width="48" height="40" rx="4"/><path d="M6 19 H54"/><path d="M15 35 Q30 23 45 35 Q30 47 15 35Z"/><circle cx="30" cy="35" r="3.5" fill="{s}"/>',
    'joke-central': '<circle cx="30" cy="30" r="22"/><path d="M19 33 Q30 45 41 33"/><path d="M22 23 v3 M38 23 v3"/>',
    'tryggere-hyring': '<path d="M30 6 L50 13 V29 C50 42 41 50 30 55 C19 50 10 42 10 29 V13Z"/><path d="M20 30 L27 37 L41 23"/>',
    'early-apps': '<circle cx="18" cy="18" r="7"/><circle cx="42" cy="42" r="7"/><path d="M46 12 L14 48"/>',
}

def retired_stamp(pid, name, year, glyph=None, image=None):
    W, H = 150, 180
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 {W + 12} {H + 12}" width="{W + 12}" height="{H + 12}" role="img" aria-label="{name} (retired, {year})">']
    out.append(f'<path d="{perf_path(W, H)}" fill="{C["linen"]}" stroke="{C["sand"]}" stroke-width="1"/>')
    out.append(f'<rect x="13" y="13" width="{W - 26}" height="{H - 26}" fill="{C["sand"]}" stroke="{C["copper"]}" stroke-width="1.2"/>')
    out.append(text(str(year), 21, 31, 11, C['sienna'], tr=0.08, font=MONO, w=500))
    if glyph:
        g = GLYPHS[glyph].replace('{f}', C['sand']).replace('{s}', C['sienna'])
        out.append(f'<g transform="translate({W / 2 - 25.5} 40) scale(.85)" fill="none" stroke="{C["sienna"]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">{g}</g>')
    if image:
        out.append(image)
    # name, wrapped to max two lines
    words = name.upper().split(' '); lines = []; cur = ''
    for w_ in words:
        if len(cur + ' ' + w_) > 13 and cur: lines.append(cur); cur = w_
        else: cur = (cur + ' ' + w_).strip()
    lines.append(cur)
    lines = lines[:2]
    for i, ln in enumerate(lines):
        out.append(text(ln, W / 2, 142 + i * 15 - (len(lines) - 1) * 6, 10.5, C['umber'], 'middle', tr=0.22, w=500))
    # cancellation: three waved bars + RETIRED
    out.append(f'<g opacity=".55" fill="none" stroke="{C["sienna"]}" stroke-width="2"><path d="M-4 104 q 20 -8 40 0 t 40 0 t 40 0 t 40 0"/><path d="M-4 112 q 20 -8 40 0 t 40 0 t 40 0 t 40 0"/></g>')
    out.append(f'<g transform="rotate(-10 {W / 2} 108) translate(18 0)"><rect x="{W / 2 - 46}" y="98" width="92" height="20" rx="3" fill="none" stroke="{C["copper"]}" stroke-width="1.6" opacity=".9"/>' + text('RETIRED', W / 2, 113, 11, C['copper'], 'middle', tr=0.32, w=500) + '</g>')
    out.append('</svg>\n')
    open(os.path.join(PR, f'stamp-{pid}.svg'), 'w').write('\n'.join(out)); print('stamp', pid)

# Luma has a real logo: embed it, small and unchanged
lim = Image.open(os.path.join(SH, 'luma/logo.png')).convert('RGBA'); lim.thumbnail((240, 80))
buf = io.BytesIO(); lim.save(buf, 'PNG', optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()
lw = 104; lh = lw * lim.height / lim.width
luma_img = f'<rect x="20" y="{66 - lh / 2 - 10:.1f}" width="110" height="{lh + 20:.1f}" fill="{C["linen"]}"/><image x="{75 - lw / 2}" y="{66 - lh / 2:.1f}" width="{lw}" height="{lh:.1f}" href="data:image/png;base64,{b64}"/>'
retired_stamp('luma', 'Luma', 2026, image=luma_img)
retired_stamp('polyglot-pilot', 'Polyglot Pilot', 2025, 'polyglot-pilot')
retired_stamp('pinpoint', 'PinPoint', 2025, 'pinpoint')
retired_stamp('webvakt', 'WebVakt', 2024, 'webvakt')
retired_stamp('joke-central', 'Joke Central', 2024, 'joke-central')
retired_stamp('tryggere-hyring', 'Tryggere Hyring', 2023, 'tryggere-hyring')
retired_stamp('early-apps', 'Early apps', 2021, 'early-apps')

# ---- ticket: the MCP command as an admission ticket ----
TW, TH = 760, 250
cmd = 'claude mcp add albretsen https://albretsen.no/mcp'
tk = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TW} {TH}" width="{TW}" height="{TH}" role="img" aria-label="Ticket: {cmd}">']
notch = f'M0 0 H{TW} V{TH / 2 - 16} A16 16 0 0 0 {TW} {TH / 2 + 16} V{TH} H0 V{TH / 2 + 16} A16 16 0 0 0 0 {TH / 2 - 16} Z'
tk.append(f'<path d="{notch}" fill="{C["peach"]}"/>')
tk.append(f'<rect x="14" y="14" width="{TW - 28}" height="{TH - 28}" fill="none" stroke="{C["copper"]}" stroke-width="1.5" stroke-dasharray="1 0"/>')
tk.append(f'<path d="M{TW - 170} 14 V{TH - 14}" stroke="{C["copper"]}" stroke-width="2" stroke-dasharray="3 7" stroke-linecap="round"/>')
tk.append(text('ADMIT ONE AGENT', 40, 62, 22, C['umber'], tr=0.36, w=480))
tk.append(text('ALBRETSEN AS', 40, 92, 12, C['copper'], tr=0.4, w=500))
tk.append(f'<rect x="40" y="128" width="{TW - 250}" height="58" rx="3" fill="{C["linen"]}"/>')
tk.append(text(cmd, 56, 164, 15.5, C['umber'], tr=0.0, font=MONO))
tk.append(text('VALID ANY HOUR', 40, 214, 10.5, C['sienna'], tr=0.3, font=MONO))
# stub
tk.append(text('Nº', TW - 85, 70, 14, C['copper'], 'middle', tr=0.2, font=MONO))
tk.append(text('0001', TW - 85, 106, 30, C['umber'], 'middle', tr=0.06, w=480))
tk.append(f'<g transform="translate({TW - 115} 128) scale(0.94)">' + '<path d="M24.6 40 A7.4 7.4 0 0 1 39.4 40Z" fill="#DC9447"/><path d="M9.5 56 L32 11 L54.5 56" fill="none" stroke="#3D2013" stroke-width="3" clip-path="inset(0 0 8px 0)"/><path d="M16.5 40 H47.5" stroke="#3D2013" stroke-width="2"/></g>')
tk.append('</svg>\n')
open(os.path.join(EX, 'ticket-mcp.svg'), 'w').write('\n'.join(tk)); print('ticket')

# ---- luggage label: contact ----
LW, LH = 520, 300
lb = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {LW} {LH}" width="{LW}" height="{LH}" role="img" aria-label="Label: asgeir@albretsen.no">']
lb.append(f'<path d="M40 0 H{LW - 6} a6 6 0 0 1 6 6 V{LH - 6} a6 6 0 0 1 -6 6 H40 L0 {LH - 60} V60 Z" fill="{C["linen"]}" stroke="{C["copper"]}" stroke-width="1.4"/>')
lb.append(f'<circle cx="34" cy="{LH / 2}" r="12" fill="none" stroke="{C["copper"]}" stroke-width="5"/><circle cx="34" cy="{LH / 2}" r="7" fill="{C["sand"]}"/>')
lb.append(f'<rect x="72" y="22" width="{LW - 94}" height="44" fill="{C["amber"]}"/>')
lb.append(text('FROM THE DESK OF', 92, 50, 13, C['linen'], tr=0.42, w=500))
lb.append(text('ASGEIR ALBRETSEN', 92, 112, 25, C['umber'], tr=0.26, w=470))
for i, y in enumerate([162, 214]):
    lb.append(f'<path d="M92 {y + 8} H{LW - 30}" stroke="{C["copper"]}" stroke-width="1" opacity=".5"/>')
lb.append(text('asgeir@albretsen.no', 92, 162, 19, C['sienna'], tr=0.02, font=MONO))
lb.append(text('Takes one outside engagement at a time.', 92, 214, 13, C['sienna'], tr=0.02, font=MONO))
lb.append(text('NORWAY', LW - 30, LH - 30, 11, C['copper'], 'end', tr=0.5, w=500))
lb.append('</svg>\n')
open(os.path.join(EX, 'luggage-label.svg'), 'w').write('\n'.join(lb)); print('label')

# ---- standalone postmarks (one per year of the story) ----
for yr, label in [(2016, 'FIRST APP'), (2019, 'FUN LIBS'), (2026, 'ALBRETSEN AS')]:
    R = 110
    pm = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {2 * R + 20} {2 * R + 20}" width="{2 * R + 20}" height="{2 * R + 20}" aria-hidden="true">']
    pm.append(f'<g transform="translate({R + 10} {R + 10})" fill="none" stroke="{C["sienna"]}"><circle r="{R}" stroke-width="3.5"/><circle r="{R - 42}" stroke-width="2"/></g>')
    j = tp(f'{label}  ✦  NORWAY  ✦  ', 17, 0.32, JOST, 500) if False else None
    # ring lettering: place each outlined glyph along the arc
    ring = f'{label}  *  NORWAY  *  '
    import math
    n = len(ring)
    for i, ch in enumerate(ring):
        if ch == ' ': continue
        ang = -math.pi / 2 + (i / n) * 2 * math.pi
        rr = R - 22
        x = R + 10 + rr * math.cos(ang); y = R + 10 + rr * math.sin(ang)
        if ch == '*':
            pm.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.6" fill="{C["sienna"]}"/>'); continue
        g = tp(ch, 17, 0, JOST, 500)
        pm.append(f'<path fill="{C["sienna"]}" transform="translate({x:.1f} {y:.1f}) rotate({math.degrees(ang) + 90:.1f}) translate({-g["width"] / 2:.1f} {g["cap"] / 2:.1f})" d="{g["d"]}"/>')
    pm.append(text(str(yr), R + 10, R + 24, 36, C['sienna'], 'middle', tr=0.04, w=500))
    pm.append('</svg>\n')
    open(os.path.join(EX, f'postmark-{yr}.svg'), 'w').write('\n'.join(pm)); print('postmark', yr)

# ---- wave cancel (tileable horizontally) ----
open(os.path.join(EX, 'cancel-waves.svg'), 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 120" width="480" height="120" aria-hidden="true">
<g fill="none" stroke="{C["sienna"]}" stroke-width="3" stroke-linecap="round">
{''.join(f'<path d="M0 {20 + i * 26} q 30 -12 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0"/>' for i in range(4))}
</g></svg>
''')

# ---- perforation edge mask (stamp outline as a reusable shape) ----
open(os.path.join(EX, 'stamp-perforated.svg'), 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 288" width="240" height="288" aria-hidden="true">
<path d="{perf_path(240, 288, 7.5, 24)}" fill="{C["linen"]}"/>
</svg>
''')
print('done')
