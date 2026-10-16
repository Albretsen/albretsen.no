# Pocket Planet (design 60)

## Vision

Albretsen AS is a pocket-sized voxel planet drawn in true isometric. Every block is axis-aligned, every glowing tower is something shipped, and arcs of activity hop between them. The planet never stops working: the hero takes the live event feed from the products and launches each event off the planet's surface as a real block that falls, tumbles and piles up at the bottom of the screen. Visitors can grab the blocks and throw them.

The personality is **mischievous genius**: construction that is careful and exact, with one deliberate thing out of place. The voxel in the mark has jumped its slot. The full stop after his name is a loose voxel you can knock off (it flies back on its own). A giant 3D cursor pries blocks off the planet. "New planet" swaps the whole world behind the page through a wormhole.

It is a technology brand. There are no finance, consultancy, industrial or nautical cues. MCP Emails is one tower among several.

## Spark words
- **Tension:** one block is always out of line.
- **Grain:** CC0 terrazzo on every block and film grain on every still, so the surfaces read as made rather than rendered.
- **Velocity:** things are flung, not faded.

## The page

1. **Hero.** A graded three.js still of the planet (AVIF/WebP, prioritised) paints first. On capable desktops the live planet (`assets/interactive/planet3d.js`) loads after `load`/idle and crossfades in, with pointer tilt. If it can't hold 28 fps, it fades back to the still. Above it, a parallax stage (the still, voxel debris in front) tilts with the pointer or gyro. The live feed (`_shared/feed.js`) drives a matter.js pile (`pile.js`): every event is a DOM block (real product icon, product, latency or country, plain text) launched on a ballistic arc aimed at a random spot on the floor. Blocks can be dragged and flung through a spring constraint. Pause, Shake and New planet controls sit in the hero foot. A peelable "since 2016" sticker can be dragged anywhere. The MCP command copies with a pop of the mark.
2. **Divider.** The orbit divider drifts slowly.
3. **Products.** The horizon render zooms in on a scroll-driven timeline, as if the camera dived from the planet to its surface. Tabs follow the Radix pattern (role=tablist, roving tabindex, arrows/Home/End, automatic activation) and switch the panel with a View Transition: the old plinth sinks along the iso axis and the new one springs in from the opposite side. Each live product has its isometric plinth render with the real logo, its real figure in Unbounded/Volt, and its facts. Fun Libs carries the 113,000+ sticker and MCP Emails the command sticker.
4. **Gravity Well.** The kit's matter.js toy, lazy-mounted on scroll. The real product icons orbit the planet under an inverse-square pull. Perturb and Freeze are buttons. The 3D cursor mascot bobs at the corner.
5. **Powered down.** Seven retired products: Luma's real logo, dimmed on its own cream, and six isometric "powered-down" dioramas. They power up into place on a scroll timeline.
6. **Footer.** Terrazzo ground, the availability line, the email, the Norway and MCP stickers, and recent writing.

## Palette (OKLCH, seed hue 252)

| Token | OKLCH | Hex |
|---|---|---|
| Void | oklch(0.13 0.012 252) | #05080c |
| Ink | oklch(0.16 0.018 252) | #080e15 |
| Deep | oklch(0.20 0.025 252) | #0e1721 |
| Rim | oklch(0.27 0.03 252) | #1c2735 |
| Slate | oklch(0.40 0.03 252) | #3c4958 |
| Fog | oklch(0.62 0.03 252) | #798898 |
| Mist | oklch(0.86 0.015 252) | #cad2db |
| Paper | oklch(0.96 0.008 252) | #eef2f7 |
| **Volt** (the one accent) | oklch(0.65 0.192 252) | #0790ff |
| Volt hi | oklch(0.78 0.115 252) | #80bcff |
| Volt lo | oklch(0.47 0.14 252) | #0559a8 |

Isometric shading: top is lightest, the left face is mid, the right face is darkest. Hard offset shadows always fall down and to the right in Volt lo (`4px 4px 0`), which works as an extrusion. Product logos keep their own colours.

## Type
- **Unbounded 700/500** for display: name, headings, product figures. Tight tracking (−0.03 to −0.05em).
- **Geist 400/600** for reading.
- **Geist Mono 500** for facts, labels, event metadata and the command. Uppercase, +0.08em tracking.

## Voice
Dry, exact, a little cheeky. It says what was built and leaves the numbers alone. It never asks for anything.
- "Builds small software that pays for itself."
- "Four towers up. Seven powered down."
- "You knocked the full stop off. It will find its way back."

## Motion
- **SLINGSHOT:** entrances on the kit's `linear()` spring (one overshoot). The hero copy uses CSS only, so it works without JS.
- **ISO LIFT:** tabs rise along the iso axis with a stepped Volt-lo extrusion (`@property --lift`).
- **WORMHOLE:** "New planet" sucks the old view into the pointer with a quarter twist and opens the new one as a circle.
- **ISO SWAP:** a named View Transition between product plinths.
- **Gravity:** live events fall under matter.js and so does the Gravity Well.
- **Magnetic hovers** on nav links, the command and the outbound buttons.
- **Tilt and parallax** from the pointer or device orientation on the hero stage and the plinths.
- With `prefers-reduced-motion`, there is no physics and no 3D. The latest events sit in a neat static row and update in place. The Gravity Well starts frozen. Tilt, scroll timelines and the divider drift are off.

## Sound
Off by default (the Sound toggle in the nav). Everything is synthesised in WebAudio, with no files. Landing blocks tick, with volume scaled by impact. Copying chirps twice. Tabs step up in pitch. New planet is a low swoop. Grabbing the full stop is a soft thunk.

## Mark
`assets/brand/logo-mark.svg` is a 3x3x3 voxel cube with its near-corner block launched out of its slot, plus speed lines. The lockup is inlined in the nav, and the loose voxel pops on hover and whenever the command is copied. The wordmark ends in a Volt voxel full stop, and the H1 repeats that idea as a physical, knock-off-able block.

## Extending to the blog and product pages
- **Blog index:** the hero-surface still, cropped low, sits as a horizon band, and each post is a block on a grid that ISO LIFTs on hover. Opening a post uses WORMHOLE from the clicked block, a cross-document View Transition where it is supported.
- **Blog post:** a narrow Geist column on Void. Pull quotes are set in Unbounded 500. Code blocks sit on Ink with the hard Volt-lo shadow. Figures sit on the iso grid. The voxel full stop ends every article, and you can knock it off.
- **Product pages:** the hero is the live `product:<id>` scene from `planet3d.js`, the plinth in 3D with tilt, falling back to the plinth render. The product's real figure is set huge in Volt. Below it, a filtered pile shows that product's live events only. The product's own logo colours stay untouched, and Volt is used only for the frame.
- **Retired products:** their powered-down dioramas head a short page with the one-line reason, written by Asgeir.
- **404:** the 3D cursor has pried the page loose, and the blocks of the missing page lie in a physics pile.

## Assets used
Everything comes from `assets/` (the kit, see `assets/ASSETS.md` for sources and licences): hero-planet and hero-surface stills, planet cutout (mobile), voxel debris, 3D cursor, the four product plinths, six retired dioramas, four stickers, terrazzo-ink (CC0 ambientCG Terrazzo005), iso grid, orbit divider, grain, lockup, favicon and OG. Real product logos come from `designs/_shared/products/`. The libraries are three.js 0.170.0 (jsDelivr, lazy, desktop only) and matter.js 0.20.0 (vendored in the kit, MIT). No new downloads were made for this page.
