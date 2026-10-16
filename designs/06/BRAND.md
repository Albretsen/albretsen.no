# Current

*Brand direction 06 for Albretsen AS / albretsen.no*

## Vision

One rule, applied exactly. The site is a field of horizontal lines in the manner of Bridget Riley's *Current* (1964). The name *Asgeir Albretsen* fills the first screen, and nothing draws it except the lines: inside the letters they shift half a period and get heavier. Up close you see stripes. From a step back you see the name.

The field reacts to two things only: the visitor's cursor, which bends the lines like a lens, and real events from the products. Each event that arrives in the log sends one pulse through the field. The work shows itself through the pulses, and nobody has to describe it.

The direction should feel like a person who knows exactly what he is doing and sees no need to mention it.

## Personality

The quiet operator. He is competent and unflashy, and he is obviously effective. He doesn't decorate, explain or hurry. The work is precise, and that precision is what leaves the impression.

## Voice

Dry understatement. State the fact, then stop. Never adjectives about yourself. Numbers carry the weight.

- Hero: "Builds software. Keeps what pays for itself."
- Timeline intro: "In order of appearance. Retired ones stay on the list."
- Empty year: "Nothing listed."
- Today row: "Two live, one building, one paused. Seven retired, still listed."
- Sound: "Silent unless asked."
- No-JS log: "Waiting for the next event. It needs JavaScript to arrive."

Banned: "passionate", "hire me", "let's connect", exclamation marks, superlatives.

## Mark

A monogram **A**, drawn by the same rule as the hero. The square has thin umber stripes on a 4-unit period. Inside the A, the stripes move down half a period and grow from 1 to 2.6 units. The A has no outline: it shows up only where the phase changes. The lowest stripe outside the letter is the cool accent, the one cool line in the mark. File: `mark.svg`, used as the favicon and in the header. Minimum size is 16 px. Below that, the stripes merge into a solid A, which still works.

## Colour

Warm, earthy neutrals with one cool accent at hue 204.

| Role | Hex | OKLCH | Use |
|---|---|---|---|
| Ground (bone) | `#ede5d9` | 0.925 0.018 80 | page, plates |
| Ink (umber) | `#282019` | 0.25 0.018 60 | text, field lines (12.8:1) |
| Accent (cool) | `#006972` | 0.47 0.09 204 | the line under the cursor, live status, links on hover (5.2:1) |
| Sand | `#d3c5b2` | 0.83 0.03 75 | rules |
| Muted | `#6a5a4c` | 0.48 0.03 65 | secondary text (5.3:1) |
| Clay | `#83715f` | 0.56 0.035 65 | decorative only (spine, retired nodes) |
| Night | `#1d1712` | 0.21 0.014 60 | the terminal |
| Night text | `#e6ddce` | 0.90 0.022 80 | terminal text (13.2:1) |
| Night accent | `#57c4ce` | 0.76 0.10 204 | product names in the log (8.6:1) |

Rule: the accent is never used as a fill. It is always a single line, a dot or a word.

Dark mode inverts the ground and the ink. The terminal goes one step darker.

## Typography

One family: **Fraunces**, variable on all four axes (opsz 9–144, wght 100–900, SOFT, WONK), Roman and Italic. There is no sans anywhere, including the terminal.

- Display: wght 800, opsz 144, SOFT 0, WONK 1, tracking −0.035em. The name is stretched vertically to fill its row (scaleY up to 5 on portrait phones), the way Vasarely distorts a grid. Horizontal stripes keep the stretch honest.
- Headings: wght 300, opsz 144, with the italic for the turn of a phrase ("The work, *2016 to today.*").
- Text: wght 380 with automatic optical size, SOFT 30.
- Log: opsz 10, tabular lining figures. A serif `tail -f` is the signature detail.
- Labels: 0.7 rem, wght 600, opsz 9, uppercase, tracking 0.12em.

## Layout system

- First viewport: the name fills it. A thin bar holds the mark and the hero sentence, and a bottom line holds the latest event (`tail -n 1`) and the MCP command, unexplained. All text over the field sits on small bone-coloured plates, so it never competes with the lines.
- Below it: the terminal window, max 1080 px, with 12 lines, a fixed height and a blinking block caret.
- Products are a timeline running from 2016 to today, read top to bottom. There are four columns: year, axis, body, figure. The axis works like a lane graph. A thin spine runs through every year, and each product still running gets its own lane from the year it started down to *Today*. Live lanes are the accent, building is ink, paused is dashed. Retired products sit on the spine as hollow nodes and stay fully legible.
- Gutter: clamp(16 px, 3 vw, 56 px). The line period in the field is width/190, clamped to 6–11 px.

## Motion

Nothing moves on its own. Motion happens only when something causes it.

- **Cursor:** a Gaussian lens (σ 120 px) pushes the lines apart around the pointer, and the line nearest the pointer turns the cool accent. It eases in and out and settles to stillness.
- **Pulse:** each real feed event sends one ring outwards from the newest log line, through the field and the name. The feed is never sped up or looped. Quiet hours are quiet.
- New log lines flash a faint accent background once.
- `prefers-reduced-motion`: the field renders once, static. No lens, no pulses, no caret blink, no flash.
- Before JS loads, the hero is a flat CSS stripe field with the name in solid umber. The canvas then takes over in the same place without shifting the layout.

## Sound

The feed is sonified, off until the visitor presses **Sound off/on** in the terminal bar. Each product has its own note in D major pentatonic: MCP Emails D4, Toolrails E4, Fun Libs A4, albretsen.no B4. Every note is synthesized with Web Audio: a sine fundamental with a quiet triangle octave and a faint third partial, through a low-pass at 2.4 kHz, with an 8 ms attack and a 1.8 s decay. Any combination of the four notes sounds consonant, so the feed plays as a slow, sparse chord, and the mix of notes tells you which products are busy.

## Extending it

- **Blog:** Each post title is set in Fraunces 300 at display size over a short band of the field, 6 to 8 lines tall, with the title drawn by the phase shift in that band only. Body text is Fraunces 380 at 66ch on bone, italic for asides, and figures in tabular lining. Dates are written as plain timeline entries ("2026-07-28").
- **Product pages:** Each product gets its own field period and its note. MCP Emails uses tight lines, and Fun Libs uses wider, softer waves (SOFT 100). The header shows a filtered `tail -f` with only that product's events, sounding only its note. The status, start year and single figure come first, set the way they are in the timeline, then the facts.
- **Social / OG images:** The monogram field at 1200×630, with the product or post name drawn by phase shift.
- **Email signature:** the mark at 16 px, the name, and "Albretsen AS · Norway". Nothing else.
