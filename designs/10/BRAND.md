# Pust

*Pust* is Norwegian for breath. The direction is a front page set inside a terminal window. It has the gravity of a respected paper and is built from nothing but a monospace grid, two greens and box-drawing characters.

## Vision

Albretsen AS should read like something you subscribe to, not something that is pitching you. The name is set as a masthead cut from metal type: huge, cropped at the edge, two lines laid over each other. Around it, the real activity of the company goes past in a slow orbit: stories finished in Fun Libs, agents reading mail through MCP Emails, tool searches in Toolrails, deploys of this site. Nobody has to say he is productive. You watch it happen at the speed it actually happens.

The restraint carries the taste. There are two colours, one family of type, and no images.

## Personality

Editorial, calm, exact. It's confident because it leaves things out. It never hurries, and it doesn't fill the quiet.

## Voice

Norwegian plainness: short declarative sentences and facts before adjectives. There are no superlatives and no calls to action. A Norwegian word goes in where it is the plainer word, and the English stays next to it.

- Hero: "Apps, SaaS and infrastructure for AI agents. Built in Norway, kept if it pays for itself."
- Section deck: "What runs, what is being built, and what was laid down."
- Statuses: *i drift* (live), *under arbeid* (building), *på pause* (paused), *lagt ned* (retired).
- Feed label: "akkurat nå · right now".
- Retired list: "Lagt ned: retired, kept on the record."
- Sound toggle: "[ lyd: av ]" / "[ lyd: på ]".

Banned: hire me, let's connect, passionate, any sentence about how good the work is.

## Mark

`a░` is a bold lowercase **a** followed by U+2591 LIGHT SHADE, the cursor waiting for the next breath. It is plain text, so it works in a terminal, a commit message or an email signature. The favicon draws it with a dithered block. The footer sets it at poster size.

## Colour

Duotone: exactly two colours. There are no greys, no opacity tints and no gradients. Shading comes from characters (`░ ▒ ▓`), never from mixing.

| name  | OKLCH                  | hex       | use |
|-------|------------------------|-----------|-----|
| Ink   | `oklch(0.25 0.06 144)` | `#0c290d` | screen ground, printed text |
| Paper | `oklch(0.95 0.08 144)` | `#cffdcd` | phosphor text, page ground |

The contrast ratio is 13.9:1. The hero is paper on ink, the screen. The products section is ink on paper, the printed page. Emphasis inverts the two colours; there is no third accent. Transitions on colour are always instant (`0s`, or `steps(1)`), so an in-between shade never appears.

## Typography

Monospace only, everywhere.

- **Space Mono 700** (Colophon, drawn for editorial headlines) for the name, product names, figures and section heads. The name is sized in container units (`19.5cqw`) so it always crops the same way.
- **IBM Plex Mono 400/500** for body copy, meta lines and the feed.
- Metric-matched local fallbacks (`size-adjust`, ascent and descent overrides) mean the swap moves nothing.
- Ligatures are off. Labels are uppercase with 0.08em tracking. Numerals are tabular.

## Layout system

- The unit is the character: `ch` for widths, line-height for rows. Feed items are exactly as wide as their text.
- Frames are CSS double borders standing in for `═`. Legends sit on the border like TUI window titles: `┤ albretsen.no ├` top left, sound top right, the MCP command bottom left, the breath meter bottom right.
- Type is used as image. Large words crop at their container edge, overlap each other (an outlined ASGEIR over a solid ALBRETSEN) and sit behind content. Product figures are huge outlined numerals tucked into the corner of each entry, and the text above them sits on paper-coloured cut-out labels.
- The breath band between hero and products is three rows of `▓ ▒ ░` that thin ink into paper.
- Below 720 px the orbit unrolls into a log under the name, newest first.

## Motion

All of it is pure CSS. JavaScript only writes text and custom properties.

- **Orbit:** each event rides `offset-path: ellipse()`. A registered `--spin` property is animated on the ring, so new events join in phase. One lap takes 7 minutes. Hovering an event holds the orbit still.
- **Typing:** a new event types in with `steps(var(--len))` at 42 ms per character, then shows a blinking block cursor.
- **Cursor:** a 6 × 4 grid of invisible hover zones uses `:has()` to set `--mx`/`--my`. The outlined and solid names drift in opposite directions and the orbit follows a little. The hovered zone shows a `┼` reticle. Product figures fill in and slide when their entry is hovered. Band characters vanish under the pointer and come back 0.7 s later.
- **Breath:** a 5.5 s cycle, about eleven breaths a minute, drives the band's middle row, the `◉` beside the feed label and the `░▒▓` meter.
- `prefers-reduced-motion` stops all of it: events sit in fixed slots and text appears whole.

## Sound

Off until the visitor presses `[ lyd: av ]`. Each new event gets one soft key click per character, synchronised with the CSS typing. A click is 30 ms of decaying noise through a randomised band-pass (1.5 to 2.9 kHz) and a 4.2 kHz low-pass, at very low gain. Spaces are silent and `·` is half weight. Nothing plays while the tab is hidden or when reduced motion is requested.

## Extending it

- **Blog:** an article page is a long ink-on-paper column, 64ch wide. The title is set in Space Mono 700 and crops at the right margin like the name. The byline and date sit in a masthead line, and footnotes are drawn as `└` trees. Code blocks invert to the screen colours. Pull quotes are huge outlined text behind the paragraph.
- **Product pages:** each one opens with a framed hero like the home page. The window legend is the product name, the figure is set enormous and outlined, and the orbit carries only that product's events. Changelogs read as a newspaper's corrections column, dated and plain. Retired products keep a short page in the same voice, headed *lagt ned*, with the reason written by Asgeir.
