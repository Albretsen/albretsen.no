# Kit 42 — "Same Room"

Open `preview.html` first, served from the repo root (`python3 -m http.server`). It loads the shelf model's real logos from `designs/_shared/products/`.

## Vision

One isometric voxel room, rendered twice from **exactly the same camera**:

- **2019**: a lilac bedroom at dusk. There's a small desk, a laptop with code on it, a phone on a stand showing the Fun Libs icon (built at 17), a sprout in a tiny pot and one butter-yellow block hovering over the desk.
- **today**: the same four walls in daylight. The desk has become a long studio desk with an ultrawide monitor (MCP Emails) and a phone (Fun Libs v5). The sprout is now a tree. A lattice shelf holds the four live products as cubes with their real logos. A small agent robot carries a letter, and blocks drift up and out over the walls.

The split-screen hero has a twist. The two halves are not two pictures. They are one room, and the **edge between them can move**. The renders are registered pixel for pixel, so the builder can clip, cross-fade or scrub between them. `room-seam` bakes the transition itself: left of the diagonal is 2019, right of it is today, and the voxels along the edge lift off and drift.

Personality: an optimistic builder. Everything in the kit is a block that's either placed or about to be placed. Nothing is broken, and nothing is finished. The leaf-green "next block" is the recurring signal, in the mark, the room and the stickers.

Spark words used: **edge** (the seam), **lattice** (the iso grid, the shelf, the pattern), **drift** (blocks lifting away, the Edge Drift motion).

