# Stille

*A quiet archive of working things.*

## Vision

The homepage is an app store with a museum's art direction. One long white shelf hangs on a plaster wall in Copenhagen daylight. The products are set out on it like objects in a museum store, each lit, labelled and given room. MCP Emails, Fun Libs, Toolrails and Harbor are glazed ceramic tiles in their real colours. Retired products with no surviving brand are unglazed plaster casts with a pressed-in glyph, and Luma keeps its own wordmark. One violet cube is not a product. It is there so the eye has somewhere to rest.

The site should feel like walking into a quiet room where everything present was put there on purpose. The awe comes from restraint and craft: the shelf is built from primitives in three.js and baked to photographs, the plates come from a national gallery, and every object can be picked up. No adjective has to say any of this.

Why it fits Albretsen AS: the company makes whatever is profitable and keeps what earns its place. A shelf is that idea in one image. Each product gets its own pedestal. Nothing is called "the" product, and MCP Emails is one tile among several.

## What is on the page

1. **Hero: the shelf, photographed.** It is a full-bleed baked still with the headline on the empty wall at upper left. Every object in the photograph can be selected. Hovering one shows a catalogue label (a Radix-style hover card that grows from its trigger). Clicking opens the object into its catalogue plate. The plate is a `<dialog>` reached through a VITRINE view transition: the tile grows out of the photograph while the room fades to grey. A visitor log pinned to the wall shows live events from the products (`_shared/feed.js`). The MCP line hangs on a catalogue string tag with a copy action, which stamps a violet square when it succeeds. On phones the photograph becomes a strip you can pan, and it opens at MCP Emails.
2. **The store (products).** A DOM shelf of cut-out objects with real alpha and soft shadows, and a catalogue of four plates below it: the product portrait, its string tag, the real logo, the figure and the facts. **Drag to rearrange anything.** Shelf, catalogue and archive can all be reordered with pointer, touch or Alt plus an arrow key. The two lists mirror each other inside a single view transition, and the object you let go of makes a quiet kick (−4°, a lift, then it settles).
3. **Kept in plaster (archive).** Seven retired products as casts, each with a hover card carrying its one line from `content.js`. A second photograph shows the retired shelf. "Pick up the shelf" lazy-loads the live three.js scene into the same frame, and its casts can be slid along the board. This 3D is opt-in and costs nothing until it is asked for.
4. Two Hammershøi plates follow: open doors for the day job, an attic room for the writing. The footer is ink with the gable print ("the mark is a gable"), the availability line, the email with a magnetic hover, and the museum colour target.

## Voice

Nordic understatement. Short declaratives, no exclamation marks, no superlatives, nothing that asks for anything. The copy describes and lets the reader decide. Numbers appear exactly as in `content.js`, set large in serif, with a small mono label beside them.

- "Few things, made to work."
- "Arrange them in any order; the catalogue below follows. Nothing is saved. It is only a shelf."
- "Kept in plaster."
- Banned: hire me, let's connect, passionate, solutions, cutting-edge.

## Colour

Paper and ink, plus one spot colour: **aniline violet** (OKLCH hue 300, `#7c44c3`). It is named after the first synthetic dye, a piece of chemistry that became an industry. The rule is one violet thing per view: the cube, the square in the mark, the canvas on Hammershøi's easel, a focus ring, a copy stamp.

| Token | Hex | Use |
|---|---|---|
| paper | #f3f2f6 | page |
| paper-2 | #e7e5eb | panels, the doors band |
| wall | #c9c6cb | the photographed wall; behind every still so it bleeds |
| dust | #87848e | captions, retired metadata |
| ink-2 | #56535d | secondary text |
| ink | #19161f | text, footer ground |
| aniline | #7c44c3 | the spot |
| aniline-s | #d7c9f3 | spot on ink, selection |

There are no gradients except the light itself: the `daylight.webp` window overlay (soft-light) and a 240 px ink grain over everything at 11% multiply.

## Type

- **Instrument Serif** (regular and italic): display, product names, figures. Set tight (line-height .94 to .98) and large.
- **Geist**: running text, 16 to 18 px.
- **Geist Mono**: catalogue labels, accession lines, times in the log. Uppercase, +0.09em tracking, 10 to 11 px.

