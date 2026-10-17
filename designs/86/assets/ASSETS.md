# Airglow: asset kit 86

Open `preview.html` (served from the repo root) to see everything: heroes, the image-sequence scrub, the live three.js roster, product cards, palette, type, the Lottie files and the motion study. `preview.html#flat` lays it out as one tall contact sheet for screenshots.

## Vision

**The view from low orbit, kept honest.** The site is the quiet moment just before an orbital sunrise: a black sky, the thin blue line of the atmosphere, and the name set *behind* the curve of the Earth, so the planet itself holds it. Everything is a real NASA photograph from the International Space Station, graded to one palette. Nothing is drawn to look like space.

**The hero idea, pushed:** a character-select screen where the products are the characters. It is not a neon game menu. Four glass tiles stand on a thin lattice ring floating above first light. As you scroll, the ring turns and lingers on each product: the selected tile rises a little and lights its colour. This is the centrepiece, an **image sequence scrubbed from pre-rendered frames** (baked from the live three.js scene, which also ships).

**One line of light per product.** The full spectrum is used with discipline. The only colours in the system are the real emission lines of the night sky (airglow and aurora). Each product owns one, and it appears nowhere else:

| Product | Line | Why |
|---|---|---|
| MCP Emails | O I 557.7 nm, the auroral green line (seed hue 108°) | the flagship takes the seed |
| Fun Libs | Na I 589.0 nm, sodium airglow | warm and playful |
| Toolrails | N₂⁺ 427.8 nm, nitrogen blue-violet | the building product: cool and precise |
| Harbor | O I 630.0 nm, the red oxygen line | dim and high up, like a paused product |

**Mood:** serene, spacious, calm confidence. Each screen holds one strong idea and a lot of dark sky. Spark words: *lattice* (the ring and the geodesic texture), *scale* (a 25-year-old's company against a planet's curve, stated without a word), *flow* (ground tracks, the scroll scrub, drifting stars).

**Guardrails for the builder:**
- No rockets, astronauts, NASA logos or mission patches, and no "launch" or "mission" puns.
- The products, the facts and the person are the subject. The photographs are only the light they are shown in.
- NASA imagery may not imply NASA endorsement. Credit "Imagery: NASA" in the footer.

## References researched

- https://lusion.co: scroll-led 3D storytelling, magnetic CTAs, generous dark space.
- https://stripe.com: disciplined accent colour on a calm ground, link and nav hover sweeps (the source of *Spectral line*), bento rhythm.
- https://www.are.na/explore and https://www.cosmos.so: slow ambient image boards. The calm drift of cosmos.so became *Airglow drift*.
- Image-sequence technique (Apple AirPods Pro / iPhone pages): frames drawn to canvas rather than video seeking, a DPR cap of 1.5, and nearest-first lazy loading. Notes from https://dev.to/pratham7711/how-i-made-a-scroll-scrubbed-video-portfolio-fast-nextjs-15-gsap-canvas-1mj6 and https://gsap.com/community/forums/topic/37816-control-image-sequence-frames-being-scrolled-on-each-scroll/
- Magnetic buttons: https://cuberto.com/blog/cursor-magnetic-js-component/ and https://gsap.com/community/forums/topic/25319-magnetic-hover-interaction-with-cursor/ (strength 0.3, clientX/Y measurement, a single listener).
- Lottie format: https://docs.lottiefiles.com/en/format/lottie-json/specification. Player: lottie-web 5.12.2 (cdnjs).
- NASA sources: https://images.nasa.gov (Image and Video Library API) and https://eol.jsc.nasa.gov (Gateway to Astronaut Photography). The salt `194be2` was used to pick result indices 1, 9, 4, 11, 14 and 2 from the "orbital sunrise" and "aurora limb" searches. The final selection was made by eye from that shortlist.

## Palette (OKLCH, seed hue 108°)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| `--void` | oklch(0.155 0.020 255) | #070d15 | Page ground: the space just above the limb |
| `--night` | oklch(0.205 0.024 255) | #101822 | Raised surfaces and cards on dark |
| `--hairline` | oklch(0.320 0.022 250) | #2a343e | Lattice lines and rules |
| `--mist` | oklch(0.740 0.020 108) | #acac9e | Secondary text |
| `--starlight` | oklch(0.965 0.018 108) | #f4f5e7 | Primary text, and the ground for light sections |
| `--greenline` | oklch(0.900 0.160 108) | #e9e558 | **Seed.** The one UI accent (focus, live state, the selection) and MCP Emails |
| `--sodium` | oklch(0.800 0.140 70) | #f7ac4d | Fun Libs |
| `--oxygenred` | oklch(0.660 0.170 28) | #e86154 | Harbor (paused) |
| `--nitrogen` | oklch(0.660 0.150 275) | #7988ed | Toolrails |
| `--limb` | oklch(0.720 0.120 238) | #52afe7 | Rayleigh blue of the limb: dividers, gradients, links on light ground |

