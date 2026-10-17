# Airglow (design 86)

## Vision

The site is the quiet moment just before an orbital sunrise. There is a black sky, a thin blue line of atmosphere, and the name **Albretsen** set behind the curve of the Earth, so the planet holds it. Every image is a real NASA photograph taken from the International Space Station and graded to one palette. Nothing is drawn to look like space.

Scale does the bragging. A one-person company stands against the edge of a planet, and no sentence needs to say "ambitious". The products are the cast. They stand as glass tiles on a thin lattice ring floating above first light, and as you scroll the ring turns and lingers on each one in turn. It is a character-select screen, but serene: one product, one colour and one sentence at a time.

Space here is atmosphere, not costume. The subject is a software company and its products. There are no rockets, no astronauts, no mission patches and no "launch" puns.

## The homepage

1. **Hero.** The firstlight photograph fills the viewport. The wordmark `Albretsen`, in Geist Light, rises from behind the limb on first paint (Limb Rise). A second copy of the photo, clipped by a path traced from the real edge of the planet, covers the bottom of the letters. On portrait screens, a 4:5 crop with its own fitted clip keeps the effect. Under the limb sit the one-liner, the meta line (Albretsen AS, Norway, Google Play since 2016) and the MCP command with a magnetic Copy button. The live feed is a single quiet line in the header.
2. **Products (the roster).** A sticky stage scrubs 72 landscape frames, or 48 portrait frames on phones, baked from the three.js scene. The plateau easing in the frames makes the ring pause on each product. HTML overlays fade in time with the scrub: the product's status and emission line, its name in large Geist Light, one sentence, one figure in the product's colour, its facts and its link. A left-hand index (a row of dots on phones) works as the select menu. It is clickable, uses the arrow keys and supports deep links (`#mcp-emails`, `#fun-libs`, `#toolrails`, `#harbor`). The active entry pulses with a small Lottie ripple in the product's colour. **Live 3D** swaps the frames for the real three.js scene the frames were baked from. That scene adds pointer parallax and clickable tiles, and it is loaded only when asked for.
3. **Earlier work.** The retired products are shown as dimmed bodies (stand-in tiles, plus Luma's real logo) on a slowly drifting star field. A Lottie limb draws itself once as the section intro.
4. **Footer.** The aurora photograph (greenline), with "Takes one outside engagement at a time." and the email as the one bright button. Below it are the wordmark, the emission-line spectrum and the credit "Imagery: NASA, public domain. No endorsement implied."

## Voice

The voice is plain and short, and the facts carry the weight. It speaks in the third person on the homepage and the first person in posts. Adjectives stay home, and numbers come only from `content.js`. Nothing asks for anything: no "hire me", no "let's connect", no "passionate".

- Hero: "Asgeir Albretsen builds software that pays for itself."
- Earlier work: "Shipped, learned from, set down. Each one made the next one better."

## Colour

The neutrals carry 95% of every screen. The spectrum is used with discipline: the only saturated colours are real emission lines of the night sky, and each belongs to one product and appears only beside it.

| Token | Hex | Use |
|---|---|---|
| void | #070d15 | page ground |
| night | #101822 | raised surfaces |
| hairline | #2a343e | rules, lattice |
| mist | #acac9e | secondary text |
| starlight | #f4f5e7 | primary text, the one bright button |
| greenline (O I 557.7 nm, seed hue 108°) | #e9e558 | MCP Emails, focus rings, live state |
| sodium (Na I 589.0 nm) | #f7ac4d | Fun Libs |
| nitrogen (N₂⁺ 427.8 nm) | #7988ed | Toolrails |
| oxygen red (O I 630.0 nm) | #e86154 | Harbor |
| limb | #52afe7 | links on light ground, dividers |

## Type

The display face is Geist Light at weights 250 to 300 with −0.045em tracking, so it reads as engineered and quiet, never loud. Text is Geist 400 at 17/1.6. Labels, figures and wavelengths are in Geist Mono at 12.5 px with +0.04 to 0.08em tracking. Both faces are self-hosted variable fonts (SIL OFL), preloaded with `font-display: optional`, so layout shift stays at zero.

## Motion

Everything moves the way things move from orbit: slowly and continuously, with long expo ease-outs and no bounce. The visitor's scroll is the only fast thing on the page.

- **Limb Rise:** the name rises from behind the Earth on load (2.4 s).
- **Orbit Scrub:** scroll position maps to a frame index, drawn to a canvas with nearest-first lazy loading.
- **Magnetic Pull:** buttons and links lean toward the cursor on a critically damped spring. It runs only on fine pointers.
- **Spectral Line:** each link's underline sweeps in, in its product's colour.
- **Airglow Drift:** the star field moves about 1 px every 1.5 s.

With `prefers-reduced-motion`, the rise, drift, magnetism, Lottie and smooth scrolling all switch off. Scrubbing stays, because it is driven directly by the visitor's own scroll.

## Sound

The page is silent. If sound is ever added, it must be opt-in. The only idea worth keeping is a single soft sine tone when a product is selected, with its pitch mapped from the product's wavelength.

## Mark

The mark is an "A" whose crossbar is the curved limb of the planet, with first light at the apex. The wordmark is "Albretsen" in Geist with "AS" in Geist Mono. The hero version is the full name set behind the Earth's edge: the planet clips the logo.

## Extending to the blog and product pages

- **Blog index:** a dark page with one wide limb photograph at the top, chosen per season from the NASA library and graded with the same curve. Posts are listed as plain rows: a mono date, a light title, and one line. A post about a product carries that product's emission colour as a 1 px rule and as its link underline, and nothing more.
- **Post pages:** text on `void`, 68ch measure, Geist 18/1.7. Cover images are graded NASA Earth photographs (night limbs, aurora, city lights) or the product's own baked 4:5 card. Pull quotes sit behind a `limb-divider`, and code blocks are on `night` with Geist Mono.
- **Product pages:** each product gets its own plate from the kit (`products/plate-*.webp`) with the real logo standing on the glass plinth, the product's emission line as its single accent, and its figure in large Geist Light. The page opens with the roster stopped on that product, using the same frames and the same deep link, so going from the homepage to a product feels like the ring simply stopping turning.
- **New products** get a new emission line from the real night-sky spectrum (for example the 777.4 nm oxygen near-IR line, shown as a pale rose), a new tile on the ring and a re-bake of the frames from `assets/src/roster-frame.html`.

## Credits

The photographs are NASA (public domain): iss072e030246 (firstlight), iss066e008713 (greenline), and the product plates listed in `assets/ASSETS.md`. No endorsement is implied. Geist and Geist Mono are by Vercel and basement.studio (SIL OFL 1.1). three.js r169 is MIT. lottie-web 5.12.2 is MIT and loaded from cdnjs on demand.
