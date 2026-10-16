# Habit: asset kit for design 49

Open `preview.html` first, served over http from the repo root. It shows every asset, the palette and the type, and it plays all the motion and the live 3D. Append `?still` to see everything in its finished state (useful for screenshots), `#dark` to start in dark, and `&from=<section-id>` to show only the sections from that one onward.

## Vision

**The site talks to you, quietly, from a pen-drawn desk.**

"Habit" is the mineralogist's word for the shape a crystal keeps growing into. Asgeir's habit is shipping things that pay for themselves. The brand borrows the visual grammar of James Sowerby's *British Mineralogy* (1802–1817). Those plates set a hand-coloured specimen beside a line drawing of its crystal habit, with front edges in ink and hidden edges dashed. We keep the line drawing and make it technical: real 3D (CC0 Kenney models and generated crystal habits) rendered by three.js *as ink*. That means overshooting draftsman strokes, screen-space hatching and dashed hidden edges. The interface itself is greyscale paper and ink. **All colour arrives inside imagery**: the 200-year-old hand-coloured specimens, and the real product logos sitting on drawn screens.

- **Personality: the quiet operator.** No exclamation marks. Nothing bounces, and nothing moves more than about 18 px. The site speaks in short turns, with a typing beat before each one, the way a person who is busy but kind would text.
- **Hero concept: a conversation.** The hero is a chat log in Instrument Serif. The visitor replies by tapping dashed "pencil" chips set in Geist Mono. The desk drawing sits behind, and its monitor already shows a typing bubble.
- **Centrepiece: `three/crystal.js`.** It shows a crystal habit in ink that you can turn with inertia, and tapping it redraws the next habit stroke by stroke. It works as the "Why the crystal?" answer, a section break or a 404.
- **Signature delight: "Lights out".** The theme toggle is a drawn desk lamp. Pulling its cord starts a View Transition that reveals the other theme through a *hand-drawn, wobbly* circle growing out of the bulb. The drawings swap ink-on-paper for chalk-on-slate, and the specimens keep their colour.
- **Spark words used:** *silence* (the greys and the waiting dots), *orbit* (the orbit diagram, the body circling the crystal, the plate's ellipses) and *edge* (literally: crystal edges, both visible and hidden).

### References (researched)
- Radix Primitives, for origin-aware content animation via `--radix-*-transform-origin` and `data-state`: https://www.radix-ui.com/primitives
- Biodiversity Heritage Library, the source of the specimen plates (BHL-sponsored scan): https://www.biodiversitylibrary.org/item/128814 and https://archive.org/details/britishmineralog01sowe
- Framer gallery, a survey of current portfolio heroes. Almost none use real drawings, which is the gap this kit fills: https://www.framer.com/gallery
- FWA was unreachable during research (connection refused).
- Codrops, "SVG Drawing Animation", the line-drawing entrance: https://tympanus.net/codrops/2013/12/30/svg-drawing-animation/
- Codrops, "Sketchy Pencil Effect with Three.js Post-Processing", the inspiration for the ink renderer (ours uses geometry edges and a hatch shader instead): https://tympanus.net/codrops/?p=65958
- three.js forum, "LDraw-like edges", on EdgesGeometry, silhouettes and hidden lines: https://discourse.threejs.org/t/ldraw-like-edges/17100
- View Transitions circular theme reveal: https://rebeccamdeprey.com/blog/view-transition-api and https://dev.to/praveen-sripati/i-stole-this-awesome-ripple-effect-from-ant-design-and-you-can-too-2mkg
- Hand-drawn underline on links: https://codemyui.com/hand-drawn-underline-effect-for-links/
- Kenney Furniture Kit (CC0): https://kenney.nl/assets/furniture-kit

## Palette

The interface uses greys only, tinted to hue 216° in OKLCH (a cool, faintly blue-teal grey). Colour comes only from imagery.

| Token | Light role | OKLCH | Hex |
|---|---|---|---|
| paper | page background | oklch(0.968 0.003 216) | #f2f5f6 |
| sheet | cards, screens | oklch(0.992 0.0015 216) | #fbfdfd |
| rule | hairlines, borders | oklch(0.885 0.006 216) | #d5dadc |
| pencil | dashed chips, faint lines | oklch(0.70 0.010 216) | #98a0a2 |
| graphite | secondary text, italics | oklch(0.53 0.012 216) | #646e70 |
| ink | text, line art | oklch(0.255 0.012 216) | #1c2427 |
| ink-deep | pressed or emphasis | oklch(0.18 0.010 216) | #0d1314 |

| Token | Dark role | OKLCH | Hex |
|---|---|---|---|
| slate | page background | oklch(0.205 0.008 216) | #131819 |
| slate-raised | cards, screens | oklch(0.245 0.009 216) | #1c2223 |
| slate-rule | hairlines | oklch(0.34 0.010 216) | #32393b |
| chalk-dim | faint lines | oklch(0.56 0.010 216) | #6e7678 |
| chalk-muted | secondary text | oklch(0.72 0.009 216) | #9fa6a8 |
| chalk | text, line art | oklch(0.935 0.005 216) | #e6eaec |

Imagery colours, which come *only* from the images: amber (#d99a2b, calcite cube), verdigris (#2fa98a), garnet (#8b2e2e), MCP Emails blue (#2547E5) and Fun Libs yellow (#FFDE66). Never use these as UI colours.

## Typefaces (all OFL, via Google Fonts)

- **Instrument Serif** (400 and italic) is the site speaking: chat turns, headings and the wordmark (converted to outlines in `identity/wordmark.svg`). Set tight (-0.01em). Use italics in graphite for the second half of a thought.
- **Geist** (400/500/600) is used for interface and body copy.
- **Geist Mono** (400/500) is the visitor's voice (reply chips and sent bubbles), plus facts, labels, file names and the MCP command.

`<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">`

## Motion (`motion.css` + `motion.js`)

| Name | Kind | What it does | Source of the idea |
|---|---|---|---|
| **INK-IN** | entrance | `[data-ink]` SVGs draw stroke by stroke as they enter the viewport. It sets `pathLength=1` plus dashoffset, staggered with `--i`. `.ink-develop` images wipe in with a blur that settles. | Jake Archibald / Codrops SVG drawing |
| **TYPING TURN** | conversation entrance | `typeTurn(log, turns)` shows three pencil dots for a beat proportional to the length of the text, then the bubble unfolds from its tail (`transform-origin`), and the text de-blurs. The same keyframes are wired to Radix Popover, Tooltip, Dropdown and HoverCard through `--radix-*-transform-origin`, and Accordion uses `--radix-accordion-content-height`. | Radix data-state animation |
| **PENCIL UNDERLINE** | hover | `.pencil` links draw a hand-drawn underline (a mask of `annotations/underline.svg`) left to right, and rub it out on leave. | codemyui hand-drawn underline |
| **LIGHTS OUT** | theme transition | `lightsOut(lampButton, apply)` pulls the cord, starts a View Transition, and grows a 64-point *wobbly* polygon `clip-path` from the bulb, interpolated by WAAPI. The old view dims slightly. Under reduced motion it switches instantly. | View Transitions circular reveal, plus our wobble |
| **PAGE TURN** | navigation | `pageTurn(update)` wraps a same-document View Transition. The old `page` lifts away like a turned sheet, and named elements morph. | View Transitions API |
| + DRIFT | idle | `.drift` specimens move a few pixels over 14–17 s. | — |

Everything collapses under `prefers-reduced-motion`. `inkIn` also honours `?still`.

## The ink renderer (for the builder)

- `three/ink.js` provides `InkKit`. `inkify(object, {hidden, hatch, threshold, scale})` replaces materials with a paper fill plus screen-space hatching, and adds doubled, overshooting edge strokes (`LineSegments2`). It can also add dashed hidden edges. `kit.setTheme('dark')` swaps ink and chalk live. `drawProgress(line, t)` animates the pen.
- `three/habits.js` holds six crystal habits: octahedron, rhombic dodecahedron, rhombohedron, capped hexagonal prism, pyritohedron and cube.
- `three/crystal.js` exports `mountCrystal(el, {theme, habit, onHabit})` and returns `{next, setHabit, setTheme, destroy}`. Drag turns the crystal, tap or Enter redraws it, and it pauses offscreen. It needs the import map `{"three": "./vendor/three.module.min.js"}`, or point that at `https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js`. The standalone demo is `three/demo.html`.
- `_src/bake.html?scene=desk|plate|mcp|funlibs|toolrails|harbor&theme=light|dark&w=&h=&px=` is the offline bake page that produced every still. It can re-render at any size, for example a portrait hero for mobile.

## Inventory

| File | What it is | Intended use | Source / how made | Licence |
|---|---|---|---|---|
| identity/mark.svg, mark-chalk.svg, mark-current.svg | Octahedron mark: ink front edges with dashed back edges. Its top half reads as an A | Header, favicon source, section markers, loading | Hand-authored with `_src/pen.mjs` (seeded draftsman pen), built by `_src/build-svg.mjs` | Original work for Albretsen AS |
| identity/wordmark.svg, wordmark-chalk.svg | "Albretsen" in outlines | Header, footer | Instrument Serif converted to paths by `_src/wordmark.py` (fontTools) | Original; font OFL 1.1 |
| identity/lockup.svg, lockup-chalk.svg | Mark, wordmark and a small "AS" | Header (30 px tall), documents | `_src/wordmark.py` | Original |
| identity/favicon.svg | Heavier mark on a rounded tile that follows the OS light or dark setting | `<link rel=icon>` | build-svg.mjs | Original |
| identity/apple-touch-icon-180.png | 180 px touch icon | `apple-touch-icon` | rsvg-convert from `_src/favicon-180.svg` | Original |
| identity/og-image.jpg | 1200×630 share card: lockup, "asgeir is typing", line, desk | `og:image`, `twitter:image` | `_src/og.html` screenshotted in headless Chrome | Original |
| hero/desk-{light,dark}{,@2x}.webp, desk-*@2x.avif | Hero A: ink desk (monitor with a typing bubble, lamp, books, chair, plant, an 1806 specimen as paperweight). The empty left 40% is for the chat | The hero, behind the conversation; swap on theme | Kenney CC0 models rendered as ink by `three/ink.js` in `_src/bake.html`, 2880×1620 at px=2 | Original render; models CC0; specimen PD |
| hero/plate-{light,dark}{,@2x}.webp, plate-*@2x.avif | Hero B, "Plate I": three ink crystal habits on orbits beside the specimens they describe | Alternate hero, "About" header, 404 | Generated habits (`three/habits.js`) plus Sowerby specimens, `_src/bake.html?scene=plate` | Original; specimens PD |
| hero/_screen-bubble-{light,dark}.svg | The typing bubble on the monitor | Baked into hero A; can be reused as a chat icon | build-svg.mjs | Original |
| products/mcp-emails-{light,dark}{,@2x}.webp | **Real** MCP Emails app icon on an ink laptop, with a verdigris specimen | MCP Emails card | Kenney laptop and books + `_shared/products/mcp-emails/icon.png` (rounded mask only, not recoloured) | Logo © Albretsen AS; render original |
| products/fun-libs-{light,dark}{,@2x}.webp | **Real** Fun Libs v5 icon on an ink phone leaning on books, with an amber specimen | Fun Libs card | Kenney books, a box phone + `_shared/products/fun-libs/icon.png` | Logo © Albretsen AS |
| products/toolrails-{light,dark}{,@2x}.webp | **Real** Toolrails icon on an ink monitor with keyboard and mouse | Toolrails card | Kenney screen, keyboard and mouse + `_shared/products/toolrails/icon.svg` (rasterised to `_src/tex/toolrails-icon-512.png`) | Logo © Albretsen AS |
| products/harbor-{light,dark}{,@2x}.webp | **Real** Harbor banner framed on an ink bookcase of books, with a plant | Harbor card | Kenney bookcase, books and plant + `_shared/products/harbor/banner.png` | Logo © Albretsen AS |
| products/retired/{polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}.svg | Pen-drawn stand-in icons for products without surviving brand assets. Luma uses its real `luma-monogram.svg` | Retired list (72–96 px) | build-svg.mjs | Original |
| specimens/*.webp (9) | Hand-coloured mineral specimens cut out with alpha: amber-cube, teal-matrix, teal-cluster, red-matrix, red-crystal, red-dodecahedron, olive-prism, pale-cluster, black-octahedron | The only colour on the page: paperweights in the drawings, margin objects, section markers, chat "stickers". Use at most three per screen | Sowerby, *British Mineralogy* vol. 1 (1804), Smithsonian Libraries scan sponsored by BHL: https://archive.org/details/britishmineralog01sowe, page images n25, n157, n166, n169, n196, n241 (`/page/nNN_w1600.jpg`). Keyed with `_src/cutout.py` and cleaned with `_src/despeck.py` | Public domain (NOT_IN_COPYRIGHT) |
| extras/orbit-diagram.svg | Three orbits around the habit, back halves dashed | "Products in orbit" section, about | build-svg.mjs | Original |
| extras/theme-lamp.svg | Desk lamp with groups `#lamp`, `#cord` and `#rays` | **The theme toggle.** Inline it with `inlineSvg()` | build-svg.mjs | Original |
| extras/annotations/{arrow-curve,underline,circle-scribble,bracket,spark,tick,strike,dimension}.svg | Margin annotation strokes (`currentColor`) | Circle a number, point at the crystal, cross out a retired product, underline links (mask) | build-svg.mjs | Original |
| extras/pattern-crosses.svg | 48 px registration-cross tile | Background of the 3D stage or footer | build-svg.mjs | Original |
| extras/pattern-hatch.svg | 24 px 45° pen hatch tile | Disabled or "retired" fills, shadows behind cards | build-svg.mjs | Original |
| extras/paper-grain.webp | 512 px tileable paper tooth (transparent) | Fixed overlay at about 40% opacity; invert it in dark | numpy, `_src/grain.py` | Original |
| three/ink.js, habits.js, crystal.js, demo.html | Ink renderer, habit geometry and the interactive crystal module | Live centrepiece, "Why the crystal?" answer, 404 | Hand-written | Original |
| three/models/*.glb (10) | Kenney Furniture Kit 2.0: desk, laptop, computerScreen, computerKeyboard, computerMouse, lampSquareTable, books, chairDesk, pottedPlant, bookcaseOpen | Re-baking, or a live ink desk scene | https://kenney.nl/media/pages/assets/furniture-kit/440e0608a4-1677580847/kenney_furniture-kit.zip | CC0 1.0 (`KENNEY-LICENSE.txt`) |
| vendor/three.module.min.js + vendor/addons/* | three.js r170 and the line, GLTF and convex add-ons | Runtime | https://cdn.jsdelivr.net/npm/three@0.170.0/ | MIT |
| motion.css, motion.js | Motion study (five named motions plus drift) | Site-wide | Hand-written | Original |
| _src/* | Bake page, pen, SVG builder, wordmark, grain, cutout and OG sources | Regenerating assets | Hand-written | Original |

## Rules for the builder

1. Swap images on theme with `[data-theme]`. Every drawn still exists in light and dark. Lazy-load the dark set.
2. Logos are never recoloured or redrawn. On dark, the product plates already sit on slate.
3. Keep specimens small (60–180 px) and few. They are punctuation.
4. Banned words still apply. The chat voice is short, factual and a little dry. Use only numbers from `designs/_shared/content.js`.
5. Respect `prefers-reduced-motion`. The kit already does.
