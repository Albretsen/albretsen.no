# Brev

*Brev* is Norwegian for letter. albretsen.no reads as a letter from Asgeir, written in the place where he actually works: a code editor. It has a gutter of line numbers, a strict character grid, and syntax shown through weight and italic rather than a rainbow. In the middle of the letter is a night pane where every real event from his products is a star.

## Vision

Most developer sites try to impress with noise. Brev does it with restraint and evidence. The text is plain and warm, the craft sits in the details (every margin is a whole number of character cells), and the live constellation shows that the products are being used right now. Visitors should finish the page thinking: this person is kind, clear, and very good, and the things he builds keep running. The page never asks for anything. It signs off, and gives an address.

## Personality

Warm, generous, clearly one person. Calm confidence. Engineering precision you notice only after a while. Nothing is exaggerated, and the retired products stay on the list.

## Voice

Norwegian plainness: short sentences that are true, no adjectives doing the selling, one Norwegian word where it fits naturally, with the English meaning nearby.

- "Hei," (the opening line)
- "I build software in Norway, and I keep what pays for itself."
- "Ting." / "Things I have made."
- "Those stay on the list too; they taught me the rest."
- Status words in the pane: *stille* (quiet) under the threshold, *travelt* (busy) above it.
- "lyd: av" / "lyd: på" for the sound toggle.
- "Hilsen, Asgeir" (the sign-off)

Banned: hire me, let's connect, passionate, any superlative, any number that is not in content.js.

## Mark

The mark is four stars: the newest event from each product (MCP Emails, Toolrails, Fun Libs, albretsen.no), each placed along its product's vector at a distance set by its real age, snapped to a 12-step grid and joined into a figure. On the live site it changes shape with the data, and the newest star is blue. The favicon and print use one fixed snapshot: a low kite, `20,10 12,18 4,10 12,8` on a 24 grid. The wordmark is `albretsen.no` in Newsreader Semibold, followed by `/ brev` in italic, like an editor tab.

## Colour

High contrast: black, white and one blue at hue 264.

| Role | OKLCH | Hex |
|---|---|---|
| Ink / night | oklch(0.13 0.008 264) | #06070a |
| Paper | oklch(0.985 0.004 264) | #f9fafd |
| Blue on paper | oklch(0.50 0.23 264) | #194fe3 (6.1:1 on paper) |
| Blue on night | oklch(0.66 0.19 264) to oklch(0.73 0.15 264) | #5b8cff / #74a3ff |

Greys are only ink mixed into paper (`color-mix`), never a separate hue. Dark mode swaps paper and ink and uses the lighter blue. The pane is always night. Blue marks what is live or new: the newest star, live status, figures, links on hover, the line number under your cursor.

## Typography

One family: **Newsreader** (Production Type, OFL), weights 200 to 800 with italics and an optical-size axis. There is no sans and no monospace.
- Display: opsz 72, weight 500 for the name, 300 italic for the surname.
- Text: 18 px on a 28 px line.
- Small and caption: 13 to 15 px, using the caption optical size; tabular lining figures everywhere, so times and numbers line up like code.
- Syntax highlighting is done in type: names are semibold, statuses and comments are italic, and retired products are set light italic after a blue `//`, the way an editor shows a comment.

## Layout system

- **The cell.** One cell is 0.625 rem wide (10 px) and one line tall (1.75 rem, 28 px). The sky uses half-line rows. Every width, margin and gutter is a whole number of cells, and column widths are snapped with CSS `round(down, …, 1cw)`.
- **The column.** At most 64 cells wide (640 px), centred, like a letter. A 6-cell gutter (4 cells on phones) holds line numbers generated with CSS counters and hidden from assistive tech.
- **Vertical rhythm.** Every line box is 1 or 2 lines tall, including the headline, so the baseline grid never breaks.
- The pane is fixed in line units (10 sky lines, 4 log lines, header and status), so live data never moves the page.

## Motion

Only scroll and real time move things. Uses CSS scroll timelines and does nothing where they are unsupported or when reduced motion is set.
- A 2 px blue progress caret under the tab bar (`scroll(root)`).
- Product rows, headings and the footer "type in": four `steps()` from four cells to the right, like a caret (`view()`).
- The constellation dims as you scroll away from it, like an unfocused pane.
- The signature gains weight from 200 to 500 as it comes into view.
- Stars move one grid cell at a time, only because they really got older. A new star is born at the centre (the threshold) with one ring, and then travels out along its product's vector. Nothing loops and nothing is sped up.

## Sound

Off until the visitor presses "lyd: av". Everything is synthesised with Web Audio: a drone on A2 and E3 with a slow filter breath, and a synthesised noise impulse for reverb. Activity in the last minute opens the filter. Above the threshold of 8 events a minute, a fourth voice (B3) joins, and the status word changes from *stille* to *travelt*. Each event rings one soft bell from its product's own pentatonic set (Fun Libs high, MCP Emails middle, Toolrails lower, the site lowest, and a deploy rings a chord), so the mix of products becomes the melody.

## Extending

- **Blog.** Each post is a letter in the same column. The gutter numbers paragraphs, so links to `#L12` point at a line, like a code review. Code blocks are set in Newsreader too, in tabular figures with syntax shown in weight and italic. The post's mark is a constellation snapshot of the feed at the moment it was published.
- **Product pages.** One pane per product, showing that product's stars only, along its vector, with its single figure in blue. The status (live, building, paused, retired) is the first word after the name. Retired pages are written entirely in comment style, with the reason in Asgeir's own words.
- **Email and documents.** Plain text, signed "Hilsen, Asgeir", with the snapshot mark.
