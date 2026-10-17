# Asset kit 66: Blue Hour Terrace

**Brief (taste-weighted):** Wes Anderson × Paris · blue hour · layered paper-cut with real depth · hero idea "a terrace table with the products laid out on it" · palette zinc / cream / café red / brass · Californian rounded sans · precise, symmetrical, deadpan motion · personality "optimistic builder" · signature delight: a custom cursor.

Open `preview.html` (served over http, e.g. `python3 -m http.server`) to see every asset, the palette, the type and the live 3D and motion.

## Vision

It is the minutes after sunset. You are sitting under a red café awning, looking across a quiet street at a perfectly symmetrical building with its windows starting to light. On the marble table in front of you, laid out like the morning's post, are the products: an envelope sealed with the MCP Emails mark, the yellow Fun Libs tile on a little brass easel, a Toolrails card, a Harbor card, and one espresso in the dead centre.

Everything is paper cut, layered and lit, so it has real depth and real shadows. Nothing is a postcard, though. There are no landmarks in the illustrations and none in the copy. The scene is an *atmosphere* for a software company, not a destination. The deadpan Wes Anderson rigour (exact symmetry, centred framing, things arriving in mirrored pairs on a fixed beat) stands for the person: effective, reasonable and precise. The warm window light stands for the optimism.

Rules for the builder:
- **One idea per screen.** The awning is a proscenium. Use it once at the top of the page, and use the `awning-border` valance only as a section divider.
- **Centre everything that matters.** Headlines, the mark and the table are always centred, with generous paper-coloured space around them.
- **Café red is an accent, not a field.** Use it on the awning, one word, or one button per screen.
- **The name can sit huge in the sky band** of the diorama, between the awning and the dome (the empty blue area is there for it). The OG image shows the placement.
- **Mobile:** use `terrace-diorama-portrait` and `rooftop-terrace-portrait`. Turn the cursor off for coarse pointers (the script already does this).

## Mood and references

- https://accidentallywesanderson.com: centred, frontal framing, pastel facades, title-card typography (Webby-winning).
- https://www.soho-house.com: warm members-club hospitality restraint. The site now redirects; it's used here for tone only.
- https://www.siteinspire.com: the "clean, no gimmicks" bar for layout.
- https://www.visitnorway.com: big-sky photography and light. The brief's light is borrowed from it, not the place.
- https://www.studiobinder.com/blog/wes-anderson-style/: symmetry, lateral dolly and planimetric framing, used for the Dolly Pan.
- https://dev.to/accudio/making-a-parallax-svg-landscape-new-site-part-1-2cd7 and https://codepen.io/agathaco/pen/eWMgmP/: layered SVG landscapes and paper parallax, used for the Pop-up Lift and the Lamplighter.
- https://www.sitepoint.com/parallax-burns-converting-photographs-2d-3d-svg/: splitting imagery into depth layers.
- https://awwwards.com/customize-your-mouse-cursor-inspirational-examples-implementation-tricks.html and https://motion.dev/magazine/introducing-magnetic-cursors-in-motion-cursor: tasteful, restrained cursors (Obys, CQQL), used for the Brass Ring.
- Haussmann facade grammar: https://haussmann.galerieslafayette.com/en/haussmannian-architecture/ covers continuous iron balconies on the 2nd and 5th floors, the zinc mansard, and dormers.
- Paris zinc roofs (UNESCO 2024): https://www.smithsonianmag.com/travel/the-skyline-of-paris-is-filled-with-zinc-rooftops-but-can-they-survive-climate-change-180987619/

## Palette

| Name | Hex | OKLCH | Use |
|---|---|---|---|
| Night | `#16213D` | oklch(25.4% 0.055 266.3) | sky top, dark sections, footer |
| Ink | `#1F2B4A` | oklch(29.5% 0.059 266.8) | text on paper |
| Blue hour | `#4A5F92` | oklch(49.2% 0.086 266.3) | sky middle, links on dark |
| Lilac haze | `#8C8DB8` | oklch(65.8% 0.064 283.5) | far skyline, haze |
| Afterglow rose | `#C9A3B6` | oklch(75.5% 0.051 346.8) | sky near the roofline |
| Peach horizon | `#F0BC9E` | oklch(83.4% 0.073 51.4) | horizon, italic display accents on dark |
| Zinc | `#7F8DA0` | oklch(63.9% 0.033 256.1) | roofs, secondary surfaces |
| Zinc deep | `#5E6B80` | oklch(52.5% 0.037 260.0) | planters, muted UI |
| Cream stone | `#F5EDDF` | oklch(94.9% 0.020 81.8) | cards, facades, text on dark |
| Paper | `#FBF6EC` | oklch(97.4% 0.014 84.6) | page background (with `paper-tile.webp`) |
| Café red | `#B5373A` | oklch(52.4% 0.162 23.5) | awning, the single accent |
| Awning shade | `#8E2A2F` | oklch(44.0% 0.135 21.9) | header bar, pressed states |
| Brass | `#B8924A` | oklch(68.1% 0.101 81.6) | rules, rims, labels, cursor |
| Lamplight | `#FFD58C` | oklch(89.3% 0.102 80.7) | lit windows, primary button on dark, the only glow |
| Topiary | `#2F4A4E` | oklch(38.9% 0.033 207.6) | the only green: topiary, Fun Libs shop |

