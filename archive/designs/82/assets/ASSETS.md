# Design 82: Q.E.D.

**A product-drop page for a company, not a product.** The release is called *Drop 00*, and the product is Albretsen AS itself.

Open `preview.html` (served over http) to see every asset, the palette and the type, with the animations and the interactive piece running. Add `?from=N` to jump to section N.

## Vision

In 1847 Oliver Byrne printed Euclid's *Elements* with the words replaced by coloured shapes, so each proof is written as a diagram. Q.E.D. applies that idea to a software company. Every product, fact and control is a **glyph** built from ink strokes and **one sun**, a filled circle sector in the single primary colour. The glyphs morph into one another the way one proposition leads to the next. That gives a minimal-futurist launch page in which the imagery *is* the icon system:

- **Fracture.** Each glyph may have one deliberate break with a slight shear. The hero shows a monolith split by a crack of light, and sections reveal by parting along a jagged seam.
- **Dawn.** Amber (OKLCH hue 72) appears only as a sun: a sector in a glyph, the light in the crack, an orbit on the sheet.
- **Gravity.** Springs settle with one soft overshoot. A black mass bends graph paper. In the easter egg, everything falls.

**Mood:** calm, exact, expensive. It is black, white and one colour, with generous space and one strong idea per screen. It should read as confident engineering and stay clear of sci-fi kitsch. There are no place names, and no industrial or nautical metaphors.

**What the builder should do with it:**
- Use `hero/fracture` as a full-bleed first screen with the wordmark and one line.
- Use `hero/gravity` (or the live `interactive/gravity-grid.js`) to open the products section.
- Present products as Drop items using the four plates. Their sun rises across the row (05:10 to 07:00).
- Use glyphs for every fact and button, and morph the hero glyph as the visitor scrolls (mark → MCP Emails → Fun Libs → Toolrails → Harbor → Q.E.D.).
- For the about or history section, place the Byrne plates beside `extras/proposition.svg`.

### References (research)

| What | URL | Taken |
|---|---|---|
| Igloo Inc. (Bureaux), Awwwards Site of the Year 2024 case study | https://www.igloo.inc, https://awwwards.com/igloo-inc-case-study.html | Restraint of one hero object, scroll-staged sections, particles kept quiet |
| Active Theory | https://activetheory.net | Rendered-light hero, monochrome UI on top of a single luminous object |
| Motion: SVG path morphing (Flubber) | https://motion.dev/tutorials/js-svg-path-morphing | Morph by interpolating resampled paths. Q.E.D. resamples itself, so there is no dependency |
| CodePen: self-drawing SVG (MyXoToD) | https://codepen.io/MyXoToD/post/howto-self-drawing-svg-animation | Stroke-based glyphs that animate cleanly |
| Radix Primitives animation guide | https://www.radix-ui.com/primitives/docs/guides/animation | `data-state` keyframes and an accordion height variable (`--qed-content-height` mirrors `--radix-accordion-content-height`) |
| Teenage Engineering / Nothing launch pages | https://en.wikipedia.org/wiki/Teenage_Engineering, https://cdm.link/2021/02/teenage-engineering-are-going-deeper-into-consumer-design-with-startup-nothing/ | The "drop" format: spec-label typography, sparse accent, a countdown-style reveal |
| Spline community | https://community.spline.design | Glass and obsidian material studies for the monolith and the sphere |
| Oliver Byrne, *The First Six Books of the Elements of Euclid* (1847), via Old Book Illustrations | https://www.oldbookillustrations.com/illustrations/circle-square/, https://www.oldbookillustrations.com/illustrations/straight-line-bisected/ | The core idea: proofs written in shapes, yellow as the hero colour |

Salt `cfdbae`: its hex digits (c=12, f=15, d=13, b=11, a=10, e=14) picked which result pages of Old Book Illustrations' *Science & Technology* subject to open (pages 10–15). Page 11 held the two Byrne plates.

## Palette (OKLCH, seed hue 72°)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| `--qed-ink` | oklch(0.14 0.004 72) | #0a0907 | text, strokes, dark ground |
| `--qed-ink-2` | oklch(0.21 0.005 72) | #1a1816 | dark surfaces |
| `--qed-ink-3` | oklch(0.32 0.006 72) | #353230 | secondary text on light |
| `--qed-mid` | oklch(0.56 0.006 72) | #777471 | labels, mono captions |
| `--qed-line` | oklch(0.88 0.006 72) | #dad7d3 | hairlines, borders |
| `--qed-paper` | oklch(0.975 0.006 72) | #f9f6f2 | page ground |
| `--qed-white` | oklch(0.995 0.002 72) | #fefdfc | cards |
| `--qed-dawn` | oklch(0.80 0.165 72) | #fea91e | **the one primary.** Suns only |
| `--qed-dawn-hi` | oklch(0.89 0.10 72) | #ffd08a | glow, highlights |
| `--qed-dawn-deep` | oklch(0.62 0.14 72) | #b97500 | amber text on paper (contrast) |

