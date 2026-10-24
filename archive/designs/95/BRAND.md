# Town through time

*A hillside town that builds itself from 2016 to today, one product building at a time.*

Design 95 is a variation on design 64, Heure Bleue. It keeps the terrace town, the sunset and blue hour, and the lights that switch on one by one. It adds a second control, the years, and turns the hero into a small city-builder time-lapse made from the shared Heure Bleue 3D library.

## The idea

A company's history is usually a list. Here it is a place. Every product Asgeir has shipped is a building in a seeded hillside town, and it rises in the year the product started:

| Year | What rises |
|---|---|
| 2016 | The empty terraces, the church and the café. On Google Play since 2016. |
| 2019 | Fun Libs, a games arcade with its marquee on the roof. |
| 2021 | The early apps: three small houses at the edge of town, one each for IAGO HMS, Rentekalkulator and Prosentkalkulator. |
| 2023 | Tryggere Hyring. |
| 2024 | WebVakt (a house with a lookout tower) and Daily Jokes / Joke Central (a tiled villa on the upper terrace). |
| 2025 | Polyglot Pilot (the corner rotunda) and PinPoint (a tower house with a view in every direction). |
| 2026 | Albretsen AS is founded and the town gate over the coast road goes up. MCP Emails (a post office), Toolrails (a workshop), Harbor (a library and archive) and Luma. |
| Today | Products take their real status. Live ones glow and show their figures on their screens, Toolrails is lit as a building site, Harbor is paused with only its sign on, and the seven retired products close their shutters and go dark, but stay standing. |

Ordinary houses, trees, traffic and townsfolk fill in around the products year by year. They are scenery, so the page never shows a count for them. The retirement dates are not in the facts, so the shutters close at the final stop, "Today", rather than in an invented year.

The figures (`$782 MRR`, `113,000+ installs`, `4 connectors`, `549 commits`) come from `_shared/content.js` and appear only at "Today". In earlier years a screen shows the year the product opened, so no current number is ever shown as a past one.

## The two controls

**The sun** runs from 16:00 to 02:00 on a dial. The sky, sea, light, fog and bloom follow the sun's elevation using design 64's poster ramps, extended down to deep night. Windows switch on in three steps per building as dusk falls, each building at its own threshold. Street lamps flicker on. After about 22:30 the houses go to bed one by one, the streets empty, and by two in the morning only the live products, the lamps and a few night owls are still lit. That is the signature: the lights switching on and then off again, and what still runs at 2 am.

**The years** run on a timeline with a dot for each product at its year. Drag it, step it with the arrow keys, or press play. During playback every year is a quick evening, so the lights come and go as the town grows.

Clicking a product, or its floating pin, flies the camera to it and opens its story card. Clicking any other house flicks its lights.

## Game feel

- **Construction.** A building first appears as a glowing blueprint whose scaffold edges rise to its height. It then springs out of the ground with an overshoot and a squash, a ring of dust puffs out at its footprint, and with sound on a wooden thunk and a pentatonic pluck play. Scrubbing backwards reverses all of it, so the timeline is fully reversible.
- **Shutters.** Retired buildings close weathered brown louvres over their windows, wiping from the top floor down. This is a world-space shader on the buildings' own window materials, so the kit pieces are not altered.
- **Lights.** Windows switch quickly rather than fading slowly. Lamps flicker when they come on. Light pools spread on the pavement below each lamp, and the lit town is reflected as broken warm streaks on the bay.
- **Camera.** The orbit is damped and limited. Pinch or ctrl+scroll zooms, double-click dives in, and the home button returns to the whole bay. During the opening time-lapse the camera cranes back slowly as the town fills the hillside.
- **Onboarding.** The page opens on the finished town, a poster image baked from the live scene, so the switch from still to live does not jump. When the scene is live it rewinds to 2016 and plays forward to today in about 17 seconds. You can skip it, and touching anything ends it. Three short coach marks then point at the years, the sun and the buildings, once per visitor.
- **Live events.** The page reads `https://albretsen.no/api/events`. While that returns nothing, it uses the shared demo feed and labels each line *demo*. Each event sends a ring of light up from the product's building and writes a line on its screen.

## Voice

Plain and exact, like a town ledger. The ledger in the corner names the year and what opened, then stops. There are no superlatives and no calls to action. The page never says "hire me". The contact line is the availability fact.

