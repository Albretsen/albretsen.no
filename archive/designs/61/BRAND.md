# Sun Road

**One sunlit coast road, one day long: software made in good light.**

## Vision

Albretsen AS is a small technology company that builds whatever pays: apps, SaaS and infrastructure for AI agents. Sun Road presents that work as a single day on a coast road.

- **Imagery.** The hero is a real painting, Henri-Edmond Cross's *Calanque des Antibois*, graded into flamingo, mustard and powder blue. A WebGL shader re-lights it live from dawn to dusk.
- **Products.** They travel as postage stamps, and each denomination is a real figure: $782 MRR, 113,000+ installs, 4 connectors, 549 commits.
- **Timeline.** The years since 2016 stand along the kerb as milestones you drive past.
- **Footer.** The day ends on a postcard.

The atmosphere borrows sunshine and Wes Anderson's rigour: centred frames, flat pastels, double rules and deadpan ephemera. It is a mood, not a costume. The copy never names a place, and the subject is always the software. Visitors should feel the craft first (a painting that changes its light as you scroll) and the person second: effective, reasonable, optimistic, and confident enough to be calm.

## The homepage

1. **Hero: an establishing shot.** The cove fills the screen. Two paper letterbox bars retract while the camera pushes in 6% (Centre dolly), and a cream title card sits dead centre. The card holds the mark, the wordmark, *"Software that pays for itself, made in good light."*, and the name with "On Google Play since 2016". The hero stays pinned for an extra screen, so the first scroll visibly moves the light.
2. **The horizon dial.** A thin horizon line, with the sun as its thumb, lets a visitor drag the day by hand. A clock reads 05:30 at first light and 20:30 at dusk. The card's shadow swings with the sun. Next to it are the opt-in Sound button and one line from the live product feed.
3. **Products: the stamp sheet.** Four live stamps (MCP Emails, Fun Libs, Toolrails, Harbor) use the real logos, unchanged, in cream medallions. They press onto the page with the Postmark motion and lift a few pixels on hover or focus. Below them, seven small cancelled stamps cover the retired products under "Earlier roads". Pointing at one writes its line in a single caption, so the row stays quiet.
4. **The road so far.** A Canvas 2D causeway runs toward the sun. Pairs of year milestones approach as you scroll, and a centred title card names each year using only facts from `content.js`.
5. **Day Pass.** One ticket says "Admit one agent" and carries `claude mcp add albretsen https://albretsen.no/mcp`. Clicking it copies the command, and the stub tears away on its hinge (Tear-off).
6. **Footer at dusk.** The Monet cliff appears in its dusk grade behind an airmail postcard. The message side reads *"Takes one outside engagement at a time."* and the address side holds asgeir@albretsen.no.

## Voice

The voice is deadpan, sunny and exact: short declarative sentences, with real numbers doing the bragging. A little humour comes from treating software with the ceremony of travel ephemera ("Admit one agent", "valid from first light to dusk"), never from jokes about the work itself.

- Yes: "Four stamps, each worth its face value." / "Every denomination is a real figure." / "Seven products, retired with thanks."
- No: "passionate", "let's connect", "hire me", exclamation marks, place names or postcard clichés.

## Colour

Paper `#FBF3E6` is the ground, with a fine paper grain. Four flat pastels carry the light: flamingo `#F4C3C2`, mustard `#EBC46B`, powder `#A8CFE6` and mint `#BFDCCB`. Sun `#E0A93B` marks the sun, focus rings and the clock thumb. Burgundy `#6E2233` is the only colour used for type and rules, and ink `#45161F` is for body text (13.7:1 on paper). Dusk `#4A3A78` appears only at the end of the day. As the clock passes golden hour, the whole page takes a faint multiply tint of dusk.

## Type

- **EB Garamond** (OFL): display at weight 500, from 36 to 76px, tracked slightly tight. Body text runs from 17 to 19px with a line-height of 1.55. Figures and asides are set in italic.
- **Jost** (OFL): only for tiny uppercase labels tracked 0.24 to 0.45em, in the Futura spirit of a title card.
- **The system monospace face:** for the one command a reader might copy.

Both fonts are self-hosted, and the roman is preloaded.

## Motion

Scroll is the clock. Everything moves at the speed of a day passing, lands centred and then stays still. The named motions are:

- **Day Pass:** scroll sets the hour.
- **Centre dolly:** the hero pushes in once.
- **Postmark:** stamps press onto the page, then the ink blooms.
- **Tear-off:** the ticket stub swings away.
- **Sun glint:** light passes once across a headline.

Under `prefers-reduced-motion`, each of these becomes a 0.4s fade. The shader stops its water shimmer, but the light still follows the scroll and the dial.

## Sound

Sound is off until the visitor presses Sound. It is synthesised live with Web Audio and uses no audio files:

- a sea swell (brown noise),
- wind (pink noise through a wandering band-pass),
- a bell in a far-off square, now and then.

The layers rebalance with the hour: more bell in the morning, more wind at dusk.

## Mark

The mark is the letter A drawn as a road in one-point perspective. The sun sits on the vanishing point and the horizon forms the crossbar, which states the timeline idea in one glyph. The wordmark is ALBRETSEN in EB Garamond 500 capitals, tracked 0.16em and outlined to paths, with AS between two rules in the centred lockup. The favicon is the mark on a flamingo tile.

## Extending it

**Blog.** Each post is one more day on the road.

- The cover is a crop of one of the graded paintings, in the time-of-day grade that suits the piece. A morning post on shipping gets the noon grade; a reflective essay gets golden or dusk.
- The title sits in a centred cream title card with double rules. Body text is EB Garamond at 19px on paper, about 66 characters to a line.
- Pull quotes are set in large italic between two short rules. Figures are always italic.
- Dates are stamped in a small Jost postmark ("2026 · 08 · 19"). The reading-progress bar is a thin horizon line with the sun as its marker, and the page dims to dusk as the reader reaches the end.

**Product pages.** Each product's stamp becomes its establishing shot.

- The painting vignette from the stamp opens full width, with the real logo in a cream medallion centred over it.
- Below it comes one sentence of what the product does, then the figure set large as the denomination.
- Then a short "stops" timeline of releases as milestones, and a Day Pass ticket for the one action that matters (install, connect, or open the repo).
- Each product keeps its own pastel from the stamp sheet: MCP Emails flamingo, Fun Libs mustard, Toolrails powder, Harbor mint. The burgundy ink and the paper stay constant, so the family reads as one company.

**Rules that keep it calm:**

- Use one piece of ephemera per screen.
- Keep every frame centred.
- Use the paintings only for light and atmosphere, never as scenery with a caption.
- Let every number come from the facts.

## Assets and licences

See `assets/ASSETS.md` for the full inventory:

- The paintings are CC0 or public domain: Cross via NGA Open Access, and Monet via Wikimedia Commons.
- The fonts are under the SIL OFL.
- The mark, stamps and ephemera are original.
- The product logos belong to their products and are used unchanged.
