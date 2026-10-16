# Design 44 · Darkfield

Asset kit for Albretsen AS / albretsen.no. Open `preview.html` first: it shows every asset, plays the particles, the motion study and the keyboard layer. Serve the repo root (`python3 -m http.server`); the page uses ES modules and fetch.

## Vision

In darkfield microscopy the light never hits the lens directly. Only what is really there scatters it, so the specimen shines on black. Albretsen AS is presented the same way: no backdrop and no claims, only the made things, lit from the side.

- **The site is one infinite glass slide.** You pan it, zoom it and focus it. Products are places on the slide, arranged like the Victorian diatom arrangements in the Met's collection (precise, hand-placed, symmetric). Retired work orbits in the margin and museum plates are landmarks.
- **A bespoke icon system is the main imagery.** Each product has a specimen glyph built like a diatom valve: striae, areolae, hairline secondary rings and exactly one signal-gold nodule. These glyphs are hero art, map markers, particle targets and favicon-scale UI, all from one construction. A detail people can find: MCP Emails' valve has 17 striae, one per tool.
- **Particles are the grain.** The centrepiece is a three.js particle system: 24,000 grains settle into a scanned CC0 stone (Poly Haven `moon_rock_03`) or into any glyph. A *signal* is a pulse that ripples through them. On scroll the stone peels away into loose grain.
- **Luxury restraint.** Duotone at hue 72°, one serif voice, one mono measure, slow expo-out motion. Nothing bounces, nothing shouts. Signal gold is spent sparingly.
- **Technology, not finance.** Ink and gold are made to read as light on a slide, not as a bank. The metaphor is optics and biology (focus, signal, grain), never machines or the sea.

**Spark words:** signal (the pulse, the nodule, live status), pulse (the ripple, the ping), grain (particles, film grain, the pore lattice).

### References

| What | URL | Taken from it |
|---|---|---|
| Stripe | https://stripe.com | Iconography as a system, restrained motion, product imagery framed as objects |
| Biodiversity Heritage Library | https://www.biodiversitylibrary.org | Natural-history plates as a visual language; led to the Met's cyanotypes and diatom photographs |
| Quaternius | https://quaternius.com | Surveyed for CC0 models. Poly Haven's scanned stone suited the grain idea better |
| Lapa Ninja | https://www.lapa.ninja | Landing-page density benchmark (returned 403 to the fetcher, so it was reviewed by search only) |
| Victorian diatom arrangements | https://microscope-antiques.com/arrangements.html | Hand-placed symmetric layouts: the model for laying products out on the canvas |
| Invisible Art Forms: Diatoms in the Victorian Era | https://www.nevadaart.org/event/invisible-art-forms-diatoms-in-the-victorian-era/ | Darkfield photography of diatom slides |
| Framer "Infinite Canvas" template | https://www.framer.com/marketplace/templates/infinite-canvas/ | Navigator and zoom-percentage pattern, and a list fallback under 768 px |
| GSAP circle mask reveal | https://webflow.com/made-in-webflow/website/gsap-circle-mask | The Iris transition |
| Soft Blur In | https://21st.dev/@educlopez/components/soft-blur-in | The Focus Pull entrance |
| Linear keyboard help | https://linear.app/changelog/2021-03-25-keyboard-shortcuts-help | Searchable `?` overlay. Suppressed while typing |
| GNOME help overlay | https://wiki.gnome.org/Design/OS/HelpOverlay | Grouped, easily dismissed, tooltip-like cheat sheet |

## Palette (OKLCH, hue 72°)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| `--void` | oklch(0.135 0.010 72) | `#0b0805` | behind the slide, vignettes, deepest shadow |
| `--field` | oklch(0.175 0.014 72) | `#14100a` | page background (the duotone dark) |
| `--raised` | oklch(0.225 0.018 72) | `#211a12` | panels, glow centres |
| `--line` | oklch(0.32 0.026 72) | `#3b3124` | hairlines, borders |
| `--dim` | oklch(0.48 0.06 72) | `#735836` | captions, tertiary text |
| `--ochre` | oklch(0.68 0.095 72) | `#bd8e53` | eyebrows, italic accents, secondary strokes |
| `--signal` | oklch(0.82 0.11 72) | `#f0b871` | the only accent: nodule, live, pulses, figures |
| `--light` | oklch(0.92 0.05 72) | `#fae0c1` | text and strokes (the duotone light) |

