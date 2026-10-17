# Asset kit 70: Stucco Hour

The kit for Albretsen AS (albretsen.no). Open `preview.html` to see everything working: the heroes, the live sky, the product niches, the palette, the type and all five motion studies.

## Art direction

**Vision.** A whitewashed house on a warm coast, photographed at the hour when the light is low and long. Everything is still except the sun. The page's sky follows the real sun over Norway, so the site is never quite the same twice. The products sit in the architecture like objects set into a wall: one niche each, each at its own hour.

**What it is not.** It is not a postcard, a hotel or a travel brochure. There are no landmarks, palm emoji or "Bonjour", no film stills, and no nautical, mechanical or industrial metaphors. The subject is still a software company: the products are the only objects in the frame. One strong idea per screen and generous plaster-white space. The light does the talking.

**Mood words.** Serene, spacious, exact, sunlit, unhurried, expensive in the quiet way.

**The two worlds, blended.**
- *Whitewash and bougainvillea* (relaxed southern luxury): lime plaster, deep arched reveals, sage louvred shutters, terracotta floors, one flowering vine.
- *Sunrise and sunset*: a physically modelled sky (Rayleigh, Mie and ozone scattering), a low sun, and long warm light patches that move with it.

**Hero concept, pushed.** The brief started from "a full-bleed landscape with the name set into the scene". Here the landscape is framed by architecture. Hero A looks out of a cool room through one arch to the sea, and the low sun lays a second arch of gold on the wall. The name is painted on the plaster above the arch (`mix-blend-mode: multiply` over the photo; see `preview.html`). Hero B is a symmetric house front in raking morning light, with the name set in the sky above the roofline. The surprise is that the room changes with the real hour in Norway: day, golden, blue and night plates of the same room, chosen by `interactive/sky.js`.

