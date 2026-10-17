# Design 63: The Long Evening

Open `preview.html` first. It plays every asset, the motion study and the 3D room.

## Vision

California light seen through a Norwegian window. The site is set at the hour of a late-summer evening that never quite turns to night: fog banks below a ridge, a low sun down a palm boulevard, golden hills. Everything is painted in a small-town Norwegian palette of white clapboard, falu red, ochre and slate. The landscape is atmosphere, not a postcard of a place, so the copy carries no place names.

- **The hero idea.** The name sits *inside* the landscape. The stack is the graded photo, then the live type `Albretsen` (real SVG text, selectable and accessible), then a foreground matte cut from the same photo. On the fog hero, the letters sink into the fog bank and the final "n" slips behind the ridge. On the boulevard hero, the palms stand in front of the name. As the hero scrolls away, the name sinks a little further into the fog.
- **The products** are postcards. Each front is a graded photograph with a perforated stamp that carries the real product logo, unchanged. The card flips (the signature delight) to a live-HTML back holding the product line, its facts and its address. Retired products are stamps in an album.
- **The room.** A planimetric three.js room: clapboard walls, a slate floor, a falu-red credenza with an ochre top, two identical lamps, and the four postcards framed symmetrically. A low sun crosses the window, and its patch on the floor slides and lengthens. Scroll position is the time of day.
- **Personality.** Luxury restraint: one idea per screen, generous space. The motion is deadpan: centred or lateral, on a single symmetric curve, with no overshoot.