The tokens are defined in `motion.css`, with hex fallbacks first.

## Type

- **Geist** (300–600): display and body. Display is set at −0.035 to −0.05em tracking. Google Fonts, SIL OFL 1.1.
- **Geist Mono** (400–500): labels, specs and code, uppercase at +0.14em. Google Fonts, SIL OFL 1.1.
- **Wordmark**: not a font. It is drawn from the icon grammar (monoline, mitred, Λ for A, very wide tracking), and "AS" is set in the deep amber. Source is in `src/build-identity.mjs`.

## Motion study (`motion.css`, `motion.js`)

| Name | What it does | Researched from |
|---|---|---|
| **Proof Morph** | `glyph(el, id).to(next)`. Strokes are resampled to 64 points, paired by nearest centroid with direction chosen for least travel, and staggered 70 ms per stroke. Mid-flight each stroke shears along its own fracture. The sun tweens as geometry (centre, radius, angles) and gets a spring overshoot on the radius. `cycle()` loops a list. | motion.dev path morphing, Byrne |
| **Fracture Reveal** | `fractureReveal(el)` on `[data-fracture]` with two `.fr-half` copies. The halves start apart along a jagged clip-path seam and close together, with a hairline of amber light glowing in the crack. | Igloo Inc. shard transitions, the hero render |
| **Dawn Rise** | `dawnRise()`. The sun of every `[data-dawn]` glyph rises from its horizon, then `[data-count]` numbers count up. `.qed-first-light` brings the hero from near-black to full grade. | Active Theory hero intros |
| **Gravity Settle** | The `--qed-settle` CSS `linear()` spring (one soft overshoot). `.qed-settle` cards are pulled down 3 px on hover, and the tabs indicator slides on the same spring with the sun riding on it. | Radix and Vaul-style spring easing |
| **Radix-style primitives** | `accordion`, `dialog` (opens as a slit of light that widens into the panel), `tooltip`, `hoverCard` and `tabs`. All are driven by `data-state` and accessible (aria-expanded, roles, arrow keys on tabs, Esc on dialog). They swap 1:1 for @radix-ui in React. | Radix animation guide |
| **Easter egg** | Type `qed` anywhere, or triple-click any `[data-qed-mark]`. Every glyph on screen falls under gravity and bounces into a pile while "Q.E.D. — which was to be demonstrated" fades in, then everything rises back at dawn. | n/a |

Every animation respects `prefers-reduced-motion`.

## Inventory

All of the following were made for this kit unless stated otherwise. **Licence "own work"** means it was created here for Albretsen AS and is free for the client to use.

| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| `hero/fracture-{960,1600,2400}.{avif,webp,jpg}` | Black monolith split by a fracture, dawn pouring through, volumetric beam, polished floor (16:9) | Hero A, full-bleed first screen | GLSL ray-marcher `src/render.html?scene=fracture`, 2400×1350 at 3×3 SSAA in headless Chrome (SwiftShader), grain and export in Python (Pillow), AVIF via ffmpeg/SVT-AV1 | own work |
| `hero/fracture-portrait-{760,1200}.*` | Same scene with a portrait camera (2:3) | Hero A on phones (`<source media="(max-aspect-ratio: 4/5)">`) | as above, `w=1200&h=1800` | own work |
| `hero/gravity-{960,1600,2400}.*` | Obsidian sphere bending a sheet of graph paper; amber bodies on solid and dotted orbits (Byrne notation); low dawn sun | Hero B, products intro, light sections | `src/render.html?scene=gravity` | own work |
| `hero/gravity-portrait-{760,1200}.*` | Portrait camera | Hero B on phones | as above | own work |
| `products/{mcp-emails,fun-libs,toolrails,harbor}-{800,1600}.*` | Real product logo on the porcelain face of a black-glass tile floating over its own gravity well; sun rises across the four (hour 0–3) | Product cards, dialogs, hover cards | `src/render.html?scene=tile&logo=tex/<id>.png&hour=n`. Logos composited with their exact colours, not relit. Logos from `designs/_shared/products` | render: own work; logos: Albretsen AS products |
| `src/tex/*.png` | Logo textures (real logos centred or full-bleed on a 1024 transparent square) | Render input only | `rsvg-convert` + Pillow from `designs/_shared/products` | Albretsen AS products |
| `products/retired/*.svg` | Ink coins carrying the stand-in glyph and "year — RETIRED" for Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring and the early apps | Archive or history list | `src/build-extras.mjs` | own work |
| (Luma) | Uses its real `logo.png` / `luma-monogram.svg` from `_shared` | Archive list | `designs/_shared/products/luma` | Albretsen AS product |
| `identity/mark.svg`, `mark-reverse.svg`, `mark-mono.svg` | The mark: an apex A whose crossbar is a horizon with the sun on it, and whose right leg is broken and sheared | Logo, nav, loaders | `src/build-identity.mjs` from `icons.js` | own work |
| `identity/wordmark.svg`, `wordmark-reverse.svg` | ΛLBRETSEN ΛS in monoline caps drawn on the icon grammar | Header, footer, OG | `src/build-identity.mjs` | own work |
| `identity/lockup.svg` | Mark + wordmark | Footer, documents | same | own work |
| `identity/favicon.svg`, `apple-touch-icon.png` (180) | Black rounded tile with the paper mark and amber sun | Favicon / home-screen icon | same + `rsvg-convert` | own work |
| `identity/og.jpg` (1200×630) | Hero A with wordmark and "Software that pays for itself." | Open Graph / social | `src/og.html` screenshotted | own work |
| `icons/icons.js` | **The icon system**: 30 glyphs as data (strokes + sun), `iconSVG()` and `sectorPath()` | Every icon on the site; morph source | hand-drawn on a 24 grid | own work |
| `icons/svg/*.svg`, `icons/sprite.svg` | Static exports (ink + dawn) and an `<symbol>` sprite (`#qed-<id>`, `currentColor`) | Static use without JS | `src/build-identity.mjs` | own work |
| `extras/byrne-iv-6.{webp,jpg}`, `byrne-ii-6.*` | Byrne's Euclid plates (Book IV Prop. VI; Book II Prop. VI) regraded into the palette: yellow → dawn, red → deep amber, blue → ink | About or "method" section, blog headers, texture | https://www.oldbookillustrations.com/illustrations/circle-square/ and …/straight-line-bisected/ (1600 px scans), regraded with numpy | **Public domain** (Oliver Byrne, 1810–1880; published 1847) |
| `extras/byrne-iv-6-night.*` | Night grade: paper → ink, ink → paper | Dark sections | same | Public domain |
| `extras/proposition.svg` | The company as an orbit diagram: products on year rings (newest innermost), live = full sun, building = half sun, paused = ring, retired = dot | About or history, footer art | `src/build-extras.mjs` from `_shared/content.js` | own work |
| `extras/drop-tag.svg` | The "Drop 00" release label: issuer, origin, Play since 2016, company since 2026, live and building products, a row of glyphs, Q.E.D. | Hero ephemera, about card | same (facts from `content.js`) | own work |
| `extras/fracture-divider.svg` | Hairline with one jagged break of light | Section divider | same | own work |
| `extras/sun-shapes.svg` | The five allowed suns (full, rising, set, quarter, half) | Style guide, decoration | same | own work |
| `extras/graph-paper.svg` | 48 px graph-paper tile matching hero B | Background texture | same | own work |
| `extras/grain.png` | 256 px transparent grain tile | Overlay on dark sections | numpy noise | own work |
| `interactive/gravity-grid.js` | **Interactive asset**: canvas 2D perspective sheet bent by a mass that follows the pointer; amber bodies orbit it. Light and dark themes, pauses offscreen, about 5 KB, no deps | Live hero B or products backdrop | hand-written | own work |
| `motion.css`, `motion.js` | Tokens, the motion study and the primitives (see above) | Site-wide | hand-written | own work |
| `src/render.html` | The offline GLSL renderer (scenes: fracture, gravity, tile) | Re-render at any size: `scripts/shot.sh "http://…/src/render.html?scene=…&w=…&h=…&ss=3" out.png w h 900000` | hand-written | own work |
| `preview.html` | Contact sheet | Review | hand-written | own work |
| Fonts | Geist, Geist Mono | Type | https://fonts.google.com/specimen/Geist, https://fonts.google.com/specimen/Geist+Mono | SIL OFL 1.1 |

## Performance notes

- Hero A as AVIF is 5 KB (960), 9 KB (1600) and 22 KB (2400), so the first screen can be well under 100 KB. Always set `width`/`height` (16:9 or 2:3) to keep layout shift at 0.
- Load `gravity-grid.js`, the morph and Byrne plates after first paint. The glyph data (`icons.js`) is about 6 KB.
- Folder total: about 3.3 MB, most of it JPEG fallbacks.
