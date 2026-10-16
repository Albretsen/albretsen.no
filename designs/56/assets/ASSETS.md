# Asset kit 56: "Honest Pixels"

Open `preview.html` first, served from the repo root (`python3 -m http.server`), at `/designs/56/assets/preview.html`. Add `?only=<section id>` to see one section (`mood`, `identity`, `palette`, `type`, `hero`, `products`, `extras`, `lens`, `motion`).

## Vision

Every image on the site is a real photograph, and the site says so. The photos are CC0 panoramas and textures from Poly Haven and ambientCG. My own code rounds them down to one bit, to ASCII, to engraved lines and halftone dots. Each image carries a caption with its source and the algorithm used (`misty_pines.hdr → 1-bit, Bayer 8×8`). That is the brutal honesty: show the source, show the process, show the real numbers, including the products that were retired.

It is a technology brand because the craft is visible. The renderers are real code: `js/dither.js` does the same thing live in the browser that the Python scripts in `src/` did offline. The look is nature (Norwegian-feeling forests, moss, birch, fog) pushed through a machine. That reads as calm and precise, with nothing corporate about it. There are no gears, no ships and no finance tropes.

**Hero concept: a moodboard you can rearrange.** The hero is a cream board of pinned pieces: dithered photo tiles, two product cards, stickers and a dark note. They sit around a large headline that is never covered (it has a cream highlight and sits above every piece). Visitors can drag pieces. "Tidy" uses GSAP Flip to snap everything into a contact-sheet grid, and "Scatter" throws them back. The surprise is that the moodboard is also the portfolio, because every piece is a product, a fact or a process.

**Signature delight: the loader.** The counter shows real bytes of the hero photograph arriving (fetch + ReadableStream), so it never lies. While the bytes arrive, a 20 KB preview is drawn as ASCII at 48 px, then 24 px, then 12 px, then Bayer at 6 px and 3 px. The real photograph then replaces it through an 8×8 Bayer-ordered wipe. It has a minimum duration so it never flashes. See `resolveLoader()` in `js/dither.js`; the top of `preview.html` shows it working.

Spark words: *pulse* (the 1 Hz cursor in the mark, the stepped live dots), *vector* (line engraving and the SVG identity), *breath* (the threshold breathes ±3% every 6 s, and the breath-ramp band inhales and exhales).

## References (researched, with what was taken)

| Reference | URL | Taken |
|---|---|---|
| Aceternity UI, Dither Shader | https://ui.aceternity.com/components/dither-shader | Bayer / halftone / duotone modes as a component vocabulary; animated threshold idea (became "breath") |
| Codrops, Building a Real-Time Dithering Shader | https://tympanus.net/codrops/?p=95318 | Screen-locked Bayer matrix indexing; pixel-grid sizing before thresholding |
| niccolofanton/dithering-shader | https://github.com/niccolofanton/dithering-shader | Luminance vs 4×4/8×8 Bayer comparison, grid resolution as a parameter |
| Godot Shaders, Bayer Dithering (port of Shadertoy WstXR8) | https://godotshaders.com/shader/bayer-dithering/ | Gamma before threshold; per-channel step |
| Codrops, Recreating Palmer's Draggable Product Grid with GSAP | https://tympanus.net/codrops/2025/09/01/recreating-palmers-draggable-product-grid-with-gsap/ | Draggable + Flip pattern for the moodboard (tidy / scatter) |
| Framer, Dither Image Reveal / Dithering Hover | https://www.framer.com/marketplace/components/dither-image-reveal | Pointer reveal of the original photo (became the circular "lens") |
| Framer, ASCII Cursor | https://www.framer.com/community/marketplace/components/ascii-cursor-webgl/ | Image-to-glyph mapping with ramp control |
| Framer, Haytham preloader series | https://www.framer.com/marketplace/components/haytham-preloader-v6/ | Counter tied to staged image reveals; we made the counter honest (real bytes) |
| GSAP Flip / Draggable docs (via GreenSock skill notes) | https://gsap.com/docs/v3/Plugins/Flip/ | getState / from with `absolute: true` |
| Shadertoy (browsed for Bayer & ASCII shaders) | https://www.shadertoy.com | Bayer 8×8 table and ordered-dither thinking |

