# Noon & Dusk

*A painted terrace that opens onto the sea, and a sun you can set yourself.*

## Vision

Albretsen AS is a small technology company that builds whatever pays: apps, SaaS and infrastructure for AI agents. The site has to show skill and taste without boasting about either, so it relies on light, space and precision.

Every screen is one **opening spread**, laid out around a single arched doorway on the page's axis. The homepage opens like a magazine: *Quiet* on the left page, *software.* on the right, and between them a gouache terrace in hard Mediterranean noon light, framed by the brand's arch. As you scroll, the arch opens to full bleed and the two pages move apart in a mirror image. A paper caption card stands in the doorway with the one line, *I build software that pays for itself*, and a live line from the products below it.

The signature delight is **the sun**. It hangs on the axis above the sea, and you can drag it down. As it sinks, the afternoon warms. When the sun covers the painted one, dusk opens from the horizon line outward, and the whole site turns to an LA dusk of peach, mauve, smog blue and palm black. Raise it again for noon. Keyboard users can do the same: the sun is a vertical slider (arrows, Home and End, or Enter to set it in one movement). The small sun in the masthead does the same job from anywhere on the page.

The atmosphere draws on South of France stone, shutters and terracotta, on Parisian zinc roofs and didone type, and on a director's habit of framing everything head-on. It is a setting, not a theme: there are no place names, no landmarks and no travel copy. The products are the subject.

## The homepage

1. **Spread (hero).** A sticky stage that is 240 svh tall. The arch's width and corner radius are computed from scroll, and the painting is clipped with `clip-path: inset(... round r r 0 0)`, so layout never moves (CLS 0). Both the noon and dusk plates are AVIF/WebP/JPEG at 640/1280/1920, with 24 px placeholders underneath. On narrow screens the spread folds: the arch sits above and the headline below.
2. **Four doors, one address.** The current products are listed as numbered tabs (I–IV). The chosen product's painted shop front stands in an arch in the centre. On the left page are its name and line; on the right page are its one figure, its facts and its address. Switching products is a *Whip Pan*: the plates blur only while moving and stop dead, and the text fades on the beat. Every figure comes from `content.js`.
3. **Earlier, now closed.** Seven small enamel plaques. Hovering or focusing one sets a single caption line.
4. **Footer.** A small arched window onto a live three.js row of zinc mansards. It loads only when it scrolls near, keeps the same hours as the hero sun, and its windows light up at dusk. Below it is the back of a postcard: the availability line, the email and the MCP line (with a copy button) on one side, and a NASA coast stamp under a postmark on the other.

## Voice

Dry, exact and unhurried. Sentences are short, there are no adjectives about ourselves, and each thing gets one number. It never asks for anything.

- Headline: one roman phrase plus one italic phrase. "Four doors, *one address.*"
- Labels are small caps in Jost: "Open · since 2026", "Paused · since 2026".
- Wit stays deadpan: "The roofs, rendered live. They keep the same hours as the sun above."
- Banned: hire me, let's connect, passionate, any place name, any postcard cliché.

## Type

- **Bodoni Moda** (OFL, variable, optical size 6–96). It is used for display, headlines and numbers. The italic is the only accent, used once per headline and coloured terracotta by day and peach by dusk.
- **Jost** (OFL). It is used for text and for 10–11 px uppercase labels tracked at .22–.24em.
- A monospace face appears only for the MCP command.

## Colour

| Role | Day | Dusk |
|---|---|---|
| Ground | Paper `#F6EDE1` + grain | Dusk `#221D2A` + grain |
| Ink | Palm black `#211C24` | Moon `#F4E7D6` |
| Accent | Terracotta `#C9694B` | Peach `#EF9F7C` |
| Sun | Peach `#EF9F7C` | `#F6C08F` |
| Support | Mauve `#A0809E`, smog blue `#7D93AD`, shutter green `#2F5A46`, ochre `#E2B25E` | same |

Pure black and pure white are never used.

## Motion

There is one curve, `cubic-bezier(.65,0,.35,1)`, and one 240 ms beat. Nothing bounces or overshoots, and everything moves on the vertical axis or mirrors across it.

- **Arch Opening:** linear in scroll, like a camera on a dolly.
- **Sunset:** the sun sinks first, then dusk opens from the horizon outward. Colours cross-fade over 900 ms. When the hero is out of view, the masthead switch uses a View Transitions horizon wipe.
- **Whip Pan:** used between products.
- **Caption Card:** the intertitle lines appear one beat apart.
- **Shutters:** reserved for page-to-page transitions (blog, product pages).

Under `prefers-reduced-motion`, the spread is a single static screen, and every change of state is instant.

## Sound

The site is silent by default. If sound is ever added, it will be one opt-in toggle with a single soft tone when the sun touches the sea, and nothing else.

## Mark

The mark is an arched opening with thick didone verticals and a hairline crown, plus a horizon and a half sun. Read twice, it is an **A**. The wordmark "Albretsen *AS*" is outlined from Bodoni Moda with an italic AS. The hero image uses the same composition at full size: an opening, a horizon and a sun on the axis. The favicon follows the system's dark mode.

## Extending the direction

**Blog.** Each post opens with a smaller spread: the title is split across the gutter, with the roman words on the left page and the italic words on the right. The cover plate sits in the arch and opens on scroll exactly as on the homepage. Cover images come from the same painter (CC0 photographs, gouache, graded to noon or dusk). The alley plate is the default cover. The body is a single centred column at about 66 characters, set in Jost 18/1.7. Figures are numbered "Fig. 1" with caption cards. Pull quotes are set in Bodoni italic. The sun switch persists, so a visitor who set the sun reads the blog at dusk. Navigating between posts uses *Shutters*: two green louvred leaves close on the centre seam, hold one beat, and open on the next page.

**Product pages.** The product's shop-front plate becomes the hero arch, and its real logo is never redrawn. The left page carries the name, the line and the status; the right page carries one figure, the facts and the address. Below the hero, sections follow the same rhythm: one painted plate, one headline with one italic phrase, and one column of text. Live products may show their own slice of the live feed in the caption card. A paused product (Harbor) can show its plate with the shutters half closed, which is honest and needs no copy.

**404 and empty states.** Show the louvred shutters, closed, and one line: *Nothing behind this door.*

## Assets and licences

All imagery comes from the kit in `assets/` (see `assets/ASSETS.md`). The painted plates are derived from CC0 Poly Haven backplates (`vignaioli`, `venetian_crossroads`), the stamps from public-domain NASA ISS photographs, and the fonts are under the SIL OFL. three.js 0.169.0 (MIT) is loaded lazily from jsDelivr for the rooftops only.

## Research notes

- Chrome's guide to scroll-driven animations (`view()` ranges, and animating only transform and opacity) shaped the arch opening. It uses a rAF-throttled scroll handler, because the effect needs pixel-exact geometry from a sticky stage.
- The WAI-ARIA APG slider pattern defines the sun's keyboard model: `role="slider"`, `aria-orientation="vertical"` and a human `aria-valuetext` ("Noon", "Afternoon", "Evening", "Dusk").
- Maxime Heckel's article on painterly shaders and the kit's gouache recipe led to the SVG turbulence displacement on the sun's edge, so the CSS disc sits in the painting rather than on it.
- Linear supplied the restraint: one easing curve everywhere, numbered figures, and the product as the hero.
- The web-search budget for this run was exhausted after the first query, so research relied on direct reading of the sources above plus the kit's own references.
