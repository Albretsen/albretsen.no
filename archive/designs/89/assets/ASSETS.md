# Prism Room · asset kit 89

**One real, sunlit room. The products live in it as pixel objects you can pick up and move.**

## Vision

The brief combined things that seem to clash: a 3D room or diorama, pixel-art sprites, CC0 3D models, and *photography-led, no 3D at all*. The surprise is to keep all of them and let each do one job:

- **The room is a real photograph.** It is a Poly Haven backplate of an old loft studio in late sun, with light through the window, a gilt mirror, a wire table, and a 5×4 panel of bulbs on a stand. It is graded into a "candy prism" light: plum shadows, rose mid-tones, and apricot/cream sun at the seed hue 36°. The prism idea shows up as a faint chromatic fringe along every edge of sunlight. No 3D runs in the browser.
- **The products are pixel objects.** I took CC0 Kenney Furniture Kit models and rendered them offline with three.js toon shading at a tiny resolution, upscaled them nearest-neighbour, and added a 1 px ink outline. Each one becomes a crisp sprite. **The real product logo is the only thing in the world that is not pixelated.** It sits on the screen, the phone or the book cover at full resolution, so it reads as "the work is the sharp thing in the room".
- **Hacker cool, but calm.** The page starts as the room in 13 palette colours with an ordered dither (a 12 KB PNG). It *resolves* into the photograph as you scroll, the way a render converges. A prism lens under the cursor shows the true photo early. The page has one idea per screen, a lot of dark plum space, and light as the subject.
- **Signature delight: drag to rearrange anything.** Every object can be picked up. It lifts and tilts with your hand's velocity, drops with a spring, and snaps to the room's 320-pixel grid. Arrow keys nudge it. The arrangement persists per visitor.
- The bulb panel in the photo works as a real **20-pixel display**. Light it in candy colours to show status, scroll progress, or a tiny prism "A".

The spark words map onto the kit. **Vector**: the pick-up velocity and Lenis smear. **Prism**: the mark, the light fringes and the spectrum crossbar. **Velocity**: the resolve on scroll and the smear.

**Avoided on purpose.** No place names or tourist clichés, nothing industrial or nautical in the copy or graphics, and no cartoon loudness: the candy colours appear only as light and as small objects on a dark, quiet ground. Harbor's own logo is used unchanged; the kit adds no nautical imagery.

### References

These are the sources I researched. The search budget was shared between agents and ran out after the first fetches, so research leaned on direct fetches and the catalogues below.

- https://linear.app: product imagery as hero, restrained palette, mono identifiers, "Fig 0.x" editorial labels. This led to the mono captions and the "the products are the heroes" principle.
- https://emilkowal.ski: the design-engineer school of motion (drag with velocity, springy release, "you don't need animations" restraint). It led to the *Pick-up* behaviour and to keeping everything else quiet.
- https://activetheory.net: the bar for a single interactive hero that people play with. It led to the resolve and lens.
- https://ambientcg.com: CC0 material library, checked for textures; the final grain and dither are procedural instead.
- https://polyhaven.com (`api.polyhaven.com/assets?t=hdris&c=indoor`): source of the photography. I chose among the indoor HDRI backplate sets using the salt digits d,d,3,2,6,b, which led to `photo_studio_loft_hall`, then `pine_attic` and `neon_photostudio` as alternates. I downloaded and reviewed all 83 backplates as contact sheets. Loft hall DSC_8689 and DSC_8629 won for their light.
- https://kenney.nl/assets/furniture-kit: CC0 low-poly models used for every sprite.
- Techniques: Bayer ordered dithering (8×8 recursive matrix), gradient-map grading, CSS `animation-timeline: view()/scroll()`, Lenis smooth scroll.

## Palette (OKLCH → hex)

