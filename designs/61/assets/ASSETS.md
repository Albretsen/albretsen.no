# Direction 61: Sun Road

Asset kit for **Albretsen AS** (albretsen.no). Open `preview.html` to see every asset, the palette, the type specimen and the live pieces. It must be served over HTTP (for example `python3 -m http.server`) because the modules and the WebGL texture need it.

## Vision

The site is a single sunlit coast road, and scrolling it takes you through one day. The years since 2016 stand along the kerb as milestones. Each product travels as a postage stamp whose denomination is a real figure. The light runs from a pink-lilac dawn through a clean Miami-blue morning and a golden afternoon to a rose-and-indigo dusk.

The mood is **sun-drunk optimism with Wes Anderson rigour**: every frame is centred and symmetrical, the pastels are flat, the borders are doubled, and the humour is deadpan ("Day Pass, valid from first light to dusk"). The ephemera are punctuation, not wallpaper. Use at most one ticket, postmark or stamp group per screen, with lots of paper around it. The subject is always the software. The paintings supply atmosphere and light. They never supply place names: the copy names no towns, countries, monuments or postcard clichés.

**Why paintings:** the client's favourite earlier direction was built on real, beautifully graded imagery. Here the imagery is two public-domain Neo-Impressionist and Impressionist coast paintings. Their dotted brushwork already reads like a pastel print, and once graded into the palette they feel like a sunny morning, not a museum. `interactive/daylight.js` re-lights the hero painting live as the visitor moves through the day. That is the "awe" moment, and it costs no extra download.

### Signature moments for the builder
1. **Hero:** the cove painting full-bleed, with the cream title card at dead centre (double rule, mark, wordmark, one italic line). The WebGL `daylight.js` canvas sits on top of the `<img>` and fades in once ready. A dawn-to-dusk slider is optional, and scroll can drive it instead.
2. **Timeline:** use `interactive/coast-road.js`, or milestones (`extras/milestone.svg`) set along a dotted centre line. Each year is a stone, and the stones come in pairs on both kerbs.
3. **Products:** the stamp sheet. The four live stamps are large and use the Postmark motion; the retired stamps are small and cancelled.
4. **Contact:** `extras/postcard-back.svg` (the address side, with asgeir@albretsen.no), or the cliff postcard.
5. **Sound:** an opt-in "Sound" button (`interactive/ambient.js`), never autoplayed.

### Reference URLs (research)
- Slim Aarons' leisure photography, for the composition of sun, pastel architecture and blue water (slimaarons.com did not resolve during research, so this is the brief's reference only).
- https://stripesessions.com/ (stripe.com/sessions redirects there): editorial pacing and calm, generous type.
- https://www.awwwards.com/websites/sites_of_the_day/: surveyed. The salt `7bfecf` picked Milledollars (#15) and Santioni Spirits (#12), but their markup exposed no motion details.
- https://dev.to/_artclick/build-a-scroll-driven-day-to-night-animation-using-pure-css-1o3p: a sticky scene with sky keyframes and a sun arc driven by scroll. The basis of **Day Pass**.
- https://codelabs.developers.google.com/scroll-driven-animations: `animation-timeline` and `view()` techniques.
- https://css-tip.com/postage-stamp/ and https://css-tricks.com/?p=374194: perforation with a radial-gradient mask. Used in `src/stamp-studio.html`.
- https://dev.to/hexshift/how-to-generate-procedural-audio-textures-in-the-browser-no-samples-needed-332l and https://github.com/ichabodcole/NoiseGenJS: brown and pink noise, swell LFOs. The basis of `ambient.js`.
- Wes Anderson's film grammar (symmetry, whip pans, title cards, pastel production design): the source of the motion names. No stills were used.

## Palette

| Token | Hex | OKLCH | Use |
|---|---|---|---|
| paper | `#FBF3E6` | oklch(96.7% 0.019 80.1) | page ground (with `extras/paper-grain.webp`) |
| flamingo | `#F4C3C2` | oklch(86.0% 0.056 19.7) | primary pastel, cards, awning |
| rose | `#E8959A` | oklch(75.5% 0.100 15.8) | kerbs, stripes, focus accents |
| mustard | `#EBC46B` | oklch(83.6% 0.117 86.1) | pastel |
| sun | `#E0A93B` | oklch(76.7% 0.138 80.9) | the sun in the mark, focus rings |
| powder | `#A8CFE6` | oklch(83.4% 0.052 234.1) | pastel, sky |
| sea | `#8FBBD8` | oklch(77.1% 0.063 237.5) | airmail stripe, water |
| mint | `#BFDCCB` | oklch(86.8% 0.039 159.8) | pastel |
| lilac | `#D9CBE6` | oklch(86.2% 0.040 308.7) | dawn, retired |
| burgundy | `#6E2233` | oklch(37.5% 0.108 10.6) | headings, rules, ink, logo (9.8:1 on paper) |
| ink | `#45161F` | oklch(27.8% 0.073 11.5) | body text (13.7:1 on paper) |
| dusk | `#4A3A78` | oklch(39.7% 0.102 293.1) | evening only |

