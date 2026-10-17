"""Procedural, seamless textures: card-stock paper, stucco, film grain."""
import sys; sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.gnTd028yfQ')
from grade import *
D = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-7/designs/67/assets/extras'
rng = np.random.default_rng(67)

def wrapnoise(n, sigma, aniso=(1, 1)):
    x = rng.normal(0, 1, (n, n)).astype(np.float32)
    x = ndimage.gaussian_filter(x, (sigma * aniso[0], sigma * aniso[1]), mode='wrap')
    return (x - x.mean()) / (x.std() + 1e-6)

N = 512
# Paper: cream card stock with long fibres and a soft cloud
f = wrapnoise(N, 0.7) * .35 + wrapnoise(N, 2.5, (0.25, 3)) * .45 + wrapnoise(N, 24) * .22 + wrapnoise(N, 1.2, (4, 0.3)) * .2
base = hx('#F7EAD3'); dark = hx('#E6D0AE')
p = base + (f[..., None] * 0.03) + (dark - base) * np.clip(f[..., None] * 0.08, 0, 1)
to_img(p).save(f'{D}/paper.webp', quality=90, method=6)
to_img(p).save('/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.gnTd028yfQ/paper-check.png')

# Stucco: sun-warmed lime plaster, bumpy (lit from upper left)
h = wrapnoise(N, 1.5) * .5 + wrapnoise(N, 5) * .8 + wrapnoise(N, 14) * .5
gy, gx = np.gradient(h)
shade = np.clip(0.5 - (gx + gy) * 0.9, 0, 1)
s = hx('#EBC28F') * (0.86 + 0.22 * shade[..., None]) + wrapnoise(N, 40)[..., None] * 0.02
to_img(s).save(f'{D}/stucco.webp', quality=78, method=6)

# Grain: neutral grey noise with alpha, for mix-blend overlay
g = wrapnoise(256, 0.55)
v = (np.round(np.clip(128 + g * 46, 0, 255) / 12) * 12).clip(0, 255).astype(np.uint8)
Image.fromarray(v, 'L').save(f'{D}/grain.png', optimize=True)  # use with mix-blend-mode: overlay + opacity
print('ok')
