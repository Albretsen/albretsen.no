import sys, os
from PIL import Image
OUT = os.path.join(sys.argv[1], 'hero')
for src, name in [('bake-sunrise.png', 'first-light-sunrise'), ('bake-morning.png', 'first-light-morning'), ('bake-night.png', 'first-light-night')]:
    im = Image.open(src).convert('RGB')
    for w in (640, 1280, 1920, 2400):
        r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS) if w != im.width else im
        r.save(os.path.join(OUT, f'{name}-{w}.avif'), quality=54, speed=4)
        r.save(os.path.join(OUT, f'{name}-{w}.webp'), quality=76, method=6)
        if w == 1280:
            r.save(os.path.join(OUT, f'{name}-{w}.jpg'), quality=80, optimize=True, progressive=True)
    print(name)
