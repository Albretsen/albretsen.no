# Bitspark

A 1-bit desktop where every product sings its own note.

## Vision

Albretsen AS is one person shipping many things at once. Bitspark shows that as a working desktop, not a portfolio: a System 7 screen in black ink on white paper, with one crimson spark for anything that is live right now. The live feed is the hero. It shows one event at a time, set huge, and a four-lane **chorus** beside it shows how the products play together. The grid stays visible because the structure is part of the work. Leave the page for 30 seconds and the hero goes dark and turns into a screensaver, the way the computers it borrows from did.

The aim is the feeling of opening a machine that someone looks after well: everything aligned, nothing extra, and plainly in use.

## Personality

Optimistic builder. Bright, quick and forward-looking. It finds the work fun and says so by doing it, not by claiming it. Exact without being cold, and playful only in the details: a beep, a pixel, a toaster-era screensaver.

## Voice

Terse engineer, upbeat. Short declaratives in the present tense, with numbers only where content.js has them. No adjectives about himself, no pitch, no calls to action.

- "Ships software that pays for itself: apps, SaaS and AI-agent infrastructure, on Google Play since 2016."
- "One product, one note."
- "Retired. Kept on purpose."
- "idle > 30 s. input wakes."
- "Status, start year, one figure."

Banned: hire me, let's connect, passionate, any superlative he didn't earn in a number.

## Mark

A 16 x 16 pixel **A** drawn the Susan Kare way, one square per pixel on graph paper. It has a stroke two pixels thick, a closed counter and a flat crossbar. A five-pixel plus-shaped **spark** in crimson sits at the top right, off the shoulder of the A. It was drawn for the browser tab first (`mark.svg`, `shape-rendering: crispEdges`, on a white tile so it survives dark tab bars) and is only ever scaled by whole multiples: 16, 32, 64, 128. It never gets anti-aliasing, outlines or a gradient. Lockup: the mark followed by "Albretsen AS" in Silkscreen at 16 px, the same way the menu bar shows it.

## Colour

The rule is high-contrast black and white plus one primary, built on OKLCH hue 12°.

| Token | Hex | OKLCH | Use |
|---|---|---|---|
| ink | `#000000` | oklch(0 0 0) | type, rules, the grid, selection |
| paper | `#ffffff` | oklch(1 0 0) | every surface |
| spark | `#e00655` | oklch(0.58 0.23 12) | live things only: the current event, Live status, the newest chorus pixel, the spark in the mark. 4.85:1 on paper |
| spark-hi | `#fa2564` | oklch(0.64 0.24 12) | the same spark on ink (screensaver, inverted selections). 5.52:1 on ink |

There is no grey. When a tone is needed, use a 1-bit 50% checker (`--dither`), the System 7 way. Retired status is a dithered square, Building is a crimson dither and Paused is a hollow square. Hover and focus states invert to black, like a Finder selection.

## Typography

- **Anybody, width 150, weight 800**: the ultra-wide display face, always uppercase. It sets the name, the live event, section titles and product figures. Sizes come from the container (`cqi`), so a word always fills its cell: the name is sized so ALBRETSEN fits, and the event is sized so AUTOMATION fits, with a JS fit step that only ever shrinks.
- **Silkscreen**: a true bitmap face standing in for Chicago in the chrome (menu bar, window titles, chips, cell coordinates). Used only at 8 or 16 px, so every pixel lands on a pixel.
- **IBM Plex Mono 400/500**: body text, data and the MCP line. It is the engineer's voice.

## Layout system

There are three columns: a 3 rem **ruler**, one wide **work** column, and a narrow **side** column (`minmax(17rem, 0.42fr)`). The grid is deliberately asymmetric, roughly 70/30. The lines are real: each grid is drawn with a 1 px gap over an ink background, so every cell border is a true grid line. Cells carry small spreadsheet-style coordinates (B1, C2...). Rulers number the sections 01, 02, 03. Content sits inside System 7 windows: a striped title bar, a close box and a 2 px hard shadow. The product grid is a 12-column field with asymmetric spans (7/5, 4/8). Retired products are listed in a Finder list-view window, still visible and kept on purpose. Below 860 px the layout collapses to one column and the ruler is hidden.

Every live region has a fixed height (three lines of event text, fixed head and foot rows), so nothing shifts when events or fonts arrive.

## Motion

Controlled glitch. The page is completely still until a real event arrives. Each event then gets one 360 ms pass: the text is cut into horizontal bands, offset by fractions of an em in `steps()`, an ink ghost and a paper dropout flash through it, and a 1-bit dither wipe crosses the window for two frames. Then it holds dead still. There are no loops and no idle shimmer, and the feed is never faked or sped up. In quiet hours the page is quiet. `prefers-reduced-motion` removes all of it: events swap instantly and the screensaver draws one still frame.

**Screensaver**: after 30 s with no pointer, key, scroll or focus input, the hero inverts to ink. Pixel sparks (4 px plus shapes) drift down and to the left at 12 fps, on purpose. The current event floats in spark-hi and moves to a new spot with every event, so nothing burns in. Each event sends a crimson ring of sparks out from the text. Any input wakes it. Drawing pauses when the hero is off screen or the tab is hidden.

## Sound

The feed is sonified, and sound stays off until you turn it on from the menu bar. Each product has its own square-wave note, the Mac's own 1-bit beep, put through a gentle lowpass filter and a short envelope at low volume:

| Product | Note |
|---|---|
| MCP Emails | C5 |
| Fun Libs | E5 |
| Toolrails | G5 |
| albretsen.no | C6 |

Together they form a C-major chord, so a busy afternoon sounds like a chorus. Installs and newly connected inboxes add a fifth above, and a deploy plays a short rising chord. Everything is synthesised with Web Audio, with no audio files.

## Extending it

- **Blog**: each post opens in a window titled with its slug, set in Plex Mono at reading width inside the work column. The side column holds the date, reading time and a chorus strip of the product the post is about. The H1 is Anybody wide and sized to its cell. Pull figures appear in Anybody, and code blocks get the striped title bar.
- **Product pages**: the hero is the same one-event window filtered to that product, playing only its note. The figure is shown huge in the side column and the facts are listed Finder-style. Status uses the same pixel square everywhere. Retired products get an honest page in the same chrome with a dithered status, never hidden.
- **Social cards and OG images**: a 1200 x 630 desktop with one window, one line in Anybody and the mark at 128 px.
- **Favicon and app icons**: the mark at whole-pixel multiples on a white tile, with no rounding beyond what the platform imposes.
