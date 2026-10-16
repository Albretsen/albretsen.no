# Kit 59: Cover Story

Start with `preview.html`; it is the contact sheet for everything below. Add `?only=<section>` to show one sheet, e.g. `preview.html?only=motion`.

## Vision

The site is the current issue of a magazine about one company. The type and photography carry the editorial weight: a high-contrast serif nameplate, scientific photographs from NASA, generous margins. Neo-brutalist stickers carry the facts. Hard outlines, offset ink shadows and one loud colour per sticker turn the numbers from `content.js` into physical objects slapped onto the page.

The hero is the cover itself. It tilts with the pointer and the stickers parallax off its surface. When you open it, the stickers scatter, the cover curls back on its spine, and a dispersive glass crystal rises out of the inside spread. A real magnifying glass (a CC0 3D model) follows the pointer and magnifies the cover print. The brand mark is the same gesture as a logo: a violet sticker with its corner peeling back.

**Spark words.**
- *Crystal*: protein crystals grown in orbit on the cover, a crystal-growth spiral as texture, a glass crystal in 3D.
- *Glow*: the aurora on the inside spread, the crystal halo, the Glint motion.
- *Rhythm*: the sticker belt, staggered slaps, Lottie glints on a beat.

**Mood.** Confident and amused. A serious magazine that lets someone put stickers on its cover. It is technical without looking like a circuit board and editorial without looking like a bank. There are no industrial, nautical or finance metaphors anywhere.

### References
- https://magicui.design: marquee, shine-border and magic-card spotlight. These became Rhythm and Glint, but as one-off passes with discipline rather than loops.
- https://www.neobrutalism.dev: the neo-brutalist component vocabulary (outlined boxes, hard offset shadows, press-to-flatten buttons). This became Lift.
- https://gumroad.com: the 2021 redesign that made the hard-shadow hover mainstream.
- https://www.lapa.ninja: the magazine and brutalism categories. The returned 403 during research; I used it from memory.
- https://paco.me: restraint, and attention to small details.
- https://images.nasa.gov: the source for every photograph.
- https://polyhaven.com/a/magnifying_glass_01: the 3D prop.

Research note: my web-search budget ran out after the first fetches, so research leaned on direct fetches of the sites above and the NASA and Poly Haven APIs.

## Palette (seed hue 288°, OKLCH is the source of truth)

| Token | OKLCH | Hex | Role |
|---|---|---|---|
| ink | oklch(0.17 0.045 288) | #0f0b22 | Text, outlines, hard shadows, rails |
| paper | oklch(0.965 0.012 288) | #f3f2fb | Page |
| pulp | oklch(0.91 0.022 288) | #e0dff0 | Second paper, retired states |
| violet | oklch(0.52 0.25 288) | #6c35ec | Brand: mark, italic emphasis, kickers |
| glow | oklch(0.80 0.13 288) | #bab0ff | Violet light on ink, crystal halo |
| lime | oklch(0.93 0.21 123) | #cefd3e | Sticker hue; primary buttons; the peel underside |
| tangerine | oklch(0.72 0.20 42) | #ff6f27 | Sticker hue |
| cyan | oklch(0.86 0.14 203) | #2debf9 | Sticker hue |
| rose | oklch(0.70 0.22 352) | #fd54ad | Sticker hue |
| citrine | oklch(0.90 0.17 95) | #ffdc3a | Sticker hue |

The palette covers the full spectrum, but it is used with discipline. Ink, paper and violet carry the page; a rough share of any screen is paper 52, ink 26, violet 12, glow 3, and all sticker hues together 7. Each sticker gets exactly one hue. The spectrum appears all at once in only one place: light passing through a crystal (the photographs, the 3D dispersion, the Glint motion). `src/palette.mjs` computes the hex values.

## Type

| Face | Use | Source |
|---|---|---|
| Instrument Serif 400 + Italic | Masthead, headlines, decks, card titles. Set tight (-0.025em), line-height 0.86. | Google Fonts, OFL |
| Archivo 900 / 700, width 125 (expanded) | Sticker type only, uppercase | Google Fonts, OFL |
| JetBrains Mono 500 / 700 | Rails, kickers (0.22em tracking, uppercase), captions, body | Google Fonts, OFL |

