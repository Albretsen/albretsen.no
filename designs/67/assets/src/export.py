import sys, os, json, base64, io
sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.gnTd028yfQ')
from grade import T
from PIL import Image, ImageFilter
D = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-7/designs/67/assets'
# master, out base, widths, jpg widths
JOBS = [
    ('h1-wide-master.png', 'hero/spires-wide', [640, 1024, 1600, 2400], [1024, 1600]),
    ('h1-tall-master.png', 'hero/spires-tall', [640, 1080], [1080]),
    ('h2-card-master.png', 'hero/facade-card', [600, 1000, 1400], [1000]),
    ('h2-wide-master.png', 'hero/facade-wide', [1024, 1600, 2400], [1600]),
    ('h3-master.png', 'hero/arcade', [640, 1080, 1600], [1080]),
    ('sec-roofs-master.png', 'extras/roofs', [800, 1280], [1024 if False else 800]),
    ('sec-horizon-master.png', 'extras/horizon', [1024, 1600], [1600]),
    ('sec-poster-master.png', 'extras/poster-arch', [600, 1000], [1000]),
]
only = sys.argv[1:]
manifest = {}
mp = D + '/images.json'
if os.path.exists(mp): manifest = json.load(open(mp))
for src, base, widths, jw in JOBS:
    if only and not any(o in base for o in only): continue
    im = Image.open(f'{T}/{src}').convert('RGB')
    entry = {'aspect': f'{im.width} / {im.height}', 'sizes': []}
    for w in widths:
        h = round(im.height * w / im.width)
        r = im.resize((w, h), Image.LANCZOS)
        r.save(f'{D}/{base}-{w}.avif', quality=50, speed=4)
        r.save(f'{D}/{base}-{w}.webp', quality=70, method=6)
        fm = ['avif', 'webp']
        if w in jw:
            r.save(f'{D}/{base}-{w}.jpg', quality=74, optimize=True, progressive=True); fm.append('jpg')
        entry['sizes'].append({'w': w, 'h': h, 'formats': fm})
    t = im.resize((24, round(im.height * 24 / im.width)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    b = io.BytesIO(); t.save(b, 'WEBP', quality=40)
    entry['lqip'] = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
    # dominant (average) colour for the placeholder background
    entry['bg'] = '#%02x%02x%02x' % im.resize((1, 1), Image.BOX).getpixel((0, 0))
    manifest[os.path.basename(base)] = entry
json.dump(manifest, open(mp, 'w'), indent=1)
tot = 0
for root, _, fs in os.walk(D):
    for f in fs: tot += os.path.getsize(os.path.join(root, f))
print('assets total MB', round(tot / 1e6, 2))
