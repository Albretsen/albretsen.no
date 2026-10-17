# Specimen Atlas: asset kit for albretsen.no (design 40)

Start with `preview.html`. It is the contact sheet: every asset, the palette, the type specimen, the live 3D specimen, the draggable plate stack and the four motion signatures. Review switches: `?phase=dag|gulltime|blåtime|natt` pins the light, and `?from=<section-id>` skips ahead.

## Vision

Albretsen AS is shown as a natural-history atlas of things that were built. Each product is a specimen that has been catalogued, labelled and lit like an editorial still life. The hero is **Specimen No. 1**: a brass and glass radiolarian built only from three.js primitives, after Ernst Haeckel's *Circogonia icosahedra* (1887). It is one beautiful render and almost nothing else.

- **Precision** comes from the lattice: a geodesic dual of 12 pentagons and 80 hexagons, with machined brass nodes and a calm editorial grade.
- **Play** comes from the springs and the props. The specimen turns when dragged and keeps its momentum when flicked. A brass loupe on each product plate really magnifies the card. Eosin-pink beads tip every spine. The plates can be shuffled and turned over.
- **Signature delight:** the page reads the sun's position over Oslo (NOAA formula). It picks the matching baked hero (dag, gulltime or blåtime/natt), re-lights the live specimen and switches the page to forest and ink after sunset. It updates every minute.
- **Spark words:** *atlas* (the catalogue of specimens), *signal* (the eosin stain, used once per screen), *lattice* (the mark, the specimen, the pattern, the snow crystals).
- **What it avoids:** finance-firm gravitas, industrial or nautical metaphors and clip-art. The props are lab and library objects (loupe, specimen card, pin, bookcloth), not machines. MCP Emails is one plate of four.

### Mood and references
| Reference | What we took |
|---|---|
| Ernst Haeckel, *Kunstformen der Natur* and *Report on Radiolaria* (via Wikimedia Commons / BHL scans) | The specimen's form, the plate-and-label system, ink-on-cream reprints |
| Wilson A. Bentley snow-crystal photomicrographs, Smithsonian Institution Archives (CC0) | Natural lattices, archival print edges, a quiet link to Norwegian winter |
| https://www.biodiversitylibrary.org | Source of the Haeckel scans (the site blocked automated fetches; files came through Commons, which mirrors BHL) |
| https://emilkowal.ski/ui/7-practical-animation-tips | Never animate from scale(0); press scale .97; blur to hide crossfade seams; keep UI motion under 300ms; origin-aware popovers |
| https://blog.maximeheckel.com/posts/the-physics-behind-spring-animations/ | Spring and damping forces, semi-implicit integration |
| React Motion defaults (stiffness 170, damping 26), anime.js spring docs | Parameters for the "settle" preset; rest thresholds |
| https://www.framer.com/marketplace/components/swipeable-card-stack | Drag-to-back with velocity threshold, tilt while dragging, peeking cards (rebuilt by hand with our springs) |
| https://tympanus.net/codrops/2015/10/28/effect-ideas-for-card-stacks | Stack rearrangement choreography |
| https://discourse.threejs.org/t/progressive-shadows-a-vanilla-js-implementation-of-r3f-accumulativeshadows/48277 | Accumulated soft shadows, which became our jittered multi-pass bake |
| https://www.cosmos.so | An image-led, quiet curation UI: let the pictures carry the page |
| https://www.figma.com/community | (blocked to automated fetch; not used) |

Salt `f57ae7` picked the search results that were opened: Commons result #15 (`Circogoniaicosahedra`, which led to the CC0 `Circogonia_icosahedra.jpg`), #5 *Circopus sexfurcus*, #7 *Circopurus octahedrus* and #14 *Plate 116*. From the Smithsonian results it picked #0 (No. 342), #5 (No. 10), #7 (No. 562) and #10 (No. 1206). The salt also seeds the specimen's random spine rotation, the paper textures and the grain.