- *Opened: WebVakt, Daily Jokes / Joke Central*
- *Live: MCP Emails, Fun Libs. Being built: Toolrails. Paused: Harbor. 7 retired, shutters closed.*
- *No new products this year. The town fills in.*

## Colour

| Token | Hex | Role |
|---|---|---|
| Ink | `#232c57` | Text, panels, night |
| Plaster | `#f4eadb` | Light surfaces, cards |
| Lamplight | `#ffd27a` | Lit windows, the year, focus |
| Pink | `#f2b5b8` | Afterglow, timeline start |
| Mustard | `#d9a42b` | "Being built" |
| Burgundy | `#6e1f33` | Figures on light surfaces |
| Powder | `#a9c6e0` | "Paused" |
| Shutter brown | `#8a5a3c` | Closed shutters (reads apart from the teal window glass) |
| Live green | `#7fd6a8` | "Live" status dot only |

The 3D palette is the library's STYLE.md palette, untouched.

## Type

Federo for names and headings. Instrument Sans for text and UI. Poiret One for the year and large figures only. All three are self-hosted latin subsets under the SIL OFL.

## Engineering

- **three.js r170**, vendored with only the addons used: GLTFLoader, meshopt, SkeletonUtils, EffectComposer, bloom and output. There is no build step, and an import map resolves `three` for the shared library modules.
- **Assets** come from `_shared/3d`. `createTown({ seed: 7 })` lays out the hillside. Its buildings are lifted out and given years, and eleven of them are re-cast as products: the four landmark GLBs replace their slots, and kit buildings carry a canvas plaque. People come from `people.js`, the cars from `vehicles.js` with `PathFollower`, and the trees, lamps and planters from `props`.
- **Draw calls.** Each building is baked into a single vertex-coloured mesh, with palette-atlas colours sampled per vertex. Only its switchable lights, sign and screen stay separate. The whole landscape bakes to one mesh, and the trees are instanced and grow by instance matrix. The full town at night is about 170 draw calls and 400k triangles, with shadows and bloom.
- **Bloom safety.** A clamp pass zeroes NaN and Inf pixels from degenerate flat-shaded triangles before bloom, so a bad pixel cannot spread into a white bloom.
- **Adaptive quality.** Phones and coarse pointers start on a lower tier: a lower pixel ratio, 1024 px shadows, no MSAA and 14 townsfolk instead of 24. On desktop, if the first seconds run slow, the page steps down once or twice. Rendering pauses when the hero is off screen or the tab is hidden.
- **First paint.** The HTML text and a 125 to 190 KB JPEG poster (wide and tall) paint first. three.js loads only after the browser is idle. A thin progress line names the stage: *Laying foundations*, *Raising the town*, *Switching on the lights*.
- **Without WebGL or JavaScript**, the poster, the name, the line and the full product list in HTML remain.
- **Reduced motion.** There is no time-lapse and no camera drift. Transitions are instant and people stand still. The controls still work.
- **Screenshots.** The page takes URL parameters: `?year=2021&mid` (mid-year, blueprints visible), `?hour=25.5`, `?card=fun-libs`, `?focus=polyglot-pilot`, `?cam=x,y,z,yaw,pitch,dist`, `?shot` (snap all transitions), `?poster` (bare scene, used to bake the poster), `?nointro`, `?nocoach`, `?people=0`, `?quality=low`, `?debug`.

## Accessibility

Both controls are ARIA sliders that work from the keyboard: the arrow keys, Page Up and Page Down, Home and End, plus `[` and `]` for the sun and Space to play. The product pins are real buttons. The story card is focusable and closes with Esc. The ledger is a polite live region. Below the town, the products are listed in plain HTML with "Show in town" links back into the sim.

## Mark

The Heure Bleue terrace window sits beside ALBRETSEN AS in spaced Federo capitals. In the town, the gate over the coast road is lettered ALBRETSEN and rises in 2026, the year the company was founded.

## Polish pass notes

- Opening a story card frames the building: the camera tries several angles and keeps the one with the clearest line of sight to the facade, so buildings on the back terraces are no longer hidden behind the front row. The building keeps a soft warm wash while its card is open.
- Pins for running products carry their figure (installs, MRR, connectors, commits); retired pins are smaller and drop the year until hovered. Other pins fade while a card is open.
- Closed shutters are brown, so retired buildings read as closed even in daylight.
