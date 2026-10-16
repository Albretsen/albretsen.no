#!/bin/sh
# Quick look at one scene. Usage: bake/try.sh <scene> <out.png> [w] [h] [scale] [extra-query]
here=$(cd "$(dirname "$0")" && pwd)
"$here/render.sh" "http://127.0.0.1:6043/designs/43/bake/scene.html?s=$1&$6" "$2" "${3:-1200}" "${4:-800}" "${5:-1}" 12000
