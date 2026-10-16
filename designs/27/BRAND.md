# Full Stop

*Brand direction 27 for Albretsen AS / albretsen.no*

## Vision

A sentence is finished when it ends in a full stop. Albretsen AS is a company of finished sentences: products that shipped, numbers that are real, experiments that were retired on purpose and are still listed. The brand does not perform effort. It shows the work happening and gets out of the way.

The page is a single violet field. Nothing on it moves except the live feed. Every real event (a story completed in Fun Libs, an agent drafting a reply through MCP Emails, a deploy of this site) lands as one full stop in a constellation. Four products, four clusters, one chorus. There are no lines between the stars; the reader's eye draws them. That gap between the dots is where the tension comes from.

## Personality

The quiet operator. Competent, unflashy, obviously effective. Calm in the way a good research lab is calm: warm, literary, sure of itself. The brand never raises its voice, and it never asks for anything.

## Voice

Terse engineer. Declaratives that end in a period. Facts come before adjectives, and there are usually no adjectives. Lowercase verbs, no exclamation marks, no "passionate", no calls to action.

Sample lines:

- I build software, ship it, and keep what pays.
- Live first. Retired kept.
- Retired. Kept on the list.
- Takes one outside engagement at a time.
- quiet. *(what a cluster says when nothing has happened yet)*
- Listening. *(what the sky says before the script runs)*
- Nothing here. *(404)*
- Built at 17. No marketing. *(Fun Libs, said once and not decorated)*

## Mark

The mark is the full stop from EB Garamond, drawn from the font's own outline, not from a CSS circle (`M55 110Q33 110 16.5 93.5…Z`, a 110-unit, slightly irregular disc). It shows up at three scales:

1. **Text:** after the name, `Albretsen.`, and after the wordmark `ALBRETSEN AS.`
2. **Image:** enormous and cropped by the edge of the screen. In the hero it is in the lighter ghost violet, in the footer in the deep violet.
3. **Data:** every event in the constellation is the same full stop. The newest one is the largest.

Favicon: a cream full stop centred on a violet square with rounded corners.

## Colour

A fully saturated violet owns the page, and everything else is written on it. Hue 288 throughout.

| Role | OKLCH | Hex | Use |
|---|---|---|---|
| Field | `oklch(0.44 0.235 288)` | `#5719c8` | the page, everywhere |
| Cream | `oklch(0.96 0.022 85)` | `#f9f1e2` | the voice: name, text, newest stars (7.9:1 on field) |
| Lavender | `oklch(0.84 0.075 295)` | `#cdc1f7` | second voice: meta, facts, labels (5.3:1) |
| Ghost | `oklch(0.52 0.22 288)` | `#6a43dd` | type used as image, above the field |
| Deep | `oklch(0.33 0.17 288)` | `#381285` | type used as image, below the field |
| Dim | `oklch(0.70 0.12 292)` | `#a090e3` | far stars only; decorative, never text |

Hover and focus invert the colours: a cream block with violet type. That is the only highlight state.

## Typography

One family, set like a book: **EB Garamond**, self-hosted and subset to Latin with its full OpenType set kept (Google's hosted copy strips these features).

- **Old-style figures** everywhere (`onum`). Numbers sit in the text like words: 2016, $782, 113,000+.
- **True small caps** (`smcp` + `c2sc`) for labels, statuses, product names in running text and the wordmark, tracked +0.07–0.09em.
- **Italic** is the display voice: the second line of the name, the sentence, the figures, and the giant collage words.
- No monospace. The MCP command is set in the book face with lining figures, small and lavender, with `user-select: all`.
- `font-display: optional` with preloading, so text never swaps after it is drawn and the layout never shifts.

## Layout

Type is used as image. Each section has two layers:

- **Collage layer:** one huge word or figure in ghost or deep violet, cropped by the edge (`albretsen` in the hero, `work` behind the products heading, each product's figure behind its name), and the giant full stop.
- **Reading layer:** cream and lavender text placed over it with clear contrast. The layers overlap on purpose: the descender of *Asgeir* falls into *Albretsen*, and the figure `$782` sits behind the words *MCP Emails*.

**No borders, rules or lines anywhere.** Structure comes from space, scale and tone. The constellation has no connecting lines, cards have no outlines, links have no underlines (links are marked by small caps and a trailing arrow, and invert on hover and focus).

Products use a two-column grid with the second column dropped by a step, like facing pages that do not quite align. Retired products are set as a run-in paragraph, like the index of a book: name in small caps, year in italic old-style figures, one line.

## Motion

Completely still, except for the feed. The page has no scroll effects, no hover transitions and no entrance animation. A new star fades in over 900 ms. Under `prefers-reduced-motion` it simply appears. When an event arrives, the previous newest star steps down in size and the cluster's label changes line. Those are the only changes on the page, and they happen only when something real happens. The feed is never faked, looped or sped up.

## Sound

The page is silent. The sonic logo, for video, app launch and the end of a talk, is **a full stop you can hear**: one soft felt-piano note on D, about 0.4 s, with a quiet sung voice a fifth above (A) entering a few milliseconds later and released together. A note and its chorus. Dry, with a short room tail, and no rise or swell. It ends the way a sentence ends.

## Extending the system

- **Blog:** the same violet field at reading measure (about 34 ch, roughly 21 px Garamond), with the title in italic display size and a giant cropped old-style date behind it in the deep tone as the collage layer. Footnotes rather than callouts, small caps for names, and every post ends with the full stop mark in cream.
- **Product pages:** each product keeps the field but owns its figure: Fun Libs' `113,000+` or MCP Emails' `$782` fills the hero as type-image. Below it, that product's own cluster from the constellation shows only its events. Facts are set as a run-in paragraph, never as bullets. Status is shown with the status dot: cream for live, lavender for building, dim for paused.
- **Retired products** get a single page each with one line written by Asgeir. They are never removed.
