# Design 83: Warm Boot (asset kit)

Open brief. The hero concept is a boot sequence that becomes the homepage. The art direction is retro-futurist airbrush gradients, the centrepiece is canvas-2D generative drawing, motion uses GSAP + ScrollTrigger, and the personality is editorial gravitas. The palette is warm earth with a 180° seed hue. The signature move is text that decodes into place. The spark words were rhythm, drift and electric.

## Vision

The site **powers on**. A single phosphor line opens at the horizon, as on a 1970s CRT. A short POST log types in and each check decodes to `OK`. The log collapses back into that line, and the line **rises into a landscape**: CRT scanlines in perspective, displaced by terraced noise until every raster line is the ridge of a mesa. The boot screen does not hand over to the homepage; it *becomes* the homepage. Behind the raster sits the world of the paintings. That world is a high desert of flat-topped mesas under a banded sun, painted in the smooth gradients and fine spatter grain of 70s airbrush paperback covers (Pennington, Foss, Elson). It is not imitated pastiche: the paintings are generated in OKLab, so the gradients are clean and never muddy.

The subject stays the company. Each **product is a sun at its own hour**: its real logo is carried by the sun in a painting of its own, and the hour encodes status. Live products are up (MCP Emails at sunrise, Fun Libs at noon). Toolrails is building and is just cresting the ridge. Harbor is paused at blue hour. Retired products are **specimens** cut from Ernst Haeckel's 1904 plate of radiolarians: precise, finished, archived with dignity. This is the editorial gravitas: plates, captions, hairline frames and a serious serif. The electric part is a single phosphor colour, used only for things that are "on".

What it should feel like: calm, certain and lit from below the horizon. One idea per screen, lots of night sky, and a machine doing its checks on a 120 ms beat.

**Mood words:** first light, quiet machine, plate & caption, drift, warm boot.

### References (researched)
- 70s SF cover airbrush, gradients and "far-out landscapes": Adam Rowe, *Worlds Beyond Time* (Abrams 2023), https://www.abramsbooks.com/product/worlds-beyond-time_9781647000707/ and the 70s Sci-Fi Art archive, https://adamrowe.substack.com/p/image-of-the-week-bruce-pennington
- CRT power-on phases (line, vertical open, flicker, settle): GameLord docs, https://www.mintlify.com/ryanmagoon/gamelord/components/animations/power-animation ; lbebber's CSS CRT pen, https://codepen.io/lbebber/pen/XJRdrV
- Boot-log component pattern (POST lines, then splash, then hand-off): https://mintlify.wiki/apursley2012/log-portfolio/components/boot-sequence
- Text decode: GSAP ScrambleTextPlugin, https://gsap.com/docs/v3/Plugins/ScrambleTextPlugin/ (free since 3.13, https://gsap.com/blog/3-13/). Also soulwire's "Text Scramble" CodePen (https://codepen.io/soulwire/pen/mEMPrK, recalled from memory and not re-verified: the search budget ran out).
- Noise fields, drift via a time axis, contour extraction: Tyler Hobbs, https://www.tylerxhobbs.com/words/flow-fields ; Varun Vachhar, https://varun.ca/noise/ ; FH Potsdam contours, https://parametric-design.fh-potsdam.de/en/bonus/contours/
- Layered-landscape scroll parallax: the 2014 Firewatch site's header (from memory; the current page no longer shows it).
- Research starting points visited: polyhaven.com (API used for models), ambientcg.com (paper texture), rive.app/community and codepen.io/trending (codepen returned 403 to the fetcher).
- Salt `9f4797`: digit 9 picked **rock_09** from Poly Haven's rocks list; f/15 picked moon_rock_05, which was tried and rejected (an open-based scan).

## Palette (OKLCH, sRGB hex)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| night | oklch(0.18 0.025 220) | #041419 | page ground, night sky |
| dusk-teal | oklch(0.31 0.055 226) | #063645 | upper sky, deep panels |
| ink | oklch(0.22 0.020 50) | #221812 | text on bone |
| umber | oklch(0.27 0.040 45) | #372016 | near mesas, footer |
| terracotta | oklch(0.60 0.120 38) | #bc6449 | lit rock, warm accents |
| mauve | oklch(0.55 0.065 338) | #8b637f | dawn band, transitional |
| ochre | oklch(0.78 0.120 70) | #e8a95c | sun, italic emphasis, figures |
| sand | oklch(0.90 0.045 80) | #eedbbd | text on night |
| bone | oklch(0.965 0.016 85) | #f8f3e8 | light sections (with paper texture) |
| verdigris (seed 180) | oklch(0.64 0.085 180) | #499d8e | calm accent, mark cursor on light |
| phosphor (seed 180) | oklch(0.88 0.110 180) | #7defda | electric only: boot text, cursor, scanline, labels |

