# Design 45: Drift

Asset kit for Albretsen AS / albretsen.no. Open `preview.html` first. It shows everything in one place, plays every animation and runs the live 3D river. Serve it from the repo root, because the page imports `../../_shared/content.js`.

## Vision

**A river of time, from 2016 to today, made of soft plastic.** The hero is a glossy teal river that winds out of the distance (2016, Asgeir's first Play Store release) and widens until it reaches the viewer (2026, today). Thousands of small plastic beads ride the current. Eleven pebbles float above it, one for each year, and the 2026 pebble has a small moon in orbit. Nothing in the scene touches the ground; it all floats.

The secondary motif comes from 1904. Ernst Haeckel drew radiolarians and diatoms: microscopic organisms with glass skeletons, engineered with absurd precision. We use them in two ways: as archival plates toned into our single hue, and rebuilt as procedural 3D lattices in the same soft plastic. The message is precision and taste at a small scale, delivered calmly.

- **Mood:** serene and spacious. The tone is a studio-lit product shot, not a tech demo. Leave a lot of air around everything. Most of the work is done by the light.
- **Spark words:** orbit (the moon around 2026, the Toolrails tool halo, the `drift-orbit` bead), chorus (the bead stream, the letter-by-letter text animation), weightless (every spring, every float).
- **Signature delight:** the **Tide turn**. `<tide-switch>` is a small glass capsule with water and a glossy pebble inside. At night the pebble sinks and starts to glow, and the water level rises. While that happens, a wavefront sweeps up across the whole page (View Transitions plus spring-generated clip-path keyframes). The live river glides to its night palette, and the hero crossfades to its night twin, which was rendered from the same camera.
- **Avoid:** finance or consultancy cues, machines, ships and charts. The water here is a river of time, never a harbour or a sea. MCP Emails is one tile among four.

### References (researched)

| What | URL | Taken from it |
|---|---|---|
| Active Theory | https://activetheory.net | Real-time WebGL as the hero, soft blurred reveals, particles as atmosphere |
| Radix Primitives animation guide | https://www.radix-ui.com/primitives/docs/guides/animation | `[data-state]` enter/exit keyframes, delayed unmount → `drift-settle` |
| paco.me | https://paco.me | Restraint: a few precise details instead of many effects → `buoy` |
| Rive community | https://rive.app/community | Toggles that are tiny scenes → `<tide-switch>` |
| Maxime Heckel, "The physics behind spring animations" | https://blog.maximeheckel.com/posts/the-physics-behind-spring-animations/ | Damped harmonic oscillator → `Spring` (semi-implicit Euler, fixed 240 Hz substep) |
| wobble (closed-form springs) | https://github.com/skevy/wobble | Interruptible springs that keep velocity on retarget |
| Magic UI animated theme toggler | https://www.mintlify.com/Max-Samson/magicui/components/animated-theme-toggler | View Transition reveal from the toggle → pushed further into a rising wavefront |
| three.js GPGPU / curl particles threads | https://discourse.threejs.org/t/gpgpu-particles/90558 | Points sampled along a curve in the vertex shader |
| Water caustic shader (Dave Hoskins / joltz0r) | https://www.shadertoy.com/view/MdlXz8 | Tileable caustic iteration used for `caustics-tile` |
| Haeckel, *Kunstformen der Natur* (BHL scans via Wikimedia Commons) | https://commons.wikimedia.org/wiki/Kunstformen_der_Natur | Plates and specimen cut-outs |
| Old Book Illustrations | https://www.oldbookillustrations.com/illustrations/thy-stream/ | Birket Foster stream engraving |

## Palette: OKLCH hue 180, twelve depths

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| teal-50 | oklch(0.985 0.012 180) | #f2fdfa | raised surfaces (day), text (night) |
| teal-100 | oklch(0.955 0.030 180) | #dcf7f1 | page background (day), studio sweep |
| teal-200 | oklch(0.90 0.055 180) | #b7ebdf | river near bank, soft fills |
| teal-300 | oklch(0.83 0.085 180) | #87dac9 | glow and accent (night) |
| teal-400 | oklch(0.74 0.11 180) | #4bc1ad | river body, bead highlights |
| teal-500 | oklch(0.64 0.115 180) | #08a28f | accent (day), focus rings |
| teal-600 | oklch(0.54 0.10 180) | #008171 | labels, mono text (day) |
| teal-700 | oklch(0.44 0.08 180) | #006154 | secondary text (day), shadows |
| teal-800 | oklch(0.34 0.06 180) | #034239 | deep pebbles, headings on mint |
| teal-900 | oklch(0.25 0.042 180) | #042822 | body text (day) |
| teal-950 | oklch(0.18 0.028 180) | #031612 | raised surfaces (night) |
| teal-990 | oklch(0.13 0.018 180) | #020907 | page background (night) |

There is no second hue anywhere. Contrast comes from depth. The product logos keep their own colours, and they are the only other colours on the page. `motion.css` defines every token plus semantic `--bg / --ink / --accent / --glow` for `[data-theme]` and `prefers-color-scheme`.

## Type

- **Display:** Instrument Serif, *italic*, 400 (Google Fonts, OFL). Used for headlines only, set large and slightly tight (-0.01 to -0.02em). It is the one soft voice.
- **Text:** Geist 300–500 (Google Fonts, OFL), 15–19px, line-height 1.55–1.6.
- **Labels and figures:** Geist Mono 500, 11–13px, uppercase, +0.08em tracking. Years, numbers and file names.
- The wordmark is Geist 400 lowercase with -0.02em tracking, outlined to paths, so it needs no font.

```html
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..600&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
```

## Motion (motion.js + motion.css)

All motion runs on one hand-rolled spring (`Spring`, presets `weightless`, `buoy`, `tide`, `settle`). The same presets are sampled into CSS `linear()` easings (`--ease-weightless` etc.), so CSS and JS motion feel the same. Everything respects `prefers-reduced-motion`.

| Name | Kind | What it does | API |
|---|---|---|---|
| **Surface** | entrance | Content rises through a "waterline": 28px lift, 10px blur fading out, staggered, with a weightless overshoot | `surface()` + `data-surface` / `data-surface-item`; CSS fallback `.drift-surface` |
| **Buoy** | hover | A card floats toward the pointer, tilts like a pebble on water, and bobs once when released | `buoy(el)` |
| **Gloss** | hover | A softbox highlight slides across a render | `.drift-gloss` |
| **Chorus** | text | Letters join one by one, each on its own spring, so the line reads like voices coming in | `chorus(el).play()` |
| **Settle** | Radix | Enter/exit for Radix Dialog, Popover, DropdownMenu, Tooltip, Accordion via `[data-state]` | `.drift-content`, `.drift-overlay`, `.drift-collapse` |
| **Tide turn** | transition | Theme switch: a rolling wavefront rises across the page | `tideTurn(fn)`, `<tide-switch>` via `defineTideSwitch()` |
| **Orbit / Bob** | decor | A bead orbits an element on an ellipse `offset-path`; images float idly | `.drift-orbit`, `.drift-bob` |

## Live 3D: `3d/river.js`

```js
// needs an import map for "three" and "three/addons/" → three@0.170.0 (see 3d/river-demo.html)
const { createRiver } = await import('./assets/3d/river.js');   // load lazily
const river = await createRiver(canvas, { theme: 'light', onFrame: (years) => {/* [{year,x,y,visible}] */} });
addEventListener('themechange', (e) => river.setTheme(e.detail.theme));
```

The river uses 9,000 points (3,500 on small screens). Each point is shaded as a glossy sphere, with diffuse, specular and rim light, in its fragment shader. The points are positioned along the river curve from a float texture in the vertex shader. The pointer stirs the current with a spring-driven swirl, and a click sends a ripple. The camera follows the pointer with gentle parallax. The scene pauses when it is off-screen and handles portrait framing. Year labels are HTML. `onFrame` gives their screen positions so they stay crisp and accessible.

## Hero use (for the builder)

- Desktop: put `hero/river-day` (or the live canvas) full-bleed. The river occupies the right 55% of the frame, so set the headline on the left. Swap to `river-night` under `[data-theme=dark]`. Both stills share a camera, so a crossfade looks continuous.
- Phone: `object-position: 82% 50%` and a soft radial scrim behind the copy (see `preview.html`).
- `hero/radiolarian` works as a second hero or a section opener: the "craft / how it's built" chapter, or behind a blog index.

## Inventory

Retina pairs are `@1x` / `@2x`. Big images also ship `.avif` next to the `.webp`.

| File | What it is | Intended use | Source | Licence |
|---|---|---|---|---|
| identity/mark.svg | Glossy mark: single-storey "a" (bead bowl, flowing stem) plus an orbiting bead | Header, large brand moments | Hand-drawn SVG (`_src/identity.py`) | Original, Albretsen AS |
| identity/mark-mono.svg | Mark in `currentColor` | Small sizes, one-colour contexts | Same | Original |
| identity/wordmark.svg | "albretsen", Geist 400, outlined, `currentColor` | Text-only lockups | opentype.js outline of Geist (`_src/word.mjs`) | Geist OFL 1.1; outline original |
| identity/lockup.svg, lockup-dark.svg | Mark + wordmark + "AS" (Geist Mono outlined) | Header / footer, per theme | Same | Same |
| identity/favicon.svg | Squircle favicon; inverts under `prefers-color-scheme: dark` | `<link rel=icon>` | Hand-drawn SVG | Original |
| identity/favicon-180.png | Glossy apple-touch-icon 180×180 | `<link rel=apple-touch-icon>` | rsvg-convert from SVG | Original |
| identity/og.png, og.jpg | Open Graph 1200×630: river render + lockup + line | `og:image` | three.js bake (2400×1260, downsampled) + outlined type (`_src/og.py`) | Original |
| hero/river-day | River of time, 2016 → 2026, soft plastic, studio light (1440 / 2880) | Hero (day) | three.js MeshPhysicalMaterial bake, `_src/bake.html?scene=river-light` | Original |
| hero/river-night | Same camera at night, emissive beads + bloom | Hero (night), theme crossfade | `scene=river-dark` | Original |
| hero/radiolarian | Procedural radiolarian lattice in plastic, companion specimen, orbiting beads | Second hero / section opener | `scene=diatom` (icosphere edges → instanced cylinders) | Original |
| products/mcp-emails | **Real MCP Emails logo-mark** on a white plastic tile, drifting stack of message sheets | Product card | Bake with `_shared/products/mcp-emails/logo-mark.svg` as texture | Logo © Albretsen AS (unaltered); render original |
| products/fun-libs | **Real Fun Libs icon (v5)** as an app tile, three capsule "blanks" | Product card | `_shared/products/fun-libs/icon.png` | Same |
| products/toolrails | **Real Toolrails icon** on a dark tile inside a halo of 18 mixed "tool" primitives | Product card | `_shared/products/toolrails/icon.svg` | Same |
| products/harbor | **Real Harbor mark** (in its banner colours, cream on #1b1b1b) held in a clear iridescent bubble, "paused" | Product card | `_shared/products/harbor/harbor-mark.svg` | Same |
| products/retired-riverbed | Seven pebbles resting on the riverbed: Luma (**real logo.png**) plus six stand-ins | Retired products row | `scene=retired` | Same |
| products/standins/*.svg | Stand-ins: Polyglot Pilot (two bubbles), PinPoint (pin), WebVakt (eye), Joke Central (wink), Tryggere Hyring (shield), early apps (%) | Retired list icons | Generated SVG (`_src/standins.mjs`) | Original; labelled as stand-ins |
| extras/object-orbit | Transparent sticker: pebble with ring and moon | Floating decor, section dividers | `scene=object-orbit` | Original |
| extras/object-chorus | Transparent sticker: phyllotaxis of beads | Decor near "chorus" text, footer | `scene=object-chorus` | Original |
| extras/object-capsule | Transparent sticker: jelly capsule with beads | Decor, empty states | `scene=object-capsule` | Original |
| extras/object-specimen | Transparent sticker: small plastic radiolarian | Decor, blog | `scene=object-specimen` | Original |
| extras/plate-spumellaria-night | Haeckel plate "Spumellaria", toned teal-990 → teal-50 | Night sections, craft chapter backdrop | https://commons.wikimedia.org/wiki/File:Haeckel_Spumellaria.jpg (BHL scan, *Kunstformen der Natur* 1904); toned in `_src/process.py` | Public domain (Haeckel d. 1919) |
| extras/plate-diatomea-day | Haeckel plate "Diatomea", toned to pale mint with teal ink | Day sections, about page | https://commons.wikimedia.org/wiki/File:Haeckel_Diatomea.jpg | Public domain |
| extras/specimens/{star,tendril,burst,urchin,trefoil}-{light,ink}.webp | Single organisms cut from the Spumellaria plate, luminance → alpha, light and ink tones | Floating decor, particle sprites, bullets | Same source, `_src/process.py` | Public domain |
| extras/engraving-in-thy-stream.webp | Myles Birket Foster, engr. Edmund Evans, "In Thy Stream" (Poe, *Poetical Works*, 1858), toned teal | Editorial image for a writing/about section | https://www.oldbookillustrations.com/illustrations/thy-stream/ (file: /site/assets/high-res/1858/thy-stream-768.jpg) | Public domain (artist d. 1899; OBI places no limits on use) |
| extras/caustics-tile(.night).webp | Tileable 1024 water-caustic light | Section backgrounds at low opacity, hover fills | Procedural numpy (`_src/process.py`) | Original |
| extras/grain-256.png | Tileable grain | `body::before` overlay at 4–6% | Procedural numpy | Original |
| extras/current-lines.svg | Streamlines of a slow flow field, `currentColor` | Section backdrops, footer, 404 | Procedural node (`_src/flow.mjs`) | Original |
| 3d/river.js + river-demo.html | Live three.js particle river with springs, theme glide, year labels | Hero centrepiece | Hand-written; three@0.170.0 from jsDelivr | Original; three.js MIT |
| motion.js, motion.css | Springs, Surface, Buoy, Chorus, Tide turn, `<tide-switch>`, tokens, Radix styles | Whole site | Hand-written | Original |
| preview.html | Contact sheet | Start here | Hand-written | Original |
| _src/* | Bake page and scripts that regenerate every render and texture | Re-baking at other sizes | `bake.html` + `bake.py` (headless Chrome `--dump-dom` of `canvas.toDataURL`), `process.py` (Pillow, numpy) | Original |

### Fonts (not bundled; load from Google Fonts)

- Geist / Geist Mono: https://github.com/vercel/geist-font, SIL OFL 1.1.
- Instrument Serif: https://github.com/Instrument/instrument-serif, SIL OFL 1.1.

### Regenerating

```sh
python3 -m http.server 6045 --bind 127.0.0.1         # from the repo root
python3 designs/45/assets/_src/bakemany.py /tmp/out river-light:2880:1620 product-fun-libs:1600:1200
python -I designs/45/assets/_src/process.py <downloads> /tmp/out designs/45/assets   # pillow + numpy venv
```

Total kit size: about 4.8 MB.
