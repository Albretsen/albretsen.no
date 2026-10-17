# Key Frame (design 41)

**A one-person animation studio for software.** The site presents Albretsen AS as an animation studio. Each product is a painted cel. The company mark is a cel-shaded 3D "A" that you can grab, spin and throw. The page moves "on twos", the way hand-drawn animation and *Spider-Verse* do.

## Vision

Animation studios show their skill by drawing. They don't describe it. Key Frame follows that rule:

- **The hero is a camera field.** A painted cloud sea (NASA ISS photo, recut in five cel bands) sits under an impact burst turning on twos. The live A floats above them. A *key drawing* (the pre-rendered title card) paints first. When WebGL is ready, an 8-drawing diagonal wipe swaps it for the live object.
- **The live feed is an exposure sheet.** Real product events (agent read a thread, story completed, deploy) are logged as numbered frames on an animator's X-sheet. When the A hits an edge of the frame, that impact is logged too, as a "take". The sheet is a cel you can drag around the stand.
- **Products are cels on a reel.** You can re-cut their order by dragging, and the studio remembers your edit. You can also switch the reel to a sheet view. The switch is a view transition played in six held drawings.
- **Retired products live in the morgue.** "Morgue" is the studio term for the archive of finished artwork. Here it is a matter.js light table where the old cels drop, stack and can be thrown. Marey's gull from 1886 sits backlit underneath.
- **The ancestors of animation are the texture.** Muybridge's 1879 gallop runs one drawing at a time as you scroll. The 1840 phenakistiscope can be spun by hand: fast spins snap one slot per drawing, so its figures animate again. The end card is Demenÿ's 1906 fencer.

The brand should feel ambitious and exact. It should never feel like a bank, a consultancy or a factory.

## Colour (duotone, seed hue 240 OKLCH)

| Token | Hex | OKLCH | Role |
|---|---|---|---|
| Night ink | `#011835` | 0.21 0.065 255 | ink lines, panels, text on light |
| Cel blue | `#259cde` | 0.66 0.14 240 | the second ink: hard shadows, accents, shadow faces |
| Ink 950 | `#010b1d` | 0.15 0.045 255 | page ground, letterbox bars |
| Core shadow | `#042e57` | 0.30 0.085 252 | darkest cel band |
| Rim light | `#95ccef` | 0.82 0.075 236 | rim band, secondary text on dark |
| Acetate | `#e8f6fd` | 0.965 0.018 230 | light ground, cards, the light table |
| White | `#ffffff` | | lit faces, glints |

Rules: use two flat tones per shape plus an ink line. Shadows are hard offsets (for example `8px 8px 0 #259cde`) and never blur. Photos are gradient-mapped from ink to blue to acetate. Real product logos are the only other hues, and they are never recoloured.

## Type

- **Unbounded 800**: display, figures and the wordmark. Tracking is −0.02em. Headlines carry a hard ink outline and offset.
- **Instrument Sans 400–600**: body text.
- **JetBrains Mono 500/700**: slates, timecodes, labels and the MCP command. It is set in uppercase with +0.14em tracking.

## Voice

Studio-floor shorthand from someone who ships. Sentences are short and concrete. The language is a little cinematic, but the claims are plain.

- Uses studio language: *cut, take, cel, sheet, morgue, on twos, the stand*.
- Never says "passionate", "hire me" or "let's connect". The availability line is a fact: *Takes one outside engagement at a time.*
- Hero: **Small studio. Feature-length ambition.**

## Motion

The principle: **characters step, the camera glides.** Objects hold each pose for two frames (83 ms) and arrive with a smear and a squash. Scroll, parallax planes and the throw physics stay smooth. Nothing blurs.

| Moment | Technique |
|---|---|
| Headline entrance | `kf-smear-in`: six drawings with a stretched smear, a squash and an overshoot |
| Live A | three.js toon shader with an inverted-hull ink line, posed on twos, squash on bounce, smear when thrown |
| Edge hits | impact frame (two inverted drawings and a shake), a speed-line flash, a logged "take" |
| Poster to live | stepped diagonal clip-path wipe in 8 drawings |
| Switches and toggles | Radix-style `role="switch"` / radiogroup; thumb and indicator move in 3 held drawings |
| Reel and sheet | View Transitions API with `steps()` timing |
| Rearranging | FLIP on Motion springs, peg-lift shadow, Alt+Arrow from the keyboard |
| Gallop band | scroll position picks one of Muybridge's 12 drawings |
| Phenakistiscope | drag to spin; above 220°/s it snaps 30° per drawing so the figures animate |
| Magnetic hovers | Motion springs on nav, buttons and the email (fine pointers only) |

The On twos switch lets visitors watch the same motion on ones. With `prefers-reduced-motion`, the page shows the static key drawing instead of WebGL. Parallax, smears, the marquee and the burst all stop, and the light table appears already settled.

## Sound

Sound is off by default. The Sound switch enables a synthesised Web Audio palette with no audio files: a low cel *thwack* scaled to impact speed, and a short pencil *tick* when you re-cut, toggle or grab something.

## Mark

The mark is an extruded "A" drawn on a 128 grid. It has a white lit face, a cel-blue side, a core-shadow band, a 4px ink line and a single sparkle. The same geometry exists as `mark.svg` and as the live three.js object. The wordmark is ALBRETSEN in outlined Unbounded 800 with a hard blue cel shadow and a small AS tag.

## Extending the direction

**Blog (notes).** Each post is a *scene* with a slate header: Sc. number, date and reading time in mono. The title is in Unbounded with the hard shadow, and the cover is a plate from the open-access archive, recut in two inks. Body text is Instrument Sans on acetate at about 68 characters per line. Pull quotes are ink panels with a blue offset. Code blocks are night-ink cels with peg holes. Footnotes sit in an X-sheet column in the margin. The post list is a rearrangeable reel of cels, so readers can pin their own order.

**Product pages.** Each product gets its own *production*. The hero is that product's cel from `assets/products/` on the camera field. Its real logo always stays untouched on its own tile. Below it:

- facts as a slate strip
- a "making of" timeline as an exposure sheet, with each release one frame
- screenshots mounted in `cel-frame.svg` overlays you can drag on a small light table

Live products show the feed filtered to that product. Retired products link back to the morgue.

**Everywhere.** Use two inks only, hard shadows, grain on dark surfaces, and one or two stickers per view. Every list should be rearrangeable.

## Assets and credits

Everything comes from the kit in `assets/` (see `assets/ASSETS.md`). Plates are from The Met Open Access (CC0): Demenÿ's fencer, Marey's gull and Muybridge's gallop. The phenakistiscope disc is from Cooper Hewitt / Smithsonian Open Access (CC0). The cloud sea is NASA ISS040-E-062704 (public domain). Product logos are the client's own, from `designs/_shared/products/`. Libraries: three.js 0.170.0 (lazy, from jsDelivr), matter.js 0.20.0 and Motion 12.23.24 (vendored), all MIT.
