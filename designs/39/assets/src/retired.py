"""Stand-ins for retired products without surviving brand assets.
Each is a 'specimen plate': a grey tile with one glyph and its echoes (afterimages),
labelled in mono with the product name and the year it started (from content.js)."""
import os, math
A='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_d6e5fca5-3c9-9/designs/39/assets/retired/'
os.makedirs(A, exist_ok=True)

BG='#1a1918'; LINE='#2c2a29'; FG='#dcdad7'; MUTE='#8d8a86'

def echo(shape_fn, n=4, dx=-9, dy=0, base_op=0.85):
    out=[]
    for i in range(n, 0, -1):
        op = 0.10 + 0.12*(n-i)
        out.append(f'<g transform="translate({dx*i} {dy*i})" opacity="{op:.2f}" stroke="{MUTE}">{shape_fn()}</g>')
    out.append(f'<g stroke="{FG}">{shape_fn()}</g>')
    return ''.join(out)

def tile(name, year, glyph, label):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="{label} (retired)">
<title>{label}</title>
<rect width="400" height="400" rx="20" fill="{BG}"/>
<rect x="12.5" y="12.5" width="375" height="375" rx="12" fill="none" stroke="{LINE}"/>
<g fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">{glyph}</g>
<g font-family="JetBrains Mono, ui-monospace, monospace" font-size="13" letter-spacing=".06em" fill="{MUTE}">
<text x="32" y="364">{name}</text><text x="368" y="48" text-anchor="end">{year}</text>
<text x="32" y="48" fill="{LINE}">&#8212; retired</text></g>
</svg>
'''

g = {}
g['polyglot-pilot'] = (2025, 'Polyglot Pilot', echo(lambda: '<rect x="150" y="150" width="150" height="96" rx="18"/><path d="M188 246 l-14 28 l40 -28"/><path d="M180 188 h90 M180 210 h60"/>', n=3, dx=-14, dy=-12))
g['pinpoint'] = (2025, 'PinPoint', ''.join(f'<circle cx="200" cy="200" r="{r}" stroke="{FG if r==22 else MUTE}" opacity="{1 if r==22 else max(0.12, 0.6-r/260):.2f}"/>' for r in (22, 44, 70, 100, 132)) + f'<circle cx="200" cy="200" r="5" fill="{FG}" stroke="none"/>')
g['webvakt'] = (2024, 'WebVakt', echo(lambda: '<rect x="120" y="130" width="170" height="130" rx="10"/><path d="M120 158 h170"/><circle cx="138" cy="144" r="3"/><circle cx="150" cy="144" r="3"/><path d="M146 196 h90 M146 218 h56"/>', n=3, dx=10, dy=-12))
g['joke-central'] = (2024, 'Joke Central', echo(lambda: '<path d="M140 222 q60 62 120 0"/>', n=4, dx=0, dy=-16) + f'<circle cx="166" cy="150" r="5" fill="{FG}" stroke="none"/><circle cx="234" cy="150" r="5" fill="{FG}" stroke="none"/>')
g['tryggere-hyring'] = (2023, 'Tryggere Hyring', ''.join(f'<path transform="translate(200 205) scale({s})" d="M0 -80 L64 -56 V0 C64 44 34 70 0 84 C-34 70 -64 44 -64 0 V-56 Z" stroke="{FG if s==1 else MUTE}" stroke-width="{3/s:.2f}" opacity="{1 if s==1 else 0.5-0.12*k:.2f}"/>' for k, s in enumerate((1, 0.74, 0.5, 0.28))))
g['early-apps'] = (2021, 'Rentekalkulator, Prosentkalkulator, IAGO HMS', echo(lambda: '<circle cx="160" cy="160" r="22"/><circle cx="244" cy="244" r="22"/><path d="M262 142 L142 262"/>', n=3, dx=-10, dy=10))

for key, (year, label, glyph) in g.items():
    name = label if len(label) < 28 else 'Early apps'
    open(A+f'{key}.svg','w').write(tile(name, year, glyph, label))
print('ok')
