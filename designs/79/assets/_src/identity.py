import json, sys, os
P = json.load(open('paths.json'))
OUT = os.path.join(sys.argv[1], 'identity')
split = float(sys.argv[2]) if len(sys.argv) > 2 else 0.6
POPPY, GOLD, SKY, FJORD, PAPER, INK = '#E8622A', '#F3B252', '#9CC3E2', '#2F5D8A', '#F4EBDD', '#1C1A17'

A = P['A']
# fit the serif A inside a 64 unit circle: glyph cap height ~ 0.7*100
def mark_svg(sun_top=GOLD, sun_mid=POPPY, water_top=SKY, water_bot=FJORD, letter=PAPER, mono=False, size=64, title=True):
    # A drawn at size 100 with baseline at y=0; cap height ~70. Scale 0.5 -> cap 35.
    s = 0.56; aw = A['w'] * s
    tx = 32 - aw / 2; ty = 32 + 0.34 * 70 * s * 1.45
    cy = 32 + (split - 0.5) * 44
    if mono:
        body = f'''<defs><mask id="m"><rect width="64" height="64" fill="#fff"/><g transform="translate({tx:.2f} {ty:.2f}) scale({s})"><path d="{A['d']}" fill="#000"/></g><rect x="0" y="{cy-1.1:.2f}" width="64" height="2.2" fill="#000"/></mask></defs>
<circle cx="32" cy="32" r="30" fill="currentColor" mask="url(#m)"/>'''
    else:
        body = f'''<defs>
<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{sun_top}"/><stop offset="1" stop-color="{sun_mid}"/></linearGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{water_top}"/><stop offset="1" stop-color="{water_bot}"/></linearGradient>
<clipPath id="c"><circle cx="32" cy="32" r="30"/></clipPath></defs>
<g clip-path="url(#c)"><rect width="64" height="{cy:.2f}" fill="url(#sun)"/><rect y="{cy:.2f}" width="64" height="{64-cy:.2f}" fill="url(#sea)"/>
<rect y="{cy-1.1:.2f}" width="64" height="2.2" fill="{letter}"/></g>
<g transform="translate({tx:.2f} {ty:.2f}) scale({s})"><path d="{A['d']}" fill="{letter}"/></g>'''
    t = '<title>Albretsen AS</title>' if title else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="{size}" height="{size}" role="img" aria-label="Albretsen AS">{t}{body}</svg>\n'

open(os.path.join(OUT, 'mark.svg'), 'w').write(mark_svg())
open(os.path.join(OUT, 'mark-night.svg'), 'w').write(mark_svg(sun_top='#F5DCA8', sun_mid='#E9C27A', water_top='#2B4A6E', water_bot='#0C1A2B', letter='#0C1A2B'))
open(os.path.join(OUT, 'mark-mono.svg'), 'w').write(mark_svg(mono=True))

# favicon: the mark, swapping to the night version in dark UI
fav = mark_svg(title=False)
night = mark_svg(sun_top='#F5DCA8', sun_mid='#E9C27A', water_top='#2B4A6E', water_bot='#0C1A2B', letter='#0C1A2B', title=False)
open(os.path.join(OUT, 'favicon.svg'), 'w').write(fav)

# wordmark: serif name + tracked grotesk AS, currentColor
al = P['albretsen']; as_ = P['as']
s = 1.0
w = al['w'] + 16 + as_['w']
H = 100 + 8
word = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -78 {w + 6:.1f} {H}" width="{w + 6:.0f}" height="{H}" role="img" aria-label="Albretsen AS"><title>Albretsen AS</title>
<path fill="currentColor" d="{al['d']}"/>
<g transform="translate({al['w'] + 16:.1f} 0)"><path fill="currentColor" d="{as_['d']}"/></g></svg>
'''
open(os.path.join(OUT, 'wordmark.svg'), 'w').write(word)

# lockup: mark + wordmark on one baseline
lw = 96 + w + 10
lock = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -82 {lw:.1f} 112" width="{lw:.0f}" height="112" role="img" aria-label="Albretsen AS"><title>Albretsen AS</title>
<g transform="translate(0 -74) scale(1.16)">{mark_svg(title=False).split('>',1)[1].rsplit('</svg>',1)[0]}</g>
<g transform="translate(96 0)"><path fill="{INK}" d="{al['d']}"/><g transform="translate({al['w'] + 16:.1f} 0)"><path fill="{INK}" d="{as_['d']}"/></g></g></svg>
'''
open(os.path.join(OUT, 'lockup.svg'), 'w').write(lock)
print('ok', w)
