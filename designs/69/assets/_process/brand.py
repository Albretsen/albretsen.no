import os, sys
from textpath import text_path
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
INK = '#2A2D4F'; FLAM = '#EE8AA0'; MINT = '#8FD3BF'; WHITE = '#FBF8F4'


def mark_group(ink, sun, mint, sw=2.0):
    return f'''<g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 52 L32 12 L52 52" stroke="{ink}" stroke-width="{sw}"/>
    <path d="M25 42 A7 7 0 0 1 39 42 Z" fill="{sun}" stroke="none"/>
    <path d="M6 42 H58" stroke="{ink}" stroke-width="{sw}"/>
    <path d="M27 47 H37 M29.5 51.5 H34.5" stroke="{mint}" stroke-width="{sw}"/>
  </g>'''


def write(name, s):
    open(os.path.join(OUT, name), 'w').write(s)


# Mark
write('mark.svg', f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Albretsen AS">
  <title>Albretsen AS</title>
  {mark_group(INK, FLAM, MINT)}
</svg>
''')
write('mark-light.svg', f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Albretsen AS">
  <title>Albretsen AS</title>
  {mark_group(WHITE, '#FFC9A0', '#BFF0E0')}
</svg>
''')

# Wordmark: mark + ALBRETSEN (Albert Sans 300, tracked) + small AS in mono-ish spacing
d, tw, cap = text_path('ALBRETSEN', 300, 26, 0.26)
d2, tw2, cap2 = text_path('AS', 300, 26, 0.26)
gap = 16; mark_w = 41.6
W = mark_w + gap + tw + 16 + tw2 + 2
H = 56
ty = H / 2 + cap / 2
def wordmark(ink, sun, mint, as_col):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.1f} {H}" width="{W:.0f}" height="{H}" role="img" aria-label="Albretsen AS">
  <title>Albretsen AS</title>
  <g transform="translate(-4.8 2.4) scale(0.8)">{mark_group(ink, sun, mint, 2.5)}</g>
  <path transform="translate({mark_w + gap:.1f} {ty:.2f})" fill="{ink}" d="{d}"/>
  <path transform="translate({mark_w + gap + tw + 16:.1f} {ty:.2f})" fill="{as_col}" d="{d2}"/>
</svg>
'''
write('wordmark.svg', wordmark(INK, FLAM, MINT, FLAM))
write('wordmark-light.svg', wordmark(WHITE, '#FFC9A0', '#BFF0E0', '#FFC9A0'))

# Big display word for heroes (just the name, ultra light, very wide)
d3, tw3, cap3 = text_path('ALBRETSEN', 200, 200, 0.12)
write('name-display.svg', f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {-cap3 - 4:.1f} {tw3:.1f} {cap3 + 8:.1f}" width="{tw3:.0f}" height="{cap3 + 8:.0f}" role="img" aria-label="Albretsen">
  <title>Albretsen</title>
  <path fill="currentColor" d="{d3}"/>
</svg>
''')

# Favicon: afterglow tile
write('favicon.svg', f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9EC3E6"/><stop offset="0.55" stop-color="#F4B6C0"/><stop offset="1" stop-color="#FFC9A0"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#s)"/>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="{INK}" stroke-width="4.2">
    <path d="M14 53 L32 13 L50 53"/>
    <path d="M7 43 H57"/>
  </g>
  <path d="M24 43 A8 8 0 0 1 40 43 Z" fill="{WHITE}"/>
</svg>
''')
print('ok', W)
