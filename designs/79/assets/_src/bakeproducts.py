import sys, os, subprocess
from PIL import Image
ROOT = sys.argv[1]  # worktree root
OUT = os.path.join(ROOT, 'designs/79/assets/products')
tmp = os.path.dirname(os.path.abspath(__file__)) + '/../'
for p in (sys.argv[2:] or ['mcp-emails', 'fun-libs', 'toolrails', 'harbor']):
    for bare in (True, False):
        png = os.path.join(tmp, f'prod-{p}-{int(bare)}.png')
        url = f'http://127.0.0.1:6079/designs/79/assets/products/scene.html?p={p}' + ('&bare=1' if bare else '')
        subprocess.run([os.path.join(ROOT, 'scripts/shot.sh'), url, png, '1200', '900', '4000'], check=True, timeout=90)
        im = Image.open(png).convert('RGB')
        if bare:
            for w in (600, 1200):
                r = im.resize((w, w * 3 // 4), Image.LANCZOS) if w != 1200 else im
                r.save(os.path.join(OUT, f'{p}-{w}.avif'), quality=58, speed=4)
                r.save(os.path.join(OUT, f'{p}-{w}.webp'), quality=80, method=6)
            im.resize((800, 600), Image.LANCZOS).save(os.path.join(OUT, f'{p}-800.jpg'), quality=82, optimize=True, progressive=True)
        else:
            im.save(os.path.join(OUT, f'{p}-card.webp'), quality=80, method=6)
        print(p, bare)
