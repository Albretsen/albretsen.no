# Design 47 — "Stille" (a quiet archive of working things)

Open `preview.html` first (serve the repo root, e.g. `python3 -m http.server`, then `/designs/47/assets/preview.html`). It shows every asset, the palette, the type, the motion and the live 3D shelf.

## Vision

A plaster wall in Copenhagen daylight, one long white shelf, and the products set out on it like objects in a museum store: lit, catalogued, given room. The page should feel like walking into a quiet room where everything present was put there on purpose.

- **The hero is an app store, art-directed by a museum.** Real product icons become glazed ceramic tiles on a floating shelf. Live products keep their real colours. Retired products without surviving brands become unglazed **plaster casts** (same shape, no colour, a debossed glyph): honest stand-ins that never pretend to be logos.
- **Photography-led, built from primitives.** There is no 3D "look" in the hero. The shelf is modelled from primitives in three.js (extruded rounded squares, one board, one cube, a plane for a wall) and lit by a single window that is never seen, only its light. Each still is an accumulated bake (40 jittered samples: soft window penumbra, contact shadows, clean edges), then developed with a breath of grain. The same scene stays live in the browser (drag to rearrange).
- **Museum-archive scans.** Public-domain paintings by Vilhelm Hammershøi from SMK (the National Gallery of Denmark): empty rooms, doors, daylight, silence. Used two ways: honest colour scans, and ink prints in the brand's own paper and ink.
- **One spot colour: aniline violet** (OKLCH hue 300). Named after the first synthetic dye, a piece of 1850s chemistry that turned into an industry: invention, not decoration. It appears once per view: the cube on the shelf, the square in the mark, the canvas on Hammershøi's easel.
- **Signature delight: drag to rearrange anything.** The shelf (WebGL), the cut-out objects (DOM + View Transitions API), even small icon rows.
- **Personality: Nordic understatement.** Short sentences, wide margins, no exclamation, no gradients, nothing loops.

Spark words: *silence* (empty wall, one shelf), *contrast* (grey room, one violet object), *grain* (film grain, canvas weave, plaster tooth).