## Palette (OKLCH first)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| `--cream` | `oklch(95.5% 0.022 88)` | `#f6f0e0` | Page |
| `--paper` | `oklch(90.5% 0.032 84)` | `#eadec8` | Cards, wells |
| `--forest` | `oklch(36% 0.068 158)` | `#17482f` | Brand, dark ground, baize |
| `--ink` | `oklch(22% 0.038 160)` | `#082014` | Text |
| `--moss` | `oklch(62% 0.07 150)` | `#679270` | Secondary |
| `--brass` | `oklch(73% 0.118 82)` | `#cda047` | Metal; rules on dark |
| `--brass-deep` | `oklch(55% 0.1 70)` | `#966626` | Brass on cream (contrast) |
| `--eosin` (seed 336°) | `oklch(60% 0.2 336)` | `#c444ac` | The one stain: one thing per screen |
| `--blush` | `oklch(89% 0.055 336)` | `#f3cee9` | Eosin tint |
| `--dusk` | `oklch(30% 0.06 262)` | `#1d2d4c` | Night fill light only |

Daylight phases (in `motion.css`) re-map `--bg` and `--fg`. Dag and gulltime use cream; blåtime uses `oklch(27% .045 168)`; natt uses `oklch(19% .03 170)`.

## Typefaces (all OFL, Google Fonts)
- **Fraunces**: display. Optical size 144, weight 600, `SOFT` 50, tracking −0.025 to −0.035em. Italics at weight 300 for asides ("*Atlas*", "*pays for itself.*"). Also used for the wordmark (outlined).
- **Instrument Sans**: body and UI, 16–18px at 1.55–1.6.
- **Geist Mono**: specimen labels, numbers and captions, at weight 500, uppercase, +0.14em.

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,50;1,9..144,300..700,50&family=Geist+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

## Motion (motion.js + motion.css): hand-rolled springs, no library
One `Spring` class (a damped harmonic oscillator with semi-implicit Euler integration in fixed 240 Hz sub-steps) drives one shared rAF loop.

| Name | Kind | Spec | Use on the site |
|---|---|---|---|
| **Settle** | entrance | Starts 18px below at scale .965 with 6px blur and comes to rest on Spring(170, 26); staggered 70ms; IntersectionObserver-triggered. `data-settle` attribute. CSS fallback `--ease-settle` is a `linear()` curve sampled from the same spring. | Headlines, section intros, cards |
| **Loupe** | hover | Tilts up to 7° toward the pointer, lifts 4px, a brass soft-light sheen follows the cursor (`--sheen-x/y`), presses to .97. Spring(320, 24). Skipped for touch. | Product plates, archive images, any card |
| **Shuffle** | transition | `specimenStack()`: drag the top plate; release past 28% of its width or above 650px/s and it springs to the back, Spring(140, 15). A tap flips it (`rotateY`) on Spring(210, 20, mass 1.1). Arrow keys move between plates; Enter/Space flips. | The products section (the centrepiece interaction) |
| **Daylight** | delight | `daylight()` sets `data-phase`, `--sun-elev` and `--sun-t` on `<html>`, fills `[data-daylight]` captions and emits a `daylight` event with the matching hero (`PHASE_HERO`). | Hero image swap, page colours, live 3D light |

`prefers-reduced-motion` turns the springs into fades and stops the idle drift of the 3D specimen.

## Inventory

