# Zinc & Granite: asset kit 76

**A Paris room. A Norwegian view.**

## Vision

Paris zinc roofs and Norwegian fjord granite are the same colour: silver. The whole brand is one room, with Haussmann proportions, pale boiserie walls, a plaster cornice and a chevron (point de Hongrie) oak floor. The room has one round-headed French window. It stands open over a balcony railing, and beyond it a fjord runs between sheer granite cliffs under a soft Nordic overcast.

Light is the only thing that moves. Through the day a sun patch shaped like the window travels across the floor, silver in the morning, white at noon and gold in the evening. The camera makes **one** slow, unbroken walk from the back of the room to the window. Products stand on the stone sill as letterpress cards carrying their real logos. Retired products become perforated stamps.

The mood is warm and human: an olive tree in a zinc planter, a cup on the writing table, a laptop showing an MCP command. Nothing on the site says "Paris" or "Norway" in words. The atmosphere does that work, and the copy stays about software. There are no gears, ships or charts.

**References studied:** https://www.snohetta.com (architecture shown with quiet confidence), https://accidentallywesanderson.com (frontal symmetry, a pastel restraint, the frame as a subject), https://www.kinfolk.com (generous whitespace, a calm editorial pace), https://www.rauno.me (small, exact interaction details: the cursor), and the Codrops scroll-camera articles (https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/ and the Blender camera-path gallery). The Motion+ Cursor notes (https://motion.dev/blog/introducing-magnetic-cursors-in-motion-cursor) informed a cursor that stays restrained.

**Hero composition:** the room is **frontal and symmetric** (Wes Anderson), with the arch dead centre. The two bakes that break the symmetry (noon corner, balcony) are for secondary sections.

## Palette

| Name | Hex | OKLCH | Use |
|---|---|---|---|
| Snow | `#f1efe9` | oklch(95.2% 0.008 91) | page, paper |
| Plaster | `#e3e6e3` | oklch(92.2% 0.005 146) | walls, panels, section fills |
| Zinc | `#a8b0b3` | oklch(75.2% 0.010 222) | rules, borders, roofs |
| Glacier | `#9dbccb` | oklch(77.7% 0.040 229) | links, focus rings, the ridge in the favicon |
| Granite | `#5c6266` | oklch(49.2% 0.010 237) | secondary text |
| Ink | `#1d2226` | oklch(24.9% 0.011 242) | type, mark; dark mode background base `#171b1e` |
| Moss | `#68774c` | oklch(54.5% 0.066 124) | "live" status, small accents |
| Stone | `#d9c7a4` | oklch(83.6% 0.051 84) | warm accents, cursor fanlight |
| Evening | `#f0b98e` | oklch(82.6% 0.085 59) | light only (washes, Day Drift), never text |
| Iron | `#25292b` | oklch(27.8% 0.007 229) | railing frieze, details |

## Typefaces

- **Bodoni Moda** (Owen Earl / indestructible type, SIL OFL 1.1), a variable didone with `opsz` 6–96 and `wght` 400–900, upright and italic. Use 500 at opsz 96 for display, italic 400 for accents (one italic word per headline at most), and text sizes at low opsz, where the hairlines thicken. Files: `fonts/bodoni-moda.woff2` and `fonts/bodoni-moda-italic.woff2` (Latin subset, from Google Fonts).
- **Instrument Sans** (SIL OFL 1.1) for labels, captions and UI: 600 weight, caps, tracking .22em. File: `fonts/instrument-sans.woff2`.
- The wordmark and lockup are **outlined** from Bodoni Moda with fontTools, so they need no font.

## Performance notes for the builder

- First paint: serve `img/hero-evening-*` through `<picture>`: AVIF (13–87 KB), then WebP, then JPEG. Below 700 px, switch to `hero-evening-portrait-*` (a real portrait render). Every image has width/height in preview.html, so layout shift is 0.
- 3D: load `room/room.js` (three@0.169.0 via import map) only after first paint, or on interaction. Keep the baked hero in place as the poster until the first WebGL frame. The live room is about 5k instanced leaves plus a 2048 shadow map, which runs fine on integrated GPUs. Pause rendering when nothing changes (demo.html shows how).
- Fonts: preload `bodoni-moda.woff2` only.

## Motion (motion.css, motion.js, cursor.js)

1. **Long Dolly**: one scroll-linked camera move per page, computed from absolute scroll progress with a damped follow, so it never drifts or cuts. It drives `room.set({ progress })` in 3D, or `--dolly` on a still as a fallback.
2. **Shutters**: images open like a pair of French windows (two panels rotate out on Y) when they enter the view.
3. **Day Drift**: an arched patch of window light (`extras/window-light.svg`) crosses a section over 24 s and warms from silver to gold.
4. **Italic Turn**: on hover, a didone word turns to its italic twin, with letter-spacing easing in.
5. **Window Cursor** (signature delight): a small arched-window outline trails the pointer on a spring. Over links the fanlight fills with stone light; over images it widens into a pane. It runs only with a fine pointer, hides over text fields and respects reduced motion.

There is one easing curve for the whole brand, `cubic-bezier(.16,.84,.24,1)` ("exhale"). Everything is disabled or settled under `prefers-reduced-motion`.

## Inventory

