# Cloud Chamber

A cloud chamber makes something invisible visible. A charged particle passes through, the gas condenses along its path, and a precise spiral appears. Albretsen AS works the same way. Most of what the company builds runs unseen: agents reading inboxes, players finishing stories, tools being called. The brand gives that activity a visible trace and keeps the tone of a calm lab bench.

## The homepage

**Hero: a working chamber.** On first paint the visitor sees a baked three.js still: chrome letters resting on a pale rose floor (`assets/hero/hero-pile-*`, with a portrait crop on phones). After `load`, `js/chamber.js` takes over, and ALBRETSEN plus the fractured mark fall into a canvas 2D chamber simulated with matter.js.

- **Throw letters.** Drag a letter and throw it. A hard impact draws a pair of opposite-charge spirals that fade slowly.
- **Fire a decay.** Click empty space to fire a V-shaped decay.
- **Keyboard.** With the chamber focused, typing A, L, B, R, E, T, S or N kicks that letter.
- **Controls.** *Drop again*, *Gravity 0 g* (the letters drift) and *Fire a decay*.
- **Live tracks.** Live product events from `_shared/feed.js` enter from the edges as labelled tracks. Each product has its own colour and charge, so it reads as its own particle species. Every event and impact is written to the **Detector log**, a frosted panel that sets readings in mono.
- **Command.** The MCP command sits under the copy with a copy button that decodes to "Copied".

**Specimen 00, the company.** This is a dark band that opens along the logo's break line, scrubbed by ScrollTrigger. On the left is a short statement and three readings (2016, 2021, 2026) that decode into place. On the right is the live three.js mark from `assets/3d/specimen.js`. You can drag it to turn it, and hovering closes the break. Its fracture also narrows as the band scrolls through the viewport.

**Specimens (products).** Each active product appears as a plate built around its real logo, unaltered, set into a chrome dish render.

- **Layout.** MCP Emails leads at full width, followed by Fun Libs, Toolrails and Harbor.
- **Content.** Each plate shows a status chip, the year it started, the real logo next to the name, its facts as chips, and a measured figure that decodes in.
- **Interaction.** Plates settle in on scroll, tilt toward the pointer with a single chrome sheen, and have a loupe: a circular magnifier that loads the 2x render on first hover (after Aceternity's Lens).

**Reference plates.** Four CC0 objects from The Met (two weathered glass vessels and two rock crystal pieces) are graded into the rose ramp and drift at different depths. The line is "Chrome is iridescence in a hurry." The museum glass is the slow version of the same thin-film physics. Every image is captioned with its Met object number.

**Archive.** The seven retired products sit in a Radix-style accordion: each panel's height animates to a measured `--acc-h`, and the plus turns into a minus. On desktop, a preview of the stand-in render follows the pointer down the list.

**Footer.** The dark track plate and the dark physics pile sit behind "Takes one outside engagement at a time." and the email address, set in dark-chrome Unbounded.

## Voice
Scientific calm. Short declarative sentences. Numbers are written as readings ("Δv 13.7", "549 commits"), never as boasts. The labels sound like those on instrument panels: *Detector log*, *Specimen 00*, *Reference plates*, *decayed tracks*. The brand never asks for anything, and the footer's availability line is the only call.

> Shipped, measured, stopped. Each taught something the live ones use.

## Colour
Every colour is a shade of OKLCH hue 348°.

- **Rose ramp** (r50–r990) for surfaces, type and tracks.
- **Steel ramp** (s50–s950, low chroma, same hue). The chrome reflects this, so the metal reads as silver.
- **Light pages** use r50 paper and r950 ink.
- **Dark bands** run from r990 to r800.
- **Chrome gradients.** `--chrome` is for light grounds. `--chrome-dark` keeps the lower half light on dark grounds.

Product logos keep their own colours.

## Type
- **Unbounded 800** for display, figures and the mark (it is also the source of every 3D letter).
- **Geist 300–600** for reading text.
- **Geist Mono 400–500** for labels: 10–11 px, uppercase, +0.1em tracking.

## Motion
GSAP 3.13 with ScrollTrigger, plus the kit's motion study (`assets/motion.js` and `assets/motion.css`).

- **Decode** (signature): headlines and figures resolve left to right out of the glyph set ALBRETSN0–9/+·:—×.
- **Settle:** cards drop in with a small spin and one soft overshoot.
- **Tilt + Sheen**, **Film** (images arrive through a hue shimmer), **Fracture** (sections open along the break line), and **Orbit** (the loader).
- **Micro-interactions:** magnetic buttons (up to 6 px), the loupe, the archive preview, and log rows that slide in.

With `prefers-reduced-motion`, the chamber starts from the settled pile and stays still until the visitor touches it. Decode resolves instantly, and no entrance or scroll animation runs. `?settled` gives the same calm start for stills and demos.

## Sound
Sound is off by default and turned on with the switch in the nav. Impacts make a glassy ping: a sine plus a 2.76× partial, pitched and weighted by impact speed. Product events crossing the chamber make a low, very soft tick, and the archive and copy buttons make small pings. Everything uses Web Audio, with no files.

## Mark
Unbounded's A is cut along the line (−60, 500) → (1040, 280), with the upper shard shifted. The same line drives the section reveal, and the 3D specimen's hover state closes the break ("clarity") and opens it again ("fracture").

## Extending the direction

**Blog.** Each post is a "plate". The header is a full-bleed track plate generated from the post's slug as a seed (`assets/src/tracks.js` `drawPlate`). Titles are set in Unbounded and decode once, and the body is in Geist at 19 px on r50 paper. Figures, code and quotes are captioned in mono with an object number, like museum plates. Pull quotes carry a thin chrome rule. Inline images use the Film load-in. Reading progress is a single spiral track drawn along the right edge. The post list works like the Archive, with dates as readings and a hover preview of each post's plate.

**Product pages.** Each product gets its own chamber: its logo dish render as the hero object, and its live events (from the same feed) crossing as tracks in its own colour. The page follows the specimen pattern: status, since, line, a measured figure, facts as chips, and then a "detector log" of recent activity. Retired products get a quieter dark page, an archive card with the stand-in render, what it was, and the dates. MCP Emails is never more than one chamber among several.

## Assets used
The page uses everything in `assets/` (see `assets/ASSETS.md` for sources and licences): the hero pile and fracture renders, letter sprites, product dish renders, retired stand-ins, Met CC0 plates, light and dark track plates, the chrome 2016, the sticker, the numerals, the graticule pattern, the favicon, the OG image and the identity SVGs. Real product logos come unaltered from `../_shared/products/`.

## Libraries
- matter-js 0.20.0, loaded lazily by the chamber.
- three 0.170.0, loaded lazily through an import map when the company band nears the viewport.
- gsap 3.13.0 and ScrollTrigger.

All of them come from jsDelivr with pinned versions.
