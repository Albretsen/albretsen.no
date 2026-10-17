# Ground Glass: asset kit for design 81

> The ground glass is the screen inside a camera where the picture comes into focus.

## Vision

Albretsen AS seen through a viewfinder at night. The kit is a paper-cut collage, built from 19th-century museum photographs (fjord mountains, a sea cliff, the moon, Yosemite's circular views) and violet card. Every photograph is regraded into one hue (OKLCH 288°). The pieces are staged on real depth planes in three.js, so the visitor can turn a focus ring. **The products are always the one sharp thing in the frame.**

- **Personality:** quiet confidence. One strong idea per screen, generous dark space, light used sparingly where it matters: the moon, the glint, the logo plate.
- **Spark words:** *glow* (the moon halo and the violet highlight shoulder), *nocturne* (the whole palette), *tension* (the moon held half a stop behind the ridge, the iris overshoot, the shallow depth of field).
- **The site is about software, not travel.** The landscape is atmosphere. Copy should never name it. Treat the camera vocabulary (focus, exposure, aperture, frame numbers) as the brand's interface language, not as decoration.
- **Not:** gears, film-camera mechanics as ornament, retro "vintage camera" clichés, neon, cartoon.

### Hero concept

The landing view is the live scene inside `viewfinder.svg`. The page loads on the baked still (`hero/nocturne-*`), and the three.js canvas fades in over it after first paint. Pressing **F** racks focus plane by plane: treeline → headland → water → peaks → moon. **[ ]** changes exposure, **A** stops down, **Space** takes an exposure, and **?** opens the cheat sheet. As the page scrolls, the builder can rack focus from the far peaks (hero) to the headland (about) to the treeline (contact), and every section heading arrives through `rackFocus`.

### References (researched)

| URL | What it informed |
|---|---|
| https://commons.wikimedia.org | Source of the Rijksmuseum CC0 Norwegian photographs (salt 451b76 picked results 4, 5, 1, 11, 7, 6) |
| https://www.metmuseum.org/art/collection (Open Access API) | Watkins circular Yosemite views, Whipple moon. Public-domain flags checked per object |
| https://www.framer.com/gallery | Restraint in single-image heroes. Layered-plane parallax (Framer "3D Parallax" component) |
| https://motion.dev/examples | "Spring: Follow Cursor", "Scroll Zoom Hero", "Reveal text effect" (pacing for rackFocus, paperLift) |
| https://paco.me | Quiet personal-site tone, few moving parts, every one intentional |
| https://blog.maximeheckel.com/posts/the-physics-behind-spring-animations/ | Damped spring derivation |
| https://kitemetric.com/blogs/physics-based-spring-animations-in-javascript | Semi-implicit Euler ordering (velocity first) |
| https://preview.hex.pm/preview/shift/show/assets/js/spring.js | Fixed high-rate sub-stepping (240 Hz) and the critical-damping check |
| https://www.rememberthemilk.com/forums/ideas/1971/ | History of the "?" shortcut overlay (Google Reader → Linear/GitHub) |
| https://www.producthunt.com/products/hotkey-hint | Grouped shortcut overlay patterns |
| https://freefrontend.com/javascript-diorama/ | Layered paper diorama techniques. Chose real z-planes over parallax-occlusion for cost |

## Palette: OKLCH, single hue 288°

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| ink | 0.13 0.035 288 | `#070514` | page ground |
| night | 0.18 0.055 288 | `#110c28` | cards, sheet |
| umbra | 0.24 0.08 288 | `#1f1642` | raised card, mark peak |
| dusk | 0.32 0.11 288 | `#322566` | keys, second card |
| iris | 0.42 0.15 288 | `#4d3898` | live state, rules |
| violet | 0.54 0.17 288 | `#6d58ca` | accents, mark reflection |
| lilac | 0.68 0.13 288 | `#958ae4` | italic display, moon in mark |
| haze | 0.80 0.08 288 | `#bbb6ef` | secondary text |
| mist | 0.89 0.045 288 | `#d9d7f8` | body text |
| paper | 0.95 0.022 288 | `#ededfd` | headlines |
| glow | 0.985 0.012 288 | `#f9f9ff` | highlights, logo plates |

All photographs are graded onto this ramp. Chroma peaks in the mid tones and falls toward ink and paper (`grade()` in the build notes). Tokens are in `motion.css`.

## Typefaces (all SIL OFL, Google Fonts)

- **Instrument Serif** (regular and italic): display, product names and figures. Use the italic in lilac for one phrase per headline at most.
- **Geist** (400/500): body text.
- **Geist Mono** (400/500): readouts, labels (uppercase, +0.12em), keys and the MCP command.

The wordmark is Instrument Serif converted to paths, so it needs no font.

## Inventory

| File | What | Intended use | Source / how made | Licence |
|---|---|---|---|---|
| `mark.svg` | Moon behind a cut peak. The horizon slit makes the A | logo on light | hand-built SVG (Python generator) | original |
| `mark-on-dark.svg` | same, inverted tones | logo on dark | as above | original |
| `wordmark.svg`, `wordmark-on-dark.svg` | mark + "Albretsen" + "AS", outlined | header, footer | Instrument Serif glyph outlines via fontTools | OFL font outlines, original lockup |
| `favicon.svg`, `favicon-180.png` | mark on an umbra tile | favicon, apple-touch-icon | SVG + rsvg-convert | original |
| `og.jpg` | 1200×630 nocturne + wordmark + line | Open Graph / social | crop of the baked hero + Pillow type | derived from CC0 photos |
| `hero/nocturne-{960,1600,2400}.{avif,webp,jpg}` | **Hero A.** Moonrise behind a snow peak, dark headland, broken moonlight on water, blurred spruce ridge | landing hero (LCP image, 16:9) | the live three.js scene rendered in headless Chrome at 2400×1350, then encoded with Pillow | derived from CC0 (below) |
| `hero/nocturne-portrait-{640,1000}.*` | Same scene in portrait, focus racked to the headland, +0.25 EV | mobile hero (`<picture>` art direction) | as above at 1000×1500 | derived from CC0 |
| `hero/lens-{960,1600,2400}.*` | **Hero B.** Watkins circular view set in six cut-card rings with a focus-distance scale | about / second chapter, or "the work" divider | Python compositing of the CC0 print, procedural card rings, Pillow type | derived from CC0 |
| `scene/scene.js` | **Interactive centrepiece.** `mountScene(canvas, opts)` exposes `setFocus`, `focusOn`, `setExposure`, `setAperture` and `dispose` | live hero | three.js 0.170.0 (import map). Custom GLSL: 24-tap disc DOF, exposure with a violet shoulder, star field, animated water glints | original code |
| `scene/demo.html` | Full-screen demo with keys F, [ ], A. `?still=1&focus=&exposure=&aperture=` bakes stills | demo, re-baking heroes | — | original |
| `scene/layer-far.webp` | Opstryn mountains, cut out | scene layer | Rijksmuseum RP-F-F00945-25, skyline cut by hand-guided detection, graded | CC0 |
| `scene/layer-mid.webp` | Sea cliff headland, cut out | scene layer | Rijksmuseum RP-F-2007-349-29, graded | CC0 |
| `scene/layer-water.webp` | Sea surface | scene layer | same photograph, lower half | CC0 |
| `scene/layer-near.webp` | Spruce ridge in cut card | scene foreground | procedural cut-paper silhouette (Python) | original |
| `scene/moon.webp` | The moon, cut as a disc | scene, extra cut-out | J. A. Whipple, *The Moon*, 1857–60, The Met 263157 | CC0 |
| `viewfinder.svg` | Paper mask, AF brackets, split-prism reticle, exposure scale | overlay on the hero (use `object-fit: cover`) | hand-built SVG | original |
| `products/mcp-emails.{webp,jpg}`, `-600.webp` | Real MCP Emails wordmark on a glow plate, in focus. Blurred village-by-the-water behind | product card / page header | `_shared/products/mcp-emails/logo-wordmark.svg` (unchanged) + Rijksmuseum RP-F-F00945-10 | logo: Albretsen AS; photo CC0 |
| `products/fun-libs.*` | Real Fun Libs v5 icon (squircle mask as on a phone) | product card | `_shared/products/fun-libs/icon.png` + Watkins (Met 732778) | logo: Albretsen AS; photo CC0 |
| `products/toolrails.*` | Real Toolrails icon | product card | `_shared/products/toolrails/icon.svg` + Rijksmuseum RP-F-F18164 (Svartisen) | logo: Albretsen AS; photo CC0 |
| `products/harbor.*` | Real Harbor wordmark on a plate | product card | `_shared/products/harbor/harbor-wordmark.svg` + Rijksmuseum RP-F-F12504 | logo: Albretsen AS; photo CC0 |
| `products/retired/*.svg` | 35 mm negative frames with cut-paper glyphs: polyglot-pilot, pinpoint, webvakt, joke-central, tryggere-hyring, early-apps | retired-products list (Luma uses its real `luma-monogram.svg`) | hand-built SVG | original |
| `extras/card-tooth.webp` | 512 px seamless violet card stock | section backgrounds (`background-size: 256px`) | FFT-filtered noise + fibre streaks | original |
| `extras/tooth-overlay.png` | alpha-only tooth | lay over any shade | as above | original |
| `extras/iris.svg` | 7-blade aperture, half open | loading state, section mark | same geometry as `irisReveal()` | original |
| `extras/round-print.webp` | Round 1878 Yosemite print with a paper margin | about-page collage piece | Watkins, Met 732769 | CC0 |
| `extras/focus-scale.svg` | ∞ → 0.5 m distance scale | section divider. Can mark scroll progress | SVG | original |
| `extras/frame-counter.svg` | 01–12 frame counter | section numbering / blog index | SVG | original |
| `extras/film-edge.svg` | Sprocket strip, tiles horizontally | footer edge, blog list | SVG | original |
| `extras/cursor-reticle.svg` | Focus reticle cursor (hotspot 16 16) | over the live scene | SVG | original |
| `motion.js` | Spring integrator + 5 signature animations + `bindKeys` | site-wide | original | original |
| `motion.css` | Tokens, iris/flash/key/sheet styles | site-wide | original | original |
| `preview.html` | Contact sheet of everything, live scene, demos. `?only=<section-id>` isolates one section | review | — | — |

### Photograph sources (all downloaded at reduced size, then regraded)

| Short name | Object | URL | Licence |
|---|---|---|---|
| opstryn | A. S. Hagen, *Opstrynsvand*, c.1870–98, Rijksmuseum RP-F-F00945-25 | https://commons.wikimedia.org/wiki/File:Gezicht_op_Opstrynsvand_en_fjord_in_Noorwegen_Opstrynsvand_(titel_op_object),_RP-F-F00945-25.jpg | CC0 |
| klif | *Klif uitlopend in zee*, 1896, Rijksmuseum RP-F-2007-349-29 | https://commons.wikimedia.org/wiki/File:Klif_uitlopend_in_zee_(fjord_in_Noorwegen),_RP-F-2007-349-29.jpg | CC0 |
| geiranger | A. S. Hagen, *Merok, Geiranger*, RP-F-F00945-10 | https://commons.wikimedia.org/wiki/File:Gezicht_op_Geiranger_en_fjord_in_Noorwegen_Merok._Geiranger_(titel_op_object),_RP-F-F00945-10.jpg | CC0 |
| svartisen | *Svartisen Glacier*, 1880–1900, RP-F-F18164 | https://commons.wikimedia.org/wiki/File:Gletsjer_in_Noorwegen_Svartisen_Glacier,_Nordland_(titel_op_object),_RP-F-F18164.jpg | CC0 |
| naeroy04 | *Nærøyfjord* stereograph, 1882–90, RP-F-F12504 | https://commons.wikimedia.org/wiki/File:Gezicht_op_de_Nærøyfjord_in_Noorwegen,_RP-F-F12504.jpg | CC0 |
| moon | J. A. Whipple, *The Moon*, 1857–60, The Met 263157 | https://www.metmuseum.org/art/collection/search/263157 | CC0 (Open Access) |
| circ1 / circ2 / circ3 | C. E. Watkins, [Yosemite National Park], c.1878, The Met 732778 / 732755 / 732769 | https://www.metmuseum.org/art/collection/search/732755 | CC0 (Open Access) |

Downloaded but unused (for the builder if needed): Watkins *Mirror View of Cathedral Rocks* (Met 264930), Rutherfurd *Full Moon* (Met 813902), Whistler *Nocturne* (Met 337702). All three are CC0.

## Motion study (`motion.js`)

One semi-implicit Euler integrator with fixed 240 Hz sub-steps. A single rAF ticker sleeps when all springs rest, and `prefers-reduced-motion` snaps every spring to its target.

1. **Rack Focus** (`rackFocus`, `rackFocusOnView('[data-rack]')`). Blur 14→0 px, opacity 0.45→1, and a 2.5% scale "breathing", as a real lens changes framing while focusing. Uses the `focus` preset (k120 c22, near critical, no bounce). Reference: cine focus pulls, motion.dev "Reveal text effect". Use it on every section heading as it enters.
2. **Iris** (`irisReveal(el)` returns a spring, 0 closed to 1 open). Seven curved half-plane blades retract while untwisting 38°. The `iris` preset (k210 c19) is slightly under-damped, so it settles with one soft overshoot. Use it for image reveals and page transitions.
3. **Paper Lift** (`paperLift(el)`). Hover or focus lifts a card. Its two-layer shadow grows and softens, and the card tilts up to 4° toward the pointer. Uses the `paper` preset (k320 c24). Reference: motion.dev "Spring: Follow Cursor".
4. **Shutter** (`shutter(el)`). A violet-white screen-blend flash and a 1.2% dip that recovers. Uses the `shutter` preset (k600 c30). Bound to Space.
5. **Develop** (`developSheet(el)`). The shortcut sheet rises from below with a slight rotation, like a print lifted from a tray. Its rows follow with a 35 ms stagger.

**Keyboard** (`bindKeys`). Shortcuts are ignored while typing in inputs and when modifier keys are held. Each press lights its `<kbd data-key>` on the visible cheat sheet (`.is-hit`). Suggested site map:

| Key | Action |
|---|---|
| F | rack focus to the next plane |
| [ / ] | exposure −/+ 0.3 EV |
| A | stop down |
| Space | shutter |
| 1–4 | jump to a product |
| R / I | replay rack focus / iris |
| ? / Esc | open / close the sheet |

Always show a small `? shortcuts` chip, bottom left.

## Notes for the builder

- **Performance:** first paint is the `<picture>` hero (AVIF 1600 is 40 KB). Load three.js plus the scene layers (about 670 KB of WebP) with `import()` after `load` or on first interaction, then fade the canvas over the still. The scene pauses when off-screen.
- **Layout shift:** every `<img>` in `preview.html` has width and height. Keep it that way.
- **Exposure as theme:** `cam.setExposure(+0.6)` gives a lighter "blue hour" without a second palette. Don't add a light theme with other hues.
- **Product facts** come from `_shared/content.js`. The cards already carry the figures: $782 MRR, 113,000+ installs, 4 connectors, 549 commits.
