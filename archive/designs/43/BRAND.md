# The Albretsen Dawn

*A morning paper from the future, printed by a press that only knows triangles.*

## Vision
albretsen.no is the front page of a newspaper from about 2036. The paper is pale, airy and printed in low-poly pastel. The newspaper supplies the structure: a nameplate, a dateline, double rules, a lead story, a rail, ears, a stamp and a "Late edition" sticker. Everything inside that frame is plainly software. The lead plate prints itself live, the brand mark stands up out of the photograph as a 3D crystal you can turn, and the rail carries a live wire of product events. The visitor should feel they are holding something precise and calm, made by someone very good who does not need to say so.

It is a technology brand. There are no charts used as decoration, no navy-and-gold and no columns of money. The only metaphors are dawn, orbit and spark: sunrises, planets, satellites, paper planes (for email) and crystals.

## The homepage (index.html)
- **Topline:** local time, an opt-in sound switch, a Dusk switch, and the `?` keycap ("Press ? for the shortcuts").
- **Nameplate:** the kit's outlined masthead, inlined at runtime so the Dusk edition can re-ink it. Two low-poly ears sit beside it: a sunrise that bobs gently and a satellite that turns slowly.
- **Lead story with three editions (J/K):** the kicker, a factual headline, a deck in a ruled side column, and a plate.
  1. A generative dawn printed live by `dawn-press.js`, with the crystal A from `orbit.js` (three.js, loaded lazily) breaking out of the top of the frame.
  2. A CC0 mountain photo re-printed in facets by the same press. `P` prints another impression.
  3. A NASA orbital sunrise in lagoon ink, with the low-poly planet and its satellites, one of which is a paper plane.
  The editions turn with the kit's `edition-turn` View Transition: the headline and the plate morph, and the new page is uncovered by a diagonal facet. A Radix-style toggle group with a sliding thumb switches the object between the crystal and the planet. The pointer is passed through the 3D layer, so the printed facets still catch the light underneath it.
