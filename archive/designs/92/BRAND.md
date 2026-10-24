# Enter World

*A Heure Bleue variation. The homepage opens on a sunset over a hillside town, and one button takes you into it.*

## Vision

Design 64 put the visitor on a terrace at blue hour with a sun they could drag. Enter World keeps that view and that feeling, and makes the town real. It is built from the shared Heure Bleue kit: the architecture, the townsfolk, the vehicles, the props and the four product landmarks. The sun sets while you watch, and the windows switch on one group at a time.

A single button, **Enter world**, starts a five-second camera flight. It leaves the terrace, swoops over the rooftops toward the coast road and settles in the driver's seat of a powder-blue 1960s spider, facing the sun. From there the site becomes a short game. You drive the coast road past four buildings, one per product. You stop in a lit bay, step out and walk up to the door, and the product's card opens beside you. The figures are on a screen by each door: MRR, installs, connectors, commits and the latest events.

**Why it fits Albretsen AS.** Asgeir builds software end to end and runs it. A page you can drive through shows that range better than a claim about it. The town is calm, precise and a little Wes Anderson. The game is short, explained step by step, and easy to leave. The facts are the same as on every other page, and readable without the 3D.

## Structure

1. **Hero: the sunset.** The first paint is a still rendered from the live scene at the same sun elevation (+1.2°): a 12–43 KB AVIF, or a portrait crop on phones. Once the page is idle the world loads, and the live canvas fades in over the still without a jump. The sun then sinks from +1.2° to −3.8° over about 45 seconds. The windows, the café's string lights and the lamps along the road come on as it goes. The sun can still be dragged. On the left are the name, one plain line (*I build and run apps, SaaS and infrastructure for AI agents.*) and the button. The bottom corners carry the sun's elevation and one line of the event feed.
2. **Enter world.** A Catmull-Rom flight over the town, about 5.4 s, ends at the driver's eye anchor of the hero car. The FOV opens from 36° to 64° on the way. The HUD fades in: *Back to the page (Esc)* on the left, the route strip in the middle (the four stops with the town marked; click a stop to fade-travel there), and the sun, camera and sound controls on the right.
3. **Driving.** WASD or the arrows drive, Space or S brakes and then reverses, and C switches between the driver's seat and a chase camera. On touch screens there is a thumb stick, a Brake button and an E button. The car is the kit's arcade model, held to the carriageway: it scrapes along a kerb rather than bouncing off it. Traffic follows the lanes, slows behind you and overtakes when you are parked. A cyclist, joggers, strollers, a waiter with a tray, a dog walker and couples at the sea wall fill the pavements. A tunnel at each end of the coast road closes the world.
4. **Stops.** Each product has a building, with a glowing bay painted on the road outside it and a faint column of light you can see from the hill. Inside the bay, *E Step out* appears. The door opens, the player steps out, and you walk in third person (Shift to run). Walking up to the door opens the product card: logo, status, figure, one line, facts, the latest events (labelled demo when the live feed is empty) and the link. When you arrive, every light in that building comes on, whatever the hour. On wide screens the lens shifts left while a card is open, so the building stays in view beside it.
5. **The lights, on demand.** *Lights* in the HUD (or L) sends a wave through the town: a dark ring runs outward from where you stand at about 40 m/s, about a second wide. Every window, sign, string of bulbs and street lamp inside it goes out, the lamplight around you drops, and the town relights behind it with a short stutter and a soft four-note chord. In daylight the same wave lights the town for a few seconds instead. It plays by itself once you have visited all four stops. H sounds the horn and flashes the headlamps.
6. **The page below.** The product cards, the retired list and the footer are plain HTML, so the page works without WebGL or JavaScript. The footer reads *Takes one outside engagement at a time.* and gives asgeir@albretsen.no, plus the MCP line to copy.

## Onboarding

Eight short steps show one at a time at the bottom of the screen, with real key caps. Each one waits for you to do the thing: drive, steer, brake, switch the camera, stop in a bay, step out, walk to the door, and go back to the car. *Skip tips* hides them. A returning visitor gets a single line of controls instead.

## Voice

The voice is calm and exact. Prompts are short imperatives, with no exclamation marks and no "awesome". The page never asks to be hired. Facts come from `_shared/content.js` and are never rounded up.

- *Slow down and stop in the lit bay outside MCP Emails.*
- *The tunnel is closed tonight. Turn around.*
- *Four stops on the coast road.*
- *Retired, lights off.*

## Colour

| Token | Hex | Role |
|---|---|---|
| Ink | `#232c57` | Text on plaster, card buttons |
| Night | `#151a3c` | Page background, HUD glass |
| Plaster | `#f4eadb` | Text on night, the coach, the card |
| Lamplight | `#ffd27a` | Figures, the route car, visited stops, the email |
| Pink | `#f2b5b8` | Fun Libs bay, afterglow |
| Mustard | `#d9a42b` | MCP Emails bay, loading meter, "being built" |
| Burgundy | `#6e1f33` | Figures on the card |
| Powder | `#a9c6e0` | Toolrails bay, the hero car |

