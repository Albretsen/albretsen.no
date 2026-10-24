# Living Town

*A tilt-shift seaside town where everyone keeps a schedule, and their window lights up when they get home.*

Design 91, a variation on Heure Bleue (design 64).

## Vision

Heure Bleue was a view: a terrace above a town at blue hour, a sun you could drag, windows lighting one by one. Asgeir loved the sunset and the lights. Living Town keeps both and adds the people who switch the lights.

The homepage is a small town on the water seen like a model on a table, with a shallow, tilt-shift focus. Seventeen townspeople and a terrier live there on a timetable, Asgeir among them. Inès runs two laps at six. Marcel puts out the café chairs just before seven and serves until midnight. Henri waters the lemon trees, then takes the good bench with Odile. Lucie cycles to the bakery. At golden hour people drink rosé on the terrace, at sunset half the town leans on the railing, after dark Camille and Théo dance under the string lights. Then everyone goes home, and **when someone gets home after dark, their window lights up a second after they walk through the door**. When they go to bed, it goes out. The street lamps strike one after another along the promenade, west to east.

Left alone, the town follows the real clock in Oslo. Drag the sun across the day strip (or press a chip: Morning, Noon, Golden hour, Blue hour, Night) and every person works out where they should be at that hour and hurries there. Click anyone and they tell you what they are thinking. The camera pulls focus to them, like a lens racking onto a miniature.

Four shopfronts on the promenade are Asgeir's real products, built from the shared landmark kit with their real logos: the MCP Emails post office (open all night: agents never sleep), the Fun Libs arcade with its marquee, the Toolrails workshop, and the Harbor library, paused, with one reading lamp left on. Their screens show the real figures from `content.js` and the latest product events. Clicking a sign opens its card. A builder in a mustard jacket works in the workshop. The workshop is usually the last light on in town, and he walks home after midnight.

Asgeir lives here too, as one of the townspeople and not as a mascot: tousled hair, an ink overshirt over a white tee, sand chinos. He has coffee at Marcel's in the morning, checks the post office screen, works at his desk at the top of the tower house, has a word with Henri on the bench, looks in at the workshop window, walks the promenade, and leans on the railing at sunset with the builder and Inès. The tower's top window is his own: it lights a second after he gets home, whoever else is in.

**Why it fits Albretsen AS.** The page never says how good the work is. It shows a system with seventeen people on schedules, pathfinding, light states, a physically based sky, depth of field and live data, running at 60 fps with nothing announced. A visitor who stays a minute notices that the town is coherent. Things happen because someone had somewhere to be. That is the company's case: small software, run properly, by someone with taste.

## Structure of the homepage

1. **The town (hero).** A baked poster of the town at blue hour, rendered from the live scene, paints first (JPEG, 130 KB at 1280 px, 120 KB for phones). The 3D scene loads after first paint behind a thin lamplight progress line ("Waking the town") and fades in over the poster. Top left: *Asgeir Albretsen* in Federo and one plain line: *I build apps, SaaS and infrastructure for AI agents, at Albretsen AS in Norway.* Bottom centre: the clock panel, with the time, the phase of day, an Oslo-time / "Back to now" switch, the day strip with the sun on its arc, and five chips. Bottom left: the latest product event (labelled *demo* while the live feed is empty). Bottom right: look out to sea, zoom and reset.
2. **Products.** An HTML section that works without JavaScript or WebGL. It holds the four products as cards with status, one large figure, the one-liner, facts, where to find each one in town, and a "See it in town" button that scrolls up and flies the camera to the shopfront. The seven retired products are listed below in plain type.
3. **About the town.** One paragraph in plain words on how it works.
4. **Footer.** *Takes one outside engagement at a time.*, the address asgeir@albretsen.no, and the MCP line with a copy button.

## Interaction and game feel

- **Onboarding.** Three hints appear in sequence above the clock, and each one moves on when the visitor does the thing it describes: "Drag the sun to change the hour", then "Click anyone to hear what they are up to", then "The lit signs are real products. Click one." They are shown once per browser.
- **Camera.** Drag to orbit, right-drag or shift-drag to pan, pinch or ⌘/Ctrl-scroll to zoom. A plain scroll wheel still scrolls the page, and the first time someone tries it a hint explains the modifier. Motion is critically damped. When idle, the diorama turns very slowly. Double-click or Esc returns to the overview. On touch screens, vertical swipes scroll the page and horizontal drags orbit.
- **Focus pulls.** Clicking a person tweens the camera to them, follows them, and narrows the depth of field onto them. Clicking a shopfront frames it beside its card.
- **Look out to sea.** A labelled button puts the camera behind the people at the railing, facing the sunset. From mid-afternoon until blue hour it turns warm and reads *Watch the sunset*, because the overview faces the town and the sun sets behind the camera. At golden hour this is the money shot.
- **Orbit limits.** Hand-driven orbits stay on the sea side of the town once the camera is further than 18 m out, so nobody ends up inside the roofs or looking at the edge of the world. Zoom runs from 14 to 120 m.
- **Rescheduling.** While the clock is being dragged, people run instead of walk. The older couple speed up their formal walk instead. Very long trips are shortened so the town settles within seconds. A chip glides the clock forward, so the visitor watches the day pass.

## Voice

Everyone has a voice of their own (`js/dialog.js`). Inès counts things, Marcel is the host, Henri and Odile finish each other's crosswords, Léo asks questions, and Asgeir is understated and a little dry, with the odd Norwegian word. Lines follow the time of day and what the person is doing. Click someone and they say something, and if the right person is standing near, they answer. Zoom in close and now and then people talk on their own: one line at a time (two with a reply), spaced out, fading, never over the panels. Zoomed out, the town keeps to itself. About one line in eight mentions Asgeir or the products, warmly and only with facts from `content.js`. Nothing sad, nothing loud.

