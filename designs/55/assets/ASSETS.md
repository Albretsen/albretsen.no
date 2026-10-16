# Plate Nocturne: asset kit 55

Open `preview.html` first. It shows every asset, the palette and the type, and runs the motion and the interactive hero.

## Vision

The site is **a stack of glass plates at night**. In the 1850s to 1880s, the people who first photographed lightning, the moon, an eclipse corona and the Lyra ring nebula did it on glass negatives, often after their day's work, with home-built instruments. That is the brand truth for Albretsen AS: one person with a day job who builds, at night, things that work and pay for themselves.

- **Photography-led.** The imagery is real 19th-century science photography from The Met's open-access collection (CC0). Every source was made from a glass negative. It is regraded into one look: near-black, ember, one electric amber, cream highlights, fresh grain.
- **Glass panes with depth and refraction.** Plates float, stack and overlap. A pane always shows the world behind it *displaced*, never just blurred. That is how real thick glass behaves, and it is the idea behind the mark.
- **Grainy gradient illustration** fills the gaps: soft amber light pools, seams and orbs with heavy grain, like light leaking between plates in a dark room.
- **Personality: the quiet operator.** Calm, exact and unhurried. One accent colour, rationed. Labels read like catalogue numbers. Nothing shouts; the bolt does the talking.
- **Spark words:** *spark* (the 1886 bolt, the click-to-discharge interaction, the amber accent), *nocturne* (darkness, the moon, the hum), *tide-free* (no water, no ships, no tides: the moon here is only light on glass).

Not a bank, not a consultancy: no navy, no gold, no serif-capital gravitas, no charts. It is a technology brand whose taste comes from optics and photography.

### References

- Moussette, *Spiral of Lightning in a Thunderstorm*, 1886: https://www.metmuseum.org/art/collection/search/287289
- The Met Open Access API (v1.1 search): https://metmuseum.github.io/
- Stacking cards with scroll-driven animations: https://scroll-driven-animations.style/demos/stacking-cards/css/
- Blur-to-sharp scroll reveals: https://alvarotrigo.com/fullPage/css-scroll-animation/
- Scroll-driven `scroll()` / `view()` intro: https://tympanus.net/codrops/?p=75216
- Grainy gradients (feTurbulence noise under gradients): https://css-tricks.com/?p=351302 and https://frontendmasters.com/blog/grainy-gradients/
- Liquid-glass edge highlights and displacement: https://blog.logrocket.com/how-create-liquid-glass-effects-css-and-svg/
- Lenis smooth scroll: https://cdn.jsdelivr.net/npm/lenis@1.3.23/README.md and https://motion.dev/docs/lenis
- motion.dev examples ("AnimateView: Clip path", "Card stack", "Scroll Image Reveal"): https://motion.dev/examples
- Opt-in UI sound practice: https://www.freecodecamp.org/news/web-audio-for-the-user-interface-1592687f898c
- CSSDA Website of the Day, EddyOS (an opt-in sound toggle done well): https://eddy-naboulet.dev/

## Palette

All neutrals sit on hue 48° with almost no chroma, so the darks read as an unlit darkroom. Amber is the only colour. Use at most one amber element per viewport: a word, the ray, a figure unit or a focus ring.

| Token | Role | OKLCH | Hex |
|---|---|---|---|
| `--ink-0` | page | `oklch(0.13 0.006 48)` | `#090706` |
| `--ink-1` | raised surface | `oklch(0.17 0.008 48)` | `#120e0c` |
| `--ink-2` | card | `oklch(0.22 0.010 48)` | `#1f1917` |
| `--ink-3` | hairline | `oklch(0.30 0.012 48)` | `#332c29` |
| `--mute` | muted text, labels | `oklch(0.62 0.015 48)` | `#8e847e` |
| `--cream` | text | `oklch(0.93 0.012 70)` | `#ede7df` |
| `--paper` | light ground (rare) | `oklch(0.97 0.010 80)` | `#f9f4ee` |
| `--spark` | **the accent** | `oklch(0.74 0.19 48)` | `#ff7e22` |
| `--spark-hot` | highlight, glass edges | `oklch(0.84 0.15 60)` | `#ffb15c` |
| `--spark-deep` | pressed; accent on light | `oklch(0.56 0.17 40)` | `#c2460d` |
| `--ember` | glow floor in gradients | `oklch(0.40 0.10 40)` | `#733119` |

