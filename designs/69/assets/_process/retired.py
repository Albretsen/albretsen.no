import os, sys
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
INK = '#2A2D4F'
items = {
    'polyglot-pilot': ('#BCD5EE', '<circle cx="27" cy="32" r="10"/><circle cx="37" cy="32" r="10"/>', 'Polyglot Pilot'),
    'pinpoint':       ('#F3BAC4', '<path d="M32 50 C24 40 20 34 20 27 a12 12 0 0 1 24 0 c0 7 -4 13 -12 23 Z"/><circle cx="32" cy="27" r="3.5"/>', 'PinPoint'),
    'webvakt':        ('#A6E2CC', '<path d="M18 38 a14 14 0 0 1 28 0"/><path d="M24 38 a8 8 0 0 1 16 0"/><path d="M14 44 H50"/>', 'WebVakt'),
    'joke-central':   ('#FFD9B8', '<path d="M21 33 a11 11 0 0 0 22 0"/><path d="M24 25 h3 M37 25 h3"/>', 'Daily Jokes / Joke Central'),
    'tryggere-hyring':('#F7F1E8', '<path d="M32 15 L46 21 V31 C46 40 40 46 32 50 C24 46 18 40 18 31 V21 Z"/><path d="M26 32 l4 4 l8 -9"/>', 'Tryggere Hyring'),
    'early-apps':     ('#E3D5F2', '<path d="M22 44 L42 20"/><circle cx="24" cy="23" r="4"/><circle cx="40" cy="41" r="4"/>', 'IAGO HMS, Rentekalkulator, Prosentkalkulator'),
}
sprite = []
for k, (bg, glyph, title) in items.items():
    body = f'''<circle cx="32" cy="32" r="30" fill="{bg}"/>
  <circle cx="32" cy="32" r="26.5" fill="none" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="1"/>
  <g fill="none" stroke="{INK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">{glyph}</g>'''
    open(f'{OUT}/{k}.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="{title} (retired)">\n  <title>{title}</title>\n  {body}\n</svg>\n')
    sprite.append(f'<symbol id="{k}" viewBox="0 0 64 64">{body}</symbol>')
open(f'{OUT}/retired-sprite.svg', 'w').write('<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n' + '\n'.join(sprite) + '\n</svg>\n')
print('ok')
