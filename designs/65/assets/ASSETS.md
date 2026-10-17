# Design 65 — Clear Noon

Asset kit for Albretsen AS / albretsen.no. Open `preview.html` from a static server rooted at the repo (for example `python3 -m http.server`, then `/designs/65/assets/preview.html`). `?only=<section id>` shows a single section (`lens-sec`, `model`, `products`, `extras`, `motion`).

## Vision

A Norwegian valley under Mediterranean noon: hard white light, deep blue shadows, granite and snow, one red road. The atmosphere sits around a software company. It is not a postcard.

- **Seen from orbit.** The hero is real NASA orbital imagery of Norwegian fjords, regraded so the water goes granite-black and the snow takes glacier-blue shadows. The name sits in the dark water. The photographs cross-dissolve slowly (Noon Dissolve).
- **Seen at noon.** A real elevation model (Copernicus GLO-30) of a Norwegian valley, rendered as a plaster relief under a high sun. This works as a still and as a live three.js model.
- **The timeline is the road.** A least-cost path along the real valley floor (26.7 km) becomes the company timeline: 2016 at the fjord head, today in the foreground. Milestone posts carry the facts from `content.js` (`interactive/milestones.json`).
- **Main street.** Each live or building product is a painted wooden house (falu red, ochre, snow white, glacier grey) in a symmetrical frontal elevation. Behind each house is a real skyline computed from the DEM, and the real product logo sits on an enamel sign. Hover reveals hidden detail: the panes light up, gold-leaf figures appear on the dark glass and the door opens. Harbor is paused, so its shutters stay closed until you look.
- **Luxury restraint.** Each screen carries one idea and a lot of sky. There is one accent (falu red, the road). Gold leaf appears only in hover reveals.

Mood: calm, exact, expensive, quietly effective. The site should read as technical skill (real data, real terrain, real rendering), not as travel. The copy never names places. The `title` elements in the asset files name the source places, but only for credit.

### References

