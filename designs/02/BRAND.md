# Continue.

## Vision
The site works like a game's title screen just before dawn. It fits on one screen, with a thin HUD frame and a menu that lists every product he has shipped, retired ones included. The live products report in through a party chat. Nothing sells. The work is running, and you can watch it.

The idea behind the name: ten years of shipping since 2016, and he keeps choosing Continue rather than New Game. The full stop says the rest.

## Personality
Quiet confidence. It says little, and it never explains the clever part. It doesn't hurry and doesn't decorate. The confidence comes from the restraint: one size, two colours, and a name that is the only thing allowed to be loud.

## Voice
Poetic and minimal. Short declaratives, present tense, sentence case, and no exclamation marks. The products speak for themselves in the first person, and Asgeir is always "he".

- Hero: *Builds apps for people and infrastructure for their agents. Most of it is awake before he is.*
- MCP Emails: *An agent drafted a reply. 212 ms.*
- Fun Libs: *Someone in Brazil finished a story.*
- albretsen.no: *Deployed 3fa2c1d. 11.8 KB.*
- Retired, on a future product page: *Retired 2024. It taught what it had to.* (Asgeir writes the real reasons.)

Banned: hire, connect, passionate, journey, exclamation marks, and any number that content.js doesn't hold.

## Mark
A single dot.
- It is the **full stop after the name**, in the display face. It beats once (a 700 ms scale) for every real event.
- It is the **brand dot** in the HUD, next to "Albretsen AS".
- It is the **status light** on each menu row: filled means live, a ring means building, a dotted ring means paused, and no dot means retired.
- It is the **sun** in the dawn indicator. It rises over a one-pixel horizon as you read the menu.
- Files: `favicon.svg` and `mark.svg`, a dawn dot on night.

## Colour
Duotone, with exactly two colours and no greys, tints or opacity. Hierarchy comes from inversion, italics, mono and line style (solid or dotted), never from a third value.

| Token | OKLCH | Hex |
|---|---|---|
| Night | `oklch(0.23 0.04 96)` | `#221d05` |
| Dawn | `oklch(0.92 0.13 96)` | `#fee47a` |

Dark mode puts dawn on night, and light mode swaps them: first light. A selected menu item inverts the pair, the way a game cursor does. The contrast is far above WCAG AAA either way round.

## Typography
**One size for everything except the name.** The size is `clamp(15px, 0.6rem + 0.42vw, 21px)`, and nothing else is ever scaled.
- **Instrument Serif** sets the name only, at `clamp(54px, min(10.5vw, 15.5vh), 200px)` with tight 0.84 leading.
- **Newsreader** (optical sizes) carries all reading text: product lines, chat, the sentence.
- **DM Mono** handles the HUD details: labels, status, years, figures, times, the MCP command. Mono means "the machine said this", and serif means "a person or product said this".

Emphasis is italic, never bold. Retired product names are set in italic.

## Layout
- On desktop (≥ 960 × 600) everything sits in **one viewport** with no page scroll. A HUD bar runs along the top and another along the bottom. The name and sentence sit top left, the product menu fills the space below them and scrolls within its own panel, and the party chat runs down the right in a dotted HUD frame with solid corner brackets.
- Below that size the page stacks into one column: name, chat, products, footer. It works down to 320 px.
- Rules are 1 px. Solid rules are structure, and dotted rules are separators. Every gutter is `clamp(16px, 2.4vw, 48px)`.

## Motion
Everything is scroll-driven with CSS scroll timelines. Nothing loops on a timer.
- Menu items are **written in** from left to right as they enter (`view()`, entry range) and **erased** as they leave (exit range).
- The **dawn dot** rises through 180° along a dotted orbit as the menu scrolls. On desktop it follows the menu's named `scroll-timeline`, and on a phone it follows the root scroll.
- When a real event arrives, the chat bubbles move up by transform only, so there is no layout shift. The new bubble is clipped open from its speaker's side.
- `prefers-reduced-motion` turns all of this off, and the page reads the same without it.

## Sound
Off until the visitor presses **Sound off** in the HUD. After that, each product plays its own note of A major pentatonic, the chord of first light:

| Product | Note |
|---|---|
| MCP Emails | A4 |
| Toolrails | C#5 |
| Fun Libs | E5 |
| albretsen.no | A5 |

A deploy adds a fifth. Every note is a sine with a little triangle air, and it goes once round a short feedback echo, the orbit, before it fades. Everything is synthesized with Web Audio, and no audio files are loaded. Because events arrive at their real, uneven pace, the result is a slow, sparse chord.

## Extending it
- **Blog:** same HUD, same single size. The post title is the only thing set in the display face, the way the name is on the homepage. Body text is Newsreader at the one size, about 34em wide, and dates, reading time and footnote markers are in mono. The index is a menu just like the products: one row per post, with the date in the meta column. The dawn dot tracks reading progress through the article.
- **Product pages:** the product name takes the display face. The page opens with that product's own chat history, filtered to the one speaker, so MCP Emails says what agents did today. Facts appear as mono HUD readouts (`17 tools · about 100 providers · AGPL`). Retired products keep a page, with the name in italic and Asgeir's own one-line reason.
- **MCP endpoint:** the command `claude mcp add albretsen https://albretsen.no/mcp` stays unexplained in the footer, on every page.
