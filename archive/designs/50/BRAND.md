# IR//PEEL: brand book (design 50)

> Pixel stickers on glossy vinyl. Peel one and an infrared underdrawing is underneath.

## Vision
The homepage is an object, not a document. It is a sticker sheet you can peel, and every sticker has something under it. On the product stickers it is the real number (`$782 MRR`, `113,000+ installs`). On the sprites it is a fact (`AGPL`, `built at 17`). Under the big mark is an **underdrawing**: an eye miniature from The Met, read in infrared and Bayer-dithered. The idea comes from infrared reflectography, the technique conservators use to see the drawing beneath the paint.

That is the story about Asgeir: the surface is fun (stickers, sprites, a word game with 113,000 installs), and under it is a careful layer of decisions (MCP servers, injection guards, AGPL code). Pixel art is the **costume, not the skeleton**. Layout and typography stay calm and modern; the pixels live in objects.

It is a technology brand. It has no gears, ships, ledgers or bank-blue, and it never says "hire me".

## Page anatomy (index.html)
1. **Hero: the live sheet.** A DOM sticker sheet tilts toward the pointer under a moving gloss. Twelve stickers SLAP in and each can be peeled (drag a corner, or focus it and press Enter or Space). A counter tracks how many are peeled, and *Re-stick sheet* runs the IR WIPE dither transition and slaps them back. Behind the sheet is a full-bleed infrared plate (*Fireworks, Nuremberg 1659*, The Met, CC0), dimmed. An **IR lens** follows the pointer, or drifts on its own on touch, and shows the plate at full heat with a phosphor wavelength readout. The left column holds the name, a one-line description, the day/night split, the copyable `claude mcp add` command (with a Radix-style data-state tooltip), and `/dev/ir`, the live product feed with a Lottie spark and scrambled text on each new row.
2. **Scrub.** Forty pre-rendered three.js frames of the mark curling off the sheet, drawn to a sticky canvas from scroll position, with three captions (Surface, Lift, Underdrawing) and a dithered infrared progress strip. The frames load only when the section approaches.
3. **Products (Sheet 02).** Each real logo appears on a curling vinyl sticker over a different museum plate. Cards tilt in 3D and carry a holographic color-dodge glare that follows the pointer (after Simon Goellner's holo cards). Names scramble on hover. Facts and figures come from `content.js`.
4. **Retired (Sheet 03).** The retired sheet bake, plus pixel stand-ins (the real Luma logo) as buttons with Radix-style hover cards.
5. **Depth (Sheet 04).** A three.js voxel model (mark, bolt or cursor) rendered at 40% and nearest-upscaled so it reads as a sprite, on Guercino's *Fireworks in a Piazza*. A segmented radio group with a spring indicator switches the model. Beside it: the day job and the dates 2016, 2021 and 2026.
6. **Footer.** A dithered infrared strip, the lockup, "Takes one outside engagement at a time." and the email.

## Colour (OKLCH seed hue 108°)
| Token | Hex | Use |
|---|---|---|
| void | `#0d031e` | page |
| violet-900 / panel | `#230445` / `#1c0a3c` | cards |
| violet | `#4b1788` | mark, liner print |
| ultra | `#8038d1` | secondary print |
| magenta | `#f315a2` | primary accent, links, CTA |
| hot | `#fa5e75` | heat |
| orange | `#fa8233` | secondary accent, "AS" |
| amber | `#fec766` | numbers on dark |
| **phosphor** | `#f2ed2b` | **signals only**: live dots, focus rings, toast, tooltip |
| vinyl / liner | `#f6f3fc` / `#ece6f4` | text, sticker sheet |

The infrared ramp runs void → violet → ultra → magenta → hot → orange → amber → vinyl. Dithers, plates and the thermal easter egg all map onto it.

## Type
- **Geist 650** for headlines, tight (−0.035 to −0.055em). **Geist 400** for body.
- **Geist Mono** for numbers, commands, feed rows and fact chips.
- **Silkscreen** for micro labels, sticker print and UI chrome only: uppercase, +0.06em, never in a paragraph.

## Voice
Terse and dry, a terminal at 2 a.m. It states facts and lets the numbers carry the weight.
- Yes: "Every sticker on this sheet peels. Underneath is the work." / "Retired, not forgotten." / "Day: software developer / Night: Albretsen AS"
- No: "passionate", "let's connect", "hire me", exclamation marks.

## Motion
The principle is that objects behave like vinyl, and nothing moves that isn't a thing.
- **SLAP** (entrance): scale 1.42 → 1 on a `linear()` spring, with the shadow tightening.
- **LIFT** (hover): rises 6px with a holographic glint masked to the die-cut.
- **PEEL** (drag): a real fold line on the perpendicular bisector of corner→pointer, which springs back or flies off.
- **IR WIPE** (transition): a Bayer 8×8 ordered dissolve in the infrared ramp.
- **CHROMA** (accent): a one-pixel magenta and orange split on links and the name.
- **SCRUB**: an image sequence driven by scroll.
- **Scramble**: feed rows and product names decode through `░▒▓<>/` glyphs.

`prefers-reduced-motion` gives a calm static page: no slap, lens or tilt, the scrub becomes a still bake, and the voxel model doesn't auto-rotate.

## Sound
Off by default. The `SND OFF` toggle in the nav turns it on. Peeling plays a band-passed noise sweep that rises like vinyl leaving the liner. Re-stick plays a low thump, and UI actions play short square-wave blips. There are no audio files: everything is generated with WebAudio.

## Mark
A 16×16 die-cut tile in violet with its top-right corner folded back, and a white A with a one-pixel magenta offset (the CHROMA move, frozen). The pixel wordmark sets ALBRETSEN with a magenta drop and AS in orange. Always render it with `image-rendering: pixelated`.

## Easter egg
Undocumented on the page. Typing **peel** (or the Konami code) drops the whole site into a thermal false-colour view with a phosphor toast, and typing it again leaves. The only hint is a line in the devtools console.

## Extending the direction
- **Blog:** each post is a "sheet". The header is a single large sticker (a pixel sprite chosen per post) that peels to reveal an infrared plate from The Met, Smithsonian or Rijksmuseum, picked for the topic. Body text stays Geist on void at a 68ch measure. Code blocks are panel cards with a Silkscreen filename tab. Pull-quotes get the CHROMA split. Page transitions between posts use IR WIPE, through the View Transitions API with the dither canvas as the old-state overlay. A reading-progress strip uses the dithered ramp.
- **Product pages:** the product's real logo appears as the hero sticker, never redrawn, on its own museum plate (MCP Emails on Fireworks, Fun Libs on the Piazza, Toolrails on the brooch, Harbor on the eye). Peeling it reveals the install command or store links. Facts are a row of label stickers in Geist Mono, and changelogs are a feed in the `/dev/ir` style. A product's own brand colour may appear only on its sticker. The page chrome stays infrared.
- **404:** an empty sticker sheet with a ghost outline and the line "Someone already peeled this one."

## Assets used
Everything lives in `assets/` (see `assets/ASSETS.md` for the full inventory, sources and licences). The Met plates are CC0 (Open Access). The vinyl normal map is ambientCG Paper001 (CC0), and the bakes were lit with the Poly Haven *Studio Small 09* HDRI (CC0). three.js 0.170.0 and lottie-web 5.12.2 load from CDNs, lazily. One small fix was made to `assets/motion/peel.js`: `measure()` now re-anchors a resting sticker when its size changes, so a peek no longer sweeps in from the wrong corner.
