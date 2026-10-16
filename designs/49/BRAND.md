# Habit

**The site talks to you, quietly, from a pen-drawn desk.**

"Habit" is the mineralogist's word for the shape a crystal keeps growing into. Asgeir's habit is shipping software that pays for itself. The look borrows from James Sowerby's *British Mineralogy* (1802–1817), where a hand-coloured specimen sits beside a line drawing of its crystal, with front edges inked and hidden edges dashed. Here the drawings are real 3D (CC0 Kenney furniture and generated crystal habits) rendered by three.js *as ink*. The interface is grey paper. All colour arrives inside imagery: the 200-year-old specimens and the real product logos.

## The homepage

- **Hero: a conversation.** The first three turns are already in the HTML, so the page is readable before any script runs and there is no layout shift. With motion allowed, each turn is typed in place: pencil dots, then the bubble unfolds from its tail. The visitor answers with dashed "pencil" chips that drift a few pixels toward the pointer, or types freely. A small keyword matcher replies, and naming a product opens that product. The sidebar status reads `typing` and `online`.
- **"I'm an agent."** This answer hands over the MCP command and turns the products section into plain specs (id, status, since, figure, facts, url) through a View Transition. The real logos morph in place. A Radix-style toggle-group switches it back.
- **The crystal.** A live three.js crystal in ink sits above the drawn lamp as "Fig. 1". You drag it to turn it with inertia, and tap or press Enter to redraw the next of six habits stroke by stroke. It loads after first paint, when idle and visible. The mark drawing stands in until then.
- **Overheard.** The live event feed is not a dashboard. It is one quiet line under the conversation ("overheard · Fun Libs · story completed · Japan") that cross-fades at most every four seconds.
- **Plate II: products.** Four plates (Fig. 2–5) show the real MCP Emails, Fun Libs, Toolrails and Harbor logos on ink-drawn laptop, phone, monitor and bookcase, with the headline figure (a pencil circle scribbles round it on hover) and the facts. Clicking a plate is a **page turn**: the drawing morphs into a dialog where the site talks about that product, and chips page-turn to the others. The seven retired products live in **the drawer**, a `<details>` that animates to `height: auto` through `::details-content` and `interpolate-size` (the same easing as the Radix accordion). Luma keeps its real monogram. The others are pen-drawn stand-ins.
- **Footer.** "Takes one outside engagement at a time.", the email with a pencil underline, the MCP command with copy, a specimen and the orbit diagram.

## Voice

The voice is short, factual and a little dry, in the first person. It uses no exclamation marks and never sells. Italics in graphite carry the second half of a thought.

> Habit is a mineralogist's word: *the shape a crystal keeps growing into.*
> Toolrails is being built. Harbor is paused. *The drawings are just below.*

All numbers come from `designs/_shared/content.js`. The words "hire me", "let's connect" and "passionate" are banned.

## Colour

The interface uses greys tuned to hue 216 in OKLCH. The light theme is paper and ink: `#f2f5f6 / #fbfdfd / #d5dadc / #98a0a2 / #646e70 / #1c2427`. The dark theme is slate and chalk: `#131819 / #1c2223 / #32393b / #6e7678 / #9fa6a8 / #e6eaec`. Imagery colours (calcite amber, verdigris, garnet, MCP Emails blue, Fun Libs yellow) are never used as UI colours. A paper-grain overlay (multiply, inverted to screen in dark) makes it feel like a sheet rather than a screen.

## Type

- **Instrument Serif** is the site speaking: turns, headings and big figures.
- **Geist** is used for interface and body text.
- **Geist Mono** is the visitor's voice: chips, sent bubbles, labels, facts, specs and the MCP command.

## Motion

| Name | Where |
|---|---|
| TYPING TURN | Every turn in the hero and the product dialog. Turns grow from their own tail, origin-aware like Radix popper content |
| LIGHTS OUT | The lamp in the header is the theme switch. Its cord is pulled, and a View Transition reveals the other theme through a wobbly hand-drawn circle grown from the bulb. The transition waits until the new theme's drawings are decoded |
| PAGE TURN | Drawn and plain product views, and paging between products in the dialog |
| Morph | Plate drawing to dialog drawing (`view-transition-name: pick`), and the logos between views |
| INK-IN | Annotation strokes draw themselves |
| Scroll | Plate I drifts against the scroll (`animation-timeline: view()`) |
| Drift | Specimens breathe a few pixels over 14–17 s |

Under `prefers-reduced-motion` the turns appear instantly, the crystal stops orbiting, the theme switches without a reveal and nothing drifts. `?still` gives the same calm view.

## Sound

Sound is off until the visitor turns it on with the speaker toggle. After that, each turn lands with two soft pencil ticks synthesised in WebAudio from band-passed noise. No files are loaded.

## Mark

The mark is a Sowerby-style octahedron, with ink front edges and dashed back edges. Its top half reads as an A. It sits beside "Albretsen" in Instrument Serif outlines and a small "AS". The SVG favicon follows the OS theme.

## Extending the direction

- **Blog.** Each post is a "plate". The title is set in Instrument Serif. The post's lead image is an ink bake (`assets/_src/bake.html` re-renders any scene at any size) or a single specimen, and the body is in Geist at 66ch. Margin notes use the annotation strokes (arrow, bracket, circle-scribble) in graphite. The post ends with a short typed exchange ("Questions? *asgeir@albretsen.no*") rather than a comment form. Code blocks sit on `--sheet` with hairline rules, and the MCP command style is reused.
- **Product pages.** These continue the dialog. The product's ink still is the header, its real logo sits in the bar, and the page opens with three typed turns (line, figure, status) before the long-form sections. Figures get a pencil circle. A "plain" toggle shows the same page as a spec for agents. Product colour may only appear inside the product's own logo and screenshots.
- **404.** Plate I with the crystal live: "That page never formed. *Turn this instead.*"

## Assets

The full kit is in `assets/` (see `assets/ASSETS.md` for sources and licences). Specimens are public domain (Sowerby, Smithsonian Libraries scan via BHL). Furniture is from the Kenney Furniture Kit (CC0). three.js r170 is MIT. All product logos are used unchanged.
