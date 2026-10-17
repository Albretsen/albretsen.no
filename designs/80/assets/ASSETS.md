# 80 / Pavilion Light — asset kit

Open `preview.html` to see the contact sheet: every asset, the palette, the type, the motion study and the live 3D scene.

## Vision

One horizon, one building, one day.

The site is a symmetrical miniature set. A cream Streamline deco pavilion with a stepped tower and a brass finial stands on a golden bluff above a calm pastel sea, with soft golden hills on either side. The whole scene is built in three.js from primitives, so it works both as finished stills and as a live page. As the visitor scrolls, the sun moves from first light, through a clean pastel morning, to sunset. At noon the sun sits exactly on the finial. That moment is the brand mark (a sun with the stepped tower cut out of it) made real.

How the brief's worlds are blended, as atmosphere and never as a postcard:
- **California** gives the golden hills, the bluff, ranch-modern calm and the long coastal light.
- **Miami** gives the Streamline/deco architecture (eyebrow ledges, round wing ends, stepped tower, fins) and the pastel morning light: flamingo bands, mint glass and a crisp white sky.
- **The Paris palette** supplies the materials: zinc copings and rules, cream plaster, café-red doors and awnings, brass trim.
- **Nordic understatement** sets the tone: one idea per screen, a lot of air, small labels and no exclamation.
- **The easter egg, "After Hours":** on the live scene, click the sun three times or press `N`. Night falls, the windows light up warm, and the stars slowly gather into the Albretsen mark as a constellation. Press `N` again for day.

Products appear as small deco kiosks on the same terrace, each at its own hour, each carrying the real product logo on its sign. Harbor is paused, so its shutter is down. Retired products become house-number tiles.

**Rules for the builder:** the copy is about software, never about the place. Use no place names, no palm-tree emoji and no greetings in other languages. Café red is the only accent. Flamingo and mint appear only as light or bands, never as button colours. Keep the sky empty except for the sun and the headline.

