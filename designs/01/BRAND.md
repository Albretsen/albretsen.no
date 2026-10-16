# Bloom Edition

*Albretsen AS presented as a long-form magazine that is always in print.*

## Vision

Most developer sites look like a dashboard or a résumé. Bloom Edition treats the work as a **body of work**, laid out like the feature well of a dense, confident magazine. The cover is crowded and loud, with oversized type, coverlines, margin notes and a plate. The control comes from a strict document grid, real typographic hierarchy and honest numbers. Visitors should take in two things together: there is a lot here, and every piece of it is deliberate.

The live feed is the cover image. Each product is a **sunflower head**: event *n* of a product takes slot *n* on a golden-angle spiral, so the cluster blooms outward as the day goes on. Lines follow the head's Fibonacci spirals. New events arrive in cobalt and settle into their product's earth colour. Spark words: *bloom* (growth with structure) and *velocity* (the rate of shipping, the leaning mark, the type arriving from a wider stance).

## Personality

Maximalist energy with control. The page is dense, warm and pleased with its own abundance. It is never chaotic: every element sits on the grid, and every number comes from the record.

## Voice

Confident and declarative. The sentences are short, state the fact and stop. The voice has no adjectives about itself and never asks for anything.

- "Asgeir builds software that pays for itself: apps, SaaS and the infrastructure AI agents run on."
- "Eleven entries. Two live, one building, one paused, seven retired. Nothing is taken down to look tidier."
- "Everything happening, as it happens. Nothing here is sped up."
- "Plus seven retired experiments, left in plain sight."
- "Takes one outside engagement at a time."

Banned: hire me, let's connect, passionate, any superlative the numbers do not earn.

## Mark

**The Seed**: a teardrop in flight (a single particle with velocity) and a small cobalt satellite (the first point of a constellation). It is built from one path and one circle on a 64-unit grid. It appears umber on paper, paper on umber, and the satellite is always cobalt. The wordmark is ALBRETSEN in Anybody 850 at full width, set in capitals.

## Colour

Warm earth neutrals around OKLCH hue 60, plus one cool accent. Cobalt marks only what is happening *now*: the newest star, a live status, the drop cap, focus rings and the sound light.

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| paper | 0.955 0.022 70 | #faeee1 | page |
| paper-2 | 0.915 0.035 68 | #f3dfcb | hover wells |
| rule | 0.80 0.04 62 | #d1b9a4 | hairlines |
| ink | 0.24 0.03 55 | #2a1b11 | text, footer field |
| ink-2 | 0.43 0.04 58 | #614b3a | secondary text (7.2:1) |
| clay | 0.53 0.13 45 | #a74f21 | figures, first name, MCP Emails |
| ochre | 0.76 0.13 78 | #dea645 | highlighter, Fun Libs |
| olive | 0.56 0.08 105 | #7b773d | Toolrails (graphics only) |
| plate | 0.205 0.022 55 | #1f150d | constellation plate |
| **cobalt** | 0.50 0.20 262 | #1957d2 | the accent on paper (5.5:1) |
| cobalt-l | 0.72 0.15 258 | #66a5ff | the accent on the plate (7.2:1) |

## Typography

- **Anybody** (Etcetera Type, variable) runs at **wdth 150, wght 900** for the display: the name, section titles, figures, drop caps and labels. The ultra-wide setting is the brand's loudest instrument. "ALBRETSEN" is sized with container units (`100cqi / 9.62`) so it always spans the full measure exactly, from 320 px to 2560 px. Small labels use the same face at wdth 110–140 in tracked capitals.
- **Newsreader** (Production Type) handles the deck, body, marginalia and italics. It is a literary text face with optical sizes, used large for the deck and italic for asides. The first name is set in Newsreader Light Italic, clay, overlapping the extended surname: the magazine's two voices on one line.
- **ui-monospace** is reserved for timestamps and the single unexplained command.

Drop caps use `initial-letter` where supported, with a floated fallback. Highlights are drawn with an ochre marker.

## Layout

A document page: **left margin / reading column / right margin**, with wide outer gutters that grow on large screens. Marginalia sit in the margins: base, years and day job on the left; coverlines and the cover status on the right. The name and section titles break out across the full measure. Products use a subgrid so each entry's year aligns in the left margin, the text in the column and the status and figure in the right margin. Below 960 px the margins fold into the column as inline notes.

## Motion

Slow and cinematic, **all pure CSS**. JavaScript only adds elements and classes.

- The surname rises out of a clip from a wider stance (scaleX 1.14 → 1, 2.4 s).
- Marginalia, deck and plate fade in over 2–3 s on a staggered schedule. The highlighter draws itself under "pays for itself".
- History stars fade in one by one along the spiral. A new event blooms: the dot overshoots and settles, a ring widens and dissolves, a soft glow passes, the spiral line draws in with `stroke-dashoffset`, and an italic caption appears beside it for seven seconds.
- Product entries reveal on scroll with `animation-timeline: view()` when supported, and are simply visible otherwise.
- `prefers-reduced-motion` removes every animation. The newest star is then marked with a static cobalt fill.

## Sound

Off until the visitor turns it on. Everything is synthesized with Web Audio; no files load. Turning sound on plays the sonic logo **"Bloom"**: a bandpassed noise breath sweeps upward (velocity), then FM bells play D4, A4 and E5 and open into a held D5–A5 fifth (bloom), in a small warm delay room, about two seconds in total. After that each event gets one quiet bell pitched by product (MCP Emails D5, Fun Libs A5, Toolrails E5, albretsen.no F♯5, deploys a low fifth). Bells are throttled and stay silent when the tab is hidden.

## Extending it

- **Blog.** Each post is a feature: the title in Anybody at full measure, a Newsreader deck, a drop cap, and Tufte-style sidenotes in the right margin (static HTML, shown by default). The left margin holds the date, reading time and related products. Pull quotes break into the right margin in clay italic.
- **Product pages.** Each one opens with a cover: the product name at full width, its one figure as a giant clay numeral, and its own constellation plate showing only that product's sunflower. Changelogs become a dated "back issues" index. Retired products get the same treatment with a single plain line of reason in the margin.
- **Social and OG images.** Paper field, surname at full width, the Seed and one coverline.
