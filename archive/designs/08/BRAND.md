# Threshold

*Brand exploration 08 for Albretsen AS / albretsen.no*

## Vision
Most portfolios say what someone has done. This one shows it happening. The homepage is a heat grid: four bands (MCP Emails, Fun Libs, Toolrails, albretsen.no), one column per minute, with the newest minute at the right edge. That edge is the **threshold**, where the next minute comes in. Each event lights its cell in one electric cyan. When nothing happens the grid stays dark, and that dark is real. The name, the sentence and the products are set on top of the grid like layered film in a Weingart collage. Two things are left for the visitor to notice: the grid never fakes activity, and everything on the page lines up to the same grid.

## Personality
Playful precision. The type clashes, steps down the page and leans toward the cursor, but every letter, line and cell starts on a grid line. It's clearly having fun, and none of it is accidental.

## Voice
Poetic and minimal. Short sentences, concrete nouns, and no selling. It states, and it never asks.
- "Each square is a minute. Each light, someone."
- "I build software for people, and for the agents working beside them."
- "Made — kept, paused, let go."
- "Fun Libs · 14:32 · silence"
- "The grid goes quiet at night. It is still listening."

Banned: "hire me", "let's connect", "passionate", and any word that sounds like a pitch.

## Mark
Four bars, right-aligned against a vertical *now* line. Each bar's length is the square root of that product's events over the last fifteen minutes, so the silhouette is a staircase that redraws itself from live data. In the header it updates on every event. The favicon is regenerated as an SVG data URL. The static `favicon.svg` shows a typical afternoon. When there's no data, a bar shrinks to a stub rather than disappearing, so the mark always has four steps.

## Colour
Near-black with one electric accent at OKLCH hue 192.

| Token | Dark (default) | Light (the inversion) |
|---|---|---|
| bg | `#050c0b` · oklch(0.145 0.012 192) | `#f3f8f8` · oklch(0.975 0.005 192) |
| cell | `#0c1615` · oklch(0.19 0.014 192) | `#dfe8e8` · oklch(0.925 0.01 192) |
| line | `#1b2726` · oklch(0.26 0.016 192) | `#c9d4d3` · oklch(0.86 0.012 192) |
| ink | `#ebf6f5` · oklch(0.965 0.012 192) | `#091111` · oklch(0.17 0.012 192) |
| mute | `#9dafae` · oklch(0.74 0.02 192) | `#495958` · oklch(0.45 0.02 192) |
| **accent** | `#0ff6f1` · oklch(0.88 0.15 192) | fill `#00d9d5` · text `#006d6b` |

Cyan is the only hue, and it only appears where something is live: lit cells, live status squares, product names in the log, the *now* line. Heat is shown by opacity, never by a second colour.

## Typography
Three families that clash on purpose. The grid is what holds them together.
- **Syne** (variable 400–800), *the signal*: wide, loud, uppercase. Weight carries meaning. In product names it shows vitality (live 800, building 650, paused 500, retired 400). In ASGEIR it is mixed within one word, after Weingart, and follows the cursor.
- **Instrument Serif**, *the poem*: condensed, italic for the surname and headings, roman for the sentence and product lines.
- **Space Mono**, *the machine*: timestamps, counts, labels, the readout, and the MCP command.

Vertical type turns up wherever the machine labels the grid: band names, the section tag, and event ghosts.

## Layout system
- A single column grid, `--cols`: 12 / 24 / 36 / 48 at 0 / 640 / 1100 / 1800 px. The canvas heat grid reads the same variable, so a column of type and a minute of data are the same width.
- The hero is 100svh, split into 4 product bands (8 half-rows for placing type). Text is placed on grid lines and stepped down: ASGEIR, then Albretsen two to four columns further right, then the sentence, then the log.
- **Silence zones**: cells under text are drawn at a third of their strength, so the type always reads and the grid seems to hush around it.
- Small text sits on near-black strips (box-decoration-break: clone), like film laid over the grid.
- The rightmost column is left empty. That's where the threshold is.

## Motion
Only real events or the visitor make anything move. Nothing loops.
- **Event**: the cell flashes with an ink outline that fades over 1.4 s. The event text then writes itself vertically into the now column and disappears in steps.
- **Minute turn**: every column steps one place into the past.
- **Cursor**: a crosshair picks out the row and column under it, and the readout names the cell ("Toolrails · 14:31 · silence"). ASGEIR's letters gain weight near the pointer and Albretsen's letters lift slightly. Letter boxes are fixed width, so nothing reflows.
- Transitions use `steps()` easing, so they move in discrete cells, not smooth glides.
- `prefers-reduced-motion`: no flashes, ghosts or sweep. The data still updates.

## The light/dark toggle
The toggle is labelled *lights on* / *lights off*. Clicking it sends the new theme across the page from the threshold into the past, one grid column per step (a View Transition clip-path stepped to `--cols`). If sound is on, a falling run of ticks plays with the sweep. The choice is saved per visitor.

## Sound
Off until the visitor turns it on. The button reads *silence* until pressed, then *sound*. Everything is synthesised with Web Audio, through a low-pass filter at low gain:
- live event: a sine note per product (E5, C5, G5, G4 — pentatonic, so any overlap still sounds consonant) plus a faint octave
- crossing a cell: a 25 ms triangle tick
- theme sweep: up to 16 ticks falling an octave over 0.74 s
- nothing plays while the tab is hidden

## Accessibility and performance
The hero renders before JS: a CSS-drawn empty grid, the name, the sentence and the band labels. The products list is baked into the HTML by `build.mjs` from `content.js` and re-rendered at runtime from the same source. The grid can be read from the keyboard (Tab to it, arrow keys move between cells, the readout is aria-live). Total weight without fonts is about 50 KB.

## Extending it
- **Blog**: each post gets a one-row heat strip as its masthead, showing the minutes it was written in, or its commits by day. Titles are set in Instrument Serif italic, body in Instrument Serif roman on the same column grid, and code in Space Mono on near-black strips. Post dates line up as a vertical mono rail.
- **Product pages**: the product's own band, enlarged to the full viewport, is the hero. Its single figure is set huge in Syne, with its facts as mono labels on grid lines. Retired products keep their band, permanently dark, captioned *let go* with Asgeir's own one-line reason.
- **Everywhere**: one accent, three voices, one grid. The mark always comes from real data.
