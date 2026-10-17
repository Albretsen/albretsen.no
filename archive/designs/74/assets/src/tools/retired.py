# Stand-ins for retired products: closed arched shutters along the same street.
# Lights off = retired. Each has an enamel plaque with a small pictogram.
import json, re, subprocess, sys, os, base64, io
sys.path.insert(0, os.path.dirname(__file__))
from identity import outline, INK, PAPER, OCHRE, TERRA, SEA, LAV
OUT = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-14/designs/74/assets/products/retired/'
os.makedirs(OUT, exist_ok=True)
G = {  # 48x48 pictograms, stroke-based, centred on 24,24
 'polyglot-pilot': '<path d="M8 12h20a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-9l-6 5v-5h-5a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4z"/><path d="M33 20h7a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4h-3v4l-5-4h-5a4 4 0 0 1-4-4" /><path d="M13 24l4-8 4 8M14.5 21h5"/>',
 'pinpoint': '<path d="M24 41s-11-11.5-11-20a11 11 0 0 1 22 0c0 8.5-11 20-11 20z"/><rect x="18.5" y="15.5" width="11" height="9" rx="1.5"/><path d="M19 23l3.5-3.5 2.5 2.5 1.5-1.5 2.5 2.5"/>',
 'webvakt': '<rect x="6" y="9" width="36" height="30" rx="3"/><path d="M6 16h36"/><path d="M12 28c3.5-5 8-7 12-7s8.5 2 12 7c-3.5 5-8 7-12 7s-8.5-2-12-7z"/><circle cx="24" cy="28" r="3"/>',
 'joke-central': '<circle cx="24" cy="24" r="16"/><path d="M16 27c2 4.5 5 6.5 8 6.5s6-2 8-6.5"/><path d="M17.5 19.5h4M26.5 19.5h4"/>',
 'tryggere-hyring': '<path d="M24 6l15 5v11c0 9.5-6.5 16.5-15 20-8.5-3.5-15-10.5-15-20V11z"/><path d="M17 24l5 5 9-10"/>',
 'early-apps': '<path d="M14 36L34 12"/><circle cx="15.5" cy="15.5" r="4.5"/><circle cx="32.5" cy="32.5" r="4.5"/>',
}
NAMES = {'polyglot-pilot': 'POLYGLOT PILOT', 'pinpoint': 'PINPOINT', 'webvakt': 'WEBVAKT', 'joke-central': 'JOKE CENTRAL', 'tryggere-hyring': 'TRYGGERE HYRING', 'early-apps': 'EARLY APPS'}
COL = {'polyglot-pilot': LAV, 'pinpoint': TERRA, 'webvakt': SEA, 'joke-central': OCHRE, 'tryggere-hyring': '#6E5A8E', 'early-apps': '#E7A39A'}
def tile(key, inner, label, color):
    t = outline(label, 600, 12, 0.32); tx = 80 - t['width'] / 2
    louvres = ''.join(f'<rect x="20" y="{y}" width="120" height="3.2" fill="#ffffff" opacity=".22"/><rect x="20" y="{y+3.2}" width="120" height="1.6" fill="#1e1028" opacity=".16"/>' for y in range(48, 186, 9))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 230" width="160" height="230" role="img" aria-label="{label.title()} (retired)">
<title>{label.title()} (retired)</title>
<defs><clipPath id="a"><path d="M20 186V80a60 60 0 0 1 120 0v106z"/></clipPath>
<filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-color="#1e1028" flood-opacity=".32"/></filter></defs>
<path d="M12 192V80a68 68 0 0 1 136 0v112z" fill="{PAPER}" filter="url(#s)"/>
<path d="M20 186V80a60 60 0 0 1 120 0v106z" fill="{color}"/>
<g clip-path="url(#a)">{louvres}<rect x="79" y="0" width="2" height="190" fill="#1e1028" opacity=".25"/></g>
<circle cx="80" cy="112" r="30" fill="{PAPER}" filter="url(#s)"/>
<g transform="translate(56 88)" fill="none" stroke="{INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">{inner}</g>
<path transform="translate({tx:.1f} 216)" fill="{INK}" d="{t['d']}"/>
</svg>'''
for k in G: open(OUT + k + '.svg', 'w').write(tile(k, G[k], NAMES[k], COL[k]))
# Luma has a real logo: embed it (unchanged) on the plaque, as a wide enamel sign
from PIL import Image
im = Image.open('/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-14/designs/_shared/products/luma/logo.png').convert('RGBA'); im.thumbnail((200, 60))
b = io.BytesIO(); im.save(b, 'PNG', optimize=True); data = base64.b64encode(b.getvalue()).decode()
w, h = im.size; dw = 76; dh = dw * h / w
luma = tile('luma', '', 'LUMA', SEA).replace(f'<circle cx="80" cy="112" r="30" fill="{PAPER}" filter="url(#s)"/>',
  f'<rect x="34" y="94" width="92" height="38" rx="5" fill="{PAPER}" filter="url(#s)"/><image href="data:image/png;base64,{data}" x="{80-dw/2:.1f}" y="{113-dh/2:.1f}" width="{dw}" height="{dh:.1f}"/>')
open(OUT + 'luma.svg', 'w').write(luma)
print('ok')
