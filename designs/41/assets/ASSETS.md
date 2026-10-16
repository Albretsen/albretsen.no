# Design 41: Key Frame

Asset kit for Albretsen AS / albretsen.no. Open `preview.html` first: it shows every asset, the palette and type, and runs the motion study, the 3D object and the light table.

## Vision

Albretsen AS is presented as an animation studio for software. Every product is a painted cel, the company mark is a 3D object you can throw, and the whole site is drawn "on twos" (12 drawings a second, the way hand-drawn animation and *Spider-Verse* move). The mood is the cinematic ambition of late-80s cel anime: *Royal Space Force: The Wings of Honnêamise*, where artists made a launch feel real one painted layer at a time. The ancestry of animation (Muybridge, Marey, the phenakistiscope) is recut in two inks and used as texture. The point is craft that shows: hard cel shading, ink lines, no blur, and motion with intent.

- **Look:** cel-shaded, duotone. Two flat tones per shape plus an ink line. Shadows are hard offsets and never blur. Grain sits on top of everything.
- **Motion:** held poses on twos, smear frames, squash and stretch, impact frames, line boil. The camera and scroll stay smooth while characters step.
- **Interaction:** everything can be moved. Grab the A and throw it, drag product cels to re-cut their order, drop and stack cels on the light table.
- **Avoid:** gears, trains, ships, finance-firm tropes, and gradients inside a shape. Never recolour a product logo.

### References
- *Wings of Honnêamise*, multi-layer cel compositing: https://en.wikipedia.org/wiki/Cinematography_of_Royal_Space_Force:_The_Wings_of_Honn%C3%AAamise and https://en.wikipedia.org/wiki/Animation_of_Royal_Space_Force:_The_Wings_of_Honn%C3%AAamise
- *Spider-Verse*, animating on twos and no motion blur: https://www.slashfilm.com/562748/into-the-spider-verse-technique
- Smears and line work in Spider-Verse (AUB research): https://3danimationcrystal.myblog.arts.ac.uk/2021/01/19/research-presentation/
- Impact frames: https://80.lv/articles/learn-how-to-add-accents-to-your-animations-with-impact-frames
- Toon outline (inverted hull) in three.js: https://threejs.org/docs/pages/OutlineEffect.html
- Cel shading basics (hard terminator, 2–3 tones, ink contour): https://graphics.cg.uni-saarland.de/courses/cg1-2018/RC/groupT_web/celshading.html
- matter.js DOM physics pattern: https://github.com/jorisnoo/matter-dom-plugin
- Motion (motion.dev) vanilla API (`animate`, `hover`, `press`, `inView`, `steps`): https://motion.dev/docs/hover
- Sources browsed: Wikimedia Commons, are.na, The Met Open Access, images.nasa.gov, Cooper Hewitt (Smithsonian)

## Palette (duotone, seed hue 240° OKLCH)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| `--ink-950` | oklch(0.15 0.045 255) | #010b1d | page ground, letterbox bars, ink lines |
| `--ink` (Night ink) | oklch(0.21 0.065 255) | #011835 | ink line, panels, text on light |
| `--ink-700` (Core shadow) | oklch(0.30 0.085 252) | #042e57 | darkest cel band, borders on dark |
| `--blue` (Cel blue) | oklch(0.66 0.14 240) | #259cde | the second ink: shadow faces, hard shadows, accents |
| `--blue-200` (Rim light) | oklch(0.82 0.075 236) | #95ccef | rim band, secondary text on dark |
| `--paper` (Acetate) | oklch(0.965 0.018 230) | #e8f6fd | light ground, text on dark |
| white | | #ffffff | lit faces, highlight glints |

Photos use a gradient map from ink 950 to cel blue to acetate. Cel paintings use five hard bands (ink, core shadow, cel blue, rim light, acetate) with ink contours. The only other hues allowed are the real product logos.

## Typefaces (Google Fonts, SIL OFL)
- **Unbounded 800** (display, figures, wordmark; tracking −0.01 to −0.02em). The wordmark is outlined to paths, so it needs no font.
- **Instrument Sans 400/500/600** (body).
- **JetBrains Mono 500/700** (slates, timecodes, labels, the MCP command; uppercase with +0.14em tracking).

```html
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;800&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
```

## Libraries
- three.js **0.170.0**, loaded lazily from jsDelivr by `interactive/cel-object.js` (MIT).
- matter.js **0.20.0**, vendored at `vendor/matter-0.20.0.min.js` (MIT).
- Motion **12.23.24** UMD build, vendored at `vendor/motion-12.23.24.js` (MIT). It exposes `window.Motion`.

## Motion study (`motion.css` + `motion.js`)

