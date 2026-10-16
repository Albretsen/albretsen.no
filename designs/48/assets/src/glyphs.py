import sys, os
out = sys.argv[1]
H = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="currentColor" fill-rule="evenodd" role="img" aria-label="%s">\n%s\n</svg>\n'
def circ(cx, cy, r):
    return f"M{cx-r} {cy}a{r} {r} 0 1 0 {2*r} 0a{r} {r} 0 1 0 {-2*r} 0Z"
g = {
'polyglot-pilot': ('Polyglot Pilot stand-in: two speech bubbles',
 '<path d="M10 8h24a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H20l-8 7v-7.4A6 6 0 0 1 4 26V14a6 6 0 0 1 6-6Z"/>\n<path d="M30 30h24a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6v7l-8-7H30a6 6 0 0 1-6-6V36a6 6 0 0 1 6-6Z"/>'),
'pinpoint': ('PinPoint stand-in: a location pin',
 f'<path d="M32 60C22 47 13 37 13 25.5a19 19 0 0 1 38 0C51 37 42 47 32 60Z{circ(32,25,7.5)}"/>'),
'webvakt': ('WebVakt stand-in: a watching eye',
 f'<path d="M3 32Q32 0 61 32Q32 64 3 32Z{circ(32,32,13)}"/>\n<path d="{circ(32,32,7)}"/>'),
'joke-central': ('Joke Central stand-in: a grin',
 f'<path d="M10 30h44a22 22 0 0 1-44 0Z"/>\n<path d="{circ(21,16,5.5)}"/>\n<path d="{circ(43,16,5.5)}"/>'),
'tryggere-hyring': ('Tryggere Hyring stand-in: a shield with a check',
 '<path d="M32 3 56 12v18c0 15-10 26-24 31C18 56 8 45 8 30V12Z M19 31l5-5 5.5 5.5L41 20l5 5-16.5 16.5Z"/>'),
'early-apps': ('Early apps stand-in: a percent sign',
 f'<path d="{circ(17,17,10)}{circ(17,17,4.5)}"/>\n<path d="{circ(47,47,10)}{circ(47,47,4.5)}"/>\n<path d="M45 6h9L19 58h-9Z"/>'),
}
os.makedirs(out, exist_ok=True)
for k, (label, body) in g.items():
    open(os.path.join(out, k + '.svg'), 'w').write(H % (label, body))
print('ok')
