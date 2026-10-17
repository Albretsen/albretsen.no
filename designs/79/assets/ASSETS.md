# Design 79: Long Light

Asset kit for Albretsen AS / albretsen.no. To see everything, open `preview.html`. It accepts `?theme=day|night` and `?solo=<section-id>`.

## Vision

**A day passes in one sky.** The site opens on a real photograph of a Norwegian fjord a few minutes before sunrise: deep cold blue, a crescent moon, and a thin gold line on the horizon. As you scroll, a shader raises the sun out of the sea. The blue warms to gold, a glitter path opens on the water, and the photograph keeps every real ridge and cloud. The page carries on into the warm half of the day: late sun through a boulevard of palms, a marine layer over sage hills, and pastel palms at dusk. It ends with lamps lit along a far shore.

It blends two worlds. A Norwegian sunrise supplies cold blue turning gold, dramatic nature and a small town keeping its lights on. Los Angeles supplies palm silhouettes, pastel dusk, flat mid-century stucco walls in raking light, and a Wes Anderson calm. It is an atmosphere, not a postcard. Nothing in the copy names a place. The subject stays a software company and its products, and each product sits in that light.

**The one surprising detail.** The crescent moon in the hero photograph is the night switch. Tap it, and the sun sinks back into the sea. The sky deepens, stars come out, and village lights appear on the far shore with their reflections on the water. In night mode, the point on the horizon where the sun went down brings morning back. On desktop, the glitter path on the water follows the pointer.

**Mood:** warm, human, calm, expensive without showing it. There is one strong idea per screen, generous space and real light.

