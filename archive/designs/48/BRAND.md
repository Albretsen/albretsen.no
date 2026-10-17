# Nocturne Select

**Every product is a playable character.** albretsen.no opens on a select screen. The roster is the products, the cursor is the brand mark, the toys obey real physics, and everything is soft glossy plastic, rendered in code and lit like a photo studio at night.

The asset kit (renders, mark, museum treatments, motion and interaction modules) lives in `assets/`, with the full inventory, sources and licences in `assets/ASSETS.md`. This file covers the brand and how the page uses it.

## Vision

A visitor should see range and finish at the same time. Many products, each with its own name, colour and customers, shown with the care a game gives its characters. The arcade idea lives only in the structure: select, lock in, a P1 pointer, a roster, a stat sheet. There are no pixel fonts, no "insert coin" jokes, and no machine metaphors. The tone is minimal futurist: a lot of night, a few objects, precise light.

Why it fits Albretsen AS: the company builds whatever is profitable, so the honest picture is a roster, not one hero product. MCP Emails is one character among four live ones, and the retired seven are kept on the page in smoked resin rather than hidden.

## The homepage

1. **Hero: the select screen.**
   - The name sits in Unbounded, with "Albretsen" in the glow gradient.
   - The one-line description is in the brand voice.
   - A **P2 slot** holds `claude mcp add albretsen https://albretsen.no/mcp`. Your agent is player two. Copying it flips the button to "Joined".
   - Below that is the **stage**: a three.js scene of MCP Emails, Fun Libs, Toolrails and Harbor on lit plinths, with the inflated mark as the pointer. The baked render paints first. The live stage loads at idle and crossfades over it.
   - Under the stage, a **roster bar** (WAI-ARIA tabs, after Radix Tabs) has a sliding glow indicator. Its arrow keys, the stage's arrow keys, clicking or dragging on the stage, and the tabs all drive one selection.
   - On the right, the **stat sheet** swaps through a same-document View Transition: the old content blurs out and the new one wipes in from the right. It shows:
     - the real logo
     - status chip
     - line
     - figure from content.js
     - a tenure bar (years since launch against years since 2016)
     - facts
     - the product's **live wire**, filtered from `feed.js` to that product (Harbor is paused, so the wire says so)
2. **Roster.**
   - Four baked portraits (real logos inlaid in puffy tiles) are `.select-lock` cards. They tilt toward the pointer, the cursor brackets snap around them, and they rise off the floor via `animation-timeline: view()`.
   - Opening one plays a shared-element View Transition into a character-sheet `<dialog>` with the 2x portrait, facts and live wire.
   - The seven retired products sit in a quieter resin row. Luma uses its real logo. The others are hand-made glyphs.
3. **After hours.**
   - Three Met Open Access objects (La Farge's *Nocturne*, a Tiffany Favrile vase in magenta duotone, a jasper scarab cut out with alpha) appear alongside the **toybox**.
   - The toybox is a matter.js pile of baked glossy toys you can grab, throw, spawn ("Drop a mark") and shake.
4. **Footer.** The raymarched SDF mark leans toward the pointer, ringed by the "On Google Play since 2016" sticker. Then come the availability line, the email at display size, and the small print.

## Palette (OKLCH, seed hue 324)

The page is night at hue 324 and very low chroma. **Glow** is the only brand colour. Each product owns exactly one spectrum colour, used only for its seam, sheet accent and stats. Two spectrum colours never touch without night between them.

| Token | Hex | Role |
|---|---|---|
| void | #0b050c | page |
| stage | #160b17 | panels, floor |
| panel | #251726 | raised UI |
| line | #423144 | hairlines |
| mist | #ae9faf | secondary text |
| paper | #f8f1f8 | text |
| glow | #dc3aec | brand, selection, cursor |
| glow-hi | #f295fb | emphasis |
| ion | #36dcec | the mark's dot, right rim light, P2 |
| cobalt / butter / volt / jade | #588cff / #fbd452 / #e3d612 / #1fc893 | MCP Emails / Fun Libs / Toolrails / Harbor |

## Type

- **Unbounded 600/700** for display and names, tracked −2.5 to −4%. Its wide, rounded forms match the inflated plastic.
- **Geist 400/500** for body and UI.
- **Geist Mono 500/600** for labels, chips, the wire and the cursor tag. It is set uppercase with +12 to 16% tracking.

## Voice

Short, calm and exact, like a stat sheet rather than a pitch. Facts carry the weight and adjectives are rare.

- Yes: "Four on stage. Seven kept in resin." "Paused. Nothing on the wire." "Retired, not forgotten."
- No: anything that asks for work, "passionate", exclamation marks, invented numbers.

## Motion

Five named signatures, from `assets/motion.css` and `motion.js`, all disabled under `prefers-reduced-motion`:

- **power-on**: hero copy and sheet boot from a scan line.
- **select-lock**: cards lift, tilt and glow.
- **glow-breathe**: a 5.5 s idle breath.
- **roster-rise**: a CSS `view()` timeline.
- **versus-wipe**: kept for route changes.

The site adds:

- the sliding tab ink, with a plastic overshoot
- the View Transition sheet swap and the card-to-dialog portrait morph
- the "Copy" to "Joined" flip
- the live-wire rows, which de-blur in

Lenis 1.1.13 smooths the scroll that drives the CSS timelines. Under reduced motion the stage renders a single still frame per selection, the toybox starts settled, and nothing loops.

## Sound

Off until the visitor turns it on in the header. When on, a selection plays a two-note lock: a sine and a triangle through a 2.2 kHz lowpass, with a short plastic decay. Copying, spawning and shaking each have their own small variation. There is no ambient bed.

## Mark and cursor

The Selector is a rounded Λ with an ion dot. It is the A, the P1 pointer (turned upside down above the selected product in 3D), the favicon and the **cursor**. The cursor is the mark tilted like an arrow. Its corner-bracket reticle snaps around anything with `data-select` and shows that element's name as a tag. Touch devices keep the native cursor.

## Extending to the blog

- Posts are "after hours" pages: night background, a single Met nocturne or one of the kit's renders as the header (La Farge's *Nocturne* is the default), a Geist body at 18 to 19 px on `paper`, and Geist Mono metadata.
- The post list is a roster of small resin tiles with the date as the stat.
- Pull quotes take a 1 px glow rule and nothing else.
- Code blocks sit on `stage` with an ion caret. The MCP line always appears as a P2 slot.
- The reading-progress indicator is the tab ink, sliding along the top edge.

## Extending to product pages

- Each product page is a **character sheet** at full size:
  - the product's baked portrait on its plinth
  - its own brand colour as the single spectrum accent (cobalt, butter, volt, jade)
  - its live wire, its facts from content.js
  - a "versus-wipe" when navigating between products
- The product's own logo and brand colour are never redrawn. Our system only frames them: night, a seam and a rim light.
- Retired products get a short resin page, with the stand-in glyph, the years and the one-line reason Asgeir writes.

## Credits

- Museum images: The Met Open Access (CC0); sources are listed in `assets/ASSETS.md`.
- Libraries: three.js 0.170.0, matter.js 0.20.0 and Lenis 1.1.13 (all MIT), loaded lazily from jsDelivr.
- Fonts: Google Fonts (OFL).
- Renders, mark, glyphs and code: own work.
