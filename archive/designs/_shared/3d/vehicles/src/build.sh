#!/bin/sh
# Rebuild vehicles: src/build.sh [name ...]   (names: hero_car city_car van scooter bicycle)
# Each src/<name>.py is a Blender script; output is optimised into the category folder.
set -e
here=$(cd "$(dirname "$0")" && pwd); out=$(dirname "$here"); tmp=$(mktemp -d)
cd "$out"
names=${*:-"hero_car city_car van scooter bicycle"}
for n in $names; do
  if [ "$n" = hero_car ]; then
    blender -b --python "$here/hero_car.py" -- "$tmp/hero_car.glb" >"$tmp/$n.log" 2>&1 || { tail -30 "$tmp/$n.log"; exit 1; }
    blender -b --python "$here/hero_car.py" -- "$tmp/hero_car_mustard.glb" '#d9a42b' >>"$tmp/$n.log" 2>&1
    files="hero_car hero_car_mustard"
  else
    blender -b --python "$here/$n.py" -- "$tmp/$n.glb" >"$tmp/$n.log" 2>&1 || { tail -30 "$tmp/$n.log"; exit 1; }
    files="$n"
  fi
  grep -E "EXPORTED|Error|Traceback" "$tmp/$n.log" || true
  for f in $files; do
    npx --no-install @gltf-transform/cli optimize "$tmp/$f.glb" "$out/$f.glb" --compress meshopt \
      --simplify false --flatten false --join false --instance false --texture-compress false --prune false </dev/null >/dev/null
    echo "$f: $(wc -c < "$out/$f.glb" | tr -d ' ') bytes"
  done
done
rm -rf "$tmp"
