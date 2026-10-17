# Six Faces (design 90)

**One idea:** a die that only lands on true numbers.

## Vision

Albretsen AS is shown as an ultramarine nocturne. Real photographs (an aurora over the sea, a figure on a rock above a valley, tyre tracks in snow under a street lamp, Northern Europe from orbit, the Earth's city lights at night) are graded through one OKLab ramp, so the whole site reads as one saturated colour: field ultramarine `#0159d4`. A single warm light, sodium amber, marks what matters.

The hero is the **Honest Die**, a cube built only from CSS 3D transforms. You grab it, spin it and throw it. It bounces off its frame, loses energy and lands square, on a Motion spring, on one of six real numbers: $782 MRR, 113,000+ installs, 4 connectors, 549 commits, 7 retired, 2016. **The die chooses the scene.** Whichever number lands face up, the photograph behind the name develops into that number's scene, top-down behind a sodium scan line. The readout under the name then says in one plain sentence what the face could not fit.

The page stays uncluttered: a photograph, the name set huge across the horizon, the die in the sky, one line and one readout. Products follow on the field colour, then the retired list, then one photographic interlude for agents, then the footer.

## Voice: brutal honesty, said calmly

- Numbers first, exactly as they are. Never round, never pad, never say "over" when the number is exact.
- Status is printed as plainly as revenue: live, building, paused, retired.
- Nothing is removed to look better. Retired products stay on the page with a line through them.
- Short declaratives, no adjectives that need a number to back them.
- Examples: "Some of it does. The die says which." · "Harbor stopped at 549 commits. Paused, not pretended." · "Four in play. Seven retired. All of them listed."
- Banned: hire me, let's connect, passionate, any "world-class" or "cutting-edge" language.

## Colour (OKLCH, seed hue 252)

| Token | Hex | Use |
|---|---|---|
| night | #000a2a | deepest ground, footer, shadows |
| deep | #00226c | nocturne page background |
| **field** | #0159d4 | the colour that owns the page: products section, die body |
| seed | #0587f0 | accents in illustrations |
| electric | #52a9fe | links, vectors, highlights |
| mist | #d3e7fe | secondary ink on dark, day footer |
| paper | #f1f8ff | day page, type on dark |
| sodium | #ffb250 | the only warm light: pip, scan line, kicker, "retired" tag. Never a block. |

Day theme: paper ground, deep ink, photographs printed as ultramarine negatives (the aurora has its own graded day print; the rest are inverted in CSS). In day the sodium kicker darkens to `#b45f00` for contrast.

## Type

- **Archivo** variable (wdth 62 to 125, wght 100 to 900), self-hosted, Latin subset. The name and numbers use wdth 125, wght 800, tracking −0.045 to −0.05em. Headings use wdth 112, wght 700.
- **IBM Plex Mono** 400/500 for body, labels, facts, kickers (uppercase, 0.08 to 0.12em tracking).

## Motion

Principle: **physical, then exact.** Things move with real inertia and always come to rest square and precise.

1. **Throw & Land**: the hero die (quaternions, wall bounces, Motion spring stiffness 260 / damping 17). At rest it is tilted 30° so it always reads as an object, not a card.
2. **Develop**: a scene or photograph develops top-down from flat ultramarine behind a sodium scan line (1.05 s for hero scenes, 1.6 s for interludes).
3. **The Turn**: the theme switch. The page turns 90° like a cube face through a sodium-lit void (View Transitions), and the tiny cube in the switch turns with it. The day print of the hero is decoded before the turn starts, so the new face is never blank.
4. **Honest Count**: numbers count up and stop dead on the true value, then a sodium rule draws under them. The width is reserved first, so nothing shifts.
5. **Redact**: retired names get a line drawn through them (per line, so long names wrap cleanly), then "retired" fades in.
- Micro-interactions: nav underlines that wipe in from the left and out to the right; the brand mark turns 60° on hover; retired die faces turn 90° on hover; die photos ease in by 3.5%; a sodium ping on each new feed event; a copy button that confirms "Copied".
- `prefers-reduced-motion`: no flight (Space steps to the next face), scenes switch instantly, no view transition, counts and redactions show their end state.

## Sound

Off until the visitor turns it on. Then one soft wooden knock (a short sine drop plus a band-passed click, Web Audio, no files) each time the die lands. Nothing else makes a sound.

## Mark

An isometric die seen from its corner: paper top, ultramarine sides, one sodium pip for the one number that matters. It is paired with an outlined Archivo wordmark (ALBRETSEN AS). The favicon is the die on a rounded field tile.

## Interaction and accessibility

- The die is a focusable button: Space or Enter rolls it, and every landing is announced through a polite live region.
- Only the die captures touch; the rest of the hero scrolls normally on phones.
- Each product die photo has a "Turn it" button that loads three.js on demand and keeps that die live and draggable. Only one is live at a time, and "Still" returns to the baked image.
- Layout shift 0: every image has width and height, the hero is a fixed-height frame, and counted numbers reserve their width.
- Performance: the first paint is the aurora AVIF (responsive 640 to 2560), two fonts, the CSS and the CSS-3D die. Other scenes load only when the die is first grabbed; Motion loads at idle; three.js loads only on "Turn it".

## Facts

Every figure comes from `designs/_shared/content.js`. The product HTML is written statically for fast first paint, and `site.js` checks each card's figure and status against `content.js` at runtime (a console warning on any mismatch).

## Extending to the blog

- **Cover images:** every post gets one photograph graded through the same OKLab ramp, so the blog index reads as one ultramarine contact sheet. A post that is about a number gets a die face as its cover instead.
- **Article page:** paper or deep ground, Plex Mono body at 16 to 17 px with a 64ch measure, Archivo 112/700 headings. Every number in a post can be wrapped in a `.count`, so it counts once and gets the sodium rule as proof it is exact.
- **Pull quotes:** set in Archivo 125/800 with no quotation marks, followed by a sodium pip.
- **Theme:** the same Turn switch; an article's cover flips to its negative print.
- **Endings:** no call to action. Posts end with the date, the facts used, and the line "Takes one outside engagement at a time."

## Extending to product pages

- The hero is that product's die, live in three.js (`assets/3d/die-scene.js`), on a field sweep, with the real logo on the paper label. The page opens with its one number, counted.
- The status chip (live, building or paused) sits at the top, exactly as on the homepage.
- Facts become sections: each fact is one die face, unfolded with `extras/die-net.svg` as the page's outline.
- A changelog uses the redact motion for removed features, which stay listed with a line through them.
- Retired products get a short page: their die face with pips, the year, what it did and why it stopped. The reason is written by Asgeir, never invented.

## Sources and licences

The photographs are CC0 (Unsplash via Wikimedia Commons) or public domain (NASA). The full inventory, with source URLs, is in `assets/ASSETS.md`. The fonts are under the SIL OFL 1.1. three.js@0.185.0 and motion@13.4.6 (MIT) are loaded from jsDelivr, pinned, and lazily.

Research note: the shared web-search budget for this run was used up before this agent's searches could run, so research came from fetching pages directly (Aceternity components, the Motion `animate` docs, the Chrome View Transitions guide), plus the kit's own research.
