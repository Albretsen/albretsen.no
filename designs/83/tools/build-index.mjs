// Generates designs/83/index.html from content.js so every fact is the canonical one.
import { readFileSync, writeFileSync } from 'node:fs'
// Run from anywhere: node designs/83/tools/build-index.mjs
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '')
const { content: c } = await import(root + '/designs/_shared/content.js')
const lq1 = readFileSync(root + '/designs/83/assets/hero/first-light-lqip.txt', 'utf8').trim()
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const roman = ['I', 'II', 'III', 'IV']
const HOUR = { 'mcp-emails': 'at sunrise', 'fun-libs': 'at noon', toolrails: 'cresting the ridge', harbor: 'at blue hour' }
const STATUS = { live: 'Live', building: 'Building', paused: 'Paused' }
const frame = `<svg class="pf" viewBox="0 0 400 500" fill="none" stroke="currentColor" preserveAspectRatio="none" aria-hidden="true"><rect x="0.5" y="0.5" width="399" height="499" vector-effect="non-scaling-stroke" opacity=".55"/><rect x="10.5" y="10.5" width="379" height="479" vector-effect="non-scaling-stroke" opacity=".9"/><path d="M200 0v8M200 492v8M0 250h8M392 250h8M0 22h6M22 0v6M394 22h6M378 0v6M0 478h6M22 494v6M394 478h6M378 494v6" vector-effect="non-scaling-stroke"/></svg>`
const active = c.products.filter((p) => p.status !== 'retired')
const retired = c.products.filter((p) => p.status === 'retired')
const plates = active.map((p, i) => {
  const src = (ext) => [480, 800, 1200].map((w) => `assets/products/${p.id}-${w}.${ext} ${w}w`).join(', ')
  const sizes = '(min-width: 1180px) 22vw, (min-width: 620px) 45vw, 92vw'
  return `
      <li class="plate" data-status="${p.status}" style="--i:${i}">
        <figure>
          <div class="frame">${frame}
            <div class="pic">
              <picture>
                <source type="image/avif" srcset="${src('avif')}" sizes="${sizes}">
                <source type="image/webp" srcset="${src('webp')}" sizes="${sizes}">
                <img src="assets/products/${p.id}-800.jpg" width="800" height="1000" loading="lazy" decoding="async" alt="The ${esc(p.name)} logo carried by the sun, ${HOUR[p.id]}, over painted mesas">
              </picture>
              <span class="sweep" aria-hidden="true"></span>
            </div>
          </div>
          <figcaption>
            <div class="row"><span class="mono no">Pl. ${roman[i]}</span><span class="mono status">${STATUS[p.status]} · ${p.since}</span></div>
            <h3><span>${esc(p.name)}</span> <span class="hour">${HOUR[p.id]}</span></h3>
            <p class="line">${esc(p.line)}</p>
            <div class="fig"><b>${esc(p.figure.value)}</b><span class="mono">${esc(p.figure.label)}</span></div>
            <ul class="facts mono">${(p.facts || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
          </figcaption>
        </figure>
        ${p.url ? `<a class="cover" href="${p.url}" rel="noopener"><span class="sr-only">${esc(p.name)}, ${esc(p.url.replace('https://', ''))}</span></a>` : ''}
      </li>`
}).join('')
const DIM = { 'polyglot-pilot': [360, 450], pinpoint: [360, 544], webvakt: [360, 413], 'joke-central': [360, 493], 'tryggere-hyring': [360, 540], 'early-apps': [360, 749] }
const specimens = retired.map((p) => {
  const img = p.id === 'luma'
    ? `<img class="paint" src="assets/products/luma-480.webp" width="480" height="600" loading="lazy" decoding="async" alt="The Luma logo on a set sun">`
    : `<img src="assets/products/retired/${p.id}-sand.webp" width="${DIM[p.id][0]}" height="${DIM[p.id][1]}" loading="lazy" decoding="async" alt="">`
  const fig = p.figure ? `${esc(p.figure.value)} ${esc(p.figure.label)} · ` : ''
  return `
      <li class="specimen">
        <div class="box">${frame}${img}</div>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.line)}</p>
        <span class="mono">${fig}${p.since}</span>
      </li>`
}).join('')

