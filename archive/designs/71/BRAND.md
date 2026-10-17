# Winter Pavilion: brand book (design 71)

## Vision
A pink deco pavilion stands alone and centred in a real, photographed snowfield. Golden cliffs rise behind it, and a rooftop sign spells ALBRETSEN. The visitor can drag the sun. As it goes down, the snow turns pink, the sign and windows come on, and the scene settles into a blue night with a moon and a few slow flakes. That sunset is also the site's switch from day theme to night theme.

The picture is a technology company's house: a quiet place where things are made. It borrows Wes Anderson's frontal symmetry and miniature-set precision, California's golden hills, ranch-modern roofs and coastal light, and Nordic understatement: one building, one sun, no slogans in the frame. It quotes none of them literally.

**Why it fits Albretsen AS.** The craft carries the claim. The hero is a WebGL compositor that relights real photographs in real time, and the baked still it replaces matches it pixel for pixel. The sun scale is honest: at 59.9° N the midwinter sun climbs to only 6.6°, so the readout shows true solar altitude and afternoon solar time ("Night · Sun −4.8° · 15:42"). That is the kind of detail a careful engineer adds without mentioning it.

## Homepage (this build)
1. **Hero.** A full-bleed matte painting under a symmetrical bar with Products on the left, the mark and wordmark in the centre and the day/night switch on the right. A title card sits in the sky: ASGEIR ALBRETSEN in spaced capitals, which warm up letter by letter and glow like the rooftop sign at night, over one serif line, *Software that keeps its own lights on.* Along the bottom: the sun reading, a "Drag the sun" hint and one quiet line from the live feed. On the right edge, a thin altitude scale mirrors the sun.
2. **Products.** On desktop this is a tracking shot: the page scrolls down while the camera dollies sideways past four postcards on one horizon line. Each postcard shows the product's own pastel building with its real logo on the sign, an enamel status plate (*Open*, *Under construction*, *Closed for the season*), the line, the figure and the facts from `content.js`. On phones, and under reduced motion, the postcards form a calm centred column or grid.
3. **Closed, with thanks.** Retired products appear as enamel plaques. Luma's plaque carries its real logo.
4. **For agents.** The ground-station scene, a pastel dish listening to the sky, with the `claude mcp add` line in an ink pill and a copy button.
5. **Footer.** A perforated stamp, *Takes one outside engagement at a time.*, the email address and an opt-in sound toggle.

## Voice
Deadpan, exact, understated. Sentences are short and concrete, as on a well-made sign. Numbers come only from `content.js`. No exclamation marks, no "passionate", no calls to hire or connect.

- Hero: *Software that keeps its own lights on.* The line plays on "pays for itself" and on the sign lighting up at dusk.
- Status plates: *Open · since 2019*, *Under construction*, *Closed for the season*.
- Retired: *Closed, with thanks.*

## Colour
| Token | Hex | Role |
|---|---|---|
| Flamingo | #EE8FA6 | the sun, focus rings, accents (decoration and large type only) |
| Accent text | #C9577A | links on Snow (4.6:1) |
| Mint | #A6DCC6 | "open" lamps, the feed dot |
| Sky | #9CC8EA | "paused" lamp, marks |
| Snow | #FBF7F2 | day background |
| Sunlamp | #FFE3B0 | the sun dot, night links |
| Ink | #22304F | day text, the mark |
| Night | #18223F | night background |

Day uses Snow and Ink. Night uses Night and Snow, with Sunlamp for links. Hero type turns to Ink when the sun is high and the sky pale (`data-sky="bright"`).

## Type
- **Jost 500, uppercase, tracked .32–.5em.** The signage voice: names, headings, the wordmark.
- **Instrument Serif Italic.** The spoken line: one statement per screen, plus product lines and figures.
- **IBM Plex Mono.** Instruments: readouts, facts, the MCP command, labels.
All three are self-hosted woff2 under the SIL OFL. Jost and the serif italic are preloaded.

## Motion
Slow, frontal and settled, like a camera on a dolly rather than an animation library.
- **Sky Dial:** drag the sun or use the arrow keys (Shift for larger steps). The scene relights live.
- **Lens Shift:** the hero layers drift by depth as you scroll, kept within the plate's overscan.
- **Iris:** the switch runs as a View Transition that opens night from the button.
- **Tracking Shot:** the products glide sideways while you scroll down. A dot on a short line shows progress.
- **Sign Warm-up:** the name lights one letter at a time, and at night it glows.
- **Snow Hush:** a few flakes in the hero, at night only.
Everything is disabled or made static under `prefers-reduced-motion`.

## Sound
Off by default. "Sound: off" in the footer turns it on. When it is on, a soft two-note sine chime plays as the theme changes, rising for day and falling for night, and a single note confirms a copy. Nothing plays on load.

## Mark
An arched window with the sun on its horizon over three snow lines, in Ink, beside ALBRETSEN │ AS in spaced Jost capitals. In the header the mark's stroke uses `currentColor`, so it follows the theme. The favicon puts the mark on an Ink tile.

## Extending to the blog and product pages
- **Blog index:** a short street of small cut-out buildings (`extras/pavilion-cutout.webp`) on a horizon line, with one post per facade. Dates appear in Plex Mono and titles in Jost capitals with a serif italic deck.
- **Post pages:** Snow paper at a 68ch measure with Jost body text. The cover image is a crop of the scene at the time of day that suits the post's mood, so a reflective essay gets night and a launch note gets pink hour. Pull quotes sit on the deco fan tile at 9% opacity. The stamp closes every post.
- **Product pages:** each product's building becomes its hero, with the same Sky Dial technique if its layers are exported, otherwise its still. The status plate sits under the frame, and the facts appear as a quiet instrument row in mono. The product's own brand colours stay inside its sign. The house frame never recolours them.
- **New products:** a new pastel building in the same snow, with its real logo on the sign. The street just gets longer.
- **Night everywhere:** the theme starts from the system preference. Every page has a night version, and the sign glows.

## Performance and accessibility
- The hero still is a responsive `<picture>`: AVIF, WebP or JPEG, with a 9:16 phone frame and a night variant for dark-mode visitors. Every image has width and height set, so layout shift is 0.
- Sky Dial (12 KB plus about 236 KB of layers) loads after the `load` event on idle and fades in over the matching still. Without WebGL2 the still stays, and the switch swaps between the pink-hour and night stills.
- Product images and plaques load lazily. The initial transfer is HTML, CSS, JS, two preloaded fonts and the hero still.
- The hero canvas is an ARIA slider with value text. The page has a skip link, visible focus rings and value text on the slider (Pink hour, Night and so on). The layout works from 320 to 2560 px.
