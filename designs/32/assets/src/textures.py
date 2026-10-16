"""Seamless paper-fibre textures (night paper + cream paper), procedurally.
Usage: python textures.py <assets-dir>   (needs numpy + pillow)
Seamless because every random field is periodic: noise is filtered in the
Fourier domain and fibres are drawn on a 3x3 wrap of the tile."""
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = sys.argv[1]; N = 512; rng = np.random.default_rng(0x73C2A7)

def periodic_noise(scale):
    f = np.fft.fftfreq(N)[:, None] ** 2 + np.fft.fftfreq(N)[None, :] ** 2
    spec = np.fft.fft2(rng.standard_normal((N, N))) * np.exp(-f * (N / scale) ** 2)
    n = np.real(np.fft.ifft2(spec)); return (n - n.mean()) / (n.std() + 1e-9)

def fibres(count, light):
    im = Image.new('L', (N, N), 128); d = ImageDraw.Draw(im)
    for _ in range(count):
        x, y = rng.uniform(0, N, 2); a = rng.uniform(0, np.pi * 2); L = rng.uniform(5, 26)
        pts = [(x, y)]
        for _ in range(4):
            a += rng.normal(0, .45); x += np.cos(a) * L / 4; y += np.sin(a) * L / 4; pts.append((x, y))
        v = int(128 + (rng.uniform(40, 110) if rng.random() < light else -rng.uniform(25, 60)))
        for ox in (-N, 0, N):
            for oy in (-N, 0, N):
                d.line([(px + ox, py + oy) for px, py in pts], fill=v, width=1)
    return (np.asarray(im.filter(ImageFilter.GaussianBlur(.45)), np.float32) - 128) / 128

def make(base, name, cloud=.05, fib=.10, grain=.035, light=.6):
    b = np.array(base, np.float32)[None, None, :] / 255
    lum = 1 + periodic_noise(60) * cloud * .5 + periodic_noise(160) * cloud * .5 + fibres(3600, light) * fib + rng.standard_normal((N, N)) * grain
    img = np.clip(b * lum[:, :, None], 0, 1)
    Image.fromarray((img * 255).astype(np.uint8)).save(f'{OUT}/extras/{name}.webp', quality=90, method=6)

make((14, 32, 66), 'paper-night', cloud=.06, fib=.45, grain=.05, light=.8)
make((245, 238, 222), 'paper-cream', cloud=.02, fib=.09, grain=.02, light=.3)
make((246, 140, 38), 'paper-sodium', cloud=.03, fib=.14, grain=.03, light=.6)
print('textures ok')
