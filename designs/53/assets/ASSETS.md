# Halflight: asset kit 53 for Albretsen AS

Open `preview.html` first. It plays the intro, shows every asset, and lets you switch the time of day (Now, Dawn, Day, Dusk, Night). Add `?static` to skip the intro, `?phase=dusk` to force a phase, and `?only=products` to show one section.

## Vision

**A title sequence that resolves into a page, printed in two inks and lit by the real sun over Oslo.**

The site opens in darkness. One spark appears on the horizon of an orbital sunrise. A coarse field of halftone dots then sharpens to fine detail, revealing a photograph outward from the spark. Letterbox bars part to CinemaScope and then open to full frame, and the name comes into focus. Everything after that is printed as a two-ink duotone on umber, or on vellum in daylight. The inks follow the actual solar altitude over Oslo, so a visitor at 08:10 in October sees a different site from one at 23:00.

- **Spark.** One point of light starts everything: the intro, the mark, and the hover glint.
- **Gravity.** Dots lean toward the pointer. Images arrive with weight and settle.
- **Clarity.** Detail goes from coarse to fine. Every reveal sharpens the image rather than fading it in.
- **Personality.** Cinematic ambition with good manners. Patient like an observatory, timed like film titles. The brand is never industrial and never financial.

Mood: a 35mm print viewed against a lightbox, Trouvelot's pastel astronomy plates, NASA photographs taken through a window of the ISS cupola, and dusk at 59° north.

### References

| Reference | What we took |
|---|---|
| https://www.igloo.inc | A preloader that becomes the scene, with dark ground and slow light |
| https://www.siteinspire.com (Fume, https://fume-studio.com) | Warm earth neutrals and calm editorial spacing |
| https://godly.website, which redirects to https://recent.design | A survey of current portfolio intros |
| https://www.are.na/explore | Moodboard browsing (the page had no content) |
| https://www.framer.com/marketplace/components/shader-shift/ | A stylised image that dissolves into the photo on reveal, which became DEVELOP. Also its reduced-motion handling |
| https://www.framer.com/marketplace/components/cg5wZ2OFwZcIqgrREjbP/ (Halftone Ambient) | Dot radius driven by luminance in the shader, which became the core of halflight.js and GLINT |
| https://tympanus.net/codrops/2020/04/14/interactive-webgl-hover-effects/ | A pointer-driven shader lens, which became the gravity well |
| https://www.framer.com/marketplace/components/box-page-reveal/ | Split panels that open to reveal the page, which became LETTERBOX |
| https://www.framer.com/marketplace/components/studio-pre-loader | A split-type preloader that starts from bars, which became EXPOSURE |
| https://commons.wikimedia.org/wiki/Category:The_Trouvelot_astronomical_drawings | The illustration source: chromolithographs from 1872 to 1881 |

## Palette (OKLCH, seed hue 84°)

| Name | OKLCH | Hex | Use |
|---|---|---|---|
| Umber | oklch(0.17 0.022 62) | `#160d06` | Ground at night, dawn and dusk. Text on day |
| Peat | oklch(0.29 0.045 58) | `#3c2514` | Deep ink in daylight, high end of the day ramp |
| Clay | oklch(0.55 0.115 46) | `#a75932` | Low dot ink, accent in daylight |
| Ember | oklch(0.66 0.165 52) | `#de6f11` | Halation, heat, the ink lockup |
| Ochre | oklch(0.77 0.140 84) | `#deac37` | Seed colour. Mark, accents, rules |
| Spark | oklch(0.89 0.130 92) | `#fad86f` | High dot ink, italic lines, live dots |
| Vellum | oklch(0.95 0.024 84) | `#f6eedd` | Daylight ground, text on dark |
| Moss | oklch(0.52 0.060 112) | `#696d43` | Rare: data, links, a cool counterweight |

The phase inks are defined in `js/timeofday.js` as `PHASES`. Each phase uses one paper colour and a lo and hi ink for the dots:

| Phase | Paper | Lo | Hi |
|---|---|---|---|
| night | `#160d06` | `#a75932` | `#deac37` |
| dawn | `#160d06` | `#de6f11` | `#fad86f` |
| day | `#f6eedd` | `#a75932` | `#3c2514` |
| dusk | `#1d0f07` | `#a75932` | `#fad86f` |

## Type

