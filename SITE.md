# albretsen.no

Draft 3 · 2026-10-16

## The idea

A plain, very fast personal site with a hero people remember. You should understand it in five seconds: who this is, what he has built, and what he writes. The technical skill shows in how fast and well-made the site is, not in unusual structure.

Albretsen AS is a technology company that builds whatever is profitable. MCP Emails is the current product, but it is only one product on the site.

## Pages

| Path | What it is |
|---|---|
| `/` | Hero, then the products, then the latest blog posts. |
| `/build` | Products, and nothing else. |
| `/write` | The blog. |
| `/stack` | The tech stack and how the site is built. |

English is the main language. Norwegian versions live under `/nb/` where they exist.

### `/`: the hero

The hero must be interesting, unique and cool. **It is a live feed of real events from every product.**

- **Left:** my name and one sentence about what I do.
- **Right:** a slow-moving list of things actually happening right now across everything I run, one line per event in mono. Each line has a timestamp, a product tag and a plain description, for example:
  - `12:04:31  fun-libs     story completed · Brazil`
  - `12:04:18  mcp-emails   agent scheduled a send · 412 ms`
  - `12:03:57  albretsen.no deploy a1f9c3e · 11.8 KB`
- **The mix of products tells the story.** Visitors see straight away that several products are alive, without being told.
- **Honest quiet:** at night the gaps between events are real, and the timestamps show it. No fake activity, no looping.

**How it works**
- **Products send events.** Each one posts anonymised events to a small Cloudflare Worker using a signed key. No personal data is sent: only event type, product, country and timing.
- **One server-side buffer.** A Durable Object holds the last 50 events and pushes new ones to visitors over a hibernating WebSocket, so an idle connection costs nothing.
- **Works without JavaScript.** The latest 12 events are rendered into the HTML at the edge, so the hero is complete on first paint, before any script runs, and costs no extra request.
- **JavaScript only adds the live updates.** The script is inline and under 2 KB. It connects after the page loads and slides new lines in.
- **Reduced motion:** with reduced motion turned on, lines appear without animation.
- **Fallback:** if the connection drops, the feed simply stops and says when the last event arrived.

**`claude mcp add`:** one line under the feed reads `claude mcp add albretsen https://albretsen.no/mcp`. The site really is an MCP server, and nothing explains it.

Below the hero:
- **Products:** a flat list, one line each.
- **Writing:** the 5 latest posts.
- **Footer:**
  - one availability line and an email address;
  - a small readout of this page load, read from the browser: bytes, JavaScript size and how long the page took to show.

### `/build`: products

The products are a flat list with one row per product. Each row has:
- the name and one sentence about it;
- a status: `live`, `building`, `paused` or `retired`;
- the year it started;
- one hard number.

Retired products stay on the list with a one-line reason they were stopped. Each live product has a short page with:
- one paragraph about it;
- live numbers;
- uptime and response time;
- links.

| Product | Years | Status | Description |
|---|---|---|---|
| MCP Emails | 2026– | live | Email for AI agents: 17 tools, about 100 providers, open source |
| Fun Libs | 2019– | live | Word game for Android and iOS, 113,000+ installs, no marketing |
| Toolrails | 2026– | building | One MCP URL that gives an agent every tool |
| Harbor | 2026 | paused | Private knowledge base shared by people and AI |
| Luma | 2026 | retired | Norwegian budgeting app with open banking |
| Polyglot Pilot | 2025 | retired | Agents that localised entire codebases, with a dashboard for human reviewers |
| PinPoint | 2025 | retired | GeoGuessr with your own photos: friends guess where your trip pictures were taken |
| WebVakt | 2024 | retired | Website change monitoring |
| Daily Jokes / Joke Central | 2024 | retired | Joke apps for iOS and Android |
| Tryggere Hyring | 2023 | retired | Background checks for hiring |
| IAGO HMS, Rentekalkulator, Prosentkalkulator | 2021–23 | retired | Early apps |

**Day job:** a short section at the bottom of `/build`, with no company names.
- Built and led an MCP server for an accounting platform.
- Ran a developer hackathon around it.
- Built AI chat with invoice, VAT and OCR tools.
- Built a React Native mobile app.

### `/write`: the blog

The blog is a normal, dated list of posts. Some posts are interactive explainers built on the same small chart engine as the S&P article. **At most one in three posts is about MCP Emails.**

At launch:
- The 4 existing articles.
- **"What happens when an AI sends an email,"** an interactive explainer covering:
  - the raw email taken apart;
  - the JSON-RPC exchange;
  - a final step that runs against a fake inbox inside the reader's own browser tab.

Backlog, published so topics alternate:
- Fun Libs, charted properly
- Protocol leverage beats platform leverage
- Sending an email exactly once
- Kill rules: how I decide what to build (uses the retired products)
- The context-window bill of MCP tools
- MCP Emails: from first demo to paying customers
- Taste as a list of tradeoffs
- The p99 of an agent turn
- Every product built to be carved out into its own company
- What an agent-sent email costs
- Designing an email API for agents
- Should I open-source the provider layer?
- Things I believe, each with a number
- Field notes on MCP spec changes
- What I built this year, written each December

### `/stack`: tech stack

This page holds everything technical that would clutter the rest of the site:
- the stack;
- the performance budget and how it is enforced;
- the type and colour system;
- the machine endpoints: MCP, a Markdown version of every page, `llms.txt`, and WebMCP;
- a link to the archive of every past deploy.

## Staying up to date

- **Numbers are never typed by hand.** Figures, ages and years are placeholders like `{{funlibs.installs}}`. They are filled in at build time from `numbers.json`, which syncs nightly from Stripe, Play Console, App Store Connect and GitHub.
  - If a sync fails, the figure shows "as of <date>" instead.
- **No words that go stale.** A lint check fails the build on "currently", "recently", "this year" or "new". It also bans "passionate", "let's connect" and "hire me".
- **The site rebuilds every night,** so numbers and dates stay right even if nobody touches the repo.
- **Product status lives in one file,** `products.yaml`. Each product page shows its last commit date, so a stale status is visible.
- **Blog posts are dated.** When a post is revised, it gets a short revision note.

## Performance (non-negotiable, enforced in CI)

**Budgets**
- **Homepage of 14 KB or less** after compression, CSS included, so it arrives in the first round trip.
- **JavaScript on the homepage** is only the inline feed script, under 2 KB.
- **No JavaScript on text pages.** Each interactive post loads its code only when scrolled into view, up to 30 KB.
- **Lighthouse 100** on mobile in every category, no layout shift (CLS 0), input delay (INP) under 50 ms, LCP under 1 s on slow 4G, and server response (TTFB) under 50 ms worldwide.

**Build and delivery**
- Static HTML from a tiny TypeScript build script, with no framework.
- Served from Cloudflare's edge (the DNS is already there). One small Worker handles the event feed, `/mcp`, the Markdown versions and timing headers.
- Pre-compressed at Brotli 11, served over HTTP/3, with long cache lifetimes for assets.
- Links are prerendered on hover, so most clicks open instantly. The browser's back/forward cache works everywhere.

**Type and colour**
- **Type:** a serif for text and a coding mono for numbers.
  - Both are self-hosted and trimmed to the characters actually used.
  - The fallback fonts are size-matched, so nothing jumps when the web fonts load.
- **Colour:** paper, ink and one accent.
  - Light, dark and high-contrast modes follow the system setting.

**Responsive layout**
- One readable column, tested from 320 px to 2560 px.
- Wide tables scroll inside themselves.
- Touch targets of 44 px.
- Reduced motion is respected.
