# Warm Boot

*Design 83 for albretsen.no / Albretsen AS. Built on asset kit 83 (`assets/`, see `assets/ASSETS.md`).*

## Vision

The site powers on. On a first visit in a session the screen is night, and a POST log for the company types in: *Play Console since 2016 OK, MCP Emails 17 tools OK, Fun Libs 113,000+ installs OK, Toolrails BUILD, Harbor IDLE, outside engagements 1 SLOT.* Every line is a real fact from `content.js`. The log collapses into a single phosphor line at the horizon, and the Drift Field (canvas 2D, generative) raises a raster landscape out of that line.

Then the surprise: the raster **develops**. Each 4 px scanline thins until it is gone, and through the gaps comes the airbrushed painting *First light*: dawn over flat-topped mesas, a banded sun. The machine checks itself, shows its working, and then steps aside for the picture. The signal is still there underneath. Move the pointer over the hero and a soft lens shows the live raster drifting below the painting. For keyboard and touch, **View signal** brings the whole raster back, scanline by scanline.

That is the personality: an engineer who does his checks properly and then lets the work be calm. The boot runs once per session and any key, scroll, tap or the Skip button ends it. Returning visitors and anyone with reduced motion get the painting and the type straight away.

Scrolling moves the hour. The hero crossfades from *First light* to *Blue hour* and the field re-tints with it. Then it hands over to bone paper, where the products are printed as plates.

## Products

- **Plates.** Each product is a sun at its own hour, and the hour is the status. MCP Emails is at sunrise and Fun Libs at noon, both live. Toolrails is cresting the ridge, being built. Harbor is at blue hour, paused. The real logo sits inside the sun, unchanged.
- **Captions.** Captions are set like plate captions: *Pl. I*, status and year, name, one line, the figure in large Newsreader numerals, then the facts in small mono.
- **Hover.** The frame hairlines sharpen, the painting lifts 3.5%, a faint raster appears and the name underlines.
- **On entry.** Each plate gets a single phosphor scanline sweep, staggered on the beat.
- **Archive.** Retired products sit on night as specimens cut from Haeckel's 1904 radiolarian plate. Luma keeps its real logo on a set sun.

## Voice

Editorial and plain, like a museum caption that knows the numbers. Facts first, no adjectives that need believing. Each heading carries one italic phrase in ochre, and that phrase carries the warmth.

- "Builds quiet software that *pays for itself*: apps, SaaS and the infrastructure AI agents run on."
- "Each product is a sun, *at its own hour.*"
- "Retired, *and kept on file.*"
- The site never asks for anything. The footer says "Takes one outside engagement at a time." and gives the email.

## Colour

| Token | Hex | Use |
|---|---|---|
| night | `#041419` | ground, hero, archive, footer |
| dusk-teal | `#063645` | deep panels |
| terracotta | `#bc6449` (ink variant `#9a4a33` on bone) | italic emphasis on bone |
| ochre | `#e8a95c` | italic emphasis on night, sun |
| sand | `#eedbbd` | text on night |
| bone | `#f8f3e8` + ambientCG Paper003 texture | product plates |
| ink | `#221812` | text on bone |
| verdigris | `#499d8e` (ink variant `#2f6f64`) | live status, labels on bone |
| phosphor | `#7defda` | **only for things that are on**: boot log, decode frontier, cursor, lens ring, live dot |

All gradients follow the dawn ramp in OKLCH: dusk-teal, mauve, terracotta, ochre, sand.

## Type

- **Newsreader** (variable, self-hosted). Display uses opsz 72 at weight 330 with -0.025em tracking. Body uses opsz 16 at weight 400. Emphasis is italic.
- **Martian Mono** (variable, self-hosted). Labels, the boot log, the MCP command and the feed use wdth 112.5, uppercase, with +0.1em tracking.
- Only the two Newsreader roman and Martian Mono files are preloaded. Italic loads when used.

## Motion

Everything lands on a **120 ms beat**.

