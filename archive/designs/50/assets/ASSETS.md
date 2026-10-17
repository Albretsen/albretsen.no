# IR//PEEL: asset kit 50

**Albretsen AS / albretsen.no.** Pixel sprites printed on real glossy vinyl, read in infrared.

Open `preview.html` first, through a static server (it uses ES modules). It is the contact sheet: a live peelable sticker sheet, the scroll-scrubbed peel sequence, the palette, type, every image, the voxel viewer, the Lottie and the motion study.

---

## 1. Vision

A sticker sheet you can peel. The hero is a sheet of die-cut vinyl stickers: one big Albretsen AS mark, the four real product logos and a handful of pixel sprites. You grab a corner, the vinyl curls, and underneath is the **underdrawing**: an infrared, dithered plate made from a public-domain museum object. It is the same thing conservators do with infrared reflectography, when they look beneath the paint at the drawing that came first.

The metaphor carries the brand. The surface is playful, even toy-like (stickers, 16-bit sprites), but every layer has a deliberate one underneath it, and you can see the craft when you lift the corner. Pixel art is the **costume, not the skeleton**. Layout, type and copy stay calm, modern and readable (Geist). The pixel work sits in the objects: stickers, sprites, plates and the mark.

**Mood:** hacker-cool. A late-night terminal glow, a thermal camera, a sticker-bombed laptop lid, a demo-scene intro. It is confident and quiet, and it never shouts. The infrared ramp (void → violet → magenta → orange → white-hot) makes everything feel *electric*. The eye plate and the aperture sticker carry *aperture*. The 3D peel and the voxel sprites carry *depth*.

**What it is not:** a bank, a fund or a consultancy. No gears, trains, ships, split-flaps or Braun pastiche. No "hire me".

### References (researched for this kit)
| What | URL | Taken from it |
|---|---|---|
| GSAP image-sequence scrub (Apple AirPods technique) | https://gsap.com/docs/v3/HelperFunctions/helpers/imageSequenceScrub | canvas-drawn frame sequence, preload first frame, scrub by scroll |
| Motion examples (springs, drag, curtains/page wipe) | https://motion.dev/examples | spring-driven drag-follow (peel), curtain/wipe transitions → IR WIPE |
| Peel-away sticker effect (Mandy Michael via CodeMyUI) | https://codemyui.com/peel-away-sticker-text-effect/ | clip-based peel; we generalised it to any fold angle |
| GreenSock forum: peel token with clip-path | https://greensock.com/forums/topic/35793-peel-token/ | animate clip-path in sync with the flap |
| Framer draggable WebGL sticker | https://www.framer.com/community/marketplace/components/draggable-sticker/ | physical curl reference for the three.js bake |
| Pixel sticker peel component | https://pixel-art-8-bit.mishrashardendu22.is-a.dev/docs/components/pixel-sticker-peel | pixel-art + peel pairing |
| Dithering for pixel artists | https://pixelparmesan.com/dithering-for-pixel-artists | restraint: ordered dither only on plates, never on UI |
| Quaternius (CC0 low-poly) | https://quaternius.com | checked as a source. We built our own voxels from our sprites instead, to keep one hand-made voice |
| The Met Open Access | https://www.metmuseum.org/openaccess | CC0 plates (see inventory) |
| Poly Haven HDRI / ambientCG textures | https://polyhaven.com · https://ambientcg.com | studio light for the bake, vinyl/paper normal map |

---

## 2. Palette

The seed hue is 108° (phosphor). It is the electric yellow-green and is used **only** for signals: the cursor, "live" states, the charge in the Lottie and the easter-egg toast. Everything else comes from the infrared ramp.

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| `--ir-void` | oklch(0.14 0.06 298) | `#0d031e` | page background, sticker outlines |
| `--ir-violet-900` | oklch(0.22 0.11 298) | `#230445` | panels, sprite shade |
| `--ir-violet` | oklch(0.36 0.17 298) | `#4b1788` | mark body, liner print |
| `--ir-ultra` | oklch(0.52 0.22 300) | `#8038d1` | bevel, secondary print, links on light |
| `--ir-magenta` | oklch(0.64 0.26 350) | `#f315a2` | primary accent, mark charge, CTA |
| `--ir-hot` | oklch(0.69 0.19 15) | `#fa5e75` | heat, graphs |
| `--ir-orange` | oklch(0.73 0.17 50) | `#fa8233` | secondary accent, "AS" |
| `--ir-amber` | oklch(0.86 0.13 80) | `#fec766` | highlights, numbers on dark |
| `--ir-phosphor` | oklch(0.92 0.19 108) | `#f2ed2b` | **seed**: signals only |
| `--ir-vinyl` | oklch(0.97 0.012 300) | `#f6f3fc` | text on dark, sticker white |
| liner | oklch(0.93 0.020 305) | `#ece6f4` | light surfaces (sticker sheet) |
| lilac | oklch(0.76 0.078 299) | `#b7a6dc` | muted text |
| panel | oklch(0.21 0.089 294) | `#1c0a3c` | cards on void |

