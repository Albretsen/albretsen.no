# Asset kit 72: Low Sun Terrace

Open `preview.html` (served from the repo root, e.g. `http://127.0.0.1:6072/designs/72/assets/preview.html`) to see everything in one place.

## Vision

A miniature set that sits somewhere between the Costa del Sol and a Norwegian small town in January. A whitewashed house with an arched loggia and bougainvillea over the door sits on a snowy terrace. Its two wings are falu-red clapboard with white six-pane windows, and the long flat ranch roof carries a slab of snow. In front is a frozen pool between two striped parasols, each with a little cap of snow, and cypresses stand at both ends. Golden California hills roll behind, dusted with snow, and Norwegian peaks rise behind those. The scene is lit by a low winter sun from behind and to the right, so the snow turns peach, the shadows run long and blue toward you, and every window glows.

It is built in 3D like a scale model and framed with Wes Anderson symmetry: dead centre, long lens, tilt-shift. The hero idea starts from a travel magazine's opening spread. The left page is cream paper with the folio and the line; the right page is the photograph. The gutter of the spread lines up with the symmetry axis of the house, and the single camera move dollies down that axis to the lit doorway.

The personality is an optimistic builder. Someone came in early: a line of footprints leads to the door. Each product is a building of its own on the same terrace, and its window is lit or dark according to its status. The site's subject stays the software. The house supplies the atmosphere. The copy never names a place.

**Mood:** calm, sunlit, crisp, expensive without being a hotel. One strong idea per screen, generous whitespace, and nothing that moves on its own except the opening spread.

### References

- https://www.apartamentomagazine.com: lived-in editorial calm, small mono labels, generous margins (structure only; their fonts and colours were not readable)
- https://www.chateaumarmont.com: a single-poster landing page with a short vertical list of links; restraint as luxury
- https://www.nasjonalmuseet.no/en/collection/: the source for the Norwegian palette (falu red, ochre, slate on white clapboard)
- https://unsplash.com/t/travel: framing study for the "opening spread" photograph
- Miniature faking / tilt-shift: https://en.wikipedia.org/wiki/Miniature_faking, three.js tilt-shift shaders https://threejs.org/docs/pages/module-VerticalTiltShiftShader.html
- Scroll-driven single camera path: Codrops, "Building a Scroll-Driven 3D Gallery Using a Blender Camera Path with Three.js and GSAP" https://tympanus.net/codrops/?p=117076; Unseen Studio scroll camera thread https://discourse.threejs.org/t/how-is-the-scrolling-animation-implemented-on-the-unseen-studio-website/87789
- Hover reveals: CSS mask reveal https://css-tip.com/reveal-hover-mask/, cursor spotlight https://freefrontend.com/code/cursor-tracking-spotlight-reveal-effect-2026-01-26/
- Albert Sans: https://fontsource.org/fonts/albert-sans/about

Salt `2f9ff8`: the first digit (2) picked result #2 of the Commons search "snow sunrise mountains" (the Kaikoura panorama). It was rejected: it shows a town and a summer-orange sky, which are off-brief. Its neighbour #5 (Sheep Mountain) became `golden-hills`. `f`/`9` overflowed the short licence-filtered lists, so the long-shadows photo is #0 of "snow field low sun shadows".

## Palette

| Name | Hex | OKLCH | Use |
|---|---|---|---|
| Whitewash | `#F6F1E7` | oklch(95.9% 0.014 84.6) | page, walls |
| Falu red | `#8F2B20` | oklch(44.1% 0.137 29.8) | accent, mark, links |
| Ochre | `#C8902F` | oklch(69.2% 0.128 76.8) | status dots, small accents |
| Ink | `#323A44` | oklch(34.5% 0.021 254.1) | text |
| Slate | `#4B5663` | oklch(44.9% 0.025 252.7) | secondary text, roofs |
| Snow shade | `#C9D3E3` | oklch(86.4% 0.025 259.8) | shadows, rules |
| Golden hill | `#EDB96A` | oklch(81.7% 0.114 76.5) | inside images only |
| Horizon | `#F7C49B` | oklch(85.6% 0.080 60.2) | glow, hover light |
| Sky | `#86A9D3` | oklch(72.4% 0.073 253.3) | inside images only |
| Bougainvillea | `#B8364B` | oklch(53.2% 0.166 15.7) | hover detail only |
| Cypress | `#2F3D36` | oklch(34.5% 0.022 163.3) | inside images only |

UI rule: whitewash, ink and falu red carry about 90% of every screen. Ochre is reserved for small signals. The warm colours (horizon, golden hill) live in images and in the raking-light hover.

## Typefaces

