# 87 · Totality: asset kit

Open `preview.html` (served over http) to see the contact sheet. It plays the intro, shows the palette and type, runs every animation, and shows the live corona shader with the aperture cursor.

## Vision

**An archive of light.** Albretsen AS is presented as a drawer of astronomical plates. The source images are É. L. Trouvelot's chromolithographs from the 1870s and 1880s (public domain). Each is re-inked as a duotone on hue 324: *umbra* ink and *corona* light. Every product is an observation, mounted on corona-pink paper and captioned in quiet caps, the way a museum would catalogue it. The site opens on a total eclipse. The moon is the aperture everything is seen through, and the diamond-ring bead is the one point of glow on each screen.

- **Personality:** scientific calm. It is precise and unhurried, with no exclamation and nothing that bounces. The skill shows through restraint: one very good image, perfectly set type, and a shader you only notice once it is already moving.
- **Spark words:** *glow* (the bead, the corona, the develop-from-light), *fracture* (light splits into the two inks on fast pointer moves and on headline arrival), *aperture* (the moon disc, the iris cursor, the clip-path scene changes, the f-stop divider).
- **Why it fits the client:** this round's feedback said that real imagery, light and craft work, but costume does not. Here the imagery is real 19th-century observation. The subject stays technology: observation, instruments, precision. There is no storybook, no travel and no finance. The palette is one hue only, so it never gets crowded.
- **Cinematic intro (hero concept):** black screen. A hairline ring is traced like an instrument calibrating. The diamond-ring bead ignites. The plate *develops*, brightest light first, through the shader. "Albretsen" settles out of a two-ink fracture. Nav and captions arrive last. The whole sequence takes about 4.5 s and is skippable. It runs once per session and is skipped under reduced motion. The final frame *is* the page, so nothing has to transition away.

### Reference URLs (researched)
- https://www.apple.com/macbook-pro/ : hero start-frame → end-frame resolve, where the product is the protagonist and the copy waits.
- https://godly.website (now recent.design) and https://www.cssdesignawards.com : survey of current WebGL intros, chromatic headline reveals and custom cursors.
- https://www.awwwards.com/inspiration/webgl-intro-section-pura-pharma : a WebGL intro section that resolves into the page.
- https://www.awwwards.com/inspiration/cinematic-transitions-soul-aether : cinematic scene transitions.
- https://instagit.com/emilkowalski/skills/how-clip-path-enables-advanced-ui-animations/ : clip-path reveals are compositor-only, which is the basis for `iris()`.
- https://publicdomainreview.org/collection/the-trouvelot-astronomical-drawings-1882 : the source collection and its context.
- https://remotion.dev/docs/effects/duotone and https://webgpufundamentals.org/webgpu/lessons/webgpu-1dlut.html : the luminance → gradient-map duotone technique used in grading and in the shader.
- Salt `ad087c`: in the Commons search for Trouvelot, results a(10), d(13), 0, 8, 7 and c(12) were opened. They gave sunspots, total eclipse, the Great Comet (two copies), Jupiter and the November Meteors. The eclipse became the hero, and the comet and sunspots became product plates.

## Palette (duotone, hue 324, OKLCH)

All colours sit on one hue. Chroma peaks in the upper mid-tones, the way magenta ink overprints black.

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| void | oklch(.13 .03 324) | #0d040e | page background, shader black |
| **umbra** (ink) | oklch(.17 .045 324) | #19081a | text on paper, tiles, the moon |
| dusk | oklch(.24 .06 324) | #2d142f | raised dark surfaces, chart grid |
| plum | oklch(.36 .09 324) | #542a57 | secondary text on paper, penumbra |
| magenta | oklch(.52 .15 324) | #914599 | italic accents on paper (AA on corona at 24px+) |
| **glow** | oklch(.68 .17 324) | #ca6fd3 | the bead, italic accents on dark; use sparingly, one per screen |
| halo | oklch(.80 .11 324) | #e1a5e6 | ring strokes on dark, "AS" |
| blush | oklch(.90 .05 324) | #efd3f1 | secondary text on dark |
| **corona** (paper) | oklch(.955 .022 324) | #f8ebf9 | light sections, plate mounts |
| paper | oklch(.985 .008 324) | #fdf8fd | primary text on dark, highlights |
| muted | oklch(.62 .03 324) | #908091 | mono captions on dark |

