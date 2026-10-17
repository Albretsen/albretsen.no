# The Long Evening

*Design 63 for Albretsen AS. The asset kit and its sources are in `assets/ASSETS.md`, and `assets/preview.html` shows all of it.*

## Vision

This is coastal light seen through a Norwegian window. The site is set at the hour of a late-summer evening that never quite gets dark. The landscape is atmosphere rather than a place, so the copy never names one. Everything is painted in a small-town palette of white clapboard, falu red, ochre and slate.

The organising idea is **the postcard**. A postcard is small, finished and sent. It has an image on one side and a few exact words on the other. That is how Albretsen AS works: one product at a time, each made to stand on its own and kept only if it pays for itself.

- **The hero is postcard No. 00.** The front shows fog filling a coastal valley at sunset, with *Albretsen* set into the scene. The name is live SVG text, stacked between the photograph and a matte cut from the same photograph, so it sinks into the fog and its final "n" slips behind the ridge. The strip below the photo holds one line, *Quiet software that pays for itself.*, plus a single line of the live event feed and the button **Turn over**.
- **The back is the introduction.** It has a short message signed by Asgeir, a stamp (the mark) with the company postmark, the `claude mcp add` line with a copy button, and an address. The flip is the signature delight. It turns the whole hero over, centred and deadpan, on one symmetric curve.
- **Products are postcards in circulation.** Each front is a graded photograph with the real product logo as its stamp. The back carries the line, the single figure that matters, the facts and the address. Retired products are stamps kept in an album. Pointing at one reads it out.
- **The room** is a planimetric 3D room with the same four cards on the wall. Scrolling through the section passes the evening: the sun crosses the window, the light patch slides across the slate floor, and a Bodoni clock runs from 17:40 towards 23:10. Narrow screens, reduced motion and save-data get a crossfade between two baked stills instead.
- **The close** is a band of sunset over cloud, photographed from orbit (NASA, public domain). It opens from its horizon line, followed by the availability line and the email.

Restraint matters here. Each screen holds one idea, with generous space and no decoration that does not carry light or information.

## Voice

The voice is quiet, exact and a little dry. It states what exists and stops. There are no exclamation marks and no adjectives about the person.

- *A small technology company that builds what earns its keep.*
- *Four products, each its own card. Turn one over for the details.*
- *Retired, kept in the album.*
- Numbers appear exactly as in `content.js`, set large in Bodoni and in falu red. A card carries only one of them.

## Type

- **Bodoni Moda** (OFL, opsz pinned to 96) is for the name, headlines, figures and postcard names. The italic is for the one-liners, the signature and the email. Hero weight is 440 with -0.01em tracking.
- **Schibsted Grotesk** (OFL) is for text and UI. Labels are 11 px small caps with 0.22em tracking.
- **Monospace** (system) is used only for the MCP line.

## Colour

| Role | Hex |
|---|---|
| Clapboard (page) | `#F5EFE4` |
| Card stock (cards, panels) | `#F1E8DA` |
| Ink (text) | `#23252D` |
| Slate (secondary text, rules) | `#3E4651` |
| Falu red (one accent per screen) | `#8A2E22` |
| Ochre (the sun, live dot) | `#C9973A` |
| Dusk haze (the page drifts toward it as you scroll) | `#E9C7B2` |
| Marine layer (cool counterpoint) | `#BFD0D6` |

The whole page tints from clapboard toward dusk haze as you scroll down it. Late afternoon at the top becomes evening at the bottom.

## Motion

Motion is precise, symmetrical and deadpan. Every move is either centred (the flip, the pull-back at its midpoint, the name rising out of the fog) or lateral (the feed swap, the stamp album). Everything runs on one symmetric curve, `cubic-bezier(.65,0,.35,1)`, with no overshoot and no bounce. Scroll drives the light, never the layout. `prefers-reduced-motion` turns flips into instant swaps, stops the feed slide and the name intro, and freezes the room at mid-evening.

## Sound

Sound is off until the visitor turns it on in the header. After that, turning any card plays one soft card-stock flick: a 220 ms band-passed noise burst synthesised with Web Audio, with no files. Nothing else makes a sound.

## Mark

The mark is a Bodoni **A** whose crossbar is the horizon, with an ochre sun setting on it, on falu red. Light and night versions exist. On the hero card's back it becomes a perforated stamp under the round postmark *Albretsen AS · Norway · 2016—*.

## Extending to the blog and product pages

- **Blog.** Each post is a postcard. The cover is a graded photograph with the post's number in the top-left (*No. 12 · 2026-08-19*) and the title in Bodoni italic, as on the product fronts. NASA orbit imagery and the kit's grade (split-toned toward `#EDB99A`, lifted blacks, fine grain) keep covers consistent. The article page is a single 64-character column on clapboard, with Bodoni headlines, Grotesk body and falu red used once (the pull figure). The post ends with "the back": a signature line, the date as a postmark, and the next card.
- **Product pages.** The page opens on the product's postcard front at full width, made from the same three-layer stack as the hero, so the product's name sits inside its photograph. The first section is the back of the card, set large: the line, the one figure, the facts and the address. After that the content is plain documentation in the same column. The product keeps its own logo as its stamp, and the site never recolours it.
- **The room** can return on an About page as the one 3D moment on the site, with the same scroll-as-time behaviour.
- **Rules that carry over:** one idea per screen, one red accent per screen, real photographs only, every move symmetric, and no place names.
