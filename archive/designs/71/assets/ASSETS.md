# Design 71 · Winter Pavilion

Asset kit for albretsen.no. Open `preview.html` (served over HTTP) for the contact sheet: every asset, the palette, the type specimen, the motion study and both live Sky Dials.

## Vision

A pink deco pavilion stands alone in a snowfield, perfectly centred, its rooftop sign spelling ALBRETSEN in spaced capitals. Behind it, golden cliffs catch the last of a low winter sun. You can drag the sun. Lift it and the snow turns white and the cliffs gold. Lower it and you pass through a pink hour where the sign and windows come on, then into a blue night with a moon and a few slow flakes. Sunset is also the site's day-to-night theme switch.

The two worlds of the brief are blended rather than quoted:
- **Wes Anderson:** every frame is symmetric and frontal. Long-lens flattening makes it feel like a miniature set. Pastel facades, matched pairs of potted conifers and lamps, deadpan signage.
- **California:** golden hills and mesas, the low flat roof and deep overhang of ranch modernism, and a coastal-highway light carried over onto Nordic snow.
- **Nordic understatement:** one building, one sun, a great deal of sky, and no slogans in the picture.

The picture is a technology company's house: a quiet place where things are made. The products are the small buildings around it, each with its own real sign. The second scene is a pastel ground station: a dish listening to the sky, for agents, APIs and connections. Nothing in it is industrial, nautical, a tourist cliché or a place name.

**Art direction: matte painting.** Real photographs (CC0 Poly Haven HDRIs) are reprojected to rectilinear views, cut along their skylines and relit. The pavilion is rendered in three.js, rendered twice (on black and on white) to recover exact alpha and shadows, then seated in the plate with a light wrap, grain and a matched grade. The same relighting model runs in Python for the baked stills and in GLSL for the live hero, so the first paint and the interactive canvas match.

### Mood words
pink hour · long shadows · miniature precision · calm · lit sign · snow crust glint · golden mesa · deadpan

### References and research
- https://www.metmuseum.org/art/collection: Hiroshige's *Evening Snow* prints (snow light, a single warm window, lots of quiet). Used as reference only; nothing was downloaded.
- https://www.visitnorway.com: winter light and aurora imagery, focal-point cropping (`crop=focalpoint`). This informed the art direction for the responsive crops (building-centred and bottom-anchored on phones).
- https://www.sezane.com and https://www.godly.website: on the brief, but neither could be fetched (HTTP 403 and DNS failure).
- Poly Haven HDRI catalogue via its public API (`api.polyhaven.com/assets?t=hdris`), filtered for snow, winter and mountain sunsets. Salt `fda351` picked from the sorted shortlist: index f→`kiara_2_sunrise` (rejected, the sun was in frame), d→`winter_river`, a→`snowy_field`, 3→`kiara_8_sunset` (used), 5→`passendorf_snow`. `stierberg_sunrise` (pink low-sun snow) and `rolling_hills` (golden hills) were added by eye.
- Cliff May and California ranch-house history (low, ground-hugging, deep eaves): https://en.wikipedia.org/wiki/Cliff_May, https://www.laconservancy.org/architects/cliff-may
- Miami Beach deco signage (hand-lettered capitals, neon on the roofline): https://www.miaminewtimes.com/?p=40464861, https://www.smashingmagazine.com/2010/09/hotel-and-restaurant-signs-part-1/
- Layered parallax technique: https://keithclark.co.uk/articles/pure-css-parallax-websites/demo3/, https://medium.com/@PatrickWestwood/how-to-make-multi-layered-parallax-illustration-with-css-javascript-2b56883c3f27, https://github.com/ethapar/frostpunk-tutorial
- Theme toggles with View Transitions: https://21st.dev/@arunachalam/components/animated-theme-toggler.md, https://codemyui.com/day-night-toggle-switch-animation/

## Palette

