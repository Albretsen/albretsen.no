import json, subprocess, re
from PIL import Image
TMP = '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.xZdW6fp6VC'
A = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_d6e5fca5-3c9-15/designs/45/assets'
lock = open(f'{A}/identity/lockup.svg').read()
inner = re.search(r'<title>Albretsen AS</title>(.*)</svg>', lock, re.S).group(1)
l4 = json.load(open(f'{TMP}/w4.json')); l5 = json.load(open(f'{TMP}/w5.json'))
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1260" viewBox="0 0 2400 1260">
<g transform="translate(150 470) scale(2.1)">{inner}</g>
<path transform="translate(158 690)" fill="#034239" d="{l4['d']}"/>
<path transform="translate(160 1120)" fill="#008171" d="{l5['d']}"/>
</svg>'''
open(f'{TMP}/og.svg', 'w').write(svg)
subprocess.run(['rsvg-convert', '-w', '2400', '-h', '1260', f'{TMP}/og.svg', '-o', f'{TMP}/og-over.png'], check=True)
base = Image.open(f'{TMP}/final/og-base.png').convert('RGBA')
base.alpha_composite(Image.open(f'{TMP}/og-over.png').convert('RGBA'))
og = base.resize((1200, 630), Image.LANCZOS).convert('RGB')
og.save(f'{A}/identity/og.png', optimize=True)
og.save(f'{A}/identity/og.jpg', quality=88)
print('ok')
