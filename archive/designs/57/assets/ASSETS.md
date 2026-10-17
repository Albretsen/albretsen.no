# Escape Vector: design 57 asset kit

Open `preview.html` first; it shows every asset and runs the motion and 3D modules. Add `?only=payloads,extras` to show only those sections.

## Vision

**Weightless, rebellious, exact.** The site treats the public-domain spaceflight archive the way an indie zine treats a photocopier. NASA, ESA and Hubble photographs are pushed to hard black and white, and only one thing in any frame gets colour: **burn**, a re-entry red at OKLCH hue 24. That covers the Earth in Earthrise, the stripes on McCandless's suit, the probe on the terrain, the tip of the A and every trajectory line.

Around the photographs sit 19th-century scientific engravings: Trouvelot's astronomical drawings and Haeckel's radiolarians from the Biodiversity Heritage Library. Hand-authored vector annotation ties it all together with trajectories, registration crosses, dashed orbits and a probe that reads altitude. The voice belongs to a solo builder who left orbit on purpose: precise, a little defiant, never corporate.

- **Hero concept.** The brief asked for "a shader landscape that reacts to the cursor", but the centrepiece tech is CSS 3D only, so the hero is built from about 20 stacked SVG contour slices of a procedural crater field. Each slice is a real DOM plane in 3D. The cursor tilts and yaws the world on springs, and a red probe vector stands on the terrain under the pointer and reads its altitude. Press and hold to switch gravity off: the slices drift apart, then settle with overshoot on release. The far side of the Moon and a floating STS-41B astronaut hang above it as image layers.
- **Signature delight.** Headlines decode: characters arrive as noise and lock in left to right, and each lock flashes burn.
- **Avoid.** No gears, machinery or nautical imagery. Orbital mechanics is used only as physics: vectors, orbits and burns. MCP Emails is one payload of four, never the whole story. Do not use "hire me", "let's connect" or "passionate".

### References (researched)

| Reference | What we took |
|---|---|
| https://bruno-simon.com | Physics-driven everything; motion has mass and overshoot. |
| https://www.igloo.inc | Text scramble/decode as the brand's signature entrance. |
| https://paco.me | Restraint; small, perfectly tuned micro-interactions (the zero-G hover). |
| https://www.cosmos.so | Image-first curation; let the archive imagery carry the page. |
| https://blog.maximeheckel.com/posts/the-physics-behind-spring-animations/ | Damped-oscillator model used in `motion.js`. |
| https://motion.dev/tutorials/js-spring | Stiffness/damping/mass vocabulary and defaults. |
| https://dev.to/cruip_com/making-a-text-scramble-animation-with-javascript-2nb3 | Left-to-right lock with random glyph cycling. |
| https://hover-tilt.simey.me/bespoke/stacked-3d/ | Stacked translateZ layers with cursor parallax (the terrain technique). |
| https://publicdomainreview.org/collections/all/theme/astronomy-and-space/1 | Tone of archival astronomy imagery. |

## Palette (black, white, one primary; seed hue 24°)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| `--ev-ink` | oklch(0.13 0 0) | #070707 | Page ground, primary text on paper |
| `--ev-ink-2` | oklch(0.19 0.004 24) | #161313 | Raised surfaces on ink |
| `--ev-fog` | oklch(0.55 0.005 24) | #747070 | Secondary text, unresolved decode glyphs |
| `--ev-paper` | oklch(0.975 0.004 24) | #F9F6F5 | Light sections, cards |
| `--ev-white` | oklch(1 0 0) | #FFFFFF | Text on ink, line work |
| `--ev-burn` | oklch(0.64 0.215 24) | #F34046 | **The only colour.** Live things: links, probe, trajectories, the A's tip |
| `--ev-burn-lo` | oklch(0.47 0.17 24) | #A51E27 | Pressed states, duotone shadows |
| `--ev-burn-tint` | oklch(0.93 0.035 24) | #FFDFDD | Text selection, hover wash on paper |

