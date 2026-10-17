"""compose.py bg.png sprites_dir out.png  — place pixel sprites into the graded room photo"""
import sys, json, numpy as np
from PIL import Image, ImageFilter, ImageChops
bg_path, sdir, out = sys.argv[1], sys.argv[2], sys.argv[3]
layout = json.loads(sys.argv[4])  # [[name, cx, bottom, scale, sun(0..1), glowhex|null], ...]
bg = Image.open(bg_path).convert('RGBA')

def trim(im):
    bb = im.getbbox(); return im.crop(bb)

for name, cx, bottom, sc, sun, glow in layout:
    sp = trim(Image.open(f'{sdir}/{name}.png').convert('RGBA'))
    w, h = round(sp.size[0]*sc), round(sp.size[1]*sc)
    sp = sp.resize((w, h), Image.NEAREST)
    x, y = round(cx - w/2), round(bottom - h)
    # contact shadow: soft plum ellipse under the base
    sh = Image.new('L', bg.size, 0)
    from PIL import ImageDraw
    d = ImageDraw.Draw(sh); ew = w*0.55; eh = max(10, h*0.06)
    d.ellipse([cx-ew, bottom-eh*0.7, cx+ew, bottom+eh*0.6], fill=150)
    sh = sh.filter(ImageFilter.GaussianBlur(eh*0.9))
    shade = Image.new('RGBA', bg.size, (22, 8, 30, 255)); shade.putalpha(sh)
    bg = Image.alpha_composite(bg, shade)
    # screen glow
    if glow:
        g = Image.new('L', bg.size, 0); dg = ImageDraw.Draw(g)
        dg.ellipse([x-w*0.2, y-h*0.15, x+w*1.2, y+h*0.85], fill=70)
        g = g.filter(ImageFilter.GaussianBlur(w*0.25))
        col = tuple(int(glow[i:i+2], 16) for i in (1, 3, 5))
        gl = Image.new('RGBA', bg.size, col + (255,)); gl.putalpha(g)
        bg = Image.alpha_composite(bg, gl)
    # warm sunlight wash on sprites standing in the beam (multiply-ish tint + lift)
    if sun:
        a = np.asarray(sp).astype(np.float32)
        tint = np.array([255, 214, 170], np.float32)
        a[..., :3] = a[..., :3] * (1 - 0.25*sun) + (a[..., :3] * tint / 255) * 0.25*sun + 18*sun
        sp = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    layer = Image.new('RGBA', bg.size, (0, 0, 0, 0)); layer.paste(sp, (x, y), sp)
    bg = Image.alpha_composite(bg, layer)
bg.convert('RGB').save(out)
print(out, bg.size)
