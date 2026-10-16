# Cover Story (design 59)

## Vision
albretsen.no is the current issue of a magazine about one company. The homepage is its cover, and you can open it.

- The hero is a three.js magazine. The cover tilts with the pointer or the phone, and its stickers parallax off the print.
- A CC0 magnifying glass follows the pointer and magnifies the cover type for real.
- You open the cover by dragging, clicking or pressing Enter. The stickers scatter, the page curls back on its spine, and a dispersive glass crystal rises out of the inside spread.
- At the same moment, the story column beside it turns like a page (a view transition) into the contents page. That page links to the features below.

The surprise is the sticker sheet in the margin. Every fact on the page is a neo-brutalist sticker, and the visitor can peel one off and slap it anywhere on the cover page. It lands with an overshoot and its shadow drops a beat later. It parallaxes with the tilt, can be moved with the arrow keys, and peels off again with Delete or a double-click. The page is serious, but you are allowed to touch it.

The weight comes from editorial type and real science photography: protein crystals grown on Space Shuttle mission STS-50 on the cover, the ISS aurora on the inside spread, and an AFM crystal-growth spiral as texture. Neither the photography nor the type looks like a bank or a circuit board.

## Voice
Dry, editorial and confident: a magazine that respects its subject and is a little amused by it. Facts are always specific, and adjectives are rare. The copy never asks for anything.

- Standfirst: "Asgeir Albretsen builds software that *pays for itself.*"
- Section: "Four products in print, *seven in the archive.*"
- Pull line: "Small products, *shipped,* then left to compound."
- Never write "passionate", "hire me" or "let's connect". The footer simply states "Takes one outside engagement at a time." and gives the email.

## Type
- **Instrument Serif** for the nameplate, headlines, decks and product names. Set it tight (-0.028em) at a line-height of 0.9, and use the italic, in violet, for one phrase per headline.
- **Archivo Expanded 900** only on stickers and status labels, in uppercase.
- **JetBrains Mono** for body text, kickers (tracked 0.22em), the feed, captions and the MCP command.

## Colour
The page is built from ink `#0f0b22`, paper `#f3f2fb` and violet `#6c35ec`, with glow `#bab0ff` for violet light on ink. Five sticker hues sit around the wheel: lime `#cefd3e`, tangerine `#ff6f27`, cyan `#2debf9`, rose `#fd54ad` and citrine `#ffdc3a`. Each sticker gets exactly one hue. The whole spectrum appears together only where light passes through a crystal: the photographs, the 3D dispersion, and the Glint hover on plates.

## Motion
| Name | Where | Behaviour |
|---|---|---|
| Turn | Cover, and the story column becoming the contents page | The 3D page curl, and a matching rotateY view transition (520 ms, `cubic-bezier(.65,0,.25,1)`) |
| Slap | Placed stickers, colophon stickers | Lands at 112%, overshoots to 95% and settles. The shadow grows from 2 to 5 px. |
| Peel | Removing a sticker | Rotates back from its top-right corner in perspective and fades |
| Drag tilt | Holding a sticker | The sticker leans with horizontal velocity (±18°) and casts a long hard shadow |
| Lift + magnetic | Buttons and links | A hard shadow grows 4 to 9 px, and the element drifts up to 5 px toward the pointer (CSS `translate`, so it composes with Lift) |
| Tilt | Hero and product plates | A critically damped spring (k = 120) driven by the pointer, or by the gyro after a tap on phones. `[data-depth]` layers parallax. |
| Hover card | Back-issue tokens | Radix-style: a 120 ms open delay, a pop from the origin with `cubic-bezier(.16,1,.3,1)`, and it flips to the bottom near the viewport edge |
| Rhythm | Sticker belt over the aurora | A slow marquee with alternating tilt that pauses on hover |
| Glint | Plates and the cover photo | One pass of a full-spectrum band on hover |

Two Lottie files from the kit are used. `sticker-slap.json` confirms that the MCP command was copied, and `glow-sparks.json` twinkles above the crystal when the cover opens and over the aurora band. Under `prefers-reduced-motion`, everything becomes a 200 ms fade or nothing: the 3D jumps between states without idling, and the tilt, marquee and parallax stop.

## Sound
Off until the visitor turns it on in the rail. All sounds are synthesised with WebAudio from filtered noise, with no audio files:
- a thump when a sticker lands
- a bandpass swish when one peels off
- a rising breath of air when the cover turns
- a two-note tick when the command is copied

## Mark
The mark is a violet sticker with an Archivo Expanded "A" whose top-right corner peels back to a lime underside. It makes the same gesture as opening the cover and as the Peel interaction. The wordmark is the mark, plus "Albretsen" in outlined Instrument Serif, plus a tilted lime "AS" label.

## Assets used on the page
- **Identity:** mark, favicon, touch icon, OG image, and the masthead as a CSS mask for the colophon nameplate.
- **Hero:** the baked closed and open renders as poster and fallback, and the STS-50 crystal photograph as the cover credit.
- **Inside spread:** the aurora photograph as a full-bleed band, with view-timeline parallax.
- **Products:** the four feature plates and the Luma back-issue plate, plus the real product logos from `_shared/products`, unaltered. The six retired tokens stand in for products with no surviving brand.
- **Stickers:** the burst, seal, ticket, pill, tape, stamp, Norway label, spark words, statuses and barcode.
- **Textures:** paper grain (body), grain overlay (sheet backing, band), the violet spiral (hero wash), the lime spiral (colophon) and the LED counter crop (colophon).
- **3D:** `js/cover-scene.js`, a site copy of the kit scene. The camera fits the closed cover tightly and dollies out as it opens, and an `onChange` callback was added. It includes `magnifier.glb` (Poly Haven, CC0).

## Extending to the blog and product pages
- **Blog posts are articles in the issue.** Each post opens with a kicker (date, then a section name such as "Essay" or "Field notes"), an Instrument Serif headline with one italic violet phrase, and a deck in serif at 22 px. Body text is set in JetBrains Mono at 15–16 px with a 64ch measure. Pull quotes are serif at 48 px. A post's facts, such as "113,000 installs", become stickers in the margin, and readers can peel them off and keep them in a "sticker sheet" at the end of the post. Images are graded NASA or Commons photographs with a credit line in the magazine style.
- **The blog index is the contents page.** Use the same numbered rows as the hero's contents state, with a status-style sticker per category, and Turn transitions between the index and a post.
- **Product pages are feature spreads.** Lead with the product's plate in a tilt frame, its real logo, status sticker, figure and facts. Follow with one full-bleed photograph band, then the details. Each product page keeps its own logo colours inside its plate and stickers; the surrounding magazine stays ink, paper and violet.
- **Retired products are back issues.** Each gets its token, the reason (written by Asgeir) and its years, and nothing more.
- **404** is a blank cover: the masthead over the lime spiral, with the line "This page isn't in the issue."

## Credits
- Photographs (public domain): NASA, STS-50 crystals (9262354), the ISS aurora (iss058e005282) and the AFM crystal-growth scan (0101744).
- 3D model (CC0): Magnifying Glass 01 by Nazar Borodavka, Poly Haven.
- Libraries: three.js 0.170.0 and lottie-web 5.12.2, from jsDelivr, loaded lazily.
- Fonts (OFL): Instrument Serif, Archivo and JetBrains Mono, from Google Fonts.
- Research note: the shared web-search budget was used up before this build began. Research used direct fetches instead: the magicui Lens docs, Radix Hover Card, Emil Kowalski's drawer article, Chrome's scroll-driven animations docs and paco.me.
