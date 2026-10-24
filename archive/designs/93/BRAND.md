# Lamplighter

*Blue hour, and the street lamps are out. You carry the flame.*

A variation on design 64, Heure Bleue. 64 let the visitor drag the sun and watch the windows answer. Lamplighter keeps the sunset and the lights, and gives the visitor a job: walk the lanes of a hillside town and light its lamps before full dark. The town is built from the shared Heure Bleue 3D library (architecture kit, townsfolk, vehicles, props and the four product landmarks).

## The idea

The homepage is a two-minute game, and the game is the argument. Nobody is told that the work is careful. They see a town that loads fast, plays at 60 fps, controls well with keys, mouse or a thumb, and gets more beautiful the longer they stay. The products are not listed in the game. They are lit.

## How it plays

1. **First paint is a still.** A baked frame of the opening shot (a 48 KB WebP) paints at once under the name, one plain line and the pitch. The 3D town loads during idle time behind it. The first live frame matches the still, so the swap never jumps.
2. **The opening shot.** From the church on the summit, over zinc roofs and a pink hotel, to the sun touching the bay. *Light the lamps* flies the camera down to the lamplighter on the seafront.
3. **The clock is the sky.** The opening shot holds the sun 3.6° above the sea. During the flight down it sinks to the waterline, and play begins at sunset. From there it takes about two and a quarter minutes to reach full dark, 11° below the horizon, with blue hour arriving in the first minute so the lamps you light really carry the scene. The thin bar in the HUD is the sky itself, from gold to ink, with the sun riding it. Nothing punishes you. If night falls first, the town finishes the job and says how many lamps you lit by hand.
4. **Lighting a lamp.** Walk within reach and a flame leaves your lantern, arcs to the lamp head and catches: the mantle overshoots, flickers and settles, embers rise, a warm pool spreads on the ground and the nearest windows come on one by one. Light lamps quickly in a row and the chime climbs a scale.
5. **Districts.** Four terraces, four products. The seafront has the Fun Libs arcade, the lower lane has the MCP Emails post office, the Paris shelf has the Toolrails workshop and the summit has the Harbor library. When a district's last lamp is lit, its sign flickers on like neon, its screen shows the real figure (and the latest product event, live or labelled demo), the townsfolk wave, and a product card slides in.
6. **The hills.** Villas are scattered over the slopes around the town, and their windows switch on one by one as the sky darkens and as you light the lamps. Now and then one goes dark for a while and comes back.
7. **The finale.** The remaining lamps catch in a wave, the bell rings, every window in town comes on from the church downward, and the camera pulls out over the water. ALBRETSEN appears over the lit town with the contact line. After that the town keeps living: windows go off and on, one at a time.
8. **Skip.** *Skip to the lit town* (or Esc) goes straight to the finale for anyone who came for the facts.

## Controls

- **Keyboard:** WASD or the arrows to walk, Shift to hurry.
- **Mouse:** click anywhere in town (or on a lamp) to walk there; the route threads the stair flights. Drag to swing the camera a little.
- **Touch:** drag anywhere for a floating thumbstick, push it to the edge to hurry, tap a lamp to walk to it.
- An arrow at the screen edge points to the nearest unlit lamp, and diamonds float over the lamps of the district you are in.
- A dithered see-through cut keeps the lamplighter visible behind the houses of the terrace below, the way isometric games do.

## Voice

Calm, exact, a little warm. Plain facts, never rounded up, from `_shared/content.js`. No superlatives, no "hire me", nothing nautical.

- *Builds and runs apps, SaaS and infrastructure for AI agents.*
- *Small software, run properly.*
- *Retired, with the lights off.*
- *Takes one outside engagement at a time.*

## Colour

| Token | Hex | Role |
|---|---|---|
| Ink | `#232c57` | Text, night surfaces |
| Night | `#1b2148` | Dark theme background, HUD glass |
| Plaster | `#f4eadb` | Light background, text on night |
| Lamplight | `#ffd27a` | The flame: primary button, lamp count, figures in the HUD |
| Pink | `#f2b5b8` | Afterglow; accent in dark mode |
| Mustard | `#d9a42b` | "Being built" |
| Burgundy | `#6e1f33` | Accent in light mode |
| Cypress | `#3c5a50` | "Live" |

The 3D world uses the STYLE.md palette. The sky, sea, fog and light colours run on six keyframes by sun elevation (`js/sky.js`).

## Type

Federo for the wordmark and headings, Instrument Sans for everything you read, Poiret One for figures (the lamp count, $782, 113,000+). All three are self-hosted latin subsets under the SIL OFL, shared with design 64.

## Motion

The sky is the clock, and it only moves one way. Lights never just appear: each one overshoots, flickers and holds, like a gas mantle or a neon sign warming up. The camera follows with a soft lag and looks a little ahead of you. Cards slide in with a small spring. Under `prefers-reduced-motion` the town does not load until asked, camera flights become cuts, the focus pull after a district is skipped and particle bursts are smaller.

## Sound

Off until the visitor presses *Sound*. Everything is synthesised with Web Audio: brown-noise sea that darkens with the sky, a band-passed gas whoomp and a three-partial glass chime per lamp, a four-note chord per district, a bell at the finale, and crickets once it is properly dark.

## Mark

An arched window, the shape of design 64's terrace window, with a single flame inside and two sill lines. Beside it, ALBRETSEN in Federo capitals spaced at 0.3em.

## Technology

- three.js r170, vendored in `vendor/` with the few addons used (GLTFLoader, meshopt decoder, SkeletonUtils, EffectComposer, UnrealBloomPass, OutputPass). No build step.
- `js/game.js`: the town (shared `createTown` with seed 11, four rows, the café moved so it no longer blocks the first stair flight), lamps, landmarks, townsfolk, a delivery van on the coast road, input, camera, the see-through cut (an `onBeforeCompile` patch on every town material), bloom and adaptive quality.
- `js/walk.js`: walkable regions (lanes, seafront, stair flights with their slope, the summit plaza) minus footprints, wall sliding, and a route planner that threads the stairs for click and tap to move.
- `js/sky.js`: sky dome (bands, cirrus streaks, sun disc, stars), sea (ripples, sun path glints, the lit town shimmering near the shore) and the ramps.
- `js/fx.js`: embers and sparks in one Points cloud, light pools, halos, lamp markers.
- Four real point lights follow the lit lamps nearest you, and every other lamp uses its pool and halo, so the cost stays flat however many lamps are lit. Shadows follow the player and stop updating after sunset. When frames run slow, quality steps down from pixel ratio to bloom to shadows.
- Headless review states: `?shot=poster|play|lamp|district|mid|walk|final`, `&t=0..1` for the sky, `&ui=1` to keep the HUD, `&debug=1` for an error overlay.

## Content

Products, figures and lines come from `_shared/content.js`. Logos are the real ones from `_shared/products/`. The live feed is fetched from `https://albretsen.no/api/events`. When it is empty, the page uses `_shared/feed.js` and labels it *demo data* in the list, the hero line and on the landmark screens.
