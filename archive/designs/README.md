# Brand explorations

Each folder `NN/` is one independent brand direction for albretsen.no / Albretsen AS: a hero and the first section (products), plus the brand around it.

## Contract for a design folder

```
designs/NN/
  index.html     the page: hero + products section (required)
  brand.json     machine-readable brand summary for the gallery (required)
  BRAND.md       the brand book: vision, voice, type, colour, motion, sound, mark (required)
  *.css *.js *.svg *.woff2 ...   anything else the design needs (optional)
```

- **Content:** import facts from `../_shared/content.js`. Tone and microcopy are yours; facts are not. Never invent numbers.
- **Live feed:** the hero contains the live event feed. Use `../_shared/feed.js` (`createFeed().recent(n)` and `.subscribe(fn)`). How it looks, moves and sounds is entirely yours.
- **No frameworks, no JS libraries from CDNs.** Vanilla HTML, CSS and ES modules. Web fonts may load from Google Fonts or be self-hosted in the folder.
- **Fast:** total transfer excluding fonts under 100 KB, no layout shift, works without JavaScript except the live updates.
- **Responsive** from 320 px to 2560 px. Respect `prefers-reduced-motion`. Sound must be off until the visitor turns it on.

### brand.json

```json
{
  "name": "Direction name, 1-3 words",
  "tagline": "One line describing the direction",
  "summary": "2-3 sentences: the vision and why it fits Albretsen AS",
  "palette": ["#hex", "#hex", "#hex"],
  "type": ["Display face", "Text face", "Mono face"],
  "voice": "How the brand speaks, with one example line",
  "motion": "Motion principle in one sentence",
  "sound": "Sound idea in one sentence",
  "mark": "How the logo / wordmark works in one sentence",
  "inspiration": ["https://...", "https://..."]
}
```

## Viewing

Serve the repo root (`python3 -m http.server 4173`) and open `/designs/`. Run `node scripts/build-manifest.mjs` after adding designs.