Load these weights: `https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Archivo:wdth,wght@125,700;125,900&family=JetBrains+Mono:wght@500;700&display=swap`. Every SVG in `identity/` and `stickers/` has its text converted to outlines, so those files need no fonts.

## How to use it on the site (for the builder)

- **Hero:**
  1. Mount `three/cover-scene.js` (see `three/demo.html` for the import map) in a tall section.
  2. Show `hero/render-cover-closed-*.webp` as the poster until WebGL is ready, and as the fallback when it is not available.
  3. Without JS, `hero/cover-*.webp` alone is a complete hero.
  4. The scene API is `setOpen(0..1)`, `toggle()`, `enableGyro()` (call it from a tap on iOS), `setPointer(x, y)` and `destroy()`. You can tie `setOpen` to scroll progress so scrolling opens the cover.
- **Hero, CSS-only alternative:** use `cover-bare-1600.webp` with live stickers absolutely positioned on top, `data-tilt` / `data-depth` parallax and the Slap entrance. The intro of `preview.html` does exactly this, and the sticker positions are given there in percentages.
- **Second state:** `inside-spread-*.webp`, or the photo itself, is "what is under the cover". Use it for the products or contents section.
- **Products:** use one `products/plate-*.webp` per feature section, plus the status stickers. Retired products get `stickers/retired-*.svg` tokens, and Luma gets its own plate.
- **Texture:**
  - Use `textures/paper-grain.webp` as the body background tile.
  - Use `grain-overlay.png` over flat colour at 15–25% with multiply.
  - The spiral textures are for one or two full-bleed sections.
- **Motion:** link `motion.css` and call `initMotion()` from `motion.js`. Apply the classes `m-slap`, `m-lift`, `m-peel`, `m-glint`, `m-rhythm`, and the `data-tilt` attribute. For page or section transitions, use `pageTurn(update)`. For the Lottie files, use `mountLottie(el, url)`.

## Motion study

| Name | Kind | What it does | Researched from |
|---|---|---|---|
| Slap | Entrance | The sticker arrives at 170% and rotated -22°, overshoots to 94%, then settles. Its hard shadow lands 300 ms later. Staggers 90 ms per sibling. | Stamp/sticker entrances on brutalist pages (lapa.ninja); spring settle from magicui blur-fade |
| Lift | Hover / press | Moves 3 px toward the pointer and grows the offset shadow from 4 to 9 px. Pressing flattens it into the page in 60 ms. | Gumroad 2021, neobrutalism.dev |
| Peel | Hover | A card's top-right corner peels back to show the lime underside (the logo's gesture). Pure CSS. | Own: derived from the mark |
| Turn | Transition | The old page rotates -100° on its left edge under perspective 1800 px, while the new one scales up from 97%. Uses View Transitions, with a class fallback. | The hero's three.js page curl; page-flip book sites |
| Glint | Hover | A single pass of a full-spectrum band (oklch stops 25° to 352°) across an image, blended with screen. | magicui shine-border / magic-card |
| Rhythm | Ambient | A sticker belt at a fixed tempo with alternating tilt. It pauses on hover. | magicui Marquee |
| Tilt | Signature delight | Pointer or device-orientation tilt with a critically damped spring (k = 120). `[data-depth]` layers parallax. | Classic parallax-tilt cards, re-done with a spring |

Easing tokens: `--ease-slap: cubic-bezier(.2,1.6,.35,1)`, `--ease-lift: cubic-bezier(.3,.7,.2,1)`, `--ease-page: cubic-bezier(.65,0,.25,1)`. Under `prefers-reduced-motion`, every motion becomes a 200 ms fade or nothing. The 3D scene also stops idling and jumps straight between states.

## Inventory

