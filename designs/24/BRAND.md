# Daylight Lattice

*A title card in daylight: one grotesk at cinema scale, over a living lattice of minutes.*

## Vision
A small company with a large reach. Albretsen AS is shown as a **lattice**: products on one axis, minutes on the other. Each square lights up from real activity. The name sits beside it at the size of a film's opening title. The scale gives the ambition and the calm palette gives the reasonableness. Visitors watch software they didn't know about doing real work, minute by minute, and draw their own conclusions.

The idea draws on contemporary AI labs: warm neutrals, literary calm, nothing intimidating. It pushes that into a cinematic register with extreme type contrast, held stillness, and one surface that is actually alive.

## Personality
Cinematic, unhurried, confident, and good-humoured. It takes the work seriously and itself lightly. It's ambitious about scale and modest about claims.

## Voice
Warm and witty. State the fact first, then let one small smile in. No superlatives, no calls to action, and never "passionate", "hire me" or "let's connect".

- Hero: "Builds software that pays its own way: email for AI agents, a word game with 113,000+ installs, and the next thing already compiling."
- Products: "Four in play. Seven retired with honours."
- Feed: "One square, one minute, darker when busier. Nothing here is sped up."
- Empty minute: "A quiet minute."
- Hidden tab: "Albretsen · 3 things happened". Returning: "Albretsen · welcome back"

## Mark
**The Lattice A** is a 5 × 5 grid of rounded cells. The hottest cells (ink and deep mint) spell an A, and the quiet cells stay in the palest mint, so the lattice is always visible. It is drawn on a 6-unit pitch with 5-unit cells and a 1.1 radius. The logo uses the same language as the live grid: **the A is just where most of the activity is.**

In the header, four cells of the A answer the four products live with a small spring pop: the apex for MCP Emails, the crossbar centre for Fun Libs, the left foot for Toolrails and the right foot for albretsen.no.

## Favicon and tab title (designed as carefully as the hero)
- **Favicon:** the Lattice A on a 7-radius ivory tile (`favicon.svg`), which reads on both light and dark tab strips. When an event arrives, that product's cell glows mint for 0.9 s and settles. With reduced motion it never flashes.
- **Title:** `Albretsen — software that pays its own way`. While the tab is hidden, it counts honestly: `Albretsen · 2 things happened`. On return it says `Albretsen · welcome back` for 2.4 s, then goes back to the normal title.

## Colour
The palette is high-key and pastel around OKLCH hue 156 (mint), resting on warm daylight neutrals. Ink is the only dark value.

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| canvas | 0.983 0.009 100 | #fbfaf3 | page, warm daylight |
| paper | 0.965 0.018 150 | #ebf7ed | active surfaces |
| h0 | 0.935 0.020 156 | #dfeee4 | quiet minute |
| h1 | 0.895 0.055 156 | #c0e8cd | 1 event, live chip |
| h2 | 0.840 0.090 156 | #9addb2 | 2 events |
| h3 | 0.770 0.120 156 | #6ecb94 | 3–4 events |
| h4 | 0.680 0.135 158 | #3cb178 | 5+ events, pulse |
| ink | 0.250 0.035 165 | #10271d | text, A strokes (15:1 on canvas) |
| ink-2 | 0.420 0.030 160 | #3f5247 | secondary text (8:1) |
| ink-3 | 0.530 0.025 160 | #607067 | captions (5:1) |
| butter | 0.930 0.060 95 | #f4e8bb | status: building |
| lilac | 0.915 0.040 300 | #e7ddfa | status: paused |
| stone | 0.910 0.012 100 | #e3e2d9 | status: retired |

The atmosphere comes from two very soft radial washes, mint and butter, like light through a window. There are no hard gradients and no dark mode. This brand lives in daylight.

## Typography
There is one grotesk, **Schibsted Grotesk** (variable 400–900, self-hosted latin subset, OFL). It was drawn for a Norwegian media house, a quiet nod to home. All contrast comes from size and weight:

- Title: 800 weight at 23–26 cqi of the identity column, which is about 300 px on a 2560 display. Tracking −0.062em, leading 0.84. The first name is set at 500 weight in ink-2 and the surname at 800 weight in ink.
- Section titles: 800 / 500 at up to 196 px.
- Lede: 450 weight at 19–34 px.
- Captions: 600 weight, 11 px, uppercase, +0.09em.

That is a ratio of about 27:1 between the smallest and largest type. The font uses `font-display: optional` with a preload and a metric-matched fallback, so there is zero layout shift.

## Layout
This is a classic split. Identity sits on the left in 7 fr and live activity on the right in 5 fr, with both anchored to the bottom like a title card. Gutters run `clamp(16px, 4vw, 120px)`. Below 960 px the two stack, and below 560 px each grid row puts its label above a full-width track. Products are a ruled list: year, name and line, status chip, figure. The four products still in play are set large. The seven retired ones are smaller and quieter, behind a second ink rule, and fully legible.

## Motion
Everything moves on damped springs (k 170, c 16 in CSS, sampled into a `linear()` easing token). The JS uses a tiny real-time integrator:
- When an event lands, its cell pops (k 420, c 13) and overshoots like something with mass.
- When the minute turns, the whole lattice glides one column left with inertia (k 90, c 15).
- The name rises 0.22 em into place on load. It only moves, never fades, so it is legible before any script runs.
- Product links lean 0.12 em into hover and settle.

`prefers-reduced-motion` turns every spring into an instant cut and removes the favicon glow.

## Sound
Sound is off by default and synthesised entirely with Web Audio, with no audio files.
- **Sonic logo, "A in daylight":** plays when sound is switched on. It is an A-major arpeggio (A4, C♯5, E5) strummed upward 90 ms apart, landing on A5. Each note is a sine bell with a faint 2:1 partial, panned across the stereo field, over a lowpassed triangle A2 bed that swells and fades. It lasts about 2.4 s. The letter of the mark is also the key of the sound.
- **Event ticks:** after the logo, each event plays a 220 ms bell at very low gain, pitched by product on the A triad (A5, C♯6, E6, A6). Ticks are silent while the tab is hidden.

## Extending the system
- **Blog:** the same canvas, with titles set in 800 weight at cinema scale and body text at 450 weight, 20 px, with a 64ch measure. Each post opens with a single lattice row of its writing history (one square per day the draft was touched), and dates appear as 11 px captions.
- **Product pages:** each product gets its own full-width lattice row, product × minute, from its real event stream. The figure (MRR, installs) is set at title scale beside it, and the status chip colours carry over. Retired products get a stone-tinted page with a still lattice: their activity, frozen at the day they stopped.
- **Elsewhere:** the Lattice A works at 16 px as a favicon and at billboard size, and it can be animated with the same springs. For social cards, use the name at title scale on canvas with a 24-column strip of real activity along the bottom edge.
