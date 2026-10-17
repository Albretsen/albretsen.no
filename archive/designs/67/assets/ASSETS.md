# Amber Hour (design 67): asset kit

> Software with a long view.

Open `preview.html` for the full contact sheet: every plate, the palette, the type, the motion study (scroll through the long take), the live sky and the postcard. `interactive/demo.html` shows the hero as a live composite.

---

## 1. Art direction

**Vision.** It is the hour before the lights come on. Sun-bleached stucco and golden stone hold the last warm light, an arcade runs toward a bright vanishing point, and the sky goes from mauve to peach above zinc roofs and stepped towers. Two worlds share one grade here: the pastel deco towers of a beach city (fins, ziggurats, eyebrow ledges) and the Haussmann street (shutters, iron balconies, mansards, arcades). Neither is named or shown as a postcard cliché. They are simply *architecture in good light*, which is how this company wants its software to feel: built with care, symmetrical where it counts, and calm.

**The idea, in one line:** every image is a postcard from the amber hour, and the site *sends* you its products: a stamp, a sign, a plaque, a lit window.

**How it stays a technology company.** The imagery is atmosphere, not subject. Products carry their own real logos. The copy is about software. The interactions show craft (a WebGL sky, a physically turning card, a pinned dolly) and the easter egg is a working `claude mcp add` line hidden under a stamp.

**Mood words:** cinematic, symmetrical, warm, unhurried, exact. Wes Anderson framing (frontal elevations, centred suns), LA dusk haze, the grain of a printed postcard.

**Composition rules for the builder**
- One strong image per screen. Type goes in the sky, never over windows (all plates leave sky for it).
- Elevations stay frontal and centred. When in doubt, centre it.
- The sun is the only bright point. Accent colour (`--sun-ink`) is used about once per screen.
- One serif line per screen (Bodoni Moda italic). Everything else is Schibsted Grotesk.
- Never cut the camera. Use one continuous move per page (see motion).