The dawn ramp, interpolated in OKLCH, is dusk-teal → mauve → terracotta → ochre → sand. Every gradient follows it. Contrast: sand on night is about 14:1 and phosphor on night about 13:1. Never set phosphor or ochre as text on bone; use ink there.

## Typefaces (SIL OFL 1.1, self-hosted woff2, latin subset from Google Fonts)

- **Newsreader** (Production Type), variable (wght 200–800, opsz 6–72), roman and italic. Display at opsz 72 / wght 330 with -0.02em tracking. Body at opsz 16 / 400. Italic in ochre for one emphasised phrase per heading.
- **Martian Mono** (Evil Martians), variable (wght 100–800, wdth 75–112.5). Labels and boot log, at wdth 112.5, uppercase, +0.08–0.12em tracking.
- Wordmark: Newsreader 430 / opsz 72 outlines plus "AS" in Martian Mono 380 / wdth 112.5, converted to SVG paths (no font needed).

## Hero usage notes

- `first-light` is the LCP image. Serve it with `<picture>` (AVIF → WebP → JPEG), `sizes="100vw"`, `fetchpriority="high"` and `width="1280" height="720"`. The 2560 AVIF is 47 KB. LQIP data URIs are in `*-lqip.txt`. Focus point x = 0.60 (sun). Keep text left; the left third is dark sky and cliff.
- `blue-hour` focus x = 0.66 (the stone). Its left half is quiet sky, so text can sit there.
- Portrait crops (9:14) exist for phones: use `<source media="(max-width: 700px)">`.
- The Drift Field canvas is the boot layer. It can sit *over* the static painting (its sky is opaque) or with `sky:false` over the picture. Start it after first paint; the painting alone is the no-JS / reduced-motion state.

## Inventory