| Face | Role | Source |
|---|---|---|
| **Instrument Serif** (regular and italic) | Titles, figures, italic one-liners. Set tight (-0.02em) and large | Google Fonts, OFL |
| **Geist** 400/500/600 | Body and UI | Google Fonts, OFL |
| **Geist Mono** 400/500 | Credits, labels and time stamps. Uppercase, tracked 0.2 to 0.3em | Google Fonts, OFL |

```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
```

The logo and wordmark SVGs are outlined, so they need no fonts.

## Time-of-day signature

`js/timeofday.js` computes the solar altitude for Oslo (59.91 N, 10.75 E) from the visitor's clock using a NOAA low-precision model, accurate to about half a degree. It uses no network and asks for no permissions.

| Phase | Condition |
|---|---|
| night | Altitude below -8° |
| dawn | Altitude from -8° to 10°, sun rising |
| dusk | Altitude from -8° to 10°, sun setting |
| day | Altitude above 10° |

`applyPhase()` sets `<html data-phase>` and the CSS variables `--hl-paper`, `--hl-lo`, `--hl-hi` and `--hl-sun-alt`. It returns `{ name, label, time, alt, plate, ... }`.

Suggested microcopy for the site: "Golden hour in Oslo · 18:46". `illustration/sun-path-oslo.svg` uses the same model, and `dayCurve()` can draw a live version of it.

## Inventory

All sizes are on disk. Generated assets were made by me with Python (numpy and Pillow, halftoned per pixel), fontTools (outlined type), headless Chrome (HTML compositions and shader stills) and rsvg-convert. The generator scripts are in `src/tools/`; their absolute paths point at the temporary directory where they were written.

### 1. Identity

| File | What | Use | Source | Licence |
|---|---|---|---|---|
| identity/mark.svg | The mark: a solid half-sun on the horizon over a tapering halftone reflection, in ochre | Nav, footer, loader | Generated (identity.py) | Owned by the client |
| identity/mark-currentcolor.svg / mark-ink.svg | The mark in `currentColor`, and in umber | Inline icon, daylight | Generated | Owned by the client |
| identity/wordmark.svg / -ink / -currentcolor | "Albretsen" in Instrument Serif, outlined, with "AS" in Geist Mono | Header | Generated with fontTools from OFL fonts | Owned by the client (fonts OFL) |
| identity/lockup.svg / lockup-ink.svg | Mark and wordmark for dark and light grounds | Header, OG, posters | Generated | Owned by the client |
| identity/favicon.svg, favicon-180.png | The mark on an umber rounded square | `<link rel=icon>`, apple-touch-icon | Generated, PNG made with rsvg-convert | Owned by the client |
| identity/og.jpg | 1200×630 Open Graph image | `og:image` | src/og.html rendered in Chrome, over hero-dawn | Owned by the client (NASA image is PD) |

### 2. Hero imagery

| File | What | Use | Source | Licence |
|---|---|---|---|---|
| hero/hero-dawn.webp, @2x (1440 and 2880 wide) | Orbital sunrise, ochre halftone on umber, with halation | Default hero, poster frame under the shader | NASA ISS photo iss073e1068530, https://images.nasa.gov/details/iss073e1068530, halftoned | NASA media are public domain, credit "NASA" |
| hero/hero-night.webp, @2x | Aurora over Flakstad, Lofoten, as a halftone | Hero at night | https://commons.wikimedia.org/wiki/File:Lofoten,_Norway_(Unsplash).jpg | CC0 (Unsplash, published before June 2017) |
| hero/hero-dusk-scope.webp, @2x (2.39:1) | Earth's limb at orbital sunset | Hero at dusk and day, wide section band | NASA iss071e439624, https://images.nasa.gov/details/iss071e439624 | Public domain |
| shader/plate-dawn / -night / -dusk.webp | Blurred greyscale luminance plates, 1600 wide, 6 to 17 KB | Textures for halflight.js | Derived from the photos above | As above |
| storyboard/intro-01-spark … 04-clarity.webp | Four stills of the intro, baked from the shader with `?freeze=` | Storyboard, reduced-motion fallback, social | Generated in Chrome from demos/shader.html | Owned by the client |

### 3. Product visuals

These are film one-sheets, 1200×1600 at @2x and 600×800 at 1x. Each real logo is used untouched from `designs/_shared/products`.

