# Kit 37 — Cloud Chamber

Open `preview.html` first (serve from the repo root; it imports `../../_shared/content.js`).

## Vision

A cloud chamber makes the invisible legible: a charged particle passes, the gas condenses and a precise spiral appears. The site should do that for Asgeir's work. The hero is a **physics playground**: ALBRETSEN in liquid chrome falls into a calm rose "chamber" and can be grabbed and thrown. Every hard impact ionises the gas and draws bubble-chamber tracks (charged spirals, V-shaped decays) in canvas 2D, which fade slowly.

Materials are mirror chrome, rose-tinted metal and thin-film iridescence. They sit next to real 1,800-year-old Roman and Islamic glass (The Met, CC0), whose iridescence comes from centuries of weathering: chrome is the fast version and the museum glass is the slow one. The personality is **scientific calm**: long, even easing; at most one overshoot; mono labels; numbers set like measurements. The signature delight is **Decode**: text resolves out of a churn of brand glyphs.

Spark words: *clarity* (rock crystal, glass), *fracture* (the logo's break line, the shattered A, the weathered bottle), *scale* (tiny beads next to huge letters, micro tracks across full-bleed plates).

The kit avoids gears, ships, timetables, split-flaps, finance cues, neon glow and generic blob gradients.

### References (researched)
- Bruno Simon portfolio — https://bruno-simon.com — physical, playful 3D world with Rapier physics; the "everything can be knocked over" attitude.
- Aceternity UI — https://ui.aceternity.com/components — *Encrypted Text* (gibberish reveal → our Decode), *3D Card Effect* / *Evervault Card* (→ Tilt + Sheen).
- Hoverstat.es — https://hoverstat.es — typohypergraphicobject.page (hue-rotated image load-in → Film), age-hh.com (scaling page transition), softlabor.biz (type coming into focus).
- Spline community — https://community.spline.design — material and particle scenes (chrome / glass material language; nothing downloaded).
- GSAP ScrambleTextPlugin docs — https://gsap.com/docs/v3/Plugins/ScrambleTextPlugin/ — scramble timing model (ours is dependency-free).
- matter.js falling text patterns — https://dev.to/thormeier/throwing-around-text-kinetic-typography-part-2-it-defies-gravity-itself-thanks-to-matterjs-239e and https://www.shadcn.io/text/falling-text — letter bodies + mouse constraint.
- three.js MeshPhysicalMaterial iridescence — https://threejs.org/docs/api/en/materials/MeshPhysicalMaterial.html
- The Met Open Access policy — https://www.metmuseum.org/about-the-met/policies-and-documents/open-access

## Palette — OKLCH hue 348°

Rose ramp (surfaces, type, tracks):

| token | OKLCH | hex |
|---|---|---|
| r50 | oklch(0.985 0.008 348) | #fff8fb |
| r100 | oklch(0.955 0.022 348) | #fceaf3 |
| r200 | oklch(0.905 0.048 348) | #f9d3e5 |
| r300 | oklch(0.83 0.09 348) | #f4b0d2 |
| r400 | oklch(0.73 0.14 348) | #e781b7 |
| r500 | oklch(0.63 0.19 348) | #d64d9d |
| r600 | oklch(0.54 0.18 348) | #b43481 |
| r700 | oklch(0.44 0.15 348) | #892361 |
| r800 | oklch(0.34 0.11 348) | #5e1942 |
| r900 | oklch(0.25 0.07 348) | #381127 |
| r950 | oklch(0.18 0.04 348) | #1e0915 |
| r990 | oklch(0.13 0.025 348) | #0e0409 |

Steel ramp (same hue, low chroma). This is what the chrome reflects, so the metal reads as silver rather than as pink plastic:

| token | OKLCH | hex |
|---|---|---|
| s50 | oklch(0.97 0.012 348) | #fcf2f6 |
| s200 | oklch(0.88 0.02 348) | #e2d2da |
| s400 | oklch(0.72 0.03 348) | #b49da8 |
| s600 | oklch(0.52 0.04 348) | #7b606d |
| s800 | oklch(0.32 0.035 348) | #402c36 |
| s950 | oklch(0.16 0.025 348) | #15090f |

`--chrome` (in motion.css) is the horizon-line gradient used for chrome type. Defaults: paper r50, ink r950, accent r500, dark bands r990 → r800. Product logos keep their own colours.

## Type
- **Unbounded 800** (display, numerals; −0.02 to −0.04em). It is also the source of every 3D letter, the logo and the sprites: `3d/glyphs-unbounded-800.json` holds the real outlines, extracted with fontTools at wght 800. Google Fonts, OFL.
- **Geist 300–600** (reading text). Google Fonts, OFL.
- **Geist Mono 400–500** (labels, 10–11px, +0.08–0.12em, uppercase). Google Fonts, OFL.

```html
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;800&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
```

## Libraries (pinned)
three@0.170.0 · cannon-es@0.20.0 (baking only) · matter-js@0.20.0 · gsap@3.13.0 + ScrollTrigger, all from cdn.jsdelivr.net.

## Inventory

| file | what it is | intended use | source | licence |
|---|---|---|---|---|
| identity/logo-mark.svg | Fractured A, chrome gradient | header, footer, sticker centre | Generated: Unbounded "A" outline, clipped along the fracture line (−60,500)→(1040,280), upper shard shifted | Original work for client |
| identity/logo-mark-mono.svg | Same, `currentColor` | small sizes, one-colour contexts | Generated (as above) | Original |
| identity/wordmark.svg | ALBRETSEN, `currentColor` | nav, footer | Unbounded 800 outlines, +30 tracking | Original (font OFL) |
| identity/wordmark-chrome.svg | ALBRETSEN in chrome gradient | hero lockups, OG | as above | Original |
| identity/logo-lockup.svg | Mark + wordmark | header | as above | Original |
| identity/favicon.svg | Chrome A on a wine tile | favicon | Generated | Original |
| identity/favicon-180.png | 180 px PNG of the favicon | apple-touch-icon | rsvg-convert | Original |
| identity/og-image.jpg | 1200×630 | Open Graph / social card | src/og.html screenshot (fracture render + tracks + wordmark) | Original |
| hero/hero-pile-{1440,2880}.webp, hero-pile-2880.avif | Chrome letters and primitives resting after a physics drop, light studio, headroom for type | **Main hero** (static fallback or poster behind the live chamber) | three.js render (src/render.html?scene=pile), cannon-es simulation, seed 04246b | Original |
| hero/hero-fracture-{1440,2880}.webp, .avif | Fractured chrome/iridescent A with shards, dark | Alternative hero or dark section; object sits right, text left | render.html?scene=fracture | Original |
| hero/hero-pile-dark-{1440,2880}.webp | Physics pile in a dark studio | Dark sections, footer | render.html?scene=pile&mood=dark | Original |
| hero/hero-pile-portrait-{585,1170}.webp | 9:16 crop | Phone hero | render.html (portrait camera) | Original |
| hero/hero-fracture-portrait-{585,1170}.webp | 9:16 crop | Phone hero (dark) | render.html | Original |
| products/mcp-emails-{800,1600}.webp | Real MCP Emails icon.png on a chrome-backed tile in a wine dish | MCP Emails card | render.html?scene=dish with `_shared/products/mcp-emails/icon.png`, unaltered | Logo © Albretsen AS; render original |
| products/fun-libs-{800,1600}.webp | Real Fun Libs icon.png (v5), rounded as an app tile | Fun Libs card | `_shared/products/fun-libs/icon.png` | as above |
| products/toolrails-{800,1600}.webp | Real Toolrails icon.svg | Toolrails card | `_shared/products/toolrails/icon.svg` | as above |
| products/harbor-{800,1600}.webp | Real Harbor mark in its own banner colourway (cream on #1B1B1B), dark studio | Harbor card | src/harbor-tile.svg (mark geometry untouched) | as above |
| products/luma-{800,1600}.webp | Real Luma logo.png on its cream tile | Retired: Luma | `_shared/products/luma/logo.png` | as above |
| products/standin-polyglot.webp | Iridescent torus knot | Retired: Polyglot Pilot | render.html?scene=standin&kind=polyglot | Original |
| products/standin-pinpoint.webp | Chrome pin (cone and sphere) | Retired: PinPoint | kind=pinpoint | Original |
| products/standin-webvakt.webp | Chrome ring with an iridescent eye | Retired: WebVakt | kind=webvakt | Original |
| products/standin-jokes.webp | Capsule and bead | Retired: Daily Jokes / Joke Central | kind=jokes | Original |
| products/standin-hyring.webp | Iridescent shield | Retired: Tryggere Hyring | kind=hyring | Original |
| products/standin-early.webp | Three stacked tiles | Retired: early apps | kind=early | Original |
| museum/met-bottle-{600,1200}.webp | Islamic glass bottle, 9th–10th c., weathered iridescence ("fracture") | Editorial plate beside products or the blog | https://www.metmuseum.org/art/collection/search/451716, graded into the rose ramp (src: images.metmuseum.org/CRDImages/is/original/DP212413.jpg) | CC0 (Met Open Access) |
| museum/met-jar-{600,1200}.webp | Roman glass jar, 3rd–4th c. CE ("iridescence") | Editorial plate | https://www.metmuseum.org/art/collection/search/245408 (DP222591.jpg) | CC0 |
| museum/met-lentoid-{600,1200}.webp | Minoan rock crystal lentoid seal, ca. 1700–1600 BCE ("clarity") | Editorial plate | https://www.metmuseum.org/art/collection/search/252306 (DP-31933-001.jpg) | CC0 |
| museum/met-bowl-{750,1500}.webp | Rock crystal bowl, 3rd–5th c. ("scale") | Editorial plate, wide | https://www.metmuseum.org/art/collection/search/468471 (DP-25593-001.jpg) | CC0 |
| extras/tracks-light-{1200,2400}.webp | Bubble-chamber track plate, light | Section backgrounds (opacity 0.3–0.6), behind the about text | src/plate.html (canvas 2D, src/tracks.js), seed 04246b | Original |
| extras/tracks-dark-{1200,2400}.webp | Track plate, dark | Footer, dark bands, OG | plate.html theme=dark seed b6424 | Original |
| extras/chrome-2016-{800,1600}.webp | "2016" in chrome numerals, alpha | "Published on Google Play since 2016" line | render.html?scene=since | Original |
| extras/sticker-since-2016.svg | Circular chrome sticker: GOOGLE PLAY SINCE 2016 · ALBRETSEN AS · NORWAY | Floating sticker near the about or footer, tilt on hover | Generated from Unbounded outlines set on a circle | Original |
| extras/specimen-numerals.svg | Chrome 01–04 in rounded frames | Section index | Generated | Original |
| extras/pattern-graticule.svg | Tileable 240 px graticule (fiducial crosses, dotted rules) | Chamber backdrop, section grids, at 120 px | Generated | Original |
| 3d/chamber.js | **Interactive centrepiece**: canvas 2D + matter.js letters, grab and throw, impact tracks, click to fire a decay | Hero | Hand-written; uses 3d/sprites + src/tracks.js | Original |
| 3d/sprites/*.webp | Chrome letter sprites A L B R E T S N, E2 (wine), mark; 400 px, alpha | Bodies drawn by chamber.js | render.html?scene=sprite | Original |
| 3d/specimen.js | Live three.js fractured mark: drag to turn, hover closes the fracture, `setFracture()` for ScrollTrigger | About section or 404 | Hand-written; src/lab.js | Original |
| 3d/demo.html | Tiny demo of both live modules (`?settled` starts from the resting pile) | Reference | — | Original |
| 3d/glyphs-unbounded-800.json | Unbounded 800 glyph outlines as SVG path data | 3D text and sprites | fontTools from https://github.com/google/fonts/tree/main/ofl/unbounded | OFL 1.1 |
| src/lab.js | Studio environment built from primitives (PMREM), chrome / iridescent / rose / wine / glass materials, glyph extrusion, fractured mark | Shared by render.html and specimen.js | Original | Original |
| src/render.html | Render bench that bakes every still. Scenes: pile, fracture, dish, standin, sprite, since; `&w=&h=` sets size | Re-render | Original | Original |
| src/tracks.js, src/plate.html | Generative track drawing (particle in a magnetic field, energy loss, droplets) | Re-bake plates, live trails | Original | Original |
| src/og.html | OG composition page | Re-bake the OG image | Original | Original |
| motion.css / motion.js | Motion study (below) | Whole site | Original | Original |

Total size is about 2.1 MB.

## Motion study (motion.css + motion.js)

1. **Decode** (signature), `decode(el)` / `[data-cc-decode]`. Brand glyphs (ALBRETSN0–9/+·:—×) churn, then lock in from left to right with a slight random lag per character, about 1.1 s. It runs once when the element enters view, on headlines and figures. Based on Aceternity's Encrypted Text and GSAP ScrambleText.
2. **Settle** (entrance), `settle(els)` / `[data-cc-settle]`. Items drop in from −60 px with a ±14° spin, ease `back.out(1.4)`, staggered in random order. It is the calm sibling of the physics hero.
3. **Tilt + Sheen** (hover), `.cc-sheen` + `tilt(el)` / `[data-cc-tilt]`. A pointer-tracked perspective tilt (max 8°) while a single soft-light specular band crosses the card over 1.1 s. Based on Aceternity's 3D Card and Evervault card.
4. **Film** (image load-in), `.cc-film` / `[data-cc-film]`. Images arrive with hue −38°, saturation 1.6, blur 14 px and scale 1.04, then settle over 1.6 s. Adapted from typohypergraphicobject.page via hoverstat.es.
5. **Fracture** (section transition), `.cc-fracture` / `fractureReveal(el)` / `[data-cc-fracture]`. A clip-path opens along the logo's break line; ScrollTrigger scrubs `--f` from 0 to 1.
6. **Orbit** (loader), `.cc-orbit`. Two counter-rotating arcs, for use while the chamber loads.

All of them respect `prefers-reduced-motion`. The chamber then starts settled and static, and the specimen renders a single frame.

## Builder notes
- Hero: mount `chamber.js` on a full-bleed canvas over `pattern-graticule.svg`. Use `hero-pile-*` as the poster or no-JS fallback, and the portrait crops on phones. Pass `{ settled: true }` to start from the resting pile.
- Tracks should stay quiet: line widths of 0.6–1.5 px, never glowing. Use the dark plates for footer bands.
- Pair museum plates with the products as the "slow iridescence" counterpoint, and always caption them with object number and "The Met, CC0".
- Never recolour product logos. The dish renders show them as shipped.