The duotone pair is **field + light**. Museum images are gradient-mapped through void → field → dim-ochre → `#d9a764` → `#fbe6c8`.

## Type

- **Instrument Serif** (OFL, Google Fonts): display and headlines, italic for accents and Latin specimen names. Wordmark outlines come from it.
- **Geist Mono** (OFL, Google Fonts): eyebrows, labels, figures, keycaps, code. Uppercase with 0.14–0.16em tracking.
- **Geist** (OFL, Google Fonts): running text at weight 300.

`https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap`

## How the builder should use it

- **Hero.** A full-bleed `<canvas>` running `createDarkfield` (initial `'rock'`), with `hero/hero-grain-rock-*` as the poster underneath. Morph to a product glyph when its place is focused. Wire `scrubDissolve(df, '#hero')` from motion.js. Pause it with an IntersectionObserver when it is off-screen.
- **Canvas.** Plane background `extras/pattern-canvas-grid.svg`. Places are `products/slide-*` cards with `extras/tag-*.svg` markers. Retired work is `products/retired/*` in an outer ring, and museum plates are landmarks. The working sketch is in preview.html section 05.
- **Keys.** `shortcuts.js` provides the keyboard layer, a visible `? Keys` hint and the `<dialog>` cheat sheet. Pass handlers in `on`.
- **Texture.** One `<div class="df-grain">` per page. Use `pattern-areolae.svg` behind panels and `extras/reticle.svg` as the loader or focus ring.
- **Social.** `identity/og-image.jpg`, `identity/favicon.svg`, `identity/favicon-180.png` (apple-touch).
- Fill any copy from `designs/_shared/content.js` only. Slides quote only its figures and facts.

## Motion study

| Name | Kind | Where | Description |
|---|---|---|---|
| Focus pull | entrance | `.df-focus`, `.df-focus-word`, `focusPull(el)` | Words arrive blurred (14px), 4.5% over-magnified and slightly low, then resolve with expo-out over 1.1s, staggered 55ms. Like an objective finding the specimen. |
| Striae draw | hover | `.df-striae` + `striae(svg)`, `engrave(svg)` | Every stroke of a glyph is normalised to `pathLength=1` and redrawn from its dash offset. The signal nodule scales 1.7× with a gold glow. |
| Iris | transition | `.df-iris.is-open`, `iris(el, {x,y})` | A circular clip-path aperture opens from the clicked point with quint-in-out over 0.9s. Use it between places and for opening a product. |
| Signal ping | ambient | `.df-ping` | One ring leaves the dot every 2.8s. Reserved for live status. |
| Stage sweep | scroll | `stageSweep(targets)` | ScrollTrigger.batch: cards rise 48px and un-blur as they cross 88% of the viewport, staggered 90ms. |
| Scrub dissolve | scroll | `scrubDissolve(df, trigger)` | The particle stone's grains peel off its right flank as the hero scrolls out (scrub 0.6). Scroll back and it re-forms. |
| Reticle settle | loader | `.df-reticle`, `.is-loading` | The micrometer ring sweeps a quarter turn and settles, or turns slowly while loading. |
| Film grain | texture | `.df-grain` | A 256px grain tile stepping through 6 offsets at 0.9s, blended with screen. |

All of them respect `prefers-reduced-motion`. GSAP 3.12.5 (`index.js`, `ScrollTrigger.js`) is loaded from jsDelivr as ES modules. three.js 0.170.0 is loaded through an import map.

## Inventory

