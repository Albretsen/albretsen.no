#!/bin/sh
# Encode AVIF stills from the graded PNG masters (SVT-AV1, 10-bit off, still-picture)
H=/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-15/designs/75/assets/hero
WORK=/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.Y4HxYEr7RS/work
for n in fjord-960 fjord-1600 fjord-2400 orbit-960 orbit-1600 orbit-2400 fjord-portrait-640 fjord-portrait-1080 lake-960 lake-1600; do
  ffmpeg -hide_banner -loglevel error -y -i "$WORK/$n.png" -vf "crop=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p" \
    -c:v libsvtav1 -crf 34 -preset 4 -svtav1-params tune=0 -frames:v 1 -f avif "$H/$n.avif" && echo "$n.avif"
done
