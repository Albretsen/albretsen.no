"""export.py src outdir base widths(comma) [crop x0,y0,x1,y1 in px] [jpgq] — writes base-W.{avif,webp,jpg}"""
import sys, os, subprocess, tempfile
from PIL import Image
src, outdir, base, widths = sys.argv[1], sys.argv[2], sys.argv[3], [int(w) for w in sys.argv[4].split(',')]
crop = [int(v) for v in sys.argv[5].split(',')] if len(sys.argv) > 5 and sys.argv[5] != '-' else None
q = int(sys.argv[6]) if len(sys.argv) > 6 else 80
im = Image.open(src).convert('RGB')
if crop: im = im.crop(crop)
os.makedirs(outdir, exist_ok=True)
for w in widths:
    h = round(im.size[1] * w / im.size[0])
    r = im.resize((w, h), Image.LANCZOS)
    p = os.path.join(outdir, f'{base}-{w}')
    r.save(p + '.jpg', quality=q, optimize=True, progressive=True)
    r.save(p + '.webp', quality=q - 2, method=6)
    tmp = tempfile.mktemp(suffix='.png'); r.save(tmp)
    subprocess.run(env={**os.environ,'SVT_LOG':'0'},args=['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-c:v', 'libsvtav1', '-crf', '36', '-preset', '4', '-pix_fmt', 'yuv420p', '-frames:v', '1', p + '.avif'], check=True)
    os.remove(tmp)
    print(base, w, h, *(f'{ext}:{os.path.getsize(p+"."+ext)//1024}K' for ext in ('avif', 'webp', 'jpg')))
