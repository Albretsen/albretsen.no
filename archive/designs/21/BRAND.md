# Dot Plot

Brand direction 21 for Albretsen AS / albretsen.no.

## Vision

The site is a data-journalism graphic, and its subject is one small technology company. The products, the live traffic and the dates are presented the way a good graphics desk presents a dataset: plainly, precisely, with annotations, and nothing hidden. The work makes the case. The page never asks for anything.

The idea fits in one character: **the full stop**. It is a data point on a dot plot, the end of a sentence, and a thing that ships. The brand is the dot and its echo.

## Personality

Playful precision. It is having fun ("this one", pointing at the newest event; "Quiet for 40 s. That is also data.") and it is never sloppy: every number comes from the source, every dot sits on its year, every line holds the same height whatever the feed sends.

## Voice

Dry understatement, written like chart annotation. Short declaratives. Facts first, a small joke after. No adjectives doing a sales job. Never "hire me", "let's connect" or "passionate".

- "Builds software in Norway. Some of it is running right now."
- "Live. One event at a time, at the speed it actually happens."
- "Things that shipped, and a few that stopped."
- "Dots mark the year each one started; lines run to today."
- "The retired ones stay on the chart."
- "Quiet for 40 s. That is also data."
- "Takes one outside engagement at a time."

## Mark

A full stop in the spot colour. Used alone as the logo (sidebar and favicon: a spot dot on paper), and as the final character of every headline and every live event, so the mark appears every time something happens. Never outlined, never animated on its own, never paired with a second symbol. Minimum size 6 px. The wordmark is simply "Albretsen AS" set in Martian Mono 600 beside the dot.

## Colour

Paper white, ink, and one spot colour at hue 168. Tints of the spot are allowed (as in single-ink printing); no second hue, ever.

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| paper | 97.5% 0.006 168 | #f3f8f6 | background |
| ink | 21% 0.012 168 | #131a17 | text, rules, the grid (16.5:1) |
| ink-2 | 45% 0.012 168 | #4f5754 | secondary text (6.9:1) |
| ink-3 | 72% 0.010 168 | #9fa7a3 | hairlines and inactive marks only |
| spot | 64% 0.135 168 | #00a57c | the dot, live marks, echo rings (marks only, never body text) |
| spot-ink | 47% 0.095 168 | #016b50 | spot-coloured text (6.1:1) |
| wash | 93.5% 0.030 168 | #d7f0e6 | highlighter under one phrase per view |

Rule of thumb: the spot is for whatever is alive right now. Live products, the newest event, the dot.

## Typography

Monospace only, everywhere: **Martian Mono** (variable width 75 to 112.5, weight 400 to 700), loaded from Google Fonts with `display=optional` so the fallback (`ui-monospace`, Menlo, Consolas) never swaps mid-read.

- Display: 700, width 75, tracking -0.035 to -0.045 em, line height 0.98. The condensed width is what lets a monospace headline stay huge at 320 px.
- Text: 400, width 87.5, 1rem / 1.6, tabular figures.
- Labels and annotations: 400, 11 to 12 px, ink-2, uppercase only for the kicker and the product name in the feed.

## Layout

A fixed sidebar index (17.5 rem) holds the dot, the index (00 Now, 01 Products with every product listed under it, 02 Contact), the sound switch and, at the very bottom in 11 px grey, the line `claude mcp add albretsen https://albretsen.no/mcp`, unexplained. The index marks where the reader is with a small spot dot.

Mobile first: at 320 px the sidebar is a header strip (dot, name, sound, a one-line index), and the hero is designed for that width before anything else. The headline and the live event use container-query sizing, so the live event box is always exactly three lines tall: no layout shift, whatever the event says. At 600 px the product chart becomes a table; at 960 px the sidebar fixes to the left.

Section heads are kickers in the newspaper style: `00 · Now` followed by a hairline to the margin.

The products section is one chart: each row has name, line and facts, a track from 2016 (first Google Play app) to today with a dot at the start year, the status and the single figure. Legend: filled spot = live, spot ring with a dotted line = building, grey ring with a dashed line = paused, small grey dot = retired.

## Motion

A generative ambient canvas behind everything: a dot-grid sheet that drifts a pixel or two in a slow flow field. Each real event drops a spot dot in its product's band; three echo rings travel out from it and push the grid aside as they pass; the dot then drifts upward and shrinks over ten minutes. The live headline lands with a small rise, and the previous event leaves an outlined echo that drifts up and fades. The event strip under the headline moves with real time, so dots drift left as they age.

There is nothing that moves without a cause: no loops, no speed-ups. With `prefers-reduced-motion` the field is drawn as a still sheet, events appear as still dots, and the text swaps without animation. The canvas runs at about 30 fps and stops when the tab is hidden.

## Sound

Off until the visitor switches it on. Synthesised with Web Audio, no files.

- **Sonic logo** (plays when sound is switched on): one clean triangle-wave dot at E6, then four echoes 210 ms apart, each 14 cents flatter, quieter and darker through a lowpass, then a low full stop at E5. About 1.2 seconds.
- **Events**: one quiet dot per event with a single echo, pitched by product (MCP Emails E5, Fun Libs G5, Toolrails B5, albretsen.no D6), so the mix of products is audible.

## Extending it

- **Blog**: the same sidebar, now indexing posts by date as a dot plot of publication dates. Posts are set in Martian Mono 400 at width 87.5, measure 68 ch, annotations in the margin like footnotes on a graphic. Each post opens with a kicker (`Post · 2026-07-28`) and a headline ending in the spot full stop. Figures in posts are drawn in ink and the one spot, with direct labels and no legends where possible.
- **Product pages**: each product gets its own row of the chart scaled up into a page: the track, the status, the figure set huge, and a feed filtered to that product's events at the top. Retired products get pages too, with the same honesty.
- **Elsewhere**: social images are a paper card with one huge sentence ending in the spot dot. Email signatures are a dot and "Albretsen AS". The rule travels: one spot, one font, every sentence ends.
