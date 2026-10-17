import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
src, out, text = sys.argv[1], sys.argv[2], sys.argv[3]
wght=float(sys.argv[4]); wdth=float(sys.argv[5]); track=float(sys.argv[6]); fill=sys.argv[7]
f=TTFont(src)
print({a.axisTag:(a.minValue,a.maxValue) for a in f['fvar'].axes})
f=instancer.instantiateVariableFont(f,{'wght':wght,'wdth':wdth,'opsz':96})
gs=f.getGlyphSet(); cmap=f.getBestCmap(); upm=f['head'].unitsPerEm
x=0; paths=[]
bp=BoundsPen(gs)
for ch in text:
    gn=cmap[ord(ch)]; g=gs[gn]
    pen=SVGPathPen(gs)
    tp=TransformPen(pen,(1,0,0,-1,x,0))
    g.draw(tp); paths.append(pen.getCommands())
    tb=TransformPen(bp,(1,0,0,-1,x,0)); g.draw(tb)
    x+=g.width+track*upm
xmin,ymin,xmax,ymax=bp.bounds
pad=0
vb=f'{xmin-pad:.0f} {ymin-pad:.0f} {xmax-xmin+2*pad:.0f} {ymax-ymin+2*pad:.0f}'
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="{text}"><title>{text}</title><path fill="{fill}" d="{" ".join(paths)}"/></svg>\n'
open(out,'w').write(svg); print(vb)