Calm and exact for the company: what runs, what it earns, what is retired. The townspeople carry the warmth and are allowed to be a little funny ("Baguette secured.", "Crossword. Seven down, 'dusk', four letters."). When the builder talks about the products, he uses only facts from `content.js`. Nobody says "hire me".

## Colour

| Token | Hex | Role |
|---|---|---|
| Night | `#141a3c` | Page background, products section |
| Ink | `#232c57` | Panels, buttons on paper |
| Blue hour | `#1b2450` | Hero background, theme colour |
| Plaster | `#f4eadb` | Text on dark |
| Paper | `#faf4ea` | Speech bubbles, product card |
| Lamplight | `#ffd27a` | Figures, lit windows, focus rings, the email |
| Pink | `#f2b5b8` | Eyebrows, afterglow |
| Mustard | `#d9a42b` | "Being built" status, the builder's jacket |
| Burgundy | `#6e1f33` | Figures and names on paper |
| Powder | `#a9c6e0` | Sea and cool fills |

The 3D palette is the shared Heure Bleue palette (STYLE.md). Sky, light and water all come from one set of keyframes keyed by sun elevation, from −18° to 40°.

## Type

- **Federo** for the name, headings, the clock and names in bubbles.
- **Instrument Sans** for body text, UI and the feed.
- **Poiret One** only for large figures (10,203 NOK, 113,000+), on the cards and on the shop screens.

All three are self-hosted latin subsets under the SIL OFL, copied from design 64.

## Motion

Everything moves because someone has somewhere to be. People walk at the speed their stride animation was measured at, so their feet do not slide, and they ease into a stop. Lamps strike like old sodium lamps: a blink, a second blink, then a warm-up. Windows come on with a short flick and then fade up. Parasols fold at night and open again after seven. With `prefers-reduced-motion`, the page shows the poster and an *Open the living town* button. If the visitor opens it, camera moves become cuts and there is no idle drift.

## Rendering

- three.js r170 (vendored, no build step). Town, people, vehicles and props come from the shared Heure Bleue library: `architecture/town.js` (seeded hillside, waterfront row rebuilt by hand), `people/people.js` (one skeleton, 33 clips), and the props and landmark kit.
- HDR scene → bloom (UnrealBloomPass at half resolution, stronger after dark) → one full-screen pass that does the **tilt-shift depth of field** (a 30-tap gather with front and back layers handled separately, so in-focus edges stay clean) plus ACES tone mapping, grade, vignette and grain.
- Sky and sea share one GLSL sky function: horizon glow toward the sun, the pink Belt of Venus and the blue earth shadow opposite it, stars and a moon. The sea reflects that sky and adds poster-style dashes of light, a sun path, and broken columns of lamplight under each street lamp.
- After dark the figures get a little light of their own, in their own colours, so they stay readable on the paving.
- Adaptive resolution keeps the frame rate up. Phones get a lighter mode: fewer terraces, smaller shadow maps, no MSAA and fewer blur taps.
- **Performance, without changing a pixel.** Bloom is added in a plain prep pass instead of being blended back into the 4x multisampled scene target. The same pass stores each pixel's lens blur and linear depth (float32), so the gather reads one texel per tap. Tap offsets are computed once. Each 16 × 16 tile keeps its largest blur, and the gather stops at the first tap that can only weigh 0, so in-focus parts of the town cost a few taps instead of thirty (the same frame with and without the stop gives identical bytes). Everything in the world that never moves casts its shadow through one baked mesh per culling side, built in idle time after the town is on screen; the remaining casters each have a depth material of their own, so three does not rebuild shader parameters as it goes. Static matrices are composed once, people hidden indoors do not animate until they come out, and the townsfolk download alongside the town. On a Mac at 1440 × 900 @2x this took the frame at noon from about 26 ms of GPU time to about 12, and the draw calls from 650 to 330.
- The canvas follows a resized window or a turned phone. The shop screens redraw only while the town is on screen.

## Data

Figures come from `_shared/content.js` and are never invented. When `https://albretsen.no/api/figures` has a newer figure, or one arrives over the event socket (`wss://albretsen.no/api/events/socket`, `{ type: 'figure' }`), the number rolls to its new value on the shop screen, the card and the product section, with a quiet *updated N min ago* (or *live*, just after a push). Large figures drop their decimals the way the Worker does, and the exact value (10,203.19 NOK) is in the tooltip. With no live store the build-time figure stands, with no freshness note. The ticker shows at most one new line every 6.5 seconds, and the first real event retires the demo feed. Product events come from `https://albretsen.no/api/events?limit=12`, polled every 30 seconds. While that list is empty, `_shared/feed.js` keeps the signs flickering, and every line it produces is labelled *demo*. Each event flares the matching shop sign.

## Sound

None. The lights switching on and off are the show.

## Mark

A small house in outline with one lit, arched window, beside ALBRETSEN in widely spaced Federo capitals. The favicon is the same house in plaster on blue-hour ink, with its window lit.

## URL parameters (for screenshots and review)

`?t=19.5` sets the hour and stops following Oslo time. `?cam=sunset|cafe|wide|mcp|funlibs|toolrails|harbor|person:<id>` picks a view. `?say=<id>` opens a person's bubble. `?shot=poster` hides the UI. `?intro=0` skips the opening move. `?lite` forces the light mode. `?no3d` shows the poster only. `?stats` puts draw calls in the feed line. `?perf` exposes the scene as `window.__T` for profiling. `?view=tx,ty,tz,yaw,pitch,dist` sets a free camera. `?chat` lets people talk on their own during a `?shot` review (off there by default, so screenshots stay still).
