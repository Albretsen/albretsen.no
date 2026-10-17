# Peach Hour: asset kit for design 78

## Vision

**A whole small world, held in the hand.** A Provençal hill village (stone houses, canal-tile roofs, louvered shutters, olive terraces, cypresses, lavender rows, a pale-blue pool) is built from three.js primitives and set on a travertine turntable with a gold seam. It floats in warm sunrise haze over layered ridges. It is graded like false-colour infrared film: olive trees glow rose, cypresses go crimson, shadows turn mauve and highlights turn peach. The light is LA haze at the ends of the day.

The model is the message. It shows precision, patience and taste without saying so. Each product is one building in the village, carrying its real logo. The visitor can **turn the model** and **drag the sun**. Dragging the sun moves the day from sunrise to dusk: shadows swing, the sky re-mixes, and windows light up as the light falls.

Mood: calm, sunlit, exact, quietly confident. One strong idea per screen, generous peach space, nothing loud. It is not a travel poster: there are no place names or landmarks, and the subject is still the company and its products.

### How to use it (for the builder)

- **Hero:** use `img/hero-dawn-*` (desktop) and `img/hero-dawn-portrait-*` (phones) as the first paint, served responsively with AVIF, then WebP, then JPEG. After first paint, lazily import `diorama.js` and fade the live canvas in over the still, which is already done in `preview.html` and `diorama.html`. The still and the live scene use the same camera, so the swap does not jump.
- **Copy space:** the dawn hero keeps the left 40% for type, and the dusk hero mirrors it to the right. The portrait heroes keep the top third free.
- **Products:** use `products/<id>-1600|800.*`, one card per product, 4:3. Retired products use the tiles in `products/retired/`.
- **Parallax:** stack `layers/layer-1-sky`, `layer-2-ridges` and `layer-3-diorama` (alpha) in a `.ph-haze` block (see `motion.css`).
- **Drag the sun without WebGL:** `img/sun-sequence-strip` holds 7 baked frames (sunrise to dusk, turning). Use `sequenceFrame()` in `motion.js`.
- **Ground:** paper `#FFF8EF` with `extras/paper-grain.webp` multiplied at 30 to 40% opacity. Text is ink `#4E3A57`, never black.

## References (researched)

- https://www.loewe.com — full-bleed slow campaign video and tall 3:4 imagery, with very little UI around large pictures. Taken: let one image carry the screen.
- https://www.awwwards.com/websites/sites_of_the_day/ — Sites of the Day, Sep–Oct 2026. Salt `d9af08` picked entries 13 (EDOLUS), 9 (Odyssée) and 10 (twks). twks: personable, understated tone, and a "Golden Hour" detail that confirmed the warm-hour mood.
- https://www.loc.gov/pictures/collection/travel/ — the Photochrom travel views (hand-tinted, 1890s) are a reference for colour only, the way a tint can make stone and sky glow. No image was downloaded: the brief asks for three.js and procedural sources.
- https://www.sezane.com — returned 403 to the fetcher. Its known warm cream ground and soft editorial pacing informed the paper colour and spacing.
- Infrared grading: https://digital-photography-school.com/simulating-false-color-infrared-photography-in-photoshop/ and https://kolarivision.com/the-irchrome-infrared-photography-filter-our-digital-version-of-kodak-aerochrome/ (foliage to magenta/red, skies deepen, stone desaturates). This is implemented as material colours plus a split-tone pass in `diorama.js`.
- Diorama technique: https://freefrontend.com/javascript-diorama/ (baked, turntable dioramas) and https://discourse.threejs.org/t/control-camera-using-mouse-click-and-drag/39612 (drag-to-orbit). Here the whole turntable rotates, not the camera, so the sky and sun stay fixed.
- Soft shadows in three.js: https://playbooks.com/skills/cloudai-x/threejs-skills/threejs-lighting (PCFSoftShadowMap, tight shadow camera, bias).
- Scroll-driven parallax: https://drafts.csswg.org/scroll-animations-1/EXPLAINER.html and https://12daysofweb.dev/2023/css-scroll-driven-animations/ (view timelines, depth via custom properties).
- Drag the sun: the amCharts day/night demo https://www.amcharts.com/demos/day-and-night-world-map/ (a draggable sun driving a terminator) is the interaction ancestor.
- Typeface: https://fonts.google.com/specimen/Nunito (OFL).

## Palette

