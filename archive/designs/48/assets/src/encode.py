# Encodes the raw bakes (PNG) into the web-optimised kit: webp @2x + @1x, plus avif for the heroes.
# Usage: python encode.py <raw-folder> <assets-folder>   (needs Pillow >= 11.2 for AVIF)
import sys, os
from PIL import Image
raw, A = sys.argv[1], sys.argv[2]

def out(path):
    p = os.path.join(A, path); os.makedirs(os.path.dirname(p), exist_ok=True); return p

def emit(src, dest, sizes, q=82, avif=False, alpha=False):
    im = Image.open(os.path.join(raw, src)); im = im.convert('RGBA' if alpha else 'RGB')
    for suffix, w in sizes:
        r = im if im.width == w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        r.save(out(f'{dest}{suffix}.webp'), 'WEBP', quality=q, method=6)
        if avif: r.save(out(f'{dest}{suffix}.avif'), 'AVIF', quality=q - 22, speed=4)

emit('hero-mark.png', 'hero/hero-mark', [('@2x', 2880), ('', 1440), ('-sm', 828)], q=80, avif=True)
emit('hero-select.png', 'hero/hero-select', [('@2x', 2880), ('', 1440), ('-sm', 828)], q=80, avif=True)
emit('mark-solo.png', 'identity/mark-3d', [('@2x', 1200), ('', 600)], q=82, avif=True)
for p in ['mcp-emails', 'fun-libs', 'toolrails', 'harbor']:
    emit(f'portrait-{p}.png', f'products/{p}', [('@2x', 1600), ('', 800)], q=80)
for p in ['luma', 'polyglot-pilot', 'pinpoint', 'webvakt', 'joke-central', 'tryggere-hyring', 'early-apps']:
    emit(f'ghost-{p}.png', f'products/retired/{p}', [('@2x', 1200), ('', 600)], q=78)
for s in ['mark', 'sphere-glow', 'sphere-ion', 'pill', 'torus', 'cube', 'sphere-jade', 'pill-cobalt']:
    im = Image.open(os.path.join(raw, f'sprite-{s}.png')).convert('RGBA')
    im = im.crop(im.getbbox()); im.thumbnail((240, 240), Image.LANCZOS)
    im.save(out(f'physics/sprites/{s}.webp'), 'WEBP', quality=88, method=6)
emit('met-vase-nocturne.png', 'extras/met-vase-nocturne', [('@2x', 1000), ('', 500)], q=80)
emit('met-lafarge-nocturne.png', 'extras/met-lafarge-nocturne', [('@2x', 1600), ('', 800)], q=80)
sc = Image.open(os.path.join(raw, 'met-scarab-cutout.png')).convert('RGBA')
sc = sc.crop((0, 0, sc.width, int(sc.height * 0.94)))
sc.save(os.path.join(raw, 'met-scarab-trim.png'))
emit('met-scarab-trim.png', 'extras/met-scarab', [('@2x', 1200), ('', 600)], q=84, alpha=True)
print('encoded')
