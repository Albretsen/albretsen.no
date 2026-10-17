// Page templates. Each returns a full HTML document as a string.
import { site, products, dayJob, mcpClients, type Product } from './data.ts'
import { esc } from './markdown.ts'

export interface Post {
  slug: string; lang: 'en' | 'nb'; title: string; date: string; excerpt: string; tags: string[]
  html: string; md: string; path: string; alternates: { lang: 'en' | 'nb'; path: string }[]
}

const NAV = [['/build/', 'Products'], ['/write/', 'Writing'], ['/stack/', 'Stack']] as const
const fmtDate = (d: string, lang = 'en') => new Date(d + 'T12:00:00Z').toLocaleDateString(lang === 'nb' ? 'nb-NO' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const host = (u: string) => u.replace(/^https?:\/\//, '').replace(/\/$/, '')
const STATUS: Record<string, string> = { live: 'Live', building: 'Building', paused: 'Paused', retired: 'Retired' }

interface Layout {
  title: string; description: string; path: string; css: string; body: string; lang?: string
  bodyClass?: string; head?: string; scripts?: string; mdPath?: string; ogType?: string
}

// Shown in the footer: what this page actually cost the visitor's browser.
const WEIGHT = `addEventListener('load',()=>setTimeout(()=>{const o=document.getElementById('weight');if(!o)return;const n=performance.getEntriesByType('navigation')[0]||{},r=performance.getEntriesByType('resource'),z=e=>e.transferSize||e.encodedBodySize||0,k=b=>(b/1024).toFixed(1),f=performance.getEntriesByName('first-contentful-paint')[0];const all=z(n)+r.reduce((s,e)=>s+z(e),0),js=r.filter(e=>/\\.m?js(\\?|$)/.test(e.name)).reduce((s,e)=>s+z(e),0);o.textContent='This page: '+k(all)+' KB · '+k(js)+' KB of JavaScript'+(f?' · first paint in '+Math.round(f.startTime)+' ms':'')},300))`

export function layout(o: Layout): string {
  const url = site.origin + o.path
  return `<!doctype html>
<html lang="${o.lang ?? 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${url}">
${o.mdPath ? `<link rel="alternate" type="text/markdown" href="${o.mdPath}">` : ''}
<meta name="theme-color" content="#2E2240">
<link rel="icon" href="/assets/identity/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/identity/favicon-180.png">
<meta property="og:type" content="${o.ogType ?? 'website'}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site.origin}/assets/identity/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/assets/fonts/josefin-sans-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/instrument-serif-italic.woff2" as="font" type="font/woff2" crossorigin>
${o.head ?? ''}
<style>${o.css}</style>
<script>document.documentElement.classList.add('js')</script>
<script type="speculationrules">{"prerender":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":"/api/*"}}]},"eagerness":"moderate"}]}</script>
</head>
<body${o.bodyClass ? ` class="${o.bodyClass}"` : ''}>
<a class="skip" href="#main">Skip to content</a>
${o.body}
${footer()}
<script>${WEIGHT}</script>
${o.scripts ?? ''}
</body>
</html>
`
}

function nav(current = '') {
  return `<nav class="nav" aria-label="Site">${NAV.map(([href, label]) => `<a href="${href}"${current === href ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`
}

function brand() {
  return `<a class="brand" href="/" aria-label="Albretsen AS, home"><img class="brand-mark" src="/assets/identity/mark.svg" width="34" height="34" alt=""><img class="brand-word" src="/assets/identity/wordmark-paper.svg" width="160" height="13" alt=""></a>`
}

function footer() {
  return `<footer class="foot">
  <div class="foot-in">
    <img src="/assets/identity/mark.svg" width="44" height="44" alt="" loading="lazy">
    <p class="avail">${esc(site.availability)}</p>
    <p><a class="mail" href="mailto:${site.email}">${site.email}</a></p>
    <nav class="foot-nav" aria-label="Footer"><a href="/build/">Products</a><a href="/write/">Writing</a><a href="/stack/">Stack</a><a href="/llms.txt">llms.txt</a></nav>
    <p class="fine">${site.company} <span aria-hidden="true">·</span> Norway</p>
    <p class="weight" id="weight" aria-live="off"></p>
  </div>
</footer>`
}

function pageTop(current: string) {
  return `<header class="top">${brand()}${nav(current)}</header>`
}

/* ---------------------------------------------------------------- homepage pieces */

function picture(base: string, widths: number[], sizes: string, w: number, h: number, alt: string, extra = '') {
  const set = (ext: string) => widths.map((x) => `${base}-${x}.${ext} ${x}w`).join(', ')
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}"><img src="${base}-${widths[0]}.jpg" srcset="${set('jpg')}" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt)}" loading="lazy" decoding="async"${extra}></picture>`
}

function heroLayer(name: string, depth: number) {
  const b = `/assets/hero/layers/${name}`
  return `<picture class="w-layer" data-depth="${depth}">
    <source media="(max-aspect-ratio: 4/5)" srcset="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">
    <source type="image/avif" srcset="${b}-960.avif 960w, ${b}-1920.avif 1920w" sizes="100vw">
    <img src="${b}-1920.webp" srcset="${b}-960.webp 960w, ${b}-1920.webp 1920w" sizes="100vw" width="1920" height="1080" alt="" decoding="async">
  </picture>`
}

// The divider: three cut-paper ridges and a sun that sets behind them as you scroll.
function sundown(): string {
  const W = 1600, H = 400
  const noise = (seed: number) => { const v = Array.from({ length: 64 }, (_, i) => { const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x) }); return (x: number) => { const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f); return v[i % 64] * (1 - t) + v[(i + 1) % 64] * t } }
  // Smooth paper-cut mountains: two octaves of soft noise plus a few named peaks.
  const ridge = (seed: number, base: number, amp: number, freq: number, peaks: [number, number, number][]) => {
    const n = noise(seed); let d = `M-20 ${H + 120} L-20 ${base}`
    for (let x = -20; x <= W + 20; x += 8) {
      let y = base - (n(x * freq + 40) * 0.7 + n(x * freq * 2.3 + 49) * 0.3) * amp
      for (const [px, h, w] of peaks) y -= h * Math.max(0, 1 - Math.abs(x - px) / w) ** 1.7 * (0.85 + 0.15 * n(x * 0.05 + 7))
      d += ` L${x} ${y.toFixed(1)}`
    }
    return d + ` L${W + 20} ${H + 120} Z`
  }
  let stars = ''
  for (let i = 0; i < 70; i++) { const a = Math.sin(i * 91.7) * 9999, b = Math.sin(i * 37.3) * 9999; const x = (a - Math.floor(a)) * W, y = (b - Math.floor(b)) * 190; stars += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.8 + (i % 3) * 0.5).toFixed(1)}"/>` }
  return `<div class="sundown" aria-hidden="true">
  <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice">
    <defs><radialGradient id="sd-g"><stop offset="0" stop-color="#ffd9a6" stop-opacity=".9"/><stop offset="1" stop-color="#ffd9a6" stop-opacity="0"/></radialGradient></defs>
    <g class="sd-stars" fill="#fff4e0">${stars}</g>
    <g class="sd-sun"><circle class="sd-sun-glow" cx="1040" cy="190" r="190" fill="url(#sd-g)"/><circle cx="1040" cy="190" r="46" fill="#ffd6a0"/></g>
    <path class="ridge sd-r1" fill="#8e7bb0" stroke="#ffd2a3" stroke-opacity=".55" stroke-width="2" d="${ridge(3, 285, 60, 0.0022, [[1240, 170, 170], [1400, 110, 120], [380, 80, 200]])}"/>
    <path class="ridge sd-r2" fill="#6c5a8f" stroke="#ffd2a3" stroke-opacity=".4" stroke-width="2" d="${ridge(11, 320, 50, 0.003, [[620, 120, 210], [180, 80, 160], [1530, 70, 170]])}"/>
    <path class="ridge sd-r3" fill="#F5EBDC" stroke="#ffffff" stroke-opacity=".6" stroke-width="2" d="${ridge(23, 372, 26, 0.004, [[980, 30, 160]])}"/>
  </svg>
</div>`
}