The sky gradient (Night, Blue hour, Lilac haze, Afterglow rose, Peach horizon) is the only gradient in the system.

## Type

- **Nunito** (variable 200–1000, roman and italic, SIL OFL 1.1). It's a rounded, sunny Californian sans: `fonts/Nunito-var-latin.woff2` and `fonts/Nunito-italic-var-latin.woff2` (Latin subset, includes æ ø å). Display is 900 with tracking −0.02em. Body is 500 at 1.6 line-height. Labels are 800, uppercase, +0.32em tracking, in brass. Italic 300 in Peach horizon is the one display flourish.
- **DM Mono** (400/500, SIL OFL 1.1) for commands and figures: `fonts/DMMono-*-latin.woff2`.
- The wordmark, lockup, OG title, stamps, receipt and plaque all use outlined Nunito paths, so they need no font.

Source: Google Fonts (fonts.gstatic.com), OFL.

## Inventory

| File | What | Intended use | Source / how made | Licence |
|---|---|---|---|---|
| `brand/mark.svg` | Shopfront mark: awning, arched window, evening star (64 grid, symmetric) | logo, nav | hand-written SVG | original (client) |
| `brand/mark-reversed.svg` | Mark for dark grounds | footer, dark sections | hand-written SVG | original |
| `brand/wordmark.svg` | "Albretsen" (Nunito 800, currentColor) + red tracked "AS" with brass rule | header | Nunito outlines via fontTools | original; font OFL |
| `brand/lockup.svg` | Mark + wordmark | header, documents | generated | original |
| `brand/favicon.svg`, `favicon-180.png`, `favicon-512.png` | Mark on a blue-hour tile | favicon, apple-touch-icon, PWA | SVG → rsvg-convert | original |
| `brand/og.jpg` | 1200×630, name set in the diorama's sky | Open Graph / social | diorama crop + outlined title | original |
| `hero/terrace-diorama-{640,1280,1920,2560}.{avif,webp}` + `-640/-1280.jpg` | **Main hero.** Paper-cut terrace at blue hour: awning, symmetric domed facade, lit windows, the products on the marble table | home hero (desktop) | procedural: Python generates 8 SVG layers (Haussmann facade grammar, mirrored), rsvg renders them, and numpy composites them with paper fibre, lit top rims, depth haze, cast shadows, window bloom and grain | original |
| `hero/terrace-diorama-portrait-{600,1200}.*` | Re-laid-out portrait diorama (2:3) | home hero (phones) | same pipeline at 1200×1800 | original |
| `hero/rooftop-terrace-{640,1280,1920,2400}.*` | **Second hero.** A real rooftop photograph regraded to blue hour (sky replaced with the palette gradient, cooled shadows, afterglow rim light) with a paper-cut terrace in front: awning, balustrade, table, chairs, topiaries | about / products intro, alternate hero | photo: https://unsplash.com/photos/the-sun-is-setting-over-a-city-with-tall-buildings-EUTYBgYHkBc (Timelab); grade and paper layers generated | Unsplash License; generated parts original |
| `hero/rooftop-terrace-portrait-{500,1000}.*` | Portrait crop of the above | phones | same | Unsplash License |
| `hero/facade-blue-hour-{600,1200}.*` | Domed corner building, centred, regraded to blue hour (4:5) | about / blog header | photo: https://unsplash.com/photos/elegant-parisian-buildings-stand-tall-against-the-sky-jBwiOBj1Z6o (Ismael Galaviz); sky replaced | Unsplash License |
| `hero/facade-wide-{960,1920}.*` | Wide version of the facade | section break | same photo | Unsplash License |
| `hero/rooftops-graded-{960,1920}.*` | Rooftops, blue-hour grade, no foreground | blog cover plate | Timelab photo, graded | Unsplash License |
| `layers/layer-0…8-*.webp` | Baked paper layers (1600×900, alpha) + `*-glow.webp` additive window light | 3D diorama, CSS parallax | exported from the diorama pipeline | original |
| `interactive/diorama3d.js` | **3D asset.** three.js module: 9 layers on depth planes, a warm key light casting soft PCF shadows between sheets, a pointer dolly, and `setDusk()` (the Lamplighter) | home hero upgrade after first paint | hand-written; three@0.169.0 from jsDelivr, lazy | original; three.js MIT |
| `interactive/demo.html` | Tiny demo with a sunset-to-night dial | review | hand-written | original |
| `products/shop-{mcp-emails,fun-libs,toolrails,harbor}-{500,1000}.{avif,webp}` + `-500.jpg` | **Product visuals.** One symmetric storefront per product with the real logo, unchanged, in the lit window. Toolrails (building) has its awning half wound out and a BUILDING plate. Harbor (paused) has its shutter down with a PAUSED card and its mark lit | product cards / pages | procedural SVG layers + compositor; logos stay on an unprocessed top layer so their colours are exact | original + real product logos |
| `products/shop-*.svg` | Flat vector source of each storefront (references `logos/`) | crisp scaling, tweaking | generated | original |
| `products/logos/*` | Real logos copied unchanged from `designs/_shared/products` | inside the storefronts | client assets | client |
| `retired/stamp-{luma,polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}.svg` | Perforated postage stamps with a "RETIRED" cancellation; Luma uses its real monogram | archive / "earlier work" grid | generated SVG | original (+ Luma monogram, client) |
| `extras/paper-tile.webp` | Seamless 512 paper fibre tile | page background | numpy, wrap-mode noise + fibres | original |
| `extras/paper-fibre-overlay.webp` | Transparent fibre layer | on top of any flat colour | numpy | original |
| `extras/grain.webp` | 256 film-grain tile | overlay on photos / dark sections | numpy | original |
| `extras/awning-border.svg`, `awning-solid.svg` | Tileable scalloped valances (striped and solid) | header, section dividers | SVG | original |
| `extras/zinc-roof-tile.svg` | Fish-scale zinc tile | footer band, card backs | SVG | original |
| `extras/balcony-lace.svg` | Wrought-iron balcony rule | horizontal rule | SVG | original |
| `extras/cutout-{bistro-chair,topiary,terrace-table,espresso}.svg` | Paper cut-outs | spot illustrations, motion props | SVG | original |
| `extras/lit-window.svg` | A single lit window with curtains | list bullet, loading state, 404 | SVG | original |
| `extras/receipt-table-66.svg` | Terrace bill listing only real figures ($782 MRR, 113,000+, 4 connectors, 549 commits, "since 2016 on Google Play") | products section aside | SVG + outlined type | original; facts from content.js |
| `extras/brass-plaque.svg` | "Albretsen AS · Software · Norway · Est. 2026" plaque | footer / about | SVG + outlined type | original |
| `cursor/cursor.js`, `cursor/cursor.css` | **Signature delight: Brass Ring cursor.** A brass ring with a cream dot. Over anything clickable it becomes a café-awning scallop that turns in exact 30° ticks. `data-cursor-label` shows a small label | sitewide (fine pointers only) | hand-written | original |
| `motion.css`, `motion.js` | Motion study (below) | sitewide | hand-written | original |
| `fonts/*.woff2` | Nunito variable (roman and italic), DM Mono 400/500, Latin | type | Google Fonts | SIL OFL 1.1 |
| `preview.html` | Contact sheet | review | hand-written | original |

