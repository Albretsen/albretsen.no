import sys, subprocess
sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.gnTd028yfQ')
from textpath import text_path
D = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-7/designs/67/assets/identity'
UMBER, SUN, CREAM = '#3B1D0E', '#B8642A', '#FFF6E6'

# The mark: a Bodoni-contrast arch (hairline left, heavy right, like the strokes of a Didone "A"),
# a horizon as its crossbar, and a sun sitting on it. Arch + light + an A.
ARCH = 'M12 58V28A20 20 0 0 1 52 28V58H45V28A15.7 15.7 0 0 0 13.6 28V58Z'
HORIZON = 'M13.6 40H45'
SUNP = 'M22.3 40A7 7 0 0 1 36.3 40Z'
REFL = 'M24.3 44.2H34.3M26.3 47.8H32.3M28.1 51.4H30.5'

def mark_body(arch=UMBER, sun=SUN, line=UMBER):
    return (f'<path d="{ARCH}" fill="{arch}"/>'
            f'<path d="{HORIZON}" stroke="{line}" stroke-width="1.3"/>'
            f'<path d="{SUNP}" fill="{sun}"/>'
            f'<path d="{REFL}" stroke="{sun}" stroke-width="1.3" stroke-linecap="round"/>')

open(f'{D}/mark.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Albretsen AS">{mark_body()}</svg>\n')
open(f'{D}/mark-mono.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Albretsen AS">{mark_body("currentColor", "currentColor", "currentColor")}</svg>\n')
open(f'{D}/mark-reverse.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Albretsen AS">{mark_body(CREAM, "#EDBF84", CREAM)}</svg>\n')

# Wordmark: Bodoni Moda at display optical size, AS in Schibsted Grotesk small caps-ish
wm, adv = text_path('Albretsen', 'Bodoni', {'wght': 500, 'opsz': 30}, 100, x=0, y=80, tracking=-0.012)
as_d, as_adv = text_path('AS', 'Schibsted', {'wght': 600}, 26, x=adv + 18, y=80, tracking=0.16)
W = adv + 18 + as_adv + 14
for fn, col, col2 in [('wordmark.svg', UMBER, SUN), ('wordmark-mono.svg', 'currentColor', 'currentColor'), ('wordmark-reverse.svg', CREAM, '#EDBF84')]:
    open(f'{D}/{fn}', 'w').write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} 104" width="{W:.0f}" height="104" role="img" aria-label="Albretsen AS">'
        f'<path d="{wm}" fill="{col}"/><path d="{as_d}" fill="{col2}"/></svg>\n')

# Lockup: mark + wordmark on one baseline
s = 104 / 64
LW = 104 + 22 + W
open(f'{D}/lockup.svg', 'w').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -4 {LW:.0f} 112" width="{LW:.0f}" height="112" role="img" aria-label="Albretsen AS">'
    f'<g transform="translate(0,-14.25) scale({s:.4f})">{mark_body()}</g>'
    f'<g transform="translate(126,0)"><path d="{wm}" fill="{UMBER}"/><path d="{as_d}" fill="{SUN}"/></g></svg>\n')

# Favicon: mark on a cream tile, swaps to umber tile in dark mode
fav = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
       '<style>.t{fill:#FFF6E6}.a{fill:#3B1D0E}.l{stroke:#3B1D0E}.s{fill:#B8642A}.r{stroke:#B8642A}'
       '@media (prefers-color-scheme:dark){.t{fill:#2A150B}.a{fill:#FFF6E6}.l{stroke:#FFF6E6}.s{fill:#EDBF84}.r{stroke:#EDBF84}}</style>'
       '<rect class="t" width="64" height="64" rx="14"/>'
       f'<g transform="translate(32 33.5) scale(1.06) translate(-32 -33)">'
       f'<path class="a" d="{ARCH}"/><path class="l" d="{HORIZON}" stroke-width="1.8"/>'
       f'<path class="s" d="{SUNP}"/><path class="r" d="{REFL}" stroke-width="1.8" stroke-linecap="round"/></g></svg>\n')
open(f'{D}/favicon.svg', 'w').write(fav)
# PNG for apple-touch-icon (no media query in rsvg: light version)
light = fav.split('@media')[0] + '</style>' + fav.split('</style>')[1]
open('/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.gnTd028yfQ/fav-light.svg', 'w').write(light.replace('rx="14"', 'rx="0"'))
subprocess.run(['rsvg-convert', '-w', '180', '-h', '180', '-o', f'{D}/favicon-180.png',
                '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.gnTd028yfQ/fav-light.svg'], check=True)
subprocess.run(['rsvg-convert', '-w', '32', '-h', '32', '-o', f'{D}/favicon-32.png',
                '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.gnTd028yfQ/fav-light.svg'], check=True)
print('ok', W, LW)
