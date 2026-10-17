import os
from PIL import Image
M = '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.AbSG7KnRWC/master/'
A = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-14/designs/74/assets/'
def multi(src, outdir, name, widths, alpha=False, q=(52, 74, 80)):
    os.makedirs(A + outdir, exist_ok=True)
    im = Image.open(M + src); im = im.convert('RGBA' if alpha else 'RGB')
    for w in widths:
        h = round(im.height * w / im.width); r = im.resize((w, h), Image.LANCZOS)
        base = f'{A}{outdir}/{name}-{w}'
        r.save(base + '.avif', quality=q[0], speed=6)
        r.save(base + '.webp', quality=q[1], method=6)
        if not alpha: r.save(base + '.jpg', quality=q[2], optimize=True, progressive=True)
def one(src, out, w, alpha=True, q=80):
    im = Image.open(M + src).convert('RGBA' if alpha else 'RGB'); h = round(im.height * w / im.width)
    im.resize((w, h), Image.LANCZOS).save(A + out, quality=q, method=6)
for n in ['hero-afterglow', 'hero-noon', 'hero-diorama']: multi(n + '.png', 'hero', n, [640, 1024, 1600, 2560])
for n in ['hero-afterglow-portrait', 'hero-noon-portrait']: multi(n + '.png', 'hero', n, [540, 1080])
for n in ['layer-1-far', 'layer-2-headland', 'layer-3-boulevard', 'layer-4-near']: multi(n + '.png', 'hero/layers', n, [960, 1920], alpha=True, q=(60, 80, 0))
for v in ['mcp-emails', 'fun-libs', 'toolrails', 'harbor']: multi(f'product-{v}.png', 'products', v, [480, 960], q=(55, 78, 82))
os.makedirs(A + 'extras/cutouts', exist_ok=True)
for c in ['cut-fan-palm', 'cut-date-palm', 'cut-cypress', 'cut-spruce', 'cut-agave', 'cut-lamp', 'cut-pavilion']:
    one(c + '.png', f'extras/cutouts/{c[4:]}.webp', 600)
print('ok')
