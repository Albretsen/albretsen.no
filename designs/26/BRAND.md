# Widescreen

Brand exploration 26 for Albretsen AS / albretsen.no.

## Vision

One name, drawn very large, on a grid you can see. Wim Crouwel built letters from a grid because the screens of his day forced it, and he left the grid showing. Widescreen does the same thing for a company that builds for screens and agents. ALBRETSEN is drawn on a 55 by 7 pixel lattice, and that pixel is the unit for the whole site. The wordmark is set two screens wide, so the page has to scroll sideways. Visitors move through it like a film strip: first the name and the live feed, then the products, then the address.

The scale carries the ambition. The quiet carries the taste: nothing moves except evidence of work happening.

## Personality

Cinematic, exact, unhurried. Big gestures built from small rules. The confidence comes from scale and restraint. Nothing is decorated.

## Voice

Confident and declarative. Short sentences. State the fact and stop. No adjectives about the work, no requests to the reader, no exclamation marks.

- "I build software that earns its keep: apps, SaaS and infrastructure for AI agents."
- "Eleven products. Four in motion. Seven retired, kept in view."
- "Ordered by status. The retired ones stay on the record."
- "Every product, as it happens."
- "Takes one outside engagement at a time."

Banned: hire me, let's connect, passionate, any superlative.

## Mark

The mark was designed favicon-first on a 16 by 16 grid. It is a pixel **A** built from 2 px cells (the 5 by 7 glyph from the wordmark), with a single violet **spark** pixel at its upper right, one cell clear of the letter. It renders crisply at 16 px with no anti-aliasing, and scales by whole cells.

The wordmark is ALBRETSEN in the same 5 by 7 alphabet: square counters, a notched A and S, and a diagonal N. Each lit pixel is inset by 6% so the lattice shows between cells. The same spark pixel closes the word at column 55. The spark is the only colour in the identity.

Rule: Albretsen is always the largest thing on any page.

## Colour

Near-black, tinted toward hue 300, with one electric accent.

| Token   | OKLCH                  | Hex       | Use |
|---------|------------------------|-----------|-----|
| ink     | oklch(0.13 0.012 300)  | `#08060b` | ground |
| ink-2   | oklch(0.17 0.016 300)  | `#100e15` | back cards |
| ink-3   | oklch(0.22 0.02 300)   | `#1c1923` | front card |
| rule    | oklch(0.30 0.02 300)   | `#2f2c37` | column rules, borders |
| grid    | white at 4.5%          |           | the lattice |
| mute-2  | oklch(0.62 0.016 300)  | `#87848f` | retired, tertiary (about 5:1 on ink) |
| mute    | oklch(0.74 0.016 300)  | `#aca9b4` | secondary text |
| fg      | oklch(0.96 0.006 300)  | `#f2f1f5` | text, wordmark |
| spark   | oklch(0.66 0.26 300)   | `#ae59ff` | the one accent (sRGB fallback; wider on P3 screens) |

The spark marks only live things: the spark pixel, the live status, the front feed card, live figures, focus rings and the email underline.

## Typography

Monospace only, in one family: **Martian Mono** (variable weight and width).

- Display: width 112.5%, weight 600, tight tracking. Section statements.
- Text: width 87.5%, weight 400. The hero sentence and feed text.
- Figures: width 75%, weight 300 to 600, tabular. Indices and product figures.
- Labels: 0.64 to 0.68 rem, uppercase, +6% tracking.

The wordmark is not set in type. It is drawn, so the largest letters on the page come from the lattice and not from a font file.

## Layout system

- **Cell** = wordmark height / 7 = min(38svh, 25vw) / 7. The background lattice uses the cell, page padding is a whole number of cells (1 on desktop, 2 on phones), and the wordmark sits exactly on the grid.
- **Reel**: a single horizontal scroll container under a thin fixed bar. A vertical wheel moves it sideways. Arrow keys, Page, Space, Home and End all work, and touch swipes natively.
- **Frames**: 01 Now (wordmark, intro, feed stack, the unexplained `claude mcp add` line far right), 02 Products (one intro column, then one ruled poster column per product, figure pinned to the bottom), 03 Address.
- Retired products keep their column. They switch to muted grey but are never hidden.

## Motion

Completely still, except the feed. A new event card drops onto the front of the stack, and the older cards each step down one strip and narrow by half a rem, like a deck seen from above. The 12th card fades out. Hover states change instantly, with no transitions. With `prefers-reduced-motion`, cards appear in place. The feed is never looped or sped up. When nothing happens, nothing moves.

## Sound

Off until the visitor presses **Sound**. Everything is synthesised with Web Audio:

- a low drone on D (detuned saws and a sub through a lowpass) that breathes slowly, with a filter that opens as real activity accumulates and closes again over about 40 seconds of quiet;
- each event strikes one note from a D pentatonic lattice. MCP Emails plays high sines, Fun Libs mid triangles, Toolrails a lower bell, and the site itself deep soft tones. A deploy rings a four-note chord;
- a synthesised room and a 430 ms delay. Notes are chosen by hashing the event, so the music comes entirely from what actually happens.

## Extending

- **Blog**: the reel turns vertical for reading. Each article opens with the ALBRETSEN wordmark at full width on the lattice, and the post title sits beneath it in display mono, so the name stays the largest thing. Body text is Martian Mono at 87.5% width, 68ch measure, with a cell-based baseline. The spark marks only the current section in a margin index.
- **Product pages**: each product gets its own reel. Frame 1 is the product name in pixels on the lattice with its one figure huge in condensed numerals. Frame 2 is that product's slice of the live feed as its own card stack. Frame 3 is its facts as ruled columns. Status uses the same pixel squares: filled for live, outlined in violet for building, half for paused, grey outline for retired.
- **Social and OG images**: the 55 by 7 wordmark on the lattice, spark pixel in violet, nothing else.
