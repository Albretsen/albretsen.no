import sys, os, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from caustic import fbm, tonemap, to_srgb, lam_rgb
from PIL import Image
T='/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.N0qADh4ELv/'
A='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_d6e5fca5-3c9-9/designs/39/assets/extras/'
os.makedirs(A, exist_ok=True)

# 1) seamless caustic tile (periodic height field + wrap-around splat): light on a wall
N = 1024; S = 2; R = N*S
h = fbm((R, R), beta=4.4, hi=0.0045, seed=36) * 1.0
gy, gx = np.gradient(h)
# periodic gradient fix at borders
gx[:, 0] = (h[:, 1]-h[:, -1])/2; gx[:, -1] = (h[:, 0]-h[:, -2])/2
gy[0, :] = (h[1, :]-h[-1, :])/2; gy[-1, :] = (h[0, :]-h[-2, :])/2
ys, xs = np.mgrid[0:R, 0:R].astype(np.float32)
img = np.zeros((N*N, 3))
edges = np.linspace(400, 700, 25)
rng = np.random.default_rng(2)
for i in range(24):
    lam = rng.uniform(edges[i], edges[i+1], size=xs.shape).astype(np.float32)
    k = 4200*(1 + 0.10*(550-lam)/100)
    px = ((xs + k*gx)/S) % N; py = ((ys + k*gy)/S) % N
    x0 = np.floor(px).astype(np.int64); y0 = np.floor(py).astype(np.int64)
    fx = px-x0; fy = py-y0
    acc = np.zeros(N*N)
    for dx, dy, ww in ((0,0,(1-fx)*(1-fy)),(1,0,fx*(1-fy)),(0,1,(1-fx)*fy),(1,1,fx*fy)):
        acc += np.bincount((((y0+dy) % N)*N + (x0+dx) % N).ravel(), weights=ww.ravel(), minlength=N*N)
    img += acc[:, None]*lam_rgb(0.5*(edges[i]+edges[i+1]))[None, :]
img = img.reshape(N, N, 3)/24/(S*S)
lin = 0.005 + tonemap(img, 0.05)*0.9
t = to_srgb(lin)
t = np.clip(t + rng.normal(size=(N, N))[..., None]*0.006, 0, 1)
Image.fromarray((t*255+.5).astype(np.uint8)).save(A+'caustic-tile.webp', quality=80, method=6)
Image.fromarray((t*255+.5).astype(np.uint8)).save(T+'try/caustic-tile.png')
print('tile', t.mean())

# 2) grain tile: 256px monochrome noise with alpha, for overlays (mix-blend-mode: overlay)
g = rng.normal(size=(256, 256))
g = (g - g.min())/(g.max()-g.min())
a = np.full((256, 256), 34, np.uint8)
rgba = np.dstack([(g*255).astype(np.uint8)]*3 + [a])
Image.fromarray(rgba, 'RGBA').save(A+'grain.png', optimize=True)

# 3) frost photographs (Wikimedia Commons, CC0, W.carter): graded to the palette
def grade(im, lift=0.03, sat=0.85):
    arr = np.asarray(im.convert('RGB')).astype(np.float32)/255
    lum = (0.2126*arr[...,0]+0.7152*arr[...,1]+0.0722*arr[...,2])[..., None]
    arr = lum + (arr-lum)*sat
    arr = lift + arr*(1-lift)
    return Image.fromarray((np.clip(arr, 0, 1)*255+.5).astype(np.uint8))
im = Image.open(T+'snow/snow42_2880.jpg'); print(im.size)
w, hh = im.size
c = im.crop((0, int((hh - w*9/16)/2), w, int((hh + w*9/16)/2))).resize((2400, 1350), Image.LANCZOS)
c = grade(c)
c.save(A+'frost-wide@2x.webp', quality=74, method=6); c.save(A+'frost-wide@2x.avif', quality=52)
c2 = c.resize((1200, 675), Image.LANCZOS); c2.save(A+'frost-wide.webp', quality=78, method=6); c2.save(A+'frost-wide.avif', quality=55)
im = Image.open(T+'snow/snow40_2880.jpg'); print(im.size)
w, hh = im.size
side = min(w, hh)
c = im.crop((int(w*0.42 - side/2) if w > side else 0, 0, int(w*0.42 - side/2)+side if w > side else side, side)).resize((1400, 1400), Image.LANCZOS)
c = grade(c, sat=0.9)
c.save(A+'frost-detail@2x.webp', quality=74, method=6); c.save(A+'frost-detail@2x.avif', quality=52)
c3 = c.resize((700, 700), Image.LANCZOS); c3.save(A+'frost-detail.webp', quality=78, method=6); c3.save(A+'frost-detail.avif', quality=55)
c3.save(T+'try/frost-detail.jpg', quality=88); c2.save(T+'try/frost-wide.jpg', quality=88)
print('ok')
