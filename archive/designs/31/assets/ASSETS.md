# Honest Deck — asset kit 31

Start with `preview.html`, the contact sheet. Serve the repo root (`python3 -m http.server`) and open `/designs/31/assets/preview.html`. Press `?` for the shortcuts. `preview.html?solo=s5` shows a single section (s1–s9, `scrub`, `live-sec`).

## Vision

**Every product is a card, and the deck deals itself.** The hero is a deck of glossy candy cards that leaves a squared-up pile, flips face up in mid-air and lands in a fan in front of a chrome sphere at dusk. Live products are face up with their real numbers. Retired ones are dealt too, stamped FOLDED. Nothing is hidden, and that is the personality: **brutal honesty**. Asgeir places a lot of bets and shows all of them. The two that pay sit in the same row as the seven that didn't.

The look is **retro-futurist airbrush**: 80s chrome type with a hard horizon line, Sorayama-style reflective spheres, sunset gradients sprayed rather than drawn, fine grain over everything. It is set in a **candy palette seeded at OKLCH hue 120°**. The apple-green floor carries the seed hue. The sky runs grape to hot pink to tangerine to lemon. This is a technology brand: no finance, no industry, no nautical imagery. The chrome sphere refers to NASA's Project Echo, a balloon satellite that relayed signals by reflecting them.

Spark words became structure: **signal, density, echo** are three of the four card suits (the fourth is the A). Echo rings appear on the floor, the card backs, the logo pips and the click feedback.

### Hero concept for the builder
1. **Desktop:** a sticky full-viewport canvas scrubs `sequence/wide/deal-000…063.webp` as you scroll (`motion.js → scrubSequence`). Use `hero/hero-deal.webp` as the poster and the no-JS fallback. Put headline copy over the sky (top-left).
2. **Phone:** `sequence/tall/deal-000…047.webp` (540×960). Here the deck lands as a vertical cascade, so every logo stays readable. Poster `hero/hero-tall`.
3. **Below the fold:** the live `3d/deck-scene.js` (lazy-loaded) for the products section: hover a card and it lifts, `D` deals, `S` shuffles, `F` folds.
4. **Signature delight:** `shortcuts.js`, a persistent `?` keycap chip that opens a "House rules" cheat-sheet card. Each shortcut pings an echo pulse from its keycap.

## References (researched)
| What | URL | What I took |
|---|---|---|
| Codrops demos | https://tympanus.net/codrops/demos/ | card-stack / grid-to-stack transitions → *riffle* |
| Magic UI | https://magicui.design/docs/components | Magic Card spotlight → *airbrush tilt*; Animated Shiny Text → *chrome sweep* |
| Bruno Simon | https://bruno-simon.com | a 3D world you drive with the keyboard, with keys listed on screen → live deck keys + cheat sheet |
| Active Theory | https://activetheory.net | WebGL as the primary surface, not decoration |
| Motion stagger docs | https://motion.dev/docs/stagger | `stagger(…, {from})` for the deal |
| Apple-style sequence scrubbing | https://webflow.com/made-in-webflow/website/gsap-video-animation-on-scroll | canvas + pre-decoded frames instead of `<video>` (instant seek both ways) |
| 80s airbrush (Creative Bloq) | https://www.creativebloq.com/advice/painting-in-the-80s-airbrush-style | simple gradient backdrops, oversaturated colour, chrome reflections |
| Sorayama study | https://www.yokogaomag.com/editorial/hajime-sorayama | hard, sharp highlights on curved chrome → softbox env map |
| Retro-futurism trend | https://trends.daisyui.com/trend/retro-futurism/ | jet-age optimism, starbursts → *No Bluff* sticker |
| Shortcut help pattern | https://linear.app/changelog/2021-03-25-keyboard-shortcuts-help | `?` opens the sheet; a visible entry point as well |
| Project Echo | https://commons.wikimedia.org/wiki/File:Echo_-_A_Passive_Communications_Satellite_-_GPN-2002-000122.jpg | the chrome sphere motif |

## Palette (OKLCH first)
| Token | OKLCH | Hex | Role |
|---|---|---|---|
| `--hd-apple` (seed) | oklch(0.87 0.21 128) | #aced37 | floor, live chips, accents |
| `--hd-apple-deep` | oklch(0.66 0.19 140) | #46ac2a | floor shadow, echo suit |
| `--hd-lemon` | oklch(0.94 0.15 108) | #f5f372 | horizon, `?` key |
| `--hd-tang` | oklch(0.81 0.13 62) | #ffa75a | horizon, chrome bottom |
| `--hd-bubble` | oklch(0.82 0.12 355) | #ff9fc6 | sky, washes |
| `--hd-hot` | oklch(0.67 0.23 358) | #fa4095 | FOLDED stamp, figures, links |
| `--hd-grape` | oklch(0.60 0.19 300) | #935edf | upper sky, chrome mid |
| `--hd-lilac` | oklch(0.84 0.08 305) | #d6bef5 | chrome top, light panels |
| `--hd-ice` | oklch(0.88 0.08 215) | #99e6f9 | chrome horizon, building chip |
| `--hd-cream` | oklch(0.975 0.02 118) | #f5f9ea | card faces, light text |
| `--hd-plum` | oklch(0.22 0.06 315) | #25102d | panels |
| `--hd-night` | oklch(0.16 0.045 300) | #10081d | page, ink, hard shadows |

