# Salon Refusé (after hours)

Design 38 for albretsen.no / Albretsen AS. The asset kit and its full inventory, sources and licences are in `assets/ASSETS.md`, and the contact sheet is `assets/preview.html`.

## Vision

A gallery wall at night. Deep jade plaster, narrow contour spotlights, works hung in gilt and box frames. Every artwork is a program: a seeded canvas-2D drawing (`assets/js/art.js`) that paints itself stroke by stroke. Asgeir's products hang in the same light, as their real logos printed on museum mats.

The signature is the **UV torch**. Every image has a pixel-aligned underdrawing in fluorescent ink: the flow field, the catenary sags, the logo construction grid, the seed. On the homepage it also covers the HTML. The headline turns into outlines on a baseline grid with its type spec written beside it, and the MCP command becomes "audio guide stop 01 · MCP over https". The site never says it is well made. Visitors find the evidence in the hidden layer.

It is a rebellious-indie salon, not a stuffy museum. The 1863 Salon des Refusés hung the work the academy rejected, so this one hangs the retired products in a storeroom rack next to the live ones. The house rules are inverted (PLEASE TOUCH, WET CODE), and a red "sold" dot marks the products that pay. It is a technology brand that uses a gallery as its stage. The site uses no finance or industrial metaphors.

## Homepage (built)

1. **Hero: one work, one lamp.** A full-bleed three.js render of a real CC0 gilt frame (Poly Haven) under a spotlight. Inside it, a live `<canvas>` paints a generative work in front of the visitor. It is positioned in percentages so it stays pixel-aligned with the photographed frame at every crop. The lamp comes on with a two-step flicker, then the vinyl lettering on the wall unveils top-down. Clicking the frame rehangs it: the next series, the next spectrum hue and a new seed, with a lift-off and drop-in. The wall label updates with the real stroke count.
2. **UV torch over everything.** The whole lit layer is cloned into a UV twin. The twin uses the UV render of the room, the UV pass of the same canvas plan and an annotated copy of the text, and sits under one radial mask driven by registered `@property` values (`--torch-r`, `--tx`, `--ty`), animated with WAAPI. On touch screens, press and hold on the wall. The "UV torch" switch (role=switch) floods the whole room for keyboard and touch users.
3. **Guestbook.** The live product feed (`_shared/feed.js`) as a Sonner-style stack of visitor slips: newest in front, older slips scaled .05 per step. They fan out on hover or focus.
4. **Room 1, works in circulation.** MCP Emails, Fun Libs, Toolrails and Harbor as feathered photographs of their real logos on mats. Each is a UV-torch pair. A paper plaque opens on hover to the full provenance: facts and link, with a `grid-template-rows: 0fr → 1fr` reveal. Red dots slap on, overshooting from scale .9 with a 2px blur, and Radix-style grouped tooltips skip their delay once one has been seen. Toolrails wears the WET CODE sticker and Harbor a "Paused" tag.
5. **Interlude.** The seven-work salon render as a full-bleed torch band.
6. **Room 2, the storeroom.** Retired products as stand-in prints on nails, in a rack you can drag with momentum. The prints swing on hover as damped pendulums.
7. **Room 3, please touch.** The kit's three.js module, lazy-loaded when the section is near: a real gilt frame on a nail, with pendulum physics when dragged and a live canvas texture. "Hold for UV" also works from the keyboard.
8. **Footer, closing time.** The marble bust under gels, "Takes one outside engagement at a time.", the email and the rotating Google-Play-since-2016 stamp.

## Voice

Dry, exact and a little insolent. The site talks like a curator who also ships software. It states facts, names the medium and lets the work carry the claim.

- "Asgeir Albretsen builds software that *pays for itself.*"
- "Retired, not destroyed."
- "Audio guide, for agents."
- "Red dot: this one pays."

Never: "hire me", "let's connect", "passionate", or superlatives about himself. Numbers only come from `_shared/content.js`.

## Colour

OKLCH first, seed hue 168. Everything is in `assets/brand/palette.json`.

| Role | Token | Value |
|---|---|---|
| Wall | `--wall` | oklch(0.36 0.06 168) #164737 |
| Wall out of the light | `--wall-deep` | oklch(0.22 0.045 168) #002116 |
| Night / footer | `--night` | oklch(0.15 0.03 168) #000f09 |
| Paper (labels, prints, light text) | `--paper` | oklch(0.955 0.012 95) #f2f0e7 |
| Gilt (kickers, small accents) | `--gilt` | oklch(0.74 0.11 82) #cda454 |
| Spark (brand accent, links, the nail) | `--spark` | oklch(0.8 0.15 168) #35dcab |
| Red dot (earning products only) | `--red` | oklch(0.6 0.22 27) #e62c2c |
| UV ground / ink / cyan / rose | `--uv-*` | hidden layer only |

