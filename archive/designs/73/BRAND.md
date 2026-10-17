# Long Evening

*One street, one horizon, and the real sky over Norway right now.*

## Vision

A small main street seen from a late-summer meadow. Falu red and ochre wooden houses stand beside sun-bleached deco fronts in mint, flamingo and cream. A plateau, a peak and a spruce ridge sit behind them. The scene is printed like a 1930s silkscreen travel poster: flat inks, banded airbrush skies, and real paper grain taken from a public-domain WPA scan.

The subject is still a software company. The street *is* the company: every live product has a shopfront, with its real logo as the sign.

The personality is sun-drunk optimism, said quietly. Each screen carries one strong image, generous margins and one idea.

## The homepage

- **The long day (hero).** The page works out where the sun is over Norway before the first paint, and opens on the matching still: sunrise, noon, sunset or the light night. Scrolling walks through *the rest of today*. Each later still dissolves in over the one below and settles from 1.035 to 1 in scale. A small arc in the meadow shows the sun travelling, with the hour of each scene.
- **The name in the sky.** "Albretsen" is set huge in Nunito 900 and sits in the sky *behind* the plateau and the peak. It is cut by an SVG sky mask traced from the stills (`img/sky-mask-wide.svg` and `img/sky-mask-tall.svg`, both under 2 KB). Its ink changes with the scene: paper at sunrise and sunset, falu red at noon, peach at night. A second ink settles into a 2 px misregistration as the page loads (Ink Settle).
- **The real sky chip.** The top-right chip shows the time in Norway and a sun dot coloured by the live sky. Hover or tap it to read the explanation.
- **The main street (products).** Four shopfront cards, each at its own hour: MCP Emails at 09:30, Fun Libs at 13:30, Toolrails at 20:15 and Harbor at 23:45. Each card carries its real logo, its line, its figure and its facts from `content.js`. One line of the live event feed sits above them, with a small lit window. Retired products appear as enamel house-number plaques; Luma uses its real logo.
- **Walk the street live.** The whole street is shown as a poster at the current hour. One click loads three.js (and only then) and replaces it with the live scene, a time scrubber, a Now button and `<sky-clock>`.
- **Footer.** Blue hour. It holds the availability line, the email, the MCP command with a copy button, and today's sun path over Norway.

## Voice

Sunny, plain and quietly sure of itself. Use real numbers and short sentences. Never pitch, never use place names or tourist clichés, and never say "passionate".

- Yes: "Every sign on the street is a product." / "Each one keeps its own hours."
- No: "Let's build something amazing together!"

## Type

**Nunito** (variable, self-hosted, OFL) is soft and rounded, with a Californian feel.

| Use | Setting |
|---|---|
| Display | 900, −0.04 to −0.045em, line-height 0.98–1 |
| Lines | 850, −0.03em |
| Body | 500–600, 16–18 px, line-height 1.55, tabular numbers |
| Eyebrows | 800, 12 px, uppercase, +0.14em |
| Commands | ui-monospace, 13 px |

## Colour

Peach `#f6b48f`, mauve `#b391a8`, smog blue `#7e8fb0`, palm black `#1d1f24`, paper `#fbf5ec`. The facades add falu red `#9e3b2e`, ochre `#d39a45`, mint `#a9dcc6`, flamingo `#f2a7b4` and butter `#f4dc8e`. Blue hour `#2f3a60` is the dark UI colour, and meadow `#c4b877` is the ground. The live `--sky-*` variables come from `assets/interactive/sun.js` and repaint once a minute.

## Motion

Slow and eased, and nothing bounces.

- **Long Dissolve:** cross-fades between stills tied to scroll.
- **Ink Settle:** the second colour lands slightly off-register.
- **Lights On:** windows warm up with a short tungsten flicker.
- **Sun Track:** the sun dot rides an arc.
- **Hover:** a card's picture drifts in by 3.5% over 1.4 s, and a peach underline draws itself under the link.

Under `prefers-reduced-motion`, the stills switch in clean steps with no zoom and the type arrives already settled.

## Sound

Silent. If sound is ever added, it is opt-in: a faint evening ambience keyed to the real hour.

## Mark

The **sun-A** is a rounded A whose crossbar is a horizon, with a peach sun half risen inside it. In the lockup it is the first letter of "Albretsen", set in outlined Nunito 800. There is also a single-colour version for footers and favicons.

## Extending to the blog and product pages

- **Blog.** Use paper background, a 680 px column and Nunito body at 18 px. Each post's cover is a slim 21:9 crop of the street at the hour the post was published, so morning posts are peach and late posts are blue hour. Headings use the falu red eyebrow and the peach misregistration shadow. The index is a quiet list: date in tabular figures, title in 850.
- **Product pages.** Each product's page opens on its own shopfront still (the `assets/products/*-960.avif` 4:5 plates, or a wide re-bake from `interactive/bake.html?view=<id>`) at its own hour. Below it come the figure, the facts and one paragraph. The product keeps its own logo and colours on the sign. The site keeps its paper, ink and type around it.
- **New products** get a new shopfront on the street: add a house in `street.js`, re-bake the stills, and the signs follow.
- **Dark contexts** (footer, code blocks, night) use blue hour `#2f3a60` with paper ink, never pure black.

## Performance

The first paint is one AVIF still (about 60 KB at 1440 px, or 125 KB at 2400 px), the font and around 12 KB of CSS. The other three stills load when the browser is idle. Product plates load lazily. three.js loads only when someone asks to walk the street. Every image has fixed dimensions or an aspect ratio, so layout shift is zero.

## Sources

The asset kit is in `assets/`, and `assets/ASSETS.md` gives the licence of every file. The sky masks and the 256 px grain tile in `img/` were derived here from the kit's own stills and from the public-domain "See America" WPA scan (LCCN 98518589).
