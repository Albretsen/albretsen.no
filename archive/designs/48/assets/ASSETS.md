# Design 48 · Nocturne Select

Asset kit for albretsen.no. Open `preview.html` first: it plays everything.

## Vision

**Every product is a playable character.** The site is a character-select screen. The roster is the products, the cursor is the brand mark, and the toys obey real physics. Everything is soft glossy plastic, rendered in code, lit like a photo studio at night: a black room, one overhead softbox, a magenta light strip on the left and an ion-blue strip on the right. Those two strips are where the brand colour comes from. They show up as reflections on every object.

The personality is **minimal futurist**: few objects, a lot of night, precise light. The arcade idea only shows in the structure (select, P1 pointer, roster, power-on, versus-wipe). There are no pixel fonts, no game clichés, and no machine metaphors.

**Spark words:** *nocturne* (the page is night, and The Met nocturnes sit in the extras), *tension* (the physics pile, the moment a character locks in), *glow* (seams, pools and halos, never neon signage).

**The museum thread:** open-access Met objects (a jasper scarab from about 1800 BC, a Tiffany Favrile vase from 1893, La Farge's *Nocturne* from 1885) are all smooth things that people kept and lit well. They give the plastic a lineage and give the site a texture that a 3D tool alone can't produce.

### Mood and references
- Character-select screens in console fighting games, where you choose, lock in, and a versus transition follows. Used for structure only.
- Inflated or soft 3D renders with clearcoat and studio lighting. Approach from Codrops, *Creating the Effect of Transparent Glass and Plastic in Three.js*: https://tympanus.net/codrops/?p=57089
- three.js MeshPhysicalMaterial (clearcoat, sheen, transmission): https://threejs.org/docs/pages/MeshPhysicalMaterial.html
- Inigo Quilez's SDF functions (polygon SDF, rounded extrusion), used for the raymarched mark: https://iquilezles.org/articles/distfunctions2d/
- GSAP showcase, for page-transition pacing: https://gsap.com/showcase/
- Unicorn Studio, for the restraint of the glow and shader work: https://www.unicorn.studio
- Codrops, *Custom Cursor Effects*: https://tympanus.net/codrops/2019/01/31/custom-cursor-effects/ and Cuberto, *Cursor & Magnetic*: https://cuberto.com/blog/cursor-magnetic-js-component/
- MDN, scroll-driven animations and timeline range names: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations/Timeline_range_names
- matter.js sprite and MouseConstraint patterns (pill demo): https://dev.to/createxp/create-interactive-pill-animation-using-matterjs-20ad
- The Met Open Access (CC0): https://www.metmuseum.org/about-the-met/policies-and-documents/open-access

## Palette (OKLCH, seed hue 324)

| Token | OKLCH | Hex | Role |
|---|---|---|---|
| void | oklch(0.13 0.022 324) | #0b050c | page background |
| stage | oklch(0.17 0.03 324) | #160b17 | panels, floor |
| panel | oklch(0.23 0.035 324) | #251726 | raised UI, buttons |
| line | oklch(0.34 0.04 324) | #423144 | hairlines, grid dots |
| mist | oklch(0.72 0.03 324) | #ae9faf | secondary text |
| paper | oklch(0.965 0.012 324) | #f8f1f8 | primary text |
| **glow** | oklch(0.66 0.27 324) | #dc3aec | the brand: cursor, selection, mark |
| glow-hi | oklch(0.80 0.17 324) | #f295fb | emphasis text, highlights |
| glow-deep | oklch(0.45 0.2 324) | #861192 | gradient floor, shadows of glow |
| ion | oklch(0.82 0.13 205) | #36dcec | the mark's dot, the right rim light |
| cobalt | oklch(0.66 0.19 264) | #588cff | MCP Emails |
| butter | oklch(0.88 0.15 92) | #fbd452 | Fun Libs |
| volt | oklch(0.86 0.18 105) | #e3d612 | Toolrails |
| jade | oklch(0.74 0.15 165) | #1fc893 | Harbor |
| ember | oklch(0.70 0.19 38) | #fd6a3a | reserve |
| lilac | oklch(0.62 0.15 285) | #7f76dc | reserve (Luma) |

**Full spectrum, with discipline.** The page itself is night, very low chroma at hue 324. Glow is the only brand colour. Each product owns exactly one spectrum colour, and only for its plinth seam, stage light and stats. Two spectrum colours never sit next to each other without night between them. The tile bodies in the renders use each product's own brand colours (#2547E5, #FEDF66, #141413, #1b1b1b, #F4EFE6), not ours.

## Type
- **Unbounded 600/700** (Google Fonts, OFL): display, product names, and the wordmark (outlined to paths). Tracking −2.5%. Its wide, rounded forms match the inflated plastic.
- **Geist 400/500** (Google Fonts, OFL): body and UI.
- **Geist Mono 500/600** (Google Fonts, OFL): labels, status chips, stats and the cursor tag. Uppercase, +14% tracking.

`<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700&family=Geist:wght@400;500;600&family=Geist+Mono:wght@500;600&display=swap" rel="stylesheet">`

## Libraries (pinned)
- three.js `0.170.0`: `https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js`, plus `examples/jsm/` (RoundedBoxGeometry, SVGLoader). Load it with the import map in `3d/demo.html`.
- matter.js `0.20.0`: `https://cdn.jsdelivr.net/npm/matter-js@0.20.0/+esm`, loaded lazily by `physics/toybox.js`.
- Lenis `1.1.13`: `https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs` and `lenis.css`, loaded lazily by `motion.js`.
- `3d/mark-sdf.js` and `cursor.js` have no dependencies.

## For the builder
- **Hero:** use the live `3d/select-stage.js`, with `hero/hero-select*` as its poster and fallback (no WebGL, reduced motion, before load). An alternative opener is `hero/hero-mark*` with `3d/mark-sdf.js` live over it. The mark sits on the right third, so text goes on the left.
- **Roster section:** `products/*.webp` cards with `.select-lock` and `data-select="NAME"`, plus a status chip. Retired products go in a quieter row of `products/retired/*.webp`.
- **Physics:** `physics/toybox.js` in a footer or "about" band. The pile starts settled. The "Drop a mark" button spawns brand marks.
- **Cursor:** call `initCursor()` once. Add `data-select="LABEL"` to anything worth locking onto.
- **Motion:** `motion.css` plus `initMotion()`. Use `[data-power]` for entrances, `.roster-rise` for scroll, `.glow-breathe` for the selected item, `motion.wipe(cb)` for section changes, and `[data-roll]` for real figures.
- Place museum extras like photographs in a gallery wall, with the Met credit as a mono caption. Sprinkle the sprites as `.drift` parallax decorations.
- Every motion turns off under `prefers-reduced-motion`. The WebGL modules pause when off-screen.

## Signature animations (motion.css / motion.js)
1. **Power-on** (entrance): a 1px horizontal scan opens to full height, de-blurs, and over-brightens once. Modelled on CRT and arcade boot sequences and Codrops reveal demos.
2. **Select-lock** (hover): the card lifts, its seam turns magenta, it tilts toward the pointer, and the cursor brackets snap around it. Modelled on console select highlights and Cuberto's magnetic cursor.
3. **Glow-breathe** (ambient): the selected item breathes on a 5.5 s cycle.
4. **Roster-rise** (scroll): CSS `animation-timeline: view()`. Cards stand up off the floor from a 18° tilt. Lenis smooths the scroll that drives it. Based on MDN's scroll-driven animations docs.
5. **Versus-wipe** (transition): a diagonal magenta blade crosses the screen, and content swaps at full cover. Modelled on fighting-game versus screens and GSAP showcase transitions.
- Also included: **Stat-roll**, which counts real figures up and keeps their format, and **drift**, a scroll-linked parallax for sprites.

## How the renders are made
Everything visual here was rendered in code. No stock 3D and no AI image generation were used.
- `src/render.html` holds the three.js studio scenes (hero-select, portraits, resin ghosts, sprites). It uses `3d/studio.js`: a lightformer PMREM environment, MeshPhysicalMaterial plastic with clearcoat and sheen, a soft-shadow spotlight, and magenta/ion rim lights.
- `3d/mark-sdf.js` is a raymarched SDF of the mark: a 2D polygon core, inflated by a 0.17 rounded extrusion, with analytic lightformers, soft shadows, AO and a blurred floor reflection.
- `src/bake.sh` / `src/bake-all.sh` screenshot those pages with headless Chrome (SwiftShader) at DPR 2. `src/encode.py` (Pillow) writes WebP/AVIF at 2x, 1x and small sizes.
- `src/mark.mjs` generates the mark (rounded polygon) and the wordmark (Unbounded 600, outlined with opentype.js). `src/glyphs.py` generates the retired stand-in glyphs, `src/extras.py` the SVG extras and the grain, and `src/museum.py` the treatments of the Met images.
- To re-bake, run `python3 -m http.server 6048 --bind 127.0.0.1` from the repo root, then `sh designs/48/assets/src/bake-all.sh <tmp>` and `python encode.py <tmp> designs/48/assets`.

## Inventory

| File | What it is | Use on the site | Source | Licence |
|---|---|---|---|---|
| identity/logo-mark.svg | The Selector mark: a rounded Λ (the A, and the P1 pointer) with an ion dot, gradient version | header, large brand moments | hand-authored SVG (src/mark.mjs) | own work |
| identity/logo-mark-flat.svg, logo-mark-mono.svg | flat two-colour and currentColor versions | small sizes, inline UI | hand-authored | own work |
| identity/logo-wordmark.svg | mark plus "albretsen" outlined in Unbounded 600, for dark backgrounds | header, footer, OG | src/mark.mjs, Unbounded (OFL) outlined with opentype.js | own work, font OFL |
| identity/logo-wordmark-ink.svg, -mono.svg, logo-word-only.svg | variants for paper, currentColor, and the word alone | light surfaces, inline | same | same |
| identity/favicon.svg, favicon-32.png, apple-touch-icon-180.png | mark on a night tile | favicon, touch icon | hand-authored, rsvg-convert | own work |
| identity/cursor.svg | static cursor art (tilted mark) | CSS `cursor:` fallback | hand-authored | own work |
| identity/mark-3d(.webp/.avif, @2x) | the inflated mark, raymarched, square | about, 404, social avatar | 3d/mark-sdf.js, baked | own work |
| identity/og-image.png | Open Graph card, 1200×630 | `og:image` | src/og.html, screenshot | own work |
| hero/hero-select(-sm, @2x).webp/.avif | four live products on glowing plinths, Fun Libs selected | hero poster and fallback for the live stage | three.js render (src/render.html) | own work; product logos belong to their products |
| hero/hero-mark(-sm, @2x).webp/.avif | the inflated mark among glossy toys, nocturne floor | alternative hero, section opener | 3d/mark-sdf.js render | own work |
| products/mcp-emails, fun-libs, toolrails, harbor (.webp, @2x) | each real product icon inlaid in a puffy tile in its own brand colour, on a plinth lit in its spectrum colour (4:5) | roster cards | three.js render using the untouched logos from designs/_shared/products | own render; logos are Asgeir's products |
| products/retired/luma.webp | the real Luma logo suspended in smoked resin | retired row | render, real logo.png | as above |
| products/retired/{polyglot-pilot, pinpoint, webvakt, joke-central, tryggere-hyring, early-apps}.webp | stand-in glyphs (speech bubbles, pin, eye, grin, shield-check, %) glowing in smoked resin | retired row | render from products/retired/glyphs/*.svg | own work |
| products/retired/glyphs/*.svg | flat stand-in glyphs (currentColor) | small icons in lists | hand-authored (src/glyphs.py) | own work |
| physics/sprites/*.webp | eight transparent glossy toys (mark, spheres in glow/ion/jade, pills in pink/cobalt, torus, cube) | matter.js bodies, floating decoration | three.js / SDF renders | own work |
| physics/toybox.js, physics/demo.html | 2D physics pile with grab, throw, spawn and shake | centrepiece band | matter.js 0.20.0 (MIT) | own code |
| 3d/studio.js | shared three.js studio: environment, materials, character, plinth, mark, glyphs, primitives | used by everything 3D | own code on three.js (MIT) | own code |
| 3d/select-stage.js, 3d/demo.html | the live character-select stage (click, arrow keys, drag to spin) | hero | own code | own code |
| 3d/mark-sdf.js, 3d/mark-demo.html | raymarched inflated mark that leans toward the pointer (WebGL2, no deps) | hero overlay, about | own code; SDF formulas after Inigo Quilez | own code |
| extras/met-vase-nocturne(.webp, @2x) | Louis C. Tiffany, *Vase*, Favrile glass, 1893 (Met 9412), as a magenta night duotone | gallery wall, "craft" section | https://www.metmuseum.org/art/collection/search/9412 (image ADA4859.jpg) | CC0 (Met Open Access) |
| extras/met-lafarge-nocturne(.webp, @2x) | John La Farge, *Nocturne*, about 1885 (Met 11380): a morning glory glowing at night, cropped and deepened | "after hours" section, blog header | https://www.metmuseum.org/art/collection/search/11380 (image DT256385.jpg) | CC0 (Met Open Access) |
| extras/met-scarab(.webp, @2x) | green jasper scarab, Middle Kingdom to Second Intermediate Period, about 2030–1550 BC (Met 545636), cut out with alpha | floating sticker, "glossy objects" aside | https://www.metmuseum.org/art/collection/search/545636 (image LC-19_3_156_EGDP025540.jpg) | CC0 (Met Open Access) |
| extras/badge-since-2016.svg | circular sticker "On Google Play since 2016 · Albretsen AS" | about section, footer | hand-authored (src/extras.py) | own work |
| extras/chip-{live, building, paused, retired}.svg, tag-p1.svg | status chips and the P1 tag | roster cards, selection | hand-authored | own work |
| extras/pattern-select-grid.svg | tileable dot grid with one magenta crosshair (192 px) | section backgrounds | hand-authored | own work |
| extras/orbit-rings.svg | glowing selection orbit in perspective | behind a selected product, dividers | hand-authored | own work |
| extras/grain-256.png | 256 px noise tile | `body::before` overlay at about 5% | generated (numpy, seed 0xbbc66a) | own work |
| motion.css, motion.js | five named signatures plus stat-roll and drift | site-wide | own code; Lenis 1.1.13 (MIT) | own code |
| cursor.js | brand cursor: tilted mark plus snapping corner-bracket reticle with label | site-wide (fine pointers only) | own code | own code |
| preview.html | contact sheet | client and builder review | own | own |
| src/* | bake, encode and generator scripts (render.html, bake*.sh, encode.py, mark.mjs, glyphs.py, extras.py, museum.py, og.html) | reproducing the kit | own | own |

Total size is about 2 MB.
