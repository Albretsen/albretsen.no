# Kiln Light: asset kit for design 35

Open **preview.html** first (serve the repo root, e.g. `python3 -m http.server 6035`). It plays the scroll-scrubbed hero, shows every asset, the palette, the type and the motion primitives, and loads the live 3D room when you ask it to. `preview.html?still` renders without the scroll loop, which is useful for screenshots.

## Vision

**A quiet room, one day of light.** Albretsen AS is shown as a small sunlit diorama, a cutaway room floating on limewash. The products are real objects in it: each real logo is fired as a glazed ceramic tile and set on a walnut bench, a travertine drum or a stone block. An arched window in the left wall looks out on real Martian dunes. As the visitor scrolls, the camera walks in while one day passes: the arch of sunlight starts high on the back wall, crosses the product tiles at noon, and at dusk lies across the floor, where a fractured travertine slab glows along a molten seam.

The **main imagery is a bespoke icon system**. Every glyph is drawn on a 24 px grid with a 1.5 px stroke and carries exactly one filled form in glaze blue: the object in the room. The same glyphs appear everywhere: small in the interface, huge as section art, pressed into clay tiles, die-cut as stickers and stamped on the archive tokens for retired products.

- **Personality:** serene and spacious. Long ease-outs and lots of air. Only the light moves on its own.
- **Spark words:** *molten* (the ember seam, the dusk light, the drip tooltip), *fracture* (the split travertine, the crackle-glaze field), *clarity* (the glass sphere in the niche, the focus-pull entrance).
- **Technology, not finance:** no charts, no serif-and-navy bank look, no machinery. The room reads as a maker's studio for software: precise objects, honest materials and real product marks.

### Mood and references

| Reference | What was taken |
|---|---|
| https://hoverstat.es (softlabor.biz, age-hh.com, typohypergraphicobject.page) | Fuzzy-to-sharp focus entrance, scaling reveal for the dialog, unhurried pacing |
| Apple AirPods Pro scroll pages; https://www.setproduct.com/blog/how-to-3d-animate-scroll | Canvas image-sequence scrubbing, with frames drawn from scroll progress |
| https://www.skills.sh/avnehsbhatia/ultraui/image-sequence-scrubbing | Keep the delta between frames small and load frames progressively (keyframes first) |
| https://discourse.threejs.org/t/interactive-3d-portfolio-an-immersive-scroll-experience/44520 , https://freefrontend.com/javascript-diorama/ | Diorama room as a hero, plus a baked-light approach |
| https://www.radix-ui.com/primitives/docs/guides/animation | Use data-state keyframes and keep exit animations mounted |
| https://21st.dev/@micka_design/components/accordion | Spring-feeling accordion with a molten curve |
| https://threejs.org/docs/pages/MeshPhysicalMaterial.html | Transmission, dispersion and iridescence for the glaze-glass sphere |
| https://vi-control.net/community/threads/exploring-procedural-generation-of-coherent-ui-sound-kits-web-audio-api-pure-synthesis-feedback-welcome.170143/ | One coherent synthesised sound family built on one fundamental |
| https://images.nasa.gov (PIA11833) | The view through the window |
| https://polyhaven.com , https://ambientcg.com | All materials and the lighting |

## Palette

The seed hue is 228° in OKLCH. It appears only as **glaze**. Everything else is fired earth.

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| limewash | oklch(0.958 0.012 78) | #f6f0e8 | page |
| sand | oklch(0.895 0.028 72) | #e8dac9 | surfaces, image wells |
| clay | oklch(0.80 0.045 60) | #d4b8a1 | quiet fills |
| terracotta | oklch(0.62 0.115 42) | #bf6d4c | the warm italic word |
| ember | oklch(0.70 0.14 52) | #e18344 | molten seam, glaze-on-hover |
| umber | oklch(0.42 0.045 55) | #614735 | hairlines, wood |
| ink | oklch(0.25 0.018 60) | #282019 | text |
| mist | oklch(0.89 0.022 228) | #cddee6 | dusk tint |
| **glaze** | oklch(0.56 0.085 228) | #357e9c | seed: one drop per icon, links, focus |
| deep glaze | oklch(0.36 0.06 228) | #124356 | dark accents |
| night | oklch(0.20 0.025 228) | #09181f | dark-mode background |

## Typefaces (all SIL OFL, Google Fonts)

- **Instrument Serif** 400 + italic for display, set large with −1% tracking and 0.9 leading. The italic carries the warm word (terracotta).
- **Geist** 300–700 for text, 17–20 px with 1.55 leading.
- **Geist Mono** 400/500 for facts, figures and captions, in caps with +14% tracking for eyebrows.

The wordmark is Instrument Serif outlined to paths, so it needs no font.

