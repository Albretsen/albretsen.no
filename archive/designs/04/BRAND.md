# Carrier

*Brand direction 04 for Albretsen AS / albretsen.no*

## Vision

A 1990s personal homepage, rebuilt by someone with taste. The old homepage was honest: one person, one page, a list of the things they made, a counter, a guestbook. Carrier keeps that honesty and drops the clutter. The page is built on a strict character grid in a single pixel typeface and a single hue, so the result reads as minimal futurism: tomorrow's interface, built from yesterday's parts.

The name comes from the carrier tone of a dial-up modem: one steady signal that every message rides on. Here the carrier is the rose hue at 348°, and each product is a note on it.

## Personality

- **Exact.** Every glyph sits in a cell, and every size is a whole-pixel multiple.
- **Unhurried.** Nothing moves for decoration. When something moves, a real thing happened.
- **Warm.** It jokes at its own expense, never at anyone else's.
- **Ambitious, quietly.** The numbers are there and small. Retired products stay listed.

## Voice

Warm and witty: short sentences, plain words, and one dry turn per paragraph at most. It states facts and lets them land. It never asks for anything.

- Hero: "I build apps, SaaS and plumbing for AI agents, and keep whichever ones pay rent."
- Tape: "The tape only moves when something happens."
- Products: "Including the ones that did not pay rent. They stay on the list."
- Shelf: "retired. kept on the shelf with the lights off"
- Footer: "Guestbook, 1990s style: asgeir@albretsen.no"
- Footer: "best viewed at any width from 320 to 2560 px"

Never: "hire me", "let's connect", "passionate", exclamation marks, superlatives.

## Mark

`A:\>_`

The DOS prompt for drive A, where everything started, read as **A**lbretsen. It is plain ASCII, so it works anywhere text works: a terminal, a commit message, an email signature. The cursor is one cell wide and fills with the carrier colour on hover. Section headings reuse the prompt (`A:\> dir /products`), so the mark is also the way the site talks. The favicon draws the same prompt on a 16 x 16 pixel grid: `A` in light ink, `>` and the cursor in carrier rose.

## Colour

Dark, built only from shades of OKLCH hue 348. Products are told apart by lightness and by their glyph, never by a second hue.

| Token   | OKLCH                   | Hex       | Use |
|---------|-------------------------|-----------|-----|
| ink0    | oklch(0.13 0.028 348)   | `#0f0409` | night, the hero |
| ink1    | oklch(0.165 0.038 348)  | `#1a0711` | the sheet that slides over |
| ink2    | oklch(0.21 0.05 348)    | `#280d1c` | hover rows |
| line    | oklch(0.30 0.06 348)    | `#432033` | ASCII rules, grid dots |
| faint   | oklch(0.46 0.07 348)    | `#75475f` | decoration only (separators) |
| quiet   | oklch(0.62 0.08 348)    | `#aa728f` | quiet text, 5.3:1 on ink0 |
| dim     | oklch(0.70 0.07 348)    | `#c08da6` | secondary text, 7.3:1 |
| accent  | oklch(0.70 0.19 348)    | `#ef64b3` | carrier: live, MCP Emails, links |
| hot     | oklch(0.80 0.13 348)    | `#fb9acc` | building, Toolrails |
| pale    | oklch(0.88 0.07 348)    | `#fcc5e0` | Fun Libs |
| text    | oklch(0.93 0.025 348)   | `#f6e1eb` | body, 16:1 |

## Typography

One family: **VT323** (Peter Hull, SIL OFL), the DEC VT320 terminal face, self-hosted as a 7 KB latin subset. It is used seriously: at text sizes and as display, never as a costume.

- **The grid.** Base size 25 px. VT323 is drawn on 40-unit pixels in a 1000-unit em, so at 25 px one font pixel is exactly one screen pixel. One cell is 10 x 30 px (0.4 em by 1.2 em).
- **Scale = whole pixels.** Display sizes are integer multiples of the base (`--k`): 3, 4, 5, 6, 8, 10, 12, 14. At k = 8 one font pixel is an 8 x 8 px square and one character is exactly 8 cells wide, so the name lands on the same grid as the body text.
- **Fallback.** A metric-matched local fallback (`size-adjust: 66.667%` on Courier New / Menlo) has the same 0.4 em advance, so the font swap moves nothing.

## Layout system

Everything aligns to the monospace character grid.

- Containers are always a whole number of cells wide (`round(down, 100% - gutters, 1 cell)`), with a 2-cell gutter (4 cells from 1000 px).
- Vertical spacing is counted in lines: 1, 2 or 3 rows, never anything else.
- Rules are real characters (`----`, `====`) clipped to the cell grid, not CSS borders.
- The hero is a sticky full-screen page with a faint dot at every fourth cell of every line, the grid made visible. The products sheet slides over it with a one-line shadow. When the hero is taller than the screen it sticks by its bottom edge instead, so nothing is covered unseen.
- The products are a DOS-style directory listing: `cursor | NAME | STATUS | SINCE | FIGURE | WHAT IT IS`, in fixed cell widths that reflow to three lines per product on phones.

## Motion

Micro-interactions only, all instant, all on the grid:

- **Hover:** a cell inverts (the mark's cursor, the product row's glyph), rows lift to ink2.
- **Press:** the whole row fills with carrier rose and the text drops to ink, like a selected file.
- **Focus:** a 2 px carrier outline, always visible from the keyboard.
- **Fracture:** hover a line of the name and its lower half slips exactly one cell right in carrier rose. One cell, not a blur.
- **The tape:** a ticker in the spirit of `<marquee>`, anchored at its right edge. When a real event arrives, it steps left one whole character every 45 ms until the event is in view, then stops. With no events, nothing moves. Hover or focus holds it. With `prefers-reduced-motion`, events land in place without stepping.

## Sound

Off until the visitor ticks `[ ] sound`. Then every real event plays a soft, low-passed square wave on the A major pentatonic, synthesised with Web Audio:

- albretsen.no `~` A3 (a deploy adds the fifth)
- MCP Emails `@` A4
- Toolrails `#` C#5
- Fun Libs `_` E5 (a new player adds the octave)

Turning sound on plays the four notes once, low to high, so you know who is who. A busy afternoon in Europe sounds like a slow, bright chime; the night is mostly silence, which is the truth.

## Extending it

- **Blog** (`A:\> type /writing`): posts set in VT323 at 25 px, measure capped at 64 cells, headings at k = 2 and 3. Code blocks are just text on ink2. Dates in the left margin as `2026-08-19`, like a file listing. Footnotes as `[1]`.
- **Product pages** (`A:\> cd /mcp-emails`): the product's glyph and note become its mark and sound; the page uses that product's shade as its local carrier (MCP Emails in accent, Fun Libs in pale). A filtered tape at the top shows only that product's events. Facts sit in a two-column `key ........ value` list with dot leaders on the grid.
- **Retired products** keep a page each, set entirely in quiet tones, with the one-line reason when Asgeir writes it.
- **Everywhere:** the prompt `A:\>` in email signatures and commit trailers; 16 px favicon; the four product glyphs `@ _ # ~` as the only iconography.