- **Decode** (`js/decode.js`) is the signature delight. A short frontier of scrambled glyphs travels left to right on a third of a beat and lights in phosphor as it passes. Unreached characters are already laid out but invisible, so even the 168 px headline never reflows while it decodes. The headline scrambles through lowercase serif letters; labels and the feed use terminal blocks.
- **Warm boot:** the log decodes, then collapses at `power3.in`. The raster rises over 2.3 s, then develops over 1.4 s. GSAP drives every frame of the field during the boot, so skipping or seeking is exact.
- **Lens:** the radius eases in over 4 beats, follows the pointer with lerp 0.18, and yields over buttons and the command.
- **Horizon drift:** a GSAP ScrollTrigger scrub (0.8) crossfades the hour, re-tints the field and parallaxes the painting by 12%.
- **Micro-interactions:** nav underlines draw from the left in 2 beats. The copy button decodes to "Copied" and inverts to phosphor. The live dot pulses once per event.
- With `prefers-reduced-motion`, there is no boot, decode or scrub. Every state is the end state.

## Sound

Sound is off until the visitor presses "Sound off" in the header. It is synthesised in WebAudio, with no files:

- a low hum gliding from 55 to 110 Hz on power-on;
- a soft triangle tick per POST check, on an A pentatonic;
- a barely audible blip per live event;
- a tick on copy.

## Mark

A banded sun over a terminal-cursor bar ("sun_"). The bar blinks with hard steps at 1.06 s, like a prompt waiting. It sits beside "ALBRETSEN AS" in wide Martian Mono. The wordmark and lockup in `assets/brand/` are outlines for print and OG use.

## How it extends

- **Blog.** An article page is bone paper with one column of Newsreader at 20 px, max 68ch. Its header is a horizon strip (`assets/extras/horizon-*.webp`) whose hour encodes the topic:
  - dawn for launches and products;
  - noon for engineering notes;
  - dusk for retrospectives;
  - night for opinion.

  The title decodes in on load, and the date and reading time sit in a mono label. Cover images are plates in the hairline frame. For posts without art, a radiolarian specimen in sand or phosphor is the house fallback. Code blocks are set on night with phosphor line numbers. Pull quotes are set in ochre italic.
- **Product pages.**
  - **Hero.** The product's own painting (its sun at its hour) is the hero, with the real logo in the sun. "View signal" reveals the field re-tinted to that hour: `setHour(0)` for live products, 0.25 while cresting, 1 when paused.
  - **Product boot log.** Each page opens with a short POST of the product's own facts: for MCP Emails "17 TOOLS OK, ~100 PROVIDERS OK, AGPL OK". It plays once per session, like the homepage boot.
  - **Body.** Captions, figures and changelog entries follow the plate system on bone.
- **Retired products.** A product that is retired keeps its URL as an archive card: the specimen, the dates and one line in Asgeir's own words.
- **Rules that do not bend.** Phosphor only for things that are on. One italic phrase per heading. One idea per screen. Every image carries width and height.

## Performance

- **LCP.** The hero is `<picture>` AVIF/WebP/JPEG at 828 to 2560 wide, with portrait 9:14 crops under 700 px and an inline LQIP. The 1920 AVIF is 29 KB.
- **First load.** Initial weight is about 600 KB:
  - two preloaded fonts, 170 KB;
  - GSAP and ScrollTrigger from jsdelivr, pinned at 3.13.0, about 115 KB;
  - the Drift Field, 15 KB.

  Product paintings and specimens load lazily, and the blue-hour painting is requested at low priority.
- **Layout shift is 0.** Every image has dimensions or an aspect-ratio, and the boot overlay is fixed. Decode reserves the final layout from the first frame.
- **The field only runs when seen.** It runs while the boot, the lens or the signal toggle needs it, and pauses when the hero is off screen.

## Files

- `index.html` is generated by `tools/build-index.mjs` from `../_shared/content.js`, so every fact is the canonical one. Run `node designs/83/tools/build-index.mjs` after content changes.
- `css/site.css`, `js/main.js` (boot, lens, signal, scroll, feed, copy), `js/decode.js`, `js/sound.js`.
- `assets/` is kit 83. Sources and licences are listed in `assets/ASSETS.md`: Poly Haven Rock 09 (CC0), ambientCG Paper003 (CC0), Haeckel *Kunstformen der Natur* Tafel 31 via BHL/Wikimedia (public domain), Newsreader and Martian Mono (SIL OFL 1.1).
- Review aids: `?noboot` skips the boot, `?still` renders the end state, and `?seek=<s>` freezes the boot timeline at a time.
