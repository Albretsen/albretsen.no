# Honest Deck

**Every bet, face up.**

## Vision
Asgeir places a lot of bets and shows all of them. Each product is a glossy candy card, and the deck deals itself. Live products land face up with their real numbers ($782 MRR, 113,000+ installs). Retired ones are dealt as well and land stamped FOLDED. The two that pay sit in the same row as the seven that didn't.

That is the brand: someone effective enough to ship eleven things, sensible enough to stop the ones that don't work, and confident enough to leave them on the table. The look is retro-futurist airbrush: 80s chrome type, a hard horizon line, Sorayama-style chrome spheres, sprayed sunset gradients and fine grain everywhere. The palette is candy seeded at OKLCH hue 120 (apple green). The chrome sphere refers to NASA's Project Echo, a satellite that relayed signals by reflecting them. Nothing added, nothing hidden.

It is a technology brand. The scene is built from primitives in three.js, the hero is a scroll-scrubbed image sequence, and the site has keyboard shortcuts. None of it uses finance, industrial or nautical imagery.

## The homepage
1. **Hero: the deal.** The sticky canvas plays 64 pre-rendered frames (48 tall frames on phones, ending in a vertical cascade so every logo stays readable), driven by Motion's `scroll()`. The headline sits on the green floor and the status chips are dealt from the pile in the 3D scene. Three caption cards turn over as you scroll: *The deal*, *The numbers* and *For your agent* (the MCP command, with copy). A HUD says what it is: "Pre-rendered frames, not live." J and K step one frame at a time.
2. **The hand.** A NASA Project Echo photo on a tilted card, a parallax chrome orb, then four face-up product cards. They are baked renders of the real logos on candy cards, with springy tilt and a specular highlight that follows the pointer.
3. **The live table.** The same scene runs live in three.js (lazy-loaded, with a still poster first). Hover lifts a card, D deals, S shuffles and F folds. Next to it, *Table talk* streams live events from the products.
4. **The folded pile.** Seven retired products on a green felt with echo rings. You can drag and throw them (velocity-driven springs), and Tab plus Enter or arrow keys work too. Picking one up shows its line in the side card.
5. **Footer.** The Holmdel horn antenna (NASA), the availability line, the email as a candy keycap, and the "on Google Play since 2016" badge.

## Voice
Brutal honesty. Lead with numbers and keep it short. State losses plainly and never round up. No "passionate", no calls to hire.
- "Eleven products dealt so far: two pay, one is being built, one is paused, seven folded."
- "When a number is small, it stays small."
- "Pre-rendered frames, not live. The live deck is further down."

## Colour
| Token | Hex | Role |
|---|---|---|
| apple (seed, OKLCH 0.87 0.21 128) | #aced37 | floor, live chips, felt |
| apple-deep | #46ac2a | felt shadow |
| lemon | #f5f372 | horizon, highlights, `?` key |
| tangerine | #ffa75a | horizon, chrome bottom |
| bubblegum | #ff9fc6 | washes |
| hot pink | #fa4095 | figures, FOLDED |
| grape | #935edf | upper sky, chrome mid |
| lilac | #d6bef5 | light sections, paused |
| ice | #99e6f9 | building, chrome horizon |
| cream | #f5f9ea | card faces |
| night | #10081d | ink, hard shadows, page |

Rule: drop shadows are hard (night, no blur) and airbrush is soft. That contrast is the look.

## Type
- **Unbounded** 600–800 for display, card names, figures and the outlined wordmark. Tracking -0.03 to -0.05em.
- **Hanken Grotesk** 400–700 for body copy.
- **Martian Mono** 400–600 for anything that counts: frame numbers, timestamps, facts, keycaps.

## Motion
Things move like cards in a dealer's hands, all built on Motion (motion.dev, 12.23.28):
- **deal**: elements leave a deck point, flip face up mid-air (rotateY 180→0) and land on a spring (stiffness 170, damping 19). Used for the hero chips and the product cards.
- **scrub**: canvas image sequence. Frames load coarse to fine (every 8th frame first, then 4th, 2nd, 1st), the nearest loaded frame is shown, and the last 14% of the scroll holds on the dealt fan. In landscape the canvas fits the full frame width and extends the sky with the frame's own top row, so no card is cropped.
- **tilt**: spring tilt plus a specular highlight that follows the pointer (after Magic UI's Magic Card).
- **throw**: folded cards keep their release velocity and settle with a springy rotation.
- **echo ping**: two rings radiate from any keycap or button that fires.
- **turn over**: captions and feed items flip in on rotateX/rotateY springs.
Under `prefers-reduced-motion` the hero becomes the still final render, captions stack below it, the live deck starts dealt, and springs become instant.

## Sound
Off by default (header toggle or M). When on, a synthesised card snap (filtered noise burst, Web Audio, no files) plays on each deal, shuffle, shortcut and dropped card, riffled for multi-card moves.

## Mark
A house-of-cards A: two leaning cards and a third lying across them edge-on, airbrushed, with echo pips. The wordmark is ALBRETSEN in Unbounded 800 outlined to SVG with a chrome fill (lilac → white → ice | grape → hot → tangerine, with a hard stop at the horizon) and a hard night drop, plus AS in Martian Mono.

## Signature delight
Keyboard shortcuts with a visible cheat sheet. A lemon `?` keycap sits on every page and opens the "House rules" card. Each shortcut sends an echo ping from its keycap. Keys: D deal, S shuffle, F fold, J and K step the hero frames, G scatters the folded pile, M toggles sound, ? toggles the sheet, Esc closes it.

## Extending it
**Blog.** Each post is a card. The index is a fanned hand of post cards (title, date and one suit glyph per topic: signal for product notes, density for engineering, echo for retrospectives, A for money and company). An article page opens with the card flipping face up into a cream sheet with a thin airbrushed sky band on top, then body text in Hanken Grotesk at a 68ch measure. Figures in an article use the hot-pink Unbounded numeral treatment. Header images are NASA or Wikimedia public-domain photos run through the same candy gradient map (like the Echo and Holmdel images).

**Product pages.** Each product gets its own card mood: the accent is the card's edge colour and the real logo is never recoloured. The top of a product page is a pre-rendered still of that card from the deck rig (`assets/src/render.html?shot=card&i=N`) above the one number that matters, then facts as mono chips, then a changelog laid out as a stack of small cards. Retired products get a page too: a FOLDED stamp, what it was, what it taught, in Asgeir's own words, and no apology.

## Assets and credits
- Kit: `assets/` (see `assets/ASSETS.md`), all own work except:
- Project Echo balloon photo and Holmdel horn antenna: NASA, public domain, via Wikimedia Commons.
- Product logos are the products' own, from `designs/_shared/products`.
- three.js 0.170.0 (MIT) and Motion 12.23.28 (MIT) are loaded from jsDelivr. Fonts are from Google Fonts (OFL).
