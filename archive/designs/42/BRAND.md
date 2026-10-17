# Same Room · design 42

## Vision

There is one room, and it has been the same room since 2019. On the left half it's a lilac bedroom at dusk: a small desk, a laptop, a phone showing the Fun Libs v4 icon, a sprout and one butter block hovering. That's where Fun Libs was built at 17. On the right half it's the same four walls in daylight, now a studio. An ultrawide shows MCP Emails, the sprout has become a tree, a lattice shelf holds the four live products as cubes with their real logos, and an agent robot carries a letter.

The two renders line up pixel for pixel, so the edge between them is a control. Drag it, or use the arrow keys, and it scrubs through real milestones from content.js. 2016 is the first Play Store app, 2019 is Fun Libs, 2021 is consulting and the early utility apps, then Tryggere Hyring, WebVakt and Joke Central, Polyglot Pilot and PinPoint, and in 2026 Albretsen AS. Each milestone shows the stand-in voxel or real icon of what shipped that year. As the edge moves it sheds pastel blocks that drift up and fade.

The person this describes is an optimistic builder. Nothing on the page is broken and nothing is finished, and the leaf-green "next block" is always on its way in. The craft makes the argument: code-baked voxel renders, a voxel engine built only from CSS 3D transforms, and springs on everything. The copy never has to claim skill.

## Voice

- Plain, sunny and concrete. Say what was built and what it did, using the real figures, then stop.
- Short declaratives with no superlatives. Don't sell, and leave out "hire me", "let's connect" and "passionate".
- Years and facts go in Geist Mono, like labels on blocks.
- Example lines: "Same room. Bigger builds." "Four blocks, placed." "Taken off the shelf." "Takes one outside engagement at a time."

## Type

- **Bricolage Grotesque** (variable, optical size). Display is 800 with −0.045 to −0.05em tracking and line height around 0.92. Body is 400/500.
- **Geist Mono** 400/500 for chips, years, facts, the feed, commands and captions.
- **Pixel letterforms** are artwork only: the wordmark and stickers from the kit, never running text.

## Colour (OKLCH, seed hue 96°)

| Token | Hex | Role |
|---|---|---|
| mist | #fefaed | page |
| cream | #faf4da | panels, footer |
| lime | #fee891 | primary pill, highlighter, the seam knob |
| pollen | #f3d761 | the brand butter (mark, plinths) |
| butter-deep | #d8b736 | hard voxel offset shadows |
| leaf / moss | #a5ce6f / #6d944b | "new", live, the next block |
| ink | #2b3116 | text (olive, never grey) |
| sky, lilac, blush, peach | #bae5fd, #daccf7, #fcbfc2, #fed0b2 | room colours and product tints only, never headlines |

Each product has a colour: MCP Emails is sky/azure, Fun Libs is blush, Toolrails is lilac and Harbor is butter. A card's hard offset shadow uses its product's colour.

## Motion (Motion 12 springs, vanilla)

1. **Edge Drift**: the hero seam follows the pointer on a spring (220/26) and sheds 6 to 14 px voxels that drift up and fade. On load it plays a short intro sweep to 2019, then to today, then settles in the middle.
2. **Magnetic Pull**: every pill, the email and the product links lean toward the cursor within about 90 px. The label leans further for parallax. It's off on touch.
3. **Stack Drop**: product cards fall into place on a 380/18 spring with a 70 ms stagger. The CSS 3D shelf and footer mark assemble the same way, lowest layer first.
4. **Block Lift**: a card rises one voxel unit as its hard shadow doubles. Shelf cubes lift half a unit on hover and scroll to their card on click.
5. **Layer Unstack**: the "Taken off the shelf" accordion uses Radix's `data-state` and `--radix-accordion-content-height` contract. Its rows restack one by one with a small rotateX.
6. **Idle Bob**: clouds, stickers, the robot and the mug breathe on 5 to 9 s loops.
7. **Scroll-driven drift**: the drift-blocks between hero and products rise and tilt through `animation-timeline: view()`, behind `@supports`.

With `prefers-reduced-motion` there's no intro sweep, no shedding and no bobbing or drops. The seam jumps instead of springing and the 3D models appear assembled. The page stays fully usable.

## Sound

Sound is off until the visitor turns it on in the header. After that, a short triangle-wave "block click" plays when the seam crosses into a new year (its pitch rises with the year), when a shelf cube lifts, when cards land and when the accordion opens or closes. There's no ambient bed.

## Mark

The mark is a 2×2×2 butter block with its front corner missing and a leaf-green block dropping into the gap. There's always one more piece on the way. The lockup sets it beside the pixel wordmark "albretsen" with a butter voxel extrusion and "AS". In the footer the mark is a live CSS 3D voxel model you can orbit; double-click it or press "drop the next block" and it drifts apart and stack-drops back together.

## Extending to the blog and product pages

- **Blog index**: each post is a small voxel object on a stone tile (sprout, mug, cloud and so on), and the list runs along a dashed lattice rule. Dates go in mono chips. Each post's hero image is its own registered pair of renders, before and after, so the same seam idiom introduces the story. Body text is Bricolage 400 at 18 to 19 px with a 68ch measure. Code blocks use the ink panel with lime prompts, like the MCP command.
- **Article details**: pull quotes get the lime highlighter. Figures sit on cream cards with a 6 px hard shadow in the post's product colour. The leaf "next block" bullet marks follow-ups.
- **Product pages**: the plinth diorama is the hero, in front of a lattice-pattern cream panel. The real logo and status chip sit above the name, and the figure is set huge in Bricolage 800. Below that, a CSS 3D cube of the logo can be orbited. The changelog is a column of stacked blocks, one per release, that Stack Drop in as you scroll. The page colour comes from the product's own tint (sky, blush, lilac or butter) and the rest of the system stays the same.
- **Retired products** keep their stone-tile stand-in and use a calmer, desaturated version of the card.

## Assets

Every image is from the kit in `assets/` (see `assets/ASSETS.md`). The voxel bakes, SVG identity, stickers and patterns are generated by code. Product logos are the products' own, from `designs/_shared/products/`, used as-is. Nothing was downloaded. Motion 12.23.12 is vendored (MIT).
