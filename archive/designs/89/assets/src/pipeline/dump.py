"""dump.py url outdir : run headless chrome --dump-dom, decode 'name data:...' lines from #out into PNGs"""
import sys,subprocess,tempfile,base64,re,os,html,shutil
url,outdir=sys.argv[1],sys.argv[2]
prof=tempfile.mkdtemp()
r=subprocess.run(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome","--headless=new","--use-angle=swiftshader","--enable-unsafe-swiftshader",
  f"--user-data-dir={prof}","--window-size=1400,1000","--virtual-time-budget=40000","--dump-dom",url],capture_output=True,text=True,timeout=300)
shutil.rmtree(prof,ignore_errors=True)
m=re.search(r'<pre id="out">(.*?)</pre>',r.stdout,re.S)
if not m: print('no out', r.stdout[:500]); sys.exit(1)
os.makedirs(outdir,exist_ok=True)
for line in html.unescape(m.group(1)).strip().splitlines():
    name,data=line.split(' ',1)
    b=base64.b64decode(data.split(',',1)[1])
    p=os.path.join(outdir,name+'.png'); open(p,'wb').write(b); print(p,len(b))
