# Design 38: Salon Refusé (after hours)

Open `preview.html` first. It is the contact sheet: every asset, the palette, the type, the live canvas, the 3D frame and the motion demos. It needs a static server (ES modules, fetch), e.g. `python3 -m http.server` from the repo root, then `/designs/38/assets/preview.html`.

## Vision

A gallery wall at night, lit like a museum: deep jade plaster, narrow spotlights cutting scallops of light, works hung salon-style in a mix of gilt and box frames. Every artwork is a program. Each is a seeded canvas-2D drawing (`js/art.js`) that paints itself stroke by stroke. Albretsen's products hang in the same light as the art: the real logos, unaltered, printed on a museum mat with a wall label.

The twist is the **UV torch**. Each image comes with a pixel-aligned "underdrawing" pass in fluorescent ink on violet: the vector field, the catenary sags, the collision grid, the construction circles behind each logo, the seed. Hovering a work burns a soft hole through the finished piece into the maths that made it. The craft sits in the hidden layer, so the visitor discovers it instead of being told.

Rebellious indie, not museum-stuffy. The 1863 Salon des Refusés showed the work the academy rejected; this salon hangs the retired products next to the live ones. The house rules are inverted ("PLEASE TOUCH the works", "WET CODE"). The logo is a frame hung crooked on purpose. Gilt frames hold software icons with a straight face.

Spark words: **spark** (the nail and the star in the mark), **weightless** (works that hang, bodies with no gravity), **tension** (taut wires, catenaries, the moment before the reveal).

Banned on the site: "hire me", "let's connect", "passionate". No gears, ships, watches or timetables. It is a technology brand that happens to use a gallery as its stage.