The four pastels (flamingo, mustard, powder, mint) carry the light. Burgundy is the only colour used for type. Never put body text on a pastel smaller than 17px.

## Typefaces

- **EB Garamond** (Georg Duffner, SIL OFL 1.1). Roman and italic variable fonts, latin subset, weights 400 to 800 (`fonts/EBGaramond-latin.woff2` and `fonts/EBGaramond-Italic-latin.woff2`). Display sizes run 60 to 150px at weight 500. Body is 17 to 19px with a line-height of 1.55. Use italics for asides and figures. The wordmark is EB Garamond 500 capitals tracked .16em, outlined to paths.
- **Jost** (Indestructible Type, SIL OFL 1.1). Weights 400 to 600 (`fonts/Jost-latin.woff2`). Use it only for tiny uppercase labels tracked .22 to .32em, in the Futura spirit of the title cards.
- Both fonts came from Google Fonts (fonts.gstatic.com) and are self-hosted. Preload the roman.

## Motion (motion.css + motion.js)

| Name | What | Research |
|---|---|---|
| **Day Pass** | Scroll sets `--day` (0 = dawn, 1 = dusk). Stacked graded copies cross-fade (`.daypass > img[data-at]`), the sun rides an arc, and the page dims slightly at dusk. `initMotion({ onDay })` forwards the value to daylight.js, coast-road.js and ambient.js. | Artclick scroll-driven day-to-night; Chrome scroll-driven animation codelab |
| **Postmark** | A stamp lands 6% large and slightly turned, overshoots a hair and settles in 0.62s. The ink then blooms from blurred to crisp over 0.9s. | rubber-stamp timing; css-tip perforation |
| **Whip pan** | A section arrives with a 38vw lateral snap and 14px blur, landing dead centre. Use it between sections only. | film grammar (whip pan) |
| **Centre dolly** | The hero pushes in 6% while two paper letterbox bars retract. 1.8s, once. | film grammar (symmetrical establishing shot) |
| **Tear-off** | On hover or focus, the ticket stub swings 4° on its hinge and slides 10px. | physical ticket |
| **Sun glint** | A band of light passes once across a serif headline. | sun on water |

Under `prefers-reduced-motion`, every motion becomes a 0.4s fade. The shader and the road stop their idle shimmer but still follow scroll.

## Interactive

- `interactive/daylight.js` (about 6 KB, raw WebGL1, no library). It regrades the hero image per frame (white balance, exposure, saturation, a sky-to-sea colour wash, a sun bloom on an arc, a shimmer on the water) and adds sun glints. It reuses `hero/calanque-morning-1600.avif`, which is already in cache, and returns `null` without WebGL. Demo: `interactive/daylight-demo.html?t=0.75`.
- `interactive/coast-road.js` (about 9 KB, Canvas 2D). A symmetrical one-point-perspective causeway runs toward the sun between pointillist headlands, with pink-and-paper kerbs, moving centre dashes and pairs of year milestones that approach as you scroll. Demo: `interactive/coast-road-demo.html?p=0.3`.
- `interactive/ambient.js` (about 4 KB, Web Audio). An opt-in soundscape synthesised live: sea (brown noise with a swell plus foam hiss), wind (pink noise through a wandering band-pass) and a distant bell in a town square (additive inharmonic partials through a generated reverb). `setTime(t)` rebalances the layers. It contains no audio files.

## Performance notes

- Hero LCP: `<picture>` with AVIF at 960, 1600 and 2560 (54, 154 and 427 KB), WebP fallbacks at 960 and 1600, a JPEG at 1600, and AVIF 4:5 portrait crops at 640 and 1000 for phones. Always set `width`/`height` (the cove is 1600×1026; the cliff is 1600×898).
- The first screen should be the hero image, about 155 KB at 1600, plus the fonts (about 118 KB for all three). Load the shader, the road and the sound after first paint.
- `hero/day/*` (the baked grades) is only for the CSS Day Pass. Lazy-load it, or skip it when WebGL is available.

## Inventory

