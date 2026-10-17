# Sodium Orbit (design 51)

## Vision

At night, seen from the International Space Station, cities become networks of sodium-orange light under a thin blue band of airglow. From up there they look like circuit boards. That is the brand: a technology company seen from orbit, with one warm light moving through the dark.

The homepage does not tell visitors that the work is well made. It hands them something well made. The hero is a small game on a real NASA photograph. The visitor flies a molten spark (pointer, touch, drag or arrow keys) through four cold lamps that sit on the curve of the Albretsen mark: Harbor, MCP Emails, Toolrails and Fun Libs. Each lamp strikes the way a real low-pressure sodium lamp does, with a neon-pink flash from the starter gas, a flicker and then a warm-up to orange. A label then appears with the product's real figure.

**The game is the introduction, literally.** The headline, "Asgeir Albretsen builds software that pays for itself.", starts unlit: cold glass in airglow blue. Each lamp you strike lights the next part of the sentence. The last part, "for itself.", lights in sodium. Once all four are lit, the sparks leave the lamps and draw the mark. Left alone, the game lights the first lamp to show what to do. For keyboard users the four lamps are also real buttons.

**The ground is live.** The product event feed (`_shared/feed.js`) appears twice. It runs as a quiet mono log in the corner, and each event flashes a real city in the photograph. The ground lights are the products being used.

## What is on the page

1. **Hero.** NASA ISS night photograph (`iss035e017619`, graded), the `ignite.js` particle game (canvas 2D, 4096-particle pool, additive blending), the sentence wired to the lamps, lamp buttons, the live feed shown both as ground flashes and as a log, and a lamp counter in the header.
2. **Products: "Four lamps on. A few burned out on the way."** These are Radix-style tabs with a roving tabindex and arrow, Home and End keys. A sodium indicator slides between tabs on a spring. The stage shows each product's lamp tile: the real logo, unaltered, on glass, orbited by sparks, over an ISS city. Switching tabs runs an **Orbit Wipe**, a circular reveal with a sodium ring on its edge. The tile tilts toward the pointer (additive WAAPI) and a filament spotlight follows it. The figure counts up while it cools from filament to sodium. Harbor is dimmed to airglow blue because it is paused. Below the tabs, an accordion ("Seven lamps that went out") opens with the Radix technique: it measures the content height into a CSS variable and animates between that and zero on a spring. Inside are the retired products as extinguished-lamp tiles, with Luma's real logo.
3. **Lamp map.** A ten-year timeline (2016 to 2026) generated from `content.js`. A baked spark-arc render crosses it on a scroll-driven timeline (`animation-timeline: view()`).
4. **Studio.** The day job and company facts beside the **sodium orb**. The orb is three.js r170, lazy-loaded: smoked glass with fingerprint smudges, reflecting a Poly Haven street-lamp HDRI, with 10,000 GPU sparks. You can drag it to turn it and press it to strike it. A poster image stands in until it loads. A New York ISS photograph pans behind it on scroll. The "Published on Google Play since 2016" sticker rotates.
5. **Footer.** "Takes one outside engagement at a time.", the email with a magnetic hover and a sodium underline, and the MCP command as a copy button over the coastal-network ISS photograph.

## Voice

Calm, exact and a little dry. Facts take the place of adjectives. Short sentences. Nothing asks for anything. The words "passionate", "hire me" and "let's connect" never appear.

- "Four lamps on. A few burned out on the way."
- "The figures are real and small on purpose."
- "One person, a day job, and a company that ships at night."

## Colour (OKLCH, seed hue 0°)

| Token | OKLCH | Hex | Role |
|---|---|---|---|
| void | 0.12 0.035 268 | #020513 | page |
| night | 0.18 0.055 264 | #051029 | surfaces |
| deep | 0.26 0.075 260 | #0c2348 | raised |
| airglow | 0.74 0.13 240 | #52b5f4 | unlit text, paused state |
| mist | 0.86 0.04 250 | #bed4eb | body |
| moon | 0.97 0.008 250 | #f1f6fa | headlines |
| sodium | 0.76 0.165 60 | #fb942a | the one accent: lit lamps, figures, focus |
| filament | 0.92 0.09 88 | #ffe196 | hottest point, active hints |
| neon (seed 0°) | 0.62 0.22 0 | #e63281 | only during a strike, and in particle tails |

Neon is never a resting colour. It is the moment of ignition.

## Type

