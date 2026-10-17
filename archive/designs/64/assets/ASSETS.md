# Design 64: Heure Bleue

Asset kit for **Albretsen AS / albretsen.no**. Open `preview.html` (served over http) for the contact sheet: every asset, the palette, the type specimen, the motion study, and the live 3D scene.

## Art direction

**Vision.** The few minutes after sunset, seen from a terrace. Below it is a shelf of zinc mansard roofs, then whitewashed houses that step down through umbrella pines and cypresses to a bay. A headland sits across the water. The sun has just touched the sea. The look is Paris's rooftops and golden stone meeting the white walls and bougainvillea of the Costa del Sol, painted like a 1930s travel poster: flat light bands, a stepped sky, sun reflections drawn as dashes, film grain. It is reinterpreted, never copied, and has no landmarks or postcards in it.

**Hero idea: drag the sun.** The scene is live three.js. The visitor grabs the sun and pulls it up or down. The sky bands, the sea glitter, the light on every wall and the lights in every window of the town all follow. Six seconds after release the sun sinks back to blue hour, which is the brand's resting state. Every product sits in the same town: a letterbox, a terrace table, a tile panel, a lit dormer.

**Why it fits.** The scene shows light, craft and calm confidence. Each screen carries one strong idea and plenty of space. The precision lives in the engineering, as the whole town is generated from primitives in one 35 KB module. The playfulness is the sun you can move. It reads as a technology studio with taste, not as a hotel: the copy stays about software, and the imagery stays atmosphere.

**Mood words.** Blue hour, lamplight, plaster, zinc, bougainvillea, sea breeze, playful precision.

**Personality in motion.** Slow and small, like heat haze over the horizon, a breeze in the flowers, shutters opening, and windows coming on one by one.

