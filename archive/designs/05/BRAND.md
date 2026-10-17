# Stille

*Norwegian: still, quiet. Also the instruction a conductor gives before the first note.*

## Vision
Albretsen AS builds whatever earns its place: apps, SaaS, infrastructure for AI agents. Stille presents that work as a terminal pane that keeps score. Nothing on the page boasts. The skill shows in how exact the page is: a hairline grid you can see, one hue, type that only appears in capitals or in mono, and a live score of real events with the silences left in. A visitor should leave thinking *this person finishes things, and finishes them well*.

## Personality
Plain, honest, light, unhurried. Ambitious the way a Nordic winter is: it doesn't announce itself, it just keeps going.

## Voice
Poetic and minimal. Short sentences, lower stakes than the work deserves, never selling. No exclamation marks, no "passionate", no calls to action.

- Hero: "I build software, quietly, and keep what earns its place."
- Products: "Kept running, kept honest." / "Everything that shipped. The quiet ones stay on the list."
- Feed status: "six minutes of everything that runs, one lane per kind of event"
- Visitor note: "you are in the score now"
- Footer: "Takes one outside engagement at a time."

## Mark
A pure wordmark: **ALBRETSEN** in Saira Extra Condensed Light, uppercase. It is custom-spaced. The tracking after each letter grows (0, .015, .03, .05, .08, .12, .17, .23 em), so the word starts tight and slows into open space, like a sound decaying into silence. The first name sits above it in tracked lowercase mono. The favicon is the condensed A with a small accent-coloured cursor block.

## Colour
One hue, 276°, and two tones that trade places at every section boundary (hero, works, footer). Tone A follows the visitor's system preference and tone B is always its opposite, so the page inverts as you scroll whichever mode you arrive in. Product colours work like ANSI colours: same lightness, hues spaced around the seed.

| token | light | dark |
|---|---|---|
| paper | oklch(97.6% .006 276) `#f6f7fb` | oklch(17.5% .03 276) `#0d0f1e` |
| ink | oklch(21% .035 276) `#141728` | oklch(94% .012 276) `#e9ebf3` |
| mute | oklch(47% .03 276) `#565a6c` | oklch(72% .03 276) `#9fa3b8` |
| line (grid) | oklch(86% .018 276) `#cdd0dd` | oklch(29% .035 276) `#262a3d` |
| accent / you | oklch(50% .2 276) `#4b4cd1` | oklch(76% .14 276) `#99a8ff` |
| MCP Emails | oklch(52% .13 236) `#0072a9` | oklch(78% .11 236) `#6cc2f4` |
| Fun Libs | oklch(56% .15 38) `#bb4d2a` | oklch(80% .12 50) `#fca676` |
| Toolrails | oklch(52% .12 158) `#067d4d` | oklch(80% .12 158) `#75d5a0` |

## Typography
- **Display:** Saira Extra Condensed, always in capitals, 300 for the mark and retired items, 500 for headlines. Tight leading (.9 to 1.02).
- **Text and data:** JetBrains Mono 400/600 with ligatures off, so box-drawing characters line up on a true character grid.
Sizes come in two kinds only: monumental condensed capitals and small mono text. Nothing in between.

## Layout
An asymmetric three-column grid (2 : 9 : 5) whose lines are drawn as the 1 px gaps between cells. The narrow left rail holds the section index and a short label (`01 ─ now`, `02 ─ works`). The wide middle column holds the statement, and the right column holds facts and controls. Below 760 px the rail becomes a header strip and everything stacks, with the lines kept. Every row of the products table sits on the same columns as the hero, so the grid runs unbroken down the page.

## The score (live feed)
The hero's feed is a piano roll drawn in box-drawing characters. There are fourteen lanes: one per kind of event, grouped and coloured by product, plus a last lane labelled **you**. Staff lines are `─`, minute bars are `┼`, and notes are heavy `━` strokes whose length follows the event's duration. The score shows six real minutes and redraws one column at a time, the way a terminal does, with no animation. A silence counter records how long it has been since the last note. Hovering a note reads it out in the status line, and the five most recent events are written out as a plain log that keyboards and screen readers can reach.

## The surprise
The empty **you** lane is the visitor's own. Pressing its key, copying the `claude mcp add` line or turning on the sound writes a real note there, among the products, and the status line answers: "you are in the score now". It is honest because it is labelled as you, and it never imitates product traffic.

## Motion
Micro-interactions only. Hover reverses the video (ink and paper swap, as in a TUI selection). Focus draws a double-line frame. Press nudges 1 px. Transitions last 100 to 120 ms, and all of them are removed under `prefers-reduced-motion`.

## Sound
Off until the visitor opts in. Turning it on plays the sonic logo, synthesized with Web Audio: three soft bells stacked in fifths (D4, A4, E5, an orbit opening outward), a rest, then a single low D3 that lets the silence back in. After that, each event rings one quiet bell on a D-major pentatonic pitch for its lane, highest for MCP Emails reads and lowest for you.

## Extending
- **Blog:** each post is a pane with the same rail (`date ─ 2026-07-28`), the title in condensed capitals and the body in mono at a 64 ch measure. Light and dark alternate between the article and its footnotes or related posts. Code blocks get box-drawing frames.
- **Product pages:** the product's own lanes from the score become its header, so Fun Libs opens on its story lanes alone. Below that sit facts in the side column, its figure in monumental capitals and its status glyph (● live, ◐ building, ◌ paused, ○ retired). Retired products get a page too, set in Light weight.
- **Elsewhere:** social cards are a single frame of the score with the wordmark beneath it. Email signatures use the mono line `Asgeir Albretsen ─ Albretsen AS ─ albretsen.no`.
