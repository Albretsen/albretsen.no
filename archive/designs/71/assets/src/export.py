"""Export responsive stills + interactive layers. python export.py <tmpdir> <assets-dir>"""
import sys, os, base64, io
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from compose import compose, prep_pavilion

T, A = sys.argv[1], sys.argv[2]
IMG = f'{A}/img'; LAY = f'{A}/interactive/layers'
os.makedirs(IMG, exist_ok=True); os.makedirs(LAY, exist_ok=True)


def to_im(a):
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype('uint8'))


def save_set(im, name, widths, fmts=('avif', 'webp', 'jpg'), jpg_widths=None):
    out = []
    for w in widths:
        h = round(im.height * w / im.width)
        r = im.resize((w, h), Image.LANCZOS)
        for f in fmts:
            if f == 'jpg' and jpg_widths and w not in jpg_widths:
                continue
            p = f'{IMG}/{name}-{w}.{f}'
            if f == 'avif': r.save(p, 'AVIF', quality=58, speed=4)
            elif f == 'webp': r.save(p, 'WEBP', quality=80, method=6)
            else: r.save(p, 'JPEG', quality=82, optimize=True, progressive=True)
            out.append((p, os.path.getsize(p)))
    return out


def phone(im, top_rgb):
    """9:16 phone frame matching sky-dial.js below MIN_ASPECT 0.82: building kept whole,
    plate anchored to the bottom, sky continued upward."""
    cw = round(im.height * 0.82); x0 = (im.width - cw) // 2
    crop = im.crop((x0, 0, x0 + cw, im.height))
    W = 1152; ph = round(crop.height * W / cw); H = 2048
    crop = crop.resize((W, ph), Image.LANCZOS)
    a = np.asarray(crop).astype(np.float32) / 255
    row = a[:12].mean((0, 1))
    pad = H - ph
    t = np.linspace(0, 1, pad)[:, None, None]
    top = np.array(top_rgb, np.float32) * 0.93
    fill = top + (row - top) * t ** 2
    fill = np.broadcast_to(fill, (pad, W, 3)).copy()
    fill += np.random.default_rng(5).standard_normal((pad, W, 1)).astype(np.float32) * 0.012
    return Image.fromarray((np.clip(np.concatenate([fill, a], 0), 0, 1) * 255 + 0.5).astype('uint8'))


def lqip(im):
    b = io.BytesIO(); im.resize((24, round(24 * im.height / im.width)), Image.LANCZOS).save(b, 'WEBP', quality=60)
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()


report = []
stills = {
    'hero-pinkhour': ('L', -0.06, 0.80),
    'hero-day': ('L', 0.20, 0.80),
    'hero-night': ('L', -0.60, 0.80),
    'ground-station': ('B', 0.12, 0.16),
}
lq = {}
for name, (pre, h, sx) in stills.items():
    im = to_im(compose(T, pre, h, sx))
    im.save(f'{T}/{name}-master.png')
    lq[name] = lqip(im)
    if name == 'hero-pinkhour':
        report += save_set(im, name, [640, 1280, 1920, 2560])
        from compose import palette
        por = phone(im, palette(h)[0])
        report += save_set(por, name + '-phone', [720, 1152])
        lq[name + '-phone'] = lqip(por)
    else:
        report += save_set(im, name, [1280, 2560], ('avif', 'webp'))
        report += save_set(im, name, [1600], ('jpg',))
        if name in ('hero-night', 'hero-day'):
            from compose import palette
            report += save_set(phone(im, palette(h)[0]), name + '-phone', [720, 1152], ('avif', 'webp'))

# interactive layers at 1920x1080 (ungraded daylight; the shader relights them)
def lay(a, name, mode='RGBA', q=82):
    im = Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype('uint8'), mode).resize((1920, 1080), Image.LANCZOS)
    p = f'{LAY}/{name}'
    if name.endswith('.jpg'): im.convert('RGB').save(p, 'JPEG', quality=q, optimize=True)
    else: im.save(p, 'WEBP', quality=q, method=6, alpha_quality=85)
    report.append((p, os.path.getsize(p)))

for pre, tag in (('L', 'pavilion'), ('B', 'station')):
    m = np.load(f'{T}/{pre}_m.npy'); s = np.load(f'{T}/{pre}_s.npy'); p = np.load(f'{T}/{pre}_p.npy'); g = np.load(f'{T}/{pre}_g.npy')
    lay(m, f'{tag}-far.webp'); lay(s, f'{tag}-snow.webp', q=80)
    pc, pa = prep_pavilion(p)
    lay(np.dstack([pc, pa]), f'{tag}-building.webp', q=86)
    lay(g, f'{tag}-glow.jpg', 'RGB', q=80)

with open(f'{IMG}/lqip.json', 'w') as f:
    import json; json.dump(lq, f, indent=1)
tot = 0
for p, s in report:
    tot += s; print(f'{s/1024:8.1f} KB  {os.path.relpath(p, A)}')
print(f'total {tot/1024/1024:.2f} MB')