| File | What | Intended use | Source (how it was made) | Licence |
|---|---|---|---|---|
| identity/mark.svg, mark-snow.svg | Round-headed French window over a ridge line | Logo mark, header | Hand-drawn SVG | Original work for Albretsen AS |
| identity/wordmark.svg, wordmark-snow.svg | "Albretsen *AS*", outlined Bodoni Moda 500 + italic | Header, footer, OG | fontTools outlines from Bodoni Moda (OFL) | Original; font OFL permits outlining |
| identity/lockup.svg, lockup-snow.svg | Mark + wordmark | Header | As above | Original |
| identity/favicon.svg | Mark on a granite tile, glacier ridge | Favicon | Hand-drawn SVG | Original |
| identity/apple-touch-icon.png | 180×180 | iOS icon | rsvg-convert from favicon.svg | Original |
| identity/og-image.jpg (+ og-source.html) | 1200×630 share image | Open Graph / Twitter | HTML composition screenshot over hero-evening | Original |
| img/hero-evening-{828,1280,1920,2560}.{avif,webp,jpg} (2560: avif/webp only) | **Main hero**: the symmetric room at evening, gold sun patch with the railing shadow | Homepage hero | Baked from room/room.js in headless Chrome (GTAO, 4096 shadows, AgX), then halation, vignette and grain in Python | Original render; the view contains the CC0 photo below |
| img/hero-evening-portrait-{800,1200}.* | Portrait render of the same | Mobile hero | Same | Same |
| img/hero-noon-*.* | Corner view at noon, fanlight sunburst on the floor, paintings on the walls | About / second section | Same | Same |
| img/hero-window-*.* | Halfway through the camera move, late morning | Product section header | Same | Same |
| img/balcony-morning-*.* | End of the move: railing, silver fjord, mist | Footer / contact section | Same | Same |
| room/room.js | **The 3D room module** (three.js), with time-of-day and camera-progress dials | Interactive hero / scroll scene | Written for this kit | Original |
| room/demo.html | Live demo: drag the day, walk to the window | Tiny demo, lazy iframe in preview | Original | Original |
| room/bake.html | Bake tool: renders stills at any time/camera | Regenerating hero stills | Original | Original |
| room/fjord-view.jpg | The view outside (silver grade, sky padded upward) | Texture for room.js | "Lysefjorden, Norway (Unsplash oBPSdIOYHNg)": https://commons.wikimedia.org/wiki/File:Lysefjorden,_Norway_(Unsplash_oBPSdIOYHNg).jpg | CC0 |
| room/painting-dahl.jpg, extras/dahl-hallingdal-*.* | J.C. Dahl, *View over Hallingdal*, 1844 | Painting in the room; plate for the blog | The Met, object 441967: https://www.metmuseum.org/art/collection/search/441967 | Public domain (Met Open Access, CC0) |
| room/painting-pissarro.jpg, extras/pissarro-montmartre-*.* | Camille Pissarro, *The Boulevard Montmartre on a Winter Morning*, 1897 | Painting in the room; plate | The Met, object 437310: https://www.metmuseum.org/art/collection/search/437310 | Public domain (Met Open Access, CC0) |
| product/{mcp-emails,fun-libs,toolrails,harbor}-{600,1200}.* | Product stills: cotton card with the **real logo** on a limestone sill, view out of focus, window-bar shadows | Product cards / pages | product/compose.html (HTML/CSS composition, screenshot 1200×1500) | Original composition; logos are Albretsen AS's own (designs/_shared/products) |
| product/compose.html | Composer for product stills (`?id=…&tone=morning\|noon\|evening`) | Make new product stills | Original | Original |
| product/bg/bg-*.jpg | Blurred, graded backdrops for the composer | Composer input | Crops of the Lysefjorden (CC0), Hellesylt (CC0) and Paris Roofs (CC0) photos | CC0 |
| product/retired/{polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}.svg | Perforated stamps with outlined Bodoni monograms and a faint ridge | Retired products list | Generated SVG (Python + fontTools) | Original |
| (Luma) | Uses the real `_shared/products/luma/luma-monogram.svg` in a stamp frame (CSS) | Retired list | Real asset | Albretsen AS |
| extras/granite-mist-{800,1200,2000}.* | A mountain wrapped in cloud above the fjord, silver grade | Section background ("Granite") | "Hellesylt, Norway (Unsplash)": https://commons.wikimedia.org/wiki/File:Hellesylt,_Norway_(Unsplash).jpg | CC0 |
| extras/zinc-roofs-{800,1200,2000}.* | Paris zinc roofs and Haussmann facades from above, silver grade | Section background ("Zinc") | "Paris Roofs.jpg": https://commons.wikimedia.org/wiki/File:Paris_Roofs.jpg | CC0 |
| extras/paper-tile.webp | Seamless cotton paper, 512 px | Card and page texture | Generated (numpy noise, wrap-blurred) | Original |
| extras/zinc-tile.webp | Seamless standing-seam zinc, 512 px | Footer band, dividers | Generated (numpy) | Original |
| extras/railing.svg | Wrought-iron balcony frieze (rings + bars) | Divider, footer edge | Hand-drawn SVG, from the 3D railing | Original |
| extras/cornice.svg | Plaster cornice rule, stretchable | Section rules | Hand-drawn SVG | Original |
| extras/window-light.svg | Arched window as a patch of light, mullions cut out | Day Drift overlay | Hand-drawn SVG | Original |
| motion.css / motion.js | Long Dolly, Shutters, Day Drift, Italic Turn | Site motion | Original | Original |
| cursor.js | Window Cursor | Signature delight | Original | Original |
| fonts/*.woff2 | Bodoni Moda (roman, italic), Instrument Sans | Type | Google Fonts (fonts.gstatic.com) | SIL OFL 1.1 |
| preview.html | Contact sheet of everything | Review | Original | Original |

Libraries are loaded at runtime, not vendored: three@0.169.0 (MIT) via `https://cdn.jsdelivr.net/npm/three@0.169.0/…`, with an import map in room/demo.html and room/bake.html.

Considered and not used: Peder Balke's *North Cape* paintings at the Met (beautiful, but the boats pull toward nautical imagery) and Fizeau's 1843 rooftop daguerreotype (too dark to use).
