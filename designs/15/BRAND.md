# Surface Tension

Brand direction 15 for Albretsen AS / albretsen.no.

## Vision

Surface tension is the force that holds a drop together. It is invisible until something lands on it. Albretsen AS works the same way: one person, several live systems, steady activity you only see when you look closely. The site's job is to make that activity visible and leave out the pitch. The hero is the last fifteen minutes of real traffic. The name above it changes width with that traffic. The products below keep the dead ones on the list, because a builder who shows his retired experiments has nothing to hide.

The visual world is Y2K futurism with restraint: wet chrome, translucent gel, one iMac-shell highlight. It never turns into bubbles, lens flares or a rainbow, and it uses one hue only.

## Personality

Rebellious indie. Self-made, anti-corporate, a little cheeky. There's no "we" because there's no team to imply, and nothing anywhere is "solutions". He would rather show a number than an adjective.

## Voice

Terse engineer. Short declaratives, and numbers carry the weight. One dry joke per screen at most. It never asks for anything.

- "Ships apps, SaaS and infrastructure for AI agents from Norway. Keeps what pays. Retires what doesn't."
- "Shipped. Including the dead ones."
- "Width and weight track how alive a thing is."
- "Takes one outside engagement at a time."
- Easter egg toast: "aqua mode. 1998 called; kept the plastic."
- Banned: hire me, let's connect, passionate, solutions, journey, world-class.

## Mark: The Drop

A closed blob whose radius is `R · (1 + Σ aₖ cos(kθ + φₖ))` for k = 2, 3, 4. The amplitudes and phases come from a random 24-bit seed, with a little gravity squash. Only low harmonics are used, so it always reads as one drop and never as a splat. It is rendered as chrome: a vertical ramp with a dark horizon, a gloss ellipse and a gel underlight. Every visit draws a new one, and the favicon follows. The seed is printed next to the wordmark (`Albretsen AS #c742b1`), so each drop has a name. All 16,777,216 of them are the logo. The static fallback is drop `#c742b1` (`favicon.svg`).

The wordmark is "Albretsen AS" in Geist Mono 500 next to the drop. The display name is set in Anybody.

## Colour

One hue, OKLCH 180, with lightness and chroma doing all the work. The page is dark. Brightness means activity.

| token | OKLCH | hex | use |
|---|---|---|---|
| abyss | 0.13 0.02 180 | #010a08 | deepest ground, footer |
| deep | 0.16 0.025 180 | #02110e | page background |
| shelf | 0.20 0.03 180 | #041a16 | raised ground |
| wet | 0.26 0.04 180 | #082a25 | glow in the hero |
| line | 0.34 0.05 180 | #144039 | rules, dividers |
| sub | 0.62 0.08 180 | #499688 | secondary text, albretsen.no lane |
| mist | 0.74 0.07 180 | #78baac | quiet text, retired |
| aqua | 0.82 0.12 180 | #5addc7 | Toolrails lane, building |
| gel | 0.88 0.14 180 | #50f5db | MCP Emails lane, live |
| foam | 0.95 0.03 180 | #daf6ef | body text, Fun Libs lane |
| glint | 0.99 0.01 180 | #f5fefc | highlights, headlines |

Chrome is a gradient made only from this ramp: glint, foam, a hard horizon at 0.80 to 0.70 lightness, then foam and mist. Chrome is used only on the display name and one emphasised word per heading. All text clears WCAG AA on `deep`, and the smallest text uses `sub` or brighter.

## Typography

- **Anybody** (variable: wdth 50–150, wght 100–900) is the display face. It is the brand's moving part:
  - Hero name: `wdth` = 88 + (events in the last 5 min, capped at 60) / 60 × 24, so the name is wider when traffic is busier. Each event briefly lifts `wght` toward 700–840 depending on the product, then it decays over 0.9 s. The live values are printed under the hero: `wdth 104 / wght 560`.
  - Scrolling away compresses it: a CSS view timeline drives `--sq` from 0 to 1, which pulls `wdth` in by 42 %.
  - Products: vitality is typography. Live is 112 / 760, building 100 / 620, paused 86 / 460, retired 70 / 330.