The world uses the kit palette (STYLE.md), with one override: the asphalt is baked a greyer slate (`#55586c` for the kit's `#5b6080`), because under ACES and the blue sky light the original read as a blue carpet. It uses design 64's sky ramps, moved into a linear workflow with ACES tone mapping. Bloom is tuned so that only the sun, lit windows, lamps and signs glow.

## Type

**Federo** sets the name, headings, product names and the button. **Instrument Sans** sets the text, the HUD, the coach and the speedometer (Poiret One's zero reads as a circle at that size). **Poiret One** sets the large figures on the cards and screens. All three are self-hosted latin subsets under the SIL OFL.

## Motion

The principle is that the sun never stops setting. Lights switch rather than fade: a quick ramp, sometimes with a fluorescent stutter. Late at night a few windows go dark and others come on, so the town keeps living. When dusk reaches the road, the lamps come on in a wave that runs outward from where you are, and one warm light follows you so the street around the car or the player is lamplit rather than dark. On foot, the camera boom pulls in rather than passing through walls. The cameras ease with exponential damping, and the chase camera widens its FOV with speed. The driver's seat keeps about an 80° horizontal field on any screen shape, with the windscreen header just above the frame. When you step out, the camera swings behind you facing the stop's door, so the first press of W walks you up to it. With a card open on a phone, the camera frames the building's screen above the bottom sheet.

Under `prefers-reduced-motion`, the hero is a still blue-hour frame that only moves when you drag the sun. Entering the world is a cross-fade instead of a flight, and the camera does not sway or shake.

## Sound

Sound is off until the visitor turns it on, in the nav or the HUD. It is all Web Audio synthesis. There is an engine of two detuned saws and a sub through a lowpass, with three loose gears and the throttle opening the filter. Under it is a brown-noise sea hush that brightens with speed. A soft tick plays when a nearby light switches, a chord rides the lights wave, the horn is two square tones, and there is a door clunk, a kerb scrape, a bump, and a three-partial glass chime at each stop.

## Technology and performance

- three.js r170 is vendored (`vendor/`), with GLTFLoader, the meshopt decoder, SkeletonUtils and the bloom passes. There is no build step. The import map maps `three` and `three/addons/`.
- The world uses the shared library as it is: `createTown` (seed 7), `loadVehicle`, `ArcadeCar` and `Townsfolk`. Two in-town buildings are removed to make room for the Fun Libs and Toolrails landmarks. The coast road is extended out to two tunnel portals, a ground mesh adds a shelf and hills outside town, and a loose row of houses thins out along the coast.
- **Draw calls.** Static geometry is baked into vertex colours and merged by 60–100 m chunk. The props' palette atlas is sampled per vertex, so the whole town is a handful of draw calls and the shadow pass only draws nearby chunks. Window groups are bucketed by their switch threshold, which keeps them switching one by one in about 45 draws. Vehicle bodies and wheels are merged too. A driving frame goes from about 780 draw calls and 1.6 M triangles to about 300 and 1.2 M, shadows and bloom included.
- **Quality tiers.** High has 4× MSAA, 2048 shadows, headlight beams and DPR up to 1.6. Mid has 2× MSAA, 1024 shadows and DPR 1.25. Low (phones) has no post-processing, no shadows, fewer trees and people and DPR 1. If frames run slow, an adaptive step lowers the resolution.
- **Loading.** Fonts and the poster load first. The world (about 3 MB of meshopt glb plus 0.7 MB of three.js) loads on idle, or on the button, with a progress line under it. It does not load on Save-Data or 2G until asked.
- **Live data.** The page reads `https://albretsen.no/api/events?limit=12` every 30 s. When the feed is empty it falls back to `_shared/feed.js` and says *Demo data* in the hero and *Demo events (no live data yet)* on the screens and cards.
- **Headless states.** `?t=0..1` sets the sun (−7° to +15°). `?shot=poster|chase|cockpit|stop|walk|card|cine` with `&stop=0..3`, `&x=`, `&v=` and `&p=` reaches each state. `&rip=s` starts the lights wave s seconds ago, `?below` hides the hero to show the page under it, `?q=low|mid|high` forces a tier, `?touch=1` the touch controls, and `?cam=x,y,z,tx,ty,tz,fov` the hero camera.

## Extending

- **New product:** add a landmark (the kit's `lm_*` pattern: a facade, emissive groups and a 16:9 `screen` node), a stop in `js/layout.js` and a bay colour. The card, screen, route strip and coach pick it up from `content.js`.
- **Blog and product pages:** use the plaster-on-night type system from the page below the hero. A post's cover is a still from the world at a chosen hour, with the same poster pipeline (`?shot=poster&cam=...&t=...`).