All are self-hosted, subset, SIL OFL.

## Motion

One easing family: `--ease-still` (cubic-bezier(.2,.7,.1,1)) for arrivals and `--ease-settle` (cubic-bezier(.3,1.35,.45,1)) for objects coming to rest. Nothing loops except the small pulse on the visitor log.

- **RESHELVE**: View Transitions API. Siblings glide (`view-transition-class: shelf-item`), and the dropped item kicks (`shelf-dropped`).
- **VITRINE**: shared-element morph (`view-transition-name: vitrine`) from photo or portrait to the plate. The rest of the page hushes to grey and blur, scoped with an `html.vt-vitrine` class so reorders never blur the page.
- **FLATBED**: museum plates scan in, as a band of light passes top to bottom.
- **DAYLIGHT**: hover lifts objects 5 to 6 px. Shadows always fall to the lower right, because the window is upper left everywhere.
- **STAMP**: the violet square presses in when the MCP line is copied.
- Hover cards follow the Radix pattern: they grow from the trigger (transform-origin on the trigger side), travel only a short distance, and open after a 120 to 160 ms delay.
- `prefers-reduced-motion`: every animation and transition is removed, view transitions become instant DOM swaps, the log stops updating, and the page is a calm still.

## Sound

Off by default, behind a "Sound off / on" toggle in the header. When on, the only sound is a synthesised Web Audio knock: a short band-passed noise burst plus a faint high sine, like a glazed tile set down on a painted board. It plays on drop, on opening a card and on copy. No samples are loaded.

## Mark

An **A drawn as a house gable** with a shelf across it, and one aniline square resting on the shelf. The wordmark is Instrument Serif converted to outlines, with "AS" in Geist Mono in the spot colour. On ink, the mark sits on a paper tile. The favicon is the mark on an ink app-icon tile, so it belongs on the shelf too.

## Extending the direction

**Blog (the reading room).** Each post is a catalogue entry. The header has the title in Instrument Serif at display size, a mono accession line (date, reading time, related product), and one plate. The plate is either a Hammershøi scan from SMK Open (rooms, doors, windows; never harbours or ships) or a still baked from the shelf scene with the relevant tile. The body is set in Geist at 18 px on paper, about 64ch wide. Pull quotes are serif italic with a violet square as the only ornament. Images scan in with FLATBED. The post list is the "Notes, kept short" list: title, date, a hover that indents the row by 14 px and turns the title italic.

**Product pages (the vitrine).** Clicking a product opens its plate, and the full product page is that plate grown to a page, connected by a cross-document view transition with the same `vitrine` name. The page has the product portrait (`products/<id>@2x.webp`) on the wall colour, its string tag, the real logo, the figure set large, and the facts as mono pills. Below them: a "condition report" (status, since, what changed lately), the live log filtered to that product, and a single link out. Retired products get the plaster cast on paper-2 and the one line Asgeir writes for them, with no figure if `content.js` has none. Each product keeps its own colours inside its tile. The site around it stays paper, ink and one violet thing.

**Elsewhere.** Use the 404 page for the candles plate and the violet cube alone on the shelf. OG images are rendered from `assets/identity/og-source.html`.

## Research notes

The web search budget for this run was already used up when building began. Research relied on the asset kit's references and on direct reads of: the master.dev kick-flip reorder (named unique transitions for the moved item, `match-element` for the rest), Chrome's view-transition notes (one transition per document, so the live log uses `@starting-style` and not view transitions, so it never cancels a user's reorder), and Radix hover-card motion (origin-aware scale, short travel, open delay).

## Assets and licences

All imagery comes from the kit in `assets/` (see `assets/ASSETS.md`). Plates: Vilhelm Hammershøi via SMK Open, Public Domain Mark 1.0. Product logos: unchanged, from `designs/_shared/products`. Renders, mark, tags, colour target, grain and daylight: original. Fonts: SIL OFL. The live scene loads three@0.170.0 from jsDelivr (MIT), only on request. Nothing new was downloaded for the page.
