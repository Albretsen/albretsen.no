# Kit 88 — Labelled Sky

Asset kit for Albretsen AS / albretsen.no. Open brief (not taste-weighted). Open `preview.html` for the contact sheet.

## Vision

Real night skies, catalogued with blunt, friendly labels. The base layer is real: an 1885 glass-plate photograph of the stars in Cygnus, Dürer's 1515 woodcut of the northern sky and a moon daguerreotype from around 1850, all public domain from The Met. They are graded into one palette: forest-green night, brass starlight, cream stock. On top sits a neo-brutalist sticker system: chunky 3px forest borders, hard 0-blur offset shadows, round seals, status chips and mono catalogue codes (`ALB-01`).

Each product is a **constellation traced from its real logo's vertices**. The MCP Emails envelope, the two Fun Libs bars, the Toolrails rails and arrow, and the Harbor notched square all appear as stars joined by brass lines. The company mark is an "A" drawn the same way. The story it tells, without saying so: *precise work, placed on the chart where you can find it.*

- **Personality:** playful precision. The stickers are playful; the grid, the catalogue numbers and the real star positions are precise.
- **Spark words:** *fracture* (the Chart of Works sheet splits into three shards; the Fracture-snap motion), *tension* (dotted brass threads cross the cracks, and particle threads thin as they stretch), *flow* (the particle field drifts on a flow-noise current, and an ecliptic band runs through the chart).
- **Uncluttered:** one strong idea per screen. The plates do the talking, with at most one sticker cluster per view. The hero copy sits in the calm left third of each image.
- **Not:** a finance firm (no gold-on-black luxury), an astrology site (no zodiac copy), or a cartoon (the stickers stay flat and ink-coloured, never glossy).

### Mood and references

| Ref | What I took |
|---|---|
| https://ui.aceternity.com (Tracing Beam, Background Beams, Glowing Stars card, Sparkles) | Lines that draw along a path, and stars that react on hover, re-done in WAAPI as "Tension line" |
| https://linear.app | Restraint: spacious marketing sections, one feature per block, captions in an editorial "Fig 0.1" voice, so the stickers stay few and deliberate |
| https://www.cosmos.so | Imagery as the content. Uncluttered and image-first, with square, consistent crops |
| https://www.awwwards.com/websites/sites_of_the_day/ → salt `2db2cb` picked #2 Overworld Audio and #11 drone.riotters.com | Riotters: bracketed mono HUD labels (`[ D:02 ]`) and point-cloud heroes, which became the catalogue entries on star hover. Overworld: drag-to-explore markers, which became the product constellations as explorable markers |
| Neo-brutalism recipe (theplusaddons / RetroUI roundup) | 2–5px borders, 0-blur offset shadows, flat fills, which form the whole sticker system |
| CSS-Tricks on WAAPI `composite: 'add'`; Josh Comeau and Jake Archibald on `linear()` springs | Springs baked into `linear()`; additive shard transforms |
| The Met Open Access API (v1.1 search) | Source of all three plates |

## Palette (OKLCH, seed hue 0°)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| cream | oklch(0.962 0.022 88) | `#F9F2E2` | page, sticker face |
| paper | oklch(0.915 0.032 84) | `#EDE2CC` | sticker backs, peel, retired badges |
| forest | oklch(0.37 0.068 158) | `#1A4A32` | ink, borders, hard shadows on cream |
| ink | oklch(0.33 0.055 160) | `#173F2B` | small text, chart graticule |
| night | oklch(0.185 0.03 162) | `#05170F` | plates, dark sections |
| brass | oklch(0.70 0.105 78) | `#C2964D` | constellation lines, hard shadows on dark, codes |
| brass-light | oklch(0.85 0.095 88) | `#E8CB84` | text and lines on night |
| signal | oklch(0.60 0.19 0) | `#D4407C` | **the seed hue**, used only as the 8px "live" dot. Never a fill |
| moss | oklch(0.62 0.06 150) | `#6C9173` | paused and retired states |

Contrast: forest on cream about 9.6:1, and brass-light on night about 12:1. Brass on cream is decoration only (about 2.6:1), never body text.

## Typefaces (all SIL OFL, subset to Latin and vendored as woff2)

| Role | Face | Settings | File |
|---|---|---|---|
| Display / headlines | **Archivo** (variable) | `font-stretch:125%` `font-weight:850`, tracking −0.01em | `fonts/archivo-var.woff2` (93 KB) |
| Labels, codes, body | **Martian Mono** (variable) | 500 body / 700 labels, uppercase labels at +0.08em | `fonts/martian-mono-var.woff2` (38 KB) |
| Asides (one phrase per screen) | **Instrument Serif Italic** | 400 | `fonts/instrument-serif-italic.woff2` (22 KB) |

