"""Tiny isometric voxel-to-SVG renderer used for retired-product stand-ins and stickers (design 60)."""
import math
S = math.sqrt(3) / 2
PAL = dict(paper='#eef2f7', mist='#cad2db', fog='#8494a8', slate='#3c4958', rim='#1c2735', deep='#0e1721', void='#05080c',
           voltHi='#80bcff', volt='#0790ff', voltLo='#0559a8')
# three face tones per material: (top, left(+z), right(+x))
MAT = {
    'paper': ('#eef2f7', '#b4c0cf', '#7d8b9e'),
    'stone': ('#5d6f86', '#3c4b5e', '#273343'),
    'ghost': ('#3a475a', '#2a3546', '#1c2635'),
    'dark': ('#263446', '#1a2533', '#111a26'),
    'volt': ('#80bcff', '#0790ff', '#0559a8'),
    'dimvolt': ('#3d6ea6', '#25507f', '#183a60'),
}

def iso(x, y, z, s):
    return ((x - z) * S * s, ((x + z) * 0.5 - y) * s)

def box_faces(x, y, z, w=1, h=1, d=1):
    return {
        'top': [(x, y + h, z), (x + w, y + h, z), (x + w, y + h, z + d), (x, y + h, z + d)],
        'left': [(x, y, z + d), (x + w, y, z + d), (x + w, y + h, z + d), (x, y + h, z + d)],
        'right': [(x + w, y, z), (x + w, y + h, z), (x + w, y + h, z + d), (x + w, y, z + d)],
    }

class Scene:
    def __init__(self, s=20, ox=0, oy=0):
        self.items = []; self.s = s; self.ox = ox; self.oy = oy
    def pt(self, p):
        x, y = iso(*p, self.s); return f'{self.ox + x:.2f},{self.oy + y:.2f}'
    def box(self, x, y, z, w=1, h=1, d=1, mat='stone', key=None):
        # depth key: far-to-near by the box's near corner
        k = key if key is not None else (x + w + z + d + y * 0.001, y)
        self.items.append((k, ('box', (x, y, z, w, h, d, mat))))
    def overlay(self, key, svg):
        self.items.append((key, ('raw', svg)))
    def face_poly(self, pts, fill, extra=''):
        return f'<polygon points="{" ".join(self.pt(p) for p in pts)}" fill="{fill}" stroke="{fill}" stroke-width="0.5" stroke-linejoin="round" {extra}/>'
    def render(self):
        out = []
        for k, (kind, data) in sorted(self.items, key=lambda t: t[0]):
            if kind == 'raw': out.append(data(self) if callable(data) else data); continue
            x, y, z, w, h, d, mat = data
            tones = MAT[mat]
            f = box_faces(x, y, z, w, h, d)
            out.append(self.face_poly(f['left'], tones[1]))
            out.append(self.face_poly(f['right'], tones[2]))
            out.append(self.face_poly(f['top'], tones[0]))
        return ''.join(out)

def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{body}</svg>\n')
