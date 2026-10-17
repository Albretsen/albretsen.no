# Design 84 — "Orbit Issue" asset kit

## Vision
Albretsen AS is published like a loud, beautiful **magazine that follows the sun**. Every cover shows the same Norwegian view: a flat-topped fjord wall, ranks of sharp peaks, a conifer shore and still water. It is painted as a **grainy-gradient illustration** in an infrared palette of violet, magenta, ember and apricot. A ringed sun hangs over the fjord: the planet-like rings are the one "technology" sign, an orbit, with the products as satellites.

The edition on the newsstand is whatever the sun is doing over Norway **right now**: **Nocturne**, **Dawn**, **Orbit** (zenith) or **Dusk**. `js/oslo-sun.js` works this out from the sun's real altitude over Oslo. Open the cover (a View Transition page turn) and the products are the features inside. They are pull-out cards you can drag, throw, flip and re-stack with spring physics.

The tone is loud and proud: a huge condensed masthead whose letters the mountains bite into. Each screen still carries one idea, and the layout leaves generous dark space around it. The landscape sets the atmosphere and the subject is still the software. The covers never name a place.

Spark words used: *nocturne* (night edition), *orbit* (rings, satellites, day edition), *dawn* (the default and OG edition).

### Mood and references (researched)
- https://animations.dev: spring vs. easing, orchestration, "when not to animate". I used it to tune the stack springs and the stagger.
- https://frontendmasters.com/blog/grainy-gradients/: feTurbulence grain, why grain kills banding, keep strength under 50%. The paintings dither every gradient transition with noise, which gives the stippled look.
- https://instantgradient.com/blog/grainy-gradients: overlay-blend grain layer. This is the `grain-tile.png` approach.
- https://www.smashingmagazine.com/2023/12/view-transitions-api-ui-animations-part1/ and https://tylergaw.com/blog/view-transitions-first-experiments-mpa/: shared-element morphs and custom `::view-transition-old/new` keyframes. These became COVER LIFT and EDITION WIPE.
- https://motion.dev/magazine/a-view-transitions-api-for-the-rest-of-us: interruptible, spring-driven morphs.
- Spring-model notes (stiffness/damping ranges, critical damping c = 2√(km)) from the Framer Motion / react-motion docs found while searching. The constants are in `js/cover-stack.js`.
- https://polyhaven.com (HDRI chosen with salt digit `e`: index 14 of the sunrise-sunset category, *Belfast Sunset Pure Sky*) and https://ambientcg.com (salt digit `5`: *Paper005*).
- I also checked godly.website, community.spline.design and shadertoy.com for direction: editorial grain, ringed primitives and dither-in-shader. The live sun's grain is a screen-space hash dither in its fragment shader.

## Palette (OKLCH, seed hue 216°)
| Token | OKLCH | Hex | Use |
|---|---|---|---|
| Ink | oklch(.16 .07 292) | #0f0428 | page background, deepest shadow |
| Violet | oklch(.36 .16 300) | #4c1b82 | panels, upper sky |
| Magenta | oklch(.62 .24 352) | #e72395 | infrared foliage, accents, big figures |
| Ember | oklch(.72 .18 45) | #fd7933 | sun, stickers, links on hover |
| Apricot | oklch(.86 .11 65) | #ffc282 | kickers, small highlights |
| Cream | oklch(.96 .03 80) | #fdf0dc | type, sun core, paper |
| Fjord 216 (seed) | oklch(.58 .13 216) | #008cab | night rim light, one cool accent (use sparingly) |
| Night | oklch(.12 .05 262) | #000418 | Nocturne edition background |

## Type (all SIL Open Font License, latin subset woff2 from Google Fonts)
- **Bricolage Grotesque** variable (opsz 12–96, wdth 75–100, wght 200–800): masthead and headlines at 800 / width 75 / opsz 96, uppercase, tracking −0.01em. `fonts/bricolage-grotesque-var.woff2`
- **Instrument Serif** regular and italic: cover lines and pull quotes, always italic for cover lines. `fonts/instrument-serif*.woff2`
- **Instrument Sans** variable 400–700: body copy. `fonts/instrument-sans-var.woff2`
- **JetBrains Mono** variable: kickers, figures, the MCP command. `fonts/jetbrains-mono-var.woff2`