| Token | Hex | OKLCH | Use |
|---|---|---|---|
| Paper | `#FFF8EF` | `oklch(98.2% 0.014 74.4)` | page ground |
| Peach 100 | `#FDEBDD` | `oklch(95.1% 0.027 60.4)` | cards, panels |
| Peach 300 | `#F9C9A4` | `oklch(86.9% 0.073 59.2)` | haze, large fills |
| Gold | `#F2C46D` | `oklch(84.3% 0.118 81.9)` | the plinth seam, rules, focus |
| Sun | `#F8BE55` | `oklch(83.5% 0.137 79.6)` | sun disc, mark |
| Terracotta | `#D9805C` | `oklch(68.8% 0.121 42.5)` | accent text, eyebrow labels, "AS" |
| Pale blue | `#A9CDEB` | `oklch(83.2% 0.057 243.6)` | morning sky, mark window |
| Shutter blue | `#7FA9C6` | `oklch(71.5% 0.062 238.9)` | shutters, secondary accent |
| IR rose | `#EC8FAE` | `oklch(75.5% 0.118 358.9)` | foliage in imagery only |
| Cypress | `#B83A63` | `oklch(54.2% 0.164 4.6)` | imagery only |
| Lavender | `#A48AD6` | `oklch(68.6% 0.113 299.2)` | imagery, Warm Up start colour |
| Haze mauve | `#C58FA6` | `oklch(70.9% 0.072 351.8)` | ridges, dusk |
| Ink | `#4E3A57` | `oklch(38.2% 0.054 315.1)` | all text and the mark |

Sky keyframes (zenith / horizon / glow): dawn `#7FB3E2 / #F9BF94 / #FFC45C`, noon `#72B2EC / #F6E2C8 / #FFF0C8`, dusk `#8481BD / #F3A58E / #FF9452`. `motion.css` mixes them in OKLCH from `--t`.

## Typeface

**Nunito** (Vernon Adams, Cyreal, Jacques Le Bailly), a variable font with weights 200 to 1000 and rounded terminals: a Californian, sunny, soft sans. It is self-hosted in `fonts/`, latin subset, as 39 KB roman and 42 KB italic woff2.

- Display: 820, tracking −0.03 to −0.045em, line-height 0.95 to 1.05.
- Big figures: 250, tracking −0.03em.
- Body: 450, 17/1.55.
- Labels: 800, uppercase, 12px, tracking 0.16em, in terracotta.
- The wordmark is Nunito 820, outlined to paths, so it needs no font.

## Motion (motion.css, motion.js)

1. **Haze Drift:** a slow multi-layer parallax. The sky moves 0.15× the travel, the ridges 0.5× and the model 1.1×. It uses a CSS `view()` timeline where supported and a rAF fallback (`hazeDrift`). Ref: CSSWG scroll-animations explainer.
2. **Sun Drag:** a sun on an arc that you drag (pointer or keyboard: arrows, Home, End; `role=slider`). It writes `--t`, which re-mixes the sky tokens in OKLCH, and calls back into `diorama.setTime(t)` or `sequenceFrame()`. Ref: the amCharts day/night drag.
3. **Shutter Open:** pale-blue louvered shutters (pure CSS) swing open in 3D (1.6 s, expo-out) as an image enters the viewport. This is the village's own gesture for revealing a picture.
4. **Warm Up:** headline letters go from weight 300 in lavender to 820 in ink with a 38 ms stagger, like stone warming in the sun. It uses `font-variation-settings`, so there is no layout shift.
5. **Turntable (live):** the diorama idles at 0.035 rad/s, keeps inertia after a drag, and stops under reduced motion.

Every motion is disabled or set to its end state under `prefers-reduced-motion`.

## Interactive asset

`diorama.js` is an ES module built on vendored three.js r169. `createDiorama({ canvas, scene, view, time, yaw, autoTurn, offsetX, layer })` returns `{ setTime, setYaw, setView, resize, renderNow, start, stop, dispose }`.

- Scenes: `village`, or `vignette:mcp-emails|fun-libs|toolrails|harbor`.
- Views: `hero`, `portrait`, `wide`, `street`, `top`, `v:<id>`.
- Pipeline: PCF soft shadows, then a HalfFloat MSAA render target, then bloom (threshold plus 3×2 Gaussian passes at quarter resolution), then a composite with tilt-shift blur, ACES, a mauve/peach split tone, lifted blacks, a warm vignette and grain.
- Interaction: drag to turn, drag the sun disc to change the time of day, and arrow keys.
- Demo: `diorama.html`. Baking: `bake.html?w=&h=&t=&yaw=&view=&scene=&offsetX=&layer=` (all stills in this kit were baked from it with headless Chrome and SwiftShader, at 1.5× resolution, then downsampled).
- Weight: three.js is 687 KB raw (about 170 KB gzip) and diorama.js is about 40 KB. Load both after first paint.

## Inventory

| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| `identity/mark.svg` | Arched window, sun on the sill | logo, avatar | hand-written SVG | own work |
| `identity/wordmark.svg` | mark + "albretsen" + "AS" (outlined Nunito 820) | header | SVG; glyphs outlined from Nunito with fontTools | own work; Nunito OFL-1.1 (outlines permitted) |
| `identity/wordmark-on-dark.svg` | light version | dark footer | as above | as above |
| `identity/favicon.svg` | mark on peach rounded square | favicon | SVG | own work |
| `identity/apple-touch-icon-180.png` | 180 px icon | apple-touch-icon | rsvg-convert from favicon.svg | own work |
| `identity/og-image.jpg` | 1200×630 render + wordmark + line | Open Graph / social | diorama bake + SVG overlay, Pillow | own work |
| `img/hero-dawn-{2560,1600,960}.{avif,webp}`, `-{1600,960}.jpg` | Hero 1: village at sunrise, model right, sun left | home hero (desktop) | three.js bake 3840×2160, downsampled | own work |
| `img/hero-dusk-*` | Hero 2: village turned 130° at dusk, lit windows, model left | second section, about, or dark-mode hero | three.js bake | own work |
| `img/hero-dawn-portrait-{1080,720}.*`, `img/hero-dusk-portrait-*` | 2:3 crops, re-rendered (not cropped) | phone hero | three.js bake 1620×2430 | own work |
| `img/sun-sequence-strip.{webp,avif}` | 7 frames, sunrise to dusk while turning, 640×360 each | drag-the-sun fallback, loading poster, footer | three.js bakes | own work |
| `layers/layer-1-sky-{1920,960}.*` | sky + sun only | parallax back layer | three.js bake (`layer=skyonly`) | own work |
| `layers/layer-2-ridges-{1920,960}.{avif,webp}` | hazy ridges, alpha | parallax middle layer | three.js bake (`layer=ridges`) | own work |
| `layers/layer-3-diorama-{1920,960}.{avif,webp}` | the model, alpha | parallax front layer, cut-out | three.js bake (`layer=scene`) | own work |
| `products/mcp-emails-{1600,800}.*` | house with an enamel blade sign carrying the **real MCP Emails mark**, dusk | product card | three.js vignette; logo `_shared/products/mcp-emails/logo-mark.svg` drawn unchanged | own work + product's own logo |
| `products/fun-libs-*` | house with the **real Fun Libs icon** as a glazed tile over the door, morning | product card | `_shared/products/fun-libs/icon.png` unchanged | own work + product logo |
| `products/toolrails-*` | gate pillars with the **real Toolrails icon** as a tile, half-open wrought gate | product card | `_shared/products/toolrails/icon.svg` unchanged | own work + product logo |
| `products/harbor-*` | awning and plaque with the **real Harbor mark** (filled), sunset | product card | `_shared/products/harbor/harbor-mark-filled.svg` unchanged | own work + product logo |
| `products/retired/luma.svg` | tile with the real Luma logo (unchanged, embedded at 300 px) | retired list | SVG; `_shared/products/luma/logo.png` embedded as data URI so it renders inside `<img>` | own work + product logo |
| `products/retired/{polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}.svg` | painted house-number tiles as stand-ins | retired list | hand-written SVG | own work |
| `extras/paper-grain.{webp,png}` | tileable warm grain, 256 px, alpha | page texture (multiply) | numpy noise, wrap-blurred | own work |
| `extras/roof-tile-edge.svg` | canal-tile eave edge, repeat-x | section divider, header edge | SVG | own work |
| `extras/shutters.svg` | pale-blue louvered shutters on a lit window | illustration, empty states, 404 | SVG | own work |
| `extras/olive-sprig.svg` | olive sprig in IR rose | ornament, blog | SVG (seeded) | own work |
| `extras/lavender-bundle.svg` | lavender bundle | ornament | SVG (seeded) | own work |
| `extras/sun-handle.svg` | the drag-the-sun knob | Sun Drag control | SVG | own work |
| `extras/arch-frame.svg`, `extras/arch-mask.svg` | round arch frame and mask | arch-cropped images (`mask-image`) | SVG | own work |
| `extras/horizon-ridges.svg` | three hazy ridgelines | footer / section divider | SVG (seeded) | own work |
| `diorama.js` | live 3D village + post pipeline | hero interactive | own code | own work |
| `vendor/three.module.min.js` | three.js r169 | dependency | https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js | MIT |
| `fonts/nunito-latin-var.woff2`, `fonts/nunito-latin-var-italic.woff2` | Nunito variable, latin | all type | https://fonts.gstatic.com/s/nunito/v32/ (Google Fonts) | SIL OFL 1.1 |
| `motion.css`, `motion.js` | motion study | site motion | own code | own work |
| `diorama.html` | full-screen interactive demo | demo | own code | own work |
| `bake.html` | still-baking harness | tooling | own code | own work |
| `preview.html` | contact sheet | review | own code | own work |

No photographs or third-party images are used. Everything except the product logos and the font is generated in code.
