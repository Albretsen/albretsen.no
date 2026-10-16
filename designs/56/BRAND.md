# Honest Pixels: design 56

Real photographs, rounded down by code, captioned with exactly what was done to them.

## Vision

The site claims nothing it can't show. Every image is a CC0 photograph from Poly Haven: misty pines, a mossy creek, birchwood, a frozen lake. Asgeir's own code renders each one as Bayer, Atkinson, 3- and 4-tone ordered dither, ASCII, line engraving or halftone. Every image carries a caption naming the source file and the algorithm, so the craft is the evidence. The numbers follow the same rule. The page counts its products from `content.js` and prints the tally plainly: two live, one building, one paused, seven retired.

It reads as technology because the process is visible and runs live in the visitor's browser. The live tile has a lens onto the real photograph and shows a measured frame rate. The ASCII tiles show how many milliseconds they took to draw on that machine.

## The homepage

- **Loader (the signature delight).** The counter shows real bytes of the 317 KB hero photograph arriving (fetch + ReadableStream). A 20 KB preview steps from ASCII at 48 px down to Bayer at 3 px, then the photograph replaces it through an 8×8 Bayer-ordered wipe. It can be skipped (button or Escape) and is shorter on repeat visits in a session. Under reduced motion it never appears.
- **Hero: a moodboard that is also the portfolio.** The headline is never covered. Around it sit draggable pieces (GSAP Draggable): the live Bayer engine, five photograph tiles, the MCP Emails and Fun Libs specimen cards, a live **receipt** and the MCP command with a copy button. The receipt merges product events from `feed.js` with whatever the visitor does ("you: moved birchwood 212 px"). **Render** is a Radix-style toggle group (role radiogroup, roving tabindex, arrows, Home and End) whose thumb slides in five pixel steps. It switches every image between Photo, Dither and ASCII through a stepped Bayer mask built from the kit's own pattern tiles. Product logos are exempt and never re-rendered, and the captions say so. **Tidy** uses Flip to turn the collage into a contact sheet. With the keyboard, pieces are focusable and arrow keys move them.
- **Develop band (scroll-driven).** It pins, and scrolling rounds the mossy creek photograph down to Atkinson 1-bit in six Bayer-ordered steps. A meter states the real share of pixels at one bit.
- **The record.** Four specimen cards resolve in from coarse Bayer, with a magnetic tilt toward the pointer. Each has the real logo, an honest status chip, a figure that counts up in six hard steps, and the facts. Retired products are listed with pixel-glyph stand-ins and a red strike. Luma uses its real logo.
- **Footer.** The frozen lake is rendered as live ASCII with a lens onto the photograph. Below it are the availability line and the email.

## Voice

Brutal honesty, without performance. It uses short declaratives and states the source and the number. It never says "hire me", "let's connect" or "passionate". Pulse red appears only when telling an uncomfortable truth: paused, retired, failed.

> I build software that pays for itself. Some of it didn't. This site says which.
> Retired. Listed anyway.
> The logos are never re-rendered; they are not mine to round down.

## Colour (OKLCH first)

| Token | OKLCH | Hex | Role |
|---|---|---|---|
| cream | 0.962 0.022 88 | #f9f2e2 | ground |
| cream-2 / -3 | 0.925 0.03 86 / 0.86 0.035 84 | #efe5d0 / #dcd0b8 | panels, wells |
| deep | 0.235 0.045 162 | #052517 | text, dither ink |
| forest | 0.34 0.065 158 | #14422b | fields, the wipe |
| ink | 0.17 0.03 165 | #02130c | ASCII grounds, loader, footer |
| moss | 0.55 0.08 140 | #587d50 | mid-tones |
| brass / brass-deep | 0.71 0.115 82 / 0.56 0.1 75 | #c59a44 / #966b27 | accent on dark / accent text on cream |
| pulse (seed 12°) | 0.61 0.2 12 | #e03c63 | the truth only: paused, retired, errors |

## Type

**Bricolage Grotesque** is used for statements, at `wdth 75 to 88` and `opsz 96` with tight tracking. **IBM Plex Mono** is used for every fact, caption, label and the command. Its even widths are also why the ASCII renders line up.

## Motion

The house rule is that things move in steps, the way pixels do. Easing is allowed only where a hand is involved: dragging, and the magnetic card tilt.

| Name | Where |
|---|---|
| Bayer-in | Render switch: the incoming layer's mask steps 12% → 25% → 50% → 75% → 100%, staggered per tile |
| Resolve-in | Product cards, from 32 px Bayer to the real file |
| Pixel thumb | Toggle group thumb, `steps(5)` |
| Stepped drop | Board pieces arrive after the loader, `steps(4)`, random order |
| Develop | Scroll-scrubbed, six discrete states |
| Count-up, Blink, Pulse, Breath, Step-spin | From the kit's `motion.css` and `motion.js` |

With `prefers-reduced-motion` there is no loader and no pinning. The develop band rests at 50%, figures appear final, and the live engine stops breathing. Dragging still works because the user drives it. `?still` forces the same calm version, which is useful for screenshots.

## Sound

Sound is off until the visitor turns it on. After that, the page plays 1-bit square-wave blips with hard on/off envelopes: a high blip on pick-up, a low one on drop, one pitch per render mode, and a tick for each develop step. There are no samples and nothing is loaded.

## Mark

A pixel "A" that dissolves upward in Bayer dither, with a brass cursor block that blinks at 1 Hz. The wordmark is "albretsen" in outlined Bricolage plus "AS" in Plex Mono Bold, with no font dependency. Files are in `assets/brand/`.

## Extending it

- **Blog.** Each post gets one header image: a Poly Haven photograph through one named algorithm, with the caption as the byline's neighbour (`frozen_lake.hdr → line engraving`). The body is Plex Mono at 16/1.7 for notes and Bricolage for headings. Code blocks sit on ink with brass highlights, the same as the ASCII renders. A post's reading time is measured, not estimated, and corrections are appended in pulse red with the date and never silently edited. The canopy halftone and rock ASCII from the kit work as list-page textures.
- **Product pages.** Each product page opens with its specimen card at full width and its real logo. The status chip and the figure are pulled from the same data, then the facts follow as chips. Every product page ends with a "What didn't work" section, which is the brand's honesty made structural. Paused and retired products keep their pages, with the reason in Asgeir's words once he writes it. The Render toggle stays global in the header, so a visitor can see any image as the photograph on any page.

## Files

- `index.html`, `css/site.css`, `js/site.js`: the page.
- `assets/`: the art director's kit (see `assets/ASSETS.md`), including `js/dither.js`, `motion.js` and GSAP 3.13 vendored.
- `img/truth/`: undithered, graded photographs for every moodboard tile, plus the creek and lake strip. They are rendered by `src/originals.py` with the same gnomonic views as the kit, from Poly Haven tonemapped panoramas (CC0): `misty_pines`, `mossy_forest`, `birchwood` and `frozen_lake`, from https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/<id>.jpg.