## How the hero is meant to be built
1. `<picture>` with `hero/cover-{edition}-sky-{1080,1600}.avif` (WebP 1080 fallback), absolute, `object-fit: cover`.
2. The masthead in live HTML type (motion: MASTHEAD RISE), placed so its lower edge sits around 40% of cover height. The mountains then bite into the letters. Zenith needs it higher (about 21% top), because its horizon is higher.
3. `<picture>` with `hero/cover-{edition}-land-*.avif` (alpha cut-out) on top.
4. The full-bleed alternative is `hero/stage-{edition}-sky/land-2400.avif`, with the live `3d/orbit.js` canvas sandwiched between them. The stage sky has no painted sun, so the 3D sun replaces it.
5. `extras/grain-tile.png` overlay (motion: FILM GRAIN TICK), opacity about 0.2, `mix-blend-mode: overlay`.

Every `<img>` carries width and height. First-paint cost at 1600w is about 85 KB sky plus about 115 KB land in AVIF. Load the 3D only when it scrolls into view.

## Motion (assets/motion.css + motion.js + js/cover-stack.js)
1. **COVER LIFT**: a View Transition. The old cover snapshot swings open around its left spine (`perspective(1800px) rotateY(-112deg)`, darkening). The spread settles in on a firm spring. `openCover()` / `closeCover()`.
2. **EDITION WIPE**: a View Transition. The new edition grows as a `clip-path: circle()` from the sun or sticker position. `switchEdition()`.
3. **MASTHEAD RISE**: letters rise out of a clipped horizon on a bouncy spring baked into CSS `linear()` (k 170, c 14), with a 55 ms stagger. `splitMasthead()`.
4. **FILM GRAIN TICK**: the grain tile re-rolls with `steps(12)` per second, so it reads as film rather than video noise.
5. **SATELLITE**: a dot on an `offset-path: ellipse()` orbit that dims and shrinks on the back half.
6. **STACK SPRING** (centrepiece, JS): drag, throw, flip and re-stack product cards. A semi-implicit Euler spring per property: position k 260 / c 24, rotation 180 / 18, flip 140 / 16 (heavier, like card stock). A flick over 900 px/s or a drag past 30% of the width throws the card to the bottom. Keys: ← → to cycle, Enter or Space to flip. All of it is disabled under `prefers-reduced-motion`.

## Signature delight
`js/oslo-sun.js` computes the sun's altitude over Oslo (NOAA simplified solar position, no network). It picks the edition: below −6° is Nocturne, above 8° is Orbit, and anything between is Dawn before solar noon or Dusk after it. It sets `data-edition`, `--sun-alt` and `--sun-y` (used to raise or lower the live 3D sun). Add `?edition=` to force an edition.

