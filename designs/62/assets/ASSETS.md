# 62 · Morning Elevation

**The sun moves. Everything else is still.**

## Vision

A Norwegian small town at seven in the morning, drawn like an architect's front elevation. One perfectly symmetrical wooden empire-style house stands centred and frontal, in the Wes Anderson manner. It is painted the peach of first light, with linseed-white trim, a pale-blue door under a sunburst fanlight, and two clipped box balls. Its four ground-floor shop windows are lit, and in each one stands a live product on a card: MCP Emails, Fun Libs, Toolrails, Harbor. Retired products are windows with their shutters closed. Alpenglow mountains rise in the haze behind, and two falu-red neighbours frame the edges. Long leaf shadows from birches out of frame fall across the square.

The idea: **the company is the building**. It is calm, symmetrical, well kept and lit from inside. Nothing needs to shout, because the craft is in the proportions, the light and the detail. The only motion in the whole system is the sun: as you scroll, the day passes, shadows swing and lengthen, the sky warms, and at dusk the lamps come on in the windows.

It blends the brief's two worlds. Norwegian small-town life provides the wooden houses, falu red and the quiet square. Sunshine provides the warm glow on everything. The base light is soft Nordic overcast, silver and calm, so the warmth reads as a gift rather than a filter.

**Mood:** effortless elegance, early, unhurried, precise.
**Not:** a hotel, a travel brochure, a bakery brand. The house is a frame for software, and there are no place names or postcard clichés in any copy.

### References (researched)
- https://www.loc.gov/pictures/collection/travel/: the Photochrom travel prints, a lesson in hand-graded colour on real photographs (the basis for grading photos into a palette rather than filtering them).
- https://www.chateaumarmont.com: a single framed image, very few words, and a name set large and quiet.
- https://www.rauno.me: craft in small interactions ("devouring details"). This is where the light-rake shadows and the drag-the-sun scrubber come from.
- https://www.airbnb.com/luxury: framed architectural photography and generous space.
- Scroll-driven day-to-night pattern: https://dev.to/_artclick/build-a-scroll-driven-day-to-night-animation-using-pure-css-1o3p and MDN https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations
- Procedural wind and pink noise for Web Audio: https://softsynth.com/jsyn/examples/wind_circuit.php, plus Paul Kellet's pink filter (via https://docs.swmansion.com/react-native-audio-api/docs/guides/noise-generation)
- Harald Sohlberg's Røros street paintings (public domain, National Museum): the colour of wooden facades in low northern light. Used as reference only, not as an asset.
- Salt 7f69da drove which result was opened in several search lists: items 7, 15, 6, 9, 13 and 10. That turned up *Fog over lake in Oslo*, *Lake cabin in Flåm*, *Hardangervidda*, *Hellesylt*, among others. *Cabin Window* came from the same list.

## Palette

