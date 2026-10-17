# Kit 58 · Specimen Drop

Open `preview.html` first. It is the contact sheet: palette, type, every asset, the live geode and the motion demos. `?only=<section>` shows one section: palette, type, identity, heroes, products, extras or motion.

## Vision

**A product-drop page for a company, not a product.** Albretsen AS is shown as a cabinet of specimens. Each product is something grown, collected and mounted, and the site works like the release of a new specimen plate. The centrepiece is a live lapis-lazuli geode built in three.js, and **every crystal on it is a product**:

- The four current products are the big points: MCP Emails, Fun Libs, Toolrails and Harbor.
- The retired products are the small ones.

Visitors can turn the stone and pull a crystal off to re-seat it elsewhere. Every move runs on a hand-rolled spring.

The art direction is **public-domain natural-history illustration re-inked in one saturated ultramarine** (OKLCH hue 264):

- Haeckel's diatoms and radiolarians become vellum line work on lapis.
- A Victorian fern engraving becomes a cyanotype-like plate.
- An 1840s mineral plate gives us real gems. It also tells the colour's story: ultramarine pigment was made from lapis lazuli.

Redouté's rose adds the warm, human note: rosehip red and leaf green against all that blue.

The tone is warm and human, but precise. The type is a soft, slightly wonky serif (Fraunces SOFT 100, WONK 1). Labels sit in a mono, the way specimen numbers do on museum cards. There are no gears, ships or finance tropes. The metaphor is the naturalist's cabinet, and the technology shows through the live 3D, the spring physics and the data on each card.

**Spark words** turned into concepts:

- **Crystal**: the geode, the cut-stone A, and the crystal-habit drawings.
- **Velocity**: the springs, and how quickly things settle.
- **Tide-free**: still water. Nothing nautical, just calm and settled.

### Mood and references

