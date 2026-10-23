#!/usr/bin/env python3
# Write manifest.json for the people category from the optimised glbs.
import json, struct, os, glob
T = "/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.WMbRtIP0Fk/"
DEST = "/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_628d1e37-b61-1/archive/designs/_shared/3d/people/"

UAL = "Clips retargeted from Quaternius Universal Animation Library 1+2 (CC0, https://quaternius.com/packs/universalanimationlibrary.html); wave and cycle authored in Blender."
OWN = "Own Blender work (procedural build scripts in src/)"

def gltf_json(path):
    with open(path, "rb") as f:
        data = f.read()
    ln = struct.unpack_from("<I", data, 12)[0]
    return json.loads(data[20:20 + ln])

def tris(j):
    n = 0
    acc = j["accessors"]
    for m in j.get("meshes", []):
        for p in m["primitives"]:
            if "indices" in p:
                n += acc[p["indices"]]["count"] // 3
            else:
                n += acc[p["attributes"]["POSITION"]]["count"] // 3
    return n

NOTES = {
    "townsfolk-anims.glb": ("Shared 23-bone townsfolk_rig with every human clip. Load once; clips bind by bone name to any character.", UAL, "CC0 (Quaternius) + own work"),
    "props.glb": ("Hand props, one node each; mount with Actor.attach(name). Phone screen and lantern glass are emissive_.", OWN, "Own work"),
    "dog.glb": ("Jack Russell terrier on its own 16-bone rig (bones: neck = collar). Pairs with dog_walker and Townsfolk.leash().", OWN, "Own work"),
    "bicycle.glb": ("Paris step-through bike with basket. Clip 'ride' = 1 crank turn, 2 wheel turns, 1.25 s, rolls 4.15 m (3.3 m/s). Seat a rider with Actor.mount(bike).", OWN, "Own work"),
}

out = []
for f in sorted(glob.glob(DEST + "*.glb")):
    n = os.path.basename(f)
    j = gltf_json(f)
    anims = [a.get("name", "") for a in j.get("animations", [])]
    em = sorted({m["name"] for m in j.get("materials", []) if m.get("name", "").startswith("emissive_")})
    meta = {}
    mj = T + "out/" + n[:-4] + ".json"
    if os.path.exists(mj):
        meta = json.load(open(mj))
    note, src, lic = NOTES.get(n, (meta.get("desc", ""), OWN + "; skinned to the shared townsfolk_rig (skeleton from Quaternius UAL, CC0)", "Own work (rig: CC0)"))
    if n not in NOTES and not n.startswith("townsfolk"):
        anims = ["(uses townsfolk-anims.glb)"]
    out.append({"file": n, "name": n[:-4], "tris": tris(j), "kb": round(os.path.getsize(f) / 1024, 1),
                "animations": anims, "emissive": em, "source": src, "license": lic, "notes": note})
json.dump(out, open(DEST + "manifest.json", "w"), indent=2)
tot = sum(os.path.getsize(p) for p in glob.glob(DEST + "**/*", recursive=True) if os.path.isfile(p))
print(len(out), "assets; folder total", round(tot / 1024), "KB")
for o in out:
    print(f'{o["file"]:26s} {o["tris"]:6d} tris {o["kb"]:7.1f} KB  {len(o["animations"])} anims {o["emissive"]}')
