# The Albretsen Dawn — asset kit 43

Open `preview.html` first, served from the repo root (`python3 -m http.server`), at `/designs/43/assets/preview.html`. It plays everything: the live press, the 3D objects, every motion, and the shortcut sheet (press `?`).

## Vision

**A newspaper front page from the future, printed in low-poly pastel.** *The Albretsen Dawn* is a morning paper from about 2036. It is printed by a press that only knows triangles. Every image arrives as facets lit by a low, warm sun from the right. Photographs arrive as lagoon prints. The headlines are facts and never adjectives. The paper is airy and pale, and the type is calm. One gold spark is the only flourish.

- **Personality: quiet confidence.** The work does the talking. Use short sentences, real numbers from `content.js`, and lots of air. Don't add exclamation marks, sell, or say "hire me".
- **The newspaper is the frame.** Nameplate, dateline, double rules, columns, ears, the edition stamp and a "Late edition" sticker. These are newspaper parts. They don't play at nostalgia, because everything inside them is clearly made by software.
- **Low-poly 3D is the medium.** Every 3D object comes from one kit (`interactive/lowpoly-kit.js`) with one light rig, so a new scene always matches.
- **Technology is the subject, not finance.** There are no charts-as-decoration, no gold-on-navy and no columns of money. The spark words are dawn, orbit and spark: sunrise, planets, satellites, paper planes (emails) and crystals.
- **The mark.** A faceted **A** made of eleven triangles, lit from the upper right. The crossbar holds one warm triangle: the sun rising inside the letter. A four-point spark sits off the apex. In 3D it becomes the crystal object.

### Mood and references
- Monument Valley (ustwo, 2014): flat-shaded pastel geometry and soft lavender/mint palettes. https://www.monumentvalleygame.com
- Low-poly Delaunay technique (edge-aware point placement): https://digitalbunker.dev/how-i-created-low-polygon-art/
- rauno.me: restraint, and craft as the message ("Make it fast. Make it beautiful."). https://rauno.me
- Magic UI's Blur Fade, Text Animate, Magic Card and Glare Hover, the starting points for press-run and facet-sheen. https://magicui.design/docs/components
- hoverstat.es: hover-state craft (erinfeeproductions row ripple, age-hh scaling page transition). https://hoverstat.es
- View Transitions (cross-document `@view-transition`, shared `view-transition-name`): https://developer.chrome.com/docs/web-platform/view-transitions and https://www.debugbear.com/blog/view-transitions-spa-without-framework
- "?" shortcut overlays (Google Reader, GNOME HelpOverlay, TAMU UX shortcuts-help): https://wiki.gnome.org/Design/OS/HelpOverlay and https://ux.tti.tamu.edu/components/shortcuts-help
- ambientCG paper textures: https://ambientcg.com

## Palette (seed hue 204°, OKLCH)

| Token | OKLCH | Hex | Role |
|---|---|---|---|
| paper | oklch(0.985 0.006 204) | #f6fbfc | page |
| mist | oklch(0.955 0.02 204) | #e2f4f6 | panels, code, keycap faces |
| sky | oklch(0.89 0.05 204) | #b5e5ea | keycap shadow, light facets |
| lagoon | oklch(0.74 0.08 210) | #6ab9c7 | dashed orbit lines, mid facets |
| deep | oklch(0.52 0.075 226) | #32728a | links, figures, kickers, muted text (AA on paper) |
| ink | oklch(0.27 0.03 236) | #182933 | text, rules |
| dawn | oklch(0.89 0.06 55) | #fbd1b6 | the sun triangle, warm facets |
| blush | oklch(0.88 0.05 10) | #f6cbd0 | sky gradients, specimens |
| lilac | oklch(0.86 0.045 290) | #d0cded | sky gradients, satellites |
| spark | oklch(0.91 0.11 95) | #f8e18a | highlight flash (shortcut feedback) |
| gold (spark ink) | — | #efc65a | the four-point spark only |

The **Dusk edition** (press `T`) is the dark theme: bg oklch(0.22 0.03 236), text oklch(0.95 0.015 204), muted oklch(0.8 0.06 204). Light is the default because it is a morning paper.

## Type
- **Instrument Serif** (Regular and Italic, OFL): headlines, the nameplate, figures, the deck. The italic goes in lagoon/deep for the second half of a headline.
- **Geist** (300–700, OFL): body and UI. Kickers are 500 at 11px, uppercase, tracked 0.2em.
- **Geist Mono** (OFL): keys, commands, file names, seeds.
- Google Fonts: `family=Instrument+Serif:ital@0;1&family=Geist:wght@300..700&family=Geist+Mono:wght@400;500`
- The wordmark and masthead are outlined to paths, so they need no font.

## Inventory