Contrast: cream on ink-0 is about 17:1, mute on ink-0 about 5.6:1, spark on ink-0 about 8:1.

## Type

All three are self-hosted in `fonts/` (latin subset woff2, SIL OFL 1.1, from Google Fonts).

- **Instrument Serif Italic**: display lines and big figures ($782, 113,000+). Tight leading (0.9 to 0.98), tracking -0.015em. The single amber word lives here.
- **Geist** (variable 300 to 700): headings at 500 and body at 400.
- **Geist Mono** (400 to 500): labels, catalogue numbers, the MCP command. Uppercase, tracking 0.14em, 11 to 13px.

Voice sample: *Software, developed after dark.* Catalogue sample: `PLATE 287289 · 12.05.1886`.

## Motion (motion/motion.css and motion/motion.js)

| Name | Kind | What it does | Technique |
|---|---|---|---|
| `develop` | entrance | Photographs develop like a plate in the tray: amber over-exposed haze resolves to sharp | `animation-timeline: view()`, with an IntersectionObserver fallback (`.is-in`) |
| `recede` | section transition | Sticky sections stack like panes; the lower one sinks, dims and blurs | `view()` + `exit-crossing` range (after scroll-driven-animations.style) |
| `sheen` | hover | A specular band crosses the glass; the inner image shifts 6px and lifts | CSS transitions, `.glass.sheen > .glass-img` |
| `seam` | page transition | A hairline of amber light opens horizontally into the next view | View Transitions API + `clip-path: inset()`; `seamTo(fn)` |
| `ray` | logo | The plates settle, then the ray draws through the A | `stroke-dashoffset` with `pathLength="1"` |
| `drift`, `progress-seam` | utility | Slow parallax for background plates; a scroll-progress hairline | `view()` / `scroll(root)` |

Lenis 1.3.23 is lazy-loaded from jsDelivr inside `initMotion()` and skipped for `prefers-reduced-motion`. Every animation has a reduced-motion override.

## Sound (interactive/sound.js)

Opt-in, off by default, synthesised with Web Audio (no files). The choice is remembered, but audio never starts before a click.
- `tink()`: glass struck, from four inharmonic sine partials. Use on pane pick-up and product hover.
- `spark()`: a band-swept noise discharge with crackle. Use for the hero bolt.
- `slide()`: one pane sliding over another. Use for section and page changes.
- hum: a low nocturne drone at about -38 dB, only while sound is on.
Bind it to a small pill in the nav: `bindSoundToggle(button)`, with a `[data-label]` child and an `<i>` dot.

## Inventory

All paths are relative to `designs/55/assets/`. "Met" means The Metropolitan Museum of Art Open Access, released as CC0 1.0 (public domain dedication).

### Identity
| File | What | Use on site | Source | Licence |
|---|---|---|---|---|
| `brand/mark.svg` | A made of two glass plates edge-on, crossed by one refracted amber ray | nav, footer, loader | hand-authored SVG | original, Albretsen AS |
| `brand/wordmark.svg` | mark + "Albretsen" (Geist 500 outlined) + mono "AS" | nav on dark | generated: text to path with opentype.js from Geist / Geist Mono | original; glyphs from OFL fonts |
| `brand/wordmark-on-light.svg` | same, for light grounds | PDFs, invoices, light contexts | as above | original |
| `brand/wordmark-text.svg` | "Albretsen" alone, outlined | tight spaces | as above | original |
| `brand/favicon.svg` | heavy-stroke mark on a rounded ink tile | `<link rel=icon>` | hand-authored SVG | original |
| `brand/favicon-180.png` | 180px PNG | apple-touch-icon | rsvg-convert from favicon.svg | original |
| `brand/og.jpg`, `brand/og.webp` | 1200×630 social card: line + refracted bolt | `og:image` | baked from `bake/bake-og.html` in headless Chrome | original, includes Met CC0 |

### Hero
| File | What | Use | Source | Licence |
|---|---|---|---|---|
| `hero/hero-plates@1x/@2x.{webp,avif}` | four glass negatives receding in depth (spark, corona, moon, nebula) | desktop hero still or poster; "about" band | baked from `bake/bake-hero.html` (CSS 3D, 2880×1800) | original + Met CC0 |
| `hero/hero-refract@1x/@2x.{webp,avif}` | 1886 lightning seen through two loose panes that displace it | primary desktop hero (static fallback for the interactive) | baked from `bake/bake-refract.html` | original + Met CC0 |
| `hero/hero-refract-portrait@1x/@2x.{webp,avif}` | the same, phone crop | phone hero | `bake-refract.html?v=portrait` at 1170×2532 | original + Met CC0 |

