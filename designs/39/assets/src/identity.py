import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from textpath import text_path
A='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_d6e5fca5-3c9-9/designs/39/assets/'
F=A+'fonts/'
os.makedirs(A+'identity', exist_ok=True)

# The mark: an A drawn as two legs (a prism seen edge-on) and a beam of light that
# enters from outside the left leg and stops at the right one. The crossbar is the light.
LEGS = 'M6.6 63 L32 11 L57.4 63'
def mark_group(fill='currentColor', leg=7.6, beam=2.6, beam_cls='', cid='mk'):
    c = f' class="{beam_cls}"' if beam_cls else ''
    return (f'<clipPath id="{cid}"><rect x="-20" y="-20" width="104" height="77"/></clipPath>'
            f'<path clip-path="url(#{cid})" d="{LEGS}" fill="none" stroke="{fill}" stroke-width="{leg}" stroke-linejoin="miter" stroke-miterlimit="10"/>'
            f'<path{c} d="M0.5 41.5 H45.5" stroke="{fill}" stroke-width="{beam}"/>')

open(A+'identity/mark.svg','w').write(
 '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Albretsen AS">'
 f'<title>Albretsen AS</title>{mark_group()}</svg>\n')

# Echo version for the boot loader: two afterimages of the legs, classes .echo-1/.echo-2
open(A+'identity/mark-echo.svg','w').write(
 '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-16 -4 84 72" width="168" height="144" role="img" aria-label="Albretsen AS">'
 '<title>Albretsen AS</title>'
 f'<path clip-path="url(#mk)" class="echo-2" d="{LEGS}" transform="translate(-12 0)" fill="none" stroke="currentColor" stroke-width="1" opacity=".18"/>'
 f'<path clip-path="url(#mk)" class="echo-1" d="{LEGS}" transform="translate(-6 0)" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".38"/>'
 + mark_group(beam_cls='beam') + '</svg>\n')

# Wordmark: Schibsted Grotesk (a typeface commissioned by Norwegian publisher Schibsted), outlined
wm = text_path(F+'schibsted-grotesk-latin.woff2', 'Albretsen', wght=560, size=100, tracking=-0.028)
asc = wm['cap'] or 70
Wd = wm['width']; pad = 2
open(A+'identity/wordmark.svg','w').write(
 f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad} {-asc-pad:.1f} {Wd+2*pad:.1f} {asc+2*pad+1:.1f}" '
 f'width="{Wd+2*pad:.0f}" height="{asc+2*pad+1:.0f}" role="img" aria-label="Albretsen">'
 f'<title>Albretsen</title><path fill="currentColor" d="{wm["d"]}"/></svg>\n')

# Lockup: mark + wordmark + mono "AS"
asx = text_path(F+'jetbrains-mono-latin.woff2', 'AS', wght=None, size=30, tracking=0.1)
ms = (asc+4)/46.0          # leg height (46 units, 11..57) matches cap height
gap = 22
wx = 64*ms*0.92 + gap
ax = wx + Wd + 16
total = ax + asx['width'] + 4
open(A+'identity/lockup.svg','w').write(
 f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {-asc-10:.1f} {total:.1f} {asc+14:.1f}" width="{total:.0f}" height="{asc+14:.0f}" role="img" aria-label="Albretsen AS">'
 f'<title>Albretsen AS</title>'
 f'<g transform="translate(0 {-57*ms + 2:.2f}) scale({ms:.4f})">{mark_group()}</g>'
 f'<path fill="currentColor" transform="translate({wx:.1f} 0)" d="{wm["d"]}"/>'
 f'<path fill="currentColor" opacity=".45" transform="translate({ax:.1f} 0)" d="{asx["d"]}"/>'
 f'</svg>\n')

# Favicon: heavier strokes so it survives 16px
open(A+'identity/favicon.svg','w').write(
 '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
 '<rect width="64" height="64" rx="14" fill="#161514"/>'
 '<g transform="translate(9 6) scale(0.72)">'
 + mark_group(fill='#ecebe9', leg=10.5, beam=5) + '</g></svg>\n')
print('identity ok', Wd, asc)
