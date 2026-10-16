"""Product visuals: the real product icon, imagined as a piece of glass on a grey surface,
throws a spectral caustic of its own silhouette. The only colour is the icon's own."""
import sys, os, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from caustic import tonemap, to_srgb
from caustic2 import render_chunked
from scipy.ndimage import gaussian_filter, affine_transform
from PIL import Image, ImageDraw, ImageFilter

T='/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.N0qADh4ELv/'
P='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_d6e5fca5-3c9-9/designs/_shared/products/'
A='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_d6e5fca5-3c9-9/designs/39/assets/products/'
os.makedirs(A, exist_ok=True)
W, H = int(os.environ.get('PW', 1600)), int(os.environ.get('PH', 1000))
ONLY = os.environ.get('ONLY')

def rounded(im, r):
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0,0,im.width-1,im.height-1), r, fill=255)
    out = im.convert('RGBA'); a = np.minimum(np.asarray(out)[...,3], np.asarray(m))
    out.putalpha(Image.fromarray(a)); return out

def harbor_tile(sz):
    t = Image.new('RGBA', (sz, sz), (26,26,26,255))
    mk = Image.open(T+'icons/harbor-mark.png').convert('RGBA').resize((int(sz*0.78),)*2, Image.LANCZOS)
    t.alpha_composite(mk, ((sz-mk.width)//2, (sz-mk.height)//2))
    return rounded(t, int(sz*0.22))

def g(l, mu, s): return np.exp(-0.5*((l-mu)/s)**2)
products = {
  'mcp-emails': dict(icon=lambda s: rounded(Image.open(P+'mcp-emails/icon.png').convert('RGBA').resize((s,s),Image.LANCZOS), 0),
                     spectrum=lambda l: 0.18 + 1.0*g(l,462,26) + 0.45*g(l,522,14), seed=11, amp=1.0),
  'fun-libs':   dict(icon=lambda s: rounded(Image.open(P+'fun-libs/icon.png').convert('RGBA').resize((s,s),Image.LANCZOS), int(s*0.22)),
                     spectrum=lambda l: 0.18 + 1.0*g(l,578,22), seed=12, amp=1.0),
  'toolrails':  dict(icon=lambda s: Image.open(T+'icons/toolrails.png').convert('RGBA').resize((s,s),Image.LANCZOS),
                     spectrum=lambda l: 0.12 + 1.0*g(l,584,13), seed=13, amp=1.0),
  'harbor':     dict(icon=harbor_tile,
                     spectrum=lambda l: 0.55 + 0.45*np.clip((l-400)/300,0,1), seed=14, amp=1.0),
}

S = 2; MG = 0.1
Wr, Hr = int(W*(1+2*MG))*S, int(H*(1+2*MG))*S
BG = np.array([0.0105, 0.0102, 0.0098])
isz = int(H*0.40)                     # icon size on the card
ix, iy = int(W*0.27), int(H*0.36)      # icon centre

for name, p in products.items():
    if ONLY and name != ONLY: continue
    icon = p['icon'](isz)
    alpha = np.asarray(icon)[...,3].astype(np.float32)/255
    # glass slab silhouette on the ray grid: icon alpha, projected onto the floor (light from upper left)
    big = np.zeros((Hr, Wr), np.float32)
    # inner detail: luminance edges of the icon make the glass uneven, so its glyph shows in the caustic
    lumi = np.asarray(icon.convert('L')).astype(np.float32)/255
    detail = gaussian_filter(lumi, 3)*alpha
    hmask = gaussian_filter(alpha, isz*0.09)*1.0 + 0.30*detail
    # low light from the upper left: the cast is stretched along direction d
    th = np.radians(float(os.environ.get('ANG', 24)))
    d = np.array([np.sin(th), np.cos(th)]); n = np.array([np.cos(th), -np.sin(th)])   # (y, x)
    a_, b_ = float(os.environ.get('STRETCH', 2.1)), 0.95
    Fm = S*(a_*np.outer(d, d) + b_*np.outer(n, n))
    Minv = np.linalg.inv(Fm)
    c_out = np.array([iy, ix]) + d*isz*(0.5*a_*0.92)
    c_r = (c_out + np.array([H*MG, W*MG]))*S
    centre_in = np.array([isz/2, isz/2])
    off = centre_in - Minv @ c_r
    hm = affine_transform(hmask, Minv, offset=off, output_shape=(Hr, Wr), order=1, cval=0)
    through = affine_transform(gaussian_filter(alpha, isz*0.035), Minv, offset=off, output_shape=(Hr, Wr), order=1, cval=0)
    ys_, xs_ = np.mgrid[0:Hr, 0:Wr].astype(np.float32)
    tt = ((ys_/S - H*MG - iy)*d[0] + (xs_/S - W*MG - ix)*d[1]) / (a_*isz)
    fade = np.exp(-np.clip(tt-0.2, 0, None)*1.6)
    through = through*fade
    # light through the glass only: coloured by the icon's own hue
    L = render_chunked(hm*isz*S*0.9*p['amp'], (W,H), strength=float(os.environ.get('STR',40))*W/1600, dispersion=0.16, nlam=28,
                       weight=through, offset=(-W*MG, -H*MG), scale=1/S, spectrum=p['spectrum'], seed=p['seed'])
    L *= float(os.environ.get('GAIN', 0.5))
    # ambient grey floor: soft pool, with the slab's shadow where light went through glass instead
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    pool = np.exp(-(((xx/W-0.45)/0.6)**2 + ((yy/H-0.45)/0.7)**2))
    shadow_o = gaussian_filter(through[::S, ::S][int(H*MG):int(H*MG)+H, int(W*MG):int(W*MG)+W], 6*W/1600)
    amb = (0.006 + 0.022*pool) * (1 - 0.9*shadow_o)
    img = to_srgb(BG*0 + amb[...,None] + tonemap(L, 1.0))
    rng = np.random.default_rng(p['seed'])
    img = np.clip(img + rng.normal(size=img.shape[:2])[...,None]*0.008, 0, 1)
    card = Image.fromarray((img*255+0.5).astype(np.uint8)).convert('RGBA')
    # contact shadow under the object
    sh_img = Image.new('RGBA', (W, H), (0,0,0,0))
    a = Image.fromarray((alpha*150).astype(np.uint8)).resize((isz, isz))
    blk = Image.new('RGBA', (isz, isz), (6,6,6,255)); blk.putalpha(a)
    sh_img.alpha_composite(blk, (ix-isz//2+int(isz*0.05), iy-isz//2+int(isz*0.07)))
    sh_img = sh_img.filter(ImageFilter.GaussianBlur(isz*0.06))
    card.alpha_composite(sh_img)
    card.alpha_composite(icon, (ix-isz//2, iy-isz//2))
    card = card.convert('RGB')
    card.save(A+f'{name}@2x.webp', quality=84, method=6)
    card.save(A+f'{name}@2x.avif', quality=60)
    sm = card.resize((W//2, H//2), Image.LANCZOS)
    sm.save(A+f'{name}.webp', quality=84, method=6)
    sm.save(A+f'{name}.avif', quality=60)
    sm.save(T+f'try/p_{name}.jpg', quality=90)
    print('ok', name)