Images use the same ramp: `grade.py` builds a 256-step LUT from L .10 → .985 with a chroma bump of max .14 at t = .45, and the hue sweeps ±14° around 324 so the shadows lean violet and the highlights lean rose.

## Typefaces (all SIL OFL 1.1, vendored as latin-subset woff2 in `fonts/`)
- **Instrument Serif** Regular and Italic: display, names and plate titles. The wordmark is outlined from it, set with HarfBuzz kerning.
- **Geist** (variable 100–900): body text at 16–18 px.
- **Geist Mono** (variable): plate numbers, captions, the cursor readout and code. Use 10–11 px, uppercase, with +0.16em tracking.
- Sources: https://github.com/google/fonts/tree/main/ofl/instrumentserif , https://github.com/google/fonts/tree/main/ofl/geist , https://github.com/google/fonts/tree/main/ofl/geistmono

## Builder notes
- **LCP and layout shift:** the hero is a `<picture>` element. It serves AVIF and WebP at 960, 1600 and 2560, a portrait art-direction crop at 750 and 1200, and a JPEG fallback at 1600. Every image has width and height set. `corona.js` loads only after idle and draws over the same frame, so the switch is invisible. The shader's disc geometry (`{x:.497, y:.494, r:.152}`) matches `hero/totality-*`. `hero/totality-intro-*` is the baked develop state, for use as a poster or a reduced-data fallback.
- **Initial weight:** the HTML, two woff2 files (about 43 KB), `totality-1600.avif` (51 KB) and `motion.js` come to well under 300 KB. Load the shader (11 KB), the cursor and everything below the fold afterwards.
- **Product plates:** the logos are composited unchanged at their original colours. Only Harbor's `currentColor` was set to umbra ink, since that is what the asset's own design allows.
- **Retired products:** each gets a waning-moon roundel, where the phase grows with how long ago the product set. Luma also has `retired/luma-card.png`, which shows the real Luma logo beside its roundel.
- **Copy:** use the facts in `designs/_shared/content.js` only. The plate captions use them ("Observed 2026", "Veiled, 2026" for paused Harbor, "In construction" for building).

## Motion study (`motion.js` + `motion.css`, Web Animations API only)
| # | Name | What | Researched from |
|---|---|---|---|
| 1 | **totality** | The intro: a ring is traced, the bead ignites, the plate develops (shader `play()`), the name fractures in, and the chrome arrives last. About 4.5 s, run once. | Apple MacBook Pro hero start/end frame; Awwwards WebGL intro sections |
| 2 | **develop** | Images arrive highlights-first, like a print in the developer tray: a brightness/contrast/saturate ramp plus a 1.5% scale settle, over 1.6 s. Triggered on view through `developOnView()`. | Darkroom process; Apple's scroll reveals |
| 3 | **fracture** | Headline glyphs arrive split into glow and paper offset copies (text-shadow) and converge to one ink, staggered centre-out. | Chromatic-aberration headline reveals (godly / CSSDA entries), restricted to two inks |
| 4 | **iris** | Scene change: a clip-path circle opens from a point, such as the click or the disc. | Emil Kowalski's clip-path notes |
| 5 | **rakingLight** | On hover, a sheen of corona light passes across a plate from the side the pointer entered. | Tilting a lithograph under a lamp; product-card sheens |
| 6 | corona-breath (CSS) | Idle glow pulse on the bead or nav mark, 5.2 s. | |
| 7 | trace (CSS) | Hairlines, rings and orbits draw themselves via `pathLength="1"`. | |

Easing tokens: `exposure` cubic-bezier(.16,1,.3,1), `shutter` (.7,0,.2,1), `drift` (.33,0,.2,1). Every function respects `prefers-reduced-motion`.