| Token | Hex | OKLCH | Use |
|---|---|---|---|
| Flamingo | `#EE8FA6` | oklch(75.5% 0.118 4.6) | accent, the pavilion, focus rings, the sun dot |
| Shell | `#F7D3DA` | oklch(89.9% 0.041 4.8) | soft panels, plaques |
| Mint | `#A6DCC6` | oklch(85.1% 0.064 167.9) | the entrance tower, secondary accent |
| Sky | `#9CC8EA` | oklch(81.3% 0.067 241.8) | window frames, tertiary accent |
| Snow | `#FBF7F2` | oklch(97.8% 0.008 73.7) | day background, type on images |
| Cream | `#F4EADB` | oklch(94.1% 0.023 78.2) | paper surfaces |
| Sunlamp | `#FFE3B0` | oklch(92.7% 0.072 82.4) | lamps, the sun, night accent |
| Alpenglow | `#D9907F` | oklch(72.3% 0.093 33.7) | cliffs at the pink hour (illustration only) |
| Conifer | `#2F5D4E` | oklch(44.1% 0.057 170.3) | clipped trees (illustration only) |
| Dusk | `#4C5C95` | oklch(48.8% 0.094 270.7) | upper sky at dusk, links on night |
| Ink | `#22304F` | oklch(31.3% 0.059 264.8) | text, the mark |
| Night | `#18223F` | oklch(25.9% 0.056 268.0) | night background |

Day theme: Snow background, Ink text. Night theme: Night background, Snow text, Sunlamp accent. Contrast: Ink on Snow is 12.3:1 and Snow on Night is 14.7:1. Flamingo is for decoration and large type only (2.2:1 on Snow).

## Typefaces (all SIL Open Font License, self-hosted woff2, latin subset)

| Role | Face | File | Notes |
|---|---|---|---|
| Signage and headings | **Jost** (variable 100–900, Futura-like) | `fonts/jost-var-latin.woff2` | Weight 500, uppercase, `letter-spacing: .3–.34em`. The rooftop sign and the wordmark use it. |
| Voice | **Instrument Serif**, regular and italic | `fonts/instrument-serif-*.woff2` | Italic for one-line statements and product lines |
| Labels and code | **IBM Plex Mono** 400/500 | `fonts/ibm-plex-mono-*.woff2` | 10.5–12px, uppercase, `.14–.3em` tracking. Use it for figures, dates and the MCP command. |
| Body | Jost 400 | as above | 17–19px, line-height 1.6 |

Source: Google Fonts (fonts.gstatic.com), OFL.

## Performance notes for the builder
- Hero first paint: `<picture>` with `img/hero-pinkhour-*` (AVIF 10 KB at 640 px, 30 KB at 1280 px, 102 KB at 2560 px; WebP and JPEG fallbacks). `width`/`height` are always set, so layout shift is 0. Phones (aspect below 41/50) get `hero-pinkhour-phone-*`, which is bottom-anchored with the building whole, the same framing Sky Dial uses on phones.
- `img/lqip.json` holds 24 px WebP data-URIs for blurred placeholders.
- Then lazy-load `interactive/sky-dial.js` (about 12 KB) plus four layers per scene (about 230 KB). Fade the canvas in over the still with `transform: scale(1.031)` on the still to match the canvas's 3% overscan (see `interactive/demo.html`). Sky Dial throws when WebGL2 is missing, and the still then simply stays.
- Fonts: preload Jost only, and use `font-display: swap` everywhere.

## Inventory

