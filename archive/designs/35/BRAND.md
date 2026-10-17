# Kiln Light

*A quiet room, one day of light.*

## Vision

Albretsen AS is shown as a small sunlit cutaway room floating on limewash. The products are real objects in it: each real logo is fired as a glazed tile and set on a walnut bench, a travertine drum or a stone block. An arched window looks out on real Martian dunes (HiRISE, Proctor Crater). The room is built only from three.js primitives, lit by a CC0 Poly Haven HDRI and surfaced with CC0 plaster, walnut and travertine. The craft carries the message: one person who builds precise things from honest parts, finishes them, and keeps only what holds.

It is a technology brand. The room reads as a maker's studio for software. It has no charts, no navy-and-serif bank look and no machinery.

## The homepage

1. **Hero: one day in the room.** A sticky stage sits inside a 440 vh track and scrubs 64 pre-rendered frames (`assets/sequence.js`). The camera walks in from the floating diorama to the bench while the sun crosses from morning to dusk. Four chapters of copy hand over with a focus pull: Morning (who), Noon (MCP Emails and Fun Libs), Afternoon (Toolrails and Harbor) and Dusk (the archive and the way onward). A sun-path arch on the right shows the time of day: one glaze drop rides the arch, an ember line fills behind it, and four numbered stops jump to each hour. A glass card, "Through the window", streams the live product feed. The MCP install line sits under the headline with a copy button.
2. **On the bench (products).** Four cards show the baked product stills in arch-topped frames, the real logo, the status, one figure and the facts. Cards use Kiln glow, a slight tilt toward the pointer and Lift. Clicking a card opens a Niche-open dialog (Radix Dialog data-state) with the 2× still and a "See it in the room" action. The archive follows: the clay-token tray image and a Strata accordion of the seven retired products, each with its pressed-glyph token. Luma uses its real monogram.
3. **The room, live.** Lazy-loaded three.js (`room-live.js` wraps `assets/3d/room.js`). You can drag to turn it, with inertia and a soft spring back. Hovering lifts a piece and shows a Drip-style label. Clicking a product tile opens its dialog. Pebble tabs move the camera with eased transitions, and a glaze-thumb slider moves the sun. On desktop it loads when it approaches the viewport. On phones, with reduced motion or with Save-Data, it waits for "Light the room".
4. **The view from the window.** A full-bleed dunes duotone with scroll-driven parallax (`animation-timeline: view()`), plus an arch-masked natural-colour crop that wipes in.
5. **The studio.** Four clay tiles pressed with the icon system name what gets made, beside the glass-sphere niche and the day job. A travertine strata band divides it from the footer.
6. **Footer at dusk.** The dusk still under a crackle-glaze Voronoi field with its molten seam. It holds the availability line and the email (magnetic), plus nine die-cut stickers, split live from `stickers.svg`, that can be dragged and thrown with simple physics. Arrow keys work when a sticker is focused.

## Voice

Plain, unhurried and exact. One warm word per line, set in terracotta italic: *pays*, *in use*, *holds*, *set down*. The copy states facts and never asks for anything. "Hire me", "let's connect" and "passionate" are banned.

- "Quiet software that pays for itself."
- "Each one fired until it holds."
- "Shipped, learned from, set down."
- "Takes one outside engagement at a time."

## Colour

Fired earth, with one glaze. The seed hue (228° OKLCH) is used only as **glaze**: the dot in every eyebrow, the sun on the arch, focus rings, the slider thumb and the single filled form in every icon.

| Token | Hex | Use |
|---|---|---|
| limewash | #f6f0e8 | page (light) |
| sand | #e8dac9 | image wells |
| clay | #d4b8a1 | quiet fills, paused status |
| terracotta | #bf6d4c | the warm italic word |
| ember | #e18344 | the seam, dusk, the "building" status, the live dot |
| umber | #614735 | wood, hairlines |
| ink | #282019 | text |
| glaze | #357e9c | one drop per composition |
| night | #09181f | page (dark) |

