# Uranographia: asset kit for Albretsen AS (design 33)

Start with `preview.html` (serve the repo root, then open `/designs/33/assets/preview.html`; add `?noloader` to skip the loader, or `?only=products,extras` to show only those sections).

## Vision

The site is a star atlas, and every product in it is a constellation. Each figure is drawn from that product's own fact: 17 stars for MCP Emails' 17 tools, 113 cluster stars for Fun Libs' 113,000 installs, 549 dust points for Harbor's 549 commits, and 4 bright feeder stars for Toolrails' 4 connectors. This makes the art direction data-as-art: the chart is the sky. A **Sky / Ledger** toggle morphs the same stars into a dated star catalogue, a second reading of the same numbers, and that morph is the centrepiece. The retired products are not hidden. They are kept as *constellationes obsoletae*, the way 17th-century atlases kept constellations that astronomers had stopped using. That is honest, and it reads as editorial.

**Mood.** It should feel like editorial gravitas in the dark: 19th-century observatory plates, engraved title cartouches, catalogue numbers set in tracked mono. The person behind it should come across as calm, exact and prolific. There is no industrial or nautical metaphor, and no finance styling: the only instrument is the eye, and the only machinery is the data.

**Spark words.** *Fracture*: the loader's lines arrive broken and morph whole. *Vector*: the mark's crossbar runs on as a dotted trajectory. *Gravity*: dust falls into the mark, and the pointer acts as a mass that stars lean toward.

### References
- Radix Primitives: https://www.radix-ui.com/primitives. Measured-height collapsibles (`--radix-accordion-content-height`) and a ToggleGroup, used for *Ephemeris* and *Reading*.
- Apple MacBook Pro: https://www.apple.com/macbook-pro/. Start-frame/end-frame reveals, adapted as *Plate rise* (clip-path plus a blur settle).
- Poly Haven: https://polyhaven.com. Looked at for grounds, but rejected in favour of real observatory plates. A photographic HDRI would have read as stock.
- Dribbble popular: https://dribbble.com/shots/popular. Current UI density checks; we deliberately went quieter.
- Codrops page-preloading effect: https://tympanus.net/codrops/?p=19535. Progress tied to real load. The *Ignition* counter follows that rule.
- Stroke-dashoffset line drawing: https://dev.to/paulryan7/simple-svg-drawing-effect-with-stroke-dasharray-stroke-dashoffset-3m8e (pathLength = 1 normalisation).
- SVG path morphing: https://motion.dev/tutorials/js-svg-path-morphing and https://www.quackit.com/svg/animations/tutorial/svg_smil_morphing.cfm. Morphs need an identical command structure, which our fractured and whole paths share.
- Data humanism (Giorgia Lupi) and Federica Fragapane: https://en.wikipedia.org/wiki/Giorgia_Lupi. Hand-drawn quantity, every mark meaning something.
- Andreas Cellarius, *Harmonia Macrocosmica* (1660): https://publicdomainreview.org/collections/all/theme/astronomy-and-space

## Palette (OKLCH, all greys at hue 312)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| `--u-night` | oklch(0.145 0.006 312) | #0b090c | page ground |
| `--u-deep` | oklch(0.185 0.008 312) | #141215 | raised plates, tiles |
| `--u-slate` | oklch(0.245 0.009 312) | #221f24 | wells, inputs, tile edges |
| `--u-rule` | oklch(0.36 0.010 312) | #3f3c41 | hairlines, graticule |
| `--u-dim` | oklch(0.55 0.010 312) | #737076 | tertiary text, retired figures |
| `--u-haze` | oklch(0.74 0.008 312) | #aca9ae | secondary text, labels |
| `--u-vellum` | oklch(0.94 0.006 312) | #eceaee | primary text, star ink |
| `--u-paper` | oklch(0.975 0.004 312) | #f8f6f9 | light grounds (logo-on-paper only) |