**Reference URLs (research)**
- https://www.loc.gov/pictures/collection/travel/ (WPA travel posters; LOC itself was behind a bot check, so the same LOC items were taken from their Wikimedia Commons mirrors)
- https://commons.wikimedia.org/wiki/Category:Carol_M._Highsmith (Highsmith's Miami Beach deco photographs, public domain by the photographer's dedication)
- https://www.snohetta.com (calm stacked layout; the *Low-res* toggle treats image weight as a design decision, which inspired the Exposure motion)
- https://www.visitnorway.com (full-bleed hero with focal-point crops per breakpoint)
- https://www.are.na/explore (did not render without login; noted)
- https://scroll-driven-animations.style and https://developer.mozilla.org/docs/Web/CSS/animation-timeline/view (view timelines for the long take)
- https://gsap.com/docs/v3/Plugins/ScrollTrigger/ (scrub smoothing ≈ 1 s gives the "camera on a rig" feel; reimplemented without GSAP)
- https://www.apple.com/airpods-pro/ (pinned scroll scenes) · https://www.apple.com/apple-card/ (the physical card turn) · https://press.stripe.com (3D covers that tilt toward the pointer)
- https://www.awwwards.com/inspiration/horizontal-scroll-verticite-architecture (slat and mask reveals on architecture imagery)
- Salt `2fb591`: result picks 2, f→15, b→11, 5, 9, 1 were opened from each search list (e.g. Commons hits #1, #2, #5, #9 of the Highsmith query; #5 and #15 of the poster query).

---

## 2. Palette

One amber family from cream to night umber, which is also the gradient map every photograph passes through. Mauve and rose appear **only in the sky** and in the postmark ink.

| Token | Hex | OKLCH | Use |
|---|---|---|---|
| `--cream` | `#FFF6E6` | `oklch(97.6% 0.023 82.1)` | page, paper, reversed type |
| `--linen` | `#F8DFB6` | `oklch(91.4% 0.060 80.0)` | quiet fills, highlights |
| `--apricot` | `#EDBF84` | `oklch(83.2% 0.092 72.9)` | sunlit stone, reversed accents |
| `--amber` | `#D18E4A` | `oklch(70.1% 0.117 64.2)` | the sun, illustrations |
| `--ochre` | `#A65E27` | `oklch(55.5% 0.116 54.5)` | eyebrows, labels |
| `--sun-ink` | `#B8642A` | `oklch(59.1% 0.129 51.8)` | links, the mark's sun (text use ≥ 18 px) |
| `--sienna` | `#6E3816` | `oklch(40.4% 0.089 49.8)` | secondary text |
| `--umber` | `#3B1D0E` | `oklch(26.9% 0.053 46.1)` | body text, the mark (≈ 14:1 on cream) |
| `--night` | `#1E0F08` | `oklch(18.8% 0.029 45.9)` | deepest shadow, dark sections |
| `--peach` | `#F2B68A` | `oklch(82.1% 0.091 57.3)` | sky, low |
| `--rose` | `#C98478` | `oklch(68.1% 0.088 30.3)` | sky, middle |
| `--mauve` | `#5E4A6E` | `oklch(44.4% 0.062 309.4)` | sky zenith, postmark ink |

Sky gradient: `linear-gradient(#5E4A6E, #C98478 45%, #F2B68A 78%, #FFE2B8)`.

## 3. Typefaces (both SIL OFL 1.1, self-hosted, Latin + Norwegian subset)

| File | Family | Role |
|---|---|---|
| `fonts/bodoni-moda.woff2` (53 KB) | Bodoni Moda, variable `opsz` 6–96, `wght` 400–900 | display, wordmark. Set `font-optical-sizing:auto`; italic 500, −0.02em for headlines; never below 20 px |
| `fonts/bodoni-moda-italic.woff2` (64 KB) | Bodoni Moda Italic | the voice: headlines, the postcard message |
| `fonts/schibsted-grotesk.woff2` (46 KB) | Schibsted Grotesk, variable `wght` 400–900 | all working text. Body 400/18/1.6; labels 600, 11–13 px, +0.28em caps. (A grotesk drawn for a Norwegian newsroom, a quiet nod to home.) |

Source: https://github.com/google/fonts (`ofl/bodonimoda`, `ofl/schibstedgrotesk`), subset with fontTools pyftsubset.

---

## 4. Motion (motion.css + motion.js, no dependencies)

| # | Name | What | Researched from |
|---|---|---|---|
| 1 | **The Long Take** `.ah-longtake` | Pinned plate (the arcade). Scroll drives one unbroken dolly toward the vanishing point: scale 1 → 1.42, a 1.5% drift, warmth .15 → .75. CSS `view-timeline`; rAF fallback with ~1 s smoothing. | apple.com/airpods-pro pinned scenes; scroll-driven-animations.style; GSAP ScrollTrigger scrub |
| 2 | **Postcard Turn** `.ah-turn` | Card arrives face-down, lifts (translateZ 90 px, shadow grows), turns, settles at −2°. 1.15 s `cubic-bezier(.2,.75,.15,1)`. Interactive version in `interactive/postcard.*`. | apple.com/apple-card; press.stripe.com |
| 3 | **Exposure** `.ah-expose` | Photos develop: blown-out, low-contrast, soft → the grade over 1.6 s. Waits for decode, so lazy images never pop. | snohetta.com Low-res toggle; darkroom printing |
| 4 | **Persiennes** `.ah-shutters` | 12 louvres rotate open top to bottom, 45 ms stagger. | Haussmann persiennes; Awwwards slat reveals |
| 5 | **Horizon link** `.ah-link` | The underline is a horizon; a sun rises from it at the pointer's x. | brand mark |

All respect `prefers-reduced-motion` (static frames, no pinning).

## 5. Interactive

- `interactive/amber-sky.js`: `mountSky(canvas, {hour, sun})` is a dependency-free WebGL fragment shader. It draws the brand dusk, a sun with halo, drifting haze strata (fbm), and dithered grain (no banding). `setHour(0..1)` goes from blue hour to amber; `setSun(x, y)`. DPR is capped at 1.5, it pauses offscreen and renders a single frame under reduced motion. It falls back to a CSS gradient. Load it after first paint.
- `interactive/postcard.css` + `postcard.js`: `enhancePostcard(el)` adds turn on click, Enter or Space (`aria-pressed`) and a pointer tilt. **Hidden easter egg:** on the back, drag the stamp off, or focus it and press Delete. Under it, in microtype, is `claude mcp add albretsen https://albretsen.no/mcp` with a copy button.
- `interactive/demo.html` is the tiny demo: the live hero (sky shader + `extras/spires-cutout`) where you drag the sun and wheel or arrow-key the hour, plus the postcard.

---

## 6. Builder notes

- **Hero.** Desktop uses `hero/spires-wide-*` (16:9) with `object-position: 50% 70%`. Mobile (≤ 700 px) uses `hero/spires-tall-*` (9:16, sky in the top 40%). Ship AVIF → WebP → JPEG via `<picture>` with `fetchpriority="high"`. The 1024 AVIF is 14 KB; the 1600 AVIF is under 40 KB. Upgrade to the live sky (`amber-sky.js` + `spires-cutout`) only after load, if desired.
- `images.json` lists every responsive image with its aspect ratio, sizes, formats, a 24 px LQIP data URI and the average colour. Use these for zero layout shift and an instant placeholder.
- Text sits in the sky. Plates were cropped or extended so there is always clean sky above the architecture.
- The postcard front is `hero/facade-card-*` (3:4). Use the same card for "about" and the contact moment.
- Retired products are `products/retired/*.svg`: cancelled stamps, self-contained, no external requests.

---

## 7. Inventory

Licence key: **PD** = public domain; **CC0**; **OFL** = SIL Open Font License; **Own** = made for this kit (no restrictions, client-owned); **Product** = the client's own product brand asset, used unchanged.

### Identity
| File | What | Use | Source | Licence |
|---|---|---|---|---|
| identity/mark.svg | Arch-A mark: Didone-contrast arch, horizon crossbar, sun | logo, avatars | drawn in code (identity pipeline) | Own |
| identity/mark-mono.svg / mark-reverse.svg | `currentColor` / cream-on-dark versions | nav, dark sections | same | Own |
| identity/wordmark.svg (+ -mono, -reverse) | "Albretsen AS": Bodoni Moda opsz 30 wght 500 + Schibsted 600, outlined to paths, kerned with HarfBuzz | header, footer | generated with fontTools + uharfbuzz | Own (fonts OFL) |
| identity/lockup.svg | mark + wordmark | header on wide screens | same | Own |
| identity/favicon.svg | mark on a cream tile, switches to umber in dark mode | `<link rel=icon>` | same | Own |
| identity/favicon-180.png, favicon-32.png | apple-touch-icon, legacy | head | rsvg-convert | Own |
| identity/og.jpg (+ og.html source) | 1200×630 Open Graph image | social cards | baked from og.html with headless Chrome | Own (+ PD plate) |

### Hero plates (AVIF/WebP at every width, JPEG at the fallback width)
| File | What | Use | Source | Licence |
|---|---|---|---|---|
| hero/spires-wide-{640,1024,1600,2400} | Two deco towers (fin spires, ziggurat) with sky replaced by a procedural dusk and a low sun; graded through the amber map; hotel signage and a dome painted out | desktop hero, OG | Carol M. Highsmith, *Art Deco detail in Miami Beach, Florida* (LCCN 2011633166), https://commons.wikimedia.org/wiki/File:Art_Deco_detail_in_Miami_Beach,_Florida_LCCN2011633166.tif | PD (Highsmith dedication; LOC: no known restrictions) |
| hero/spires-tall-{640,1080} | Same towers, 9:16, sky in the top 40% | mobile hero | same | PD |
| hero/facade-card-{600,1000,1400} | Symmetric stone elevation (shutters, iron balconies, arcade, lanterns), sun centred between chimneys; shop signs painted out | the postcard front, about | *Paris 75001 Rue de Rivoli no 232 facade 20110530*, https://commons.wikimedia.org/wiki/File:Paris_75001_Rue_de_Rivoli_no_232_facade_20110530.jpg | PD (author's release) |
| hero/facade-wide-{1024,1600,2400} | Mansard roofline at sunset, tall sky | section opener | same source | PD |
| hero/arcade-{640,1080,1600} | One-point-perspective colonnade with lanterns, soft light shafts, glowing vanishing point (53% / 60%) | The Long Take | *Palais Royal Paris Mai 2006 001*, https://commons.wikimedia.org/wiki/File:Palais_Royal_Paris_Mai_2006_001.jpg | PD (author's release) |

### Product visuals (scene source: products/scenes.html, baked with headless Chrome)
| File | What | Use | Source | Licence |
|---|---|---|---|---|
| products/mcp-{800,1200} | MCP Emails as a perforated postage stamp ("17 tools") with the **real app icon** printed as its vignette, franked by an Albretsen postmark, over a postcard | MCP Emails card | scene + `_shared/products/mcp-emails/icon.png` | Own + Product |
| products/funlibs-{800,1200} | Vertical deco blade sign on a tower, **real Fun Libs icon** in the disc, "113,000+ installs · since 2019" | Fun Libs card | scene + `_shared/products/fun-libs/icon.png` | Own + Product |
| products/toolrails-{800,1200} | Brass-framed enamel plaque on the stone facade with the **real Toolrails icon** | Toolrails card | scene + `_shared/products/toolrails/icon.svg` | Own + Product |
| products/harbor-{800,1200} | A lit arched window at dusk, the **real Harbor mark** (harbor-mark.svg geometry, `currentColor` = umber) and name, a "Paused" tag | Harbor card | scene + `_shared/products/harbor/harbor-mark.svg` | Own + Product |
| products/retired-{1000,1600} | Album page of seven cancelled stamps | retired list | scene | Own |
| products/retired/*.svg | One cancelled stamp per retired product: Luma (**real Luma logo.png** embedded), Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, Early apps (%) | retired list, hover cards | drawn in code | Own (+ Product for Luma) |

### Extras
| File | What | Use | Source | Licence |
|---|---|---|---|---|
| extras/spires-cutout-{1024,1600,2400} | Transparent cut-out of the graded towers | over the live WebGL sky | from the Highsmith plate above | PD |
| extras/roofs-{800,1280} | Zinc rooftops from above in warm haze | blog / writing index cover | *Paris Roofs.jpg*, https://commons.wikimedia.org/wiki/File:Paris_Roofs.jpg | CC0 |
| extras/horizon-{1024,1600} | Empty beach at sunrise, towers on the horizon, sky regenerated | footer band | Highsmith, *Empty beach at Miami Beach, Florida* (LCCN 2011634587), https://commons.wikimedia.org/wiki/File:Empty_beach_at_Miami_Beach,_Florida_LCCN2011634587.tif | PD |
| extras/poster-arch-{600,1000} | WPA silkscreen of a natural stone arch, c. 1938, lettering cropped, slightly warmed | about-page ephemera | *See America, WPA poster, ca. 1938* (US Travel Bureau / Federal Art Project, LOC), https://commons.wikimedia.org/wiki/File:See_America,_WPA_poster,_ca._1938.jpg | PD (US federal work; LOC: no known restrictions) |
| extras/paper.webp | Seamless 512 cream card stock | page background, postcard | numpy procedural noise | Own |
| extras/stucco.webp | Seamless 512 sunlit lime plaster | panels, product backs | numpy procedural (height-field shading) | Own |
| extras/grain.png | 256 grey grain tile | `mix-blend-mode:overlay` at ~0.3 | numpy procedural | Own |
| extras/postmark.svg | Violet franking mark, ring text "ALBRETSEN AS · SOFTWARE · EST. 2016", MMXXVI, waves | postcard, footers | drawn in code, text outlined | Own |
| extras/stamp-albretsen.svg | The brand stamp: mark in a dusk-gradient frame | postcard back, favicon alt | drawn in code | Own |
| extras/sunburst-divider.svg | Deco sun rays over a hairline | section rule | drawn in code | Own |
| extras/shutter.svg | Louvred persienne | ornament, loader | drawn in code | Own |
| extras/arch-frame.svg, arch-mask.svg | Arched window frame + mask (3:4) | `mask-image` for any photo | drawn in code | Own |

### Code
| File | What | Licence |
|---|---|---|
| motion.css, motion.js | Motion study (5 named animations) | Own |
| interactive/amber-sky.js | WebGL dusk shader module | Own |
| interactive/postcard.css, postcard.js | Turning postcard + stamp easter egg | Own |
| interactive/demo.html | Live hero + postcard demo | Own |
| preview.html | Contact sheet (`?sheet` fixes heights for one-shot screenshots, `?flip` shows the postcard back) | Own |
| images.json | Responsive image manifest with LQIP + average colour | Own |
| src/*.py | The grading and generation pipeline (gradient map, sky key and replacement, sign removal, grain, export, scenes bake). Paths point at the original temp workspace. | Own |

**Grading recipe** (src/grade.py): luminance → contrast around a pivot → gamma → 8-stop amber gradient map (`#1E0F08 → #FFF6E6`), mixed with 12–22% of the warmed original. Blue sky is keyed (`B − R > 0.12`, top-connected components, small specks absorbed) and replaced by the procedural dusk (mauve → rose → peach → pale gold, sun disc + two halos, faint haze strata). Then screen-blend sun bloom, low haze, a soft vignette, and midtone-weighted grain at the output size.

**Budget.** About 6.4 MB on disk for the whole kit, including every responsive size and format. First paint on desktop needs one hero AVIF (~38 KB at 1600), the wordmark SVG and the two roman fonts (~100 KB).