### References
- Emil Kowalski, The Magic of Clip Path (https://emilkowal.ski/ui/the-magic-of-clip-path): clip-path `inset()` reveal at 1 s `cubic-bezier(.77,0,.175,1)`, used in **Lights up**.
- Emil Kowalski, 7 Practical Animation Tips (https://emilkowal.ski/ui/7-practical-animation-tips): press at scale .97, never animate from scale(0) (start at .9 or above), 2px blur to bridge states, keep UI under 300 ms. Used in **Red dot** and **Press**.
- ERCO contour spotlights (https://press.erco.com/): museum lights shaped to the edge of the work so the wall stays dark. This is the lighting model for every render.
- Salon des Refusés, 1863 (https://en.wikipedia.org/wiki/Salon_des_Refus%C3%A9s): the rebellious premise.
- Tyler Hobbs on flow fields, controlled and unpredictable (https://opensea.io/blog/articles/in-conversation-with-tyler-hobbs): the `filaments` series uses non-overlapping flow lines with a collision grid.
- Cinematic split toning and halation (https://melies.co/cinematic-techniques/color/split-tone): the photographic grade in `grade.py`, with cool shadows, warm paper highlights, lifted blacks, halation and grain.
- Spotlight reveal with a masked radial gradient driven by custom properties (https://webflow.com/made-in-webflow/website/spotlight-reveal-effect-with-hover): the basis of the UV torch, rebuilt with `@property` + WAAPI.
- Brief links: rive.app/community (404 at time of research), igloo.inc (no static content), lapa.ninja (403). Both igloo and Rive point to rich, physical-feeling interaction. That pushed the kit toward the draggable 3D frame.

## Palette (OKLCH first; hex for tools)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| wall | oklch(0.36 0.06 168) | #164737 | the gallery wall, main background |
| wall-deep | oklch(0.22 0.045 168) | #002116 | wall out of the light |
| night | oklch(0.15 0.03 168) | #000f09 | page edge, footer |
| ink | oklch(0.2 0.02 168) | #0d1914 | text on paper |
| paper | oklch(0.955 0.012 95) | #f2f0e7 | prints, labels, light text |
| paper-2 | oklch(0.91 0.02 85) | #e7e1d3 | secondary paper |
| gilt | oklch(0.74 0.11 82) | #cda454 | kicker labels, rules, small accents only |
| spark | oklch(0.8 0.15 168) | #35dcab | brand accent, links, the nail |
| red-dot | oklch(0.6 0.22 27) | #e62c2c | the "sold" dot on earning products only |
| uv-ground | oklch(0.17 0.07 292) | #11062a | UV layer ground |
| uv-ink | oklch(0.9 0.21 140) | #8bff70 | UV layer lines and text |
| uv-cyan | oklch(0.86 0.13 205) | #4ae9f9 | UV secondary |
| uv-rose | oklch(0.74 0.2 340) | #f970d2 | UV marks |

**Spectrum, used with discipline:** six hues 60° apart from the seed, all at `oklch(0.72 0.15 h)`: 168 #00c292 · 228 #00b5ee · 288 #a193fc · 348 #e77ab5 · 48 #ef8448 · 108 #aeab18. A work or a section takes one home hue, its opposite (h+180) and neutrals. Only the brand spark moment may show the full spectrum. The UV colours appear only in the hidden layer. Machine-readable: `brand/palette.json`.

## Type (Google Fonts, OFL)
- **Instrument Serif** Italic: display, section titles, wall-label titles, the wordmark (outlined in SVG).
- **Bricolage Grotesque** 800, wdth 75: stickers and one loud accent per view. Never body.
- **JetBrains Mono** 400/600: body, captions, labels, data, UV annotations.

`https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;600&family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&display=swap`

## Motion (motion.js + motion.css, Web Animations API)
1. **Lights up** (entrance): a lamp warm-up flicker on the light pool, then a top-down clip-path unveil of the work. Stagger 160 ms. Triggered on scroll.
2. **UV torch** (signature hover): a registered `@property --torch-r` animated by WAAPI (open 360 ms ease-out, close 220 ms), with the pointer lerped each frame. A radial mask reveals `.uv`. On keyboard focus the full underdrawing shows.
3. **Swing** (hover/tap): keyframes sampled from a real damped pendulum (√(g/L), e^−2.4t), rotating about the nail (`.hung` sets transform-origin).
4. **Rehang** (view transition): the old work lifts off (rises, shadow grows, fades) and the new one drops onto the nail and settles with a swing.
5. **Red dot** (detail): from scale .9 + 2px blur, overshoot 1.08, settle in 380 ms.
6. **Press**: scale .97.
All respect `prefers-reduced-motion`.

## How the builder should use it
- Hero: `img/hero-salon-lit` full bleed with `img/hero-salon-uv` under a `.torch` (see markup in preview.html). An alternative is `hero-room` with the headline in the empty light pool on the left. Use `<picture>` with avif + webp and 1440/2880 widths.
- Products: `products/product-<id>-lit|uv` as torch pairs. Put the red dot (`extras/sticker-red-dot.svg`) on products that make money: MCP Emails ($782 MRR) and Fun Libs. Retired products go in a "storeroom" strip using `products/retired-*.svg`.
- Live centrepiece: `js/art.js` `animate()` draws a work on a canvas in a framed box. Offer series and hue buttons, and a UV pass toggle.
- 3D: lazy-load `3d/gallery-frame.js` (needs the three@0.170.0 import map shown in its header). It is good for a "the work" section or the 404 page.
- Texture: `extras/grain-256.png` (body `.grain`), `extras/plaster-jade.webp` as wall background, `extras/light-pool.png` behind headings, and tape pieces holding small images to the wall.

## Inventory

| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| brand/mark.svg, mark-on-dark.svg, mark-gilt.svg | Logo mark: nail, taut wire, frame hung at −7°, spark | header, favicon, footers | generated, `src/brand.py` (geometry in Python) | original, Albretsen AS |
| brand/wordmark.svg, wordmark-on-dark.svg | "Albretsen AS" wordmark, Instrument Serif Italic outlined + JetBrains Mono "AS", nail dot on the A | header, OG | `src/brand.py` with fontTools; fonts from github.com/google/fonts (OFL) | OFL glyph outlines; mark original |
| brand/lockup.svg, lockup-on-dark.svg | mark + wordmark | header | `src/brand.py` | original |
| brand/favicon.svg, favicon-180.png | favicon, apple touch icon | `<link rel=icon>` | `src/brand.py`, rsvg-convert | original |
| brand/og-image.jpg | Open Graph 1200×630 | social card | `src/og.html` screenshot via headless Chrome | original |
| brand/palette.json | OKLCH + hex tokens | design tokens | `src/brand.py` (OKLab maths) | original |
| img/hero-salon-lit/uv-{1440,2880}.{webp,avif} | Salon hang of 7 framed generative works, museum lit; UV underdrawing pass | main hero + torch | three.js render (`src/bake.html`) of Poly Haven gilt frame + art.js prints, graded with `grade.py` | original; frame model CC0 |
| img/hero-room-lit/uv-{1440,2880}.{webp,avif} | One gilt "Tension, No. 1" right, empty lit wall left | alt hero with headline space | same | original; CC0 model |
| img/detail-lit/uv-{800,1600}.{webp,avif} | Raking-light close-up of a gilt frame, 4:5 | about section, article headers | same | original; CC0 model |
| img/bust-gels-{800,1600}.{webp,avif} | Marble bust under teal and rose gels, 4:5 | colophon / about / 404 | three.js render of Poly Haven "Marble Bust 01" (https://polyhaven.com/a/marble_bust_01), graded | CC0 model |
| products/product-mcp-emails-lit/uv-{800,1600} | Real MCP Emails logo-mark.svg on mat, gilt frame, wall label | product card + torch | bake.html with `_shared/products/mcp-emails/logo-mark.svg` (unaltered, rendered without tone mapping) | product logo © Albretsen; render original |
| products/product-fun-libs-lit/uv-{800,1600} | Real Fun Libs icon.png (v5), white box frame | product card | `_shared/products/fun-libs/icon.png` | same |
| products/product-toolrails-lit/uv-{800,1600} | Real Toolrails icon.svg, black box frame | product card | `_shared/products/toolrails/icon.svg` | same |
| products/product-harbor-lit/uv-{800,1600} | Real Harbor mark in its banner colours (cream on charcoal), oak frame | product card | `_shared/products/harbor/harbor-mark.svg` (`currentColor` set to its banner cream) | same |
| products/retired-*.svg (7) | Stand-in prints for Luma, Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, Early apps | storeroom strip | generated, `src/stickers.py` | original |
| extras/work-{filaments,tension,weightless,spark,strata}-lit-900.webp | Flat exports of the five generative series | scattered prints, article art, tape-ups | art.js via `src/print.html` | original |
| extras/work-{filaments,tension}-uv-900.webp | UV passes for two of them | torch pairs | art.js | original |
| extras/sticker-red-dot.svg | Gallery "sold" dot | earning products | `src/stickers.py` | original |
| extras/sticker-since-2016.svg | Round stamp "On Google Play since 2016 · Albretsen AS" | about / footer | `src/stickers.py` | original |
| extras/sticker-please-touch.svg | Inverted museum rule sticker | near interactive works | `src/stickers.py` | original |
| extras/sticker-wet-code.svg | "WET CODE, deployed today" | building / changelog / Toolrails | `src/stickers.py` | original |
| extras/wall-label-mcp-emails.svg | Museum wall label template | product facts | `src/stickers.py` | original |
| extras/tape-gaffer.png, tape-masking.png | Torn tape strips with alpha | pin images to the wall | numpy, `src/textures.py` | original |
| extras/light-pool.png | Spotlight scallop with alpha | behind headings/cards (screen/soft-light) | numpy, `src/textures.py` | original |
| extras/plaster-jade.webp | Seamless jade plaster, 1024 | wall background | numpy, `src/textures.py` | original |
| extras/grain-256.png | Seamless grain with alpha | `.grain` overlay | numpy | original |
| 3d/gilt-frame.glb | Poly Haven "Fancy Picture Frame 01" 1k, packed to one GLB (canvas textures dropped) | 3D centrepiece | https://polyhaven.com/a/fancy_picture_frame_01 (gltf 1k from dl.polyhaven.org), packed by `src/pack-glb.mjs` | CC0 |
| 3d/gallery-frame.js | three.js module: frame on a nail, live art.js canvas, drag-to-swing pendulum, hold for UV, double-click to rehang | interactive section | original | original |
| 3d/demo.html | standalone demo | — | original | original |
| js/art.js | Generative canvas-2D engine: 5 series, lit + UV passes, self-drawing animation | live hero/centrepiece | original | original |
| motion.js, motion.css | Signature motion (WAAPI) | site-wide | original | original |
| src/* | Build sources: bake.html (three.js studio), print.html, og.html, brand.py, stickers.py, textures.py, pack-glb.mjs | reproducibility | original | original |

Build notes: renders were baked in headless Chrome (SwiftShader) via `scripts/shot.sh` and graded with a Python/Pillow pass (halation, split tone, matte, lateral CA, vignette, grain). The marble bust GLB (0.9 MB) was used only for the bake and is not shipped. Total kit ≈ 5.4 MB.