const mark = (id) => `<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><defs><linearGradient id="sun-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eedbbd"/><stop offset=".45" stop-color="#e8a95c"/><stop offset="1" stop-color="#bc6449"/></linearGradient><mask id="bands-${id}"><rect width="64" height="64" fill="#fff"/><g fill="#000"><rect x="0" y="29.2" width="64" height="1.20"/><rect x="0" y="33.6" width="64" height="1.80"/><rect x="0" y="38.0" width="64" height="2.60"/><rect x="0" y="42.4" width="64" height="3.40"/></g></mask></defs><circle cx="32" cy="27" r="23" fill="url(#sun-${id})" mask="url(#bands-${id})"/><rect class="cursor" x="17" y="55" width="30" height="4.2" rx="0.6" fill="#7defda"/></svg>`
const heroSrc = (name, ext) => [828, 1280, 1920, 2560].map((w) => `assets/hero/${name}-${w}.${ext} ${w}w`).join(', ')
const portSrc = (name, ext) => [600, 900].map((w) => `assets/hero/${name}-portrait-${w}.${ext} ${w}w`).join(', ')
const heroPicture = (name, cls, prio) => `
      <picture class="${cls}">
        <source media="(max-width: 700px)" type="image/avif" srcset="${portSrc(name, 'avif')}" sizes="100vw">
        <source media="(max-width: 700px)" type="image/webp" srcset="${portSrc(name, 'webp')}" sizes="100vw">
        <source media="(max-width: 700px)" srcset="${portSrc(name, 'jpg')}" sizes="100vw">
        <source type="image/avif" srcset="${heroSrc(name, 'avif')}" sizes="100vw">
        <source type="image/webp" srcset="${heroSrc(name, 'webp')}" sizes="100vw">
        <img src="assets/hero/${name}-1280.jpg" width="1280" height="720" ${prio ? 'fetchpriority="high"' : 'loading="lazy" fetchpriority="low"'} decoding="async" alt="${prio ? 'An airbrushed painting: dawn over flat-topped mesas, a banded sun rising on the horizon' : ''}">
      </picture>`

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Asgeir Albretsen · Albretsen AS</title>
<meta name="description" content="Asgeir Albretsen builds quiet software that pays for itself: apps, SaaS and the infrastructure AI agents run on. Albretsen AS, Norway.">
<meta name="theme-color" content="#041419">
<meta property="og:title" content="Asgeir Albretsen · Albretsen AS">
<meta property="og:description" content="Quiet software that pays for itself.">
<meta property="og:image" content="assets/brand/og-image-1200x630.jpg">
<link rel="icon" href="assets/brand/favicon.svg" type="image/svg+xml">
<link rel="icon" href="assets/brand/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="assets/brand/apple-touch-icon-180.png">
<link rel="preload" href="assets/fonts/newsreader-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/martian-mono-latin.woff2" as="font" type="font/woff2" crossorigin>
<script>
  // Before first paint: decide whether this visit powers on (first visit in the session, motion allowed).
  (function () {
    var d = document.documentElement; d.classList.add('js')
    var still = matchMedia('(prefers-reduced-motion: reduce)').matches, seen = false
    try { seen = sessionStorage.getItem('wb83-booted') === '1' } catch (e) {}
    if (!still && !seen && !/[?&](noboot|still)/.test(location.search)) d.classList.add('booting')
  })()
</script>
<link rel="stylesheet" href="css/site.css">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js" defer></script>
<script type="module" src="js/main.js"></script>
</head>
<body>
<a class="skip-link" href="#products">Skip to products</a>

<div class="boot" aria-hidden="true">
  <div class="boot-log" id="bootLog"></div>
