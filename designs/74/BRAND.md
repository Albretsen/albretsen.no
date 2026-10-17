# Afterglow Diorama: brand book (design 74)

## Vision
Albretsen AS makes small software, and makes it exactly. The brand shows this instead of claiming it. The homepage opens on a wide cut-paper coast at afterglow: a mid-century glass house on a cliff, a curving boulevard of lamps, and a steep mountain straight out of the sea. The name ALBRETSEN stands behind the mountain. As you scroll, the whole world pulls back into an arched shadow box on a sunlit desk, so the coast was a miniature all along. The box turns when you drag it, and its sky is the real sky over Norway at that moment, computed from the sun's position over Oslo.

Everything after the hero follows a single day. Each product has its own hour (08:00, 12:00, 18:30, 21:40), and the page background moves from a sea-washed morning through ochre noon and rose evening into a plum night. Retired products are shuttered arches "after hours". The page ends at night with one line about availability.

There is one idea per screen, with generous space and light doing the work. The atmosphere borrows the hazy pastel dusk and mid-century calm of the West Coast, plus the warm optimism of Mediterranean sunshine. It never names a place, and the subject is always the software.

## Voice
- Plain, exact and a little playful. Short sentences, concrete facts, no self-praise.
- Use numbers only from `content.js`, and let them stand alone without "amazing" or "proud".
- Banned: "hire me", "let's connect", "passionate", travel or postcard words, and place names.
- Examples:
  - "Small, exact software that pays for itself."
  - "Each one keeps its own hour."
  - "Shuttered, and kept."
  - "Made at a small scale, on purpose."

## Type
- **Josefin Sans** (variable, OFL) for signage capitals. Track it 0.22 to 0.34 em for labels and product names, and about 0.16 em for the hero name. Always set it in capitals.
- **Instrument Serif** (OFL) for one italic headline per screen; the roman cut is for body text at 18 to 21 px.
- **DM Mono** (OFL) for figures, times, the MCP command and the sky readout.

## Colour: Riviera
| Token | Hex | Role |
|---|---|---|
| Paper | `#F5EBDC` | page, mats, frames |
| Plum ink | `#2E2240` | text, night background |
| Terracotta | `#C2603E` / deep `#8E3F2C` | accents, focus rings, small labels |
| Ochre | `#D9A441` | the sun, "building" status |
| Sea blue | `#2F6E9E` | sea, shutters |
| Lavender | `#A99BD1` / deep `#6E5A8E` | far mountains, quiet text |
| Afterglow rose | `#E7A39A` | dusk wash |
| Lamp glow | `#FFC979` | light only: lamps, lit letters, never body text |

The day gradient (morning `#E3ECEA`, noon `#F8E6BE`, evening `#EFBFA8`, night `#3E3361` to `#2E2240`) is laid out by `site.js` so that each stop falls on the centre of a product.

## Motion
- **Pull-back** (hero): scroll scales and clips the full-bleed world into the arch of the shadow box. The paper sheets dolly at depth-scaled rates. The live diorama then crossfades in and gives a single introductory turn.
- **Day Pass**: the products section passes a day as you scroll, and a sticky 24-hour dial follows the hour.
- **Sign Light-Up**: product names switch on letter by letter, with ink on light backgrounds and lamp glow at night.
- **Boulevard On**: the divider's lamps ignite from the vanishing point toward you.
- **Paper Lift**: product plates and shuttered arches rise off the page on hover or focus.
- One ease is used for everything: `cubic-bezier(.2,.8,.2,1)`. With `prefers-reduced-motion`, nothing pins or scales. The hero is static, the diorama sits below it, and every light is already on.

## Sound
Sound is off until the visitor presses "Sound off" in the header. When on, two synthesised sounds play: a small glass "tink" when lamps light, the copy button confirms or "Now" resets the sky, and a 120 ms filtered-noise "card settle" when the diorama is released. There are no samples and nothing loops.

## Mark
`assets/identity/mark.svg` is an arch with a sun behind an A-shaped peak, where the horizon cut forms the crossbar. It sits next to the outlined Josefin wordmark (`wordmark.svg`, `wordmark-paper.svg`). On paper, the header wordmark is tinted to ink.

## Extending to the blog and product pages
- **Blog index:** a calm list on paper. Each post has a date in DM Mono, an italic Instrument Serif title and a small "hour" chip from its publish time. Covers are crops of the paperworld renderer at the light state matching the post's hour, which keeps the art set coherent.
- **Article:** a single 680 px column in Instrument Serif at 21 px, with Josefin capitals for section labels and DM Mono for code. Above the title sits a thin knife-cut edge (`extras/edge-hills.svg`). The article background keeps the light state of its publish hour as a very faint wash.
- **Product pages:** each one opens on its own vignette (`assets/products/*-960`) at its hour, scaled up in an arched mat. Below it come the figure, the facts as a ruled list, and a "since" line. A new product gets a new hour and a new object on the same street, rendered by `paperworld.js`.
- **About:** the live diorama with the sun slider, followed by the day-job timeline as lamps along a boulevard.

## Files
- `index.html`, `css/site.css` and `js/site.js` make up the page. `img/sky-afterglow-*` are resized and WebP versions of the kit's CC0 Poly Haven sky.
- `assets/` is the art director's kit. ASSETS.md lists every source and licence.
- Review helpers for headless screenshots: `?p=0..1` freezes the pull-back, and `?from=products` starts the page at the products.