**Infrared ramp** (dither order, dark → hot): `#0d031e #230445 #4b1788 #8038d1 #f315a2 #fa5e75 #fa8233 #fec766 #f6f3fc`.

## 3. Typefaces (all Google Fonts, OFL)
- **Geist** 400/500/650: headlines (tight, −0.035em to −0.06em) and body.
- **Geist Mono** 400/500: numbers, commands, facts (`claude mcp add albretsen https://albretsen.no/mcp`).
- **Silkscreen**: micro labels, sticker print and UI chrome only. Uppercase, +0.06em. Never for paragraphs.
- The wordmark and mark are custom pixel drawings (SVG rects), not a font.

## 4. How the builder should use it
- **Hero:** the live peelable sheet (`motion/peel.js` on `stickers/*.webp` over `hero/ir-eye.webp`), *or* the baked still `hero/sheet@2x.webp` with the scroll-scrub sequence (`frames/peel-00..39.webp` + `motion.js → scrubFrames`) directly below it. The preview shows both.
- **Products:** `products/<id>@2x.webp` as card images, with each card's facts set in Geist Mono beside it. Real logos are never altered: the bakes print the original PNG/SVG onto a sticker.
- **Texture and life:** scatter `stickers/*` in margins (LIFT hover), use `hero/ir-fireworks` as a full-bleed dark band, `extras/ir-piazza`/`ir-brooch` as section plates, `extras/ir-gradient-strip.png` (pixelated) as dividers, and `extras/liner-grid.svg` as the light-surface background.
- **3D:** `3d/voxel.js → mountVoxel(el, {src:'3d/voxel-mark.glb'})`, which loads lazily. It suits an "about" block or the footer.
- **Easter egg:** `thermalEasterEgg()` (motion.js). Typing **peel** (or the Konami code) anywhere drops the whole page into a thermal false-colour view with a phosphor toast. Typing it again leaves. Don't advertise it.
- Always render pixel images with `image-rendering: pixelated`.

## 5. Motion (motion.css / motion.js / motion/)
| Name | Kind | What it does | Researched from |
|---|---|---|---|
| **SLAP** | entrance | A sticker arrives at 1.42× scale, high and over-tilted, then lands on a `linear()` spring with overshoot while its drop-shadow tightens. IntersectionObserver plus stagger (`slapIn`). | motion.dev spring examples; sticker-bomb sites |
| **LIFT** | hover/focus | Rises 6px, tilts 2° and grows its shadow, while a holographic glint (screen-blended gradient) sweeps across, masked to the die-cut art via `--art`. | Simon Goellner's CSS holo cards (poke-holo.simey.me) |
| **IR WIPE** | page/section transition | An ordered Bayer-8×8 dissolve on a pixelated canvas that covers in infrared, swaps content at the midpoint, then uncovers (`irWipe`). | motion.dev curtains / page wipe; 16-bit screen transitions |
| **CHROMA** | accent | On hover or focus, text splits by one pixel into magenta and orange, echoing the mark's offset A. | the mark itself |
| **PEEL** | interaction | `motion/peel.js`: drag any corner and the sticker folds along the perpendicular bisector of corner→pointer. The front is clipped (Sutherland–Hodgman), the back is a reflected copy masked to the die-cut, and it springs back or flies off past a threshold. Includes keyboard support (Enter/Space) and reduced-motion handling. | CodeMyUI peel, GSAP forum clip-path peel |
| **SCRUB** | centrepiece | `scrubFrames()`: 40 pre-rendered frames drawn to a canvas from scroll progress, with first frame loaded first, the rest on idle, and nearest-loaded fallback. | GSAP imageSequenceScrub / Apple AirPods |
| **SPARK** | Lottie | A pixel bolt with a charge crawling down it, built from hold keyframes so it steps like a sprite (`playSpark`, lottie-web 5.12.2 light). | hand-built from `sprites.json` |