### Mood and references
- https://www.apple.com/macbook-air/: start-frame/end-frame scroll reveals, with the product as hero against a calm field. Informs Horizon Rise and Sun Scrub.
- https://stripe.com/sessions (redirects to stripesessions.com): card lift on hover and confident condensed headlines. Informs Awning Unroll.
- https://www.jacquemus.com: sun-bleached Mediterranean minimalism and slow ambient product loops. Informs Sea Breeze and the amount of white space. The site blocked fetching (403), so this comes from known visual language.
- https://www.loewe.com: editorial, art-led stacking of full-width sections with very little UI.
- Miniature faking / tilt-shift (https://en.wikipedia.org/wiki/Miniature_faking, three.js tilt-shift shader docs): a high, narrow-FOV camera with blurred top and bottom bands. Applied in the grade.
- Heat-haze technique (Codrops WebGL heat haze; Framer "svgmelt distort" SVG feTurbulence haze): informs the Heat Haze motion.
- WPA / National Park Service silkscreen posters (1937-38, public domain): the flat, sun-faded colour fields informed the sky gradients and are included as regraded "studies".

## Palette

| Token | Hex | OKLCH | Role |
|---|---|---|---|
| `--cream` | #F3EBDD | oklch(94.3% 0.021 81.8) | page, plaster |
| `--cream-warm` | #EADBC4 | oklch(89.7% 0.035 78.7) | cards, ledges |
| `--zinc` | #8E959B | oklch(66.6% 0.012 243.7) | rules, copings, metadata |
| `--zinc-deep` | #565C63 | oklch(47.2% 0.014 252.2) | secondary text |
| `--ink` | #2A2A2E | oklch(28.7% 0.007 285.9) | text |
| `--cafe` | #B5352B | oklch(52.0% 0.166 28.6) | the one accent: mark, links, doors |
| `--brass` | #B8924A | oklch(68.1% 0.101 81.6) | hairlines, numerals |
| `--flamingo` | #EFA6AE | oklch(79.7% 0.087 12.0) | light, tower band |
| `--mint` | #BFE3D3 | oklch(88.5% 0.044 166.7) | glass, noon light |
| `--sky` | #CFE3EE | oklch(90.4% 0.026 231.6) | morning sky |
| `--ochre` | #D9B36C | oklch(78.5% 0.100 82.1) | golden hills |
| `--dusk` | #4E4F86 | oklch(45.3% 0.089 281.4) | after hours |

The sky keyframes live in `3d/pavilion.js` (`KEYS`). Each one sets zenith, horizon and sun colour for t = 0, .12, .30, .50, .72, .88 and 1.

## Typefaces
- **Antonio** (variable 100-700, Vernon Adams, SIL OFL 1.1): the condensed poster face. Use it in caps for headlines (600, tracking .03em) and labels (600, tracking .28em). It has deco-era proportions without being a costume.
- **Source Sans 3** (variable 200-900 + italic, Paul D. Hunt / Adobe, SIL OFL 1.1): the humanist sans for body and lead text, at 17px/1.6 body and 350 weight for the lead.
- Both are self-hosted, latin subset (includes æøå), in `fonts/`. The `@font-face` rules are in `tokens.css`.
- All identity SVGs and the retired tiles use outlined glyphs from Antonio 560/600, so they need no web font.

## Motion (motion.css + motion.js)
1. **Sea Breeze** (`.breeze`, `.sway`): ambient drift of cut-outs and awnings. Two periods that never line up (11 s / 7.3 s) and about 6 px of travel.
2. **Horizon Rise** (`.rise` + `horizonRise()`): a brass hairline draws, then each line rises from behind it. Use it for headlines.
3. **Awning Unroll** (`.awning-card`): on hover or focus a striped scalloped valance drops from the top edge and the card settles 2 px. Use it for product cards.
4. **Heat Haze** (`heatHaze(el, {top, height})`): an SVG feTurbulence + feDisplacementMap shimmer, limited to a thin masked band just above the horizon of the hero image. It runs at about 24 fps and pauses off-screen. For the morning hero use `top: .5, height: .1`.
5. **Sun Scrub** (`sunScrub(section, onTime)`): maps scroll through a tall section to t = 0.04..0.96. It sets `--t` and calls `pavilion.setTime(t)`.

The live scene adds a slow camera drift of about 0.12 units, in the same breeze character. Everything respects `prefers-reduced-motion`.

## Interactive / 3D
- `3d/pavilion.js` exports three builders:
  - `createPavilion(canvas, {time, view, still})` returns `{setTime, setView('front'|'portrait'|'tower'|'wide'|'terrace'), setNight, resize, start, stop, dispose}`. It fires an `afterhours` event on the canvas.
  - `createKiosk(canvas, {logo, name, awning, accent, closed, time})`.
  - `createProp(canvas, {prop: 'cypress'|'parasol'|'finial'|'tower'})` renders on a transparent background.
- `3d/demo.html` is the live demo. The baked still paints first and the canvas fades in over it, so there is no layout shift. Load the module lazily after first paint (about 690 KB of three.js plus 30 KB for the scene). On mobile, consider showing only the stills plus `--t` sky tinting.
- `3d/bake.html` and `3d/tools/` are the offline pipeline:
  1. `python3 tools/bakeserver.py <repo root> <outdir> 6080` starts the bake server.
  2. Headless Chrome opens `bake.html?t=.3&w=2400&h=1350&view=front&save=x.png` and the server saves the PNG.
  3. `grade.py` applies the tilt-shift, bloom, warm vignette, lifted blacks and grain, then exports AVIF/WebP/JPEG.

## Performance notes
- Hero LCP: `hero-morning-1600.avif` is 22 KB and `-2400.avif` is 56 KB. The JPEG fallback is 104/288 KB. Every `<img>` carries width/height.
- Art-direct with `<picture media="(max-width:700px)">` to `hero-portrait-*`.
- The plaster texture is 32 KB and tiles at 512 px.
- The total kit is about 6.2 MB. A page needs only a fraction: hero, fonts (about 70 KB), tokens and the identity SVGs.

## Inventory

| File | What | Intended use | Source | Licence |
|---|---|---|---|---|
| `identity/mark.svg`, `mark-cream.svg` | Sun + stepped tower + three sea lines | Logo, nav, footer | Drawn by hand as SVG paths for this kit | Original, client-owned |
| `identity/wordmark.svg` | ALBRETSEN AS, Antonio 560, outlined | Header, documents | Glyph outlines extracted with fontTools from Antonio | Original artwork; Antonio OFL permits embedding outlines |
| `identity/lockup.svg`, `lockup-cream.svg` | Mark + wordmark, light/dark | Header | As above | As above |
| `identity/favicon.svg`, `apple-touch-icon-180.png` | Mark on a cream tile | Favicon / iOS icon | SVG; PNG rasterised with rsvg-convert | Original |
| `identity/og-image-1200x630.jpg`, `og-source.html` | Open Graph card | Social previews | HTML composition over hero-terrace, screenshot in headless Chrome | Original |
| `hero/hero-morning-{960,1600,2400}.{avif,webp,jpg}` | Main hero, front view, pastel morning (t=.30) | Homepage hero | three.js render (pavilion.js) baked in headless Chrome, graded with grade.py | Original |
| `hero/hero-terrace-*` | Three-quarter view at golden hour | Second hero / about / OG | Same pipeline | Original |
| `hero/hero-portrait-{720,1080}.*`, `hero-portrait-sunset-1080.*` | Portrait framing | Mobile hero | Same pipeline | Original |
| `hero/day-0{1..6}-*-1600.{avif,jpg}` | First light, morning, noon, golden, sunset, after hours | Scroll-scrub fallback, timeline section, blog covers | Same pipeline | Original |
| `hero/noon-crown-1600.*` | Tower close-up, noon sun on the finial | 404, blog header, "about the mark" | Same pipeline | Original |
| `products/kiosk-mcp-emails-*` | Kiosk with the real MCP Emails mark, morning | Product card | three.js kiosk; logo `_shared/products/mcp-emails/logo-mark.svg` used unchanged as the sign texture | Original render; product logo owned by the client |
| `products/kiosk-fun-libs-*` | Kiosk with the real Fun Libs v5 icon, noon | Product card | Same; `_shared/products/fun-libs/icon.png`, app-icon corner mask only | Same |
| `products/kiosk-toolrails-*` | Kiosk with the real Toolrails icon, afternoon | Product card | Same; `_shared/products/toolrails/icon.svg` | Same |
| `products/kiosk-harbor-*` | Kiosk with the real Harbor mark, shutter down (paused), sunset | Product card | Same; `_shared/products/harbor/harbor-mark.svg` | Same |
| `products/retired/*.svg` | House-number tiles: Luma, Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, Early apps | Archive / history list | Hand-drawn SVG stand-ins; the year is the `since` year from content.js | Original |
| `extras/cutouts/{cypress,parasol,finial,tower}.webp` | Transparent prop renders | Section ornaments, with Sea Breeze | three.js `createProp`, auto-cropped | Original |
| `extras/ephemera-day-card.svg` | "One horizon / six settings of light" time card | Scroll menu, sidebar ornament | SVG + outlined Antonio | Original |
| `extras/pattern-sunburst.svg` | Tileable deco fan (160x80) | Section backgrounds, footer | Generated SVG | Original |
| `extras/divider-awning.svg` | Scalloped café/cream valance (tile 96x40) | Dividers, Awning Unroll | Generated SVG | Original |
| `extras/divider-horizon.svg` | Horizon rule with a setting sun and sea lines | Section divider | Generated SVG | Original |
| `extras/texture-plaster-512.{webp,jpg}` | Seamless plaster grain | Page background | numpy pink noise | Original |
| `posters/study-lassen-1938.*` | Mountain + pines crop, regraded | Blog covers, framed art | "Lassen Volcanic Natl Park poster 1938", NPS / WPA. https://commons.wikimedia.org/wiki/File:Lassen_Volcanic_Natl_Park_poster_1938.jpg (crop removes lettering) | Public domain (US Government work) |
| `posters/study-fort-marion-1938.*` | Water + wall crop, regraded | Same | "Ft Marion Natl Monument poster 1938", WPA. https://commons.wikimedia.org/wiki/File:Ft_Marion_Natl_Monument_poster_1938.jpg | Public domain |
| `posters/study-see-america-1938.*` | Stone arch crop, regraded | Same | "See America, WPA poster, ca. 1938", Frank S. Nicholson, WPA Federal Art Project. https://commons.wikimedia.org/wiki/File:See_America,_WPA_poster,_ca._1938.jpg | Public domain |
| `3d/pavilion.js` | Live scene, kiosk and prop builders | Hero / interactive | Written for this kit | Original |
| `3d/demo.html`, `3d/bake.html`, `3d/tools/*` | Demo, baker, grade pipeline | Development | Written for this kit | Original |
| `motion.css`, `motion.js` | Motion study | Site | Written for this kit | Original |
| `tokens.css` | Palette, type, easing tokens | Site | Written for this kit | Original |
| `fonts/antonio-var-latin.woff2` | Antonio variable | Headlines | Google Fonts (fonts.gstatic.com), v22 | SIL OFL 1.1 |
| `fonts/source-sans-3-*.woff2` | Source Sans 3 variable, roman + italic | Text | Google Fonts, v20 | SIL OFL 1.1 |
| `vendor/three.module.min.js` | three.js r170 | 3D | https://unpkg.com/three@0.170.0/build/three.module.min.js | MIT |

Considered but not used: Fort Marion is a fortress, so if any military association matters, use only Lassen and the arch. The WPA "Discover Puerto Rico" park poster (public domain) was reviewed and left out because of its palm cliché and lettering.