| File | Product, plate and real logo used | Source | Licence |
|---|---|---|---|
| products/one-sheet-mcp-emails(.webp, @2x) | MCP Emails over The November Meteors (Trouvelot). Uses `mcp-emails/icon.png` | src/one-sheet.html?p=mcp-emails | Logo belongs to the client; plate PD |
| products/one-sheet-fun-libs | Fun Libs over Aurora Borealis. Uses `fun-libs/splash-icon.png`, the rounded current v5 icon | src/one-sheet.html?p=fun-libs | Same |
| products/one-sheet-toolrails | Toolrails over Total Eclipse. Uses `toolrails/icon.svg` | src/one-sheet.html?p=toolrails | Same |
| products/one-sheet-harbor | Harbor over The Great Comet of 1881. Uses `harbor/harbor-wordmark.svg` inlined, with `currentColor` set to Harbor's own `#FBF9F4` | src/one-sheet.html?p=harbor | Same |
| retired/polyglot-pilot, pinpoint, webvakt, joke-central, tryggere-hyring, early-apps (.svg) | Stand-ins for retired products, drawn as halftone moons. Newer retirements are fuller; older ones wane. Each has a serif monogram and a year | Generated (moons.py) | Owned by the client |

Luma is retired but has a real logo. Use `_shared/products/luma/logo.png` on vellum, as the preview does.

All figures and lines on the one-sheets come from `_shared/content.js`.

### 4. Extras around the site

| File | What | Use | Source | Licence |
|---|---|---|---|---|
| illustration/aurora.webp | Trouvelot, *Aurora Borealis* (1872), halftone | Section header, about section | https://commons.wikimedia.org/wiki/File:Trouvelot_-_Aurora_Borealis.jpg (NYPL) | Public domain |
| illustration/comet.webp | Trouvelot, *The Great Comet of 1881* | Writing and posts | https://commons.wikimedia.org/wiki/File:Trouvelot_-_The_great_comet_of_1881_-_edit_1.jpg | Public domain |
| illustration/meteors.webp | Trouvelot, *The November Meteors* | MCP Emails, contact | https://commons.wikimedia.org/wiki/File:Trouvelot_-_The_November_Meteors.jpg | Public domain |
| illustration/eclipse.webp | Trouvelot, *Total Eclipse of the Sun* (1878) | Toolrails, glint demos | https://commons.wikimedia.org/wiki/File:Trouvelot_-_Total_eclipse_of_the_sun_-_1878.jpg | Public domain |
| illustration/protuberances.webp | Trouvelot, *Solar Protuberances*, red channel re-inked | Tall side strip, "spark" | https://commons.wikimedia.org/wiki/File:Trouvelot_-_Solar_Protuberances.jpg | Public domain |
| illustration/sun-path-oslo.svg | Solar altitude over Oslo on 21 June, 20 March and 21 December, drawn as dots that grow with altitude | Time-of-day explainer, footer | Generated (sunpath.py) | Owned by the client |
| objects/diatom-wheel, -disc, -star.webp | Haeckel diatoms with transparent backgrounds, inked in ochre and vellum | Floating specimens, slow rotation | Haeckel, *Kunstformen der Natur* (1904), plate 84, https://commons.wikimedia.org/wiki/File:Haeckel_Diatomea.jpg. | Public domain |
| objects/corona.webp | Halftone corona of the eclipse with a transparent background | Loader, "spark" accent, 404 | From the eclipse plate | Public domain |
| stickers/badge-play-2016.svg | Rotating seal: "On Google Play since 2016 · Albretsen AS" | Near the history section | Generated (badges.py) | Owned by the client |
| stickers/badge-59n.svg | Ochre seal: "Built at 59° north · Oslo · Norway" | Footer | Generated | Owned by the client |
| texture/grain.webp | 256 px tileable film grain | `.hl-grain` overlay on dark surfaces | Generated | Owned by the client |
| texture/vellum.webp | 1024 px tileable paper fibre | Daylight surfaces, cards | Generated | Owned by the client |
| texture/dot-horizon.svg | Band of halftone dots | Section dividers (`repeat-x`) | Generated | Owned by the client |
| texture/dot-sun.svg | Radial halftone sun | Large background ornament, loader | Generated | Owned by the client |

### 5. Interactive and 3D

