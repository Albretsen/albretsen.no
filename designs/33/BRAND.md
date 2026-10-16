# Uranographia: brand book (design 33)

## Vision
Albretsen AS is drawn as a star atlas of working software. Every product is a constellation, and each one is built from a real number in `designs/_shared/content.js`:

- MCP Emails: 17 stars for 17 tools.
- Fun Libs: 113 cluster stars for 113,000 installs.
- Toolrails: 4 bright feeders for 4 connectors.
- Harbor: 549 grains of dust for 549 commits.

Retired products are not hidden. They stay on the rim as *constellationes obsoletae*, the way 17th-century atlases kept the figures astronomers had stopped using. That reads as honest and long-running.

The hero adds the one thing a printed atlas cannot do. Every live event from the products (`_shared/feed.js`) falls into its constellation as a meteor and leaves a new faint star behind. While you read, the sky grows, and a counter in the observation log says how many stars arrived since you came. Visitors see the volume of work rather than being told about it.

A second reading of the same stars (Sky/Ledger) turns the chart into a dated catalogue. The art is the data, and the data is the art.

## Voice
Calm, exact and catalogue-like, with editorial gravitas. Numbers carry the boast and adjectives don't. Latin figure names are the only ornament.

- "Seventeen stars for seventeen tools."
- "Seven retired figures, kept on the chart."
- "Someone has to hold up the star."

The site never says "hire me", "let's connect" or "passionate". The footer states availability as a fact: *Takes one outside engagement at a time.*

## Colour
There are eight greys, all tinted toward hue 312 in OKLCH:

| Token | Hex |
|---|---|
| Night | #0b090c |
| Deep | #141215 |
| Slate | #221f24 |
| Rule | #3f3c41 |
| Dim | #737076 |
| Haze | #aca9ae |
| Vellum | #eceaee |
| Paper | #f8f6f9 |

The interface itself never uses colour. Colour comes only from imagery: Cellarius's hand-colouring behind the globe, Haeckel's stained radiolarians, and the products' own logos inside the plate lenses. If a section needs colour, it gets a plate, not a fill.

## Type
- **Instrument Serif** for display and figure names. Lines are tight (.92), and the italic second clause is set in Haze.
- **Geist** Light for reading text.
- **Geist Mono** in tracked uppercase for every number, catalogue label and credit line.

## Imagery
All imagery is public domain and every piece is credited on the page. Inventory and sources are in `assets/ASSETS.md`.

- E. L. Trouvelot's pastel plates (NYPL), regraded to the grey ramp: Orion as the hero ground, Hercules on phones, the Meteors in the footer.
- Cellarius's *Harmonia Macrocosmica* hemisphere, turning once every four minutes behind the globe.
- Three Haeckel radiolarians (BHL scan), drifting through the products section on a scroll-linked ViewTimeline.
- Beardsley's *The New Star*, holding up the colophon.

## Motion (Web Animations API)
- **Ignition** is the loader. Dust falls under gravity into the asterism, fractured lines morph whole, and a real 716-star counter runs. Then the night collapses into the apex star. It is tied to real readiness (fonts and the hero plate decoded), lasts 2.3 s minimum and 6 s maximum, and Esc or a click skips it.
- **Gravity.** The pointer is a mass: chart stars lean toward it on a spring. A lens ring follows the pointer and brightens the plate beneath it, reading out a sky coordinate.
- **Meteors.** A live event becomes a dash travelling down a vector with accelerating easing, then an impact ring and a new star.
- **Plate rise.** Product plates surface from a hairline and unblur.
- **Lensing.** Plates tilt in perspective under the pointer with a moving glare. The lens ring around the logo turns on an overshoot curve, and the globe turns to face that product.
- **Ephemeris.** Catalogue entries open like a Radix Accordion, using a measured `--radix-accordion-content-height` and a mask sweep. The trigger star turns into a cross.
- **Reading and Seek** are Radix ToggleGroup-style switches with a sliding vellum pill on an overshoot curve. They support roving arrow keys.
- **Precession** (`motion.js precess()`) is reserved for page changes. It is a View Transition that rotates the whole sky 7° about the apex star.

Under `prefers-reduced-motion` the loader becomes a fade and the chart and globe hold still. Meteors become stars that simply appear, and the lens, tilt and drift are switched off.

## Sound
Sound is off until the visitor presses Sound. After that, each meteor that lands rings a soft sine bell with a faint inharmonic partial, pitched per product: MCP Emails E5, Fun Libs G5, Toolrails A5, Harbor D5. The tone stays quiet, short and rare.

## Mark
The **asterism A** is an A drawn as a constellation. The atlas lines stop short of the stars, the apex carries a four-point diffraction sparkle, and the crossbar runs on as a dotted vector to one more faint star. In the header the apex sparkle twinkles. Lockup, wordmark, ring seal, favicon and OG card are in `assets/identity/`.

## Extending to the blog and product pages
- **Blog.** The writing index is a star catalogue. Each post is one star on a year axis, titles are in Instrument Serif, and dates are in Mono. The post header is a cropped plate: the Cellarius full spread for essays, Trouvelot meteors for build notes. The body runs as a single 64ch column of Geist Light on Night, with mono figure captions and pull quotes in the serif italic. Footnotes open as Ephemeris accordions. Navigating between posts uses Precession: the sky turns 7° about the apex star.
- **Product pages.** Each product gets its own plate as the hero, and its constellation is redrawn live in SVG with the gravity interaction. The facts sit in a catalogue table in the Ledger reading. Live events for that product fall into its figure as meteors. The real logo stays inside the lens and is never recoloured. A paused or retired product keeps its page as an obsolete medal with an honest one-line reason.
- **Rules.** Colour comes only from imagery, numbers only from `content.js`, and figure lines always stop short of stars.
