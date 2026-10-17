import os
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
T=os.path.dirname(__file__)
F=T+'/fonts'
OUT='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-28/designs/88/assets/fonts'
U="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2190-2199,U+2212,U+2215,U+2605-2606,U+00B7"
for src,dst in [('Archivo.ttf','archivo-var.woff2'),('MartianMono.ttf','martian-mono-var.woff2'),('InstrumentSerif-Italic.ttf','instrument-serif-italic.woff2')]:
    opts=subset.Options(); opts.flavor='woff2'; opts.layout_features=['*']
    f=TTFont(F+'/'+src)
    s=subset.Subsetter(opts); s.populate(unicodes=subset.parse_unicodes(U)); s.subset(f)
    f.flavor='woff2'; f.save(OUT+'/'+dst)
    print(dst, os.path.getsize(OUT+'/'+dst))

# static instances for outlining
a=TTFont(F+'/Archivo.ttf')
inst=instancer.instantiateVariableFont(a,{'wdth':125,'wght':850})
inst.save(T+'/archivo-x.ttf')
m=TTFont(F+'/MartianMono.ttf')
print(m['fvar'].axes and [(x.axisTag,x.minValue,x.maxValue) for x in m['fvar'].axes])
mi=instancer.instantiateVariableFont(m,{'wdth':100,'wght':500})
mi.save(T+'/martian-500.ttf')
mi=instancer.instantiateVariableFont(TTFont(F+'/MartianMono.ttf'),{'wdth':112.5,'wght':700})
mi.save(T+'/martian-700.ttf')
a2=instancer.instantiateVariableFont(TTFont(F+'/Archivo.ttf'),{'wdth':100,'wght':800})
a2.save(T+'/archivo-800.ttf')