| Name | Hex | OKLCH | Use |
|---|---|---|---|
| Linseed | `#f7f1e6` | oklch(96.0% 0.016 82.8) | page ground, trim, cards |
| Facade peach | `#f2b98f` | oklch(82.8% 0.086 57.6) | the house, large fields |
| Sunrise gold | `#f6c56b` | oklch(84.9% 0.122 81.1) | the sun, highlights, focus ring |
| Ember | `#e48e5c` | oklch(72.6% 0.124 50.0) | the one accent (mark's sun, links on hover) |
| Pale sky | `#b9cfe3` | oklch(84.4% 0.037 245.7) | sky, cool sections |
| Shutter blue | `#9fbad0` | oklch(77.6% 0.043 242.8) | the door, shutters, plaques |
| Louvre | `#7f9db6` | oklch(68.2% 0.050 243.7) | shutter shadow lines, secondary text on blue |
| Overcast | `#dfe3e6` | oklch(91.4% 0.006 239.8) | silver base light, rules |
| Falu red | `#8e3326` | oklch(45.0% 0.126 30.7) | neighbours only, used sparingly |
| Box hedge | `#3d5a3a` | oklch(43.5% 0.062 142.2) | tiny botanical accents |
| Ink | `#2b2d3a` | oklch(30.1% 0.024 278.0) | type, linework |

Light theme is primary (it is morning). For a dark mode, use the dusk image, with ink `#1f2130` as ground and linseed type. The windows then become the brightest things on the page, which is right.

## Typefaces

| Role | Face | Licence | File |
|---|---|---|---|
| Display | **Italiana** (Santiago Orozco): a thin Didone with Art Deco proportions. Capitals only, tracking 0.30–0.34em. | SIL OFL 1.1 | `fonts/italiana.woff2` (Latin-1 subset, 9 KB) |
| Text | **Jost** (indestructible type*): a geometric sans after 1920s Futura. Variable 100–900. Use 400 for body and 500 for labels, with 0.2em-tracked uppercase eyebrows. | SIL OFL 1.1 | `fonts/jost-var.woff2`, `fonts/jost-italic-var.woff2` |
| Accent | **Poiret One** (Denis Masharov): occasional pull-lines only | SIL OFL 1.1 | `fonts/poiret-one.woff2` |

All fonts come from github.com/google/fonts (ofl/), subset with fonttools to Latin-1 plus punctuation. The identity SVGs use outlined glyphs, so they do not depend on the fonts.

## The 3D house (interactive asset)

`3d/facade.js` is an ES module that builds the house from three.js primitives (three@0.170.0 from jsDelivr, pinned):
- The front walls are `ShapeGeometry` with real window openings. Each window has a reveal, glazing, a sill and a crown, so the shadows are geometry, not paint.
- It is dressed in ambientCG CC0 photo textures: painted clapboard, falu clapboard, paving and roof tiles.
- An IBL environment comes from the graded sky photograph.
- Window interiors are canvas textures, each carrying a **real product logo** on a card (no redraws).
- Invisible birches outside the frame exist only to cast moving leaf shadows.
- API: `createFacade({canvas, base, sun, width, height, pixelRatio, skyUrl})` returns `{ setSun(t), resize(w,h), render(), frameWindow(i) }`.
- `3d/demo.html` is the live demo: the static hero first, then the 3D fades in at idle. Drag the sun, and toggle the sound.
- `3d/bake.html` is the offline renderer that produced the stills (`?sun=&w=&h=&win=&dump=1`, read back via headless Chrome `--dump-dom`).

Only `setSun` should ever animate. Render on demand (on change), not in a loop.

## Motion (motion.css / motion.js)

One custom property, `--me-t` (0 dawn to 1 dusk), is driven by scroll through a morning-heavy curve, eased with a critically damped follow.
1. **Sun Arc**: the disc and the sky gradient travel an elliptical arc.
2. **Light Rake**: `box-shadow` and `text-shadow` offsets swing with the sun angle and lengthen when it is low.
3. **Shutter Open**: louvred leaves fold back with `rotateY` (900 ms, ease-out quint) when a product window enters the view.
4. **Deco Settle**: the wordmark's tracking settles from 0.9em to 0.34em once, over 1.6 s.
5. **Lamplight**: interiors warm up when `--me-t` is above 0.6.

`prefers-reduced-motion` pins the day at 0.16 (the hero) and removes the transitions.

## Sound (signature delight)

`audio/ambient.js` (`Ambience` class) is opt-in and synthesised with Web Audio, with **no audio files**:
- Wind: pink noise, band-passed, with a wandering cutoff.
- A far sea: brown noise with a 9 s swell.
- A town square at seven: FM bird chirps that are densest at dawn, and a rare distant bell built from additive partials.

It follows `setTimeOfDay(t)` and fades in over 2.5 s and out over 1.2 s. It suspends when the tab is hidden.

## Inventory

| File | What | Intended use | Source (how made) | Licence |
|---|---|---|---|---|
| identity/mark.svg, mark-light.svg | The pediment A: an A as a classical gable, with the horizon crossbar and a half sun rising | logo, nav, footer | drawn by hand in SVG | original, for Albretsen AS |
| identity/wordmark.svg | mark + ALBRETSEN (Italiana, outlined) + AS (Jost) | header lockup | fonttools outlines of OFL fonts | original; fonts OFL |
| identity/wordmark-type.svg | name only, `currentColor` | hero type | as above | as above |
| identity/favicon.svg, favicon-180.png | mark on a peach tile | favicon, apple-touch | SVG; PNG via rsvg-convert | original |
| identity/og-1200x630.jpg | the dawn hero with wordmark | Open Graph / social | Pillow composite | original + CC0 sources below |
| img/hero-facade-dawn-{2400,1600,1024}.{avif,webp,jpg} (2400: avif/webp only) | main hero matte painting at first light | home hero | three.js render (bake.html) composited in numpy/Pillow over the graded CC0 sky and keyed CC0 mountains, then haze, bloom, grade and grain | original composite; sources CC0 |
| img/hero-facade-dawn-tall-{1200,800} | portrait camera of the same scene | phone hero (`max-aspect-ratio:1/1`) | as above | as above |
| img/hero-facade-dusk-{2400,1280} | the same house, late golden light, sun on the right | end of scroll, footer, dark mode | as above; sky flipped and warmed | as above |
| img/hero-town-morning-{2160,1440,960} (2160: avif/webp only) | real Røros street with church tower, picket fence, peach morning sky | second hero, blog, about | photo by Sivbenteu, sky keyed and replaced with a graded CC0 sunset sky, town relit | CC0 (both sources) |
| img/backdrop-sky-mountains-1920 | empty plate: sky, mountains and haze | behind the live 3D; page header | composite of the two CC0 sources | CC0 sources |
| img/sky-dawn-2400.jpg | the graded sky alone | section backgrounds | graded from CC0 photo | CC0 |
| products/window-{mcp-emails,fun-libs,toolrails,harbor}-{1200,640} (1200: avif/webp only) | each live product in a lit shop window with dappled morning shadow | product cards and pages | 3D close-up (`frameWindow(i)`), graded; **real logos** from designs/_shared/products | original; logos belong to their products |
| products/retired/shutters-*.svg (7) | retired products as closed-shutter windows with a painted initial (Luma shows its real logo) | "earlier work" grid | SVG, glyphs outlined from OFL fonts | original |
| products/logos/* | unchanged copies of the real product logos | used by facade.js interiors | copied from designs/_shared/products | product owners |
| extras/elevation-drawing.svg | front elevation at 1:100 with the sun's dashed arc | about section, blog header, loading state | generated from the 3D dimensions (Python to SVG) | original |
| extras/fanlight-divider.svg | section rule taken from the fanlight | between sections | SVG | original |
| extras/plaque-since-2016.svg | enamel house plaque: "Since 2016 on Google Play" | history line, footer | SVG | original |
| extras/sun.svg | the sun disc with halo | Sun Arc motion | SVG gradients | original |
| extras/clapboard-peach-512.jpg, clapboard-falu-512.jpg | seamless painted-board tiles | CSS backgrounds, cards | ambientCG WoodSiding009 (colour + AO), recoloured | CC0 (ambientCG) |
| extras/linen-grain-256.png | tileable alpha grain | page overlay (multiply, 0.3) | generated in numpy | original |
| extras/leaf-shadow-1600.png | dappled low-sun birch shadow (alpha) | over sections; drifts with `--me-t` | procedural branches in Pillow, blurred and sheared | original |
| extras/cabin-window-{1200,700} (1200: avif/webp only) | old log-cabin window, graded warm | about / blog detail | photo by Steinar Engeland (Unsplash, via Commons), graded | CC0 |
| 3d/facade.js, 3d/demo.html, 3d/bake.html | the live house, its demo, the offline renderer | interactive hero | written for this kit; three.js r170 (MIT) by CDN | original; three.js MIT |
| 3d/tex/siding-*, falu-*, paving-*, roof-* | PBR textures (colour, normal, roughness, AO), downsized and some desaturated for tinting | facade.js | ambientCG WoodSiding009, WoodSiding005, PavingStones070, RoofingTiles012A (ambientcg.com) | CC0 |
| 3d/tex/sky-env.jpg | small graded sky for the IBL environment | facade.js | from the CC0 sky | CC0 |
| audio/ambient.js | synthesised ambience: wind, sea, town square | opt-in sound toggle | Web Audio code, no samples | original |
| motion.css, motion.js | the motion study (5 named animations) | site-wide | written for this kit | original |
| fonts/* | Italiana, Jost (+italic), Poiret One, woff2 subsets | type | github.com/google/fonts | SIL OFL 1.1 |

### Photographic sources (all downloaded from Wikimedia Commons)
| Source | Author | URL | Licence |
|---|---|---|---|
| Sky Clouds and Atmosphere.jpg | unknown author (as listed on Commons) | https://commons.wikimedia.org/wiki/File:Sky_Clouds_and_Atmosphere.jpg | CC0 |
| Swiss Alps under a blue sky (Unsplash).jpg | mike dennler | https://commons.wikimedia.org/wiki/File:Swiss_Alps_under_a_blue_sky_(Unsplash).jpg | CC0 (Unsplash, pre-2017) |
| Røros and the church tower.jpg | Sivbenteu | https://commons.wikimedia.org/wiki/File:R%C3%B8ros_and_the_church_tower.jpg | CC0 |
| Dusk Sunset Sky.jpg | unknown author (as listed on Commons) | https://commons.wikimedia.org/wiki/File:Dusk_Sunset_Sky.jpg | CC0 |
| Cabin Window (Unsplash).jpg | Steinar Engeland | https://commons.wikimedia.org/wiki/File:Cabin_Window_(Unsplash).jpg | CC0 |
| ambientCG WoodSiding009 / WoodSiding005 / PavingStones070 / RoofingTiles012A | Lennart Demes, ambientCG | https://ambientcg.com/ | CC0 |

## Notes for the builder
- **First paint:** serve the `<picture>` hero (AVIF 1024/1600/2400, a portrait source under 1:1) with width and height set and `fetchpriority=high`. The AVIF hero is about 51 KB at 1600. Load `facade.js` at idle, and only if WebGL2 is available. The canvas fades in over the identical still, so layout shift is 0.
- **Copy voice:** short, declarative, unhurried. The building metaphor stays visual and never gets written out ("our doors are open" is banned along with "hire me").
- **The sky is for the name.** Set ALBRETSEN in Italiana at 9vw with 0.3em tracking, top-centre, in the dawn hero.
- **Symmetry** is the brand: centre the axes, use pairs of everything, and use a single accent (ember).
- **The products are the windows.** Scrolling past the facade can hand off to the four window close-ups, with the Shutter Open reveal on each.
