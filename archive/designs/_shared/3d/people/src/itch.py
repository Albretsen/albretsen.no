#!/usr/bin/env python3
# usage: itch.py <game-url> <outdir> [name-substring] -- downloads free itch uploads (zip only)
import sys, re, json, os, html, urllib.request, urllib.parse, http.cookiejar

game, out = sys.argv[1], sys.argv[2]
want = sys.argv[3] if len(sys.argv) > 3 else None
os.makedirs(out, exist_ok=True)
cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
op.addheaders = [("User-Agent", "Mozilla/5.0"), ("X-Requested-With", "XMLHttpRequest")]

page = op.open(game, timeout=60).read().decode("utf-8", "replace")
tok = re.search(r'name="csrf_token" value="([^"]+)', page).group(1)
dlu = json.loads(op.open(game + "/download_url", urllib.parse.urlencode({"csrf_token": tok}).encode(), timeout=60).read())["url"]
page = op.open(dlu, timeout=60).read().decode("utf-8", "replace")
ups = re.findall(r'data-upload_id="(\d+)".*?class="name"[^>]*>|<strong title="([^"]+)" class="name"', page, re.S)
pairs = re.findall(r'data-upload_id="(\d+)"[^<]*</a>.*?<strong title="([^"]+)" class="name"', page, re.S)
if not pairs:
    ids = list(dict.fromkeys(re.findall(r'data-upload_id="(\d+)"', page)))
    names = re.findall(r'<strong title="([^"]+)" class="name"', page)
    pairs = list(zip(ids, names))
print(pairs)
for uid, nm in pairs:
    nm = html.unescape(nm)
    if want and want not in nm:
        continue
    if not nm.lower().endswith(".zip"):
        print("skip non-zip", nm); continue
    r = json.loads(op.open(f"{game}/file/{uid}?source=view_game&as_props=1&after_download_lightbox=true",
                           urllib.parse.urlencode({"csrf_token": tok}).encode(), timeout=60).read())
    url = r.get("url")
    if not url:
        print("no url", nm, r); continue
    fn = os.path.join(out, re.sub(r"[^A-Za-z0-9_.-]", "_", nm))
    with op.open(url, timeout=900) as resp, open(fn, "wb") as f:
        f.write(resp.read())
    print("saved", fn, os.path.getsize(fn))
