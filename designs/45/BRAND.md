# Drift: brand book

*Albretsen AS / albretsen.no, design 45. The asset kit is in `assets/` (start with `assets/ASSETS.md` and `assets/preview.html`).*

## Vision

Time is a river, and the work rides it. The homepage opens on a live river of glossy soft plastic. It winds out of the distance at 2016, the year of Asgeir's first Google Play release, and reaches the viewer at 2026. Nine thousand beads ride the current and eleven pebbles float above it, one for each year. The 2026 pebble has a ring and a small moon in orbit.

Nothing is bolted down. Cards float toward the pointer, the plastic stickers in the margins can be thrown, and retired products rest as pebbles on the riverbed. The mood is a studio product shot: lots of air, one hue, and light doing most of the work. A visitor should come away thinking that the person who made this is precise and calm, ships constantly, and keeps only what earns its place.

The second motif is Ernst Haeckel's 1904 radiolarians. These microscopic glass skeletons were engineered with absurd care. We use them as archive plates toned teal, and we also rebuild them as procedural 3D lattices in the same plastic. Together they say "precision at small scale" without our having to say it.

## The homepage

1. **Hero: the river.** The live three.js particle river (`assets/3d/river.js`) loads after first paint. Until it arrives, a baked still with the same camera stands in, and it stays for reduced motion. The pointer stirs the water and a click sends a ripple; both run on springs. Year pins follow the 3D pebbles as plain HTML.
2. **The tide scrubber.** Along the bottom of the hero is a draggable pebble on a dotted current. You can drag it, throw it (the release velocity is projected forward before it snaps), or use the arrow keys, Home and End. A glass card settles in with what entered the river that year. All of it comes from `content.js`: launches by `since`, the first Play release, consulting and the company. Years with nothing on record say "Quiet water. No launches on record." We invent nothing to fill them.
3. **Surfacing now.** The live feed. Events rise into a three-line list on a buoy spring, with an opt-in droplet sound.
4. **Products: "Four things afloat".** Studio renders with each product's real logo printed on a plastic tile, in an asymmetric bento. Each card floats toward the pointer (Buoy), catches a moving softbox light (Gloss), and carries a pointer-led highlight. The figure is set in the display serif. Four plastic stickers float in the margins as physics bodies: grab one and fling it, and it bounces off the section edges and drifts home on a weak spring. When the tide turns, they all get a kick.
5. **Haeckel band.** The procedural radiolarian, with scroll-driven parallax (`animation-timeline: view()`). At night the render is inverted into the dark palette.
6. **Riverbed.** Retired products rest as pebbles in a render, over a toned Haeckel plate. Each opens a popover that settles on a spring. Stand-in icons are labelled as stand-ins.
7. **Writing.** Birket Foster's 1858 "In Thy Stream" engraving in an arched frame, beside the post list.
8. **Footer.** Flow-line streamlines (an SVG mask tinted with the accent), the availability line in the display serif, and the email on a magnetic pill.

## Signature delight: the Tide turn

The theme switch (`<tide-switch>`) is a glass capsule with water and a pebble in it. At night the pebble sinks and glows, and the water rises. While that happens:

- a wavefront rises across the whole page (a View Transition whose clip-path keyframes are sampled from the spring);
- a chorus of beads rides the wave up the screen. It is a 2D particle burst on its own `view-transition-name`, so it draws above both snapshots, and some beads spill out of the switch itself;
- the live river glides to its night palette (emissive beads, glowing ring and moon);
- the floating stickers get a kick and bob back;
- with sound on, a four-note droplet chord rises (day) or falls (night).

The choice is remembered per visitor. `#theme=dark` or `#theme=light` in the URL forces a theme for sharing and screenshots.

## Palette

The page uses one hue, OKLCH 180, in twelve depths from `teal-50` to `teal-990`. All tokens are in `assets/motion.css`. Contrast comes from depth, never from a second hue. The product logos keep their own colours, and they are the only other colours on the page. Day uses a `teal-100` page with `teal-900` text and a `teal-500` accent. Night uses a `teal-990` page with `teal-50` text and a `teal-300` glow.

## Type

- **Instrument Serif Italic** for headlines, figures and the availability line. It is the one soft voice: set large, with -0.015em tracking.
- **Geist** 300 to 500 for text, at 15 to 19px with a line-height of 1.6.
- **Geist Mono** 500 for labels, years and code: uppercase, +0.09em tracking.

## Voice

Calm and exact, with river words used sparingly ("downstream", "settled", "surfacing") and never cute. It states what exists, gives the real number and stops. It never sells: no "hire me", no "passionate", no calls to connect. Examples:

- "Ten years downstream of a first Android app."
- "Four things afloat, each with its own weight."
- "What settled." (for retired products)

## Motion

One hand-written spring (`assets/motion.js`) with four presets: weightless, buoy, tide and settle. JS uses the spring directly. CSS uses `linear()` easings sampled from the same presets, so both move alike. Popovers and the year card use a spring version of Radix's `data-state` enter and exit, called `settle()` in `js/site.js`, which scales from the anchor with lift and blur. With `prefers-reduced-motion`, the river stays a still, the springs jump to their targets, the floaters stop bobbing and nothing loops.

## Sound

Off until the visitor presses the speaker. Everything is synthesised with WebAudio, so no files are loaded. A droplet is a sine that falls in pitch with a 300 ms tail. Ripples, year changes, copy, live events (pitched per product) and the Tide turn chord each use one.

## Mark

`assets/identity/mark.svg` is a single-storey "a": the bowl is a bead, the stem flows out into a current, and one small bead floats free. It comes in glossy and mono versions. The wordmark is Geist 400, outlined to paths. The header swaps between the light and dark lockups with the theme.

## Extending the direction

- **Blog index.** Open on `hero/radiolarian` as a calm still rather than the river. List posts as pebbles in a single column, with the date in Geist Mono on the right. Use the Haeckel specimens (`extras/specimens/*`) as section markers, a different organism per tag.
- **Blog post.** A narrow column (about 64ch) in Geist 18px on `teal-100`, with headings in the italic serif. Figures get the arched frame used for the engraving, and code blocks sit on `teal-950` glass. At the end, a small `object-chorus` sticker floats above the next and previous links. Reading progress is a single bead travelling along `current-lines.svg` at the top of the page (`animation-timeline: scroll()`).
- **Product pages.** Each product's render becomes its hero, lit in the same studio, with the product's own logo and colours untouched. The facts from `content.js` follow as glass chips. A short "in the river" strip reuses the tide scrubber, scoped to that product's history. Retired products get a single riverbed pebble and their one-line reason once Asgeir has written it.
- **Errors (404).** The river runs dry: the flow lines alone, with one pebble you can throw.

## Assets used on the homepage

These are the river stills (day and night), the live river, the radiolarian render, all four product renders, the retired riverbed render, the stand-in icons, all four plastic stickers, two specimens, both Haeckel plates, the Birket Foster engraving, both caustics tiles, the grain tile, the flow lines, the lockups, the mark, the favicon and the OG image. Sources and licences are listed in `assets/ASSETS.md`. Nothing new was downloaded for the page itself.

## Research notes

I read the Radix animation guide (data-state enter and exit; content stays mounted during the exit) and Chrome's guide to scroll-driven animations (`view()`, `animation-range`), and looked at paco.me for its restraint. The web search quota for this run was used up before I could make the full set of searches, so the rest of the interaction design builds on the references the kit had already gathered (Active Theory, Rive community toggles, Maxime Heckel's spring physics, Magic UI's view-transition theme toggler).