| Name | Kind | What it does | Researched from |
|---|---|---|---|
| **Smear-in** (`.kf-smear-in`, `smearIn()`) | entrance | Six drawings on twos: a stretched smear frame, squash on landing, one overshoot, then settle. Staggered. | Spider-Verse on twos; classic smear frames |
| **Line boil** (`.kf-boil`, `installBoil()`) | hover | Three SVG turbulence filters swapped every 2 frames make ink lines tremble like hand-traced drawings. | Hand-drawn line boil |
| **Peg lift** (`.kf-peg`, `pegLift()`) | hover | A cel lifts off the peg bar. The hard shadow grows with a slight tilt and a spring settle. | Cel layering on the animation stand |
| **Impact frame** (`.kf-impact`, `impactFrame()`) | feedback | Two inverted drawings, then a three-drawing shake. Fires on hard hits from the 3D A or the light table. | Anime impact frames (80.lv) |
| **Cel wipe** (`celWipe()`) | transition | A blue leading band and an ink panel cross diagonally in 8 stepped drawings. Content swaps while the screen is covered. | Anime scene-change wipes |
| **Multiplane** (`[data-plane]`, `multiplane()`) | scroll | Parallax layers updated at 12 fps. | Honnêamise's 12-layer compositing |
| **Phenakistiscope** (`.kf-disc`) | idle loop | Rotates exactly one slot (30°) per drawing, so the 1840 disc animates in place. | The original optical toy |
| **Gallop** (`.kf-gallop`) | loader | Muybridge's 12 frames played from a sprite strip with `steps(12)`. | Muybridge 1879 |
| **Rearrangeable** (`rearrangeable()`) | signature delight | Drag any list item to re-cut the order. Siblings reflow with FLIP on Motion springs, the order persists per `data-cut`, and Alt+Arrow works from the keyboard. | Editing a cut on a light table |

Every helper respects `prefers-reduced-motion`.

## Interactive / 3D
- `interactive/cel-object.js`: `mountCelObject(el, opts)` mounts a cel-shaded, ink-outlined extruded "A" (the same geometry as `mark.svg`). It uses a hand-written two-band toon shader with a hard glint and rim band, plus an inverted-hull ink line. You can grab, spin and throw it. It bounces off the frame edges with squash, smears when thrown fast, and emits `impact`, `grab` and `release`. The pose clock can run on twos or ones. Options: `pose`, `offset`, `scale`, `light`, `autoSpin`, `onTwos`, `shape` (`'A'|'knot'|'ico'`). Demo: `interactive/demo-cel-object.html`.
- `interactive/cel-table.js`: `mountCelTable(el, opts)` turns any `[data-cel]` children into matter.js bodies you can drag, throw and stack. Free bodies are drawn on twos, while the held one updates every frame. It handles wheel scroll correctly and persists positions (`persist`). `settle: true` composes the table before first paint. Demo: `interactive/demo-cel-table.html`.

## Inventory

