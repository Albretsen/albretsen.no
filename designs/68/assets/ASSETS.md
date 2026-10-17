# Design 68: Noon & Dusk (asset kit)

## Vision

A technology company's site seen through a painted window. Every plate is a real CC0 photograph of Mediterranean streets, repainted as gouache (generalized Kuwahara, pigment pooling at value edges, cold-press paper tooth, uneven washes) and graded into one palette: hard Mediterranean noon by day, an LA dusk by night. The architecture of South of France villages (ochre stone, shutters, arches, terraces over the sea) meets the Paris of zinc mansards and didone type. Wes Anderson supplies the discipline: everything sits on the vertical axis of symmetry, framed head-on, and moves deadpan.

The brand idea in one image is the hero itself: **a terrace opening between two houses onto the sea**. At noon the opening is full of hot light. Press the sun and it sinks exactly on the axis into the horizon. The same frame becomes dusk, with the sun sitting on the sea dead centre. The mark repeats that composition: an arched opening, a horizon, a half sun. Read twice, it is an **A**.

Everything stays calm: one strong image per screen, wide margins, a hairline rule, a single italic word per headline. It is not a travel site, so there are no place names, no landmarks and no tourist copy. The products are the subject. Their real logos hang in the street like shop signs and enamel door plates.

**Mood words:** serene, spacious, sunlit, exact, dry wit.

**Hero concept, pushed:** a travel-magazine *opening spread*, except the spread is a doorway. The painting starts framed by the brand's arch (the "page" of the magazine) and, as you scroll, the arch dollies open to full bleed (motion 3, *Arch Opening*). The caption card below lands on a deadpan beat.

### Research and references

