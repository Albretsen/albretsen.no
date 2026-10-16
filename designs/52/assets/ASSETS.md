# Design 52 · Violet Cabinet

Asset kit for albretsen.no. Open `preview.html` first (serve the repo root, e.g. `python3 -m http.server`). It shows every asset, the palette, the type, and plays the morph, the 3D bust and the motion study. `preview.html?only=products` (or `identity`, `palette`, `type`, `scrub`, `bust`, `specimens`, `extras`, `motion`) shows a single sheet.

## Vision

**A museum archive that has been plugged into the mains.** Albretsen AS is presented as a cabinet of working software. Real public-domain plates are scanned, cut out and *electrified*. Paper turns saturated violet, engraved lines turn to light, and every highlight carries one spark of yellow. The site reads like a catalogue raisonné: chapters are **Tab. I, Tab. II…** (Kurr's own plate numbering), figures are numbered *fig. 6.*, and facts sit on small specimen tags.

- **Playful precision.** The precision is real: the mark is a Japan-law quartz twin, two crystals meeting at exactly 84°33′, and the crystal habits come from an actual 1859 crystallography plate, with hidden edges dotted as the engraver drew them. The play is in the motion. Crystals morph from chapter to chapter, a marble bust gets "digitised" by a scan beam, and buttons lean toward the cursor.
- **Electric · edge · crystal.** Electric is the spark yellow, the Franklin key and the Tesla coil. Edge is the hairline Bodoni and the facet lines. Crystal covers the habits, the gems and the mark.
- **Technology, not finance.** There are no navy suits, ledgers or nautical charts. The archive material is all science (mineralogy, microscopy, electricity) and is reprocessed with code: the duotone ramp, the line-lift, the live engraving shader.
- **Hero concept: scroll-driven chapters.** Each chapter is a plate. The SVG crystal at the centre changes habit as you scroll (cube → octahedron → quartz → dodecahedron → twin mark). Suggested mapping: first apps 2016 → Fun Libs → MCP Emails → Toolrails/Harbor → Albretsen AS. MCP Emails is one plate among several.

### References

- Aceternity UI components (Tracing Beam, Magnetic Button, SVG Path Morphing): https://ui.aceternity.com/components
- Chrome for Developers, *How NRK uses scroll-driven animations*: https://developer.chrome.com/blog/nrk-casestudy
- MDN `view()` timeline: https://developer.mozilla.org/docs/Web/CSS/animation-timeline/view
- Codrops, *Practical introduction to scroll-driven animations*: https://tympanus.net/codrops/?p=75216
- Osmo, magnetic hover effect (two-layer magnetic, elastic return): https://www.osmo.supply/resource/magnetic-hover-effect
- GSAP forum on quickTo for magnetic buttons: https://gsap.com/community/forums/topic/39924-magentic-and-filled-fields-like-devebco/
- Flubber and Motion path-morphing tutorials (resample-then-interpolate approach): https://motion.dev/tutorials/js-svg-path-morphing
- Kurr, *The Mineral Kingdom* (1859), Science History Institute: https://digital.sciencehistory.org/works/pr76f4633
- Framer gallery (portfolio category) for pacing of single-person studio sites: https://www.framer.com/gallery/categories/portfolio

## Palette (OKLCH, seed hue 276°)

| Token | OKLCH | Hex | Role |
|---|---|---|---|
| `--violet` | `oklch(0.48 0.26 276)` | `#462eeb` | Owns every page. Page background. |
| `--violet-2` | `≈ oklch(0.54 0.24 278)` | `#5a45f5` | Radial glow behind heroes and objects |
| `--deep` | `oklch(0.25 0.14 276)` | `#170a62` | "Glass": crystal bodies, cards, buttons |
| `--night` | `oklch(0.17 0.08 276)` | `#090731` | Shadows, darkest duotone stop |
| `--lilac` | `≈ oklch(0.76 0.12 278)` | `#a3a9ff` | Quiet text, line overlays, pattern |
| `--ink` | `oklch(0.975 0.015 276)` | `#f3f6ff` | Type and engraved lines on violet |
| `--spark` | `oklch(0.93 0.2 118)` | `#ddf93c` | ONE accent per view: glint, scan line, hover, crossbar |
| `--paper` | `oklch(0.95 0.03 85)` | `#f8edd8` | Archive paper. Only on plates and tags. |
| `--paper-ink` | n/a | `#2a2440` | Ink on paper |

Duotone ramp used on every scan: night → deep (0.30) → violet (0.60) → lilac (0.82) → ink (1.0). Spark is mixed into the top highlights only inside a radial mask around the focal point (the key, the coil).

## Typefaces (Google Fonts, OFL)

- **Bodoni Moda** italic 500–600 (opsz 6..96). Use it for display, chapter titles, *Tab.* numbers and *fig.* numbers. Use high optical size for large type. The SVG wordmark and tags are outlined from the opsz 28 instance, so the hairlines survive at small sizes.
- **Geist** 400/500 for body text.
- **Geist Mono** 500, caps, +0.12–0.16em. Use it for catalogue labels, specimen tags and buttons.

`https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap`

## Motion study (`motion.css`, `motion.js`)

| # | Name | Kind | What it does | Researched from |
|---|---|---|---|---|
| 01 | plate-develop | entrance | Image starts as a bleached, blurred hexagonal crystal section and develops to full plate. CSS `view()` timeline. | NRK scroll-driven title cards; Codrops |
| 02 | scan-reveal | entrance | A spark scan line passes top-down; the image is masked in behind it (`@property --scan` on a named view timeline). It is the 2D twin of the scan bust. | Aceternity Tracing Beam, digitisation scanners |
| 03 | magnetic-facet | hover | `[data-magnetic]` / `.m-magnetic` lean toward the pointer from 1.6× their box. The label travels 0.55× further than the shell. A spark facet (radial + conic gradient) follows the cursor. Springs back via a CSS `linear()` overshoot. | Osmo magnetic hover, Aceternity magnetic button, GSAP quickTo thread |
| 04 | chapter-cut | transition | The next chapter's background opens out of a hexagonal crystal section as it enters. | Hex/clip-path reveals on Framer gallery sites |
| 05 | tracing-current | progress | Hairline down the page edge drawn by `scroll(root)`. | Aceternity Tracing Beam |
| 06 | glint | idle | The four-point spark breathes and turns 45°. | n/a |
| 07 | specimen-float | hover | Cut-outs lift with a spring and a deeper paper shadow. | n/a |
| 08 | chapter-scrub | scroll → JS | `chapters()` reports a continuous chapter index (2.35 = 35% through chapter 3) to drive `crystal-morph` and `scan-bust`. | n/a |

Lenis (`lenis@1.1.13`, loaded lazily from jsDelivr) gives smooth scroll with `anchors: true`. Every effect has a static resting state, is gated by `@supports (animation-timeline: view())` with an IntersectionObserver fallback, and is disabled under `prefers-reduced-motion`.

## Interactive / 3D

- **`svg/crystal-morph.js`** is the centrepiece and uses no dependencies. `mountCrystalMorph(el, {stages})` returns `{setProgress, play, stop, dispose}`. One outline path is resampled to 120 points with cyclic alignment and then interpolated. Facet edges redraw with `stroke-dashoffset` and hidden edges stay dotted. The final stage fades in the faceted mark and the spark crossbar. The demo is `svg/morph-demo.html`.
- **`svg/crystals.js`** holds the Plate A habits as polyhedra, plus projection, convex hull, resampling and `habitSVG()`. Use it to draw any habit anywhere, for example as list bullets or section dividers.
- **`3d/scan-bust.js` + `3d/marble-bust.glb`** use three.js 0.170.0 (`+esm`, pinned). A spark beam sweeps the CC0 marble bust. Everything above the beam is redrawn as a live engraving whose hatching density follows the light. `setProgress(0..1)` scrubs it, and drag rotates it. The demo is `3d/bust-demo.html`. `3d/still.html?p=0.5` is the page used to bake `hero/hero-scan-bust-*`.

## How the archive treatments were made

These were Python (Pillow, NumPy, SciPy) scripts, run on the original scans.
1. **Cut-out**: the paper colour is estimated from the crop border and the ink is thresholded. Then a morphological close, fill holes, keep the largest components, and feather a 1px edge. This produces `specimens/`.
2. **Electrify**: ink amount = 1 − L/paperL. Body = deep glass at 82% alpha, lines = ink, plus a blurred silhouette halo in spark. This produces `layers/`.
3. **Line-lift**: paper → transparent and ink → a chosen colour. The output is `extras/plate-a-lines.webp`. The `*-screen.webp` versions are ink on black, meant for `mix-blend-mode: screen`.
4. **Duotone + spark**: the ramp above, with a radial spark mask on the highlights. This produces the Franklin, Tesla and Haeckel extras.
Compositions (heroes, product plates, OG) were laid out in HTML/CSS and rendered with headless Chrome at 2×.

## Inventory

All files are under `designs/52/assets/`. "Generated" means made for this kit (no external source).

| File | What it is | Intended use | Source | Licence |
|---|---|---|---|---|
| identity/mark.svg | Twin-crystal A, colour, for light backgrounds | Logo on paper/light | Generated (node + computed geometry, 84°33′) | Original for Albretsen AS |
| identity/mark-reverse.svg | Mark for violet backgrounds | Nav, footer | Generated | Original |
| identity/mark-mono.svg | Single-colour mark (currentColor, tonal facets) | Stamps, small UI | Generated | Original |
| identity/wordmark.svg, wordmark-reverse.svg, wordmark-mono.svg | "Albretsen" Bodoni Moda italic outlined + mono "AS" | Wordmark | Generated (opentype.js outlines of Bodoni Moda / Geist Mono, OFL) | Original; fonts OFL |
| identity/lockup.svg, lockup-reverse.svg | Mark + wordmark | Header | Generated | Original |
| identity/favicon.svg, favicon-180.png | Reverse mark on violet tile | Favicon / apple-touch-icon | Generated (rsvg-convert) | Original |
| identity/og.jpg | 1200×630 Open Graph card | `og:image` | Generated (HTML render: lockup, electrified quartz, Plate A lines) | Original + PD sources below |
| hero/hero-cabinet-{800,1440,2880}.webp, -2880.avif | Tab. I: electrified quartz engravings + coloured gems on violet, Plate A lines behind | Primary hero (text sits left) | Composite of Kurr 1859 plates (below) | PD + original |
| hero/hero-current-{800,1440,2880}.webp, -2880.avif | Tab. II: Franklin painting in violet duotone, spark lightning, fig. 1 annotation | Chapter hero ("current") | Benjamin West c.1816 (below) | PD + original |
| hero/hero-scan-bust-{800,1440,2880}.webp, -2880.avif | Tab. III: marble bust half-engraved by the scan beam | Hero / 3D poster image | Baked from 3d/still.html | CC0 model + original |
| layers/quartz-cluster-electric.webp | Electrified quartz cluster, alpha, spark halo | Parallax hero layer | Kurr Plate III fig. 6 | PD |
| layers/quartz-spire-electric.webp | Electrified quartz spire, alpha | Parallax layer | Kurr Plate III fig. 7 | PD |
| layers/amethyst-geode-electric.webp, smoky-quartz-electric.webp, diamond-rough-electric.webp | Electrified specimens, alpha | Section ornaments | Kurr Plates III & I | PD |
| products/plate-mcp-emails-{800,1600}.webp | Tab. V specimen plate with the REAL MCP Emails mark | MCP Emails card | Real logo from designs/_shared/products + Kurr gems + Haeckel diatoms + real 1859 paper | Product logo © Albretsen; rest PD |
| products/plate-fun-libs-{800,1600}.webp | Tab. VI with the REAL Fun Libs v5 icon | Fun Libs card | Same | Same |
| products/plate-toolrails-{800,1600}.webp | Tab. VII with the REAL Toolrails icon | Toolrails card | Same | Same |
| products/plate-harbor-{800,1600}.webp | Tab. VIII with the REAL Harbor banner | Harbor card | Same | Same |
| retired/luma.svg | Retired tag with the REAL Luma logo over a quartz habit | Retired list | Real logo.png embedded + generated | Logo © Albretsen; rest original |
| retired/polyglot-pilot.svg, pinpoint.svg, webvakt.svg, joke-central.svg, tryggere-hyring.svg, early-apps.svg | Stand-in specimen tags, one Plate A habit each | Retired list | Generated (crystals.js + outlined type) | Original |
| specimens/*.webp (17) | Hand-coloured gem and crystal cut-outs, alpha | Scatter around sections, hover float | Kurr Plates I & III | PD |
| extras/franklin-portrait-duo.webp | Franklin 4:5 in duotone | About / "current" chapter | Benjamin West c.1816 | PD |
| extras/haeckel-acantharia-duo.webp | Haeckel Tafel 21 (Acantharia) in duotone | Section background / divider | Haeckel, Kunstformen der Natur | PD |
| extras/haeckel-diatomea-screen.webp | Haeckel Diatomea line-lift on black | `mix-blend-mode: screen` overlay | Haeckel, Kunstformen der Natur (LoC) | PD |
| extras/tesla-1899-duo.webp | Tesla's Colorado Springs lab in duotone (small source: use at ≤600px CSS) | Inset photo | Dickenson V. Alley, 1899 | PD |
| extras/plate-a-lines.webp | Kurr Plate A crystal forms, ink lines on alpha | Overlay texture | Kurr Plate A | PD |
| extras/paper-1859.webp | Real foxed 1859 paper, de-banded | Plate/tag background | Kurr Plate A margin | PD |
| extras/pattern-plate-a.svg | 240px tile of four habits, hidden edges dotted | Pattern fill | Generated (crystals.js) | Original |
| extras/seal.svg | Circular seal sticker: mark + "Cabinet of working software" | Sticker / footer / loader | Generated | Original |
| extras/glint.svg | Four-point spark | Accent, cursor, bullets | Generated | Original |
| extras/rule-ticks.svg | Catalogue hairline with ticks | Section dividers | Generated | Original |
| extras/grain.svg | feTurbulence grain tile | Overlay (`mix-blend-mode: overlay`, ~.16) | Generated | Original |
| 3d/marble-bust.glb | Bust geometry + normal map, packed into one glb (543 KB) | scan-bust.js | Poly Haven "Marble Bust 01", https://polyhaven.com/a/marble_bust_01 (1k glTF, repacked) | CC0 |
| 3d/scan-bust.js, bust-demo.html, still.html | Live engraving shader + demo + still baker | Interactive 3D | Generated | Original |
| svg/crystal-morph.js, crystals.js, morph-demo.html | SVG morph centrepiece + habit data + demo | Scroll chapters | Generated | Original |
| motion.css, motion.js | Motion study (8 named animations) | Site motion | Generated | Original |
| preview.html | Contact sheet | Start here | Generated | Original |

### Downloaded sources (exact URLs)

- Kurr, *Plate A: Planes of Crystals and Separate Crystalline Forms* (1859). https://digital.sciencehistory.org/works/knqdpxb (file `downloads/deriv/cf95jc750/download_large`). Public Domain Mark 1.0.
- Kurr, *Plate I: Diamond, Sapphire and Ruby…* https://digital.sciencehistory.org/works/ckqi5m8 (`bc386k32b/download_large`). PDM 1.0.
- Kurr, *Plate III: Quartz*. https://digital.sciencehistory.org/works/qyjgprv (`zc77sr130/download_large`). PDM 1.0.
- Kurr, *Plate IV: Quartz and Opal*. https://digital.sciencehistory.org/works/71o43iz (downloaded for reference, unused).
- Haeckel, *Diatomea. Schachtellinge*. https://commons.wikimedia.org/wiki/File:Diatomea._-_Schachtellinge_LCCN2015647735.jpg (public domain).
- Haeckel, *Kunstformen der Natur, Tafel 21*. https://commons.wikimedia.org/wiki/File:Kunstformen_der_Natur_(Tafel_21)_BHL47388075.jpg (public domain).
- Benjamin West, *Benjamin Franklin Drawing Electricity from the Sky*, c. 1816 (Philadelphia Museum of Art, Google Art Project). https://commons.wikimedia.org/wiki/File:Benjamin_West,_English_(born_America)_-_Benjamin_Franklin_Drawing_Electricity_from_the_Sky_-_Google_Art_Project.jpg (public domain).
- Dickenson V. Alley, *Tesla Colorado Springs lab, 12 million volts* (1899). https://commons.wikimedia.org/wiki/File:Tesla_Colorado_Springs_lab-12_million_volts.jpg (public domain).
- Poly Haven, *Marble Bust 01*. https://polyhaven.com/a/marble_bust_01, files from `https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/marble_bust_01/`. CC0.
- Fonts were fetched only to outline the SVG wordmark and tags: Bodoni Moda, Geist Mono (Google Fonts, SIL OFL 1.1).

Real product assets used as-is (not recoloured, not redrawn): `designs/_shared/products/mcp-emails/logo-mark.svg`, `fun-libs/icon.png`, `toolrails/icon.svg`, `harbor/banner.png`, `luma/logo.png`.

## Notes for the builder

- Spark is the scarcest resource: one spark thing per viewport.
- Put headlines on the left 40% of `hero-cabinet`; the right is busy by design. On phones, compose live from `layers/` + `specimens/` instead of cropping the wide hero.
- Paper never becomes a page background. It only appears as objects (plates, tags) lying on the violet.
- The Tesla image comes from a 600px original; keep it small.
- three.js is only loaded when the bust scrolls into view; keep it that way.
