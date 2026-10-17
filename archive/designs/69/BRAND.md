# Afterglow (design 69)

## Vision

The site is one evening. You arrive just after sunset on a coast of cliffs, and ALBRETSEN is set thin and white exactly on the horizon, with its reflection shimmering faintly in the sea. As you scroll, the camera settles and the photograph dissolves into a town of pastel deco towers holding the last light, and then into the shore at the moment the sun touches the water. Then the page opens onto the products, mounted as glazed tiles on sunlit stucco, and the background sky keeps turning toward dusk until the footer.

The subject is still a software company. The light is the atmosphere: warm, unhurried, exact. It suits Albretsen AS because the work is the same: small products, finished carefully, left running. One idea per screen, a lot of sky.

## Voice

Plain, calm and precise. Short sentences, no selling, no superlatives, and no "passionate", "hire me" or "let's connect". Facts carry the weight.

- Hero: "Software that pays for itself, built carefully and left running."
- Town frame: "Apps, SaaS and the infrastructure AI agents work through. Still running as you read this."
- Shore frame: "Everything here, in one line your agent can read."
- Footer: "Takes one outside engagement at a time."

No place names, no travel words ("discover", "escape"), and no emoji.

## Colour (Miami deco at afterglow)

| Token | Hex | Use |
|---|---|---|
| Plaster | `#FBF8F4` | page, type on photographs |
| Dusk ink | `#2A2D4F` | text, lines, the mark |
| Ink soft | `#5A5E80` | secondary text |
| Flamingo | `#EE8AA0` | accent, the sun in the mark, active rules |
| Mint | `#8FD3BF` | focus rings, live status, the reflection |
| Sky | `#9EC3E6` | upper sky, quiet fills |
| Glow | `#FFC9A0` | horizon, "building" status |
| Lilac | `#7D88C8` | shadows, "paused" status |
| Green flash | `#8CFFD1` | the easter egg only |

The page background is a sky (`motion.css`, *Sky turn*): `#DCE8F4 → #F4F1EC → #FBF8F4` at the top of the document, turning to `#AEBFE6 → #F3C3CB → #FFD9B8` at the bottom. The site is light. It ends at dusk, but it is never dark mode by default.

## Type

- **Albert Sans** (variable, OFL), a geometric sans drawn after early Scandinavian designers. Display 200 with −0.028em tracking, headings 250, body 300, and nothing heavier than 400.
- **DM Mono 300** (OFL) for captions, figures, metadata and the MCP command. Caps labels are tracked +0.26em.
- The display name is ALBRETSEN outlined from Albert Sans 200 (`assets/brand/name-display.svg`), inlined so it takes `currentColor`.

## Mark

An A: the legs are two cliffs and the crossbar is the horizon. A flamingo half-sun sets inside it, and two mint lines below are its reflection. It is drawn in the same 2 px line as the type. The wordmark is the mark plus ALBRETSEN tracked +0.26em, with **AS** in flamingo.

## Motion

Everything arrives on one curve, `cubic-bezier(.16,.84,.24,1)`, slowly, like light levelling out.

1. **Afterglow dissolve** (hero): a WebGL dissolve between real photographs in which the darks of the outgoing frame leave first and the highlights linger. It has live 24 fps film grain. Scroll picks the frame and time does the dissolve, so it never scrubs.
2. **Descent**: the hero scene settles from 1.08 to 1.04 and drifts upward over the length of the pinned hero.
3. **Horizon rise**: headlines rise line by line from behind their own clip, with a blur-to-sharp.
4. **Sky turn**: the page background turns from afternoon to afterglow on a `scroll(root)` timeline.
5. **Long shadow**: the product frame's shadow lengthens as it rises through the viewport, as if the sun were lowering.
6. Micro-interactions: captions arrive 550 ms after a dissolve starts, the way light arrives after an image. The feed line swaps with a small rise and a blur. A flamingo-to-glow rule draws across the active product. Link underlines draw in from the left and leave to the right. The copy pill rolls up from "Copy" to "Copied".

`prefers-reduced-motion` turns off the descent, the grain, the dissolve timing, the shimmer and the rises, and frames swap instantly.

## Delights

- **Move the sun.** The first time a fine pointer rests on the product photograph, three.js loads and the photograph becomes the live scene: the same glazed tile on the same wall, with the low sun following the pointer and the long shadows swinging with it. Touch devices keep the baked stills, and the product nearest mid-screen takes the frame.
- **The green flash** (hidden, never announced). Rest the pointer on the horizon for two seconds, or type `flash`, and a thin mint line blooms on the horizon. It is the last colour the atmosphere lets through after sunset.

## Sound

Silent. If sound is ever added, it is a single opt-in sea hush tied to the shore frame, behind a visible toggle and off by default.

## Performance

The first paint is the cliffs still as responsive AVIF/WebP/JPEG (about 90 KB at 1600 px) plus two fonts (49 KB). The WebGL dissolve loads on idle after `load` and reuses the image format the browser picked for the still. Product stills are lazy, and three.js loads only on the first pointer over the product frame. Every image has width and height or an aspect-ratio, so layout shift stays at 0.

## Extending to the blog and product pages

- **Blog:** each post opens with one graded photograph as a cover at a 21:9 crop, using the kit's detail crops (fins, windows, foam, rocks) or new public-domain images run through the same Portra grade in `assets/_process/`. Titles are Albert Sans 200 at 56 to 72 px, on a single 38rem column of 300-weight text on plaster. Dates and reading time are in DM Mono. The page sky turns over the length of the article, so a long read ends at afterglow. Code blocks use plaster-on-ink with mint for strings, and the speed-line divider separates sections.
- **Product pages:** each product owns one wall colour (MCP Emails flamingo, Fun Libs mint, Toolrails sky, Harbor plaster). The hero is the product's glazed tile, live in three.js with the sun on the pointer, beside one sentence and one figure from `content.js`. Sections below follow one idea per screen: what it does, the figure, the facts as a quiet mono list, and the link. Status keeps its colour everywhere: mint live, glow building, lilac paused.
- **Retired products** use the enamel roundels and a one-line reason when Asgeir writes it.
- **404:** the NASA sunset limb (`extras/orbit-1600`) with one line of text.

## Credits

The photographs are by Carol M. Highsmith (Library of Congress, public domain) and NASA (public domain), regraded for this kit. The fonts are under the SIL OFL. three.js r169 is MIT. The full inventory is in `assets/ASSETS.md`.
