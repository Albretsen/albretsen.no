# Plate Nocturne

*Software, developed after dark.*

## Vision

The site is a light table at night. Loose panes of glass lie over photographs that were themselves made on glass: Moussette's lightning (1886), H. A. Lawrence's eclipse corona (1883), J. A. Whipple's moon (1857–60), and Paul Henry's Cygnus star field and Lyra ring nebula (1885). All of them come from The Met's Open Access collection (CC0). The people who made these plates usually did it after their day's work, with instruments they built themselves.

Albretsen AS works the same way. Asgeir has a day job and builds apps, SaaS and agent infrastructure in the evenings. He keeps what pays for itself and shelves the rest. The brand does not say this outright. It shows it through photographs, the glass, and real numbers.

It is a technology brand whose taste comes from optics and early photography. It is not a bank or a consultancy, and it uses no machines as metaphors. The one physical idea is glass that bends light.

## The homepage

1. **Hero: the light table.** The loose panes run full-bleed (`assets/interactive/loose-panes.js`). You can drag the glass, or move it with the arrow keys, and the refraction travels with it. Clicking the dark fires a new spark, which is mirrored into each pane at that pane's displacement. A radio group with a sliding glass indicator swaps the plate on the table: Spark, Corona, Moon, Cygnus or Lyra. The swap runs inside the `seam` view transition, so the new plate opens from a hairline of amber light. Each product plate links down to the product it belongs to. The baked still `hero-refract` is the poster until the module mounts, which happens on idle after the images decode, so the first paint is instant and stable. Next to the hero sit a catalogue line (`PLATE 287289 · MOUSSETTE · 12.05.1886`), the headline, the MCP command with a copy button and an animated tooltip, and an **exposure log**: the live feed, where each new event develops in from blur.
2. **Products, intro.** A scroll-driven zoom: the `hero-plates` still opens from a small clipped plate to full-bleed while it develops from amber haze to sharp, and "Four plates in the tray." resolves on top of it.
3. **Products, stack.** The four live products are sticky glass cards (`recede`). Each card pairs the baked product still (the real logo cast in glass, in front of its plate) with HTML text: catalogue number, status, the real logo, the line, the facts, the canonical figure in Instrument Serif, and the URL as a magnetic link. Hovering the glass runs the `sheen` signature and a glass tink.
4. **Archive.** Retired products are a quiet index. A fan of etched stand-in plates sits by the heading. Hovering a row brings that product's plate along under the cursor with a lerped follow and a tilt, after motion.dev's "Cursor: Image hover". Rows are focusable, and focusing one shows its plate pinned beside the row. Luma uses its real logo on a paper ground. On touch screens the plates appear inline as thumbnails.
5. **Footer.** A seam-of-light band, Corot's 1871 cliché-verre etching at 13%, the dusk orb drifting, and the "built after hours" sticker turning slowly. Below them: "Takes one outside engagement at a time." and the email.

## Voice

The quiet operator: calm, exact, unhurried. Sentences are short. Numbers are stated once and never rounded up. There is one amber word per screen. Labels read like museum catalogue entries.

- Do: "Two earn, one is being built, one is resting. Every figure below is real."
- Do: "Not every plate develops."
- Never: "hire me", "let's connect", "passionate", exclamation marks, superlatives.

## Colour

Near-black neutrals sit on hue 48° with almost no chroma, so the darks read as an unlit darkroom. Amber `#ff7e22` (oklch 0.74 0.19 48) is the only colour, and it is rationed: one word, the ray, a figure unit or a focus ring per viewport. The photographs are all graded through the same gradient map (ink → ember → amber → cream), so they share that one accent too.

| Token | Hex | Role |
|---|---|---|
| ink-0 | #090706 | page |
| ink-1 | #120e0c | raised |
| ink-2 | #1f1917 | card |
| ink-3 | #332c29 | hairline |
| mute | #8e847e | labels |
| cream | #ede7df | text |
| spark | #ff7e22 | the accent |
| spark-hot | #ffb15c | glass edges |
| ember | #733119 | glow floor |

## Type

- **Instrument Serif Italic** for display lines and big figures, with leading of 0.86 to 0.94.
- **Geist** 400/500 for headings and body.
- **Geist Mono** 500, uppercase, tracked 0.14em at 11px, for catalogue labels, the exposure log and the command.

All three are self-hosted latin subsets under the SIL OFL.

## Motion

Lenis 1.3.23 is lazy-loaded and skipped for reduced motion. The scroll effects use CSS scroll-driven animations (`view()`, named `view-timeline`) and fall back to IntersectionObserver where those aren't supported.

- **develop**: photographs resolve from over-exposed amber haze to sharp.
- **recede**: sticky product panes sink, dim and soften as the next one slides over.
- **sheen**: a specular band crosses the glass on hover, and the image inside shifts a few pixels.
- **seam**: a view transition that opens from a hairline of amber light. Used when the plate on the table changes.
- **ray**: the mark's ray draws through both plates on load.
- Micro-interactions: magnetic nav, sound pill and links with a springy return; a sliding radio indicator; an underline that grows on nav hover; a copy-confirmation tooltip; a cursor-following archive plate.

With reduced motion, the page shows a calm static version. The zoom becomes a still image, the stack stops receding, the sticker and dots stop moving, and there's no smooth scroll. The light table is still there, but it only moves when you drag it.

## Sound

Sound is off by default, and nothing plays before a click on the nav pill. Once on, the choice is remembered, but audio never starts on its own. Everything is synthesised (`assets/interactive/sound.js`):

- **tink**: struck glass, on picking up a pane, hovering a product or archive row, or copying the command.
- **spark**: when the bolt fires.
- **slide**: when the plate changes.
- **hum**: a low drone at about -38 dB while sound is on.

## Mark

An A made of two glass plates seen edge-on, leaning together. One amber ray crosses them and is displaced inside each plate, the way light shifts through a slab of glass. The wordmark is Geist 500 converted to outlines, with "AS" in Geist Mono.

## Extending the direction

**Blog (writing).** Each post gets a plate, and the index lists posts as a catalogue: `PLATE 267137 · 19.08.2026 · Stop caring about all-time highs`. The post header uses Paul Henry's lunar terminator, or the gibbous moon for shorter notes, as a wide graded band that runs `develop` on load. Body text is Geist at 18px on ink-0 with a 68ch measure. Pull quotes are Instrument Serif Italic, with the single amber word. Code blocks sit in `.glass` panes with the 1px top highlight. Footnotes are mono catalogue labels. Moving between posts uses the `seam` transition.

**Product pages.** Each product inherits its plate from the homepage: MCP Emails gets the corona, Fun Libs the moon, Toolrails Cygnus and Harbor Lyra. The hero is the same light table with that product's emulsion under the panes, and its real logo is cast in the glass block from the product stills. The facts section is a stack of `recede` panes, with one canonical figure per pane in Instrument Serif. The page reuses the exposure log, filtered to that product's events. Retired products get a single quiet page with their etched stand-in plate and Asgeir's own one-line reason.

**Elsewhere.** The OG card is `brand/og.jpg`, the favicon is the heavy-stroke mark, and invoices and PDFs use `wordmark-on-light.svg` on paper with `spark-deep` as the accent.

## Assets and licences

See `assets/ASSETS.md` for the full inventory. The photographs come from The Met Open Access (CC0), the fonts are under the SIL OFL, and everything else was made for this direction. The product logos come from `designs/_shared/products` and are used unaltered.
