import sys, math
E=sys.argv[1]
def w(n,s): open(f'{E}/{n}','w').write(s.strip()+'\n')
w('grid.svg','''<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280">
  <title>Atlas grid tile (5 x 56 px cells)</title>
  <g fill="none" stroke="#005e26">
    <path d="M56 0V280M112 0V280M168 0V280M224 0V280M0 56H280M0 112H280M0 168H280M0 224H280" stroke-width=".6" opacity=".16"/>
    <path d="M.5 0V280M0 .5H280" stroke-width="1" opacity=".3"/>
  </g>
</svg>''')
w('registration.svg','''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <title>Registration mark</title>
  <g fill="none" stroke="#091710" stroke-width="1.2"><circle cx="24" cy="24" r="11"/><path d="M24 2v44M2 24h44"/></g>
  <path d="M24 13a11 11 0 0 1 0 22z" fill="#389e3d"/>
</svg>''')
bars=''.join(f'<rect x="{20+i*60}" y="30" width="60" height="8" fill="{"#091710" if i%2==0 else "none"}" stroke="#091710"/>' for i in range(9))
w('scale-bar.svg',f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 72" width="640" height="72" role="img" aria-label="Scale: 2016 to 2026">
  <title>Scale bar, 2016 to 2026</title>
  {bars}<rect x="560" y="30" width="60" height="8" fill="#389e3d" stroke="#091710"/>
  <path d="M20 24v18M320 24v18M620 24v18" stroke="#091710"/>
  <g font-family="JetBrains Mono, ui-monospace, monospace" font-size="11" fill="#091710" letter-spacing=".08em">
    <text x="20" y="18">2016</text><text x="320" y="18" text-anchor="middle">2021</text><text x="620" y="18" text-anchor="end">2026</text>
    <text x="20" y="60" fill="#5a675f">FIRST APP</text><text x="620" y="60" text-anchor="end" fill="#005e26">TODAY</text>
  </g>
</svg>''')
w('plate-label.svg','''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" width="360" height="120" role="img" aria-label="Plate label">
  <title>Plate label (edit the text nodes)</title>
  <rect x="1" y="1" width="358" height="118" rx="3" fill="#f7f5ea" stroke="#091710" stroke-width="1.2"/>
  <rect x="7" y="7" width="346" height="106" rx="1" fill="none" stroke="#091710" stroke-width=".6"/>
  <g font-family="JetBrains Mono, ui-monospace, monospace" font-size="10" fill="#091710" letter-spacing=".14em">
    <text x="22" y="34">PLATE II</text><text x="338" y="34" text-anchor="end" fill="#005e26">FIG. 04</text>
  </g>
  <text x="22" y="78" font-family="Instrument Serif, Georgia, serif" font-style="italic" font-size="34" fill="#091710">Silica, polished</text>
  <path d="M22 94h316" stroke="#091710" stroke-width=".6" stroke-dasharray="2 4"/>
</svg>''')
ticks=[]
for i in range(120):
    a=i/120*2*math.pi; major=i%10==0; r0=168; r1=r0+(22 if major else 9)
    x0,y0=200+r0*math.sin(a),200-r0*math.cos(a); x1,y1=200+r1*math.sin(a),200-r1*math.cos(a)
    ticks.append(f'<path d="M{x0:.1f} {y0:.1f}L{x1:.1f} {y1:.1f}" stroke-width="{1.6 if major else .8}"/>')
w('lens-ring.svg',f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <title>Scale ring (120 ticks, 12 major) to sit around any lens</title>
  <g fill="none" stroke="#091710"><circle cx="200" cy="200" r="168" stroke-width="1"/>{"".join(ticks)}</g>
  <circle cx="200" cy="10" r="4" fill="#389e3d"/>
</svg>''')
print('ok')