| File | What | Intended use | Source (how it was made) | Licence |
|---|---|---|---|---|
| `identity/mark.svg` | Mark: arched window, sun on the horizon, three snow lines | header, footer, favicon base | hand-written SVG (`src/identity.py`) | original, owned by Albretsen AS |
| `identity/mark-night.svg` | Mark for dark backgrounds | night theme | same | original |
| `identity/favicon.svg`, `favicon-32.png` | Favicon on an Ink tile | `<link rel=icon>` | SVG, PNG via rsvg-convert | original |
| `identity/apple-touch-icon-180.png` | 180 px touch icon | `apple-touch-icon` | rsvg-convert | original |
| `identity/wordmark.svg` / `-currentcolor.svg` / `-snow.svg` | ALBRETSEN │ AS in Jost 500 at .34em, as outlines | nav and footer; `currentColor` version for theming | glyph outlines extracted with fontTools | original, using OFL glyph outlines |
| `identity/lockup.svg` | Mark and wordmark | footer, documents | same | original |
| `identity/og-image.jpg` | 1200×630 Open Graph image | `og:image` | crop of the pink-hour master with the wordmark and line set | original + CC0 plates |
| `img/hero-pinkhour-{640,1280,1920,2560}.{avif,webp,jpg}` | **Hero A, pink hour** (main hero still) | hero first paint | matte painting: plates from `kiara_8_sunset` and `stierberg_sunrise`, three.js pavilion, Python grade (`src/compose.py`, h = −0.06) | CC0 plates + original render |
| `img/hero-pinkhour-phone-{720,1152}.*` | Hero A as a 9:16 phone frame | phones | same, bottom-anchored with the sky extended | same |
| `img/hero-day-*` (and `-phone-*`) | Hero A in low winter sun (h = 0.20) | day-theme alternative, about section | same | same |
| `img/hero-night-*` (and `-phone-*`) | Hero A at night, windows and sign lit, moon | night theme first paint | same | same |
| `img/ground-station-*` | **Hero B**: pastel ground-station dish on a snow plain below golden hills | second scene (work, agents, contact) | plates from `rolling_hills` and `stierberg_sunrise`, three.js dish | CC0 + original |
| `img/lqip.json` | 24 px placeholders | blur-up | Pillow | — |
| `products/mcp-emails-{800,1600}.{avif,webp}`, `-1200.jpg` | MCP Emails: a sky-blue streamline kiosk carrying the real `logo-wordmark.svg` on its fascia, in morning light | product card | three.js render with the real logo as a texture, composited onto a `kiara_8_sunset` and `stierberg_sunrise` plate | logo © Albretsen AS (unchanged); plates CC0 |
| `products/fun-libs-*` | Fun Libs: a flamingo stepped-parapet booth with the real `icon.png` (v5) as a lit rooftop sign, pink hour | product card | same | same |
| `products/toolrails-*` | Toolrails: a mint ranch-modern pavilion, deep overhang, the real `icon.svg` on the fascia, low sun | product card | same, `rolling_hills` plate | same |
| `products/harbor-*` | Harbor (paused): a cream gable house, the real `harbor-wordmark.svg` sign, blue hour with the lamps on | product card | same | same |
| `products/retired/luma.svg` | Enamel plaque carrying Luma's real `logo.png` (embedded unchanged) | retired list | SVG | logo © Albretsen AS |
| `products/retired/{polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}.svg` | Enamel-plaque stand-ins in the house style (name, glyph, year, "retired") | retired list | hand-written SVG, Jost outlines | original |
| `extras/stamp.svg` | Perforated stamp with a vector miniature of the pavilion | footer, about, 404 | SVG | original |
| `extras/sun-path.svg` | Solar altitude through the day at 59.9° N for midwinter, equinox and midsummer (computed) | about section: "why the sun is always low here" | computed in Python from the solar declination | original |
| `extras/deco-fan-tile.svg` | Seamless 80 px deco fan tile | background for quotes and empty states | SVG | original |
| `extras/speed-lines.svg` | Divider: sun dot over three lines | section breaks | SVG | original |
| `extras/paper-grain.webp` | 512 px seamless paper grain, centred near white | `mix-blend-mode: multiply` overlay | procedural noise (numpy, wrap-around blur) | original |
| `extras/snow-edge.webp` | Real snow crest strip, transparent above | bottom edge of the hero and section dividers | cut from the snow plate | CC0 |
| `extras/pavilion-cutout.webp`, `ground-station-cutout.webp` | Transparent cut-outs of the two buildings | small illustrations, 404, the blog index | from the alpha-recovered renders | original |
| `extras/rooftop-sign.svg` | ALBRETSEN sign on four posts, `currentColor` | page header ornament, a lit sign at night | Jost outlines | original |
| `interactive/sky-dial.js` | **Sky Dial**: a WebGL2 compositor. Drag the sun (or use the arrow keys) to relight the scene, and it emits `skydial:change` with the theme. Has phone framing, a mip-bloom glow, stars, a moon, snow glints and scroll/pointer parallax. | hero | hand-written GLSL/JS, no dependencies | original |
| `interactive/layers/{pavilion,station}-{far,snow,building}.webp`, `-glow.jpg` | Ungraded daylight layers for the dial (1920×1080) | loaded by sky-dial.js | `src/export.py` | CC0 + original |
| `interactive/demo.html` | Minimal demo: still, then canvas, then a theme toggle | reference implementation | — | — |
| `motion.css`, `motion.js` | Motion study (see below) | site-wide | hand-written | original |
| `preview.html` | Contact sheet | review | — | — |
| `src/*.py`, `src/pavilion.html` | Reproducible pipeline: reprojection, sky segmentation, alpha recovery, grading, export, identity, extras | rebuilding or extending | three.js 0.169.0 (jsDelivr, MIT) for the build page only | MIT / original |