Rule: if something is red, it is alive, current or interactive. Burn text on ink should be 18px or larger. Use ink on burn for small labels.

## Type

- **Bricolage Grotesque** (variable, weight 400-800, width 75-100, opsz): display. Use 800 at width 76-82%, line-height 0.9, letter-spacing about -0.005em. Tighter spacing makes the letters collide at narrow widths.
- **Martian Mono** (variable, weight 300-700, width 75-112.5): every label, figure, coordinate, caption and body copy. HUD labels are 11px, uppercase, 0.14em tracking.
- Both fonts are vendored in `fonts/` (latin subset, OFL 1.1). Load them with `fonts/fonts.css`.
- The wordmark is hand-drawn vector letters, not a font.

## Identity notes

- **Mark.** A vector capital A (Λ) whose tip has come loose and floats, tilted 10°. The tip is burn; the body is ink or white. Inline the SVG so the tip (`.ev-tip`) floats via `motion.css`. Adding `.ev-launch` (or hovering a parent `<a>`) fires it.
- **Wordmark.** Monoline capitals (7-unit stroke), skewed -12°. Its A uses the same loose tip. The lockup adds a burn "AS" tag.
- **Favicon.** Rounded ink square with a white body and burn tip. Use the 180px PNG for apple-touch.

## Inventory

All downloaded images came through the Wikimedia Commons API from the file pages listed. They were re-processed by `src/tools/process.py` (contrast curves, duotone ramps in brand colours, grain, cut-outs, crops) and saved as webp.

