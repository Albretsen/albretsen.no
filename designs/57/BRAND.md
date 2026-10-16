# Escape Vector

**Weightless, rebellious, exact.** Albretsen AS is one person who builds software that pays for itself, without investors, between a day job and a company of his own. Escape Vector tells that story with the physics of leaving orbit: one burn applied at the right time, then momentum. The look comes from the public-domain spaceflight archive, treated the way an indie zine treats a photocopier.

The asset kit (imagery, identity, 3D modules, motion) lives in `assets/` and is documented in `assets/ASSETS.md`, which also lists sources and licences.

## Vision

- **Technology first.** The hero is an instrument you operate: a landing-site terrain built from twenty stacked CSS 3D contour planes. A red probe follows the pointer, reads altitude, and locks onto beacons. The beacons are the real product logos (MCP Emails, Fun Libs, Toolrails, Harbor) standing on the high ground. Clicking a locked beacon flies you to that product. No WebGL; the craft is the point.
- **Real archive, not decoration.** The Far Side of the Moon (LRO), Bruce McCandless untethered on STS-41B, Earthrise, the Apollo 17 horizon, Trouvelot's Saturn, Mars and zodiacal light, and Haeckel's icosahedral radiolarian. Every photograph is black and white, and only one thing in each frame gets colour.
- **Honest scoreboard.** Products are "payloads". Four are up and seven came down. Retired products are shown with pride as mission patches, not hidden.

## Palette

| Token | Hex | Rule |
|---|---|---|
| Ink | #070707 | Ground. The site lives in space. |
| White | #FFFFFF | Type and line work on ink. |
| Burn | #F34046 (oklch 0.64 0.215 24) | The only colour. If it is red, it is alive, live or interactive: probe, links, live status, trajectories, the tip of the A. |
| Paper | #F9F6F5 | One light section per page, for contrast (archive or retired material). |
| Fog | #747070 | Secondary text, unresolved decode glyphs. |
| Burn low | #A51E27 | Pressed states, burn text on paper at small sizes. |

Keep red scarce: at most one red display word per headline.

## Type

- **Bricolage Grotesque 800**, width 78 to 82%, line height 0.9: headlines and big figures ($782, 113,000+).
- **Martian Mono**: everything else. HUD labels are 11px, uppercase, with 0.14em tracking. Body copy is 13 to 15px.
- The wordmark is hand-drawn vector, never typeset.

## Voice

Short declaratives, with physics where it fits naturally. Confident without being salesy. The site never asks for anything: no "hire me", no "let's connect", no "passionate". The work and the availability line do the talking.

- Hero: "No gravity. No permission."
- Products: "Four up. Seven came down."
- Retired: "Came down. Burned clean."
- Footer: "Takes one outside engagement at a time."

## Motion

All motion comes from one damped spring (`assets/motion.js`, fixed 1/240 s steps).

- **Decode.** Headlines and figures arrive as glyph noise and lock in left to right, with a burn flash on each lock. Downlink events and the probe's lock label decode too.
- **Zero-G.** Product images tilt toward the cursor and lift 28px on an underdamped spring, with registration marks that spring outward.
- **Station keeping.** Stickers, the Mars plate and the astronaut drift on incommensurate sines. When gravity is switched off, the astronaut and Moon float up.
- **Escape burn.** In-page navigation uses View Transitions with the kit's burn-out and burn-in vectors.
- **Scroll.** Payload images open with a scroll-driven clip reveal (`animation-timeline: view()`) and slow parallax. A red trajectory burns down the payload list as you read.
- **Micro-interactions.** A magnetic command chip, hover cards with Radix-style transform-origin springs on the mission patches, a throwable 20-face radiolarian (click to break it apart), and an email that scrambles on hover.
- **Reduced motion.** Static terrain with no autopilot, instant text, no drift, parallax or transitions. Everything is still readable and operable.

## Sound

Off by default, with a toggle in the bar. When on, Web Audio plays short sine blips: probe locks (1180 Hz), decoded figures, new downlink events (lower for Fun Libs) and a two-note chirp when sound is enabled. No samples and no loops.

## Mark

A capital A (Λ) whose tip has come loose and floats, tilted 10°: momentum just after separation. The tip is the only red part. When the SVG is inlined, the tip floats idly and "launches" on hover. A lockup adds a burn "AS" tag to the slanted ALBRETSEN wordmark.

## Extending the direction

- **Blog.** Each post is a "transmission". The post page is ink with the starfield. The title decodes on entry. The header plate is a Trouvelot engraving (the comet for writing), black and white with one burn detail. Body text is Martian Mono at 15 to 16px on a 64ch measure, and pull quotes are set in Bricolage 800. Code blocks use Ink 2 with a burn caret. The post index is a downlink list: date, time and title, newest first, with each new row decoding in.
- **Product pages.** Each product gets its payload scene (`assets/products/payload-*.webp`) as a full-bleed header with the real logo tile. A mini terrain with that product's beacon is the interactive hero. The figure leads in Bricolage, facts follow as mono pills, and the live downlink is filtered to that product. Retired products get a single paper page with their mission patch and the real reason, written by Asgeir.
- **404.** The Pillars of Creation in burn duotone. The text "Lost signal." decodes and never quite resolves.
- **Social and OG.** Use `assets/identity/og.jpg`: Earthrise with the Earth in burn.

## Inspiration

- bruno-simon.com: physics on everything; motion has mass and overshoot.
- igloo.inc: decode text as a signature entrance.
- paco.me: small, perfectly tuned micro-interactions.
- cosmos.so: image-first curation.
- Maxime Heckel, "The physics behind spring animations".
- Chrome's scroll-driven animations guide.
- Radix Hover Card (transform-origin animation).
- Josh Comeau's 3D button (layered lift and press timings).

## Credits

Imagery: NASA, ESA and the Hubble Heritage Team (public domain); Trouvelot Astronomical Drawings (CC0); E. Haeckel via Biodiversity Heritage Library. NASA material does not imply endorsement.
