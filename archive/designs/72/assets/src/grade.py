import sys, os, numpy as np
from PIL import Image, ImageFilter

T = os.path.dirname(os.path.abspath(__file__))
A = '/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-12/designs/72/assets'

def hexrgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], np.float32) / 255

def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def grade(img, shadow='#4B5663', mid='#E9B98A', high='#FFF1E4', lift=0.06, sat=0.82, warm=0.0, contrast=1.0, grain=0.018, seed=1):
    a = np.asarray(img.convert('RGB'), np.float32) / 255
    lum = a @ np.array([0.299, 0.587, 0.114], np.float32)
    # contrast around mid grey (soft S)
    if contrast != 1.0:
        a = np.clip(0.5 + (a - 0.5) * contrast, 0, 1)
        lum = a @ np.array([0.299, 0.587, 0.114], np.float32)
    # desaturate toward pastel
    a = lum[..., None] + (a - lum[..., None]) * sat
    # split tone: slate shadows, peach mids, cream highlights
    s, m, h = hexrgb(shadow), hexrgb(mid), hexrgb(high)
    ws = (1 - smooth(lum, 0.0, 0.45))[..., None]
    wh = smooth(lum, 0.6, 1.0)[..., None]
    wm = np.clip(1 - ws - wh, 0, 1)
    tint = ws * s + wm * m + wh * h
    a = a * (1 - 0.22) + (a * tint * 1.25) * 0.22 + (tint - 0.5) * 0.05
    a = a + warm * np.array([0.03, 0.01, -0.02], np.float32)
    # lift blacks (matte)
    a = lift + a * (1 - lift)
    rng = np.random.default_rng(seed)
    a = a + (rng.standard_normal(a.shape[:2])[..., None] * grain)
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))

def export(img, name, widths, q=(78, 76, 50), folder='hero', jpg_max=1600):
    out = os.path.join(A, folder); os.makedirs(out, exist_ok=True)
    W, H = img.size
    for w in widths:
        h = round(H * w / W)
        r = img.resize((w, h), Image.LANCZOS) if w != W else img
        base = os.path.join(out, f'{name}-{w}')
        if w <= jpg_max: r.save(base + '.jpg', quality=q[0], optimize=True, progressive=True)
        r.save(base + '.webp', quality=q[1], method=6)
        r.save(base + '.avif', quality=q[2], speed=4)
    print(name, W, H)

if __name__ == '__main__':
    job = sys.argv[1]
    if job == 'photos':
        im = Image.open(os.path.join(T, 'dl/sheep_3000.jpg'))
        # crop to 16:9 keeping the lit summit and the fog bank
        W, H = im.size; ch = int(W * 9 / 16); top = int(H * 0.04)
        im = im.crop((0, top, W, top + ch)).resize((2560, 1440), Image.LANCZOS)
        g = grade(im, shadow='#56617A', mid='#EDB27C', high='#FFF0E2', lift=0.05, sat=0.86, contrast=1.04, grain=0.005, seed=3)
        export(g, 'golden-hills', [2560, 1600, 960])
        im = Image.open(os.path.join(T, 'dl/long_3000.jpg'))
        W, H = im.size; ch = int(W * 9 / 16); top = H - ch
        im = im.crop((0, top, W, top + ch)).resize((2560, 1440), Image.LANCZOS)
        g = grade(im, shadow='#4E5B78', mid='#E8B48C', high='#FFF3E8', lift=0.07, sat=0.8, contrast=0.98, grain=0.005, seed=5)
        export(g, 'long-shadows', [2560, 1600, 960])
    if job == 'renders':
        B = os.path.join(T, 'bake')
        export(Image.open(os.path.join(B, 'hero-wide.png')).convert('RGB'), 'terrace-wide', [2560, 1600, 960])
        export(Image.open(os.path.join(B, 'hero-tall.png')).convert('RGB'), 'terrace-tall', [1280, 800])
        for p in ['mcp-emails', 'fun-libs', 'toolrails', 'harbor']:
            export(Image.open(os.path.join(B, f'p-{p}.png')).convert('RGB'), p, [1600, 800], folder='products')
    if job == 'nasa':
        im = Image.open(os.path.join(T, 'dl/nasa.jpg'))
        W, H = im.size
        # southern Norway: fjords and the snowy plateau
        box = (int(W * 0.20), int(H * 0.41), int(W * 0.20) + int(W * 0.36), int(H * 0.41) + int(W * 0.36 * 4 / 5))
        im = im.crop(box).resize((1600, 1280), Image.LANCZOS)
        g = grade(im, shadow='#3F4B63', mid='#D9B48E', high='#FFF6EE', lift=0.12, sat=0.3, contrast=1.05, grain=0.0, seed=9)
        export(g, 'norway-from-orbit', [1600, 800], folder='extras', jpg_max=800)
