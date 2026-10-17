# Night Shift Paper

*A desktop operating system cut from paper, on a Norwegian night, lit by one sodium sun.*

## Vision

The day job is over and the lamps are on. Asgeir's homepage is his desk: a paper OS where windows are taped sheets, folders hold the writing and the archive, and the dock holds the real product icons. Behind it, a raw WebGL shader draws torn blue hills with white fibre rims, three aurora strips at hue 132°, punched-out stars and lit cabin windows. A ringed sodium sun sits low on the horizon.

The sun is the brand's optimism. It rises as you scroll. You can also grab it and drag it up yourself, and a click pushes a paper ring out of it. It is always nearly morning.

The craft promise: everything looks hand-cut, and all of it is built in code. Shader, three.js geometry, procedural paper fibre and a glTF mark make up the scene. That gap between handmade and machine-made is where the awe comes from. The person behind it reads as a builder: effective, optimistic, precise, and shipping at night.

What it is not: a bank, a fund or a consultancy. There are no industrial or nautical metaphors. MCP Emails is one window among several.

## The homepage

- **Menu bar** (paper strip): mark, Products / Writing / Day job / Archive, an opt-in sound switch, a tilt switch on iOS, and Oslo time.
- **Desk (hero)**: shows `wallpaper.avif` as an instant poster, then the shader fades in over it. On top sit four windows:
  - `about.txt`: name, one line, facts.
  - `terminal`: the `claude mcp add` line with a copy button and a PEEL tooltip.
  - `night.log`: the live feed, with SHUFFLE tabs to filter by product and real product icons per row.
  - `mark.glb`: the 3D mark, lazy-loaded, which fans apart on hover.

  Windows can be dragged and swing against the motion like real paper. Arrow keys move them too. Close a window and it becomes a desktop icon that reopens it. The folders open UNFOLD dialogs. The dock magnifies like a real dock and slaps PEEL tooltips on.
- **Products**: four taped "windows", each holding a paper diorama baked from the kit with the real logo. Each has the real logo, the line, the facts, a sodium figure tag and a LIFT hover card that slides out a second sheet with a real brand asset. The archive is a TEAR accordion of retired products, using paper stand-ins and the real Luma logo.
- **Footer**: a taped polaroid of the cabins, the wordmark, the availability line and the email.

## Voice

Plain and warm, in short sentences, concrete about what shipped and never salesy. The night-shift framing stays light. It shows up as timestamps ("06:12 · nearly morning") and verbs (cut, ship, tape), never as a hustle story.

- Yes: "Builds software that pays for itself." "Two live, one being cut, one paused." "Retired products, kept on file."
- No: "passionate", "let's connect", "hire me", superlatives, invented numbers.

## Colour

| Token | Hex | Use |
|---|---|---|
| night | `#0a1936` | page ground |
| ink | `#050d1c` | text on paper, nearest hill |
| dusk | `#1f4274` | second-line headings, captions on paper |
| sodium | `#f68c26` | the one warm light: title bars, CTAs, figures, the sun |
| aurora | `#9ada5e` | "live" dots and aurora only, never body text |
| paper | `#f5eede` | every sheet, always with the `paper-cream.webp` fibre |
| glow | `#f9cc87` | lit windows, tooltips, highlights |

Sodium stays scarce, and blues get darker as they come forward.

## Type

- **Bricolage Grotesque** 800 for display, tracked −0.03em. Its ink traps read as scissor cuts.
- **Geist Mono** for everything else: the OS voice. Labels are uppercase at +0.12em.

## Motion

The kit's eight named animations (`assets/motion.css`) are keyed to Radix `data-state`:

| Name | Primitive | What it does |
|---|---|---|
| UNFOLD | Dialog | Folders open by unfolding the sheet. |
| LIFT | Hover card | Cards lift and the hover card slides out from under the link. |
| PEEL | Tooltip | Tooltips are slapped on like stickers. |
| SHUFFLE | Tabs | The log tabs bring the new panel up from behind the stack. |
| TEAR | Accordion | The archive opens behind a deckle edge. |
| DROP | Entrance | Collage pieces fall into place. |

Additions for this page:

- Windows fall onto the desk on load.
- Dragged windows flutter in proportion to pointer velocity, then spring back.
- A paper plane follows an `offset-path`.
- Closing a window squashes it away.
- The dock uses a distance-based magnification falloff.
- The shader's parallax follows the pointer or the gyro, and its sun is driven by scroll and drag.

Under `prefers-reduced-motion` the shader draws one frame and stops, the plane and entrances are gone, and the 3D mark stays a still SVG.

## Sound

Sound is off until the visitor presses the menu-bar switch. Everything is synthesized with WebAudio, so there are no files: band-passed noise rustles when paper lands, a short tick on the dock and tabs, and a quiet G–D chime when the sun is clicked.

## Mark

A paper "A" whose counter is a window onto the rising sun, under an aurora strip, on a night tile (`assets/identity/logo-mark.svg`). In 3D it is seven extruded paper layers (`albretsen-mark.glb`) that fan apart on hover. The wordmark is Bricolage 800 outlined to paths, with a taped "AS" label.

## Extending to the blog and product pages

- **Blog index**: the `Writing` folder opened full screen, as a Finder-style list of paper documents with dates in Geist Mono, on the night desk. Each post gets a spot crop from the kit (sunrise, cabins) or a new render from `paperkit.js` as its cover.
- **Blog post**: one long cream sheet taped to the night desk, set in Bricolage for headings and a readable mono or grotesque body at 18 px, 68ch measure. Code blocks are `terminal` windows. Asides are glow-coloured sticky notes (PEEL on hover). The page transition is the kit's SCISSOR WIPE (View Transitions).
- **Product pages**: the product's diorama becomes the hero wallpaper. The product's own real logo and colours sit inside a paper window, so the product brand stays intact and the Albretsen frame (menu bar, tape, sodium) surrounds it. Facts are figure tags, the changelog is a `night.log`, and docs live in tabbed windows (SHUFFLE).
- **404**: the desk with every window closed and the sun below the horizon. Dragging it up brings you home.

## Assets

Everything comes from the kit in `assets/` (see `assets/ASSETS.md`). `sunrise.js` extends the kit's papercut shader with sunrise, ring and hit-testing. Product logos come from `designs/_shared/products/` and are used as-is. Nothing was downloaded.