### Interactive
| File | What | Use | Source | Licence |
|---|---|---|---|---|
| `interactive/loose-panes.js` | ES module: draggable panes of glass over the lightning plate, with live refraction and click-to-discharge canvas sparks; keyboard accessible | the hero itself; mount on a full-bleed element | hand-written, no dependencies | original |
| `interactive/sound.js` | opt-in Web Audio sound kit (tink, spark, slide, hum) + toggle binder | nav sound pill, hero, hovers | hand-written | original |
| `interactive/demo.html` | full-screen demo of both | reference | hand-written | original |

### Product visuals
| File | What | Use | Source | Licence |
|---|---|---|---|---|
| `products/product-mcp-emails@1x/@2x.{webp,avif}` | real MCP Emails icon, unaltered, cast in a glass block before the 1883 corona; $782 MRR | product card / section | `bake/bake-product.html?p=mcp-emails`; logo from `_shared/products/mcp-emails/icon.png` | logo © its product; plate Met CC0 |
| `products/product-fun-libs@…` | real Fun Libs v5 icon before the 1857 moon; 113,000+ installs | product card | `?p=fun-libs`; `_shared/products/fun-libs/icon.png` | as above |
| `products/product-toolrails@…` | real Toolrails icon before the Cygnus star field; 4 connectors | product card | `?p=toolrails`; `_shared/products/toolrails/icon.svg` | as above |
| `products/product-harbor@…` | real Harbor mark (currentColor, cream) before the Lyra ring; 549 commits | product card | `?p=harbor`; `_shared/products/harbor/harbor-mark.svg` | as above |
| `products/product-*-bare@1x/@2x.webp` (4) | the same four scenes without the baked figure and caption, for layouts that set the text in HTML | sticky `.pane-card`s, hero side panels | `bake-product.html?bare&p=…` | as above |
| `products/retired-polyglot-pilot.svg` … `retired-early-apps.svg` (6) | etched glass stand-in plates for products with no surviving assets: Polyglot Pilot, PinPoint, WebVakt, Joke Central, Tryggere Hyring, early apps | "retired" index / archive grid | hand-authored SVG (feTurbulence etch) | original |
| Luma | use the real `_shared/products/luma/logo.png` (inverted on dark, as preview.html shows) | retired grid | real asset | product's own |

### Photography (museum)
| File | What | Use | Source URL | Licence |
|---|---|---|---|---|
| `museum/plate-spark-1886@1x/@2x.webp` | Moussette, *Spiral of Lightning in a Thunderstorm*, 12 May 1886, graded | hero, 404, footer | https://www.metmuseum.org/art/collection/search/287289 (image https://images.metmuseum.org/CRDImages/ph/original/DP156451.jpg) | CC0 |
| `museum/plate-corona-1883@…` | H. A. Lawrence, *Solar Eclipse from Caroline Island*, 6 May 1883 | MCP Emails, section art | https://www.metmuseum.org/art/collection/search/786870 (DP-15797-053.jpg) | CC0 |
| `museum/plate-moon-1857@…` | J. A. Whipple, *The Moon*, 1857–60 | Fun Libs, section art | https://www.metmuseum.org/art/collection/search/262301 (DP-15797-001.jpg) | CC0 |
| `museum/plate-gibbous-1857.webp` | Whipple, *The Moon* (gibbous), 1857–60 | small accent, blog | https://www.metmuseum.org/art/collection/search/263204 (DP-15797-007.jpg) | CC0 |
| `museum/plate-lyra-1885@…` | Paul Henry, *Nebuleuse de la Lyre*, ca. 1885 | Harbor, section art | https://www.metmuseum.org/art/collection/search/266895 (DT7041.jpg) | CC0 |
| `museum/plate-cygnus-1885@…` | Paul Henry, *A Section of the Constellation Cygnus*, 13 Aug 1885 | Toolrails, starfield backgrounds | https://www.metmuseum.org/art/collection/search/283255 (DP156450.jpg) | CC0 |
| `museum/plate-terminator-1890@…` | Paul Henry, *Lunar Photograph, South Pole*, 1890 | writing / posts header | https://www.metmuseum.org/art/collection/search/267137 (DP-15797-009.jpg) | CC0 |
| `museum/emulsion-*.webp` (5) | spark, corona, moon, lyra, cygnus with luminance as alpha: emulsion on clear glass | layer over any background; used by the hero stack and loose panes | derived from the plates above (`alpha.py`) | CC0 |
| `museum/etched-corot-1871.webp` | Corot, *Les Paladins*, 1871, cliché-verre (a drawing scratched into a coated glass plate), extracted as cream lines on alpha | overlay at 8–20% on panes, footer, "about" | https://www.metmuseum.org/art/collection/search/387978 (DP883973.jpg) | CC0 |