| File | What it is | Intended use | Source | Licence |
|---|---|---|---|---|
| identity/mark.svg | Facet A, full colour | header, footer, loaders | generated, bake/identity.mjs | own work |
| identity/mark-light.svg | Facet A in light tones | on ink/dusk backgrounds | generated, bake/identity.mjs | own work |
| identity/mark-mono.svg | single-colour A (currentColor), the sun cut out as a gap | inline icon, print | generated, bake/identity.mjs | own work |
| identity/wordmark.svg, wordmark-mono.svg | Mark + "Albretsen" (Instrument Serif, outlined) + tracked "AS" (Geist) | site header | generated (opentype.js from OFL fonts) | own work; fonts OFL |
| identity/masthead.svg | Nameplate "The Albretsen Dawn" with rules and motto | top of the front page | generated, bake/identity.mjs | own work |
| identity/favicon.svg, favicon-32.png, favicon-180.png, favicon-512.png | A on a pale rounded tile | favicon, apple-touch-icon, PWA | generated + rsvg-convert | own work |
| identity/og.jpg | 1200×630 Open Graph | og:image / twitter:image | bake/og.html, rendered in headless Chrome | own work |
| hero/hero-crystal(.webp, @2x, .avif, -portrait@2x) | The crystal A in a low-poly pastel landscape, orbit rings, sparks, clouds | **primary hero** (behind or beside the nameplate) | three.js 0.170, bake/scene.html?s=hero-a; HDRI fill below | own work |
| hero/hero-peaks(…) | Mountain dawn photo re-printed in low-poly facets by dawn-press.js | alternate hero / lead story plate | dawn-press.js on the photo below | derived from CC0 |
| hero/hero-limb(…) | Generative planet limb at sunrise with orbit lines | alternate hero, section opener, 404 | dawn-press.js generative mode, seed 11 | own work |
| hero/source-peaks.webp | Ungraded source photo (1600px) for the live press's photo mode | input for `dawnPress({ image })` | https://commons.wikimedia.org/wiki/File:Mountains_and_a_colorful_sky_(Unsplash).jpg (Nathan Anderson, via Unsplash) | CC0 |
| products/mcp(.webp, @2x) | Real MCP Emails icon on a low-poly slab, paper planes on a dashed arc | MCP Emails story | three.js; logo = _shared/products/mcp-emails/icon.png, unaltered | own render; logo is the product's |
| products/funlibs(…) | Real Fun Libs icon (v5) on a slab, word-game letter tiles F U N _ ? a | Fun Libs story | three.js; logo = _shared/products/fun-libs/icon.png | as above |
| products/toolrails(…) | Real Toolrails icon on a slab inside a ring of eleven tool-gems | Toolrails story | three.js; logo = _shared/products/toolrails/icon.svg rasterised | as above |
| products/harbor(…) | Real Harbor mark on a slab between two crystal hills | Harbor story | three.js; mark path from harbor-mark.svg, in Harbor's own banner colours (#F0EDE8 on #1A1A1A), see bake/src/harbor-tile.svg | as above |
| retired/luma(…) | Real Luma logo.png on a cream slab | retired list | three.js | as above |
| retired/polyglot, pinpoint, webvakt, jokes, tryggere, early (…) | Low-poly stand-in specimens: language gems, map pin, watching lens, joke dodecahedron, shield, % = + calculator keys | retired list (transparent WebP, 600 and 1200px) | three.js, bake/scene.html | own work |
| extras/plate-orbital-sunrise(…) | Lagoon print of an ISS orbital sunrise | "photo of the day", section break, about | NASA ISS073-E-1068530, https://images.nasa.gov/details/iss073e1068530 | NASA, public domain (not an endorsement) |
| extras/plate-earth-limb(…) | Lagoon print of Earth's limb with the sun above | wide band behind the products or the blog | NASA ISS072-E-838362, https://images.nasa.gov/details/iss072e838362 | NASA, public domain |
| extras/plate-peaks(…) | Lagoon print of the hero photo | footer band | Commons CC0 photo above | CC0 |
| extras/paper-grain.webp, paper-grain-overlay.webp | Tileable paper fibre (512px); the overlay is neutral grey for `mix-blend-mode: soft-light` | whole-page grain (preview uses the overlay at 0.55) | ambientCG Paper003 colour map, high-passed and tinted. https://ambientcg.com/view?id=Paper003 | CC0 |
| extras/facet-pattern.svg | Seamless 240px low-poly field in near-white pastels | section grounds, card backs | generated, bake/extras.mjs | own work |
| extras/stamp-dawn-edition.svg | Round edition stamp with text on a circle and the A | near the lead; spins with `.stamp-orbit` | generated | own work |
| extras/sticker-late-edition.svg | Folded "Late edition" tab | on the newest post or product | generated | own work |
| extras/ear-sunrise.svg, ear-orbit.svg, ear-spark.svg | Low-poly "ear" icons | nameplate corners, fact strip | generated | own work |
| extras/rule-spark.svg | Double rule with a centre spark | section dividers | generated | own work |
| extras/keycaps.svg | Keycap sprite (? J K G T Esc / 1) | shortcut sheet, footer hint | generated | own work |
| extras/cloud@2x.webp, planet(.webp, @2x), crystal-a(.webp, @2x) | Transparent low-poly stickers | floating decoration, parallax layers, empty states | three.js | own work |
| 3d/crystal.glb (12 KB), 3d/planet.glb (44 KB) | The crystal A and the low-poly planet as GLB, vertex-coloured | any GLTF viewer / three.js scene | exported with GLTFExporter, bake/export-glb.html | own work |
| interactive/dawn-press.js | **Centrepiece.** Canvas 2D generative press: edge-aware points, Bowyer–Watson Delaunay, pseudo-3D facet lighting, printing from the sun outward, pointer light, image or generative mode, reduced motion | live hero canvas; `P` reprints | own code, no dependencies | own work |
| interactive/lowpoly-kit.js | three.js builders: planet, terrain, clouds, gems, sparks, the crystal A, logo slabs (unlit, exact logo colours), paper planes, letter tiles, light rig | any new 3D scene in the same hand | own code (three 0.170 via import map) | own work |
| interactive/orbit.js | Live, draggable planet or crystal with satellites on a ring; pauses off-screen | "objects you can hold" block, about page | own code | own work |
| motion.css, motion.js | Six named motions plus the keyboard layer (below) | site-wide | own code | own work |
| preview.html | The contact sheet | start here | own | own work |