### References researched
- https://www.kinfolk.com: restraint, generous whitespace, quiet display-type entrances.
- https://www.cursor.com: a technical product presented on painted landscape wallpapers. This is the closest precedent for putting a software brand in an illustrated world.
- https://www.hoteldelavillevenice.com was given as a starting point but did not resolve (DNS failure). Its role is covered by the travel-poster research below.
- https://unsplash.com/t/travel: the Unsplash search API was not reachable from here, so the photography is from Wikimedia Commons (CC0 / PD).
- Roger Broders and the PLM railway posters of the 1920s and 30s (https://en.wikipedia.org/wiki/Roger_Broders): stepped skies, reflections as stacked dashes, a flat decorative sun. These are reference only and nothing was downloaded.
- Framer "svgmelt distort" (https://www.framer.com/marketplace/components/svgmelt-distort/): the heat-haze mode was the reference for `hb-haze`.
- demosthenes.info, "Animated Day Night Cycle With CSS and SVG" (https://demosthenes.info/blog/883/Animated-Day-Night-Cycle-With-CSS-and-SVG): the reference for `hb-lights` and `hb-dusk`.
- The three.js toon-shading discussion (https://sbcode.net/threejs/meshtoonmaterial/) and the forum notes on the Sky shader's colours: the basis for the custom banded sky and the two-band toon light.
- Google Fonts Art Deco roundups (Poiret One, Federo, Limelight compared). Federo won for legibility at both sizes.

## Palette

| Name | Hex | OKLCH | Use |
|---|---|---|---|
| Ink | `#232c57` | `oklch(30.9% 0.078 272.2)` | Text, night sky, dark surfaces |
| Dusk | `#7a78b2` | `oklch(59.8% 0.088 285.0)` | Blue-hour mid sky, secondary |
| Powder | `#a9c6e0` | `oklch(81.4% 0.048 245.5)` | Sea, shutters, cool fills |
| Pink | `#f2b5b8` | `oklch(83.0% 0.071 15.4)` | Afterglow, awnings, tiles |
| Bougainvillea | `#d23f7c` | `oklch(59.7% 0.190 359.3)` | Flowers only, sparingly |
| Mustard | `#d9a42b` | `oklch(74.9% 0.142 82.9)` | Sun, frames, brass details |
| Lamplight | `#ffd27a` | `oklch(88.5% 0.118 82.9)` | Lit windows, focus, highlights |
| Burgundy | `#6e1f33` | `oklch(37.1% 0.112 9.3)` | Accent, sign-paint, links on plaster |
| Terracotta | `#c9735a` | `oklch(64.5% 0.115 37.0)` | Roofs, pots |
| Plaster | `#f4eadb` | `oklch(94.1% 0.023 78.2)` | Page background (light) |
| Zinc | `#8d9bb4` | `oklch(68.7% 0.040 262.1)` | Mansards, rules, muted UI |
| Cypress | `#3c5a50` | `oklch(44.1% 0.039 171.6)` | Trees; "live" status |

Light theme: ink on plaster with burgundy accents. Dark theme: plaster on `#1b2148`, with pink accents. Ink on plaster passes AAA, and burgundy on plaster passes AA for body text.

## Typefaces (all SIL OFL, latin subsets, self-hosted in `fonts/`)

- **Federo** (`federo-latin.woff2`, 13 KB) is the Art Deco display face for the wordmark, headings and spaced caps labels, tracked at +0.16em for caps. The wordmark and lockup are Federo converted to outlines.
- **Poiret One** (`poiret-one-latin.woff2`, 8 KB) is a hairline Deco face for very large figures only ($782, 113,000+). Do not use it below 48 px.
- **Instrument Sans** (`instrument-sans-latin.woff2` plus the italic, 48 KB) is the quiet text face for body, UI and code-adjacent lines.

## Inventory

| File | What | Intended use | Source / how made | Licence |
|---|---|---|---|---|
| `identity/mark.svg` | Arched window at blue hour: night, lavender and pink bands, the sun on the horizon, three reflection bars, burgundy frame and sill | Logo mark, nav, social avatar | Hand-built SVG (Python generator) | Original, Albretsen AS |
| `identity/mark-mono.svg` | One-colour mark (`currentColor`) | Inline in nav or footer, print | Same | Original |
| `identity/wordmark.svg`, `wordmark-plaster.svg` | ALBRETSEN in Federo, outlined, +0.16em | Header, footer | fontTools outline of Federo (OFL permits) | Original + OFL glyphs |
| `identity/lockup.svg`, `lockup-plaster.svg` | Mark + wordmark + small AS | Header, documents | Same | Original |
| `identity/favicon.svg`, `favicon-32.png` | Favicon (heavier frame) | `<link rel=icon>` | Same, rsvg-convert | Original |
| `identity/apple-touch-icon-180.png` | 180 px touch icon on plaster | `<link rel=apple-touch-icon>` | rsvg + Pillow | Original |
| `identity/og-image.jpg` | 1200×630 Open Graph image: blue-hour hero, mark, wordmark, the line | `og:image` | `og-source.html` screenshotted in headless Chrome | Original |
| `hero/hero-blue-hour-{768,1280,1920,2560}.{avif,webp}` + `.jpg` (768 to 1920) | **Main hero**: sun at −1.6°, afterglow, town lights coming on | First screen, behind the live canvas | Baked from `3d/heure-bleue.js` via `3d/render.html?t=0.2` | Original |
| `hero/hero-blue-hour-tall-{720,1080}.{avif,webp,jpg}` | Portrait framing with its own camera (rooftops and facades close, bougainvillea top left) | Phones (`max-aspect-ratio: 1/1`) | `render.html` at 1080×1920 | Original |
| `hero/hero-golden-{768..2560}` | Same view, sun at +6.6°, Anderson pastel daylight | The state after the sun is dragged up; about or products section | `render.html?t=0.62` | Original |
| `hero/hero-lamplight-{1280,1920,2560}` | Sun at −6.6°, nearly every window lit, stars | Footer or a "late" section | `render.html?t=0.02` | Original |
| `photo/dome-golden-{960,1600}` | A Paris slate dome with a gilded figure, gradient-mapped burgundy to gold, soft posterise, grain | Editorial texture, blog cover, about | Wikimedia Commons, [Haussmann_Pasquier.jpg](https://commons.wikimedia.org/wiki/File:Haussmann_Pasquier.jpg), cropped above the clock, graded with numpy | Public domain |
| `photo/whitewashed-street-blue-{960,1600}` | Marbella old-town street with bougainvillea, graded into blue-hour lavender with the magenta kept | Editorial texture, about | Wikimedia Commons, [Marbella_Old_town_1.JPG](https://commons.wikimedia.org/wiki/File:Marbella_Old_town_1.JPG), graded | CC0 |
| `products/mcp-emails.svg` + `-600.webp`, `-1200.{webp,avif}` | Burgundy letterbox under a wall lantern, with the **real MCP Emails logo-mark** on an enamel plaque; arched blue door, bougainvillea | Product card or page | SVG generator; logo embedded unchanged from `_shared/products/mcp-emails/logo-mark.svg` | Original; logo belongs to MCP Emails |
| `products/fun-libs.*` | Terrace table at golden hour under a striped awning: coffee, a word puzzle with blanks, and the **real Fun Libs icon** on a tent card | Product card or page | Same; `fun-libs/icon.png` embedded (base64) | Original; icon belongs to Fun Libs |
| `products/toolrails.*` | Painted tile panel in Deco rings and rays with the **real Toolrails icon** as the centre tile; raking shutter light, lemon tree | Product card or page | Same; `toolrails/icon.svg` embedded | Original; icon belongs to Toolrails |
| `products/harbor.*` | Zinc roof at night, a lit stone dormer with bookshelves and the **real Harbor mark** on a hanging disc; moon, chimney pots | Product card or page | Same; `harbor/harbor-mark.svg` embedded, `currentColor` = ink | Original; mark belongs to Harbor |
| `products/stamps/{luma,polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}.svg` | Perforated postage-stamp stand-ins for retired products (Luma uses its real wordmark PNG) | Archive or "earlier work" strip | SVG generator | Original; Luma wordmark belongs to Luma |
| `extras/bougainvillea-sprig.svg` | Transparent cut-out cascade of three-bract flowers | Corner ornament (with `.hb-sway`) | SVG generator | Original |
| `extras/awning.svg` | Scalloped pink and cream awning edge, repeats horizontally | Top of a section, nav underside | SVG | Original |
| `extras/divider-sunset.svg` | Deco divider: setting sun, stepped rays, reflection bars | Between sections | SVG | Original |
| `extras/terrace-tile.svg` | Pink and cream checkerboard tile | Footer floor, code block backdrop | SVG | Original |
| `extras/postmark.svg` | Circular postmark "ALBRETSEN AS · NORWAY", "2016 / on Google Play since", wavy cancellation lines | Footer, dated posts | SVG; circular text from Federo outlines | Original |
| `extras/ticket-mcp.svg` | Ticket stub carrying `claude mcp add albretsen https://albretsen.no/mcp` | The MCP command callout | SVG | Original |
| `extras/paper-grain.webp` | 512 px tileable paper grain (fine noise and horizontal fibres) | `background` + `mix-blend-mode`/`background-blend-mode: multiply` on plaster | numpy FFT-filtered noise | Original |
| `3d/heure-bleue.js` | **Interactive asset.** The whole scene from three.js primitives: banded sky shader with clouds, halo rings, belt of Venus and stars; sea shader with dashed sun glitter; toon-lit Haussmann blocks, rotunda dome, village, pines, cypresses, bougainvillea; instanced windows that light up by seed as the sun sinks. Exports `createHeureBleue(canvas, { time, framing, grain, animate, interactive })` and returns `setTime`, `time`, `elevation`, `sunScreen()`, `onTime`, `onFrame`, `dispose` | Live hero over the baked still | Written for this kit | Original |
| `3d/demo.html` | Full-screen demo: still first, canvas fades in on idle, "Drag the sun" hint follows the sun, sun-elevation readout | Reference implementation for the builder | Original |
| `3d/render.html` | Bake helper (`?t=&framing=&grain=`) for headless screenshots | Regenerating stills | Original |
| `vendor/three.module.min.js` | three.js r170 | Dependency of the 3D module | https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js | MIT |
| `motion.css`, `motion.js` | Motion study (below) | Site-wide | Original |
| `fonts/*.woff2` | Federo, Poiret One, Instrument Sans (+ italic) | Self-hosted type | fonts.gstatic.com (Google Fonts) | SIL OFL 1.1 |
| `preview.html` | Contact sheet | Review | Original |

Total kit size is about 6.9 MB. A first paint that uses the hero needs one AVIF (33 to 80 KB) plus fonts (about 45 KB). The 3D module and three.js (about 720 KB) load only after first paint.

## Motion study (`motion.css` + `motion.js`)

All six switch off under `prefers-reduced-motion`.

1. **hb-haze · Heat haze.** An SVG `feTurbulence` stretched sideways (baseFrequency about 0.006 × 0.09) drives an `feDisplacementMap` of 5 px. Its frequency drifts on two slow sines, so the loop never repeats visibly. Apply it to a short horizon band only. Reference: Framer svgmelt distort, heat-haze mode.
2. **hb-sway · Sea breeze.** Rotates ±1.1° with a slight skew, pivoting from the top, over 7.5 s. Siblings go out of phase through `--i`. Use it on bougainvillea, awnings and hanging signs. Reference: the ambient loops on painted backdrops at cursor.com and kinfolk.com.
3. **hb-shutters · Louvre reveal.** Plaster slats in a repeating gradient thin from 26 px to 0 through an animated `@property` length. There is no per-frame JS. `initMotion()` adds `.is-open` on enter. Reference: blinds-style image reveals (Codrops).
4. **hb-settle · Tracking settle.** Federo caps arrive at 0.6em tracking and settle to 0.16em over 1.6 s as they fade in. Reference: kinfolk.com's restrained display-type entrances.
5. **hb-lights · Lights on.** When a `[data-lights]` section is more than 55% in view, it gets `data-hour="blue"` and its `.hb-window` children warm to lamplight on a scattered `--i` stagger. This echoes the 3D windows. Reference: demosthenes.info's CSS/SVG day-night cycle.
6. **hb-dusk · Dusk scroll.** A section's sky gradient walks from golden to blue hour as it scrolls through (`animation-timeline: view()`, with a static gradient where unsupported).

The signature delight is the sun drag in `3d/heure-bleue.js`. Hit-testing works in screen space. The pointer's y is inverted through the projection to a sun elevation by bisection, so the sun stays exactly under the finger. Time eases toward the target exponentially, and `touch-action: pan-y` keeps page scroll working on phones.

## Notes for the builder

- Paint the still first (`<picture>` with AVIF/WebP/JPEG, width and height set, `fetchpriority="high"`). Then, on idle, import `3d/heure-bleue.js` and fade the canvas in over the still (see `3d/demo.html`). Because the still and the live scene come from the same renderer, the swap does not jump. The module pauses rendering when off-screen.
- Rest the sun at `time = 0.245` (−1.6°, the sliver on the horizon). `time` maps linearly to sun elevation from −7° to +15°.
- The module sets `THREE.ColorManagement.enabled = false` globally because its shaders speak sRGB directly. Do not mix it with other three.js scenes on the same page.
- Product cards are 4:5. Use the SVG for crisp vector output, or the WebP/AVIF for speed. The caption band is part of the art, so the site can omit extra captions or set its own copy beside it.
- Keep copy about the software. The world is atmosphere only: no place names, no tourist clichés.
