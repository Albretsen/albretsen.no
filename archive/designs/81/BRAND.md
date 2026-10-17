# Ground Glass — brand book (design 81)

> The ground glass is the screen inside a camera where the picture comes into focus.

## Vision

Albretsen AS seen through a viewfinder at night. The homepage is a single frame: a paper-cut collage of 19th-century museum photographs (fjord peaks, a sea cliff, Whipple's moon), regraded into one violet hue and staged on real depth planes in three.js. His name is one of those planes. Turn the focus ring, press **F**, or tap anywhere in the frame (the way a phone camera focuses) and the depth of field moves: the moon comes sharp and the name softens, or the treeline comes sharp and everything else falls away.

The idea underneath is the brand promise: **choosing what is in focus.** A small company with several products, and the products are always the one sharp thing. Retired products are shown honestly, out of focus, and come sharp when you look at them.

The landscape is atmosphere, never subject. Copy never names it. Camera vocabulary (focus, exposure, aperture, frame) is the interface language, not ornament: there are no camera bodies, dials or vintage clichés anywhere.

## Personality and voice

Quiet confidence. Short declaratives, exact numbers, nothing pleading.

- "Builds quiet software *that pays for itself.*"
- "Four products, *sharp.* Each one earns, grows or teaches something. Everything else is allowed to blur."
- "Retired, on purpose."
- Footer: "Takes one outside engagement at a time."

One lilac italic phrase per headline at most. No exclamation marks, no "passionate", no calls to hire.

## Colour

One hue (OKLCH 288°), eleven shades. Lightness carries the hierarchy; chroma peaks in the mid tones.

| Token | Hex | Use |
|---|---|---|
| ink | `#070514` | page ground |
| night | `#110c28` | frame, sheet, command box |
| umbra | `#1f1642` | product cards |
| dusk | `#322566` | keys, buttons |
| iris | `#4d3898` | fine print, rules |
| violet | `#6d58ca` | pressed states |
| lilac | `#958ae4` | italic phrase, kickers, figures' units |
| haze | `#bbb6ef` | secondary text |
| mist | `#d9d7f8` | body text |
| paper | `#ededfd` | headlines |
| glow | `#f9f9ff` | the focus index, figures, live dots |

Light theme: none. A lighter "blue hour" is the exposure control (`]`), not a second palette.

## Type

- **Instrument Serif** for display, product names and figures. Big, tight, calm.
- **Geist** for body.
- **Geist Mono**, uppercase, +0.12em, for readouts, kickers, statuses and the MCP command.

## Motion

All motion runs on the kit's hand-rolled spring integrator (`assets/motion.js`, semi-implicit Euler at a fixed 240 Hz, one shared rAF ticker that sleeps at rest).

- **One focus value drives everything.** A master spring feeds the shader's per-layer disc blur, the CSS blur on the headline plane (same depth-of-field law as the shader, scaled by aperture), the sliding distance scale and the readout.
- **Focus ring.** Drag the scale under the fixed index. On release the drag velocity is handed to the spring, which coasts and settles into the nearest plane's detent (2 m, 40 m, 300 m, 1.2 km, ∞). Arrow keys, Page Up/Down, Home/End also work; it is a real `role="slider"`.
- **Tap to focus.** A click ray-casts through the paper planes nearest first and checks the cut-out's alpha under the pointer, so clicking the moon focuses the moon and clicking the cliff focuses the cliff. The AF box springs to the point and turns white on confirm.
- **Shutter** (Space): a violet-white flash and a 1.2% dip; the frame counter advances and a small print of the actual WebGL frame lifts up and develops from black, then slips away.
- **Rack Focus** on section headings as they enter; **Paper Lift** on product cards; **Develop** for the shortcut sheet.
- `prefers-reduced-motion`: every spring snaps, the live scene is not loaded until the visitor touches a control, and the still stays.

## Keyboard (visible cheat sheet, `?`)

F next plane · [ ] exposure · A / ⇧A stop down / open up · Space expose · 1–4 jump to a product · R rack through every plane · S sound · ? / Esc sheet. Each press lights its key on the sheet.

## Sound

Off by default. **S** turns on a synthesised two-tone focus-confirm beep (on tap-to-focus) and a short band-passed noise shutter click. Nothing loops, nothing plays on load.

## Mark

A moon held half a stop behind an asymmetric paper peak, cut once along the horizon; the slit is the A's crossbar and the lower piece its reflection. Wordmark: outlined Instrument Serif "Albretsen" plus Geist Mono "AS". Favicon is the mark on an umbra tile.

## Performance

The LCP is the baked still in a `<picture>` (AVIF 1600 is about 40 KB, portrait art direction under 4:5). three.js 0.170.0 (import map, pinned) and about 670 KB of layer textures load only after `load` on idle, or on first interaction; the canvas fades over the still and pauses off-screen. Every image has dimensions or an aspect ratio, so layout shift is 0. `?static` and Save-Data keep the still.

## How it extends

**Blog.** The index is a contact sheet: each post a frame with its number from `extras/frame-counter.svg`, a small graded cover, date in Geist Mono. Post pages open with a single cover image in a cut-card mount; the title racks into focus on load, and nothing else moves. Cover images are museum photographs graded with the same `grade()` ramp, so every post looks like part of the same roll of film. Long-form body: Geist 18/1.7 on ink, max 68ch, pull quotes in Instrument Serif italic lilac. Code blocks sit in the night tone with the mono readout style.

**Product pages.** The header is the product's kit card (`assets/products/*`): the real logo plate sharp, its photograph blurred behind. Scrolling racks focus from the logo to the photograph and back to the content, so the depth-of-field idea carries through. The figure (MRR, installs, connectors, commits) is set big in Instrument Serif with its unit in mono lilac. Features read as a short list of readouts, not marketing tiles. Retired products get the 35 mm negative frame and one honest line, written by Asgeir.

**About.** Hero B (`hero/lens-*`, the round print in six card rings) frames a short story; the focus-distance scale doubles as a timeline from 2016 to now.

## Sources

Photographs: Rijksmuseum (via Wikimedia Commons, CC0) and The Met Open Access (CC0); full list with object numbers in `assets/ASSETS.md`. Product logos are Albretsen AS's own, unchanged. Fonts: SIL OFL via Google Fonts.