The full spectrum is six hues 60° apart at `oklch(0.72 0.15 h)`, and it is used with discipline. Each generative work takes one home hue plus its opposite. Each product in the guestbook gets one hue for its dot. Only the spark moment shows all six. UV colours never appear outside the torch.

## Type

- **Instrument Serif**, mostly italic: display, room titles, wall-label titles and the wordmark. It plays the museum lettering.
- **JetBrains Mono** 400/600: body, labels, data and UV annotations. It is the engineer's hand.
- **Bricolage Grotesque** 800, width 75: stickers, figures on plaques and the audio-guide number. At most one loud moment per view, never body text.

## Motion (Web Animations API)

From `assets/motion.js` plus the site code:

- **Lights up**: the lamp flickers (brightness steps of .05, .5, .12, .85, .6 and 1), then the work is unveiled with `clip-path: inset()` over 1000 ms on `cubic-bezier(.77,0,.175,1)`.
- **UV torch**: radius opens over 360 ms ease-out and closes over 220 ms ease-in. The position is lerped at 0.22 per frame.
- **Swing**: keyframes are sampled from a real damped pendulum (√(g/L), e^−2.4t) with `composite: 'add'` and pivot on the nail. The header mark swings when hovered.
- **Rehang**: the work lifts off (−10 px, brightness .5, fade) over 340 ms, then drops in over 420 ms from a 2 px blur.
- **Red dot**: from scale .9 with blur, overshoot to 1.08, settle at 380 ms.
- **Magnetic controls**: nav, copy and arrows follow the pointer and spring back on a sampled `linear()` spring.
- **Press**: scale .97.

Keyboard-triggered actions are not animated beyond feedback. With `prefers-reduced-motion`, the canvas is painted finished with no stroke animation. The flicker, swings, momentum, grain and stamp rotation are off, and the 3D frame only loads on request.

## Sound

Sound is off by default and turned on with the header toggle. Everything is synthesised with WebAudio, so no files are downloaded. A light-switch click (bandpassed noise plus a low thump) plays when the lamp comes on, on rehang and on copy. A soft sine "glass" tone plays when the UV torch lights or a red dot lands.

## Mark

A frame hung crooked on purpose (−7°) from a spark-green nail on a taut wire, with a four-point spark inside. The wire and the frame's top edge read as an **A**. The wordmark is Instrument Serif Italic, outlined, with the nail dot over the A. Files are in `assets/brand/`: mark, gilt and on-dark variants, lockup, favicon and OG image.

## Extending the direction

**Blog (posts from `content.posts`).** Each article is a single work in its own room. The header is a full-width torch pair: `detail-lit/uv` or a fresh `art.js` work seeded from the post slug, so every post gets a unique, deterministic painting with its underdrawing. The title sits as vinyl lettering in a light pool. The date and reading time go on a wall label. Body text is JetBrains Mono at 16/1.7 on the dark wall, with pull quotes in Instrument Serif Italic. Code blocks are "UV slides": violet ground with UV-ink text, revealed with the same clip-path unveil. Footnotes are wall labels in the margin. The index is a salon hang of small framed prints, one per post, each seeded from its slug.

**Product pages.** The product's framed render (lit/uv) hangs as the hero, with the wall label expanded into a full provenance card: since, status, figure and facts from content.js, plus the live feed filtered to that product's events in the guestbook stack. A red dot appears only if the product earns money. Changelog entries are "acquisitions", each with a WET CODE sticker for the newest deploy. Screenshots hang in box frames with tape-ups for sketches. Retired products get a storeroom page: the stand-in print, the one-line reason written by Asgeir, and the date it came off the wall.

**404.** The 3D frame with nothing inside and a label reading "Work on loan."

## Assets used on the homepage

Everything is from `assets/` (see `ASSETS.md` for sources and licences: CC0 Poly Haven frame and marble bust, original renders, art.js, stickers and textures) plus the real product logos in `../_shared/products/`, used unaltered. Three.js 0.170.0 is loaded from jsDelivr through an import map, only when Room 3 is near.