Dark mode switches the page to night with limewash text and the reverse wordmark. The hero stage stays a lit room in both modes, because it is a photograph of a place.

## Type

- **Instrument Serif**: display, set large with 0.88–0.92 leading and −1% tracking. The italic carries the warm word.
- **Geist** 300–700: body at 16.5–19 px with 1.55 leading.
- **Geist Mono**: eyebrows and figures, uppercase with +14% tracking.

## Motion

Only the light moves on its own: the scrubbed day, the 38 s window-light gobo drifting over the products and the slow breathing of the live dot. Everything else waits for the visitor.

- **Focus pull**: headings and cards go from a 10 px blur to sharp and rise 14 px (expo-out, 1.1–1.4 s, staggered).
- **Kiln glow**: a glaze and ember sheen follows the pointer across the cards.
- **Niche open**: the dialog grows out of an arch-shaped clip-path and closes back into it.
- **Strata**: an accordion with a sediment line that fills under the open item, while the token rotates.
- **Drip**: tooltips droop from their trigger's origin with a 4% overshoot.
- **Pebble**: the camera tabs, where the indicator glides like a stone on wet clay.
- **Lift**: the tiles rise 6 px and the shadow spreads rather than darkens.
- **Magnetic**: the primary buttons and the email lean toward the pointer and spring back.
- Scroll-driven parallax and an arch wipe on the dunes, CSS-only and only where supported.

**Reduced motion:** the hero becomes a single static frame (the morning poster) with the first chapter. There is no scrub, no parallax, no tilt and no magnet, the 3D only loads on request, and every transition collapses to 1 ms.

## Sound

Off by default. The choice is remembered, and nothing is created until the visitor turns it on (toggle in the nav). Everything is Web Audio synthesis on A5 with a tiny feedback-delay room: **tok** (hovering a tile or a piece in the 3D room), **ting** (opening, lighting the room, the email), **glide** (changing the time of day), **thum** (closing) and **crackle** (the scroll reaching dusk).

## Mark

An arch with a ledge reads as a soft "A", and a glaze sphere rests on the ledge. It is the room's window, the niche that holds the glass sphere and the one drop of glaze in a single form. The wordmark is Instrument Serif outlined to paths. The favicon switches for dark mode.

## Extending to the blog and product pages

- **Blog:** each post is "a day in the room". The header is a single baked still chosen for the topic: the bench for product stories, the dusk seam for retrospectives and the glass niche for essays on clarity. Body text is Geist at 19 px on limewash with a 64ch measure, and headings are Instrument Serif. Pull quotes sit in an arch-topped panel. Figures use the Kiln glaze rule (one blue element per figure). Code blocks are ink on sand in Geist Mono with a copy button that uses the same Drip tooltip. The post date is shown as a time of day on the sun-path arch for the hour it was published, as a small signature.
- **Product pages:** each one opens on its tile, rendered from `room.js` with `setView('<product>')`, scrubbed through a short eight-frame sequence from noon to dusk. The product's own brand colours stay on its tile and logo and are never recoloured; the page around it stays fired earth. Facts appear as Strata accordions, and changelogs as a strata band where each release is a sediment layer. Retired products get an archive page with their clay token, the year, the one-line reason and nothing else.
- **Icons:** always from `assets/icons/sprite.svg`, with a 1.5 px stroke and exactly one glaze drop. New glyphs follow the 24 px grid and the same rule.

## Assets and licences

See `assets/ASSETS.md` for the complete inventory. In short: the HDRI comes from Poly Haven (brown_photostudio_05, CC0); the textures are Poly Haven Grey Plaster and ambientCG Wood060 and Travertine002 (CC0); the window view is NASA PIA11833 (public domain, NASA/JPL-Caltech/UArizona); the product logos are the products' own and are unaltered; everything else was made for this kit. three.js 0.170.0 (MIT) loads from jsDelivr through an import map, and only when the live room is lit.