Grading pipeline: crop, percentile levels, then a gradient map (`spark`: #090706 → #3b1f12 → #a3400e → #ff7e22 → #ffb15c → #fff3e2; `plate`: neutral warm greys to cream). Then an amber bloom on the highlights, a soft vignette and mid-weighted luma grain. Python with Pillow and NumPy.

### Texture and objects
| File | What | Use | Source | Licence |
|---|---|---|---|---|
| `extras/ember-field@1x/@2x.webp` | grainy gradient: amber light pooling in the dark | backdrop behind the hero and panes | generated (NumPy Gaussian fields + grain) | original |
| `extras/dusk-orb@1x/@2x.webp` | grainy gradient illustration of a lit amber sphere (a moon, without tides) | 404, empty states, footer corner | generated (Lambert-shaded sphere + gradient map + grain) | original |
| `extras/seam-band.webp` | thin seam of light between two panes | section divider | generated | original |
| `extras/ray-field.svg` | pattern: horizontal rays displaced by three panes (the mark's optics, at section scale) | "how I work" or tools section background | generated SVG | original |
| `extras/sticker-after-hours.svg` | round sticker: "Albretsen AS · Built after hours · Norway · Since 2016" around the mark | slowly spinning in the footer or about section | hand-authored SVG | original |
| `extras/plate-index.svg` | catalogue strip of ticks and plate numbers | divider, footer rule | generated SVG | original |
| `extras/grain-tile.png` | 256px seamless monochrome grain with alpha | global `body::before` overlay at 12–22%, `mix-blend-mode: overlay` | generated | original |

### Motion, fonts, bake files
| File | What | Source | Licence |
|---|---|---|---|
| `motion/motion.css`, `motion/motion.js` | the five signatures + Lenis bootstrap + view-transition helper | hand-written | original |
| `fonts/geist-normal.woff2`, `fonts/geist-mono-normal.woff2`, `fonts/instrument-serif-{normal,italic}.woff2` | self-hosted latin subsets | https://fonts.google.com/specimen/Geist, …/Geist+Mono, …/Instrument+Serif (fonts.gstatic.com) | SIL OFL 1.1 |
| `bake/bake-hero.html`, `bake/bake-refract.html`, `bake/bake-product.html`, `bake/bake-og.html` | the HTML/CSS scenes the stills were rendered from (re-bake with `scripts/shot.sh … 2880 1800`) | hand-written | original |

## Notes for the builder

- **Hero:** mount `loose-panes.js` full-bleed, with the headline on the left third (the bolt sits at about 63%). Use `hero-refract@2x.avif` as the poster until the module mounts, and `hero-refract-portrait` under 700px (pass the narrow pane config shown in `preview.html`).
- Put the grain overlay on `body::before`. Use `ember-field` as the base of any section that needs warmth. Never put amber on more than one element per screen.
- For the products, use the four product stills as `.glass.sheen` cards, or as sticky `.pane-card`s in a `.pane-stack` (the `recede` motion). Retired products are a quiet grid of the stand-in plates, plus Luma's real logo.
- Label everything like a catalogue, in mono: `PLATE 287289 · 1886`, `SINCE 2019 · LIVE`.
- Sound pill in the nav, off by default. `tink` on product hover and `spark` on hero click.
- Budget: the whole kit is about 4.0 MB (93 files). The heaviest single files are `museum/etched-corot-1871.webp` (about 420 KB) and `museum/emulsion-moon-1857.webp` (about 360 KB), so lazy-load them.
