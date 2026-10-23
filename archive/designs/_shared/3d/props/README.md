# Heure Bleue: props

Street furniture, trees and the four product landmarks for the Heure Bleue explorations. All 29 models are built procedurally in Blender 5.2 (scripts in `src/`), coloured from one shared 256 px palette atlas (`palette.png`, the STYLE.md palette plus a few shades), and optimised with glTF-Transform (weld, prune, quantize, meshopt). The whole folder is under 1 MB.

Open `preview.html` from a static server rooted at the repo (`python3 -m http.server`) to see everything on a blue-hour stage. It has a time slider that switches the lights on one by one, and live-data screens on the landmarks. `?cam=<asset name>&t=0.1` opens a close-up at a given time.

## Assets

| group | files |
|---|---|
| Street lamps | `lamp_paris` (cast-iron candelabra, 4.3 m), `lamp_riviera` (swan-neck lamp with a mustard shade, 3.9 m, arm reaches +X) |
| Café | `cafe_table`, `cafe_chair`, `cafe_set` (table + 2 chairs), `parasol` (pink/plaster), `parasol_mustard`, `parasol_closed` |
| Street | `bench`, `kiosk` (Paris newspaper kiosk, lit serving window), `poster_column` (colonne Morris), `fountain` (tiered, water is its own node `water`) |
| Planters | `planter_pot` (terracotta + lemon tree), `planter_versailles` (box + clipped ball tree), `planter_box` (lavender trough) |
| Trees | `cypress` (7 m), `cypress_small` (4.6 m), `palm` (6.2 m), `palm_tall` (8 m), `olive` (3.3 m) |
| Bougainvillea | `bougainvillea_wall` (back at z = 0, grows toward +Z), `bougainvillea_spill` (origin on a wall-top edge, hangs down the +Z face), `bougainvillea_bush` |
| Lights | `string_lights` (two posts, 8 m span), `string_lights_span` (anchors at x = ±4, origin at anchor height; scale X to fit) |
| Landmarks | `lm_mcpemails`, `lm_funlibs`, `lm_toolrails`, `lm_harbor` |

The tris, size, emissive materials and notes for each file are in `manifest.json`. Props are 200 to 1,400 triangles and 10 to 45 KB. Landmarks are 2,000 to 3,700 triangles and 50 to 73 KB.

### Product landmarks

Each one uses the real product logo from `archive/designs/_shared/products/`, rendered onto its sign without changes:

- **MCP Emails, post office.** A Paris mansard with dormers and chimneys, a French-yellow post box, wall lanterns, and a fascia sign with the mcpemails wordmark. The screen is by the door.
- **Fun Libs, games arcade.** A pink Art Deco storefront with a striped awning, arcade-cabinet silhouettes behind the glass, a cabinet on the pavement, and a rooftop marquee carrying the yellow Fun Libs icon ringed with bulbs. The screen is above the awning.
- **Toolrails, workshop.** A saw-tooth zinc roof with street-facing glazing, a sliding barn door, a lit interior with bench and lamp silhouettes, rails running out of the door with a tool trolley, and a fascia sign plus a double-sided blade sign with the Toolrails icon.
- **Harbor, library and archive.** A neoclassical portico with the Harbor wordmark on the frieze, and a zinc reading-room dome with a ring of lit oculi. Nothing nautical. The screen is under the portico.

Node names inside every landmark: `building`, `windows_ground`, `windows_upper`, `sign`, `screen`, and where present `lamps` or `lights`. The root node carries the extras `{ product, screenAspect }`.

## Conventions

- glTF, +Y up, metres, origin at the base centre. Fronts face **+Z**.
- Materials: `palette` (atlas) and `screen`. Every light is a separate `emissive_*` material: `emissive_lamp`, `emissive_string`, `emissive_window_warm`, `emissive_window_ground`, `emissive_window_upper`, `emissive_skylight`, `emissive_marquee`, `emissive_arcade`, `emissive_sign_<product>`. The emissive colour or texture is exported **at full strength** (glTF can't store intensity 0 without losing the colour), and `material.userData.emissiveOn = 1` comes from the extras. **Set `emissiveIntensity = 0` after loading**, then raise it at dusk. Window materials carry a small warm-interior `emissiveMap` (bright ceiling, amber floor, curtains at the sides). Sign materials use the logo as both `map` and `emissiveMap`. Around 0.8 looks right for signs and 1.2 for windows and lamps under ACES tone mapping.
- Single-sided materials throughout. Parasols and palm fronds have real undersides.

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);   // required: files are meshopt-compressed

const { scene: postOffice } = await loader.loadAsync('props/lm_mcpemails.glb');
postOffice.traverse(o => {
  if (o.material?.name?.startsWith('emissive_')) o.material.emissiveIntensity = 0;
});

// live data on the landmark's screen
const canvas = Object.assign(document.createElement('canvas'), { width: 512, height: 288 });
const tex = new THREE.CanvasTexture(canvas);
tex.flipY = false;                        // glTF UV convention, otherwise the canvas is upside down
tex.colorSpace = THREE.SRGBColorSpace;
const screen = postOffice.getObjectByName('screen');
screen.material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
// draw MRR / installs into canvas, then tex.needsUpdate = true
```

Each screen is 16:9 (512 × 288 works). The `screen` material ships a dark placeholder texture, so UVs are kept.

## Sources and licence

- Geometry, the palette atlas and the window-glow texture are original procedural work made for Albretsen AS (`src/lib.py`, `src/props.py`, `src/landmarks.py`, run with `blender -b --python src/props.py -- <out-dir> [asset names]`). The scripts expect the rendered sign JPEGs in a `signs/` folder next to them.
- Sign artwork: `src/signs/*.html` lays out the real product logos (from `_shared/products/`, unchanged). Each layout was rendered with headless Chrome to a 512 × 128 fascia JPEG or a 256 × 256 badge JPEG and embedded in the landmark. The logos are the products' own marks.
- No third-party models, no CC0 downloads, and no Meshy credits were used: 0 of the 40-credit share.