Tokens are defined in `motion.css :root`. Chrome gradient (used for the wordmark and `.hd-chrome`): lilac 0 → white 30% → ice 53% | grape 54% → hot 72% → tangerine 100%. The hard stop at 53/54% is the horizon.

## Type
| Face | Use | Source / licence |
|---|---|---|
| **Unbounded** 400/600/800 | display, card names, figures, wordmark (outlined in SVG) | Google Fonts, OFL |
| **Martian Mono** 400/500/600 | indices, facts, labels, keycaps | Google Fonts, OFL |
| **Hanken Grotesk** 400/500/700 | body copy | Google Fonts, OFL |

Display tracking is -0.03 to -0.045em. Mono is used for anything that counts.

## Motion (motion.js + motion.css, Motion 12.23.28)
| Name | Kind | What it does | Reference |
|---|---|---|---|
| **deal()** | entrance | cards spring from a deck point (stiffness 170, damping 19), rotateY 180→0 mid-air, 75 ms stagger from centre | motion.dev stagger, Codrops card stacks |
| **tilt()** | hover | spring tilt toward pointer + `--mx/--my` specular highlight | Magic UI Magic Card |
| **riffle()** | transition | halves lift and lean, content swaps at the bridge, cards interleave back | real riffle shuffle; Codrops grid transitions |
| **scrubSequence()** | centrepiece | canvas image sequence driven by Motion `scroll()`, nearest-loaded-frame fallback, DPR-capped | Apple-style scrubbing |
| **ping()** + `.hd-echo` | feedback | two rings radiate from the trigger | spark word *echo* |
| `.hd-chrome` | ambient | specular glint sweeps across 80s chrome type | Magic UI Animated Shiny Text |
| `.hd-drift` | ambient | airbrush blobs drift via `@property` | — |
| `.hd-fold` | hover | retired cards tip back and desaturate | — |
| `.hd-key` | press | candy keycap travels 4px, shadow collapses | — |

All of these stop under `prefers-reduced-motion`. The live deck jumps straight to the dealt state.

## Inventory
Sizes are on disk. Total kit ≈ 5 MB (budget 6 MB).

