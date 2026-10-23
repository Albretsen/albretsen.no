#!/usr/bin/env python3
# Optimise every glb in out/ into the people folder (meshopt + quantize, no simplify).
import subprocess, os, sys, glob
T = "/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.WMbRtIP0Fk/"
DEST = "/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_628d1e37-b61-1/archive/designs/_shared/3d/people/"
only = sys.argv[1:]
for f in sorted(glob.glob(T + "out/*.glb")):
    n = os.path.basename(f)
    if only and n[:-4] not in only:
        continue
    args = ["npx", "-y", "@gltf-transform/cli", "optimize", f, DEST + n, "--compress", "meshopt",
            "--simplify", "false", "--texture-compress", "false", "--instance", "false", "--join", "false", "--flatten", "false"]
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode:
        print(n, "FAILED", r.stderr[-800:])
    else:
        print(n, os.path.getsize(f) // 1024, "KB ->", os.path.getsize(DEST + n) // 1024, "KB")
