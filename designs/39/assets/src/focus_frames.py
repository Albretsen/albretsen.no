import subprocess, os, sys
T='/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.N0qADh4ELv/'
os.makedirs(T+'frames', exist_ok=True)
N=40
env=dict(os.environ, PSEED='7', SS='2')
for i in range(N):
    t=i/(N-1)
    env['TAG']=f'_{i:03d}'
    subprocess.run([T+'venv/bin/python','-I',T+'bin/hero.py',f'focus:{t:.4f}','1200',T+'frames'],env=env,check=True)
print('all frames done')
