# Kit 34 — "Tension Prism"

Open `preview.html` first (serve the repo root; the page imports `../../_shared/content.js`).

## Vision

Albretsen AS as a crystal under tension. The name is not set in type: it is
**grown** as a lattice of about 1,900 glass facets, and every facet is a live object. Push on
it and it bends, click it and it bursts, ask it and it re-crystallises into
MCP EMAILS, FUN LIBS, TOOLRAILS or HARBOR. The point is a structure that looks
hard to build and holds together anyway, which reads as skill without anyone saying so.

Light is the one colour. The site is black and white glass, and the single
primary (mint, hue 156°) is the light that gets through the prism: the apex of
the mark, the beam through the T and S of the wordmark, the band on every
graded photograph. One mint thing per view, and the energy comes from scale,
density and motion, not from more colours.

Mood: dark studio, refraction, dispersion fringes, slatted light boxes,
crystal macro, terminal precision. Maximalist through density and scale, never clutter.
Avoid: gears, ships, trains, finance blue, "glassmorphism" frosted cards with nothing to bend.

## References

- GSAP showcase (MorphSVG / SplitText era of type-as-system): https://gsap.com/showcase/
- Godly (now recent.design) gallery for dark, dense hero compositions: https://godly.website
- FWA (award-site energy, giant interactive type): https://www.fwa.com
- Liquid glass with SVG `feDisplacementMap` (basis of `#ts-refract`): https://blog.logrocket.com/how-create-liquid-glass-effects-css-and-svg/
- Radix animation guide (data-state keyframes, unmount after the animation): https://www.radix-ui.com/primitives/docs/guides/animation
- Radix Accordion `--radix-accordion-content-height`: https://www.radix-ui.com/primitives/docs/components/accordion
- three.js MeshPhysicalMaterial (transmission, dispersion): https://threejs.org/docs/pages/MeshPhysicalMaterial.html
- Codrops, refraction through a glass torus: https://tympanus.net/codrops/?p=89382
- SVG point morphing (Flubber / Motion): https://motion.dev/tutorials/js-svg-path-morphing
- Magnetic + difference-blend cursor pattern: https://www.framer.com/community/marketplace/components/chevroncursordemo/
- Source photos: Wikimedia Commons, *Prism flat rainbow (cropped)*, and *Snow crystals glittering in strong direct sunlight 42*

## Palette (OKLCH, hue 156°)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| `--ink` | oklch(0.12 0.005 156) | `#060807` | page background |
| `--ink-2` | oklch(0.17 0.015 156) | `#0B120E` | cards |
| `--ink-3` | oklch(0.21 0.02 156) | `#121C16` | raised surfaces |
| `--paper` | oklch(0.99 0.015 156) | `#F4FFF8` | type, light facets |
| `--mint` | oklch(0.88 0.20 156) | `#39FD9E` | the single primary: light, beams, focus, status |
| `--mint-deep` | oklch(0.55 0.13 156) | `#0D8750` | mint text on paper (AA) |

White facets use opacity steps (.45–1.0) over ink, never extra greys.

## Type (Google Fonts, OFL)

- **Anybody** 900, variable width 50–150. Display and the wordmark source. Interactive headlines animate `wdth` (tension): 125 at rest, 50 or 150 on interaction.
- **Geist** 300–600. Body and lines.
- **Geist Mono** 400–600. Labels, figures, the terminal voice (`claude mcp add albretsen https://albretsen.no/mcp`).

```html
<link href="https://fonts.googleapis.com/css2?family=Anybody:wdth,wght@50..150,100..900&family=Geist:wght@300..700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

## Signature pieces for the builder

1. **Hero**: `interactive/prism-wordmark.js` over `hero/shards` (bg) with a radial ink vignette. `PrismWordmark.mount(el, { words: ['ALBRETSEN','MCP EMAILS','FUN LIBS','TOOLRAILS','HARBOR'] })`. Optional `cycle: 5000`. Respects reduced motion (static wordmark).
2. **Cursor**: `interactive/prism-cursor.js`, `initPrismCursor()`. A glass triangle that points where it travels and splits into mint and white ghosts with speed. `data-cursor="Label"` shows a mint label. Fine pointers only.
3. **3D**: `interactive/prism-scene.js`, `await mountPrismScene(el)`. Lazy-load it on intersection; three.js 0.170.0 comes from jsDelivr.
4. **Motion**: `motion.css` + `motion.js` (`initMotion(document)`), seven named animations (below), all keyed to Radix `data-state` so they also fit real `@radix-ui/react-*` components.

### Motion study (motion.css)

| Name | Kind | What it does | Drawn from |
|---|---|---|---|
| `ts-crystallize` | entrance | clip-path grows from a point into a triangle, then into the box, while blur and brightness settle; `--i` staggers | facet reveal; Radix keyframe pattern |
| `ts-disperse` | hover | text-shadow splits mint and white ghosts (chromatic dispersion) and snaps back on a tension curve | RGB-split hovers on award sites, recoloured to one primary |
| `ts-sheen` | hover | a skewed band of white→mint light sweeps across a `.ts-glass` card | specular sweeps on glass UI |
| `ts-prism-split` | transition | dialog opens from a triangular aperture; overlay refracts the page through `#ts-refract` (Ice002 normal map → feDisplacementMap) | LogRocket liquid glass; Radix Dialog data-state |
| `ts-facet-fold` | transition | accordion height via `--radix-accordion-content-height` plus a facet clip; triangle chevron flips with overshoot | Radix Accordion docs |
| `ts-beam` | transition | tab indicator is a glowing beam that stretches 1.45× toward the new tab, then settles | indicator springs; "tension" spark word |
| `ts-facet-pop` | entrance | tooltip / hover card reveal from the arrow tip as a widening triangle | Radix Tooltip/HoverCard `delayed-open` states |

