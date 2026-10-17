"""Small SVG ephemera: postmark, arch mask, shutter, sunburst divider, address lines, monogram stamp."""
import sys, math
sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.gnTd028yfQ')
from textpath import text_path
from identity import ARCH, HORIZON, SUNP, REFL
D = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-7/designs/67/assets/extras'
UMBER, AMBER, OCHRE, CREAM, PAPER, MAUVE = '#3B1D0E', '#D18E4A', '#A65E27', '#FFF6E6', '#F8E6C6', '#5E4A6E'

def on_circle(text, font, axes, size, cx, cy, r, start_deg, tracking=0.1):
    """Each glyph placed on a circle (text converted to paths)."""
    out = []; ang = math.radians(start_deg)
    for ch in text:
        d, adv = text_path(ch, font, axes, size, 0, 0)
        if ch == ' ': adv = size * 0.32
        da = (adv + size * tracking) / r
        a = ang + da / 2
        x, y = cx + r * math.cos(a), cy + r * math.sin(a)
        rot = math.degrees(a) + 90
        if d: out.append(f'<path transform="translate({x:.2f} {y:.2f}) rotate({rot:.2f}) translate({-adv / 2:.2f} 0)" d="{d}"/>')
        ang += da
    return ''.join(out)

# 1. Postmark (violet franking ink) — ring text + date + waves
ring = on_circle('ALBRETSEN AS · SOFTWARE · EST. 2016 · ', 'Schibsted', {'wght': 700}, 13, 110, 110, 70, -90, 0.14)
d26, a26 = text_path('MMXXVI', 'Bodoni', {'wght': 600, 'opsz': 24}, 22, 0, 0)
waves = ''.join(f'<path d="M210 {70 + k * 26} ' + ' '.join(f'q 18 {-12 if j % 2 == 0 else 12} 36 0' for j in range(8)) + '"/>' for k in range(4))
open(f'{D}/postmark.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 220" width="520" height="220" aria-hidden="true">'
    f'<g fill="none" stroke="{MAUVE}" stroke-width="3"><circle cx="110" cy="110" r="96"/><circle cx="110" cy="110" r="56" stroke-width="1.4"/>{waves}</g>'
    f'<g fill="{MAUVE}">{ring}<path transform="translate({110 - a26 / 2:.1f} 118)" d="{d26}"/></g></svg>\n')

# 2. Arch window mask / frame (for clip-path or mask-image) - 3:4
open(f'{D}/arch-mask.svg', 'w').write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="300" height="400"><path d="M0 400V150A150 150 0 0 1 300 150V400Z" fill="#000"/></svg>\n')
open(f'{D}/arch-frame.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="300" height="400" fill="none" stroke="{UMBER}">'
    '<path d="M1 400V150A149 149 0 0 1 299 150V400" stroke-width="2"/><path d="M12 400V150A138 138 0 0 1 288 150V400" stroke-width=".8"/>'
    '<path d="M12 150H288M150 12V150M150 150L52 52M150 150L248 52" stroke-width=".8"/></svg>\n')

# 3. Louvred shutter (tileable vertical) — a Haussmann persienne in the amber family
slats = ''.join(f'<rect x="14" y="{20 + i * 14}" width="92" height="10" rx="1" fill="url(#s)"/>' for i in range(17))
open(f'{D}/shutter.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 280" width="120" height="280">'
    f'<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8DFB6"/><stop offset=".55" stop-color="#EDBF84"/><stop offset="1" stop-color="#A65E27"/></linearGradient></defs>'
    f'<rect width="120" height="280" rx="3" fill="#D18E4A"/><rect x="6" y="6" width="108" height="268" rx="2" fill="#6E3816"/>{slats}</svg>\n')

# 4. Sunburst divider (deco) — rays above a hairline
rays = ''.join(
    f'<path d="M300 60L{300 + 200 * math.cos(math.radians(180 + a)):.1f} {60 + 200 * math.sin(math.radians(180 + a)):.1f}" stroke-width="{1.4 if i % 2 == 0 else .6}"/>'
    for i, a in enumerate(range(10, 171, 10)))
open(f'{D}/sunburst-divider.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 64" width="600" height="64" aria-hidden="true">'
    f'<defs><clipPath id="c"><rect width="600" height="60"/></clipPath><radialGradient id="f" cx="300" cy="60" r="70" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient>'
    f'<mask id="m"><rect width="600" height="64" fill="url(#f)"/></mask></defs>'
    f'<g clip-path="url(#c)" stroke="{OCHRE}" mask="url(#m)">{rays}</g>'
    f'<path d="M300 60m-22 0a22 22 0 0 1 44 0z" fill="{AMBER}"/><path d="M0 60.5H600" stroke="{UMBER}" stroke-width="1"/></svg>\n')

# 5. Brand stamp (the Albretsen AS mark as a postage stamp, used on the postcard back)
holes = []
W, H, r = 120, 150, 3.2
for i in range(14): x = i * W / 13; holes += [f'<circle cx="{x:.1f}" cy="0" r="{r}"/>', f'<circle cx="{x:.1f}" cy="{H}" r="{r}"/>']
for j in range(17): y = j * H / 16; holes += [f'<circle cx="0" cy="{y:.1f}" r="{r}"/>', f'<circle cx="{W}" cy="{y:.1f}" r="{r}"/>']
nm, an = text_path('ALBRETSEN', 'Schibsted', {'wght': 700}, 9, 0, 0, 0.18)
yr, ay = text_path('2016', 'Bodoni', {'wght': 600, 'opsz': 24}, 14, 0, 0)
open(f'{D}/stamp-albretsen.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W * 2}" height="{H * 2}" role="img" aria-label="Albretsen AS stamp">'
    f'<defs><mask id="p"><rect width="{W}" height="{H}" fill="#fff"/><g fill="#000">{"".join(holes)}</g></mask>'
    f'<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E4A6E"/><stop offset=".45" stop-color="#C98478"/><stop offset=".8" stop-color="#F2B68A"/><stop offset="1" stop-color="#FFE2B8"/></linearGradient></defs>'
    f'<g mask="url(#p)"><rect width="{W}" height="{H}" fill="{CREAM}"/><rect x="10" y="10" width="100" height="104" fill="url(#sky)"/>'
    f'<g transform="translate(28 24) scale(1)"><path d="{ARCH}" fill="{CREAM}"/><path d="{HORIZON}" stroke="{CREAM}" stroke-width="1.3"/><path d="{SUNP}" fill="#FFF3DC"/><path d="{REFL}" stroke="#FFF3DC" stroke-width="1.3" stroke-linecap="round"/></g>'
    f'<path transform="translate({100 - ay:.1f} 30)" fill="{CREAM}" d="{yr}"/>'
    f'<path transform="translate({60 - an / 2:.1f} 133)" fill="{UMBER}" d="{nm}"/><rect x="10" y="10" width="100" height="104" fill="none" stroke="{UMBER}" stroke-width=".6"/></g></svg>\n')
print('ok')
