# Pocket Planet: asset kit 60

Open `preview.html` first. It is the contact sheet: palette, type, every asset, both interactive pieces and all motion signatures, live.
(Serve the repo root over HTTP. `preview.html` imports `../../_shared/content.js` and the real product logos.)

## Vision

Albretsen AS as **a pocket-sized voxel planet that never stops working**, drawn in true isometric. Every block is axis-aligned, every glowing tower is something shipped, and arcs of activity hop between them. A giant 3D mouse cursor keeps prying blocks loose. It is a **mischievous genius**: careful, exact construction with one deliberate thing out of place.

- **Tension:** one voxel is always out of line. It lifts out of its slot in the mark, gets pried loose on the planet, and jumps the track in the orbit divider.
- **Grain:** a CC0 terrazzo (ambientCG) is mapped onto every block, and every still gets film grain in post. Surfaces should feel made rather than rendered.
- **Velocity:** things get flung instead of faded in. Spring overshoot, orbit trails, a View Transition that swallows the page into the pointer.

It is a technology brand: no finance or consultancy cues, and no gears, ships, trains or charts. MCP Emails is one tower on the planet. It is not the planet.

**Hero idea for the builder:** a large tilt/parallax stage (planet cutout, voxel debris and 3D cursor on separate depths, see `preview.html` top). `hero-planet` works as the static or no-JS fallback. The Gravity Well (`interactive/orbit-physics.js`) can serve as the hero itself or as a "products" section where the real product icons orbit the planet and visitors can fling them.

## References (researched for this kit)

| What | URL | Taken from it |
|---|---|---|
| ambientCG (asset source) | https://ambientcg.com | Terrazzo005 surface grain, CC0 |
| Poly Haven HDRIs (asset source) | https://polyhaven.com/a/brown_photostudio_02 | studio light for reflections on the plinths and cursor |
| Active Theory | https://activetheory.net | a single, playable 3D world as the hero, not a picture of one |
| Chrome docs: same-document View Transitions | https://developer.chrome.com/docs/web-platform/view-transitions/same-document | circular reveal from `transition.ready`, `::view-transition-old/new`, types, named morphs |
| matter.js | https://brm.io/matter-js/ | engine for Gravity Well; the attractor is written by hand on top (no plugin) |
| three.js RoundedBoxGeometry / UnrealBloom examples | https://threejs.org/examples/ | rounded voxels; bloom tried and then replaced with bloom done in post (see notes) |
| Behance interaction gallery, are.na explore | https://www.behance.net/galleries/interaction · https://www.are.na/explore | listed in the brief; both were login-walled or blocked to the fetcher, so neither was used as a reference |

Research note: this run's shared web-search budget ran out before my own searches could go through. The direction was built from the pages fetched directly (above) and from source data on ambientCG and Poly Haven (their public APIs).

## Palette (seed hue 252°, OKLCH)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| Void | oklch(0.13 0.012 252) | #05080c | page ground |
| Ink | oklch(0.16 0.018 252) | #080e15 | cards |
| Deep | oklch(0.20 0.025 252) | #0e1721 | raised panels |
| Rim | oklch(0.27 0.03 252) | #1c2735 | hairlines, dark block sides |
| Slate | oklch(0.40 0.03 252) | #3c4958 | block sides, muted UI |
| Fog | oklch(0.62 0.03 252) | #798898 | secondary text |
| Mist | oklch(0.86 0.015 252) | #cad2db | body text |
| Paper | oklch(0.96 0.008 252) | #eef2f7 | headings, block tops, the cursor |
| **Volt** | oklch(0.65 0.192 252) | #0790ff | the one electric accent |
| Volt hi | oklch(0.78 0.115 252) | #80bcff | accent on dark, packets, highlights |
| Volt lo | oklch(0.47 0.14 252) | #0559a8 | accent shadow side (iso right face) |

Isometric shading rule: **top = lightest, left (+z) = mid, right (+x) = darkest.** This holds for every SVG and every render. Product logos keep their own colours (Fun Libs yellow, Toolrails yellow on black, MCP Emails blue and green, Harbor cream on charcoal).
The tokens are defined in `motion.css` as `--pp-*`.

## Type

| Role | Face | File |
|---|---|---|
| Display | Unbounded 700 / 500 (wide geometric, cheeky) | `fonts/unbounded-700.woff2`, `fonts/unbounded-500.woff2` |
| Body | Geist 400 / 600 | `fonts/geist-400.woff2`, `fonts/geist-600.woff2` |
| Facts, labels, command | Geist Mono 500 | `fonts/geist-mono-500.woff2` |

Load the fonts with `fonts/fonts.css`. All of them are SIL OFL 1.1 (latin subsets via Fontsource, jsDelivr). Display sizes are tight (−0.03 to −0.05em). Mono labels are uppercase with +0.08em tracking. The logos and stickers are outlined to paths, so they need no fonts.

