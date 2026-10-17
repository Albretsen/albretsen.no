# Heure Bleue

*A terrace at blue hour where the visitor drags the sun, and the whole town answers.*

## Vision

The site opens on the few minutes after sunset, seen from a terrace. Directly below is a shelf of zinc mansard roofs around a dome. Beyond them, white and pastel houses step down through umbrella pines to a bay, and the sun has just touched the sea. The look is a 1930s travel poster redrawn in an Anderson pastel palette: flat light bands, a stepped sky, reflections drawn as dashes, and film grain.

The picture is atmosphere, not the subject. The subject is a small technology company that builds software and keeps it running. The craft shows in how the picture works. The town is built from three.js primitives in one 35 KB module and baked to stills that match the live scene pixel for pixel, so the swap from still to live scene never jumps. The sun can be dragged, and the sky, the sea glitter, the light on every wall and the windows of the whole town all respond.

**Why it fits Albretsen AS.** The page carries one strong idea on each screen, plenty of space and calm confidence. It is playful without being loud, and precise without being cold. Visitors notice the taste first and the engineering second.

## Structure of the homepage

1. **Hero: drag the sun.** The baked blue-hour still paints first, with the AVIF preloaded at 34 to 84 KB. Once the browser is idle, the live scene fades in over it. ALBRETSEN is set in the sky with `mix-blend-mode: soft-light`, so the name looks painted into the dusk. Below the name is one line: *Asgeir Albretsen builds software that pays for itself.* The bottom corners carry the sun's elevation and hour (*−1.6° Blue hour*) and one line of the live event feed.
2. **Products.** A scalloped awning hangs over the section, with plaster and paper grain beneath. The four current products each get a 4:5 painted scene with the real logo built in: a letterbox, a terrace table, a tile panel and a lit dormer. Each scene opens like shutters. Below it are the status, the name, one large figure in Poiret One, the product's one-line description and its facts. A sheet of seven postage stamps covers the retired products, and pointing at a stamp shows its line in a shared caption below.
3. **Footer: lamplight.** The night version of the same view sits behind the footer. On top of it are the availability line, the email address and the MCP line printed on a ticket stub. *Copy the line* postmarks the ticket.

## Voice

The voice is calm and exact, with a little wit. It states what runs, what it earns and what has been retired. There are no superlatives, no "passionate", and no calls to "connect".

- *Small software, run properly.*
- *Two products are live, one is being built and one is paused.*
- *Retired, with the lights off.*
- *Takes one outside engagement at a time.*

Facts come from `_shared/content.js` and are never rounded up. The copy never names a place and never uses tourist props. The world stays unnamed.

## Colour

| Token | Hex | Role |
|---|---|---|
| Ink | `#232c57` | Text, night, dark surfaces |
| Plaster | `#f4eadb` | Light background |
| Dusk | `#7a78b2` | Blue-hour sky, secondary |
| Pink | `#f2b5b8` | Afterglow; accent in dark mode |
| Mustard | `#d9a42b` | Sun, "being built" status |
| Burgundy | `#6e1f33` | Accent in light mode: figures, links |
| Powder | `#a9c6e0` | Sea, cool fills |
| Lamplight | `#ffd27a` | Lit windows, focus in dark mode, the email |
| Cypress | `#3c5a50` | "Live" status |
| Bougainvillea | `#d23f7c` | Flowers only, never UI |

Light theme is ink on plaster with burgundy. Dark theme (`prefers-color-scheme`) is plaster on `#1b2148` with pink. The page is wired to the sun: `--day` (0 at blue hour, 1 when the sun is high) tints the top of the products section from lavender to warm gold while the visitor holds the sun up.

## Type

- **Federo** is the Art Deco display face. It sets the outlined wordmark, headings and spaced capitals at +0.16 to 0.3em.
- **Instrument Sans** is the quiet text face for body copy, UI and the feed.
- **Poiret One** is a hairline Deco face for large figures only ($782, 113,000+), never below 48 px.

All three are self-hosted latin subsets under the SIL OFL.

## Motion

The principle is heat haze and sea breeze: slow, small and never insistent.

- **Sun drift.** Six seconds after the visitor lets go, the sun eases back to −1.6°, the brand's resting state.
- **hb-shutters.** Product art opens like louvred shutters, staggered across the row.
- **hb-settle.** Capital labels arrive wide and tighten to their spacing.
- **hb-sway.** The bougainvillea in the footer leans a degree in the breeze.
- **Micro-interactions.** Card art lifts 6 px and the domain underline draws in. Stamps lift and turn slightly. Nav underlines draw from left to right. Copying the MCP line stamps a postmark onto the ticket.

Under `prefers-reduced-motion`, nothing moves on its own. The scene renders only when the visitor moves the sun, the sun does not drift home, and every entrance is instant.

## Interaction and accessibility

The canvas does the hit-test for the sun in screen space, so the sun stays under the finger or cursor. A transparent `role="slider"` handle (vertical, −7° to +15°) follows the sun for keyboard users. The arrow keys move it by 0.5°, Page Up and Page Down by 3°, and Home and End jump to the ends. `aria-valuetext` reads, for example, "1.6 degrees below the horizon, blue hour". On touch screens the page keeps vertical scroll, and only a touch that starts on the sun takes the gesture.

## Sound

Sound is off until the visitor turns it on with *Sound* in the nav. It is synthesised with Web Audio rather than sampled. It plays a low brown-noise hush like distant water that breathes and brightens slightly as the sun climbs. A three-partial glass chime sounds when the sun crosses the horizon and when the ticket is postmarked.

## Mark

The mark is an arched terrace window at blue hour: a night band, lavender and pink bands, the sun on the horizon and three reflection bars, framed in burgundy. The wordmark is ALBRETSEN in Federo capitals converted to outlines. The lockup adds a small AS. The mono mark uses `currentColor` for print and the footer.

## Performance

First paint needs the HTML, about 25 KB of uncompressed CSS, two preloaded fonts (43 KB) and one hero AVIF (34 to 84 KB, with a portrait crop for phones). Product art is lazy-loaded AVIF/WebP, and stamps are small SVGs. three.js and the scene (about 720 KB) load only after `load` and an idle callback, and not at all with Save-Data or on 2G. Every image has width, height or an aspect ratio set, and the hero has a fixed height, so layout shift is 0.

## Extending to the blog and product pages

- **Blog.** The blog uses plaster pages with paper grain. Titles are in Federo and body text is Instrument Sans at 18/30, set to a 64ch measure. Each post gets a cover graded from the kit: the graded Wikimedia photographs (the gilded dome, the white street) or a still baked from the scene at a chosen hour, with the hour matching the post's mood. Dates are printed in the circular postmark, and the divider-sunset ornament separates sections. Code blocks sit on a pale terrace-tile backdrop with an ink card on top.
- **Product pages.** Each product lives somewhere in the same town, and its page opens on that place: the letterbox for MCP Emails, the terrace table for Fun Libs, the tile panel for Toolrails, the dormer for Harbor. The page uses the product's own real logo and colours. The hero figure is set in Poiret One and the facts sit underneath in spaced capitals. A new product gets a new place in the town: a doorway, a balcony or a kiosk, drawn in the same poster language.
- **A small sun on every page.** Inner pages carry a small sun in the header that can be dragged. It shifts the page's `--day` tint from blue hour to afternoon, and on a blog it doubles as a reading theme.
