import sys, numpy as np
from PIL import Image
sys.path.insert(0, sys.argv[1]+'/py')
from common import *
from glassify import make_paper
from lens import ink_plate
S=sys.argv[1]; A=sys.argv[2]
for src,name,W,H,z in (('Haeckel_Spumellaria.jpg','plate-spumellaria',1600,1200,1.15),('Haeckel_Cyrtoidea.jpg','plate-cyrtoidea',1200,1600,1.0)):
    a=ink_plate(S,src,W,H,z,0.5,0.5)
    P=make_paper(H,W,W/2400,grid=False,seed=9)
    bg=P*(1-a[...,None]*0.95)+INK*a[...,None]*0.95
    im=Image.fromarray((lin2srgb(bg)*255+0.5).astype(np.uint8))
    im.save(f'{A}/extras/{name}.webp',quality=78,method=6)
    im.save(f'{A}/extras/{name}.jpg',quality=80,optimize=True,progressive=True)
print('ok')
