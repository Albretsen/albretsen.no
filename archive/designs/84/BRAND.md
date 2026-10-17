# Orbit Issue — Albretsen AS

## Vision
Albretsen AS is published as a magazine that follows the sun. The homepage is its cover: a grainy, infrared painting of a Norwegian fjord with a ringed sun overhead and the masthead **ALBRETSEN** tucked behind the peaks. The edition on the stand comes from the sun's real altitude over Oslo right now: **Nocturne** (below −6°), **Dawn** and **Dusk** (around the horizon) or **Orbit** (full sun).

The cover is a real object. Grab it and pull it open around its spine, or press *Open the issue*. On the inside of the cover is a short letter from the editor. On page one is a live three.js orbit, built from primitives, whose four satellites are the four current products. Under it sits a contents list that takes you to each feature.

Loud and proud describes the type and the colour, never the copy. Every screen carries one idea, the layout leaves a lot of dark space, and the products are the headline. The landscape is atmosphere only: no place names and no travel language.

## Voice
- An editor's confidence, a fact sheet's precision. Cover lines are short, plain and true.
- Numbers come only from `content.js` and are set big. Everything else stays small.
- Never "hire me", "let's connect" or "passionate". The availability line does that job quietly.
- Examples: "Four products in orbit." · "Four features. All shipped by one person." · "Back issues, retired with honours."

## Type
- **Bricolage Grotesque** 800, width 75, uppercase, tracking −0.012em: the masthead, names and big figures.
- **Instrument Serif** italic: cover lines, decks and the editor's letter. It always sits next to the grotesque, the way a magazine pairs headline and standfirst.
- **Instrument Sans**: body copy, 17px.
- **JetBrains Mono**, uppercase and tracked +0.14em: kickers, edition numbers, the MCP command and live events.

## Colour (OKLCH, seed hue 216°)
Ink `#0f0428` and Night `#000418` carry the page. Violet `#4c1b82` is for panels. Magenta `#e72395` and Ember `#fd7933` are for figures and accents, often as one gradient on a big number. Apricot `#ffc282` is for kickers and Cream `#fdf0dc` for type. Fjord `#008cab` is the single cool note, used only as rim light in the paintings. The page glow under the magazine changes with the edition.

## Motion
- **Cover hinge** (spring, JS): stiffness 150, damping 21. The cover cannot pass through the page and bounces softly off both stops. A mouse hover gives a 9° peek.
- **Edition wipe** (View Transition): the new edition grows as a circle from the sticker.
- **Feature swap** (View Transition): only the feature block takes part (the root is unnamed). The old text lifts and blurs out, and the new text rises on a firm spring.
- **Masthead rise**: letters climb out of the horizon on a bouncy spring baked into CSS `linear()`.
- **Stack spring**: cards drag, throw and flip like card stock (`assets/js/cover-stack.js`).
- **Film grain**: re-rolls at 12 fps by offset, so it reads as film rather than video noise.
- With `prefers-reduced-motion`, springs snap, view transitions are skipped and the masthead is static.

## Sound
Silent. If sound is ever added, it is one opt-in paper page-turn on opening the cover.

## Mark
`assets/identity/mark.svg` is a badge with a sky, a sun with an orbit ring and peaks. The wordmark is a condensed ALBRETSEN with an italic serif *AS*. Use the mono mark (`mark-mono.svg`) below 24px and in print.

## Performance
The edition is picked by an inline script in `<head>`, so only that edition's cover is downloaded (AVIF 1080/1600 with WebP fallback, about 200 KB). The inside images load when the browser is idle. three.js loads only on intent (hover, focus or drag on a fine pointer) or when the cover is opened. Every image has dimensions, so layout shift is 0.

## Extending to the blog
- A **blog post is an article inside the issue**. The header is a 2:1 spread (`hero/spread-{edition}`) with the title in Bricolage over the sky and the land layer in front where it fits. The standfirst is Instrument Serif italic, and the body is Instrument Sans at 19px in a 38rem column on Ink.
- Posts carry the edition they were published in (worked out from the post's timestamp), so the archive becomes a stack of covers in four colours.
- The blog index is a contents page: page numbers in mono, titles in condensed caps and decks in italic, as in the contents list inside the cover.
- Pull quotes are Instrument Serif at 2.4× size, with an apricot rule.

## Extending to product pages
- A **product page is a feature**. It opens on that product's card (`products/{id}-card`), with the real logo rising like a sun. The giant figure comes from `content.js`, with the facts as mono chips.
- The second screen is the card flipped: a cream-paper fact sheet (`extras/paper-cream-512.jpg`) for specs, pricing and status.
- Retired products get their "set sun" stamp and one line written by Asgeir, never an invented reason.
- Each product page ends on the back cover: the barcode, the availability line and the email.
