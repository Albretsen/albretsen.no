# Front Light · asset kit 75

Albretsen AS / albretsen.no. Taste-weighted brief: dramatic Norwegian nature × sunsets and sunrises, golden-hour light, travel ephemera, a precise pastel front desk with a key for each product.

Open `preview.html` from a static server (it imports `../../_shared/content.js`). It shows every asset, the palette, the type, the live hero, the key rack and all motion studies. Add `?from=<section-id>` to start lower on the sheet.

## Vision

**The last minute of the day, held still.** A real fjord, photographed around 1895 and graded into one amber family, with the sun setting into the gap between two cliffs. The name stands in the valley: it crosses the dark near cliff and sinks behind the sunlit far mountain. The air above the horizon shimmers.

Below the fold, the company is a front desk. It is precise and pastel, with one key per product. Each product is also a postcard whose stamp carries the real logo and whose postmark carries one honest number. Retired products are cancelled stamps.

The atmosphere is warm and calm but never a costume. There are no place names in the copy and no hotel or travel language beyond the metaphor. The subject stays a software company: its products, its numbers, its command line.

- **Mood:** quiet confidence, golden hour, scale and silence, warmth, exactness. Generous space and one idea per screen.
- **Hero concept, pushed:** the "reception desk" is not a hotel lobby. It is the horizon. The hero is pure landscape and name. The desk appears once, as a single board of four keys (`interactive/keyrack.js`), and each key opens onto a product.
- **Signature delight (rich hover):** every interactive object has a hidden layer. Key fobs turn over to show their number. Pigeonhole lamps light and the real logo rises like a letter. Postcards (builder's choice) can flip to a back made from the stamp, postmark and facts.
- **What it must never become:** sepia nostalgia, a travel agency, a hotel, or a storybook. Keep the copy modern and specific, numbers in mono, and the command line visible (`extras/ticket-mcp.svg`).

### References studied
- https://accidentallywesanderson.com: symmetry, pastel facades, captioned "place cards", restraint.
- https://www.chateaumarmont.com: a near-empty page, one outline drawing, and the confidence to say almost nothing.
- https://www.jacquemus.com: one huge image per screen, slow crossfades, tiny captions. (403 to fetch, so studied from memory.)
- https://www.design-hotels.com: the domain is now parked, so it gave nothing.
- Codrops, *Animated Heat Distortion Effects with WebGL* (Lucas Bebber): https://tympanus.net/codrops/2016/05/03/animated-heat-distortion-effects-webgl/
- Framer *LiquidDistort* "Heat Haze" mode (feTurbulence + feDisplacementMap): https://www.framer.com/marketplace/components/svgmelt-distort/
- CSS scroll-driven day-to-night study: https://dev.to/_artclick/build-a-scroll-driven-day-to-night-animation-using-pure-css-1o3p
- Awwwards "Scroll color fade" (Drink Cann): https://www.awwwards.com/inspiration/scroll-color-fade
- Fonts In Use, Grand Budapest Hotel lettering (Annie Atkins): https://fontsinuse.com/tags/16035/grand-budapest-hotel
- LoC Photochrom Print Collection (Photoglob Zürich "P.Z." numbered travel prints), the source of the photographs.

Salt `d8c4b0`: the hex digits 8, 4 and 0 (and 12/c, 11/b) chose which search results to open. Commons result 8 (the Geirangerfjord photochrom), NASA result 0 (iss040e080833) and photochrom results 8 and 12 (Lyngenfjord, Vik) all came from it.

## Palette (one hue family, OKLCH hue 44–83)

| Token | Hex | OKLCH | Use |
|---|---|---|---|
| `--linen` | `#FBF3E4` | `oklch(96.6% 0.022 83.3)` | page, paper |
| `--sand` | `#F4DDB4` | `oklch(90.6% 0.059 82.0)` | zenith sky, cards, code blocks |
| `--peach` | `#F2CDA8` | `oklch(87.1% 0.064 66.8)` | the pastel desk, fobs, ticket |
| `--apricot` | `#EDBB7C` | `oklch(82.3% 0.099 72.2)` | hover light, small caps on dark |
| `--amber` | `#DC9447` | `oklch(72.4% 0.127 65.1)` | the sun: **one accent per screen** |
| `--copper` | `#B8662F` | `oklch(59.4% 0.125 51.6)` | links, postmarks, rules, "AS" |
| `--sienna` | `#7A3D1F` | `oklch(43.2% 0.095 45.2)` | secondary ink, the script voice |
| `--umber` | `#3D2013` | `oklch(27.9% 0.050 44.4)` | primary ink, the mark |
| `--night` | `#1C0E07` | `oklch(18.2% 0.028 48.0)` | deepest shadow, dark sections |

The photographs are gradient-mapped through this same ramp (`src/tools/grade.py`, `STOPS`), so imagery and UI share one light. Linen text on umber passes AA comfortably. Copper on linen is about 4.0:1, so use it at 14 px+ or for non-essential labels.

## Type

| Role | Face | File | Notes |
|---|---|---|---|
| Signage capitals (display, nav, labels) | **Jost** variable 100–900 (Indestructible Type, a Futura revival) | `fonts/jost-variable.woff2` | Uppercase, tracking .2em (hero, weight 300) to .42em (tiny labels, weight 500). Body in Jost 400 at 1.6. |
| The voice (one line per screen) | **Instrument Serif** italic | `fonts/instrument-serif-italic.woff2` | Taglines and captions only. Never body copy. |
| The facts (numbers, commands, metadata) | **IBM Plex Mono** 400/500 | `fonts/ibm-plex-mono-{400,500}.woff2` | Figures from content.js, the MCP command, file-like labels. |

`tokens.css` declares the @font-face rules (font-display: swap), palette, type scale (`--step--1` to `--step-hero`), spacing, shadows and easings. Preload `jost-variable.woff2`.

## Hero recipe (layer order, bottom to top)

1. `<picture>`: `hero/fjord-*` (AVIF → WebP → JPEG; 960/1600/2400, and `fjord-portrait-*` for portrait screens). Always `width="1600" height="1116"` with `object-fit: cover`.
2. `<canvas>`: `interactive/haze.js` draws the same image with shimmering air and a breathing sun. Lazy-load it after first paint and fade it in on `data-ready`. Without it the page is identical, just still.
3. The name: Jost 300, uppercase, letter-spacing .2em, linen, about 10vw. Left-aligned at 8.5vw and 12vh on landscape; centred at 24vh on portrait. The `.fl-first-light` class makes it rise.
4. `<picture>`: `hero/fjord-front-right-*` (WebP with alpha), the sunlit far mountain only, pixel-aligned with layer 1. The last letters sink behind it. For the name behind **both** cliffs, use `hero/fjord-front-*` instead.
5. The line (Instrument Serif) and a small mono caption near the waterline.

Sun position for shaders and overlays is UV `(0.466, 0.447)` (portrait `(0.52, 0.447)`), with the waterline at `0.70`. The first-paint cost is about 28 KB AVIF + 78 KB front layer + 27 KB Jost + 22 KB Instrument Serif at 1600 w.

## Motion (motion.css + motion.js)

| Name | Class | What it does | Reference |
|---|---|---|---|
| **First Light** | `.fl-first-light` | On load, the name rises from 18% below out of a 6 px blur over 2.6 s, on a settle curve. Pair with `.fl-warm` on the sky (brightness .55 → 1). | Jacquemus' slow campaign fades; CSS day-to-night scroll study |
| **Heat Haze** | `.fl-haze` (SVG) / `interactive/haze.js` (WebGL) | Rising, wavering air: noise scrolls up through a displacement map, strongest above the horizon and around the sun. | Codrops heat distortion (Bebber); Framer LiquidDistort |
| **Sea Breeze** | `.fl-breeze` (+ `--i`, `--r`) | Ephemera drift 3–5 px and under half a degree on 9–14 s loops that stay out of phase. | Idle drift on Awwwards-featured product pages |
| **Key Swing** | `.fl-swing` / inside keyrack | A damped pendulum (7°, −4.5°, 2.6°, −1.3°, 0.5°) over 2.4 s, on hover or focus. | Physical hotel key boards |
| **Postmark** | `.fl-postmark` (+ `--r`, `--ink`) | Strikes once in view: drops, overshoots to .97, lands off true, ink settles to 82%. | Rubber-stamp physics |
| **Long Shadows** | `.fl-long-shadow` | Scroll progress sets `--sun` from 0 to 1, so paper shadows lengthen and warm as you read down the page and the sun "sets". Native `animation-timeline: scroll()` where supported. | Scroll-linked colour fades |

Everything collapses to a still frame under `prefers-reduced-motion`. haze.js pauses offscreen and caps DPR at 1.75.

## Inventory

All paths are relative to `designs/75/assets/`. "Generated" means made for this kit by the scripts in `src/tools/` or the HTML in `src/`.

| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| `identity/mark.svg`, `mark-linen.svg` | An A as a peak, its crossbar a horizon, with a half sun | Nav, footer, favicon base, stamp watermark | Generated (`identity.py`) | Client-owned |
| `identity/wordmark.svg`, `wordmark-linen.svg` | ALBRETSEN AS, outlined Jost 460 at .34em, AS in copper | Header, footer | Generated; outlines from Jost (OFL permits embedding outlines) | Client-owned |
| `identity/wordmark-signage.svg` | Stacked signage lockup: mark, name, rule, AS, rule | About page, footer, OG alternatives | Generated | Client-owned |
| `identity/lockup.svg` | Horizontal mark + wordmark | Header | Generated | Client-owned |
| `identity/name-hero.svg` | ALBRETSEN outlined in Jost 300 at .22em, linen | Hero name as an image if webfonts are not wanted | Generated | Client-owned |
| `identity/favicon.svg`, `apple-touch-icon.png` (180) | Mark on a linen tile, heavier strokes | `<link rel=icon>` | Generated; PNG via rsvg-convert | Client-owned |
| `identity/og.jpg` (1200×630) | Graded fjord, name in the valley, line, mark | Open Graph / Twitter card | Generated from `src/og.html` (headless Chrome) | Client-owned + PD photo |
| `hero/fjord-{960,1600,2400}.{avif,webp,jpg}` | Main hero: Geirangerfjord, sun set into the gap, graded amber | Hero, OG, MCP Emails card | LoC photochrom "Prækestolen, Geiranger Fjord" c.1890-1900, https://www.loc.gov/item/2001699469/ via https://commons.wikimedia.org/wiki/File:Praekestolen_(i.e.,_Prækestolen),_Geiranger_Fjord,_Norway-LCCN2001699469.tiff; graded, sun disc and water streak added (`grade.py fjord`) | Public domain (LoC: no known restrictions) |
| `hero/fjord-portrait-{640,1080}.{avif,webp,jpg}` | Portrait crop centred on the gap | Phones (`max-aspect-ratio: 4/5`) | Same | Public domain |
| `hero/fjord-front-{960,1600,2400}.webp`, `fjord-front-portrait-*.webp` | Cut-out: both cliffs + water, sky transparent | Name behind everything | Same, luminance mask + morphology | Public domain |
| `hero/fjord-front-right-*.webp`, `fjord-front-right-portrait-*.webp` | Cut-out: far mountain + water only | Name crosses the near cliff, sinks behind the far one (recommended) | Same, mask split along the near cliff's edge | Public domain |
| `hero/orbit-{960,1600,2400}.{avif,webp,jpg}` | The sun over Earth's limb from the ISS, graded amber | Second scene ("the same sun, from 400 km"), Toolrails card, dark sections | NASA ISS040-E-080833, https://images.nasa.gov/details/iss040e080833 | Public domain (NASA media guidelines; no endorsement implied) |
| `hero/lake-{960,1600}.{avif,webp,jpg}` | Still fjord mirroring snow peaks | Harbor card, quiet interludes, blog covers | LoC photochrom "View from fjord, Lyngenfjord" https://www.loc.gov/item/2001698840/ via Wikimedia Commons; graded | Public domain |
| `hero/village-{960,1600}.{webp,jpg}` | Small fjord village, wooden houses | Fun Libs card, about section | LoC photochrom "Vik in Eidfjord, Hardanger Fjord" https://www.loc.gov/item/2001699498/ via Wikimedia Commons; graded | Public domain |
| `products/postcard-mcp-emails-{800,1500}.{webp,jpg}` | Postcard: fjord photo, stamp with the **real** MCP Emails logo-mark, postmark "$782 MRR" | Product section / page hero | Generated from `src/postcard.html?p=mcp-emails`; logo from `_shared/products/mcp-emails/logo-mark.svg` unchanged | Client-owned |
| `products/postcard-fun-libs-*` | Village photo, real Fun Libs icon (v5), postmark "113,000+ installs" | as above | `src/postcard.html?p=fun-libs`; `_shared/products/fun-libs/icon.png` | Client-owned |
| `products/postcard-toolrails-*` | Orbit photo, real Toolrails icon, postmark "4 connectors · in the making" | as above | `src/postcard.html?p=toolrails`; `_shared/products/toolrails/icon.svg` | Client-owned |
| `products/postcard-harbor-*` | Lake photo, real Harbor mark (light on near-black, as in Harbor's own banner), postmark "549 commits · paused" | as above | `src/postcard.html?p=harbor`; `_shared/products/harbor/harbor-mark.svg` | Client-owned |
| `products/retired/stamp-luma.svg` | Cancelled stamp with the **real** Luma logo (embedded PNG) | Archive / "earlier work" strip | Generated; `_shared/products/luma/logo.png` | Client-owned |
| `products/retired/stamp-{polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}.svg` | Cancelled stamps with simple stand-in glyphs (speech bubbles, pin, watched window, smile, shield-check, percent), year and RETIRED | Archive strip | Generated (`ephemera.py`) | Client-owned |
| `extras/ticket-mcp.svg` | "Admit one agent" ticket carrying `claude mcp add albretsen https://albretsen.no/mcp` | The MCP command, footer | Generated; text outlined (Jost, Plex Mono) | Client-owned |
| `extras/luggage-label.svg` | "From the desk of Asgeir Albretsen", email, availability line | Contact | Generated; text outlined | Client-owned |
| `extras/postmark-{2016,2019,2026}.svg` | Round cancels: first app, Fun Libs, Albretsen AS | Timeline/history markers (`.fl-postmark`) | Generated | Client-owned |
| `extras/cancel-waves.svg` | Four wavy cancel lines | Section dividers, over photos | Generated | Client-owned |
| `extras/stamp-perforated.svg` | Perforated stamp blank (240×288) | Frame for any small image | Generated | Client-owned |
| `extras/paper-linen.{webp,jpg}` | 512 px seamless linen paper with fibres | Page ground (`background`) | Generated (`textures.py`, periodic FFT noise) | Client-owned |
| `extras/grain.png` | 256 px seamless film grain (RGBA) | Overlay on photos (`mix-blend-mode: overlay`, ~.5) | Generated | Client-owned |
| `extras/contours.svg` | Contour lines of an imagined peak, copper hairlines | Faint ground behind a section, or the 404 page | Generated (marching squares) | Client-owned |
| `interactive/haze.js` | WebGL1 heat-haze + breathing sun over any image, pointer parallax, offscreen pause | Hero layer 2 | Written for this kit, no dependencies | Client-owned |
| `interactive/keyrack.js` | Board of four keys: lamp-lit pigeonholes with the real logos, swinging keys, fobs that flip to their number; keyboard and touch accessible | Products index | Written for this kit; reads `_shared/content.js` | Client-owned |
| `interactive/demo.html` | Full-page demo: hero composite + key rack (`?rack&open=N` for stills) | Reference build | Written for this kit | Client-owned |
| `motion.css`, `motion.js` | Six named animations (above) | Site-wide | Written for this kit | Client-owned |
| `tokens.css` | @font-face, palette, scale, spacing, easings | Import first | Written for this kit | Client-owned |
| `fonts/jost-variable.woff2` | Jost variable, latin | Display + body | https://cdn.jsdelivr.net/npm/@fontsource-variable/jost@5.1.1/files/jost-latin-wght-normal.woff2 | SIL OFL 1.1 |
| `fonts/instrument-serif-italic.woff2` | Instrument Serif italic, latin | The voice | https://cdn.jsdelivr.net/npm/@fontsource/instrument-serif@5.1.0/files/instrument-serif-latin-400-italic.woff2 | SIL OFL 1.1 |
| `fonts/ibm-plex-mono-{400,500}.woff2` | IBM Plex Mono, latin | Facts | https://cdn.jsdelivr.net/npm/@fontsource/ibm-plex-mono@5.1.0/files/ibm-plex-mono-latin-{400,500}-normal.woff2 | SIL OFL 1.1 |
| `src/postcard.html`, `src/og.html` | Source compositions for the postcards and OG image | Re-render with `scripts/shot.sh … 1500 1000` | Written for this kit | Client-owned |
| `src/tools/*.py`, `avif.sh` | Grading, identity, ephemera, textures, text outlining, AVIF encoding | Reproducibility (they take paths as arguments) | Written for this kit | Client-owned |

Notes:
- The AVIF files are cropped to even dimensions, so they can be 1 px smaller than the WebP/JPEG (e.g. 2400×1673 → 2400×1672). Keep `width/height` from the WebP; `object-fit: cover` absorbs the difference.
- Postcard numbers come from `content.js` at render time. If a figure changes, re-render the four postcards (`src/postcard.html?p=<id>`) and run the export. Do not hand-edit the images.
- The LoC photochroms are colour-tinted prints from the 1890s. The grade removes their period colour, but keep them out of anything that claims to be a present-day photograph.

## Builder guidance (short)
- One idea per screen: hero (landscape + name), a quiet line, the key board, then one postcard per product at full width, the orbit scene as the turn ("the same sun, from higher up"), the timeline as postmarks, and the ticket + label as the close.
- Amber appears once per screen: the sun, one link, or one stamp. Everything else is linen, umber and copper.
- Keep copy modern and specific. No "welcome", no "reception", no place names. The hotel stays a metaphor carried only by the objects.
- Load haze.js and keyrack.js after first paint. Give every image width and height. Target under 1 MB initial weight: the hero, front layer and two fonts come to about 160 KB.
