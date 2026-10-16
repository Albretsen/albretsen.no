# Infrared Fable — Albretsen AS (design 36)

> A real landscape photographed in light you can't see, with a storybook living inside it.

The full asset kit, sources and licences are in `assets/ASSETS.md`. This file describes how the brand behaves.

## Vision

Albretsen AS builds whatever pays: a word game, email for AI agents, a tool layer for agents, a knowledge base. The site does not list them as a portfolio. It frames them as **specimens collected in the field**. Real CC0 photographs from Poly Haven are graded to look like Kodak Aerochrome infrared film, so foliage glows magenta and the sky drops from violet to a strip of cyan. That makes them familiar and impossible at the same time. Inside that light live 19th-century natural-history plates: butterflies, a nature-printed fern and Grandville's comet. They are re-inked into the same palette, so engraving and photograph share one light.

The skill shows in the layering, not in the claims. The name stands *behind* the trees. A pointed-arch aperture drifts in the sky and shows a different night. Scrolling opens that arch from the horizon until it swallows the frame and drops you into the pinewood, where the next line is woven between the trunks. Cards have weight. Buttons lean toward you. Nothing says "hire me".

## The homepage (index.html)

1. **Horizon (hero).** A full-bleed infrared meadow has three layers: back plate, the word `Albretsen`, and a front plate with the sky cut away. A small script keeps the word's baseline on the treeline at any aspect ratio (cover-crop geometry). An **aperture lens**, a pointed arch masked with CSS `mask`, follows the pointer on a damped spring and stretches a little with speed. That stretch is the spark word *tension*. Through it you see Grandville's comet procession, and because it sits behind the front plate, the trees cut its bottom edge. A paper **field log** is pinned in the meadow and fed live from `_shared/feed.js`. The MCP line is a magnetic copy button.
2. **The arch story.** The section is pinned with CSS sticky and scrubbed by GSAP ScrollTrigger. The word sinks behind the treeline, dusk falls, the butterflies leave, and a pointed-arch `clip-path: polygon()` (computed per frame from two circular arcs) opens from the horizon into the misty pine scene. "Whatever pays." is set between the trunks using the pinewood front matte, with the real figures underneath.
3. **Specimens.** A cream paper section with ambientCG paper grain and a marbled endpaper band. The spring-physics **specimen deck** (drag, fling, tap to flip, arrow keys) sits in a marbled pointed-arch cabinet. Next to it is a Radix-accordion-style index: grid-rows `0fr → 1fr` with a staggered inner fade. It stays in sync with the deck both ways, so clicking a row deals that plate to the top and dealing a card opens its row. Each row uses the real product logos from `_shared/products`, unaltered. Two die-cut fern stickers can be peeled off and moved on springs.
4. **Pressed and kept.** Retired products sit on a shelf of arch stand-ins; Luma uses its real logo. A tooltip follows Radix's model: about 350 ms open delay, instant hand-off between neighbours within 300 ms (`skipDelayDuration`), transform-origin at the trigger, spring scale-in, Escape to close, `aria-describedby` while open.
5. **Footer.** Grandville's comet night opens through the Aperture signature as you reach it, followed by the availability line, the email as a large magnetic button, and credits.

## Voice

Storybook warmth, ledger-dry facts. Use short sentences and concrete nouns, and put numbers exactly as they are in `content.js`. The fable is in the imagery, so the copy never has to be whimsical.

- "I build software that pays for itself."
- "Whatever pays. If it earns its keep, it stays in the field."
- "Four specimens, still in the field."
- Banned: hire me, let's connect, passionate, any number not in `content.js`.

## Colour (OKLCH first)

| Token | OKLCH | Hex | Role |
|---|---|---|---|
| Night | oklch(18.8% 0.081 294) | #170733 | ground, ink on cream |
| Dusk | oklch(36.6% 0.171 296) | #4a1a8c | upper sky, panels |
| Plum | oklch(38.4% 0.163 325) | #6b1272 | shadows, labels on cream |
| Aerochrome magenta | oklch(61.7% 0.229 0) | #e8287f | the action colour |
| Ember | oklch(72.6% 0.178 43) | #ff7a3d | sun, the "building" status |
| Peach | oklch(82.5% 0.125 63) | #ffb36b | highlights, figures on night |
| Horizon cyan (seed 192°) | oklch(72% 0.12 192) | #1abcb8 | one cool note per view |
| Plate cream | oklch(96.5% 0.025 69) | #fff1e2 | paper, type on night |

