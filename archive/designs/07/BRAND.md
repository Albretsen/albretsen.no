# Blue Hour

Brand book for albretsen.no / Albretsen AS. Direction 07.

## Vision

A festival bill, set as a quiet document. The products are the acts and the type size is the running order: what is live is billed largest, what is being built comes next, and what is retired stays on the bill in small print. The page itself reads like a well-made document with wide margins. The numbers sit in the margin, and in the other margin the products talk to each other in a group chat. It should look expensive because almost nothing is there: one hue, one typeface, no lines.

## Personality

Luxury restraint. It carries confidence in its scale and says little. It never decorates, explains or asks for anything. It counts.

## Voice

Numbers first, adjectives never. Every sentence leads with a figure or a year, then says as little as possible.

- "2 live. 1 building. 1 paused. 7 retired. Since 2016, software built to pay for itself."
- "1 outside engagement at a time."
- "11 on the bill."
- "7 retired, still on the bill."
- Feed: "412 ms. An agent drafted a reply." / "1 story finished. Brazil." / "11.8 KB. Deployed 3fa9c1e."

Banned: adjectives that praise, calls to action, "passionate", "hire", "connect". When in doubt, delete the sentence.

## Mark

A pure wordmark: lowercase **albretsen** in Nunito 800, with spacing set by hand per letter. The `a` and `l` sit tight (0.05em), the spacing opens through `b r e t` (0.20 to 0.24em), then runs even to the `n`. On hover the spacing widens by 60%, as if the word took a breath. There is no symbol. The favicon is the same rounded `a`, built as one bowl and one stem in bloom blue on night.

## Colour

One hue, OKLCH 252°, nine depths. Nothing else, not even for status.

| Token | OKLCH | Hex | Use |
|---|---|---|---|
| ink-0 | 0.14 0.035 252 | #010917 | night, page |
| ink-1 | 0.18 0.045 252 | #031225 | glow at the top right |
| ink-2 | 0.23 0.06 252 | #041d38 | Toolrails bubble, buttons |
| ink-3 | 0.29 0.075 252 | #092c4f | MCP Emails bubble |
| ink-4 | 0.37 0.09 252 | #16416d | Fun Libs bubble, selection |
| mist | 0.66 0.07 252 | #7395bc | marginalia, small print (about 6.5:1 on night) |
| haze | 0.78 0.06 252 | #9cbbdd | secondary text |
| bloom | 0.82 0.11 252 | #8fc9ff | the one bright thing: figures, the site's own voice, focus |
| paper | 0.95 0.02 252 | #e5f0fc | primary text |

Status is never shown with a colour. It is written as a word, and the tier sets its size.

## Typography

**Nunito**, variable 200 to 1000, self-hosted as one latin file of 39 KB. It is rounded and humanist, with a friendly face at poster weight. The whole range is used as a hierarchy:

- Name: "Asgeir" at 260 over "Albretsen" at 1000, sized in container units (about 17cqi) so it fills the column edge to edge at any width.
- Headliners (live): 950, 14cqi. Second tier: 800, 8.5cqi. Retired: 800 at 1.12em.
- Text: 500 to 520. Figures: 850 to 900, tabular.
- The single MCP line is set in the system monospace, dimmed, and left unexplained.

Tracking tightens as weight rises (-0.035em at black).

## Layout

The page is a document on a three-column sheet: a left margin (minimum 9rem), a main column (3fr) and a right margin (1.45fr), with gutters from 16px to 9rem. Every section uses subgrid, so the margins line up from header to footer.

- Left margin: dates, figures and counts. This is where the numbers live.
- Main: names and statements.
- Right margin: the chat, the one-line descriptions and the email.

There are no borders, rules or lines. Separation comes from space, scale and depth of blue, and focus is shown as a bloom-blue fill. Below 64rem the three column lines merge into one and the marginalia fold into the text as wrapped rows.

## Motion

Kinetic typography, on weight rather than position:

- On load, the name blooms from hairline to black (200 to 1000) while its tracking closes, in 2 s.
- Products further down the page wait at 220, faint and in bloom blue, and swell to full weight as they come into view.
- New chat messages swell out of the corner of the bubble. Each word comes out of a blur in turn, and the leading number arrives with a short glow.
- Bubbles stack with transforms only, so the page never shifts.
- Under reduced motion everything is static and final.

The feed is honest. It moves only when something really happens, and at night it is quiet.

## Sound

Off until the visitor turns it on. Synthesised with Web Audio, with no files.

- A drone in D (D2, A2, D3, A3, slightly detuned) runs through a lowpass filter that breathes every 22 s.
- Activity opens the filter. Each event adds to the activity level, which decays by 10% every 6 s, so a busy hour sounds brighter than a quiet one.
- Each event plays one soft note from D major pentatonic, with the register set by product: Toolrails low, MCP Emails in the middle, Fun Libs high. A deploy of the site plays a quiet fifth.
- A generated 3.2 s convolution reverb is the room.

## Extending

- **Blog:** the same sheet. The title is set at poster weight in the main column, the date and reading figures go in the left margin, and the right margin holds true sidenotes (Tufte-style, folding inline on mobile). Body text is Nunito 500 at a 66ch measure. Pull figures are set in bloom.
- **Product pages:** each product gets its own bill. Its figure is billed huge in bloom, its facts are listed as a numbered set in the margin, and its own events from the feed appear as one sender in the chat. The colour stays at hue 252. Products are told apart by depth and voice, never by a new hue.
- **Social and OG images:** night background, the name at 1000 weight running edge to edge, one figure in bloom.