The tokens are in `palette.css` (as custom properties) and `palette.json` (with notes). Rule: the neutrals carry 95% of every screen. A product colour appears only beside its product.

## Type

- **Geist** (variable, 100–900), SIL OFL 1.1, by Vercel and basement.studio. Display weights are 250–300 at −0.045em, so it reads as light and engineered rather than loud. Body is 400 at 17/1.6.
- **Geist Mono** (variable). Use it for figures, wavelengths and labels at 12.5px and +0.04em.
- Files: `fonts/Geist-Variable.woff2`, `fonts/GeistMono-Variable.woff2` and the licence in `fonts/OFL.txt`, from the npm package `geist@1.4.2` (jsdelivr).

## How to use the signature pieces

- **Name behind the Earth** (`hero/limb-clips.svg`): stack three layers in a 16:9 box: the photo, then the name, then the *same* photo with `clip-path: url(#limb-firstlight)` (or `#limb-greenline`). The clip paths use objectBoundingBox units and were fitted to the actual limb in each 16:9 crop. On phones, use the `*-portrait` crops with the name set in the sky above the limb (no clip). The setup is shown in `preview.html` and `motion.css` (`.limb-hero`).
- **Orbit scrub:** `motion.js → orbitScrub(section)`, with `.scrub` and `.scrub__stage` from `motion.css`. It picks `roster/frames/land` (72 frames at 1280×720) or `port` (48 frames at 720×1280) by aspect ratio. Use `frames/land/f000.webp` as the poster. The `onProduct(i)` callback is for the HTML name and line overlay. Text is never baked into the frames.
- **Live roster:** `roster/roster.js → createRoster(canvas)`, with `setProgress`, `select`, `start` and `stop`, and the event `roster:select`. It uses three.js r169 by exact URL. Load it after first paint. Pass `backdrop: null` for a fully synthetic planet that needs no photo.
- **Magnetic pull:** add `data-magnetic="0.3"` to buttons and links, wrap the label in `.magnetic__label`, and call `magnetic()`. It only runs on fine pointers and switches off for reduced motion.

## Motion study (motion.css and motion.js)

1. **Limb rise.** The name rises from behind the Earth's limb on first paint: translate, fade, a 6px blur clearing, and a 2.4s expo ease-out. The planet clip does the masking. *Ref:* Apple product-page hero reveals and Lusion title reveals.
2. **Orbit scrub.** Scroll scrubs the baked roster sequence through a canvas. The ring lingers on each product (the plateau easing is inside the frames) and glides between them. *Ref:* Apple AirPods Pro scroll sequences.
3. **Magnetic pull.** Buttons lean toward the cursor inside a 1.6× halo, the label leans further for depth, and a critically damped spring brings them back with no bounce. *Ref:* the Cuberto magnetic component and lusion.co CTAs.
4. **Spectral line.** A link's underline sweeps in from the left in its product's emission colour, with a faint glow. *Ref:* Stripe nav and link hovers.
5. **Airglow drift.** The star tile drifts 1px about every 1.5s, and the lattice breathes between 35% and 80% opacity over 14s. *Ref:* the ambient calm of cosmos.so.

There are also three Lottie files (`lottie/*.json`, hand-authored and tiny), played in preview.html with lottie-web 5.12.2 `lottie_light`:
- `orbit-loader`: a satellite on a tilted orbit that shrinks and dims as it passes behind (240 frames at 60 fps).
- `select-pulse`: two staggered ripples marking the selected product.
- `limb-draw`: the limb draws itself with trim paths, then first light blooms. Use it as a section intro.

## Inventory

All sizes are approximate. All NASA photographs are public domain: NASA imagery is not copyrighted, and no endorsement is implied.

