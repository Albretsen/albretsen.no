#!/bin/sh
# Bake every raster still from the live renderer into the temp dir (PNG masters).
S=/Users/asgeiralbretsen/Repositories/albretsen.no/.claude/worktrees/wf_e7563761-8d1-14/scripts/shot.sh
T=/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.AbSG7KnRWC/shotT.sh
O=/var/folders/vm/h3wjg79x423bkvtffjgnf0_00000gn/T/tmp.AbSG7KnRWC/master
B="http://127.0.0.1:6074/designs/74/assets/src/bake.html"
mkdir -p $O
what=${1:-all}
if [ "$what" = all ] || [ "$what" = hero ]; then
$S "$B?sky=../hero/sky-afterglow.jpg&alt=-1.5&w=2560&h=1440" $O/hero-afterglow.png 2560 1440 8000
$S "$B?sky=../hero/sky-day.jpg&alt=45&w=2560&h=1440&sunx=330&suny=170" $O/hero-noon.png 2560 1440 8000
$S "$B?sky=../hero/sky-afterglow.jpg&alt=-1.5&w=1080&h=1920&fx=0.3" $O/hero-afterglow-portrait.png 1080 1920 8000
$S "$B?sky=../hero/sky-day.jpg&alt=45&w=1080&h=1920&fx=0.3&sunx=330&suny=170" $O/hero-noon-portrait.png 1080 1920 8000
fi
if [ "$what" = all ] || [ "$what" = layers ]; then
$T "$B?alt=-1.5&w=1920&h=1080&layers=far" $O/layer-1-far.png 1920 1080 8000
$T "$B?alt=-1.5&w=1920&h=1080&layers=sea,head" $O/layer-2-headland.png 1920 1080 8000
$T "$B?alt=-1.5&w=1920&h=1080&layers=blvd" $O/layer-3-boulevard.png 1920 1080 8000
$T "$B?alt=-1.5&w=1920&h=1080&layers=near" $O/layer-4-near.png 1920 1080 8000
fi
if [ "$what" = all ] || [ "$what" = vign ]; then
for v in mcp-emails fun-libs toolrails harbor; do $S "$B?scene=$v&w=1200&h=1500" $O/product-$v.png 1200 1500 8000; done
fi
if [ "$what" = all ] || [ "$what" = cut ]; then
for v in cut-fan-palm cut-date-palm cut-cypress cut-spruce cut-agave cut-lamp cut-pavilion; do $T "$B?scene=$v&w=800&h=1000" $O/$v.png 800 1000 8000; done
fi
