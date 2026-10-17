# Design 73 · Long Evening

Asset kit for Albretsen AS / albretsen.no. Open `preview.html` (served over HTTP from the repo root) to see everything, including the motions and the live scene.

## Vision

One horizon and one main street, seen from a meadow at the edge of a small Norwegian town in late summer. Falu red and ochre wooden houses stand between sun-bleached pastel Art Deco fronts in mint, flamingo pink and cream. A cliffed plateau and a sharp peak sit behind a spruce ridge. The day passes over it: peach sunrise, crisp white noon, a sun that sets on the plateau, and a light summer night with every window lit. The sky never quite gets dark.

The art direction is the 1930s silkscreen travel poster, reinterpreted. The scene is built in three.js from primitives and rendered flat, with toon shading and banded airbrush skies. Each still then gets a print pass that uses real ink-and-paper grain lifted from a public-domain WPA poster scan. The result reads as printed, not as 3D. There are no tourist clichés, no place names and no palm trees. The street is the company: every live product has a shopfront, with its real logo on the sign.

**Signature delight.** The sky follows the real sun over Norway. `interactive/sun.js` computes the solar elevation and azimuth for Norwegian time, and the site's `--sky-*` colours, the live 3D street and the `<sky-clock>` widget all follow it. A visitor at 23:00 in June sees a blue-hour street with lit windows. At noon they see bleached pastels.

**Personality:** sun-drunk optimism, said quietly. Use one strong image per screen, generous paper margins, rounded type and no clutter.

### Mood and references

- WPA Federal Art Project posters (Library of Congress / Wikimedia Commons), especially "See America" (LCCN 98518589): its flat ink planes, airbrushed skies and dry-brush spatter edges. https://commons.wikimedia.org/wiki/File:See_America_LCCN98518589.jpg
- "The national parks preserve wild life" (LCCN 98518597): a single orange-to-yellow gradient sky behind layered, hazed ranges. https://commons.wikimedia.org/wiki/File:The_national_parks_preserve_wild_life_LCCN98518597.jpg
- "The drama of the heavens" (LCCN 98508993): a night-sky poster palette. https://commons.wikimedia.org/wiki/File:The_drama_of_the_heavens-Adler_Planetarium,_operated_by_Chicago_Park_District_LCCN98508993.jpg
- Chateau Marmont, https://www.chateaumarmont.com: one poster image, an almost empty page, and confidence through restraint.
- Stripe Sessions, https://stripesessions.com: a single full-bleed hero image that carries the brand, and an image swap for mobile.
- Cosmos, https://www.cosmos.so: imagery-first layout with quiet UI around it.
- The Met open access collection, https://www.metmuseum.org/art/collection: reference only for the travel-poster genre. No Met files are used.
- Salt `c3ed7f` → hex digits 12, 3, 14, 13, 7, 15 were used to pick Commons search results, which led to the three WPA posters above (results 12, 3 and 14).

## Palette

| Name | Hex | OKLCH | Use |
|---|---|---|---|
| Peach | `#f6b48f` | oklch(82.3% 0.092 50.3) | sky glow, sun, accents |
| Mauve | `#b391a8` | oklch(69.5% 0.052 338.3) | far ranges, dusk |
| Smog blue | `#7e8fb0` | oklch(64.8% 0.053 263.6) | zenith, roads, shadows |
| Palm black | `#1d1f24` | oklch(23.9% 0.010 268.3) | ink, text, roofs (never pure black) |
| Paper | `#fbf5ec` | oklch(97.2% 0.014 78.3) | background, trim (never pure white) |
| Falu red | `#9e3b2e` | oklch(48.9% 0.135 30.1) | wooden houses, primary action |
| Ochre | `#d39a45` | oklch(72.5% 0.122 74.5) | wooden houses, birch leaves |
| Mint | `#a9dcc6` | oklch(85.3% 0.061 166.7) | deco facades |
| Flamingo | `#f2a7b4` | oklch(80.4% 0.090 7.9) | deco facades, bakery awning |
| Butter | `#f4dc8e` | oklch(89.7% 0.101 92.9) | small houses, highlights |
| Blue hour | `#2f3a60` | oklch(35.8% 0.068 270.5) | night sky, dark UI |
| Meadow | `#c4b877` | oklch(77.8% 0.086 99.0) | foreground, late summer |

The page background in the preview is `#f3eadc` (warm paper). The live sky palette (zenith, horizon, glow, sun, ambient) is keyed by solar elevation in `interactive/sun.js` → `skyPalette()`.

## Type

- **Nunito** (variable, wght 200–1000, roman and italic). It's a Californian-feeling rounded sans: sunny, soft and very legible. It's self-hosted as Latin subsets: `fonts/Nunito-latin.woff2` (38 KB) and `fonts/Nunito-Italic-latin.woff2` (41 KB). SIL OFL 1.1, see `fonts/OFL.txt`. Source: https://github.com/google/fonts/tree/main/ofl/nunito
- Headlines: 800–900, tracking −0.025 to −0.04em, line-height 0.95–1.05.
- Body: 500, 16–18 px, line-height 1.55. Numbers use tabular figures (`font-variant-numeric: tabular-nums`).
- Eyebrows: 800, 12 px, uppercase, +0.14em.
- The wordmark is outlined from Nunito 800, so it doesn't need the font file.

