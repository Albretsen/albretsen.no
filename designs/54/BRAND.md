# The Vivarium

*Small software, kept alive under glass.*

## Vision

Albretsen AS is shown as a terrarium that someone tends. Each product is a small creature living in a glass case, and the site catalogues them the way a naturalist would: pinned, numbered, given a Latin name and labelled in mono. Retired products are not hidden. They are pressed flat and filed on herbarium sheets.

The awe comes from the tension between two worlds:

- **The living case.** A gabled Wardian case built only from CSS 3D transforms. You can drag it, it turns with inertia, and the creatures inside answer when tapped. After hours, the same jar runs live in three.js.
- **The archive.** Real 17th and 18th century insect and plant drawings from The Met's open-access collection (CC0), lifted off their paper and pinned to ours. They stay still.

It is a technology brand with a naturalist's restraint. It does not use finance, consultancy, industrial or nautical imagery. MCP Emails is one creature among four.

## The page (index.html)

1. **Germination loader.** A hand-authored Lottie draws the jar, grows the stem and unfurls the leaves while a mono counter ticks from 000 to 100. It waits for the real fonts and the creature images, then the paper sheet lifts away like a cloche. The glass case then lands with a slow spin.
2. **Hero.** Headline on the left, with the copyable feeding instructions (`claude mcp add albretsen https://albretsen.no/mcp`) on a specimen tag. The CSS-3D Wardian case is on the right:
   - Drag or use the arrow keys to turn it; it keeps turning briefly with inertia after you let go.
   - Tap or press Enter on a creature to open its label, a popover that animates in from the side it opens on, using Radix-style expo-out timing.
   - A hanging observation tag sways above the case, flips over with each new live event, and the matching creature hops.
   - Museum specimens are pinned in the margins and drift with scroll-driven animation.
3. **Field log.** The live feed written as keeper's notes: time, product, Latin name, and what the creature did.
4. **Specimens.** Plate I, with a ×2.5 loupe that follows the pointer, then four pinned plates with real logos. On hover, each lifts like a bell jar and its 3D creature rises out of the plate.
5. **Herbarium.** Seven pressed sheets. Each one turns over in 3D to show its label.
6. **Night band.** The fern photogram with the live three.js jar. It shows a baked still first, the jar loads lazily, and reduced motion keeps the still.
7. **Footer.** The circular stamp, "Takes one outside engagement at a time.", and the email with a magnetic hover.

## Voice

The voice is a naturalist's field notes: exact, slightly dry, and quietly funny about the Latin (*Noctua epistolaris*, the letter moth). It states facts and never sells. It never says "hire me", "let's connect" or "passionate".

- "Four creatures live in the case. Seven are pressed and filed."
- "Nothing is thrown away."
- Product names stay as they are. The Latin names are for flavour, never for hiding facts.

## Colour

Paper and ink, with moss as the single spot colour (seed hue 144° in OKLCH).

| Token | Hex | Use |
|---|---|---|
| paper | #f8f4ea | Page, with a multiplied paper grain over everything |
| ink | #162118 | Text and outlines (green-black, never #000) |
| moss | #408742 | One word per headline, live dots, the right leaf |
| moss-deep | #225424 | Links and Latin names |
| amber | #e2a355 | Spores only, a few pixels at a time; the sound-on dot |
| night | #0d160f | The one dark band |

## Type

- **Fraunces**: display at weights 300 to 340, opsz 144 and SOFT 50, with tight negative tracking. Latin names use the italic with SOFT 100. Text uses weight 360 at opsz 18.
- **Spline Sans Mono**: uppercase labels at 10 to 11px with 0.14 to 0.18em tracking, used for specimen numbers, times, figures and buttons.

## Motion

Things grow rather than slide. The named animations are in `assets/motion.css` and `assets/motion.js`:

- **Germinate** for entrances.
- **Bell jar** for the card lift.
- **Leaf turn** for page transitions and herbarium sheets.
- **Flutter** and **Doze** for idle creatures.
- **The germination loader.**

Easing is expo-out (`.16, 1, .3, 1`) for glass and a soft overshoot for growth. Idle life comes in short bursts with rests. It is never a metronome.

With reduced motion, the loader shortens to a fade, the case stays still at its resting angle, spores, sway and inertia stop, and the three.js jar is replaced by its baked still.

## Sound

Sound is off until the visitor turns it on in the masthead. When it is on:

- Creatures ring a small synthesized glass tink, pitched per species.
- Copying the command rings a higher tink.
- Herbarium sheets rustle.

All sound is made with Web Audio, with no audio files.

## Mark

A bell jar over a two-leaf sprout, with the right leaf in moss. The wordmark is outlined Fraunces "Albretsen", then a moss full stop, then a mono "AS". The kit includes reversed versions for the night band, plus a circular "Albretsen AS · Vivarium · Norway" stamp that is used once per page.

## Extending to the blog

- **Posts are field notes.** Each post has a mono header line (date, reading time, and the specimen it concerns), a Fraunces title with one moss italic word, and text at opsz 18 with a 66ch measure.
- **Images.** Pull quotes become pinned tags. Images sit on vellum mounts with a pin.
- **Index.** The blog index is a field journal: entries grouped by month, each with the Latin name of the product it is about (for example, "Fun Libs: 113,000 installs later" files under *Cerambyx lusor*).
- **Transitions.** Moving between posts uses the Leaf turn view transition.

## Extending to product pages

- **The plate.** Each product page opens on its specimen plate at full size, with a loupe, beside its 3D creature from the three.js scene (`terrarium.js` with `only: '<creature>'`).
- **Facts.** These are set as a naturalist's label: status, since, figure, facts.
- **The real product.** Product screenshots appear as "observations" on vellum mounts. The product's own logo and colours appear only inside the product's mount, unaltered.
- **Retired products.** They get a single herbarium sheet page with the pressed leaf and Asgeir's own one-line reason, once he writes it.

## Assets

Everything is in `assets/` (see `assets/ASSETS.md` for sources and licences).

- `img/jar-night@1x/@2x` (avif and jpg) was baked for this page from `assets/live/render.html?view=portrait&bg=0d160f&still=1`.
- The museum drawings are from The Met Open Access (CC0).
- Libraries are pinned and loaded from a CDN: three@0.170.0, loaded only near the night band, and lottie-web@5.12.2 (`lottie_light`).
