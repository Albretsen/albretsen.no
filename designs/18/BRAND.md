# Preprint — brand book (design 18)

## Vision
Albretsen AS presents itself the way a good paper presents a result. The page has a title, an abstract, Fig. 1 and Table 1, and nothing in it is decoration. The awe comes from restraint and evidence. Every number is checkable, every product is listed (retired ones too), and the one moving part is a real measurement. A visitor concludes "this person ships" from the evidence. Nobody has to tell them.

## Personality
Scientific calm: measured, evidence-first, precise. Unhurried, because the record speaks.

## Voice: numbers first, adjectives never
- Lead with the count, then the claim. Cut every adjective that a number could replace.
- Use declaratives a referee could verify. No "passionate", "innovative" or "world-class", and no calls to action.
- Samples:
  - "113,000+ installs, $782 MRR, 2 products live, 1 building."
  - "11 entries. 2 live, 1 building, 1 paused, 7 retired. Retired work stays on the record."
  - "Colour marks recency: an event's colour halves every 120 s."
  - "Takes one outside engagement at a time."

## Mark
The mark is a 7 x 7 field of short strokes, read like grain in a sample, or like iron filings in a flow. The base field is fixed: a gentle wave that curls around a point just above centre. That curl is the identity. Each visit adds a perturbation seeded from `crypto.getRandomValues`, and the seed is printed in a sidenote, so the mark is reproducible but never the same twice. Before JavaScript runs, the page and the static favicon show the unperturbed base field. Afterwards, the favicon is redrawn from the visit's seed. Source: `mark.js` (`markPath(seed, amount)`).

## Colour
The page is greys only, at chroma 0. Colour exists solely as a property of live events.

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| paper | 0.972 0 0 | #f6f6f6 | page |
| card | 0.995 0 0 | #fdfdfd | feed cards |
| ink | 0.21 0 0 | #181818 | text |
| ink-2 | 0.42 0 0 | #4d4d4d | captions, notes |
| ink-3 | 0.53 0 0 | #6c6c6c | metadata, retired |
| rule | 0.84 0 0 | #cacaca | hairlines |
| dark paper / ink | 0.17 / 0.93 0 0 | #0f0f0f / #e8e8e8 | dark scheme |

Event hues step 90° from the seed hue of 108°. Light mode uses oklch(0.52 0.15 h). Dark mode uses oklch(0.78 0.14 h).

| Product | Hue | Light | Dark |
|---|---|---|---|
| Fun Libs | 108 | #736d00 | #c0be46 |
| MCP Emails | 198 | #008088 | #00d2d7 |
| Toolrails | 288 | #6756b9 | #b3a8ff |
| albretsen.no | 18 | #ae3b47 | #ff9095 |

Chroma is multiplied by `0.5^(age/120 s)`. A fresh event is fully saturated. After a few minutes it has gone grey. A product's row in Table 1 takes the colour of its latest event and cools the same way, so the colour on the page always reports how recently something happened.

## Typography: three families that clash, held by one grid
- **Archivo at 125% width, weight 800.** Used for the name, section titles, product names and the event labels on cards. It is wide, loud and modern.
- **EB Garamond.** Used for prose, the italic product lines, and small caps for Abstract., Fig. 1. and Table 1. It brings a 16th-century face into a technology page.
- **IBM Plex Mono.** Used for times, figures, facts, the seed and the MCP line, which is anything a machine said.
- The clash is deliberate. One baseline unit (`--b: 0.375rem`) holds it together: every line-height, margin and padding is a whole multiple of it. The *grid* toggle in the running head overlays the baseline so you can check the claim.

## Layout
- One narrow centred column of 34rem, like a letter.
- Order of the page: running head, title block with the mark, abstract, Fig. 1 (the feed), the unexplained MCP line, §1 Products as a booktabs table, then a footer with correspondence.
- From 76rem the layout follows Tufte. Sidenotes and product facts move into the right margin. On narrow screens they sit inline, with a hairline on their left.
- The layout is designed at 320 px first. The name breaks after "Asgeir", the mark shrinks to 8 baseline units, and table rows fold into two lines. Wider screens step the type up on the same grid. The root size grows from 16 px to 21 px at 2560 px.

## Motion: spring physics and inertia
- Each card has x, y, scale and opacity, and each is a damped spring integrated in two substeps per frame. For y, stiffness is 210 and damping 22, which is slightly underdamped: one small settle and no wobble.
- A new event drops in from above. The cards below it get a velocity kick (60/i) and carry that momentum into their new slots.
- The stack can be pulled sideways. Deeper cards follow at 1/(1+0.45i), so the stack flows like a current through grain. On release the stack keeps its velocity, overshoots, and returns.
- The first five cards are fully visible. The next seven compress into deck edges. Older cards sink out of the stack and fade.
- With `prefers-reduced-motion`, everything snaps to position. Nothing loops, and the event rate is the feed's real rate.

## Sound
Sound is off until the visitor presses *sound off/on*. Each event plays its product's note from D major pentatonic: Fun Libs A4, MCP Emails B4, Toolrails E5 and the site D4. Each note is a sine wave with a faint third partial, a 12 ms attack and a 1.8 s decay. A 40 ms burst of synthesized band-passed noise on the attack gives each note its grain. All sound is made with Web Audio; no audio files are loaded. A quiet hour sounds quiet.

## Extending
- **Blog.** Each post is a paper: title, date in mono, abstract in small caps, sidenotes for asides, and numbered figures and tables with captions. Body text is Garamond at 34rem. Headings use Archivo with § numbers. Code is in Plex Mono with no syntax colour. Colour appears only if a post embeds a live figure.
- **Product pages.** Each page is a short report: a title row with status and start year, one figure as the abstract, a "Methods" section on how it is built, and a live Fig. 1 filtered to that product, in that product's single hue. Retired products get a page too, ending with Asgeir's own one-line reason.
- **Assets.** The generative mark can be drawn at any size from `markPath(seed)`. Social cards use the base field. A post's mark can use the post's slug hash as its seed.
