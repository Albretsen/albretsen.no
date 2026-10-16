# Cold Boot

**The site boots like a machine and lands like light through glass.**

Design 39 for albretsen.no / Albretsen AS. The asset kit (imagery, identity, motion study, interactive pieces) lives in `assets/` and is documented in `assets/ASSETS.md`, which also records the source and licence of every file. This document covers how the homepage uses it and how the direction carries to the rest of the site.

## Vision

A dark room in January, 3 pm. Low sun through a window, frost on the glass, a terminal finishing its boot. The page opens as a short mono log (`[ ok ] fun-libs 113,000+ installs`), which doubles as an index of what Asgeir runs. When it ends, the log lifts away trailing two echoes. A glow switches on and cracks into shards of spectral light (`hero/boot-focus`), and the last frame becomes live glass (`prism-field.js`): the pointer pushes a lens through it and a click sends a ring outward.

The point is the proof, not a claim. Every fringe on the page is real optics, from a spectral ray tracer written for the kit, and the live glass runs the same physics in a shader. Nobody is told he is good at this. They can see it.

## Homepage structure

1. **Boot** (once per session, skipped by any key or click, never shown with reduced motion): about 1.2 s of log, then the film, then the glass.
2. **Hero**: the name in Schibsted Grotesk 600. Under the pointer a lens lets the prism light through the letters (hover reveal). There is one line of copy and the MCP command with a copy button that decodes like a terminal. A **live log** (`dmesg`) keeps running after the boot with real-shaped events from `feed.js`. Hovering a line unfolds its hidden detail: event kind, latency, country, sha.
3. **Products** (centrepiece): the four running products as glass plates in a **spring deck**, cast from the real icons. You can drag and throw them to the back, click to turn one over (figure, facts, link) and cycle with the arrow keys. Beside it is an index. Each row hides its facts until hovered or active, and clicking a row springs the deck to that plate. A small "optics" note reveals the render parameters on hover. Below that, the seven **retired** products sit as specimen plates (Luma with its real logo), and hovering one shows what it was.
4. **Frost**: W.carter's CC0 snow crystals open through a scroll-driven aperture (CSS `view()` timeline, clip-path inset to full bleed).
5. **North**: the NASA ISS photograph of Northern Europe at night. It sits in greyscale until the LENS hover restores its amber and its file annotations. Beside it are the short bio and the day job, plus the Poly Haven moon rock in three.js. Three.js loads only when the section comes near, and you can drag the rock to turn it.
6. **Footer**: the echo still as ambient light, the availability line and the email with a dispersion hover.

## Voice

Nordic understatement. Short declaratives. Numbers instead of adjectives, and only numbers from `content.js`. No exclamation marks, no "passionate", no calls to action beyond the email itself. The machine gets the only jokes ("the boot never really ends"). Third person in the hero ("Builds software that pays for itself."), first person allowed in the blog.

## Colour

Nine warm greys tinted toward hue 36° in OKLCH (`--g-950` … `--g-50`, see `assets/motion.css`). The interface never carries hue. Colour enters only through imagery: caustic fringes, city lights, snow-crystal sparks and each product's own icon. The three fringe tokens (`--fringe-r/g/b`) are used only as 1–2 px light effects on edges: the lens rim, the flip edge, the active index marker, the sound dot and the MCP field on hover.

## Type

- **Schibsted Grotesk** (OFL; Norwegian, commissioned by Schibsted): display 600 at -0.045em, headings 560 at -0.025em, body 400 / 1.55.
- **JetBrains Mono** (OFL): everything the machine says, including the boot, the log, labels, figures and captions. Labels are 11 px uppercase at +0.08em.

## Motion

Springs everywhere: the deck (stiffness 260, damping 24), the lens on the name and the photograph, the glass lens in the shader, the stone's rotation and the magnetic chips. There are five named signatures from the kit:

- **Cold Boot** is the entrance.
- **Lens** is a hover reveal.
- **Echo** is scroll-driven headings and plates that arrive trailing two ghosts.
- **Prism Wipe** sweeps the active product detail in.
- **Dispersion** splits type toward the cursor on the email.

Lenis smooths the scroll, and CSS scroll-driven animations handle the hero exit, the caustic drift, the frost aperture and the progress hairline. With `prefers-reduced-motion` there is no boot, no film and no live glass: the still stays, springs jump to rest and scroll animations are off.

## Sound

Off until the visitor presses "sound off" in the header. After that, each live event rings a very quiet glass tick (sine, three taps decaying: the echo), pitched per product. Copying the MCP command rings one higher tick.

## Mark

The A is two prism legs. Its crossbar is a beam entering from outside the left leg and stopping inside. The mark with echoes (`mark-echo.svg`) pulses during the boot and sits in the footer. The beam redraws when you hover the header lockup.

## Extending the direction

**Blog.** Each post opens with a short boot header in mono (`[ ok ] published 2026-08-19 · 6 min`), then the title in Schibsted 600. The body is set at 18–19 px, 1.6, max 68ch, on `--g-950`, and code blocks sit on `--g-900` with a 1 px hairline. A post may carry one ray-traced still as its cover. They can be rendered per post from `assets/src/hero.py` with a seed derived from the slug, so each cover is unique and still on brand. Pull quotes use the Echo scroll signature. Footnotes open as hover cards: a Radix-style popover, origin-aware, sliding in from its side over 0.6 s on `cubic-bezier(.16,1,.3,1)`.

**Product pages.** The product's glass plate (`assets/products/<id>@2x`) is the hero. On load the plate's caustic is the only colour on the page, and it runs live through `prism-field.js` with that image as the texture. The hero has the real icon, the name and one line. The figure is set very large in Schibsted 600. Facts go in a mono list, and the live log is filtered to that product. Retired products get a smaller page built on the specimen plate and its echoes, with the year and the reason Asgeir writes.

**404 and empty states.** Use `hero/echo` with live glass and the mark-echo, and a single log line: `[ fail ] no such page`.

## Files

- `index.html`, `site.css`, `site.js`: the homepage (hero + products + supporting sections + footer).
- `assets/`: the kit. Third-party pieces are three.js 0.170.0 and Lenis 1.3.23 from jsDelivr (pinned, lazy), plus imagery from NASA (public domain), Wikimedia Commons (CC0) and Poly Haven (CC0). All of it is credited in `assets/ASSETS.md` and in the footer.
