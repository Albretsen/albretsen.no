# Exhale

Brand direction 23 for Albretsen AS / albretsen.no.

## Vision

One person, 10 years of shipping, every product on the record. Exhale takes the raw honesty of web brutalism (Businessweek's 2015 "What Is Code", Bureau Borsche's 2017 Balenciaga site: default-looking grids, hard rules, type pushed past where it's comfortable) and gives it a pulse. Instead of shouting, the page breathes: paper on the way in, ink on the way out. The name is set big enough that it takes the shape of your screen. Nothing on the page is polished to look like a firm. It looks like someone who knows exactly what he is doing and has nothing to hide.

## Personality

Warm, generous, plainly human. He writes in the first person, gives you the numbers before you ask, keeps the failures on the list, and never sells. Brutal in form, kind in tone.

## Voice

Numbers first, adjectives never. A sentence opens with a count, a duration, a year or a size. Adjectives get cut; verbs carry the meaning. Banned: "passionate", "hire me", "let's connect", "innovative", "world-class", superlatives of any kind.

Sample lines:

- "10 years of building software that pays for itself."
- "11 rows. 0 deleted."
- "184 ms: an agent read a thread."
- "1 story completed, in Brazil."
- "1 outside engagement at a time."
- "00:12 since the last event. 3 since you arrived."

## Mark

`a_` is a lowercase serif *a* followed by an amber underscore: a person mid-sentence, cursor waiting for the next word. It's pure text, so it works in a terminal, a commit message, a favicon, or a CLI banner:

```
a_          compact (nav, favicon)
a_ Albretsen AS      lockup
[a_]        app icon / avatar, square brackets as the frame
```

The underscore is also the site's cursor (see Motion). The favicon is a paper *a* on an ink square with the amber bar under it.

## Colour

Everything is built on OKLCH hue 72, a warm amber. There are two tones, and the page swaps between them as you scroll (inhale = paper, exhale = ink).

| token | OKLCH | hex | use |
|---|---|---|---|
| paper | oklch(0.962 0.028 72) | #fff0df | light ground, dark-tone text |
| ink | oklch(0.19 0.022 72) | #1a1209 | dark ground, light-tone text |
| amber | oklch(0.80 0.16 72) | #fcaa2b | live status, caret on ink, labels, selection |
| amber-ink | oklch(0.50 0.115 72) | #8b5600 | numbers and caret on paper |
| mute-l | oklch(0.48 0.03 72) | #685b4b | secondary text on paper |
| mute-d | oklch(0.72 0.03 72) | #b1a291 | secondary text on ink |

Contrast: ink on paper 16.6:1, amber-ink on paper 5.5:1, amber on ink 9.6:1, mute-l on paper 5.9:1, mute-d on ink 7.5:1. Amber shows up only on numbers, the live chip, the caret and focus rings, never as a decoration.

## Typography

- **Instrument Serif** for everything editorial: the name, the sentence, the feed, product names and the email address. It's a condensed display serif, so it can be pushed huge without falling apart, and it survives being stretched.
- **IBM Plex Mono** (400/500) for details: timestamps, event kinds, years, status chips, indices, the MCP line. It's always small, and always about facts.
- The name is SVG text with `textLength` and `preserveAspectRatio="none"`, so it fills the first viewport exactly on any screen, from 320 px to 2560 px. On a phone it's tall and condensed; on a cinema display it's wide and low. It needs no layout JavaScript, so nothing shifts.

Scale: mono stays at 12–13 px. Serif runs from body at 18–22 px up to display at 7–12 vw. There's nothing in between, because brutalism hates a medium size.

## Layout system

- A single gutter, `--g` = clamp(16px, 2.4vw, 44px), called one breath.
- Every section opens with a hairline label row: `02 / now` on the left, the section's rule in plain words on the right.
- Rows are separated by full-width 1 px rules; the ledger opens with a 3 px rule.
- The ledger is 4 columns on desktop (index and year, name, line, figure) and stacks on mobile with the figure top right.
- Sections are at least one viewport tall, so every inversion gets its own screen.

## Motion

- Everything slow. Things arrive by fading out of a blur over 1.4–2.4 s, never by sliding. The name inhales on load, line by line.
- **Inversion:** the tone colours are registered `@property` colours. When a section crosses the middle of the viewport, the whole page crossfades between paper and ink over 1.4 s.
- **Feed:** only one event at a time, shown huge. The old one exhales into blur while the new one fades in behind it. Real arrival rate only, with no loop and no speed-up. The quiet is shown honestly as a counter ("00:12 since the last event").
- **Caret (the cursor is part of the design):** the native pointer is replaced by the mark's underscore. It stretches into a line with pointer velocity and contracts when you slow down. After 1.4 s of stillness it breathes, fading in and out on a 2.8 s cycle. Over text it turns into a vertical text caret. Over links it shows a small amber label in mono (`mcpemails.com ↗`, `older`, `write`). It's only active on fine pointers, so touch and keyboard users keep the platform default.
- `prefers-reduced-motion`: no blur fades, no stretch, no breathing, and feed swaps happen instantly.

## Sound

The page itself is silent. The sonic logo, for videos, app launches and the end of a talk, is two breaths in 1.8 s:

1. **Inhale (0.0–0.7 s):** pink noise through a band-pass sweeping 400 → 1,800 Hz, with gain rising from silence.
2. **Exhale (0.7–1.8 s):** a sine at 432 Hz (6 × 72, after the seed hue) falling a perfect fourth to 324 Hz, a soft 40 ms attack, a long release, and the noise from step 1 underneath at -18 dB fading out.

It can be synthesized entirely in Web Audio with 1 noise buffer, 1 filter, 1 oscillator and 2 gains, so no audio files are needed. If a page ever gets sound, it's opt-in and plays this once.

## Extending it

- **Blog:** each post opens with its title set as a stretched SVG headline filling the first viewport, the same way the name does. The body is Instrument Serif at 22 px on paper, with mono metadata on top ("2026-07-28 / 6 min / 1,840 words"). The page turns to ink for the last screen (footnotes and the email). Pull quotes are just numbers, set huge.
- **Product pages:** the product name fills the first viewport, and the second screen (ink) is that product's own feed, filtered to its events, one at a time. Below that is a fact ledger in the same row system: version, year, figure, facts. Retired products get the same page, with the retirement year in the first row.
- **Elsewhere:** `a_` works as a CLI banner, a GitHub avatar (`[a_]`), and email sign-offs ("a_"). The amber underscore is the one non-negotiable.
