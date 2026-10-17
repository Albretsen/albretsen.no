# Design 54: The Vivarium

Open `preview.html` first. It plays the loader, shows every asset, and runs both live terrariums. (`?noloader` skips the loader. `?focus=<section id>` shows a single section.)

## Vision

Albretsen AS presented as a terrarium that someone tends. Each product is a small creature living under glass. The site catalogues them the way a naturalist would: pinned, numbered, given a Latin name, labelled in mono. Retired products are not hidden. They become pressed leaves on herbarium sheets.

The goal is awe at the craft. That comes from the tension between two worlds that sit side by side:

- **The living jar.** A storybook world built only from three.js primitives: toon-shaded, inked and slightly hand-wobbled. It moves.
- **The archive.** Real 17th- and 18th-century specimen drawings from The Met's open-access collection, lifted off their paper and pinned to ours. They stay still.

The personality is **luxury restraint**. There is one spot colour (moss). Amber appears only as tiny spores, and there is a lot of paper. The work should feel like a small, very good natural-history publisher that happens to ship software. It is a technology brand with a quiet sense of humour (*Noctua epistolaris*, the letter moth). It must not read as a finance firm, a consultancy or a nautical brand.

**Spark words, as used**
- *Scale*: tiny creatures beside huge type, and a museum plate beside a toy jar.
- *Spark*: amber spores rising from the sprout.
- *Tension*: archive against alive, still against moving.

## Mood references

| Reference | What we took |
|---|---|
| https://bruno-simon.com | Toy-like, physical 3D that rewards the pointer, plus a world you can poke at |
| https://motion.dev/examples ("Physical stagger", "Path drawing") | Stagger rhythm and stroke-drawn reveals, re-timed to plant tempo for *Germinate* and the Lottie loader |
| https://www.struck.com/news/how-rive-helped-us-bring-ambitious-ideas-to-life-for-chia-com/ | Plants that grow as the page waits, which became the germination loader |
| https://rive.app/community/files/21035-39547-interactive-plant-with-wind-effects-bones-and-state-machine | Plant sway as idle life (leaf sway in the Lottie idle loop) |
| https://codyhouse.co/gem/parallax-hero-image | Layered `translateZ` depth driven by the pointer, used for *Bell jar* and the CSS Wardian case |
| https://developer.mozilla.org/docs/Web/CSS/transform-style | Pitfalls of a `preserve-3d` chain, such as overflow flattening (the diorama avoids it) |
| https://www.metmuseum.org/about-the-met/policies-and-documents/open-access | The source of every specimen image (CC0) |
| https://www.are.na/explore | Starting point. The are.na search pages did not render for us, so its role was mood only |

## Palette (seed hue 144° in OKLCH)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| `--paper` | oklch(0.968 0.014 88) | #f8f4ea | Page |
| `--paper-deep` | oklch(0.925 0.022 85) | #ede5d6 | Vignette, herbarium mount |
| `--vellum` | oklch(0.985 0.008 95) | #fcfaf4 | Cards, tags |
| `--ink` | oklch(0.235 0.025 150) | #162118 | Text, outlines (a green-black, never #000) |
| `--ink-soft` | oklch(0.47 0.022 150) | #525e54 | Secondary text, mono labels |
| `--rule` | oklch(0.82 0.02 110) | #c4c5b7 | Hairlines |
| `--moss` | oklch(0.56 0.125 144) | #408742 | **The single spot colour**: one word per headline, the leaf in the mark, status dots |
| `--moss-deep` | oklch(0.40 0.095 144) | #225424 | Links, pressed states |
| `--moss-pale` | oklch(0.92 0.045 144) | #d3edd2 | Rare tint panels |
| `--amber` | oklch(0.76 0.12 70) | #e2a355 | Spores only, a few pixels at a time |
| `--night` | oklch(0.19 0.02 150) | #0d160f | The one dark band (fern photogram) |

Tokens are defined in `motion.css`, at `:root`.

## Typefaces

