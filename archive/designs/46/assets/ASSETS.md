# Design 46 — "Say Cheese"

Asset kit for albretsen.no. Open `preview.html` first (serve the repo root over http; it loads the live shader and the 3D toy).

## Vision

Albretsen AS seen through a viewfinder. The brand is a loud, candy-coloured clay world starring **Blink**: a squishy butter-yellow clay camera whose one big lens is its eye. The three-blade aperture inside that lens makes the letter **A**. Each scene is lit like the first sunlit minute of dawn: a warm key light, lilac shadows (never grey), and visible thumbprints left in the clay.

The site should feel hand-made and technically impressive at the same time. The hero is a **live raw-WebGL2 raymarcher**, not a video and not a library: a few hundred lines of GLSL that sculpt Blink from smooth-unioned signed distance fields, dent the surface with fingerprints, fake subsurface glow, and rack focus on a real photograph behind it. The camera ideas (focus, exposure, shutter, aperture) are the interaction model: pointer = gaze, slider or scroll = focus and exposure, click = shutter. Everything is loud and proud, but every number shown is real (from `_shared/content.js`).

**Mood words:** clarity, dawn, sunlit, sugar, squish, click.
**Avoid:** grey shadows, pure black (use Ink #381A13), glossy plastic 3D clichés, anything mechanical or nautical. Blink is a toy camera, not a gadget diagram.

### References (researched)
- Quaternius, CC0 low-poly packs and the cute-monster look: https://quaternius.com (licence check: https://quaternius.com/packs/cutemonsters.html, CC0)
- Poly Haven model API and Camera 01 (used): https://polyhaven.com/a/Camera_01
- paco.me and rauno.me, small interaction craft (copy-to-clipboard feedback, Rauno's craft index: Gooey Tooltip, Toolbar Morph, Hold to confirm): https://paco.me, https://rauno.me/craft
- siteinspire picks chosen with the salt (positions 11 and 12): https://cactusdigitale.com, https://www.coreastudios.com
- Josh Comeau's "boop" hover (basis of **Squish**): https://www.joshwcomeau.com/react/boop/
- Springs baked into CSS `linear()` for WAAPI: https://motion.dev/magazine/how-to-use-your-favourite-gsap-easings-with-waapi and https://ics.media/en/entry/260402/
- Golden-angle disc blur and bokeh weighting (basis of the focus pull): https://gamedev.net/shaderlab/56-depth-of-field-and-bokeh/
- Clay shading ideas, fingerprint dents and Voronoi-flattened normals: https://www.github.com/joebinns/clay
- Opt-in synthesised UI sound with a visitor-controlled mute: https://www.framer.com/marketplace/components/sound-interaction/

## Palette (seed hue 60° OKLCH)

| Token | OKLCH | Hex | Role |
|---|---|---|---|
| Apricot (seed) | oklch(0.78 0.15 60) | #FC9E47 | lens barrel, feet, warm accents |
| Butter | oklch(0.93 0.13 98) | #FFE97E | Blink's body, highlights on ink |
| Bubblegum | oklch(0.80 0.13 355) | #FF99C2 | lens ring, cheeks, Fun Libs world |
| Mint | oklch(0.88 0.11 165) | #8DEFC5 | viewfinder hump, Toolrails world |
| Lilac | oklch(0.78 0.10 290) | #B6ADF3 | shadow tint, Harbor world |
| Sky | oklch(0.84 0.08 230) | #93D5F5 | MCP Emails world |
| Tangerine | oklch(0.68 0.18 48) | #ED6E12 | accent words, loud stickers |
| Cherry | oklch(0.63 0.21 22) | #ED3F4B | shutter button, REC dot |
| Cream | oklch(0.975 0.025 85) | #FFF6E4 | page background |
| Paper | oklch(0.94 0.04 75) | #FBE8CE | cards |
| Cocoa | oklch(0.42 0.07 40) | #6D3F2F | secondary text, shadows in SVG |
| Ink | oklch(0.26 0.05 35) | #381A13 | text (instead of black) |

Same values are `#define`d in `3d/clay-engine.js`, so CSS and renders match.

## Type

- **Bricolage Grotesque** (Google Fonts, OFL). Display: 800, `font-stretch: 75–78%`, tight leading (0.82–0.9). Body: 400 with `font-variation-settings: 'opsz' 14`.
- **DM Mono** 400/500 (Google Fonts, OFL): camera readouts, captions, f-stops, uppercase with +0.06em tracking.
- The wordmark is hand-built from rounded strokes ("clay coils") in `src/make-identity.mjs`, not from a font.

## Motion (motion.js + motion.css, Web Animations API)

1. **Iris Open** (entrance): a six-sided clip-path aperture rotates open over an image, over-exposed at first (`irisOpen(el)`). From the film iris wipe and a real lens stopping down.
2. **Squish** (hover/press): clay squash-and-stretch that rebounds on a spring baked into CSS `linear()` (`squish(el)`, `.m-squish`). From Josh Comeau's "boop".
3. **Rack Focus** (section transition and reveal): blurred and over-exposed to sharp, hunting once before it locks (`rackFocus(el)`, `.m-focus`). Pair it with the `focus` sound.
4. **Shutter Flash** (click): a white flash over the whole page plus a burst of candy sprinkles from the pointer (`shutterFlash({x,y})`).
5. **Sticker Slap** (entrance for badges): dropped from above, overshoots, and the shadow tightens on impact (`stickerSlap(el)`).
6. **Blink idle** (in `3d/blink-live.js`): random 180 ms blinks, gaze follows the pointer, breathing squash, and a spring squash on click.

`autoWire(document)` wires `data-m="iris|focus|slap|squish"`. Everything degrades to a short fade under `prefers-reduced-motion`.

## Sound (sound.js)

All sounds are synthesised with Web Audio (no files): `shutter`, `focus` (AF double beep), `squish`, `slap`, `tick`. Sound is **off by default**. It starts only after the visitor presses the toggle, and the choice is remembered in localStorage (wrapped in try/catch).

## How the renders were made

`src/render.html?scene=<name>&w=&h=&ss=2[&alpha=1]` renders any scene from `3d/scenes.js` with the same engine the site runs live, using 2×2 supersampling per pixel. Stills were captured with headless Chrome (Metal) and encoded to WebP with Pillow. Scenes: `hero`, `hero-tall`, `viewfinder`, `cutout`, `cutout-wink`, `mcp-emails`, `fun-libs`, `toolrails`, `harbor`, `tokens`, `token-*`, `retired-luma`, `prop-*`. A builder can re-bake any of them at another size or angle.

## Inventory

| File | What it is | Intended use | Source | Licence |
|---|---|---|---|---|
| identity/logo-mark.svg | Blink's face; the three-blade aperture forms an A. Dimensional, with gradients | header, about, large brand moments | generated, src/make-identity.mjs | original (client) |
| identity/logo-mark-flat.svg | Flat version of the mark | small sizes, one-colour contexts | generated, src/make-identity.mjs | original |
| identity/wordmark.svg | "albretsen" rolled from cocoa clay coils | header lockup, footer | generated, src/make-identity.mjs | original |
| identity/wordmark-candy.svg | Multicolour candy wordmark | footer, 404, dark sections | generated | original |
| identity/lockup.svg | Mark + wordmark + "AS" pill | site header | generated (pill text uses DM Mono) | original |
| identity/favicon.svg | Flat 64px favicon | `<link rel=icon>` | generated | original |
| identity/favicon-180.png | 180px touch icon on cream | apple-touch-icon | rsvg-convert of favicon.svg | original |
| identity/og-image.jpg | 1200×630 social card | `og:image` | src/og.html in headless Chrome | original + own renders |
| hero/blink-dawn(@2x).webp | Blink waving on a candy dawn stage with a giant clay sun, 1440/2880 wide | desktop hero / hero poster behind the live canvas | clay engine, scene `hero` | original |
| hero/blink-dawn-tall(@2x).webp | 3:4 crop of the same world | phone hero | scene `hero-tall` | original |
| hero/viewfinder-dawn(@2x).webp | Blink in focus over a real dawn photo with the backdrop racked out of focus | second hero / "through the viewfinder" section; fallback for the live canvas | scene `viewfinder` + photo/dawn-field | original + CC0 photo |
| hero/blink-cutout(@2x).webp | Transparent Blink with a soft lilac contact shadow | layering over patterns, about, cursor buddy | scene `cutout` | original |
| hero/blink-wink-cutout(@2x).webp | Transparent Blink, half-lidded wink | 404, footer, avatar | scene `cutout-wink` | original |
| products/mcp-emails(@2x).webp | Blink presenting the **real** MCP Emails icon in a sky-blue world with clay envelopes | MCP Emails card | scene `mcp-emails`, texture `_shared/products/mcp-emails/icon.png` | own render; logo is the client's |
| products/fun-libs(@2x).webp | Real Fun Libs v5 icon, pink world, speech bubble with blank pills, letter blocks | Fun Libs card | scene `fun-libs`, `_shared/products/fun-libs/icon.png` | same |
| products/toolrails(@2x).webp | Real Toolrails icon, mint world, snap-together blocks and a plug | Toolrails card | scene `toolrails`, `_shared/products/toolrails/icon.svg` rasterised as-is (src/toolrails-512.png) | same |
| products/harbor(@2x).webp | Real Harbor mark in its banner colours (#F0EDE8 on #1A1A1A), lilac world, book stack and key | Harbor card | scene `harbor`, `_shared/products/harbor/harbor-mark.svg` with currentColor set to the banner's cream (src/harbor-512.*) | same |
| products/retired/luma.webp | Luma's real wordmark (logo.png) on a white clay plaque, alpha | retired list | scene `retired-luma` | same |
| products/retired/{polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}.webp | Clay coin stand-ins with embossed glyphs (speech bubbles, map pin, eye, laughing face, shield, %), alpha | retired list / "graveyard" | scene `token-*` | original |
| products/retired/tokens-sheet(@2x).webp | All six coins together | retired section header | scene `tokens` | original |
| extras/clay-{sun,cloud,print,lens,heart,star}.webp | Clay props, alpha, 800px | scattered decoration, section dividers, empty states | scenes `prop-*` | original |
| extras/sticker-*.webp (8) | Die-cut stickers: SAY CHEESE!, f/1.8 (brand aperture), 113,000+ installs, since 2016 on Google Play, 17 tools, made in Norway, open source AGPL, REC one outside engagement at a time | slapped around sections, draggable | src/stickers.html in headless Chrome | original (facts from content.js) |
| extras/pattern-sprinkles.svg | Seamless sprinkles tile, 240px | section backgrounds, footer | hand-written SVG | original |
| extras/pattern-apertures.svg | Seamless tile of tiny lenses with the A aperture | brand wallpaper, loading states | hand-written SVG | original |
| extras/clay-grain.webp | 512px tileable greyscale thumbprint and lump grain | `mix-blend-mode: soft-light` overlay at 10–20% | numpy, procedural | original |
| extras/viewfinder-overlay.svg | Viewfinder HUD: corner brackets, AF box, REC, ISO, f/1.8 1/250, exposure scale with needle | over the live hero (ids `vf-focus`, `vf-rec`, `vf-meter-needle` for animation) | hand-written SVG | original |
| photo/dawn-field(@2x).webp | Sunrise over a misty field ("The Early Bird") | viewfinder backdrop (shader texture), about | https://commons.wikimedia.org/wiki/File:The_Early_Bird_(Unsplash).jpg | CC0 (Unsplash upload, pre-2017) |
| photo/sunflower-sky(@2x).webp | Sunflower against a blue sky (Lisa Pellegrini) | "sunlit" section, Norway/summer moments | https://commons.wikimedia.org/wiki/File:Lisa_Pellegrini_2016_(Unsplash).jpg | CC0 |
| photo/snow-sunrise(@2x).webp | Snow field and clouds at sunrise, Nordic light | about / Norway | https://commons.wikimedia.org/wiki/File:Snow_and_clouds_at_sunrise_(Unsplash).jpg | CC0 |
| photo/orbital-sunrise(@2x).webp | Orbital sunrise over Earth (ISS072-E-838362) | "dawn" interlude, blog header | https://images.nasa.gov/details/iss072e838362 | NASA, public domain |
| 3d/clay-engine.js | Raw WebGL2 SDF raymarcher with clay material, fingerprints, SSS, soft shadows, AO, glossy lens glass, logo-tile material, exposure, focus blur | the engine behind all renders and the live hero | original code | original |
| 3d/scenes.js | All scenes (Blink, hero, products, tokens, props) as GLSL | live use and re-baking | original code | original |
| 3d/blink-live.js | `mountBlink(canvas,{scene,scale,photo})`: live mascot with gaze, blinks, shutter squash, `focus()`, `exposure()` | **hero centrepiece** | original code | original |
| 3d/clay-camera.glb | Poly Haven "Camera 01" rangefinder, textures stripped and recoloured as candy clay (850 KB) | interactive toy section | https://polyhaven.com/a/Camera_01 by Rajil Jose Macatangay, via src/make-glb.mjs | CC0 |
| 3d/clay-camera.js | `mountClayCamera(el)`: three.js r170 (jsDelivr, pinned) viewer, drag-spin with spring return, double-click shutter | lazy-loaded toy | original code | original (three.js MIT) |
| 3d/demo.html | Tiny demo of both 3D modules | builder reference | original | original |
| motion.js / motion.css | Five WAAPI signature animations + spring→linear() generator + CSS fallbacks | site-wide motion | original code | original |
| sound.js | Opt-in synthesised sound (shutter, focus, squish, slap, tick) | sound toggle in header | original code | original |
| src/* | Generators: render.html (still baker), make-identity.mjs, make-glb.mjs, stickers.html, og.html, phone.html (390px check), rasterised Toolrails/Harbor textures | re-generation | original | original |

Budget: about 3.3 MB total; the .glb is the largest file (0.85 MB) and should be loaded lazily.

## Notes for the builder

- Live hero: `mountBlink(canvas, { scene: 'viewfinder', scale: 0.6–0.75 })` and inline `extras/viewfinder-overlay.svg` on top. Bind `exposure()` to scroll (−0.8 → +0.4 across the hero) and `focus()` to a slider or to hover over the headline. Use `hero/viewfinder-dawn.webp` as the poster and the no-WebGL fallback. The `hero` scene (dawn stage) works live too.
- Raymarching is GPU-heavy: keep `scale` ≤ 0.75 and let the module pause offscreen (it does this already). On phones, use the baked `blink-dawn-tall` image and mount the live canvas only on tap.
- Product logos are the real files, mapped untouched. Don't recolour the tiles; their colours come from each icon.
- Keep sound opt-in. The header toggle is `sound.bindToggle(button)`.
