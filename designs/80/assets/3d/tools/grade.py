"""Grade baked renders: miniature tilt-shift, soft bloom, warm vignette, film grain.
Then export responsive AVIF / WebP / JPEG."""
import sys, os, numpy as np
from PIL import Image, ImageFilter

T = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1]

def grade(src, top=0.10, bottom=0.80, blur=5, grain=3.2, bloom=0.16, vign=0.18, seed=1):
    im = Image.open(src).convert('RGB')
    w, h = im.size
    a = np.asarray(im).astype(np.float32) / 255
    # tilt-shift: blend toward a blurred copy outside the focus band
    b = np.asarray(im.filter(ImageFilter.GaussianBlur(blur * w / 2400))).astype(np.float32) / 255
    y = np.linspace(0, 1, h)[:, None, None]
    m = np.clip((top - y) / top, 0, 1) ** 1.5 + np.clip((y - bottom) / (1 - bottom), 0, 1) ** 1.3
    m = np.clip(m, 0, 1)
    a = a * (1 - m) + b * m
    # bloom from highlights
    lum = a.mean(axis=2, keepdims=True)
    hi = np.clip((lum - 0.72) / 0.28, 0, 1) * a
    hib = Image.fromarray((hi * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(28 * w / 2400))
    a = 1 - (1 - a) * (1 - np.asarray(hib).astype(np.float32) / 255 * bloom * 2.2)
    # warm, very soft vignette
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / 1.414
    v = 1 - vign * np.clip(r - 0.35, 0, 1) ** 1.6 / 0.65 ** 1.6
    a = a * v[..., None] * np.array([1.0, 0.985, 0.96]) + (1 - v[..., None]) * np.array([0.03, 0.015, 0.0])
    # lift blacks a touch, like printed paper
    a = 0.018 + a * 0.975
    # grain
    rng = np.random.default_rng(seed)
    g = rng.normal(0, grain / 255, (h, w, 1)).astype(np.float32)
    a = np.clip(a + g, 0, 1)
    return Image.fromarray((a * 255 + 0.5).astype(np.uint8))

def export(im, base, widths, fmts=('avif', 'webp', 'jpg')):
    out = []
    for w in widths:
        r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS) if w != im.width else im
        for f in fmts:
            p = os.path.join(OUT, f'{base}-{w}.{f}')
            if f == 'avif': r.save(p, 'AVIF', quality=58, speed=4)
            elif f == 'webp': r.save(p, 'WEBP', quality=80, method=6)
            else: r.save(p, 'JPEG', quality=82, optimize=True, progressive=True)
            out.append((p, os.path.getsize(p)))
    return out

if __name__ == '__main__':
    jobs = {
        'hero-morning': ('raw-morning.png', [2400, 1600, 960], ('avif', 'webp', 'jpg'), {}),
        'hero-terrace': ('raw-terrace.png', [2400, 1600, 960], ('avif', 'webp', 'jpg'), {'top': 0.08, 'bottom': 0.74, 'blur': 6}),
        'hero-portrait': ('raw-portrait-morning.png', [1080, 720], ('avif', 'webp', 'jpg'), {'top': 0.06, 'bottom': 0.78}),
        'hero-portrait-sunset': ('raw-portrait-sunset.png', [1080], ('avif', 'jpg'), {'top': 0.06, 'bottom': 0.78}),
        'day-01-first-light': ('raw-sunrise.png', [1600], ('avif', 'jpg'), {}),
        'day-02-morning': ('raw-morning.png', [1600], ('avif', 'jpg'), {}),
        'day-03-noon': ('raw-noon.png', [1600], ('avif', 'jpg'), {}),
        'day-04-golden': ('raw-golden.png', [1600], ('avif', 'jpg'), {}),
        'day-05-sunset': ('raw-sunset.png', [1600], ('avif', 'jpg'), {}),
        'day-06-after-hours': ('raw-night.png', [1600], ('avif', 'jpg'), {'grain': 4.5}),
        'noon-crown': ('raw-tower.png', [1600], ('avif', 'jpg'), {'top': 0.0001, 'bottom': 0.85}),
    }
    only = sys.argv[2:] or list(jobs)
    for base in only:
        src, widths, fmts, kw = jobs[base]
        im = grade(os.path.join(T, 'bake', src), **kw)
        for p, s in export(im, base, widths, fmts):
            print(f'{s/1024:7.0f} KB  {os.path.basename(p)}')