| File | What it is | Intended use | Source / how made | Licence |
|---|---|---|---|---|
| `identity/logo-mark.svg` | Lattice-A mark (forest, eosin apex) | Header, small brand moments | Hand-built SVG geometry (node script) | Albretsen AS, original |
| `identity/logo-mark-cream.svg`, `logo-mark-brass.svg` | Reversed and brass mark | Dark sections, footer | Same | Original |
| `identity/logo-wordmark.svg`, `logo-wordmark-cream.svg` | Mark + "Albretsen" (Fraunces 600, outlined) + "AS" (Geist Mono) | Header and footer lockup | opentype.js outlines from OFL fonts | Original; fonts OFL |
| `identity/wordmark-type-only.svg` | "Albretsen" only | Tight spaces | Same | Original |
| `identity/favicon.svg`, `favicon-180.png` | Forest tile with cream lattice A | Favicon and apple-touch-icon | SVG; PNG via rsvg-convert | Original |
| `identity/og-image.png` (+ `og-source.html`) | 1200×630 Open Graph card | `og:image` | HTML composition of the day render, screenshotted | Original |
| `hero/specimen-day(@2x).webp`, `@2x.avif` | Specimen No. 1 at day (2880×1800 / 1440×900) | Default hero | three.js scene in `3d/bake.html`: 40 jittered passes (area light, aperture, AA) averaged, then graded with split tone, halation and grain | Original |
| `hero/specimen-gold(@2x).webp` | Golden hour, long lace shadow | Hero when the sun is 0–12° up | Same | Original |
| `hero/specimen-dusk(@2x).webp`, `@2x.avif` | Blue hour/night: forest dark, glowing eosin core | Hero after sunset; dark mode | Same | Original |
| `hero/specimen-day-portrait(@2x).webp`, `specimen-dusk-portrait(@2x).webp` | 1290×2200 phone crops | Hero `<source media="(max-aspect-ratio: 3/4)">` | Same | Original |
| `hero/specimen-macro(@2x).webp` | Shallow-focus close-up of the lattice | Section break, about page, 404 | Same (fov 11, aperture .12) | Original |
| `products/plate-mcp-emails(@2x).webp` | Real MCP Emails icon printed on a specimen card; loupe magnifies "LIVE" | Product card / stack | `3d/product-bake.html`: the real `_shared/products/mcp-emails/icon.png`, untouched, as a canvas texture; the loupe disc re-samples the card UVs at 1.75× | Logo © Albretsen AS; render original |
| `products/plate-fun-libs(@2x).webp` | Same with the real Fun Libs v5 icon | Product card | `_shared/products/fun-libs/icon.png` | Same |
| `products/plate-toolrails(@2x).webp` | Same with the real Toolrails icon; "BUILDING" | Product card | `_shared/products/toolrails/icon.svg` | Same |
| `products/plate-harbor(@2x).webp` | Same with the real Harbor mark; "PAUSED" | Product card | `_shared/products/harbor/harbor-mark.svg` (currentColor renders as its default black) | Same |
| `retired/*.svg` (6) | Specimen tags with lattice glyphs: Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, Early apps | "Retired drawer" / archive list | Generated SVG, text outlined | Original |
| *(Luma)* | Real Luma logo on an HTML tag | Retired drawer | `_shared/products/luma/logo.png`, used as-is | © Albretsen AS |
| `museum/haeckel-circogonia.webp` | *Circogonia icosahedra*, reprinted in forest ink on cream | Next to the hero ("the original"), about page | https://commons.wikimedia.org/wiki/File:Circogonia_icosahedra.jpg (Haeckel 1887, engr. A. Giltsch); graded with numpy | CC0 / public domain |
| `museum/haeckel-circopurus.webp` | *Circopurus octahedrus* | Section ornament | https://commons.wikimedia.org/wiki/File:Circopurus_octahedrus.jpg | CC0 |
| `museum/haeckel-circopus.webp` | *Circopus sexfurcus* | Section ornament, loupe demo | https://commons.wikimedia.org/wiki/File:Circopus_sexfurcus.jpg | CC0 |
| `museum/haeckel-plate116.webp` | *Report on Radiolaria* pl. 116 (header cropped) | Full-bleed plate between sections | https://commons.wikimedia.org/wiki/File:Radiolaria_(Challenger)_Plate_116.jpg | Public domain |
| `museum/haeckel-phaeodaria.webp` | *Kunstformen der Natur*, Phaeodaria colour plate (brass-toned) | Writing / posts header | https://commons.wikimedia.org/wiki/File:Haeckel_Phaeodaria_1.jpg | Public domain |
| `museum/bentley-snowflake-10.webp` | Stellar snowflake No. 10, split-toned | Night section, footer | Smithsonian Institution Archives, SIA2013-09167, https://siarchives.si.edu/collections/siris_arc_308073 | CC0 |
| `museum/bentley-snowflake-1206.webp` | Stellar snowflake No. 1206 | Same | SIA2013-09170, https://siarchives.si.edu/collections/siris_arc_308069 | CC0 |
| `museum/bentley-snowflake-342.webp` | Snowflake No. 342 (with handwritten plate number) | Same | SIA2008-1394, https://siarchives.si.edu/collections/siris_arc_308074 | CC0 |
| `museum/bentley-snowflake-562.webp` | Stellar snowflake No. 562 | Same | SIA2013-09169, https://siarchives.si.edu/collections/siris_arc_308071 | CC0 |
| `textures/paper-cream.webp` | 512px seamless cream paper (mottle + fibre) | `body` background | FFT band-passed noise (tileable), numpy | Original |
| `textures/bookcloth-forest.webp` | 512px seamless forest bookcloth weave | Dark sections, drawers | Same | Original |
| `textures/grain-overlay.webp` | Neutral grain for `soft-light` blending | Dark-phase page, image overlays | Same | Original |
| `patterns/lattice-hex.svg`, `lattice-hex-dark.svg` | Tileable hex lattice with brass nodes | Section backgrounds, sticker sheet | Generated SVG | Original |
| `stickers/seal.svg` | Round collection seal with circular type | Footer, about | Generated, text outlined | Original |
| `stickers/specimen-label.svg` | Museum specimen label, "Albretsen lattice, *Circogonia albretseni*" | Hero caption, placed beside the render | Same | Original |
| `stickers/signal.svg` | Eosin signal sticker | Notification/"new" marker, cursor follower | Same | Original |
| `stickers/since-2016.svg` | Brass oval "On Google Play since 2016" | Timeline, about | Same (fact: `history.playDeveloperSince`) | Original |
| `3d/specimen-core.js` | Pure geometry and materials for Specimen No. 1, the studio environment, and `sunOverNorway()` | Shared by everything 3D | Hand-written; three.js primitives only | Original (MIT-style use) |
| `3d/specimen.js` | `mountSpecimen(el, {phase})`: live, draggable, spring-driven, sun-lit three.js specimen | Hero (progressive enhancement over the baked image) | three@0.170.0 from jsDelivr (pinned) | Original; three.js MIT |
| `3d/specimen.glb` | The specimen as glTF 2.0 (KHR_mesh_quantization, transmission/volume/ior) | `<model-viewer>`, AR quick look, other engines | Hand-written GLB writer in Node | Original, CC0 for the client |
| `3d/demo.html`, `3d/glb.html` | Live demo with phase switcher; stock GLTFLoader viewer | Builder reference | | |
| `3d/bake.html`, `3d/product-bake.html` | Offline "photography" rigs, used to re-bake any still | Re-render at any size: `bake.html?w=&h=&mode=day|gold|dusk|dawn|macro&frames=` | | |
| `motion.js`, `motion.css` | Springs, Settle, Loupe, Shuffle, Daylight; tokens and phases | Whole site | Hand-written | Original |

## Notes for the builder
- **Hero:** show the baked image first (`<picture>`: AVIF/WebP, portrait source on phones), then lazily mount `3d/specimen.js` over it when the hero is visible and the device is capable, and crossfade it in. Swap the baked image on the `daylight` event (`e.detail.hero`).
- **Eosin:** use it once per screen (the mark's apex, one bead, one stamp). Brass on cream needs `--brass-deep` for text contrast.
- **Copy:** facts only from `_shared/content.js`. The plates already print MRR, installs, connectors and commits exactly as given there.
- **Real logos:** product logos appear only inside the plates and the Luma tag, untouched. Do not tint them with the palette.
- **Budget:** the kit is 4.9 MB in total. A page needs one hero (≈50–140 KB), the plates (≈17 KB each at 1×) and a few archive images.