The spectrum order is peach, bubblegum, lilac, sky, mint (the prism crossbar).

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| `--pr-ink` | oklch(0.18 0.045 305) | `#160c21` | page ground |
| `--pr-ink-2` | oklch(0.25 0.055 310) | `#2a1935` | panels, cards |
| `--pr-plum` | oklch(0.36 0.09 330) | `#572953` | lines, shadows, dither mid |
| `--pr-fog` | oklch(0.90 0.025 330) | `#e8d8e6` | secondary text |
| `--pr-paper` | oklch(0.975 0.018 70) | `#fff5ea` | primary text, marks |
| `--pr-peach` (seed 36°) | oklch(0.79 0.135 36) | `#ff9a7d` | accent, links, spectrum 1 |
| `--pr-peach-deep` | oklch(0.68 0.17 36) | `#ee6b47` | pressed, accent on light |
| `--pr-gum` | oklch(0.80 0.13 355) | `#ff99c2` | spectrum 2 |
| `--pr-lilac` | oklch(0.77 0.10 300) | `#bea6eb` | spectrum 3 |
| `--pr-sky` | oklch(0.81 0.09 235) | `#86cbf3` | spectrum 4 |
| `--pr-mint` | oklch(0.87 0.10 170) | `#8deaca` | spectrum 5, "live", code |
| `--pr-lemon` | oklch(0.93 0.12 100) | `#faea89` | sun highlight, rare |

The dither palette (`hero/*-pixel-*.png`, `pixel-resolve.js`) adds one mid berry, `#8a3f6e`, so the ramp from plum to rose stays smooth.

## Typefaces (Google Fonts, OFL)

- **Geist** 400/500/600: display (tight, −0.035em) and body.
- **Geist Mono** 400/500: code, captions, the MCP command.
- **Silkscreen** 400: small uppercase pixel labels only (status, section numbers). Never for sentences.
- The wordmark is **custom 5×7 pixel letterforms** (`src/identity.mjs`), not a font.

## How to build with it

- **Hero.** Put `<pixel-resolve data-scroll data-rest=".42" src="hero/room-1920.jpg" placeholder="hero/room-pixel-320.png" width="2560" height="1761" lens>` in a container with `container-type:inline-size`. Lay `<drag-room ratio="2560/1761">` absolutely over it, with `<img data-drag>` children taken from `hero/room-map.json`. Add bulbs with `lightBulbs()` from `motion.js`. Overlay copy goes in `copySafeArea` from the map. On phones, use `room-portrait-*` as a plain `<picture>` with the sprites placed by hand, or keep the landscape room and crop it with `object-position`.
- **Performance.** First paint is the 12 KB pixel PNG at the right aspect ratio, so layout shift is 0. The photo, at 11–60 KB as AVIF, swaps in after. Lenis is imported lazily. The total at first view is about 150 KB of images plus fonts.
- **Products.** Use `products/card-*` as section images and `products/sprite-*` as draggable objects. Retired products go on a shelf: `retired/*.svg` beside `sprites/archive-box.png`, with Luma as `sprite-luma.png`.
- **Motion.** `motion.css` provides seven named animations and `motion.js` provides `initMotion()`. They are described below and played in `preview.html`.

## Motion study

