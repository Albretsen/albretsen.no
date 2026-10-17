# Darkfield

*One glass slide you pan and zoom, with every product lit from the side.*

## Vision

Darkfield microscopy never lights the lens directly. Only what is really there scatters light, so the specimen glows on black. Albretsen AS is shown the same way: no backdrop and no claims, only the things that were made, each lit from the side.

The homepage hero is a single glass slide that never ends. It is laid out like a Victorian diatom arrangement:

- **The stone** sits at the origin. It is 24,000 grains of light sampled from a CC0 scan (Poly Haven `moon_rock_03`), and it stands for the company.
- **Four live specimens** (MCP Emails, Fun Libs, Toolrails, Harbor) form a cross around the stone. Each one is a "specimen slide" with the product's real logo, unaltered, and only facts from `content.js`.
- **Seven retired specimens** circle in the margin.
- **Museum plates** from The Met's open-access collection are landmarks further out: Wiesner's diatom rosette, three Anna Atkins cyanotypes and Bertsch's *Navicula* at ×1200. Micrometre ticks mark the axes.

The centre of the viewport is the *objective*, marked by a micrometer reticle. When you pan, zoom, press 1–9 or tab to a specimen, the view travels there. The grains then leave the stone, fly across the slide and settle into that product's specimen glyph around its card. MCP Emails' glyph has 17 striae, one per tool. A readout shows the specimen's name, its Latin name, its one real figure, the magnification and the last live signal. A glass-slide minimap shows where you are and takes you anywhere you click.

The page is a technology brand seen through optics and biology. It avoids finance and machinery.

## Voice

Quiet, exact and a little scientific. It says what a thing is and what it measures, then stops. It never sells.

- "Builds software that pays for itself: apps, SaaS and the plumbing AI agents run on. Everything he has shipped is on this slide."
- "Four things in the light, seven in the archive."
- "Built, learned from, put away."

Numbers appear only where they are true (`content.js`). Words to avoid: hire, connect, passionate, solutions.

## Colour

A duotone at OKLCH hue 72°: **field `#14100a`** and **light `#fae0c1`**. Ochre `#bd8e53` and dim `#735836` carry labels, and line `#3b3124` draws hairlines. **Signal gold `#f0b871`** is spent only on things that are alive: figures, the glyph nodule, live pings and the selected state. Museum plates are gradient-mapped into the same duotone, so a cyanotype reads as gold on ink.

## Type

- **Instrument Serif** for the voice: names, headlines and figures. Italic is used for Latin specimen names and accents.
- **Geist 300** for running text.
- **Geist Mono**, uppercase and tracked at 0.14–0.16em, for eyebrows, coordinates, magnification, keycaps and the MCP command.

## Mark

The mark is a triangular *Triceratium* valve that reads as an A, with three ocelli and one gold nodule. The wordmark is Instrument Serif in outline with a small mono "AS". The favicon is the heavy mark on an ink tile. The 11 specimen glyphs and 26 UI icons share the mark's construction (1.5 stroke, hairline secondary rings, one nodule), so the identity reaches from the favicon to the hero.

## Motion (GSAP 3.12.5 + ScrollTrigger)

- **Focus pull:** words arrive blurred and slightly over-magnified, then resolve with expo-out.
- **Pull back:** on load the view starts close on the stone, then pulls back over 3.2 s to reveal the arrangement.
- **Travel:** moves between places use expo-in-out. The grains morph over about 2 s while the cloud tweens across the slide.
- **Signal:** a radial ripple through the grains. Clicking the slide sends one, a live feed event from the focused product sends one, and Space sends one.
- **Scrub dissolve:** as the hero scrolls out, the grains peel off the stone's flank, and the hero copy lifts and fades.
- **Stage sweep:** sections rise 48 px out of a 6 px blur as they enter the viewport.
- **Striae draw:** each product glyph engraves itself when its section arrives and again on hover.
- **Micro-interactions:** a loupe magnifies the specimen slides 2.4× under an etched reticle. Visit buttons are magnetic, and their fill opens like an iris from the point where the pointer entered. Archive hover cards follow Radix's pattern: a 250 ms open delay, a transform-origin scale and a side-aware slide driven by `data-state` and `data-side`. The archive strip can be dragged with inertia, and the copy button pings.
- **Reduced motion:** WebGL never starts and the baked particle still is shown in its place. There is no intro flight, all moves are instant, the grain and rotating tags stand still, and the reveals are off. The slide still pans, zooms and focuses.

## Keyboard (signature delight)

`?` or the visible **Keys** button opens a cheat sheet with keycaps. Arrows pan, `+`/`−` zoom, `0` fits the slide, `1–9` go to a specimen, `.`/`,` step through places, Space sends a signal, `H` returns to the stone, `↵` opens the focused product, `C` copies the MCP command, `M` writes an email and `G` toggles the grain. When the hero is off-screen, the arrows and Space scroll the page as usual.

## Sound

Off until you press **Sound off/on** in the header. When on, a soft sine with a quiet second partial (about 0.035 gain) plays on a change of focus, on a signal and on a live event from the focused product.

## Extending the direction

**Blog.** Each post is a single slide. Its title is set in Instrument Serif over a museum plate re-lit in the duotone. The article sits in a 64-character Geist 300 column with Geist Mono marginalia (date, reading time and micrometre ticks for the section numbers). Figures and code blocks are "mounted" on a raised panel with the pore-lattice pattern. A post can name a specimen glyph, which then engraves in the margin as you read. The index is a smaller slide: posts are placed by date along one axis and can be panned, and it falls back to a list on phones.

**Product pages.** Each product opens through an **Iris** transition from its place on the home slide. Its specimen glyph becomes the hero particle target, so the grains form that glyph on arrival. The product's real logo sits on its specimen slide, unaltered. Below it, the page uses the same rhythm as the homepage section: the figure in gold serif, facts as mono chips, the live feed filtered to that product as a "signal" log, and a loupe on screenshots. Retired products get a quiet page with their tile, years and one line written by Asgeir.

## Assets

Everything is in `assets/` (see `assets/ASSETS.md` for sources and licences: Met Open Access CC0, Poly Haven CC0 and original work). The page uses the particle module (a site copy in `js/particles.js` that exposes the cloud's transform and lets the page own pointer input), the hero stills as poster and fallback, the specimen slides, retired tiles, museum plates, reticle, status tags, canvas grid, film grain, glass-slide sticker, sprite icons, identity files and the OG image.