## Signature tech

1. **Image-sequence scrub** (`sequence.js` + `sequence/room-000…063.webp`). It has 64 frames at 1280×800, 1.7 MB in total. Frames load keyframes first (every 8th, then 4th, 2nd, 1st), and the nearest loaded frame is always drawn. Scroll progress is eased at 0.12. `onFrame(i, p)` drives the clock UI. At dusk (p > 0.9) it plays the `crackle` sound when sound is on.
2. **The live room** (`3d/room.js`, three.js 0.170.0 via import map). Use `createRoom(canvas, {base})`, then `.setTime(0..1)`, `.setView(name)`, `.setProgress(p)` and `.start()`. Live mode has pointer parallax, lifts an object on hover and emits a `roomhover` event with the product id. The sequence and every still were baked from this same module (`src/bake.html` + `src/bake.py`), so the live and baked versions match.
3. **Opt-in sound** (`sound.js`). It is off by default and the choice is remembered. Nothing is created until the visitor turns it on. All sounds are Web Audio synthesis built on A5 (880 Hz) with a tiny feedback-delay room: `tok` (hover), `ting` (open), `glide` (tab change), `thum` (close) and `crackle` (dusk).

## Motion study (`motion.css`, `motion.js`)

Every primitive keys off Radix's own `data-state` attributes and CSS variables (`--radix-accordion-content-height`, `--radix-tooltip-content-transform-origin`, …). The CSS therefore works on real `@radix-ui/*` components without changes. motion.js gives vanilla stand-ins that set the same attributes.

| Name | Kind | What it does | Researched from |
|---|---|---|---|
| **Focus pull** | entrance | blur 10→0 px plus a 14 px rise over 1.4 s on an expo-out curve, letters staggered | softlabor.biz (hoverstat.es), Apple product pages |
| **Kiln glow** | hover | a glaze-blue and ember radial sheen follows the cursor across the card | Linear and Vercel card spotlights |
| **Niche open** | transition (Dialog) | opens out of an arch-shaped `clip-path` and closes back into it | Radix Dialog data-state pattern; age-hh.com scaling reveal |
| **Strata** | Accordion | height animation, a sediment line fills underneath, content settles 8 px | Radix accordion docs; 21st.dev accordion |
| **Drip** | Tooltip | droops from the trigger's origin with a 4% molten overshoot | Radix tooltip transform-origin variable |
| **Pebble** | Tabs | the indicator glides like a stone on wet clay, and the panel focus-pulls in | Radix Tabs; Vercel tabs |
| **Lift** | HoverCard and cards | rises 6 px, and the shadow spreads rather than darkens | Radix HoverCard |
| **Window light** | ambient | an arched light gobo drifts across a section over 38 s | the room itself |

Everything collapses under `prefers-reduced-motion`.

## Inventory