- **Albert Sans** (Andreas Rasmussen, SIL OFL 1.1). This is a Scandinavian geometric sans. The variable woff2 files cover Latin, including æøå: `fonts/albert-sans-latin-var.woff2` (100–900) and `fonts/albert-sans-italic-latin-var.woff2`. Use weights 100–200 for display (−0.02 to −0.04em tracking) and 300 for body text. Source: Google Fonts, https://fonts.google.com/specimen/Albert+Sans
- **DM Mono** (Colophon, SIL OFL 1.1), weights 300 and 400, for folios, labels, figures and the MCP command. Set it in uppercase with 0.14em tracking. Source: https://fonts.google.com/specimen/DM+Mono

## 3D and interactive

- `3d/terrace.js` is the whole miniature as one ES module. It needs an import map for `three@0.169.0` (jsdelivr) and its addons, as used in `3d/demo.html`.
  - `createTerrace(canvas, { shot, width, height, dpr, post, ao, shadowSize, product, logoUrl, sun })` returns `{ setProgress(0..1), render(), resize(w,h) }`.
  - Shots: `hero-wide`, `hero-tall`, `og`, `arch-detail`, plus `product` together with `product: 'mcp-emails' | 'fun-libs' | 'toolrails' | 'harbor'` and `logoUrl` (the real logo from `designs/_shared/products`).
  - The pipeline is a painted backdrop scene (sky, hill flats, sea) rendered first, then the set with PCF soft shadows, then GTAO ambient occlusion (set only), an asymmetric tilt-shift and a grade pass (matte blacks, warm highlights, slight pastel, vignette, grain). Tone mapping is Neutral.
  - `cameraAt(p)` defines the one camera move: from the wide spread, down the pool axis, to the lit doorway, with an in-out cubic ease.
- `3d/demo.html` is the live hero. It shows the baked AVIF/WebP/JPEG still first (stable LCP, zero layout shift), then loads three.js when the browser is idle and fades the canvas in. Scrolling drives the dolly. Rendering happens only while the camera is still settling. For live use the demo turns AO off and uses 2048 shadows.
- `src/bake.html?shot=…&w=…&h=…` is the page used to bake every render in this kit. Run it through `scripts/shot.sh`.

## Motion study (`motion.css`, `motion.js`)

1. **Slow Dolly.** This is the single, unbroken camera move. Scroll maps to one 0..1 value, which is lerped (0.06) into `terrace.setProgress` by `initDolly()`. It follows Codrops' scroll-driven camera path and the Unseen Studio approach. `.m-dolly` is a CSS fallback on the baked still, using `animation-timeline: view()` to push in toward the door.
2. **Spread Unfold.** This plays once, on load. The right-hand page opens from the gutter (`rotateY(-62deg)` to 0) over 1.6 s with a long deceleration, while the left page settles in. It echoes the moment a magazine's opening spread lies flat, as on Apartamento's print spreads.
3. **Raking Light.** On hover or focus, a band of low sun crosses a card from right to left. On its way it reveals an engraved, white-on-white line, such as a product's facts. The technique is a gradient sweep plus emboss text-shadow, after the CSS mask reveal references.
4. **Shutters.** Falu-red clapboard shutters swing open on their hinges (CSS 3D, `rotateY(±112deg)`) and reveal a lit room holding the product. It is the "lit window" idea as a hover.
5. **Long Shadow Type.** A display line casts a stepped, snow-shade-blue shadow that lengthens toward the lower left as the section scrolls up, like the sun sinking.

The easing tokens are `--ease-dolly` cubic-bezier(.65,0,.35,1) and `--ease-light` cubic-bezier(.2,.7,.1,1), with durations of 1.6 s, 0.9 s and 0.45 s. Everything respects `prefers-reduced-motion`.

## Inventory