function productRow(p: Product) {
  return `<li class="row">
    <a class="plate paper-lift" href="${p.url}" tabindex="-1" aria-hidden="true">${picture(`/assets/products/${p.id}`, [480, 960], '(max-width: 760px) 92vw, 40vw', 480, 600, p.alt ?? '')}</a>
    <div class="row-text">
      <h3 class="pname">${esc(p.name)}</h3>
      <p class="pline">${esc(p.line)}</p>
      ${p.figure ? `<p class="figure"><b>${esc(p.figure.value)}</b><span>${esc(p.figure.label)}</span></p>` : ''}
      ${p.facts ? `<ul class="facts">${p.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      <p class="meta"><span class="status st-${p.status}">${STATUS[p.status]}</span><span aria-hidden="true">·</span><span>Since ${p.since}</span>
        <a class="go" href="${p.url}">${host(p.url!)} <span aria-hidden="true">↗</span></a></p>
    </div>
  </li>`
}

function retiredArches() {
  return products.filter((p) => p.status === 'retired').map((p, i) => `<li class="arch">
      <button type="button" aria-expanded="false" aria-describedby="tip-${i}">
        <img src="/assets/products/retired/${p.id}.svg" width="160" height="230" alt="" loading="lazy">
        <span class="arch-name">${esc(p.short ?? p.name)}</span><span class="arch-year">${p.since}</span>
      </button>
      <span class="arch-tip" role="tooltip" id="tip-${i}"><b>${esc(p.name)}.</b> ${esc(p.line)}</span>
    </li>`).join('')
}

function mcpTabs() {
  const tabs = mcpClients.map((c, i) => `<button class="tab" type="button" role="tab" id="tab-${c.id}" aria-controls="cmd-${c.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${c.name}</button>`).join('')
  const panels = mcpClients.map((c, i) => `<div class="cmd" role="tabpanel" id="cmd-${c.id}" aria-labelledby="tab-${c.id}"${i ? ' hidden' : ''}><pre>${c.file ? `<span class="cmd-file">${esc(c.file)}</span>` : ''}<code>${esc(c.text)}</code></pre><button type="button" class="copy"><span class="copy-label">Copy</span></button></div>`).join('')
  return `<div class="tabs" role="tablist" aria-label="MCP client">${tabs}</div>${panels}`
}

export function home(posts: Post[], css: string): string {
  const running = products.filter((p) => p.status !== 'retired')
  const body = `<main id="main">
  <section class="pull" aria-labelledby="hero-name">
    <div class="stage">
      <div class="mat" aria-hidden="true"></div>
      <header class="top">${brand()}<div class="top-right">${nav()}<button class="sound" type="button" aria-pressed="false"><span class="sound-dot" aria-hidden="true"></span><span class="sound-label">Sound off</span></button></div></header>
      <div class="world-wrap">
        <div class="world">
          <picture class="w-sky">
            <source media="(max-aspect-ratio: 4/5)" type="image/avif" srcset="/assets/hero/hero-afterglow-portrait-540.avif 540w, /assets/hero/hero-afterglow-portrait-1080.avif 1080w" sizes="100vw">
            <source media="(max-aspect-ratio: 4/5)" type="image/webp" srcset="/assets/hero/hero-afterglow-portrait-540.webp 540w, /assets/hero/hero-afterglow-portrait-1080.webp 1080w" sizes="100vw">
            <source media="(max-aspect-ratio: 4/5)" srcset="/assets/hero/hero-afterglow-portrait-540.jpg 540w, /assets/hero/hero-afterglow-portrait-1080.jpg 1080w" sizes="100vw">
            <source type="image/webp" srcset="/assets/img/sky-afterglow-960.webp 960w, /assets/img/sky-afterglow-1920.webp 1920w" sizes="100vw">
            <img src="/assets/img/sky-afterglow-1920.jpg" srcset="/assets/img/sky-afterglow-960.jpg 960w, /assets/img/sky-afterglow-1920.jpg 1920w" sizes="100vw" width="1920" height="1080" alt="" fetchpriority="high" decoding="async">
          </picture>
          <h1 class="name" id="hero-name"><span class="vh">Asgeir Albretsen, Albretsen AS</span><span class="name-word" aria-hidden="true">ALBRETSEN</span></h1>
          ${heroLayer('layer-1-far', 0.25)}
          ${heroLayer('layer-2-headland', 0.55)}
          ${heroLayer('layer-3-boulevard', 1)}
          ${heroLayer('layer-4-near', 1.7)}
        </div>
      </div>
      <div class="intro">
        <p class="kicker">${site.person} <span aria-hidden="true">·</span> ${site.company}</p>
        <p class="line">${esc(site.line)}</p>
        <p class="sub">${esc(site.sub)}</p>
      </div>
      <p class="live" hidden><span class="live-lamp" aria-hidden="true"></span><span class="live-text"></span></p>
      <p class="hint" aria-hidden="true"><span>Scroll</span></p>
      <div class="mini">
        <p class="mini-head"><span class="kicker mini-kicker">The same coast, in miniature</span><span class="mini-line">Drag to turn it.</span></p>
        <div class="dio-slot">
          <div id="dio" class="dio-fallback" tabindex="0" role="img" aria-label="A paper diorama of a cliff-top glass house above the sea in an arched box. Drag, or use the arrow keys, to turn it.">
            ${picture('/assets/hero/hero-diorama-purple', [1024, 1600], '(max-width: 900px) 92vw, 1000px', 1600, 1000, '')}
          </div>
        </div>
        <div class="mini-ctl">
          <label for="sun">Move the sun</label>
          <input type="range" id="sun" min="-8" max="20" step="0.1" value="-1.5" aria-describedby="sun-out">
          <output id="sun-out" class="sun-out" for="sun">−&#8199;1.5°</output>
          <button type="button" id="now" class="pill">Now</button>
        </div>
      </div>
    </div>
  </section>

  ${sundown()}

  <section class="products" id="products" aria-labelledby="products-title">
    <div class="p-head">
      <p class="kicker">Products</p>
      <h2 class="h2" id="products-title">What I run</h2>
    </div>
    <ol class="rows">${running.map(productRow).join('')}</ol>
  </section>

  <div class="dusk">
    <section class="after" aria-labelledby="retired-title">
      <p class="kicker">Retired</p>
      <h2 class="h3" id="retired-title">Earlier products</h2>
      <p class="after-note">Products I have shut down.</p>
      <ul class="arches">${retiredArches()}</ul>
    </section>

    <section class="writing" aria-labelledby="writing-title">
      <p class="kicker">Writing</p>
      <h2 class="h3" id="writing-title">Latest</h2>
      <ul class="posts">${posts.slice(0, 5).map((p) => `<li><a href="${p.path}"><time datetime="${p.date}">${fmtDate(p.date)}</time><span class="t">${esc(p.title)}</span><span class="arrow" aria-hidden="true">→</span></a></li>`).join('')}</ul>
      <a class="all go" href="/write/">All writing <span aria-hidden="true">↗</span></a>
    </section>

    <section class="agents" aria-labelledby="agents-title">
      <p class="kicker">For your agent</p>
      <h2 class="h3" id="agents-title">This site is an MCP server</h2>
      <p class="agents-note">Ask your assistant about the products, the numbers or the writing. Read-only, no sign-in.</p>
      ${mcpTabs()}
    </section>
  </div>
</main>`
  return layout({
    title: `${site.person} · ${site.company}`, description: site.description, path: '/', css, body, mdPath: '/index.md',
    head: `<link rel="preload" as="image" href="/assets/img/sky-afterglow-1920.webp" type="image/webp" media="(min-aspect-ratio: 4/5)" fetchpriority="high">`,
    scripts: '<script type="module" src="/assets/js/home.js"></script>',
  })
}

export function buildPage(css: string): string {
  const LOGOS: Record<string, string> = { 'mcp-emails': 'mcp-emails.png', 'fun-libs': 'fun-libs.png', toolrails: 'toolrails.svg', harbor: 'harbor.svg', luma: 'luma.png' }
  const icon = (p: Product) => LOGOS[p.id]
    ? `<img class="icon logo-${p.id}" src="/assets/logos/${LOGOS[p.id]}" width="64" height="64" alt="" loading="lazy">`
    : `<span class="icon empty" aria-hidden="true">${esc((p.short ?? p.name).charAt(0))}</span>`
  const rows = products.map((p) => `<li class="${p.status === 'retired' ? 'retired' : ''}">
    ${icon(p)}
    <div><h2>${p.url ? `<a href="${p.url}">${esc(p.name)}</a>` : esc(p.name)}</h2><p class="m"><span class="status st-${p.status}">${STATUS[p.status]}</span><time>${p.since}</time></p></div>
    <p class="l">${esc(p.line)}</p>
    <p class="f">${p.figure ? `${esc(p.figure.value)}<small>${esc(p.figure.label)}</small>` : ''}</p>
  </li>`).join('')
  const body = `${pageTop('/build/')}<main id="main"><div class="wrap">
    <p class="kicker">Products</p>
    <h1 class="h1">Everything I have shipped</h1>
    <p class="lede">Live, being built, paused and retired. Published on Google Play since 2016.</p>
    <ul class="ledger">${rows}</ul>
    <h2 class="section-h">Day job</h2>
    <ul class="daylist">${dayJob.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
  </div></main>`
  return layout({ title: `Products · ${site.company}`, description: 'Every product Asgeir Albretsen has shipped: live, building, paused and retired.', path: '/build/', css, body, bodyClass: 'page', mdPath: '/build.md' })
}

export function writePage(posts: Post[], css: string): string {
  const body = `${pageTop('/write/')}<main id="main"><div class="wrap">
    <p class="kicker">Writing</p>
    <h1 class="h1">Notes on building and money</h1>
    <ul class="postlist">${posts.map((p) => `<li><a href="${p.path}"><time datetime="${p.date}">${fmtDate(p.date)}</time><span class="t">${esc(p.title)}</span><span class="x">${esc(p.excerpt)}</span><span class="tags">${p.tags.map(esc).join('<span aria-hidden="true">·</span>')}</span></a></li>`).join('')}</ul>
  </div></main>`
  return layout({ title: `Writing · ${site.company}`, description: 'Writing by Asgeir Albretsen on building software products and money.', path: '/write/', css, body, bodyClass: 'page', mdPath: '/write.md' })
}

export function postPage(p: Post, css: string, extraScripts = ''): string {
  const langs = p.alternates.length > 1 ? `<span class="lang">${p.alternates.map((a) => `<a href="${a.path}" hreflang="${a.lang}" lang="${a.lang}"${a.lang === p.lang ? ' aria-current="true"' : ''}>${a.lang === 'en' ? 'English' : 'Norsk'}</a>`).join('')}</span>` : ''
  const body = `${pageTop('/write/')}<main id="main"><article>
    <header class="post-head">
      <p class="kicker">${p.tags.map(esc).join(' · ')}</p>
      <h1 class="h1">${esc(p.title)}</h1>
      <p class="post-meta"><time datetime="${p.date}">${fmtDate(p.date, p.lang)}</time>${langs}</p>
    </header>
    <div class="prose">${p.html}</div>
    <nav class="post-end" aria-label="More"><a class="go" href="/write/">${p.lang === 'nb' ? 'Alt jeg har skrevet' : 'All writing'}</a><a class="go" href="/">Albretsen AS</a></nav>
  </article></main>`
  const head = p.alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${site.origin}${a.path}">`).join('')
  return layout({ title: `${p.title} · ${site.person}`, description: p.excerpt, path: p.path, css, body, bodyClass: 'page', lang: p.lang, head, scripts: extraScripts, mdPath: p.path.replace(/\/$/, '.md'), ogType: 'article' })
}

export function stackPage(css: string): string {
  const specs: [string, string][] = [
    ['Build', 'A small TypeScript script renders every page to static HTML. No framework, no client-side router.'],
    ['Delivery', 'Cloudflare Workers with static assets. A small Worker answers <code>/mcp</code> and the event feed; everything else is served straight from the edge.'],
    ['CSS', 'Inlined into each page, so the first response carries everything needed to draw it.'],
    ['JavaScript', 'None on text pages. The homepage loads one module; the diorama and charts load when the browser is idle or when scrolled to.'],
    ['Images', 'AVIF with WebP and JPEG fallbacks, sized per screen, with width and height set so nothing jumps.'],
    ['Type', 'Josefin Sans, Instrument Serif and DM Mono, self-hosted, with size-matched fallbacks.'],
    ['Navigation', 'Links prerender on hover with the Speculation Rules API, so most clicks show the next page at once.'],
    ['Motion', 'Scroll-driven CSS where the browser supports it. Everything respects reduced motion.'],
  ]
  const endpoints: [string, string][] = [
    ['/mcp', 'MCP server (Streamable HTTP). Tools: list_products, get_product, list_posts, get_post.'],
    ['/llms.txt', 'A plain index of the site for language models.'],
    ['/index.md', 'Every page has a Markdown twin: add .md to the path.'],
    ['/api/events', 'The latest anonymised events from the products, as JSON. /api/events/socket streams them over a WebSocket.'],
    ['/sitemap.xml', 'Every page, for search engines.'],
  ]
  const body = `${pageTop('/stack/')}<main id="main"><div class="wrap">
    <p class="kicker">Stack</p>
    <h1 class="h1">How this site is built</h1>
    <p class="lede">The footer of every page shows what that page cost your browser to load.</p>
    <dl class="specs">${specs.map(([k, v]) => `<div class="spec"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    <h2 class="section-h">For machines</h2>
    <ul class="endpoints">${endpoints.map(([p, d]) => `<li><a href="${p}">${p}</a><span>${d}</span></li>`).join('')}</ul>
    <h2 class="section-h">Add the MCP server</h2>
    <ul class="endpoints">${mcpClients.map((c) => `<li><span>${c.name}</span><code>${esc(c.text)}</code></li>`).join('')}</ul>
  </div></main>`
  return layout({ title: `Stack · ${site.company}`, description: 'How albretsen.no is built and served.', path: '/stack/', css, body, bodyClass: 'page', mdPath: '/stack.md' })
}

export function notFound(css: string): string {
  const body = `${pageTop('')}<main id="main"><div class="wrap"><p class="kicker">404</p><h1 class="h1">Nothing here</h1><p class="lede"><a class="go" href="/">Back to the start</a></p></div></main>`
  return layout({ title: `Not found · ${site.company}`, description: 'Page not found.', path: '/404', css, body, bodyClass: 'page' })
}