## Palette (OKLCH first)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| `--cream` | oklch(0.962 0.022 88) | #f9f2e2 | Ground, ~52% of area |
| `--cream-2` | oklch(0.925 0.03 86) | #efe5d0 | Panels, the moodboard surface |
| `--cream-3` | oklch(0.86 0.035 84) | #dcd0b8 | Rules, image wells |
| `--deep` | oklch(0.235 0.045 162) | #052517 | Text and dither ink |
| `--forest` | oklch(0.34 0.065 158) | #14422b | Fields, reversed panels |
| `--ink` | oklch(0.17 0.03 165) | #02130c | ASCII backgrounds, night |
| `--moss` | oklch(0.55 0.08 140) | #587d50 | Mid-tone in 3-tone dithers |
| `--brass` | oklch(0.71 0.115 82) | #c59a44 | Accent on dark only |
| `--brass-deep` | oklch(0.56 0.1 75) | #966b27 | Accent text on cream (4.6:1) |
| `--pulse` | oklch(0.61 0.2 12) | #e03c63 | Seed hue 12°. Used only for the uncomfortable truth: paused, retired, errors |
| `--pulse-soft` | oklch(0.86 0.06 12) | #f6c2c6 | Pulse backgrounds |

## Type

- **Bricolage Grotesque** (Google Fonts, OFL), weights 300 to 800, set at `font-variation-settings: 'wdth' 88, 'opsz' 96` with tracking around -0.025em. Use it for statements, headlines, product names and big figures.
- **IBM Plex Mono** (Google Fonts, OFL), 400 and 700. Use it for facts, captions, sources, labels (uppercase, 0.1 to 0.12em tracking), code and the MCP command. Its even widths are why the ASCII renders line up.
- Load: `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,300..800&family=IBM+Plex+Mono:ital,wght@0,400;0,700;1,400&display=swap`

## Motion (motion.css + motion.js, GSAP 3.13 vendored in `vendor/`)

House rule: things move **in steps**, like pixels do. Easing is allowed only where a hand is involved (dragging).

| Name | Kind | Where | What |
|---|---|---|---|
| Resolve-in | entrance | `resolveIn(img)` | Canvas over the image renders its own pixels as Bayer at 32 → 2 px cells (`steps(5)`), then dissolves in 6 steps. Triggered once by ScrollTrigger |
| Scramble | hover | `bindScramble()` + `[data-scramble] .a56-scramble` | Letters churn through the ASCII ramp and lock left to right, 18 frames |
| Bayer wipe | transition | `bayerWipe({ mid })` | Full-screen forest cells fill in 8×8 Bayer order, call `mid()`, empty in the same order |
| Moodboard | interaction | `moodboard(root)` → `{ tidy, scatter }` | Draggable pieces with a hard 10 px lift shadow and velocity tilt; Flip between collage and grid |
| Count-up | detail | `countUp(el)` | Figures arrive in 6 hard steps and keep the source formatting ($, commas, +) |
| Blink | idle | `.a56-mark .cursor`, `brand/mark-animated.svg` | Cursor block in the mark, 1 Hz on/off |
| Pulse | idle | `.a56-live-dot` | Stepped ring on LIVE status |
| Breath | idle | `.a56-breath-band` | Dithered cream↔forest band drifts, 12 s, `steps(120)` |
| Step-spin | hover | `.a56-sticker` | Stickers rotate 30° in 12 ticks |
| Loader | load | `resolveLoader(root, { src, preview })` | The signature: real-byte counter, ASCII → Bayer → photo |
| Dither lens | interactive | `mountDither(canvas, opts)` | Live Bayer/ASCII render with a pointer lens onto the real photo; threshold breathes |

Everything respects `prefers-reduced-motion`. A note for testing: headless Chrome's virtual time barely ticks requestAnimationFrame, so GSAP tweens look frozen in screenshots. In a real browser they run normally.

## Inventory

All "generated" files were made by the scripts in `src/` (Python 3.13 + Pillow + NumPy + fontTools). Those scripts project the equirectangular HDRI previews to rectilinear views (gnomonic), then dither or render them. Paths in the scripts point to a temp folder and are kept for the record.

| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| `brand/mark.svg`, `mark-cream.svg` | Pixel "A" dissolving upward in Bayer dither, brass cursor block | Header, footer, favicon base | Generated (`src/identity.py`) | Client-owned |
| `brand/mark-animated.svg` | Mark with a blinking cursor (embedded CSS) | Loader, about, 404 | Generated | Client-owned |
| `brand/wordmark.svg`, `wordmark-cream.svg` | Mark + "albretsen" (Bricolage outlines) + "AS" (Plex Mono Bold outlines), no font dependency | Header, OG, footer | Generated with fontTools from OFL fonts | Client-owned; glyph outlines from OFL fonts |
| `brand/wordmark-type.svg` | Type-only wordmark | Tight spaces, email signature | Generated | as above |
| `brand/favicon.svg`, `favicon-180.png`, `app-tile.svg` | Solid A on forest; 180 px apple-touch; dithered tile variant | `<link rel=icon>` / touch icon | Generated; PNG via rsvg-convert | Client-owned |
| `brand/og.png` (1200×630), `og-source.html` | OG card: 1-bit pines + wordmark + line | `og:image` | Rendered from `og-source.html` with headless Chrome | Client-owned |
| `img/hero/pines-bayer@1x|2x.webp` | Misty pine forest, 1-bit Bayer 8×8, deep on cream (lossless, 20 KB) | Hero A, loader preview, dither lens | Poly Haven HDRI `misty_pines` https://polyhaven.com/a/misty_pines | CC0 |
| `img/hero/pines-photo@1x|2x.webp`, `pines-photo.avif` | Same view, real photograph, graded 28% toward palette | Loader final frame, lens reveal, before/after | Poly Haven `misty_pines` | CC0 |
| `img/hero/fog-ascii@1x|2x.webp`, `fog-ascii.txt` | Pines in fog looking up, ASCII 180 cols, cream/brass/moss on ink; plain-text version too | Hero B (dark variant), `<pre>` easter egg | Poly Haven `misty_pines` | CC0 |
| `img/hero/moss-atkinson@1x|2x.webp` | Mossy creek, Atkinson error diffusion, 1-bit | Hero C, section backgrounds | Poly Haven HDRI `mossy_forest` https://polyhaven.com/a/mossy_forest | CC0 |
| `img/tiles/pines-3tone@1x|2x.webp` | Pines, ordered 3-tone (deep / moss / cream), 4:5 | Moodboard piece | Poly Haven `misty_pines` | CC0 |
| `img/tiles/moss-atkinson@1x|2x.webp` | Mossy boulder, Atkinson, ink on brass | Moodboard piece | Poly Haven `mossy_forest` | CC0 |
| `img/tiles/birch-4tone@1x|2x.webp` | Birch wood, ordered 4-tone (ink / forest / brass / cream) | Moodboard piece | Poly Haven HDRI `birchwood` https://polyhaven.com/a/birchwood | CC0 |
| `img/tiles/lake-lines@1x|2x.webp` | Frozen lake as "breathing" line engraving (thickness = darkness, offset = luminance) | Moodboard piece, about section | Poly Haven HDRI `frozen_lake` https://polyhaven.com/a/frozen_lake | CC0 |
| `img/tiles/canopy-halftone@1x|2x.webp` | Looking straight up into the pine canopy, 45° halftone, forest on cream | Moodboard piece, blog header | Poly Haven `misty_pines` (pitch 72°) | CC0 |
| `img/products/mcp-emails@1x|2x.webp` | Real MCP Emails icon on a specimen card over ASCII fog; LIVE, $782 MRR | Product section | Logo: `_shared/products/mcp-emails/icon.png` (unaltered); bg Poly Haven `misty_pines` | Logo client-owned; bg CC0 |
| `img/products/fun-libs@1x|2x.webp` | Real Fun Libs v5 icon (rounded mask only) over Bayer birches; 113,000+ installs | Product section | `_shared/products/fun-libs/icon.png`; bg `birchwood` | as above |
| `img/products/toolrails@1x|2x.webp` | Real Toolrails icon over line-engraved frozen lake; BUILDING, 4 connectors | Product section | `_shared/products/toolrails/icon.svg`; bg `frozen_lake` | as above |
| `img/products/harbor@1x|2x.webp` | Real Harbor mark over Atkinson creek in brass; PAUSED, 549 commits | Product section | `_shared/products/harbor/harbor-mark.svg`; bg `mossy_forest` | as above |
| `retired/*.svg` (6) | 12×12 pixel glyph stand-ins with 50% Bayer fill and a red strike: Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, early apps | Retired list. Luma uses its real `_shared/products/luma/logo.png` | Generated (`src/svgs.py`) | Client-owned |
| `stickers/since-2016.svg` | Round sticker: "On Google Play since 2016" | Moodboard, about | Generated | Client-owned |
| `stickers/no-marketing.svg` | Brass sticker: "113,000+ installs * zero marketing", dithered pulse disc | Moodboard, Fun Libs | Generated | Client-owned |
| `stickers/one-bit.svg` | "Every image is a real photo * dithered", 1-BIT in pulse red | Footer, colophon | Generated | Client-owned |
| `stickers/status-paused.svg` | Red label "Paused, not dead. Not live either." | Harbor card, moodboard | Generated | Client-owned |
| `patterns/bayer-12|25|50|75.svg` | 8×8 Bayer tiles at four densities (forest) | CSS backgrounds and masks, hover fills | Generated | Client-owned |
| `patterns/ascii-rule.svg` | A divider that "breathes" through the ASCII ramp | Section dividers | Generated | Client-owned |
| `img/extras/breath-ramp@1x|2x.webp` | Seamless dithered cream↔forest ramp (cosine) | `.a56-breath-band` divider | Generated | Client-owned |
| `img/extras/moss-band@1x|2x.webp` | Mossy rock, 3-tone Bayer band | Footer top edge, section breaks | Poly Haven texture `mossy_rock` https://polyhaven.com/a/mossy_rock | CC0 |
| `img/extras/rock-ascii.webp` | Mossy rock texture as ASCII on cream-2 | Card backs, blog background | Poly Haven `mossy_rock` | CC0 |
| `img/extras/paper-grain.webp` | 512 px seamless cream paper grain | Body background (`background-size:256px`) | ambientCG `Paper004` https://ambientcg.com/view?id=Paper004 | CC0 |
| `js/dither.js` | Dependency-free canvas engine: `mountDither`, `resolveLoader`, `sampleLum`, `PALETTE`, `RAMP` | Loader, lens, any live dither | Written for this kit | Client-owned |
| `demo/dither-lens.html` | Full-screen demo of the lens (Bayer / ASCII toggle) | Reference | Written for this kit | Client-owned |
| `motion.css`, `motion.js` | Signature animations (table above) | Site-wide | Written for this kit | Client-owned |
| `vendor/gsap.min.js`, `ScrollTrigger.min.js`, `Draggable.min.js`, `Flip.min.js` | GSAP 3.13.0 | Motion | https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ | GSAP Standard License (free, including commercial use, since 3.13) |
| `src/*.py` | Generators for every raster and SVG above | Re-render at other sizes or crops | Written for this kit | Client-owned |

The originals I downloaded and used but did not ship (they stay out of the 6 MB budget): Poly Haven tonemapped HDRI JPGs `misty_pines`, `mossy_forest`, `birchwood`, `frozen_lake` (https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/<id>.jpg), and textures `mossy_rock`, `pine_bark`, `rough_linen` (2k diffuse). I also used ambientCG `Paper004_1K-JPG`, plus the IBM Plex Mono and Bricolage Grotesque TTFs from github.com/google/fonts (OFL) for outlines and raster captions.

## Builder notes

- Dither assets must render crisp. Use `image-rendering: pixelated` (`.a56-pixel`) and don't let CSS scale them by non-integer factors if you can avoid it.
- Captions are part of the brand. Every dithered image should carry its source and algorithm in Plex Mono, 10 to 12 px.
- Pulse red is for the truth only: paused, retired, failed. Never use it for decoration or calls to action.
- Product facts come only from `designs/_shared/content.js`. The cards bake in: MCP Emails $782 MRR, Fun Libs 113,000+ installs, Toolrails 4 connectors, Harbor 549 commits.
- Total kit size: about 5.3 MB, most of it the 2x product cards and ASCII renders. Lazy-load anything below the fold.
