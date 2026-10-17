# Design 77 · "Shutterlight" · asset kit

Open `preview.html` (served over http) to see every asset, the palette, the type and the motion running.

## Vision

**A window in a sunlit room, and the view passes through a day.**

The hero is a single, centred, perfectly symmetrical set: a limewashed Provençal wall, an arched window with a sunburst fanlight, lavender shutters folded back, two pots of lavender on a terracotta sill, and a band of hand-painted tiles. Outside the window there is no photograph. There is a painting, and it changes with the time of day: a Norwegian valley at dawn (cold blue turning gold), fjord cliffs and waterfalls in the morning, a terracotta town above a blue bay at noon, a golden hour. The room stays still and the light changes. Scroll position is the clock.

Why this fits the client:
- **Light, real imagery and craft**, the things that worked in earlier rounds. The views are real public-domain oil paintings, graded rather than illustrated, and the set is made as carefully as a miniature: deadpan, centred, rigorous.
- **Norway and the south in one frame.** The window is southern (limewash, shutters, tiles). The first view is Norwegian (a Dahl dawn and Fearnley's Gudvangen cliffs). The day ends on the Riviera. No place names appear anywhere.
- **Calm confidence.** One idea per screen and a lot of wall. Products are objects in the house, not cards in a grid.
- **It stays a technology site.** The paintings are atmosphere. The products carry their real logos, and the copy is about software.

Mood: early-morning quiet, a room where someone works well. The personality is cinematic ambition: slow camera moves (dolly, crane), never a bounce.

### The mark

The mark is the window itself: an arch, a transom, and a fanlight whose glazing bars are the rays of a rising sun. It works as a favicon, a stamp, a tile and a signature. It appears as built architecture in the hero (the fanlight), so the logo is literally the window you look through.

### Signature delight: the postcard

MCP Emails *is* a postcard: the front is the noon painting, the back is a handwritten note, the stamp is the real MCP Emails logo, and there is a postmark. Click to turn it over (`motion.css` → Postcard flip). The same flip pattern works for blog posts (front: a painting plate; back: the excerpt).

### References studied

- https://www.cursor.com: a painted landscape wallpaper used behind real product UI. This is the closest precedent for paintings framing a tech product, and it works because the paintings never become the subject.
- https://stripesessions.com (stripe.com/sessions redirects there): a single art image bookends the page, hero and footer. I borrowed the bookend idea: the window opens the page and the fanlight divider closes it.
- https://www.airbnb.com/luxury: indoor–outdoor framing, a room that opens onto a landscape, golden-hour light. I took the framing, not the travel tone.
- https://www.siteinspire.com: browsed for editorial serif layouts with generous measure.
- https://firewatchgame.com: the canonical multi-layer parallax hero. It is the model for the Dolly motion.
- https://scroll-driven-animations.style: CSS `scroll()` / `view()` timelines, the model for Day pass and Dolly with no JS.
- Codrops 3D card flip (tympanus.net): perspective / preserve-3d / pre-rotated back face, the model for the postcard.
- Wes Anderson framing notes (theconversation.com, "The Wes Anderson recipe"): symmetry, pastel complements, centred subjects with unequal details.
- The Met Open Access API (collectionapi.metmuseum.org v1.1): every painting was checked `isPublicDomain: true`.

## Palette: Riviera, at first light

| Token | Hex | OKLCH | Use |
|---|---|---|---|
| Limewash | `#E8BF86` | oklch(82.8% 0.087 75.2) | The room. Page background in "wall" sections. |
| Ochre | `#E2A93B` | oklch(77.0% 0.139 80.0) | The sun in the mark; small highlights. |
| Terracotta | `#B9532F` | oklch(56.5% 0.141 39.3) | Accents, rules, links on cream, buttons. |
| Sea blue | `#2F6C9E` | oklch(51.5% 0.101 246.3) | Window frames, structure, tile ink. |
| Dawn blue | `#6A7FB6` | oklch(60.2% 0.088 267.7) | Only as light: the multiply tint at dawn. |
| Lavender | `#A59CBF` | oklch(71.2% 0.051 296.9) | Shutters. |
| Lavender deep | `#6E6496` | oklch(53.3% 0.078 292.7) | Labels and small caps on cream. |
| Rose wall | `#E6B3A0` | oklch(80.8% 0.065 41.4) | An alternate wall for a second room (Toolrails). |
| Cream | `#F4E9D4` | oklch(93.7% 0.030 83.6) | Paper, reading surfaces, the default page. |
| Ink | `#2A2233` | oklch(26.9% 0.033 305.8) | Text: an aubergine black, never pure #000. |

Contrast on Cream: Ink is 12.7:1 and Sea blue is 4.6:1, both fine for body text and links. Lavender deep (4.45:1) and Terracotta (4.0:1) pass for large text (18.5px bold / 24px+) and UI. Use them for headings, caps labels and rules, not for small body text.

## Type

- **Display: Cormorant Garamond** (SIL OFL 1.1), weights 500/600, plus italic 500. Use it for headlines (italic), the wordmark, and spaced caps for labels and signs (letter-spacing .3em).
- **Text: EB Garamond** (SIL OFL 1.1), 400 and italic, 19–21px, line-height 1.6, measure about 62ch.
- Both are vendored in `fonts/` as variable Latin-subset woff2 files from Google Fonts. Preload `cormorant-garamond.woff2` only. Use `font-display: swap`.
- No sans-serif. Numbers (113,000+, $782) are set in Cormorant 600 caps-height figures.

## Motion (`motion.css` + `motion.js`)

| Name | What | Reference |
|---|---|---|
| **Day pass** | Scroll is the time of day. `--day` (0–1) crossfades the four views and the wall's light (dawn-blue multiply → none → amber). Pure CSS `animation-timeline: scroll()`, with a JS fallback. | scroll-driven-animations.style, apple.com scroll-scrubbed films |
| **Dolly** | A slow cinematic parallax through three layers: painting (far, +6%), wall (mid, −2% and scale 1.10), sill and lavender (near, −9% and scale 1.22). It reads as a camera pushing through the window. Uses `view()` timelines with a JS fallback. | firewatchgame.com, cursor.com |
| **Postcard flip** | The signature. A 0.9s rotateY with a hair of overshoot; the card lifts toward the camera mid-turn. Works by click, Enter or Space, and sets `aria-pressed`. | Codrops card flip |
| **Shutters** | The one-time curtain-up on first paint. The lavender shutters swing open on their hinges, the left a beat before the right. | Wes Anderson title reveals; hinged-door reveals |
| **Sign sway** | The Toolrails sign is a damped pendulum on hover or tap (1.9s). | — |
| **Tile lay** | Tiles are laid from the centre outward as a row enters view. | — |

Everything stops under `prefers-reduced-motion`, and every motion degrades to a still frame.

## Interactive asset

`interactive/daylight.js` is a dependency-free WebGL module (about 7 KB), with a demo at `interactive/daylight-demo.html` and a live copy in `preview.html`.
- It takes the four `views/view-*-800.webp` plates, and `set(t)` moves the day from 0 (dawn) to 1 (gold).
- The next scene arrives as **light**, not as a crossfade: a ragged sweep starts near the sun, which travels across the top of the arch. The grade drifts from cold blue shadows to amber. It adds soft rays, drifting dust motes in the glow, a vignette and grain.
- The scene follows the pointer by about 1–2%, and the image is overscanned so no edge ever shows.
- `play()` runs a slow ping-pong day (48s per half), or the page can drive `set()` from `motion.js` → `dayPass({ onChange })`.
- It returns `null` without WebGL. Keep the `<img>` fallback under the canvas, as both demos do.

## How the hero was made

1. **Paintings.** Downloaded from The Met's Open Access CDN, cropped to remove frames, then graded with numpy (`src/grade.py`): split-toning (cold shadows, warm highlights), a sunrise bloom, light grain.
2. **The set.** It is built as SVG in `src/window-scene.html`: limewash from `feTurbulence` mottling, louvred shutters, a stone surround with keystone, a reveal with gradient light, the fanlight, procedurally generated lavender (seeded) and the tile frieze. It was rendered at 2400×1500 in headless Chrome.
3. **Finishing.** `src/finish.py` applies a canvas weave, fine grain and a 0.55px soften, so the drawn set and the oil painting read as one surface.
4. **Layers.** The wall and the front (sill + lavender) were rendered on black and on white, and alpha was recovered by difference, giving `layers/*.webp` for the parallax.
5. **Time of day.** Each view is baked with its own light: dawn has the room in blue shadow with only the window lit; noon has no tint; gold has an amber multiply plus beams.

Note: AVIF files were encoded with SVT-AV1 (via ffmpeg) at dimensions cropped to a multiple of 8. The `2400` AVIF is 2400×1496 and the `1600` is 1600×1000. Use `object-fit: cover` on a fixed aspect-ratio box (16/10 desktop, 3/4 portrait); the difference is under 0.3%.

## Inventory

| File | What | Intended use | Source / how made | Licence |
|---|---|---|---|---|
| `identity/mark.svg` | Window-sunrise mark, terracotta + ochre | Logo, header | Hand-built SVG geometry | Original |
| `identity/mark-mono.svg` | Same, `currentColor` | Single-colour contexts | Original | Original |
| `identity/wordmark.svg` | ALBRETSEN with hairline rules and AS | Header, footer, OG | Cormorant Garamond outlines (fontTools) | Original; font OFL permits embedding outlines |
| `identity/lockup.svg` | Mark + name, horizontal | Nav bar | As above | Original |
| `identity/favicon.svg`, `favicon-180.png` | Mark on a cream tile | Favicon, apple-touch-icon | SVG; PNG by rsvg-convert | Original |
| `identity/og.jpg` | 1200×630 share card: arched dawn window + wordmark + line | Open Graph / Twitter | Rendered in Chrome from `src/product-scenes.html#og` | Original + Met CC0 painting |
| `hero/window-dawn-{960,1600,2400}.{avif,webp,jpg}` | **Hero 1.** The window at dawn (2400 has no JPEG; use 1600 JPEG as fallback) | Home hero, desktop | Set + Dahl painting, see "How the hero was made" | Original + CC0 |
| `hero/window-dawn-portrait-{750,1120}.*` | Hero 1, phone crop | Home hero, ≤700px | Crop of the above | Original + CC0 |
| `hero/window-noon-*` (same set) | **Hero 2.** The window at noon, Riviera view | Second chapter / about / alternate hero | Set + Cézanne | Original + CC0 |
| `hero/window-fjord-{960,1600}.{webp,jpg}` | The window in the morning | Chapter image | Set + Fearnley | Original + CC0 |
| `hero/window-gold-{960,1600}.{webp,jpg}` | The window at golden hour | Footer / last chapter | Set + Claude Lorrain | Original + CC0 |
| `views/view-dawn-*` | Graded plate: J. C. Dahl, *View over Hallingdal*, 1844 | Daylight shader, Day pass, full-bleed openers | https://www.metmuseum.org/art/collection/search/441967 (image `DP278466.jpg`) graded | CC0 (Met Open Access) |
| `views/view-fjord-*` | Graded plate: Thomas Fearnley, *Gudvangen*, 1839 | As above | https://www.metmuseum.org/art/collection/search/839044 (`DP-19487-001.jpg`) | CC0 |
| `views/view-noon-*` | Graded plate: Paul Cézanne, *The Gulf of Marseille Seen from L'Estaque*, c. 1885 | As above; postcard front | https://www.metmuseum.org/art/collection/search/435872 (`DT1029.jpg`) | CC0 |
| `views/view-gold-*` | Graded plate: Claude Lorrain, *Sunrise*, 1646–47 | As above | https://www.metmuseum.org/art/collection/search/435907 (`DP-14936-013.jpg`) | CC0 |
| `layers/wall-{1200,2400}.webp` | Wall, shutters, surround, tile wainscot, window transparent | Dolly parallax (mid layer) | Rendered on black and white, alpha by difference | Original |
| `layers/front-{1200,2400}.webp` | Sill and lavender pots | Dolly parallax (near layer) | As above | Original |
| `products/mcp-emails-postcard-{600,1200}.*` | MCP Emails as a postcard on a sea-blue table; the stamp is the **real** `logo-mark.svg` | Product section | Rendered SVG scene; real logo placed unchanged | Original; logo © Albretsen AS |
| `products/fun-libs-tiles-*` | The **real** Fun Libs v5 `icon.png` as the centre tile of a hand-painted panel; brass plate "113,000+ installs · since 2019" | Product section | Rendered SVG scene | Original; icon © Albretsen AS |
| `products/toolrails-sign-*` | The **real** Toolrails `icon.svg` on a painted sign hanging from an iron rail | Product section (sways) | Rendered SVG scene | Original; icon © Albretsen AS |
| `products/harbor-window-*` | The **real** Harbor mark path, gilded on the glass of a lit window at blue hour; a card reads "Paused · 549 commits" | Product section | Rendered SVG scene. The Harbor mark is drawn with `currentColor` by design; here it is gold leaf. | Original; mark © Albretsen AS |
| `products/retired-row-{800,1600}.webp` | Seven glazed tiles: Luma (real `logo.png`), Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, Early apps | "Archive" / retired list | Rendered SVG; stand-in glyphs drawn for this kit | Original |
| `products/retired-*.webp` | The same tiles, one per file, 240px | Inline list markers | Cropped from the row | Original |
| `extras/postcard-front-{750,1500}.webp` | Postcard front (noon painting with border) | Postcard flip | Rendered | Original + CC0 |
| `extras/postcard-back-{750,1500}.webp` | Postcard back (note, MCP Emails stamp, postmark) | Postcard flip | Rendered | Original |
| `extras/sign-albretsen-{800,1600}.webp` | Hand-painted shop sign, alpha | Header or footer flourish | Rendered on black and white, alpha by difference | Original |
| `extras/stamp-albretsen.svg` | House stamp: the window at dawn over a fjord | Blog posts, footer, favicon alternative | SVG | Original |
| `extras/postmark.svg` | Inked postmark + wavy cancellation | Postcards, dates on posts | SVG with ink filter | Original |
| `extras/tile-provence.svg` | Seamless hand-painted tile | Wainscot band, section borders, background | SVG with displacement filter | Original |
| `extras/fanlight-divider.svg` | Half sunburst between hairlines | Section divider | SVG | Original |
| `extras/limewash-1024.webp` | Seamless limewash wall texture | Backgrounds | numpy FFT noise (`src/textures.py`) | Original |
| `extras/paper-1024.webp` | Seamless cream postcard stock | Cards, blog | numpy noise + fibres | Original |
| `extras/lavender-pot.webp` | Lavender in a terracotta pot, alpha | Small ornament, 404 page, footer | Cut from the front layer | Original |
| `interactive/daylight.js` | WebGL daylight window module | Hero enhancement after first paint | Hand-written GLSL/JS | Original |
| `interactive/daylight-demo.html` | Demo with a time slider | Reference | — | Original |
| `motion.css`, `motion.js` | Six named motions | Site motion | — | Original |
| `fonts/cormorant-garamond(-italic).woff2` | Display face | All display type | https://fonts.google.com/specimen/Cormorant+Garamond (gstatic v21 Latin subset) | SIL OFL 1.1 |
| `fonts/eb-garamond(-italic).woff2` | Text face | Body | https://fonts.google.com/specimen/EB+Garamond (gstatic v33 Latin subset) | SIL OFL 1.1 |
| `src/*` | Sources: set and scene SVG/HTML, grading, finishing and texture scripts | Rebuilding the kit (paths point at a temp dir; adjust) | — | Original |

Unused but checked during research (all Met CC0, could extend the set): Cézanne *Gardanne* (435871), Cézanne *Mont Sainte-Victoire and the Viaduct* (435877), Van Gogh *Olive Trees* (437998), Peder Balke *The North Cape by Moonlight* (441379), Renoir *The Farm at Les Collettes* (437433).

## Notes for the builder

- **First paint.** Use `<picture>` with AVIF → WebP → JPEG for `hero/window-dawn` (portrait source under 700px), `fetchpriority="high"`, and a fixed aspect-ratio box. The page needs about 50–110 KB of hero plus about 75 KB of fonts. Load everything else lazily.
- **Upgrade after load.** Swap the still for the Dolly layers (`views/view-dawn-1600.webp` + `layers/*-1200.webp`), then, if WebGL is available and motion is allowed, mount `daylight.js` into the window aperture. The aperture in the 2400×1500 set is x 834–1566, spring line y 570, bottom y 1290, arch radius 366.
- **Copy.** Keep it factual and calm (see `designs/_shared/content.js`). No place names, no French words. The paintings are atmosphere, not the subject.
- **Products as objects.** Postcard (MCP Emails), tile (Fun Libs), sign (Toolrails), lit window (Harbor). Retired products are a row of tiles.
