"""Outline text to SVG path data using static font instances (no font dependency in output)."""
import os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
T=os.path.dirname(os.path.abspath(__file__))
_c={}
FONTS={'display':T+'/archivo-x.ttf','bold':T+'/archivo-800.ttf','mono':T+'/martian-500.ttf','monob':T+'/martian-700.ttf','serif':T+'/fonts/InstrumentSerif-Italic.ttf'}
def font(k):
    if k not in _c:
        f=TTFont(FONTS[k]); _c[k]=(f,f.getGlyphSet(),f.getBestCmap(),f['head'].unitsPerEm)
    return _c[k]
def width(s,size,k='display',track=0):
    f,gs,cmap,upm=font(k); sc=size/upm
    w=0
    for ch in s:
        g=cmap.get(ord(ch)) or cmap.get(32)
        w+=gs[g].width*sc+track*size
    return w-track*size if s else 0
def path(s,size,x=0,y=0,k='display',track=0,anchor='start'):
    f,gs,cmap,upm=font(k); sc=size/upm
    if anchor!='start':
        w=width(s,size,k,track); x-= w if anchor=='end' else w/2
    pen=SVGPathPen(gs); cx=x
    for ch in s:
        g=cmap.get(ord(ch)) or cmap.get(32)
        tp=TransformPen(pen,(sc,0,0,-sc,cx,y))
        gs[g].draw(tp)
        cx+=gs[g].width*sc+track*size
    return pen.getCommands()