## Signature delight: the aperture cursor (`interactive/cursor.js`)
The cursor is a seven-blade iris with the corona bead at 45°, drawn with `mix-blend-mode: difference`. Over links the blades close to f/8 and a Geist Mono readout names the target (set `data-cursor` to override it). Over text it narrows to a slit. A press triggers a 220 ms shutter blink. It runs only for fine pointers and has no lag or blink under reduced motion.

## Interactive / 3D: `interactive/corona.js` (+ `corona-demo.html`)
This is a raw WebGL1 fragment shader of about 11 KB with no dependencies. It renders the real eclipse plate and adds:
- a luminance-threshold **develop** driven by `intro` (0 → 1)
- the igniting **diamond-ring bead** with a hairline flare
- streamers that **breathe** slowly (seamless polar fBm)
- a **fracture** on fast pointer moves: offset copies of the light are re-inked as glow and paper, so the image stays duotone
- **moon parallax**, a portrait pull-back with edge fade, a DPR cap of 1.5, and a pause when off-screen

The demo takes `?intro=0..1`, `?fracture=0..1` and `?clean`.

## Inventory

| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| identity/mark.svg | Diamond-ring mark: the moon disc, a corona ring broken by an aperture gap, and a bead | logo on light | hand-authored SVG | own work |
| identity/mark-on-dark.svg | Same mark, inverted for dark backgrounds | nav on dark | hand-authored SVG | own work |
| identity/wordmark.svg, wordmark-on-dark.svg, wordmark-type-only.svg | "Albretsen" in Instrument Serif plus a Geist Mono "AS", outlined to paths | header, footer, documents | fontTools + HarfBuzz outlines (identity.py) | own work; fonts OFL |
| identity/favicon.svg | Mark on an umbra tile | favicon | hand-authored SVG | own work |
| identity/apple-touch-icon-180.png, icon-512.png | Raster favicons | touch icon, manifest | rsvg-convert from favicon.svg | own work |
| identity/og-1200x630.jpg | Eclipse with wordmark and line | Open Graph / social | composite of hero + wordmark (identity.py) | derived from PD plate |
| hero/totality-{960,1600,2560}.{avif,webp} + totality-1600.jpg | Total eclipse plate, duotone, extended to 16:9 | main hero (LCP) | Trouvelot, *Total eclipse of the sun* (1878). https://commons.wikimedia.org/wiki/File:Trouvelot_-_Total_eclipse_of_the_sun_-_1878.jpg (NYPL TROUVELOT_003), graded by grade.py/heroes.py | Public domain |
| hero/totality-portrait-{750,1200}.{avif,webp} + 750.jpg | 4:5 crop | phone hero | same | Public domain |
| hero/totality-intro-{960,1920}.{avif,webp,jpg} | Baked shader frame at develop 0.42 | intro poster, reduced-data fallback | headless Chrome render of corona.js | derived from PD |
| hero/aurora-{960,1600,2560}.{avif,webp} + 960/1600 jpg | Aurora borealis, deep sky with glowing rays | second-scene hero ("now" / products intro) | Trouvelot, *Aurora Borealis* (1872). https://commons.wikimedia.org/wiki/File:Trouvelot_-_Aurora_Borealis_-_1872.jpg (NYPL TROUVELOT_004) | Public domain |
| hero/aurora-portrait-{750,1200}.{avif,webp} + 750.jpg | 4:5 crop | phone | same | Public domain |
| hero/comet-{800,1400}.{avif,webp} + 800.jpg | Great Comet of 1881 over an observatory, lit window | about / story section | Trouvelot, *The great comet of 1881*. https://commons.wikimedia.org/wiki/File:Trouvelot_-_The_great_comet_of_1881_-_1881.jpg (MLibrary) | Public domain |
| plates/saturn-{800,1600}.{avif,webp} + 800.jpg | Saturn, 16:10 | default blog cover | Trouvelot, *The planet Saturn* (1874). https://commons.wikimedia.org/wiki/File:Trouvelot_-_The_planet_Saturn_-_1874.jpg (NYPL TROUVELOT_010) | Public domain |
| plates/protuberances-{800,1600}.{avif,webp} + 800.jpg | Solar protuberances, 3:4 | section art, dayjob / consulting | Trouvelot, *Solar protuberances* (1873). https://commons.wikimedia.org/wiki/File:Trouvelot_-_Solar_protuberances_-_1873.jpg (NYPL TROUVELOT_002) | Public domain |
| products/mcp-emails-{600,1200}.webp + 600.jpg | Plate I: the MCP Emails icon as the head of the Great Comet | product card | comet plate + real `_shared/products/mcp-emails/icon.png` (products.py) | PD plate; logo © Albretsen AS |
| products/fun-libs-{600,1200}.webp + 600.jpg | Plate II: the Fun Libs icon rising at the source of the aurora rays | product card | aurora plate + real `fun-libs/icon.png` | PD; logo © Albretsen AS |
| products/toolrails-{600,1200}.webp + 600.jpg | Plate III: the Toolrails tile eclipsing the sun | product card | eclipse plate + real `toolrails/icon.svg` | PD; logo © Albretsen AS |
| products/harbor-{600,1200}.webp + 600.jpg | Plate IV: the Harbor mark as a veiled spot on the solar surface (paused) | product card | Trouvelot, *Group of sun spots* (1875). https://commons.wikimedia.org/wiki/File:Trouvelot_-_Group_of_sun_spots_-_1875.jpg + real `harbor-mark.svg` / `harbor-mark-filled.svg` | PD; logo © Albretsen AS |
| retired/{luma,polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}.svg | Waning-moon roundels R-I…R-VII | retired list | hand-authored SVG (extras.py) | own work |
| retired/luma-card.png | Luma roundel + real Luma logo | retired list, Luma row | real `luma/logo.png` + roundel | logo © Albretsen AS |
| texture/paper-corona-1024.{webp,jpg} | Crumpled corona-pink paper, tileable | light sections, plate mounts | ambientCG Paper003 https://ambientcg.com/a/Paper003, re-toned | CC0 |
| texture/paper-umbra-1024.{webp,jpg} | Same paper in umbra | dark sections | ambientCG Paper003, re-toned | CC0 |
| texture/grain-128.png | Noise tile, 9% alpha | film-grain overlay | numpy | own work |
| ephemera/iris.svg | Seven-blade aperture | intro, loaders, cursor reference | hand-authored SVG | own work |
| ephemera/aperture-scale.svg | f/1.4–f/22 calibration rule with bead | section divider; the bead marks the current section | hand-authored SVG | own work |
| ephemera/registration.svg | Corner and registration marks | framing plates, image hover | hand-authored SVG | own work |
| ephemera/accession-label.svg | Museum catalogue label "ACC. NO. 2026.87" | footer, about | hand-authored SVG, outlined type | own work |
| ephemera/star-chart.svg | Sparse star field with RA graticule and one dashed asterism | "now" / changelog background | hand-authored SVG (seeded) | own work |
| ephemera/fracture.svg | One beam split into the duotone ramp | consulting / "how I work" section | hand-authored SVG | own work |
| interactive/corona.js | Raw WebGL corona shader (develop, bead, fracture, parallax) | hero | own code | own work |
| interactive/corona-demo.html | Shader demo with sliders | demo | own code | own work |
| interactive/cursor.js | Aperture cursor | site-wide (fine pointers) | own code | own work |
| motion.js, motion.css | Motion study | site-wide | own code | own work |
| fonts/instrument-serif(.|-italic).woff2 | Display serif, latin subset | headings | Google Fonts repo | SIL OFL 1.1 |
| fonts/geist-var.woff2, geist-mono-var.woff2 | Body and mono, latin subset | body, captions | Google Fonts repo (Vercel Geist) | SIL OFL 1.1 |
| preview.html | Contact sheet | review | own code | own work |

Trouvelot plates were downloaded as 3840 px Wikimedia thumbnails of the NYPL and University of Michigan scans, marked public domain (author died 1895; published 1882). Total kit size is about 6.5 MB.
