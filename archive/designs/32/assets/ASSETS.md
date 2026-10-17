# Asset kit 32: Night Shift Paper

Open `preview.html` first. It is the contact sheet: every asset, the palette, the type, all motion demos and the three live pieces. Append `?only=products,motion` to show only some windows, or `?autoplay` to open every primitive once.

## Vision

A desktop operating system cut from paper, set on a Norwegian night. The day job is over and the sodium lamps are on. Torn hills step down in night blues toward the viewer, each with a white fibre rim where it was torn. A ringed sodium sun rises behind them (the optimism: it is always nearly morning). A green aurora strip, a paper plane on a dashed flight path (velocity), and lit cabin windows (people building) fill the sky and land. On top sits a paper OS: a menu bar strip, windows taped to the desk, desktop folders, a dock holding the real product icons, and a big paper cursor.

The craft promise: everything looks hand-cut, but it was all built in code. The scene is real three.js geometry (extruded torn-edge shapes) with real shadows, procedural paper fibre and a raw WebGL shader. That gap between "made by hand" and "made by machine" is where the awe comes from. The brand reads as a builder who is optimistic, precise and fast.

Mood words: *velocity, horizon, scale*. These are night-shift optimism, deckle edges, tape and stickers, the warm glow of one lamp.

What it is not: no finance, no consultancy, no industrial or maritime metaphors. The road and lamps are scenery, not infrastructure. MCP Emails is one window among several.

## References and research

