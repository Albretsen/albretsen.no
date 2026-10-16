import sys, os, subprocess
sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.ARFqOUlHoH/s')
from lib import *
from PIL import ImageDraw, ImageFont

OUT = sys.argv[1]
ONLY = sys.argv[2:]  # optional subset
FONT = f'{T}/fonts/PlexMono-Regular.ttf'; FONTB = f'{T}/fonts/PlexMono-Bold.ttf'
C = dict(cream='#f9f2e2', cream2='#efe5d0', cream3='#dcd0b8', forest='#14422b', deep='#052517', ink='#02130c',
         moss='#587d50', brass='#c59a44', brassd='#966b27', pulse='#e03c63')
for d in ['hero', 'tiles', 'products', 'extras']:
    os.makedirs(f'{OUT}/{d}', exist_ok=True)

def want(k): return not ONLY or k in ONLY

def save(img, path, lossless=False, q=82):
    if path.endswith('.avif'):
        img.save(path, quality=q-20)
    elif lossless:
        img.save(path, lossless=True, method=6)
    else:
        img.save(path, quality=q, method=6)

def dots_save(img, base, scales=((2, '1x'), (4, '2x'))):
    """img is the dot grid; write nearest-upscaled lossless webps"""
    for k, tag in scales:
        save(upscale(img, k), f'{base}@{tag}.webp', lossless=True)

# ---------- ASCII renderer ----------
RAMP = "  .,:;-=+*x%#@"
def ascii_render(L, cols, cell_w, cell_h, fsize, bg, fg, hi=None, hi_t=0.86, ramp=RAMP, lo=None, lo_t=0.0, font=FONT):
    h, w = L.shape
    rows = int(round(cols * (h/w) * (cell_w/cell_h)))
    small = Image.fromarray((L*255).astype(np.uint8)).resize((cols, rows), Image.LANCZOS)
    S = np.asarray(small).astype(np.float32)/255
    img = Image.new('RGB', (cols*cell_w, rows*cell_h), bg)
    dr = ImageDraw.Draw(img); f = ImageFont.truetype(font, fsize)
    n = len(ramp)
    lines = []
    for y in range(rows):
        line = ''
        for x in range(cols):
            v = S[y, x]; ch = ramp[min(n-1, int(v*n))]
            line += ch
            if ch == ' ': continue
            col = fg
            if hi and v >= hi_t: col = hi
            elif lo and v < lo_t: col = lo
            dr.text((x*cell_w + cell_w/2, y*cell_h + cell_h/2), ch, font=f, fill=col, anchor='mm')
        lines.append(line)
    return img, '\n'.join(lines)