Plus, in JS: **Crystallize** (the wordmark's intro), **Tension lens** (pointer pushes facets on damped springs), **Morph** (three-vertex interpolation of every triangle between words, on arcs), **Burst** (click).

## Inventory

All sizes are on disk. The whole `assets/` folder is about 2.3 MB.

| File | What it is | Intended use | Source / how made | Licence |
|---|---|---|---|---|
| `identity/mark.svg` | Prism A mark, 21 facets, mint apex + exit ray | nav logo, favicon source, section markers | Generated, `_build/mark.py` | Client-owned |
| `identity/mark-solid.svg` | Mark in `currentColor` | one-colour uses, on mint, print | Generated | Client-owned |
| `identity/wordmark-facets.svg` | ALBRETSEN on a 14-row triangle lattice, white facets + mint beam (76 KB) | footer, OG, large static uses | Anybody 900 Expanded rasterised onto a lattice in headless Chrome, `_build/wordmark.html` + `interactive/prism-lattice.js` | Client-owned; Anybody is OFL |
| `identity/wordmark-solid.svg` | Same in `currentColor`, no gaps | small sizes, nav | Generated | Client-owned |
| `identity/favicon.svg` | Faceted mark on ink rounded square | `<link rel=icon>` for ≥48 px | Generated | Client-owned |
| `identity/favicon-small.svg`, `favicon-32.png` | Solid white A with mint apex on ink: the facets merge so it stays crisp at 16/32 px | browser tab icon | Generated, `rsvg-convert` | Client-owned |
| `identity/apple-touch-icon-180.png` | 180×180 PNG | apple-touch-icon | `rsvg-convert` of favicon.svg | Client-owned |
| `identity/og-image.jpg` | 1200×630 | Open Graph / social card | Composed in `_build/og.html`, headless Chrome screenshot | Client-owned |
| `hero/crystal-a.webp`, `@2x.webp`, `@2x.avif` | 1440 / 2880 px. The mark as 21 real glass prisms with dispersion in front of a slatted mint light box, a mint ray fanning out | hero alternative, about section, large feature | three.js r170 offline render (`_build/render.html?scene=crystal-a`), MeshPhysicalMaterial transmission + dispersion, UnrealBloom; lit by Poly Haven *Monochrome Studio 02* | Render client-owned; HDRI CC0 |
| `hero/crystal-a-portrait.webp`, `@3x.webp` | 780×1400 / 1170×2100. Portrait framing: the incoming white ray enters at the apex, the mint fan leaves on the right, dark lower half for text | **phone hero** (`<picture media="(max-width: 700px)">`) | three.js render, `scene=crystal-a&fov=44` | Client-owned |
| `hero/shards.webp`, `@2x.webp`, `@2x.avif` | 1440 / 2880 px. The lattice blown apart: 46 glass triangles at many depths, a horizontal slit light | **hero background** behind the live wordmark | three.js render (`scene=shards`) | Client-owned |
| `photo/prism-mint.webp`, `@2x` | 1000 / 2000 px square. A real glass prism; the spectrum graded into one mint band | section break, MCP or "about" image, dialog backgrounds | Wikimedia Commons, *File:Prism flat rainbow (cropped).jpg* by Kelvinsong, https://commons.wikimedia.org/wiki/File:Prism_flat_rainbow_(cropped).jpg, graded with `_build/grade.py` | CC0 |
| `photo/crystal-macro.webp`, `@2x` | 1200 / 2400 px. Ice-crystal macro with mint glints | wide band between sections, footer backdrop | Wikimedia Commons, *File:Snow crystals glittering in strong direct sunlight 42 - wide crop - high contrast.jpg* by W.carter, https://commons.wikimedia.org/wiki/File:Snow_crystals_glittering_in_strong_direct_sunlight_42_-_wide_crop_-_high_contrast.jpg, graded | CC0 |
| `products/mcp-emails.webp`, `@2x` | 1200 / 2400 px. Real MCP Emails icon as a tile on black glass, a glass prism beside it | product card / case section | three.js render of `designs/_shared/products/mcp-emails/icon.png`; the icon face is unlit and not tone-mapped (colours unchanged) | Product logo © Albretsen AS |
| `products/fun-libs.webp`, `@2x` | same series, real Fun Libs v5 icon | product card | render of `_shared/products/fun-libs/icon.png` | © Albretsen AS |
| `products/toolrails.webp`, `@2x` | same series, real Toolrails icon | product card | render of `_shared/products/toolrails/icon.svg` | © Albretsen AS |
| `products/harbor.webp`, `@2x` | same series, Harbor mark in its own banner colours (cream on #1B1B1B) | product card | render of `_shared/products/harbor/harbor-mark.svg` (`currentColor` set to Harbor's banner cream) | © Albretsen AS |
| `retired/polyglot-pilot.svg` … `early-apps.svg` | Six 320 px lattice-glyph stand-ins (four-row crystals, one pattern per product), name + year + RETIRED | retired products grid | Generated, `_build/extras.py` | Client-owned |
| *(Luma)* | Use the real `designs/_shared/products/luma/logo.png` on its own #F4EFE6 tile | retired grid | Real asset | © Albretsen AS |
| `extras/pattern-lattice.svg` | Tileable triangle lattice, sparse mint facets | section backgrounds, cards, 404 | Generated | Client-owned |
| `extras/sticker-seal.svg` | Mint circular seal, "ALBRETSEN AS ✦ NORWAY ✦ SOFTWARE THAT PAYS" | scattered on about / footer, rotates on scroll | Generated | Client-owned |
| `extras/sticker-since-2016.svg` | Triangle badge "On Google Play since 2016" | near the Fun Libs story | Generated (fact from content.js) | Client-owned |
| `extras/sticker-installs.svg` | Paper label "113,000+ Fun Libs installs · no marketing" | Fun Libs card | Generated (facts from content.js) | Client-owned |
| `extras/sticker-mcp-command.svg` | Terminal pill with the real MCP command | contact / footer, copy-to-clipboard target | Generated | Client-owned |
| `texture/frost-cells.webp` | 1024 px tileable cell-caustic texture, mint on ink | slowly drifting section background, card fills | ambientCG *Ice002* colour map, https://ambientcg.com/view?id=Ice002, graded | CC0 |
| `texture/ice-normal.webp` | 1024 px tileable normal map | the displacement source for `#ts-refract` (overlays, hover cards, the lens) | ambientCG *Ice002* NormalGL | CC0 |
| `texture/studio-env-1k.webp` | 1024×512 equirect (17 KB) | environment map for `prism-scene.js` | Poly Haven *Monochrome Studio 02* tonemapped JPG, https://polyhaven.com/a/monochrome_studio_02 | CC0 |
| `interactive/prism-lattice.js` | Lattice rasteriser (any word → triangles) | used by the wordmark | Hand-written | Client-owned |
| `interactive/prism-wordmark.js` | **Hero centrepiece**: SVG wordmark of ~1,900 facets; crystallize, tension lens, morph, burst | hero | Hand-written | Client-owned |
| `interactive/prism-cursor.js` | Brand cursor: dispersing glass triangle | site-wide | Hand-written | Client-owned |
| `interactive/prism-scene.js` | three.js glass Crystal A, pointer tilt + tension | "about" or a full-bleed interlude | Hand-written, three@0.170.0 (jsDelivr) | Client-owned; three.js MIT |
| `interactive/demo.html` | Tiny demo of the three modules | testing | — | — |
| `motion.css`, `motion.js` | Seven named animations + Radix-compatible vanilla controllers + SVG filters | site-wide | Hand-written | Client-owned |
| `preview.html` | Contact sheet | client + builder | — | — |

Build sources (not part of the asset budget) live in `designs/34/_build/`:
`render.html` (three.js still renderer), `mark.py`, `extras.py`, `grade.py`, `wordmark.html`, `og.html`.
The original HDRI (`monochrome_studio_02_1k.hdr`, CC0, https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/monochrome_studio_02_1k.hdr)
was used for the offline renders only and is not committed.

## Usage notes

- Hero: `<picture>` with `shards@2x.avif` → `shards.webp` / `shards@2x.webp`, then a vignette `radial-gradient(90% 70% at 50% 45%, rgb(6 8 7/.35), rgb(6 8 7/.92) 75%)`, then the live wordmark at full container width.
- Keep mint scarce: one beam, one status pill, one focus ring per view.
- The `backdrop-filter: url(#ts-refract)` refraction is Chromium-only; motion.css falls back to blur + saturate.
- Product images: keep the logos as rendered; don't crop the tile or tint the images.
- Reduced motion: the wordmark renders statically, the cursor stops its ghosts, CSS animations drop to 1 ms.