- Ernst Haeckel, *Kunstformen der Natur* (1904). Diatomea, Spyroidea, Discoidea: https://commons.wikimedia.org/wiki/File:Haeckel_Diatomea.jpg
- Hand-tinted mineral plate, Tab. II (1840s): https://commons.wikimedia.org/wiki/File:Plate_II-_Topaz,_Garnet,_Vesuvian,_Idocrase,_Chrysolite,_Olivine,_Pistacite,_Epidote,_Turquoise,_Johnite,_Calamite,_Lazulite,_Lapis_Lazuli_-_DPLA_-_415604fa3a078b721e4f08807dc73042.jpg
- Redouté, *Les roses* (1817), via Old Book Illustrations: https://www.oldbookillustrations.com/illustrations/kamchatka-rose/
- Sowerby, *British Mineralogy* on BHL, for the "visible solid, hidden dashed" crystal-drawing convention: https://www.biodiversitylibrary.org/item/128814
- Cyanotype botanicals: white plant silhouettes on Prussian blue. These became the duotone method.
- Spring physics: Maxime Heckel, "The physics behind spring animations" (https://blog.maximeheckel.com/posts/the-physics-behind-spring-animations/), and wobble's closed-form CASpringAnimation notes (https://github.com/skevy/wobble).
- three.js MeshPhysicalMaterial transmission/iridescence (https://threejs.org/docs/#api/en/materials/MeshPhysicalMaterial). Codrops on refraction in three.js (https://tympanus.net/codrops/?p=89382).
- Starting points from the brief: https://rive.app/community (returned 404), https://godly.website (redirects to recent.design: interactive portfolios and motion studies), https://www.behance.net/galleries/interaction and https://images.nasa.gov. NASA did not fit this direction, so no NASA imagery is used.

## Palette

| Token | OKLCH | Hex | Role |
|---|---|---|---|
| `--lapis` | oklch(0.47 0.25 264) | #073fe3 | **Owner.** Section grounds, the cover, the stone |
| `--deep` | oklch(0.34 0.18 265) | #082593 | Line art on paper, shadows on lapis |
| `--ink` | oklch(0.24 0.12 266) | #061457 | Text on paper, dark sections, footer |
| `--night` | oklch(0.17 0.07 268) | #040b2d | Deepest shadow only |
| `--peri` | oklch(0.78 0.10 264) | #97b7f8 | Secondary on lapis, crystal tint |
| `--frost` | oklch(0.89 0.05 264) | #cadbfd | Captions on lapis, quiet panels |
| `--vellum` | oklch(0.965 0.022 85) | #faf3e3 | Paper, text on lapis |
| `--parch` | oklch(0.93 0.035 82) | #f4e6ce | Second paper, tape, Harbor card |
| `--rosehip` | oklch(0.63 0.21 15) | #ec3d5f | Tiny accents only (from Redouté) |
| `--pollen` | oklch(0.86 0.15 92) | #f4cd4b | "Live" dot, citrine crystal, pyrite flecks |

Rough page share is lapis 55, vellum 25, ink 12, frost 5, rosehip 2 and pollen 1. Vellum on lapis passes WCAG AA for body text, and so does ink on vellum. All tokens are declared in `motion.css` under `:root`.

## Typefaces

All three are SIL OFL and served from Google Fonts. The link is in `preview.html`.

- **Fraunces** (variable: opsz, wght, SOFT, WONK). Use it for display and figures, with `font-variation-settings: 'SOFT' 100, 'WONK' 1, 'opsz' 144`. Italic is for product names and emphasis. The wordmark is Fraunces 560, outlined to SVG paths, so it needs no font.
- **Instrument Sans** 400/500/600: body text and UI.
- **Martian Mono** 400/500: specimen numbers, captions and figure labels. Set it uppercase with 0.12em tracking.

## Motion (`motion.js`, `motion.css`)

One hand-rolled `Spring` drives everything. It is a damped harmonic oscillator integrated with semi-implicit Euler at a fixed 240 Hz sub-step, and it can be retargeted mid-flight. `motion.css` carries the same springs as sampled `linear()` easing tokens. With `prefers-reduced-motion`, everything jumps straight to the end state.

| Name | Kind | API | What it does | Spring |
|---|---|---|---|---|
| **Specimen settle** | entrance | `settle(els)` or `.settle` | Items drop 26px with a ±4° tilt and land with one soft bounce, 70ms stagger | k 210, c 17 |
| **Loupe** | hover | `loupe(card)`, plus a `[data-loupe]` child | Card leans toward the pointer; a circular lens follows the cursor and reveals a 2× detail layer | k 380, c 26 |
| **Lapis wash** | transition | `lapisWash(x, y)` or the View Transition CSS | Ultramarine ink spreads from the click point, then recedes from the opposite corner | k 120, c 15 |
| **Herbarium shuffle** | signature delight | `herbarium(grid, {key})` | Drag anything in a grid; the others make room (FLIP + springs). The order persists per viewer in localStorage | k 210 / 380 |
| **Drift** | ambient | `drift(els)` with `data-depth` | Stickers trail the pointer on a heavy spring | k 40, c 12, m 1.4 |

The geode reuses the same `Spring` for pick-up, re-seating, orbit and the "drop" entrance of each crystal.

## 3D: the Lapis Geode (`3d/crystals.js`, demo `3d/demo.html`)

The geode is built only from three.js primitives, with no downloads:

- **Stone**: a displaced icosahedron with vertex-coloured lapis, faint calcite veins and pyrite flecks.
- **Crystals**: hexagonal-lathe quartz points, twinned points, octahedra and cubes.
- **Druse**: 160 tiny instanced points.
- **Environment**: a PMREM studio built from a gradient dome and three soft boxes.

three.js is pinned at 0.170.0 from jsDelivr. Call it like this:

```js
import { mountGeode } from './3d/crystals.js'
const geode = await mountGeode(el, { onHover(p) {}, onRearrange(order) {} })
// options: products, background, still, autoRotate, yaw, pitch, zoom, crystalScale, druse, shadow
// api: project(id) -> {x,y} for labels, setView(yaw, pitch), shuffle(), destroy()
```

Interaction:

- Drag the background to orbit.
- Hover a crystal to see its product.
- Drag a crystal to lift it, then drop it on another socket. If the socket is taken, the two crystals swap.
- `shuffle()` throws them all.

`demo.html?still&bg=073fe3&yaw=..` renders a single frame. The hero stills were made this way at 2× DPR. For no-WebGL and reduced motion, fall back to `hero/geode-render-*.webp`. Load the module lazily, when it scrolls into view, as `preview.html` does.

## Inventory

All sizes are on disk. The total kit is about 3.9 MB.

| File | What it is | Intended use | Source | Licence |
|---|---|---|---|---|
| `identity/logo-mark.svg` | Cut-stone "A": bevelled facets lit from upper left | Nav, favicon base, stamps on paper | Generated (node: polygon offset + per-edge shading) | Original, owned by client |
| `identity/logo-mark-on-lapis.svg` | Same mark, vellum/frost facets | On lapis grounds | Generated | Original |
| `identity/logo-mark-mono.svg` | Flat silhouette, `currentColor` | Tiny sizes, one-colour print | Generated | Original |
| `identity/wordmark.svg` | Mark + "Albretsen" (Fraunces 560, outlined) + italic AS | Header on paper | Generated (fontTools outlines of Fraunces, OFL) | Original; Fraunces OFL permits outlining |
| `identity/wordmark-on-lapis.svg` | Same lockup, light | Header on lapis | Generated | Original |
| `identity/wordmark-text.svg` | Text-only lockup, `currentColor` | Footer, tight spaces | Generated | Original |
| `identity/favicon.svg`, `favicon-180.png` | Mark on a lapis tile | Favicon, apple-touch-icon | Generated; PNG via rsvg-convert | Original |
| `identity/og-image.jpg` | 1200×630 social card | Open Graph / Twitter | Composed in `identity/_og.html`, rendered in headless Chrome | Original + PD components |
| `hero/hero-fern(@2x).webp` | Fern engraving remapped to the lapis→vellum ramp | Hero side plate, section break | *Little Blue-eyes* (1875), Old Book Illustrations: https://www.oldbookillustrations.com/illustrations/fern-blue-eyes/ (source: University of California Libraries / Internet Archive) | Public domain (published 1875) |
| `hero/hero-diatoms(@2x).webp` | Haeckel, Diatomea, vellum on lapis | Hero background plate (screen blend at 30%) | https://commons.wikimedia.org/wiki/File:Haeckel_Diatomea.jpg | Public domain |
| `hero/geode-render-front(@2x).webp` | Still of the live geode, on lapis | Hero fallback, social, reduced motion | Rendered from `3d/demo.html?still` | Original |
| `hero/geode-render-citrine(@2x).webp` | Second angle, citrine (Fun Libs) crystal forward | Section art, fallback | Rendered from `3d/demo.html?still` | Original |
| `products/specimen-mcp-emails(@2x).webp` | Real MCP Emails mark taped to a mount; diatom rosette, aquamarine; $782 MRR | Product card / feature | Composed in `products/_compose.html`; logo from `_shared/products/mcp-emails/logo-mark.svg` (unaltered) | Logo: client's own. Illustrations PD |
| `products/specimen-fun-libs(@2x).webp` | Real Fun Libs v5 icon; Haeckel sun radiolarian, garnet; 113,000+ installs | Product card | Same; `_shared/products/fun-libs/icon.png` | Same |
| `products/specimen-toolrails(@2x).webp` | Real Toolrails icon on ink; diatom star, emerald; 4 connectors | Product card | Same; `_shared/products/toolrails/icon.svg` | Same |
| `products/specimen-harbor(@2x).webp` | Real Harbor wordmark on parchment; radiolarian skeletons, lapis; 549 commits | Product card | Same; `_shared/products/harbor/harbor-wordmark.svg` | Same |
| `products/specimen-luma(@2x).webp` | Real Luma logo (retired); Redouté rose, garnet; 378 commits | Retired card with a real logo | Same; `_shared/products/luma/logo.png` | Same |
| `products/retired/*.svg` (+ `-vellum`) | Crystal habits drawn like a mineral plate (visible edges solid, hidden dashed, faint tint): Polyglot Pilot = quartz, PinPoint = octahedron, WebVakt = rhombic dodecahedron, Joke Central = cube, Tryggere Hyring = pyritohedron, Early apps = hexagonal tablet | Stand-ins for retired products with no surviving brand | Generated (node: convex hull + hidden-line by face normals) | Original |
| `products/_compose.html` | Source for the cards, `?id=` | Re-render cards if facts change | Original | Original |
| `extras/diatom-rosette.webp`, `diatom-star.webp`, `diatom-lens.webp` | Single diatoms, vellum line with real alpha | Scatter on lapis; the lens is ideal for the Loupe | Cut from Haeckel Diatomea (above) | Public domain |
| `extras/radiolarian-lantern.webp`, `radiolarian-cage.webp` | Spyroidea skeletons, deep-ink line with alpha | Scatter on paper sections | https://commons.wikimedia.org/wiki/File:Haeckel_Spyroidea.jpg | Public domain |
| `extras/discoidea-star.webp`, `discoidea-sun.webp`, `discoidea-trefoil.webp` | Hand-coloured Discoidea, cut out | Warm colour stickers on lapis or paper | https://commons.wikimedia.org/wiki/File:Haeckel_Discoidea.jpg | Public domain |
| `extras/rosa-kamtschatica.webp` | Redouté's *Rosa kamtschatica*, cut out | The human note: cover, footer, OG | https://www.oldbookillustrations.com/illustrations/kamchatka-rose/ (P.-J. Redouté, 1817; scan NYPL) | Public domain |
| `extras/gem-lapis.webp`, `gem-garnet.webp`, `gem-emerald.webp`, `gem-aquamarine.webp` | Four hand-tinted gems cut from Tab. II | Small physical objects to scatter and drag | Tab. II plate (DPLA via Commons, URL above) | Public domain |
| `extras/plate-tab-ii.webp` | The mineral page, warm, uncut | "Where ultramarine comes from" moment | Same | Public domain |
| `extras/pattern-habits-ink.svg`, `pattern-habits-vellum.svg` | 240×300 repeating tile of crystal habits | Section backgrounds at low opacity | Generated from `products/retired/*.svg` | Original |
| `3d/crystals.js`, `3d/demo.html` | Live interactive geode module + demo | Hero centrepiece | Original; three.js 0.170.0 (MIT) from jsDelivr | Original / MIT |
| `motion.js`, `motion.css` | Spring engine, 5 named animations, tokens | Whole site | Original | Original |
| `preview.html` | Contact sheet | Start here | Original | Original |

Paper grain is not an image file. It is a procedural `feTurbulence` data-URI in `motion.css` (`.grain::after`), so it costs nothing to load.

### Not used and why

- There is no HDRI or `.glb` download. The geode is fully procedural, which keeps the kit light and lets the builder recolour it.
- NASA imagery and Rive files did not fit the botanical-crystal direction.

## Notes for the builder

- **Let lapis own the page.** Use full-bleed lapis sections, with vellum "paper" sections between them. Never put lapis on top of vellum as a small accent.
- **Specimen numbers** follow the product order in `_shared/content.js`. Statuses are Live, Building, Paused and Retired.
- **Drag.** Make everything draggable that reasonably can be: the cards (`herbarium()`), the stickers, and the crystals in the geode. That is the signature.
- **Real logos** are only ever shown on the white mount, unaltered.
