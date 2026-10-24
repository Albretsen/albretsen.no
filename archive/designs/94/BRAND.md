# Evening Post

*A one-minute flight at sunset. Deliver the letters, and the town lights up behind you.*

Variation 94 on design 64, Heure Bleue. It keeps what the client loves: the sunset, and lights turning on one by one. It turns the terrace view into something you can play.

## Vision

The homepage opens on the hillside town at golden hour. A paper plane circles over the bay. Asgeir's name and one plain line sit on the left, beside a single yellow button: *Fly the evening post*. One click and the camera swoops down behind the plane, and a short round begins.

- **The round.** It lasts about a minute (around 60 s on autopilot). A hand-laid route runs in from the bay, along three terraces, through a gap below the church, round the bell tower and back down to the sea. The height field lifts the route over every roof, so the plane always skims them and never clips through.
- **Letters.** Twelve houses face the route, each with a glowing envelope over a window. Pass close and the letter throws itself. It arcs into the window, sparks, chimes, and the house lights up floor by floor. The person waiting on the lane below turns and waves.
- **Rings of light.** Warm rings mark the line. Flying through one gives a short push and adds to the chain. The next ring is bright and the ones after it are dim, so the way ahead stays readable and never cluttered.
- **Products.** Four of the town's buildings are the product landmarks from the shared kit: the MCP Emails post office, the Toolrails workshop, the Fun Libs arcade and the Harbor library. Each one is a delivery stop. When the letter lands, an airmail card slides in with the real logo, the status and the real figure from `content.js`, and a stamp fills in the HUD.
- **The sun goes down as you fly.** Sun elevation follows your progress, from +4.6° to −1.2° by the last ring. Windows switch on across the town on their own thresholds. Any house and street lamp you fly past switches on behind you, and lamps flicker as they strike. Once it is properly dark the town lives: now and then a house drops to one lit floor, as if someone left the room, and switches back on a few seconds later, floor by floor.
- **The end.** The last ring is a big sun gate over the bay, flown straight into the sunset. The camera then lets the plane go, swings back to the town, now fully lit at night with every window smeared into the water, and a postcard lands (on phones it sits low and compact, so the lit town stays in view above it). The postcard is the score card and the contact card at once: a rank (First class, Second class, Postcard rate), letters, products, rings and score on the left; Asgeir Albretsen, Albretsen AS, the line, asgeir@albretsen.no and *Takes one outside engagement at a time.* on the right, under a stamp and a postmark with today's date.

It is a quiet nod to email: an evening post, with letters and stamps. MCP Emails stays one of four equal stops, not the theme.

## Game feel

- **Controls anyone can use.** On desktop the plane steers toward the mouse (with a dead zone, roll and bank). On touch, drag anywhere and a stick appears under the thumb. Arrow keys and WASD also work.
- **Assists.** Let go and the plane flies itself. The route assist turns from a gentle pull into an autopilot within about a second, and grows stronger if you drift far off the line. Dives are faster and climbs slower. Roofs bump the paper up with a flutter and a small shake rather than ending the run. Letters post themselves when you pass close.
- **Camera.** A damped chase camera that rolls a little into turns. FOV widens with speed and ring boosts. Under reduced motion there is no roll, no shake and no FOV kick.
- **Onboarding.** One line under the button says what to do. Two hints appear at take-off. An arrow at the screen edge points to the next delivery when it is off screen. *Skip to the end* (Esc) is always visible and jumps straight to the postcard. *Skip, show me the products* sits on the hero.

## Structure of the page

1. **Hero.** A baked poster (AVIF, 74 KB, with a portrait crop for phones) paints at once. It is rendered from the live scene, so the cross-fade to 3D does not jump. three.js and the world load after `load` and an idle callback, and a progress bar fills the Fly button. Nothing loads on Save-Data or 2G, and without WebGL the poster stays.
2. **Products** in plain HTML: *Four addresses on the round*. Each card has the real logo, status, figure, line, facts and where it stands in the town. Retired products are listed under *Returned to sender*. Everything comes from `content.js`, with a static copy in the HTML for no-JS visitors.
3. **Footer.** Night ink. *Takes one outside engagement at a time.*, the email in lamplight, and the MCP line for agents.