Sources: github.com/google/fonts (`ofl/archivo`, `ofl/martianmono`, `ofl/instrumentserif`). The wordmark, OG image, stickers and badges have their text **outlined to paths**, so they need no fonts.

## Performance notes for the builder

- The hero is `hero/cygnus-plate-wide-{960,1600,2400}` (AVIF about 30/75/150 KB), with `cygnus-plate-tall-{750,1200}` for ≤700px. JPEG only at the smallest size as a fallback. Every image has width and height set, so layout shift is 0.
- First paint is about 30–80 KB of hero, the woff2 files (about 150 KB), and the SVG mark. Load the particle module (`interactive/star-catalogue.js`, 12 KB plus 60 KB JSON) with dynamic `import()` when its section approaches, as `preview.html` does.
- `motion.js` is 6 KB with no dependencies.

## Motion study (`motion.js` + `motion.css`)

| # | Name | What | Researched from |
|---|---|---|---|
| 1 | **Press-on** | A sticker drops from 1.3× with a +9° tilt, overshoots on a baked spring (k260 c12), and only then does its hard shadow grow from 0 to 4px, as if pressed onto paper | neo-brutalist hard shadows (RetroUI, Gumroad), physical sticker sheets |
| 2 | **Peel & lift** | On hover or focus, the shadow grows from 4 to 10px, the sticker leans 1° toward you, and a registered `--peel` property folds the bottom-right corner back to the paper side | Linear's restrained hover depth |
| 3 | **Tension line** | `[data-line]` elements draw by `stroke-dashoffset` in engraving order, and each `[data-star]` springs in as its line lands | Aceternity Tracing Beam / Background Beams |
| 4 | **Brass loupe** | Hover opens a sprung circular `clip-path` window, which follows the pointer, onto a hidden layer (photo over Dürer engraving). This is the brief's "rich hover that reveals hidden detail" | museum deep-zoom viewers |
| 5 | **Fracture snap** | An element is cloned into three `clip-path` shards that slide apart and snap back (`composite:'add'`). Use once per page | CSS-Tricks WAAPI composite demo |
| — | **Star catalogue** (canvas) | Particle flow, spring pins, stretch-thinned threads, fracture burst, hover catalogue entry | Aceternity Sparkles / Stars, drone.riotters point cloud |

Everything resolves to its end state under `prefers-reduced-motion`. Springs are exported as `SPRING_SNAP` and `SPRING_STAMP` (and `--ease-snap` / `--ease-stamp` in CSS).

## Interactive asset

`interactive/star-catalogue.js`: `mountStarCatalogue(canvas, {centerX, centerY, labels, background})` returns `{ show(id|null), fracture(), current, destroy() }`. It runs on Canvas 2D with no dependencies, pauses offscreen and caps DPR at 2. The particles are **2,188 real stars** measured from the 1885 plate (`interactive/cygnus-1885-stars.json`: normalised x, y and flux, sorted brightest first). IDs are `mcp-emails`, `fun-libs`, `toolrails`, `harbor` and `albretsen`. Demo: `interactive/demo.html` (`?show=toolrails`, press F to fracture).

## Inventory

| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| `identity/mark.svg` | A-constellation on a cream sticker tile, brass hard shadow | header and footer mark, avatar | generated (`src/identity.py`) | original, owned by client |
| `identity/mark-night.svg` | same, night tile | dark sections | generated | original |
| `identity/glyph.svg` | bare A-constellation, `currentColor` lines | inline icon, loader | generated | original |
| `identity/wordmark.svg` / `wordmark-night.svg` | mark + ALBRETSEN (Archivo 125/850 outlined) + AS label | header | generated; glyph outlines from Archivo (OFL) | original artwork; outlines from OFL font (embedding as outlines permitted) |
| `identity/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` (180) | forest tile, cream constellation, brass apex | favicons | generated, rasterised with rsvg-convert | original |
| `identity/og-1200x630.jpg` | graded plate + wordmark + "I build software that pays for itself." | Open Graph / social | generated over The Met 283255 | CC0 base + original |
| `hero/cygnus-plate-wide-{960,1600,2400}.{avif,webp}` (+960.jpg) | **Plate I**: 1885 Cygnus glass plate, background-flattened and graded to forest night with brass halos on the brightest stars | main hero | The Met 283255, "A Section of the Constellation Cygnus (August 13, 1885)", https://www.metmuseum.org/art/collection/search/283255 , graded in `src/cygnus.py` | CC0 (Met Open Access) |
| `hero/cygnus-plate-tall-{750,1200}` | Plate I, 4:5 portrait crop | mobile hero | same | CC0 |
| `hero/chart-of-works-{960,1600,2400}` | **Plate III**: engraved polar star chart on cream stock, fractured into three shards over forest night; four product constellations in brass with real-logo sticker labels; tension threads across the cracks | second hero / products intro / about | generated (`src/chart.py`: Python → SVG → rsvg); embeds real product logos | original + client logos |
| `hero/durer-forest-{800,1400}` | **Plate II**: Dürer, *The Northern Celestial Hemisphere* (1515), re-inked forest on cream with brass mid-tones | writing / about background, loupe source | The Met 358366, https://www.metmuseum.org/art/collection/search/358366 , graded in `src/grade2.py` | CC0 |
| `hero/moon-run-plate-{640,1100}` | **Plate IV**: daguerreotype of repeated moon exposures in its brass mat, blacks lifted to forest night | "the run" / shipping log / history | The Met 821156, "[Multiple Exposures of the Moon]" 1846–52, https://www.metmuseum.org/art/collection/search/821156 | CC0 |
| `hero/moon-run-wide-{960,1600}` | Plate IV, wide interior crop | section background | same | CC0 |
| `hero/sizes.json` | width, height, formats and KB per hero file | srcset authoring | generated | — |
| `products/mcp-emails-{600,1000}` | sticker with the **real MCP Emails logo-mark**, envelope constellation, $782 MRR seal | product card / page hero | generated (`src/products.py`); logo from `_shared/products/mcp-emails/logo-mark.svg` (unchanged); background crop of Plate I | logo © client; rest original/CC0 |
| `products/fun-libs-{600,1000}` | **real Fun Libs icon.png**, two-bar constellation, 113,000+ installs seal | product card | same; `_shared/products/fun-libs/icon.png` | same |
| `products/toolrails-{600,1000}` | **real Toolrails icon.svg**, rails-and-arrow constellation, 4 connectors seal | product card | same; `_shared/products/toolrails/icon.svg` | same |
| `products/harbor-{600,1000}` | **real Harbor mark** (currentColor set to forest), notched-square constellation, 549 commits seal | product card | same; `_shared/products/harbor/harbor-mark.svg` | same |
| `products/retired/luma.svg` | round retired badge with the **real Luma wordmark** (logo.png embedded) | retired list | generated (`src/retired.py`) + `_shared/products/luma/logo.png` | logo © client |
| `products/retired/{polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}.svg` | stand-in badges: monogram, mini constellation, "YEAR · RETIRED" | retired list | generated | original |
| `extras/stickers.svg` | `<symbol>` sprite: `chip-live/building/paused/retired`, `label-catalogue`, `label-note`, `tape`, `arrow`, `mag-1…6` (engraved star magnitudes) | UI labels, bullets, decoration | generated (`src/extras.py`) | original |
| `extras/details/durer-{ursa-major,cygnus-bird,astronomer-nw,astronomer-se,corona}.webp` | 480px detail crops of Plate II | loupe and hover reveals, blog-list thumbnails | crops of The Met 358366 | CC0 |
| `extras/paper-cream-512.webp` | tileable cream stock (fibres, clouds, specks) | page background | generated (`src/paper.py`) | original |
| `extras/plate-night-512.webp` | tileable night plate grain with brass dust | dark section background | generated | original |
| `extras/fracture-divider.svg` | jagged crack with a dotted tension thread | section break (stretches with `preserveAspectRatio="none"`) | generated | original |
| `interactive/star-catalogue.js` | particle system (see above) | hero or products section | hand-written | original |
| `interactive/cygnus-1885-stars.json` | 2,188 star centroids and fluxes measured from The Met 283255 | particle data | measured in `src/cygnus.py` (scipy labelling) | CC0-derived |
| `interactive/demo.html` | full-screen demo | — | — | — |
| `motion.js`, `motion.css` | motion study and sticker CSS system | site-wide | hand-written | original |
| `fonts/*.woff2` | Archivo, Martian Mono, Instrument Serif Italic (Latin subsets) | type | github.com/google/fonts | SIL OFL 1.1 |
| `src/*.py` | every generator (grading, chart, stickers, badges, paper, identity, OG, export) | regenerate or tweak | — | original |
| `preview.html` | contact sheet (`?from=<section-id>` hides earlier sections, `?nosky` skips the canvas) | review | — | — |

Total about 5.8 MB. Research note: the web-search budget ran out after five searches, so licensed sources were located directly through The Met's Open Access API (v1.1 search, `isPublicDomain=true`), and each object record was checked for `isPublicDomain: true` before download.
