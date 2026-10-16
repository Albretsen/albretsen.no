# Tension Prism (design 34)

## Vision

Albretsen AS is a crystal held under tension. The name is not typeset. It is grown as a lattice of about 1,900 glass facets, and every facet is a live object. Light is the only colour: the site is black and white glass, and the one primary (mint, oklch 0.88 0.20 156) is the light that gets through.

The idea behind the hero is that **the name is the prism**. A white ray falls from the top of the page onto the apex of the A. Each real event from his products (an agent drafts a reply in MCP Emails, someone finishes a Fun Libs story, an agent searches Toolrails) enters as a white photon on that ray. A mint ripple then sweeps through the facets from left to right, and a mint photon leaves through the beam that fans out at the bottom right. The site shows the products working without claiming anything.

The person comes across as someone who builds things that look hard to build and still hold together. The site never asks for anything.

## Page

- **Hero.** `assets/hero/shards` is the background (on phones, the portrait Crystal A render), with a drifting frost-cell texture from ambientCG Ice002. The live `PrismWordmark` sits on top. An SVG light path is computed from the apex of the current word.
  - **Spectrum.** Radix-style tabs with the `ts-beam` indicator morph the wordmark into MCP EMAILS, FUN LIBS, TOOLRAILS or HARBOR, and the panel shows that product's real figure. The tabs cycle on their own when nobody is using them.
  - **Photons.** The live feed, shown with real product icons.
  - **Seal sticker.** It rotates as you scroll.
  - **Hover card.** "Since 2016" opens a hover card with `ts-facet-pop`.
- **Products.** This is a sticky, scroll-driven sideways rail (CSS `view-timeline`, no JS). It starts with the graded CC0 prism photograph, then four glass cards with the product renders, the real logos, figures and facts.
  - The cards tilt toward the pointer with a moving glare and a `ts-sheen` sweep.
  - **Details** opens a `ts-prism-split` dialog, whose overlay refracts the page through the Ice002 normal map.
  - A `ts-facet-fold` accordion holds the retired products (the real Luma logo plus lattice-glyph stand-ins) and the day job.
  - Without view-timeline support, or with reduced motion, the rail becomes a plain grid.
- **Glass.** The live three.js Crystal A loads lazily. It tilts with the pointer, and pressing loads it with tension so the facets separate in depth. The stickers can be dragged and thrown, with inertia.
- **Lens band.** A CC0 ice-crystal macro photo, with a triangular lens that follows the pointer and refracts through `feDisplacementMap`.
- **Footer.** The faceted wordmark, the availability line, the email, a copyable MCP command and the licence credits.

## Voice

Short, declarative and factual. Numbers come only from `content.js`. Nothing is sold and nothing is begged for.

- "Four products. One pair of hands."
- "White light in, one colour out."
- "Hard to build. Holds anyway."

Banned: hire me, let's connect, passionate, any line about availability beyond the one fixed sentence.

## Colour

| Token | Hex | Use |
|---|---|---|
| ink | #060807 | page |
| ink-2 | #0B120E | glass fills, dialogs |
| paper | #F4FFF8 | type, white facets |
| mint | #39FD9E | light only: beam, live status, focus, one accent per view |
| mint-deep | #0D8750 | mint text on paper |

White uses opacity steps over ink, never extra greys. Every photograph is graded so its spectrum collapses into one mint band.

## Type

- **Anybody** 900, expanded: display, section titles, figures. Titles stretch `font-stretch` toward 150% on hover. That is tension made typographic.
- **Geist** 300 to 600: body.
- **Geist Mono**: labels, timestamps, the terminal voice.

## Motion

Things stretch toward where they are going, overshoot slightly and snap back. The named set comes from `assets/motion.css`:

| Name | Where it is used |
|---|---|
| `ts-crystallize` | card entrances |
| `ts-disperse` | nav and email hover |
| `ts-sheen` | glass cards |
| `ts-prism-split` | dialog |
| `ts-facet-fold` | accordion |
| `ts-beam` | tabs |
| `ts-facet-pop` | tooltip and hover card |

On top of that set:

- the photon path, drawn on load and moved with the Web Animations API
- the morph and shatter of the wordmark
- magnetic pill buttons
- the scroll-linked rail
- sticker inertia

**Reduced motion:** the static wordmark, no photons, a plain grid instead of the rail, no tilt or inertia, and 1 ms animations.

## Sound

Off until the visitor turns it on in the nav. When on, each photon rings a short glass tone (three inharmonic sine partials) pitched per product, and a shatter rings an octave lower.

## Mark

The Prism A is 21 facets with the counter and the leg gap knocked out. The apex and two exit facets are mint. The custom cursor is a small glass triangle that points where it travels, splits into mint and white ghosts with speed, and fills mint over anything clickable.

## Extending to the blog and product pages

- **Blog index.** Each post title is set on the lattice at small scale (a `latticeFor` call with about 6 rows). Hovering a title lights a facet ripple. Dates use Geist Mono.
- **Blog articles.** Geist at a 68-character measure on ink. Pull quotes are Anybody expanded with a single mint beam rule. Images get the same grade (neutral to ink and white, saturated colour to mint) and sit in glass frames with `ts-crystallize`. Code blocks are ink-2 glass with mint used only for the prompt.
- **Product pages.**
  - The hero is the wordmark morphed into the product name, with that product's glass render as the background and its own live photons only.
  - Facts sit in glass tiles. Sections open with `ts-crystallize`, and FAQs use the `ts-facet-fold` accordion.
  - The product's own logo and colours are never redrawn. They sit on black mirror glass as in the renders, and the site's mint stays the light around them.
- **404 page.** The wordmark shattered and never reforming, with the tileable lattice pattern behind it.

## Assets

Everything is in `assets/` (see `assets/ASSETS.md` for sources and licences). Photography is CC0 from Wikimedia Commons, the HDRI is CC0 from Poly Haven and the textures are CC0 from ambientCG. Product logos are the real files from `designs/_shared/products`.
