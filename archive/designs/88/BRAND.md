# Labelled Sky · Albretsen AS

## Vision

The page opens on a real photograph: a glass plate of the stars in Cygnus, exposed on 13 August 1885 (The Met, CC0) and graded to forest night and brass. It looks like a still image. It is actually the hero's particle system waiting to start.

Once the page has painted, a canvas takes over. It holds 2,188 particles, one for each star measured from that same plate. Each particle is registered to the exact crop and cover-fit of the photograph, so the swap from photo to canvas is seamless. Then five real stars leave their places and spring into an **A**, the company mark. Pick a product and the nearest stars rearrange into its logo: the MCP Emails envelope, the Fun Libs bars, the Toolrails rails and arrow, the Harbor notched square. While a line is still stretched it stays thin and bright, and it settles to brass once it reaches rest length.

Hover over any star and it shows its catalogue entry: number, magnitude, position on the plate, and which constellation it belongs to. That hidden detail is everywhere you look.

The story it tells without saying so: *precise work, placed on the chart where you can find it.* The neo-brutalist sticker system (chunky forest borders, hard 0-blur shadows, seals, `ALB-01` codes) keeps the precision friendly. The result is playful, but never loud.

**One idea per screen.** Hero: the sky. Section two: the catalogue. Footer: the address.

## Voice

Plain, exact, quietly amused. It reads like a well-written museum label or an observatory logbook. Lines are short, nouns are concrete, and there is no hype.

- Headline: *Software that pays for itself.*
- Section: *Four on the chart.* / *Each one placed where it can earn its keep.*
- Caption: *ALB-00 Albretsen AS, drawn in five real stars.*
- Footer: *Takes one outside engagement at a time.*

Each screen gets at most one serif-italic aside. Numbers always come from `_shared/content.js`.

## Colour (OKLCH, seed hue 0°)

| Token | Hex | Use |
|---|---|---|
| cream | `#F9F2E2` | page, sticker faces |
| forest | `#1A4A32` | ink, borders, hard shadows on cream |
| night | `#05170F` | plates, hero, footer |
| brass | `#C2964D` | constellation lines, codes, shadows on night |
| brass-light | `#E8CB84` | headline accent and text on night |
| signal | `#D4407C` | the seed hue, kept only as the 8px "live" dot |
| moss | `#6C9173` | paused / retired states |

Brass on cream is decoration only. Body text is forest on cream (about 9.6:1) or cream on night.

## Type

- **Archivo**, width 125 and weight 850: headlines and the email address. It is wide, confident and engraved-looking.
- **Martian Mono**: body text, labels and catalogue codes. Labels are uppercase at +0.08 to 0.12em.
- **Instrument Serif Italic**: one aside per screen, the human voice.

All three are SIL OFL and self-hosted as woff2 Latin subsets (about 150 KB together).

## Motion (Web Animations API, no library)

Springs are baked into `linear()` easings: `SPRING_STAMP` (k260 c12) and `SPRING_SNAP` (k170 c14).

1. **Press-on.** A sticker lands from 1.2–1.3× with a small tilt, and only after landing does its hard shadow arrive, as if pressed onto paper. Used for the picker, product cards and retired seals.
2. **Peel & lift.** On hover or focus, a card leans in, its shadow grows from 4 to 10px, and the corner peels back to the paper side.
3. **Brass loupe.** On hover, a sprung circular window follows the pointer and magnifies the plate 2.2× from the 1000px source, which loads on first hover. You see the real emulsion grain and the faint stars. This is the signature delight.
4. **Tension threads.** Constellation lines thin as they stretch and glow brighter, then settle.
5. **Fracture snap.** Used once: the section title splits into three shards and snaps back when it first appears. In the hero, double-click or press **F** to fracture the whole sky. Pinned constellation stars hold, and the field flows back.

Under `prefers-reduced-motion`, everything resolves to its end state. The sky is drawn once, and constellations appear in place without travel.

## Sound

Sound is off by default and is toggled from the header. When enabled, each constellation that locks into place rings one soft bell note built from sine and triangle partials with a 1.6s decay. The pitch follows a pentatonic step per product (A = C5, MCP Emails = D5, Fun Libs = E5, Toolrails = G5, Harbor = A5), so the catalogue has a quiet scale.

## Mark

The **A-constellation**: five real-looking stars, three tension lines that stop short of each star as on an engraved chart, and a brass four-point spark at the apex. It sits on a sticker tile with a hard brass shadow (`assets/identity/`). In the hero it is drawn live, from actual 1885 stars.

## Performance

- First paint is the HTML, two woff2 files, about 30–150 KB of AVIF hero (responsive: wide 960/1600/2400, tall 750/1200 at 700px and below) and the SVG wordmark. Layout shift is 0: every image has dimensions or an aspect ratio, and the hero has a fixed min-height.
- After `load` and idle: the starless plate (6–16 KB, `src/starless.py` lifts the stars out so particles never double), `js/sky.js` (about 10 KB) and the 60 KB star catalogue.
- Product plates, retired seals and zoom sources are lazy. The canvas caps DPR at 2 and pauses offscreen.

## Extending to the blog and product pages

- **Blog index = the logbook.** Each post is a catalogue line (`LOG-014 · 19 Aug 2026 · Stop caring about all-time highs`) set in Martian Mono on cream. Its thumbnail is one of the five Dürer detail crops (`assets/extras/details/`), shown through the loupe on hover.
- **Post pages** sit on cream paper, with a 68ch measure, Archivo headings and Martian Mono for body and code. The single serif aside becomes the pull quote. A cover image is a plate crop with one sticker label, never more. Code blocks look like the MCP tape: forest border, hard shadow, a copy stamp.
- **Product pages** open with that product's constellation forming on its own plate, the same component with `show('<id>')`. Then comes the die-cut sticker card from `assets/products/`, its fact seal enlarged, and a calm two-column spec sheet: facts on the left, a live feed filtered to that product on the right. Status chips (live, building, paused, retired) carry over unchanged.
- **New products** get the next catalogue code (`ALB-05`), a constellation traced from their real logo's vertices, a sticker card and a seal holding one fact. A retired product moves into the row of seals.

## Credits and licences

- Plate I: *A Section of the Constellation Cygnus*, 13 Aug 1885, The Met 283255, CC0.
- Plate II: Dürer, *The Northern Celestial Hemisphere*, 1515, The Met 358366, CC0.
- Star positions were measured from Plate I (`assets/interactive/cygnus-1885-stars.json`).
- `img/plate-empty-*` is a derivative of Plate I with the stars removed (`src/starless.py`), CC0.
- `img/fun-libs-icon-96.webp` is the real Fun Libs icon, downscaled only.
- Fonts: Archivo, Martian Mono, Instrument Serif (SIL OFL 1.1).
- The full asset inventory is in `assets/ASSETS.md`.