| File | What | Intended use | Source / how | Licence |
|---|---|---|---|---|
| `brand/mark.svg` | Arch in falu red with a low sun on the sill | logo mark, nav | hand-built SVG geometry (`src/brand.py`) | original, owned by client |
| `brand/mark-tile.svg`, `brand/favicon.svg` | Mark on a whitewash tile | favicon, app tile | same | original |
| `brand/favicon-180.png` | 180 px apple-touch icon | `<link rel=apple-touch-icon>` | rsvg-convert of favicon.svg | original |
| `brand/wordmark.svg` | Mark + "Albretsen" (Albert Sans 300, outlined) + "AS" | header, footer | fontTools outlines of Albert Sans (`src/brand.py`) | original; glyphs from an OFL font, outlined |
| `brand/wordmark-text.svg` | Wordmark without the mark | tight spaces | same | same |
| `brand/wordmark-light.svg` | Light version | on falu red or photographs | same | same |
| `brand/og-1200x630.jpg` | Open Graph card: the spread | social preview | `src/og.html` screenshot | original (contains render) |
| `hero/terrace-wide-{2560,1600,960}.{avif,webp}` + `-{1600,960}.jpg` | The terrace house, 16:9, low sun | desktop hero, OG, poster for live 3D | three.js render, `src/bake.html?shot=hero-wide` | original |
| `hero/terrace-tall-{1280,800}.{avif,webp,jpg}` | Same set, 4:5 | mobile hero | three.js render, `shot=hero-tall` | original |
| `hero/golden-hills-*` | Snow-dusted mountain lit gold above a fog bank | second hero, about section | "Fresh snow sunrise on Sheep Mountain", NPS / Jacob W. Frank, https://commons.wikimedia.org/wiki/File:Fresh_snow_sunrise_on_Sheep_Mountain_(54964006671).jpg, cropped 16:9, graded (`src/grade.py`) | public domain (US NPS) |
| `hero/long-shadows-*` | Long tree shadows on a snowfield, low sun | section break, writing cover | "Long shadows on the snow near Mt. Bachelor, Oregon", Bonnie Moreland, https://commons.wikimedia.org/wiki/File:Long_shadows_on_the_snow_near_Mt._Bachelor,_Oregon_-_Flickr_-_Bonnie_Moreland_(free_images).jpg, cropped, graded | public domain (as marked on Commons) |
| `products/mcp-emails-{1600,800}.*` | Whitewashed post house, REAL logo on an enamel sign, red letterbox, lit door | product card | three.js render, `product=mcp-emails`, logo `_shared/products/mcp-emails/logo-mark.svg` unchanged | render original; logo © client |
| `products/fun-libs-{1600,800}.*` | Ochre kiosk, REAL v5 icon in the shop window, bench | product card | render, logo `_shared/products/fun-libs/icon.png` | same |
| `products/toolrails-{1600,800}.*` | Slate ranch pavilion, REAL icon as a lit sign, fresh boards stacked (building) | product card | render, logo `_shared/products/toolrails/icon.svg` | same |
| `products/harbor-{1600,800}.*` | White clapboard house, REAL mark in a dark window (paused), falu red door | product card | render, logo `_shared/products/harbor/harbor-mark.svg` | same |
| `products/retired/*.svg` | Enamel door plaques for Luma, Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, early apps | "retired" row | hand-built SVG (`src/extras.py`); simple pictograms, not product logos | original |
| `extras/clapboard-white.{png,webp}`, `extras/clapboard-falu.{png,webp}` | Seamless clapboard tiles | section bands, shutters, footers | numpy procedural (`src/extras.py`) | original |
| `extras/whitewash-grain.png` | Tileable near-white grain, 256 px | page background with `background-blend-mode: multiply` | numpy procedural | original |
| `extras/bougainvillea-sprig.svg` | Cut-out garland of three-bract blossoms | hover edge, footer, 404 | procedural SVG | original |
| `extras/low-sun.svg` | Low sun, one cypress, long blue shadow | section divider, empty states | hand-built SVG | original |
| `extras/folio.svg` | Running head: ALBRETSEN AS ○ NO. 01 — WINTER LIGHT | top of the spread, print feel | SVG | original |
| `extras/norway-from-orbit-{1600,800}.*` | Southern Norway under snow from orbit, quiet duotone-ish grade | about / "where" plate without naming a place | NASA Earth Observatory "Snow-Parched Scandinavia" (MODIS Terra, 2020), https://science.nasa.gov/earth/earth-observatory/snow-parched-scandinavia-146475/ (file `scandinavia_tmo_2020081_lrg.jpg`), cropped, graded | public domain (NASA) |
| `3d/terrace.js` | The miniature set, camera move, product pavilions | live hero, baking | hand-written three.js module | original |
| `3d/demo.html` | Live scroll dolly with a still poster | interactive demo | — | original |
| `motion.css`, `motion.js` | Five named motion studies | site motion | — | original |
| `fonts/*.woff2` | Albert Sans var (roman, italic), DM Mono 300/400, Latin subset | all type | Google Fonts (fonts.gstatic.com) | SIL OFL 1.1 |
| `src/*.py`, `src/*.html` | Grading, identity, extras and bake scripts | reproducibility | — | original |

Total folder size is about 5 MB. Initial weight for a page using this kit is about 150 KB: hero AVIF at 1600 px (≈32 KB), two fonts (≈40 KB), mark, CSS and the grain tile. three.js (≈170 KB gz) loads only after first paint.
