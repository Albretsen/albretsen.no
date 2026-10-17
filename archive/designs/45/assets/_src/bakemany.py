#!/usr/bin/env python3
"""Bake several scenes in parallel and optionally make a contact grid.
usage: bakemany.py <outdir> scene:w:h[:name] ... [--grid grid.png]"""
import subprocess, sys, os
here = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[1:]; out = args.pop(0); grid = None
if '--grid' in args:
    i = args.index('--grid'); grid = args[i + 1]; del args[i:i + 2]
procs, files = [], []
for a in args:
    parts = a.split(':'); sc, w, h = parts[:3]; name = parts[3] if len(parts) > 3 else sc
    f = os.path.join(out, name + '.png'); files.append(f)
    procs.append(subprocess.Popen([sys.executable, os.path.join(here, 'bake.py'), sc, w, h, f]))
for p in procs: p.wait()
if grid:
    n = len(files); inputs = sum([['-i', f] for f in files], [])
    filt = ''.join(f'[{i}]scale=800:-1[v{i}];' for i in range(n))
    cols = 2 if n > 1 else 1; rows = []
    for r in range(0, n, cols):
        idx = list(range(r, min(r + cols, n)))
        if len(idx) == 1: rows.append(f'[v{idx[0]}]')
        else:
            filt += ''.join(f'[v{i}]' for i in idx) + f'hstack={len(idx)}[r{r}];'; rows.append(f'[r{r}]')
    if len(rows) == 1: filt += rows[0] + 'null'
    else: filt += ''.join(rows) + f'vstack={len(rows)}'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', *inputs, '-filter_complex', filt, grid])
    print('grid', grid)
