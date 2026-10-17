# 80 / Pavilion Light

> One horizon, one building, one day.

## Vision

Albretsen AS is shown as a small, perfectly made set: a cream Streamline pavilion with a stepped flamingo tower and a brass finial. It stands on a golden bluff above a pastel sea. Everything is built in three.js from primitives. The baked stills paint first, and the live scene fades in over them on capable screens.

The homepage is a single day. You arrive in clean morning light. As you scroll, or drag the sun along the horizon line, the sun crosses to noon, where it crowns the finial (the brand mark come true), and then on to sunset, where a second line appears: *Built by day. Running all night.* The products below are small kiosks on the same terrace. Each one is open at its own hour and carries its real logo on its sign. Harbor's shutter is down because it is paused. Retired products are house-number tiles under **Earlier hours**.

Why it fits: the site should make people feel awe at the craft without saying so. A whole lit, shadowed, time-aware miniature, delivered at 22 KB for the first image, is the proof. The calm (one building, one horizon, no clutter) reads as reasonable and effective. The ambition is in the details.

**Hidden: After Hours.** Click the sun three times, either the painted sun in the live scene or the sun on the horizon control, or press `N`. Night falls, the windows light up warm, and the stars slowly gather into the Albretsen mark. The copy turns cream and a single line appears: *After hours. The windows stay lit.* Press `N` again to bring the day back.

## Voice

Short, plain and unhurried. It says what exists and stops. There are no superlatives, no exclamation marks and no calls to action. Numbers come only from `_shared/content.js`. Place names, greetings in other languages and travel imagery are never used: the light is the atmosphere and the subject is software.

- Hero: "Quiet software that pays for itself."
- Products: "Four products, one terrace. Each one is built to run without supervision."
- Retired: "Seven retired products. Each one taught the next."
- Footer: "Takes one outside engagement at a time."

## Type

- **Antonio** 500–600, set in caps: headlines (tracking .03–.05em) and labels (tracking .24–.28em). It is a condensed poster face with deco proportions, used without costume.
- **Source Sans 3** 350–400 for body and lead text. It is humanist and quiet.
- **ui-monospace** appears only for the one command line.
- Both fonts are self-hosted under the SIL OFL. Antonio and the roman Source Sans 3 are preloaded, which is about 55 KB.

## Colour

The Paris materials are the interface: cream `#F3EBDD`, warm cream `#EADBC4`, zinc `#8E959B` and `#565C63`, ink `#2A2A2E`, **café red `#B5352B`** as the only accent (links, status dots, the sun), and brass `#B8924A` for hairlines. The Miami light (flamingo `#EFA6AE`, mint `#BFE3D3`, sky `#CFE3EE`) and the golden hills (ochre `#D9B36C`) appear only *in the light*, in the scene and the horizon gradient, and never as buttons. Dusk `#4E4F86` belongs to After Hours.

## Motion

- **Sun Scrub:** scroll and the horizon control both set `--t`, the time of day. The live scene and the crossfaded stills (or a CSS sky tint on portrait screens) follow it.
- **Horizon Rise:** a brass hairline draws, then the headline rises from behind it.
- **Awning Unroll:** on hover or focus, a scalloped valance drops over a product card and the card settles 2 px.
- **Heat Haze:** a thin SVG turbulence band shimmers on the baked morning horizon until the live scene takes over.
- **Sea Breeze:** the live camera drifts about 0.12 units on long, unsynchronised periods.
- The live feed line fades up by 5 px; the copy and email buttons roll their labels, a technique taken from Stripe Sessions' doubled button labels.
- Under `prefers-reduced-motion`, the hero is a single still screen, the control changes the time directly, nothing loops and nothing loads the 3D.

## Sound

Silent. If sound is ever added, it is opt-in and limited to a soft room tone that follows the time of day: a faint sea at morning, nothing at noon, a single warm chord when After Hours falls.

## Mark

`assets/identity/mark.svg` is a café-red sun with the stepped tower cut out of it and three sea lines below. It is the noon moment drawn flat. The lockup pairs it with ALBRETSEN AS in outlined Antonio, with AS in café red. A cream version is used at night.

## Performance

- First paint needs the HTML, CSS and JS (about 30 KB), two fonts (about 55 KB) and a responsive AVIF hero: 10, 22 or 56 KB depending on width, or 13 or 33 KB for portrait.
- Every image has width and height or a fixed aspect ratio, so layout shift is 0.
- The day stills load only once the visitor moves the sun.
- three.js (about 690 KB) loads after `load` plus idle, and only on landscape screens at least 900 px wide without reduced motion or Save-Data. It pauses when off-screen or when the tab is hidden.

## Extending to the blog

- **Index:** each post is a still from the day series. The post's date sets its time of day (for example, the hour it was published), so the archive reads as a quiet strip of light. The regraded 1938 poster studies (Lassen, the stone arch) serve as covers for essays that are not about a product.
- **Article:** the body is Source Sans 3 at 19/1.65 on cream, at most 64 characters per line. The headline is Antonio caps over a brass hairline using Horizon Rise. Pull quotes sit between two zinc rules. Code blocks are in ink on warm cream with a café-red `$` prompt. The `noon-crown` still is the default header.
- **End of an article:** a horizon divider with a setting sun, then the availability line.

## Extending to product pages

Each product has a page that opens at its own hour on the terrace: MCP Emails at 08:00, Fun Libs at 12:00, Toolrails at 15:00 and Harbor at 19:30. The hero is that product's kiosk rendered live with `createKiosk` and its real logo on the sign. Scrolling walks the camera to the kiosk window, where the product's own UI (or a screenshot) sits in the opening. Facts are set as a stat row: an Antonio numeral, a label in caps and a brass hairline. A paused product keeps its shutter down and shows a single line about its state. A retired product gets its house-number tile and the one-line reason, when Asgeir writes it.

## Assets used

The hero stills (morning, the day series, portrait and portrait-sunset), the live `pavilion.js`, the kiosk renders, the retired tiles, the identity, the plaster texture, the awning and horizon dividers, `motion.css` and `motion.js`, and `tokens.css`. All are listed with sources and licences in `assets/ASSETS.md`. Product logos are used unchanged from `designs/_shared/products/`. For Luma, which has real brand assets, the real monogram is used in a tile frame.
