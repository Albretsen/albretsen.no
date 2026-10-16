# UNCUT

*Opening titles for a company that shows the whole reel, outtakes included.*

## Vision
Most portfolios are trailers: only the best shots, cut fast, with the music up. Uncut is the raw footage instead. The site opens like a film title sequence (Saul Bass bars, Kyle Cooper jitter), and then it simply shows what is going on: a `tail -f` of every product, a cast list with real numbers, and a cutting-room floor where the retired experiments keep their credit. Nobody gets told that the work is good. They watch it run and decide for themselves.

The big idea is **colour means now**. Everything is grey. Hue (built around OKLCH 312°) only shows up when a real event arrives while you are on the page. The tail line, the horizon tick, the product row, the title glitch, the favicon and the tab title all react to that one event at the same moment. Then they fade back to grey.

## Personality
Brutally honest, playful, curious. It shows its seams on purpose: monospace, visible rules, a terminal that says "detached" until JavaScript attaches it. It has no polish for polish's sake. It is precise rather than decorative.

## Voice
Short, dry, first person, no selling. It says the quiet part out loud. It never asks for anything.

- "I build software to find out what pays. Some of it does. The rest is listed below anyway."
- "Everything still on set. Each one gets a single number, the one that is true today."
- "Experiments that did not make the final cut. They stay on the page, because pretending they never happened would be the bigger lie."
- "tail: the log attaches with JavaScript. Everything else on this page works without it."
- Tab, while you are away: "(3) fun-libs: story completed _/\_ ALBRETSEN"
- Tab, when you come back: "3 happened while you were out _/\_ ALBRETSEN"

Banned: hire, connect, passionate, solutions, any exclamation mark.

## Mark
`_/\_` is a peak (an A with no crossbar) standing on a horizon line. It is four ASCII characters, so it can be typed anywhere: commit messages, CLI banners, email signatures. Next to it the wordmark is **ALBRETSEN AS** in Big Shoulders Display 800 with 0.18em tracking.

**Favicon.** On a black 32 px square the peak is drawn as a stroked path (3.6 px, mitred apex) and the horizon as two 3 px strokes at the feet. When idle the horizon is grey (#868686). When an event arrives it lights in that product's hue for 3 s. If the tab is hidden it stays lit until you come back, so you can see that something happened just from looking at the tab strip.

**Tab title.** The title is designed copy, not a label. The default is `ALBRETSEN _/\_ software, uncut`. While the tab is hidden it becomes a counter plus the latest event. On your return it says once how much you missed, then goes back to the default.

## Colour
Greys are true neutrals (OKLCH chroma 0). Event hues are allowed only on live elements.

| token | OKLCH | hex | use |
|---|---|---|---|
| g0 | 0.13 0 0 | #070707 | leader black, page |
| g1 | 0.18 0 0 | #121212 | terminal panel |
| g2 | 0.26 0 0 | #242424 | rules |
| g3 | 0.50 0 0 | #636363 | ticks, timestamps |
| g4 | 0.62 0 0 | #868686 | dim text (5.6:1) |
| g5 | 0.76 0 0 | #b1b1b1 | body text (9.6:1) |
| g6 | 0.95 0 0 | #eeeeee | titles (17:1) |
| ev/mcp-emails | 0.72 0.20 312 | #ce79fd | seed hue |
| ev/fun-libs | 0.80 0.14 342 | #fb98d7 | seed +30° |
| ev/toolrails | 0.70 0.16 282 | #908ffe | seed −30° |
| ev/albretsen.no | 0.86 0.07 312 | #e1c4f3 | seed, low chroma |

## Typography
- **Big Shoulders Display 800/900**, all capitals, condensed. It is used for titles, product names, figures and the index. The name is set at about 21cqi so ALBRETSEN fills the frame like a title card. ASGEIR sits above it at 0.46× size with wide tracking, like a "presents" credit.
- **JetBrains Mono 400/700** is used for everything else: body copy, the log, metadata, slates. Slashed zero is on.
- The fonts load with `display=optional`, so there is never a font swap and never a shift.

## Layout system
- A **fixed index on the left** (15.5 rem) works like a reel list: 00 Titles, 01 tail -f, 02 The cast, 03 Cutting room, 04 End credits. The current reel is shown inverted. The index also holds the running timecode (how long you have watched, at 24 fps), the count of live events you have seen, the sound toggle and, at the very bottom in g3, the unexplained `claude mcp add albretsen https://albretsen.no/mcp`.
- **Reels** scroll on the right. Each one opens with a slate line ("Reel 02 / The cast").
- The **horizon** is a 24-hour line for today. Each event places a tick at its local time, with a dashed NOW marker. Two short Bass bars sit under it.
- The **cast** is a five-column credit grid: year / NAME / line // facts / figure / status. Below 52 rem of container width it collapses to three areas.
- Below 56 rem of viewport width the index becomes a header block. The layout holds from 320 px up to 2560 px, and the sidebar widens at 160 rem.
- The terminal has a fixed height (12 lines × 1.5 rem) with lines anchored to the bottom, so new events never move the page.

## Motion
The intro runs once, in CSS. The horizon bars wipe in, and the name rises from behind the horizon (clip-path).

After that nothing moves unless something real happens. On an event:
- the title runs a 380 ms sliced glitch, with one slice in the event hue and one in grey, rate-limited to one every 1.4 s;
- the new log line decodes from glyphs over 8 frames;
- the horizon tick cools from hue to grey over 8 s;
- the product row gets a hue bar that fades over 5 s.

There are no loops or timers dressed up as activity. The only things on a timer are the timecode and the NOW marker, and both tell the truth. With `prefers-reduced-motion` all of this is removed except the colour change, the timecode drops to whole seconds and the cursor stops blinking.

## Sound
Sound is off until you press the toggle. Nothing loads before then: it is synthesized with Web Audio.
- **Bed.** A projector-room hum: D2/D2/A2 sines detuned against each other, plus brown noise through a band-pass. The bed's low-pass opens with activity (each event adds energy, which decays by 6 % per second), so busy hours sound brighter and the night sounds closed.
- **Events.** One pluck per event from D minor pentatonic, through a 420 ms dark tape delay. Each product has its own register: MCP Emails is high, Fun Libs is mid triangle, Toolrails is low. A deploy plays a fifth-and-octave chord. The note is hashed from the event id, so an event always sounds the same.

## Extending it
- **Blog.** Each post is a reel. The title card is set in Big Shoulders, the body is in mono at 68ch, and the date appears as a slate ("Reel 2026-07-28 / Fun Libs: 113,000 installs later"). Footnotes work like outtakes. The index on the left lists the posts. If a post concerns a product, a hue appears only when that product emits an event while you read.
- **Product pages.** These are single-product cuts. The hero is the product name rising over its own horizon, ticking only with its own events, and its `tail -f` is filtered to that product. Facts go in a credit grid. Retired products get a page too, with the status RETIRED in the slate and no apology.
- **Social / OG images.** Black frame, `_/\_` top left, a name in condensed capitals on a grey horizon, and one hue tick at the moment the image was generated.
