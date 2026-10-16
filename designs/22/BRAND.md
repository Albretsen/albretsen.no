# Hjemmeside

*Hjemmeside* is the Norwegian word for a homepage. This direction starts from the personal homepage of the late 1990s: a fixed index frame on the left, one plain page, blue underlined links, a visitor counter, "last modified" and "thanks for visiting". It keeps the honesty and the structure of that web and rebuilds it with modern care. Nothing in it is nostalgic kitsch. It is the homepage a very good engineer would have made if he had had today's tools and taste in 1996.

## Vision

Most technology sites try to impress you. This one lets you look around. The products and the live log show that real things are running, in several places at once, built by one person. The understatement creates the tension: the page is small and plain, but what it reports is large. Visitors should leave thinking "this person is calm, careful and gets a lot done", without the page ever saying so.

## Personality

Nordic understatement. Plain, honest, light, unhurried. Confident enough not to explain itself. It keeps its own record, retired products included.

## Voice

Short declarative sentences. No adjectives that praise. Numbers only when content.js has them. Use a Norwegian word where a Norwegian would naturally use one, and leave it untranslated when the context makes it clear.

- "Hei."
- "I build apps, SaaS and infrastructure for AI agents in Norway, and keep the ones that earn their keep."
- "Akkurat nå. Every product, as it happens. Newest on top. Nothing is replayed or sped up."
- "11 entries, the oldest from 2019. The retired ones stay on the list."
- "Takk for besøket."
- Banned: hire me, let's connect, passionate, innovative, any sentence that asks for attention.

Norwegian words in use: *Hei* (hi), *Innhold* (contents), *Akkurat nå* (right now), *Kontakt*, *Sist endret* (last modified), *Lyd: av / på* (sound off / on), *Takk for besøket* (thanks for visiting). Never more than one or two per screen.

## Mark

An 8 × 8 pixel capital **A** with a single blue pixel to its lower right: "A." as in Albretsen AS, and also a cursor. It was drawn for the 16 px favicon first (2 device pixels per cell) and is only ever scaled by whole numbers (16, 24, 32, 64 px), with `shape-rendering: crispEdges`. The letter's top corners are cut away, so the pixel form echoes the rounded type.

The blue pixel is the pulse. On the live page it springs larger and settles each time a real event arrives. The pixel square is also the site's only ornament: it marks the active index entry, the newest log line and the product status.

- `mark.svg`: favicon, with a dark-mode variant built in.

## Colour

Warm, earthy neutrals built from the seed hue (0°, toward rosehip and clay), with one cool accent: the blue of a hyperlink. Blue means "this is alive or clickable" and nothing else.

| Token | Role | Light | Dark |
|---|---|---|---|
| paper | page | `oklch(96.8% 0.010 55)` #faf3ee | `oklch(20% 0.010 40)` #1a1513 |
| side | index frame | `oklch(94% 0.014 50)` #f3e9e3 | `oklch(23% 0.012 40)` #221b19 |
| well | log window | `oklch(92.5% 0.016 45)` #f0e3de | `oklch(25.5% 0.014 35)` #29211e |
| rule | lines, dotted rules | `oklch(84% 0.020 40)` #d7c7c1 | `oklch(38% 0.018 30)` #4c3f3d |
| muted | secondary text | `oklch(50% 0.030 30)` #735d59 | `oklch(72% 0.022 40)` #b2a09a |
| ink | text | `oklch(27% 0.024 10)` #312224 | `oklch(94% 0.012 55)` #f2e9e4 |
| nype | rosehip, the seed hue: paused status, selection | `oklch(57% 0.090 5)` #a46070 | `oklch(72% 0.085 8)` #d38e9a |
| blue | the one cool accent: links, live, pulse | `oklch(50% 0.160 258)` #1d60bc | `oklch(77% 0.110 255)` #84b7f9 |

Text on paper, muted on well and blue on paper all pass WCAG AA in both schemes.

## Typography

- **Nunito** (rounded, humanist, friendly) for everything.
- **DM Mono** for the log, years, status words, the meta values and the MCP line.
- **One font size for everything except the name.** `--fs: clamp(1rem, 0.93rem + 0.2vw, 1.1875rem)` applies to headings, body, log, index and footer alike. Hierarchy comes from weight (400 / 600 / 700 / 800), colour (ink or muted), mono or sans, and space.
- The name is the only exception: Nunito 800, `clamp(2.75rem, 15cqi, 10.5rem)` relative to the content column, set on two lines, with tight tracking. The tension between the one small size and the one very large name is the whole typographic system.
- A metric-matched fallback (`size-adjust`, ascent and descent overrides) keeps the font swap from moving anything.

## Layout system

- A fixed **index frame** on the left (17.5 rem, 21 rem above 1800 px) holds the mark, *Innhold* and the section list. A blue pixel springs to the section you are reading.
- At the foot of the frame, quiet: *Since you came* (an honest counter of events that happened while you were here, the successor of the hit counter), *Sist endret* (from the server's real Last-Modified, otherwise a dash), the sound toggle, and `claude mcp add albretsen https://albretsen.no/mcp`, unexplained.
- The content column scrolls: *Hei.* → name → one sentence → *Akkurat nå* log → Products → footer. Sections are divided by dotted 2 px rules (round dots, like the type).
- Under 860 px the frame folds into a sticky top strip (mark + index), and the meta block moves to the end of the page. It works from 320 px to 2560 px, and the content column caps at 68 rem.
- Products are a directory table: year (mono), name, line with facts beneath in muted, status (pixel + word), figure. Retired entries stay visible, in muted text with a hollow pixel.

## Motion

Spring physics with inertia (`spring.js`, a semi-implicit damped oscillator with persistent velocity):

- **Log**: 12 visible fixed slots, plus 3 hidden ones. A new event writes into the slots and offsets the list by one row, and a spring (stiffness 220, damping 25) brings it home with a slight overshoot. If another event arrives mid-flight, the offset adds up and the velocity carries over, so bursts feel heavier than single events. Only transforms move, so there is zero layout shift.
- **Pulse**: the mark's blue pixel gets a kick and wobbles back (stiffness 320, damping 11).
- **Index marker**: springs between sections (stiffness 170, damping 19).
- Quiet hours are real: if nothing happens, nothing moves.
- `prefers-reduced-motion`: no springs. Rows update in place and the pulse becomes a short colour change.

## Sound

Off until the visitor presses *Lyd: av*. Everything is synthesised with Web Audio, and no files are loaded.

- Toggle on: two soft sine notes going up (E5, B5). Toggle off: one lower note.
- Each live event: a 120 ms filtered sine tick, pitched per product (MCP Emails A5, Fun Libs E5, Toolrails B5, albretsen.no C5), so a busy minute sounds like a quiet pentatonic wind chime. There is no sound while the tab is hidden.
- Index clicks: a very quiet 50 ms tick.

## Extending it

- **Blog** (`/blog/<slug>`): the same frame, with the post list under *Innhold* as `2026-08-19  Stop caring about all-time highs` in mono dates. The article body uses the same single size. The post title gets weight 800, not size. Code blocks use the log's well. At the end: *Takk for at du leste.*
- **Product pages**: the product's name takes the name's large size (the one exception moves to whatever the page is about). Below it go the status pixel, the one figure, its facts as a plain list, and a log filtered to that product only (`Akkurat nå i Fun Libs`). Retired products get a page too, with the reason in Asgeir's own words once he writes it.
- **Social images and the favicon**: the pixel A on paper, at whole-number scales only.
