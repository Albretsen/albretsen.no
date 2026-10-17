# One Spot

*Brand direction 19 for Albretsen AS and albretsen.no*

## Vision

A document, not a website. The page is set like a Dutch exhibition catalogue: wide margins, a strict column, notes in the margin, nothing decorative. On that paper sits one spot colour, a signal green-yellow at hue 120, and it marks only one thing: **what is happening now**. That means the newest dot on the world map, the products that are live, and the line under your cursor. Everything else is ink.

The visitor should come away thinking two things: this person ships and pays attention, and he has very good taste. The page doesn't claim either. It shows a live world and an honest list, set with care.

## Personality

Quiet confidence. He says little and lets every word earn its place. Curious about what people do with the things he makes, and playful about it, but never loud. The brand is never "excited to share" anything.

## Voice

Short declaratives. Facts first, then one small turn of wit. No superlatives, no calls to action, no "passionate", no "let's connect".

- Hero: *Ships software to see what happens, and keeps whatever earns its keep.*
- Map caption: *Players have countries. Agents don't, so they live on the bottom line.*
- Products intro: *11 entries since 2019. 4 still standing.*
- Retired: *Switched off, still listed.*
- Colophon: *The mark above is Nº 945F, drawn for this visit. Draw another.*
- 404 (extension): *Nothing printed here. The margin is still open.*

## Mark: The Field

A 5x5 grid of 25 dots on an ink tile. Each visit picks a random seed (shown as a four-digit hex number, Nº 945F). The seed places a point of density, so dots swell near it and shrink away from it, and the dot closest to that point is filled with the spot. The rules never change, so the mark is always recognisably the same object. The picture never repeats exactly. The seed is printed in the masthead and colophon like an edition number, and "Draw another" redraws it. The favicon is the visit's mark.

- Minimum size: 16 px (favicon). The spot dot is always the largest, so it stays legible.
- Wordmark: "Albretsen" in Newsreader SemiBold, opsz 24, followed by "AS" in small caps.

## Colour

One ink, one paper, one spot, and that is all. Tints are only screens of the ink (like printing at 20 %), never new hues.

| Role | OKLCH | Hex |
| --- | --- | --- |
| Paper | oklch(0.985 0.008 115) | #fafbf5 |
| Ink | oklch(0.21 0.02 120) | #171a0f |
| Spot (signal) | oklch(0.89 0.20 120) | #caed21 |
| Ink at reading tint (notes) | oklch(0.52 0.015 120) | #686a61 |
| Dark mode paper | oklch(0.17 0.012 120) | #11120c |
| Dark mode ink | oklch(0.95 0.012 115) | #eef0e7 |

Rules: the spot is never used for text on paper, because the contrast is too low. On paper it is a highlighter or a fill under ink, and spot fills get an ink hairline. On the dark ground it works as a fill or a light. Ink on paper is 16.9 : 1, notes on paper are 5.3 : 1, and ink on spot is 13.5 : 1.

### The light/dark toggle

The toggle is a disc split into a paper half and an ink half, with a spot at its centre. Hover tips it 28° as if you were about to turn the sheet over. Pressing it stamps it down (scale 0.9). The page then flips between *Ink on paper* and *Paper on ink*. The halves rotate 180°, and the spot stays exactly where it is. That is the whole brand in one control: everything can invert except the signal.

## Typography

One family: **Newsreader** (Production Type, OFL), variable on weight 200–800, optical size 6–72, with italics. There is no sans and no monospace anywhere.

- Display: opsz 72, Light 300, tracking −3.5 %, leading 0.86. Used for the name, section titles and figures.
- Statement: opsz 36, Regular, size clamp(1.3rem, 2.1vw, 2.35rem).
- Text: opsz 16, Regular, 16–21 px fluid, leading 1.45, old-style figures.
- Margin and caption: opsz 8, 13 px, tabular lining figures for times and years, all small caps for labels.
- Italic carries the margin voice: event descriptions, facts, captions and the MCP line.

## Layout system

A three-column document grid: **margin 2 · text 7 · margin 3**. The gutter is clamp(20px, 2.6vw, 72px) and the outer margin is clamp(16px, 4.2vw, 112px), with a cap at 2100 px.

- Left margin: section numerals (0, 1, 2, each with a spot), years and labels.
- Text column: the name, the world map and product names.
- Right margin: marginalia. These are the live log, status and figures, notes and the colophon.
- From 760 px to 1119 px, the left margin folds into a label above each row. Below 760 px, everything stacks in reading order.
- Rules: 1.5 px ink opens a section, and hairlines at 16 % ink separate entries.
- The live log has fixed-height slots. New events rewrite the text and nothing reflows, which gives zero layout shift.

## The live feed

A dot-grid world in 3° cells (2 KB of SVG, drawn as dashed strokes). Each event appears as a mark in the cell of its country or city. Fun Libs is a filled dot, MCP Emails a ring, Toolrails a square and albretsen.no a plus. Repeat events in a cell grow its mark, so density shows up as weight. The newest mark is the spot; the last dozen are ink and older ones fade to 38 %. Events with no place (agents, deploys) go to a dotted bottom line. The margin log shows the last six events, and hovering or focusing an entry lights its mark. Pacing comes from the real feed only, with no loops and no speed-up.

## Motion

Micro-interactions only, so nothing moves on its own:
- Links: a spot highlighter grows under the word on hover (280 ms), and on press it fills the full line height.
- The mark turns a quarter on hover.
- The toggle tips on hover, stamps on press and turns over on click.
- Buttons drop 1 px on press.
- Under `prefers-reduced-motion`, all transitions are removed.

## Sound

Off until the visitor opts in with "Sound off / on, keys" in the masthead. When it is on, each new event types itself into the margin with a soft key click, and the hero sentence retypes once as a greeting. The click is synthesised with Web Audio: a filtered noise burst (bandpass 2.6–4 kHz, 35 ms), a short pitched "bottom-out" at 210 → 90 Hz, a heavier thock for spaces and a lower one at the end of a line. No audio files are loaded. With reduced motion, text appears whole with a single click.

## Extending the system

- **Blog:** each post is a true document page. The title is set in Display Light, the text column holds 62–68 characters, footnotes become margin notes in italic caption size, and the publication date sits in the left margin in tabular figures. The spot is used only for the passage a reader is pointing at (text selection is spot-coloured) and for a single "new" dot on posts under two weeks old.
- **Product pages:** the product name is set large. The left margin holds the year and status glyph, and the right margin holds the one figure, set huge in Light. Facts run as an italic list. Each live product gets its own map filtered to its events, so Fun Libs shows countries and MCP Emails shows the bottom line filling up. Retired products keep a page with the same layout and a single grey dash for status.
- **Social/OG images:** an ink tile with the visit's mark and the name in Display Light, with the spot used once.
