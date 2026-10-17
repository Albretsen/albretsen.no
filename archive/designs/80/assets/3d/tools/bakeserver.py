import http.server, os, sys, base64, urllib.parse
ROOT=sys.argv[1]; OUT=sys.argv[2]; PORT=int(sys.argv[3])
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT,**k)
    def do_POST(s):
        q=urllib.parse.parse_qs(urllib.parse.urlparse(s.path).query)
        name=os.path.basename(q['name'][0])
        n=int(s.headers['Content-Length']); data=s.rfile.read(n)
        if data.startswith(b'data:'): data=base64.b64decode(data.split(b',',1)[1])
        open(os.path.join(OUT,name),'wb').write(data)
        s.send_response(200); s.end_headers(); s.wfile.write(b'ok')
    def log_message(s,*a): pass
http.server.ThreadingHTTPServer(('127.0.0.1',PORT),H).serve_forever()
