# Specimen Atlas (design 40)

*A natural-history atlas of things that were built, lit by the sun over Oslo.*

## Vision

Albretsen AS is shown as a cabinet of specimens. Each product is pinned to a cream card, given a number and photographed like an editorial still life. The hero is a single photograph: **Specimen No. 1**, a brass and glass radiolarian after Ernst Haeckel's *Circogonia icosahedra* (1887). It is built only from three.js primitives and was "photographed" over forty exposures. The page has almost nothing else on it, and that restraint is the point. A person who can make this, and leave it alone, has both skill and taste.

The concept is pushed in three surprising ways:

1. **The photograph comes alive.** Choose *Live, in hand*, or just grab the specimen. The still pulls out of focus (a 26px blur, like a lens racking) and the real-time specimen takes its exact place, sized and positioned to match the render. Drag it to turn it, and flick it to spin it.
2. **The loupe reads the source.** A brass loupe lies on the table. Drag it, throw it (it keeps its momentum) or move it with the arrow keys. Through the glass you do not see the render magnified. You see **Haeckel's 1887 engraving of the same organism**, registered to the same spot at ×1.7. The lens shows what the specimen was made from.
3. **The light is real.** A NOAA solar-position formula for Oslo runs before first paint. It picks the matching baked photograph (day, golden hour, or blue hour and night), re-lights the live specimen, turns the page forest and ink after sunset, and updates every minute. The header has a tiny horizon with the sun's dot above or below it.

## Page

