# Silica Atlas

**Ink, then glass.**

## Vision

Diatoms and radiolarians build their shells from silica, the material glass is made of, and silica is also the root of silicon. Ernst Haeckel engraved them in 1904 with an absurd amount of patience. This direction takes one of his plates and tells Asgeir's ten years with it. The first app (on Google Play since 2016) is the ink print: careful, monochrome and made by hand. Albretsen AS today is the same drawing made in a better material: polished, ray-traced glass that bends light.

The site never says "ten years of growth". It shows it. The hero is the plate split down the middle, ink on the left and glass on the right. The seam between them is a time scale: drag it, and a small glass tag reads off the year and what shipped then, built only from the facts in `content.js`. Scrolling away moves the seam toward the glass. Time passes as you leave.

The energy is maximalist, from the scale (a microscopic plate blown up to fill a 2560 px screen, with thousands of engraved pores) and never from the number of elements. Each screen has one idea and wide paper margins.

## The page

1. **Vitrify (loader, once per visit).** The mark engraves itself while a counter runs 2016 → 2026. The glass half grows from the seam, a glint passes, and the paper sheet lifts off like a print pulled from a press. It waits for both halves of the plate to decode, with a 1.25 s minimum and a 3.3 s cap, so the first thing you see after it is a finished picture. It is skipped on repeat visits and under reduced motion.
2. **Hero: the seam.** The ink half and the glass half are two pixel-aligned frames. The glass frame is clipped at `--seam`, which follows the pointer on a spring (stiffness 170, damping 24). The seam is a real `role="slider"`, so arrow keys step one year, Home and End jump to the ends, and `#2019` deep-links a year. An atlas label (a paper slip with a double rule) holds the name, the line and one live line from the event feed. Phones get a baked 2:3 composite.
3. **Products: "Eleven products, one sheet."** The four products still under glass sit in ray-traced paperweight domes over their real logos, with Fig. numbers, status, the one figure from `content.js` and the facts in mono. A heavy glass loupe magnifies the logo under the cursor. Below them is the **chorus**, a matter.js field over the Spumellaria plate. The product domes drop first and stay upright, then glass diatoms and ball lenses follow. Each lens refracts the plate upside down, live. You can drag anything, and clicking bare paper drops a lens. The MCP line sits in a ruled strip with a copy button. Retired products are "earlier plates": small engraved lenses with one line each.
4. **Footer.** Ink ground with slow green caustic light drifting under it. The availability line is set in the serif and the email large. On hover a green wipe of glass light crosses the email.

## Voice

Plain, exact and a little dry, like a plate caption in a good atlas. Short declarative sentences, numbers as figures, labels in mono caps (`FIG. 02 · LIVE · 2019`). Each screen gets at most one phrase in the serif italic, and it carries the turn: *Today it is glass.* / *one sheet.* The voice does not sell, invite or emote. "Hire me", "let's connect" and "passionate" never appear.

- Yes: "Everything shipped since 2016. Four are still under glass; the rest are kept as engravings."
- No: "I'm passionate about crafting delightful digital experiences."

## Colour

Paper and ink carry about 90% of every screen. Green appears only as **glass** or **light**: in the renders, the mark's glass half, the spot word, caustics and live dots. It is never a flat block.

| Token | Hex | OKLCH | Use |
|---|---|---|---|
| paper | `#f7f5ea` | 0.968 0.014 95 | ground (with the paper-fibre tile) |
| paper-2 | `#eae6d8` | 0.925 0.020 95 | fills, hairlines |
| ink | `#091710` | 0.190 0.025 160 | text, rules, footer ground |
| ink-2 | `#5a675f` | 0.500 0.020 160 | captions |
| spot | `#389e3d` | 0.620 0.165 144 | the one spot colour |
| spot-deep | `#005e26` | 0.420 0.120 150 | spot text on paper (AA) |
| glass | `#d1f2d7` | 0.930 0.050 150 | glass tint, selection |
| glow | `#a0f08f` | 0.880 0.150 140 | light on ink only |