| File | What it is | Intended use | Source | Licence |
|---|---|---|---|---|
| identity/mark.svg, mark-reverse.svg | Arch + ledge (a soft A) with the glaze sphere at rest | nav, footer, avatar | drawn for this kit | own work |
| identity/wordmark.svg, wordmark-reverse.svg | Mark + "Albretsen" in Instrument Serif, outlined | header, OG | generated with opentype.js from Instrument Serif | own work; font OFL |
| identity/wordmark-type.svg | Word only | tight spaces | as above | own work |
| identity/favicon.svg | Favicon with automatic dark-mode swap | `<link rel=icon>` | drawn | own work |
| identity/favicon-static.svg, apple-touch-icon-180.png | Static favicon and its 180 px PNG | iOS / fallback | rsvg-convert | own work |
| identity/og.jpg | 1200×630 Open Graph image: the morning room with the headline | og:image | src/og.html screenshot | own work |
| hero/hero-morning(.webp, @2x.webp, @2x.avif) | Whole diorama in morning light, floating on limewash | hero poster, no-JS fallback, section art | baked from 3d/room.js | own work (CC0 inputs) |
| hero/hero-bench(…) | The bench with MCP Emails and Fun Libs, arch of light on the wall | second hero, products intro | baked | own work |
| hero/hero-dusk(…) | Dusk: the molten seam glowing, dunes in the window | closing section, contact block | baked | own work |
| sequence/room-000…063.webp, poster.jpg | 64-frame scroll sequence (camera walk-in plus a day of light) | hero scrub via sequence.js | baked | own work |
| products/product-mcp-emails(.webp, @2x) | Real MCP Emails icon.png on a glazed tile, on walnut | MCP Emails card | baked; logo from designs/_shared/products/mcp-emails/icon.png | logo © Albretsen AS, unaltered |
| products/product-fun-libs(…) | Real Fun Libs icon.png (v5) on a tile, half in sun | Fun Libs card | baked; logo from _shared/products/fun-libs/icon.png | logo © Albretsen AS, unaltered |
| products/product-toolrails(…) | Real Toolrails icon.svg on a tile, on a travertine drum | Toolrails card | baked; _shared/products/toolrails/icon.svg | logo © Albretsen AS, unaltered |
| products/product-harbor(…) | Real Harbor mark (currentColor set to its banner cream) on a dark tile | Harbor card | baked; _shared/products/harbor/harbor-mark.svg | logo © Albretsen AS |
| retired/*.svg (6) | Clay tokens with a pressed glyph: Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, Early apps | archive list | build-icons.mjs | own work |
| retired/archive-tray(.webp, @2x) | The six tokens on a walnut tray in the room | archive section | baked | own work |
| icons/icons.js | The icon system (32 glyphs), source of truth with an `svg()` helper | everywhere | drawn | own work |
| icons/sprite.svg, icons/svg/*.svg | Sprite (`<use href="#k-name">`) and single files | everywhere | build-icons.mjs | own work |
| extras/tile-*.webp (+ .svg) ×8 | The icon system pressed into clay tiles (agent, app, saas, knowledge, molten, fracture, clarity, norway) | section heads, large art, stats | build-extras.mjs (SVG lighting filters) → rsvg-convert | own work |
| extras/stickers.webp (+ .svg) | Sheet of 9 die-cut glazed stickers | footer scatter, 404, colophon | build-extras.mjs | own work |
| extras/fracture-field.svg | Crackle-glaze Voronoi network with one molten seam | section background, behind numbers | build-extras.mjs (seeded with salt eac65c) | own work |
| extras/window-light.webp (+ .svg) | Soft arched gobo of warm window light, transparent | `.k-windowlight` overlay | build-extras.mjs | own work |
| extras/glass-niche(.webp, @2x) | Glaze-blue glass sphere in the arched niche | "clarity" moment, dialog art | baked | own work |
| extras/dunes-duotone.webp | Proctor Crater dunes in a deep glaze → terracotta → limewash duotone | full-bleed band behind facts | NASA PIA11833, processed | public domain (NASA/JPL-Caltech/UArizona) |
| extras/dunes-window.webp | Natural-colour crop for an arch mask | "the view" card | NASA PIA11833 | public domain |
| extras/limewash-tile.webp | Seamless 512 px page grain | body background | from Poly Haven Grey Plaster, processed | CC0 |
| extras/strata-band.webp | Travertine strata strip | section divider | from ambientCG Travertine002 | CC0 |
| 3d/room.js, 3d/demo.html | Live three.js room plus a small demo with view buttons and a time slider | interactive hero / "live" section | built from three.js primitives | own work; three.js MIT |
| textures/brown_photostudio_05_256.hdr | HDRI downsampled to 256×128 for lighting | room.js environment | https://polyhaven.com/a/brown_photostudio_05 | CC0 |
| textures/plaster_* | Grey Plaster colour (lightened) + normal, 512 px | walls, floor | https://polyhaven.com/a/grey_plaster | CC0 |
| textures/walnut_* | Wood060 colour (lifted) + normal, 512 px | bench, tray | https://ambientcg.com/view?id=Wood060 | CC0 |
| textures/travertine_* | Travertine002 colour + normal, 512 px | plinths, slab, sills | https://ambientcg.com/view?id=Travertine002 | CC0 |
| textures/nasa_proctor_dunes_1024.jpg | HiRISE "Sand Dunes and Ripples in Proctor Crater" | the window view | https://images.nasa.gov/details/PIA11833 | public domain (credit NASA/JPL-Caltech/UArizona) |
| motion.css, motion.js | The motion study above | site-wide | own | own work |
| sequence.js | Image-sequence scrubber | hero | own | own work |
| sound.js | Opt-in synthesised sound | site-wide | own | own work |
| src/* | Bake and build tools (bake.html/py, build-icons, build-extras, og.html, icon-sheet) | to regenerate | own | own work |

Total size is under 6 MB.

## Notes for the builder

- Start the page on the scroll-scrubbed room. Use `hero/hero-morning.webp` as the poster and no-JS fallback. On phones the canvas cover-fits, so keep copy at the bottom-left, where the floor is quiet.
- Product tiles carry the real logos. Never redraw them. If you need a product in a new pose, render it from `3d/room.js` with `setView`.
- One glaze drop per composition is the rule that keeps this serene. Use ember sparingly: hover, the seam and dusk.
- The sound toggle belongs in the nav and is off by default. Use the `sound-on` and `sound-off` glyphs for it.
- Dark mode: use night (#09181f) as the background, limewash for text and `mark-reverse.svg`, and keep the dusk frame as the hero poster.