| File | What | Intended use | Source / how made | Licence |
|---|---|---|---|---|
| identity/mark.svg | The A drawn as a road converging to the sun on the horizon | logo, nav | Hand-built SVG (Python generator) | Original, owned by Albretsen AS |
| identity/mark-mono.svg, mark-reverse.svg | currentColor and burgundy-tile versions | footers, dark tiles | same | Original |
| identity/wordmark.svg, wordmark-mono.svg | ALBRETSEN in EB Garamond 500 capitals, outlined | headers | fontTools glyph outlines from EB Garamond (OFL) | Original, font OFL |
| identity/lockup-centred.svg | Mark, wordmark and AS between rules | hero card, footer | same | Original |
| identity/lockup-horizontal.svg | Mark and wordmark on one line | nav bar | same | Original |
| identity/favicon.svg, favicon-32.png, favicon-180.png | Mark on a flamingo tile | favicon, apple-touch-icon | rsvg-convert | Original |
| identity/og-image.jpg | 1200×630 cove with the centred title card | Open Graph and social | `src/og.html` baked in headless Chrome | Original, painting CC0 |
| hero/calanque-morning-{960,1600,2560}.avif, -{960,1600}.webp, -1600.jpg | Cove with boathouse, graded to Miami-morning pastels | **primary hero** | Henri-Edmond Cross, *Calanque des Antibois* (1891–92), National Gallery of Art (object 61248) via https://commons.wikimedia.org/wiki/File:Henri_Edmond_Cross,_Calanque_des_Antibois,_1891-1892,_NGA_61248.jpg, graded with a Python and numpy pipeline (white balance, S-curve, soft-light sky/sea wash, sun bloom, vignette) | CC0 (NGA Open Access) |
| hero/calanque-morning-portrait-{640,1000}.* | 4:5 crop | mobile hero | same | CC0 |
| hero/cliff-golden-*.avif/webp/jpg (+ portrait) | Grassy cliff above a bright sea, golden-hour grade | second hero, about or contact | Claude Monet, *Cliff Walk at Pourville* (1882), Art Institute of Chicago, via https://commons.wikimedia.org/wiki/File:Claude_Monet_-_Cliff_Walk_at_Pourville_-_Google_Art_Project.jpg, graded the same way | Public domain |
| hero/day/calanque-{dawn,noon,golden,dusk}-1600.avif, -960.webp | The same cove in four lights | Day Pass cross-fade, no-WebGL fallback | same grading pipeline | CC0 |
| hero/day/cliff-{morning,dusk}-* | Cliff in morning and dusk light | section backgrounds | same | Public domain |
| products/stamp-{mcp-emails,fun-libs,toolrails,harbor}.webp | Perforated stamps: arched painting window, **real product logo** in a cream medallion, real figure as the denomination | product cards | `src/stamp-studio.html?id=…` baked transparent at DPR 2 | Original; logos belong to their products; paintings CC0/PD |
| products/stamp-{luma,polyglot-pilot,pinpoint,webvakt,joke-central,tryggere-hyring,early-apps}.webp | Small cancelled stamps for retired products. Luma uses its real logo; the rest use stand-in glyphs (Aå, pin, eye, Ha!, shield-check, %) | archive or "earlier roads" | same | Original |
| products/logos/* | Real logos copied unchanged from designs/_shared/products | reuse | copied | Product owners |
| products/vignettes/*.webp | Painting crops used inside the stamps | stamp re-bakes | crops of the hero sources plus Cross *Cap Nègre* (Met DT3257, CC0), Cross *Antibes* (PD), Monet *Villas at Bordighera* (PD), Monet *Garden at Sainte-Adresse* (Met DT48, CC0) via Wikimedia Commons | CC0 / PD |
| extras/postmark.svg | Round cancellation ("first light", 2016 · 2026) with wavy lines | stamp overlay, section ornament | hand-built SVG | Original |
| extras/day-ticket.svg | Pink "Day Pass" ticket with a perforated mustard stub | the one important link (tear-off) | hand-built SVG | Original |
| extras/milestone.svg | Roadside milestone with a year | timeline markers | hand-built SVG | Original |
| extras/sun.svg | Sun disc with halo rings | Day Pass sun | hand-built SVG | Original |
| extras/awning.svg | Scalloped pink and paper awning tile (96×44) | top of page or nav | hand-built SVG | Original |
| extras/airmail-border.svg | Pastel airmail stripe tile | section dividers | hand-built SVG | Original |
| extras/postcard-back.svg | Address side of a postcard with email, company and country | contact section | hand-built SVG | Original |
| extras/postcard-cliff.webp | Deckle-edged postcard of the cliff with the MCP Emails stamp and a postmark (transparent) | about or contact | `src/postcard.html` baked | Original, painting PD |
| extras/paper-grain.webp | 512px tileable warm paper | body background | numpy FFT noise plus fibres | Original |
| extras/grain-overlay.webp | 512px alpha grain for multiply over pastels | cards | same | Original |
| interactive/daylight.js + daylight-demo.html | WebGL day re-lighting of the hero | hero | hand-written | Original |
| interactive/coast-road.js + coast-road-demo.html | Canvas coast road timeline | timeline | hand-written | Original |
| interactive/ambient.js | Web Audio soundscape | opt-in sound | hand-written | Original |
| motion.css, motion.js | Six named motions | site-wide | hand-written | Original |
| fonts/*.woff2 | EB Garamond roman and italic, Jost | type | Google Fonts | SIL OFL 1.1 |
| src/*.html | Sources the stamps, OG image and postcard were baked from | re-bakes | hand-written | Original |

### Licence notes
- The National Gallery of Art and The Met release open-access images of public-domain works under CC0. The Monet and Cross paintings are more than 100 years old and are in the public domain worldwide; the Wikimedia Commons pages mark them as public domain.
- The Art Institute of Chicago IIIF endpoint was behind a bot challenge during research, so the same works were fetched from Wikimedia Commons.
- Unsplash's API refused unauthenticated requests, so no Unsplash photographs were used.
- No audio files were downloaded: all sound is synthesised.
