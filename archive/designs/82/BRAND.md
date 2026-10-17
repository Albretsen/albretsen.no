# Q.E.D.

*Drop 00: the company, not a product.*

## Vision

In 1847 Oliver Byrne printed Euclid's *Elements* with the words replaced by coloured shapes, so each proof could be seen rather than read. Q.E.D. presents Albretsen AS the same way, as a launch page whose release is the company itself. The homepage is a single proposition:

> MCP Emails + Fun Libs + Toolrails + Harbor = Albretsen AS

That equation sits in the hero, drawn in glyphs that draw themselves on load. Hovering a term turns the sum into that product. Below the hero, one large glyph re-proves itself as each product takes the stage (Fig. I to IV), and it ends on the Q.E.D. square. Each product is shown as a real render of its own logo on a black-glass tile, and the four tiles follow one sunrise from 05:10 to 07:00.

The brand makes its case by showing things. A visitor should come away with: *this person is exact, calm and finishes things.*

## Voice

Short declaratives, with no adjectives that have to be taken on trust. Facts appear as figures and the copy stays out of their way.

- Hero: "Software that pays for itself."
- Products: "Four products. One proof."
- Retired work: "Retired proofs (7)." Nothing is apologised for.
- Close: "Takes one outside engagement at a time."

Banned: "passionate", "hire me", "let's connect", exclamation marks, place names used for flavour.

## Colour

Black, white and **one** primary, dawn amber at OKLCH hue 72. Amber is only ever a *sun*: a sector in a glyph, the light in the crack, the status dot of a live product, the `=` in the equation. Deep amber (`#b97500`) is used for amber text on paper, for contrast.

| Token | Hex | Use |
|---|---|---|
| ink | `#0a0907` | text, strokes, hero and footer ground |
| paper | `#f9f6f2` | page ground |
| dawn | `#fea91e` | suns only |
| dawn-deep | `#b97500` | amber text on paper |
| mid | `#777471` | labels |
| line | `#dad7d3` | hairlines |

## Type

- **Geist** 300–600 for display and body. Display is tracked at −0.035 to −0.045em, and large figures use weight 300 with tabular numerals.
- **Geist Mono** 400 for labels, specs and code, set uppercase at +0.14em. This is the spec-sheet voice of a product drop.

## Mark

The mark is an apex **A** whose crossbar is a horizon with the sun on it, and whose right leg is broken and sheared (*fracture*). The monoline **ΛLBRETSEN ΛS** wordmark uses the same stroke grammar, with "AS" set in amber. The mark is also glyph `mark` in the icon system, so it can morph into any product.

## Imagery

- **Fracture** (hero): a black monolith split by a crack of dawn light. The headline stays clear of the crack.
- **Gravity** (contents): an obsidian mass bending graph paper. On the site it runs live, and the mass follows the pointer.
- **Plates**: real product logos, colour-exact, on black-glass tiles.
- **Glyphs**: 30 icons drawn on a 24-unit grid, built from strokes plus at most one sun. They are the main imagery, never decoration.
- **Byrne plates** (public domain, regraded) are reserved for about pages and long reads.

## Motion

1. **Proof Morph.** One glyph becomes the next, stroke by stroke. It shears mid-flight and its sun springs into place. This runs on the sticky stage, in the hero sum, and on the copy button (copy to check).
2. **Draw-in.** The equation strokes draw themselves 130 ms apart, then each sun rises.
3. **Gravity Settle.** Buttons and plates sink 2–3 px on hover with one soft overshoot. Hover cards drop in on the same spring.
4. **Slit of light.** The spec dialog opens from a vertical hairline of amber that widens into the panel.

`prefers-reduced-motion` turns morphs into swaps, keeps the gravity field as its still render, and skips the count-ups.

## Sound

Sound is off until the visitor turns it on in the footer. Each proof step plays a sine fifth on a rising pentatonic step, very quiet, and copying the MCP line plays one note.

## Interaction inventory (Radix-style)

- **Tooltip** on the equation terms, the status dots and the copy button.
- **Dialog** for each product's spec (the slit of light). It closes on Esc or a backdrop click and returns focus to its trigger.
- **Accordion** for "Retired proofs". Its icon is a horizon whose sun rises when it opens.
- **Hover card** on each retired coin, showing its name, line and year.
- **Easter egg:** type `qed` anywhere, or triple-click the mark. Every glyph on screen falls under gravity, piles up, and rises again at dawn. The footer hint: *Some proofs are left to the reader.*

## Extending the direction

**Blog.** Each post is a *proposition*. The header carries a post number in mono ("Prop. 12"), the title in Geist 400, and a single glyph composed for the post from the icon grammar (strokes plus one sun). Long reads can use the Byrne plates as cover art in the dawn grade, or the night grade for dark posts. Body text is Geist 17/1.65 at a 64ch measure. Figures inside posts are labelled "Fig. n" like the products stage, and every post ends with a small ∴ and one sentence that sums it up.

**Product pages.** Each product gets its own Drop number (MCP Emails is Drop 01). The hero is the product's tile render at its hour of the sunrise. Below it is a spec sheet in mono (since, status, the figure, facts) and a sticky stage where that product's glyph morphs through its features (for example `signal` → `agent` → `check`). The product's real colours stay inside its logo and screenshots. The page chrome stays black, white and dawn.

**Rules.** Use one sun per glyph and one strong idea per screen. Amber is never used for large fills. Never redraw a product's logo. Never invent a number.