**References studied** (salt `8f426a` picked entries 8, 15, 4, 2, 6 and 10 of the Awwwards list):
- Awwwards Sites of the Day (Oct 2026): https://www.awwwards.com/websites/sites_of_the_day/. Opened: Milledollars (https://milledollars.fr/), twks (https://twks.ch/en), Maria Vasilyeva (https://www.mariavasilyeva.com/), Neutomni (https://neutomni.com/). Lesson: a numbered, quiet index and lots of empty space.
- Awwwards inspiration, "Time of Day Adjustment" (WebGPU archviz): https://www.awwwards.com/inspiration/time-of-day-adjustment-3d-webgpu-archiviz. Lighting by hour as the interaction.
- Jacquemus (https://www.jacquemus.com): sun-bleached minimalism with one saturated object per frame. The site blocked fetching; studied from memory of its art direction.
- Airbnb Luxe (https://www.airbnb.com/luxury) and the Framer Ibiza villa case (https://www.framer.com/community/gallery/16444/): image-led calm, generous type.
- The Met Open Access botanical watercolours, e.g. Margaret Neilson Armstrong, *Star Jasmine* (https://www.metmuseum.org/art/collection/search/393670): colour and cut-out logic for the bougainvillea garland. No museum image is used.
- D'Ora Tokai's White Arcade villa (https://design-milk.com/dora-tokai-designs-the-white-arcade-dubai-villa/): rhythmic arches and warm whites.
- Techniques: scratchapixel / Nishita single scattering; Dammertz et al. 2010 "Edge-avoiding À-Trous wavelet transform" for the denoiser; the Astronomical Almanac low-precision solar position; scroll-driven CSS (`animation-timeline`) day-to-night demos (https://dev.to/_artclick/build-a-scroll-driven-day-to-night-animation-using-pure-css-1o3p); clip-path moving shadows.

## Palette

| Token | Hex | OKLCH | Use |
|---|---|---|---|
| lime | `#F6F1E8` | `oklch(96.0% 0.013 82.4)` | page, plaster |
| sand | `#E9DCC6` | `oklch(89.9% 0.033 81.0)` | panels, tiles |
| dune | `#CDB48E` | `oklch(78.2% 0.059 78.1)` | hairlines, quiet UI |
| poppy | `#E4572E` | `oklch(63.7% 0.184 36.5)` | the sun; one accent per screen |
| terracotta | `#B5603A` | `oklch(58.1% 0.122 43.8)` | floors, pots, warm links |
| sage | `#8E9D80` | `oklch(67.6% 0.045 129.9)` | shutters, secondary |
| sage-deep | `#5F6F58` | `oklch(52.2% 0.040 136.2)` | small labels on lime (AA) |
| sky | `#A9C7DB` | `oklch(81.4% 0.043 237.3)` | sky, cool fills |
| sky-deep | `#4F7FA3` | `oklch(57.7% 0.076 242.2)` | links on lime |
| bougainvillea | `#C2306B` | `oklch(55.2% 0.187 1.2)` | rare: a flower, never a button |
| ink | `#2A2420` | `oklch(26.6% 0.012 55.8)` | text |
| dusk | `#1C2433` | `oklch(26.0% 0.031 262.7)` | night theme ground |

At runtime `interactive/sky.js` also writes `--sky-zenith`, `--sky-horizon`, `--sun-color`, `--sun-el` and `--sky-phase`. Use them sparingly, for example for the page's top edge, a rule or the night theme switch.

## Type

- **EB Garamond** (Georg Duffner and Octavio Pardo, SIL Open Font License 1.1). Self-hosted, Latin subset, variable weight 400–800 with italic: `fonts/eb-garamond-latin.woff2` (110 KB) and `fonts/eb-garamond-italic-latin.woff2` (126 KB). Source: https://github.com/google/fonts/tree/main/ofl/ebgaramond. Licence: `fonts/OFL.txt`.
- Display at weight 430–470, tracking −0.005em, line-height 0.9. Body 18/28 at 400. Labels are uppercase at 13–14 px with 0.2–0.24em tracking. Use old-style figures in prose (`font-variant-numeric: oldstyle-nums`) and lining tabular figures in stat rows.
- Commands use the system monospace only.
- The wordmark SVGs are outlined, so they need no font.

## How the imagery was made

Everything visual is generated in code for this kit:
- `src/render.html` + `src/render.js` + `src/scenes.js` + `src/glsl-common.js`: a progressive **path tracer** in WebGL2. It uses signed-distance-field architecture, a precomputed physically based sky LUT, next-event sun sampling with soft shadows, a glossy terracotta floor, translucent bracts, and up to 3 bounces. The noisy indirect light is split out and denoised with an edge-aware À-Trous filter guided by position and normal. Renders run in headless Chrome and are captured by screenshot, in horizontal tiles. Scenes: `terrace` (hero A), `facade` (hero B) and `niche` (products, `?v=0..3`).
- `src/grade.py`: a photographic grade (white balance, split tone, film curve, highlight bloom, fine grain, vignette) plus export to AVIF (ffmpeg/libsvtav1), WebP and JPEG.
- `src/identity.py`: builds the mark, wordmark, lockup and favicon, with EB Garamond outlines via fontTools.
- `src/illustrations.py`: the hand-built SVG illustrations and retired-product stand-ins.
- `src/textures.py`: seamless FFT-filtered noise textures and light/shadow overlays.
- `src/og.html`: the Open Graph composition, screenshotted at 1200×630.

To re-render a plate, serve the repo root, open `src/render.html?scene=terrace&w=2400&h=1350&spp=128`, and screenshot it. Add `&fw=&fh=&ox=&oy=` to render one tile of a bigger frame.

## Inventory

| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| `hero/terrace-golden-{2400,1600,960}.{avif,webp,jpg}` | Hero A: room, arch to the sea, golden light on the wall | Home hero, landscape | Path-traced (`scene=terrace`), graded | Original, client-owned |
| `hero/terrace-golden-portrait-{1200,800}.*` | Hero A recomposed for phones | Home hero ≤700 px | Same | Original |
| `hero/terrace-{day,blue,night}-{1600,960}.*` | Hero A at the other three phases | Real-time swap via `sky.js` phase; *Slow Dawn* start plate | Same, different sun | Original |
| `hero/facade-morning-{2400,1600,960}.*` | Hero B: symmetric white facade, sage shutters, bougainvillea | Second hero, about page, OG | Path-traced (`scene=facade`), graded | Original |
| `hero/facade-morning-portrait-{1200,800}.*` | Hero B for phones | ≤700 px | Same | Original |
| `products/mcp-emails-niche-{960,600}.*` | MCP Emails icon as a glazed plaque in a niche, morning louvre light | Product card / page header | Path-traced (`scene=niche&v=0`) with the real `icon.png` | Render original; icon is Albretsen AS's |
| `products/fun-libs-niche-{960,600}.*` | Fun Libs icon, noon leaf shadow | Product card | `v=1`, real `icon.png` (v5) | Same |
| `products/toolrails-niche-{960,600}.*` | Toolrails icon, golden arched-window light | Product card | `v=2`, real `icon.svg` rasterised | Same |
| `products/harbor-niche-{960,600}.*` | Harbor mark and wordmark (crop of the real banner), at dusk for "paused" | Product card | `v=3`, real `banner.png` crop | Same |
| `products/retired/*.svg` | Arched stand-in tiles: Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, early apps | Archive list | Hand-built SVG | Original |
| `products/retired/luma-logo.png` | Luma's real logo, unchanged | Archive list | Copy of `_shared/products/luma/logo.png` | Albretsen AS |
| `identity/mark.svg`, `mark-light.svg` | The arch-A with the sun on the horizon | Header, footer, favicon | `src/identity.py` | Original |
| `identity/wordmark.svg`, `wordmark-currentcolor.svg` | "Albretsen" in outlined EB Garamond 470 | Header, hero | `src/identity.py` (OFL font, outlined) | Original artwork; font OFL |
| `identity/lockup.svg` | Mark + Albretsen + AS | Header | `src/identity.py` | Original |
| `identity/favicon.svg` | Favicon that follows dark mode | `<link rel=icon>` | Hand SVG | Original |
| `identity/apple-touch-icon-180.png` | 180 px touch icon | `<link rel=apple-touch-icon>` | rsvg-convert of `favicon-flat.svg` | Original |
| `identity/og-1200x630.jpg` | Open Graph image | `og:image` | `src/og.html` screenshot | Original |
| `extras/limewash-768.{webp,jpg}` | Seamless lime-wash plaster | Page background | `src/textures.py` | Original |
| `extras/grain-256.png` | Seamless grain overlay (alpha) | Overlay on flat fills | `src/textures.py` | Original |
| `extras/louvre-light.{webp,png}` | Warm light through a louvred shutter (alpha) | *Long Shadow* motion | `src/textures.py` | Original |
| `extras/leaf-shadow-1024.webp` | Seamless leaf-dapple shadow (alpha) | Quiet section texture | `src/textures.py` | Original |
| `extras/bougainvillea-garland.svg` | Cut-out garland of bracts and leaves | Section heads, 404 | `src/illustrations.py` | Original |
| `extras/shutters.svg` | Sage louvred shutters, half open | Contact / about vignette | `src/illustrations.py` | Original |
| `extras/arch-outline.svg`, `arch-mask.svg` | Arch line and mask shape | Image masks, frames | `src/illustrations.py` | Original |
| `extras/horizon-rule.svg` | Horizon line with a poppy sun | Section divider | `src/illustrations.py` | Original |
| `extras/sun-path.svg` | Rise–noon–set arc | Live-sky readout | `src/illustrations.py` | Original |
| `interactive/sky.js` | Live WebGL2 sky for the real sun over Norway, plus CSS variables and phase | Hero sky, theme | Written for this kit | Original |
| `interactive/sky-demo.html` | Full-screen demo with time scrubber | Demo | Written for this kit | Original |
| `motion.css`, `motion.js` | Five named motion studies (below) | Site-wide | Written for this kit | Original |
| `fonts/*.woff2`, `fonts/OFL.txt` | EB Garamond, Latin subset | All text | google/fonts (OFL) | SIL OFL 1.1 |
| `src/*` | Renderer, grade, generators, OG composer, product textures (`src/tex/`, copies of the real icons) | Reproducibility | Written for this kit | Original |

## Motion (motion.css + motion.js)

The house rule is that the sun moves and everything else is still. No element slides, scales, tilts or parallaxes. Only light changes.

1. **Heliotrope.** One sun disc on a shallow arc over the hero, positioned from `--sun-t` with CSS trig (`sin()`). It warms toward the horizon. `sunClock()` maps today's real sunrise→sunset in Norway onto 0..1, updated each minute. *Reference: the time-of-day archviz on Awwwards; scroll-driven day/night CSS demos.*
2. **Long Shadow.** A louvred light patch on a plaster section slides, shears and warms as the section crosses the viewport, the way a window patch lengthens toward evening. It uses pure CSS `animation-timeline: view()`, with `scrollShadow()` as the fallback. *Reference: clip-path shadow techniques; Apple-style scroll-linked light.*
3. **Slow Dawn.** On load the hero rises from its blue-hour plate to the current light over 2.4 s. Text appears by exposure (opacity) only. *Reference: the slow opacity-only entrances of fashion houses (Jacquemus, Aesop).*
4. **Light Leak.** A warm radial pool follows the pointer over product cards with a slow damped lag. The card itself never moves. *Reference: the spotlight cards on Linear and Vercel, recast as sunlight.*
5. **Arch Reveal.** Images enter through an arched clip-path that opens from the threshold, triggered once on intersection.

All five respect `prefers-reduced-motion`.

## Performance notes

- Hero A is 28 KB (1600) and 55 KB (2400) as AVIF; hero B is 67 KB and 133 KB. Use `fetchpriority="high"` with the AVIF/WebP `srcset` shown in `preview.html`, and always set `width`/`height` (or `aspect-ratio`) to keep layout shift at 0.
- Load `sky.js` after first paint. It is about 10 KB with no dependencies and draws at 40% resolution, once a minute.
- Fonts: preload the roman only and let the italic load on demand.