- **Fraunces** (variable; axes `opsz`, `wght`, `SOFT`, `WONK`; SIL OFL; Google Fonts). Display uses 320 to 340 at opsz 144 and SOFT 50. Latin names use italic with SOFT 100. Text uses 360 at opsz 18.
- **Spline Sans Mono** (SIL OFL; Google Fonts). Use 400/500, uppercase with +0.16 to 0.2em tracking, for specimen numbers, labels and figures.
- Load: `https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..600,50;1,9..144,300..500,100&family=Spline+Sans+Mono:wght@400;500&display=swap`
- The wordmark and stamp are outlined paths, so they need no fonts.

## How the builder should use it

- **Loading moment.** Use `germinate()` from `motion.js` with `motion/sprout-loader.json` (lottie-web 5.12.2 `lottie_light`). Pass the page's real readiness as `ready`, for example `document.fonts.ready` plus the hero image decode. The sheet lifts away like a cloche. `motion/loader.html` is a standalone demo.
- **Hero.** Pick either option:
  - Option A, the centrepiece: the CSS-only Wardian case (`live/diorama.js` and `diorama.css`) beside the headline.
  - Option B: the baked jar still `hero/terrarium-hero` (the composition leaves the left 45% empty for type). Upgrade it to `live/terrarium.js` on hover or after idle.
  - On phones, use `terrarium-portrait`.
- **Products.** Use the four specimen plates in a row or a scroll-snap strip, with `.belljar` hover. The creature cut-outs (`hero/creatures/*`) can wander in the margins with `.flutter`, `.doze` and `.trundle`.
- **Retired.** Show the herbarium sheets as a small grid or a horizontal drawer.
- **Texture.** Lay `paper-grain.webp` over the whole page with `mix-blend-mode: multiply`. Use `divider-frond.svg` between sections. Use `stamp-vivarium.svg` once, near the footer. Put `fern-photogram-night.webp` behind the one dark band.
- **Never** recolour the product logos in `products/real/`.

## Motion study (`motion.css`, `motion.js`)

| # | Name | Kind | Description |
|---|---|---|---|
| 1 | **Germinate** | Entrance | A bottom-anchored `clip-path` reveal with an 18px rise and a 1.5° settle on an overshoot ease, staggered 90ms by `--i`. `growOnView()` adds `.is-grown`. A `.germinate-line` variant handles headline lines. |
| 2 | **Bell jar** | Hover | The card lifts on Z (CSS 3D), tilts toward the pointer (`--rx`/`--ry`), and its shadow detaches, shrinks and blurs. A soft-light glint follows the cursor. `bellJar()` wires it up. |
| 3 | **Leaf turn** | Transition | A herbarium sheet turns on its left hinge (`rotateY` -96°, then in from 32°). It is wired to `::view-transition-old/new(root)` and has a class fallback. Use `leafTurn(update, el)`. |
| 4 | **Flutter / Doze / Trundle** | Idle | The moth flies in wingbeat bursts with rests. The snail (Harbor is paused) takes a slow 4.8s breath. The beetle and ant waddle. |
| 5 | **Germination loader** | Loading | A Lottie plays: the glass and base draw themselves, the knob pops, the stem grows, the leaves unfurl with overshoot, and an idle loop of leaf sway and rising amber spores follows. A mono 000 to 100 counter ticks, then the paper sheet lifts away. |

Everything respects `prefers-reduced-motion`.

## Inventory

Licence key: **Own** means made for this kit, and the client owns it outright. **CC0** means The Met Open Access, public domain. **Product** means the product's own logo, used unaltered.