</div>
<button class="boot-skip" type="button" id="bootSkip">Skip boot</button>

<header class="masthead">
  <a class="brand blink" href="./" aria-label="Albretsen AS, home">${mark('nav')}<span class="mono">Albretsen AS</span></a>
  <nav aria-label="Primary">
    <a href="#products">Products</a>
    <a class="nav-extra" href="#archive">Archive</a>
    <a class="nav-extra" href="mailto:${c.email}">Email</a>
    <button class="ghost-btn" type="button" id="soundBtn" aria-pressed="false">Sound off</button>
  </nav>
</header>

<main>
  <section class="hero" id="hero" aria-labelledby="heroTitle">
    <div class="hero-media" style="background-image:url('${lq1}')">${heroPicture('first-light', 'first', true)}${heroPicture('blue-hour', 'blue', false)}
    </div>
    <div class="signal" id="signal" aria-hidden="true"><canvas id="field"></canvas></div>
    <div class="hero-veil" aria-hidden="true"></div>
    <div class="grain" aria-hidden="true"></div>
    <div class="lens-ring" id="lensRing" aria-hidden="true"><i></i><span class="mono">Signal</span></div>

    <div class="hero-copy">
      <p class="label" data-decode>Albretsen AS · Software · Norway</p>
      <h1 id="heroTitle" data-decode-h>Asgeir Albretsen</h1>
      <p class="lede">Builds quiet software that <em>pays for itself</em>: apps, SaaS and the infrastructure AI agents run on.</p>
      <div class="hero-meta">
        <div class="cmd">
          <code id="cmdText">${c.mcpCommand}</code>
          <button type="button" id="copyBtn" aria-describedby="cmdText">Copy</button>
        </div>
        <p class="feed mono"><span class="dot" id="feedDot" aria-hidden="true"></span><span class="sr-only">Live: </span><output id="feed">Running</output></p>
      </div>
    </div>

    <div class="hero-tools">
      <button class="ghost-btn" type="button" id="signalBtn" aria-pressed="false">View signal</button>
    </div>
  </section>

  <section class="plates" id="products" aria-labelledby="productsTitle">
    <div class="wrap">
      <header class="sec-head">
        <p class="label" data-decode>01 · Products in service</p>
        <h2 id="productsTitle">Each product is a sun, <em>at its own hour.</em></h2>
        <p>The hour is the status. Risen is live, cresting is being built, blue hour is paused. The real logo sits in the sun, unchanged.</p>
      </header>
      <ol class="plate-grid">${plates}
      </ol>
    </div>
  </section>

  <section class="archive" id="archive" aria-labelledby="archiveTitle">
    <div class="wrap">
      <header class="sec-head">
        <p class="label" data-decode>02 · Archive</p>
        <h2 id="archiveTitle">Retired, <em>and kept on file.</em></h2>
        <p>Closed products, filed as specimens from a 1904 plate of radiolarians. Luma keeps its own logo on a set sun.</p>
      </header>
      <ol class="specimens">${specimens}
      </ol>
    </div>
  </section>
</main>

<footer class="foot">
  <img class="strip" src="assets/extras/horizon-dusk.webp" width="2400" height="220" loading="lazy" decoding="async" alt="">
  <div class="foot-inner">
    <div>
      <p class="avail">${c.availability.replace('one outside engagement', '<em>one outside engagement</em>')}</p>
      <a class="mail" href="mailto:${c.email}">${c.email}</a>
    </div>
    <div class="meta mono">
      <span class="blink" style="display:inline-flex;align-items:center;gap:10px">${mark('foot')}${c.company} · ${c.location}</span>
      <span>On Google Play since ${c.history.playDeveloperSince}</span>
      <button class="ghost-btn" type="button" id="rebootBtn">Reboot</button>
    </div>
  </div>
</footer>
</body>
</html>
`
writeFileSync(root + '/designs/83/index.html', html)
console.log('ok', html.length)
