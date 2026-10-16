# Violet Cabinet · Design 52

## Vision

Albretsen AS presents itself as a museum archive that has been plugged into the mains, a **cabinet of working software**. Real public-domain scans are cut out and *electrified*. The paper turns saturated violet, the engraved lines turn to light, and each highlight gets one spark of yellow. The site reads like a catalogue raisonné, but everything in it works: the crystals morph, a bust gets digitised, the readings are live.

The point is awe through precision. The mark is a real Japan-law quartz twin at exactly 84°33′. The specimen habits come from Kurr's *Mineral Kingdom* Plate A (1859), with hidden edges dotted the way the engraver drew them. The numbering (Tab. I, fig. 6.) is used consistently. The play is in the motion, and every motion has a calm resting state.

It is a technology brand. The archive material is all science (mineralogy, microscopy, electricity) and it is reprocessed with code. There is no finance, nothing nautical and no machinery.

## The homepage

1. **Hero: a story in five plates** (scroll-driven, sticky stage, 540vh):
   - **Tab. I · fig. 1, the cabinet.** Name, one line, the MCP command. Kurr's electrified quartz.
   - **Tab. I · fig. 2.** The same plate zooms into the cluster as the real Fun Libs icon lands on a paper tag: *Built at seventeen.*
   - **Tab. II · fig. 3, current.** Franklin's painting opens out of a hexagonal crystal section centred on his key. MCP Emails' real mark is pinned in the sky.
   - **Tab. II · fig. 4.** Franklin dims. Tesla's 1899 lab photo is mounted over him and scanned in by a spark line, with the Toolrails and Harbor marks pinned to its corners.
   - **Tab. III · fig. 5, the scan.** A CC0 Poly Haven marble bust in three.js, loaded only when you approach. Scroll drives the beam that redraws it as an engraving, and you can drag to turn it. The crystal specimen finishes its morph into the logo.
   - **Persistent across all plates:** a glass **vitrine** holding the SVG crystal morph, which changes habit with scroll and discharges a lightning bolt to each plate's focal point when you click it or a plate changes. Also a plate **rail**, a paper tag of **live readings** from the product feed, and on desktop a **loupe** that magnifies the archive scan at 2880 px, with image coordinates as a readout.
2. **Tab. IV · the catalogue.** The four kit plates (MCP Emails, Fun Libs, Toolrails, Harbor) lie on the table at slight angles. They tilt toward the pointer with a soft glare and straighten on hover. Each has a catalogue caption with a fig. number, a status pill and facts from `content.js`. Loose gem cut-outs drift at different scroll speeds over Haeckel's Acantharia, which is multiplied into the violet.
3. **Tab. V · the retired drawer.** A disclosure with an animated height in the Radix accordion style (`grid-template-rows: 0fr → 1fr`). The seven retired specimen tags drop in with staggered springs, in a horizontal snap row.
4. **Colophon.** A seal that turns with scroll, the availability line, the email, the MCP line, and credits for every source. Haeckel's diatoms are lifted to light behind it.

## Voice

Like a catalogue entry written by someone with a sense of humour: exact, short, numbered, never selling. Facts are stated plainly and the metaphor is left to the images. The brand never asks for anything ("hire me", "let's connect" and "passionate" are banned).

- *Built at seventeen.* No marketing, ever.
- *Email, conducted to agents.*
- *One coil, every tool.*
- *Scanned, then engraved in code.*

## Colour (OKLCH, seed hue 276°)

| Token | Hex | Role |
|---|---|---|
| violet | #462eeb | Owns every page. |
| violet-2 | #5a45f5 | Glow behind objects. |
| deep | #170a62 | Glass: vitrine, buttons, footer. |
| night | #090731 | Shadows, scrims. |
| lilac | #a3a9ff | Quiet text, hairlines. |
| ink | #f3f6ff | Type and engraved light. |
| spark | #ddf93c | One per view: glint, scan line, bolt, live dot, copied state. |
| paper | #f8edd8 | Only on objects: plates, tags, pinned cards. Never a page background. |

## Type

- **Bodoni Moda** (italic for emphasis and every *Tab.* and *fig.* number, high optical size for display).
- **Geist** for body text.
- **Geist Mono** in caps with +0.12–0.16em tracking for labels, tags and buttons.

## Motion

Lenis smooth scroll, plus CSS scroll-driven animations as the backbone:
- Named `view-timeline`s on five scene spacers, shared with `timeline-scope`, drive the hex-cut reveals, the cabinet zoom, the card entries, the Tesla mount and scan, and the text cross-fades.
- `view()` timelines move the catalogue plates and loose gems, and turn the seal.
- JS reads the same scroll for the crystal morph (one path resampled to 120 points and interpolated) and for the bust's scan beam.
- Magnetic buttons and links use two-layer parallax with a `linear()` spring on release.

Without timeline support, or with `prefers-reduced-motion`, plates simply cross-fade by class and nothing zooms, spins or discharges. The 3D is replaced by its baked poster and Lenis is not loaded.

## Sound

Off by default and turned on from the header. When on, plate changes and discharges give a short band-passed crackle with a faint 50 Hz hum. Opening the drawer gives a softer one.

## Mark

The mark is two tabular quartz crystals mitred at 84°33′ to form an A, with a spark-yellow crossbar for the current. It appears in the lockup and favicon, at the end of the scroll morph, and inside the seal.

## Extending the direction

- **Blog (posts).** Each post is a numbered plate (*Tab. XII*), with a single electrified scan as its header, chosen from Kurr, Haeckel or another open-access science archive. Body text is Geist at about 68ch on violet, with figures captioned *fig. n.* in Bodoni italic and pull-quotes on paper specimen tags. Code blocks sit on deep glass and use spark only for the line being discussed. The reading-progress hairline uses `scroll(root)`. The post index is a drawer of tags, one Plate A habit per post.
- **Product pages.** Each product gets its kit plate as the hero, mounted on the violet table and tilting with the pointer. The page then becomes a scroll story in three or four plates, such as how it works, numbers and changelog. The crystal vitrine carries a habit chosen for that product (MCP Emails is quartz, Toolrails is the dodecahedron). Live readings are filtered to that product. The real product logo is always used as-is, and the archive treatment surrounds it but never touches it.
- **Retired products** keep their specimen tags, and a one-line reason is added when Asgeir writes it.

## Sources and licences

All scans are public domain (Science History Institute, Wikimedia Commons, LoC). The marble bust is Poly Haven, CC0. The fonts are under the SIL OFL. Exact URLs are listed in `assets/ASSETS.md`.
