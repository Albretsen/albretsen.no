# Say Cheese · design 46

## Vision

Albretsen AS through a viewfinder. Blink, a squishy butter-yellow clay camera, is the mascot and the mark. Its one lens is its eye, and the three-blade aperture inside it forms an **A**. Blink is not a video or a stock 3D model. A hand-written raw WebGL2 raymarcher sculpts it live from smooth-unioned signed distance fields, with fingerprint dents, fake subsurface glow, soft shadows and glossy lens glass. That is the brand in one object: it looks like a toy, and it runs on real engineering.

The homepage doesn't describe this skill; it hands the visitor the camera:

- **Lens ring (focus).** A ridged apricot clay ring with three depth planes: the *name* (the headline), *Blink*, and the *dawn* photo behind it. Turning the ring blurs whichever planes are out of focus. The headline goes soft and the shader racks the backdrop with golden-angle bokeh. On load, autofocus starts at infinity, hunts once, locks on Blink and beeps (if sound is on). The frame comes up from underexposed, like sunrise.
- **Exposure.** A gum-pink knob from −2 to +2 EV drives the shader's exposure, the HUD meter needle and the shutter speed readout. Scrolling out of the hero leaks light in and overexposes the frame.
- **Shutter.** The cherry button, a click on Blink, or Space. Blink squashes, the page flashes and sprinkles burst. An instant print of *your actual frame* (read from the WebGL buffer) slides out and develops from blown-out sepia to colour. Each print carries a real fact from `content.js`, like "113,000+ installs" or "$782 MRR". You can drag prints around the table, and the stickers too.
- **The live feed** shows what the camera "detects": events from the products pop up as coloured AF boxes in the frame (sky for MCP Emails, gum for Fun Libs, mint for Toolrails), and the newest event runs along the top of the HUD.

After the hero comes a sprocketed **contact strip**: real CC0 photos (Wikimedia/Unsplash, NASA) mixed with Blink renders, scrubbed sideways by scroll through a paused WAAPI animation. Then **Roll 01**, the products, and **the shoebox**, retired products as clay coins that flip.

## Voice

Loud and proud, sunny, short. Camera words do the work (*developing, in focus, frame 03, shoebox*). Facts are stated plainly and never rounded up. No pitching: the site never asks for anything. The footer only states "Takes one outside engagement at a time." and gives the email.

> Four things, developing.
> Retired products, kept like old negatives. Each one taught the next.

## Palette (seed hue 60° OKLCH)

Cream `#FFF6E4` page · Ink `#381A13` text (never black) · Butter `#FFE97E` Blink and highlights · Apricot `#FC9E47` lens ring, barrel · Tangerine `#ED6E12` accent words · Bubblegum `#FF99C2` · Mint `#8DEFC5` (AF lock) · Lilac `#B6ADF3` (shadows are lilac, never grey) · Sky `#93D5F5` · Cherry `#ED3F4B` shutter and REC · Paper `#FBE8CE` cards · Cocoa `#6D3F2F` secondary text. Each product owns a world colour: MCP Emails sky, Fun Libs gum, Toolrails mint, Harbor lilac.

## Type

- **Bricolage Grotesque 800**, `font-stretch` 76%, leading 0.84, for headlines. It's big enough to shout. Accent words go Tangerine with a butter drop.
- **Bricolage Grotesque 400**, opsz 14, for body text.
- **DM Mono** in uppercase with +0.06em tracking for camera readouts: ISO, f-stops, EV, frame numbers and status chips.

## Mark

Blink's face (`assets/identity/logo-mark.svg`) is a butter pebble with a gum lens ring and the A-aperture. The wordmark "albretsen" is rolled from clay coils, in cocoa for everyday use and candy multicolour for loud moments such as the footer. The header lockup adds an "AS" pill.

## Motion

Web Animations API only, with springs baked into CSS `linear()`. The signature moves come from `assets/motion.js`:
**Iris Open** (entrances), **Squish** (hover and press, Josh Comeau's boop in clay), **Rack Focus** (reveals: blur and over-exposure to sharp, hunting once), **Shutter Flash** (flash plus candy sprinkles) and **Sticker Slap**. The page adds a spring-driven nav pill (a Radix NavigationMenu-style indicator), a paco-style copy icon morph, magnetic tilt on product cards, 3D coin flips, drag-and-settle on stickers and prints, and a scroll-scrubbed film strip.

Under `prefers-reduced-motion`, the live raymarcher is not started automatically. You get the baked still with the same blur and exposure in CSS, and a button to open the live lens on purpose. Autofocus snaps straight to its locked state, and every entrance becomes a short fade.

## Sound

Opt-in only (header toggle, remembered per browser). Everything is synthesised live with Web Audio and there are no audio files: a soft two-click plastic shutter with a puff of air, the autofocus double-beep, detent ticks on the lens ring, a squish when you grab a sticker or flip a coin, and a slap when you drop one.

## 3D and assets

- Hero: `assets/3d/blink-live.js` (raw WebGL2, scene `viewfinder` with a CC0 dawn photo as the bokeh backdrop). The baked `hero/viewfinder-dawn.webp` is the first paint, and the live canvas fades in over it when idle. Phones and reduced-motion visitors start the live lens with a tap.
- Toy: Poly Haven's CC0 "Camera 01" recast in candy clay, loaded with three.js r170 only when it nears the viewport. Drag to spin, double-click for the shutter.
- Real product logos sit untouched in white clay chips on the product renders, where Blink holds up each real icon.

## Extending to the blog and product pages

- **Blog = the darkroom.** The index is a contact sheet: each post is a print with a frame number, date in DM Mono and a small clay prop (sun, cloud, heart, star, lens, print). Post headers use one CC0/NASA photo racked out of focus behind the title. The `rackFocus` reveal sharpens it as the reader arrives. Body text is Bricolage 400 on cream, about 68ch wide. Pull quotes are die-cut stickers, and code blocks sit on Ink with Butter text. Reading progress is a small exposure needle in the header.
- **Product pages = one world each.** The page takes the product's world colour (sky, gum, mint, lilac) as its background tint. The product render, with Blink holding the real icon, opens with Iris Open. Facts are big DM Mono readouts like the HUD ("17 TOOLS · ABOUT 100 EMAIL PROVIDERS"). A sticker sheet carries the real numbers. The product's own logo and colours stay untouched; Say Cheese is only the frame around them.
- **Retired products** stay in the shoebox: the coin, the year, Asgeir's one-line reason.
- **404:** the winking Blink cut-out on the sprinkles pattern, captioned "Out of focus."

## Inspiration

Quaternius (CC0 cute low-poly), Poly Haven Camera 01, rauno.me/craft (Toolbar Morph, Gooey Tooltip, Blur Reveal), paco.me (copy feedback), Josh Comeau's "boop", Chrome's scroll-driven animations guide (`ViewTimeline` and the scrubbed WAAPI pattern), siteinspire picks cactusdigitale.com and coreastudios.com.