| File | What | Notes |
|---|---|---|
| js/halflight.js | **Centrepiece.** A raw WebGL1/2 ES module (about 11 KB) with no dependencies. It draws a live duotone halftone of a plate and plays the intro: the spark ignites, a reveal wave travels out from it, and the dot grid sharpens from 7× to 1×. The pointer acts as a gravity well: dots lean toward it, the grid gets 38% finer, and the area brightens. When intro is off, dots shimmer gently. Bright dots merge as true overlapping circles because each pixel checks its 3×3 neighbours | `createHalflight(canvas, { plate, phase, cell, angle, intro, freeze })` returns `{ ready, setPhase, setPlate, play, destroy }`. It returns `null` without WebGL, so keep the hero still underneath. It respects prefers-reduced-motion. `freeze` (0 to 1) pins the intro at one moment for stills |
| js/timeofday.js | Solar model for Oslo, phase names, inks, `applyPhase()` and `dayCurve()` | `?phase=` overrides the phase |
| motion/mark-sunrise.json | **Lottie** (lottie-web 5.12.2, about 64 KB), 512×512 at 60 fps. Markers: `intro` (frames 0 to 150) shows the spark, a horizon hairline, the sun rising behind a mask and the reflection printing dot by dot with overshoot. `loop` (frames 150 to 270) is a seamless sine breathing of the reflection | Generated in Python (lottie.py). Play `[0,150]`, then loop `[150,270]` |
| demos/intro.html | The full cinematic opening as it would ship | Uses all of the above |
| demos/shader.html | Plates, phases, replay. Accepts `?plate=`, `?phase=`, `?intro=0`, `?freeze=0.3`, `?clean` | |
| demos/lottie.html | The Lottie on its own. `?f=75` freezes a frame | |

lottie-web is loaded from `https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js`.

### 6. Motion study (motion.css and motion.js)

| Name | Kind | What it does | Researched from |
|---|---|---|---|
| **DEVELOP** `.hl-develop[data-hl]` | Entrance | The frame opens from a slit (clip-path) while the image goes from over-exposed, soft and desaturated to a settled print over 2.6 s on a filmic ease | Framer "Shader Shift" (stylised to photo); igloo.inc darkroom fades |
| **EXPOSURE** `.hl-title` with `splitTitle()` | Entrance | Letters arrive wide-tracked (0.32em) and blurred, then tighten to -0.02em, staggered 34 ms per character | Film title cards; Framer "Studio pre-loader" split type |
| **GLINT** `.hl-glint` with `glint()` | Hover | A 9 px dot screen in screen blend mode, masked by a 160 px soft circle that follows the pointer. The image scales 1.035 | Framer "Halftone Ambient"; Codrops interactive WebGL hover |
| **LETTERBOX** `letterbox(fn)` / `setBars()` | Transition | Fixed umber bars close to a glowing hairline, run `fn`, open to 2.39:1, then open fully | Framer "Box page reveal"; anamorphic letterboxing |
| **GATE WEAVE** `.hl-weave` | Ambient | Sub-pixel drift over 7.3 s in steps of 24 and a ±2.5% brightness flicker. Stills only | 35 mm projection |
| `.hl-grain` | Ambient | Animated grain overlay | |
| `runIntro(hl, { title })` | Choreography | Bars closed (0.9 s), then scope while the shader resolves (up to 3.2 s), then open, then EXPOSURE on the title. A 7 s safety net always reopens the page | |

Easings: `--hl-ease-film: cubic-bezier(.16,1,.3,1)`, `--hl-ease-shutter: cubic-bezier(.76,0,.24,1)` and `--hl-ease-lift: cubic-bezier(.34,1.36,.64,1)`.

All motion is skipped under `prefers-reduced-motion`.

### 7. Sources (src/)

| File | What |
|---|---|
| src/one-sheet.html | The poster template. Reads `_shared/content.js`. Render it at 1200×1600 |
| src/og.html | The OG template. Render it at 1200×630 |
| src/tools/*.py | Generators for the palette and halftone (`hl.py`), heroes, engravings, identity, moons, specimens, textures, Lottie, sun path and badges |

## Notes for the builder

- **Hero stack.** Put the `<img>` still (hero-*.webp with srcset) first, then `<canvas>` with `createHalflight`, then hide the still once it returns non-null. Use `PLATES[phase].still` to choose which still matches the plate.
- **Product sections.** Lead with the one-sheet. Do not crop the logo region (the top 45%). The 600 px versions suit card grids.
- **Grain.** Use one grain overlay per page at most. The objects and stickers want space: use one per section.
- **Time of day.** Re-run `applyPhase()` every 10 minutes and cross-fade the body background (the preview does this with a 1.2 s transition). Never show a phase switcher on the real site; the preview's switcher is for review only.
- **Budget.** The whole folder is about 4.7 MB. The above-the-fold cost is about 140 KB (hero-dawn at 1x) plus about 15 KB (plate) plus about 11 KB (shader JS).
