"""Screenshot product scenes with headless Chrome and bake them to AVIF/WebP/JPEG."""
import subprocess, sys, os
from PIL import Image
R = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-7'
D = R + '/designs/67/assets/products'
T = '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.gnTd028yfQ'
scenes = sys.argv[1:] or ['mcp', 'funlibs', 'toolrails', 'harbor', 'retired']
for s in scenes:
    w, h = (1600, 1000) if s == 'retired' else (1200, 1500)
    out = f'{T}/scene-{s}.png'
    subprocess.run([R + '/scripts/shot.sh', f'http://127.0.0.1:6067/designs/67/assets/products/scenes.html?s={s}', out, str(w), str(h), '6000'], check=True)
    im = Image.open(out).convert('RGB')
    if im.size != (w, h): im = im.crop((0, 0, w, h))
    for tw in ([800, 1200] if s != 'retired' else [1000, 1600]):
        r = im.resize((tw, round(h * tw / w)), Image.LANCZOS)
        r.save(f'{D}/{s}-{tw}.avif', quality=48, speed=4)
        r.save(f'{D}/{s}-{tw}.webp', quality=70, method=6)
    r = im.resize((800, round(h * 800 / w)) if s != 'retired' else (1000, 625), Image.LANCZOS)
    r.save(f'{D}/{s}-{r.width}.jpg', quality=74, optimize=True, progressive=True)
    print(s, 'ok')