- **Rail:** *The wire* (`_shared/feed.js`, each event tagged with its product's real icon; new items arrive with a spark-yellow flash), *Classified* (the `claude mcp add` line, copied by click or `M`), and *Conditions* (the turning planet sticker and the dates).
- **Fact strip:** four figures from `content.js`, each beside a low-poly ear.
- **Products (Section B):** a band using the NASA Earth-limb plate, then MCP Emails as the lead story with Fun Libs, Toolrails and Harbor in columns below. Each one shows its 3D slab render, which carries the real logo, unaltered, plus the real logo again in the byline. The art uses `facet-sheen` (tilt and a triangular glare). Then *From the archive*: the retired products as transparent low-poly specimens, each with a Radix-style hover card (transform-origin aware, side aware, with open and closed states).
- **Footer:** a lagoon print of the peaks with the floating crystal sticker, the wordmark, "Takes one outside engagement at a time." and the email.

## Voice
Quiet confidence. Headlines are facts, never adjectives. Sentences are short, there is lots of air, and every number comes from `content.js`. No exclamation marks. Never "hire me", "let's connect" or "passionate".
- "Asgeir Albretsen builds software that pays for itself."
- "A word game built at 17 now has 113,000+ installs."
- "Give your agent this paper. One line."

## Colour (OKLCH, seed hue 204)
paper `#f6fbfc` · mist `#e2f4f6` · sky `#b5e5ea` · lagoon `#6ab9c7` · deep `#32728a` (links, kickers, muted text; AA on paper) · ink `#182933` · dawn `#fbd1b6` · blush `#f6cbd0` · lilac `#d0cded` · spark `#f8e18a` (feedback flashes) · gold `#efc65a` (the four-point spark only).

**Dusk edition** (`T`): bg oklch(0.22 0.03 236), text oklch(0.95 0.015 204), muted oklch(0.8 0.06 204). It arrives through a View Transition as a circle opening from the sun's corner. The choice is remembered per visitor.

## Type
Instrument Serif for headlines, the nameplate, figures and decks. Its italic, in deep, carries the second half of a headline. Geist (300 to 700) for body and UI. Kickers are 500 weight, 11px, uppercase and tracked 0.2em. Geist Mono for keys, commands, timestamps and seeds.

## Motion
Things print, not pop. Distances are short, easing is expo-out, and nothing bounces.
- **press-run**: headline words rise out of a soft blur.
- **facet-sheen**: product art tilts toward the pointer while a triangular band of dawn light crosses it.
- **edition-turn**: View Transitions for J/K. The headline and the plate are shared elements.
- **dawn-break**: the products band is uncovered by a rising sun, driven by scroll.
- **sheet-unfold**: the `?` keycap morphs into the shortcut index through a shared `view-transition-name`.
- **stamp-orbit**: the edition stamp turns once a minute.
- **Micro-interactions**: magnetic buttons, the sliding toggle thumb, the wire flash, a gold underline that draws in under the email, a planet that drifts on scroll (`animation-timeline: scroll()`), and a gold spark trail behind fine pointers.
- **Reduced motion**: the press prints instantly, the 3D object renders one still frame, and the stickers, wire and transitions stay still.

## Sound
Off by default. When the visitor turns it on, the page plays a synthesised paper tick: band-passed noise of about 60 ms, pitched per action (edition turn, copy, theme change, jump). There are no audio files and no ambient loop.

## Mark
A faceted A built from eleven triangles, lit from the upper right. The crossbar holds a warm triangle, the sun rising inside the letter, and a gold four-point spark sits off the apex. It comes as `mark.svg`, `mark-light.svg` and `mark-mono.svg`, the wordmark, and the nameplate "The Albretsen Dawn". In 3D it becomes the crystal (`crystal.glb`, `orbit.js`).

## Signature delight: keyboard
`?` opens an index styled like a newspaper's, with dotted leaders and keycaps, and the row of the key that fired flashes spark yellow. J/K turn editions, P reprints, T switches Dawn and Dusk, 1 to 4 jump to a product, E copies the email, M copies the MCP command, and G H goes back to the front page. Keys are ignored while the visitor is typing. Deep links: `?ed=2`, `?theme=dusk`, `#shortcuts`.

## Extending to the blog and product pages
- **Blog = the paper's inside pages.** Each post is an article with a kicker (date and section), a headline set as a fact, a deck, and a lead plate. The plate is either a lagoon-ink print (NASA or CC0 photography run through `plates.py`) or a `dawn-press` impression seeded from the slug, so every post gets its own stable low-poly cover. Body text is Geist at 18px with 68ch columns, pull quotes in Instrument Serif italic, and footnotes styled as "corrections". The index page is a contents page with dotted leaders, like the shortcut sheet. Moving from the front page to a post uses the cross-document `@view-transition`: the post's headline and plate morph out of the card.
- **Product pages = special sections.** Each product gets its own section nameplate ("The Albretsen Dawn · MCP Emails") and its 3D slab scene as the lead plate. The real logo stays unaltered on the slab and in the byline. A fact box holds the figures from `content.js`, and the wire is filtered to that product. Retired products get a short archive page with their specimen and the one-line reason Asgeir writes.
- **Reuse rules:** one light rig (`lowpoly-kit.js`) for any new 3D, gold for the spark only, every number from `content.js`, and Dusk available everywhere through `T`.

## Asset credits
NASA ISS073-E-1068530 and ISS072-E-838362 (public domain; not an endorsement). Mountain photo by Nathan Anderson via Wikimedia Commons / Unsplash (CC0). The paper grain is ambientCG Paper003 (CC0). The Poly Haven "Bell Park Dawn" HDRI (CC0) was used for the bakes. Everything else is original work from the 43 asset kit. The product logos belong to their products and are used as shipped.