| Name | Where | What | Researched from |
|---|---|---|---|
| **Resolve** | `pixel-resolve.js` + `motion.js` (B) + `.pr-resolve` CSS fallback | Ordered-dither pixels converge to the photograph: boots to 42%, then reaches 100% as the hero scrolls away. The cell size eases from 18 px to 1 px, and the palette blends to true colour. | Progressive render and denoise previews (path tracers), and LQIP blur-up patterns on Linear and other product sites, done here as pixels instead of blur |
| **Prism lens** | `pixel-resolve.js` `lens` | A circle under the pointer shows the true photo with a pink/blue chromatic rim | Lens and magnifier reveals on Active Theory–style WebGL heroes, done in Canvas 2D |
| **Pick-up** | `drag-room.js` | On grab, the object lifts 10 px, scales 1.06 and tilts with smoothed pointer velocity (±12°). On drop, `cubic-bezier(.2,1.6,.4,1)` overshoots it back down and it snaps to the 320-grid. | Emil Kowalski's drag and velocity work (Sonner/Vaul), and Linear's tactile UI |
| **Prism sweep** | `.pr-prism-text` | Headline gradient slides from white through the five spectrum colours as it enters view (`animation-timeline: view()`) | Gradient-text reveals common on Linear-era marketing pages |
| **Sunpath** | `.pr-sunpath` | A soft window-light leak crosses the whole page on `scroll(root)`, so a day passes as you read | Long-scroll lighting changes in 3D studio sites, done in CSS with a single 19 KB WebP |
| **Pixel wipe** | `.pr-pixel-in` | Content reveals left to right in 8 hard steps (`steps(8)`) | Sprite and tile loading on 8-bit screens |
| **Velocity smear** | `.pr-velocity` + `motion.js` (A) | Lenis velocity is written to `--pr-velocity`. Pixel objects skew up to 4° and split into pink/blue ghosts when you scroll fast, and settle at rest. | Lenis velocity demos and darkroom.engineering sites |
| **Bulb display** | `.pr-bulb` + `lightBulbs()` | The photo's 5×4 bulb panel lights in candy colours: a chase, or a 20-char pattern (the demo draws the prism A) | Turning a real object in the photo into UI |
| **Sparkle** | `.pr-sparkle` | 4-frame pixel twinkle from `extras/sparkle-sheet.png` | Classic sprite-sheet `steps()` |

Every animation is disabled under `prefers-reduced-motion`. Scroll-driven ones fall back to their static end state when `animation-timeline` is unsupported.

## Inventory

Licences: **CC0** means public domain (Poly Haven and Kenney). **Own** means generated for this kit by code in `src/`. Product logos belong to Asgeir/Albretsen AS and are copied unchanged from `designs/_shared/products`.

