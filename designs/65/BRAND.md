# Clear Noon — Albretsen AS

## Vision

A Norwegian valley under a hard Mediterranean noon sun, with white light, deep blue shadows, granite and snow. The colour system has a single accent: a falu-red road.

The site is about a software company. The landscape is the light it is seen in, not the subject. Everything on the page is real: NASA orbital photographs, a Copernicus elevation model, the actual product logos and the actual numbers. That is the source of the awe. The restraint carries the taste: one idea per screen, a lot of sky, and nothing that shouts.

- **Hero.** Three crops of an ASTER orbital photograph of fjords, regraded so the water goes granite-black, cross-dissolve slowly (Noon Dissolve). ALBRETSEN is set huge in the dark water and rises letter by letter once. A thin red rule follows. Below a hairline sit the MCP install line (one click copies it) and a single live event line from the feed, which dissolves to the next event no faster than every 2.6 s. A caption names the current frame, the way a photo book would. On phones, a MODIS portrait of the whole coast replaces the frames.
- **Products: four houses on one street.** Each live or building product is a painted wooden house with its real logo on an enamel sign, in front of a mountain skyline computed from the elevation data. Hovering or tabbing to a house lights the windows, puts the figure in gold leaf on the glass and opens the door. A noon shutter shadow drifts across the card. The red rule under the figure extends, and the facts come up to full ink. Harbor is paused, so its shutters stay closed until you look. Retired products appear as enamel house-number plates, and each one reveals its line on hover.
- **The road.** The timeline is a 26.7 km least-cost path along a real valley floor. It draws itself as you scroll, and milestone posts fade in after it. Moving the pointer over the relief opens a soft lens onto the 100 m contours underneath. On large screens you can lift the plaster 3D model (three.js, loaded only on request): the sun follows the pointer, and scrolling or the Drive slider moves the camera along the road.

## Voice

Calm, exact and unhurried. It states what is true and then stops. Numbers come only from `content.js`. Place names never appear (credits live in the footer), and it never asks for anything.

- "Quiet software, built to pay for itself."
- "Retired, not forgotten."
- "Takes one outside engagement at a time."

## Type

- **Antonio** (OFL), a condensed poster face. Set it in caps and track it +0.03 to +0.12em. Use 400 for the name, 500 for headings and 600 for figures.
- **Alegreya Sans** (OFL), a humanist sans for text, at 18–20 px with 1.5 line height. Eyebrows are 11–12 px, 500 weight, tracked 0.22em, in caps.
- The system monospace is used only for the MCP command.

Both faces are self-hosted from `assets/fonts/` with `font-display: swap`. The display face and the text face are preloaded.

## Colour

| Token | Hex | Use |
|---|---|---|
| Granite | `#1b232b` | ink, night water, footer |
| Slate | `#39434b` | secondary text |
| Glacier deep | `#3f6274` | eyebrows, links |
| Glacier | `#9fbdcc` | shadow side of snow, detail on dark |
| Snow | `#f4f1ea` | page (on procedural paper) |
| Stone | `#e9e6df` | wells, road section |
| Moss | `#5f6b46` | "live" status |
| Falu | `#8e2a1e` | the road; the single accent (`#c4553f` on dark) |
| Ochre | `#c48a2c` | houses, "building" status |
| Gold leaf | `#c9a24a` | hover reveals only |

## Motion

All motion uses one easing, `cubic-bezier(.2,.7,.2,1)`, a long settle like a shadow coming to rest. Nothing bounces.

1. **Noon Dissolve.** Stacked photographs; the incoming frame fades in over the outgoing one in 2.4 s and holds for 7 s. Drift runs on its own timeline. The dissolve pauses off-screen and in hidden tabs.
2. **Condensed Rise.** The name rises out of a baseline mask with a 45 ms stagger, once per page. Then the red rule extends.
3. **Road Draw.** The road draws with `pathLength=1`, scroll-linked through `animation-timeline: view()`, with an IntersectionObserver fallback.
4. **Relief Lens.** A soft radial mask eases toward the pointer and reveals the contours.
5. **Shadow Swing.** On hover, cards lift 3 px and their hard offset shadow swings to the other side.
6. **Window Light.** Lit panes, gold-leaf figures, an opening door and folding shutters.

With `prefers-reduced-motion`, the frames stop on the first photograph, the letters and the road appear in place, and every transition becomes instant.

## Sound

Silent by default. If sound is ever added, it is opt-in: a quiet bed of wind over snow, and a dry wooden latch when a house door opens. Nothing more.

## Mark

A condensed peak "A" with a falu-red road crossing its counter, paired with ALBRETSEN outlined from Antonio 480 and tracked +0.12em. The favicon tile inverts in dark mode. A 180 px touch icon and a 1200 × 630 Open Graph image (the wordmark in the fjord) complete the set.

## Extending the direction

- **Blog.** Posts sit on snow paper in a single 34em column of Alegreya Sans at 20 px. Titles are in Antonio caps. Each post gets a cover cut from the kit: a Library of Congress photochrom plate regraded to granite (valley road, mountain wall, fjord cliff) or a crop of the noon relief. The cover cross-dissolves from its contour drawing to the photograph on load. Dates use Antonio figures in glacier deep. The red rule marks the reading position as a thin progress line at the top. Code blocks are granite with snow text, and nothing else is coloured.
- **Product pages.** The product's house opens the page large, already lit (`house-*-revealed.svg`), with the door open. The figure sits in gold on the glass, and the product's own logo and colours take over below the fold, because the house is only the doorway. Sections follow the main-street rhythm: one idea per screen, a hard noon shadow under every screenshot, and facts set in the same "— fact" list.
- **About.** The road section becomes the whole page. The 3D model is the hero, and the scroll drives the camera from 2016 at the fjord head to today in the foreground, with the day job and consulting as posts along the way.
- **Rules that carry over.** Real imagery only. Never name places in the copy. Use one red accent per screen and gold only on reveal. Every image gets width and height, and heavy things (three.js, SVG houses, later frames) load after first paint.

## Performance

- First paint: about 170 KB for the AVIF hero on desktop (about 90 KB on mobile), plus two preloaded fonts (about 44 KB), CSS and the motion helpers.
- The second and third hero frames load only after the `load` event, and only on wide screens.
- The houses start as 20 KB WebP images and are swapped for the live SVGs 600 px before the street enters the viewport.
- three.js r160 and the 454 KB heightmap load only when the visitor presses "Lift the model".
- Every image has width and height or an aspect ratio. The live feed line has a fixed height, so layout shift is 0.

## Files

- `index.html`, `css/site.css`, `js/site.js`: the page.
- `assets/`: the art director's kit (see `assets/ASSETS.md` for sources and licences).
- Review hooks: `?flat` fixes the hero at 900 px for tall captures, and `?demo` lights the first house and lifts the model.