| File | What it is | Intended use | Source | Licence |
|---|---|---|---|---|
| identity/mark.svg | House-of-cards A: two leaning cards + edge-on bar, airbrush gradients, echo pips | logo, loader, social avatar | generated (Python → SVG) | own work |
| identity/mark-mono.svg | one-colour mark (`currentColor`) | small sizes, on photos | generated | own work |
| identity/wordmark.svg | mark + ALBRETSEN in outlined Unbounded 800 with chrome fill and night drop, AS in Martian Mono | header, footer | generated; glyphs outlined with fontTools | own work; font OFL |
| identity/wordmark-mono.svg | one-colour wordmark | print, overlays | generated | own work |
| identity/logotype.svg | type only, chrome | tight horizontal spaces | generated | own work |
| identity/favicon.svg / favicon-180.png | mark on night tile with hot-pink glow | favicon, apple-touch-icon | generated; PNG via rsvg-convert | own work |
| identity/og-image.jpg | 1200×630 OG card | social share | baked from src/og.html in headless Chrome | own work |
| hero/hero-deal(.webp/.avif, -1280.webp) | 2560×1440 final deal, dusk | hero poster, fallback | three.js render (src/render.html) | own work |
| hero/hero-airborne(…) | low-angle mid-deal, candy mood | second fold, about | three.js render | own work |
| hero/hero-mint(…) | inverted mint mood, mid-deal | dark section, 404 | three.js render | own work |
| hero/hero-tall(…, -540.webp) | 1080×1920 cascade | phone hero poster | three.js render | own work |
| sequence/wide/deal-000…063.webp | 64 frames 1280×720 (1.6 MB) | desktop scroll scrub | three.js frames via canvas.toDataURL | own work |
| sequence/tall/deal-000…047.webp | 48 frames 540×960 (0.77 MB) | phone scroll scrub | three.js frames | own work |
| products/mcp-emails(…) | MCP Emails card with the real logo-mark, mint mood | product section | three.js render; logo from designs/_shared/products/mcp-emails/logo-mark.svg, unchanged | own work; logo is the product's |
| products/fun-libs(…) | Fun Libs card with the real v5 icon | product section | render; fun-libs/icon.png, unchanged (rounded mask only) | as above |
| products/toolrails(…) | Toolrails card with the real icon | product section | render; toolrails/icon.svg, unchanged | as above |
| products/harbor(…) | Harbor dark card, mark in Harbor's own banner cream (#F2EFE8) on #1b1b1b | product section | render; harbor/harbor-mark.svg (currentColor filled with its banner colour) | as above |
| retired/*.svg (6) | stand-in cards: Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, Early apps | "folded pile" grid | generated SVG, outlined text | own work |
| (Luma) | uses the real `_shared/products/luma/logo.png` in an HTML card (see preview) | folded pile | — | product's own |
| photo/echo-1960-candy(.webp 1200 / .avif 1800) | NASA Echo balloon in a hangar, lilac airbrush gradient map | about/story section, full-bleed break | https://commons.wikimedia.org/wiki/File:Echo_-_A_Passive_Communications_Satellite_-_GPN-2002-000122.jpg (NASA) | Public domain (NASA). Credit "NASA" |
| photo/echo-orb-800.webp | square crop of the balloon | round mask, avatar-sized story image | same | Public domain |
| photo/holmdel-horn-candy(.webp 1200 / .avif 1800) | Holmdel horn antenna; shadows ink-green, highlights take the sky colour of their height | "signal" section, blog header | https://commons.wikimedia.org/wiki/File:Horn_Antenna-in_Holmdel,_New_Jersey_-_restoration1.jpg (NASA, restored by Bammesk) | Public domain |
| extras/echo-orb.webp / -400 | chrome candy sphere with rings, transparent | floating object, scroll parallax, 404 | three.js render with alpha | own work |
| extras/airbrush-dusk.webp | 1920×1080 sprayed sunset + green floor | section backdrops | generated (numpy) | own work |
| extras/airbrush-candy.webp | 1920×1080 pastel spray | light backdrops | generated | own work |
| extras/card-back.svg | card back: split sunset, echo rings, A coin | decoration, loading state | generated | own work |
| extras/sticker-no-bluff.svg | lime starburst "NO BLUFF" | hero corner sticker | generated | own work |
| extras/sticker-since-2016.svg | round badge "On Google Play since 2016" | about, footer | generated | own work |
| extras/sticker-folded.svg | hot-pink FOLDED pill | retired products | generated | own work |
| extras/suits.svg + suit-*.svg | four suits: signal, density, echo, A | bullets, section markers, indices | generated | own work |
| extras/keycaps.svg + keys/*.svg | candy keycaps ? D S F J K G ESC | cheat sheet, inline hints | generated | own work |
| extras/grain.svg | feTurbulence grain tile | overlay at 30–40% (`mix-blend-mode: overlay`) | generated | own work |
| 3d/deck-scene.js | three.js module: `createDeck(canvas, {live, mood, tall})`, deterministic `setProgress(p)` | live deck; also the bake source | hand-written; three@0.170.0 via CDN | own work; three.js MIT |
| 3d/demo.html | full-screen live demo with shortcuts | demo | — | own work |
| motion.js / motion.css | the motion study (see table above) | site-wide | hand-written; Motion 12.23.28 (MIT) | own work |
| shortcuts.js | `?` cheat sheet + key bindings + echo pings | site-wide signature | hand-written | own work |
| src/render.html | bake rig: `?shot=hero&p=`, `?shot=card&i=`, `?frames=N`, `?shot=orb` | re-rendering any asset | — | own work |
| src/og.html | OG bake rig | — | — | own work |

### Re-baking
Serve the repo root. Then:
- Stills: `scripts/shot.sh "http://127.0.0.1:6031/designs/31/assets/src/render.html?p=1&t=0.7" out.png 2560 1440 40000`
- Frames: load `render.html?frames=64` with `--dump-dom`. `#out` holds a JSON array of webp data URLs.
- Moods: `dusk`, `candy`, `mint`. Custom camera: `&cam=x,y,z,lx,ly,lz&fov=40`.

## Rules for the builder
- Never recolour or redraw product logos. Harbor's mark is `currentColor` by design. Use its own cream (#F2EFE8) on near-black.
- Numbers come only from `designs/_shared/content.js`. The OG line "11 products dealt. 2 live, 1 building, 1 paused, 7 folded" is counted from that file.
- Keep the night drop shadows hard (no blur) on keycaps and cards. Keep the airbrush blur soft. That contrast is the look.
- Grain over everything, at low opacity.
