# Heure Bleue: architecture kit

A modular low-poly town for the Heure Bleue explorations: Paris zinc mansards meeting whitewashed
Mediterranean houses on a hillside above the bay, with civic landmarks, roads, walls, stairs and terrain.
Everything here was modelled procedurally in Blender (`src/`), so it is all own work (CC0 for
Albretsen AS) and can be rebuilt or tweaked in about 30 seconds. No Meshy credits and no third-party
models were used: per-window emissive materials and an exact palette are much easier to guarantee
from code than by decimating and re-materialling AI or downloaded meshes.

Open `preview.html` from a static server (for example `python3 -m http.server`) to see the contact sheet and
the generated town, with a night/day slider that switches the lights. URL parameters:
`?view=town|sheet&t=0..1&seed=N&only=name,name&cam=x,y,z,pitch,dist&yaw=rad&az=sunAzimuth`.

## Pieces (33 GLBs, 1.6 MB in total)

| Group | Files |
|---|---|
| Paris | `paris_haussmann` (5 bays, shops and striped awnings), `paris_narrow`, `paris_pink` (pink stucco, shops), `paris_powder`, `paris_rotunda` (corner tower with ribbed zinc dome and lantern) |
| Mediterranean | `med_cube_small` (roof pergola), `med_cube_stack` (stacked cubes, outdoor stair), `med_villa_tiled` (arched loggia, hip roof), `med_house_gable`, `med_house_gable_mustard`, `med_tower_house` (mirador tower) |
| Civic | `church` (bell tower with belfry, bell, clocks and tiled dome), `cafe` (terrace, parasols, string lights, CAFÉ sign), `hotel` (pink grand hotel, HOTEL rooftop sign), `fountain`, `belvedere` (viewing terrace with pergola and benches), `town_gate` (arch over the road, lettered ALBRETSEN) |
| Walls and stairs | `wall_retaining`, `wall_retaining_flowers`, `wall_low`, `stairs`, `stairs_wide` |
| Roads | `road_straight` (10 m), `road_curve` (90°, r = 14 m), `road_slope` (14 m, +3 m), `road_coast` (sea wall on +X), `road_coast_curve`, `road_t` |
| Terrain | `terrace_block` (10 × 14 m, 3 m retaining face), `terrain_slope`, `headland` (170 × 95 m), `hill_backdrop` (220 × 110 m), `rocks_coast` |

`manifest.json` lists every file with triangles, size, footprint, height, emissive materials, window count
and, for roads, the connection ports (`pos` and outward `dir`, in glTF space).

## Conventions

- glTF binary, +Y up, metres, origin at the base centre. **Buildings face +Z** (front door, shop
  fronts, signs). Roads run along Z. `road_curve` has its origin on the entry centreline and turns right
  to exit at (14, 0, −14) heading +X.
- Every building carries a 2.5 m plinth below y = 0, so it can sit on a slope without floating.
- Flat shaded: `loadKit` sets `flatShading`. Normals are also in the files.
- Compressed with meshopt + quantization. Call `loader.setMeshoptDecoder(MeshoptDecoder)` (the decoder is
  vendored at `vendor/addons/libs/meshopt_decoder.module.js`; three.js r170 is in `vendor/`).
- Palette: plaster `#f4eadb`, pink `#f2b5b8`, powder `#a9c6e0`, mustard `#d9a42b`, burgundy `#6e1f33`,
  zinc `#8d9bb4`, ink `#232c57`, magenta `#c8336e`, terracotta `#c96f4a`, cypress `#2f4a3a`, plus a few
  shades of the same (stone, zinc_dark, terracotta_dark, grass, rock...). Materials are named after their colour.

## Lights

Windows use `emissive_window_1`, `emissive_window_2` and `emissive_window_3`: each building's windows are
spread over three groups at random, so a building lights up in steps rather than all at once. Signs, string
lights and clock faces use `emissive_sign`, `emissive_lamp_string` and `emissive_clock`. All of them have a
dark base colour and a warm emissive colour (`#ffc979` and kin), and they ship switched off
(`KHR_materials_emissive_strength` = 0, so three.js loads them with `emissiveIntensity = 0`).
To light one, raise its `emissiveIntensity` (about 1 to 1.4).

## town.js

```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { loadKit, createTown, place, mergeStatic, KIT } from '../_shared/3d/architecture/town.js';

const kit = await loadKit({ THREE, GLTFLoader, MeshoptDecoder, base: '../_shared/3d/architecture/' });
const town = createTown({ THREE, kit, seed: 7 });
scene.add(town.group);

town.setNight(0.7);              // 0..1: buildings switch on one by one, each in three steps
town.buildings[0].setLights(1);  // or drive a single building (0..1)
```

`createTown` options: `seed`, `rows` (6), `halfWidth` (56 m), `coastRoad`, `headland`, `backdrop`,
`ground` and `merge` (all `true` by default).

The town climbs toward −Z in terraces 14 m deep and 3 m high. Whitewashed houses sit near the shore,
a shelf of Paris blocks (and the rotunda) sits in the middle rows, the church crowns the top with a fountain
on its plaza, and the hotel and café face the coast road. Stairs link every pair of terraces, a wide flight
climbs to the church, and the town gate spans the road where it enters town. A generated hillside mesh
wraps the terraces, with a hill behind and a headland across the bay.

It returns:

- `group`: add it to your scene. The sea is not included (put water at about y = −0.5).
- `buildings`: one handle per building `{ object, name, kind, row, threshold, level, materials, setLights(v) }`.
  `object.position` is the building's base; each building has its own copies of its emissive materials.
- `setNight(n)`: switches all buildings for a night amount n from 0 to 1. `order` lists the buildings in the order they light up.
- Layout data for people, cars and props: `lanes` (a walkable lane along the front of each terrace),
  `stairs` (bottom/top points of each flight), `gaps` (free spots between buildings for trees or benches),
  `road` (coast road centreline z, lane offsets, gate position), `plaza` (the church plaza), `belvedere`.
- `merged`: with `merge: true` all static geometry is merged into one mesh per material, so a full town
  is about 400k triangles in roughly 120 to 190 draw calls (shadows included) instead of 1,300. Use
  `merge: false` if you need to move or hide individual buildings.

`place(kit, name, { ownLights })` clones a single piece. `mergeStatic(THREE, root)` merges any group you
build yourself.

## Budgets

Most pieces are within the style guide's 6k-triangle building budget. The five largest (Haussmann block,
rotunda, powder block, café and hotel, 6.3k to 8.6k) go over because of their window surrounds and
wrought iron. Every file is under 150 KB.

## Rebuilding

```sh
sh src/build.sh                 # all assets: Blender 5.2 -> gltf-transform -> manifest.json
sh src/build.sh church cafe     # only some
```

`src/kit_core.py` holds the palette and the bmesh builder, `kit_parts.py` the windows, railings, roofs,
dormers and bougainvillea, `kit_buildings.py`, `kit_extra.py` and `kit_terrain.py` the pieces, and
`emissive_off.mjs` switches the lights off in the exported files.