| File | What | Intended use | Source (how made) | Licence |
|---|---|---|---|---|
| identity/mark.svg, mark-on-dark.svg, mark-on-light.svg | An "A" whose crossbar is the curved limb, with first light at the apex | Logo mark, nav | Hand-drawn SVG | Made for client |
| identity/wordmark.svg | Mark + "Albretsen" (Geist Regular, outlined) + "AS" (Geist Mono) using currentColor | Header, footer | fontTools outlines from Geist (OFL permits outlining in logos) | Made for client, font OFL |
| identity/wordmark-name.svg | "Albretsen" alone in Geist Light, outlined | The huge name behind the limb | fontTools | Made for client, font OFL |
| identity/favicon.svg, favicon-180.png | Mark on a void tile | Favicon, apple-touch-icon | SVG, rendered with rsvg-convert | Made for client |
| identity/og-1200x630.jpg | Name behind the sunrise limb, with the line "I build software that pays for itself." | Open Graph / social | Composited in Python (Pillow) from hero B + limb mask | Imagery NASA PD |
| hero/firstlight-{960,1600,2560}.{avif,webp,jpg} | Orbital sunrise over the limb, 16:9 | **Hero A** (main) | NASA iss072e030246 (Don Pettit, 2024-10-07), https://images.nasa.gov/details/iss072e030246; cropped (station hardware removed), graded with numpy (void black point, highlight shoulder, grain) | Public domain (NASA) |
| hero/firstlight-portrait-{720,1200}.* | 4:5 crop centred on the sun | Hero on phones | Same | Public domain |
| hero/greenline-{960,1600,2560}.* | Aurora curtains over a moonlit cloud deck, 16:9 | **Hero B**, about/intro section | NASA iss066e008713 (2021-10-19), https://images.nasa.gov/details/iss066e008713; greens nudged toward hue 108°, clouds calmed | Public domain |
| hero/greenline-portrait-{720,1200}.* | Portrait crop on the aurora pillars | Phones | Same | Public domain |
| hero/limb-clips.svg | Two objectBoundingBox clip paths that trace the planet edge in each 16:9 hero | Name-behind-Earth layering | Edge found per column, robust quadratic fit (numpy) | Made for client |
| products/card-{mcp-emails,fun-libs,toolrails,harbor}-{600,1200}.* | 4:5 "character" cards: the **real logo, unchanged**, on a glass plinth, circled by an orbit, over a plate in the product's emission colour, with a wavelength tag and a spectrum ruler | Product grid, product pages, social | src/card.html rendered in headless Chrome | Imagery NASA PD; logos are the client's own |
| products/plate-*.{webp,jpg} | The same plates without the logo (960×1200) | Live HTML cards with crisp logos layered on top | MCP Emails: iss064e053179; Fun Libs: iss073e0988954; Toolrails: s45-31-012 (aurora shifted to nitrogen violet); Harbor: sts059-52-029 (red oxygen line, Orion) | Public domain (NASA) |
| products/retired/*.svg | "Dimmed bodies": monogram, year, dotted orbit, a muted satellite | Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, early apps | SVG with outlined Geist glyphs | Made for client |
| (Luma) | Uses the real `_shared/products/luma/logo.png` | Retired list | Client asset | Client's own |
| roster/roster.js | three.js module: lattice ring, glass product tiles with real logos, eased plateaus, photo or synthetic planet backdrop | **Interactive centrepiece** | Written for this kit; three@0.169.0 via jsdelivr | Code: made for client; three.js MIT |
| roster/demo.html | Live demo: click, arrows, parallax | Demo / embed | Same | Same |
| roster/frames/land/f000–f071.webp | 72 frames at 1280×720 (~1.0 MB total) | **Image-sequence scrub**, desktop | roster.js baked via src/roster-frame.html + headless Chrome | Made for client |
| roster/frames/port/f000–f047.webp | 48 frames at 720×1280 | Scrub on phones | Same | Made for client |
| lottie/orbit-loader.json, select-pulse.json, limb-draw.json | Hand-authored Lottie | Loader, selected state, section intro | Generated by a Python script | Made for client |
| extras/spectrum.svg | Ruler from 400 to 700 nm with the four product lines | Legend for the colour system, footer detail | SVG, outlined mono labels | Made for client |
| extras/ground-track.svg | Three satellite ground tracks over a lat/long lattice | Section background ("flow") | SVG | Made for client |
| extras/limb-divider.svg | A section rule shaped like the curve of the planet, with airglow | Between sections | SVG | Made for client |
| extras/status-{live,building,paused,retired}.svg | Orbit glyphs for product status | Lists, product meta | SVG | Made for client |
| textures/stars-1024.{webp,png} | Seamless star field with transparency | Section skies, Airglow drift | numpy-generated | Made for client |
| textures/lattice.svg | Seamless triangular (geodesic) lattice | Background texture, masked near edges | SVG | Made for client |
| textures/grain-256.png | Neutral grain tile | Overlay at 4–8% on flat dark areas | numpy | Made for client |
| fonts/Geist-Variable.woff2, GeistMono-Variable.woff2 | Typefaces | Everything | npm geist@1.4.2 | SIL OFL 1.1 |
| palette.css, palette.json | Tokens | Theme | Computed from OKLCH (lib in Python) | Made for client |
| motion.css, motion.js | The motion study | Site behaviour | Written for this kit | Made for client |
| src/card.html, src/roster-frame.html | Render sources for cards and frames | Re-baking if products change | Written for this kit | Made for client |

## Performance notes

- Hero A (firstlight) is tiny: 1600w AVIF is about 14 KB and WebP about 12 KB, because most of the frame is honest black. The first paint can carry the hero, both fonts (about 116 KB) and the CSS well under 300 KB.
- Hero B (greenline) is richer, at about 124 KB for the 1600w AVIF. Lazy-load it below the fold.
- The scrub frames load after first paint, nearest frame first. The live three.js scene loads only on intersection.
- Every image has width and height (or an aspect-ratio box), so layout shift is 0.
- Kit total: about 5.8 MB, of which 1.5 MB is the two frame sets.
