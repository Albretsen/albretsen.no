# Front Light · Albretsen AS (design 75)

## Vision
**The last minute of the day, held still.** A real Norwegian fjord, photographed around 1895 and graded into one amber family. The sun sets into the gap between two sheer cliffs. The name ALBRETSEN stands in the valley: it crosses the dark near cliff and sinks behind the sunlit far mountain, so the company literally sits inside the landscape. The air above the horizon shimmers (WebGL heat haze), and the name drifts a few pixels with the pointer.

Below the fold, the company is a front desk. The desk is precise and pastel, with one key per product. Taking a key deals that product's postcard onto the desk. The real logo is on the stamp and one honest number from `content.js` is on the postmark. Turn the card over to read the back: the product in one handwritten line, its facts, the address it lives at, and when it started.

The hotel is never said out loud. It is carried only by objects (keys, postcards, a ticket, a luggage label), and the copy stays about software. This is atmosphere, not costume. It uses golden-hour light, scale and silence, and Wes Anderson symmetry and restraint, with no place names, no postcard clichés and no travel language.

**Why it fits:** quiet confidence. The page says very little, and every word is specific. The craft shows in the light, the pixel-aligned layering, the stamp perforations and the way things move. It never shows in volume.

## Page (index.html)
1. **Hero:** the landscape and the name, with one serif line ("Quiet software that pays for itself."), one mono caption and a single live-feed line at the waterline (`_shared/feed.js`). Nothing else.
2. **The desk:** the key rack (`assets/interactive/keyrack.js`) next to a large postcard. A key selects. Hovering, focusing or pressing *Turn over* flips the card (3D, 1.1 s settle curve), and the postmark strikes on the back. The caption carries status, URL and figure.
3. **The turn:** NASA's ISS photo of the sun over Earth's limb, captioned "The same sun, from 400 km". The image settles from 112% to 100% as it scrolls in.
4. **Cancelled:** retired products as cancelled stamps. Hover or focus lifts a stamp and reveals its year and line.
5. **Notes:** blog posts, each with a rising sand-coloured fill on hover.
6. **Close:** a ticket carrying `claude mcp add albretsen https://albretsen.no/mcp`, where the stub is the copy button and tilts like it is being torn. Next to it is a luggage label with the email and "Takes one outside engagement at a time." It swings on hover.

## Colour
One hue family, OKLCH hue 44–83, cream to burnt umber. The photographs are gradient-mapped through the same ramp, so the imagery and the UI share one light.

| Token | Hex | Role |
|---|---|---|
| linen | `#FBF3E4` | page, paper |
| sand | `#F4DDB4` | cards, hover fills |
| peach | `#F2CDA8` | the desk, the ticket |
| apricot | `#EDBB7C` | light on dark |
| amber | `#DC9447` | the sun: **one accent per screen** |
| copper | `#B8662F` | links, rules, postmarks, "AS" |
| sienna | `#7A3D1F` | secondary ink, the voice |
| umber | `#3D2013` | primary ink |
| night | `#1C0E07` | dark sections |

## Type
- **Jost** (variable): signage capitals, tracked .2em in the hero and .3–.42em for labels. Body text at weight 400.
- **Instrument Serif Italic:** the voice, used for one line per screen and the backs of cards. Never body copy.
- **IBM Plex Mono:** facts, figures, commands, dates and the live feed.

## Voice
Short, declarative and specific. Numbers come only from `content.js` and are never rounded up. No "welcome", no "passionate", no calls to hire.
> "Four keys on the board. Each one opens something that runs."
> "Small company. Long view."
> "Earlier work, retired with thanks."

## Motion
Slow, warm, never bouncy. Named studies in `assets/motion.css`:
- **First Light:** the name rises out of a blur.
- **Heat Haze:** the air shimmers above the horizon.
- **Key Swing:** a damped pendulum.
- **Postmark:** a stamp strikes and lands off true.
- **Long Shadows:** card shadows lengthen with scroll progress, as the sun sets.
- **Deal:** a new postcard is set down from slightly above and to the left.

Under `prefers-reduced-motion` everything resolves to a still frame, and flips become instant.

## Sound
Silent unless the visitor opts in. The opt-in layer is a soft brass tick when a key is taken and a dry paper flip when a card turns, nothing ambient.

## Mark
An **A drawn as a peak**: its crossbar is the horizon, and a half sun rests on it. The wordmark is spaced Jost capitals with **AS** in copper. The favicon puts the mark on a linen tile.

## Extending it
- **Blog:** each post is a postcard. The cover is a graded photograph from the same ramp (lake, village and orbit are already in the kit), with the title in Jost capitals on the front and the date as a postmark. The article page is linen paper with a 68-character column in Jost 400 at 1.6, Instrument Serif for the standfirst and pull quotes only, and Plex Mono for code on a sand block. The index is the "Notes" list.
- **Product pages:** the hero is the product's own postcard at full width, flipping to its back on scroll. The page body is the "address side": facts in mono on ruled lines, the real logo on a stamp, and one amber call to action per screen (its URL). Retired products get a single cancelled-stamp page with the reason Asgeir writes.
- **About:** use the village photograph and the three postmarks (2016, 2019, 2026) as a timeline that strikes as you scroll.
- **Rules that carry over:** one idea per screen, amber once per screen, real imagery only from the graded ramp, every number in mono.

## Credits
Photographs: Library of Congress Photochrom Print Collection (no known restrictions) and NASA ISS040-E-080833 (public domain). Fonts: Jost, Instrument Serif and IBM Plex Mono (SIL OFL). Product logos are the real assets from `_shared/products`. Full inventory: `assets/ASSETS.md`.

Research note: the web-search budget for this run was used up by the time this design was built, so research relied on the kit's reference list and a fetch of Chrome's scroll-driven animations guide.