| File | What it is | Intended use | Source | Licence |
|---|---|---|---|---|
| identity/mark.svg, mark-reversed.svg, mark-mono.svg | Loose-tip A mark (ink, white, currentColor) | Nav, footer, loaders, inline with `.ev-tip` | Hand-authored, generated by src/tools/identity.mjs | Original |
| identity/wordmark.svg, wordmark-reversed.svg | ALBRETSEN vector wordmark | Header, footer | identity.mjs | Original |
| identity/lockup.svg, lockup-reversed.svg | Wordmark + burn AS tag | Header on wide screens, OG | identity.mjs | Original |
| identity/favicon.svg, favicon-180.png, favicon-512.png | App-icon favicon | `<link rel=icon>`, apple-touch-icon, PWA | identity.mjs, rsvg-convert | Original |
| identity/og.jpg | 1200x630 Open Graph image | og:image / twitter:image | src/og.html, baked in headless Chrome | Original + NASA PD |
| img/hero-earthrise(.webp 2340, -1440, -720) | Earthrise, mono moon, Earth in burn | Hero backdrop, about section, OG | https://commons.wikimedia.org/wiki/File:NASA-Apollo8-Dec24-Earthrise-b.jpg (NASA / W. Anders, Apollo 8) | Public domain (NASA) |
| img/hero-farside(.webp 1600, -800, -400) | Far side of the Moon, alpha disc, burn rim | Floating above the hero terrain | https://commons.wikimedia.org/wiki/File:Moon_farside_LRO_5000.jpg (NASA/GSFC/ASU LRO) | Public domain (NASA) |
| img/hero-astronaut(.webp 1600, -800) | STS-41B McCandless untethered EVA, cut-out with alpha, red suit stripes kept | Weightless element in hero, `data-ev="drift"` | https://commons.wikimedia.org/wiki/File:STS-41-B_MMU.jpg (NASA) | Public domain (NASA). The NASA patch is visible; do not imply endorsement |
| img/hero-pillars(.webp 1920, -960) | Pillars of Creation, burn duotone | Alternative hero, section backdrop, 404 | https://commons.wikimedia.org/wiki/File:Pillars_of_creation_2014_HST_WFC3-UVIS_full-res_denoised.jpg (NASA, ESA, Hubble Heritage Team) | Public domain (NASA/ESA Hubble; credit required) |
| img/horizon-apollo17(.webp 3840, -1920) | Apollo 17 landing-site panorama strip, mono | Footer horizon, section divider band | https://commons.wikimedia.org/wiki/File:Apollo_17_Landing_Site_Panorama_during_EVA1_JSC2007e045384.jpg (NASA JSC) | Public domain (NASA) |
| img/plate-comet(.webp, -800) | Trouvelot, The Great Comet of 1881, comet tail tinted burn | Writing/posts section header | https://commons.wikimedia.org/wiki/File:Trouvelot_-_The_great_comet_of_1881_-_edit_1.jpg | Public domain |
| img/plate-mars(.webp, -800) | Trouvelot, The Planet Mars, burn duotone | Retired products section, accent | https://commons.wikimedia.org/wiki/File:%C3%89tienne_L%C3%A9opold_Trouvelot,_%E2%80%9CThe_Planet_Mars,_from_The_Trouvelot_Astronomical_Drawings%E2%80%9D_2006_48_8v1.jpg (Crystal Bridges) | CC0 |
| img/plate-saturn(.webp, -800) | Trouvelot, The Planet Saturn, mono | Fun Libs payload backdrop, extras | https://commons.wikimedia.org/wiki/File:%C3%89tienne_L%C3%A9opold_Trouvelot,_%E2%80%9CThe_Planet_Saturn,_from_The_Trouvelot_Astronomical_Drawings%E2%80%9D_2006_48_10v1.jpg | CC0 |
| img/plate-zodiacal(.webp, -600) | Trouvelot, The Zodiacal Light, mono | Harbor payload backdrop, quiet sections | https://commons.wikimedia.org/wiki/File:%C3%89tienne_L%C3%A9opold_Trouvelot,_%E2%80%9CThe_Zodiacal_Light,_from_The_Trouvelot_Astronomical_Drawings%E2%80%9D_2006_48_5v1.jpg | CC0 |
| img/radiolarian-icosa-ink / -burn(.webp, -450) | Haeckel's Circogonia icosahedra, paper removed to alpha, recoloured | Specimen sticker, texture for radiolarian.js faces, margins | https://commons.wikimedia.org/wiki/File:Circogonia_icosahedra.jpg (Haeckel 1904, via BHL plate) | CC0 / public domain |
| products/payload-mcp-emails(.webp, -800) | Real MCP Emails logo-mark on a floating tile over Earthrise | MCP Emails card / case study | src/payload.html + designs/_shared/products/mcp-emails/logo-mark.svg | Product logo (owner's) + NASA PD |
| products/payload-fun-libs(.webp, -800) | Real Fun Libs v5 icon tile at Trouvelot's Saturn | Fun Libs card | payload.html + _shared/products/fun-libs/icon.png | Owner's + CC0 |
| products/payload-toolrails(.webp, -800) | Real Toolrails icon tile on the Apollo 17 surface | Toolrails card | payload.html + _shared/products/toolrails/icon.svg | Owner's + NASA PD |
| products/payload-harbor(.webp, -800) | Real Harbor mark tile in the zodiacal light | Harbor card | payload.html + _shared/products/harbor/harbor-mark.svg | Owner's + CC0 |
| products/retired/retired-*.svg (6) | "Decommissioned satellite" patches: Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, early apps | Retired-products grid (Luma uses its real logo from _shared) | Hand-authored, src/tools/standins.mjs | Original |
| extras/sticker-since-2016.webp | Round sticker: ON GOOGLE PLAY SINCE 2016 around the mark | Scattered on about/footer, `data-ev="drift"` | src/stickers.html, difference-matted (src/tools/matte.py) | Original |
| extras/sticker-built-in-norway.webp | Burn slab sticker, Est. 2026 | Footer, contact area | stickers.html | Original |
| extras/sticker-zero-g.webp | Die-cut astronaut with 0G tag | Hero or 404 | stickers.html + NASA PD | Original + PD |
| extras/sticker-pays-for-itself.webp | Ticket sticker using the site line | Near products / MRR figure | stickers.html | Original |
| extras/starfield-tile.webp | Seamless 1024 sparse starfield, about 3% burn stars | Page background on ink (`background-size: 1024px`) | Generated (numpy/Pillow, seed 0x5405b9) | Original |
| extras/grain-tile.webp | 256 alpha grain | Fixed overlay, `mix-blend-mode: overlay`, opacity .3 | Generated | Original |
| extras/vector-field.svg | Seamless tile of vectors bending to the upper right | Section backgrounds, sticker boards | Hand-authored | Original |
| extras/escape-diagram.svg | Parking orbit, one burn, escape trajectory | "How I work" / about divider; inline it to animate | Hand-authored | Original |
| 3d/escape-terrain.js | CSS 3D contour terrain (hero centrepiece) | Hero, `mountTerrain(el, {seed})` | Hand-written | Original |
| 3d/radiolarian.js | Draggable CSS 3D icosahedron (20 matrix3d DOM faces), click to burst | Interlude / footer toy | Hand-written | Original |
| 3d/demo.html | Tiny demo of both 3D modules | Reference | | |
| motion.js / motion.css | Spring, decode, zeroG, burn, drift + tokens | Everywhere | Hand-written | Original |
| fonts/*.woff2, fonts.css | Bricolage Grotesque, Martian Mono (latin, variable) | All type | https://fonts.google.com/specimen/Bricolage+Grotesque, https://fonts.google.com/specimen/Martian+Mono | SIL OFL 1.1 |
| src/*.html, src/tools/* | Bake pages and generator scripts | Re-bake or extend assets | | Original |

Required credit line (footer): "Imagery: NASA, ESA and the Hubble Heritage Team (public domain); Trouvelot Astronomical Drawings (CC0); E. Haeckel via Biodiversity Heritage Library." NASA material must not imply NASA endorsement.

## Motion study

`motion.js` holds one damped harmonic oscillator, integrated with semi-implicit Euler at fixed 1/240 s sub-steps. A shared requestAnimationFrame loop sleeps when everything is at rest. Every effect respects `prefers-reduced-motion`.

1. **Decode (entrance)**, `decode(el)` or `data-ev="decode"`. Characters cycle through mono glyphs and lock in left to right with jitter. Each lock flashes burn and drops 0.12em into place. Use it on h1/h2 the first time they enter the viewport, and on figures such as `$782` and `113,000+`. Refs: igloo.inc, the cruip text scramble.
2. **Zero-G (hover)**, `zeroG(el)` or `data-ev="zerog"` plus the `.ev-zerog` class for the shadow. The card tilts toward the cursor and rises 36px in Z on an underdamped spring (it overshoots once), and its shadow falls away via `--ev-lift`. Use it for product cards and the sticker board. Refs: paco.me, bruno-simon.com.
3. **Escape burn (transition)**, `burn(outEl, inEl)`. The outgoing view leaves along a -38° vector with skew and streak blur, and the next arrives from the opposite vector on a spring. motion.css carries a CSS twin for `::view-transition-*`.
4. **Station keeping (idle)**, `drift(el)` or `data-ev="drift"`. A perpetual float on incommensurate sine periods for stickers, the astronaut and cut-outs.
5. CSS-only: `.ev-tip` makes the mark's tip float, `.ev-launch` fires it, and `.ev-orbit` makes dashed rings crawl.

## Builder notes

- Hero recipe (see the top of preview.html): ink page with starfield, `mountTerrain(#terrain)` filling the hero, `hero-farside` top right, `hero-astronaut` drifting at mid-right, and a decode headline at the left. On phones, put the moon bottom right and keep the terrain (the cursor tilt becomes pointer drag).
- Keep red scarce. When a section has a burn image (pillars, mars), its text stays white.
- SVG text in `escape-diagram.svg` uses Martian Mono, so inline the SVG to get the brand font. As `<img>` it falls back to the system mono.
- Budget: the folder is about 4.3 MB. Serve the `-800`/`-1440` siblings through `srcset` and load the full sizes only on retina.
