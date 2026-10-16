import sys, os, subprocess, io
sys.path.insert(0, '/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.ARFqOUlHoH/s')
from lib import *
from PIL import ImageDraw, ImageFont
import imagery_fns as F

OUT = sys.argv[1]; SH = sys.argv[2]  # shared products dir
os.makedirs(f'{OUT}/products', exist_ok=True)
C = F.C
FONT, FONTB = F.FONT, F.FONTB
BRIC = f'{T}/fonts/Bric.ttf'

def bric(size, wght=640, wdth=88):
    f = ImageFont.truetype(BRIC, size)
    try: f.set_variation_by_axes([96, wght, wdth])
    except Exception as e: print('var', e)
    return f

def svg_png(path, w, h=None):
    args = ['rsvg-convert', '-w', str(w)] + (['-h', str(h)] if h else []) + [path]
    return Image.open(io.BytesIO(subprocess.run(args, capture_output=True, check=True).stdout)).convert('RGBA')

def rounded(img, r):
    m = Image.new('L', img.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, img.width-1, img.height-1), r, fill=255)
    out = img.convert('RGBA'); a = Image.composite(out.getchannel('A'), m, m) if out.mode == 'RGBA' else m
    out.putalpha(Image.fromarray(np.minimum(np.asarray(out.getchannel('A')), np.asarray(m))))
    return out

def crop_marks(dr, x0, y0, x1, y1, col, L=28, gap=14, w=3):
    for (x, y, sx, sy) in ((x0, y0, -1, -1), (x1, y0, 1, -1), (x0, y1, -1, 1), (x1, y1, 1, 1)):
        dr.line((x+sx*gap, y, x+sx*(gap+L), y), fill=col, width=w)
        dr.line((x, y+sy*gap, x, y+sy*(gap+L)), fill=col, width=w)

