# Low Sun Terrace (design 72)

## Vision

The homepage opens as a magazine's opening spread. The headline runs across the fold, with "Quiet software" on the left page and "that pays for itself" on the right. Below it sits one wide plate: a symmetrical miniature house, built in three.js, with a whitewashed arched loggia and bougainvillea over the door. Falu-red clapboard wings sit under a long ranch roof with snow on it, golden hills rise behind, and a low winter sun comes from behind on the right. The gutter of the spread is the house's centre line.

Scrolling makes one unbroken move. The plate opens to full bleed, the headline halves part like pages, and the camera dollies down the gutter to the lit doorway. An arch of warm light, the same shape as the mark, then grows out of the loggia until it becomes the next page. Inside are the products, each one a small building on the same snowy terrace and each carrying its real logo. A lit window means the product ships today. Harbor's window is dark because it is paused.

The house sets the atmosphere: southern whitewash and terraces, coastal-highway gold, Norwegian small-town colour and Wes Anderson symmetry. The subject is always the software, and the copy never names a place.

## Voice

Plain, warm and exact. Facts are set like magazine captions: small, true and uppercase in mono. Display lines are short and declarative. There are no superlatives and no calls to action.

- "Quiet software that pays for itself."
- "One building per product. A lit window means it ships today."
- "Each one taught the next."
- Footnote, revealed on hover of the asterisk: "MCP Emails, since 2026: $782 MRR."

## Type

- **Albert Sans** (OFL). Display uses weight 200 at −0.03 to −0.035em, and body text uses 300. It is a Scandinavian geometric face that stays light and open.
- **DM Mono** (OFL) 400 in uppercase with 0.14em tracking, used for folios, running heads, status, the feed, figures' labels and the MCP line.
- Both faces are self-hosted from `assets/fonts`, and only the Albert Sans roman is preloaded.

## Colour

| Token | Hex | Role |
|---|---|---|
| Whitewash | `#F6F1E7` | page (with a multiply grain tile) |
| Paper | `#FAF6EE` | the spread |
| Ink | `#323A44` | text |
| Falu red | `#8F2B20` | the right page of the headline, links, the mark |
| Slate | `#4B5663` | secondary text |
| Ochre | `#C8902F` | live status, feed dot |
| Snow shade | `#C9D3E3` | paused status, long shadows |
| Door light | `#FCEEDD` | the arch of light and the top of the work section |

Whitewash, ink and falu red carry about 90% of every screen. Warm colours live in the imagery and in the hover light.

## Motion

- **The one move.** A 260svh track with a sticky stage. Scroll is mapped to one value `p`, lerped at 0.075, which drives everything: the plate's clip-path opens to full bleed, the headline halves part, the three.js camera follows `cameraAt(p)`, and an arch of light scales out of the loggia. Rendering happens only while the value is settling. On phones and narrow screens the baked 4:5 still pushes in toward the door instead, so there is no 3D cost.
- **Spread Unfold.** This is the only autoplay. On load the plate opens from the gutter in 1.6s, and the headline halves settle toward the fold.
- **Raking light.** Hovering or focusing a product makes a band of low sun cross the render. The door glow brightens, the name is underlined, the "since" year slides out, the domain is wiped in, and the engraved facts are pressed into the paper.
- **Held miniature.** On fine pointers the render tilts up to 3–4 degrees toward the cursor, as if you were holding a model.
- **Long shadow.** A retired plaque rises on hover and casts a long, stepped, snow-shade shadow to the lower left, because the sun is low on the right. The museum label below it updates.
- **Easing.** `cubic-bezier(.65,0,.35,1)` for the camera and `cubic-bezier(.2,.7,.1,1)` for light and paper. Nothing bounces.
- **Reduced motion.** The spread is still and the track collapses to one screen. There is no 3D, no sweep and no tilt, and every fact remains visible.

## Sound

The site is silent by default. If sound is ever added it must be opt-in through a visible toggle, and it is limited to one soft latch click and a brief warm room tone when the door light fills the page. Nothing loops.

## Mark

A falu-red arch with a low ochre sun resting on its sill: the loggia, the doorway, and the light that turns into the page. Beside the mark, the wordmark is set in Albert Sans Light. The favicon is the mark on a whitewash tile. In the footer the arch becomes a window onto the low sun and a single cypress.

## Extending it

- **Blog.** Every post is a single page of the same magazine. It has a running head ("Albretsen AS · No. 0n · title") and a folio footer. Its cover plate is one of the graded photographs (`golden-hills`, `long-shadows`, the NASA view from orbit) or a new still from the same set, such as a window, the frozen pool or the parasols. The cover sits under a headline that is split across a centre gutter, as on the homepage. Body text is Albert Sans 300 at 19px on paper, about 64ch wide, with DM Mono captions under figures. Pull quotes are set in display 200 weight with a falu-red rule. The post's date and reading time are set as a folio.
- **Product pages.** Each product page opens with its own building render, full bleed, and the same single move: a short dolly up to its door, then the light becomes the page. Below that come the figure in large display weight, the facts as engraved captions, and the real logo, which is never redrawn. Live products have a lit window and paused ones a dark window. Changelogs read like a guestbook, with dated lines in mono.
- **New products** are new buildings on the terrace: a pavilion built in `terrace.js` with the real logo as its sign. A retired product becomes an enamel door plaque.
- **The live feed** stays in the right-hand folio of every hero, one line at a time.

## Performance

The first paint is the baked AVIF hero (about 32 KB at 1600px, with responsive WebP and JPEG fallbacks and preloading by aspect), two woff2 fonts, the CSS, a small module and the grain tile. three.js r169 loads only on wide screens after `load`, when the browser is idle. It skips reduced-motion and Save-Data visitors and fades in over the still. All other images are lazy and have explicit dimensions, and the moving parts use only transforms, clip-path and opacity, so layout shift stays at 0.

## Sources

All imagery comes from the kit in `assets/` (see `assets/ASSETS.md` for licences): original three.js renders, NPS and Commons public-domain photographs, NASA Earth Observatory imagery, and the real product logos from `designs/_shared/products`.
