import re, sys, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFilter
S=sys.argv[1]; A=sys.argv[2]  # tmp, assets dir
def inner(path):
    s=open(path).read()
    vb=re.search(r'viewBox="([^"]+)"',s).group(1)
    body=re.sub(r'^.*?<svg[^>]*>','',s,flags=re.S).rsplit('</svg>',1)[0]
    body=re.sub(r'<title>.*?</title>','',body)
    return vb, body
mvb,mb=inner(A+'/brand/mark.svg')
wvb,wb=inner(A+'/brand/wordmark.svg')
avb,ab=inner(S+'/out/as.svg')
lvb,lb=inner(S+'/out/line.svg')
W=[float(x) for x in wvb.split()]; Aa=[float(x) for x in avb.split()]
# lockup in a 1000-unit-high box: mark 1000 tall, wordmark 560 tall
wh=520; ww=wh*W[2]/W[3]; ah=200; aw=ah*Aa[2]/Aa[3]
total=1000+170+ww+60+aw
lock=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total:.0f} 1000" role="img" aria-label="Albretsen AS"><title>Albretsen AS</title>
<svg x="0" y="0" width="1000" height="1000" viewBox="{mvb}">{mb}</svg>
<svg x="1170" y="{500-wh/2+20:.0f}" width="{ww:.0f}" height="{wh}" viewBox="{wvb}">{wb}</svg>
<svg x="{1170+ww+60:.0f}" y="{500+wh/2+20-ah-8:.0f}" width="{aw:.0f}" height="{ah}" viewBox="{avb}">{ab}</svg>
</svg>
'''
open(A+'/brand/lockup.svg','w').write(lock)
fav=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><title>Albretsen AS</title>
<rect width="64" height="64" rx="14" fill="#f7f5ea"/>
<svg x="5" y="5" width="54" height="54" viewBox="{mvb}">{mb.replace('a85-','f85-')}</svg>
</svg>
'''
open(A+'/brand/favicon.svg','w').write(fav)
subprocess.run(['rsvg-convert','-w','180','-h','180',A+'/brand/favicon.svg','-o',A+'/brand/favicon-180.png'],check=True)
# OG image
base=Image.open(S+'/out/split-2400.jpg').convert('RGB')
base=base.resize((1200,675),Image.LANCZOS).crop((0,22,1200,652))
og=base.copy()
# paper label panel on the left
panel=Image.new('RGBA',(1200,630),(0,0,0,0)); d=ImageDraw.Draw(panel)
d.rounded_rectangle((48,330,690,582),radius=26,fill=(247,245,234,246))
sh=Image.new('RGBA',(1200,630),(0,0,0,0)); ds=ImageDraw.Draw(sh)
ds.rounded_rectangle((56,344,698,596),radius=26,fill=(9,23,16,70)); sh=sh.filter(ImageFilter.GaussianBlur(14))
og=Image.alpha_composite(og.convert('RGBA'),sh); og=Image.alpha_composite(og,panel)
subprocess.run(['rsvg-convert','-h','120',A+'/brand/lockup.svg','-o',S+'/out/lock.png'],check=True)
subprocess.run(['rsvg-convert','-h','30',S+'/out/line.svg','-o',S+'/out/line.png'],check=True)
lk=Image.open(S+'/out/lock.png').convert('RGBA'); lk.thumbnail((560,120))
og.alpha_composite(lk,(84,370))
ln=Image.open(S+'/out/line.png').convert('RGBA'); ln.thumbnail((560,30))
og.alpha_composite(ln,(88,520))
og.convert('RGB').save(A+'/brand/og.jpg',quality=88)
print('ok', total)
