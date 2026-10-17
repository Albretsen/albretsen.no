# Design 74: Afterglow Diorama

Open `preview.html` to see every asset, the palette, the type, the four motions and the live diorama.

## Vision

A cut-paper miniature of a single coast that you can turn in your hand. There is a mid-century glass house on a cliff with a long cantilevered roof. Below it, a boulevard of lamps and palms curves along the shore, and a jagged mountain stands straight out of the sea, Norwegian in scale and Californian in haze. The sky behind the paper is a real photographed sky, graded to the palette. In the live version it is the real sky over Norway at this moment, and a day passes as you scroll.

The atmosphere is warm, playful and precise. Every element is a sheet of card. Each sheet casts a soft shadow on the one behind, its cut edge catches the light, and it carries real paper fibre. Precision shows in the craft rather than in ornament: one strong idea per screen, generous space, and light doing the work. The subject stays a software company. Each product gets one hour of the day and one place in the same street.

The LA side brings palm silhouettes, the hazy pastel dusk, mid-century modern architecture and long boulevards of light. The sunshine side brings ochre walls, striped awnings, sea blue and a paper sun. The afterglow is the default state: the sky still burning after the sun has gone.

**Mood words:** afterglow, card stock, cantilever, boulevard, sea blue, quiet confidence, miniature.

**Never:** place names or postcard captions in the copy, neon kitsch, travel-agency framing, gears, ships or maps.

