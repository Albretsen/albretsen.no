# Design 51: Sodium Orbit

Asset kit for albretsen.no. Open `preview.html` first, from a static server at the repo root (`python3 -m http.server`). It plays the hero game, the orb and every animation.

## Vision

At night, seen from the International Space Station, cities are networks of sodium-orange light under a thin blue band of airglow. They look like circuit boards. That picture is this brand: a technology company seen from orbit, with one warm light in the dark.

**The hero is a small game, and the game is the introduction.** The visitor steers a molten spark (pointer, touch or arrow keys). Four cold lamps sit on the curve of the Albretsen mark, one per product: Harbor, MCP Emails, Toolrails and Fun Libs at the centre. Fly through a lamp and it strikes the way a real low-pressure sodium lamp does. It flashes neon pink from its starter gas, flickers, then warms to orange. A label appears with the product's real figure. Once all four are lit, the sparks fly out of the lamps and draw the mark. Left alone, the game plays itself: it lights the first lamp to show what to do, then drifts and waits.

- **Personality:** minimal futurist. Deep night blues, one warm accent, mono instrument labels, generous dark space, nothing chrome or skeuomorphic.
- **Seed hue 0°:** the neon pink of a lamp striking. It appears only in motion and in the cooling tail of particles, never as a resting UI colour.
- **Metaphor discipline:** lamps, sparks, orbit and night light. No machinery, no ships, no finance cues.

### References (researched for this kit)

- NASA Earth Observatory, cities at night and sodium vs LED lighting seen from orbit: https://earthobservatory.nasa.gov/Features/CitiesAtNight and https://earthobservatory.nasa.gov/images/152186/athens-at-night
- PetaPixel on Don Pettit's orange-to-white city photographs (Sept 2026): https://petapixel.com/2026/09/08/astronauts-before-and-after-photos-show-how-cities-switched-from-orange-to-white-light/
- How sodium lamps warm up (pink/red neon strike, then orange): https://en.wikipedia.org/wiki/Sodium-vapor_lamp and https://www.vintagestreetlights.com/history/lps.html
- rauno.me ("Make it fast. Make it carefully. Make it soulful."): https://rauno.me
- Codrops GPGPU particle effect (the particle approach in the orb): https://tympanus.net/codrops/2024/12/19/crafting-a-dreamy-particle-effect-with-three-js-and-gpgpu/
- Whirly Bonfire, curl-noise spark particles: https://www.clicktorelease.com/code/codevember-2017/whirly-bonfire
- linear() easing and the Linear Easing Generator (Jake Archibald and Adam Argyle): https://developer.chrome.com/docs/css-ui/css-linear-easing-function
- Additive WAAPI animations (`composite: 'add'`): https://css-tricks.com/additive-animation-web-animations-api/
- Motion's notes on improving the WAAPI developer experience: https://motion.dev/docs/improvements-to-the-web-animations-api-dx
- The Met open-access collection was a starting point: https://www.metmuseum.org/art/collection

## Palette

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| void | oklch(0.12 0.035 268) | #020513 | page background |
| night | oklch(0.18 0.055 264) | #051029 | surfaces, cards |
| deep | oklch(0.26 0.075 260) | #0c2348 | raised surfaces, gradients |
| dusk | oklch(0.40 0.09 255) | #234877 | rules, cooled particles |
| airglow | oklch(0.74 0.13 240) | #52b5f4 | links, the paused state |
| mist | oklch(0.86 0.04 250) | #bed4eb | body text |
| moon | oklch(0.97 0.008 250) | #f1f6fa | headlines, the mark's arc |
| **neon (seed 0°)** | oklch(0.62 0.22 0) | #e63281 | the strike only: motion and the particle tail |
| ember | oklch(0.66 0.19 35) | #ef5b36 | particle tail |
| **sodium** | oklch(0.76 0.165 60) | #fb942a | the one accent: lit lamps, figures, focus rings |
| filament | oklch(0.92 0.09 88) | #ffe196 | hottest point, active labels |

Molten particle ramp, hot to cold: `#fff4d6 → #ffe196 → #ffc35a → #fb942a → #f4742f → #ef5b36 → #e63281 → #a52a8a → #4a3f9a → #234877`.
All tokens are defined in `motion.css` under `:root`.

## Type

All three are on Google Fonts and licensed under the OFL.

- **Unbounded** 200–400, display. Wide and light, with tight negative tracking (-0.035 to -0.05em).
- **Inter Tight** 400–600, body, 16–20px.
- **JetBrains Mono** 400–500, labels and HUD text: 10–12px, uppercase, letter-spacing 0.14em.