Mood references (research): linear.app (product-as-hero, editorial "Fig." captions, restraint); kinfolk.com (airy editorial whitespace, small caps labels over serif titles); cosmos.so (quiet single-column rhythm, imagery as content); are.na/explore (collected, archival feel that informed the stamp album). Technique references: Apple CardFlip sample (developer.apple.com/library/archive/samplecode/CardFlip), MDN `animation-timeline: view()` and `scroll()`, Codrops "A Practical Introduction to Scroll-Driven Animations" (tympanus.net/codrops/?p=75216), three.js shadows manual (threejs.org/manual/#en/shadows), analyses of planimetric staging and lateral whip pans in symmetrical film framing (backstage.com, videomaker.com).

Salt `4f92be`. Its digits picked result indices 4, 15, 9, 2, 11 and 14 in the Commons "Big Sur" search, and 4, 2 and 5 in the "palm trees sunset" search. The final picks were made from those candidates.

## Palette

| Name | Hex | OKLCH | Role |
|---|---|---|---|
| Clapboard | `#F5EFE4` | `oklch(95.4% 0.016 82.8)` | page, light text on photos |
| Card stock | `#F1E8DA` | `oklch(93.4% 0.021 79.1)` | panels, postcard backs |
| Ink | `#23252D` | `oklch(26.6% 0.015 274.3)` | text |
| Slate | `#3E4651` | `oklch(39.1% 0.021 256.4)` | secondary UI, rules, floor |
| Falu red | `#8A2E22` | `oklch(43.6% 0.128 30.4)` | the one accent per screen, mark ground |
| Ochre | `#C9973A` | `oklch(70.7% 0.123 79.6)` | the sun, small highlights |
| Sun glow | `#E6B661` | `oklch(80.3% 0.117 80.1)` | gradients into ochre |
| Dusk haze | `#E9C7B2` | `oklch(85.3% 0.048 53.6)` | evening background drift (`--sun`) |
| Marine layer | `#BFD0D6` | `oklch(84.7% 0.020 220.9)` | cool counterpoint, Harbor stamp |
| Fog line | `#4A4C5A` | `oklch(42.0% 0.023 278.9)` | the name set into the fog (multiply, ~0.8) |

Photo grade (used for every photograph): soft S-curve, saturation × 0.92–0.96, a split tone (shadows toward `#2B2C35`, mids toward `#EDB99A`, highlights toward `#F6EADB`), a lifted black (~4.5 %) and fine luminance-weighted grain.

## Typefaces

- **Bodoni Moda** (display), OFL, by indestructible type*. `fonts/bodoni-moda-display.woff2` (wght 400–700, opsz pinned to 96) and `-italic.woff2` (wght 400–600). Use it for the name, headlines, the postcard backs and large figures. Hero type uses weight 440 with `letter-spacing: -0.01em`.
- **Schibsted Grotesk** (text and UI), OFL, by Schibsted. `fonts/schibsted-grotesk.woff2` (variable 400–900). Small caps labels use 11 px with `letter-spacing: .22em`.
- Both are Latin subsets (including æøå). Licences are in `fonts/OFL-*.txt`.

```css
@font-face { font-family: "Bodoni Moda"; src: url(assets/fonts/bodoni-moda-display.woff2) format("woff2"); font-weight: 400 700; font-display: swap; }
@font-face { font-family: "Bodoni Moda"; src: url(assets/fonts/bodoni-moda-display-italic.woff2) format("woff2"); font-weight: 400 600; font-style: italic; font-display: swap; }
@font-face { font-family: "Schibsted Grotesk"; src: url(assets/fonts/schibsted-grotesk.woff2) format("woff2"); font-weight: 400 900; font-display: swap; }
```

## How to build the hero (from preview.html)

`<div class="lx-fog">` holds three layers at the same 3:2 box:
1. `<picture>` with `hero/fog-{768,1280,1600,1920,2560}.{avif,webp}` and a `fog-1600.jpg` fallback (`fetchpriority="high"`).
2. `<svg viewBox="0 0 3840 2560" preserveAspectRatio="xMidYMid slice"><text x="154" y="1224" font-size="649" font-weight="440" fill="#4A4C5A" fill-opacity=".8">Albretsen</text></svg>` with `mix-blend-mode: multiply`.
3. `<picture>` with `hero/fog-foreground-{1280,1920,2560}.avif` (webp up to 1920). This is the same photo with alpha, and it hides the letters behind the ridge and in the fog.

For the boulevard, use `x="270" y="1024" font-size="744"`, fill `#8A2E22`. Keep all three layers on `object-fit: cover` and the same aspect ratio, or the matte will drift. On a phone, crop the box to 4:5 with `object-position: 30% 50%` on all three layers. The SVG must use the same position through `preserveAspectRatio="xMidYMid slice"`, or wrap the layers in a container that crops.

First-paint weight of the fog hero at 1280 w: about 17 KB (AVIF) for the photo plus about 31 KB for the matte, with the fonts at 24 KB.

## Motion (motion.css / motion.js)

| # | Name | What | Reference |
|---|---|---|---|
| 1 | Postcard flip | `rotateY(180deg)`, 760 ms, `cubic-bezier(.65,0,.35,1)`, with a symmetric lift of `translateZ(60px)` at the midpoint. Uses `aria-pressed` and works by keyboard. | Apple CardFlip sample; MDN backface-visibility |
| 2 | Horizon wipe | `clip-path: inset(var(--horizon) 0 …)` opening to `inset(0)` from the photo's horizon line, top and bottom together. Scroll-driven with `view()`, with an IntersectionObserver fallback. | MDN view(); Codrops scroll-driven intro |
| 3 | Sun traverse | `@property --sun` animated by `scroll(root)`. It moves and warms `window-light.svg`, drifts the page from clapboard to haze, and `initSun()` forwards it to `room.setTime()`. | MDN scroll(), @property |
| 4 | Deadpan pan | A lateral move of exactly one card width, `cubic-bezier(.83,0,.17,1)`, with a 6 px blur only at the midpoint. | Lateral whip pans in planimetric staging |
| 5 | Into the fog | On exit, the hero name translates 6 % down and fades to 0.55 opacity under the foreground matte. | Depth-layered cover type |

All of them respect `prefers-reduced-motion`.

## Inventory

| File | What | Intended use | Source / how made | Licence |
|---|---|---|---|---|
| identity/mark.svg (+ -light, -night) | A Bodoni A whose crossbar is the horizon, with a low ochre sun setting on it | logo, app icon, avatar | Drawn in Python; glyph outlines from Bodoni Moda (opsz 11, wght 620) via fontTools | Own work; font OFL (outlines permitted) |
| identity/wordmark.svg (+ -light) | "Albretsen" Bodoni 96 + "AS" Schibsted caps, outlined | header, footer | fontTools outlines | Own work |
| identity/lockup.svg | mark + wordmark | header | composed | Own work |
| identity/favicon.svg, favicon-180.png | Grotesk A over the sun on falu red | favicon, apple-touch-icon | fontTools + rsvg-convert | Own work |
| identity/og-1200x630.jpg | Fog hero with the name + mark + line | Open Graph / social | Composited from hero/fog-named | CC0 photo + own work |
| hero/fog-*.{avif,webp,jpg} | Fog filling a coastal valley at sunset, graded | Hero A background | "Big Sur, United States (Unsplash znekTMMoBrM)" https://commons.wikimedia.org/wiki/File:Big_Sur,_United_States_(Unsplash_znekTMMoBrM).jpg, graded in numpy | CC0 (Unsplash via Wikimedia Commons) |
| hero/fog-foreground-* | Same photo with an alpha matte (ridge + fog bank) | Hero A top layer | Luminance key + fog-band ramp, Gaussian-softened | CC0 + own work |
| hero/fog-named-* | Baked composite with the name | no-JS, social, print | PIL composite | CC0 + own work |
| hero/boulevard-* | Palm-lined road to a low sun by the sea, graded | Hero B / section image | "Palm tree boulevard (Unsplash)" https://commons.wikimedia.org/wiki/File:Palm_tree_boulevard_(Unsplash).jpg | CC0 |
| hero/boulevard-foreground-*, boulevard-named-* | Palm matte, baked composite | Hero B layers | luminance key | CC0 + own work |
| products/postcard-mcp-emails-* | Coast road in fog + MCP Emails stamp | product card front | "Big Sur in Fog (Unsplash)" https://commons.wikimedia.org/wiki/File:Big_Sur_in_Fog_(Unsplash).jpg + real logo `_shared/products/mcp-emails/logo-mark.svg` | CC0 + product's own logo |
| products/postcard-fun-libs-* | Palms on a pastel dusk gradient + Fun Libs stamp | product card front | "Venice Beach palm trees at sunset (Unsplash)" https://commons.wikimedia.org/wiki/File:Venice_Beach_palm_trees_at_sunset_(Unsplash).jpg + `fun-libs/icon.png` | CC0 + product logo |
| products/postcard-toolrails-* | Fog over forested hills + Toolrails stamp | product card front | "Sunset beyond the fog (Unsplash)" https://commons.wikimedia.org/wiki/File:Sunset_beyond_the_fog_(Unsplash).jpg + `toolrails/icon.svg` | CC0 + product logo |
| products/postcard-harbor-* | Golden grass hill at sunset + Harbor stamp | product card front | "Big Sur (Unsplash ZgzPkzJtvYU)" https://commons.wikimedia.org/wiki/File:Big_Sur_(Unsplash_ZgzPkzJtvYU).jpg + `harbor/harbor-mark.svg` | CC0 + product logo |
| products/stamp-{mcp-emails,fun-libs,toolrails,harbor}(@2x).webp | Perforated stamps with the real logos, unchanged | postcard backs, lists, footers | PIL: perforation mask, paper noise, hairline frame | Own work + product logos |
| products/stamp-retired-*.webp | Luma (real logo.png), and stand-ins with Bodoni initials for Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, Early apps (%) | "retired" album | PIL | Own work (+ Luma logo) |
| room/room.js, room/room.html | three.js room with the moving sun; `mountRoom(el,{base,time})` returns `setTime(0..1)` | interactive section, lazy | Hand-written; three@0.169.0 from jsDelivr | Own work; three.js MIT |
| room/room-{afternoon,evening}-* | Baked stills of the room at t=0.18 and t=0.92 | poster / first paint / mobile | headless Chrome screenshot of room.html | Own work (contains CC0 photos) |
| extras/clapboard-{white,falu}.webp | Seamless painted-board tiles, 512 px | section backgrounds, footer | numpy procedural | Own work |
| extras/paper-cardstock.webp | Seamless card stock tile | postcard backs, panels | numpy procedural | Own work |
| extras/palm-shadow.webp | Palm crowns as a soft shadow gobo | over light sections (multiply) | Cut from the boulevard photo's luminance, sheared and blurred | CC0 + own work |
| extras/postmark.png | Round cancel "ALBRETSEN AS · NORWAY · 2016—" with wavy lines | footer, about, stamps | PIL, Schibsted glyphs, ink wear | Own work |
| extras/airmail-edge.svg | Falu / clapboard / slate diagonal border | top or bottom rule, email links | hand SVG | Own work |
| extras/sun-horizon.svg | A low sun on a hairline horizon | section divider | hand SVG | Own work |
| extras/window-light.svg | Four-pane sun patch, soft | "Sun traverse" | hand SVG | Own work |
| extras/orbit-evening-* | Sunset over Pacific clouds from the ISS, levelled flat | closing band / blog cover | NASA ISS059-E-101098 https://images.nasa.gov/details/iss059e101098, rotated 19.2°, graded | Public domain (NASA) |
| fonts/*.woff2 | Subsets of Bodoni Moda and Schibsted Grotesk | site fonts | github.com/google/fonts (ofl/bodonimoda, ofl/schibstedgrotesk), subset with fontTools | SIL OFL 1.1 |
| motion.css, motion.js | Five signature animations | site motion | Hand-written | Own work |
| preview.html | Contact sheet | review | Hand-written | Own work |

Total: about 6.4 MB, nearly all of it optional large sizes. A realistic first paint is the fog hero at 1280 (~50 KB AVIF photo + matte), the fonts (~90 KB) and the lockup SVG.