Things this direction avoids on purpose: finance/bank styling, consultancy tropes, anything industrial, mechanical or nautical (Hammershøi's harbour scenes and ship paintings were deliberately skipped; the window light comes from a room, not a ship).

## References

- Vilhelm Hammershøi, *Interior with the Artist's Easel* (1910), SMK KMS7444 — https://open.smk.dk/artwork/image/KMS7444
- SMK Open (public-domain images, API) — https://www.smk.dk/en/article/smk-open/ and https://api.smk.dk
- Museum object photography practice (neutral ground, colour target, scale, accession number in frame) — https://saskmuseums.org/wp-content/uploads/2023/02/Photographing_Artifacts_for_Documentation-Final.pdf
- View Transition list reordering with a "kick flip" (the RESHELVE tilt is a quieter version) — https://blog.master.dev/view-transition-list-reordering-with-a-kick-flip/
- View Transitions gallery-to-detail morph (VITRINE) — https://cloudinary.com/blog/view-transition-gallery-cloudinary and https://nextjs.org/docs/app/guides/view-transitions
- Grain with SVG/PNG noise at low opacity (opacity guidance 3–15%) — https://css-tricks.com/grainy-gradients/ and https://www.freecodecamp.org/news/grainy-css-backgrounds-using-svg-filters/
- Inspiration links from the brief: https://www.igloo.inc (objects in a lit void), https://www.unicorn.studio (grain, light), https://lottiefiles.com/featured, https://dribbble.com/shots/popular

## Palette (OKLCH, seed hue 300)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| ink | oklch(0.21 0.018 300) | #19161f | text, marks, the ink in ink prints |
| ink-2 | oklch(0.45 0.016 300) | #56535d | secondary text, captions |
| dust | oklch(0.62 0.014 300) | #87848e | rules, disabled, retired status |
| stone | oklch(0.80 0.012 300) | #bfbcc4 | quiet fills, image placeholders |
| paper-2 | oklch(0.925 0.008 300) | #e7e5eb | cards, plaster, panels |
| paper | oklch(0.962 0.006 300) | #f3f2f6 | page background |
| wall | — | #c9c6cb | the rendered plaster wall; use behind the live shelf so it bleeds seamlessly |
| aniline-d | oklch(0.38 0.14 300) | #4f2980 | spot shadow, pressed states |
| **aniline** | oklch(0.52 0.19 300) | #7c44c3 | **the spot colour** (once per view) |
| aniline-s | oklch(0.86 0.06 300) | #d7c9f3 | spot on ink, focus halos |

## Typefaces (all SIL Open Font License, subset woff2 in `fonts/`)

- **Instrument Serif** (regular + italic) — display, product names, the wordmark. Source: https://github.com/google/fonts/tree/main/ofl/instrumentserif
- **Geist** (variable 100–900) — running text. Source: https://github.com/google/fonts/tree/main/ofl/geist
- **Geist Mono** (variable) — catalogue labels, accession numbers, figures (uppercase, +0.09em tracking). Source: https://github.com/google/fonts/tree/main/ofl/geistmono

## Motion (motion.css + motion.js)

| Name | Kind | What it does | Source idea |
|---|---|---|---|
| FLATBED | entrance | A thin band of light passes top to bottom; the image is revealed behind it, from slightly blurred to sharp. Triggered when 25% visible. | Museum flatbed scanning; clip-path reveal |
| DAYLIGHT | hover | Object lifts 6px; drop-shadow lengthens toward bottom-right (window is always upper left); a sheen crosses the glaze. | Light direction of the baked scene |
| RESHELVE | transition | Drag (pointer/touch) or Alt+Arrow to reorder. Siblings glide via `document.startViewTransition`; the dropped item does a quiet kick (−4°, lift, settle with slight overshoot). | blog.master.dev kick-flip, toned down |
| VITRINE | transition | Shared-element morph (`view-transition-name: vitrine`) from a thumbnail to its catalogue plate; the old page fades to grey and blurs a little. | View Transitions gallery-to-detail |
| STAMP | micro | The aniline square presses in from 1.9× with a slight rotation. | Accession stamp |

Easing: `--ease-still: cubic-bezier(.2,.7,.1,1)` for arrivals, `--ease-settle: cubic-bezier(.3,1.35,.45,1)` for objects coming to rest. Everything is disabled under `prefers-reduced-motion`.

## 3D / interactive

- `three/shelf-scene.js` — the scene: tiles (real logos drawn onto the face of an extruded rounded square), shelf, plaster wall, an invisible window occluder that throws the light, RoomEnvironment reflections. Layouts: `hero`, `detail`, `retired`, `live`, `product-<id>`, `object-<id>`.
- `three/shelf-live.js` — `mountShelf(el, { onReorder })`: real-time version; hover lifts a tile, drag slides it along the shelf, the others make room. Pauses when off-screen. Lazy-load it.
- `three/bake.html` — the offline renderer used for every still (`?view=hero&w=2880&h=1620&spp=40`, add `&bg=000000` / `&bg=ffffff` for cut-outs that are then difference-matted).
- `three/demo.html` — a full-screen demo.
- Needs an import map for `three@0.170.0` (jsDelivr), see demo.html.

## Builder notes

- Hero A (`hero-shelf`) has its silence on the left and top: set the headline over the upper-left wall in ink. Hero B (`hero-room`) wants the headline on paper beside it, or the violet canvas centred on narrow screens (`object-position: 32% 50%`).
- Put the live shelf on `#c9c6cb` so the WebGL canvas bleeds into the page.
- The cut-outs in `products/objects/` and `retired/objects/` share one frame (516×392) so they line up at identical scale; overlap them by ~4–5% of their width on a DOM shelf.
- Grain: `body::before { background: url(extras/grain-ink.png); opacity: .1–.15; mix-blend-mode: multiply }`.
- Daylight: lay `extras/daylight.webp` over any paper/stone section with `mix-blend-mode: soft-light` (or normal at ~50%) for a window's light across the page.
- Credit line for plates: "Vilhelm Hammershøi, <title>, <year>. SMK, public domain." Ink prints and the violet canvas are our treatment of the scans.

## Inventory

| File | What it is | Intended use | Source | Licence |
|---|---|---|---|---|
| identity/mark.svg | The mark: an A as a gable with a shelf, one aniline square on it | Header, footer, small brand moments | Hand-authored SVG | Original, © Albretsen AS |
| identity/mark-paper.svg | Mark for dark grounds | On ink / on photos | Hand-authored SVG | Original |
| identity/mark-tile.svg | Mark on an ink app-icon tile | App-icon contexts, social avatar | Hand-authored SVG | Original |
| identity/favicon.svg | Favicon (same as mark-tile) | `<link rel=icon>` | Hand-authored SVG | Original |
| identity/apple-touch-icon-180.png | 180px PNG favicon | apple-touch-icon | rsvg-convert from mark-tile.svg | Original |
| identity/wordmark.svg | "Albretsen" (Instrument Serif, outlined) + "AS" (Geist Mono, aniline) | Header, OG, footers | Glyph outlines extracted with fontTools | Original; fonts OFL |
| identity/lockup.svg | Mark + wordmark | Header | As above | Original |
| identity/og.jpg | Open Graph image 1200×630 | `og:image`, `twitter:image` | Rendered from identity/og-source.html (headless Chrome) | Original; plate PD |
| identity/og-source.html | Source of the OG image | Re-render if copy changes | Hand-authored | Original |
| hero/hero-shelf(.webp, @2x.webp, @2x.avif) | The shelf in window light, wide 16:9 | Hero A | three.js primitives, 40-sample accumulated bake, developed in numpy/Pillow | Original |
| hero/hero-room(.webp, @2x.webp) | Hammershøi easel interior in ink, violet canvas, 16:9 crop | Hero B / big section break | SMK KMS7444 via IIIF https://iip.smk.dk/iiif/jp2/rx913s91d_KMS7444.tif.reconstructed.tif.jp2/full/2880,/0/default.jpg, duotone + spot overprint | Public Domain Mark 1.0 (source); treatment original |
| hero/hero-detail(.webp, @2x.webp, @2x.avif) | Close crop of the shelf | Mobile hero, section header | three.js bake | Original |
| products/{mcp-emails,fun-libs,toolrails,harbor}(.webp, @2x.webp) | Product portraits: the real icon as a glazed tile on the shelf, 4:5 | Product cards, detail plates | three.js bake with the real icons from designs/_shared/products | Original render; logos © their products |
| products/objects/*.webp | Same tiles as transparent cut-outs with soft shadows | Drag-to-rearrange DOM shelf, floating objects | three.js bake on black + white, difference-matted | Original |
| products/real/* | The real product logos, copied as-is | Wherever the actual logo is needed | designs/_shared/products | Product brands, unchanged |
| retired/{polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}.svg | Plaster stand-in tiles (debossed glyphs) for retired products without brands | Retired list | Hand-authored SVG | Original |
| retired/retired-shelf(.webp, @2x.webp) | The plaster casts and Luma on the shelf | Retired section header | three.js bake | Original |
| retired/objects/*.webp | Cut-outs of the plaster tiles and Luma | DOM shelf, retired list | three.js bake, difference-matted | Original |
| plates/easel-aniline(.webp, @2x.webp) | Full easel interior, ink + violet canvas | About / company section | SMK KMS7444 (see above) | PD Mark 1.0; treatment original |
| plates/doors-ink.webp | *Stue. Fløjdørene står åbne…* (1911), ink print | Section break, quote backdrop | SMK KMS9204, https://iip.smk.dk/iiif/jp2/p2677147q_kms9204.tif.jp2/full/2400,/0/default.jpg | PD Mark 1.0 |
| plates/gable-ink.webp | *Husgavle. Frederiksværk. Sommer.* (1904), ink print | Location / Norway-Nordic context, footer | SMK DEP1245, https://iip.smk.dk/iiif/jp2/5q47rt81z_dep1245.tif.jp2/full/2400,/0/default.jpg | PD Mark 1.0 |
| plates/attic-scan.webp | *Attic Room with a Table and Chair* (1883–85), colour scan | Writing / posts section | SMK DEP1249, https://iip.smk.dk/iiif/jp2/kh04dv57j_dep1249.tif.jp2/full/2400,/0/default.jpg | PD Mark 1.0 |
| plates/candles-scan.webp | *To lys på et bord* (1901), colour scan | Small accent beside long text, 404 | SMK KMS9203, https://iip.smk.dk/iiif/jp2/c534ft70g_kms9203.tif.jp2/full/2400,/0/default.jpg | PD Mark 1.0 |
| plates/oaks-drawing.webp | *Oak Trees* (1899–1902), squared drawing | Texture behind the "day job" / process section; multiply onto paper | SMK KKS21235, https://iip.smk.dk/iiif/jp2/vd66w2817_KKS21235.tif.reconstructed.tif.jp2/full/2400,/0/default.jpg | PD Mark 1.0 |
| extras/daylight.webp | A window's light as an alpha overlay | Over any section (soft-light) | Generated (Pillow: sheared panes, blur, falloff) | Original |
| extras/grain-ink.png | 240px tileable film grain in ink (alpha) | Page-wide overlay at 10–15% | Generated (numpy) | Original |
| extras/colour-target.svg | Museum reference target + 10 cm scale in brand colours | Palette section, beside product plates, footer | Hand-authored SVG (text outlined) | Original |
| extras/tag-{mcp-emails,fun-libs,toolrails,harbor}.svg | Catalogue string tags: name, since-year, status | Pinned to product photos | Hand-authored SVG (text outlined) | Original |
| extras/aniline-cube.webp | The violet cube as a cut-out object | Loose object: list bullets, scroll marker, 404 | three.js bake, difference-matted | Original |
| three/shelf-scene.js | The scene module | Bakes + live shelf | Hand-written, three@0.170.0 | Original (three.js MIT) |
| three/shelf-live.js | Live draggable shelf | Interactive section / hero on desktop | Hand-written | Original |
| three/bake.html | Offline renderer | Re-baking stills | Hand-written | Original |
| three/demo.html | Tiny demo | Reference | Hand-written | Original |
| motion.css, motion.js | Motion study (FLATBED, DAYLIGHT, RESHELVE, VITRINE, STAMP) | Whole site | Hand-written | Original |
| fonts/*.woff2 | Instrument Serif (+italic), Geist, Geist Mono, Latin subset | Site type | Google Fonts repo (links above), subset with fontTools | SIL OFL 1.1 |
