# Heure Bleue: people

Eleven low-poly townspeople, a terrier, a Paris city bicycle and a set of hand props. All the humans share **one 23-bone skeleton** (`townsfolk_rig`), so every clip plays on every character. `preview.html` is the contact sheet. Its time slider turns on the `emissive_` lights, and "their routine at this hour" shows the day schedule.

| file | what |
|---|---|
| `asgeir.glb` | Asgeir himself, founder of Albretsen AS: ink overshirt open over a white tee, sleeves pushed up, sand chinos, white sneakers, a thin dark watch on the left wrist, tousled dark-blond hair. Has his own day in `ROUTINES` (coffee, a table in the morning, baguette at noon, the rail at sunset, a wave). |
| `player.glb` | The visitor you walk around as: mustard jacket, ink trousers, white trainers, backpack. Bright enough to find at night. |
| `jogger.glb` | Pink tank top, leggings, ponytail, headband. |
| `waiter.glb` | White shirt, black waistcoat, bow tie, long white apron. Use with the `tray` prop and `walk_carry`. |
| `older_woman.glb`, `older_man.glb` | The older couple. She has a powder coat, burgundy beret and pearls. He has a zinc jacket, flat cap, glasses and a `cane`. |
| `dog_walker.glb` + `dog.glb` | Cypress jacket, mustard scarf, crossbody bag. The terrier has its own rig and clips. Link them with `town.leash(person, dog)`. |
| `cyclist.glb` + `bicycle.glb` | Rider in a cap with rolled sleeves. Use `cyclist.mount(bike)` and the `cycle` clip. The bike has a basket with a baguette and flowers, plus head and tail lights. |
| `child.glb` | Breton stripes and red shorts. The rig is scaled 0.62 inside the file. |
| `stroller_dress.glb`, `stroller_linen.glb` | Evening strollers: a magenta sundress with a sun hat, and a linen suit with sunglasses. |
| `townsfolk-anims.glb` | The shared skeleton plus all 33 human clips. There is no mesh in it. |
| `props.glb` | `phone`, `coffee_cup`, `wine_glass`, `tray`, `cane`, `lantern`, `baguette`, `newspaper`, `watering_can`. |
| `people.js` | The loader, crossfades, props, leash, bike mounting and daily routines. |

The characters run 1.8–2.2k triangles at ~22–26 KB each. The whole folder is about 1 MB.

## Clips (townsfolk-anims.glb)
`idle`, `idle_arms_folded`, `walk`, `walk_formal`, `walk_carry`, `jog`, `run`, `sit`, `sit_talk`, `sit_down`, `stand_up`, `talk`, `wave`, `drink`, `phone`, `dance`, `lean_rail`, `rail_call`, `lantern`, `water_plants`, `yes`, `no`, `drive`, `cycle`, `interact`, `pick_up`, `push`, `jump_start`, `jump_loop`, `jump_land`, `roll`, `crouch_idle`, `crouch_walk`.

Every clip is in place (no root motion), so move the actor yourself at `SPEED[clip]` m/s:

| clip | m/s |
|---|---|
| walk | 1.2 |
| walk_formal | 1.0 |
| walk_carry | 0.75 |
| jog | 3.2 |
| run | 4.6 |
| cycle | 3.32 (the same as the bike's `ride`) |

These were measured from foot travel, so tune them by eye. The dog has `idle`, `walk`, `run`, `sit` and `sniff`. The bicycle has `ride`: one crank turn and two wheel turns in 1.25 s.

Geometry contracts:
- **sit:** put a chair seat about 0.44 m high, centred 0.33 m behind the actor's origin (`SEAT`).
- **drive:** put the actor origin 0.44 m below the seat surface and 0.31 m ahead of the hip point. Hands rest 0.35 m ahead of and 0.38 m above the pelvis, 0.37 m apart (`DRIVE`).
- **cycle:** the bicycle and rider share one origin.

## Usage
```html
<script type="importmap">{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/" } }</script>
<script type="module">
import { Townsfolk, routine, applyRoutine, SPEED } from '../_shared/3d/people/people.js';
const town = new Townsfolk();                      // loads from people.js's own folder
const waiter = await town.spawn('waiter');
scene.add(waiter.object);
waiter.play('walk_carry');  await waiter.attach('tray');
const p = await town.spawn('player');  p.play('walk', 0.3);  p.once('wave', 'idle');
const dog = await town.spawn('dog', { clip: 'walk' });  scene.add(town.leash(walker, dog));
const bike = await town.spawn('bicycle');  cyclist.mount(bike);
await applyRoutine(oldMan, 19.5);                   // time-of-day behaviour: clip + prop swap
actor.setLights(1);                                // emissive_ props on (phone, lantern, bike lights)
// each frame: town.update(dt)
</script>
```
- `spawn` clones with `SkeletonUtils`, so spawn as many of each as you like. Files are cached and loaded once.
- `ROUTINES` and `routine(name, hour)` describe the day for each character: morning jog, the waiter's service, coffee at noon, watering plants, the sunset rail, wine, then dancing and lanterns at night. Entries with `moving: true` should travel along a path.
- Bone-mounted props (phone, cup, glass, baguette, newspaper) follow the hand. Upright props (tray, cane, lantern, watering can) follow the hand's position but stay level. The tray sits between both hands.
- Colours are vertex colours (`COLOR_0`, one `townsfolk` material). Per glTF they are linear. If you replace the material with an sRGB-space shader (like design 64's), convert them with `pow(c, 1/2.2)`. A soft vertical gradient is baked in (feet about 20% darker).
- Files are meshopt-compressed: `GLTFLoader.setMeshoptDecoder` (`people.js` already does this).

## How they were made
- **Skeleton and clips:** Quaternius **Universal Animation Library** 1 and 2, the Standard (free) tier, CC0 (https://quaternius.itch.io/universal-animation-library, https://quaternius.itch.io/universal-animation-library-2). The 65-bone UE-style rig was trimmed to 23 bones (no fingers; mitten hands), and the location and scale channels were dropped except on the root and pelvis. `wave` and `cycle` were authored in Blender on top of `idle`, with analytic two-bone IK for the pedalling.
- **Characters, dog, bicycle and props:** our own Blender work, built procedurally by `src/*.py` (lofted rings and ellipsoids, palette vertex colours, distance-based skin weights). Kenney Mini Characters (CC0) was considered and rejected: chibi proportions.
- **Meshy:** two Smart Topology tests of a trench-coat flâneur, 10 credits in all. The sculpt was nice, but neither came out in T-pose, and the realistic face and proportions clashed with the faceless, stylised family, so none was used.
- **Rebuilding:** `src/` holds the scripts as they ran. They expect the UAL `.glb` files in a scratch `src/` folder (the paths at the top of `lib.py`). Run them with `blender -b --python src/build_anims.py`, then `build_chars.py` (`-- asgeir` builds just him), `build_props.py`, `build_dog.py` and `build_bike.py`. After that run `optimize.py` (gltf-transform: meshopt, quantize, no simplify) and `manifest.py`.