---

## 6. Inventory

Sizes are approximate. "Generated" means made for this kit by the scripts described below, all © Albretsen AS for use on albretsen.no.

### Identity
| File | What | Use | Source | Licence |
|---|---|---|---|---|
| brand/mark.svg | 16×16 pixel mark: a violet die-cut tile with its corner folded back and an A carrying a magenta 1px charge | nav, footer, avatar | generated: sprite map → SVG rects | own |
| brand/wordmark.svg | pixel wordmark ALBRETSEN (2px stems, magenta drop) + orange AS, for dark backgrounds | header | generated | own |
| brand/wordmark-ink.svg | the same, in void ink for light/liner surfaces | light sections, print | generated | own |
| brand/lockup.svg | mark and wordmark | header, OG | generated | own |
| brand/favicon.svg, favicon-32.png, favicon-180.png | favicon; 180px apple-touch on void | `<link rel=icon>` | generated | own |
| brand/og.jpg (+ og-src.html) | 1200×630 Open Graph: lockup, the default one-liner, and the sheet bake | social cards | headless Chrome render of og-src.html | own |

### Hero imagery
| File | What | Use | Source | Licence |
|---|---|---|---|---|
| hero/sheet.webp, sheet@2x.webp | 1440×900 / 2880×1800 bake of the full sticker sheet (pixel stickers + the four real product logos) on dark felt, lit warm-key/magenta-rim | hero still, poster for the scrub | three.js 0.170 scene `3d/sticker-scene.js`, Poly Haven *Studio Small 09* HDRI, ambientCG *Paper001* normal map | own render; inputs CC0 |
| hero/sheet-peel.webp, @2x | the same sheet, mark mid-peel, eye revealed | secondary hero / about | same | own |
| hero/ir-fireworks.webp, @2x | infrared Bayer-dither plate of *Fireworks display, Nuremberg, 1659* (print, 1673) | full-bleed dark band, hero backdrop | https://www.metmuseum.org/art/collection/search/681968 → dithered (600px → ×2/×4 nearest) | CC0 (Met Open Access) |
| hero/ir-eye.webp, @2x | infrared plate of a British *Eye Miniature* (the underdrawing) | under the peel, aperture moments | https://www.metmuseum.org/art/collection/search/435799 | CC0 |

