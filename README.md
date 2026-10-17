# albretsen.no

The site for Asgeir Albretsen and Albretsen AS. Static pages built by a small TypeScript script, served by a Cloudflare Worker.

```
node scripts/build.ts          # → dist/ (fails if the homepage's first response passes 14 KB brotli)
node scripts/test/worker.test.ts
python3 -m http.server 4321 --directory dist   # local preview (no /mcp or feed locally)
npx wrangler deploy            # deploy dist/ + worker/ (see wrangler.jsonc)
```

| Path | What |
|---|---|
| `site/data.ts` | Every fact and figure on the site. Change numbers here only. |
| `site/templates.ts` | Page templates (home, products, writing, posts, stack). |
| `site/styles/` | CSS, inlined into each page at build time. |
| `site/static/` | Fonts, images and the homepage scripts, copied as-is. |
| `site/charts/spx/` | The interactive S&P chart for "Stop caring about all-time highs". |
| `articles/` | Posts in Markdown with front matter; `slug/en.md` + `slug/nb.md` for two languages. |
| `worker/` | `/mcp` (read-only MCP server) and the product event feed (Durable Object). |
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
