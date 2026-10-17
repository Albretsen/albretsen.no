import base64
A='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_d6e5fca5-3c9-9/designs/39/assets/retired/'
P='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_d6e5fca5-3c9-9/designs/_shared/products/luma/logo.png'
b64=base64.b64encode(open(P,'rb').read()).decode()
# Real Luma logo (unaltered), shown on a pale plate: the one light plate in the retired set,
# because the logo is black ink. Same frame and labels as the other plates.
w=260; h=w*217/782
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="Luma (retired)">
<title>Luma</title>
<rect width="400" height="400" rx="20" fill="#e6e4e1"/>
<rect x="12.5" y="12.5" width="375" height="375" rx="12" fill="none" stroke="#d2cfcb"/>
<image x="{200-w/2:.1f}" y="{200-h/2:.1f}" width="{w}" height="{h:.1f}" href="data:image/png;base64,{b64}"/>
<g font-family="JetBrains Mono, ui-monospace, monospace" font-size="13" letter-spacing=".06em" fill="#77736f">
<text x="32" y="364">Luma</text><text x="368" y="48" text-anchor="end">2026</text>
<text x="32" y="48" fill="#c4c0bb">&#8212; retired</text></g>
</svg>
'''
open(A+'luma.svg','w').write(svg); print('ok')
