# Albedo

*Brand direction 17 for Albretsen AS / albretsen.no*

Albedo is the share of light a surface reflects. A bright surface has a high albedo. This brand is high-key: it is nearly all paper, it reflects attention back onto the evidence, and it leaves the work to make the case.

## Vision

The site works like an observation, not a pitch. When it opens, a world map of pale pixels is already recording events from every product: stories finished in Fun Libs, agents reading threads through MCP Emails, Toolrails searches, deploys of the site. Nothing on the page says the work is good. The page shows that it is running, at what latency and where, and expects a careful visitor to reach the conclusion on their own. Someone who reports honestly about quiet periods is someone you would trust with your system.

## Personality

Scientific calm. Measured, evidence-first, precise. Never excited or exclamatory, and never about itself. It is closer to a Japanese corporate annual report than a startup landing page: sparse, small type, a lot of air, and one confident element per screen.

## Voice

Dry understatement. Short declaratives in the register of a methods section, with the joke left inside the precision.

- "Positions approximate to country or city. Quiet periods are real."
- "Agent calls by latency. They have no coordinates."
- "Eleven entries. Two live, one under construction, one paused, seven retired and left on the record."
- "Builds apps, SaaS and the plumbing AI agents use. The map shows what they are doing at the moment."
- Blog dek, for example: "113,000 installs. Marketing budget: none recorded."

Banned: superlatives, exclamation marks, "passionate", any direct request for contact. The footer states availability as a fact: "Takes one outside engagement at a time."

## Mark

A pixel A on an 8 × 8 grid, designed first for 16 px (each cell is 2 device pixels). The legs and crossbar are two cells thick, so it holds up in a browser tab. One cell sits apart in the top-right corner: the **signal pixel**, in Albedo Sky. Everything else is ink.

- Favicon: `favicon.svg`, a paper square, an ink A and a sky pixel, with `shape-rendering: crispEdges`.
- On the site, the signal pixel turns butter for four seconds when albretsen.no itself deploys. The mark reports too.
- Scale only in whole multiples (16, 32, 48, 64 px). Never anti-alias, round or outline it.
- Wordmark: ALBRETSEN AS in IBM Plex Mono 500 caps, tracked +0.14em, set beside the mark at the same cap height.

## Colour

Built around OKLCH hue 228. Pastel, high-key and airy, with exactly one dark: the ink.

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| Paper | `oklch(0.985 0.007 228)` | `#f5fbfe` | page |
| Haze | `oklch(0.955 0.018 228)` | `#e4f3fa` | panels, print-safe tints |
| Land | `oklch(0.86 0.035 228)` | `#bad6e3` | map pixels |
| Rule | `oklch(0.87 0.02 228)` | `#c7d7df` | hairlines, retired status |
| Ink | `oklch(0.29 0.045 245)` | `#172e40` | all type (13.4:1 on paper) |
| Ink 2 | `oklch(0.47 0.035 240)` | `#495e6d` | secondary type (6.5:1 on paper) |
| Sky | `oklch(0.74 0.10 228)` | `#5fb7dc` | MCP Emails, signal pixel, live |
| Rose | `oklch(0.78 0.09 355)` | `#e6a0ba` | Fun Libs |
| Mint | `oklch(0.82 0.09 165)` | `#8ad7b6` | Toolrails, building |
| Butter | `oklch(0.87 0.09 90)` | `#ebd28f` | albretsen.no, deploys |

Pastels are for data only and never for text. Every product owns one pastel, used for its map dots, swatches and anything else that represents it.

## Typography

- **Saira Extra Condensed** 300 / 500, always in capitals. Use it for the name, section titles, product names and figures. Light at large sizes, medium at row sizes. The display face loads with `swap`, but its line boxes are fixed (`line-height: .82`, block lines), so the swap moves nothing.
- **IBM Plex Sans** 400. Use it for the one sentence per section that is meant to be read. Size 13.5 to 14 px, line-height 1.6.
- **IBM Plex Mono** 400. Use it for everything else: labels, the feed, axes, legends. Set at 10.5 to 11.5 px, uppercase, tracked +0.08em. This is the Japanese-corporate micro-type layer.

The scale has deliberately extreme contrast: one very large condensed element, everything else very small, and nothing in between.

## Layout system

- The hero is a full-bleed canvas. The map is the background, and identity and feed are overlaid on a 2-column grid (`1fr | 300–368 px`) anchored to the bottom edge, so the top of the screen stays air.
- Side gutter: `clamp(16px, 3.2vw, 56px)`. Rules are 1 px: ink for the start of a dataset, Rule colour for divisions inside one.
- Below 820 px the map leaves the background and becomes a band in the flow (`aspect-ratio: 180/71`), followed by identity and then the feed. Nothing overlaps on a phone.
- Products form a numbered table in six columns: No., name, description + facts, status, year, figure. Retired rows stay in the table, set in light weight and Ink 2.
- Zero layout shift: feed rows are fixed slots whose text changes while the boxes never move, the hero height is fixed by CSS, and text fonts are `display=optional`.
- **Print** is a first-class output. The page becomes an A4 report: the map is rendered to a still image at print time, the name sits on one line, the feed shows a timestamped "Snapshot printed …" line, products start on page two, and links print their URLs.

## Motion

Teletype. Text arrives one character at a time at a steady 24 ms per character, with a solid ink block as the cursor. On load, the eight most recent events type themselves into the feed from the top down at 9 ms per character. That is history being transcribed, not a show. A new event:

1. types into the top row of the feed,
2. lands as a pixel dot on the map with one square ring that expands and fades over 1.8 s, plus a pale field that fades over 90 s,
3. gets a teletyped label beside the dot ("FUN LIBS / STORY COMPLETED / BRAZIL") that fades after 6 s.

Dots age from full opacity to 22% over 15 minutes. If nothing happens, nothing moves. With `prefers-reduced-motion`, text appears whole, there are no rings, and the status blink stops.

Data honesty rules: dots are placed at country or city centroids with a small jitter so repeated events stay distinguishable, as the caption states. Agent calls carry no location, so they are plotted on a latency axis (0–1000 ms) instead of being invented onto the map.

## Sound

The page is silent and has no audio controls. The sonic logo, for video, app launch screens and talks:

**"Return."** A pure sine at 228 Hz, matching the seed hue in hertz, with a 40 ms attack and a 600 ms exponential decay. 180 ms after onset comes a short 912 Hz ping (two octaves up, 8 ms attack, 120 ms decay) at −14 dB, panned slightly right. It sounds like a sensor registering an echo: a signal goes out and something comes back. There is no reverb and no melody, and the whole thing lasts under one second. A product variant shifts the ping's pitch by product (Fun Libs a fifth higher, MCP Emails at the octave).

## Extending the system

- **Blog:** each post is laid out as a paper. Title in Saira Extra Condensed light caps, a mono metadata block (date, reading time, word count), and body in Plex Sans at 17 px with a 62-character measure on Paper. Figures are numbered ("Fig. 3") with mono captions written in the same dry voice. Pull quotes are not used. The post list is the same numbered table as the products.
- **Product pages:** each product takes its pastel as its only accent. The hero shows the same map filtered to that product's events (or, for MCP Emails and Toolrails, the latency axis enlarged as the main figure), then a short facts table from content. Status and year are always visible at the top, and retired products keep a page with their one line and figure.
- **Print, PDF and decks:** the same A4 report grid. One figure per page with a "Fig." caption, and the mark at 32 px top-left.
