# Long Light

*Design 79 for Albretsen AS / albretsen.no*

## Vision

The site is one day, told in real light. It opens on a real photograph of a fjord a few minutes before sunrise. The photograph is not a backdrop: a small WebGL shader (Sunline, in `assets/interactive/`) relights it, so the sun rises out of the sea as you scroll and the cold blue turns gold. The name **Asgeir Albretsen** sits *behind* the far shore. Its layer is masked to the photo's own sky, so on arrival the name comes up from behind the land like the sun, and the photo's own clouds drift in front of the letters. A faint mirror of the name lies in the water, also masked, so it shows only where there is real sea.

The surprising detail is the **crescent moon in the photograph**. It is a button. Tap it, and the sun sinks, stars come out and village lights appear along the far shore, while the rest of the page turns to night in a circle that spreads from the moon. At night, the point on the horizon where the sun went down brings the morning back.

After the hero the day keeps going: the products stand in full daylight as glazed plaques on stucco walls, each at its own hour (07:40, 11:15, 15:30, 18:50). The footer is long light through palms (dusk palms at night), where the availability line and the email sit. A small clock in the header shows the hour of the page: 06:10 First light at the top, Noon by the products, 21:00 Blue hour at the bottom. At night it reads 23:30 Lamps on.

**Why it fits.** Asgeir wants people to feel the craft and the taste before they read a word. Here the craft is concrete: a real photo relit in real time, a text layer that knows where the horizon is, and zero layout shift. The taste is the restraint around it, with one idea per screen, generous space and nothing shouting. The warmth he loves (sunrise, coastal light, palms, sun on stucco, Wes Anderson symmetry) is the atmosphere and never the subject. Nothing names a place. It is still a software company's site.

## Voice

Warm, plain, unhurried. It states what exists and stops. Short sentences, few adjectives, no sales verbs. It never says "hire", "connect" or "passionate".

- Hero: "I build software *that pays for itself.*"
- Products: "Some things ship, some pause, some retire. These four are in daylight now."
- Footer: "Takes one outside engagement at a time."
- Small labels name the hour, not the section: "09:30 · The work", "18:20 · Long light".

## Type

- **Instrument Serif** (OFL) is a condensed, high-contrast display serif. Use it for the name, headlines, product names and the single figure on each product. Italic is reserved for the one emotional word ("*hour*", "*that pays for itself*").
- **Schibsted Grotesk** (OFL, variable) is for body, UI and labels. Labels are 12 px, uppercase, +0.2em, with tabular numerals for times.
- The system monospace is used only for the MCP command.

## Colour

Day: Sand `#F4EBDD`, Dune `#E3D2B6`, Ink `#1C1A17`, one accent per screen in Poppy `#E8622A`, Gold `#F3B252` for the sun. Sage `#8FA382`, Sky `#9CC3E2` and Fjord `#2F5D8A` come from the photographs and plaques. Night: Night `#0C1A2B`, Night 2 `#13263C`, Moon `#E9E4D6`, with Lamp `#F5B860` replacing poppy. Tokens live in `assets/motion.css`. The name is filled with a gradient from cream to the horizon's gold, so it looks lit from below by the sunrise.

## Motion

Motion follows daylight. Arrivals use ease-out-expo (`--ease-sun`) and state changes use ease-in-out (`--ease-tide`).
- **Sunrise on arrival:** the canvas fades in over the identical still, then the sun lifts over 2.6 s. The name rises from behind the land, and its reflection sinks into the water.
- **Daylong:** scroll drives the sun height in the hero, the 3 px sky ribbon at the top and the header clock.
- **Glitter:** on desktop, the sun's glitter path on the water follows the pointer, eased.
- **Sunset switch:** the moon (or the header toggle) sets the sun, then lights the shore. The page changes theme with a View Transitions circle from the point you touched.
- **Second sun:** on product walls, the pointer is a soft warm light (`soft-light` blend) moving across the plaster. The image eases in by 2.5 %, and the link underline draws out.
- **Copy:** the email and the MCP command copy with a button that says "Copied" and a small toast.
- Under `prefers-reduced-motion`, the hero is one screen, the sun stands still at mid-morning, nothing tweens and the theme changes instantly.

## Sound

Silent. If sound is added, it is opt-in from a visible control and limited to one low, soft tone when the sun clears the horizon.

## Mark

A serif A inside a sun. Its crossbar runs out as the horizon, gold above and fjord blue below (`assets/identity/mark.svg`). The wordmark sets "Albretsen" in Instrument Serif outlines with a tracked grotesk "AS". The site uses it as a CSS mask so it takes the current colour. The night mark is moonlit, and the mono mark stamps the footer.

## Extending it

- **Blog:** each post is an hour of the day. The cover is a still baked from Sunline (`first-light-sunrise`, `-morning`, `-night`) or one of the graded CC0 photos (marine layer for essays, blue ridge for notes), with the title set on that photo's horizon line. The article column is Sand with Ink in Schibsted Grotesk at 19/1.65, with headings in Instrument Serif and pull quotes in italic serif. The header clock shows reading progress as the time of day. Night mode applies to the whole site.
- **Product pages:** the product's wall photo is the hero (`products/scene.html?p=<id>&bare=1` can render it at any size or hour). The single figure from `content.js` is set huge in serif, and below it sit a quiet facts list, a changelog as a timeline of hours, and screenshots on the same stucco with the palm shadow drifting across (`.long-shadow`). Each product keeps its own logo and colour. The site only supplies the light.
- **Retired work** stays on sun-faded tiles: respectful, not hidden.
- **Social:** `assets/identity/og.jpg`, and per product the `-card.webp` scenes.

## Build notes

- `index.html`, `css/site.css`, `js/site.js`. The kit is in `assets/`, and `img/sky-mask.png` and `img/water-mask.png` are alpha masks derived from the kit's sky/water mask, used for the CSS masks on the name and its reflection.
- Hero geometry is pure CSS: with container query units the page computes the photo's `object-fit: cover` box and places the name on the horizon and the button on the moon before any JS runs. Layout shift is 0.
- The page loads about 260 KB first (fonts about 92 KB, hero AVIF about 70 KB). Sunline (12 KB) and its texture (128 KB WebP) load after `load`. Product and footer photos are lazy.
- Facts come from `../_shared/content.js`, and the live line comes from `../_shared/feed.js`.
- `?theme=day|night` forces a theme. `?frame=<px>` pins the hero height for full-page screenshots.
