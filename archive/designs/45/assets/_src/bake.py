#!/usr/bin/env python3
"""Bake a scene from bake.html to PNG via headless Chrome --dump-dom.
usage: bake.py <scene> <w> <h> <out.png> [budget_ms]
Needs the static server on 127.0.0.1:6045 (worktree root)."""
import base64, re, subprocess, sys, tempfile, shutil

scene, w, h, out = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
budget = sys.argv[5] if len(sys.argv) > 5 else "60000"
url = f"http://127.0.0.1:6045/designs/45/assets/_src/bake.html?scene={scene}&w={w}&h={h}"
prof = tempfile.mkdtemp()
try:
    r = subprocess.run([
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless=new",
        "--use-angle=swiftshader", "--enable-unsafe-swiftshader", f"--user-data-dir={prof}",
        "--window-size=800,600", f"--virtual-time-budget={budget}", "--dump-dom", url],
        capture_output=True, text=True, timeout=900)
finally:
    shutil.rmtree(prof, ignore_errors=True)
m = re.search(r"data:image/png;base64,([A-Za-z0-9+/=]+)", r.stdout)
if not m:
    print("FAILED", r.stdout[-500:], r.stderr[-1500:]); sys.exit(1)
open(out, "wb").write(base64.b64decode(m.group(1)))
print("wrote", out)