Avoided on purpose: finance-firm gravitas, industrial/nautical metaphors (Harbor is shown as a shared table and a bookshelf, not a port; Toolrails as a hub with cables, not tracks), and making MCP Emails the whole story (it's one monitor and one shelf cube).

### Mood and references

- Three.js examples (instancing, voxel painter, CSS3D): https://threejs.org/examples/
- Vercel home, for the dashed-grid restraint and confident type scale: https://vercel.com/home
- Radix Primitives animation guidance (data-state, `--radix-accordion-content-height`): https://www.radix-ui.com/primitives/docs/components/accordion
- Codrops, "CSS Meets Voxel Art: Building a Rendering Engine with Stacked Grids" (large perspective, preserve-3d everywhere, tilt on one world wrapper): https://tympanus.net/codrops/?p=88123
- MDN `transform-style` (opacity/filter/overflow flatten preserve-3d, so the CSS module avoids them on wrappers): https://developer.mozilla.org/docs/Web/CSS/transform-style
- Motion gestures and springs (vanilla `animate`, `inView`, `stagger`, `springValue`): https://motion.dev/docs/quick-start, https://motion.dev/tutorials/js-gestures
- Magnetic button recipe (spring 150/15/0.1, 0.3 to 0.5 pull): https://cdn.jsdelivr.net/npm/claude-code-skills@0.5.0/data/skills/199-biotechnologies-motion-dev-animations-skill/examples/magnetic-button.md
- Voxel "assemble" idiom (21st.dev Voxel Form): https://21st.dev/@timmikeladze/components/voxel-form.md
- Isometric pastel diorama language (soft AO, tilt-shift, "miniature world"): https://carat.im/en/prompt-gallery/isometric-illustration
- godly.website (redirects to recent.design) for current motion and portfolio patterns: http://recent.design/?ref=godly

## Palette (OKLCH, seed hue 96°)

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| mist | oklch(0.985 0.018 96) | #fefaed | page background |
| cream | oklch(0.965 0.035 96) | #faf4da | cards, tinted panels |
| lime | oklch(0.93 0.11 96) | #fee891 | highlights, primary pill, underline marker |
| pollen | oklch(0.88 0.14 96) | #f3d761 | brand butter: plinths, the mark |
| butter-deep | — | #d8b736 | hard offset shadows under butter elements |
| leaf | oklch(0.80 0.13 128) | #a5ce6f | "next block", live, new |
| moss | oklch(0.62 0.11 132) | #6d944b | leaf text on light |
| ink | oklch(0.30 0.045 120) | #2b3116 | text (olive near-black, never grey) |
| muted | — | #6d744f | secondary text |
| sky | oklch(0.90 0.055 232) | #bae5fd | room colour |
| azure | oklch(0.78 0.09 240) | #81bfeb | room colour |
| lilac | oklch(0.87 0.06 300) | #daccf7 | 2019 walls, retired |
| peach | oklch(0.89 0.065 55) | #fed0b2 | warm accent |
| blush | oklch(0.86 0.07 15) | #fcbfc2 | 2019 accents |
| line | — | #ece3b8 | dashed rules, card offset shadow |

Rules: butter is the brand and leaf means "new". The cool pastels are room colours, never headline colours. Shadows are either soft and olive-tinted (`rgba(43,49,22,.x)`) or a hard voxel offset in a darker butter (`3px 3px 0 #d8b736`).

## Type

- **Bricolage Grotesque** (Google Fonts, OFL), variable with optical size. Use 800 for display with −0.035 to −0.055em tracking and 500/400 for body.
- **Geist Mono** (Google Fonts, OFL), 400/500, for labels, years, facts, commands and captions.
- **Pixel letterforms** are drawn per pixel in `src/identity.mjs` with a butter voxel extrusion. They're used only for the wordmark and stickers, never as a text font.

`https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700;12..96,800&family=Geist+Mono:wght@400;500&display=swap`

## How it was made

- **Voxel renders**: everything is generated by code. `src/scenes.js` and `src/props.js` model the voxels. `src/voxel.js` builds a mesh of exposed faces only, with per-vertex ambient occlusion (the classic corner-neighbour method) and light colour jitter, then renders it with three.js r170 (orthographic iso camera, PCF soft shadows, hemisphere and sun lights, Neutral tone mapping) in headless Chrome. The PNG with alpha is read back through `--dump-dom`, then exported to webp/avif with Pillow.
- **Real product logos** are drawn onto canvas textures in kit-style frames (white card, same corner radius as the source) and rendered unlit (`MeshBasicMaterial`, `toneMapped:false`), so their colours are exactly the originals. SVG logos were rasterised to 512px with rsvg-convert. Nothing was redrawn or recoloured. Harbor's filled mark uses `currentColor`, so it renders in default black.
- **Identity, patterns and stickers**: hand-specified SVG geometry, generated by `src/identity.mjs` (isometric projection of voxel lists, plus pixel glyph tables).
- **OG image**: `src/og.html`, screenshotted at 1200×630.

Re-bake: serve the repo root, open `src/bake.html?scene=roomNow` (or any export of `scenes.js`/`props.js`), and read `<pre id="out">`.

## Inventory

| File | What it is | Intended use | Source | Licence |
|---|---|---|---|---|
| identity/mark.svg | 2×2×2 butter block, front corner missing, leaf block dropping in | logo mark, loaders, section bullets | generated SVG, src/identity.mjs | original, client-owned |
| identity/mark-on-ink.svg | mark on an ink rounded square | app icon, dark UI | generated SVG | original |
| identity/favicon.svg, favicon-180.png | mark on a mist rounded square | favicon / apple-touch-icon | generated SVG; PNG via rsvg-convert | original |
| identity/wordmark.svg | "albretsen" pixel letters with a butter voxel extrusion | header, footer | generated SVG | original |
| identity/wordmark-on-dark.svg | mist letters, leaf extrusion | dark sections | generated SVG | original |
| identity/lockup.svg | mark + wordmark + "AS" | site header | generated SVG | original |
| identity/og.png | 1200×630: headline, lockup, 2019-and-today split room | Open Graph / social | src/og.html screenshot | original |
| hero/room-2019(.webp, @2x.webp, @2x.avif) | the 2019 bedroom, transparent background | hero left / "then" layer | three.js voxel bake | original |
| hero/room-today(...) | the same room today, same camera and crop | hero right / "now" layer | three.js voxel bake | original |
| hero/room-seam(...) | both eras split on the diagonal, edge voxels drifting | hero transition still, about page, OG alternative | three.js voxel bake | original |
| products/mcp-emails(.webp, @2x) | blue-topped plinth: real MCP Emails icon on a panel, envelope stack, agent robot, letters in flight | product card | voxel bake + real icon.png | render original; logo is the product's own |
| products/fun-libs(...) | blush plinth: real Fun Libs v5 icon, word cards with blanks, speech bubbles | product card | voxel bake + real icon.png | as above |
| products/toolrails(...) | lilac plinth: real Toolrails icon, black/yellow hub with cables to four tool blocks, shield (injection guard) | product card | voxel bake + real icon.svg | as above |
| products/harbor(...) | cream plinth: real Harbor banner on a screen, a person and an agent at one table, books, a page held for approval | product card | voxel bake + real banner.png | as above |
| standins/luma | stone tile, real Luma wordmark card and little bar chart | retired list | voxel bake + real logo.png | as above |
| standins/polyglot-pilot | voxel globe with two speech bubbles | retired list | voxel bake | original |
| standins/pinpoint | map pin stuck in a photo | retired list | voxel bake | original |
| standins/webvakt | browser window with an eye | retired list | voxel bake | original |
| standins/joke-central | butter speech bubble reading "HA" | retired list | voxel bake | original |
| standins/tryggere-hyring | shield with a check | retired list | voxel bake | original |
| standins/early-apps | calculator with a floating % | retired list (IAGO HMS, Rentekalkulator, Prosentkalkulator) | voxel bake | original |
| objects/agent-robot | the kit's mascot: a small agent carrying a letter | about section, empty states, 404 | voxel bake | original |
| objects/mark-voxel | the mark as a rendered voxel object | loading state, footer | voxel bake | original |
| objects/sprout | sprout in a butter pot | "small wins" / growth beats, blog list | voxel bake | original |
| objects/cursor | voxel pointer arrow | next to links and contact CTA | voxel bake | original |
| objects/cloud | voxel cloud | sky margins in the hero, floating | voxel bake | original |
| objects/drift-blocks | five loose blocks drifting | section breaks | voxel bake | original |
| objects/mug | peach mug with steam voxels | footer / about | voxel bake | original |
| stickers/since-2016.svg | "since 2016 · on google play" | scatter near the timeline | generated SVG (fact: playDeveloperSince 2016) | original |
| stickers/built-at-17.svg | "built at 17 · fun libs" | Fun Libs card | generated SVG (fact from content.js) | original |
| stickers/installs.svg | "113,000+ installs" | Fun Libs card | generated SVG (figure from content.js) | original |
| stickers/open-source.svg | "AGPL · open source" | MCP Emails card | generated SVG (fact from content.js) | original |
| patterns/lattice.svg | seamless isometric cube lattice | hero ground, code blocks | generated SVG | original |
| patterns/confetti.svg | seamless scatter of tiny voxels | 404, footer | generated SVG | original |
| patterns/iso-dots.svg | isometric dot grid | page/section background | generated SVG | original |
| 3d/voxel-css.js | **CSS 3D transforms only** voxel engine: exposed-face culling, image faces, drag-to-orbit with spring return, `assemble()` (Stack Drop), `drift()` (Edge Drift), `lift()` | centrepiece: interactive mark in the hero corner; product shelf with real logos on cube faces | hand-written | original |
| 3d/demo.html | tiny demo of the mark and shelf models | reference | hand-written | original |
| motion.js | Stack Drop, Magnetic Pull, Edge Drift seam (Motion springs) | site-wide | hand-written | original |
| motion.css | tokens, CSS fallbacks, Layer Unstack (Radix data-state), Block Lift, Idle Bob | site-wide | hand-written | original |
| vendor/motion-12.23.12.js | Motion UMD build (window.Motion) | dependency | https://cdn.jsdelivr.net/npm/motion@12.23.12/dist/motion.js | MIT |
| src/* | bake harness, scene definitions, identity generator, OG page, logo rasters (tex/) | regeneration only; do not ship | hand-written; tex/ copied or rasterised from designs/_shared/products | original / products' own |

No third-party images, models or textures were downloaded. Every visual is generated, except the product logos, which are the client's own.

## Motion study

Every movement is named, and all of them are disabled under `prefers-reduced-motion`.

1. **Stack Drop** (entrance). `[data-drop]` children, or voxels in `VoxelStage.assemble()`, fall about 48px or about 7 voxel units onto a spring (stiffness 380, damping 18) with a 60ms stagger, lowest row first. It comes from the voxel "assemble" idiom and Motion's `inView` + `stagger`. The CSS fallback is `[data-drop-css]`.
2. **Magnetic Pull** (hover, the signature delight). `[data-magnetic]` pills and links lean toward the cursor within a 90px reach. Strength is 0.35 on the pill and the inner `[data-magnetic-label]` leans 0.6 further, which gives parallax. Each axis is a Motion `springValue` (150/15/0.1). It is off on coarse pointers. Use it on every CTA, the email link and the product URLs.
3. **Edge Drift** (transition). `[data-seam]` holds two registered renders. The seam follows the pointer on a spring (220/26). When it moves, it sheds small pastel voxels that drift up and fade, and arrow keys step it. `VoxelStage.drift()` is the 3D version: the model loosens along the lattice, hangs for a beat, then clicks back home.
4. **Layer Unstack** (state change, Radix). This is for content with `data-state="open|closed"`, such as Radix Accordion or Collapsible. Height animates through `--radix-accordion-content-height` and children restack one by one with a small rotateX (55ms stagger) via `--i`.
5. **Block Lift** (hover). On `[data-lift]` cards, the card rises one voxel unit up and left while its hard offset shadow doubles, like picking a block off the grid. `--lift-shadow` sets the colour per product.
6. **Idle Bob** (ambient). `[data-bob]` makes floating objects and stickers breathe on a 5–7s loop with per-item `--d` delay and `--r` rotation.

## Notes for the builder

- The hero is `hero/room-2019` and `hero/room-today` stacked in a `[data-seam]` box (aspect ratio 2000/2305). Clip with `--seam`. Both share an identical crop, so never crop them separately.
- `room-seam` is the fallback for no-JS and for reduced motion.
- Put the CSS 3D mark (`MODELS.mark`) somewhere it can be played with, such as the hero corner or the footer. The shelf model (`MODELS.shelf(basePath)`) works as a product index: hovering a cube lifts it, and its click can scroll to the product card.
- Product plinth tops are colour-coded: MCP Emails is sky, Fun Libs is blush, Toolrails is lilac, Harbor is cream. Retired products sit on stone tiles.
- The 2019 phone shows `icon-v4.png`, the earliest Fun Libs icon that still exists. The today phone and shelf show v5.
