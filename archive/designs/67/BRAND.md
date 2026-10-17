# Amber Hour

> Software with a long view.

## Vision

It is the hour before the lights come on. Stucco and golden stone hold the last warm light, and the sky goes from mauve to peach above stepped towers and zinc roofs. Two architectures share one grade here. One is the pastel deco of a beach city, with fins, ziggurats and eyebrow ledges. The other is the Haussmann street, with shutters, iron balconies, mansards and arcades. Neither is named. Both are simply *architecture in good light*.

That is how Albretsen AS wants its software to feel: built with care, symmetrical where it counts, and calm enough to let the work speak. The brand doesn't claim taste. It shows taste in the framing, the grade and the patience of the motion.

**The idea:** every image is a postcard from the amber hour, and the company *sends* you its products. MCP Emails arrives as a stamp, Fun Libs as a blade sign, Toolrails as a plaque, and Harbor as a lit window.

## The homepage

1. **The hero is a postcard you don't know you're holding.** The page opens on a full-bleed dusk: two deco towers, a low sun and the name set large in the sky. On wide screens the sky is a live WebGL shader behind a transparent cut-out of the towers. When you scroll, the camera pulls back in one smoothed move, and the evening shrinks into a printed card with a paper border, lying on cream card stock. The sun sinks a little as you go. Keep scrolling and the card lifts and turns over (`translateZ` lift and a shadow that narrows with the card). On the back is a short handwritten note, the address block and a stamp.
2. **The easter egg** is under the stamp. Drag the stamp off, or focus it and press Delete, and the microtype underneath reads `claude mcp add albretsen https://albretsen.no/mcp` with a copy button. Nothing points to it, but the stamp has a grab cursor.
3. **The postmark is live.** The back of the card is "franked" by the latest event from the live feed (for example, *Franked 21:04 · MCP Emails · agent drafted a reply*). It updates at most every four seconds, with a small ping.
4. **"Currently in the post"** lists four products as photographic plates on a calm four-column grid, staggered like cards laid on a table. Each one shows its real logo inside the scene, plus status, year, the one figure from `content.js`, its facts and a horizon link. Below them, **Cancelled stamps** shows the retired products as an album of franked stamps. There is a single caption line under the album, and hovering, focusing or tapping a stamp swaps the line gently.
5. **The footer** is the sunrise horizon, with the availability line in Bodoni italic and the email.

## Voice

Unhurried, exact, written by hand to one reader. Short declaratives with no superlatives. The brand states facts and lets the numbers sit in Bodoni. It never asks for anything.

- *"I build software that pays for itself: apps, SaaS, and the quiet infrastructure AI agents run on."*
- *"Each one is a business on its own terms: shipped, measured, and kept only while it earns its place."*
- Banned: hire me, let's connect, passionate, any place name, any greeting in another language.

## Colour

One amber family from cream to night umber. Every photograph passes through this same gradient map. Mauve and rose appear **only in the sky** and in the postmark ink.

| Token | Hex | Use |
|---|---|---|
| cream | `#FFF6E6` | page, card stock, reversed type |
| linen | `#F8DFB6` | quiet fills |
| apricot | `#EDBF84` | sunlit stone |
| amber | `#D18E4A` | the sun, live dots |
| sun-ink | `#B8642A` | links (about once per screen) |
| sienna | `#6E3816` | secondary text |
| umber | `#3B1D0E` | body text |
| night | `#1E0F08` | footer, deepest shadow |
| peach / rose / mauve | `#F2B68A` `#C98478` `#5E4A6E` | sky only |

## Type

- **Bodoni Moda Italic** (500, −0.02 em) is the voice: one serif line per screen. That means the name, the section title, the note on the card and the availability line.
- **Bodoni Moda Roman** is for numbers: $782, 113,000+, 549. Figures in a Didone feel engraved.
- **Schibsted Grotesk** is all working text. Labels are 600, 11 to 12 px, with +0.24 to 0.34 em caps. It is a grotesk drawn for a Norwegian newsroom, a quiet nod to home.
- **ui-monospace** appears only for the hidden install line.

## Motion

**One camera, no cuts.** Each page gets exactly one continuous move, smoothed with roughly a second of easing, like a crane on a rig.

- *The Long Take*: the hero pull-back and turn on the homepage, or a dolly down the arcade on longer pages.
- *Exposure*: photographs develop from blown-out to the final grade as they arrive. The develop hides the decode, so nothing pops.
- *Horizon link*: the underline is a horizon, and a small sun rises out of it where the pointer enters.
- Micro: product plates lift 6 px with a patch of warm light that follows the pointer, and cancelled stamps straighten and rise.
- Under `prefers-reduced-motion`, nothing is pinned. The hero is a still evening, the card sits face up on the table below it, and images appear at their final grade.

## Sound

Silent by default. The opt-in idea is one soft paper turn when the card flips over, and nothing else. There is no ambience.

## Mark

An arch drawn with Bodoni stroke contrast. Its crossbar is a horizon with the sun sitting on it. The wordmark is "Albretsen" in Bodoni Moda with a small "AS" in Schibsted Grotesk, kerned with HarfBuzz and converted to paths. Over the sky it reverses to cream, and when the camera pulls back onto paper it cross-fades to umber.

## How it extends

- **Blog.** The writing index uses the zinc-roofs plate as a single cover image, followed by a plain list of posts in Bodoni italic titles with dates in grotesk caps. Each post has one graded photograph at the top, chosen from the kit or graded through the same amber map, with the sky regenerated. Body copy is Schibsted 18/1.6 on cream with a 66-character measure. Pull quotes are set in the italic, and code blocks sit on linen with an umber monospace. A post ends like a postcard, with a small signature, the postmark and the date.
- **Product pages.** Each product's hero is its own plate (stamp, sign, plaque or window), shown full-bleed with the real logo inside the scene. The page then runs as one Long Take: a single slow push toward the product's object, followed by a calm two-column fact sheet with the one Bodoni figure, the facts, and screenshots set as prints with a cream border. Status uses the same small dots everywhere: amber for live, an outline for building and faded sienna for paused.
- **About.** The facade card is the postcard front, and the WPA arch poster serves as ephemera. The "one outside engagement at a time" line closes every page.
- **New products** get a new architectural object in the same light: a door, a lantern, an awning or a tile. The real logo always appears unchanged, and the object is always photographed frontally and centred.

## Performance

The first paint needs one hero AVIF (about 40 KB at 1600 px, 14 KB at 1024), the paper texture, the wordmark SVG and two preloaded fonts. The WebGL sky and the tower cut-out load only after the `load` event on an idle callback, and only on wide screens. Every image has width and height (or a fixed aspect ratio), which keeps layout shift at zero, and every image below the hero lazy-loads.

## Sources

All photographs are public domain or CC0, graded in house. The two building plates are Carol M. Highsmith's Miami Beach photographs (LOC, public domain), the facade and arcade are Commons photographs released to the public domain, and the roofs are CC0. The fonts are under the SIL OFL. The full inventory is in `assets/ASSETS.md`.
