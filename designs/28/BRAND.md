# Colophon

*Brand direction 28 for Albretsen AS / albretsen.no*

## Vision
A colophon is the note at the back of a well-made book that says how it was made: which type, which paper, which press. Colophon makes the site that note for a one-person technology company. The page states plainly what exists, shows the grid it is built on, and lets the products speak through a live log. Everything is grey. Colour appears only when something actually happens, so any green you see on the page is real activity.

The direction pairs two disciplines that seldom meet on the web. One is Swiss rigour: a visible, asymmetric twelve-column grid in the spirit of Crouwel's gridded paper. The other is classical book typography: Garamond, true small capitals, old-style figures. A monospace log sits between them. The page reads as engineered and well-read at once, and it has no need to raise its voice.

## Personality
Hacker cool. Understated and insider, and it rewards the curious. It never explains the `claude mcp add` line. The favicon is live. The page has a hidden colophon. The people who notice these things are the people it wants.

## Voice
Confident and declarative. Short sentences, present tense. It states a fact and stops. No adjectives about itself, no calls to action, no "passionate".

- "Builds software for people and for the agents that work for them."
- "Keeps what earns its place, retires what doesn't."
- "Shipped, running, paused and retired. Nothing removed."
- "Takes one outside engagement at a time."
- Log voice: `14:02:11  fun-libs  story.completed  Brazil`

## Mark: the Orbit
The mark is four concentric rings, one per product in the feed. From outer to inner: MCP Emails, Fun Libs, Toolrails, albretsen.no. Each recent event lands as a grain on its product's ring, at the second of the minute it happened. Grain size follows response time where there is one, and older grains fade. The whole figure turns once a minute so that *now* is always at the top tick. That is not decoration: a minute passes.

- The live mark sits in the hero, and the 16 px favicon is redrawn from the same data on every event.
- The static mark (`favicon.svg`, and the folio before scripts run) is one frozen minute.
- Wordmark: ALBRETSEN in real small caps, EB Garamond Medium, tracked +0.14em, set beside the small mark.
- Never coloured, except the single freshest grain.

## Colour
Greys only. The seed hue 132° (a living green) is reserved for events.

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| paper | 0.968 0 0 | #f4f4f4 | ground |
| ink | 0.20 0 0 | #161616 | text, mark |
| ink-2 | 0.36 0 0 | #3d3d3d | secondary text |
| muted | 0.47 0 0 | #5b5b5b | labels, retired (≥ 4.5:1) |
| line | 0.895 0 0 | #dcdcdc | the drawn grid |
| line-strong | 0.78 0 0 | #b7b7b7 | section rules |
| signal | 0.52 0.16 132 | #437a00 | event text, then decays to grey over 9 s |
| signal-bright | 0.66 0.20 132 | #61a900 | event marks: log bar, fresh grain, product dot |

Dark: paper 0.17, ink 0.93, line 0.255, signal 0.80 0.19 132 (#8ed643). A faint grain texture (6%) sits over the paper.

**Rule:** if it is green, it happened within the last few seconds.

## Typography
- **EB Garamond** is the display and text face. The name is set at up to 15rem with tight tracking. Body copy uses old-style proportional figures everywhere (2016, $782, 113,000+). Labels use `all-small-caps` tracked +0.07em. Italic carries the running sentence and the asides.
- **IBM Plex Mono** is the machine voice. It sets the log, the clock, the MCP line and the signal ages, with tabular figures.
- Hierarchy comes from size and case only. No bold anywhere.

## Layout system
- 12 columns at 1100 px and up, 8 from 700 px, 4 below. Columns are always drawn as 1 px hairlines across the whole page, with no gutters. Content sits a padding unit inside each line.
- Hero placement is deliberately asymmetric. The name spans cols 1–11. The lede starts at col 3. The orbit hangs at cols 10–12. The running sentence spans 1–8. The log spans cols 6–12, and the MCP line sits in the bottom left.
- Products are a ruled index: since (old-style year) / name and line / status / figure / signal. Retired rows stay, in lighter grey.
- Max width 2400 px. Side margin 16–56 px.

## Motion: kinetic typography, event-driven
Nothing moves unless the feed moves.
1. **The running sentence** under *Now* types each new event in book prose ("FUN LIBS *story completed, Brazil.*"). It pauses at commas and ends with a blinking caret.
2. **The log** keeps twelve fixed rows. The data shifts down while the boxes stay put, so there is zero layout shift. The newest line types in, with a green bar that fades over 9 s.
3. **The name ripples** once per event, a 0.06em rise travelling outward from a letter chosen by the product's ring.
4. **The orbit** turns continuously, once per minute.

Reduced motion turns off typing, ripple and spin. Updates land instantly and colour still fades.

## Sound
Off until the visitor presses SOUND. Then each typed character makes a soft key: 30 ms of noise through a randomized bandpass filter (1.8–3.4 kHz), with a faint 150 Hz thump underneath. Spaces are quieter. Everything is synthesized with Web Audio, and no files are loaded.

## Easter egg
Type the last word of a book, *colophon*, anywhere on the page. You can also press the ¶ at the end of the footer. Either opens the page's own colophon: its typefaces, the grid at your current width, the measured transfer size and the number of events seen during this visit. The console hints at it once.

## Extending
- **Blog:** the same grid, with text set on cols 3–8 and the margins used for sidenotes in small caps (the Tufte/Bringhurst way). The post date uses old-style figures. Each post ends with a short colophon (words, time to read, commit sha). Code blocks are in Plex Mono, and they are grey.
- **Product pages:** each product gets its own ring from the Orbit as a sub-mark, filtered to that product's events only. The page header is the product's log tail. Figures from content are set large in old-style figures, with the label in small caps. Retired products get a page too: grey, with the reason in Asgeir's own words.
- **Elsewhere** (README badges, OG images, invoices): the frozen Orbit, the small-caps wordmark and one hairline grid. Green stays reserved for live activity.
