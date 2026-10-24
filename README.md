# albretsen.no

The site for Asgeir Albretsen and Albretsen AS. Static pages built by a small TypeScript script, served by a Cloudflare Worker.

```
node scripts/build.ts          # → dist/ (fails if the homepage's first response passes 14 KB brotli, or the town's code its budget)
node --test scripts/test/*.ts  # Worker, built site (assets, import map, town content) and the townspeople's lines
npx wrangler dev               # local preview with the Worker, so /mcp and /api/* work
npx wrangler deploy            # deploy dist/ + worker/ (see wrangler.jsonc)
```

| Path | What |
|---|---|
| `site/data.ts` | Every fact and figure on the site. Change numbers here only. |
| `site/templates.ts` | Page templates: the homepage is design 91, Living Town (`archive/designs/91`); the other pages share its type, colour, header and footer. |
| `site/styles/` | CSS, inlined into each page at build time. |
| `site/static/` | Fonts, logos, icons and the Living Town (`assets/town/`: its modules, three.js, the glTF models and the poster), copied as-is. Every file under `/assets/` gets a content hash in its name at build time; the town's modules find each other through an import map. |
| `dist/assets/town/js/content.*.js` | Generated: the build writes it from `site/data.ts`, so the town's signs, cards and screens show the same facts as the pages. |
| `site/charts/spx/` | The interactive S&P chart for "Stop caring about all-time highs". |
| `articles/` | Posts in Markdown with front matter; `slug/en.md` + `slug/nb.md` for two languages. |
| `worker/` | `/mcp` (read-only MCP server), the product event feed and live figures (one Durable Object). |
| `archive/designs/` | All 90 brand explorations and the gallery (`/archive/designs/` when serving the repo root). |
| `SITE.md` | The spec. |

## Product events

Products post anonymous events to the homepage feed; with none, the feed line stays hidden.

```
curl -X POST https://albretsen.no/api/events \
  -H "Authorization: Bearer $FEED_KEY" -H "content-type: application/json" \
  -d '{"product":"mcp-emails","text":"agent drafted a reply","ms":182}'
```

`product` must be one of `mcp-emails`, `fun-libs`, `toolrails`, `harbor`, `albretsen.no`; only `text`, `kind`, `country` and `ms` are kept.

## Live figures

Pages ship each product's figure from `site/data.ts` and refresh it from `/api/figures` when the Worker has a newer one (the homepage, `/build/` and the MCP server all use it). Products post the latest figure with the same key as events:

```
curl -X POST https://albretsen.no/api/figures \
  -H "Authorization: Bearer $FEED_KEY" -H "content-type: application/json" \
  -d '{"product":"mcp-emails","label":"emails handled","value":48000}'
```

`value` is a number (shown as `10,203 NOK`: large figures drop the decimals) or short text such as `"113,000+"`; only `label`, `value` and `unit` are kept. `GET /api/figures` returns `{ "figures": { "mcp-emails": { "label", "value", "unit", "updated" } } }`, and each update is also pushed on `/api/events/socket` as `{ "type": "figure", ... }`. Keep `site/data.ts` roughly current so the first paint is right.
