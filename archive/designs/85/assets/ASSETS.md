# Design 85 · Silica Atlas

**Asset kit for albretsen.no. Open brief: split-screen hero, glass and refraction, 2D physics, Motion, paper and ink with one spot colour (hue 144°).**

Open `preview.html` (served over http) to see every asset, the palette, the type and the live animations.

## Vision

*Ink, then glass.* The first apps (on Google Play since 2016; Fun Libs, built at 17) are an engraving: careful, monochrome, made by hand. The company today is the same drawing grown into polished glass. Haeckel's 1904 plates of diatoms and radiolarians are the subject. These are living things that build their shells out of silica, so they are literally glass made with precision. The glass is the metaphor: exact structure, real depth, light passing through. Silica is also the root of silicon, which ties it quietly back to software.

- **The hero is a split screen.** The left half is the plate printed in ink on paper. The right half is the same plate turned into glass objects lying on an atlas grid. They cast shadows, refract the grid and focus green caustic light. A thin upright glass blade sits on the seam. On the site the seam is live: it springs after the pointer and drifts toward "today" as you scroll.
- **Maximalist energy, uncluttered layout.** The energy comes from scale and detail (a plate blown up to fill the screen, thousands of engraved pores), never from the number of elements. One idea per screen, generous paper margins, a single spot colour.
- **Spark words:** *scale* (the plate at 100×, the 2016 to 2026 scale bar), *chorus* (eleven products as a chorus of glass objects in the physics field), *atlas* (plates, figure numbers, grids, scale rings).
- **Not a costume.** It is not a natural-history museum or a storybook. The glass is rendered with ray-traced optics, the labels are mono and engineering-like, and the products sit in the centre as paperweights. It stays a technology company's site.

### Mood and references

