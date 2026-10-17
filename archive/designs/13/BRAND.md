# Bloom Index — brand book (design 13)

## Vision
Albretsen AS is an index, not a pitch. The page is a board of blocks on a visible grid, like an Are.na channel. It lists everything built, what is running, what is paused and what was retired. Beside the index, a log shows the running products doing their work in real time. People should come away thinking two things: the work is precise, and it never stops. Tomorrow's interface, today: no images, no illustrations, only type, rules and one colour that carries meaning.

## Personality
Minimal futurist with an internet-native collage streak. The base is calm (paper, ink, hairlines), and the type is loud. Three families that should not get along share a strict 12-column grid, and the grid is what makes them agree. That combination is the brand: ambition kept under control.

## Voice: terse engineer
- Short declaratives. Present tense. Units, dates and counts instead of adjectives.
- Never sells. It states what exists and lets the reader draw the conclusion.
- Sample lines:
  - "Builds software that pays for itself."
  - "Index of things shipped, running and retired."
  - "all products · newest first"
  - "12 events since you arrived"
  - "Takes one outside engagement at a time."
- Banned: hire me, let's connect, passionate, any exclamation mark.

## Mark: the Bloom Point
An ink disc overprinted by a magenta disc, offset down and to the right by 28%, blended with multiply so the overlap becomes a darker lens. One reading is a signal blooming out of a solid point. Another is two layers registering into one. It is built with two CSS pseudo-elements, with no SVG or image. On every live event the magenta disc swells by 16% and settles back over 0.9 s. The favicon is the same two discs, drawn to a canvas at runtime. The wordmark is `albretsen.no` in JetBrains Mono 600, with the dot in spot colour.

## Colour: paper, ink, one spot (hue 324)
| token | OKLCH | hex | use |
|---|---|---|---|
| paper | 0.985 0.006 324 | #fcf9fc | ground |
| paper-2 | 0.955 0.01 324 | #f4eef4 | fact chips |
| ink | 0.20 0.02 324 | #1b131b | text, frames (17.4:1) |
| ink-2 | 0.45 0.02 324 | #5b525c | secondary (7.2:1) |
| ink-3 | 0.55 0.015 324 | #766f77 | tertiary (4.7:1) |
| rule | 0.86 0.015 324 | #d6ced7 | grid hairlines |
| **spot** | 0.60 0.26 324 | #c526d5 | fills: mark, caret, live chip |
| spot-text | 0.52 0.23 324 | #a419b1 | spot as text (6.0:1) |
| tint | 0.93 0.05 324 | #f9ddfb | the newest log line, fading |

Rule: **spot means now.** It appears only where something is live: the mark, the caret, the newest line, live status chips, the counters while they tick. Static content is never magenta.

## Typography: three families that clash, one grid
- **Instrument Serif Italic**: first name, figures, product one-liners. Condensed, high-contrast and human.
- **Archivo Expanded 800** (wdth 125): surname, section heads, product names. Wide, black and machine-like.
- **JetBrains Mono**: the log, labels, years, status and the MCP line.
"Asgeir" in the serif sits directly on top of "ALBRETSEN" in the expanded grotesk, and the two overlap slightly. That clash is the signature. Retired products switch their name from the grotesk to the serif italic, so the type itself shows the change of state.

## Layout system
- 12 columns, gap `clamp(8px, 1.2vw, 24px)`, outer gutter `clamp(16px, 2.4vw, 48px)`, max width 2560 px. Column lines are drawn as hairlines at 55% rule colour, so the grid is always visible.
- 8 px vertical unit. All children use CSS subgrid, so blocks, the log and the footer snap to the same tracks.
- Hero: identity in columns 1–6, log in columns 7–12. Below 1100 px they stack, with the log directly under the name.
- Index: blocks span 3 columns (≥1500 px), 4, 6, or 12 (≤640 px). Every block has a 1 px ink frame. Retired blocks use a rule-colour frame, and paused blocks use a dashed frame.
- The log has 12 fixed-height slots. New events rewrite the slots instead of inserting elements, so layout shift is zero.

## Motion: teletype
- New log lines arrive one character every 18 ms (time, then product, then text), with a magenta block caret.
- The newest row flashes tint and fades to paper over 3.5 s. The mark blooms. Nothing else moves.
- The page has no scroll-jacking, no parallax and no loops. When the products are quiet, the page is quiet.
- With `prefers-reduced-motion`, lines appear whole and all transitions and animations are disabled.

## Sound (opt-in)
Off until the visitor presses `sound off`. All sound is synthesized with Web Audio, and the module loads only on that click.
- Drone: D2, A2 and D3 sines, detuned by a few cents, through a lowpass filter that drifts on a 20 s LFO.
- Activity: each event raises an activity level that decays over about 45 s. Rising activity opens the drone's filter and lifts its gain, so a busy hour sounds brighter.
- Each event blooms one note in D major pentatonic. The note follows a random walk, so successive notes form a line. MCP Emails plays a high sine, Fun Libs a mid triangle and Toolrails a low sine. A page served gives a soft low D, and a deploy plays a four-note bloom.
- Everything runs through a synthetic 3 s room and a 420 ms darkening echo. With no events there are no notes.

## Extending
- **Blog**: the post list is an index of blocks: date in mono, title in Archivo Expanded, standfirst in the serif. Article body is Instrument Serif at 21–23 px over 6 columns. Code and footnotes go in mono in the margin columns. Pull quotes use the serif italic at display size and are never coloured.
- **Product pages**: the hero copies the home split. Product name in Archivo Expanded on the left, that product's filtered log on the right, then its facts as blocks. The spot colour still means only "live": MCP Emails pages show the agent log in magenta caret type.
- **Tone everywhere**: one sentence, then the numbers.