- **Unbounded** 200–400 for display. It is wide and light, tracked -0.04em. The figures use the 200 weight.
- **Inter Tight** 400–600 for body text, 17px.
- **JetBrains Mono** 500 for labels and HUD text: 10–12px, uppercase, tracked 0.14em.

## Motion (Web Animations API)

The single principle: **strike, warm, rest.** Things arrive with a short neon flicker, warm through sodium and settle into their resting ink. The motion comes from `assets/motion.js`:

- Sodium Strike: headline segments, lamp labels, copied state.
- Filament Count: product figures.
- Orbit Wipe: product switch.
- Ember Lift: tilt on the product stage.
- Afterglow: images expose like long exposures.

Springs are sampled into CSS `linear()` easings. Scroll reveals use `animation-timeline: view()` where the browser supports it, and an IntersectionObserver with WAAPI elsewhere. With `prefers-reduced-motion`, the page renders the finished state: all lamps lit, the sentence fully lit, nothing moving, no feed flashes.

## Sound

Sound is off until the visitor turns it on with the header toggle. Every sound is synthesised with Web Audio, with no audio files. A lamp strike is a high-passed starter click, a band-passed sawtooth buzz that flickers, then a warm sine hum that fades. Completing the game plays a soft open fifth. Feed events and tab changes make a tiny falling tick. The easter egg sounds like a meteor shower of glints.

## Mark

The arc of a thrown spark forms an A, and the spark itself is the crossbar. The four lamps of the game sit on that arc, so finishing the game draws the mark in about 900 particles. The wordmark is monoline, and its A uses the same parabola.

## Easter egg

Type **2016** (or the Konami code) anywhere. A meteor shower crosses the hero, a fifth lamp appears ("Google Play, 2016"), every ground light flashes neon and the 2016 sticker spins. The footer hint "There is a fifth lamp." is the only clue. `#lit` and `#secret` in the URL open those states directly, so they can be shared.

## Extending the direction

**Blog.** Each post is a night pass. The header is a narrow band of one of the graded ISS photographs (earth-grid for engineering posts, coastal-network for business posts). The title is set in Unbounded 300 and arrives with Ignition Type. Body text is Inter Tight 18px on `night`, in a measure of 64ch. Code blocks sit on `void` with a sodium caret and a copy button that uses the same strike as the footer command. Pull quotes are lit lamps: moon text with a soft sodium glow. A post's reading progress is a spark travelling along the top edge, which leaves embers when you stop. Dates and reading time are mono labels.

**Product pages.** Each product is its own lamp. The hero is that product's lamp tile (`products/lamp-*-1600.webp`) at full bleed, using the product's own real logo and status colour: sodium when live, a neon flicker when building, airglow when paused. The figure is set big in Unbounded 200 with Filament Count. Facts become a strip of mono chips. The section rhythm repeats the homepage: photograph band, content on night, a scroll-driven particle divider (`spark-arc`). Retired products get an "extinguished" page: a cold tile, the reason it was stopped in Asgeir's own words, and what it taught.

**Rules that hold everywhere.** Use one accent, sodium. Neon only appears while something is igniting. Imagery is real (NASA public domain) or rendered from code; there are no stock people and no fake dashboards. There are no industrial, nautical or finance cues. Every number comes from `content.js`.

## Assets used

Everything is in `assets/`, and sources and licences are listed in `assets/ASSETS.md`. That includes NASA ISS photographs `iss035e017619`, `iss035e013107`, `iss035e008050` and `iss035e011709` (public domain), the Poly Haven "Street Lamp" HDRI (CC0), ambientCG Fingerprints006 (CC0), and the real product logos from `_shared/products`. Fonts are Unbounded, Inter Tight and JetBrains Mono (OFL, Google Fonts). three.js 0.170.0 (MIT) loads from jsDelivr only when the orb nears the viewport.

## Research for the build

- Radix accordion: animate the measured `--radix-accordion-content-height`. The retired accordion uses the same pattern with its own `--content-h`. https://www.radix-ui.com/primitives/docs/components/accordion
- Chrome, scroll-driven animations: `view()` with `animation-range: entry`. https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- Chrome, same-document view transitions: the card-to-detail morph pattern, here done with WAAPI so it works everywhere. https://developer.chrome.com/docs/web-platform/view-transitions/same-document
- rauno.me craft index: hold-to-confirm, flashlight tabs, blur reveal and X-ray ideas, which informed the spotlight stage and the sliding tab light. https://rauno.me/craft
- Josh W. Comeau's 3D button: a fast press with a slow springy return, used for the lamp buttons and magnetic links. https://www.joshwcomeau.com/animation/3d-button/