# ---------- line engraving ----------
def engrave(L, w, h, period, ink, paper, ss=3, amp=0.35):
    """horizontal lines whose thickness follows darkness and whose path breathes with luminance"""
    Ls = np.asarray(Image.fromarray((L*255).astype(np.uint8)).resize((w*ss, h*ss), Image.BICUBIC)).astype(np.float32)/255
    Ls = np.asarray(Image.fromarray((Ls*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(ss*1.2))).astype(np.float32)/255
    P = period*ss
    yy = np.arange(h*ss)[:, None].astype(np.float32)
    band = np.floor(yy/P); centre = band*P + P/2
    dark = 1-Ls
    offset = (Ls-0.5)*P*amp
    thick = np.clip(dark, 0.04, 1)*P*0.92
    m = (np.abs(yy - (centre+offset)) < thick/2).astype(np.float32)
    pal_i, pal_p = hexrgb(ink), hexrgb(paper)
    out = pal_p*(1-m[..., None]) + pal_i*m[..., None]
    return Image.fromarray(out.astype(np.uint8)).resize((w, h), Image.LANCZOS)

# ---------- halftone ----------
def halftone(L, w, h, cell, ink, paper, ss=3, angle=45):
    Ls = np.asarray(Image.fromarray((L*255).astype(np.uint8)).resize((w*ss, h*ss), Image.BICUBIC)).astype(np.float32)/255
    Ls = np.asarray(Image.fromarray((Ls*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(cell*ss*0.35))).astype(np.float32)/255
    Y, X = np.mgrid[0:h*ss, 0:w*ss].astype(np.float32)
    a = np.radians(angle); c = cell*ss
    u = X*np.cos(a) + Y*np.sin(a); v = -X*np.sin(a) + Y*np.cos(a)
    du = (u % c) - c/2; dv = (v % c) - c/2
    r = np.sqrt(np.clip(1-Ls, 0, 1)) * c*0.62
    m = (np.sqrt(du*du+dv*dv) < r).astype(np.float32)
    out = hexrgb(paper)*(1-m[..., None]) + hexrgb(ink)*m[..., None]
    return Image.fromarray(out.astype(np.uint8)).resize((w, h), Image.LANCZOS)

def grade_photo(img, amount=0.28):
    """honest photo, nudged into the palette: forest shadows, cream highlights"""
    a = np.asarray(img).astype(np.float32)/255
    L = lum(img)[..., None]
    sh, hl = hexrgb(C['deep'])/255, hexrgb(C['cream'])/255
    tone = sh*(1-L) + hl*L
    out = a*(1-amount) + tone*amount
    out = np.clip((out-0.02)*1.04, 0, 1)
    rng = np.random.default_rng(7); out += rng.normal(0, 0.012, out.shape[:2])[..., None]
    return Image.fromarray((np.clip(out, 0, 1)*255).astype(np.uint8))

# =========================================================
# HERO
# =========================================================
if want('hero'):
    # A. misty pines, 1-bit Bayer 8x8, ink on cream (dot grid 720x450)
    v = view('misty_pines', 0, 6, 84, 1440, 900, ss=1)
    L = levels(lum(v.resize((720, 450), Image.LANCZOS)), 0.06, 0.97, 1.15)
    dots_save(colorize(ordered(L, 8).astype(int), [C['deep'], C['cream']]), f'{OUT}/hero/pines-bayer')
    # A'. same view, real photo, graded (for the loader's final reveal and the lens)
    v2 = view('misty_pines', 0, 6, 84, 2400, 1500, ss=1)
    g = unsharp(grade_photo(v2), 1.5, 40)
    save(g, f'{OUT}/hero/pines-photo@2x.webp', q=74)
    save(g.resize((1200, 750), Image.LANCZOS), f'{OUT}/hero/pines-photo@1x.webp', q=80)
    save(g.resize((1600, 1000), Image.LANCZOS), f'{OUT}/hero/pines-photo.avif')
    # B. birchwood ASCII on forest ink, brass highlights
    vb = view('misty_pines', 140, 20, 78, 2880, 1800, ss=1)
    Lb = autolev(lum(vb), 1, 99.7, 1.15)
    for tag, cw, chh, fs in (('1x', 8, 14, 12), ('2x', 16, 28, 24)):
        img, txt = ascii_render(Lb, 180, cw, chh, fs, C['ink'], C['cream2'], hi=C['brass'], hi_t=0.93, lo=C['moss'], lo_t=0.38)
        save(img, f'{OUT}/hero/fog-ascii@{tag}.webp', q=86)
    open(f'{OUT}/hero/fog-ascii.txt', 'w').write(txt)
    # C. mossy creek, Atkinson 1-bit, deep forest on brass-tinted paper
    vm = view('mossy_forest', -15, -18, 82, 1440, 900, ss=1)
    Lm = levels(lum(vm.resize((720, 450), Image.LANCZOS)), 0.04, 0.80, 0.9)
    dots_save(colorize(atkinson(Lm).astype(int), [C['deep'], C['cream2']]), f'{OUT}/hero/moss-atkinson')

# =========================================================
# MOODBOARD TILES (4:5) — each a different algorithm, same honest pixels
# =========================================================
if want('tiles'):
    # 1. pines, 3-tone ordered (ink / moss / cream)
    v = view('misty_pines', -40, 8, 60, 600, 750, ss=1)
    L = levels(lum(v.resize((300, 375), Image.LANCZOS)), 0.08, 0.96, 1.1)
    dots_save(colorize(ordered_multi(L, 3, 8), [C['deep'], C['moss'], C['cream']]), f'{OUT}/tiles/pines-3tone')
    # 2. moss boulder, Atkinson, ink on brass
    v = view('mossy_forest', 10, -25, 55, 600, 750, ss=1)
    L = levels(lum(v.resize((300, 375), Image.LANCZOS)), 0.05, 0.75, 0.95)
    dots_save(colorize(atkinson(L).astype(int), [C['ink'], C['brass']]), f'{OUT}/tiles/moss-atkinson')
    # 3. birches tall, ASCII cream on forest
    v = view('birchwood', 5, 8, 40, 600, 750, ss=1)
    L = autolev(lum(v.resize((300, 375), Image.LANCZOS)), 1, 99.5, 1.1)
    dots_save(colorize(ordered_multi(L, 4, 8), [C['ink'], C['forest'], C['brass'], C['cream']]), f'{OUT}/tiles/birch-4tone')
    # 4. frozen lake, breathing line engraving
    v = view('frozen_lake', 75, -6, 62, 1200, 1500, ss=1)
    L = levels(lum(v), 0.05, 0.85, 1.0)
    for tag, s in (('1x', 1), ('2x', 2)):
        save(engrave(L, 600*s, 750*s, 6*s, C['deep'], C['cream2']), f'{OUT}/tiles/lake-lines@{tag}.webp', q=84)
    # 5. pine bark texture, 45deg halftone, cream on forest
    up = view('misty_pines', 30, 72, 100, 1200, 1500, ss=1)  # looking straight up into the canopy
    L = 1-autolev(lum(up), 1, 99, 1.0)  # invert: light dots on dark
    for tag, s in (('1x', 1), ('2x', 2)):
        save(halftone(L, 600*s, 750*s, 9*s, C['cream'], C['forest']), f'{OUT}/tiles/canopy-halftone@{tag}.webp', q=84)

# =========================================================
# EXTRAS
# =========================================================
if want('extras'):
    # paper grain tile (ambientCG Paper004), tinted to cream, 512 seamless (texture is tileable)
    p = Image.open(f'{T}/pz/Paper004_1K-JPG_Color.jpg').convert('RGB').resize((512, 512), Image.LANCZOS)
    L = lum(p); L = np.clip((L - L.mean())*1.2, -0.12, 0.12)
    base = hexrgb(C['cream'])
    out = np.clip(base[None, None, :]*(1+L[..., None]*0.35), 0, 255)
    save(Image.fromarray(out.astype(np.uint8)), f'{OUT}/extras/paper-grain.webp', q=80)
    # moss texture strip: mossy_rock, Bayer 3-tone, as a section divider band
    r = Image.open(f'{T}/dl/mossy_rock.jpg').convert('RGB').crop((0, 700, 2048, 956))
    L = levels(lum(r.resize((720, 90), Image.LANCZOS)), 0.1, 0.8, 1.0)
    dots_save(colorize(ordered_multi(L, 3, 4), [C['ink'], C['forest'], C['moss']]), f'{OUT}/extras/moss-band')
    # breath gradient: pure Bayer ramp cream -> forest (a dithered gradient strip)
    w, h = 720, 30
    x = np.linspace(0, 1, w)[None, :].repeat(h, 0)
    g = 0.5 - 0.5*np.cos(x*np.pi*2)  # breathe in, breathe out
    dots_save(colorize(ordered(g, 8).astype(int), [C['forest'], C['cream']]), f'{OUT}/extras/breath-ramp')
    # ASCII linen: rough_linen texture as dense ASCII swatch (used as card backs)
    li = Image.open(f'{T}/dl/mossy_rock.jpg').convert('RGB').crop((200, 200, 1736, 1160))
    L = 1-autolev(lum(li), 1, 99, 1.0)
    img, _ = ascii_render(L, 128, 12, 20, 17, C['cream2'], C['forest'], hi=C['brassd'], hi_t=0.9)
    save(img, f'{OUT}/extras/rock-ascii.webp', q=84)

print('done')