## Type

- **Gloock**: display, the storybook voice. The wordmark is outlined from it.
- **Bricolage Grotesque** (variable opsz): text.
- **Martian Mono** (wdth 87.5): numbers, labels, commands, status chips, the field log.

## Motion

The principle: **depth first, then tension, then release.** Things come from behind something (the treeline, the horizon, an arch), are pulled by springs, and settle with a little overshoot.

- Horizon Rise: characters rise, unblur and land from behind the front matte (GSAP, expo.out, centre-out stagger).
- The arch story: a scroll-scrubbed pointed-arch clip opens from the horizon to full bleed, with the inner scene scaling from 1.45 to 1.
- Lens: a hand-rolled spring (k 90, c 14) that stretches with speed.
- Wingbeat: butterflies split at the body and flap in 3D.
- Magnetic: buttons and links lean toward the pointer, with the label moving further than the shell and an elastic release.
- Specimen deck and stickers: semi-implicit Euler springs, sub-stepped.
- Ink Thread: a wavy magenta underline on nav and product links.
- Film grain: stepped jitter over everything.
- **Reduced motion:** no pinning (the two scenes stack as static panels), no rise, no wings, no grain jitter. The lens sits still in the sky, and the deck springs become critically damped.

## Sound

Sound is off until the visitor presses the Sound toggle, and nothing autoplays. Once it is on, Web Audio synthesises everything with no files: a three-partial chime on flips, pitched per product (C, D, E, G), a band-passed paper swish when a card is sent away, and a soft tick on copy and sticker pick-up.

## Mark

A pointed-arch window onto an infrared treeline at sunset. The road to the horizon forms the counter of an **A**, and the horizon is its crossbar. The arch is the brand's one shape: the lens, the scroll reveal, the deck cabinet, the product plates, the retired shelf and the footer reveal are all the same arch.

## Extending to the blog

- **Index:** each post is a small specimen label (cream paper, Martian Mono date, Gloock title) pinned at a slight rotation on a night ground, with one butterfly per page at most.
- **Post header:** a short (40 vh) infrared plate (horizon or pinewood, alternating) with the title set behind the treeline using the same front-matte technique. Long titles fall back to the meadow below the trees.
- **Body:** cream paper, Bricolage at 19/1.65, Gloock subheads, magenta Ink Thread links. Code blocks are night panels with a Martian Mono gutter. Pull quotes are set in Gloock in a pointed-arch frame.
- **Figures:** use the plate treatment: cream mount, plate number and a caption in mono.
- **End of post:** the comet-night Aperture reveal from the homepage footer, then the availability line and the email.

## Extending to product pages

- Each product gets its specimen plate (`assets/products/plate-*.webp`) as the hero object. The plate sits in the marbled arch cabinet and can be flipped to show facts on the back.
- The hero scene is chosen per product: horizon for MCP Emails, pinewood for Fun Libs, the comet night for Toolrails, the marbled endpaper for Harbor. The product's own logo and brand colours always appear unaltered, inside the arch, never recoloured into the infrared palette.
- The field log on a product page is filtered to that product's events.
- Status chips (live, building, paused, retired) use the same colours as the homepage index.
- Retired products link to a short "pressed" page: the arch stand-in, the year, and the one-line reason when Asgeir writes it.

## Accessibility and performance

- First paint: horizon AVIF (118 KB at 1440) plus the front matte, preloaded. Pinewood loads lazily at low priority. The comet image for the lens is applied after `load`, and GSAP and ScrollTrigger are injected only after first paint.
- All layers are absolutely positioned, so there is no layout shift. Without JS the page is two static scenes, then the four product plates as images (a `noscript` grid), then the footer.
- Deck: focusable top card; Enter or Space flips it and the arrow keys send it away. The index rows are real `button`s with `aria-expanded` and `aria-controls`. The tooltip shows on focus, is dismissed with Escape, and is linked by `aria-describedby`. A skip link goes to the products.
