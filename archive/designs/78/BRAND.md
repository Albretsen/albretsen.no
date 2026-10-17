# Peach Hour

**A small sunlit village you can turn, and a sun you can move.**

## Vision

Albretsen AS is shown as a miniature hill village on a travertine turntable: stone houses, canal-tile roofs, pale-blue shutters, olive terraces, cypresses and a pool. It floats in peach morning haze over hazy ridges. Everything is built from three.js primitives and graded like false-colour infrared film, so olives turn rose, cypresses crimson and shadows mauve.

The model does the talking. It shows precision, patience and taste without a single claim. Each product is one house carrying its real logo, which turns the product list into a place. The site is still about a software company. There are no place names or postcards, only the light and the craft.

The visitor can do two things:

- **Turn the village.** Drag it or use the arrow keys. It keeps its inertia and idles slowly when left alone.
- **Drag the sun.** The sun moves along an arc from sunrise to dusk. Shadows swing, the sky re-mixes and windows light up. The huge name in the sky is lit from wherever the sun stands, so moving the sun also moves the glow across the letters.

## Homepage

1. **Hero:** the name "albretsen", very large in the sky, with the live village below it. A one-line description sits at the lower left, with one quiet line of live product activity under it. On first paint a baked still (AVIF, then WebP, then JPEG; 2:3 on phones) shows exactly what the live scene will show. three.js loads at idle time and fades in over the still.
2. **Products:** four houses (MCP Emails, Fun Libs, Toolrails, Harbor) on a staggered two-column grid, each behind pale-blue shutters that open as it scrolls into view. Each house has one big light figure (Nunito 250) and its facts. Retired products follow as painted house-number tiles.
3. **Footer ("Evening"):** the same village at dusk inside an arched window, the same arch as the mark. Next to it sit the availability line, the email and the copyable `claude mcp add` command.

## Voice

Warm, short, sure of itself, and it never sells. It states what exists and stops there. It never says "hire me", "let's connect" or "passionate", and never asks for anything.

- "Small, exact software that pays for itself."
- "Built one house at a time."
- "Takes one outside engagement at a time."

## Colour

Sunrise peach, gold and pale blue on warm paper, with deep mauve ink. Text is never black.

| Token | Hex | Use |
|---|---|---|
| Paper | `#FFF8EF` | ground, with paper grain multiplied at 20% |
| Peach 300 | `#F9C9A4` | haze, large fills |
| Gold | `#F2C46D` | link underlines, fact bullets |
| Terracotta | `#D9805C` (text `#B4603F`) | eyebrows, figure labels, "AS" |
| Pale blue | `#A9CDEB` | shutters, the mark's window |
| Haze mauve | `#C58FA6` | ridges, dusk, the footer |
| Ink | `#4E3A57` | all text |

The infrared rose `#EC8FAE` and cypress `#B83A63` appear only in imagery.

## Type

Nunito, variable, self-hosted: a rounded, sunny Californian sans.

- **Display:** weight 820, tracking −0.035 to −0.055em.
- **Figures:** weight 250.
- **Body:** weight 450, 17/1.55.
- **Labels:** weight 800, uppercase, 12px, tracking 0.16em, in terracotta.
- **Commands:** the system monospace.

The hero name uses a sunlit gradient clipped to the letters. Each letter reserves its 820-weight width, so the weight animation never shifts the layout.

## Motion

Slow and sunlit, with every motion settling on a long expo-out curve.

- **Warm Up:** letters go from weight 300 to 820 with a 60 ms stagger.
- **Haze Drift:** while the hero scrolls away, the village moves at 0.32× and the name at 0.55× the scroll, and the name fades out.
- **Shutter Open:** louvered shutters swing back to reveal each product.
- **Idle turn:** the turntable rotates at 0.035 rad/s.
- **Sun:** the breathing ring stops once the visitor has touched anything. While dragging, a dotted arc shows the sun's whole path, and a small clock shows the hour (06:00 to 21:00).

With `prefers-reduced-motion`, everything rests at its end state and the turntable stands still, but it can still be turned by hand.

## Sound

None. The homepage is silent and has nothing to switch on. If sound is ever added, it must be opt-in.

## Mark

A round-arched window with the sun rising on its sill, drawn in ink with a pale-blue sky and a gold-to-terracotta sun. The wordmark is a lowercase "albretsen" plus a smaller terracotta "AS", outlined from Nunito 820. The header shows the mark alone because the hero already says the name. The footer shows the full wordmark.

## Extending it

- **Blog:** paper ground, with a 680px text column in Nunito 450 at 19/1.65 and headings at 820. Each post gets a cover rendered from the same diorama at a different hour and from a different angle: `bake.html?t=&yaw=&view=street`. The cover sits in the arch mask, and the time it was baked is printed as a small clock caption ("07:48"). The infrared split tone makes covers look like one series. Olive sprig and lavender ornaments mark section breaks. The canal-tile eave edge forms the top of the header.
- **Product pages:** each page opens on its own house vignette (`scene=vignette:<id>`) with the sun draggable, so each product page has its own small world. Below it come one big figure in Nunito 250, the facts as gold-bulleted lines and the real product logo, never recoloured. Status uses the same dot language: green for live, gold for building, mauve for paused.
- **About:** the dusk hero, mirrored, with the history (Google Play since 2016, consulting since 2021, the company since 2026) as three houses lit one after another.

## Technical notes

- `assets/` holds the kit. `diorama.js` gained three small options: `sunPick:false` (the page's own accessible slider drives the sun), `sunLift` (keeps noon inside the frame) and `minAspect` (widens the lens on tall phones). It also gained two setters, `setOffsetX` and `setMinAspect`.
- Layout shift is 0. Every image has its intrinsic size, the name glyphs reserve their final width, and the feed and copy-status lines have fixed heights.
- Initial weight is about 250 KB. three.js (about 170 KB gzipped) and the scene load at idle time and pause while the hero is off screen.
- Review helpers: `?t=0.5` opens at a given hour, and `?vh=900` pins the hero height for tall screenshots.