| File | What it is | Intended use | Source | Licence |
|---|---|---|---|---|
| identity/mark.svg | Cel A: extruded letter, two tones, ink line, sparkle | Header mark, loader, sticker | Hand-authored SVG | Original, owned by client |
| identity/mark-mono.svg | One-colour mark | Embossing, single-ink contexts | Hand-authored SVG | Original |
| identity/mark-512.png | Raster mark | App stores, social avatars | rsvg-convert from mark.svg | Original |
| identity/wordmark.svg / wordmark-on-ink.svg / wordmark-mono.svg | ALBRETSEN + AS tag with a hard cel shadow, outlined paths | Header, footer, OG | Unbounded 800 outlined via opentype.js | Font: SIL OFL; artwork original |
| identity/favicon.svg, favicon-180.png | A on an ink tile | Favicon, apple-touch-icon | Hand-authored SVG / rsvg-convert | Original |
| identity/og-image.jpg | 1200×630 social card | `og:image` | Rendered from hero/keyframe-render.html?mode=og | Original + NASA PD plate |
| hero/keyframe-1280/2560.(webp,avif) | Title card: 3D cel A over a cel cloud sea, impact lines, letterbox | Hero poster / static fallback for the 3D hero | Rendered from hero/keyframe-render.html (three.js) | Original + NASA PD plate |
| hero/keyframe-render.html | Source page for keyframe + OG | Re-render at other sizes | Original | Original |
| hero/marey-fencer-1280/2560.(webp,avif) | Chronophotograph of a fencer, duotone with grain | Second hero plate / About section | Georges Demenÿ, "[Fencer]" 1906, The Met 291656: https://www.metmuseum.org/art/collection/search/291656, image https://images.metmuseum.org/CRDImages/ph/original/DP231109.jpg | Met Open Access, CC0 |
| extras/cel-clouds-1280/2200.(webp,avif) | Cloud sea seen from the ISS, repainted as a 5-band cel background | Hero plate, section backgrounds, multiplane layer 0 | NASA ISS040-E-062704 "Earth Observation": https://images.nasa.gov/details/iss040e062704 (cropped to remove station hardware) | NASA, public domain |
| extras/marey-birds-1200/2400.webp | Gull in flight, chronophotograph strip, duotone | MCP Emails plate, section dividers | Étienne-Jules Marey, "[Bird in Flight]" 1886, The Met 286544: https://www.metmuseum.org/art/collection/search/286544 | Met Open Access, CC0 |
| extras/muybridge-gallop-2880/5760.webp | 12-frame sprite strip (ink with alpha) | `.kf-gallop` loader, footer | Eadweard Muybridge, "Attitudes of Animals in Motion" 1879/1881, The Met 700109: https://www.metmuseum.org/art/collection/search/700109 | Met Open Access, CC0 |
| extras/phenakistiscope-600/1200.webp | 1840 phenakistiscope disc with cut slots, duotone with alpha | Spinning ornament, light-table body, Fun Libs plate | "Optical Toy, Phenakistiscope Disc with Geometric Shapes", c. 1840, Cooper Hewitt (Smithsonian) 18607983: https://collection.cooperhewitt.org/objects/18607983, via https://commons.wikimedia.org/wiki/File:Optical_Toy,_Phenakistiscope_Disc_with_Geometric_Shapes,_ca._1840_(CH_18607983).jpg | Public domain (Smithsonian Open Access CC0) |
| extras/sticker-key.svg, sticker-on-twos.svg, sticker-since-2016.svg, sticker-norway.svg, sticker-sparkle.svg | Die-cut stickers with outlined text | Scattered on sections, light-table props | Hand-authored SVG (text outlined from Unbounded / JetBrains Mono) | Original; fonts OFL |
| extras/speed-lines.svg | Horizontal speed lines (currentColor) | Section backgrounds, Toolrails, hover states | Generated SVG (seeded) | Original |
| extras/impact-burst.svg | Radial impact burst (currentColor) | Behind hero object, behind figures | Generated SVG (seeded) | Original |
| extras/halftone.svg | 24px halftone tile | Shadow bands, print texture | Hand-authored SVG | Original |
| extras/grain-256.png | Seamless film grain with alpha | Global overlay on dark surfaces | Generated with numpy | Original |
| extras/cel-frame.svg | Acetate edge, peg holes, registration marks (4:3) | Overlay that turns any image into a cel | Hand-authored SVG | Original |
| products/cel-mcp-emails-800/1600.webp | Real MCP Emails icon raised as a cel tile over Marey's birds | Product card / case header | Rendered from products/cel-template.html; logo from designs/_shared/products/mcp-emails/icon.png | Logo © client; plate CC0 |
| products/cel-fun-libs-800/1600.webp | Real Fun Libs v5 icon over the phenakistiscope | Product card | cel-template.html; designs/_shared/products/fun-libs/icon.png | Logo © client; plate PD |
| products/cel-toolrails-800/1600.webp | Real Toolrails icon over drawn speed lines | Product card | cel-template.html; designs/_shared/products/toolrails/icon.svg | Logo © client |
| products/cel-harbor-800/1600.webp | Real Harbor mark in its own cream on its own near-black tile, over the cel cloud sea | Product card | cel-template.html; designs/_shared/products/harbor/harbor-mark.svg | Logo © client; plate NASA PD |
| products/cel-template.html | Source template (`?p=<id>`) | Re-render, or use live | Original | Original |
| products/retired/standin-*.svg (6) | Cel-tile stand-ins for Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, early apps | Retired-products grid (Luma uses its real logo from _shared) | Hand-authored SVG | Original |
| interactive/cel-object.js + demo | 3D cel A (three.js) | Hero centrepiece | Original code | Original |
| interactive/cel-table.js + demo | matter.js light table | Products / playground section | Original code | Original |
| motion.css, motion.js | Motion study | Site-wide | Original code | Original |
| vendor/motion-12.23.24.js | Motion UMD | Animation runtime | https://cdn.jsdelivr.net/npm/motion@12.23.24/dist/motion.js | MIT |
| vendor/matter-0.20.0.min.js | matter.js | Physics runtime | https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js | MIT |

Image processing (posterise, vote-smoothed cel bands, ink contours, duotone gradient map, grain, alpha cut-outs) used Python, Pillow, NumPy and SciPy. Encoding used Pillow WebP/AVIF. Renders used headless Chrome. Total kit size is about 3.8 MB.

## Notes for the builder
- Hero: mount `cel-object.js` over `extras/cel-clouds-*` with `extras/impact-burst.svg` behind it and letterbox bars. Show `hero/keyframe-*` as the poster until WebGL is ready, and for reduced motion. Wire `impact` to `impactFrame(heroEl)`.
- Use `[data-plane]` on hero layers and call `multiplane()`.
- Put product cards in a `rearrangeable()` grid. Use `cel-table.js` as the "playground" or as a section where the cels can be thrown.
- Use stickers sparingly, one or two per section, rotated a few degrees, boiling on hover.
- Retired products: the Luma real logo plus the six stand-ins, all on ink tiles.
- Facts come only from `designs/_shared/content.js`.