W, H = 2400, 1600
def card(bg, logo, n, name, status, since, line, fig_v, fig_l, credit, on_dark=True, out='x'):
    im = bg.convert('RGB').copy(); dr = ImageDraw.Draw(im)
    x0, y0, cw, ch = 180, 200, 860, 1200
    # hard shadow then card
    dr.rectangle((x0+18, y0+18, x0+cw+18, y0+ch+18), fill=C['ink'])
    dr.rectangle((x0, y0, x0+cw, y0+ch), fill=C['cream'])
    crop_marks(dr, x0, y0, x0+cw+18, y0+ch+18, C['cream'] if on_dark else C['ink'])
    m = ImageFont.truetype(FONT, 26); mb = ImageFont.truetype(FONTB, 26)
    dr.text((x0+48, y0+48), f'FIG. {n:02d}', font=mb, fill=C['ink'])
    dr.text((x0+48+130, y0+48), f'/ SINCE {since}', font=m, fill=C['forest'])
    # status chip
    sc = {'LIVE': C['forest'], 'BUILDING': C['brassd'], 'PAUSED': C['pulse']}[status]
    tw = dr.textlength(status, font=mb)
    dr.rectangle((x0+cw-48-tw-44, y0+40, x0+cw-48, y0+86), fill=sc)
    dr.ellipse((x0+cw-48-tw-30, y0+56, x0+cw-48-tw-16, y0+70), fill=C['cream'])
    dr.text((x0+cw-48-tw-4, y0+63), status, font=mb, fill=C['cream'], anchor='lm')
    # rule
    dr.line((x0+48, y0+112, x0+cw-48, y0+112), fill=C['ink'], width=2)
    # logo centred in upper area
    lx = x0 + (cw-logo.width)//2; ly = y0 + 150 + (520-logo.height)//2
    im.paste(logo, (lx, ly), logo)
    # name + line
    dr.text((x0+48, y0+760), name, font=bric(108), fill=C['ink'])
    yy = y0+900
    ml = ImageFont.truetype(FONT, 30)
    words = line.split(); cur = ''
    for w_ in words:
        t = (cur+' '+w_).strip()
        if dr.textlength(t, font=ml) > cw-96: dr.text((x0+48, yy), cur, font=ml, fill=C['forest']); yy += 42; cur = w_
        else: cur = t
    dr.text((x0+48, yy), cur, font=ml, fill=C['forest'])
    # figure row
    dr.line((x0+48, y0+ch-150, x0+cw-48, y0+ch-150), fill=C['ink'], width=2)
    dr.text((x0+48, y0+ch-56), fig_v, font=bric(84, 700), fill=C['ink'], anchor='ls')
    fv = dr.textlength(fig_v, font=bric(84, 700))
    dr.text((x0+48+fv+20, y0+ch-62), fig_l.upper(), font=mb, fill=C['brassd'], anchor='ls')
    # honest credit, bottom right on the photo
    cf = ImageFont.truetype(FONT, 24)
    tw = dr.textlength(credit, font=cf)
    dr.rectangle((W-80-tw-32, H-80-52, W-80, H-80), fill=C['ink'])
    dr.text((W-80-tw-16, H-80-26), credit, font=cf, fill=C['cream2'], anchor='lm')
    im.save(f'{OUT}/products/{out}@2x.webp', quality=84, method=6)
    im.resize((W//2, H//2), Image.LANCZOS).save(f'{OUT}/products/{out}@1x.webp', quality=84, method=6)
    return im

# --- backgrounds (dot grid 600x400 -> x4)
def bg_bayer(name, yaw, pitch, fov, cols, lo=0.06, hi=0.97, g=1.1):
    v = view(name, yaw, pitch, fov, 1200, 800, ss=1).resize((600, 400), Image.LANCZOS)
    L = levels(lum(v), lo, hi, g)
    return upscale(colorize(ordered(L, 8).astype(int), cols), 4)

# MCP Emails — fog ASCII, cream on ink
v = view('misty_pines', -100, 16, 80, 2400, 1600, ss=1)
L = autolev(lum(v), 1, 99.7, 1.15)
bg1, _ = F.ascii_render(L, 200, 12, 20, 18, C['ink'], C['cream2'], hi=C['brass'], hi_t=0.93, lo=C['moss'], lo_t=0.4)
bg1 = bg1.resize((W, H), Image.LANCZOS) if bg1.size != (W, H) else bg1
bg1c = Image.new('RGB', (W, H), C['ink']); bg1c.paste(bg1, (0, 0))
logo1 = rounded(Image.open(f'{SH}/mcp-emails/icon.png').convert('RGBA').resize((440, 440), Image.LANCZOS), 0)
card(bg1c, logo1, 1, 'MCP Emails', 'LIVE', 2026, 'Email for AI agents. 17 tools, about 100 email providers, open source (AGPL).',
     '$782', 'MRR', 'bg: misty_pines (Poly Haven, CC0) rendered as ASCII', out='mcp-emails')

# Fun Libs — birchwood Bayer, forest/cream
bg2 = bg_bayer('birchwood', 0, 6, 72, [C['forest'], C['cream2']], 0.12, 0.95, 1.2)
logo2 = rounded(Image.open(f'{SH}/fun-libs/icon.png').convert('RGBA').resize((440, 440), Image.LANCZOS), 98)
card(bg2, logo2, 2, 'Fun Libs', 'LIVE', 2019, 'A fill-in-the-blanks word game for Android and iOS. Built at 17. No marketing.',
     '113,000+', 'installs', 'bg: birchwood (Poly Haven, CC0), Bayer 8x8, 1-bit', out='fun-libs')

# Toolrails — frozen lake engraving, ink on cream2
v = view('frozen_lake', 40, -4, 84, 1200, 800, ss=1)
bg3 = F.engrave(autolev(lum(v), 1, 99, 1.0), W, H, 10, C['deep'], C['cream3'], ss=2)
logo3 = svg_png(f'{SH}/toolrails/icon.svg', 440, 440)
card(bg3, logo3, 3, 'Toolrails', 'BUILDING', 2026, 'One MCP URL that gives an agent every tool. Tool search and an injection guard.',
     '4', 'connectors', 'bg: frozen_lake (Poly Haven, CC0), line engraving', on_dark=False, out='toolrails')

# Harbor — mossy creek Atkinson, ink on brass
v = view('mossy_forest', 60, -20, 80, 1200, 800, ss=1).resize((600, 400), Image.LANCZOS)
bg4 = upscale(colorize(atkinson(levels(lum(v), 0.04, 0.78, 0.95)).astype(int), [C['ink'], C['brass']]), 4)
logo4 = svg_png(f'{SH}/harbor/harbor-mark.svg', 400, 400)
card(bg4, logo4, 4, 'Harbor', 'PAUSED', 2026, 'A private knowledge base shared by people and AI. Self-hostable. AI edits held for approval.',
     '549', 'commits', 'bg: mossy_forest (Poly Haven, CC0), Atkinson, 1-bit', out='harbor')
print('ok')
