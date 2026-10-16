# Design 39: Cold Boot

Asset kit for albretsen.no. Open `preview.html` first; it plays the boot, shows every asset and runs the live pieces. Use `preview.html?noboot` to skip the boot.

## Vision

**The site boots like a machine and lands like light through glass.**

The homepage opens as a quiet boot log in mono: a few lines, a 1px progress hairline, and the mark with its afterimages pulsing. When the log finishes it lifts away trailing two echoes. A soft glow powers on at the right of the screen and cracks into shards of light, as if the sun had found a crystal on a dark wall (`hero/boot-focus.webm`). The last frame is the hero still (`hero/prism`). That still then becomes live glass (`interactive/prism-field.js`): the pointer drags a lens through it, a click sends an echo ring, and every bend splits into thin rainbows.

Everything is grey. Colour exists only where light is refracted: caustic fringes, the amber of city lights in a NASA photograph, the sparks in snow crystals, and each product's own icon colour. Nordic understatement means no colour in the interface, no exclamation, and a lot of dark, warm grey space around a few very precise things.

Spark words: **prism** (the mark, the shards, the product glass), **pulse** (the boot glow, the lens spring), **echo** (afterimages on type, the retired plates, the ripples).

Mood: a dark room at 3 pm in January; low sun through a window; frost on the glass; a terminal finishing its boot; nothing extra.

## References (researched)

| Reference | What I took from it |
|---|---|
| https://bruno-simon.com | Play as the proof of skill: the portfolio *is* the demo. Here the demo is real optics, not a game. |
| https://heronaiapp.com (Awwwards Site of the Day, 12 Oct 2026; picked from https://www.awwwards.com/websites/sites_of_the_day/ by salt digit 4) | Boot-style loader: numbered system steps, a percentage, then the site. Our log doubles as an index of the page and ends in light, not a cut. |
| https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/ | Per-channel IOR offsets for dispersion. Used in the stills (per wavelength, 28–30 bands) and the live shader (7 bands). |
| https://www.raster.art/artwork/refractal-by-jonathan-barbeau/about | Generative art fed through chromatic refraction: the art direction category. |
| https://tympanus.net/codrops/?p=54377 (Codrops, Dynamic CSS Masks) | Radial mask reveal driven by custom properties: the LENS hover. |
| https://tympanus.net/codrops/?p=75216, https://developer.mozilla.org/docs/Web/CSS/view-timeline-axis | `view()` timelines with entry/cover ranges, @supports guard: the ECHO scroll animation. |
| https://react-spring.dev/examples (Cards Stack, Flip Card) and https://github.com/AitorGallardo/cardstock | DOM card stack with springs, drag to throw, flip on tap: the spring deck, rewritten in vanilla JS. |
| https://commons.wikimedia.org (search: prism rainbow light photograph) | Found W.carter's CC0 series of snow crystals in direct sunlight: natural prisms, almost colourless. |
| https://kenney.nl/assets, https://polyhaven.com | Looked for CC0 objects; chose Poly Haven's scanned Moon Rock 03 (a quiet grey stone, and a nod to the NASA imagery). Kenney's packs were too toy-like for this tone. |

## Palette

Greys are OKLCH with a hair of chroma toward the seed hue 36°. The interface uses only these.

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| `--g-950` | oklch(0.165 0.004 36) | #100e0d | page background |
| `--g-900` | oklch(0.205 0.004 36) | #191716 | raised surfaces, tiles |
| `--g-850` | oklch(0.245 0.004 36) | #22201f | cards, inner borders |
| `--g-800` | oklch(0.300 0.004 36) | #302d2c | hairlines, chip borders |
| `--g-600` | oklch(0.470 0.005 36) | #5d5a59 | muted labels |
| `--g-400` | oklch(0.650 0.006 36) | #938e8d | secondary text, mono captions |
| `--g-200` | oklch(0.860 0.004 36) | #d3d0cf | body text on dark |
| `--g-100` | oklch(0.935 0.003 36) | #ebe9e8 | headings, the mark |
| `--g-50` | oklch(0.972 0.002 36) | #f7f5f5 | paper (light plates, light mode) |

Colour that comes from imagery (for reference; do not use as UI fills or text):

