# Low Sun

*Brand exploration 11 for Albretsen AS / albretsen.no*

## Vision
In October the sun over Oslo never climbs much past twenty degrees. Everything throws a long shadow, and the light goes the colour of a hot coal. Low Sun turns that light into a publication. The whole page is one saturated vermilion. The name **Albretsen** fills the first screen like the masthead of a respected paper, and below it lies the shadow the *actual* sun over Oslo would cast from it right now, worked out from the real solar position. Under the fold, every product plays on a live score. The site doesn't claim to be skilled. It just is, and the details are there for anyone who looks closely.

## Personality
Editorial gravitas with a pulse. It's as sure of itself as a broadsheet front page, as exact as a footnote, and warm enough to make a joke in the caption. It's ambitious without shouting and reasonable without being dull.

## Voice
Warm and witty, in the third person. Short sentences that are true, and a dry line where a weaker brand would put an adjective. It never asks for anything.

- "Builds software that pays its own way: apps, SaaS and the plumbing AI agents run on."
- "Busier days get bolder type; quiet ones get a lighter touch."
- "What is up, what is rising, and what has set. Nothing gets quietly deleted."
- "Every product, played as it happens. Quiet stretches are real."
- Section names read like a contents page: *The score*, *The works*, *Below the horizon*.

Banned: hire me, let's connect, passionate, any exclamation mark.

## Mark
An abstract low sun: a solid disc floating above a horizon rule, with a pale trapezoid shadow beneath it. The same three shapes make the status system for products: **live** = disc above the line, **building** = disc rising through it, **paused** = disc sitting on it, **retired** = an outline below it. The favicon is the mark in ink on a vermilion tile.

## Colour
The vermilion owns the page. Ink is the only colour used for text.

| Role | OKLCH | Hex |
|---|---|---|
| Sun (page) | `oklch(0.66 0.226 36)` | `#fd4800` |
| Polar ink (all text) | `oklch(0.17 0.06 262)` | `#020c2a` (5.6:1 on Sun) |
| Cast shadow | `oklch(0.52 0.19 33)` | `#b8301a` |
| Midnight cream (highlights, never text) | `oklch(0.96 0.035 80)` | `#fef0d8` |
| Blue hour (the shadow after sunset) | `oklch(0.45 0.13 262)` | `#2b519c` |

When the sun over Oslo is below the horizon, the shadow turns blue-hour blue and the caption says so.

## Typography
- **Fraunces**, a variable font with four axes (opsz 9–144, wght 100–900, SOFT, WONK). It sets the masthead, the headings and, at text optical size, the body.
- **The masthead is live.** Its weight is the number of events from the last two minutes: about 280 when things are quiet, 900 when they're busy. Each new event pulses one letter heavier (or lighter, when the name is already heavy) and switches on its WONK forms for a moment. A caption reports the current weight.
- **IBM Plex Mono** for data: timestamps, staves, the MCP line.
- The name is SVG `<text>` fitted with `textLength`, so the masthead always spans the measure exactly, whatever the weight or fallback font. Nothing reflows when the fonts load.

## Layout
- The first viewport is the masthead: a dateline strip with a double rule, a small italic *Asgeir*, then **Albretsen** edge to edge, then the ground with its cast shadow, the dek and the unexplained `claude mcp add` line. On portrait screens the name stacks as *Alb / ret / sen*, like a poster, and only the bottom line casts the shadow.
- Then come a news-page grid with a 16–56 px gutter, hairline rules between items, mono kickers and big lining numerals for the single figure each product has.
- Products: four active works sit side by side as front-page columns. Retired ones are listed *Below the horizon* as a ledger and stay on the record.

## Motion
Controlled glitch, and only when something happened. A rarer event (a deploy, a new inbox, a new player, a scheduled send) tears one thin slice of the masthead sideways, with a cream ghost, for 150 ms and at most once every nine seconds. New notes on the score arrive torn and settle into place. The shadow eases to a new angle each minute as the real sun moves. The page never fakes activity or speeds it up. With `prefers-reduced-motion`, the glitches and pulses are off, the score redraws every five seconds, and the weight changes in steps.

## The live feed: a score
A piano roll with one stave per product: MCP Emails, Fun Libs, Toolrails and albretsen.no. Each kind of event has its own pitch line. Time runs right to left toward the playhead, with a bar line every minute and ten minutes to a page (five on phones). Note length follows the event's latency, and a deploy is a held chord across its whole stave. A text ledger beside it lists the last five events.

## Sound
Off until the visitor presses *Sound*. Everything is synthesised with Web Audio: a triangle-and-sine pluck at the pentatonic pitch of the note's row (so the score really plays), a soft three-note chord for deploys, a 30 ms band-passed noise tick for each glitch and a two-note blip on the toggle. It runs through a low-pass at 2.6 kHz, quiet like a music box in another room.

## Extending it
- **Blog:** each post is an article. A small masthead strip at the top, the headline in Fraunces at opsz 144 and weight 380, body text at opsz 14 on the vermilion with a 66-character measure, footnotes in mono. The post's weight could be set by its reading time.
- **Product pages:** each product gets a *section front*. Its name is set large and casts the same real shadow, its single figure appears in big lining numerals, and its own stave from the score plays live under the headline (Fun Libs stories, MCP Emails sends).
- **Social cards and OG images:** vermilion, the name, and a shadow at the angle the sun had over Oslo when the card was rendered.