| File | What it is | Intended use | Source / how made | Licence |
|---|---|---|---|---|
| identity/logo-mark.svg | Violet sticker with a peeling lime corner, an "A" in Archivo Expanded Black, hard shadow | Primary mark, nav | Generated: `src/logos.cjs` (opentype.js outlines) | Owned |
| identity/logo-wordmark.svg | Mark + "Albretsen" in Instrument Serif (outlined) + tilted "AS" label sticker | Header, footer, documents | Generated: `src/logos.cjs` | Owned (font OFL) |
| identity/logo-wordmark-on-dark.svg | Same, paper-coloured nameplate | Ink backgrounds | Generated | Owned |
| identity/masthead.svg | The cover nameplate "Albretsen", outlined, `currentColor` | Huge display uses, hero, 404 | Generated | Owned |
| identity/favicon.svg | Shadowless mark with heavier outline | Favicon | Generated | Owned |
| identity/favicon-180.png, apple-touch.svg | 180 px touch icon on paper | apple-touch-icon | rsvg-convert from apple-touch.svg | Owned |
| identity/og.jpg | 1200×630 social card: wordmark, line, tilted cover, stickers | og:image / twitter:image | `src/og.html` rendered in headless Chrome | Owned + NASA PD |
| hero/cover-1000.webp, cover-2000.webp | Composed magazine cover with stickers (3:4) | Static hero, social, print | `src/cover.html` at DPR 2 | Owned + NASA PD |
| hero/cover-bare-1600.webp | Cover without stickers | Base for live sticker layers; 3D texture | `src/cover.html?bare` | Owned + NASA PD |
| hero/inside-spread-1200.webp, -2400.webp | Contents page over the aurora (two pages, 3:2) | Second hero state, products intro, 3D inside | `src/inside.html` | Owned + NASA PD |
| hero/render-cover-closed-1200/2400.webp | 3D render, cover closed with magnifier over "pays for itself", transparent | WebGL poster / fallback | Baked from `three/demo.html` in headless Chrome (SwiftShader) | Owned |
| hero/render-cover-open-1200/2400.webp | 3D render, magazine open with the crystal, transparent | Second-state still, section art | Baked from the 3D scene | Owned |
| hero/photo-crystal-1000/2000.webp | Horse serum albumin crystals grown on STS-50, white-balanced to paper, violet-toned shadows (3:4) | Cover photo, editorial image | https://images.nasa.gov/details/9262354, graded by `src/grade.py` | NASA, public domain |
| hero/photo-aurora-1200/2400.webp | Aurora over the Earth's limb from the ISS, 19 Jan 2019; night graded violet, aurora kept lime (2:1) | Inside spread, full-bleed band | https://images.nasa.gov/details/iss058e005282, graded | NASA, public domain |
| products/plate-mcp-emails-1200/2400.webp | Feature plate: real MCP Emails logo-mark on a white die-cut sticker, with $782 MRR, 17 tools and AGPL stickers, on the violet spiral | MCP Emails section | `src/product.html?p=mcp-emails`; logo from designs/_shared/products, unaltered | Owned |
| products/plate-fun-libs-1200/2400.webp | Real Fun Libs v5 icon as a vinyl sticker with 113,000+ installs and "built at seventeen." | Fun Libs section | `src/product.html?p=fun-libs` | Owned |
| products/plate-toolrails-1200/2400.webp | Real Toolrails icon over the aurora, with the "building" status | Toolrails section | `src/product.html?p=toolrails` | Owned + NASA PD |
| products/plate-harbor-1200/2400.webp | Real Harbor banner as a vinyl card on a darkened spiral, with the "paused" status | Harbor section | `src/product.html?p=harbor` | Owned + NASA PD |
| products/plate-luma-1200.webp | Real Luma logo, retired back-issue plate | Retired list | `src/product.html?p=luma` | Owned |
| stickers/retired-*.svg (6) | Round tokens with monogram, name and year for Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring and the early apps | Stand-ins for products with no surviving brand | Generated: `src/stickers.cjs` | Owned |
| stickers/burst-installs.svg | Lime 18-point starburst: "113,000+ installs · Fun Libs" | Fun Libs fact, hero | Generated | Owned |
| stickers/seal-mrr.svg | Violet seal: "$782 MRR" with circular "MCP Emails · Email for AI agents" | MCP Emails fact, hero | Generated | Owned |
| stickers/label-tools.svg | Tangerine ticket: "17 tools" | MCP Emails fact | Generated | Owned |
| stickers/pill-agpl.svg | Cyan pill: "Open source · AGPL" | MCP Emails fact | Generated | Owned |
| stickers/tape-built-at-17.svg | Rose torn tape: "built at seventeen." | Fun Libs, about | Generated | Owned |
| stickers/stamp-since-2016.svg | Ink stamp: "On Google Play · since 2016" | About, footer | Generated | Owned |
| stickers/label-norway.svg | Citrine label: "Made in Norway" | Footer, about | Generated | Owned |
| stickers/status-{live,building,paused,retired}.svg | Status pills | Product cards, contents | Generated | Owned |
| stickers/sticker-open.svg | "Open the cover" peel sticker | Hero call to interact | Generated | Owned |
| stickers/barcode.svg | Decorative cover barcode, "albretsen.no 2016–2026" (encodes nothing) | Cover detail, footer | Generated | Owned |
| stickers/word-{glow,crystal,rhythm}.svg | Spark-word labels in italic serif | Section markers, playful accents | Generated | Owned |
| textures/spiral-violet-900/1800.webp | AFM scan of a growing canavalin crystal's screw dislocation, gradient-mapped ink to violet to glow | Full-bleed section backgrounds | https://images.nasa.gov/details/0101744, `src/grade.py` | NASA, public domain |
| textures/spiral-lime-900.webp | Same scan mapped from ink to lime | One loud section, 404, footer | Same | NASA, public domain |
| textures/paper-grain.webp | Seamless 512 px paper-fibre tile | Body background | Generated: pink noise, `src/grade.py` | Owned |
| textures/grain-overlay.png | Transparent 512 px ink speckle | Over flat colour, multiply 15–25% | Generated | Owned |
| textures/led-counter.webp | The red frame counter burned into the 1992 crystal photo | Colophon / footer detail | Crop of NASA 9262354 | NASA, public domain |
| three/cover-scene.js | Self-contained three.js module: bending cover (CPU page curl), parallax stickers that scatter on open, dispersive glass crystal with halo, shader magnifier, pointer and gyro tilt, drag / click / keyboard open, pauses offscreen, honours reduced motion | Hero centrepiece | Written for this kit; three@0.170.0 from jsDelivr | Owned (three.js MIT) |
| three/magnifier.glb | Poly Haven "Magnifying Glass 01" by Nazar Borodavka, 1k glTF packed to a single GLB, textures downscaled to 512 px | Prop in the 3D scene | https://polyhaven.com/a/magnifying_glass_01, packed with `src/pack-glb.cjs` | CC0 |
| three/demo.html | Tiny demo for the scene. Params: `?open=1`, `?bare`, `?transparent`, `?nolens`, `?px=&py=` | Testing, baking stills | Written | Owned |
| lottie/sticker-slap.json | 400×400, 3 s at 60 fps: a lime starburst slaps in with overshoot, its shadow lands, then it idles in a slow turn | Empty states, success moments, loading | Hand-built JSON: `src/lottie.cjs` | Owned |
| lottie/glow-sparks.json | 400×400, 2 s seamless loop: five four-point crystal glints twinkling in rhythm | Next to the crystal, hover accents | `src/lottie.cjs` | Owned |
| motion.css, motion.js | Motion study: Slap, Lift, Peel, Turn, Glint, Rhythm, Tilt + helpers (`initMotion`, `pageTurn`, `mountLottie`, `requestGyro`) | Site-wide motion | Written | Owned |
| src/* | Generators and HTML masters for every baked asset | Re-render if copy or palette changes | Written | Owned |

Total size of the folder is about 4.5 MB. Photographs from NASA are not copyrighted, and NASA asks that it is credited. Credit lines are in the `#credits` sheet of `preview.html`.

## Rebuilding

The masters need the static server from the repo root (`python3 -m http.server 6059`). Render the HTML masters in `src/` with headless Chrome at the sizes noted in each file's header comment. `src/grade.py` needs Pillow and numpy, plus the NASA originals (URLs above). `src/logos.cjs` and `src/stickers.cjs` need opentype.js and the TTFs from Google Fonts.