- Radix animation guide (data-state keyframes, exit animations, forceMount): https://www.radix-ui.com/primitives/docs/guides/animation. Used for the selector strategy in `motion.css`.
- Chrome, *Create complex animation curves in CSS with linear()*: https://developer.chrome.com/docs/css-ui/css-linear-easing-function. This is the basis for the `--spring` / `--spring-firm` tokens. The values were generated from a damped-spring formula (ζ .5 and .72), not copied.
- Linear easing generator (Jake Archibald, Adam Argyle): https://linear-easing-generator.netlify.app/
- Lynn Fisher, CSS-only scrolling effects for Matterday (layered translateZ parallax, cut-out windows): https://lynnandtonic.com/thoughts/entries/fun-css-only-scrolling-effects-for-matterday. Inspired the depth-scaled `[data-depth]` parallax and the cut-out framing.
- Paper Shaders paper texture (layered-noise paper, fibre control): https://www.mintlify.com/paper-design/shaders/shaders/overview and Remotion `paper()` fibres: https://convert.remotion.dev/docs/effects/paper. Informed the fibre and grain approach (all shader and texture code here is original).
- Ashima / Gustavson, *Efficient computational noise in GLSL*: https://arxiv.org/pdf/1204.1461 (value-noise and fbm pattern in the shader).
- Spline community "Interactive 3D Parallax Scene" and depth-on-hover cards: https://community.spline.design. These were the starting point for the exploding-layer mark.
- Card3d.js tilt with device orientation: https://www.cssscript.com/demo/parallax-tilt-hover-effect-card. Informed the gyro mapping (gamma/25, (beta−45)/25).
- Classic desktop UI conventions (draggable windows, menu bar, desktop icons): https://www.framer.com/marketplace/components/macos-window/
- Blue Coat paper-collage guide (background → foreground → subject layering): https://bluecoatdisplaycentre.com/outreach/wp-content/uploads/sites/3/2021/05/Paper-Collage-with-Attila-Olah.pdf
- Brief start points: codepen.io/trending and land-book.com returned 403 to the fetcher. vercel.com was not used beyond its hero-gradient breakdowns (https://getdesign.md/design-md/vercel/preview).

## Palette (OKLCH, seed hue 132°)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| ink | oklch(0.16 0.035 262) | `#050d1c` | text on paper, nearest hill, shadows |
| night | oklch(0.22 0.06 262) | `#0a1936` | page ground, app-icon tile |
| deep | oklch(0.29 0.08 260) | `#122a52` | mid hills, secondary surfaces |
| dusk | oklch(0.38 0.095 258) | `#1f4274` | hills, links and captions on paper |
| twilight | oklch(0.52 0.09 252) | `#406c9b` | far hills, muted UI |
| haze | oklch(0.70 0.06 245) | `#7fa3c2` | captions on night |
| sodium | oklch(0.74 0.165 58) | `#f68c26` | the one warm light: CTAs, "on" states, sun |
| ember | oklch(0.62 0.17 45) | `#d55c13` | sodium's shadow side, hover, roofs |
| glow | oklch(0.87 0.10 78) | `#f9cc87` | lit windows, highlights, stars |
| aurora | oklch(0.82 0.17 132) | `#9ada5e` | seed hue: aurora strips, "live" dots. Never body text |
| aurora-deep | oklch(0.55 0.13 150) | `#298646` | aurora shadow strip, check marks |
| paper | oklch(0.95 0.022 85) | `#f5eede` | sheets, windows, torn rims |
| paper-shade | oklch(0.86 0.03 80) | `#dccfbc` | folds, envelope flaps |

Rules: sodium is the only warm light, so keep it scarce. Blues step darker as they come forward. Paper surfaces always carry the `paper-cream.webp` texture.

## Type

- **Bricolage Grotesque** 700/800 for display (Google Fonts, OFL). It has ink traps and a slight hand-cut wobble that sits well on paper. Use tracking −0.022em to −0.035em at large sizes.
- **Geist Mono** 400–600 for text and UI (Google Fonts, OFL). It gives a terminal and OS voice. Labels are uppercase at +0.12em.
- Scale: 112 / 72 / 44 / 28 / 18 / 15 / 12.
- Load: `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Geist+Mono:wght@400..700&display=swap`
- The wordmark is outlined to paths (no font dependency).

## Motion (motion.css + motion.js)

| Name | Primitive | What it does |
|---|---|---|
| UNFOLD | Dialog | The sheet hinges open from its top edge: rotateX −78° → 0 on a damped spring, and its shadow grows as it lands. Exit folds back in 220 ms. |
| LIFT | Hover card, cards | The paper lifts 6 px toward the pointer (`--px/--py`) and its shadow lengthens. The hover card slides out from under the trigger like a second sheet. |
| PEEL | Tooltip | Slapped on like a sticker: scale .55, rotate −9° → −2° with overshoot. Exit skews and peels off. |
| SHUFFLE | Tabs | The new panel rises from behind the stack (translateY + 1.6° + brightness). A sodium ink bar springs to the active tab. |
| TEAR | Accordion | Content opens behind a torn deckle edge (`extras/torn-mask.svg` as mask) using `--radix-accordion-content-height`. |
| DROP | Entrance | Collage pieces fall into place, staggered by `--i`, each landing on its own resting angle `--r`. |
| SCISSOR WIPE | Page transition | View Transitions. The new page is revealed behind a torn vertical edge sweeping across. |
| TILT | Parallax | `tilt(el)` writes `--tx/--ty` from pointer or device orientation. `[data-depth]` layers translate by depth. Call `askGyro()` from a tap on iOS. |

All selectors use Radix's `data-state` / `data-side`, so real Radix (React, via ESM CDN) works with the CSS alone. `prefers-reduced-motion` collapses everything.

## Live and 3D

- `live/papercut-shader.js` is the **centrepiece**. It is a raw WebGL1 fragment shader (no deps) that draws six torn hill layers with white fibre rims and cast shadows, a ringed sun, three aurora ribbons, punched stars, lit windows and paper grain. Pointer and gyro drive per-layer parallax. Use it as a hero background or as the fallback for paper-desk. Demo: `live/papercut-demo.html`.
- `live/paper-desk.js` is the full three.js diorama, live (`mountPaperDesk(el, {ui})`). Every group parallaxes by depth, the aurora sways, the plane bobs and the stars twinkle. It pauses off-screen. Demo: `live/paper-desk-demo.html`.
- `live/albretsen-mark.glb` + `live/mark-3d.js` is the mark as 7 extruded paper layers (glTF binary, built with three.js SVGLoader + GLTFExporter). It tilts to the pointer and fans apart on hover or tap. Demo: `live/mark-3d-demo.html`.
- `live/paperkit.js` is the scene kit (torn shapes, fibre textures, paper materials, soft baked shadows, windows, tape, stickers, product dioramas). Every still in this kit was rendered from it.
- three.js is pinned to `three@0.170.0` via import map from jsDelivr.

## Builder notes

- Hero: use `hero/wallpaper` as the poster or LCP image, then mount `paper-desk.js` (ui: false) or the papercut shader on top. Put real HTML windows (taped, rotated ±1°) over it. The desktop composite `hero/desktop` is for OG, social and "about" use, or as a static fallback. The lower third of the wallpaper is kept quiet for the headline.
- Parallax stack alternative: the six `hero/layers/*` with depths sky 0, aurora-sun .6, far 1.4, mid 2.2, near 3.2, plane 4.6, each at `inset:-3%`. See the stack in the preview.
- Desktop conceit: the menu bar holds the nav, folders are sections, the Archive folder holds the retired stand-ins, and the dock holds the live products.

## Inventory

All files were made for this kit by code in `src/` and `live/` unless noted otherwise. The licence for generated files is the client's own (made for Albretsen AS). No third-party images or models were downloaded.

| File | What it is | Intended use | Source | Licence |
|---|---|---|---|---|
| identity/logo-mark.svg | App-icon mark: tile, aurora, sun, paper A, ground strip, paper shadows | header, app icon, about | `src/identity.mjs` (hand-placed paths) | own |
| identity/logo-glyph.svg | Mark without the tile | on photos or textures | `src/identity.mjs` | own |
| identity/logo-mark-512.png | 512 px raster of the mark | PWA, social avatars | rsvg-convert | own |
| identity/wordmark.svg / wordmark-on-paper.svg | Mark + "Albretsen" (Bricolage 800 outlined) + taped "AS" label; for dark / light grounds | header, footer, OG | `src/identity.mjs` with opentype.js 1.3.4, fonts from fontsource (OFL) | own (font OFL) |
| identity/favicon.svg / favicon-180.png | Simplified mark for 16–32 px; 180 px apple-touch | favicon | `src/identity.mjs`, rsvg-convert | own |
| identity/og-image.jpg | 1200×630 Open Graph card | og:image | `src/og.html` baked in headless Chrome | own |
| hero/desktop(@2x).avif/.webp | 1440/2880 paper desktop: menu bar, terminal, Products window with real icons, folders, dock, cursor | static hero, OG, about | three.js scene `paperkit.js` → `src/render.html?scene=desktop` | own; product icons © their products |
| hero/wallpaper(@2x).avif/.webp | 1440/2880 landscape without UI | hero poster or background | `src/render.html?scene=wallpaper` | own |
| hero/layers/{sky,aurora-sun,far,mid,near,plane}(@2x).webp | Six transparent parallax layers with baked shadows (ShadowMaterial catcher) | tilt/parallax hero | `src/render.html?scene=layer` | own |
| products/mcp-emails(@2x).webp | Diorama: real MCP Emails icon on a paper tile in a taped window, flying envelopes, $782 MRR sticker | product card | `paperkit.buildProduct` + `_shared/products/mcp-emails/icon.png` | own; logo © MCP Emails |
| products/fun-libs(@2x).webp | Paper phone with the real Fun Libs v5 icon, fill-in-the-blank slips, 113,000+ sticker | product card | `_shared/products/fun-libs/icon.png` | own; logo © Fun Libs |
| products/toolrails(@2x).webp | Window with the real Toolrails icon, connector chips, tool search / injection guard slips | product card | `_shared/products/toolrails/icon.svg` | own; logo © Toolrails |
| products/harbor(@2x).webp | Stacked docs, window with the real Harbor mark, "AI edit held for approval" note, 549 commits | product card | `_shared/products/harbor/harbor-mark.svg` | own; logo © Harbor |
| products/retired/*.svg | Paper app-tile stand-ins: Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, Early apps (Luma uses its real logo from `_shared`) | Archive folder | `src/icons.mjs` | own |
| extras/icons/*.svg | Desktop icons: folder, document, terminal, mail, globe, bin, cursor, hand | nav, section markers, cursors | `src/icons.mjs` | own |
| extras/sticker-{shipped,sun,star,plane,aurora}.svg | Stickers | scatter, numbers, asides | `src/icons.mjs` | own |
| extras/tape.svg | Translucent tape strip | pin windows and images | `src/icons.mjs` | own |
| extras/torn-edge-{night,paper}.svg | Deckle dividers (1440 wide, stretchable) | section transitions | `src/icons.mjs` | own |
| extras/torn-mask.svg | Torn mask strip | TEAR accordion mask | inline node | own |
| extras/paper-{night,cream,sodium}.webp | Seamless 512 px paper stocks (periodic noise + wrapped fibres) | backgrounds and surfaces | `src/textures.py` (numpy + Pillow) | own |
| extras/spot-sunrise.webp, spot-cabins.webp | Spot crops of the render | inline illustrations, 404, blog | `src/encode.py` | own |
| live/papercut-shader.js + papercut-demo.html | Raw WebGL paper-cut night | hero background, centrepiece | hand-written GLSL | own |
| live/paper-desk.js + paper-desk-demo.html | Live three.js diorama with tilt | hero | `paperkit.js` | own |
| live/albretsen-mark.glb | Mark as 7 extruded paper layers (137 KB) | 3D logo | `src/glb.html` (SVGLoader + GLTFExporter, three@0.170.0) | own |
| live/mark-3d.js + mark-3d-demo.html | GLB viewer with tilt and exploding layers | about, footer, 404 | hand-written | own |
| live/paperkit.js | Scene kit used for every render | builder reuse | hand-written | own |
| motion.css / motion.js | Motion study (8 named animations, Radix-shaped helpers) | site-wide | hand-written | own |
| src/* | Bake and generation scripts (render pages, encoders, QA phone frame) | reproducibility | hand-written | own |

External runtime dependencies are three@0.170.0 (MIT, jsDelivr) and Google Fonts (OFL). Real product logos come from `designs/_shared/products/` and are used as-is.

### Re-baking

1. `python3 -m http.server 6032 --bind 127.0.0.1` from the repo root.
2. `sh designs/32/assets/src/bake-hero.sh <tmp>`, then `sh designs/32/assets/src/bake-products.sh <tmp> 2`.
3. `python src/encode.py <tmp> designs/32/assets` (needs Pillow with AVIF).
