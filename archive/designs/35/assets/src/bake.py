"""Bake frames/stills from src/bake.html through headless Chrome.

usage: python3 bake.py "<url query>" <outdir>
e.g.   python3 bake.py "mode=stills&set=hero&w=2560&h=1600" /tmp/raw
Writes <outdir>/<name>.jpg for every line the page emits.
Requires the static server: python3 -m http.server 6035 --bind 127.0.0.1
"""
import base64, os, subprocess, sys, tempfile, shutil

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
query, outdir = sys.argv[1], sys.argv[2]
budget = sys.argv[3] if len(sys.argv) > 3 else "120000"
os.makedirs(outdir, exist_ok=True)
url = "http://127.0.0.1:6035/designs/35/assets/src/bake.html?" + query
profile = tempfile.mkdtemp()
try:
    html = subprocess.run([CHROME, "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
                           "--hide-scrollbars", f"--user-data-dir={profile}", "--window-size=800,600",
                           f"--virtual-time-budget={budget}", "--run-all-compositor-stages-before-draw",
                           "--dump-dom", url], capture_output=True, text=True, timeout=1800).stdout
finally:
    shutil.rmtree(profile, ignore_errors=True)
start = html.find('<pre id="out">')
body = html[start + len('<pre id="out">'): html.find('</pre>', start)]
n = 0
for line in body.strip().splitlines():
    if '|' not in line:
        continue
    name, data = line.split('|', 1)
    raw = base64.b64decode(data.split(',', 1)[1])
    with open(os.path.join(outdir, name + '.jpg'), 'wb') as f:
        f.write(raw)
    n += 1
print('wrote', n, 'images to', outdir)
