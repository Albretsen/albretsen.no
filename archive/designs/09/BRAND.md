# Afterimage

*Brand direction 09 for Albretsen AS / albretsen.no*

## Vision

The site reads like a piece of creative code: a short letter on a pixel grid, signed with a monogram, with the software's real activity in orbit around the name. Vera Molnár built strict systems and then broke them on purpose (*Interruptions*, *(Des)Ordres*). Afterimage works the same way. Everything sits on an 8 px grid and holds still, until something real happens in one of the products. Then the page moves, and only then.

Nothing here claims skill. The rings show it working, the page weighs itself in the footer, and the rest is left for the curious to find.

## Personality

Hacker cool. Understated, insider, a bit dry. It assumes you're clever and leaves things lying around for you: a comment in the source, two keyboard shortcuts, a pixel missing from the logo, an MCP command with no explanation.

## Voice

Playful and curious. Short sentences, first person, no adjectives about itself. It describes what happens and lets you draw the conclusion. Banned: "passionate", "hire me", "let's connect", and every superlative.

- Hero: "I build software, then watch what it does."
- Products: "Things I made, and how they are doing."
- Retired work: "The retired ones stay listed, because they happened."
- Screensaver: "You went quiet. The software didn't."
- Footer: "This visit: 27.4 KB over the wire, fonts aside." (measured live, never hard-coded)
- Console: "hello, view-sourcer."

## Mark

**The echo A.** A 9×9 bitmap A drawn twice: an outer stroke in ink and an inner stroke in olive (or phosphor yellow on dark) that echoes it, sharing one crossbar. The top-right pixel of the outer stroke is left out on purpose. That's the Molnár interruption and the brand's one deliberate imperfection. Never "fix" it.

The wordmark is a custom 5×7 bitmap face set in two lines (ASGEIR / ALBRETSEN) with a one-pixel phosphor-yellow echo offset down and to the right, like a misregistered CRT. It is drawn as SVG paths, so it renders before any font loads, and it's always scaled by whole pixel units (3, 4 or 5 px).

## Colour

Built on hue 84: old paper and phosphor yellow. The page **inverts between light and dark as you scroll**. The hero is paper, the products are night, the footer is paper again. Each switch happens at a hard Bayer-dithered seam, "the edge", with no gradients.

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| paper | 0.962 0.030 84 | #fcf1dc | light ground |
| ink | 0.200 0.018 84 | #1a150d | light text (16.2:1) |
| ink2 | 0.420 0.030 84 | #554c3a | secondary text (7.6:1) |
| olive | 0.500 0.100 84 | #7e5d07 | accent on light (5.4:1) |
| rule | 0.800 0.045 84 | #ccbc9d | rings, decoration only |
| night | 0.165 0.014 84 | #110e08 | dark ground |
| moon | 0.930 0.035 84 | #f3e6ce | dark text (15.7:1) |
| moon2 | 0.740 0.040 84 | #b7a98f | secondary on dark (8.4:1) |
| sun | 0.870 0.165 84 | #ffc935 | phosphor: live, figures, echo (12.6:1 on night) |

Yellow is a signal. It marks things that are alive: live statuses, figures, the newest mark in the screensaver, the echo.

## Typography

Pixel type, used seriously: set at sizes that suit its grid, with real hierarchy, never as a joke.

- **Wordmark:** custom 5×7 bitmap, in SVG.
- **Text:** DotGothic16 at 13 / 14 / 16 / 24 / 32 px, on a 8 px baseline (line heights 16 / 18 / 24 / 32 / 40).
- **Labels:** Silkscreen at 16 px only: the bar, the kicker, product names, years.
- Loaded with `display=optional`, so a late font never reflows the page.

## Layout

One narrow column, like a letter: at most 600 px wide, 16 px gutters, and everything on an 8 px grid. Press **g** to see the grid. The hero is a square stage with three dotted pixel rings at radii of 25, 35 and 45 %, drawn with the midpoint-circle algorithm. A few of their pixels are nudged one unit out of place, from a seeded random number. The name sits in the centre and punches a hole in the rings. Products are listed like entries in a log: year, name, status mark, one line, one figure.

Status marks are 4×4 bitmaps. Live is solid, building is half-filled, paused is hollow, retired is dithered (half there, fading out).

## Motion

Completely still, except the feed. When a real event arrives, every event steps one slot outward around the rings (inner ring clockwise, then the middle, then the outer). It's a stepped transform in six hard frames, like a sprite rather than an ease. With nothing happening, nothing moves, and the feed is never faked or sped up. Under `prefers-reduced-motion` events jump between slots with no frames in between.

**Screensaver.** After 30 seconds idle (or press **z**), the hero falls asleep. A full-screen night canvas shows the monogram at the centre, four faint rings (one per product), and one pixel mark for every event heard during the visit, placed by a hash of its id. It's a Molnár-style drawing built from the visitor's own session. It's still until the next event, which arrives in yellow. Any input wakes it.

## Sound

Off until the visitor turns it on (Sound off / on, top right). Everything is synthesised with Web Audio:

- Each event is a 70 ms square-wave blip, one note per product from A major pentatonic: Fun Libs A4, Toolrails C#5, MCP Emails E5, the site A5. The monogram is an A, and so is the tuning.
- All of it runs through a 210 ms delay with light feedback: the echo.
- Hovering or focusing a product plays a tiny triangle tick. Falling asleep plays a low A2.

## Extending it

- **Blog:** the same letter column. Post titles in DotGothic16 at 32 px, dates in Silkscreen, and body text at 16/24. Each post gets a small generative header: a ring drawing seeded by its slug, so every post has its own Molnár variation. Code blocks go dark (night/moon), so reading a post inverts at each block, with dithered edges.
- **Product pages:** each product gets its own ring and glyph from the feed (Fun Libs a hollow square, MCP Emails a solid one, Toolrails a plus, the site a dot). The page opens with that product's events orbiting its name, then status, figure and facts in the log style. Retired products keep a page: dithered mark, the line, the year, and the reason when Asgeir writes it.
- **Everywhere:** one pixel left out of something, on purpose.
