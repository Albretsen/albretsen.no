# Halflight

**A title sequence that resolves into a page, printed in two inks and lit by the real sun over Oslo.**

## Vision

Albretsen AS is one person who builds and runs software that has to earn its keep. Halflight presents that like the opening of a film. It is patient, deliberate and lit with care, and it says only what is true. The page opens in darkness behind letterbox bars, and two credit cards play. A spark then ignites on the horizon of a NASA orbital photograph, and a field of halftone dots pulls focus from coarse to fine. The bars open from 2.39:1 to full frame and the name racks into focus.

After the intro, everything is printed as a two-ink duotone. The inks are not a theme toggle. They follow the actual solar altitude over Oslo (59.91 N), so at 23:00 the page is an ochre aurora on umber, and at noon it is peat ink on vellum. Two visitors in different hours see different sites.

The awe should come from craft rather than claims. The page has a raw WebGL halftone that runs live under the pointer, a real astronomical model, and timing borrowed from title designers.

## The hero: scrub the day

The signature interaction sits at the bottom of the hero. It is a dotted curve of the sun's altitude over Oslo today, where dot size grows with altitude and a glowing sun marks the current minute. Visitors drag the sun, or focus it and use the arrow keys, Home, End and Shift. The whole page then re-lights: the shader's inks tween continuously, the plate switches between aurora, sunrise and limb, and the page ground moves from umber to vellum. A "Back to now" button, or Esc, returns to real time. This keeps the time-of-day delight from being a passive detail. It becomes a thing you play with.

Above the curve, the live product feed plays as **subtitles**: one line at a time, with the product name in italic serif, a plain sentence and a mono latency. The MCP install line is set as a quiet command chip with a copy button that rolls to "Copied".

## Voice

Title-card brevity with the calm of a credits roll. Facts are stated once, plainly and set beautifully. The page uses no exclamation marks and no adjectives about the person.

- Logline: "Software that pays for itself. Apps, SaaS and agent infrastructure, written and shipped from 59° north."
- Section names are film vocabulary used lightly: *Reel 01*, *Now showing*, *The archive*, *End credits*. Statuses become *Showing now*, *In production* and *Intermission*.
- The page never says hire, connect or passionate. The footer states availability as a fact: "Takes one outside engagement at a time."

## Colour

Eight inks at OKLCH seed hue 84. Each phase prints with a paper colour and two dot inks (see `assets/js/timeofday.js`).

| Ink | Hex | Role |
|---|---|---|
| Umber | `#160d06` | Ground at night, dawn and dusk. Text in daylight |
| Peat | `#3c2514` | Deep ink in daylight |
| Clay | `#a75932` | Low dot ink and the daylight accent |
| Ember | `#de6f11` | Dawn accent and halation |
| Ochre | `#deac37` | The seed. Mark, kickers, rules |
| Spark | `#fad86f` | High dot ink, live dots, the sun |
| Vellum | `#f6eedd` | Daylight paper and text on dark |
| Moss | `#696d43` | Reserved for data and links on long pages |

## Type

- **Instrument Serif** for titles, names, figures and italic one-liners. It is set large and tight (-0.02em), and arrives through EXPOSURE: wide-tracked and blurred, then racked into focus.
- **Geist** for body copy and UI.
- **Geist Mono** for credits, kickers and timestamps, in uppercase tracked 0.2 to 0.3em.

## Motion

Reveals sharpen rather than fade. Five named signatures come from the kit, plus the page's own:

- **DEVELOP**: the 2.39:1 band opens from a slit while the print goes from over-exposed to settled.
- **EXPOSURE**: per-character focus pulls on titles.
- **GLINT**: a halftone glint follows the pointer over posters, plates and the email link.
- **LETTERBOX**: the intro bars move from closed to scope to open. They only ever open.
- **GATE WEAVE**: a sub-pixel drift and flicker on the hero still.
- **Poster tilt**: one-sheets tilt up to 7° toward the pointer, with a light sweep that tracks the tilt.
- **Specimen spin**: Haeckel diatoms can be dragged to spin. Angular velocity carries over with inertia and decays back to a slow idle rotation. Arrow keys, Space or Enter spin them for keyboard users.
- **Film strip**: Trouvelot plates drift sideways, driven by scroll through `animation-timeline: view()`.
- **Archive tabs**: Radix-style roving-tabindex tabs. Retired products are waning moons, and the panel cross-fades with a blur-in in the manner of Radix's data-state keyframes.
- **Magnetic** chips and buttons lean toward the pointer with a lift overshoot.

With `prefers-reduced-motion`, the page skips the intro and does not start the shader. The halftone still sits in its place, with no tilt, drift, spin or grain animation, and the scrubber still works, but instantly.

## Sound

Off until the visitor presses **Sound**. A soft three-voice drone then plays, tuned per phase: low A at night, warmer chords at dawn and dusk, and open G in daylight. A low-pass filter opens as the sun climbs, so scrubbing the day is audible. Grabbing the sun makes a single short 1.3 kHz glint.

## Mark

A solid ochre half-sun sits on the horizon over a tapering halftone reflection: the work that is done, and its print. In the nav it is a Lottie. The spark appears, the sun rises behind the horizon, the reflection prints dot by dot, and then it breathes, replaying on hover. The wordmark is outlined Instrument Serif with a small Geist Mono "AS", masked so it takes the current ink. Use the favicon and the 1200×630 OG image as they are in `assets/identity/`.

## Extending to the blog and product pages

- **Blog index.** Each post is a "reel" card. The image is a halftone of a Trouvelot plate or a NASA photograph, printed in the current phase's inks. The date is set as a mono timecode. The comet plate is reserved for writing.
- **Article pages.** Vellum by day and umber by night, as everywhere else. Body text is Geist at 18 to 19px on a 66ch measure. Headings use Instrument Serif with EXPOSURE, and pull quotes are italic serif with an ochre rule. Each article opens with a short LETTERBOX: the bars close to a hairline over the title, then open to the text. A small sun-path figure in the footer shows the light the article was read in.
- **Product pages.** Each one opens on its one-sheet poster, using the real logo untouched, at full height beside a credits block of facts from `content.js`. The product's Trouvelot plate becomes the halflight shader plate in the hero, so the dots resolve into meteors for MCP Emails, the eclipse for Toolrails and the comet for Harbor. Live products show their feed as subtitles. Retired products get a short page under their moon, with the year as a large serif figure.
- **Everywhere.** One grain overlay per page at most, one floating specimen or seal per section, and the time-of-day phase applied site-wide by the same inline script.

## Assets used

The asset kit is in `assets/` (see `assets/ASSETS.md` for every source and licence). It includes NASA ISS photographs (public domain), Lofoten aurora (CC0), Trouvelot plates from 1872 to 1881 and Haeckel diatoms from 1904 (public domain), film one-sheets built around the real product logos from `../_shared/products`, generated moons, seals, textures, the Lottie mark and the raw WebGL `halflight.js`. External code: lottie-web 5.12.2 (`lottie_light`) from cdnjs, loaded after the intro. Fonts come from Google Fonts.