### Third-party sources

| Source | URL | Licence |
|---|---|---|
| Poly Haven HDRI `kiara_8_sunset` (tonemapped JPG) | https://polyhaven.com/a/kiara_8_sunset | CC0 |
| Poly Haven HDRI `stierberg_sunrise` | https://polyhaven.com/a/stierberg_sunrise | CC0 |
| Poly Haven HDRI `rolling_hills` | https://polyhaven.com/a/rolling_hills | CC0 |
| Jost, Instrument Serif, IBM Plex Mono | https://fonts.google.com | SIL OFL 1.1 |
| three.js 0.169.0 (build page only, not shipped) | https://cdn.jsdelivr.net/npm/three@0.169.0/ | MIT |
| Product logos | `designs/_shared/products/` | © Albretsen AS, used unchanged |

## Motion study (`motion.css` + `motion.js`)

1. **Lens Shift.** Slow cinematic parallax through the matte layers: sky (depth .15), cliffs (.35), snow (.7) and building (.75) each drift at their own rate as the hero leaves the viewport, with a 3% overscan so no edge shows. It uses CSS scroll-driven animations (`animation-timeline: view()`) and falls back to `lensShift()`. Sky Dial applies the same depths in its shader. Researched from Keith Clark's pure-CSS parallax (translateZ depth) and the layered landscape header technique popularised by the Firewatch site.
2. **Sign Warm-up.** Spaced capitals light one by one (90 ms apart with a small deterministic jitter), then gain a soft pink glow, like a rooftop sign warming up at dusk. It plays once. `signWarmup(el)`.
3. **Iris.** The day/night switch runs as a View Transition whose new state opens as a circle from the sun's position, like the classic film iris. `iris(applyFn, x, y)`. It degrades to an instant switch.
4. **Tracking Shot.** On desktop, product postcards slide sideways along one line while the page scrolls vertically: a lateral dolly past a row of facades. `trackingShot(section)`. Under reduced motion it becomes a plain horizontal scroller.
5. **Snow Hush.** About 60 slow flakes, only at night and only in the hero. It pauses off screen. `snowfall(canvas)`.

Shared: `.ms-rise` is a single 12 px rise and fade on entry. All five are disabled under `prefers-reduced-motion`. The easing tokens are `--ease-dolly` and `--ease-iris`.

## Notes and caveats
- The pavilion's sign reads ALBRETSEN. It is the studio's own building, not a hotel, so keep copy away from hospitality words.
- Hero B's left horizon has two small rock spires from the source photo. They are real, and they are kept.
- Any colour change belongs in `src/compose.py` and the matching block in `sky-dial.js`, so the stills and the dial stay in sync.
