"""Cancelled postage stamps: stand-ins for retired products (SVG, text converted to paths)."""
import sys, base64, math
sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.gnTd028yfQ')
from textpath import text_path
D = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-7/designs/67/assets/products/retired'
SH = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-7/designs/_shared/products'
import os; os.makedirs(D, exist_ok=True)
UMBER, AMBER, OCHRE, CREAM, PAPER, MAUVE = '#3B1D0E', '#D18E4A', '#A65E27', '#FFF6E6', '#F8E6C6', '#5E4A6E'
W, H = 120, 150

def perf_mask(id_):
    holes = []
    r = 3.2; step = 9.2
    nx = int((W) / step); ny = int((H) / step)
    for i in range(nx + 1):
        x = i * W / nx
        holes += [f'<circle cx="{x:.1f}" cy="0" r="{r}"/>', f'<circle cx="{x:.1f}" cy="{H}" r="{r}"/>']
    for j in range(ny + 1):
        y = j * H / ny
        holes += [f'<circle cx="0" cy="{y:.1f}" r="{r}"/>', f'<circle cx="{W}" cy="{y:.1f}" r="{r}"/>']
    return f'<mask id="{id_}"><rect width="{W}" height="{H}" fill="#fff"/><g fill="#000">{"".join(holes)}</g></mask>'

def centered(text, font, axes, size, cx, y, tracking=0):
    d, adv = text_path(text, font, axes, size, 0, 0, tracking)
    return f'<path transform="translate({cx - adv / 2:.2f} {y})" d="{d}"/>'

def cancel(seed):
    # wavy cancellation bars + circular postmark, violet ink like an old franking machine
    waves = []
    for k in range(4):
        y = 60 + k * 6.5
        pts = ' '.join(f'{x},{y + 2.2 * math.sin(x / 7 + k * .4 + seed):.1f}' for x in range(-4, 70, 3))
        waves.append(f'<polyline points="{pts}" fill="none"/>')
    ring = ('<circle cx="86" cy="98" r="19" fill="none"/><circle cx="86" cy="98" r="15" fill="none" stroke-width=".6"/>')
    word = centered('RETIRED', 'Schibsted', {'wght': 700}, 6.2, 86, 100.2, 0.12)
    return (f'<g opacity=".8" stroke="{MAUVE}" stroke-width="1.2" transform="rotate(-10 86 98)">{"".join(waves)}{ring}'
            f'<g fill="{MAUVE}" stroke="none">{word}</g></g>')

GLYPHS = {
    'polyglot-pilot': ('<g fill="none" stroke-width="3" stroke-linejoin="round">'
                       f'<path d="M30 52h36a8 8 0 0 1 8 8v18a8 8 0 0 1-8 8H48l-10 9v-9h-8a8 8 0 0 1-8-8V60a8 8 0 0 1 8-8z" stroke="{UMBER}"/>'
                       f'<path d="M54 70h36a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8h-6v9l-10-9H54a8 8 0 0 1-8-8V78a8 8 0 0 1 8-8z" fill="{AMBER}" stroke="{AMBER}"/>'
                       f'<path d="M58 84h28M58 92h18" stroke="{CREAM}" stroke-linecap="round"/></g>'),
    'pinpoint': (f'<rect x="26" y="56" width="58" height="44" rx="3" fill="{AMBER}"/>'
                 f'<path d="M26 92l18-16 12 10 10-8 18 14v4H26z" fill="{OCHRE}"/>'
                 f'<circle cx="72" cy="66" r="5" fill="{CREAM}"/>'
                 f'<path d="M62 46a14 14 0 0 1 28 0c0 11-14 26-14 26S62 57 62 46z" fill="{UMBER}"/><circle cx="76" cy="46" r="5" fill="{CREAM}"/>'),
    'webvakt': (f'<path d="M34 106V70a26 26 0 0 1 52 0v36z" fill="{AMBER}"/>'
                f'<path d="M38 84q22-20 44 0q-22 20-44 0z" fill="{CREAM}"/><circle cx="60" cy="84" r="7" fill="{UMBER}"/><circle cx="62.5" cy="81.5" r="2" fill="{CREAM}"/>'),
    'joke-central': (f'<circle cx="60" cy="80" r="26" fill="{AMBER}"/>'
                     f'<circle cx="51" cy="74" r="3.4" fill="{UMBER}"/><circle cx="69" cy="74" r="3.4" fill="{UMBER}"/>'
                     f'<path d="M46 85q14 14 28 0" fill="none" stroke="{UMBER}" stroke-width="3.4" stroke-linecap="round"/>'),
    'tryggere-hyring': (f'<path d="M60 52l24 9v18c0 16-11 25-24 30-13-5-24-14-24-30V61z" fill="{UMBER}"/>'
                        f'<path d="M48 80l9 9 16-18" fill="none" stroke="{AMBER}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>'),
}
STAMPS = [
    ('luma', 'LUMA', '2026'), ('polyglot-pilot', 'POLYGLOT PILOT', '2025'), ('pinpoint', 'PINPOINT', '2025'),
    ('webvakt', 'WEBVAKT', '2024'), ('joke-central', 'JOKE CENTRAL', '2024'), ('tryggere-hyring', 'TRYGGERE HYRING', '2023'),
    ('early-apps', 'EARLY APPS', '2021'),
]
for i, (id_, label, year) in enumerate(STAMPS):
    art = GLYPHS.get(id_, '')
    if id_ == 'luma':
        b64 = base64.b64encode(open(f'{SH}/luma/logo.png', 'rb').read()).decode()
        art = (f'<rect x="20" y="58" width="80" height="44" rx="2" fill="#FFFFFF"/>'
               f'<image href="data:image/png;base64,{b64}" x="26" y="68" width="68" height="18.9" preserveAspectRatio="xMidYMid meet"/>')
    if id_ == 'early-apps':
        d, adv = text_path('%', 'Bodoni', {'wght': 600, 'opsz': 60}, 64, 0, 0)
        art = f'<circle cx="60" cy="80" r="28" fill="{AMBER}"/><path transform="translate({60 - adv / 2:.1f} 101)" fill="{UMBER}" d="{d}"/>'
    size = 7.2 if len(label) < 12 else 6.0
    name = centered(label, 'Schibsted', {'wght': 650}, size, 60, 128, 0.1)
    yr = centered(year, 'Bodoni', {'wght': 500, 'opsz': 24}, 13, 60, 34)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W * 2}" height="{H * 2}" role="img" aria-label="{label.title()} ({year}), retired">'
           f'<defs>{perf_mask("p")}</defs>'
           f'<g mask="url(#p)"><rect width="{W}" height="{H}" fill="{CREAM}"/>'
           f'<rect x="9" y="9" width="{W - 18}" height="{H - 18}" fill="{PAPER}" stroke="{UMBER}" stroke-width=".8"/>'
           f'<rect x="12.5" y="12.5" width="{W - 25}" height="{H - 25}" fill="none" stroke="{UMBER}" stroke-width=".35"/>'
           f'<g fill="{UMBER}">{yr}</g>'
           f'{art}'
           f'<path d="M24 116H96" stroke="{UMBER}" stroke-width=".5"/>'
           f'<g fill="{UMBER}">{name}</g>'
           f'{cancel(i)}</g></svg>\n')
    open(f'{D}/{id_}.svg', 'w').write(svg)
print('ok')