```html
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@200;300;400;500&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

## Builder notes

- **Hero:** `game/ignite.js` sits on a `<canvas>` absolutely positioned over `hero/earth-limb-*` (use `<picture>` with the AVIF). Add a left-to-right `void` gradient so the headline stays readable. Use `game/demo.html` as a working reference: it covers labels, HUD buttons and the easter egg.
- **Keyboard and screen readers:** render the four lamps as real `<button>`s that call `game.strike(id)`. The canvas is decorative-interactive.
- **Positioning:** `game.positionOf(id)` gives a lamp's position as 0..1 fractions of the canvas, for placing DOM labels. On phones, pass `{ markAt: [0.5, 0.33], markScale: 0.52 }`.
- **Events:** `ignite:strike`, `ignite:complete` and `ignite:secret` bubble from the canvas.
- **Easter egg:** typing `2016` (or the Konami code) starts a meteor shower and reveals a fifth lamp, "Google Play, 2016". It is fact-based: Asgeir has published on Google Play since 2016.
- **Reduced motion:** both `ignite.js` and `motion.js` honour `prefers-reduced-motion`. The game renders its lit, finished state without moving.
- **Lazy loading:** load `orb/sodium-orb.js` only when its container is near the viewport, and show `orb/orb-poster-*.webp` until then (see `preview.html`). It pulls three.js 0.170.0 from jsdelivr.
- **Grain:** for a film grain, tile `extras/grain-256.png` at about 5% opacity with `mix-blend-mode: overlay`.
- **Figures:** use only the figures in `designs/_shared/content.js`.

## Motion (motion.js and motion.css, Web Animations API)

| Name | Kind | Function | What it does | Researched from |
|---|---|---|---|---|
| Sodium Strike | entrance | `strike(el)` | Neon flash and two flickers, then it warms to sodium and cools to ink over 1.6s | The real LPS lamp warm-up sequence |
| Ignition Type | entrance | `ignite(el)` | Per-character rise out of a 10px blur, filament-white to ink, 28ms stagger, grouped by word | Blur-up title reveals (linear.app), rauno.me craft notes |
| Ember Lift | hover | `emberHover(el)` | Spring lift (sampled to `linear()`), additive pointer tilt (`composite: 'add'`), sodium under-glow | Linear Easing Generator; CSS-Tricks on additive WAAPI |
| Orbit Wipe | transition | `orbitWipe(el, x, y)` | Circular clip-path reveal from the spark or click point, with a sodium ring riding the edge | Circular View Transition reveals in Chrome's demos |
| Afterglow | scroll | `afterglow(el)` | Image arrives overexposed and grey, then settles, like a long exposure | ISS long-exposure night photography |
| Filament Count | detail | `countUp(el)` | Real figures count up while cooling from filament to resting colour | Odometer-style counters, recoloured to the heat ramp |

`motion.css` also provides `--ease-spring` and `--ease-settle` (springs as `linear()`), `.cold-lamp`, `.lit-lamp`, `.twinkle` and `.spark-caret`.

## Inventory

| File | What it is | Intended use | Source | Licence |
|---|---|---|---|---|
| brand/logo-mark.svg | The mark: a thrown spark's parabola forming an A, with the spark as crossbar | Header, favicon source, loaders | Hand-built SVG | Original, client-owned |
| brand/logo-mark-mono.svg | One-colour mark (`currentColor`) | Inline icon, print | Hand-built SVG | Original |
| brand/wordmark.svg | Monoline ALBRETSEN; the A is the same parabola, with a sodium spark | Header on dark | Generated with Node on a 40-unit grid | Original |
| brand/wordmark-dark-ink.svg | Wordmark for light backgrounds | Documents, light contexts | Same | Original |
| brand/favicon.svg, favicon-32.png | Mark on a night tile | `<link rel="icon">` | SVG; PNG via rsvg-convert | Original |
| brand/apple-touch-icon.png | 180×180 icon | `apple-touch-icon` | rsvg-convert | Original |
| brand/og-image.jpg | 1200×630 social card: limb photo, wordmark, particle mark | `og:image` / `twitter:image` | Canvas render (`_src/render-sparks.html?k=og`) + NASA photo | Original + public domain |
| hero/earth-limb-{2880,1440}.webp, -2880.avif | Hero A. ISS night pass: sodium-lit cities, blue airglow limb, moon. Denoised and graded to the palette | Hero background behind the game | NASA image **iss035e017619**, https://images.nasa.gov/details/iss035e017619 (Expedition 35, JSC), graded with Python/Pillow | Public domain (NASA) |
| hero/earth-grid-{2880,1440}.webp, -2880.avif | Hero B. City grid along a lake shore, like a circuit board | Alternative hero, section background, product page header | NASA **iss035e013107**, https://images.nasa.gov/details/iss035e013107 | Public domain (NASA) |
| hero/spark-arc-{2880,1440}.webp | Hero C. A thrown spark arcing through the dark, shedding droplets that cool through the ramp (26k particles) | Hero overlay with `mix-blend-mode: screen`, section dividers | Canvas render (`_src/render-sparks.html?k=streak`), seeded | Original |
| products/lamp-mcp-emails-{1600,800}.webp | Real MCP Emails icon on a glass plinth, sodium halo, molten orbit, ISS city backdrop | Product card / feature image | Real logo `_shared/products/mcp-emails/icon.png` (unaltered) + `_src/render-product.html?p=mcp-emails` + NASA iss035e011709 | Logo: client; photo: public domain |
| products/lamp-fun-libs-{1600,800}.webp | Same treatment, real Fun Libs v5 icon | Product card | `_shared/products/fun-libs/icon.png` + NASA iss035e013107 | Same |
| products/lamp-toolrails-{1600,800}.webp | Same treatment, real Toolrails icon; status "striking · building" | Product card | `_shared/products/toolrails/icon.svg` + NASA iss035e008050 | Same |
| products/lamp-harbor-{1600,800}.webp | Real Harbor mark in its banner colours; dimmed to airglow blue because Harbor is paused | Product card | `_shared/products/harbor/harbor-mark.svg` (via `_src/harbor-tile.svg`) + NASA iss035e017619 | Same |
| products/retired/luma.webp | Retired tile with Luma's real logo on its own cream colour | Retired list | `_shared/products/luma/logo.png` composited with Pillow | Logo: client |
| products/retired/{polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}.svg | "Extinguished lamp" stand-ins: a cold tile, a line glyph and one dying neon ember. Not the products' real brands | Retired list, lamp map tooltips | Generated SVG | Original |
| extras/lamp-map.svg | Every product as a lamp on a 2016–2026 timeline: lit, striking, or out | "History" section, footer | `_src/make-lamp-map.mjs`, data from content.js | Original |
| extras/manhattan-night-1800.webp | New York from the ISS, graded | Full-bleed section band | NASA **iss035e008050**, https://images.nasa.gov/details/iss035e008050 | Public domain |
| extras/coastal-network-1800.webp | Coastal city network from the ISS, graded | Section band, card background | NASA **iss035e011709**, https://images.nasa.gov/details/iss035e011709 | Public domain |
| extras/strike-burst-{1600,800}.webp | A lamp striking: 520 molten sparks with a neon ring | Behind a big figure, 404 page, "complete" state | Canvas render (`?k=burst`) | Original |
| extras/starfield-tile.webp | Seamless 1024 starfield, rare sodium and airglow stars | Tiled background, slow drift | Python/numpy, toroidal Gaussian stars, seed 0x544baf | Original |
| extras/grain-256.png | Seamless luminance grain | Page overlay at about 5% | Python/numpy | Original |
| extras/glow-{sodium,neon,airglow}.png | 128px glow sprites | Builder's own particles, cursor glow | Python/numpy | Original |
| extras/sticker-since-2016.svg | Round sticker with a rotating ring of text: "Published on Google Play since 2016" | Floating badge near the about text | Hand-built SVG with CSS spin (reduced-motion aware) | Original |
| game/ignite.js | **The hero game.** Canvas 2D particle system (4096-particle typed-array pool, additive blending), lamps on the mark, strike/warm-up, logo formation, attract mode, keyboard, easter egg, `advance(ms)` for posters | Hero | Written for this kit, no dependencies | Original |
| game/demo.html | Working hero reference | Builder reference | — | Original |
| orb/sodium-orb.js | **3D object.** three.js r170: smoked-glass sphere with fingerprint roughness, HDRI reflections, a filament shader, 10k GPU particles in two molten rings; drag to turn, press to strike | Interactive object in About or Contact | Written for this kit; three.js from https://cdn.jsdelivr.net/npm/three@0.170.0 | Original (three.js MIT) |
| orb/demo.html | Orb demo | Builder reference | — | Original |
| orb/orb-poster-{1600,800}.webp | Still of the orb | Poster before three.js loads, no-WebGL fallback | Headless Chrome render | Original |
| orb/street-lamp-env.webp | 1024×512 tone-mapped equirect of a suburban night with a sodium street lamp | Orb environment map | Poly Haven **Street Lamp** HDRI by Greg Zaal, https://polyhaven.com/a/street_lamp (1k .hdr, decoded and Reinhard tone-mapped in Python) | CC0 |
| orb/fingerprints-roughness.webp | Fingerprint smudge roughness map | Orb glass roughness | ambientCG **Fingerprints006**, https://ambientcg.com/view?id=Fingerprints006 (1K-JPG roughness, resized) | CC0 |
| motion.js / motion.css | Signature motion and tokens | Whole site | Written for this kit | Original |
| preview.html | Contact sheet | Start here | — | Original |
| _src/* | Render sources for every baked image (open in a browser with the query shown) | Re-rendering at other sizes | — | Original |

Total size is about 3.3 MB.