| File | What it is | Intended use | Source | Licence |
|---|---|---|---|---|
| `identity/mark.svg` | Bell jar over a two-leaf sprout. The right leaf is moss | Logo mark, nav | Hand-drawn SVG on a 64 grid | Own |
| `identity/mark-reversed.svg` / `mark-currentcolor.svg` | Paper-on-night version / ink in `currentColor` with the leaf kept moss | Dark band, inline | Same | Own |
| `identity/wordmark.svg` (+ `-reversed`) | "Albretsen", then a moss full stop, then mono "AS" | Header, footer | Fraunces and Spline Sans Mono glyphs outlined with opentype.js 1.3.4 | Own (fonts OFL) |
| `identity/lockup.svg` (+ `-reversed`) | Mark and wordmark | Header, OG | Same | Own |
| `identity/favicon.svg` | Simplified heavy mark on a paper tile | `<link rel=icon>` | SVG | Own |
| `identity/apple-touch-icon.png` | 180×180 | `apple-touch-icon` | rsvg-convert from the SVG | Own |
| `identity/og-image.jpg` | 1200×630 with lockup, line and the jar | Open Graph / Twitter | Composed in `src/og.html`, screenshotted | Own |
| `hero/terrarium-hero@1x/@2x.webp/.avif` | 2880×1800. The bell jar, offset right | Desktop hero | `live/terrarium.js` baked via `live/render.html?view=hero&still=1&t=0.6` (headless Chrome) | Own |
| `hero/terrarium-portrait@1x/@2x.webp/.avif` | 1600×2000. The jar, centred | Phone hero | Same, `view=portrait` | Own |
| `hero/plate-i@1x/@2x.webp/.avif` | 2880×1800. "Plate I": four specimens around Merian's plant study, numbered, with legend and stamp | Second hero, products intro, about | Composed in `src/hero-plate.html` from CC0 specimens | Own composition of CC0 images |
| `hero/creatures/moth.webp` | Letter moth carrying an envelope, with MCP blue and green eye-spots | MCP Emails creature, margins, diorama | three.js primitives, matted from black and white renders | Own |
| `hero/creatures/beetle.webp` | Fun Libs yellow beetle with two navy bars (a nod to the icon) | Fun Libs creature | Same | Own |
| `hero/creatures/ant.webp` | Black ant carrying a yellow rail | Toolrails creature | Same | Own |
| `hero/creatures/snail.webp` | Sleeping snail with a log-spiral shell | Harbor creature (paused) | Same | Own |
| `products/mcp-emails@1x/@2x.webp` | Specimen No. 001, *Noctua epistolaris*, with the real MCP Emails icon on the tag and $782 MRR | Product card | `src/plate.html?p=mcp-emails&z=2`, using the Struyk moth | Own composition, with CC0 and Product elements |
| `products/fun-libs@1x/@2x.webp` | No. 002, *Cerambyx lusor*, with the real Fun Libs icon and 113,000+ installs | Product card | `src/plate.html`, using the van der Vinne beetle | Same |
| `products/toolrails@1x/@2x.webp` | No. 003, *Lucanus instrumentarius*, with the real Toolrails icon and 4 connectors | Product card | `src/plate.html`, using the Redouté stag beetle | Same |
| `products/harbor@1x/@2x.webp` | No. 004, *Scarabaeus custos*, with the real Harbor mark, 549 commits and "paused" | Product card | `src/plate.html`, using the Holsteyn beetle | Same |
| `products/herbarium/*.svg` (7) | Pressed-leaf herbarium sheets, one leaf shape per retired product. Luma's label uses its real logo | Retired list | Procedural SVG (`feTurbulence` patina), outlined type | Own (Luma logo: Product) |
| `products/real/*` | Unaltered copies of `_shared/products` logos | Referenced by plates and herbarium | `designs/_shared/products` | Product |
| `extras/specimens/moth-struyk.webp` | Moth, lifted off its paper (transparent) | Margins, plates | Nicolaas Struyk, *A Moth*, 18th c., The Met 400112, https://www.metmuseum.org/art/collection/search/400112 (image: https://images.metmuseum.org/CRDImages/dp/original/DP820071.jpg) | CC0 |
| `extras/specimens/longhorn-vandervinne.webp` | Green longhorn beetle | Margins, plates | Vincent Laurensz van der Vinne, *Green Beetle with Brown Legs*, late 17th c., The Met 385466, https://www.metmuseum.org/art/collection/search/385466 (DP820076.jpg) | CC0 |
| `extras/specimens/stag-beetle-redoute.webp` | Stag beetle | Margins, plates | Pierre-Joseph Redouté, *A Stag Beetle*, The Met 385472, https://www.metmuseum.org/art/collection/search/385472 (DP808073.jpg) | CC0 |
| `extras/specimens/dung-beetle-holsteyn.webp` | Blue dung beetle and two small insects | Margins, plates | Pieter Holsteyn II, *Studies of a Blue Beetle and Insects*, c. 1650–60, The Met 385463, https://www.metmuseum.org/art/collection/search/385463 (DP800002.jpg) | CC0 |
| `extras/specimens/capers-merian.webp` | Capers, gorse and a red beetle | Plate I, diorama back layer, about | Maria Sibylla Merian, *Study of Capers, Gorse, and a Beetle*, 1693, The Met 399922, https://www.metmuseum.org/art/collection/search/399922 (DP822404.jpg) | CC0 |
| `extras/fern-photogram-night.webp` | Cameraless fern print re-toned to night and paper (986×1400) | The one dark band | Unknown maker, *[Botanical Specimen: Fern]*, 1855–60, The Met 285149, https://www.metmuseum.org/art/collection/search/285149 (DP147833.jpg) | CC0 |
| `extras/fern-mask.webp` | The same fern as a white alpha mask | CSS `mask-image` in any colour (diorama ferns, watermarks) | Derived from 285149 | CC0 |
| `extras/paper-grain.webp` | 512px seamless paper with fibres | Whole-page overlay, multiply | Generated (numpy FFT noise and drawn fibres) | Own |
| `extras/pattern-moss-stipple.svg` | 160px seamless stipple | Moss surfaces, empty states | Generated SVG | Own |
| `extras/divider-frond.svg` | Horizontal frond with one moss leaflet | Section divider | Generated SVG | Own |
| `extras/stamp-vivarium.svg` | Circular stamp reading "Albretsen AS · Vivarium · Norway" | Footer, Plate I | Outlined mono glyphs on a ring | Own |
| `extras/pin.svg` | Entomology pin with a moss head | Plates, hover ornament | SVG | Own |
| `extras/label-tag.svg` | Empty specimen tag with thread | Labels, tooltips | SVG | Own |
| `live/terrarium.js` | Self-contained three.js scene (three@0.170.0 via import map): bell jar, moss, ferns, sprout, mushrooms, clover, spores and four creatures. Options: `view: hero / portrait / macro / solo / top`, `only`, `still` | Live hero, "kept alive" section | Built from primitives | Own |
| `live/render.html` | Bake page for the stills: `?view=&only=&bg=paper\|none\|<hex>&still=1&t=` | Re-rendering stills | Own | Own |
| `live/diorama.js` + `diorama.css` | **Centrepiece**: a gabled Wardian case in pure CSS 3D (panes, roof, gables, plinth, layered ferns, moss and creatures), tilted by the pointer | Hero centrepiece | Own | Own |
| `live/index.html` | Small demo of both live assets | Demo | Own | Own |
| `motion/sprout-loader.json` | Hand-authored Lottie, 400×400 at 60fps. Intro is frames 0–120, idle loop is frames 120–180 | Loader | Generated JSON (Lottie 5.12 schema) | Own |
| `motion/loader.html` | Standalone loader demo (`?frame=N` freezes a frame) | Demo | Own | Own |
| `motion.css` / `motion.js` | Tokens and five named animations | Site-wide | Own | Own |
| `src/plate.html`, `src/hero-plate.html`, `src/og.html` | Composition sources for the baked plates and OG image | Re-baking | Own | Own |

**Libraries (CDN, pinned):** three@0.170.0 (MIT), lottie-web@5.12.2 (MIT). The museum images were fetched through the Met Collection API (`collectionapi.metmuseum.org/public/collection/v1.1/search`), keeping only objects with `isPublicDomain: true`.

**Weight:** about 3.6 MB in total. The largest single file is `fern-mask.webp` at 372 KB. Hero images are 100–125 KB at @2x.
