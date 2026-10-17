# Design 90: Six Faces

**One idea:** a die that only lands on true numbers.

## Vision

Albretsen AS presented as an ultramarine nocturne. Real places (an aurora over Lofoten, Northern Europe from orbit, a figure on a rock above a valley, tyre tracks in snow under a street lamp) are graded through one OKLab ramp until the whole site reads as a single colour. One warm light, sodium amber, marks what matters.

The centrepiece is the **Honest Die**, a cube built only from CSS 3D transforms. You grab it, spin it and throw it. It bounces off the frame, loses energy, and always lands square and upright on one face. Every face shows one real number: $782 MRR, 113,000+ installs, 4 connectors, 549 commits, 7 retired products, first published 2016. The personality is brutal honesty. "Building", "paused" and "retired" are printed as plainly as "live", and the retired products stay on the record as die faces with pips.

The theme switch is a show called **The Turn**. The page is one face of a cube and turns 90° to reveal the other face, passing through a sodium-lit void. The day theme prints the same hero photograph as an ultramarine negative on paper, like a cyanotype.

**Mood:** calm and nocturnal, dense but uncluttered, one strong object per screen. It is confident without asking for anything.
**Spark words used:** *density* (city lights from orbit, the vector field), *vector* (tyre tracks, the vector field, a throw's velocity), *nocturne* (the grade and the default theme).

### What the builder should do

- Hero: `hero/aurora-night` full-bleed with "Albretsen" set huge (Archivo, width 125, weight 800) across the treeline, plus the `turn-switch`. Switching to day swaps in `hero/aurora-day`.
- Second screen: the Honest Die alone on an ultramarine field (`interactive/`), with one line of copy. Show the landed face's caption in mono.
- Products: one die render per product (`products/die-*`), with retired products as a row of die faces and the `redact` animation.
- Use `hero/summit-night` and `hero/orbit-night` as full-bleed interludes. Use `extras/tracks-night` behind a section.
- Keep the sodium accent rare: a pip, a scan line, a kicker. Never use it as a block.

### References and research

- https://ui.aceternity.com/components: 3D card, Draggable Card, Text Reveal Card (sweep line), Background Cubes. Used for the sweep line in DEVELOP and the "physical card you can grab" interaction.
- https://motion.dev/docs/animate: spring options (stiffness, damping, mass, visualDuration). The landing spring is stiffness 260, damping 17.
- https://commons.wikimedia.org/wiki/Category:Featured_pictures_of_Norway and *Featured photographs in the public domain*: the photo sources, with licences checked through the Commons API.
- View Transitions API: cross-document and same-document `::view-transition-old/new(root)` with 3D keyframes, the basis of THE TURN.
- The Codrops "3D page transitions" cube pattern (transform-origin at the shared edge plus translate and rotateY), rebuilt for the theme switch.
- Not reachable this run: dribbble.com/shots/popular (empty page), shadertoy.com (403), biodiversitylibrary.org (skipped; botanical plates do not fit this direction). The run's web-search budget was used up before this agent's searches could run, so research was done by fetching pages directly and through the Wikimedia Commons API. Salt 033eb1 seeds the vector field's random sodium outliers (`random.seed(0x033eb1)`).

## Palette (OKLCH, seed hue 252)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| night | oklch(0.16 0.07 262) | #000a2a | deepest ground, die shadows |
| deep | oklch(0.29 0.134 262) | #00226c | nocturne page background |
| **field** | oklch(0.50 0.203 260) | #0159d4 | **the colour that owns the page**; the die body |
| seed | oklch(0.62 0.184 252) | #0587f0 | seed hue at full sRGB chroma |
| electric | oklch(0.72 0.15 250) | #52a9fe | links, vectors, highlights |
| mist | oklch(0.92 0.038 252) | #d3e7fe | secondary ink on dark |
| paper | oklch(0.975 0.012 252) | #f1f8ff | day page, type on dark |
| sodium | oklch(0.82 0.143 70) | #ffb250 | the one warm light (pip, scan line, kicker) |

Chroma values are clipped to the sRGB gamut, so the hex values are exact. Tokens are defined in `motion.css` as `--c-*`. Theme variables are `--bg --bg-2 --ink --ink-2 --accent --rule`, and `:root[data-theme="day"]` overrides them.

**Photo grade** (a Python + numpy script in the scratch dir, done in OKLab). Luminance is mapped to night (0.11 0.045 262) → (0.22 0.12 262) → field (0.42 0.22 260) → (0.58 0.19 254) → electric (0.80 0.11 248) → paper. Saturated greens are lifted a little so the aurora glows, then a vignette and fine film grain are added. The day grade inverts luminance into a paper → ink ramp, giving the cyanotype negative.

## Type

- **Archivo** (variable: wdth 62–125, wght 100–900), `fonts/archivo-var.woff2`, 92 KB, Latin subset. The display face for numbers and the name: wdth 125, wght 800, tracking −0.035 to −0.055em. Statements use wdth 100, wght 600. SIL OFL 1.1, from https://github.com/google/fonts/tree/main/ofl/archivo
- **IBM Plex Mono** 400 and 500, `fonts/plex-mono-400.woff2` and `plex-mono-500.woff2`, about 16 KB each. Used for body text, labels and facts, often uppercase with 0.06–0.12em tracking. SIL OFL 1.1, from https://github.com/google/fonts/tree/main/ofl/ibmplexmono

## Motion study (`motion.css` + `motion.js`, plus `interactive/`)

1. **THROW & LAND** (`interactive/throw-cube.js`). Quaternion orientation and angular velocity. Flight has inertia (spin decays 0.998/ms, speed 0.9975/ms) and bounces off the stage with 0.55 restitution, and wall hits convert speed into spin. It lands on the face most toward the viewer, turned upright, through a Motion spring (stiffness 260, damping 17). A hand-rolled spring takes over if Motion takes longer than 900 ms to load. Each face is lit by a fake key light (`--tc-lit`). Keyboard: Space or Enter rolls. With `prefers-reduced-motion`, there is no flight and the die steps to the next face. The stage reports `data-state` (flying / landing / landed / held) and fires a `settle` event.
2. **THE TURN** (`theTurn()`). The theme switch runs a View Transition whose old and new root snapshots are two faces of a cube, rotating 90° around their shared edge (perspective 2200px, 1.15 s, ease `cubic-bezier(.75,0,.2,1)`). Behind them is a sodium-lit night void. The switch button holds a tiny CSS cube that turns with the page. Browsers without View Transitions switch instantly.
3. **DEVELOP** (`develop()`). Photographs start as flat field colour and develop top-down behind a sodium scan line, with contrast rising as they go. Motion tweens `--p` from 0 to 1 over 1.6 s.
4. **HONEST COUNT** (`honestCount()`). Counts up with ease-out and stops exactly on the real value. There is no overshoot, and a sodium rule draws under the number to mark it exact.
5. **REDACT** (`redact()`). A bar is drawn through a retired product's name, then "retired" fades in beside it. Nothing is removed from the list.

`autoInit()` wires `[data-turn-switch]`, `.develop`, `[data-count]` and `.redact`, triggering each on scroll into view. The pinned dependency is `motion@13.4.6` from jsDelivr, loaded lazily.

## Interactive and 3D

- `interactive/throw-cube.js` and `.css`, with `faces.js` and `faces/*.avif|webp`: the Honest Die, CSS 3D only. Demo: `interactive/demo.html`.
- `3d/die-scene.js`: the product die in three.js@0.185.0 (RoundedBoxGeometry, MeshPhysicalMaterial, RoomEnvironment, soft shadows). Canvas face textures carry the real product logo on a paper label, the number on top and the facts on the side. `mountDie(canvas, { product, live: true })` keeps it live and draggable. Demo: `3d/live.html`.
- `3d/render.html?shot=hero|mcp-emails|fun-libs|toolrails|harbor` is the bake stage that produced the stills, captured with `scripts/shot.sh`.

## Inventory

| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| logo-mark.svg | isometric die: paper top, ultramarine sides, sodium pip | header and footer mark on light | generated (Python, hand-built polygons) | original |
| logo-mark-reverse.svg | mark for ultramarine or dark grounds | header on hero | generated | original |
| logo-wordmark.svg | ALBRETSEN + AS, Archivo wdth 125 wght 800, outlined to paths, `currentColor` | wordmark | generated with fontTools from Archivo | original (font OFL) |
| logo-lockup.svg | mark + wordmark | email signature, footer | generated | original |
| favicon.svg, favicon-180.png | die on a rounded field tile | favicon, apple-touch-icon | generated, PNG via rsvg-convert | original |
| og-image.jpg | 1200×630: die on snow, lockup, line | Open Graph / Twitter | composed in Pillow from the hero/die-on-snow render | original + CC0 photo |
| hero/aurora-night-{640,1280,1920,2560} .avif/.webp/.jpg | aurora over Flakstad, Lofoten, nocturne grade | **hero A**, nocturne theme | https://commons.wikimedia.org/wiki/File:Lofoten,_Norway_(Unsplash).jpg, graded | CC0 (Unsplash, via Commons) |
| hero/aurora-day-{640,1280,1920} | same frame as an ultramarine negative on paper | **hero A**, day theme (The Turn) | same source, inverted grade | CC0 |
| hero/summit-night-{640…2560} | lone figure on a rock above a valley | interlude / about | https://commons.wikimedia.org/wiki/File:Alone_in_the_unspoilt_wilderness_(Unsplash).jpg | CC0 (Unsplash, via Commons) |
| hero/orbit-night-{640,1280,1920} | Northern Europe from the ISS | interlude / products backdrop | https://commons.wikimedia.org/wiki/File:ISS-43_Northern_Europe.jpg (NASA, Scott Kelly) | Public domain (NASA) |
| hero/die-on-snow-{960,1600,2400} | three.js die (MCP Emails) resting on graded snow tracks | **hero B** / OG | render of 3d/die-scene.js over extras/tracks-night | original + CC0 |
| products/die-mcp-emails-{700,1400} | MCP Emails die: real logo-mark.svg, $782 MRR, facts | product card | three.js render, studio sweep | original; logo © MCP Emails (real asset, unchanged) |
| products/die-fun-libs-{700,1400} | Fun Libs die: real icon.png, 113,000+ installs | product card | three.js render | original; logo real |
| products/die-toolrails-{700,1400} | Toolrails die: real icon.svg, 4 connectors | product card | three.js render | original; logo real |
| products/die-harbor-{700,1400} | Harbor die: real harbor-mark-filled.svg, 549 commits, on a mist sweep | product card | three.js render | original; logo real |
| products/retired/*.svg | 6 die faces with pips 1–6 for Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, Early apps (Luma uses its real logo from _shared) | retired list | generated | original |
| extras/tracks-night-{800,1600} | tyre tracks in snow under sodium light, graded | section ground, "vector" texture | https://commons.wikimedia.org/wiki/File:Car_tire_tracks_in_snow_under_sodium_light.jpg | CC0 |
| extras/lights-night-{800,1600} | Europe at night (Black Marble 2016) crop, graded | "density" texture, since-2016 face | https://commons.wikimedia.org/wiki/File:BlackMarble20161km.jpg (NASA Earth Observatory) | Public domain (NASA) |
| extras/vector-field.svg | field of short vectors with salted sodium outliers | section background (cover) | generated (Python, seed 0x033eb1) | original |
| extras/die-net.svg | the die unfolded: six faces, six true numbers | about / colophon | generated | original |
| extras/caption-label.svg | "Plate 01 · Measured, not estimated." ephemera | caption beside numbers | generated | original |
| extras/retired-tape.svg | striped ultramarine tape with a RETIRED tag | divider above the retired list | generated | original |
| extras/crop-marks.svg | crop and registration marks | frame for photographs (`.crop::after`) | generated | original |
| extras/grain.png | 128px neutral grain tile | `mix-blend-mode: overlay` texture | generated (numpy) | original |
| interactive/throw-cube.js, .css, faces.js, demo.html | the Honest Die (CSS 3D) | hero interaction | hand-written | original |
| interactive/faces/*.avif, .webp | 640px square crops of the graded photos | die faces | from the photos above | CC0 / PD |
| 3d/die-scene.js, live.html, render.html | live three.js product die and bake stage | lazy-loaded live 3D, re-baking | hand-written; three@0.185.0 via jsDelivr | original (three.js MIT) |
| motion.css, motion.js | tokens, @font-face, The Turn, Develop, Honest Count, Redact | include on every page | hand-written; motion@13.4.6 | original (Motion MIT) |
| fonts/*.woff2, OFL-*.txt | Archivo variable, IBM Plex Mono 400/500, Latin subsets | type | Google Fonts repo, subset with fontTools | SIL OFL 1.1 |
| preview.html | contact sheet; `?only=<section-id>`, `?theme=day` | review | hand-written | — |

The total is about 7 MB. The initial page needs about 330 KB: aurora-night 1920 AVIF at 91 KB, the fonts at 125 KB, motion.css, and the throw-cube files. Motion and three.js load lazily.