- **Hero:** the photograph, the loupe, and a museum label carrying the name, the line and the facts: Asgeir Albretsen *builds software that pays for itself*; Albretsen AS makes apps, SaaS and infrastructure for AI agents; on Google Play since 2016. To the side sit a Photograph/Live switch (a radio group whose pill moves on a spring), the MCP command with a copy button (its tooltip grows from the button, after Radix's origin-aware pattern), and one line of **Signal**, the live product feed.
- **The atlas (products):** four plates on forest bookcloth: MCP Emails, Fun Libs, Toolrails and Harbor. Each is a baked photograph of the **real, untouched logo** printed on a specimen card, with a brass loupe that genuinely magnifies its status stamp. The plates form a draggable stack (Shuffle). Pull the top plate aside or flick it and it springs to the back. Tap it to turn it over and read the catalogue card. Arrow keys shuffle and Enter turns the plate. An index beside the stack jumps to any plate with a short riffle, and the detail panel settles in with a blur-masked crossfade. All facts come from `_shared/content.js`.
- **The drawer (retired):** seven tags in a lattice-lined drawer. Luma keeps its real logo and the others have lattice glyphs. Every tag can be picked up, dragged and thrown, then settles with a velocity-driven tilt. Tags are focusable and arrow keys move them. A Haeckel Phaeodaria plate is pinned above the drawer.
- **Method:** Haeckel's engraving and a macro render side by side, as Fig. 1 and Fig. 2, with two sentences on how the page was made.
- **Footer:** bookcloth, a Wilson Bentley snow crystal print (Smithsonian, CC0), the turning collection seal, *Takes one outside engagement at a time.*, and the email on a magnetic underline.

## Voice

The voice of a curator with a sense of humour: exact labels, short sentences and one italic aside per heading. It is numbered and specific, never salesy. *"The atlas: four specimens, under glass."* *"The drawer: kept, labelled, at rest."* Banned: "hire me", "let's connect", "passionate", superlatives. Labels use museum grammar: *Specimen No. 03 · Coll. 2026 · Building*.

## Colour

All values are OKLCH-first; see `assets/motion.css`.

| Token | Hex | Role |
|---|---|---|
| cream | `#f6f0e0` | Page in daylight, labels, cards |
| paper | `#eadec8` | Wells, the drawer |
| forest | `#17482f` | Brand ground, bookcloth, rules |
| ink | `#082014` | Text, the night page |
| moss | `#679270` | Secondary |
| brass | `#cda047` | Metal, accents on dark; `#966626` (brass-deep) on cream for contrast |
| eosin | `#c444ac` | The single stain (seed hue 336°): one thing per screen, such as the LIVE stamp, the signal dot or the mark's apex |

Phases: **dag** and **gulltime** use a cream page (gulltime warmer). **Blåtime** uses `oklch(27% .045 168)` and **natt** uses `oklch(19% .03 170)`, with cream text. Accents shift from brass-deep to brass.

## Type

- **Fraunces** (opsz 144, wght 600, SOFT 50, −0.03em) for display; italic 300 for the aside.
- **Instrument Sans** for body and UI at 15–18px / 1.55.
- **Geist Mono** 500, uppercase, +0.14em, for every label, number and caption.

## Motion

Everything uses hand-rolled springs (`assets/motion.js`: a damped oscillator with semi-implicit Euler at fixed 240 Hz sub-steps), driven by one shared rAF loop.

- **Settle** (170/26): entrances rise 18px from scale .965 and blur 6px. Nothing starts from scale 0. Hero items use the CSS `linear()` version, so the first paint stays static and cheap.
- **Loupe** (320/24): figures tilt up to 5° toward the pointer and a brass sheen follows. Touch devices skip this.
- **Shuffle** (140/15 flick, 210/20 flip): the plate stack.
- **Daylight:** the sun-driven phase.
- **Throw:** the hero loupe and the drawer tags follow the pointer on a stiff spring (520/34). On release they project their velocity forward (×0.16–0.2) onto a softer spring (110/17), which gives the iOS-style momentum Emil Kowalski describes for Vaul.
- **Magnetic:** links lean up to 22% toward the pointer.
- UI transitions stay under 300ms. Exits are faster than entrances. A blur hides crossfade seams.
- `prefers-reduced-motion`: the photograph stays still (no live 3D unless asked, no idle drift), settles become instant, and the loupe still moves under the hand but without momentum.

## Sound

Sound is off until the visitor presses *Sound*. Everything is synthesised with WebAudio, with no files: a paper rustle (band-passed noise) when a plate is shuffled, a short flick when a plate turns over, a soft lift and set when the loupe or a tag is picked up and put down, a small brass bell when copying, and a two-note bell when the specimen comes alive.

## Mark

The **lattice A** has two legs, a crossbar and an inner V: five nodes forming a triangulated lattice, with the apex stained eosin. It reads as a letter, a molecule and a tiny network graph. The lockup sets it beside "Albretsen" in outlined Fraunces 600, with "AS" in Geist Mono. The mark also appears as the watermark on the back of each catalogue card, and the dark phases use the cream lockup.

## Extending the direction

- **Blog (Field notes):** each post is a *plate*. The header is an archive image (a Haeckel plate or a Bentley crystal, graded into the palette) or a new primitive-built render, with a mono caption: *Plate 12 · 2026-08-19 · 6 min*. The body is Instrument Sans at 18px on cream paper, 64ch wide, with Fraunces headings and italic asides. Figures are numbered (*Fig. 3*) and pull quotes sit on museum labels. The index is a drawer of tags, one per post, which can be shuffled. After sunset the reading page switches to the night phase.
- **Product pages:** each product gets its own specimen. A three.js render built from primitives in the product's form (an envelope lattice for MCP Emails, a rail for Toolrails) is baked in the four phases, with the product's real logo, untouched, on its catalogue card. The page opens on the plate and turns it over (the Shuffle flip) to reveal the facts. Live numbers appear as *Signal* lines. The loupe returns as an inspector over screenshots, showing the code or schema behind each surface.
- **404:** an empty specimen card with the label *Specimen not found* and the macro render out of focus.
- **Social and OG:** `assets/identity/og-image.png`. New cards follow the same grammar: one object, one label, one stain.

## Sources and licences

Everything comes from the asset kit in `assets/` (see `assets/ASSETS.md`): Haeckel engravings from Wikimedia Commons (public domain or CC0), Bentley snow crystals from the Smithsonian Institution Archives (CC0), and all renders, textures, stickers and identity made originally for Albretsen AS. Product logos come from `_shared/products` and are used as-is. The only runtime library is three@0.170.0 from jsDelivr, pinned and loaded lazily. Fonts are Google Fonts under OFL.

Research for this page: Emil Kowalski on building a drawer (velocity dismissal, damping past bounds, direct transforms instead of CSS variables during a drag) and on great animations (under 300ms, interruptible, springs). Radix Hover Card's origin-aware `transform-origin`. Josh Comeau's introduction to spring physics. The W3Schools image-magnifier maths, which inspired the loupe's background-size and background-position registration. Note: the web search quota for this run was used up by other agents, so this research came from fetching those pages directly.
