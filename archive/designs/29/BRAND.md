# room 24

a brand book for albretsen as / albretsen.no. design exploration 29.

## vision

albretsen.no is a gallery room with one red wall. on it hangs everything asgeir has made since 2016: the things that earn money, the thing still being built, the paused one and the seven retired ones. nothing gets explained more than a museum label would explain it. the wall text is short and the labels are exact. the work is up there to see.

it is a room, not a pitch. visitors leave thinking "this person ships, keeps score honestly and has taste". nobody had to tell them.

the name comes from the seed hue, 24 degrees in oklch. the room is the colour.

## personality

rebellious indie. self-made and self-published, built alongside a day job, with no agency gloss. a bit cheeky about the conventions of selling yourself: admission free, no gift shop. confident enough to leave the failures on the wall.

## voice

dry understatement, all lowercase, always. sentences are short, true and slightly deadpan. the brand never says hire, connect or passionate. it only says what happened.

- hero: "i build software that pays for itself, and retire the rest without ceremony."
- feed: "live from the works below. nothing is staged. when it is quiet, it is quiet."
- silence: "quiet for 42 s. this is real."
- collection: "the retired works stay on the wall. taking them down would be marketing."
- signage: "admission free / no gift shop"
- no-js card: "silence, for now."

rules: every number comes from content.js. caption fields (artist, medium, dates, note) stay factual, and the jokes go in the wall text.

## mark

a pure wordmark: **albretsen**, lowercase, bitcount prop single at weight 760. it is custom-spaced the way exhibition titles are. the nine letters are spread edge to edge across their wall (`justify-content: space-between`), so the letter-spacing is the width of the room divided evenly. it is wide on a desktop and tighter on a phone, and always as wide as the room. the first name sits above it in text size, like a credit line.

the favicon is a single 5×7 pixel lowercase "a" in ink on the red wall (`favicon.svg`).

## colour

the wall takes the whole page. ink is the only other colour that touches it. paper only appears on ink.

| role | oklch | hex | use |
|---|---|---|---|
| wall | 0.655 0.228 24 | `#fe3c45` | every background. near the edge of srgb at this hue |
| ink | 0.20 0.06 24 | `#2c0808` | all text on the wall (5.2:1), rules, label plates |
| paper | 0.96 0.025 40 | `#ffede5` | text on ink plates (16:1) |
| faded paper | 0.80 0.05 30 | `#dcb2ab` | secondary text on ink (9.6:1) |
| wall shadow | 0.55 0.21 24 | `#d01b2d` | depth only, never text |

the wall colour also works as text on ink (5.2:1). it is used for the product name on feed labels.

## typography

one pixel family, used like a serious museum face: **bitcount** by petr van blokland. the face began in 1979 as a question about how small a readable lowercase could be, which suits an all-lowercase brand. it is self-hosted as two variable woff2 files (about 34 kb total).

- **bitcount prop single**: wordmark (wght 760), wall text (460), body (420), titles (700–760). the oblique axis (slnt −8) sets caption field names and the "medium" lines.
- **bitcount grid single** (monospaced): times, signage, status, the mcp line, tabular figures.
- the `ELSH` axis (element shape) is only used in motion. the wordmark develops from round dots to square pixels as the page fades in.

the scale is big and blunt, like wall graphics. the wordmark runs at about 15.5% of its column. wall text runs from 1.6 to 3.5 rem. object names run from 1.75 to 2.5 rem. figures run from 2.25 to 3.75 rem. the body is never smaller than 17 px.

## layout system

- a classic split: identity on the left (7 fr) and the live feed on the right (5 fr). below 960 px it becomes a single column with the identity first.
- the left column is a container (`cqi` units), so the wordmark and the wall text scale with the wall, not the window.
- 2 px ink rules divide rooms, the way vinyl lines do on a gallery wall. retired works get a dotted rule.
- the products are hung as object labels: number, name, status and year, line, medium, then the figure set large at the bottom.
- the max width is 1720 px. beyond that the wall just keeps going.

## the feed: a stack of labels

each event is a black object label. the newest hangs in front at full size: the product in wall red, the event as a two-line title, and the detail in oblique. older labels are tucked behind it and show only their bottom line (time, product, event). they recede with a 1.2% scale step. the stack has a fixed height (`card-h + (n−1) × peek`) and moves only with transforms, so nothing shifts. ten labels show on desktop and five to six on phones.

the feed is honest. the history comes from `recent(12)`, new labels arrive through `subscribe`, and the gaps are never filled. a counter shows how long it has been quiet. the orbit glyph (one pixel circling a dotted ring every 24 s) is the only sign that the page is listening.

## motion

slow and cinematic, like house lights coming up.

- on load, the signage, kicker, name, wordmark, wall text, caption and mcp line fade up in sequence, 2.2 s each with 180 ms offsets.
- a new label fades in from slightly above and the stack slides back behind it over 1.6 s. its title then types in at an unhurried 60–130 ms per character, and the detail fades in after.
- the collection labels fade up in rows of three as they scroll into view.
- with `prefers-reduced-motion`, nothing animates. labels appear complete and the orbit stops.

## sound

off until the visitor presses "sound off". everything is synthesized in web audio and no files are loaded. each typed character is a short burst of band-passed noise (2.3–3.8 khz) over a sine "thock" that drops from about 190 to 70 hz. spaces are deeper and slightly louder. it all goes through a 5.2 khz low-pass to stay soft. nothing plays while the tab is hidden. turning sound on plays two clicks to confirm.

## extending it

- **blog:** each post is a room. the title is set as wall text across the full width, and the date and reading time sit in a caption block (artist, date, medium: words). the body is bitcount prop at 20 px on the wall, and code blocks are ink plates with paper text. the post list is the "reading room", a column of labels.
- **product pages:** each product gets its own room, still red. the name is set as a wordmark across the wall, there is a caption block of facts from content.js, and the figure is set huge. the room has its own feed stack filtered to that product. retired products keep their page, with a dotted rule and a one-line reason written by asgeir.
- **other surfaces:** for email signatures and social cards, use the red wall with the ink wordmark only. the mcp line appears once per surface, unexplained, set in grid mono.