- Haeckel, *Kunstformen der Natur* (1904), via the Biodiversity Heritage Library: https://www.biodiversitylibrary.org/ and https://blog.biodiversitylibrary.org/2011/10/book-of-week-bridging-gap-between
- Blaschka glass models of marine invertebrates (glass made from Haeckel's drawings). This is the conceptual ancestor of the right half.
- Vercel home (https://vercel.com/home): confident typography on a quiet ground, with one technical object as the hero.
- Shadertoy refraction and dispersion techniques (https://www.shadertoy.com). The renders use the same model, written in numpy: per-channel IOR, Snell refraction, Fresnel and Blinn speculars. Background reading: https://luma.gl/docs/api-guide/shaders/glass-effects and https://80.lv/articles/making-stunning-glass-refraction-effects-in-unity
- Rive community loaders (https://rive.app/community/files/1497-2922-geometric-loading-animation): draw-on geometry as a loading moment. This informed *Vitrify*.
- Motion examples (https://motion.dev/examples): "Physical stagger" and "Scroll-linked spring" informed *Chorus* and *Seam*.
- matter.js (https://brm.io/matter-js/) and physical-svg (https://github.com/richardk123/physical-svg) for physics with real artwork.
- Kenney (https://kenney.nl/assets) was checked. It has no glass or physics packs that fit, so nothing was used.
- Salt `12ad1b` set the order in which results were opened: 1st, 2nd, 10th (a), 13th (d), 1st, 11th (b). This order led to the Commons Haeckel scans, the luma.gl glass notes and the Rive geometric loader.

## Palette (OKLCH, one spot)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| `--paper` | oklch(0.968 0.014 95) | `#f7f5ea` | page ground, always |
| `--paper-2` | oklch(0.925 0.020 95) | `#eae6d8` | cards, hairline fills |
| `--ink` | oklch(0.190 0.025 160) | `#091710` | text, engraving, outlines |
| `--ink-2` | oklch(0.500 0.020 160) | `#5a675f` | captions, secondary text |
| `--spot` | oklch(0.620 0.165 144) | `#389e3d` | the one spot colour: links, the mark's glass half, the "today" end of scales |
| `--spot-deep` | oklch(0.420 0.120 150) | `#005e26` | spot text on paper (AA), grids |
| `--glass` | oklch(0.930 0.050 150) | `#d1f2d7` | glass tint, highlights |
| `--glow` | oklch(0.880 0.150 140) | `#a0f08f` | caustic light only, never for text or fills |

Rules: paper and ink carry 90% of every screen. Green appears as *glass* or *light*, never as a flat background block. Use no other hues. Product logos keep their own colours (they are "printed" on the sheet).

## Type

| Role | Face | Settings | Source / licence |
|---|---|---|---|
| Display + text | **Bricolage Grotesque** (variable) | display: opsz 96, wdth 84, wght 640, tracking -0.022em, line-height 0.88. Text: 16 to 19 px, wdth 92, wght 400 | Google Fonts, SIL OFL 1.1 |
| Accent, one phrase per screen | **Instrument Serif** italic | 34 to 64 px, colour `--spot-deep` | Google Fonts, SIL OFL 1.1 |
| Labels, figures, code | **JetBrains Mono** | 11 px caps, tracking 0.14em; 13 px for commands | Google Fonts, SIL OFL 1.1 |

The wordmark is outlined from Bricolage Grotesque (wght 600, wdth 85, tracking -0.03em) and needs no font file at runtime. The `src/wordmark.py` script regenerates it.

## Inventory

All paths are relative to `designs/85/assets/`. "Generated" means made for this kit with the scripts in `src/` (Python + numpy/scipy/Pillow; rsvg-convert). Those outputs are original work, free for Albretsen AS to use.

### Identity
| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| brand/mark.svg | One lens, two halves: engraved hatching and green glass, split by a seam | logo, nav, loader | hand-authored SVG | original |
| brand/wordmark.svg | "Albretsen" outlined, Bricolage Grotesque 600/85 | nav, footer | `src/wordmark.py` from the OFL font | original outlines of an OFL font (the outlines may be embedded) |
| brand/lockup.svg | mark + wordmark + small green "AS" | header, documents | `src/brand.py` | original |
| brand/favicon.svg | mark on a paper rounded square | `<link rel=icon>` | `src/brand.py` | original |
| brand/favicon-180.png | 180 px touch icon | apple-touch-icon | rsvg-convert | original |
| brand/og.jpg | 1200×630: split hero with a paper label, lockup and the default line | Open Graph / social | `src/brand.py` | original + PD plate |

### Hero imagery (the important part)
| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| hero/split-{960,1600,2400}.avif, split-{960,1600}.webp, split-{960,1600}.jpg | **Hero I, the seam.** Haeckel's Diatomea plate at 125%. The left half is ink on paper; the right half is glass objects on an atlas grid with shadows, green caustics and refraction; a glass blade sits on the seam. 16:9 | static hero, LCP image | `src/split2.py` + `src/glassify.py`, from the PD plate | PD source; render original |
| hero/split-paper-1600.webp, hero/split-glass-1600.webp | The two halves as separate, pixel-aligned full frames | the **live seam** (`motion.css .seam` + `motion.js seam()`) | same | same |
| hero/split-portrait-{640,1000}.{avif,webp}, split-portrait-640.jpg | 2:3 phone cut, seam centred on the big rosette | `<source media="(max-width: 700px)">` | same | same |
| hero/chorus-{960,1600,2400}.avif, chorus-{960,1600}.webp, chorus-{960,1600}.jpg | **Hero II, chorus of lenses.** Ray-traced glass spheres floating over the Spumellaria plate. Each holds the plate inverted, with dispersion and green caustic spots in soft shadows | second hero, products intro, "about" | `src/lens.py` | PD source; render original |
| hero/chorus-portrait-{640,1000}.* | 2:3 phone cut | mobile | same | same |
| hero/{split,chorus}-lqip.webp | 32×18 blur placeholders (inline as base64) | instant first paint | export.py | original |

### Product visuals
| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| products/mcp-emails-{600,1200}.* | Real MCP Emails mark (`_shared/products/mcp-emails/logo-mark.svg`) printed on the atlas sheet under a ray-traced glass paperweight inside a scale ring | product card, case page | `src/products.py` | logo © Albretsen AS; render original |
| products/fun-libs-{600,1200}.* | Real Fun Libs v5 icon (`icon.png`, rounded 22.5%) under the dome | same | same | same |
| products/toolrails-{600,1200}.* | Real Toolrails icon (`icon.svg`) under the dome | same | same | same |
| products/harbor-{600,1200}.* | Real Harbor filled mark. Its `currentColor` resolved to ink `#091710`; nothing else changed | same | same | same |
| products/luma-600.* | Real Luma wordmark (`logo.png`) under a smaller dome (retired) | archive row | same | same |
| products/retired/{polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}.svg | 96 px "small lens" stand-ins: an engraved line glyph under a glass tint, with a dotted scale ring | archive list | hand-authored SVG (`src/retired.py`) | original |

The dome magnifies evenly over the logo area (the logo sits inside the central 40% of the dome), so logo proportions stay exact.

### Specimens (cut-outs)
| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| specimens/diatom-0{2..6}-glass.webp, radiolar-0{1,2}-glass.webp | Single organisms, cut from the plates and rendered as glass, alpha background, about 560 px | physics bodies, section ornaments, list bullets at large scale | `src/specimens.py` | PD source; render original |
| specimens/*-ink.webp | The same cut-outs as pure ink (`#091710`, alpha) | print-style ornaments, the "then" side | same | same |
| specimens/diatom.json, radiolar.json | canvas size and equivalent radius per cut-out | physics collision radii | same | original |

### Extras
| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| extras/paper-tile.webp (+ .jpg) | 512 px seamless paper with fibres and specks | `body` background | `src/extras.py` | original |
| extras/grid.svg | 280 px atlas grid tile (56 px cells, every fifth line stronger) | section backgrounds, behind glass | hand-authored | original |
| extras/caustic-tile.webp | 640 px tileable green caustic light (photon-mapped through a rippled sheet), alpha | `.caustic` drifting overlay on dark sections, footer | `src/extras.py` | original |
| extras/plate-spumellaria.webp | clean ink plate, 1600×1200 | chorus physics backdrop, about page | `src/plate.py` | PD source |
| extras/plate-cyrtoidea.webp | clean ink plate, 1200×1600 portrait | blog index, long-read margins | `src/plate.py` | PD source |
| extras/scale-bar.svg | 2016 → 2026 scale bar, "first app" to "today", last segment green | timeline, about, footer | hand-authored | original |
| extras/plate-label.svg | atlas plate label ("Plate II · Fig. 04 · Silica, polished"). Edit the text nodes | section headers, blog post covers | hand-authored | original |
| extras/registration.svg | registration mark with a green half | corners of hero, print-like details | hand-authored | original |
| extras/lens-ring.svg | 120-tick scale ring with 12 majors | around lenses, loaders, product images | `src/svgextras.py` | original |

### Interactive (2D physics)
| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| interactive/chorus.js | `mountChorus(canvas, {base, plate, wash, settle})`. A matter.js field: product paperweights drop first (they never rotate, so the logos stay upright), then glass specimens, then ball lenses that refract the plate live (inverted). Drag; click paper to drop a lens. Pauses off screen. Reduced motion paints a settled still | products section ("the chorus"), footer toy | hand-written; matter-js 0.20.0 from jsDelivr (MIT), loaded lazily | original code |
| interactive/chorus.html | minimal demo (`?settle=500` for a still) | reference | | |

### Motion study
`motion.css` (tokens, CSS-only pieces) and `motion.js` (Motion 11.18.2 from jsDelivr, MIT):

1. **Vitrify, the loading moment.** The mark engraves itself line by line (outline, then six hatch strokes leaving the seam, then the axis) while a mono counter runs 2016 → 2026. The right half then *vitrifies*: green glass springs out of the seam, a glint arcs across, the mark breathes once, and the paper sheet lifts away like a print pulled off a press. It waits for the hero image to decode, with a 1.25 s minimum and a 3.3 s cap. References: Rive draw-on geometric loaders, the motion.dev path-drawing pattern, and Vercel's count-then-flip deploy states.
2. **Seam.** A then/now clip driven by `--seam`. It springs after the pointer (stiffness 170, damping 24), returns to centre on leave, drifts toward "today" as the hero scrolls out (`scroll()`), and sweeps once on first view so people discover it. Reference: motion.dev scroll-linked spring.
3. **Chorus.** Staggered arrival: scale 0.72 → 1, y 24 → 0, blur 8 → 0, spring bounce 0.32, 55 ms stagger fanning from an origin. Reference: motion.dev "Physical stagger".
4. **Loupe.** A heavy glass lens under the cursor (spring 260/26) magnifies any image 2.2× with a green rim and a softbox highlight. Reference: Shadertoy refraction, done with CSS backgrounds for zero GPU cost.
5. CSS extras: **Glint** (a softbox reflection sweeping across glass, `.glint.is-lit`), **Ink draw** (`.ink-draw`, `pathLength="1"` strokes), **Caustic drift** (`.caustic`, 38 s and 61 s counter-drifting layers).

Every piece jumps to its end state under `prefers-reduced-motion`.

### Sources and licences of downloaded files
| File used | URL | Licence |
|---|---|---|
| Haeckel, Kunstformen der Natur, Diatomea plate | https://commons.wikimedia.org/wiki/File:Haeckel_Diatomea.jpg (upload.wikimedia.org/wikipedia/commons/e/e9/Haeckel_Diatomea.jpg) | Public domain (1904) |
| Haeckel, Spumellaria plate | https://commons.wikimedia.org/wiki/File:Haeckel_Spumellaria.jpg | Public domain (1904) |
| Haeckel, Cyrtoidea plate | https://commons.wikimedia.org/wiki/File:Haeckel_Cyrtoidea.jpg | Public domain (1904) |
| Haeckel, Stephoidea plate | https://commons.wikimedia.org/wiki/File:Haeckel_Stephoidea.jpg | Public domain (1904) |
| Bricolage Grotesque (variable TTF, used only to outline the wordmark) | https://github.com/google/fonts/tree/main/ofl/bricolagegrotesque | SIL OFL 1.1 |

The same Haeckel volumes are held by the Biodiversity Heritage Library. The plates were published 1899 to 1904 and are public domain; Commons marks each file "Public domain".

## Notes for the builder

- **LCP:** use `hero/split-*` in a `<picture>` (AVIF → WebP → JPEG) with `width`/`height` set, `fetchpriority="high"`, and the LQIP as a CSS background. Use the portrait cut under 700 px. The 1600 AVIF is 169 KB.
- **Live seam:** stack `split-paper-1600.webp` under `split-glass-1600.webp` (`.seam-now`); both are pixel-aligned with the composite. Load the glass half after first paint; the composite can be the first-paint image.
- **Physics** belongs below the fold. Import `interactive/chorus.js` on intersection; it fetches matter.js itself.
- **Keep it calm:** one glass object per screen as the hero of that screen; paper everywhere else.
- **Copy facts** come only from `designs/_shared/content.js`.