### Products
| File | What | Use | Source | Licence |
|---|---|---|---|---|
| products/mcp-emails.webp, @2x | real MCP Emails icon on a die-cut vinyl sticker with a curling corner, on the IR Fireworks plate, with label sticker "MCP EMAILS / LIVE / $782 MRR" | product card | bake; logo from `_shared/products/mcp-emails/icon.png` (unaltered) | logo © Albretsen AS |
| products/fun-libs.webp, @2x | real Fun Libs v5 icon on the IR *Fireworks in a Piazza* plate, "113,000+ INSTALLS" | product card | bake; `_shared/products/fun-libs/icon.png`, corners rounded as an app icon | logo © Albretsen AS |
| products/toolrails.webp, @2x | real Toolrails icon on the IR brooch plate, "4 CONNECTORS" | product card | bake; `_shared/products/toolrails/icon.svg` | logo © Albretsen AS |
| products/harbor.webp, @2x | real Harbor mark (light on #1b1b1b, as on its banner) on the IR eye plate, "549 COMMITS" | product card | bake; `_shared/products/harbor/harbor-mark.svg` | logo © Albretsen AS |
| products/retired.webp, @2x | sheet of retired-product stickers: pixel stand-ins + real Luma logo | "retired" row / archive | bake | own; Luma logo © Albretsen AS |
| stickers/product-*.webp | the five real product logos as flat transparent die-cut stickers | scatter, peelable hero | generated die-cut around unaltered logos | logos © Albretsen AS |
| stickers/polyglot-pilot, pinpoint, webvakt, joke-central, tryggere-hyring, early-apps (+@2x) | pixel stand-ins: speech bubbles, map pin, window with change pulse, grin, shield-check, calculator | retired products list | generated sprites | own |

### Stickers and extras
| File | What | Use | Source | Licence |
|---|---|---|---|---|
| stickers/mark, bolt, cursor, terminal, key, spark, floppy, aperture, planet (+@2x) | die-cut pixel stickers, transparent WebP | margins, empty states, 404, LIFT/SLAP demos | generated (sprite → nearest ×20 → smooth die-cut border) | own |
| stickers/ir-eye.webp | the eye plate as a sticker | accent | generated from Met 435799 | CC0 source |
| extras/ir-piazza.webp, @2x | IR plate of Guercino, *Fireworks in a Piazza* (drawing, ca. 1618–23) | section plate | https://www.metmuseum.org/art/collection/search/338993 | CC0 |
| extras/ir-brooch.webp, @2x | IR plate of an eye-miniature brooch | section plate | https://www.metmuseum.org/art/collection/search/435797 | CC0 |
| extras/spritesheet.png + spritesheet.json | all 15 sprites at 1×, with an atlas | CSS sprites, canvas | generated | own |
| extras/sprites.json | raw sprite maps and palette (letters → hex) | canvas or 3D generation | generated | own |
| extras/ir-gradient-strip.png | Bayer-dithered infrared ramp strip | dividers (render pixelated) | generated | own |
| extras/liner-grid.svg | 48px tile: sticker-liner grid with pixel ticks | light surface background | hand-written SVG | own |
| extras/vinyl-normal.jpg | 512px tangent normal map of paper/vinyl | three.js materials | ambientCG Paper001, https://ambientcg.com/view?id=Paper001 (resized) | CC0 |

### Interactive / 3D / motion
| File | What | Use | Source | Licence |
|---|---|---|---|---|
| frames/peel-00 … peel-39.webp | 40 frames, 1200×750, ≈940 KB in total: the mark curls off the sheet and lifts away, revealing the eye | scroll-scrub centrepiece | three.js bake (`3d/bake.html?p=…`) | own |
| 3d/voxel-mark.glb, voxel-bolt.glb, voxel-cursor.glb | voxel heightfield models of the sprites, with vertex colours, ≤110 KB each | spinning 3D sprite | generated by a dependency-free GLB writer from sprites.json | own |
| 3d/voxel.js, voxel-demo.html | `mountVoxel()` viewer: OrbitControls drag, idle bob, a "pixel render" at 40% resolution with nearest upscale | about or footer | own code; three.js 0.170 (MIT) via jsDelivr | own |
| 3d/tex/*.webp | full-res sticker, product and plate textures for the live scene (≈220 KB) | sticker-scene.js | generated | own / CC0 sources |
| 3d/sticker-scene.js, bake.html | the live sticker-sheet scene: page-curl deformation, die-cut alpha shadows and a printed liner. `build()` + `setPeel(0..1)`, so it can also run live | regenerate frames/stills; optional live hero | own code; three.js (MIT) | own |
| motion/peel.js | DOM peel interaction | hero stickers | own code | own |
| motion/spark.lottie.json | 48-frame Lottie of the pixel bolt with a travelling charge | loaders, "live" indicator | hand-built JSON (`lottie.mjs`) | own |
| motion.css, motion.js | SLAP, LIFT, IR WIPE, CHROMA, scrubFrames, playSpark, thermal easter egg | site-wide | own code | own |
| preview.html | contact sheet | start here | own | own |

### Downloaded (not shipped)
- `studio_small_09_1k.hdr` from https://polyhaven.com/a/studio_small_09 (CC0). Used only as the environment light when baking. It is not included, to stay within budget, and `sticker-scene.js` falls back to three's RoomEnvironment without it.
- Met original JPEGs (`DP855345`, `DP810207`, `158042`, `158040`) from images.metmuseum.org, all flagged `isPublicDomain: true` by the Met Collection API.

## 7. Regenerating
The pipeline is small and deterministic:
1. A Python/Pillow script builds the sprites from ASCII maps, the die-cut borders (Gaussian-dilated alpha), the SVG mark and wordmark, and the Bayer dithers.
2. Node scripts write the GLBs and the Lottie from `extras/sprites.json`.
3. `3d/bake.html?mode=sheet|product|retired&p=…&dpr=2` (add `&curl=1` for product curls) is rendered with headless Chrome (SwiftShader) and converted to WebP. The scene loads its textures from `3d/tex/*.webp`, which are shipped, so it also runs live. Without the HDRI it lights itself with three's RoomEnvironment.