Build and source files are in `designs/43/bake/` (outside the budget): `identity.mjs`, `extras.mjs`, `scene.html`, `press.html`, `og.html`, `plates.py`, `enc.py` and the `bake-*.sh` scripts. Run them with the static server on :6043. The HDRI used as soft image-based fill in the 3D bakes was **Poly Haven "Bell Park Dawn" 1K** (https://polyhaven.com/a/bell_park_dawn, CC0). It is not committed because of its size. Download it to `bake/src/polyhaven-bell_park_dawn_1k.hdr` to rebake. The scenes still render without it, just a little flatter.

## Motion (motion.css / motion.js)

| Name | Kind | What it does | Researched from |
|---|---|---|---|
| **press-run** | entrance | `pressRun(el)` splits words; each rises 0.38em out of an 8px blur with a 55ms stagger, 900ms expo-out | Magic UI Blur Fade / Text Animate |
| **facet-sheen** | hover | Cards tilt up to ±5° toward the pointer and lift 4px. A triangular dawn-light band sweeps across in soft-light | Magic UI Magic Card / Glare Hover, hoverstat.es cards |
| **edition-turn** | transition | `editionTurn(update, 'next' \| 'prev')` runs a View Transition. The new state is uncovered by a facet whose diagonal edge sweeps in from the sun's corner, and the old state recedes. `.vt-headline` and `.vt-plate` morph. Cross-document is on via `@view-transition { navigation: auto }` | Chrome DevRel View Transitions demos, age-hh (via hoverstat.es) |
| **dawn-break** | reveal | Sections are uncovered by a circle rising from the bottom edge, driven by scroll (`animation-timeline: view()`), with an IntersectionObserver fallback | scroll-driven animations; hoverstat.es scale-on-scroll |
| **sheet-unfold** | transition | The `?` keycap morphs into the shortcut sheet through a shared `view-transition-name` | GNOME HelpOverlay / Google Reader "?" overlays, made spatial |
| **stamp-orbit** | ambient | The edition stamp turns once a minute and pauses on hover | — |
| spark trail | delight | Gold four-point sparks trail a fine pointer, rate-limited | Magic UI Sparkles Text |

All of these respect `prefers-reduced-motion`.

## Signature delight: keyboard shortcuts with a visible cheat sheet
`shortcuts({ sheet, trigger, keys })` in motion.js. The topline always shows "Press `?` for the shortcuts". The sheet is a native `<dialog>`, so focus trap and Esc come free. It is laid out like a newspaper index with dotted leaders. A key that fires flashes its row in spark yellow.

| Key | Action |
|---|---|
| ? | open/close the sheet |
| J / K | next / previous edition (story) via edition-turn |
| P | reprint the front page (new dawn-press seed) |
| T | Dawn / Dusk edition (theme), via a view transition |
| 1–4 | jump to MCP Emails, Fun Libs, Toolrails, Harbor |
| E | copy asgeir@albretsen.no |
| M | copy `claude mcp add albretsen https://albretsen.no/mcp` |
| G H | back to the front page |

## Notes for the builder
- Use `<picture>` or `srcset` with the 1x/@2x pairs; heroes also have AVIF 1x and @2x portrait crops for phones.
- Product logos are never redrawn. They sit on the slab face exactly as shipped, with an unlit material.
- All numbers on the site come from `designs/_shared/content.js`. preview.html shows how to read them.
- Load three.js lazily (preview.html does this with an IntersectionObserver). dawn-press.js is small enough to run in the hero immediately.
- Total kit size is about 2.1 MB.