The live feed (`/api/events`) sits in the hero corner and on the product cards. While the real feed is empty, it falls back to `_shared/feed.js` and says *(demo data)*.

## Colour

| Token | Hex | Role |
|---|---|---|
| Ink | `#232c57` | Text, night, footer |
| Plaster | `#f4eadb` | Page ground |
| Lamplight | `#ffd27a` | The Fly button, lit windows, the email, HUD accents |
| Burgundy | `#6e1f33` | Figures, links, the rank |
| Aerogramme | `#8fb3e0` | The mark's paper plane. In the game the plane is folded from cream paper (`#f7f0e3`) with red and blue airmail dashes on its leading edges and darker keel folds, so it reads against the blue zinc roofs |
| Pink | `#f2b5b8` | Afterglow, the sun bar |
| Airmail red / blue | `#c8333f` / `#2d4f9e` | The chevron borders only: postcards, cards, the section edge |

The sky, sea and light use design 64's ramps, keyed by sun elevation and extended toward the night.

## Type

- **Federo** for the name, headings, spaced capitals and the HUD counter.
- **Instrument Sans** for text and UI.
- **Poiret One** for large figures only ($782, 113,000+), never below 40 px.

All three are self-hosted latin subsets under the SIL OFL.

## Motion

The principle: everything follows the sun. Light comes on in steps (window groups 1, 2, 3, then lamps with a strike flicker), never all at once. UI moves on one easing curve (`cubic-bezier(.2,.7,.1,1)`): cards slide in, the postcard settles from a slight tilt, and stamps pop when they are earned.

Under `prefers-reduced-motion` the hero renders one still frame and never animates by itself. The game runs only when asked, without camera roll, shake or FOV changes, and every UI transition is instant.

## Sound

Off until the visitor turns it on, and all of it synthesised with Web Audio. Air over paper is brown noise through a band-pass that opens with speed. Each letter rings a glass chime, and the chimes climb a pentatonic scale through the round. Rings give a soft shimmer, a product stop gives a rubber-stamp thud and four bells, a roof bump gives a small knock, and the sun gate plays a rising chord.

## Mark

A pale-blue paper plane with a dashed airmail edge crosses a blue-hour sky over a sun on the sea, in a rounded square. Beside it is ALBRETSEN in Federo capitals spaced at 0.32em. The plane, the stamp on its wing and the postcard all come from the same aerogramme idea.

## Technology

- three.js r170 (the vendored copy in `_shared/3d/architecture/vendor/`) through an import map. The addons it needs are vendored in `vendor/addons/`, pinned to 0.170.0. There is no build step.
- The world comes from the shared library: `createTown` (seed 7, unmerged, then four houses replaced by the product landmarks and everything else merged), lamps, landmarks and about 400 instanced cypresses, olives and palms from `props/` (planted on the town's hillside mesh, kept clear of the route), and townsfolk from `people/` (`Townsfolk.spawn`, `play`, `once('wave')`, `attach('phone')`).
- New in this design: the paper plane folded in code with a canvas airmail texture; a sky shader with a sun disc, horizon glow and twinkling stars; a sea shader with moving facets; a PMREM environment from the sky, refreshed as the sun moves; one shimmering reflection streak per building, lit by that building's windows; light trails, sparks and the envelope flights; UnrealBloom at half resolution; and a 1 m height field for roof-skimming and the camera.
- Performance: `NeutralToneMapping`, DPR capped at 1.5, shadows at 2048 (1024 on phones). An adaptive step lowers resolution and then turns bloom off if frames run long. Rendering pauses when the hero is out of view or the tab is hidden.
- Headless states for screenshots: `?shot=poster|play|card|end&t=<seconds>&ui=0`, plus `?q=low` and `?view=rest`.

## Extending

- **Blog.** Each post can be a delivery: its cover is a still from the town at the hour of the post, and the date sits in the postmark.
- **Product pages.** Each one opens with a camera fly-in to its landmark, with the live screen on the building showing that product's events.
- **New products.** A new product gets a new address: one more landmark on the round, one more stamp in the HUD.
