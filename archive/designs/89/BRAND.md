# Prism Room

**One sunlit room. The products are pixel objects you can pick up, and their real logos are the only sharp things in it.**

## Vision

Albretsen AS is a small technology company that builds what earns its place: apps, SaaS and infrastructure for AI agents. The brand should feel the way good software feels from the inside. It is calm on the surface and exact underneath, and it converges on the right answer.

The homepage is a real photograph of a loft in late sun (Poly Haven, CC0), graded into a "candy prism" light: plum shadows, rose mid-tones, and apricot sun at seed hue 36°. The page first paints the room as a 12 KB, 13-colour ordered-dither image. As you scroll, the room resolves into the photograph the way a path tracer converges, and a prism lens under the cursor shows the true photo early. No 3D runs in the browser. The room *looks* rendered, but it is photography plus code.

The products live in the room as pixel objects: a monitor in the sunbeam (MCP Emails), a laptop on the drum seat (Toolrails), a phone on the window sill (Fun Libs) and a book by the mirror (Harbor). The objects are Kenney CC0 models baked offline into sprites, and each carries its **real** logo at full resolution. The work is the only sharp thing in a pixel world.

The bulb panel in the photograph works as a real 20-pixel display. It boots by drawing the prism "A", then shows the live event feed, one bulb per event, coloured by product.

## Signature delight: drag to rearrange anything

Every object in the room can be picked up. It lifts 10 px, tilts with the velocity of your hand (up to ±12°), drops on an overshooting spring and snaps to the room's 320-pixel grid. The arrow keys nudge it. Enter takes you to that product's card. The arrangement persists per visitor, and "Reset room" springs everything home.

The same physics carries down the page. The product cards and the retired shelf can also be dragged into any order, with the other items moving out of the way (FLIP). The keyboard path is: focus the grip, Space to pick up, arrows to move, Space to drop, Escape to put it back. Every move is announced to screen readers.

## Voice

Dry, exact, unhurried. State what is true, then stop. Never sell, never plead. The banned words stay banned.

- Hero: "Software that pays for itself." / "Everything in this room is pixels, except the work."
- Section: "The sharp things in the room."
- Close: "Takes one outside engagement at a time."

Numbers come only from `content.js`. Labels are small and set in Silkscreen caps, never whole sentences.

## Colour

| Token | Hex | Use |
|---|---|---|
| ink | `#160c21` | page ground |
| ink-2 | `#2a1935` | cards, panels |
| plum | `#572953` | lines, dither mid |
| paper | `#fff5ea` | primary text |
| fog | `#e8d8e6` | secondary text |
| peach (seed 36°) | `#ff9a7d` | accent, MCP Emails |
| bubblegum | `#ff99c2` | Fun Libs |
| lilac | `#bea6eb` | Harbor |
| sky | `#86cbf3` | Toolrails |
| mint | `#8deaca` | live, code, albretsen.no |

Candy colours appear only as light: bulbs, figures, the spectrum crossbar and the 3 px chromatic edge on hover (bubblegum on the left, sky on the right). They never fill a surface.

## Type

- **Geist 600** for display, tracked tight (−0.035 to −0.04em).
- **Geist 400** for body text.
- **Geist Mono** for code, captions, facts and the MCP command.
- **Silkscreen** for tiny uppercase labels only (status, section numbers, hints).
- The wordmark is custom 5×7 pixel letterforms, not a font.

## Motion

Things converge rather than arrive.

| Name | What it does |
|---|---|
| Resolve | Dither becomes photo as the hero scrolls away. The footer sun wall does the same as it rises. |
| Prism lens | The true photo shows under the cursor, with a pink and blue fringe. |
| Pick-up / drop | Velocity tilt, spring overshoot, grid snap, and a 4-frame pixel sparkle. |
| Prism sweep | Headlines pass white light through the spectrum once, on load or on entering view (scroll-driven CSS). |
| Live line | Each new event wipes in left to right, and the newest bulb pops. |
| Lenis | Lenis 1.1.13 is loaded lazily for smooth scroll and writes a velocity variable for smear effects. |

Durations stay under about 300 ms for UI and use springs for physical things, following Emil Kowalski's rules. Everything is interruptible. Under `prefers-reduced-motion`, the photo is shown resolved, nothing animates, and Lenis is not loaded.

## Sound

Off until the visitor turns it on in the header. When on, it plays tiny square-wave blips: one on pick-up, one on drop pitched by depth (nearer is lower), a faint tick per live event, and two notes on copy and reset. They are generated with WebAudio, so there are no audio files.

## Mark

A pixel "A" on a 16-grid whose crossbar splits white light into the five-colour spectrum, paired with a 5×7 pixel wordmark. It works at favicon size, in one colour (`mark-ink.svg`, `mark-paper.svg`) and on the OG card.

## Extending to the blog and product pages

- **Blog.** Each post gets a cover crop of the room or the sun wall with one object in frame, served as a dither placeholder that resolves to the photo on load. Article pages use the ink ground, Geist 18/1.65 at about 68 characters per line, Silkscreen for dates and tags, and Geist Mono code blocks with mint text. The spectrum rule sits between sections. A post about a product moves that product's object into frame. The "infrared" grading idea fits here as an occasional alternate cover treatment.
- **Product pages.** Open on that product's card image, which is its object in its spot in the light, resolving from dither. Below it, the product's own brand takes over and Prism Room becomes the frame: an ink ground, the product's accent replacing peach, figures from `content.js` in large Geist, and facts as mono chips. A small drag-room of that product's related objects can serve as a playful changelog or roadmap: drag a shipped feature onto the table.
- **New products** are a new object baked from a CC0 model with the real logo laid on crisp. They get a place in `room-map.json` and a product colour from the spectrum.
- **Retired products** go on the shelf as 16×16 stand-ins, which can be sorted like everything else.

## Performance

First paint is the 12 KB dither PNG at a fixed aspect ratio, so layout shift is 0. The photo is AVIF (WebP as fallback), from 22 to 60 KB depending on viewport. The footer photo component only wakes up near the viewport. Lenis and the motion module load after first paint. Card images are lazy, responsive AVIF and WebP.

## Credits

The room and sun wall photographs are Poly Haven `photo_studio_loft_hall` backplates (CC0). The furniture is from the Kenney Furniture Kit (CC0). Product logos belong to Albretsen AS. Everything else was generated for this kit (see `assets/ASSETS.md`).
