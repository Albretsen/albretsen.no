# Full Stop

Brand exploration 16 for Albretsen AS / albretsen.no.

## Vision

The page reads like a printout of the business: counts, years, statuses and a live trace of what the products are doing right now. Nothing is cropped out. The grid is drawn on the paper, the axes of the feed are labelled, and the page states its own weight after it loads. The aim is that a visitor finishes reading and has nothing left to doubt. The record speaks for itself: 2016 to 2026, 11 products, 7 of them retired and still listed.

The visual world is New Wave typography. From Wolfgang Weingart it takes stepped lines, mixed weights inside one name, type set wider than it should be, and a grid shown with the same pride as the content. From April Greiman it takes the screen as material: misregistered colour behind the black, and nothing pretending to be paper when it is really pixels.

## Personality

Brutal honesty. Raw on purpose: hairlines, hard rules, a square sound button, no rounded cards and no gradients. Nothing hidden: retired products, a figure missing where none exists ("no figure"), latency drawn at a declared scale.

## Voice

Numbers first, adjectives never. Each sentence opens on a count, a year or a unit. No superlatives, no "passionate", no invitations.

- "Shipping software since 2016: 11 products, 2 live, 1 building, 1 paused, 7 retired."
- "1 outside engagement at a time."
- "0 removed from this list."
- "x: last 4 min. note length: latency, 100 ms = 6 px."
- "3 events since you arrived."
- Error / empty state: "feed needs JavaScript. 0 events shown."

## Mark

A single full stop: a filled circle. It is the end of the sentence, and the head of every note in the feed. Its colour is not fixed. It always takes the hue of the most recent event (magenta when an agent touched MCP Emails, yellow when a Fun Libs story finished), and the favicon follows it. With no events yet, it is grey. The static favicon is the seed magenta, `#cd32b3`.

The wordmark is just `albretsen.no` in Plex Mono 600 beside the dot.

## Colour

The rule: **the page has no colour of its own; colour only appears where an event put it.** Paper and ink are near-neutral and tinted towards the seed hue.

| Role | OKLCH | Hex (light) | Hex (dark) |
|---|---|---|---|
| Paper | 0.962 0.004 90 | `#f3f2ef` | `#0d0a0c` |
| Ink | 0.17 0.008 336 | `#120e11` | `#edebe7` |
| Mute (text, 6:1+) | 0.47 0.01 336 | `#5f595d` | `#a9a2a7` |
| MCP Emails (seed) | 0.60 0.23 **336** | `#cd32b3` | `#e765cd` |
| Fun Libs | 0.83 0.165 96 (seed + 120) | `#e7c61f` | `#f0d03c` |
| Toolrails | 0.68 0.135 216 (seed − 120) | `#00accd` | `#3cc4e1` |
| albretsen.no | 0.68 0.17 156 (seed + 180) | `#00b66a` | `#42ce85` |

The four hues form a triad on the seed plus its complement: Greiman's magenta, yellow and cyan, with green for the site itself. MCP Emails holds the seed because it is the busiest lane, so the colour seen most is the seed. The colours are used for fills only (notes, dots, the misregistered layer under the name, the 8 px edge of the products sheet), never for body text, so contrast never depends on them.

## Typography

- **Display: Unbounded**, a variable face that reads ultra-wide at its heavy end. The name is set in 250 above 900, edge to edge. The size is computed from the measured advance width (ALBRETSEN = 7.89 em at 900), so it fills the container exactly: `font-size: min(100cqi / 7.95, 25svh)`.
- **Text and data: IBM Plex Mono 400/600.** Teletype needs a monospace, and machine keys (`draft.created`) belong in one.
- Both are self-hosted woff2 with `font-display: optional` and preloaded. No layout shift from a font swap, ever.

## Layout system

- 12 columns, gutter `clamp(16px, 2.6vw, 56px)`, drawn as hairlines on the hero.
- The hero is sticky. The products section is a sheet that slides over it, its top edge an 8 px band in the live colour. If the hero is taller than the window, it scrolls to its own bottom before sticking (`top: min(0, 100vh − height)`), so nothing is hidden under the sheet.
- Hero: bar → name → (stepped sentence | score) → the MCP line, unexplained, in mute mono.
- Products are a timeline from 2016 to 2026: a sticky year ruler, then one row per product in the order it started, with a dot at its start year. Live products draw a solid line to now, building ones dashed, paused ones a double ring, retired ones a hollow dot and no line. Milestones from `history` (first app on Google Play, consulting, the company) sit between them in small mono.
- Each row reads figure first (`$782 MRR`, `113,000+ installs`), then name, year, status, line, facts.

## Motion

Teletype. The name types at about 55 ms per character, the sentence at 18 ms, each new feed line at 22 ms, behind a block cursor in the live colour. Characters hold their space from the first frame (visibility, not insertion), so typing never reflows anything. The piano roll moves at the speed of the wall clock: 4 minutes across the width, nothing sped up and nothing looped. When a new note lands it rings once, and the matching product's dot on the timeline rings too. With `prefers-reduced-motion`, text appears whole, rings are dropped and the roll redraws every 5 s.

## Sound

Off until the visitor presses `sound: off`. Then every typed character is a soft key click: a 28 ms burst of decaying noise through a band-pass at 2.2 to 3.6 kHz, about 7% gain, and spaces get a lower 650 Hz thud. All of it is synthesized in Web Audio. No files are loaded, nothing plays in a loop, and the choice is not stored.

## Feed as a score

Each event kind has its own lane (13 lanes, grouped by product, labelled with the raw machine key). Time runs left to right with "now" as the playhead at the right edge. A note is a dot at the moment the event happened, and its tail stretches back by the request's latency at a declared scale. The mix of colours across the staff is the story: magenta agents, yellow players, cyan tools, green page loads.

## Extending it

- **Blog:** posts open with their numbers as the heading block (date, reading length in words, figures mentioned), then text in Plex Mono at 17 px over 64 ch with Unbounded for headings. A post's dot takes the hue of the product it is about, or ink when it is about none. The post list is the same ruler and timeline, by date.
- **Product pages:** one lane of the score at full width, for that product only, above a single figure set at hero scale. Every claim on the page is a count with a unit and a source. Retired products keep their page, with the reason Asgeir writes as the first line.
- **Everywhere:** no colour without an event, no adjective without a number, and the page states its own weight in the bar.