**Colour comes only from imagery.** These four were sampled from the plates and are documented for captions. Never use them as UI fills:
vermilion oklch(0.611 0.166 33) #d4553c (Cellarius Scorpio) · verdigris oklch(0.657 0.068 187) #5e9f98 (Cellarius Eridanus) · ochre oklch(0.753 0.132 96) #c8ae3e (Haeckel) · nucleus oklch(0.575 0.122 357) #b0577a (Haeckel; the only hue near the 312 seed). Product logos keep their own colours.

Tokens and easings are in `tokens.css`: `--u-ease-out` (expo-out, arrivals), `--u-ease-inout` (morphs), `--u-ease-orbit` (slight overshoot).

## Typefaces (all SIL OFL, Google Fonts)
- **Instrument Serif** (Regular, Italic): display and figure names, 48–140px, line-height .86–.95, tracking −0.015em. The italic is for the second clause of a headline, set in `--u-haze`.
- **Geist** (300–600): reading text. Light 300 at 17–18px for the lede, Regular 400 for captions.
- **Geist Mono** (400/500): every number and catalogue label, 10–11px uppercase, +0.14–0.22em tracking.
- Load: `https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300..600&family=Geist+Mono:wght@400;500&display=swap`
- The wordmark and lockup are outlined paths (Instrument Serif and Geist Mono via opentype.js), so they need no webfont.

## Interactive and motion modules (no dependencies, ES modules)
- `js/uranographia.js`, the **centrepiece**. `mountChart(host)` returns `{ setReading('sky'|'ledger'), toggle(), destroy() }`. It draws a planisphere with the 4 live figures and the 7 obsolete figures on the rim. In the Sky reading, the pointer is a mass that pulls nearby stars (spring physics), and hovering or focusing a figure redraws its lines. In the Ledger reading, every star animates (WAAPI, staggered) into a dated catalogue table: one row per product, a star at its first year, then its own stars laid out as a unit strip. Demo: `demo-chart.html` (`?reading=ledger`, `?still`).
- `js/globe.js`, an interactive **3D celestial globe** drawn entirely in SVG. It carries all 716 catalogue stars plus 260 unnamed background stars. Drag to turn it; it spins on with inertia and then settles into a sidereal drift. `focus(id)` turns a product toward the viewer.
- `js/motion.js` exports `ignite()`, `rise()`, `precess()`, `morph()` and `drawOn()`. `motion.css` holds the CSS halves. Demo: `demo-ignition.html` (`?t=1400` freezes the choreography at 1,400 ms for inspection).
- `js/sky-data.js` holds the figure geometry and the facts behind it, plus `logoURL()`. `js/draw.js` holds the shared SVG primitives (atlas-style gapped lines, sparkle stars, graticule).

### The seven named movements (motion study)
1. **Ignition** (loader, the signature delight). Dust falls under gravity (ease-in) into the six stars of the asterism. The five lines arrive *fractured* and morph whole (WAAPI `d: path()`, with a JS fallback for Safari). The dotted vector runs out, the wordmark rises out of blur, and then the whole night collapses into the apex star (`clip-path: circle()` shrinking to that star). A mono counter reads `0000 / 0716 stars`: the true total of figure stars (54) and field stars (113 + 549). It is tied to real readiness: minimum 2.3 s, maximum 6 s. Under reduced motion it becomes a plain fade.
2. **Plate rise** (entrance). The image clips up from a hairline, scales 1.04 to 1, and goes from blur(10px) to sharp. It uses IntersectionObserver plus WAAPI, or CSS `animation-timeline: view()` where supported.
3. **Lensing** (hover). The card's lens ring turns −12° on an overshoot curve, and the figure lines redraw via stroke-dashoffset, staggered 45 ms.
4. **Twinkle** (idle). The brightest star turns 45° and dims to 70% on a 5.5 s cycle, speeding up to 1.4 s when its link is hovered.
5. **Ephemeris** (Radix Accordion and Collapsible). Content opens to `--radix-accordion-content-height` while a mask sweeps down it, and the trigger star turns into a cross. Use it with `@radix-ui/react-accordion` by giving `Accordion.Content` the class `u-ephemeris`.
6. **Precession** (page or section transition). The whole sky turns 7° about the apex star. `document.startViewTransition`, with WAAPI on `::view-transition-old/new(root)` via `pseudoElement`.
7. **Reading** (Radix ToggleGroup). A sliding vellum pill on an overshoot curve, styled with `:has()`.

