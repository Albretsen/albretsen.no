# Morning Elevation

**The sun moves. Everything else is still.**

## Vision

Albretsen AS is one house. It is a perfectly symmetrical, peach-painted wooden building in a quiet square at seven in the morning, drawn as frankly as an architect's front elevation. Its four ground-floor windows are lit, and in each one stands a product that is in use today: MCP Emails, Fun Libs, Toolrails and Harbor. Earlier products sit behind closed louvred shutters, kept on record. Alpenglow mountains rise in the haze behind the house, and falu-red neighbours frame its edges.

The house carries the message without anyone writing it out: well proportioned, well kept, lit from inside, in no hurry. That is how Asgeir should come across: effective, reasonable and ambitious, with enough taste to leave the building alone and let the light do the work.

The hero is a framed plate, a matte painting built from real CC0 photographs (sky, mountains) and a three.js house dressed in CC0 photo textures. On desktop the live scene replaces the still at idle. On a phone it arrives the first time the sun is touched. Either way, the visitor can take hold of the sun and move the day: shadows swing and lengthen, the light warms, a clock in the corner keeps time, and at dusk the windows become the brightest things in the picture.

**Mood:** effortless elegance, early, unhurried, precise.
**Not:** a hotel, a travel brochure, a bakery. There are no place names or postcard clichés anywhere.

## Voice

Short and declarative, written in the third person on the home page. It never mentions the building: the metaphor stays visual.

- Hero: "Asgeir Albretsen builds software that earns its keep."
- Products: "Four products in use today. Seven earlier ones, closed and kept on record."
- Closed products: "Closed, each for a reason."
- Footer: "Takes one outside engagement at a time."

Banned: "hire me", "let's connect", "passionate", "our doors are open", and any literal house talk.

## Colour

| Name | Hex | Use |
|---|---|---|
| Linseed | `#f7f1e6` | page ground, trim, cards |
| Facade peach | `#f2b98f` | the house, large fields |
| Sunrise gold | `#f6c56b` | the sun, focus ring, live lamps |
| Ember | `#e48e5c` | the single accent (link hover, the mark's sun) |
| Pale sky | `#b9cfe3` | sky, cool sections |
| Shutter blue | `#9fbad0` / Louvre `#7f9db6` | shutters, status labels |
| Overcast | `#dfe3e6` | silver base light, rules |
| Falu red | `#8e3326` | neighbours only, used sparingly |
| Ink | `#2b2d3a` / Night `#1f2130` | type / the evening footer |

Symmetry is part of the palette: there is one accent, every axis is centred, and things come in pairs.

## Type

- **Italiana**: an Art Deco Didone, set in capitals only and tracked 0.3em. Used for the name, section titles, product names and figures (`$782`, `113,000+`). On load the name "settles", easing from wide tracking to its set width once.
- **Jost**: a geometric text face after 1920s Futura. Body at 400, labels at 500 in 0.2em uppercase eyebrows.
- **Monospace** (system) appears only for the one command line, `claude mcp add albretsen https://albretsen.no/mcp`.

## Motion

One variable, `--me-t` (0 is first light, 1 is evening), drives every animation. Scrolling advances it along a morning-heavy curve. Dragging the sun (pointer, or arrow keys on the focused sun) adds an offset that fades as you scroll on, so the hand is never overruled abruptly.

1. **Sun Arc**: the disc travels a dashed elliptical arc, which appears while you aim, as on the elevation drawing.
2. **Light Rake**: card and label shadows swing with the sun's angle and lengthen when it is low.
3. **Shutter Open**: each product window's louvred leaves fold back once, as it enters view (1.1 s, ease-out quint).
4. **Deco Settle**: the name is hung once.
5. **Lamplight**: window interiors warm up as the day goes on.

Micro-interactions follow the same rule of light rather than movement. Hovering a window in the plate lights its frame and raises an enamel label. Product frames lift 4 px and their lamp warms. A lamp dot glows once when a live event arrives. The copy button rolls "Copy" up into "Copied". Link underlines draw in the direction of travel. Under `prefers-reduced-motion`, scroll stops driving the day, the shutters start open, and the sun still moves by hand, instantly.

## Sound

Off until asked for. The Sound button starts a Web Audio ambience synthesised in the browser, with no audio files: band-passed pink-noise wind, a far brown-noise sea, birds that are busiest at first light, and a rare distant bell. It follows the sun (birds at dawn, more wind at dusk) and suspends when the tab is hidden.

## Mark

**The pediment A** is a capital A drawn as a classical gable. Its crossbar is the horizon, and a half sun rises beneath the apex. It works at 16 px as a favicon on a peach tile. The wordmark sets ALBRETSEN in Italiana beside AS in Jost.

## Live feed

Each lit window has a pulse line ("agent drafted a reply, 2 min ago") fed by the live event stream. The plate's lower-left corner carries the latest event across all products. Harbor is paused, so its lamp is shown cold and the line reads "Resting".

## Extending to the blog and product pages

- **Blog index:** the elevation drawing (`assets/extras/elevation-drawing.svg`) is the masthead, with the sun disc placed on its dashed arc by publish date: older posts sit at dawn and newer ones further along the day. Posts are listed as a single centred column of Italiana titles with Jost dates, separated by the fanlight divider.
- **Blog post:** a linseed page with a 34em Jost measure and Italiana headings. Cover images are graded like the plate: real photographs (the Røros street, the cabin window) warmed into the sunrise palette, with linen grain. The day advances as you read, so a long post ends in lamplight.
- **Product pages:** each product opens on its window close-up (`assets/products/window-*-1200`), with the shutters folding back on load. Below it come the figure in Italiana, the facts as a quiet list, the live pulse line, and a single link out. Each product keeps its own real logo and colours inside the window. The house supplies only the frame.
- **Retired products:** a closed-shutter tile with a one-line reason written by Asgeir, never invented.
- **Dark mode:** the dusk plate with a Night ground and linseed type. The windows become the light source.

## Inspiration

- Library of Congress Photochrom travel prints: hand-graded colour on real photographs. https://www.loc.gov/pictures/collection/travel/
- Chateau Marmont: one framed image, very few words, the name set quietly large. https://www.chateaumarmont.com
- Rauno Freiberg on interaction craft (interruptibility, responsive gestures, fidgetability), which shaped the drag-the-sun control. https://rauno.me/craft/interaction-design
- Airbnb Luxe: framed architectural photography and generous space. https://www.airbnb.com/luxury
- Emil Kowalski on animation: ease-out, short durations, interruptible, transform and opacity only. https://emilkowal.ski/ui/great-animations
- MDN scroll-driven animations and view timelines. https://developer.mozilla.org/en-US/docs/Web/CSS/view-timeline

Asset sources and licences are recorded in `assets/ASSETS.md`. All photographs are CC0 (Wikimedia Commons), the textures are CC0 (ambientCG), the fonts are SIL OFL, and three.js is MIT.
