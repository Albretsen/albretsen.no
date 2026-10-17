# Gravity Issue

A brand direction for Albretsen AS and albretsen.no (design 03).

## Vision

albretsen.no is the current issue of a magazine with one recurring subject: things Asgeir built, and what they are doing right now. It has a **cover** (the name, a cover story and a live timeline), a **contents** spread (the products, retired ones included as back issues) and a **colophon** (availability and email). You read it sideways, like turning pages.

The idea is gravity. Ideas fall out of the air and land as products. Real events from the products land on the cover as marks, and every landing pulls on the field behind it. A builder who is bright and forward-looking makes things that have weight.

It is a technology brand that borrows only the *structure* of editorial design: the standfirst, the drop cap, the folio, the contents page. It does not borrow its nostalgia. No paper texture, no serif, no faux print.

## Personality

Optimistic builder: bright, energetic and forward-looking. Confident enough to be playful. Curious about what will happen, not anxious about it.

## Voice

Playful and curious. Written like a good magazine standfirst: third person on the cover, short sentences, a question now and then, and never a sales line. Facts come only from content.js, and the voice adds wonder to them, never inflation.

- Cover: *"Asgeir Albretsen builds apps, SaaS and the plumbing AI agents run on, then keeps whichever ones pay for themselves."*
- Feed: *"Curious what that looks like this minute? It is printing below."*
- Contents: *"Every product here began as a question: would anyone want this?"*
- Retired: *"The others stay on the shelf, because a well-asked question is worth keeping."*
- Colophon: *"Set in one grotesk, from eleven pixels to the height of the room."*

Never: "hire me", "let's connect", "passionate", superlatives, numbers that are not in content.js.

## Mark

**The data mark.** Four bars, one per live source (MCP Emails, Fun Libs, Toolrails, albretsen.no). Each bar's height is that source's share of the last twelve live events, from 14 % to 100 %. The mark in the masthead re-springs on every event, and the favicon (drawn on a canvas, not an image file) changes with it. The static fallback uses the feed's long-run mix (about 1 : .62 : .22 : .14).

The wordmark is "Albretsen" in Bricolage Grotesque 800, width 75, sitting on the baseline of the bars. In print or on a sticker, freeze the bars at whatever the last twelve events said when it was made. Every copy of the logo is then a small timestamp.

## Colour

Duotone, strictly two colours with no greys and no opacity tints. Hierarchy comes from size, weight and inversion, never from fading.

| Ink | Hex | OKLCH | Use |
|---|---|---|---|
| **Sol** | `#ff8b44` | `oklch(0.76 0.17 48)`, clipped to sRGB | paper on the cover and colophon, type on Contents |
| **Umber** | `#301000` | `oklch(0.22 0.06 48)` | type and halftone on Sol, paper on Contents |

Both colours sit on hue 48°. Contrast is 7.7 : 1 both ways (WCAG AAA), so even the 11 px caps read cleanly. Spreads alternate the inks: the cover is Sol, Contents is inverted to Umber, the colophon goes back to Sol. Selection inverts too.

## Typography

One family, **Bricolage Grotesque** (variable: opsz 12–96, wdth 75–100, wght 200–800). It has the personality of a grotesk without being neutral. All the drama comes from extreme contrast inside the one family:

- **Display:** 800, wdth 75, opsz 96, tracking −0.05em, line-height 0.8. The name runs up to 27svh.
- **Thin display:** 200, wdth 75, for "Contents", the folio numbers and the availability line. The same size as the heavy display at a quarter of the weight.
- **Text:** 450, wdth 90, opsz 32, for the standfirst. 400 for body copy.
- **Labels:** 600, 11 px, caps, tracking +0.09em, wdth 100, opsz 12.
- **Drop cap:** 800 condensed, 4.9 lines high, on every opening paragraph.

There is no mono face. The MCP command is set in the grotesk at width 75, running up the spine between spreads.

## Layout

- **Horizontal issue.** From 760 × 540 up, the document scrolls sideways. Each spread is exactly 100svh tall. Vertical wheel, PageUp/PageDown, Space, arrows and Home/End all turn the pages sideways, and anchor links jump between spreads.
- **Spreads:** Cover (100vw) → Spine (44 px gutter holding the MCP line) → Contents (as wide as it needs) → Colophon (at least 100vw).
- **Cover grid:** masthead rule / name and standfirst columns / the full-width timeline strip / page-turn cue.
- **Contents:** a head column, then two shelves, *In print* and *Back issues*. Each entry is a column with a hairline on its left: folio number, status, year, name, line, then the figure pushed to the foot. Retired columns are narrower and quieter but stay in the flow.
- **Below 760 px or 540 px tall,** the spreads stack vertically and the shelves become a horizontal snap scroller. It is still sideways where it matters.
- Gutter `clamp(16px, 2.2vw, 44px)`. Hairlines are 1 px, and the strip's baseline is 2 px.

## Live feed: the timeline strip

The last few minutes of real events sit on a ruled baseline, with "now" at the right edge. The track slides left in real time. Each product has its own mark, built in CSS:

- MCP Emails: a hairline bar whose height is the call's latency
- Fun Libs: a dot
- Toolrails: a square
- albretsen.no: a ring; a deploy is a full-height bar

New events fall in from above with gravity, bounce twice and settle. A caption shows the newest event, and the legend counts each product inside the window. The quiet is honest: no looping and no speed-up. At 3 a.m. the strip is sparse, and that is the point.

## Motion

- **The ambient field:** a halftone screen in Umber behind the cover (canvas, about 25 fps, paused when offscreen or hidden). Two travelling sine waves form a slow vector field that drifts up and to the right. Every landing drops a **gravity well** at the strip's "now" point. The well pulls nearby dots inward and swells them, then decays over about 7 s.
- **The landing:** 1.1 s, an ease-in fall and two diminishing bounces.
- **The mark:** bars spring to new heights (cubic-bezier .3, 1.5, .5, 1).
- **Reduced motion:** the field renders once and stays still, marks appear without falling, the track steps every 5 s, and smooth scrolling is off.

## Sound (described, not on the page)

**The sonic logo, "Landing":** two soft sine voices, a rising major sixth (A3 → F♯4, 90 ms apart, the second one held for 400 ms). On the downbeat of the second note comes a low felt thump at about 70 Hz, a short pitch-falling body with no click. It sounds like something being lifted and then set down with weight: optimism, then gravity. It runs to about 600 ms. In a product it could play when an agent connects its first inbox or a Fun Libs story is shared. It is always opt-in and synthesized, never a sample.

## No images, no SVG

Every shape on the site is type, CSS or canvas: the mark, the legend glyphs, the strip, the rules, the favicon. This keeps the page small (well under 100 KB before fonts) and it is a quiet demonstration of craft.

## Extending it

- **Blog: "Features".** Each post is a single long spread. The headline is set in the display cut at 18–25svh, followed by a drop-cap standfirst. The body runs in CSS columns (`column-width: 32ch`) with a fixed 100svh height, so long reads also go sideways. Pull quotes use the thin 200 cut at huge size. Posts alternate Sol and Umber covers. The folio along the bottom shows the post date and the page count.
- **Product pages: "Reports".** The cover is the product name huge, plus its status pill and start year. The strip is filtered to that product's events only, and the figure from content.js is set at full spread height. Facts go in as a column of "+" items. A retired product gets a "Back issue" page with its reason, in Asgeir's own words when he writes them.
- **Social and OG cards:** a Sol field with the name in condensed 800 and the data mark frozen at the moment the card was rendered.
