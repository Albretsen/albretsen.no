"""Product postcards: each live/building product gets its own pastel building in the snow,
with the REAL product logo on its sign, graded to its own hour of the day.
python products.py <tmpdir> <assets-dir>"""
import sys, os
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import build_layers as bl
from compose import compose

T, A = sys.argv[1], sys.argv[2]
OUT = f'{A}/products'; os.makedirs(OUT, exist_ok=True)
bl.T = T
W, H = 1600, 1200
bl.W, bl.H = W, H

# product id: (far source, yaw, pitch, hfov, warm-threshold, snow yaw, snow pitch, h, sunx)
spec = {
    'mcp-emails': ('kiara_8_sunset', 300, 2, 46, 0.07, 10, 2, 0.32, 0.84),
    'fun-libs': ('kiara_8_sunset', 40, 2, 44, 0.07, 330, 2, -0.05, 0.80),
    'toolrails': ('rolling_hills', 110, 1, 50, 0.05, 280, 2, 0.10, 0.16),
    'harbor': ('rolling_hills', 0, 1, 50, 0.05, 340, 2, -0.22, 0.80),
}
sizes = []
for pid, (src, yaw, pitch, hfov, thr, syaw, spitch, h, sunx) in spec.items():
    p = bl.recover_alpha(f'{T}/{pid}_b.png', f'{T}/{pid}_w.png')
    g = np.asarray(Image.open(f'{T}/{pid}_g.png').convert('RGB')).astype(np.float32) / 255
    rows = np.where(p[..., 3].max(1) > 0.9)[0]
    base = rows.max() / H
    m, _ = bl.mountains(src, yaw, pitch, hfov, thr, 0.62)
    s, _ = bl.snow(syaw, spitch, 70, base - 0.14)
    pre = 'P_' + pid
    np.save(f'{T}/{pre}_m.npy', m); np.save(f'{T}/{pre}_s.npy', s); np.save(f'{T}/{pre}_p.npy', p); np.save(f'{T}/{pre}_g.npy', g)
    img = compose(T, pre, h, sunx)
    im = Image.fromarray((img * 255 + 0.5).astype('uint8'))
    for w in (800, 1600):
        r = im.resize((w, w * 3 // 4), Image.LANCZOS)
        r.save(f'{OUT}/{pid}-{w}.avif', 'AVIF', quality=60, speed=4)
        r.save(f'{OUT}/{pid}-{w}.webp', 'WEBP', quality=80, method=6)
    im.resize((1200, 900), Image.LANCZOS).save(f'{OUT}/{pid}-1200.jpg', 'JPEG', quality=82, optimize=True, progressive=True)
    print(pid, 'base', round(base, 3))