| Name | OKLCH | Hex | Where it lives |
|---|---|---|---|
| amber city light | oklch(0.80 0.13 70) | #f3ae58 | `hero/norden-night` |
| fringe red / green / blue | oklch(0.68 0.20 30) / oklch(0.82 0.17 150) / oklch(0.58 0.22 265) | #fb5a46 / #65e287 / #386bfa | caustic edges; in CSS only as 1–3px light fringes (lens rim, flip edge, dispersion hover) |
| product light | each icon's own hue | — | `products/*` (MCP Emails blue/green, Fun Libs yellow, Toolrails yellow, Harbor warm white) |

## Type

- **Schibsted Grotesk** (variable 400–900, SIL OFL 1.1, Google Fonts). Commissioned by the Norwegian publisher Schibsted. Everything a person reads. Display 600 at -0.045em; headings 560 at -0.025em; body 400 at 1.55.
- **JetBrains Mono** (400, SIL OFL 1.1, Google Fonts). Everything the machine says: boot lines, captions, figures in tables, the `AS` in the lockup. +0.05em tracking, often uppercase at 11px for labels.
- Both are vendored as latin subsets (`fonts/`, 78 KB total) and declared in `motion.css`. Norwegian letters (æ ø å) are covered.

## How the imagery was made

`src/` holds the generator scripts (Python 3 + numpy/scipy/Pillow; paths inside point at the temp dir used while making the kit). The core is `src/caustic.py` + `src/caustic2.py`: a spectral caustic renderer. A glass height-field is sampled with 2–3 rays per output pixel; each ray is refracted by the height gradient, with the bend scaled per wavelength (dispersion), and splatted bilinearly onto the output. Wavelengths are jittered within 28–30 bands and converted to colour through the CIE 1931 observer (Wyman–Sloan–Shirley fit), white-balanced, filmic tone-mapped, then given 0.8% grain. Nothing is painted; every fringe is a real consequence of the optics.

- **prism**: Voronoi-faceted glass (26 facets with random tilt, slightly softened) lit by a round beam: light through cut crystal onto a wall.
- **echo**: seven gaussian lenses plus a decaying standing ripple: a glass bead with rings.
- **boot-focus**: the prism render with refraction strength eased from 0 to 1 over 40 frames: the beam starts as a soft round glow and cracks into shards.
- **products**: each real icon's alpha becomes a glass slab, projected onto the floor at a low angle; its inner glyph (icon luminance) makes the glass uneven so the glyph appears in the light. Light through the slab is filtered to the icon's own hue; the rest of the floor is grey. The real icon is composited on top, unchanged.

## Inventory