## Motion (motion.css + motion.js)

| Name | Kind | What it does | API |
|---|---|---|---|
| SLINGSHOT | entrance | Elements are flung in on a curved path with a `linear()` spring that overshoots once and settles. Staggered by `--i`. | `.pp-sling` + `observeSling()` |
| ISO LIFT | hover | The card rises along the iso axis while a stepped extrusion in Volt lo grows beneath it. Animates a registered `@property --lift`. | `.pp-lift` |
| WORMHOLE | transition | View Transitions API. The old view shrinks into the pointer with a quarter twist and the new one opens as a circle from the same point. Falls back to an instant swap. | `wormhole(event, update)` |
| POP-OUT | micro | The mark's loose voxel squashes, springs out of its slot and lands, with speed lines. | inline mark in `.pp-pop`, `popMark(el)` |
| GRAIN DRIFT | ambient | Stepped film grain overlay. | `.pp-grain` |
| TILT + PARALLAX | signature delight | Tilt from the pointer, or the gyroscope on phones (asks iOS permission on first tap). `[data-depth]` children shift by depth. | `tilt(el)` + `.pp-tilt` |

Everything collapses to static under `prefers-reduced-motion`.

## Interactive / 3D

- `interactive/planet3d.js`: self-contained three.js 0.170 module (needs the import map shown in its header). `mountPlanet(canvas, { scene, interactive })`. Scenes: `hero` (planet + orbit ring + cursor prying blocks loose), `surface` (horizon close-up), `planet`, `product:mcp-emails|fun-libs|toolrails|harbor`, `cursor`, `debris`. Pointer/gyro tilt is built in. Activity packets travel along the arcs. The planet is procedural (seeded value-noise terrain on a voxel cube-sphere), so `seed` gives a new world. Bloom is opt-in (`bloom: true`) because many small bright points make UnrealBloom haze the black. The stills get their glow in post instead.
- `interactive/orbit-physics.js`: **Gravity Well**. matter.js 0.20.0 (vendored, MIT) with an inverse-square attractor I wrote. The four real product icons and a swarm of voxels orbit the planet cutout, with velocity trails. Drag and fling a product; tap empty space to add a block of activity. The stage tilts with the pointer or the phone. `mountOrbit(canvas, { tiltTarget })` returns `{ play, pause, shake, dispose }`.
- `interactive/demo.html`: both side by side (`?scene=surface`, `?scene=product:fun-libs`, `&bloom`).

## Inventory

