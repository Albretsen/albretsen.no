#!/bin/sh
# Rebuild the architecture kit: Blender -> raw GLB -> gltf-transform -> manifest.
#   sh src/build.sh            (from archive/designs/_shared/3d/architecture)
#   sh src/build.sh church cafe (only some assets; manifest keeps the others)
set -e
here=$(cd "$(dirname "$0")/.." && pwd)
raw=$(mktemp -d)
blender -b --factory-startup --python "$here/src/build_kit.py" -- "$raw" "$@" 2>&1 | grep -E "EXPORTED|Error|Traceback" || true
for f in "$raw"/*.glb; do
  n=$(basename "$f")
  npx --yes @gltf-transform/cli optimize "$f" "$here/$n" --compress meshopt --palette false --simplify false \
    --instance false --flatten false --join false --texture-compress false >/dev/null
  node "$here/src/emissive_off.mjs" "$here/$n"
done
node "$here/src/manifest.mjs" "$raw/meta.json" "$here"
rm -rf "$raw"
