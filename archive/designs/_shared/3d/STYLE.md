# Heure Bleue 3D style guide

Every 3D asset for the Heure Bleue explorations (designs 91–95) follows this, so assets from different agents sit in one world.

## World
A hillside town above a bay at blue hour and sunset: zinc mansard roofs (Paris) meeting whitewashed cubes with terracotta and bougainvillea (Marbella / South of France), cypresses and palms, a coast road, a headland. Calm, precise, a little Wes Anderson. Not nautical: no boats, ships, harbours or anchors.

## Look
- **Low poly, crafted.** Clean silhouettes, bevelled where it reads, flat or soft-gradient shading. Quality bar: Monument Valley, Alto's Odyssey, Mini Motorways, Townscaper. Not blobby, not noisy photogrammetry.
- **Palette** (sRGB): plaster `#f4eadb`, pink `#f2b5b8`, powder `#a9c6e0`, mustard `#d9a42b`, burgundy `#6e1f33`, zinc `#8d9bb4`, ink `#232c57`, magenta `#c8336e` (bougainvillea), terracotta `#c96f4a`, cypress `#2f4a3a`. Use vertex colours or small palette textures (one shared 256 px palette atlas is ideal), no photo textures.
- **Lights that switch.** Every window, lamp head, headlight and sign that can glow uses a separate material whose name starts with `emissive_` (e.g. `emissive_window_warm`, `emissive_lamp`, `emissive_headlight`). Base colour dark, emissive `#ffc979`-ish, emissiveIntensity 0 by default, so a scene can turn them on at dusk one by one.

## Technical
- glTF binary (`.glb`), +Y up, 1 unit = 1 metre, origin at the base centre (characters: between the feet; vehicles: ground under the centre).
- Optimise with `npx @gltf-transform/cli` (weld, dedup, prune, quantize, meshopt). Keep each file small: props < 60 KB, buildings < 150 KB, characters < 400 KB, vehicles < 300 KB, unless there is a strong reason.
- Triangle budgets: prop < 2k, building < 6k, character < 5k, car < 8k (plus a simple interior for a driving view).
- Animations named in lowercase: `idle`, `walk`, `run`, `sit`, `wave`, `talk`, `jog`, `drink`, `phone`, `dance`... Skinned characters share one skeleton where possible so animations can be swapped.
- Name meshes and nodes meaningfully (`wheel_fl`, `door_l`, `steering_wheel`).

## Delivery (per category folder)
- The `.glb` files.
- `manifest.json`: `[{ "file", "name", "tris", "kb", "animations": [], "emissive": [], "source", "license", "notes" }]`.
- `preview.html`: a three.js (r170, vendored or pinned from jsdelivr) contact sheet that loads every asset on a blue-hour stage, with a time slider that turns the `emissive_` materials on, and animations playing. Screenshot it and look at it.
- `README.md`: what is here and how to use it.
- Only licences that allow commercial use without fee: CC0 (Kenney, Quaternius, Poly Haven), your own Blender work, or Meshy generations from this account.