## Identity

The **sun-A** is a rounded A whose crossbar is a horizon, with a peach sun half risen inside it. In the lockup, the mark is the first letter of "Albretsen".

## Inventory

All sizes are on disk. The folder total is about 4.2 MB (budget 8 MB).

| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| `identity/mark.svg` | Sun-A mark, palm + peach | header, avatar | Drawn by hand as SVG paths for this kit | Client-owned |
| `identity/mark-mono.svg` | Mark in `currentColor` | single-colour uses, footers | Same | Client-owned |
| `identity/wordmark.svg` | "Albretsen AS", plain A | text-only contexts | Nunito 800 outlined with fontTools (`pipeline/identity.py`) | OFL glyphs, client-owned artwork |
| `identity/lockup.svg` | Sun-A + "lbretsen AS" | main logo | Same | Client-owned |
| `identity/lockup-light.svg` | Lockup in paper colour | over night stills, dark UI | Same | Client-owned |
| `identity/favicon.svg` | Cream A, peach sun, palm tile | favicon | Same | Client-owned |
| `identity/favicon-180.png` | 180 px touch icon | apple-touch-icon | rsvg-convert from favicon.svg | Client-owned |
| `identity/og-1200x630.jpg` | Sunset still, lockup, line | Open Graph / social card | Composited in Pillow from the graded sunset still | Client-owned |
| `hero/street-{sunrise,noon,sunset,night}-{800,1440,2400}.avif` | The street at 07:00, 13:30, 20:15 and 23:45, 16:9 | hero, Long Dissolve layers | three.js scene (`interactive/street.js`) baked with headless Chrome, then poster-graded (`pipeline/poster-grade.py`) | Client-owned. The grain derives from a PD scan |
| `hero/street-*-{800,1440}.webp`, `hero/street-*-1440.jpg` | Same stills, fallbacks | `<picture>` fallbacks | Same | Same |
| `hero/street-*-portrait-{640,1080}.avif`, `-640.webp`, `-720.jpg` | 4:5 art-directed crops with a tall sky | mobile hero (`media="(max-aspect-ratio: 4/5)"`) | Same scene, portrait camera | Same |
| `products/mcp-emails-*` | Cream deco shopfront with the real MCP Emails wordmark on an enamel fascia, 09:30 | product card / page header | three.js scene, real logo `_shared/products/mcp-emails/logo-wordmark.svg` as a texture, unchanged | Client-owned |
| `products/fun-libs-*` | Falu red bakery with the real Fun Libs icon as its hanging sign, 13:30 | product card | Same, `_shared/products/fun-libs/icon.png` | Client-owned |
| `products/toolrails-*` | Flamingo deco tower with the real Toolrails icon on a blade sign, 20:15 | product card | Same, `_shared/products/toolrails/icon.svg` | Client-owned |
| `products/harbor-*` | White wooden house at night, real Harbor wordmark on a board, windows lit | product card (paused) | Same, `_shared/products/harbor/harbor-wordmark.svg` | Client-owned |
| `products/retired/*.svg` | Enamel house-number plaques for Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring and the early apps | retired list | Drawn as SVG for this kit (no brand assets survive). Luma uses its real `_shared/products/luma/logo.png` | Client-owned |
| `extras/paper-grain.png` | 512 px tileable grain, neutral grey 128 | full-page overlay with `mix-blend-mode: soft-light` | High-pass of flat ink and paper areas from the "See America" WPA scan, quilted into a tile | Public domain source (WPA, LoC via Wikimedia Commons, LCCN 98518589) |
| `extras/drybrush-crown.png` | Dry-brush tree crown with branches, as an alpha mask | CSS `mask-image` for organic reveals and image edges | Colour-keyed from the same WPA scan | Public domain source |
| `extras/horizon-divider.svg` | Horizon, half sun, speed lines | section rule | Drawn for this kit | Client-owned |
| `extras/pattern-clapboard.svg` | Standing-board tile | background over falu red or ochre | Drawn for this kit | Client-owned |
| `extras/pattern-speedlines.svg` | Deco cornice lines, `currentColor` | repeat-x edge trim | Drawn for this kit | Client-owned |
| `extras/window-lit.svg` | Two-light sash window with glow | status ("lights on"), Lights On motion | Drawn for this kit | Client-owned |
| `extras/cutout-lamp-birch.svg` | Street lamp and birch cut-out | margins, footer | Drawn for this kit | Client-owned |
| `interactive/street.js` | The whole street as a live three.js module (sky shader, ridges, houses, signs, lights) | live hero after first paint, product views | Written for this kit, three.js r170 via jsDelivr import map (pinned `three@0.170.0`) | Client-owned. three.js is MIT |
| `interactive/sun.js` | Solar position, Norwegian clock, sky palette, `paintSky()` | Sky Sync, the signature delight | Written for this kit (NOAA low-precision formulae) | Client-owned |
| `interactive/sky-clock.js` | `<sky-clock>` element: today's sun path over Norway, the twilight band, a dot for now | footer or header widget | Written for this kit, no dependencies | Client-owned |
| `interactive/index.html` | Live demo: baked still first, 3D fades in when idle, time scrubber, Now button | demo | Written for this kit | Client-owned |
| `interactive/bake.html` | Bakes any still: `?t=HH:MM&view=street\|portrait\|mcp-emails\|fun-libs\|toolrails\|harbor&signs=1` | art pipeline | Written for this kit | Client-owned |
| `motion.css`, `motion.js` | Four signature motions + Sky Sync | site motion | Written for this kit | Client-owned |
| `pipeline/poster-grade.py`, `pipeline/identity.py` | The print pass and the identity generator (Python 3, Pillow, numpy, fontTools) | reproduce or extend the kit | Written for this kit | Client-owned |
| `fonts/*` | Nunito Latin subsets + licence | site type | google/fonts, subset with pyftsubset | SIL OFL 1.1 |
| `preview.html` | Contact sheet | review | Written for this kit | Client-owned |