## Motion study (`motion.css` + `motion.js`)

The house tempo is one **beat of 140 ms**. Everything is a multiple of it, everything is symmetric, and nothing bounces twice. All of it collapses to a static end state under `prefers-reduced-motion`.

1. **Awning Unfurl** (`.m-unfurl`, child `.m-valance`). A section reveals from the top in 8 visible steps (`steps(8)`), like an awning being cranked down, then its scalloped valance settles with one exact overshoot. *Ref:* stepped title-card reveals (accidentallywesanderson.com) and Wes Anderson's frontal "curtain" openings.
2. **Dolly Pan** (`.m-dolly` with `.m-from-left`, `.m-from-right`, `.m-from-centre`). Mirrored pairs slide in from opposite edges and meet on the centre line on the same frame (`cubic-bezier(.7,0,.3,1)`, 7 beats), then the centre object appears. *Ref:* lateral tracking shots (StudioBinder guide) and Obys Agency's precise easing.
3. **Lamplighter** (`.m-lamplighter` with `[data-lamp=row]`). Windows light in mirrored pairs from the centre column outward, one beat apart. `motion.js` assigns each window's order. The 3D diorama has its own Lamplighter in `setDusk()`: street windows first, rooftops last. *Ref:* layered SVG landscapes (dev.to/accudio) and the city-lights moment of blue-hour photography.
4. **Pop-up Lift** (`.m-popup`). Paper layers hinge up from their base like a pop-up book, back to front, and their drop shadows grow as they rise. *Ref:* CodePen agathaco "paper landscape" and SitePoint "Parallax Burns".
5. *(Supporting)* **Tick** (`.m-tick`): exact 30° rotation steps, shared with the cursor.

## Performance notes

- Hero LCP: `terrace-diorama-1280.avif` is 57 KB and the 1920 version is 130 KB. The portrait 600 is 36 KB. Every `<img>` carries width/height, so layout shift is 0.
- Paint the still first, then lazy-import `interactive/diorama3d.js` near the viewport (≈60 KB of three.js gzipped plus ≈430 KB of layers) and cross-fade it in, as `preview.html` does.
- The kit totals about 6.9 MB, mostly because of multiple formats and sizes. Any single page needs a small fraction of it.

## Process

The diorama, grading, products, stamps, extras, brand and OG are all made by small Python scripts (Pillow, numpy, scipy, fontTools) plus rsvg-convert, run from a private temp dir. Each hero was reviewed at full resolution and iterated:
- I removed the street lamps and moved the glow to per-layer so the bloom no longer smeared the foreground.
- I switched the chairs to a frontal view and made the lit windows mirror-symmetric.
- I moved the product logos onto an unprocessed layer so their colours stay exact.
