// Page templates. Each returns a full HTML document as a string.
// Asset paths are written plain (/assets/fonts/x.woff2); the build swaps in the fingerprinted
// names and fails on any /assets/ path that does not exist.
import { site, products, dayJob, mcpClients, type Product } from './data.ts'
import { esc } from './markdown.ts'

export interface Post {
  slug: string; lang: 'en' | 'nb'; title: string; date: string; excerpt: string; tags: string[]
  html: string; md: string; path: string; alternates: { lang: 'en' | 'nb'; path: string }[]
}

const NAV = [['/build/', 'Products'], ['/write/', 'Writing'], ['/stack/', 'Stack']] as const
const fmtDate = (d: string, lang = 'en') => new Date(d + 'T12:00:00Z').toLocaleDateString(lang === 'nb' ? 'nb-NO' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const STATUS: Record<string, string> = { live: 'Live', building: 'Being built', paused: 'Paused', retired: 'Retired' }
const nbsp = (s: string) => esc(s).replace(/ (\S+)$/, '&nbsp;$1')

/** Facts read as a list of small chips in Living Town: "about 100 email providers", but "AI edits ...". */
export const factCase = (f: string) => /^[A-Z][a-z]/.test(f) ? f[0].toLowerCase() + f.slice(1) : f

/** Where each product lives in town: the shopfront id the scene uses, its sign colour, its logo and a line. */
export const TOWN: Record<string, { site: string; accent: string; logo: string; where: string; ink?: boolean }> = {
  'mcp-emails': { site: 'mcp', accent: '#2547e5', logo: '/assets/logos/mcp-emails-mark.svg', where: 'In town: the post office, open all night.' },
  'fun-libs': { site: 'funlibs', accent: '#ffd400', logo: '/assets/logos/fun-libs-icon.png', where: 'In town: the arcade with the marquee.' },
  toolrails: { site: 'toolrails', accent: '#ffd400', logo: '/assets/logos/toolrails-icon.svg', where: 'In town: the workshop, usually the last light on.' },
  harbor: { site: 'harbor', accent: '#a9c6e0', logo: '/assets/logos/harbor-mark.svg', where: 'In town: the library, one reading lamp left on.', ink: true },
}

interface Layout {
  title: string; description: string; path: string; css: string; body: string; lang?: string
  bodyClass?: string; head?: string; scripts?: string; mdPath?: string; ogType?: string; footer?: string
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
<meta name="theme-color" content="#1b2450">
<link rel="icon" href="/assets/identity/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/identity/favicon-180.png">
<meta property="og:type" content="${o.ogType ?? 'website'}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site.origin}/assets/identity/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/assets/fonts/federo-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/instrument-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
${o.head ?? ''}
<style>${o.css}</style>
<script>document.documentElement.classList.add('js')</script>
<script type="speculationrules">{"prerender":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":"/api/*"}}]},"eagerness":"moderate"}]}</script>
</head>
<body${o.bodyClass ? ` class="${o.bodyClass}"` : ''}>
${o.body}
${footer(o.footer ?? mcpLink())}
<script>${WEIGHT}</script>
${o.scripts ?? ''}
</body>
</html>
`
}

const MARK = `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path d="M5 28V13l11-8 11 8v15z" fill="none" stroke="currentColor" stroke-width="1.6"/><rect class="mark-win" x="13" y="15" width="6" height="7" rx="3" /><path d="M3 28h26" stroke="currentColor" stroke-width="1.6"/></svg>`

function nav(current = '', home = '/') {
  return `<nav class="nav" aria-label="Main">
    <a class="mark" href="${home}" aria-label="${site.company}, home">${MARK}<span>Albretsen</span></a>
    <ul>${NAV.map(([href, label]) => `<li><a href="${href}"${current === href ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}</ul>
  </nav>`
}

function footer(mcp: string) {
  return `<footer class="foot" id="contact">
  <div class="wrap foot-grid">
    <div>
      <p class="eyebrow">Contact</p>
      <p class="avail">${nbsp(site.availability)}</p>
      <a class="email" href="mailto:${site.email}">${site.email}</a>
    </div>
    <div class="mcp" id="mcp">
      <p class="eyebrow">For your agent</p>
      ${mcp}
    </div>
  </div>
  <div class="wrap base">
    <nav class="foot-nav" aria-label="Footer">${NAV.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}<a href="/llms.txt">llms.txt</a></nav>
    <p>${site.company} · ${site.location} · on Google Play since ${site.playSince}</p>
    <p class="weight" id="weight" aria-live="off"></p>
  </div>
</footer>`
}

// Inner pages: the address, and a link to the setup for every client (no script needed).
const mcpLink = () => `<p class="mcp-note">This site is an MCP server. Read-only, no sign-in.</p>
      <code>${esc(site.mcpUrl)}</code>
      <a class="more" href="/stack/#clients">Setup for every client</a>`

// The homepage: one tab per client, each with a copy button.
function mcpTabs() {
  const tabs = mcpClients.map((c, i) => `<button type="button" role="tab" id="tab-${c.id}" aria-controls="cmd-${c.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(c.name)}</button>`).join('')
  const panels = mcpClients.map((c, i) => `<div class="cmd" role="tabpanel" id="cmd-${c.id}" aria-labelledby="tab-${c.id}"${i ? ' hidden' : ''}>${c.file ? `<p class="cmd-file mcp-note">${esc(c.file)}</p>` : ''}<code>${esc(c.text)}</code><button type="button" class="copy">Copy</button></div>`).join('')
  return `<p class="mcp-note">This site is an MCP server. Ask your assistant about the products, the numbers or the writing. Read-only, no sign-in.</p>
      <div class="mcp-tabs" role="tablist" aria-label="MCP client">${tabs}</div>${panels}`
}
const TABS_SCRIPT = `<script>(()=>{const t=[...document.querySelectorAll('.mcp-tabs [role=tab]')],p=[...document.querySelectorAll('.cmd')],s=(i,f)=>{t.forEach((b,j)=>{b.setAttribute('aria-selected',i===j);b.tabIndex=i===j?0:-1;p[j].hidden=i!==j});if(f)t[i].focus()};t.forEach((b,i)=>{b.onclick=()=>s(i);b.onkeydown=e=>{const d={ArrowRight:1,ArrowLeft:-1,Home:-i,End:t.length-1-i}[e.key];if(d!==undefined){e.preventDefault();s((i+d+t.length)%t.length,1)}}});p.forEach(c=>{const b=c.querySelector('.copy'),k=c.querySelector('code');b.onclick=async()=>{try{await navigator.clipboard.writeText(k.textContent);b.textContent='Copied'}catch{const r=document.createRange();r.selectNodeContents(k);const g=getSelection();g.removeAllRanges();g.addRange(r);b.textContent='Selected'}setTimeout(()=>b.textContent='Copy',1800)}})})()</script>`

/* ---------------------------------------------------------------- homepage */

// '10,203 NOK' -> ['10,203', 'NOK']: the number large, the unit small beside the label (as the town does it)
const splitFigure = (text: string) => { const m = /^(.*\d\+?)\s+([A-Za-z]{1,8})$/.exec(text); return m ? [m[1], m[2]] : [text, ''] }
const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
const count = (n: number) => WORDS[n] ?? String(n)

/** "Two products are live, one is being built and one is paused." */
function census(running: Product[]) {
  const parts = (['live', 'building', 'paused'] as const).map((s) => [s, running.filter((p) => p.status === s).length] as const).filter(([, n]) => n)
  const verb = (s: string, n: number) => (n === 1 ? 'is ' : 'are ') + (s === 'live' ? 'live' : s === 'building' ? 'being built' : 'paused')
  const said = parts.map(([s, n], i) => i === 0 ? `${count(n)} product${n === 1 ? '' : 's'} ${verb(s, n)}` : `${count(n).toLowerCase()} ${verb(s, n)}`)
  return said.length > 1 ? said.slice(0, -1).join(', ') + ' and ' + said[said.length - 1] + '.' : (said[0] ?? '') + '.'
}

function productCard(p: Product) {
  const t = TOWN[p.id]
  const [num, unit] = p.figure ? splitFigure(p.figure.value) : ['', '']
  return `<li class="pcard"${t ? ` data-site="${t.site}" style="--accent:${t.accent}"` : ''}>
          ${t ? `<img class="pcard-logo${t.ink ? ' pcard-logo--ink' : ''}" src="${t.logo}" width="48" height="48" alt="">` : ''}
          <p class="status" data-status="${p.status}"><span aria-hidden="true"></span>${STATUS[p.status]} · since ${p.since}</p>
          <h3>${p.url ? `<a href="${p.url}">${esc(p.name)}</a>` : esc(p.name)}</h3>
          ${p.figure ? `<p class="figure"><b${p.figure.exact ? ` title="${esc(p.figure.exact)}"` : ''}>${esc(num)}</b> ${esc([unit, p.figure.label].filter(Boolean).join(' '))}</p>` : ''}
          <p class="line">${esc(p.line)}</p>
          ${p.facts ? `<ul class="facts">${p.facts.map((f) => `<li>${esc(factCase(f))}</li>`).join('')}</ul>` : ''}
          ${t ? `<p class="where">${esc(t.where)}</p>
          <button type="button" class="see" data-site="${t.site}">See it in town</button>` : ''}
        </li>`
}

const HERO = `<picture class="poster">
    <source media="(max-aspect-ratio: 1/1)" srcset="/assets/town/poster/poster-tall-720.jpg 720w, /assets/town/poster/poster-tall-1080.jpg 1080w" sizes="100vw">
    <img src="/assets/town/poster/poster-1920.jpg" srcset="/assets/town/poster/poster-1280.jpg 1280w, /assets/town/poster/poster-1920.jpg 1920w" sizes="100vw"
         width="1920" height="1080" fetchpriority="high" decoding="async"
         alt="A small seaside town at blue hour seen from above like a model: a paved promenade with an iron railing, a café with string lights, four lit shopfronts and white and pink houses climbing the hill, with people strolling and leaning on the rail.">
  </picture>
  <canvas class="stage" id="stage" aria-hidden="true" tabindex="-1"></canvas>
  <div class="veil" aria-hidden="true"></div>
  <div class="tags" id="tags" aria-hidden="true"></div>`

const HUD = `<div class="loader" id="loader" hidden>
    <span class="loader-label" id="loader-label">Waking the town</span>
    <span class="loader-bar"><span id="loader-fill"></span></span>
  </div>
  <button class="open3d" id="open3d" type="button" hidden>Open the living town</button>

  <div class="hud" id="hud">
    <div class="clock" id="clock">
      <div class="clock-read">
        <p class="clock-time"><b id="clock-time">--:--</b> <span id="clock-phase">&nbsp;</span></p>
        <button class="live" id="live" type="button" aria-pressed="true"><span class="live-dot" aria-hidden="true"></span><span id="live-label">Oslo time</span></button>
      </div>
      <div class="dial" id="dial" role="slider" tabindex="0" aria-label="Time of day in the town" aria-valuemin="0" aria-valuemax="24" aria-valuenow="12" aria-valuetext="12:00">
        <svg class="dial-svg" id="dial-svg" viewBox="0 0 480 84" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="dial-sky" x1="0" x2="1" y1="0" y2="0"></linearGradient></defs>
          <rect class="dial-band" x="0" y="0" width="480" height="84" rx="12" fill="url(#dial-sky)"/>
          <line class="dial-horizon" x1="0" x2="480" y1="58" y2="58"/>
          <path class="dial-arc" id="dial-arc" d=""/>
          <g class="dial-ticks" id="dial-ticks"></g>
        </svg>
        <span class="dial-sun" id="dial-sun" aria-hidden="true"></span>
      </div>
      <div class="chips" role="group" aria-label="Jump to">
        <button type="button" data-h="7.4">Morning</button>
        <button type="button" data-h="12.6">Noon</button>
        <button type="button" data-h="19.25">Golden hour</button>
        <button type="button" data-h="20.25">Blue hour</button>
        <button type="button" data-h="23.3">Night</button>
      </div>
    </div>

    <p class="feed" id="feed-line" aria-live="off"><span class="feed-dot" aria-hidden="true"></span><span id="feed">${site.company} · apps, SaaS and agent infrastructure</span></p>

    <div class="tools" id="tools" hidden>
      <button type="button" id="sea" class="sea" title="Stand at the railing and look out to sea"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5 11a5 5 0 0 1 10 0" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2 14h16M5 17h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span id="sea-label">Look out to sea</span></button>
      <button type="button" id="zoom-in" aria-label="Zoom in">+</button>
      <button type="button" id="zoom-out" aria-label="Zoom out">&minus;</button>
      <button type="button" id="reset" aria-label="Back to the overview">&#8634;</button>
    </div>
  </div>

  <div class="coach" id="coach" hidden aria-live="polite"><span id="coach-text"></span><button type="button" id="coach-x" aria-label="Dismiss the hint">&times;</button></div>

  <aside class="card" id="card" hidden aria-labelledby="card-name">
    <button type="button" class="card-x" id="card-x" aria-label="Close">&times;</button>
    <img class="card-logo" id="card-logo" alt="" width="44" height="44">
    <p class="card-status" id="card-status"></p>
    <h2 class="card-name" id="card-name"></h2>
    <p class="card-figure"><b id="card-value"></b> <span id="card-label"></span> <small class="fresh" id="card-fresh" hidden></small></p>
    <p class="card-line" id="card-line"></p>
    <ul class="card-facts" id="card-facts"></ul>
    <p class="card-live" id="card-live"></p>
    <a class="card-link" id="card-link" href="#" rel="noopener">Visit</a>
  </aside>

  <a class="scroll-cue" href="#products" aria-label="Scroll to the products"><span></span></a>`

/** The import map is filled in by the build (it maps every town module to its fingerprinted file). */
export const IMPORT_MAP = '<!--importmap-->'

export function home(posts: Post[], css: string): string {
  const running = products.filter((p) => p.status !== 'retired')
  const retired = products.filter((p) => p.status === 'retired')
  const body = `<a class="skip" href="#products">Skip to the products</a>

<header class="hero" id="top">
  ${HERO}

  ${nav('', '#top')}

  <div class="title">
    <h1>${site.person}</h1>
    <p class="lede">I build apps, SaaS and infrastructure for AI agents, at ${site.company.replace(' ', '&nbsp;')} in&nbsp;${site.location}.</p>
  </div>

  ${HUD}
</header>

<main id="main">
  <section class="products" id="products" aria-labelledby="products-title">
    <div class="wrap">
      <p class="eyebrow">Products</p>
      <h2 id="products-title">Every lit sign on the promenade is a real product.</h2>
      <p class="intro">${site.company} builds what earns its keep: apps, SaaS and infrastructure for AI agents. ${census(running)}</p>

      <ol class="cards">
        ${running.map(productCard).join('\n        ')}
      </ol>

      <div class="retired">
        <h3 class="eyebrow">Retired, lights off</h3>
        <ul>
          ${retired.map((p) => `<li><b>${esc(p.name)}</b> <span>${p.since} · ${esc(p.line)}${p.figure ? ` ${esc(p.figure.value)} ${esc(p.figure.label)}.` : ''}</span></li>`).join('\n          ')}
        </ul>
      </div>
    </div>
  </section>

  <section class="writing" aria-labelledby="writing-title">
    <div class="wrap writing-grid">
      <h2 id="writing-title" class="eyebrow">Writing</h2>
      <div>
        <ul class="posts">${posts.slice(0, 5).map((p) => `<li><a href="${p.path}"><time datetime="${p.date}">${fmtDate(p.date)}</time><span class="t">${esc(p.title)}</span><span class="arrow" aria-hidden="true">→</span></a></li>`).join('')}</ul>
        <a class="all" href="/write/">All writing</a>
      </div>
    </div>
  </section>

  <section class="about" aria-labelledby="about-title">
    <div class="wrap about-grid">
      <h2 id="about-title" class="eyebrow">About the town</h2>
      <p>Everyone on the promenade keeps a schedule. Inès runs at six, Marcel sets out the chairs just before seven, Henri and Odile take the good bench mid-morning, and at sunset half the town leans on the railing. When someone gets home after dark, their window lights up; when they go to bed, it goes out. Left alone, the town follows the clock in Oslo. Drag the sun and everyone reschedules.</p>
      <p class="small">Built with three.js and a library of low-poly people, buildings and props made for this site. The figures on the shop screens are the products' real numbers. <a href="/stack/">How it is built</a>.</p>
    </div>
  </section>
</main>`
  return layout({
    title: `${site.person} · ${site.company}`, description: site.description, path: '/', css, body, mdPath: '/index.md', footer: mcpTabs(),
    head: `<link rel="preload" as="image" imagesrcset="/assets/town/poster/poster-1280.jpg 1280w, /assets/town/poster/poster-1920.jpg 1920w" imagesizes="100vw" media="(min-aspect-ratio: 1/1)" fetchpriority="high">
<link rel="preload" as="image" imagesrcset="/assets/town/poster/poster-tall-720.jpg 720w, /assets/town/poster/poster-tall-1080.jpg 1080w" imagesizes="100vw" media="(max-aspect-ratio: 1/1)" fetchpriority="high">
${IMPORT_MAP}
<link rel="modulepreload" href="/assets/town/js/main.js">`,
    scripts: `${TABS_SCRIPT}\n<script type="module" src="/assets/town/js/main.js"></script>`,
  })
}

/* ---------------------------------------------------------------- inner pages */

function pageTop(current: string) {
  return `<a class="skip" href="#main">Skip to content</a>\n<header>${nav(current)}</header>`
}

export function buildPage(css: string): string {
  const LOGOS: Record<string, string> = { luma: '/assets/logos/luma.png' }
  const icon = (p: Product) => {
    const src = TOWN[p.id]?.logo ?? LOGOS[p.id]
    return src ? `<img class="icon" src="${src}" width="48" height="48" alt="" loading="lazy">` : `<span class="icon empty" aria-hidden="true">${esc((p.short ?? p.name).charAt(0))}</span>`
  }
  const rows = products.map((p) => `<li${p.status === 'retired' ? ' class="retired"' : ''}>
    ${icon(p)}
    <div><h2>${p.url ? `<a href="${p.url}">${esc(p.name)}</a>` : esc(p.name)}</h2><p class="m"><span class="st st-${p.status}">${STATUS[p.status]}</span><time>${p.since}</time></p></div>
    <p class="l">${esc(p.line)}</p>
    <p class="f"${p.figure ? ` data-figure="${p.id}"` : ''}>${p.figure ? `${esc(p.figure.value)}<small>${esc(p.figure.label)}</small>` : ''}</p>
  </li>`).join('')
  const body = `${pageTop('/build/')}<main id="main"><div class="wrap">
    <p class="eyebrow">Products</p>
    <h1 class="h1">Everything I have shipped</h1>
    <p class="lede">Live, being built, paused and retired. Published on Google Play since ${site.playSince}.</p>
    <ul class="ledger">${rows}</ul>
    <h2 class="section-h">Day job</h2>
    <ul class="daylist">${dayJob.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
  </div></main>`
  return layout({ title: `Products · ${site.company}`, description: 'Every product Asgeir Albretsen has shipped: live, building, paused and retired.', path: '/build/', css, body, bodyClass: 'page', mdPath: '/build.md', scripts: '<script type="module" src="/assets/js/figures.js"></script>' })
}

export function writePage(posts: Post[], css: string): string {
  const body = `${pageTop('/write/')}<main id="main"><div class="wrap">
    <p class="eyebrow">Writing</p>
    <h1 class="h1">Notes on building and money</h1>
    <ul class="postlist">${posts.map((p) => `<li><a href="${p.path}"><time datetime="${p.date}">${fmtDate(p.date)}</time><span class="t">${esc(p.title)}</span><span class="x">${esc(p.excerpt)}</span><span class="tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</span></a></li>`).join('')}</ul>
  </div></main>`
  return layout({ title: `Writing · ${site.company}`, description: 'Writing by Asgeir Albretsen on building software products and money.', path: '/write/', css, body, bodyClass: 'page', mdPath: '/write.md' })
}

export function postPage(p: Post, css: string, extraScripts = ''): string {
  const langs = p.alternates.length > 1 ? `<span class="lang">${p.alternates.map((a) => `<a href="${a.path}" hreflang="${a.lang}" lang="${a.lang}"${a.lang === p.lang ? ' aria-current="true"' : ''}>${a.lang === 'en' ? 'English' : 'Norsk'}</a>`).join('')}</span>` : ''
  const body = `${pageTop('/write/')}<main id="main"><article>
    <header class="post-head">
      <p class="eyebrow">${p.tags.map(esc).join(' · ')}</p>
      <h1 class="h1">${esc(p.title)}</h1>
      <p class="post-meta"><time datetime="${p.date}">${fmtDate(p.date, p.lang)}</time>${langs}</p>
    </header>
    <div class="prose">${p.html}</div>
    <nav class="post-end" aria-label="More"><a class="go" href="/write/">${p.lang === 'nb' ? 'Alt jeg har skrevet' : 'All writing'}</a><a class="go" href="/">${site.company}</a></nav>
  </article></main>`
  const head = p.alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${site.origin}${a.path}">`).join('')
  return layout({ title: `${p.title} · ${site.person}`, description: p.excerpt, path: p.path, css, body, bodyClass: 'page', lang: p.lang, head, scripts: extraScripts, mdPath: p.path.replace(/\/$/, '.md'), ogType: 'article' })
}

export const STACK: [string, string][] = [
  ['Build', 'A small TypeScript script renders every page to static HTML from <code>site/data.ts</code> and the Markdown posts. No framework, no client-side router.'],
  ['One source of facts', 'Every product, figure and one-liner lives in <code>site/data.ts</code>. The build writes them into the pages and into a small module the town reads, so a shop sign and a product card never disagree.'],
  ['The town', 'three.js, vendored, with no build step. The buildings, props, seventeen townspeople and a terrier are glTF models made for this site. Sky, sea, bloom and a tilt-shift depth of field are custom shaders, and everyone in town keeps a schedule.'],
  ['First paint', 'A poster rendered from the same scene paints first. The town loads after it, fades in over it, and drops its resolution before it drops frames.'],
  ['Delivery', 'Cloudflare Workers with static assets. A small Worker answers <code>/mcp</code>, <code>/api/events</code> and <code>/api/figures</code>; everything else is served straight from the edge.'],
  ['Live data', 'Products post anonymous events and their latest figures. One Durable Object keeps the last 50 events and the figures and pushes updates over a hibernating WebSocket. While there are no events, the town’s ticker runs on demo data and says so.'],
  ['MCP', 'The site is a read-only MCP server over Streamable HTTP: products, posts and contact, with the live figures laid over the build-time ones.'],
  ['Budgets', 'CSS is inlined, and the homepage’s first response stays under 14 KB compressed. The build checks it, and the size of the town’s code, on every run.'],
  ['Caching', 'Every asset carries a hash of its content in its file name, so it can be cached for a year and a deploy never serves a stale file.'],
  ['Type', 'Federo for names and headings, Instrument Sans for text and Poiret One for the big figures. Self-hosted Latin subsets.'],
  ['Motion', 'With reduced motion the page shows the poster and a button to open the town. Without WebGL the poster stands, and everything else reads the same.'],
  ['Navigation', 'Links prerender on hover with the Speculation Rules API, so most clicks show the next page at once.'],
]

export function stackPage(css: string): string {
  const endpoints: [string, string][] = [
    ['/mcp', 'MCP server (Streamable HTTP). Tools: list_products, get_product, list_posts, get_post, contact.'],
    ['/llms.txt', 'A plain index of the site for language models.'],
    ['/index.md', 'Every page has a Markdown twin: add .md to the path.'],
    ['/api/events', 'The latest anonymised events from the products, as JSON. /api/events/socket streams them over a WebSocket.'],
    ['/api/figures', 'The latest figure for each product, as JSON. Updates also arrive on the socket.'],
    ['/api/content.json', 'Everything the MCP server knows, as one file.'],
    ['/sitemap.xml', 'Every page, for search engines.'],
  ]
  const body = `${pageTop('/stack/')}<main id="main"><div class="wrap">
    <p class="eyebrow">Stack</p>
    <h1 class="h1">How this site is built</h1>
    <p class="lede">Static pages, a small town in three.js and one Worker. The footer of every page shows what that page cost your browser to load.</p>
    <dl class="specs">${STACK.map(([k, v]) => `<div class="spec"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    <h2 class="section-h">For machines</h2>
    <ul class="endpoints">${endpoints.map(([p, d]) => `<li><a href="${p}">${p}</a><span>${d}</span></li>`).join('')}</ul>
    <h2 class="section-h" id="clients">Add the MCP server</h2>
    <ul class="endpoints">${mcpClients.map((c) => `<li><span>${esc(c.name)}${c.file ? `<br><small>${esc(c.file)}</small>` : ''}</span><code>${esc(c.text)}</code></li>`).join('')}</ul>
  </div></main>`
  return layout({ title: `Stack · ${site.company}`, description: 'How albretsen.no is built and served: static HTML, a three.js town and a Cloudflare Worker.', path: '/stack/', css, body, bodyClass: 'page', mdPath: '/stack.md' })
}

export function notFound(css: string): string {
  const body = `${pageTop('')}<main id="main"><div class="wrap"><p class="eyebrow">404</p><h1 class="h1">Nothing here</h1><p class="lede">This street does not exist. <a class="go" href="/">Back to the town</a></p></div></main>`
  return layout({ title: `Not found · ${site.company}`, description: 'Page not found.', path: '/404', css, body, bodyClass: 'page' })
}
