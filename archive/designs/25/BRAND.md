# fullt hus

*design 25 for albretsen as / albretsen.no*

"fullt hus" is norwegian for a full house: every seat taken. this direction is a data-journalism front page squeezed into one screen. there is a lot on it, it is loud and colourful, and everything on it is a real number from content.js or from the live feed. nothing is decoration. it is meant to feel like the newsroom page on election night, except the race is one person's products running at the same time.

## vision

most portfolios tell you someone is productive. this page shows it happening, at full density, without one adjective. the visitor should get the whole company in a single glance (the name, the sentence, the live mix, the tape, eleven products with their years and figures) and then notice that it all holds still, stays sharp and loads in a blink. the ambition is in the density. the taste is in the control.

## personality

- **maximalist, with control.** dense, joyful, overloaded on purpose, and still on a strict grid. every element earns its place by carrying data.
- **plain.** no superlatives. the numbers do the bragging.
- **honest about quiet.** when nothing happens the page says so ("stille") and the name gets thinner. it never fakes activity.

## voice

all lowercase, always. short declarative sentences. a norwegian word now and then, where a native speaker would reach for it anyway: *nå* (now), *stille* (quiet), *alt sammen* (all of it), *et lite teknologiselskap* (a small technology company). no "passionate", no calls to action.

sample lines:

- "i build software that pays for itself."
- "the name is a chart."
- "stille · nothing for 20 s"
- "alt sammen. everything built, kept or not."
- "wider type = slower call."
- "takes one outside engagement at a time."

## mark

a single-storey lowercase **a**, built from two parts:

- **the bowl** is a thick ring, an orbit. its counter is the aperture, and a small moon sits in it. on each live event the moon swings out and makes one full orbit, in that product's hue.
- **the stem** is a stacked bar chart: four segments, one per feed product (mcp emails, fun libs, toolrails, albretsen.no). in the header the segment heights are the real share of the last 50 events, so the logo is a chart too. the favicon is the resting state, with four equal segments.

minimum size 16 px (favicon). clear space is one stem width on every side. the ring is always ink. the stem is the only part of the mark that carries colour.

## colour

colour belongs to the feed. each product that emits events owns one hue, rotated around the seed hue 216°. colour appears where that product has just done something: in the name, the tape, the strip plot, the highlighted words, the card tops, the 4 px live bar at the top of the window. everything else is ink on paper. products that don't emit events (harbor, the retired ones) stay ink and grey.

| token | light (oklch) | hex | dark (oklch) |
|---|---|---|---|
| paper | 0.975 0.012 216 | #eef9fc | 0.16 0.03 236 |
| paper-2 | 0.94 0.02 216 | #ddeff4 | 0.21 0.035 236 |
| ink | 0.22 0.04 236 | #051d2b | 0.95 0.015 216 |
| muted | 0.48 0.025 236 | #566670 | 0.72 0.02 216 |
| mcp emails (216°) | 0.52 0.11 216 | #0083a1 | 0.78 0.12 216 |
| fun libs (356°) | 0.58 0.21 356 | #d12b7e | 0.75 0.16 356 |
| toolrails (96°) | 0.62 0.13 96 | #9e8500 | 0.85 0.15 96 |
| albretsen.no (150°) | 0.55 0.15 150 | #05893e | 0.78 0.16 150 |

each hue also has a highlighter tint (L 0.88-0.92 light, about 0.4 dark) for the marker strokes, the chips on the tape and the flashes on the cards. small text is always ink on a tint, never hue on paper. hue as text is only used at display sizes (the name, the big figures), where it passes 3:1.

## typography

- **anybody** (etcetera type, variable: wght 100-900, wdth 50-150) for everything you read. it is the instrument.
  - the name: each of the 15 letters is one 20-second bucket of real activity, oldest on the left. busier buckets get heavier. anybody widens as it gets heavier, so the width axis runs the other way: i measured the advances from the font file and mapped weight to width (100→129.8, 300→123.4, 500→115.4, 700→108.7, 900→100) so each letter keeps its advance. heavy letters are black and condensed, quiet ones are hairline and wide, and the line never reflows.
  - the tape: an event's width axis encodes its latency, from 64 (90 ms, condensed) to 140 (1 s, wide). slow calls take up more space.
  - figures: wght 900 at wdth 58, the tall condensed numbers of a newsroom chart.
- **ibm plex mono** 400/500 for labels, axes, captions, annotations and the mcp line. it is the chart furniture.

## layout

- **one viewport on desktop** (≥1000 × 600): a strict grid of top bar, hero, tape, products and footer at 100dvh. the hero takes whatever is left, and the name is sized with container query units (`min(15.6cqi, (100cqh − 6.2rem) / 2.16)`) so it always fits. no scrolling.
- **hero**: name column 1.5fr (kicker, the name-chart, a time axis, the annotation), data column 1fr (the sentence with highlighted products, the mix bar, a 5-minute strip plot, three big stats).
- **tape**: a full-bleed ink band. "nå" and a pause button on the left, the key on the right.
- **products**: header with a 2016-2026 year axis (one dot per product, shaped by status), four lead cards, then all seven retired products in one row. retired ones stay.
- below 1000 px it becomes a normal scrolling page in the same order. it works down to 320 px.
- no layout shift. the letters sit in fixed cells, the charts are svg, the tape moves by transform.

## motion

kinetic typography, and the feed is the only thing that triggers it.

- **one event, everywhere at once.** a new event ripples through the name from right to left (34 ms per letter, weight up to 900, a 0.07 em lift, the product's hue), enters the tape from the right, drops a tick in the strip plot, re-weights the mix bar and the stem of the mark, flashes its highlighted word and its product card, and sends the moon round its orbit.
- **the tape moves at a constant 64 px/s.** events enter when they happen. nothing loops, nothing is sped up. after 20 seconds of silence the tape says "stille".
- **easing** cubic-bezier(.2,.7,.2,1). quick out, long settle, like a needle finding its value.
- **prefers-reduced-motion**: no ripple, no orbit, no transitions. the tape becomes a static list, newest first, and the strip plot updates once a second.

## sound

the page is silent. the sonic logo, for videos, product launches and app intros:

four short plucked notes, one per product hue, in order: mcp emails, fun libs, toolrails, albretsen.no. the pitches are d, a, d′, a′, so it goes up a fifth, a fourth, then a fifth. each note is a soft triangle wave with a fast attack and a 180 ms decay, 90 ms apart. the last note doesn't decay. the low d comes back under it and the two hold an open fifth for 1.2 s, then fade, so the four "products" settle into one chord. built in web audio: four oscillators and gain envelopes, about 1.6 s in all. a quieter variant (just the last two notes) could mark one event if sound is ever offered as an opt-in.

## extending it

- **blog**: posts are set in anybody at wdth 92 for the body and wdth 60 for the headlines. every post opens with a "by the numbers" strip (word count, date, which product it is about, coloured in that product's hue). charts in posts follow the ft visual vocabulary and the same ink-and-hue rules. annotations are lowercase mono with leader lines.
- **product pages**: each product page takes its own hue as the live colour. its hero is the same name-chart idea with the product name as the chart (fun libs letters weighted by stories completed, mcp emails letters by agent calls). the tape filters to that product only. the stats row shows that product's figure from content.js.
- **retired products** get a one-line page with the year, the reason (in asgeir's words when he writes it) and the commit count where there is one. grey, no hue. they are kept on the record.
