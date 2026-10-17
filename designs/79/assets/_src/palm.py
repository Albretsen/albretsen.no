import sys, os
import numpy as np
from PIL import Image, ImageFilter
OUT = os.path.join(sys.argv[1], 'extras')
os.makedirs(OUT, exist_ok=True)
im = Image.open('src/VeniceBeachpalmtrees.jpg').convert('RGB')
a = np.asarray(im).astype(np.float64) / 255
lum = a @ np.array([0.2126, 0.7152, 0.0722])
# soft matte: sky is bright (>0.3), palms are near-black
alpha = np.clip((0.30 - lum) / 0.18, 0, 1)
W, H = im.size
# crop the palm cluster on the right (from the 1400px view: x 840-1320, y 50-933)
box = (int(W * 0.595), int(H * 0.045), int(W * 0.95), H)
al = Image.fromarray((alpha * 255).astype(np.uint8)).crop(box)
# remove the small bush at the bottom left of the crop
al_np = np.asarray(al).copy()
h, w = al_np.shape
al_np[int(h * 0.93):, : int(w * 0.25)] = 0
al = Image.fromarray(al_np)
target_h = 1400
al = al.resize((round(al.width * target_h / al.height), target_h), Image.LANCZOS)
ink = Image.new('RGBA', al.size, (28, 26, 23, 0)); ink.putalpha(al)
ink.save(os.path.join(OUT, 'palm-cutout.png'), optimize=True)
ink.save(os.path.join(OUT, 'palm-cutout.webp'), quality=80, method=6)
# shadow: lower res, blurred, cool-violet shadow colour (light shadows on warm stucco read slightly blue)
sh = al.resize((al.width // 2, al.height // 2), Image.LANCZOS).filter(ImageFilter.GaussianBlur(5))
sh = sh.point(lambda v: int(v * 0.85))
shadow = Image.new('RGBA', sh.size, (52, 44, 78, 0)); shadow.putalpha(sh)
shadow.save(os.path.join(OUT, 'palm-shadow.png'), optimize=True)
shadow.save(os.path.join(OUT, 'palm-shadow.webp'), quality=80, method=6)
print(ink.size, shadow.size)