### References studied
- https://www.apartamentomagazine.com: lived-in warmth, plain hierarchy, imagery carries the colour.
- https://www.cosmos.so: calm grid, cards that lift on hover (source of *Paper Lift*).
- https://www.soho-house.com and https://www.design-hotels.com: both redirect or are parked today, so I studied hotel lettering instead: Fontstand, "Fonts in Use: Sleeping over" (https://news.fontstand.com/fonts-in-use/fonts-in-use-sleeping-over/). Capitals signal presence, and generous tracking sets the rhythm.
- The Firewatch site's layered parallax header, as described at https://library.superhi.com/posts/the-parallax-effect and https://dev.to/accudio/making-a-parallax-svg-landscape-new-site-part-1-2cd7 (depth-scaled layers, the source of the hero layer split).
- Googie roadside signage, e.g. the Holiday Motel sign (UNLV Special Collections, https://special.library.unlv.edu/node/268768), the source of *Sign Light-Up*.
- Solar position after SunCalc / Meeus (https://github.com/mourner/suncalc), reimplemented in ~15 lines in `js/diorama.js`.
- Poly Haven API (https://api.polyhaven.com) for the CC0 pure-sky panoramas, and ambientCG (https://ambientcg.com) for the CC0 paper.

The salt `6cc78e` picked items as follows. The 6th ambientCG paper result was Paper004 (checked, too ribbed), so I used Paper006. The 6th font search result was a paid script face, which was rejected, so I chose Josefin Sans (OFL) instead.

## Palette: Riviera

| Name | Hex | OKLCH | Use |
|---|---|---|---|
| Ochre | `#D9A441` | oklch(75.1% 0.130 79.8) | sun discs, awnings, the dot in the wordmark |
| Ochre light | `#F2C66D` | oklch(84.7% 0.119 83.5) | the sun in the mark |
| Terracotta | `#C2603E` | oklch(60.0% 0.135 39.5) | accent, links, the pylon, tile surrounds |
| Terracotta deep | `#8E3F2C` | oklch(46.8% 0.112 34.8) | noon foreground, small labels on paper |
| Sea blue | `#2F6E9E` | oklch(52.0% 0.100 244.6) | the sea, shutters, the A-peak in the mark |
| Sea deep | `#1D4566` | oklch(37.8% 0.072 246.2) | deep water, dark-mode panels |
| Lavender | `#A99BD1` | oklch(72.1% 0.079 296.3) | far mountains, the arch in the mark |
| Lavender deep | `#6E5A8E` | oklch(50.9% 0.084 301.2) | muted text, dusk sheets |
| Afterglow rose | `#E7A39A` | oklch(77.8% 0.082 27.5) | clouds, cut-edge light at dusk |
| Paper | `#F5EBDC` | oklch(94.4% 0.023 78.2) | page background, frames, plaques |
| Plum ink | `#2E2240` | oklch(28.1% 0.056 301.4) | text, outlines, dark background |
| Lamp glow | `#FFC979` | oklch(86.7% 0.116 76.1) | lamps, lit windows (light only, never text) |

The live light states (night, blue hour, afterglow, golden hour, morning, noon) are in `LIGHTS` in `js/paperworld.js`. They are interpolated by sun altitude.

## Typefaces (self-hosted, `fonts/`, SIL Open Font License)
- **Josefin Sans** (variable 300–700): hotel and signage capitals, tracked 0.30–0.42 em. Used for the wordmark (outlined), labels, nav and product names. Source: Google Fonts.
- **Instrument Serif** (roman and italic): one italic headline per screen, plus body text at 18–21 px. Source: Google Fonts.
- **DM Mono** (400, 500): the MCP command, figures and the sky readout. Source: Google Fonts.

## How to use it (for the builder)
- **First paint:** use `hero/hero-afterglow-*` in a `<picture>` (AVIF, then WebP, then JPEG; 640/1024/1600/2560, all 16:9). On phones use `hero-afterglow-portrait-*` (9:16). Give it width/height for zero layout shift. The 1600 AVIF is 37 KB.
- **Parallax hero (optional upgrade):** `hero/sky-afterglow.jpg` plus `hero/layers/layer-1…4` (transparent, 16:9, the same framing as the hero). Put the name between the sky and layer 1. Depth factors that work: 0.2 / 0.5 / 1 / 1.5 / 2.2.
- **Live diorama:** `import { mountDiorama } from './assets/js/diorama.js'`. Load it lazily after first paint (it is about 12 KB plus paperworld.js at about 25 KB, and needs no WebGL). `d.setAltitude(alt)` follows scroll, and `d.live()` returns to the real sky. `motion.js` `dayPass(el, (day, alt) => d.setAltitude(alt))` connects the two.
- **Product order follows the day:** MCP Emails 08:00, Fun Libs 12:00, Toolrails 18:30, Harbor 21:40. Retired products are shuttered arches.
- **Section transitions:** `extras/edge-*.svg` at the bottom of a section. Use `boulevard-divider.svg` between chapters.

## Motion study (`motion.css`, `motion.js`)
1. **Day Pass.** The `--day` custom property (0 dawn → 1 night) slides a five-key sky. It uses scroll-driven animation where supported and a JS fallback elsewhere, and it also drives the diorama's sun. Reference: Firewatch layered parallax; apple.com scroll-linked timelines.
2. **Sign Light-Up.** Spaced capitals switch on letter by letter with one warm flicker. Reference: Googie motel signs, hotel lettering.
3. **Paper Lift.** On hover or focus, a contact shadow becomes a soft 40 px lift with a −0.4° tilt. Reference: cosmos.so cards.
4. **Boulevard On.** Lamps ignite from the vanishing point toward the viewer, 70 ms apart. Reference: dusk on palm-lined boulevards.
5. **Turntable** (in `diorama.js`). Dragging turns the box (±24°), and on release it eases back to 35% of the angle. All motion respects `prefers-reduced-motion`.

## Inventory

| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| `identity/mark.svg` | Arch with a sun behind an A-shaped peak and horizon cut, with paper shadows | logo mark, header | drawn by hand as SVG (`src/tools/identity.py`) | original, for Albretsen AS |
| `identity/favicon.svg`, `favicon-180.png` | Flat mark; 180 px touch icon on paper | favicon, apple-touch-icon | same, rasterised with rsvg-convert | original |
| `identity/wordmark.svg`, `wordmark-paper.svg` | ALBRETSEN · AS, Josefin Sans 600 outlined to paths | header, footer, OG | outlined with fontTools from Josefin Sans | original; font OFL |
| `identity/lockup-stacked.svg` | Mark over name over a ruled "A S" | about page, footer, print | same | original |
| `identity/og-image.jpg` | 1200×630 afterglow hero with wordmark and line | Open Graph / social | `src/og.html` screenshot | original + CC0 sky |
| `hero/hero-afterglow-{640…2560}.{avif,webp,jpg}` | **Hero 1**: the coast at afterglow over a real photographed sky | main hero | `js/paperworld.js` rendered in headless Chrome over `sky-afterglow.jpg` | original; sky CC0 |
| `hero/hero-noon-*` | **Hero 2**: the same coast at noon, sunshine | alternate hero, "day" chapter | same, over `sky-day.jpg` | original; sky CC0 |
| `hero/hero-diorama-*` | **Hero 3**: the miniature as an object, turned, golden hour | about / craft section, fallback for the live diorama | `diorama-demo.html?bare` screenshot | original |
| `hero/hero-*-portrait-{540,1080}.*` | 9:16 crops of heroes 1 and 2 | phone hero | renderer with `fx=0.3` cover crop | original; CC0 sky |
| `hero/sky-afterglow.jpg` | Real sky, graded violet, rose and apricot | parallax back layer | Poly Haven "Belfast Sunset (Pure Sky)" https://polyhaven.com/a/belfast_sunset_puresky, cropped around the sun and graded (`src/tools/sky.py`, `grade.py`) | CC0 |
| `hero/sky-day.jpg` | Real cloudy sky, graded sea blue and cream | noon back layer | Poly Haven "Evening Road 01 (Pure Sky)" https://polyhaven.com/a/evening_road_01_puresky | CC0 |
| `hero/sky-dusk.jpg` | Real soft dusk gradient, lavender to peach | quiet section backgrounds | Poly Haven "Qwantani Dusk 2 (Pure Sky)" https://polyhaven.com/a/qwantani_dusk_2_puresky | CC0 |
| `hero/layers/layer-{1-far,2-headland,3-boulevard,4-near}-{960,1920}.{avif,webp}` | Transparent paper sheets matching hero 1 | scroll/pointer parallax hero | renderer with `layers=` | original |
| `products/mcp-emails-*` | Real MCP Emails mark on a terracotta signage pylon, 08:00 | product card / page header | renderer (`src/vignettes.js`) + `_shared/products/mcp-emails/logo-mark.svg` unchanged | original; logo © Albretsen AS |
| `products/fun-libs-*` | Real Fun Libs icon as a glazed tile in a sunlit wall, 12:00 | product card | same + `_shared/products/fun-libs/icon.png` | original; logo © Albretsen AS |
| `products/toolrails-*` | Real Toolrails icon on a road sign at a boulevard of lamps, 18:30 | product card | same + `_shared/products/toolrails/icon.svg` | original; logo © Albretsen AS |
| `products/harbor-*` | Real Harbor mark on a plaque by a lit doorway, 21:40 | product card | same + `_shared/products/harbor/harbor-mark-filled.svg` | original; logo © Albretsen AS |
| `products/retired/*.svg` | Shuttered arches with enamel pictograms: Luma (real logo embedded), Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, Early apps | retired products list | `src/tools/retired.py` | original; Luma logo © Albretsen AS |
| `extras/cutouts/*.webp` | Fan palm, date palm, cypress, spruce, agave, lamp, pavilion (transparent, 600×750) | decoration, CSS masks, 404 page | renderer cut-out scenes | original |
| `extras/breeze-block.svg` | Seamless mid-century screen-block tile | footer and section backgrounds | hand SVG | original |
| `extras/boulevard-divider.svg` | Lamps receding to a vanishing point | chapter divider | hand SVG (`extras.py`) | original |
| `extras/edge-ridge.svg`, `edge-hills.svg`, `edge-ridge-plum.svg` | Knife-cut horizon edges with shadow | section transitions | generated SVG | original |
| `extras/sun-dial.svg` | 24-hour dial with a sun (rotate `#sun`) | sky readout widget | hand SVG | original |
| `textures/paper-grain.webp` | Seamless 512 px neutral paper fibre (multiply) | sheet texture, page grain | ambientCG Paper006 https://ambientcg.com/view?id=Paper006, high-passed and tiled | CC0 |
| `js/paperworld.js` | Cut-paper renderer: palettes, light states, silhouettes, sheet shading | everything raster here; live scenes | original code | original |
| `js/diorama.js` | **Interactive:** turnable CSS-3D shadow box, real Norway sun | hero or "how it works" chapter | original code | original |
| `diorama-demo.html` | Tiny demo for the diorama (slider, Now, `?alt=`, `?turn=`, `?bare`) | reference | original | original |
| `motion.css`, `motion.js` | The four signature motions | site-wide | original | original |
| `fonts/*.woff2` | Josefin Sans, Instrument Serif, DM Mono (Latin subset) | self-hosted type | Google Fonts (fonts.gstatic.com) | SIL OFL 1.1 |
| `src/bake.html`, `src/vignettes.js`, `src/og.html`, `src/tools/*` | Bake pages and scripts that regenerate every raster | rebuilds only, not for the site | original | original |

The total weight is about 5.4 MB. A first paint of hero 1 at AVIF 1600, the mark, the wordmark and two fonts comes to roughly 110 KB.
