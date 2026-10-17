import json, os
OUT = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_d6e5fca5-3c9-15/designs/45/assets/identity'
TMP = '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.xZdW6fp6VC'
w = json.load(open(f'{TMP}/w1.json')); asj = json.load(open(f'{TMP}/w3.json'))
T = {50:'#f2fdfa',100:'#dcf7f1',200:'#b7ebdf',300:'#87dac9',400:'#4bc1ad',500:'#08a28f',600:'#008171',700:'#006154',800:'#034239',900:'#042822',950:'#031612'}

# The glyph: a single-storey "a" — a bowl (the bead) and a stem that keeps flowing into a current,
# plus one small weightless bead in orbit.
BOWL = '<circle cx="27" cy="36" r="11.5"/>'
STEM = '<path d="M42.5 21.5V40c0 7.2 4.6 11 12.5 10"/>'
BEAD = '<circle cx="15.5" cy="15.5" r="4.6"/>'

def glossy_glyph(idp=''):
    return f'''<defs>
    <linearGradient id="{idp}s" x1="10" y1="18" x2="52" y2="54" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{T[400]}"/><stop offset=".55" stop-color="{T[600]}"/><stop offset="1" stop-color="{T[800]}"/></linearGradient>
    <linearGradient id="{idp}h" x1="0" y1="20" x2="0" y2="44" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="{idp}b" cx="13.8" cy="13.6" r="6.5" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="{T[300]}"/><stop offset="1" stop-color="{T[600]}"/></radialGradient>
  </defs>
  <g fill="none" stroke="url(#{idp}s)" stroke-width="7.5" stroke-linecap="round">{BOWL}{STEM}</g>
  <g fill="none" stroke="url(#{idp}h)" stroke-width="2" stroke-linecap="round" transform="translate(-1.1 -1.6)" opacity=".8"><path d="M18.5 31.5a11.5 11.5 0 0 1 11-7"/><path d="M42.5 23v8"/></g>
  <g fill="url(#{idp}b)">{BEAD}</g>'''

files = {}
files['mark.svg'] = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Albretsen AS">
  <title>Albretsen AS</title>
  {glossy_glyph()}
</svg>
'''
files['mark-mono.svg'] = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Albretsen AS">
  <title>Albretsen AS</title>
  <g fill="none" stroke="currentColor" stroke-width="7.5" stroke-linecap="round">{BOWL}{STEM}</g>
  <g fill="currentColor">{BEAD}</g>
</svg>
'''
files['favicon.svg'] = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <style>
    .bg{{fill:url(#fb)}} .g{{stroke:{T[50]}}} .d{{fill:{T[300]}}}
    @media (prefers-color-scheme: dark){{ .bg{{fill:url(#fd)}} .g{{stroke:{T[900]}}} .d{{fill:{T[700]}}} }}
  </style>
  <defs>
    <linearGradient id="fb" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{T[500]}"/><stop offset="1" stop-color="{T[700]}"/></linearGradient>
    <linearGradient id="fd" x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{T[100]}"/><stop offset="1" stop-color="{T[300]}"/></linearGradient>
  </defs>
  <rect class="bg" width="64" height="64" rx="16"/>
  <g transform="translate(2 1) scale(.94)"><g class="g" fill="none" stroke-width="8" stroke-linecap="round">{BOWL}{STEM}</g><g class="d">{BEAD}</g></g>
</svg>
'''
# apple touch icon source (no media query, glossy)
files['_touch.svg'] = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <defs>
    <linearGradient id="tb" x1="0" y1="0" x2="0" y2="180" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{T[100]}"/><stop offset="1" stop-color="{T[200]}"/></linearGradient>
    <radialGradient id="tl" cx="60" cy="30" r="140" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="180" height="180" fill="url(#tb)"/><rect width="180" height="180" fill="url(#tl)"/>
  <g transform="translate(26 24) scale(2)">{glossy_glyph('t')}</g>
</svg>
'''
# wordmark
d = w['d']; bb = w['bb']; pad = 2
x0, y0 = bb['x1'] - pad, bb['y1'] - pad; ww = bb['x2'] - bb['x1'] + 2 * pad; hh = bb['y2'] - bb['y1'] + 2 * pad
files['wordmark.svg'] = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.1f} {y0:.1f} {ww:.1f} {hh:.1f}" width="{ww:.0f}" height="{hh:.0f}" role="img" aria-label="albretsen">
  <title>albretsen</title>
  <path fill="currentColor" d="{d}"/>
</svg>
'''
# lockup: mark + wordmark + AS
s = 72 / 64  # mark scaled to cap height-ish
files['lockup.svg'] = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -96 570 116" width="570" height="116" role="img" aria-label="Albretsen AS">
  <title>Albretsen AS</title>
  <g transform="translate(-6 -96) scale(1.6)">{glossy_glyph('l')}</g>
  <g transform="translate(108 0)"><path fill="{T[900]}" d="{d}"/></g>
  <path transform="translate(532 0)" fill="{T[600]}" data-as="1" d="{asj['d']}"/>
</svg>
'''
files['lockup-dark.svg'] = files['lockup.svg'].replace(f'fill="{T[900]}"', f'fill="{T[50]}"').replace(f'fill="{T[600]}" data-as', f'fill="{T[300]}" data-as')
for k, v in files.items():
    open(os.path.join(OUT, k), 'w').write(v)
print('ok')
