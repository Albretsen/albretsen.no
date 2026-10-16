# Afterimage

Brand direction 12 for Albretsen AS / albretsen.no.

## Vision

Bridget Riley described her paintings as a field of visual energy that builds until it reaches maximum tension. Afterimage takes that idea and pairs it with silence. The left of the page is empty paper. The right is a field of black bands that start dead straight and slowly bend. The name runs across both halves. On the paper it is black, and inside the field it is inverted into the bands. Nothing explains the effect. The work speaks for itself, and the restraint carries the luxury.

The site should leave one impression: someone who controls every pixel and every millisecond, and who has nothing to prove with decoration.

## Personality

Luxury restraint: expensive through absence. That means one primary colour, three typefaces, almost no UI and no adjectives. Every element that stays earns its place by holding tension against the empty space around it.

## Voice

Confident and declarative. The page states facts and stops, so there are no exclamation marks, no superlatives and no requests.

- "Builds software that earns its keep: apps, SaaS and the infrastructure AI agents run on."
- "Everything shipped, still running or retired. Nothing removed."
- "Takes one outside engagement at a time."
- "Mark no. 3d69fd, drawn for this visit."
- Tape fallback: "Events from MCP Emails, Fun Libs, Toolrails and albretsen.no run here as they happen."

Never: hire me, let's connect, passionate, cutting-edge, solutions.

## Mark

Seven parallel lines sit in a 24-unit square. A seeded sine wave bends them, its amplitude swelling toward the middle line and falling flat at both edges, which gives tension and then release. One inner line is blue. Each visit draws a fresh 32-bit seed from `crypto.getRandomValues`. The seed sets the frequency, the phase, the drift between lines and which line is blue. So the mark is slightly different for every visitor, but the rule that draws it never changes. The same seed drives the hero field and the favicon, and its hex is printed in the footer as the visitor's "mark no.". The static `favicon.svg` and the no-JS fallback use seed `3d69fd`. Code: `mark.js`.

The wordmark is "Albretsen" in Instrument Serif, followed by a small mono "AS".

## Colour

Black, white and one primary. The primary is built on OKLCH hue 240.

| Token | Hex | OKLCH | Use |
|---|---|---|---|
| ink | `#070707` | oklch(0.13 0 0) | bands, text, dark sections |
| paper | `#fafafa` | oklch(0.985 0 0) | ground |
| blue | `#006aaa` | oklch(0.50 0.14 240) | the one blue band, "Asgeir", focus, on paper (5.8:1) |
| blue-lit | `#52b5f4` | oklch(0.74 0.13 240) | the same blue on ink (9.3:1) |
| grey-ink | `#868686` | oklch(0.62 0 0) | secondary text on ink (6:1) |
| grey-paper | `#6b6b6b` | | secondary text on paper (5.3:1) |

Blue is rationed. The field has one blue band, the name has one blue word, and the sections have one live dot and the live statuses. The blue band is always placed above the name, so the difference blend never inverts it into orange. That keeps the page to a single hue.

## Typography

- **Instrument Serif** (display, roman and italic) is condensed and high contrast. It is set huge, cropped and overlapped: the name at 39vw runs off the right edge and is sliced at its baseline by the tape, and "Products" is filled with bands.
- **Newsreader** (text, optical sizes) carries the lede, product lines and the italic event text on the tape.
- **IBM Plex Mono** (details) carries times, years, statuses, labels, the MCP command and the email.

Fallback faces are metric-adjusted so that font swaps stay quiet.

## Layout system

Type is the image. Each section has one giant cropped serif word that does the work an illustration would. Small mono and text elements sit on top of it or against it. The gutter is `clamp(16px, 3.2vw, 56px)`. The band pitch is 10 px with 4 px bands, and 12 px with 5 px at 1800 px wide and above. The CSS stripe fallback and the canvas share this grid, so the field starts as exactly what the HTML already shows.

- Hero: silence on the left (lede), the field from 44% to the right edge, and the name across both. Below 720 px the field drops to the lower 40%.
- Tape: a 52 px black band directly under the hero, cutting the name.
- Products: a black ground, a numbered ruled index, and columns for no. / year / name and line / status / figure. Retired entries stay at full size in grey.
- Footer: the availability line in display serif, the email in mono, and the visit's mark.

## Motion

- **Field:** a generative canvas. Rows bend by `sin(x / λ(y) + φ(y) + ωt)` with an envelope that is flat on the left and full on the right. The wavelength compresses row by row, as in Riley's *Current*. The field ramps from straight to tense over 6 s, then breathes at ω ≈ 0.3 rad/s. A Vasarely-style swell follows the pointer. It runs at 30 fps and pauses when off screen or in a hidden tab.
- **Tape:** a constant 64 px/s. Each event is laid onto the tape when it happens, so the empty stretches between events are real quiet time. Nothing repeats and nothing is sped up. A Pause button stops the motion.
- `prefers-reduced-motion`: the field is drawn once at full tension, and the tape becomes a still row where new events take the first slot.

## Sound

Sound is off by default; the "Sound off/on" toggle sits top right. Everything is synthesised with Web Audio, and no files load.

- Each live event plays a short struck sine pitched by product (MCP Emails A5, Fun Libs E5, Toolrails B5, albretsen.no E6, deploys A4), with a faint partial at 2.01× that sounds like glass.
- A 30 ms triangle tick plays when a product name gains hover or focus.
- Turning sound on plays a rising fifth.

## Print

The printed page is a poster. The name is set black and cropped, the field turns into 0.35 mm hairlines, and "Asgeir" stays blue. The tape becomes a dated list of the last twelve events ("Live · as printed"). Product links print their host names, rows never split across pages, and the colour of the live statuses is kept.

## Extending it

- **Blog** (`/blog/slug`): the post title is set as a giant cropped serif word or phrase over a small, still band field seeded from the slug, so every post gets its own fixed field. Body text is Newsreader at 19–21 px with 68ch measure. Code and dates are mono. Only links and the one band are blue, and print is first class.
- **Product pages:** each product gets a field variant. Fun Libs uses wide gentle waves, MCP Emails uses tight compressed rows, and Toolrails uses straight bands with one bent row. The product's figure is the giant cropped numeral (`$782`, `113,000+`), and its own events run on the tape alone.
- **Social and OG images:** these are rendered from the same seed function. The mark sits at the left, the name crosses a band field, and nothing else is added.