Licence key: **CC0** = public domain dedication. **PD/CC0 (Met OA)** = The Met Open Access, CC0. **Original** = made for this kit, owned by Albretsen AS. **Product** = the client's own product brand, used as-is.

| File | What it is | Intended use | Source | Licence |
|---|---|---|---|---|
| identity/mark.svg | Triceratium mark: a triangular valve, three ocelli and a signal nodule | nav, avatar, small sizes | Generated (node script, geometry by hand) | Original |
| identity/mark-detailed.svg | Mark with a hexagonal areolae pore field | large sizes (≥ 120px), print, loader | Generated | Original |
| identity/mark-ink.svg | Mark in ink for light grounds | print, light contexts | Generated | Original |
| identity/wordmark.svg, wordmark-ink.svg | "Albretsen" in Instrument Serif, outlined, with a Geist Mono "AS" | header, footer | Generated with opentype.js from OFL fonts | Original (fonts OFL) |
| identity/lockup.svg | Mark + wordmark | site header | Generated | Original |
| identity/favicon.svg | Rounded ink tile, heavy mark without ocelli | favicon | Generated | Original |
| identity/favicon-180.png | 180px apple-touch icon | apple-touch-icon | rsvg-convert from SVG | Original |
| identity/og-image.jpg | 1200×630 social card: the line plus the diatom rosette | Open Graph / Twitter | Composed SVG → PNG → JPG with film grain | Original + Met CC0 image |
| hero/hero-grain-dissolve-{1440,2880}.{webp,avif} | The particle stone peeling into grain | hero poster, scroll-dissolve fallback | Baked from 3d/darkfield-particles.js in headless Chrome (60k particles) | Original (model CC0) |
| hero/hero-grain-rock-{1440,2880}.{webp,avif} | The particle stone settled, rim-lit | hero poster for the settled state | Baked from the particle module | Original (model CC0) |
| hero/hero-diatom-rosette-{1200,2400}.{webp,avif} | Julius Wiesner's diatom rosette (c.1870), inverted and gradient-mapped into darkfield gold | hero alternative, canvas landmark, OG | https://www.metmuseum.org/art/collection/search/301891 (image DP262066.jpg) | PD / CC0 (Met OA) |
| products/slide-{mcp-emails,fun-libs,toolrails,harbor}-{800,1600}.webp | Specimen slides: the real product logo mounted in a darkfield field of view with reticle, glyph ghost and engraved facts | product places on the canvas, product sections | Composed SVG (real logos from designs/_shared/products embedded unaltered), rsvg + grain | Original; logos are Product |
| products/grain-{id}-{800,1600}.webp | Each product glyph drawn in particles, with a signal pulse | product hover state, section art | Baked from the particle module | Original |
| products/retired/{luma,polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}-{600,1200}.webp | Retired-product tiles. Luma uses its real logo. The rest are stand-in glyphs | retired ring on the canvas, archive list | Composed SVG → raster | Original; Luma logo is Product |
| icons/specimens/*.svg (11) | Bespoke specimen glyphs, 96 grid, `currentColor` + `--signal` nodule | main imagery, markers, particle targets | Generated (node script) | Original |
| icons/ui/*.svg (26) | Interface icons, 24 grid, 1.5 stroke | UI: zoom, pan, fit, keys, mail, copy, external… | Generated | Original |
| icons/sprite.svg | All of the above as `<symbol>`s (`#sp-*`, `#i-*`) | `<svg><use href>` | Generated | Original |
| icons/index.json | Glyph ids, names and Latin names | building lists | Generated | Original |
| museum/atkins-cystoseira-foeniculacea-{1000,2000}.webp | Anna Atkins cyanotype, c.1853, re-lit as gold on ink | canvas landmark, section divider | https://www.metmuseum.org/art/collection/search/291506 (DP-17302-012.jpg) | PD / CC0 (Met OA) |
| museum/atkins-spiraea-aruncus-{1000,2000}.webp | Anna Atkins, Spiraea aruncus (Tyrol), 1851–54 | canvas landmark, about section | https://www.metmuseum.org/art/collection/search/285421 (DP-510-024.jpg) | PD / CC0 (Met OA) |
| museum/atkins-cystoseira-granulata-{1000,2000}.webp | Anna Atkins, c.1853 | writing / posts section art | https://www.metmuseum.org/art/collection/search/291505 (DP-17302-011.jpg) | PD / CC0 (Met OA) |
| museum/bertsch-navicula-{600,1200}.webp | Auguste-Adolphe Bertsch, Navicula attenuata at 1200 diameters, 1853–57, inverted | tall vertical divider, scroll-progress rail | https://www.metmuseum.org/art/collection/search/906015 (DP-39367-113.jpg) | PD / CC0 (Met OA) |
| extras/pattern-areolae.svg | Seamless hexagonal pore lattice | panel backgrounds, cheat sheet | Generated | Original |
| extras/pattern-canvas-grid.svg | 160px dot grid with corner ticks | infinite canvas plane | Generated | Original |
| extras/grain-tile.png | 256px transparent warm grain | `.df-grain` overlay | Generated (numpy) | Original |
| extras/reticle.svg | Micrometer ring, 200 ticks | loader, focus ring, ornament | Generated | Original |
| extras/tag-{live,building,paused,retired}.svg | Round status tags with text on a circle | canvas markers | Generated | Original |
| extras/sticker-slide.svg | A glass microscope slide with a frosted label ("Darkfield, slide no. 44") | footer, 404, print sticker | Generated | Original |
| 3d/darkfield-particles.js | three.js particle system: morph, pulse, pointer, dissolve | hero centrepiece | Written for this kit | Original |
| 3d/rock-points.bin | 24,000 area-weighted surface samples (Int16 xyz + Int8 normal) | particle source for 'rock' | Sampled from Poly Haven moon_rock_03 | CC0 |
| 3d/moon-rock.glb | Geometry-only GLB of the stone (106 KB, centred, unit radius) | 3D viewer, future use | Rebuilt from https://polyhaven.com/a/moon_rock_03 (glTF + bin from dl.polyhaven.org) | CC0 |
| 3d/demo.html | Particle demo: keys 1–9, 0, -, =, Space, click | demo, still baking (`?still&shape=&dissolve=&pulse=x,y&size=&n=`) | Written | Original |
| 3d/rock-viewer.html | Darkfield GLB viewer (OrbitControls) | demo | Written | Original |
| motion.css / motion.js | Motion study (see above) | site-wide | Written | Original |
| shortcuts.js | Keyboard layer, keycap hint and `<dialog>` cheat sheet | site-wide | Written | Original |
| preview.html | Contact sheet (`?only=identity,icons` shows a subset) | start here | Written | Original |

### Downloaded sources (originals not committed)

- Poly Haven `moon_rock_03`: https://polyhaven.com/a/moon_rock_03, files https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/moon_rock_03/moon_rock_03_1k.gltf and `.../8k/moon_rock_03/moon_rock_03.bin`. CC0. Textures were not used.
- The Met Open Access (CC0), via https://collectionapi.metmuseum.org: objects 291506, 285421, 291505, 301891 and 906015, images from `https://images.metmuseum.org/CRDImages/ph/original/…`. Also downloaded and rejected: 289232 (Tassinari photogenic drawing, which looked muddy in duotone).
- Poly Haven `dandelion_01` was checked and rejected because its alpha-card geometry is unsuitable for point sampling.
- Fonts (OFL), fetched from github.com/google/fonts to outline the wordmark and labels: InstrumentSerif-Regular/Italic.ttf, GeistMono[wght].ttf. They are not redistributed. The site loads them from Google Fonts.

### Real product assets used (unaltered)

`designs/_shared/products/mcp-emails/icon.png`, `fun-libs/icon.png`, `toolrails/icon.svg`, `harbor/harbor-mark.svg` (its `currentColor` resolved to `#f4f1ea` on `#1b1b1b`, exactly as on Harbor's own banner), `luma/logo.png` (on white).