## Inventory

| File | What it is | Intended use | Source | Licence |
|---|---|---|---|---|
| identity/mark.svg | Asterism A: an A as a constellation, with a dotted vector from the crossbar | nav, loader, favicon base | hand-authored (source: node + opentype.js generator, geometry in js/mark-geometry.json) | original |
| identity/mark-ring.svg | Mark inside a planisphere ring with a degree scale | seal, footer, 404 | hand-authored | original |
| identity/wordmark.svg | "Albretsen" in Instrument Serif outlines + "AS" in Geist Mono + a small star | header on light, documents | generated (opentype.js) | original; fonts OFL |
| identity/lockup.svg | Mark + wordmark, horizontal, currentColor | site header (use `filter: invert(1)` or inline) | generated | original |
| identity/favicon.svg | Vellum mark on a night tile, rx 14 | favicon | hand-authored | original |
| identity/apple-touch-icon.svg / -180.png | Same, square, 180px PNG | iOS home screen | rsvg-convert | original |
| identity/og-1200x630.jpg | Open Graph card: lockup, "Software that pays for itself.", the four figures over Orion | social sharing | baked from source/compose.html?plate=og (headless Chrome at DPR 2) | original + PD plate |
| hero/orion-wide-{1200,2400}.{webp,avif} | Trouvelot, *The Great Nebula in Orion* (1875), 21:9 crop, regraded to tinted greys, vignetted | full-bleed hero ground, behind the chart | https://commons.wikimedia.org/wiki/File:Trouvelot-_The_great_nebula_in_Orion_-_1875.jpg (NYPL TROUVELOT_015) | Public domain |
| hero/orion-plate-{1000,2000}.webp | Same plate, full 4:3 | MCP Emails plate ground, section grounds | as above | Public domain |
| hero/hercules-square-{800,1600}.{webp,avif} | Trouvelot, *Star Cluster in Hercules* (1877), square crop | mobile hero, Fun Libs | https://commons.wikimedia.org/wiki/File:Trouvelot_-_Star_clusters_in_Hercules_-_1877.jpg (NYPL TROUVELOT_014) | Public domain |
| hero/atlas-still-{1200,2400}.webp, -2400.avif | Baked still of the live chart over Orion | poster frame / no-JS hero | baked from demo-chart.html?still | original + PD |
| products/mcp-emails-plate-{600,1200}.webp | Tab. I *Epistula Machinae*: 17-star envelope over Orion; real MCP Emails mark in the lens | product card / section | compose.html; logo from designs/_shared/products/mcp-emails/logo-mark.svg (unaltered) | original + PD + client logo |
| products/fun-libs-plate-{600,1200}.webp | Tab. II *Lacunae Ludentes*: the icon's two bars as star rows, with 113 cluster stars; real Fun Libs v5 icon | product card | compose.html; fun-libs/icon.png | as above |
| products/toolrails-plate-{600,1200}.webp | Tab. III *Semitae Instrumentorum*: rails and chevron, with 4 bright feeders, over the November Meteors | product card | compose.html; toolrails/icon.svg | as above |
| products/harbor-plate-{600,1200}.webp | Tab. IV *Portus Memoriae*: the Harbor outline with 549 dust points, over Saturn (paused) | product card | compose.html; harbor/harbor-mark.svg | as above |
| products/obsoleta/{luma,polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}.webp | Retired products as obsolete-constellation medals (480px, alpha). Luma carries its real logo.png; the others are stand-ins in the house style (PinPoint has 16 stars for 16 commits) | "retired" list / archive | compose.html?plate=obs-<id> | original (Luma logo: client) |
| extras/cellarius-disc-1100.webp | Cellarius, *Haemisphaerium Stellatum Boreale Antiquum* (1660), the hemisphere cut to a disc (alpha) | rotating ornament (240 s per turn), about / colour moment | https://commons.wikimedia.org/wiki/File:Cellarius_Harmonia_Macrocosmica_-_Haemisphaerium_Stellatum_Boreale_Antiquum.jpg | Public domain |
| extras/cellarius-boreale-1200.webp | Same plate, full spread | writing / posts header | as above | Public domain |
| extras/haeckel-tafel71-900.webp | Haeckel, *Kunstformen der Natur* Tafel 71, Stephoidea (1904), BHL scan | full-colour plate, writing index, 404 | https://commons.wikimedia.org/wiki/File:Kunstformen_der_Natur_(Tafel_71)_BHL47388339.jpg (Biodiversity Heritage Library) | Public domain |
| extras/specimen-{crown,lattice,binary}.webp | Three radiolarians cut from Tafel 71 (luminance-keyed alpha) | floating objects in margins, loading-adjacent ornaments, "day job" section | derived from the BHL scan above | Public domain |
| extras/beardsley-new-star-light.webp | Aubrey Beardsley, *The New Star* (1896): a figure holding up a star, ink keyed to alpha (vellum) | the person / about section; recolour via CSS mask-image | https://www.oldbookillustrations.com/illustrations/new-star/ (Old Book Illustrations) | Public domain (artist d. 1898) |
| extras/saturn-plate-{900,1800}.webp | Trouvelot, *The Planet Saturn* (1874) | Harbor / "paused" section | https://commons.wikimedia.org/wiki/File:Trouvelot_-_The_planet_Saturn_-_1874.jpg (NYPL TROUVELOT_010) | Public domain |
| extras/meteors-portrait-{600,1200}.webp | Trouvelot, *The November Meteors* (1868), 3:4 | Toolrails, writing, contact | https://commons.wikimedia.org/wiki/File:Trouvelot-_The_November_meteors._-_1868.jpg (NYPL) | Public domain |
| extras/ephemeris.svg | Orbit diagram: one ring per year from 2016 to 2026; products and milestones on the ring of the year they began | history / about. Inline it so the fonts apply | hand-authored generator: source/ephemeris.mjs | original |
| extras/pattern-graticule.svg | 160px repeatable atlas grid tile | section grounds, footer | hand-authored | original |
| extras/grain-256.webp | Seeded noise tile (seed 0xc4bb0d) | overlay at 6–20% (mix-blend overlay) | generated (numpy) | original |
| js/uranographia.js, js/globe.js, js/motion.js, js/draw.js, js/sky-data.js | Chart, globe, motion and data modules | see above | hand-written | original |
| tokens.css, motion.css | Tokens and motion CSS | import on every page | hand-written | original |
| demo-chart.html, demo-ignition.html | Tiny demos | reference | hand-written | original |
| source/compose.html | Compositor that bakes plates, OG and medals (`?plate=<id>`) | re-bake if facts change | hand-written | original |

**Processing.** Plates were cropped automatically to the dark image area (margins and captions removed), mapped from luminance onto a ramp from #0e0c10 to #eeecf1, vignetted, and encoded with Pillow (webp q78–80, avif). Colour plates (Cellarius, Haeckel) keep their original colour. Total kit size is about 4 MB.

## Rules for the builder
- Do not redraw or recolour product logos. They appear only inside the lens on a vellum disc, or as-is.
- All numbers come from `designs/_shared/content.js`. If a fact changes, update `js/sky-data.js` and re-bake with `source/compose.html`.
- Never fill UI with colour. If a section needs colour, place a plate in it.
- Keep the atlas convention: figure lines stop short of stars.
- Never use "hire me", "let's connect" or "passionate". The catalogue and the work do the talking.