## Type

- **Bricolage Grotesque** (variable, OFL). Display: wght 640, wdth 84, opsz 96, tracking −0.025em, line-height 0.9. Text: 16 to 19 px, wdth 92.
- **Instrument Serif Italic** (OFL). One phrase per screen, in spot-deep on paper or glow on ink.
- **JetBrains Mono** (OFL). 11 px caps, tracking 0.14em, for labels, figure numbers, status and commands.

## Mark

One lens split down its axis: the left half is engraved with six ink hatch lines, the right half is polished green glass with a paper-coloured glint, and a vertical axis line runs through both. The mark is the hero in miniature. The wordmark "Albretsen" is outlined from Bricolage Grotesque (600/85), so it needs no font at runtime. A small green "AS" sits on the baseline in the lockup.

## Motion

Glass settles and ink draws. The rules:

- Springs overshoot once at most (`bounce ≤ 0.32`). Strokes draw with an even `cubic-bezier(.65,0,.35,1)`.
- **Chorus arrival:** cards land with scale 0.9 → 1, a de-blur and a 70 ms stagger, and a softbox glint crosses each dome as it lands.
- **Loupe:** a heavy lens on a 260/26 spring.
- **Caustic drift:** two tiles drifting against each other over 38 s and 61 s. This is the only ambient loop, and only on ink.
- The physics field mounts on scroll, pauses off screen, and settles to a still frame under reduced motion.
- `prefers-reduced-motion`: everything jumps to its end state, with no loader, no drift and a settled physics still.

Researched from motion.dev examples ("Physical stagger", "Scroll-linked spring", "Follow pointer with spring", "Number counter"), Rive community geometric draw-on loaders, Vercel's count-then-flip deploy states and matter.js demos.

## Sound

Off until the visitor turns it on with the "Sound · off" toggle in the footer, and never autoplayed. When it is on, the seam ticks like a glass ratchet each time it crosses a year, pitched higher toward 2026, and dropping a lens gives a softer tick as it lands. The sound is synthesised with Web Audio: two inharmonic sines (ratio 1 : 2.76, like struck glass), high-passed, with a 160 ms decay. Nothing loops.

## Extending the direction

**Blog.** Each post is a "plate". The index is a two-column atlas on paper, with `PLATE n · date` in mono, the title in display and a small ink specimen as the list bullet. Cover images use the kit's then/now split. Old posts can be shown in ink, and a post the author marks as updated gets a glass half. Long reads use the Cyrtoidea plate faintly in the margin at wide widths. Body text is Bricolage at 19 px, wdth 92, 68ch, with one serif pull quote per post at most. Code blocks are ink on paper-2 with a green `$` prompt.

**Product pages.** Each product opens with its dome render at large scale, with the loupe active. Under it is a single then/now seam built from the product's own history, for example Fun Libs' v4 icon in ink on the left and v5 in glass on the right. A spec sheet follows with Fig. numbers, the status dot and figures from `content.js`, then a short changelog drawn as a scale bar (`extras/scale-bar.svg`) from first commit to today. Retired products get a quiet engraved page: the small-lens stand-in, one line, and the year.

**About.** Hero II from the kit (the chorus of glass lenses over the Spumellaria plate), with the day-job list set as plate captions.

## Performance notes

- First paint: an inline 32×18 LQIP, then the ink half as the LCP image (AVIF 960/1600, preloaded). The glass half (AVIF) is clipped behind it, and phones get a 2:3 composite and never download the halves.
- Every image has width and height, or sits in a fixed-aspect box, so layout shift is 0.
- Motion (11.18.2, pinned ESM) is about 60 KB. matter.js (0.20.0, pinned) and the specimen sprites load only when the chorus scrolls near.
- Sources and licences for every asset are listed in `assets/ASSETS.md`. The Haeckel plates are public domain (1904). The `img/seam-*` files are re-encodes of the kit's halves.