## Inventory
| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| identity/mark.svg | Badge: grainy sky, sun, asymmetric peaks, orbit ring and moon | logo, avatar | hand-written SVG | own work |
| identity/mark-mono.svg | Single-colour mark (currentColor) | small and inline use, print | hand-written SVG | own work |
| identity/mark-512.png | Raster mark | social avatar | rsvg-convert of mark.svg | own work |
| identity/wordmark.svg | "ALBRETSEN" + italic "AS" as outlined paths (currentColor) | masthead, nav | fontTools glyph outlines of Bricolage Grotesque / Instrument Serif | own work; fonts OFL |
| identity/lockup.svg | Mark + wordmark | header, documents | composed | own work |
| identity/favicon.svg | Mark with a heavier ring | favicon | hand-written SVG | own work |
| identity/apple-touch-icon-180.png | 180 px touch icon on Ink | iOS home screen | rsvg-convert | own work |
| identity/og-image.jpg | 1200×630: dawn orbit still, masthead behind the peaks | Open Graph / Twitter | PIL composite of hero assets | own work |
| hero/cover-{nocturne,dawn,zenith,dusk}-{640,1080}.{avif,webp}, -1600.avif, -1080.jpg | Flattened 4:5 covers, one per edition | thumbnails, cards, fallback hero | procedural painting (numpy, OKLab ramps, value noise, ridged 1-D fractal mountains, grain dithering), `paint.py` | own work |
| hero/cover-*-sky-{1080,1600}.avif (+1080.webp) | Sky layer with sun and rings | hero back layer | same | own work |
| hero/cover-*-land-{1080,1600}.avif (+1080.webp) | Mountains, trees and water with alpha | hero front layer (masthead sits between) | same | own work |
| hero/spread-*-1400.{avif,webp}, -2400.avif | 2:1 panoramas | inside-cover spread, wide hero | same | own work |
| hero/stage-*-{sky,land}-2400.avif | 2:1 layers without the painted sun | backdrop for the live 3D orbit | same | own work |
| hero/orbit-{zenith,dawn,nocturne}-1200.{avif,webp}, -2000.avif | three.js orbit baked over the painted stage | still hero, 3D fallback | headless-Chrome render of 3d/orbit-demo.html?still=1 | own work |
| products/{mcp-emails,fun-libs,toolrails,harbor}-card-{500,1000}.{avif,webp} | Pull-out cards: the real product logo rises like a sun over a painted fjord, rings behind it, light grain | product stack, product pages | painting + REAL logos from designs/_shared/products (icon.png, icon.svg, harbor-mark.svg in #f2efe8 on #1a1a1a as in its banner), unchanged apart from corner rounding on the square Fun Libs icon | logos © Albretsen AS; artwork own work |
| products/retired-*.webp (7) | 360 px "set sun" stamps: the sun half sunk below the horizon, with a monogram and year. Luma uses its real logo.png | retired products list | numpy + PIL; Luma logo from _shared | own work |
| extras/grain-tile.png | 256 px Gaussian grain | overlay grain (FILM GRAIN TICK) | numpy | own work |
| extras/paper-cream-512.jpg, paper-violet-512.jpg | Tileable paper, graded | fact-sheet backs, blog body | ambientCG **Paper005** colour map, regraded — https://ambientcg.com/view?id=Paper005 | CC0 |
| extras/sticker-{dawn,nocturne,zenith,dusk}.svg | Starburst edition stickers with outlined text | cover sticker, edition badge | hand-written SVG + fontTools outlines | own work |
| extras/barcode.svg | Decorative issue barcode, "N°1", years 2016 2021 2026 (Play, consulting, company) | footer, back cover | generated SVG | own work |
| extras/horizon-divider.svg | Hairline horizon with a half-set sun and an orbit | section break | hand-written SVG | own work |
| extras/stars-tile-512.png | Transparent sparse star field | Nocturne sky overlay | numpy | own work |
| 3d/orbit.js | Live three.js scene: grain-dithered gradient sun, 3 tori, a dotted outer ring, 4 product satellites (MCP Emails, Fun Libs, Toolrails, Harbor), drag-to-spin with spring return, `setEdition()` | live hero / section | own code; three@0.169.0 from jsDelivr | own work; three.js MIT |
| 3d/orbit-demo.html | Demo: stage sky + orbit + land + grain, edition buttons | demo, still baking (`?still=1`) | own code | own work |
| 3d/env-belfast-sunset-infrared.jpg | 1024×512 equirect env map, regraded infrared | orbit.js environment | Poly Haven **Belfast Sunset (Pure Sky)** 1k HDR, decoded and tone-mapped in Python — https://polyhaven.com/a/belfast_sunset_puresky | CC0 |
| js/oslo-sun.js | Solar position over Oslo, edition picker | signature delight | own code | own work |
| js/cover-stack.js | Spring-physics drag/flip/stack | product centrepiece | own code | own work |
| motion.css / motion.js | 5 named animations + helpers | site-wide motion | own code | own work |
| fonts/*.woff2 | Bricolage Grotesque, Instrument Sans, Instrument Serif (+italic), JetBrains Mono (latin) | type | fonts.gstatic.com (Google Fonts) | SIL OFL 1.1 |
| preview.html | Contact sheet: live cover with editions and cover lift, every asset, palette, type, motion, live 3D | review | own code | own work |

## Notes for the builder
- Product facts come from `designs/_shared/content.js`; preview.html imports it, as the site should. Don't invent numbers.
- The grain on the paintings is partly baked (stipple in the gradients) and partly live (grain tile), which keeps the AVIFs small. Don't add a second heavy grain.
- The infrared tint shifts the satellite colours in the 3D scene. The cards are where the true logo colours live.
- Avoid stripes-and-palms synthwave clichés. The 80s horizon stripes appear only on the small retired stamps, and only as a sun reflection.
