import os, sys
from PIL import Image
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
jobs = {
    'cliffs':        ('m_cliffs.jpg', None, [800, 1600, 2400], [800, 1600]),
    'cliffs-tall':   ('m_cliffs.jpg', (500, 0, 500 + 1708, 2135), [750, 1200], [750]),
    'towers':        ('m_towers.jpg', (0, 1300, 3200, 3100), [800, 1600, 2400], [800, 1600]),
    'towers-tall':   ('m_towers.jpg', (0, 145, 3200, 4145), [750, 1200], [750]),
    'shore':         ('m_shore.jpg', None, [800, 1600, 2400], [800, 1600]),
    'shore-tall':    ('m_shore.jpg', (300, 0, 300 + 1706, 2133), [750, 1200], [750]),
}
only = sys.argv[2:]
for name, (src, box, modern, jpgs) in jobs.items():
    if only and name not in only:
        continue
    im = Image.open(src).convert('RGB')
    if box:
        im = im.crop(box)
    for w in sorted(set(modern + jpgs)):
        h = round(im.height * w / im.width)
        r = im.resize((w, h), Image.LANCZOS)
        base = f'{OUT}/{name}-{w}'
        if w in modern:
            r.save(base + '.avif', quality=58, speed=4)
            r.save(base + '.webp', quality=80, method=6)
        if w in jpgs:
            r.save(base + '.jpg', quality=82, optimize=True, progressive=True)
        print(name, w, h, *[f'{e}:{os.path.getsize(base + "." + e) // 1024}K' for e in ('avif', 'webp', 'jpg') if os.path.exists(base + '.' + e)])
