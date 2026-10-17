import math
def oklch_to_srgb(L,C,h):
    a=C*math.cos(math.radians(h)); b=C*math.sin(math.radians(h))
    l_=L+0.3963377774*a+0.2158037573*b
    m_=L-0.1055613458*a-0.0638541728*b
    s_=L-0.0894841775*a-1.2914855480*b
    l,m,s=l_**3,m_**3,s_**3
    r=4.0767416621*l-3.3077115913*m+0.2309699292*s
    g=-1.2684380046*l+2.6097574011*m-0.3413193965*s
    bb=-0.0041960863*l-0.7034186147*m+1.7076147010*s
    def enc(x):
        x=max(0,min(1,x))
        return 12.92*x if x<=0.0031308 else 1.055*x**(1/2.4)-0.055
    return tuple(round(enc(v)*255) for v in (r,g,bb))
def hx(L,C,h):
    return '#%02x%02x%02x'%oklch_to_srgb(L,C,h)
if __name__=='__main__':
    P={'paper':(0.968,0.014,95),'paper-2':(0.925,0.02,95),'ink':(0.19,0.025,160),'ink-2':(0.38,0.03,160),
       'spot':(0.64,0.19,144),'spot-deep':(0.42,0.12,150),'spot-ink':(0.27,0.07,155),'glass':(0.93,0.05,150),'glow':(0.88,0.17,140)}
    for k,v in P.items(): print(k,v,hx(*v))
