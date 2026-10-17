# Zinc & Granite

**A Paris room. A Norwegian view. One slow walk to the window.**

## Vision

Paris zinc roofs and Norwegian fjord granite are the same colour: silver. The brand is one room with Haussmann proportions: pale boiserie, a plaster cornice, a chevron oak floor, an olive tree in a zinc planter and a writing table with a laptop on it. It has one round-headed French window, standing open over an iron railing onto a fjord between granite cliffs.

The homepage is built on a single idea: **an arch is cut in the page.** Through it you see the room, and the room's own window stands concentric inside the page's arch, so you look through one window into another. As you scroll, the page's arch opens to full bleed and the camera makes one slow, unbroken walk across the room to the balcony. At the end of the walk the MCP command waits on the sill.

Nothing on the site names a city or a country. The atmosphere does that work, and the copy stays about software. This fits Albretsen AS because the room itself is the proof: a real-time 3D scene, lit for the visitor's own hour, that loads after first paint and renders only when something changes. It shows taste and engineering together, and it never raises its voice.

## The homepage

1. **Hero: the arch.** The name is set large in Bodoni Moda with an italic *AS*. The arch stands on the bottom edge of the screen like a French window that reaches the floor. It is flanked by the line "Quiet software that *pays* for itself." on the left and the live product feed on the right (one event at a time, at most one change every five seconds).
2. **The walk (Long Dolly).** Scroll progress drives one move. First the arch opens to full bleed, then the camera walks to the window. On desktop with WebGL this is the live three.js room (`assets/room/room.js`). Elsewhere the baked still dollies toward the window and dissolves into the balcony bake. The move is computed from absolute scroll position with a damped follow, so it never cuts or drifts.
3. **The light (the interactive moment).** A small fanlight-shaped dial sits bottom left. Drag the sun along it, or use the arrow keys, and the room's light moves from silver morning to white noon to gold evening. When the live room loads it opens at the visitor's own local hour, labelled "Your hour". Without WebGL the dial grades the evening still toward the chosen hour.
4. **On the sill (products).** The four current products are cotton cards carrying their real, unchanged logos, standing on a limestone sill. They open like French windows (Shutters) as they scroll into view. Under each card are only the status, the facts from `content.js` and the domain. Retired products are perforated stamps with Bodoni monograms; Luma uses its real monogram.
5. **Writing**, then a footer that opens onto the balcony at morning, with "Takes one outside engagement at a time." and the email.

**The window cursor** (signature delight): a small arched-window outline follows the pointer on a soft spring. Over links its fanlight fills with stone light; over images it widens into a pane. It runs only with a fine pointer, hides over text fields and settles under reduced motion.

## Voice

First person, short, warm and plain. State the number, never sell it. One italic word per headline at most, used for emphasis, never decoration.

- "Quiet software that *pays* for itself."
- "Four things in the light right now. One earns, one is played, one is being built and one is paused."
- "Retired, with thanks."

Banned: "hire me", "let's connect", "passionate", exclamation marks, place names, postcard imagery.

## Colour

| Token | Hex | Use |
|---|---|---|
| Snow | `#f1efe9` | page, paper |
| Plaster | `#e3e6e3` | footer, panels |
| Zinc | `#a8b0b3` | rules, borders |
| Glacier | `#9dbccb` | focus rings, links in long text |
| Granite | `#5c6266` | secondary text |
| Ink | `#1d2226` | type, mark |
| Moss | `#68774c` | "live" only |
| Stone | `#d9c7a4` | warm accents, cursor fanlight, "building" |
| Evening | `#f0b98e` | light only (sun, Day Drift), never text |

Colour comes from light, not from fills. The page is almost monochrome; warmth enters through the photographs and the time of day.

## Type

- **Bodoni Moda** (OFL), variable with optical sizes. Display at 500 weight and opsz 96; text at low opsz so the hairlines hold up; italic for one word per line.
- **Instrument Sans** (OFL), 600 weight, caps, tracking .22em, for labels and UI only.
- The system monospace face for commands.

## Motion

A single easing curve, `cubic-bezier(.16,.84,.24,1)` ("exhale"), for everything. One move per page. Nothing bounces, loops for attention or moves on its own except light: the Day Drift patch crossing the products section, and the breathing dot beside "live". Under `prefers-reduced-motion` the hero becomes a still page with the arch at rest, the walk and the shutters are skipped, and the command appears inline.

## Sound

Silent by default. If sound is ever added, it is an opt-in room tone (wind through an open window, a cup set on a saucer when you copy the command), behind a visible toggle, and it never plays on its own.

## Mark

The arched French window opening onto a ridge line, beside the Bodoni wordmark "Albretsen *AS*". Both are outlined, so they need no font. The favicon puts the mark on a granite tile with a glacier ridge.

## Performance

- The first paint is HTML, CSS, two preloaded fonts and one hero image (AVIF, about 23–80 KB, or a true portrait render on phones). Every image has dimensions or an aspect ratio, so layout shift is 0.
- three.js (0.169.0, pinned) and the room's textures load only after `load` and idle, only on screens 900 px and wider, without reduced motion or Save-Data, and only when WebGL2 is available. The baked poster stays underneath until the first live frame, then crossfades out.
- The room renders only when the time or the walk changes, and never while the tab is hidden.

## Extending the direction

**Blog.** Each post is a room in the same building. The header is a shorter arch (about 40 svh) opening onto a cover image graded silver: the kit's `granite-mist`, `zinc-roofs` or a new still from `room/bake.html` at a different hour and camera position. The title is set in Bodoni at opsz 96 with at most one italic word. Body text is Bodoni at opsz 11–14, 19–21 px on a 34em measure, with Instrument Sans captions. The Dahl and Pissarro plates and the cornice rule act as section breaks. Code blocks sit on Plaster with a Zinc hairline. The Long Dolly on a post is a slow push into the header image over the first screen, and nothing else moves.

**Product pages.** Each product gets its own hour. MCP Emails is in the morning (silver), Fun Libs at noon (white), Toolrails in late afternoon and Harbor at evening. The hero is that product's card on the sill, made with `product/compose.html?id=…&tone=…`, behind an arch. Facts come from `content.js` and sit as a quiet three-column row of number plus label. Screenshots open with Shutters. The product's own colours appear only inside its real logo and screenshots, never in the page chrome.

**New products** get a new card from the composer. **Retired products** get a stamp. The building never needs a new metaphor.

## Credits

All imagery is from the asset kit (`assets/ASSETS.md`): renders of an original three.js room, a CC0 photograph of Lysefjorden inside the window, public-domain paintings by J.C. Dahl and Camille Pissarro (The Met Open Access), and real product logos from `designs/_shared/products`.