## Using the hero (performance)

- First paint: `<picture>` with the AVIF set (800/1440/2400 w; the 1440 file is about 60 KB) and a 1440 JPEG fallback. Give it `width="1440" height="810"` (or `aspect-ratio: 16/9`) so there is no layout shift. On narrow portrait screens, use the `-portrait` set with `media="(max-aspect-ratio: 4/5)"`.
- Pick the still that matches Norway now: `pickStill()` in `motion.js` returns `sunrise | noon | sunset | night`.
- Only after first paint, and when idle, import `interactive/street.js`, render one frame, and cross-fade the canvas over the still (see `interactive/index.html`). Skip the WebGL on `prefers-reduced-motion` or `saveData` and keep the matching still. three.js is about 170 KB gzipped and must never block first paint.
- `paintSky()` is only a few hundred bytes of work and can run inline. It drives `--sky-zenith`, `--sky-horizon`, `--sky-glow`, `--sky-sun`, `--sky-night` and `--sky-ink`.

## Motion study

The motions are deliberately slow, and nothing bounces. They are defined in `motion.css` and driven by `motion.js` (`initMotion()`). All of them stop under `prefers-reduced-motion`.

1. **Long Dissolve** (`.ld-scroll > .ld-stack > .ld-layer[style="--i:n"]`). This is the hero concept: one horizon that scrolls from sunrise to the light night. Four baked stills sit in a sticky stack. Scroll progress `--p` (from a CSS view timeline where supported, otherwise `motion.js`) makes each upper still fade *in* over the one below, so only two stills ever mix and the background never flashes through. Each still also settles from scale 1.04 to 1 as it arrives. `.ld-auto` is a time-based variant, used in the preview masthead. The pattern comes from full-bleed scroll crossfades such as Framer's "Scroll Slideshow" component (https://www.framer.com/marketplace/components/scroll-slideshow/: full-viewport images that crossfade per section with a slight zoom) and from Apple-style sticky scroll sequences. The easing advice (eased, not linear) is from Cloudinary's fade guide (https://cloudinary.com/guides/image-effects/javascript-fade-images).
2. **Ink Settle** (`.ink-settle`). A headline arrives with its peach "second ink" offset by 14 px, which settles to a 2 px misregistration while the letters rise and un-blur in a 32 ms stagger. The reference is the off-register second colour on the WPA silkscreens. The letter stagger follows the per-letter stagger used in kinetic type headers (for example the GSAP stagger docs, https://gsap.com/docs/v3/Staggers/), done here in plain CSS.
3. **Lights On** (`.lights-on [data-glass]`). Windows warm up one by one, each with a short stepped tungsten flicker followed by a slow breathing glow. The trigger is the real Norwegian sky (`elevation < 1°`), or `data-on="view"` to trigger on scroll into view. This is the evening in the street, and the product cards can use it too: Harbor's windows stay lit.
4. **Sun Track** (`.sun-track .sun`). A sun disc rides an `offset-path` arc as its section scrolls (`--p`), coloured by the live `--sky-sun` and `--sky-glow`. Use it beside the timeline or the "since 2016" history. The technique is CSS motion path (MDN `offset-path`), as used for scroll-tied illustration on Stripe's marketing pages.
- **Sky Sync** (`skySync()`) repaints the `--sky-*` custom properties from the real sun once a minute, with a 4 s linear transition. It underlies all of the motions above.

## Notes for the builder

- The real product logos are used unchanged as textures. The MCP Emails wordmark falls back to `system-ui` because the SVG references Geist. If Geist is loaded on the page, re-bake with it for a pixel-identical sign.
- The sky disc's azimuth is compressed toward north (`rel * 0.12` in `street.js`), so sunrise always sits right of the notch and sunset on the plateau. This is poster licence. The light direction itself is physically correct.
- Keep copy free of place names. The atmosphere does the work.