| File | What it is | Intended use on the site | Source | Licence |
|---|---|---|---|---|
| brand/logo-mark.svg | 3×3×3 voxel cube with its near-corner block launched out of its slot, plus volt speed lines. Groups `.pp-pop-cube` / `.pp-pop-lines` for animation | nav mark, loaders, footer | generated: `src/identity.py` (iso projection, hidden-face culling) | original, client-owned |
| brand/logo-mark-light.svg | same mark, dark tones | light grounds, print | `src/identity.py` | original |
| brand/wordmark.svg / wordmark-light.svg | "albretsen" in Unbounded 700 outlines, with a volt iso voxel as the full stop | headers, footer | `src/identity.py` + Unbounded (OFL) | original; font OFL |
| brand/lockup.svg | mark + wordmark + "AS" in volt | site header, documents | `src/identity.py` | original |
| brand/favicon.svg | simplified mark on a Void rounded square | favicon | `src/identity.py` | original |
| brand/apple-touch-icon.png | 180×180 PNG of the favicon | iOS home screen | rsvg-convert | original |
| brand/og.jpg | 1200×630 Open Graph card: lockup, line, planet | social previews | composed in `src/og.html`, headless Chrome | original |
| hero/hero-planet-{1600,3200}.{webp,avif} | 16:9 render: voxel planet sitting right, orbit ring, activity arcs, 3D cursor prying blocks loose | main hero still / no-JS fallback / OG source | three.js render (`src/bake.html`), post in `src/post.py` (bloom, accent halo, vignette, grain) | original |
| hero/hero-surface-{1600,3200}.{webp,avif} | horizon close-up of the planet: towers, arcs, signal pixels (seed 12) | section backdrop, about/blog headers, behind the tilt stage | three.js render + post | original |
| hero/planet-cutout-{1000,2000}.webp | planet alone on alpha | parallax layer, Gravity Well planet, loaders | three.js render (transparent) + post | original |
| products/product-mcp-emails-{800,1600}.webp | real MCP Emails icon on a thick tile on an iso plinth; envelopes stream into an inbox tray | product card / page | three.js render; logo = `_shared/products/mcp-emails/icon.png` unaltered | render original; logo is the product's own |
| products/product-fun-libs-{800,1600}.webp | real Fun Libs v5 icon; word tiles with glowing blanks and a stack of letter blocks | product card | three.js; logo `_shared/products/fun-libs/icon.png` | same |
| products/product-toolrails-{800,1600}.webp | real Toolrails icon; seven tool blocks converge through one glowing port | product card | three.js; logo `_shared/products/toolrails/icon.svg` rasterised unaltered (`src/tex/toolrails.png`) | same |
| products/product-harbor-{800,1600}.webp | real Harbor mark (cream on its #1b1b1b, as on Harbor's banner); a shelf of knowledge blocks with one AI edit hovering, held for approval | product card | three.js; mark `_shared/products/harbor/harbor-mark.svg` with currentColor set to its banner cream | same |
| products/retired/retired-*.svg ×6 | powered-down iso dioramas (ghost tones, one dim volt detail): Polyglot Pilot (two speech bubbles), PinPoint (pin by a photo, wrong-guess mark), WebVakt (monitor with a changed line), Joke Central (grinning block), Tryggere Hyring (document with a check), early apps (calculator) | "graveyard" / history strip | generated: `src/retired.py` + `src/isosvg.py` | original |
| (Luma) | Luma has a real logo, `_shared/products/luma/logo.png`. Show it on its own cream (#F4EFE6) at reduced opacity, as `preview.html` does | history strip | real asset | product's own |
| extras/cursor-3d-{700,1400}.webp | the extruded 3D pointer (paper body, volt rim) on alpha | the brand's mascot: hovering near CTAs, 404 page, loading | three.js `scene=cursor` | original |
| extras/voxel-debris-{900,1800}.webp | a burst of loose rounded voxels on alpha | section edges, parallax foreground | three.js `scene=debris` | original |
| extras/sticker-since-2016.svg | die-cut iso cube sticker: 2016 / shipping since / Google Play | about section, scattered | `src/extras.py` | original |
| extras/sticker-113k.svg | round badge: 113,000+ installs, Fun Libs · no marketing | Fun Libs section | `src/extras.py` | original |
| extras/sticker-norway.svg | pill: made in Norway, with a volt voxel | footer | `src/extras.py` | original |
| extras/sticker-mcp-command.svg | terminal tab with `claude mcp add albretsen https://albretsen.no/mcp` | MCP section, footer | `src/extras.py` | original |
| extras/grain-256.png | tileable alpha grain | `.pp-grain` overlay anywhere | numpy noise | original |
| extras/terrazzo-ink-512.webp | Terrazzo005 regraded into Deep→Slate with rare volt specks | card / footer texture | from https://ambientcg.com/view?id=Terrazzo005 (1K-JPG), `src/extras.py` | **CC0** (ambientCG) |
| extras/iso-grid.svg | tileable 60° isometric lattice | section backgrounds (mask it) | `src/extras.py` | original |
| extras/orbit-divider.svg | wide ellipse of hex blocks, one jumping the track | section divider | `src/extras.py` | original |
| interactive/planet3d.js | three.js module, all scenes above, live | hero, product pages | written for this kit | original |
| interactive/orbit-physics.js | Gravity Well physics toy | hero or products section | written for this kit | original |
| interactive/vendor/matter-0.20.0.min.js | matter.js 0.20.0 | used by orbit-physics.js | https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js | MIT |
| interactive/env-studio.jpg | 512×256 tonemapped equirect of the Poly Haven studio HDRI | environment reflections in planet3d.js | from https://polyhaven.com/a/brown_photostudio_02 (1k .hdr), decoded and tonemapped in Python | **CC0** (Poly Haven) |
| interactive/demo.html | tiny demo of both modules | dev | | |
| fonts/*.woff2 + fonts.css | Unbounded 500/700, Geist 400/600, Geist Mono 500 | site type | Fontsource via jsDelivr (cdn.jsdelivr.net/fontsource/fonts/…) | SIL OFL 1.1 |
| motion.css / motion.js | motion study + tokens | site-wide | written for this kit | original |
| src/* | the pipeline: `bake.html`/`bake.sh` (headless render), `post.py`, `export.py`, `export-all.sh`, `identity.py`, `retired.py`, `isosvg.py`, `extras.py`, `og.html`, `phone.html`/`dom.sh` (dev checks), `tex/` (texture inputs: rasterised real logos, terrazzo greyscale) | regenerate or extend anything | | original; textures CC0 |

### Rebuilding

1. Start a static server at the repo root on :6060.
2. `src/bake.sh "scene=hero&sx=0.3" out.png 3200 1800` (also `surface&seed=12`, `planet&transparent=1`, `cursor&transparent=1`, `debris&transparent=1`; `src/bake-products.sh <dir> 1600`).
3. `src/export-all.sh <dir> <python-with-pillow-numpy>`.

Total kit size is about 3.5 MB.
