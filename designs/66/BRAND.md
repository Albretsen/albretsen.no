# Blue Hour Terrace (design 66)

## Vision

It is the minutes after sunset. You are under a red café awning, looking across a quiet street at a perfectly symmetric domed building whose windows are lighting up one by one. On the marble table in front of you are the products: the Harbor card, the MCP Emails envelope, the yellow Fun Libs tile, the Toolrails card and one espresso in the dead centre.

The page is one idea: **a table set for the evening**. The Wes Anderson rigour (centred framing, mirrored pairs, a fixed beat) says *effective, reasonable, exact*. The lamplight says *optimistic builder*. The scene is atmosphere for a software company and makes no claim to be a destination. It has no landmarks, no place names and no tourist words.

## The homepage

- **Hero: the diorama.** Nine baked paper sheets from the kit, re-exported as a CSS stack. Each sheet carries a soft cast shadow that I baked in, so the depth survives without WebGL. His name hangs in the sky band, in front of the clouds and behind the spire, the dome and the rooftops. The stage geometry (container query units) keeps the awning pinned to the top, the sky band open for the name, and at most 9% of the floor cropped, so the composition holds from 320 to 2560 px.
- **The Dolly.** On fine pointers, every sheet shifts a few pixels by its depth, damped and symmetric. The camera never leaves the centre line.
- **The Lamplighter.** After first paint the windows light one beat apart: the pavement first, then the street, the far row and the dome last. A brass switch ("Lamps on" or "Lamps off", using `aria-pressed`) turns them off in reverse order.
- **The table.** Every product on the table is a real link. On hover or focus, a paper tent card hinges up (rotateX from its base) with the name, the line and the real figure. The espresso is a button that copies `claude mcp add albretsen https://albretsen.no/mcp` ("the house special"). When the live feed reports an event for a product, that item gives off one stepped lamplight glint.
- **The title card** sits below the scene, centred: the line *"Software that pays for itself, laid out on one table."* with one italic in café red, the MCP command pill and a single feed line ("Lit just now") that rolls on the beat.
- **First section: the street.** A striped valance unfurls in 8 crank steps. The four storefronts from the kit come next, each with its real logo in the lit window, and they arrive by **Dolly Pan** (the left pair from the left and the right pair from the right, meeting on the centre line). Toolrails is shown half built and Harbor is shuttered. The retired products are a strip of perforated stamps, "Earlier, with thanks", with their lines on hover or focus.
- **Footer.** A zinc fish-scale roof edge, then a real blue-hour facade photograph (Unsplash, Ismael Galaviz). "Takes one outside engagement at a time." and the email are set in its sky, with the brass plaque below.

## Voice

He is an optimistic builder with a deadpan delivery. Sentences are short and figures are real (only those in `content.js`). Café language is welcome as a light frame ("the house special", "four shopfronts, one owner") and is never laid on thick. Never "passionate", never "hire me", never "let's connect".

> Each product runs on its own, earns or learns on its own, and keeps its lights on without a meeting.

## Colour

Night `#16213D`, Blue hour `#4A5F92`, Lilac `#8C8DB8`, Rose `#C9A3B6`, Peach `#F0BC9E`, Zinc `#7F8DA0`, Cream `#F5EDDF`, Paper `#FBF6EC`, **Café red `#B5373A`**, Brass `#B8924A`, Lamplight `#FFD58C`, Topiary `#2F4A4E`.

- Café red appears once per screen: the awning in the hero, one italic phrase in the title card, the valance on the street.
- Brass is for labels, rules, rings and the cursor. Lamplight is the only glow.
- The sky gradient is the only gradient.

## Type

- **Nunito** (variable, SIL OFL), a rounded and sunny sans. Display is 900 at −0.025em. Body is 500 at 1.6. Labels are 800, uppercase and tracked +0.32em, in brass. Light italic 300 is the single flourish.
- **DM Mono** is for commands, figures and the feed.

## Motion

Everything moves on one **140 ms beat** and its multiples. Transitions use `steps()` where a mechanism would tick (lamps, valance, tent cards, the cursor) and a slow-in, slow-out dolly curve where a camera would move. Nothing bounces twice. Under `prefers-reduced-motion` the parallax is off, the lamps are simply on, and every transition is instant.

**Signature delight: the Brass Ring cursor.** It is a thin brass ring with a cream dot. Over anything clickable it becomes a café-awning scallop that turns in exact 30° ticks and shows a small label ("Copy", "Visit", "Harbor"). It applies to fine pointers only, and the system cursor returns for text fields.

## Sound

There is none by default. If sound is added, it should be one opt-in toggle and a very quiet spoon-on-saucer when the lamps come on.

## Mark

`assets/brand/mark.svg` is a shopfront on a symmetric 64 grid: an awning, an arched window and an evening star. The reversed version sits on the awning and in the footer. The lockup pairs it with the outlined Nunito wordmark.

## Extending the direction

- **Blog.** The post index is a list of "tables": each post is a cream card with a brass rule, a DM Mono date and a cover. Covers use `rooftops-graded`, `facade-blue-hour` or a sky crop from the stage (avoid the plate with the distant basilica, since it reads as a landmark). The article page is a centred, 66-character column on paper. The header is a short awning valance with the title set in the sky band of a cropped diorama. Pull quotes use the light italic in café red, once per article. Code blocks use Night with DM Mono.
- **Product pages.** Each product page opens on its own storefront from the kit, full height, with the logo lit in the window. The page then sits "inside the shop": facts as a terrace receipt (`receipt-table-66.svg` is the pattern, with real figures only), features as mirrored pairs that dolly in, and changelog entries as windows that light one beat apart. Paused or building products keep their shutter or half-wound awning as an honest status.
- **About.** Use the rooftop terrace photograph as the hero, and the stamp strip as the history of earlier products.
- **Performance contract.** The hero stage is about 165 KB of AVIF at 1600 px (about 90 KB at 960). Everything below the fold is lazy. There are no libraries, and the three.js diorama in the kit stays an optional upgrade for product pages.

## Assets used

All are from the design-66 kit (`assets/`, see `assets/ASSETS.md` for sources and licences). `img/stage/` was derived from `assets/layers/`: I removed the baked lettering on the awning, baked in cast shadows and re-exported the sheets as AVIF and WebP at 1600 and 960. The footer photograph is the kit's `facade-wide` (Unsplash License, Ismael Galaviz).

Research note: the web-search budget for this run was exhausted, so the interaction research relied on the kit's reference links. The sources fetched were the dev.to layered-parallax article, the Motion magnetic-cursor article, the StudioBinder Wes Anderson guide and accidentallywesanderson.com.