### Research and references
- https://www.raycast.com: restraint, product as hero, short punchy headings over generous space. Responsive srcsets up to 3840 px.
- https://www.aesop.com (blocked to the fetcher, known reference): raking natural light on plaster and stone, warm neutrals, and quiet editorial type. This drove the stucco product walls.
- https://www.soho-house.com (redirected): warm photography and editorial serif and sans pairing, with line-by-line text reveals.
- https://www.jacquemus.com (blocked to the fetcher, known reference): sunlit Mediterranean minimalism, flat colour fields and bold crops.
- Chrome scroll-driven animations docs: https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- Day-to-night with pure CSS scroll timelines: https://dev.to/_artclick/build-a-scroll-driven-day-to-night-animation-using-pure-css-1o3p
- View Transitions circular theme reveal: https://dev.to/praveen-sripati/i-stole-this-awesome-ripple-effect-from-ant-design-and-you-can-too-2mkg and https://codepen.io/jh3y/pen/BaggYwa
- Sun glint (specular streak along the sun's azimuth): the OpenMW water shaders, and Evan Wallace's WebGL water: https://medium.com/@evanwallace/rendering-realtime-caustics-in-webgl-2a99a29a0b2c
- Wes Anderson colour and symmetry in mid-century California rooms: https://www.dezeen.com/2021/10/30/interiors-wes-anderson-film-lookbook/
- I sourced the photos through the Wikimedia Commons API from Unsplash uploads marked CC0. I chose them with salt 4d0920: result 4 of "palm trees", result 13 (d) of "mountains sunrise", and result 0 of "Lofoten".

## Palette

| Token | Hex | OKLCH | Use |
|---|---|---|---|
| Sand | `#F4EBDD` | oklch(94.3% 0.021 79.1) | day background |
| Dune | `#E3D2B6` | oklch(87.0% 0.042 80.3) | cards, tiles |
| Poppy | `#E8622A` | oklch(65.7% 0.179 40.9) | accent: one per screen |
| Gold | `#F3B252` | oklch(80.7% 0.135 74.3) | sun, highlights |
| Sage | `#8FA382` | oklch(69.1% 0.052 133.2) | secondary fields |
| Sage deep | `#4F6248` | oklch(47.3% 0.047 137.4) | text on sage |
| Sky | `#9CC3E2` | oklch(80.0% 0.061 242.5) | cool fields |
| Fjord | `#2F5D8A` | oklch(46.7% 0.089 249.8) | links, the lower half of the mark |
| Ink | `#1C1A17` | oklch(21.9% 0.007 78.2) | day text |
| Night | `#0C1A2B` | oklch(21.5% 0.039 254.2) | night background |
| Night 2 | `#13263C` | oklch(26.4% 0.048 253.2) | night cards |
| Moon | `#E9E4D6` | oklch(91.9% 0.019 90.5) | night text |
| Lamp | `#F5B860` | oklch(82.2% 0.126 74.4) | night accent (replaces poppy) |

The tokens live in `motion.css` (`:root` and `:root[data-theme="night"]`). Ten sky stops for the time of day are in `extras/sky-hours.json`, and the same stops appear in the `daylong` keyframes and in `motion.js` (`DAY`, `skyAt(p)`).

## Typefaces

- **Instrument Serif** (Regular and Italic) is a condensed, high-contrast display serif. Use it for headlines, product names and the one number that matters. Use the italic for the emotional word ("Long *light*").
- **Schibsted Grotesk** (variable, 400–900) is a clean grotesk drawn for a Norwegian newsroom. Use it for body, labels and UI. Set labels at 12 px, +0.22em, uppercase.
- Both are subset to Latin-1 plus punctuation as WOFF2 in `fonts/`, at 21 KB, 22 KB and 49 KB, under the SIL OFL (licence texts included).

## Inventory

All photographs are Wikimedia Commons uploads of Unsplash photos marked **CC0**. Everything else was generated for this kit. The scripts are in `_src/`.

| File | What | Intended use | Source / how made | Licence |
|---|---|---|---|---|
| `identity/mark.svg` | Serif A in a sun, crossbar continuing as the horizon, gold above and fjord-blue below | logo, avatar | A glyph from Instrument Serif converted to paths (fontTools), `_src/identity.py` | own work, font OFL |
| `identity/mark-night.svg` | Moonlit variant | night theme | same | own |
| `identity/mark-mono.svg` | One-colour knockout (`currentColor`) | stamps, footer | same | own |
| `identity/wordmark.svg` | "Albretsen" serif + tracked "AS" grotesk, `currentColor` | header | glyph outlines to paths | own, font OFL |
| `identity/lockup.svg` | mark + wordmark | header, documents | same | own |
| `identity/favicon.svg`, `favicon-32.png` | favicon | `<link rel=icon>` | rsvg-convert | own |
| `identity/apple-touch-icon.png` | 180 × 180 on sand | iOS | Pillow | own |
| `identity/og.jpg` (+ `og.html` source) | 1200 × 630 card: the name over the fjord at sunrise | Open Graph / social | HTML baked with `scripts/shot.sh` | own + CC0 photo |
| `hero/first-light-{640,1280,1920,2560}.{avif,webp,jpg}` | **Hero 1**: fjord before sunrise, crescent moon, thin gold horizon; graded | still under the interactive hero; LCP image | https://commons.wikimedia.org/wiki/File:Lofoten,_Norway_(Unsplash_R5uIfpzGkRI).jpg graded in `_src/grade.py` | CC0 |
| `hero/first-light-sunrise-*` | Same photo with the sun just risen and a glitter path (baked from Sunline, sun 0.30) | no-WebGL fallback, blog cover, social | rendered by `interactive/sunline.js` in headless Chrome at 2400 × 1600 | CC0 + own |
| `hero/first-light-morning-*` | Same photo in clear morning blue (sun 0.85) | "day" sections | same | CC0 + own |
| `hero/first-light-night-*` | Same photo at night: moon glow, stars, village lights on the far shore | night theme hero still | same | CC0 + own |
| `hero/long-light-*` | **Hero 2**: palms over a curving coastal road with the low sun behind them; warm grade | second-act full-bleed, "about" | https://commons.wikimedia.org/wiki/File:Palm_tree_boulevard_(Unsplash).jpg | CC0 |
| `hero/marine-layer-*` | Fog pouring over sunlit sage hills and pines (photographer's watermark cropped out) | calm section backdrop, writing/blog | https://commons.wikimedia.org/wiki/File:Sunset_beyond_the_fog_(Unsplash).jpg | CC0 |
| `hero/after-hours-*` | Palm silhouettes against a violet-to-gold dusk | night-theme section, footer | https://commons.wikimedia.org/wiki/File:Venice_Beach_palm_trees_at_sunset_(Unsplash).jpg | CC0 |
| `hero/blue-ridge-*` | Violet dawn over dark ridges | blue-hour backdrop | https://commons.wikimedia.org/wiki/File:Morning_mood_1_(Unsplash).jpg | CC0 |
| `interactive/sunline.js` | **Sunline**: a WebGL1 shader that relights the fjord photo (sun height, sun position, night) with a real sky/water mask, sun disc and bloom, glitter path, stars, moon glow and coast lights. No dependencies, about 12 KB unminified, renders only while on screen, honours reduced motion | interactive hero | own | own |
| `interactive/sunline-demo.html` | Tiny demo: slider, pointer-following glitter, moon/sun hit targets, `?sun=&night=&sunX=&bake=1` | demo, baking stills | own | own |
| `interactive/first-light-tex.{jpg,webp}` | 2048 px shader texture | Sunline input | from first-light | CC0 |
| `interactive/first-light-mask.png` | R = sky, G = water mask (960 × 640) | Sunline input | edge-based region growing + hand polygon, `_src/mask4.py` | own |
| `products/{mcp-emails,fun-libs,toolrails,harbor}-{600,1200}.{avif,webp}`, `-800.jpg` | Each **real product icon** set as a glazed plaque on a stucco wall at its own hour: MCP Emails 07:40 terracotta, Fun Libs 11:15 sky, Toolrails 15:30 sage, Harbor 18:50 dusk rose. A window of sun and a real palm's shadow rake across each; the plaster relief is lit from the same angle | product cards / product pages | `products/scene.html` (SVG feDiffuseLighting stucco + palm shadow + real logos from `designs/_shared/products`), baked via `_src/bakeproducts.py` | logos: Albretsen AS; scene own |
| `products/*-card.webp` | Same scenes with name, one-line and hour in type | social / previews | same, without `?bare` | same |
| `products/scene.html` | The live source of those scenes, `?p=<id>&bare=1` | rebuild or embed live | own | own |
| `products/retired/*.svg` | Sun-faded glazed tiles with serif monograms: Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, early apps | retired products list | `_src/retired.py` | own, font OFL |
| (Luma) | Use the real `designs/_shared/products/luma/logo.png` on a #F4EFE6 chip. The monogram SVG depends on missing CSS | retired list | real asset | Albretsen AS |
| `extras/palm-cutout.webp` | Transparent silhouette of four tall palms, cut from a real photo | edge decoration, footer, 404 | luminance matte from the after-hours photo, `_src/palm.py` | CC0-derived |
| `extras/palm-shadow.{png,webp}` | The same palms as a soft violet shadow with alpha | `.long-shadow` overlay on any light section | same | CC0-derived |
| `extras/grain.png` | 256 px seamless film-grain tile with alpha | `background-image` over flat fields to stop banding | numpy | own |
| `extras/sky-hours.svg` / `.json` | Ten skies through one day with sun/moon position, hour and name | timeline, about section, theme reference | `_src/extras.py` | own |
| `extras/horizon-rule.svg` | Divider: hairline horizon with a half sun rising and its reflection | section divider (`currentColor` line) | own | own |
| `extras/sun-arcs.svg` | `<symbol>` sprite of ten sun-on-arc glyphs (`#arc-0610` … `#arc-2330`) | section eyebrows: each section is an hour of the day | own | own |
| `motion.css`, `motion.js` | Motion study (below) and tokens | site-wide | own | own |
| `fonts/*.woff2` | Instrument Serif Regular/Italic, Schibsted Grotesk VF | type | https://fonts.google.com/specimen/Instrument+Serif, https://fonts.google.com/specimen/Schibsted+Grotesk (google/fonts repo, subset) | SIL OFL 1.1 |
| `_src/*.py` | Reproducible pipeline: fetch, grade, mask, fonts, identity, palm, retired, extras, bake | rebuild | own | own |

## Motion study (`motion.css` + `motion.js`)

1. **Daylong.** The page's sky runs from first light (06:10) to blue hour (21:00) as you scroll. It uses `@property`-registered colours (`--sky-top`, `--sky-horizon`) on an `animation-timeline: scroll(root)`, and `daylong()` provides a JS fallback. `daylong({ onProgress })` can also drive Sunline's `sun`, so the hero sun rises as you scroll. `.daylong-ribbon` is a 6 px strip of the day pinned to the top. *Ref: Chrome scroll-driven animations; the "day-to-night in pure CSS" article.*
2. **Long shadow.** A real palm's shadow drifts, rotates and stretches across a wall as the sun lowers. It uses a `view()` timeline, and the shadow disappears at night. *Ref: the raking-light photography on aesop.com, and Anderson's flat sunlit walls.*
3. **Horizon rise.** Headline lines rise from behind their own baseline like a sun, staggered 90 ms, with ease-out-expo. A hairline horizon draws out beneath them. `horizonRise()` splits `data-lines="a|b"`. *Ref: the editorial line reveals on soho-house.com and jacquemus.com.*
4. **Sunset switch.** In the theme toggle, the sun sinks below a little horizon while the moon rises, and the new theme spreads from the button in a circle (View Transitions with a fallback). `sunsetSwitch(button, { onChange })` stores the choice and honours `?theme=`. In the hero, the photographed moon triggers the same switch. *Ref: the View Transitions circular reveal pattern.*
5. (Small) **Glint.** A slow band of sun crosses a single number every six seconds. Use it at most once per page.

All of them stop under `prefers-reduced-motion`.

## Notes for the builder
- **Hero:** paint `hero/first-light-*` in a `<picture>` (AVIF/WebP/JPEG, `fetchpriority=high`, width/height set). Then lazy-import `interactive/sunline.js` and fade the canvas in over the still, which gives zero layout shift. Use `object-position: 50% 62%`, and use `12% 62%` plus `focus: [0.12, 0.62]` in portrait so the moon stays in frame. Place an invisible button at `sl.moonPoint()` for the night switch.
- Initial weight in the preview hero: about 70–120 KB for the image, 21 + 49 KB for fonts, and about 12 KB for Sunline plus 200 KB for the texture, loaded after first paint.
- Keep one accent per screen: poppy by day, lamp by night. Use generous space. Product walls are 4:3, and cards should leave the plaque centred.
- Use the copy lines from `designs/_shared/content.js`. The kit invents no figures.