| File | What | Intended use | Source / how | Licence |
|---|---|---|---|---|
| `identity/mark.svg`, `mark-ink.svg`, `mark-paper.svg` | Prism "A" on a 16-grid; the crossbar is the 5-colour spectrum | logo, nav, footer | `src/identity.mjs` | Own |
| `identity/wordmark*.svg` | "ALBRETSEN AS" in custom 5×7 pixel letters; the first A's crossbar is the spectrum | header, OG | `src/identity.mjs` | Own |
| `identity/favicon.svg`, `favicon-180.png` | mark on ink, rounded | favicon, apple-touch | `identity.mjs` + `rsvg-convert` | Own |
| `identity/og.jpg` | 1200×630 social card | Open Graph / Twitter | `src/og.html` screenshotted in headless Chrome | Own (+ CC0 photo) |
| `hero/room-{828,1280,1920,2560}.{avif,webp,jpg}` | Graded loft room, empty | main hero plate under the drag layer | Poly Haven `photo_studio_loft_hall` backplate DSC_8689 (https://polyhaven.com/a/photo_studio_loft_hall), graded with `src/pipeline/hero.py a` (gradient map, split tone, bloom, prism fringe, vignette) | CC0 |
| `hero/room-portrait-{720,1080}.*` | 4:5 crop of sunbeam + table | phone hero | same, cropped | CC0 |
| `hero/room-pixel-320.png` | 13-colour ordered-dither version | LQIP, unresolved state | `src/pipeline/dither.py` | CC0 derivative |
| `hero/diorama-{960,1600,2560}.*` | the room with all products placed, contact shadows, screen glow, sun wash | key art, OG, press | `src/pipeline/compose.py` | CC0 + Own + product logos |
| `hero/sunwall-{900,1400,2000}.*` | Low sun on a plum wall, gilt mirror, wire table | second scene (About / closing) | Poly Haven loft hall backplate DSC_8629, `hero.py b` | CC0 |
| `hero/sunwall-pixel-250.png` | its dither LQIP | placeholder | `dither.py` | CC0 derivative |
| `hero/room-map.json` | object positions, bulb centres, sunbeam and copy-safe areas in % | layout data for the builder | measured | Own |
| `products/sprite-mcp-emails.png` | pixel monitor with the real MCP Emails mark on screen | draggable object, product section | Kenney `computerScreen.glb` + `_shared/products/mcp-emails/logo-mark.svg`, via `src/bake.html` | CC0 + product logo |
| `products/sprite-toolrails.png` | pixel laptop with the real Toolrails icon on screen | same | Kenney `laptop.glb` + `toolrails/icon.svg` | CC0 + product logo |
| `products/sprite-fun-libs.png` | pixel phone on a stand showing the real Fun Libs v5 icon | same | procedural three.js boxes + `fun-libs/icon.png` | Own + product logo |
| `products/sprite-harbor.png` | pixel hardcover with the real Harbor filled mark on the cover | same | procedural + `harbor/harbor-mark-filled.svg` | Own + product logo |
| `products/sprite-luma.png` | desk card with the real Luma logo (retired) | retired shelf | procedural + `luma/logo.png` | Own + product logo |
| `products/card-{mcp-emails,toolrails,harbor}-{640,1280}.*`, `card-fun-libs-{640,1000}.*` | each product photographed in its spot in the room | product section images | 2× crops of the 5120 px diorama | CC0 + Own + logos |
| `retired/{polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}.svg` | 16×16 hand-drawn pixel stand-ins | retired products list | `src/retired.mjs` | Own |
| `sprites/{archive-box,books,chair,keyboard,lamp,mouse,plant,potted-plant,radio,rug,speaker,tv}.png` | candy-recoloured pixel props | draggable furniture, retired shelf, small spots | Kenney Furniture Kit via `src/bake.html` | CC0 |
| `sprites/sprites.json` | sprite pixel sizes (6 px per art pixel) | layout | `trim.py` | Own |
| `models/*.glb` (14) | Kenney Furniture Kit 2.0 models used by the baker | re-baking sprites | https://kenney.nl/assets/furniture-kit | CC0 |
| `extras/light-leak.{webp,png}` | window light with prism fringes, transparent | Sunpath overlay | `src/pipeline/extras.py` | Own |
| `extras/dither-ramp.png`, `dither-50.png` | Bayer 8×8 tiles | section edges, hover fills | `extras.py` | Own |
| `extras/grain.png` | 128 px tileable grain | soft-light page texture | `extras.py` | Own |
| `extras/sparkle-sheet.png` | 4-frame twinkle | delight on drop or hover | `extras.py` | Own |
| `extras/cursor-grab.svg`, `cursor-grabbing.svg` | pixel hand cursors | drag-room cursors | `extras.py` | Own |
| `extras/chip-frame.svg` | 9-slice pixel chip (`border-image: … 16 fill / 12px`) | fact chips ("since 2016") | `extras.py` | Own |
| `extras/spectrum-rule.svg` | 5-colour pixel divider | section rules | `extras.py` | Own |
| `interactive/pixel-resolve.js` | `<pixel-resolve>` web component: live dither→photo resolve + prism lens (Canvas 2D) | hero | hand-written | Own |
| `interactive/drag-room.js` | `<drag-room>` web component: pick-up, spring drop, grid snap, keyboard, persistence | hero, retired shelf | hand-written | Own |
| `interactive/demo.html` | tiny demo of both | — | — | Own |
| `motion.css`, `motion.js` | motion study (see table) | site motion | Lenis 1.1.13 via jsdelivr (MIT), loaded lazily | Own |
| `preview.html` | contact sheet of everything | review | — | Own |
| `src/bake.html` | sprite baker (three.js 0.160.0, jsdelivr) | re-render sprites: `bake.html?job=all&dump=1` + `pipeline/dump.py` | — | Own |
| `src/identity.mjs`, `src/retired.mjs`, `src/og.html`, `src/pipeline/*.py` | generators for all of the above (Python needs pillow + numpy; AVIF via ffmpeg libsvtav1) | reproducibility | — | Own |

Budget: about 5.4 MB in total. Most of it is the optional 2560 px JPEG/WebP fallbacks; the AVIFs alone are under 600 KB.