- https://polyhaven.com/hdris/outdoor: source of every photographed plate (CC0 HDRIs and their CC0 backplates: `vignaioli`, `venetian_crossroads`).
- https://linear.app: restraint, numbered figures ("Fig 0.1"), the product as hero, and one easing curve reused everywhere.
- https://www.thebalazs.com: currently redirects to thesourcecode.academy (307), so it was noted as unavailable. https://www.hoteldelavillevenice.com does not resolve (DNS failure).
- Maxime Heckel, "On Crafting Painterly Shaders" (https://blog.maximeheckel.com/posts/on-crafting-painterly-shaders), and Codrops "Susurrus" watercolour world (https://tympanus.net/codrops/?p=113145): the Kuwahara filter as the core of a painted look, plus edge darkening and paper grain as separate passes. Both the offline painter (Python) and the live shader (`rooftops.js`) follow this recipe.
- shaders.com watercolour component docs (https://shaders.com/docs/components/watercolor): pigment edge darkening, bleed and paper strength as separate parameters.
- MDN clip-path (https://developer.mozilla.org/docs/Web/CSS/clip-path) and web.dev CSS clipping (https://web.dev/css-clipping/): symmetric inset reveals (Shutters, Horizon).
- View Transitions theme reveals, e.g. https://rebeccamdeprey.com/blog/view-transition-api: the circular reveal pattern, replaced here by a horizon wipe.
- The whip pan, No Film School (https://nofilmschool.com/how-to-do-a-whip-pan): the *Whip Pan* product transition.
- Google Fonts Bodoni Moda (https://fonts.google.com/specimen/Bodoni+Moda): a didone with an optical-size axis, so hairlines survive at small sizes.
- NASA Image and Video Library (https://images.nasa.gov): astronaut photographs of the coast, used for the day/night postage stamps.
- Salt `7d6912`: the brief asked for its hex digits to pick search results. In practice I filtered the Poly Haven catalogue (997 HDRIs) by tags down to 62 sunny European-architecture scenes, looked at 15 thumbnails and downloaded 48 backplates from 3 of them. The final plates were chosen on fit to the brief, not by the salt.

## Palette

| Name | Hex | OKLCH | Use |
|---|---|---|---|
| Paper | `#F6EDE1` | `oklch(95.0% 0.019 75.3)` | day background |
| Palm black | `#211C24` | `oklch(23.6% 0.017 312.8)` | ink; never use pure black |
| Peach | `#EF9F7C` | `oklch(77.4% 0.107 44.4)` | the sun, primary accent |
| Mauve | `#A0809E` | `oklch(64.0% 0.058 328.3)` | shadow tint, dusk |
| Smog blue | `#7D93AD` | `oklch(65.5% 0.046 252.8)` | sky, secondary accent |
| Dusk | `#221D2A` | `oklch(24.2% 0.025 302.1)` | night background |
| Moon | `#F4E7D6` | `oklch(93.4% 0.027 74.8)` | night ink |
| Noon ochre | `#E2B25E` | `oklch(79.0% 0.116 79.8)` | sunlit stone, gilt lettering |
| Shutter green | `#2F5A46` | `oklch(43.0% 0.059 162.4)` | shutters, transition leaves |
| Terracotta | `#C9694B` | `oklch(62.6% 0.130 38.1)` | roof tile, italic accent word |

Night theme: swap Paper→Dusk and Palm black→Moon; the sun becomes `#F6C08F`. Card surfaces: `#FBF5EC` (day) and `#2B2534` (night).

## Typefaces

- **Bodoni Moda** (variable: `opsz` 6–96, `wght` 400–900, with a true italic). A Parisian didone used for display and headlines, with one italic phrase per headline. Use `font-optical-sizing: auto` so small sizes get sturdier hairlines. Files: `fonts/BodoniModa.woff2`, `fonts/BodoniModa-Italic.woff2`. Licence: SIL OFL 1.1 (`fonts/OFL-bodoni.txt`). Source: https://github.com/google/fonts/tree/main/ofl/bodonimoda
- **Jost** (variable `wght` 100–900). A geometric sans in the Futura tradition, used for body, labels and small caps (11 px, letter-spacing .22–.24em, uppercase). File: `fonts/Jost.woff2`. Licence: SIL OFL 1.1 (`fonts/OFL-jost.txt`). Source: https://github.com/google/fonts/tree/main/ofl/jost
- The wordmark is outlined from Bodoni Moda at opsz 28 / wght 460, with "AS" in the italic, so it needs no font to render.

## Motion (motion.css + motion.js)

There is one curve, `cubic-bezier(.65,0,.35,1)`, and one beat of 240 ms. Nothing bounces. Every movement runs on the vertical axis or mirrors across it, and each one becomes an instant state change under `prefers-reduced-motion`.

1. **Shutters** (`.m-shutters`, `shutterSwap()`): the section or page transition. Two louvred leaves close from the edges, meet on the centre seam, hold one beat, then open on the new content (560 ms each way).
2. **Sunset Switch** (`.m-sunset`, `sunsetSwitch()`): the day/night theme switch, and the signature delight. The sun disc sinks straight down into the horizon rule while the moon lowers into the same spot. The new theme then opens from the horizon line outward, top and bottom at once (View Transitions API with `clip-path: inset()`; plain swap as fallback).
3. **Arch Opening** (`.m-arch`, `archOpen()`): the hero. The painting starts inside the brand's arch and widens linearly with scroll to full bleed while settling from scale 1.06 to 1. It uses CSS `animation-timeline: view()`, with a JS fallback.
4. **Caption Card** (`.m-caption`, `captionCard()`): intertitles. Centred lines appear one at a time on a fixed beat with no movement, and the italic phrase lands one beat later.
5. **Whip Pan** (`.m-whip`, `whipTo()`): moves between product plates. Almost all the travel happens in the middle third, the plates blur only while moving, and they stop dead.

The live **Rooftops** scene also follows the theme: the sun sinks behind the roofs, the moon lowers into the identical place, and windows light up at random but deterministically (1.4 s, the same curve).

## Building notes

- Hero: use `<picture>` with AVIF → WebP → JPEG, `sizes="100vw"`, `width="2548" height="1697"`, and the `*-lqip.webp` (24×16) as a CSS background so layout shift stays 0. Load only the current theme's hero eagerly (`fetchpriority="high"`); the other is `loading="lazy"`. Initial weight with the 1280 AVIF hero and the three woff2 files comes to about 260 KB.
- Rooftops: `import { mountRooftops } from './interactive/rooftops.js'` only when it scrolls into view. It pulls three.js 0.169.0 from jsDelivr, pauses off-screen, and caps DPR at 1.5. Show `rooftops-poster-{day,night}.webp` underneath as the poster and no-WebGL fallback.
- Paper: put `extras/grain-512.webp` on `body` with `background-blend-mode: multiply` (also at night; the grain is near-white). It tiles seamlessly.
- Currentcolor SVGs (`wordmark.svg`, `mark-mono.svg`, `lockup.svg`, `postmark.svg`) follow the theme when inlined.
- Product figures and lines must come from `designs/_shared/content.js`; `preview.html` imports it.

## Inventory

All files are under `designs/68/assets/`. "Painted" means produced by the author's Python gouache painter: numpy/scipy generalized Kuwahara (8 smooth sectors) → k-means palette blend → second Kuwahara → difference-of-Gaussians pigment pooling → paper tooth granulation → wash variation → split-tone grade. Scripts were run in a private temp dir and are described here rather than shipped.

| File | What | Intended use | Source / how made | Licence |
|---|---|---|---|---|
| `identity/mark.svg` | Arch + horizon + half sun (reads as an A), day colours | logo, header | hand-built SVG paths | original, © Albretsen AS |
| `identity/mark-night.svg` | Mark in moon ink with a warm sun | dark backgrounds | hand-built SVG | original |
| `identity/mark-mono.svg` | Mark in `currentColor` | inline, footer, stamps | hand-built SVG | original |
| `identity/wordmark.svg` | "Albretsen *AS*", outlined Bodoni Moda, `currentColor` | header, footer | fontTools outlines of Bodoni Moda (opsz 28) | glyph outlines from OFL font, OFL permits embedding |
| `identity/lockup.svg` | Mark + wordmark; sun uses `--sun` | masthead | as above | original + OFL |
| `identity/favicon.svg` | Mark on a cream tile, switches to dusk in dark UI | favicon | hand-built SVG with `prefers-color-scheme` | original |
| `identity/favicon-180.png`, `favicon-32.png` | Raster favicons | apple-touch-icon, legacy | rsvg-convert | original |
| `identity/og-1200x630.jpg` | Dusk terrace, wordmark, one line | Open Graph / social | painted hero + outlined wordmark | see hero source |
| `hero/terrace-day-{640,1280,1920,2400}.{avif,webp,jpg}` | Gouache terrace at noon: two ochre houses framing the sea, hard shadow on the stone | hero, day theme | painted from Poly Haven backplate `vignaioli/DSC07529` (https://polyhaven.com/a/vignaioli); sky repainted, noon light and cast shadow added | CC0 source; painting original |
| `hero/terrace-dusk-*.{avif,webp,jpg}` | Same frame at LA dusk: peach sun on the horizon dead centre, glitter path, mauve walls | hero, night theme | same backplate, dusk sky and sea repainted | CC0 / original |
| `hero/alley-day-*.{avif,webp,jpg}` | Long stone street in hard noon, green shutters, laundry overhead (one-point perspective) | about / blog cover / section plate | painted from Poly Haven backplate `venetian_crossroads/DSC07336` (https://polyhaven.com/a/venetian_crossroads) | CC0 / original |
| `hero/*-lqip.webp` | 24×16 placeholders | CSS background behind heroes | Pillow downscale | — |
| `products/mcp-emails-{600,1200}.{avif,webp,jpg}` | Real MCP Emails logo-mark on an oval enamel plate on a green door, with a brass letter slot | MCP Emails card | painted from `venetian_crossroads/DSC07340`; logo from `_shared/products/mcp-emails/logo-mark.svg` composited unaltered after painting | CC0 photo; logo © Albretsen AS |
| `products/fun-libs-*.{avif,webp,jpg}` | Real Fun Libs v5 icon as an enamel tile on a green shop fascia, with gilt didone lettering | Fun Libs card | painted from `venetian_crossroads/DSC07348`; `_shared/products/fun-libs/icon.png` unaltered (corner-rounded mask only) | CC0 / © Albretsen AS |
| `products/toolrails-*.{avif,webp,jpg}` | Real Toolrails icon as a square enamel plaque under a balcony on an orange façade | Toolrails card | painted from `venetian_crossroads/DSC07341`; `_shared/products/toolrails/icon.svg` | CC0 / © Albretsen AS |
| `products/harbor-*.{avif,webp,jpg}` | Real Harbor mark + wordmark (crop of `banner.png`) as a dark enamel sign on a pink house | Harbor card | painted from `vignaioli/DSC07532`, sky repainted; `_shared/products/harbor/banner.png` crop unaltered | CC0 / © Albretsen AS |
| `products/retired/*.svg` (7) | Arched enamel plaques: Luma (real `luma/logo.png`, embedded), Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, Early apps | retired-products shelf | hand-built SVG emblems; names outlined from Bodoni Moda italic, labels from Jost | original (+ Luma logo © Albretsen AS) |
| `extras/paper-512.webp` | Seamless cold-press paper, cream | page or card background | FFT-filtered periodic noise (numpy) | original |
| `extras/grain-512.webp` | Seamless paper grain, near-white | `multiply` overlay on everything | FFT noise | original |
| `extras/wash-{peach,mauve,smog,ochre}.webp` | Watercolour wash cut-outs with pooled edges, alpha | behind headings, figures, empty states | numpy: noise-distorted field → edge-distance pigment pooling + granulation | original |
| `extras/stamp-coast-day.webp` | Perforated postage stamp: the Riviera coast from the ISS at noon, painted | footer / "where" ephemera, day | NASA photo `iss056e032555` (https://images.nasa.gov/details/iss056e032555), painted | public domain (NASA) |
| `extras/stamp-coast-night.webp` | Stamp: coastal city lights at night from the ISS | same, night theme | NASA photo `iss059e061476` (https://images.nasa.gov/details/iss059e061476), painted | public domain (NASA) |
| `extras/postmark.svg` | Circular postmark "Albretsen AS · Norway · Shipping since 2016" with parallel cancellation waves | over stamps, footer, contact | hand-built SVG, `currentColor` | original |
| `extras/olive-sprig.svg` | Symmetrical olive sprig, CSS-variable colours | section breaks | hand-built SVG | original |
| `extras/shutters.svg` | Arched pair of louvred shutters; `#leaf-l` / `#leaf-r` can be rotated open | transition art, 404, empty states | hand-built SVG | original |
| `extras/arch-mask.svg` | The brand arch as a mask | `mask-image` for any photo or plate | hand-built SVG | original |
| `interactive/rooftops.js` | Live three.js scene: strictly symmetrical zinc mansards, arched dormers, terracotta chimney pots, shader windows; gouache post-process (Kuwahara + pooling + tooth); day/night with sun/moon swap; level pointer dolly | interactive section, About, 404 | written by hand; three.js 0.169.0 (MIT) from jsDelivr | original code; three.js MIT |
| `interactive/rooftops-demo.html` | Tiny standalone demo with a theme button (`?theme=night`) | testing | — | original |
| `interactive/rooftops-poster-{day,night}.webp` | Baked stills of the scene | poster / no-WebGL fallback | headless Chrome (SwiftShader) screenshot | original |
| `fonts/BodoniModa.woff2`, `BodoniModa-Italic.woff2`, `Jost.woff2` | Variable web fonts | all type | Google Fonts repo, converted to woff2 with fontTools | SIL OFL 1.1 |
| `motion.css`, `motion.js` | The five named movements | everywhere | hand-written | original |
| `preview.html` | Contact sheet: every asset, palette, type, live motion and the rooftops | review | hand-written | original |

**Total weight:** see `du -sh designs/68/assets` (budget 8 MB). All images carry explicit width/height or aspect-ratio in the preview.
