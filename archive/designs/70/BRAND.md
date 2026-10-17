# Stucco Hour

*Albretsen AS · brand direction 70*

## Vision

The site is a whitewashed room photographed in low, long light, and the light is real. When you open albretsen.no, the room is lit the way the sun over Norway is lighting the world at that moment: midday white, golden hour, blue hour with the last orange over the sea, or night. A thin horizon under the room carries a live sky and today's arc of the sun. Pick the sun up, drag it along its path, and the room goes from dawn to dusk under your hand. Let go and it stays; "Back to now" walks it home.

Most of the page is still. That stillness carries the brand: one room, one idea, plenty of plaster. The technical work is all there (a path-traced room, a Rayleigh/Mie/ozone sky in a shader, an almanac solar model), but it never shows itself as technology. It shows up as light that is correct.

Why it fits Asgeir: it reads as effective and reasonable (quiet, fast, no noise), with ambition you notice only on a second look, when you realise the sky is today's sky. The warmth (sun-bleached plaster, terracotta, sage shutters, one flowering vine) is a mood, not a destination. The subject stays his software.

## What the homepage does

1. **The room.** The kit's terrace plates, chosen before first paint by an inline almanac calculation. `Albretsen` is painted on the plaster above the arch: multiply in daylight, a pale screen-blended lime at night. "Quiet software that pays for itself." lies in the light on the floor. A stage element keeps the plate's aspect and stays centred on the arch, so the painted name sits on the same patch of wall from 320 px to 2560 px.
2. **The horizon.** A full-width strip running `assets/interactive/sky.js` with a sea horizon. Over it sits today's sun-elevation curve (solid above the horizon, dotted below) and a poppy sun on the current minute. The sun is a real `role="slider"` (arrows ±10 min, Shift ±1 h, PageUp/PageDown, Home/End, Escape for now). The room crossfades between plates only near a change of phase, so a still page never shows two suns. The other plates load only once the page is idle.
3. **Products, set into the wall.** Each live product is a path-traced niche with its real icon as a glazed plaque, each at its own hour: MCP Emails in morning louvres, Fun Libs at noon, Toolrails at golden hour, Harbor at dusk because it is paused. The niches open through the kit's Arch Reveal, and a slow Light Leak follows the pointer. Retired work is a quiet list of small arched tiles, and Luma keeps its real logo.
4. **The close.** The house front in morning light, with the availability line and email set in its sky.

## Voice

Unhurried and literal. It says what exists, gives the number and stops. There are no superlatives, no calls to action and no "passionate".

- Hero: *Quiet software that pays for itself.*
- Section: *Set into the wall, each at its own hour.*
- Status words come from the light: live · morning, building · golden hour, paused · dusk.
- Availability: *Takes one outside engagement at a time.*

## Type

EB Garamond (SIL OFL), self-hosted, a variable Latin subset. Display text is set at 430–470 with slightly negative tracking. Body text is 18 px on a 1.55 line height. Labels are uppercase at 12–13 px with 0.2 em tracking. Prose uses old-style figures, and stat rows use lining tabular figures (`$782`, `113,000+`). Commands appear only in the system monospace.

## Colour

| | Hex | Use |
|---|---|---|
| Lime | `#F6F1E8` | page, plaster (with the lime-wash texture) |
| Sand | `#E9DCC6` | buttons, tiles |
| Dune | `#CDB48E` | hairlines |
| Poppy | `#E4572E` | the sun, once per screen |
| Terracotta | `#B5603A` | links, live status, the italic line of a heading |
| Sage / Sage deep | `#8E9D80` / `#5F6F58` | labels |
| Sky / Sky deep | `#A9C7DB` / `#4F7FA3` | paused status, cool fills |
| Ink | `#2A2420` | text |
| Dusk | `#1C2433` | night ground |

At runtime `sky.js` writes `--sky-zenith`, `--sky-horizon` and `--sun-color`. The page uses them for the horizon's fallback gradient and its text halo.

## Motion

The rule of the house is that **the sun moves and everything else is still**.
- *Slow Dawn:* on load the shutters open, a dusk veil lifts over 2.4 s, and the name and line appear by exposure only.
- *Heliotrope:* the sun on the horizon, live to the minute and draggable.
- *Long Shadow:* a louvred light patch leans across the products section as it scrolls (CSS `animation-timeline: view()`, with a JS fallback).
- *Arch Reveal* and *Light Leak* on the niches. Link underlines draw in like light along a sill.
- `prefers-reduced-motion` removes the dawn, the reveals, the pulse and the walk home. The sun can still be moved, and the room changes without a fade.

## Sound

There is none. If sound is ever added, it stays opt-in: one soft tile tap on copy.

## Mark

The mark is an arch that is also an A. Its crossbar is the horizon, and a poppy sun rests on it. The header draws it in `currentColor` so it can be painted over the room. The favicon follows dark mode.

## Extending it

**Blog.** Each post is a room at an hour. The cover is a crop of a kit plate (or a new render from `assets/src/render.html`) chosen by the post's publish time, so a post written at 22:40 has a blue-hour cover. Titles are set at display size on lime plaster, and the measure is 62 ch at 19/30. Old-style figures appear in the text. Pull quotes are italic terracotta. Code blocks sit on sand with the system monospace. The horizon strip can run as a 4 px rule at the top of every article, coloured by `--sky-horizon`.

**Product pages.** Each product page opens on its niche, full-bleed, at its own hour. MCP Emails stays in the morning, and Harbor stays at dusk until it ships again. Facts run as one stat row of lining figures under a hairline, and the product's own logo and colours stay inside the plaque, never in the frame. A product moves to a different hour when its status changes. The changelog uses the bougainvillea garland as its only ornament.

**Rules that keep it calm:** one image idea per screen, poppy only for the sun, no place names or postcards, no motion that is not light, and every image sized in advance so the layout never shifts.

## Inspiration and research

The research is in the kit's `assets/ASSETS.md`: Awwwards Sites of the Day (Milledollars, twks, Maria Vasilyeva, Neutomni), the Awwwards "Time of Day Adjustment" archviz, Jacquemus, Airbnb Luxe, The Met's botanical watercolours, D'Ora Tokai's White Arcade, Nishita sky scattering and scroll-driven day-to-night CSS demos. Web search was unavailable while this page was being built (the shared search budget had run out), so the interaction work relied on those documented references plus established patterns: Linear- and Vercel-style spotlight cards recast as sunlight, and ARIA slider semantics for the draggable sun.

## Files

- `index.html`, `css/site.css`, `js/main.js`: the page.
- `assets/`: the Stucco Hour kit (renders, sky, motion, identity, fonts; see `assets/ASSETS.md` for sources and licences).
- Previews: `?t=2026-10-17T20:30:00Z` pins the clock, and `?only=products` or `?only=contact` shows a single section.