- **Geist** is the text face, set at 400–500.
- **Geist Mono** is for times, lanes, figures in context, the MCP line and the seed.

Variation is animated through registered custom properties (`@property --w/--g/--sq`), so CSS transitions and scroll timelines can interpolate them. The name lines are single, nowrap, left-anchored blocks, so changes in width never move another box. That keeps layout shift at zero.

## Layout system

- **Hero:** the live feed is the full-bleed background. There are four horizontal lanes, one per product, and each lane's baseline is its surface. Time runs left (−15 min) to right (now). The "now" line and lane labels sit in a right-hand gutter (`--label`). The identity is overlaid at bottom left: the huge two-line name sits directly on the field, with a single translucent glass panel under it holding the sentence and the latest event. The MCP line and the type readout sit in the bottom bar.
- **Events as marks:** each event is a hairline stem with a chrome bead on top. Its height comes from the data the event carries (latency for agent calls, kind for game events). Deploys are dashed and full height, with their sha. Marks fade with age.
- **Gutters:** `clamp(16px, 4vw, 88px)`. Content max-width is 112rem. Root type scales up at 1800 px and 2300 px.
- **Products:** a year ruler from 2016 to 2026 with a bead per product, coloured by status. Below it is a four-column list (year, name and line, status, figure) that collapses to two columns on phones. Status is shown three ways: colour, glyph (bead, half-gel, ring, dash) and word.

## Motion

1. **Honest time.** The strip drifts at exactly the speed of the clock (about 1 px/s on a laptop). Nothing loops and nothing is sped up. Quiet hours look quiet.
2. **Landing.** A new drop falls about 46 px, squashes, overshoots and settles in 720 ms. A ripple then spreads along that product's surface. The header mark wobbles once.
3. **Scroll timelines.** Everything tied to scroll uses `animation-timeline` (`view()` and a named `--hero` view timeline). The name tightens, the field sinks and fades, the glass lifts away, the ruler fills, and product rows rise in. All of it uses transforms, opacity and registered properties, wrapped in `@supports` and `prefers-reduced-motion: no-preference`.
4. **Reduced motion.** There are no landings, no pulses and no drift transitions. Marks still appear in their real place.

## Sound

Sound is off until the visitor presses "sound off". Everything is synthesized with Web Audio, and no files are loaded.

- **Sonic logo, "the drop".** It plays once when sound is switched on. A sine glides from 330 to 990 Hz in about 90 ms (breaking the surface). Then E6 and B6 ring a fifth apart over a soft triangle E5. It lasts 1.2 s.
- **Events.** Each event plays one very quiet drip, pitched per product on an E minor pentatonic scale. Deploys are a little louder. Everything passes through a compressor.

## Easter egg

Type `aqua` anywhere. The glass panel becomes ribbed translucent iMac-shell plastic, the drops swell into gel beads, and a toast says so. Type it again to return to 2026. The browser console prints today's drop seed and a hint.

## Extending

- **Blog:** posts are surfaces too. The index is a single long lane where each post is a drop placed by date, and its stem height is the reading time. Titles are set in Anybody at wdth 80. Body text is Geist at 1.125 rem with a 68ch measure on `deep`. Code blocks are a flatter glass panel. The scroll timeline compresses the title as you read, and a hairline at the top fills like the ruler.
- **Product pages:** each product gets one lane of the hero feed at full size, showing only its own events, with its status typography (wdth and wght) as the headline. A product page gets a two-hue exception at most, and only if its own brand demands it. Retired products keep a page: a still surface, no events, the line, the figure and the year.
- **Social cards and OG images:** the day's drop on `deep` with the name in chrome Anybody, generated from the same seed function.
