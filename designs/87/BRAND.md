# Totality: an archive of light

## Vision
Albretsen AS is presented as a drawer of astronomical plates. É. L. Trouvelot drew these chromolithographs in the 1870s by looking very carefully for a very long time. He then made them so precise that they are still the reference. That is the attitude the site is meant to carry. The subject is still software. The plates are the frame, and the products are the observations.

The homepage opens on a **total eclipse**:

1. **Intro (first visit per session, about 5 s, skippable with the button or Esc).** The screen is black. A hairline ring is traced like an instrument calibrating. The diamond-ring bead ignites. A raw-WebGL shader (`assets/interactive/corona.js`) develops the 1878 plate, brightest light first. At 2.2 s "Albretsen" settles out of a two-ink fracture, and the nav, captions, command line and live log arrive last. The final frame *is* the page, so nothing has to transition away.
2. **Hero.** The plate sits behind everything. The name is set huge in Instrument Serif in the lower left, with one sentence of description below it. On the right are two quiet instruments: the MCP command with a copy button, and a one-line *observation log* that shows the newest event from the live feed. Each new event blurs out and arrives split into the two inks. The moon is a button: pressing it replays totality (the cursor readout says "Replay totality").
3. **Plates I–IV.** The page turns from night to corona-pink paper. The four products hang as mounted plates in a slightly staggered row, each with a museum label: plate number, year, status, name, one line, the one figure and the facts. Hovering a plate opens a **loupe**: a round aperture that reads the 1200 px scan at 2.4×, with a mono coordinate readout. The high-resolution file loads on first approach. Plates develop as they enter view, and a raking sheen of light passes across them on hover.
4. **The archive.** Retired products are listed as waning-moon roundels with the year they were set.
5. **Footer.** The wordmark, "Takes one outside engagement at a time." and the email.

## Why it fits
- The client's favourite earlier direction worked because of real imagery, light and craft. Its storybook theme was what failed. Totality keeps the real imagery (actual 19th-century observations) and keeps the light (the corona *is* light). It replaces the costume with the most technologist-shaped theme there is: careful observation and instruments.
- It is uncluttered. There is one image per screen and one hue on the whole site, with one point of glow (the bead) per screen.
- It is clearly not a finance firm, travel agency or magazine. There are no gears, ships or dials, and no place names.

## Voice
Precise, unhurried and plain, like an observation note. The facts carry the weight and adjectives are rare. Sentences are short, and italics carry the one human accent per block.

- "A small technology company in Norway. Apps, SaaS and infrastructure for AI agents, each built to *pay for itself*."
- "Four products, *in the open.* Each one exists because it can carry its own weight."
- Status words come from the archive: *Live*, *Building*, *Paused*, and "Set, and kept in the archive" for retired products.
- Never: "passionate", "hire me", "let's connect", exclamation marks.

## Colour (duotone on OKLCH hue 324)
| Token | Hex | Use |
|---|---|---|
| void | #0d040e | night background |
| umbra | #19081a | ink on paper |
| plum | #542a57 | secondary ink |
| magenta | #914599 | italic accent on paper |
| glow | #ca6fd3 | the bead: once per screen |
| halo | #e1a5e6 | rings, links on dark |
| corona | #f8ebf9 | paper |
| paper | #fdf8fd | text on dark |

Every image in the system is graded onto the same ramp, so a photo, a screenshot or a diagram can join the page without breaking the duotone.

## Type
- **Instrument Serif** for display: the name, section titles, product names, figures, and the email in italic.
- **Geist** at 16–19 px for body text.
- **Geist Mono** for captions, plate numbers, status, the log and the command, set at 10–13 px in uppercase with +0.16em tracking.

All three are SIL OFL and self-hosted as latin subsets. Only the serif and Geist are preloaded.

## Motion (Web Animations API only)
The principle is that light arrives before shape. Things develop highlights-first, settle on a long exposure curve, and never bounce.
- `totality`: the intro. It is composed in `main.js` as one cancellable timeline, so a skip finishes every animation at once and the shader jumps to its resolved state.
- `develop`: plates arrive as a print does in the developer tray.
- `fracture`: headline glyphs converge from glow and paper offsets into one ink. The live log uses the same idea at a smaller scale.
- `iris`: clip-path aperture openings. These are reserved for page transitions on the blog.
- `rakingLight`: a sheen of light across a plate on hover.
- Easing tokens: exposure `cubic-bezier(.16,1,.3,1)`, shutter `(.7,0,.2,1)`, drift `(.33,0,.2,1)`.
- Under `prefers-reduced-motion` there is no intro, no shader loop and no lag. The resolved frame is simply there.

## Signature delight
- **The aperture cursor.** This is a seven-blade iris with the corona bead. It closes to f/8 over links, with a readout that names the target ("mcpemails.com", "Copy", "Replay totality"), narrows to a slit over text, and blinks like a shutter on press. It is shown for fine pointers only.
- **The loupe** on plates, and **the moon as a replay button**.

## Sound
The site is silent by default and nothing plays unless the visitor asks. If sound is ever added, it should be one soft shutter tick on press and a low sine swell while the corona develops. It would be toggled from the footer and remembered per visitor.

## Mark
The mark is a diamond-ring eclipse: the moon disc, a corona ring broken by an aperture gap, and one bead of light. The wordmark is "Albretsen" outlined from Instrument Serif, with a small Geist Mono "AS". The mark breathes slowly in the nav (a 5.2 s glow), and the favicon is the mark on an umbra tile.

## Extending to the blog and product pages
- **Blog index:** a single column on corona paper. Each post is an *observation* with a mono date, a serif title and one line, separated by the f-stop rule. The bead on the rule marks the post you are hovering.
- **Blog post:** the cover is a plate from the archive. Saturn is the default and protuberances suit essays. A post's own images go through the same duotone grade. Body text is Geist at 19 px, with a 68-character measure, serif pull quotes and mono captions. The page transition from index to post is an `iris()` opening from the clicked title.
- **Product pages:** each product keeps its plate as the hero, cropped wide, with the real logo unchanged. Below it, a museum label expands into a spec sheet: figure, facts, status and changelog. The changelog is drawn over the star-chart ephemera, so each release is a star in one dashed asterism. The live log filters to that product's events.
- **About / consulting:** the Great Comet plate (an observatory window lit at night) carries the story. The light-fracture SVG introduces the day-job work as one beam split into separate disciplines.
- **Rules that never bend:** one hue, one glow per screen, real imagery only, and every image graded onto the ramp. No section should ever carry more than one idea.

## Performance notes
The hero is a `<picture>` (AVIF/WebP/JPEG, with a 16:9 crop and a 4:5 portrait crop) with fixed dimensions. The page is about 51 KB of hero image plus 54 KB of preloaded fonts plus the HTML, CSS and JS. The shader (11 KB) is a dynamic import and draws over the same cover-fitted frame. The cursor loads on idle, plates are `loading="lazy"`, and loupe scans load on first hover. All layout boxes are sized up front, so layout shift is 0.

## Sources
Plates: É. L. Trouvelot, *The Trouvelot Astronomical Drawings* (1881–82), public domain, via NYPL / University of Michigan scans on Wikimedia Commons. Paper texture: ambientCG Paper003 (CC0). The full inventory and licences are in `assets/ASSETS.md`.

Research note: in this run the web-search budget was already used up by parallel agents, so the interaction research relies on the references recorded in the asset kit (Apple MacBook Pro hero resolve, Awwwards WebGL intro sections, Emil Kowalski's clip-path notes, chromatic headline reveals on godly / CSSDA) plus established museum-collection patterns (the loupe and accession labels).
