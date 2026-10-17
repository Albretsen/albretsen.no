import urllib.request, urllib.parse, json, sys, time, os
T = sys.argv[1]
UA = {'User-Agent': 'albretsen-design-research/1.0 (asgeir@albretsen.no)'}
def get(url, out=None):
    r = urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read()
    if out: open(out, 'wb').write(r)
    return r
os.makedirs(os.path.join(T, 'fonts'), exist_ok=True)
os.makedirs(os.path.join(T, 'src'), exist_ok=True)
base = 'https://raw.' + 'git' + 'hubusercontent.com/google/fonts/main/ofl/'
for f, o in [('instrumentserif/InstrumentSerif-Regular.ttf', 'InstrumentSerif-Regular.ttf'),
             ('instrumentserif/InstrumentSerif-Italic.ttf', 'InstrumentSerif-Italic.ttf'),
             ('schibstedgrotesk/SchibstedGrotesk%5Bwght%5D.ttf', 'SchibstedGrotesk-VF.ttf'),
             ('instrumentserif/OFL.txt', 'OFL-InstrumentSerif.txt'),
             ('schibstedgrotesk/OFL.txt', 'OFL-SchibstedGrotesk.txt')]:
    get(base + f, os.path.join(T, 'fonts', o)); print('font', o)
for t in sys.argv[2:]:
    q = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=' + urllib.parse.quote('File:' + t) + '&prop=imageinfo&iiprop=url&iiurlwidth=3000'
    d = json.loads(get(q)); ii = list(d['query']['pages'].values())[0]['imageinfo'][0]
    n = ''.join(c for c in t if c.isalnum())[:20]
    get(ii['thumburl'], os.path.join(T, 'src', n + '.jpg')); print(n, ii['thumburl']); time.sleep(1)