- https://www.metmuseum.org/art/collection (Open Access API): Fearnley, *Gudvangen* (1839), and Dahl, *View over Hallingdal* (1844), used as mood references for scale and silence. Neither is used as an asset.
- https://www.loc.gov/pictures/collection/pgz/ Photochrom Prints, Norway series c.1890–1900. Three plates are used (see the inventory).
- https://www.hoteldelavillevenice.com and https://www.cerealmag.com were researched for restraint, slow crossfades, generous white space and product shots with hard shadows. Both domains failed to resolve from this machine, so the notes on them come from the brief and from general knowledge.
- https://science.nasa.gov/earth/earth-observatory/fjords-of-norway-4605: the salt `4605c5` led straight to this Earth Observatory record, which is the hero source.
- Motion: Framer "Cinefade" (stacked crossfade, https://www.framer.com/marketplace/components/cinefade/). The Ken Burns freeze-at-midpoint problem (Adobe community thread) is solved by decoupling drift from the fade. Codrops, "Dynamic CSS Masks with Custom Properties and GSAP" (https://tympanus.net/codrops/?p=54377), informs the lens. Codrops, "Double Image Hover Effects with Clip-Path Animations" (2023), informs the reveals.
- Technique: Inigo Quilez's eroded-fbm terrain was tried for a procedural fjord shader. It was dropped in favour of real DEM data, which looked better at once.

## Palette

| Token | Hex | OKLCH | Use |
|---|---|---|---|
| Granite | `#1b232b` | oklch(25.2% 0.019 248.6) | ink, night water, dark tiles |
| Slate | `#39434b` | oklch(37.7% 0.019 242.3) | secondary text, plinths |
| Glacier deep | `#3f6274` | oklch(47.7% 0.050 231.6) | links, eyebrows, water |
| Glacier | `#9fbdcc` | oklch(78.1% 0.039 229.5) | shadow side of snow, fills |
| Snow | `#f4f1ea` | oklch(95.9% 0.010 87.5) | page background |
| Stone | `#e9e6df` | oklch(92.5% 0.010 87.5) | cards, wells |
| Moss | `#5f6b46` | oklch(50.8% 0.057 123.0) | rare, valley floors |
| Falu | `#8e2a1e` | oklch(43.8% 0.137 30.2) | the road; the single accent |
| Ochre | `#c48a2c` | oklch(67.5% 0.127 74.8) | houses only |
| Gold leaf | `#c9a24a` | oklch(73.1% 0.115 85.2) | hover reveals only |

On dark imagery, use `#c4553f` for the road rule so it stays legible.

## Typefaces

- **Antonio** (Vernon Adams, SIL OFL 1.1), variable 100–700, latin subset: `fonts/antonio-var-latin.woff2`. Condensed poster face. Set it in caps, tracked +0.06 to +0.12em. Use 400 for the name, 500 for headings and 600 for figures.
- **Alegreya Sans** (Juan Pablo del Peral / Huerta Tipográfica, SIL OFL 1.1), a humanist sans: `fonts/alegreya-sans-{400,400i,500,700}.woff2`. Body copy at 18–20 px with a 1.5 line height. Eyebrows at 12 px, 500 weight, tracked 0.22em, in caps.
- The latin subsets include æ, ø and å. Both fonts came from Google Fonts (fonts.gstatic.com).

## Performance notes

- The hero uses AVIF at 960, 1600 and 2400 with a JPEG fallback at 1280. The first frame is about 170 KB at desktop sizes and about 90 KB on mobile (`coast-portrait-600.avif`). Every `<img>` has width and height set. Later frames are lazy.
- The three.js model (`interactive/relief3d.js`) imports three@0.160.0 from jsdelivr only when mounted. It renders on demand, with no idle loop. The heightmap PNG is 454 KB, so load it only when the model section is near.
- House SVGs are self-contained (logos embedded as data URIs). Inline them to get hover reveals. Use the `-800.webp` pair as a static fallback.
- The whole kit is about 7 MB on disk. A page typically ships under 1 MB at first paint.

## Inventory

| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| `identity/mark.svg`, `mark-light.svg` | Peak mark on a granite or snow tile: condensed A, falu road across its counter | avatar, social, app tile | Drawn by hand in SVG | Original, © Albretsen AS |
| `identity/mark-bare.svg`, `mark-bare-snow.svg` | Mark without a tile | header, footer | same | same |
| `identity/wordmark.svg`, `wordmark-snow.svg`, `wordmark-current.svg` | ALBRETSEN in outlined Antonio 480, tracked +0.12em, with a road rule and AS | header, hero lockups | Outlined from Antonio with fontTools | Original artwork; font OFL (outlining is allowed) |
| `identity/lockup.svg` | Mark and wordmark together | header | same | same |
| `identity/favicon.svg` | Mark tile that inverts in dark mode | favicon | SVG | Original |
| `identity/favicon-180.png` | Apple touch icon | apple-touch-icon | rsvg-convert from mark | Original |
| `identity/og-image.jpg` | 1200×630, wordmark in the fjord | Open Graph, Twitter | Graded ASTER image and wordmark, composited in Pillow | NASA PD + original |
| `hero/aerial-fjord-fingers-{960,1600,2400}.avif`, `-1280.jpg` | Fjords from orbit, regraded to granite, glacier and snow | hero frame 1 | NASA Earth Observatory "Fjords of Norway", ASTER/Terra 17 Apr 2002, USGS EROS "Earth as Art II": https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/4000/4605/aster_norway_artII_lrg.jpg. Regraded with numpy (luminance ramp, local contrast, vegetation to moss). | Public domain (NASA/USGS) |
| `hero/aerial-snowfield-*` | Glacier lakes and ridges (crop of the same scene) | hero frame 2, section bands | same | Public domain |
| `hero/aerial-river-road-{960,1600}.avif`, `-1280.jpg` | Braided river down a snow valley (crop) | hero frame 3, timeline backdrop | same | Public domain |
| `hero/coast-portrait-{600,1000,1300}.avif`, `-1000.webp/.jpg` | The whole southern coast, snowcap and turquoise fjord bloom | mobile hero, tall panels | NASA Earth Observatory "Norwegian Fjord Turns Turquoise", MODIS/Terra 30 May 2020, image by Joshua Stevens: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/146000/146843/norway_tmo_2020151_lrg.jpg. Cropped and regraded. | Public domain (NASA) |
| `hero/relief-romsdal-{1000,1600}.avif`, `-1200.jpg` | Noon relief of a real valley: shaded relief with cast shadows and snow, granite and moss by altitude | about section, lens base, blog covers | Copernicus GLO-30 DEM tile N62E007 (window x800–1800, y1400–2400), rendered in numpy (normals, ray-marched horizon shadows, filmic tone) | DEM © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the EU and ESA; free for any use with attribution. Render original. |
| `hero/relief-romsdal-road-1600.avif`, `-1200.jpg` | Same relief, with the road traced along the valley floor | timeline section | same, road from scikit-image `route_through_array` | same |
| `products/house-{mcp-emails,fun-libs,toolrails,harbor}.svg` | A wooden house per product with the real logo on an enamel sign, a real DEM skyline behind and noon shadows. Hover reveal is built in. | product cards (inline the SVG) | Generated SVG (Python): skyline computed from the DEM (max elevation angle per azimuth, three distance bands), grain via feTurbulence | Original. Logos © their products, embedded unchanged. |
| `products/house-*-revealed.svg` | Same houses with the revealed state baked into the CSS | static use, print | same | same |
| `products/house-*-800.webp`, `house-*-revealed-800.webp` | Raster fallbacks for both states | `<img>` fallback, OG for product pages | rsvg-convert then Pillow | same |
| `products/logos/*` | Real product logos, copied unchanged from `designs/_shared/products` | reference, re-use | designs/_shared/products | © the products (owned by Albretsen AS) |
| `products/retired/*.svg` | Enamel house-number plates for Luma (real logo), Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, Early apps | "earlier work" row | Generated SVG, outlined Antonio | Original; Luma logo unchanged |
| `interactive/relief3d.js` | three.js plaster model of the valley: noon sun follows the pointer, falu road tube, milestone posts with hover callbacks, `setProgress()` for a scroll-driven drive, `view` option for eye-level shots | hero alternative, timeline section | Hand-written; three@0.160.0 from cdn.jsdelivr.net | Original (MIT-compatible); three.js MIT |
| `interactive/relief-demo.html` | Tiny demo: slider, pointer sun, milestone tags. `?bake` hides the UI | demo | Hand-written | Original |
| `interactive/romsdal-height.png/.json` | 512² heightmap, 16-bit packed in R (high byte) and G (low byte), with a decode formula | model data | Copernicus GLO-30 | as DEM above |
| `interactive/road.json` | Road polyline normalised to the heightmap (41 points, 26.7 km) | model, SVG timelines | Least-cost path on the DEM | Original data derived from the DEM |
| `interactive/milestones.json` | Eight timeline posts with years and notes, taken only from content.js | timeline copy | content.js | Original |
| `extras/model-romsdal-{1000,2000}.avif`, `-1200.jpg` | Baked still of the 3D model | poster for the model before it loads, about page | Headless Chrome screenshot of relief-demo | Original |
| `extras/contours-romsdal.svg` | 100 m contours (500 m emphasised) with the road, same frame as the relief | Relief Lens underlay, line art | scikit-image `find_contours` on the DEM | as DEM |
| `extras/road-line.svg` | Standalone road with milestone dots; `pathLength=1` | Road Draw animation | from road.json | Original |
| `extras/plate-valley-road-{700,1400}.avif`, `-1000.jpg` | Photochrom of a valley road c.1890–1900, regraded to noon granite | blog plates, about page | Library of Congress, Photochrom Prints, LC-DIG-ppmsc-06206, "On the road from Veblungsnaes to Romsdal": https://tile.loc.gov/storage-services/service/pnp/ppmsc/06200/06206v.jpg | No known restrictions (LoC) |
| `extras/plate-trolltindene-*` | Photochrom of a mountain wall | same | LoC LC-DIG-ppmsc-06204, "Troldtinderne, Romsdalen": https://tile.loc.gov/storage-services/service/pnp/ppmsc/06200/06204v.jpg | No known restrictions |
| `extras/plate-geiranger-*` | Photochrom of a fjord cliff and waterfall | same | LoC LC-DIG-ppmsc-06119, "Seven Sisters, Geiranger": https://tile.loc.gov/storage-services/service/pnp/ppmsc/06100/06119v.jpg | No known restrictions |
| `extras/shutter-shadow-1200.webp` | Noon light through a louvred shutter, transparent overlay | laid over cards and sections for warmth | Procedural (numpy) | Original |
| `extras/paper-512.{webp,jpg}` | Tileable warm snow paper with long fibres | page background | Procedural FFT noise | Original |
| `extras/grain-256.png` | Tileable film grain (RGBA) | fixed overlay, multiply at 6–40% | Procedural FFT noise | Original |
| `extras/milestone-post.svg` | Small milestone post illustration | timeline markers, list bullets | SVG | Original |
| `motion.css`, `motion.js` | Motion study (see below) | site motion | Hand-written | Original |
| `preview.html` | Contact sheet | review | Hand-written | Original |

The retired products have no real assets apart from Luma. Their plates are stand-ins and use only names and years from content.js.

## Motion study

1. **Noon Dissolve** (`.dissolve` + `noonDissolve()`): stacked photographs. The incoming frame fades over the outgoing one in 2.4 s, so it never fades through colour. Each frame drifts (scale 1.06 to 1) on its own longer timeline, so movement never freezes mid-fade. The cycle pauses off-screen and in hidden tabs. Reference: Framer Cinefade, and the Ken Burns freeze-at-midpoint problem.
2. **Relief Lens** (`.lens` + `reliefLens()`): a soft circular mask, eased toward the pointer at 0.12, reveals the contour and road drawing under the relief. The radius grows through a registered `@property --r`. Reference: Codrops "Dynamic CSS Masks".
3. **Road Draw** (`.road-draw` + `roadDraw()`): the falu road draws itself with `pathLength=1`. It is scroll-driven (`animation-timeline: view()`) where supported, and draws once on entry otherwise. Milestones fade in after the line.
4. **Shadow Swing** (`.swing`): objects carry a hard offset noon shadow. On hover the shadow swings to the other side and shortens, and the object lifts 2 px over 700 ms.
5. **Condensed Rise** (`condensedRise()`): poster letters rise from a baseline mask with a 45 ms stagger, then the road rule extends. Use it once per page.
6. **Window Light** (inside each house SVG, plus `.house-card` triggers): panes light up, gold-leaf figures appear on the dark glass, the door opens and Harbor's shutters fold away.

All six use one easing, `cubic-bezier(.2,.7,.2,1)`, and all honour `prefers-reduced-motion`.

## Builder notes

- In the hero, put the name in the dark water (fjord-fingers has a large dark band in its lower middle). Keep the gradient at the foot.
- Product cards: the house is the image. Put the product name, the one-line description and the figure underneath in Alegreya and Antonio. The sign on the house is small by design.
- Timeline: use either the 3D model (desktop) or `relief-romsdal-road` with `road-line.svg` (mobile and low power). The milestones are in `milestones.json`.
- Do not add place names to visible copy. Credits belong in the footer.
