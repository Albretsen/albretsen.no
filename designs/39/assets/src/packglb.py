"""Pack Poly Haven moon_rock_03 (CC0) into a single .glb with web-sized textures."""
import json, struct, io
from PIL import Image
R='/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.N0qADh4ELv/rock/'
OUT='/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_d6e5fca5-3c9-9/designs/39/assets/interactive/stone.glb'
g=json.load(open(R+'moon_rock_03_1k.gltf'))
binv=open(R+'moon_rock_03.bin','rb').read()
assert len(binv)==g['buffers'][0]['byteLength']
sizes={'moon_rock_03_nor_gl':512,'moon_rock_03_diff':768,'moon_rock_03_rough':512}
blob=bytearray(binv)
def pad4(b):
    while len(b)%4: b.append(0)
pad4(blob)
for img in g['images']:
    im=Image.open(R+img['uri']).convert('RGB')
    s=sizes[img['name']]; im=im.resize((s,s),Image.LANCZOS)
    bio=io.BytesIO(); im.save(bio,'JPEG',quality=84 if 'diff' in img['name'] else 88,optimize=True)
    data=bio.getvalue()
    g['bufferViews'].append({'buffer':0,'byteOffset':len(blob),'byteLength':len(data)})
    img['bufferView']=len(g['bufferViews'])-1; del img['uri']
    blob+=data; pad4(blob)
g['buffers']=[{'byteLength':len(blob)}]
g['asset']['copyright']='Moon Rock 03 by Poly Haven (Greg Zaal, Rico Cilliers, Jenelle van Heerden), CC0'
js=json.dumps(g,separators=(',',':')).encode()
while len(js)%4: js+=b' '
total=12+8+len(js)+8+len(blob)
out=struct.pack('<III',0x46546C67,2,total)+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(blob),0x004E4942)+bytes(blob)
open(OUT,'wb').write(out); print(len(out))
