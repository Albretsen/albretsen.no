"""Encode baked PNGs into web formats. Usage: python encode.py <bake-dir> <assets-dir>
Writes @2x (retina) and @1x webp, plus avif for the two hero stills."""
import sys, os
from PIL import Image
B, A = sys.argv[1], sys.argv[2]
def save(im, path, q=80, avif=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path + '.webp', quality=q, method=6)
    if avif: im.save(path + '.avif', quality=70)
def pair(src, dst, q=80, avif=False, alpha=False):
    im = Image.open(src); im = im.convert('RGBA' if alpha else 'RGB')
    save(im, dst + '@2x', q, avif)
    save(im.resize((im.width // 2, im.height // 2), Image.LANCZOS), dst, q, avif)
pair(f'{B}/wallpaper.png', f'{A}/hero/wallpaper', 90, avif=True)
pair(f'{B}/desktop.png', f'{A}/hero/desktop', 90, avif=True)
for n in ['sky', 'aurora-sun', 'far', 'mid', 'near', 'plane']:
    pair(f'{B}/layer-{n}.png', f'{A}/hero/layers/{n}', 86, alpha=(n != 'sky'))
for n in ['mcp-emails', 'fun-libs', 'toolrails', 'harbor']:
    pair(f'{B}/p-{n}.png', f'{A}/products/{n}', 88)
# spot illustrations cropped from the wallpaper render
w = Image.open(f'{B}/wallpaper.png').convert('RGB')
save(w.crop((980, 560, 1900, 1480)).resize((800, 800), Image.LANCZOS), f'{A}/extras/spot-sunrise', 80)
save(w.crop((0, 1000, 1400, 1800)).resize((1050, 600), Image.LANCZOS), f'{A}/extras/spot-cabins', 80)
print('encoded')
