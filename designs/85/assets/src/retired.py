import sys
OUT=sys.argv[1]
glyphs={
 'polyglot-pilot':('Polyglot Pilot','<circle cx="40" cy="46" r="13"/><circle cx="56" cy="50" r="13"/><path d="M34 46h12M50 50h12"/>'),
 'pinpoint':('PinPoint','<path d="M48 70s-15-15-15-27a15 15 0 0 1 30 0c0 12-15 27-15 27z"/><circle cx="48" cy="43" r="5"/><path d="M30 74h36"/>'),
 'webvakt':('WebVakt','<rect x="26" y="30" width="44" height="34" rx="4"/><path d="M26 39h44M31 53h9l4-8 6 14 4-6h12"/>'),
 'joke-central':('Daily Jokes / Joke Central','<path d="M33 40c0-5 3-8 8-8M51 40c0-5 3-8 8-8"/><path d="M32 54c5 10 27 10 32 0"/>'),
 'tryggere-hyring':('Tryggere Hyring','<path d="M48 26l18 7v13c0 12-8 20-18 24-10-4-18-12-18-24V33z"/><path d="M40 48l6 6 11-12"/>'),
 'early-apps':('IAGO HMS, Rentekalkulator, Prosentkalkulator','<rect x="30" y="26" width="36" height="44" rx="5"/><path d="M36 35h24"/><circle cx="39" cy="47" r="1.6"/><circle cx="48" cy="47" r="1.6"/><circle cx="57" cy="47" r="1.6"/><circle cx="39" cy="56" r="1.6"/><circle cx="48" cy="56" r="1.6"/><path d="M54 62l6-9"/><circle cx="39" cy="63" r="1.6"/>'),
}
for k,(name,g) in glyphs.items():
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="{name} (retired)">
  <title>{name} (retired)</title>
  <defs><radialGradient id="g-{k}" cx=".7" cy=".3" r=".9"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset=".55" stop-color="#d1f2d7" stop-opacity=".35"/><stop offset="1" stop-color="#389e3d" stop-opacity=".45"/></radialGradient></defs>
  <circle cx="48" cy="48" r="44" fill="#f7f5ea"/>
  <circle cx="48" cy="48" r="44" fill="none" stroke="#091710" stroke-width="1.2" stroke-dasharray="1.2 3.4"/>
  <circle cx="48" cy="48" r="38" fill="none" stroke="#091710" stroke-width="2"/>
  <g fill="none" stroke="#091710" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">{g}</g>
  <circle cx="48" cy="48" r="38" fill="url(#g-{k})"/>
  <path d="M60 18a32 32 0 0 1 16 16" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>
</svg>
'''
    open(f'{OUT}/{k}.svg','w').write(svg)
print('ok')
