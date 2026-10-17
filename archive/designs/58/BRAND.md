# Specimen Drop: brand book (design 58)

## Vision

This is a product-drop page for a company rather than for one product. Albretsen AS is shown as a naturalist's cabinet released like a limited drop. A ticker across the top reads "The 2026 drop · 11 specimens · 4 current · 7 retired", and every product is a mounted specimen.

The centrepiece is a live lapis-lazuli geode built in three.js from primitives only. Each crystal on it is a product. Visitors can:

- turn the stone,
- hover a crystal to read its label,
- pull a crystal off and drop it into another socket. If the socket is taken, the two crystals swap places.

A paper museum label hangs from a thread beside the stone. You can drag it, and it swings back like a pendulum. It shows whichever specimen you are looking at.

The page should read as **technical skill with immaculate, human taste**:

- **Technical:** the live 3D, the physics and the live growth log.
- **Human:** the hand-coloured plates, the rose and the paper labels.

It is a technology brand. The cabinet is a metaphor for curating products, and nothing in it is industrial, nautical or financial.

## Colour

Ultramarine owns the page. The pigment was once ground from lapis lazuli, and the 1840s mineral plate in the collection section tells that story.

| Token | Hex | Use |
|---|---|---|
| lapis | #073fe3 | Hero ground, the stone, figures on paper |
| deep | #082593 | Line art and labels on paper |
| ink | #061457 | Text on paper, footer, command block |
| peri / frost | #97b7f8 / #cadbfd | Secondary text on lapis, crystal tints |
| vellum / parch | #faf3e3 / #f4e6ce | Paper sections, labels, the retired drawer |
| rosehip | #ec3d5f | Accent only, mostly from Redouté's rose |
| pollen | #f4cd4b | The "live" dot, the citrine crystal, the `$` prompt |

Rough share: lapis 55, vellum 25, ink 12, and the rest as accents. Sections alternate between full-bleed lapis and full-bleed vellum. Lapis is never used as a small accent on paper, except for figures and links.

## Type

- **Fraunces** (SOFT 100, WONK 1, opsz 144) for display, specimen names (italic) and figures.
- **Instrument Sans** for body text and UI.
- **Martian Mono**, uppercase with wide tracking, for specimen numbers, captions and the growth log. It works the way catalogue numbers do on museum cards.

## Voice

A collector writing in the first person: warm, exact, unhurried. Facts come from `content.js` and nothing is inflated. The copy never asks for anything and never uses "hire", "connect" or "passionate".

- Hero: "Software, grown & mounted."
- Labels speak like museum cards: "Specimen Nº 03 · Twinned point, periwinkle · Collected 2026 · Norway".
- The retired drawer is affectionate, not apologetic: "No surviving brand, so each is drawn as the crystal habit it wears on the stone."

## Motion

There is one hand-rolled spring (`assets/motion.js`): a damped oscillator with a fixed 240 Hz sub-step that can be retargeted mid-flight. Named moments:

- **Specimen settle:** hero copy and cards drop in with a small tilt and one soft bounce.
- **Crystal drop and re-seat:** crystals grow onto the stone at load. Pulling one lifts it, and releasing it springs it into the nearest socket, swapping if needed.
- **Pendulum label:** an underdamped spring (k 38, c 2.4). Grab it and it follows the pointer around its pivot. Fast mouse movement across the hero nudges it like a breeze.
- **Dangling stickers:** the cut-out plates can be picked up and thrown. While carried they tilt with their velocity, and on release they carry momentum but stay inside the hero.
- **Loupe:** product mounts lean toward the pointer, and a circular lens reveals the 2x plate. The 2x image loads on first hover.
- **Herbarium shuffle:** drag cards to rearrange them, and the others make room (FLIP plus springs). Keyboard users press Alt + arrow keys, which animates through the View Transitions API. The order is remembered per browser.
- **Micro-interactions:** the copy tooltip grows from its trigger edge (Radix's transform-origin pattern), buttons are magnetic, and nav underlines draw in from the pointer side.

With `prefers-reduced-motion`, the page is calm and static: the geode becomes a pre-rendered still, the ticker stops, and springs jump to their end state.

## Sound

Sound is off by default. The "Sound off" pill in the bar is the only way to turn it on. Everything is synthesised with WebAudio and nothing is downloaded:

- Glass tinks (a sine plus inharmonic partials) when a crystal re-seats, the label is released, or the cabinet is shaken. A shake plays a cascade.
- A short band-passed paper rustle when a card lands.

## Mark

The mark is a cut-stone "A" with bevelled facets lit from the upper left, the same light as the 3D scene. It sits beside "Albretsen", set in Fraunces 560 and outlined to SVG paths, with an italic "AS". The variants are:

- on paper,
- on lapis,
- mono, using `currentColor`.

The footer uses the text lockup as a CSS mask, so it takes any colour.

## Assets

The page uses the full kit in `assets/` (see `assets/ASSETS.md` for every source and licence):

- **Hero:** the re-inked Haeckel diatoms and fern plates sit behind the hero in screen blend. The geode render is the first-paint and no-WebGL fallback.
- **Stickers:** six cut-outs: the rose, a Discoidea sun and trefoil, a diatom lens, garnet and aquamarine.
- **Products:** the specimen cards carry the real logos, unaltered. The retired products are drawn as crystal habits.
- **Collection section:** the mineral plate Tab. II, radiolarian skeletons and the crystal-habit pattern tile.

## Extending to the blog and product pages

- **Blog = field notes.** The index is a herbarium sheet: each post is a vellum label (mono date, italic Fraunces title) pinned beside a small cut-out chosen per post. Use the rose for personal essays, gems for product write-ups and diatoms for technical posts. Article pages are vellum with a narrow measure. The first letter sits on a lapis lozenge cut like the A mark. Pull quotes hang on a thread and swing on the pendulum spring when they scroll in. Figures are captioned like plates ("Fig. 3 · …").
- **Product pages = a single specimen.** The hero is full-bleed lapis with that product's crystal alone on a small plinth of stone, using the same `crystals.js` with one product and the turntable autorotate. The museum label carries the facts from `content.js`, and the real logo sits on its white mount. A "growth log" filtered to that product replaces marketing claims. Retired products get a quieter vellum page with their habit drawing and a one-line reason, written by Asgeir.
- **Transitions between pages** use the Lapis wash from `motion.js`: ultramarine spreads from the click point and recedes from the opposite corner, implemented with View Transitions where supported.