| File | What | Intended use | Source / how made | Licence |
|---|---|---|---|---|
| brand/mark.svg | Banded sun over a cursor bar ("sun_"), ochre gradient, verdigris cursor | Logo, nav, footer | Hand-authored SVG (identity.py) | Original, Albretsen AS |
| brand/mark-mono.svg | Same, `currentColor` | One-colour use, inline with `.wb-blink` | Same | Original |
| brand/wordmark.svg / wordmark-sand.svg | "Albretsen AS" as outlines (currentColor / sand + phosphor) | Masthead, OG | fontTools text-to-path from Newsreader + Martian Mono | Original artwork; fonts OFL (outlines permitted) |
| brand/lockup.svg | Mark + wordmark | Header on bone | Same | Original |
| brand/favicon.svg, favicon-32.png, apple-touch-icon-180.png | Mark on night tile | Favicon / touch icon | SVG, rasterised with rsvg-convert | Original |
| brand/og-image-1200x630.jpg (+ og-source.html) | Wordmark + canonical line over First light | Open Graph / social | HTML page screenshotted in headless Chrome | Original |
| hero/first-light-{828,1280,1920,2560}.{avif,webp,jpg}, -portrait-{600,900}, -lqip.txt | Dawn over layered mesas, banded sun, stars fading | Homepage hero (LCP) | Procedural matte painting: numpy/scipy, OKLab ramps, mesa silhouettes, rim light, spatter grain (hero1.py, scene.py, paint.py) | Original |
| hero/blue-hour-* (same set) | Salt-flat mirror at blue hour, floating standing stone, Voronoi salt crust | Second scene: about / scroll scene / products intro | Procedural painting (hero2.py) composited with the Drift Stone baked in headless Chrome (difference matte) | Original; stone geometry CC0 (see below) |
| products/mcp-emails-{480,800,1200}.* | Sunrise; real MCP Emails mark inside the sun | Product card / page header | products.py + real logo `_shared/products/mcp-emails/logo-mark.svg` (unchanged) | Painting original; logo is Albretsen AS's own |
| products/fun-libs-* | Noon; real Fun Libs icon (v5) in the sun | Same | products.py + `fun-libs/icon.png` | Same |
| products/toolrails-* | Sun cresting the ridge (building); real Toolrails icon | Same | products.py + `toolrails/icon.svg` | Same |
| products/harbor-* | Blue hour over a salt mirror (paused); real Harbor mark in ink | Same | products.py + `harbor/harbor-mark.svg` (currentColor filled with #0b2a33) | Same |
| products/luma-* | Set sun with the real Luma logo | Retired row | products.py + `luma/logo.png` | Same |
| products/retired/{polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}-sand.webp | Radiolarian specimens, sand on transparent | Stand-ins for retired products without assets | Cut from Haeckel, *Kunstformen der Natur* (1904) Tafel 31 *Cyrtoidea*, BHL scan via Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Kunstformen_der_Natur_(Tafel_31)_BHL47388125.jpg (luminance key, component mask, tint) | Public domain |
| extras/signal-phosphor.webp, signal-sand.webp | The central radiolarian with radiating spines ("electric") | Section art, 404, blog cover motif | Same plate, spines kept, neighbours masked | Public domain |
| extras/specimen-b-sand.webp | Bell-shaped radiolarian | Framed plate figure | Same plate | Public domain |
| extras/plate-frame.svg | Hairline double rule with registration ticks | Frame any figure editorially | Hand-authored SVG | Original |
| extras/horizon-{dawn,noon,dusk,night}.webp | 2400×220 sky gradient strips with mesa silhouette | Section dividers / footer | extras.py | Original |
| extras/paper-bone-768.{webp,jpg} | Tileable bone paper with soft crumple relief | Light sections | Derived from ambientCG **Paper003** displacement (https://ambientcg.com/view?id=Paper003) | CC0 |
| extras/grain-256.png | Tileable monochrome grain | Overlay at 4–8% (`.wb-grain`) | numpy, wrapped Gaussian | Original |
| extras/scanlines.svg | 4 px raster pattern | CRT overlay (`.wb-raster`) | Hand-authored | Original |
| generative/drift-field.js (+ demo.html) | **Centrepiece**: canvas-2D boot → raster → mesa landscape; contour mode too; `boot()`, `setHour()`, pointer warp (contour) | Homepage hero layer | Hand-written; simplex noise after Stefan Gustavson (public domain) | Original |
| 3d/drift-stone.glb | Standing stone: Rock 09 geometry + 512 px normal & AO, ochre base colour | Floating 3D object over Blue hour | Poly Haven **Rock 09** by Jenelle van Heerden, https://polyhaven.com/a/rock_09 , repacked with packglb.py | CC0 |
| 3d/drift-stone.js (+ demo.html) | three.js module with painted-ramp shader, raster scan-in, dusk control, pointer drift | Interactive / 3D asset | Hand-written; three@0.160.0 from jsdelivr via import map | Original (three.js MIT) |
| motion.css, motion.js | Motion study (below) | Copy into the site | Hand-written; GSAP 3.13.0 + ScrollTrigger (jsdelivr) | Original (GSAP "no charge" licence) |
| fonts/newsreader-latin.woff2, newsreader-italic-latin.woff2, martian-mono-latin.woff2 | Variable fonts, latin subset | Self-hosted type | fonts.gstatic.com via the Google Fonts CSS2 API | SIL OFL 1.1 |
| preview.html | Contact sheet | Review | Hand-written | Original |

## Motion study (motion.css + motion.js)

Everything snaps to a **120 ms beat** (`--wb-beat`, `BEAT`) and respects `prefers-reduced-motion`.

1. **Decode** (`decode(el)`): the text scrambles through `▁▂▃▄▅▆▇░▒▓/\|<>_=+*#01` and resolves left to right. Updates are quantised to a third of a beat so it pulses rather than blurs. Not-yet-reached capitals show as `▁` and lower case as `·`, so the line's shape is visible before it resolves. Use it for the masthead, section labels and the MCP command. Sources: soulwire's Text Scramble and GSAP ScrambleTextPlugin, rebuilt without the plugin.
2. **Warm boot** (`bootSequence({log, lines, field})`): POST lines appear two beats apart, each decoding, with its status decoding one beat later. The log then scales to a 0.4% hairline with brightness ×3 (`power3.in`), and the Drift Field takes over from that line over 3.2 s: the scanline opens, the raster sweeps toward the viewer, then the mesas rise with an ease-out cubic. Sources: GameLord's CRT phases, lbebber's CRT pen and the log-portfolio boot pattern.
3. **Horizon drift** (`horizonDrift({section, layers, fade, field})`): ScrollTrigger scrub 0.8. Scroll moves the hour: the First light → Blue hour crossfade, optional parallax layers at different yPercent, and `field.setHour()` re-tints the raster ramp from dawn to blue hour. Source: classic layered-landscape parallax (Firewatch, 2014).
4. **Power on** (`.wb-power-on`, CSS): point → line (18%) → vertical open (40%) with brightness ×4 → ×1 and two opacity flickers. Use it for images and figures entering after boot.
5. Small extras: **cursor blink** (`.wb-blink .cursor`, 1.06 s hard steps, the mark's underscore) and **scanline sweep** (`.wb-sweep.is-in`, one raster pass over product paintings on entry via `sweepIn()`).

## Performance notes

- Kit total about 5.3 MB on disk. A homepage needs: first-light AVIF at 1280–1920 (17–29 KB), 3 woff2 files (318 KB, of which Newsreader roman 132 KB; preload it and Martian Mono only), mark SVG and drift-field.js (15 KB). That puts first load well under 1 MB.
- three.js (~600 KB from CDN) plus drift-stone.glb (398 KB) should be loaded only via `IntersectionObserver` on the section that shows the stone, as preview.html does.
- Every image in the kit has explicit dimensions (see preview.html), so layout shift is 0.
