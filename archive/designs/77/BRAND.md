# Shutterlight

**A window in a sunlit room, and the view passes through a day.**

## Vision

Albretsen AS is one person who builds software slowly, exactly, and then lets it run. The brand is a single room built with that care. It is a centred, symmetrical set: a limewashed wall, an arched window with a sunburst fanlight, lavender shutters folded back, two pots of lavender and a band of hand-painted tile. Outside the window, the light passes through a day.

The homepage is one camera move:

1. **Title card.** The name sits centred above the set like the opening card of a film: kicker, name, one line, and a quiet live line from the products ("MCP Emails: agent drafted a reply · 4s ago").
2. **Crane and dolly.** Scrolling lifts the camera into the frame until it fills the screen, then pushes slowly toward the glass. The painting (far layer) barely moves, the wall moves with the camera, and the sill and lavender (near layer) slide out under the lens.
3. **Day pass.** The same scroll is the clock. In WebGL (`js/daylight.js`), the view moves from J. C. Dahl's cold-blue dawn to Fearnley's morning cliffs, Cézanne's terracotta noon and Claude Lorrain's golden hour. Each new scene arrives as a ragged sweep of light that starts near the sun, never as a plain fade. The room's light follows: a cold blue multiply at dawn, nothing at noon, amber at the end, all masked to the wall and sill.
4. **The plaque.** A small painted label names the hour and credits the painter. It is also a control: four buttons (Dawn, Morning, Noon, Golden hour) move the camera to that hour, or swap still frames under reduced motion.

Then the products, presented as objects in the house rather than as cards in a grid.

Why it fits: the client responded to real imagery, light and craft. This keeps all three and adds personal fit: the south (limewash, shutters, tile, lavender) and the north (a Norwegian dawn, fjord cliffs) in one frame, with Wes Anderson's rigour (symmetry, pastel, centred and deadpan). No place names appear anywhere, and the copy is only about software.

## Voice

Deadpan, exact and unhurried. Short declaratives, numbers set like captions, and no superlatives.

- "Small, exact software that pays for itself."
- "Made here, one at a time."
- "Two are live, one is being built, one is resting."
- "Retired, kept on the wall."

The copy never says "hire", "connect" or "passionate". The footer simply states: "Takes one outside engagement at a time."

## Colour: Riviera, at first light

| Token | Hex | Use |
|---|---|---|
| Cream | `#F4E9D4` | Page, paper, reading surfaces |
| Limewash | `#E8BF86` | The room; footer wall |
| Ochre | `#E2A93B` | The sun in the mark, the live dot |
| Terracotta | `#B9532F` | Figures, rules, active states (large text only) |
| Sea blue | `#2F6C9E` | Window frames, links, the postcard table |
| Lavender | `#A59CBF` | Shutters |
| Lavender deep | `#6E6496` | Kickers and small caps on cream |
| Ink | `#2A2233` | Text, an aubergine black, never `#000` |

Dawn blue `#6A7FB6` / `#8A9BE0` and amber `#EAA56C` are used only as light (multiply washes), never as fills.

## Type

- **Cormorant Garamond.** Italic 500 for the name and headlines; 600 spaced caps (`letter-spacing: .3em`) for kickers, labels, plaques and links; 600 lining figures for numbers ($782, 113,000+).
- **EB Garamond.** Body at 18–20px with a 1.6 line height, and italic for product lines and captions.
- **Monospace** appears once, for the agent command in the footer.
- Fonts are self-hosted variable woff2 files. Both Cormorant files are preloaded, with `font-display: swap`. The title card has a fixed height, so a font swap cannot shift the set.

## Motion

The principle is a camera on a dolly in a miniature set. Everything is slow, centred and deliberate, and props settle as if they had weight. There is never a bounce.

| Name | Where | How |
|---|---|---|
| Crane and dolly | Hero | Scroll-scrubbed transforms on one set and three layers, eased with smoothstep |
| Day pass | Hero | WebGL light sweep driven by the same progress; four crossfaded plates if WebGL is missing |
| Shutters | Hero, first load | Interior louvres swing open once, left a beat before right |
| Postcard flip | MCP Emails | A 0.9s turn with a lift toward the camera; the card tilts slightly toward the pointer while held |
| Sign sway | Toolrails | The sign is a cut-out layer that swings like a damped pendulum (hover, tap, or focus on its link) |
| Glaze sheen | Fun Libs | A soft band of light runs across the tiles on hover |
| Lamp | Harbor | The window's light warms on hover |
| Tile lay | Retired | Tiles are laid from the centre outward; hover or focus reads one aloud in the caption line |

Under `prefers-reduced-motion`, the hero is a still frame, the plaque swaps still images instantly, and every animation and transition is off.

## Sound

Silent. The room is quiet by design. If sound is ever added, it is opt-in from the plaque, as a single soft room tone that changes with the hour.

## Mark

The mark is the window itself: an arch, a transom, and a fanlight whose glazing bars are the rays of a rising sun. It is the window you look through in the hero, so the logo is literally the frame of the site. It is used as the nav centrepiece, the favicon, a postage stamp in the footer and the fanlight divider between sections.

## Extending the direction

**Blog.** Each post is a postcard. The index is a centred column of cards: the front is a graded painting plate (the four views, or more Met public-domain paintings in the same grade), and turning a card shows the title, date (as a postmark) and excerpt. A post page opens with a narrow window, the painting for that post seen through the fanlight arch, above a 62-character EB Garamond column on cream paper. Pull quotes are set in Cormorant italic between two terracotta hairlines, and footnotes sit in the margin like captions. The time of day follows the post's publish hour.

**Product pages.** Each product keeps its object and its own wall colour: MCP Emails is the sea-blue table and postcard, Fun Libs the ochre tile panel, Toolrails the rose wall and hanging sign, Harbor the blue-hour window. The page opens on that object, centred, with the real logo unchanged and one figure from `content.js` set large in Cormorant. Below it are facts as a ruled list, then the product's changelog as a row of glazed tiles, one per release, laid from the centre.

**Rules for anything new.** Centre it. Choose one object per screen. Show real imagery or a real logo, never an illustration of a concept. Set numbers as captions. Never use a place name in copy. Keep motion slow, and give every image a fixed aspect ratio.

## Performance

- First paint needs about 28 KB of AVIF hero (a still of the full set), the CSS, and about 75 KB of preloaded display fonts. Every image has fixed dimensions or an aspect ratio, and the title card has a fixed height, so layout shift is 0.
- After `load` and idle, the page loads the wall and sill layers and the dawn plate, then mounts the WebGL daylight (7 KB, no dependencies). The four plates load at 800 px, or 1600 px on dense or very wide screens. The render loop pauses whenever the hero is off-screen.
- Product scenes are lazy-loaded WebP files with a JPEG fallback.

## Assets

Most assets come from the Shutterlight kit in `assets/` (see `assets/ASSETS.md` for sources and licences; all paintings are Met Open Access, CC0). One addition was made for this page:
- `img/toolrails-wall-*.webp` and `img/toolrails-sign-*.webp` split the kit's Toolrails scene into a wall and a sign cut-out, so the sign can sway on its own. They were re-rendered from `assets/src/product-scenes.html` in headless Chrome on black and on white, with alpha recovered by difference. The real Toolrails icon is unchanged. These are original works.