| File | What it is | Intended use on the site | Source (how made / URL) | Licence |
|---|---|---|---|---|
| `identity/mark.svg` | The mark: an A as two legs of a prism, the crossbar a beam entering from outside the left leg. `currentColor`. | Header, footer, favicon base. Inline it so it takes `currentColor`. | Drawn for this kit (`src/identity.py`) | Client-owned |
| `identity/mark-echo.svg` | Mark with two afterimages (`.echo-1`, `.echo-2`, `.beam` classes). | Boot loader (animated by `motion.css`), empty states, 404. | Drawn for this kit | Client-owned |
| `identity/wordmark.svg` | "Albretsen" in Schibsted Grotesk 560, outlined to paths. | Wherever the name stands alone. | Drawn for this kit, from the OFL font | Client-owned (font OFL) |
| `identity/lockup.svg` | Mark + wordmark + mono "AS" at 45% opacity. | Header, hero, OG. | Drawn for this kit | Client-owned |
| `identity/favicon.svg`, `favicon-32.png` | Favicon (dark tile, heavier strokes for 16px). | `<link rel="icon">` | Drawn for this kit; PNG via rsvg-convert | Client-owned |
| `identity/apple-touch-icon.png` | 180×180 icon. | `<link rel="apple-touch-icon">` | rsvg-convert of favicon.svg | Client-owned |
| `identity/og.jpg`, `og.webp` (+ `og-source.html`) | Open Graph image, 1200×630: lockup, one line, prism light. | `og:image`, social cards. | Composed in HTML, screenshotted with headless Chrome | Client-owned |
| `hero/prism.{avif,webp}`, `prism@2x.*`, `prism-portrait.*` | Main hero still: light through cut crystal. 1440×900, 2880×1800, 1050×1350 portrait. Light sits right; text goes left. | Homepage hero (after the boot); texture for `prism-field.js`. | Rendered for this kit (`src/hero.py prism`, seed 7) | Client-owned |
| `hero/echo.{avif,webp}`, `echo@2x.*`, `echo-portrait.*` | Second hero still: a glass bead with rings. | About, a section hero, 404, live demo texture. | Rendered for this kit (`src/hero.py echo`) | Client-owned |
| `hero/boot-focus.webm`, `.mp4` | 2.6 s, 1200×750: glow cracks into shards, ends on the prism composition. | Boot transition: play once when the log finishes, then reveal the still / live glass. | Rendered for this kit, 40 frames, VP9 + H.264 | Client-owned |
| `hero/norden-night.{avif,webp}`, `norden-night@2x.*` | Northern Europe at night from the ISS, graded: blues pulled to grey, amber city lights kept. | A full-bleed band (e.g. "Norway"), behind the contact block, LENS hover demo. | NASA, ISS Expedition 66, photo iss066e118171 (17 Jan 2022): https://images.nasa.gov/details/iss066e118171 | Public domain (NASA media guidelines; no endorsement implied) |
| `products/mcp-emails.*`, `fun-libs.*`, `toolrails.*`, `harbor.*` (800×500 and @2x 1600×1000, avif + webp) | The real icon as a glass slab casting its own spectral caustic, glyph included. Icon top-left, space bottom-right for a label. | Product cards / the spring deck. | Real icons from `designs/_shared/products/` (unaltered; Harbor mark rendered in its banner colour #F0EDE8 on #1A1A1A), render for this kit (`src/products.py`) | Product logos: client-owned |
| `retired/luma.svg` | Real Luma logo on the one pale plate. | Retired list. | Real logo `designs/_shared/products/luma/logo.png`, embedded | Client-owned |
| `retired/polyglot-pilot.svg`, `pinpoint.svg`, `webvakt.svg`, `joke-central.svg`, `tryggere-hyring.svg`, `early-apps.svg` | Stand-ins: specimen plates with one glyph and its echoes, name and start year (from content.js). | Retired list, 120px and up. | Drawn for this kit (`src/retired.py`) | Client-owned |
| `extras/frost-wide.{avif,webp}`, `@2x` | Snow crystals glittering in direct sunlight, 16:9, graded. | Section break, about, LENS hover. | W.carter, "Snow crystals glittering in strong direct sunlight 42 - wide crop - high contrast": https://commons.wikimedia.org/wiki/File:Snow_crystals_glittering_in_strong_direct_sunlight_42_-_wide_crop_-_high_contrast.jpg | CC0 1.0 |
| `extras/frost-detail.{avif,webp}`, `@2x` | Square crop, crystal detail. | Contact block, small accents. | W.carter, "Snow crystals glittering in strong direct sunlight 40 - cropped": https://commons.wikimedia.org/wiki/File:Snow_crystals_glittering_in_strong_direct_sunlight_40_-_cropped.jpg | CC0 1.0 |
| `extras/caustic-tile.webp` | Seamless 1024² wall-light caustic (periodic height field, wrap-around splatting). | Section backgrounds at 30–60% opacity, `background-size: 512px`. | Rendered for this kit (`src/extras.py`) | Client-owned |
| `extras/grain.png` | 200² grain tile, grey + alpha. | Fixed overlay over the whole page, `mix-blend-mode: overlay`, ~50%. | Generated (`src/extras.py`) | Client-owned |
| `interactive/prism-field.js` (+ `prism-field-demo.html`) | Live dispersive glass over any still (WebGL2, no deps, ~7 KB). Pointer lens on springs, click echo rings, slow breathing. | The hero after the boot film; any image block that should feel touchable. | Written for this kit | Client-owned |
| `interactive/stone.glb`, `stone.js` (+ `stone-demo.html`) | Scanned stone (5.6k triangles, textures 768/512), grey studio, dispersed RGB rim lights that rise on hover; drag to turn with spring inertia. three.js r170 loaded lazily from jsDelivr. | A quiet object beside the "about" text or the footer. | Poly Haven, Moon Rock 03 by Greg Zaal, Rico Cilliers, Jenelle van Heerden: https://polyhaven.com/a/moon_rock_03 (packed and resized by `src/packglb.py`); three.js https://cdn.jsdelivr.net/npm/three@0.170.0/ | CC0 1.0 (model); MIT (three.js) |
| `interactive/spring-deck.js` | DOM card stack with spring physics: drag/throw to the back, click or Enter to flip, arrow keys. Cards behind are echoes. Exposes `--flip` and `--throw` to CSS. | The products section (the centrepiece). | Written for this kit | Client-owned |
| `motion.css`, `motion.js` | Tokens, fonts and five named motion signatures (below), plus deck styles. Lenis 1.3.23 loaded lazily. | Include on every page. | Written for this kit; Lenis https://cdn.jsdelivr.net/npm/lenis@1.3.23/ | Client-owned; Lenis MIT |
| `fonts/schibsted-grotesk-latin.woff2`, `jetbrains-mono-latin.woff2` | Latin subsets. | Declared in `motion.css`. | Google Fonts: https://fonts.google.com/specimen/Schibsted+Grotesk, https://fonts.google.com/specimen/JetBrains+Mono | SIL OFL 1.1 |
| `src/*.py` | Generator scripts for all rendered imagery. | Re-render at other sizes or seeds. | Written for this kit | Client-owned |
| `preview.html` | The contact sheet. | Start here. | — | — |

Total folder size: about 4.3 MB.

## Motion signatures

| Name | Kind | What happens | Source of the idea |
|---|---|---|---|
| **Cold Boot** | entrance | `coldBoot(el, lines, {video})`: mono lines tick in on a 110 ms cadence with `[ ok ]` tags and a 1px hairline; at 100% the log lifts with two text-shadow afterimages and fades; `[data-boot-reveal]` elements resolve from blur + greyscale; the boot film plays. | Heron AI's system-boot loader (Awwwards SOTD) |
| **Lens** | hover (signature delight) | `lens(el)`: a radial mask follows the cursor on springs (stiffness 170, damping 20) and opens a hidden layer: original colour, 6% zoom, mono annotations (file id, date, credit). Base layer stays greyscale. Touch: tap toggles. | Codrops dynamic CSS masks; mask-image radial-gradient pattern |
| **Echo** | scroll | `.echo[data-echo]`: the element rises in while two ghost copies trail 18 and 36px behind and converge (`animation-timeline: view()`, entry 0% → cover 38%). `.echo-block` does it with box-shadows. Also a scroll-progress hairline. | MDN / Codrops scroll-driven animations |
| **Prism Wipe** | transition | `prismWipe(update)`: a View Transition whose new state sweeps in on a diagonal clip-path with a thin red/blue drop-shadow fringe on the edge. Falls back to an instant swap. | View Transitions API |
| **Dispersion** | hover | `.disperse` + `dispersion()`: type splits into a 2px red/blue fringe toward the cursor (`@property --k` animates it in). | Chromatic aberration, kept to a hairline |
| **Spring deck** | centrepiece | See `interactive/spring-deck.js`. Flip springs run at 70% stiffness so the turn reads; the card edge catches a fringe at mid-flip via `--flip`. | react-spring Cards Stack / Flip Card; Cardstock |

All of it respects `prefers-reduced-motion`: the boot is skipped, springs jump to their targets, the live glass draws one frame.

## Notes for the builder

- **Hero sequence:** keep the static `<picture>` of `hero/prism` as the base layer (it is the LCP image and the fallback). Play `boot-focus` over it when the boot log ends; on `ended`, fade in a `<canvas>` running `mountPrismField(canvas, { src: 'assets/hero/prism@2x.webp', focusX: .7, focusY: .4 })`. Match `object-position: 70% 40%` on the picture. Hide the canvas below 700px and use `hero/prism-portrait`.
- Inline the SVGs (fetch or paste) so they inherit `currentColor`; `<img>` renders them black.
- The boot should be short (≈1.5 s), shown once per session (store a flag in `sessionStorage`), and skippable by any key or click.
- Facts on product cards must come from `designs/_shared/content.js` (the preview does this).
- Colour discipline: never fill a button, link or heading with a colour. If something needs emphasis, make it lighter grey, larger, or give it light (a fringe, a lens), not hue.
- No "hire me", "let's connect" or "passionate". The boot log is the most playful the copy should get.
