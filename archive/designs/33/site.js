// Uranographia — page wiring for design 33. Vanilla ES modules, Web Animations API throughout.
import { content } from '../_shared/content.js';
import { createFeed, formatTime } from '../_shared/feed.js';
import { PRODUCTS, OBSOLETE } from './assets/js/sky-data.js';
import { mountChart } from './assets/js/uranographia.js';
import { ignite, rise } from './assets/js/motion.js';
import { el } from './assets/js/draw.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const params = new URLSearchParams(location.search);
const OUT = 'cubic-bezier(.16,1,.3,1)';
const ORBIT = 'cubic-bezier(.34,1.36,.64,1)';
const ROMAN = ['I', 'II', 'III', 'IV'];
const byId = Object.fromEntries(content.products.map((p) => [p.id, p]));

/* ------------------------------------------------------------------ 1. Ignition (loader) */
const heroImg = $('.hero-ground img');
const heroReady = Promise.all([
  document.fonts.ready,
  heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve(),
]);
let revealed;
if (!params.has('noloader')) {
  revealed = ignite({ until: heroReady });
  const skip = () => {
    const ov = $('.u-ignition');
    if (ov) ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).finished.then(() => ov.remove());
  };
  addEventListener('keydown', (e) => { if (e.key === 'Escape') skip(); }, { once: true });
  document.addEventListener('pointerdown', skip, { once: true });
} else revealed = heroReady;

/* ------------------------------------------------------------------ 2. Chart (centrepiece) */
const skyHost = $('#sky');
let chart;
await document.fonts.ready;
chart = mountChart(skyHost);
$('.sky-still')?.remove();

// Heading rises once the night has collapsed into the apex star.
revealed.then(() => {
  if (reduce) return;
  $$('.hero h1 .line > *').forEach((n, i) => n.animate(
    [{ transform: 'translateY(105%)', filter: 'blur(6px)' }, { transform: 'none', filter: 'blur(0)' }],
    { duration: 1200, delay: i * 110, easing: OUT, fill: 'backwards' }));
  $$('.kicker, .lede, .hero-actions, .observatory').forEach((n, i) => n.animate(
    [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
    { duration: 1000, delay: 260 + i * 90, easing: OUT, fill: 'backwards' }));
});

// Reading toggle (Radix ToggleGroup anatomy: role=group, aria-pressed, roving arrows)
const readingBtns = $$('.u-reading button');
const setReading = (r) => {
  chart.setReading(r);
  readingBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.r === r)));
};
readingBtns.forEach((b, i) => {
  b.addEventListener('click', () => setReading(b.dataset.r));
  b.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const n = readingBtns[(i + (e.key === 'ArrowRight' ? 1 : -1) + readingBtns.length) % readingBtns.length];
    n.focus(); setReading(n.dataset.r);
  });
});

/* ------------------------------------------------------------------ 3. Live sky: every real event is a meteor */
// Each event falls (gravity easing) into its product's figure and leaves a new faint star there.
const svg = chart.svg;
const CENTRES = { 'mcp-emails': [435, 255], 'fun-libs': [755, 235], toolrails: [445, 530], harbor: [755, 535], 'albretsen.no': [600, 410] };
const d = el('defs', {}, svg);
const grad = el('linearGradient', { id: 'meteor-grad', gradientUnits: 'objectBoundingBox', x1: 0, y1: 0, x2: 1, y2: 1 }, d);
el('stop', { offset: 0, 'stop-color': '#eceaee', 'stop-opacity': 0 }, grad);
el('stop', { offset: 1, 'stop-color': '#eceaee', 'stop-opacity': .95 }, grad);
const live = el('g', { class: 'u-live', 'aria-hidden': 'true' }, svg);
const newStars = el('g', {}, live);
let tonight = 0;
const tonightEl = $('[data-tonight]');
let ledger = false;
svg.addEventListener('reading', (e) => {
  ledger = e.detail === 'ledger';
  live.animate([{ opacity: ledger ? 1 : 0 }, { opacity: ledger ? 0 : 1 }], { duration: 500, fill: 'forwards' });
});

let seed = 0xc4bb0d;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

function meteor(e) {
  const c = CENTRES[e.product] || CENTRES['albretsen.no'];
  const tx = c[0] + (rnd() - .5) * 120, ty = c[1] + (rnd() - .5) * 110;
  tonight++; tonightEl.textContent = tonight;
  const star = el('circle', { cx: tx.toFixed(1), cy: ty.toFixed(1), r: (.7 + rnd() * .8).toFixed(2), class: 'u-newstar' }, newStars);
  if (newStars.childElementCount > 80) newStars.firstElementChild.remove();
  if (reduce || document.hidden || ledger) { star.setAttribute('opacity', .7); return; }
  // entry from upper right, falling at a shallow angle (a vector, not a straight drop)
  const sx = tx + 160 + rnd() * 220, sy = ty - 220 - rnd() * 120;
  const path = el('path', { d: `M${sx} ${sy}L${tx} ${ty}`, pathLength: 1, class: 'u-meteor', 'stroke-width': 1.3, 'stroke-dasharray': '.22 1.4' }, live);
  const dur = 780 + rnd() * 360;
  path.animate([{ strokeDashoffset: .22 }, { strokeDashoffset: -1 }], { duration: dur, easing: 'cubic-bezier(.55,0,.9,.4)', fill: 'forwards' })
    .finished.then(() => path.remove());
  star.animate([{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'scale(3)', offset: .25 }, { opacity: .7, transform: 'scale(1)' }],
    { duration: 1500, delay: dur * .86, easing: OUT, fill: 'backwards' });
  star.style.transformBox = 'fill-box'; star.style.transformOrigin = 'center';
  const ring = el('circle', { cx: tx, cy: ty, r: 3, fill: 'none', stroke: '#eceaee', 'stroke-width': .8 }, live);
  ring.style.transformBox = 'fill-box'; ring.style.transformOrigin = 'center';
  ring.animate([{ transform: 'scale(.4)', opacity: .9 }, { transform: 'scale(7)', opacity: 0 }], { duration: 1100, delay: dur * .86, easing: OUT, fill: 'both' })
    .finished.then(() => ring.remove());
  setTimeout(() => chime(e.product), dur * .86);
}

/* observation log */
const log = $('.obs-log');
let obsN = 400 + Math.floor(rnd() * 200);
function detail(e) {
  if (e.ms) return `${e.ms} ms`;
  if (e.country) return e.country;
  if (e.sha) return `${e.sha} · ${e.kb} KB`;
  if (e.city) return `${e.city} · ${e.kb} KB`;
  return '';
}
function logItem(e, animate) {
  const li = document.createElement('li');
  li.innerHTML = `<span class="t">OBS. ${String(++obsN).padStart(4, '0')} · ${formatTime(e.time)}</span><span class="who"></span><span class="what"></span>`;
  li.querySelector('.who').textContent = e.label;
  li.querySelector('.what').textContent = `${e.text}${detail(e) ? ' · ' + detail(e) : ''}`;
  log.prepend(li);
  while (log.children.length > 6) log.lastElementChild.remove();
  if (animate && !reduce) {
    li.animate([{ opacity: 0, transform: 'translateY(-10px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 700, easing: OUT });
    [...log.children].slice(1, 4).forEach((n) => n.animate([{ transform: 'translateX(-14px)' }, { transform: 'none' }], { duration: 600, easing: OUT }));
  }
}
const feed = createFeed();
feed.recent(4).reverse().forEach((e) => logItem(e, false));
revealed.then(() => {
  // the backlog arrives as a small shower, then live events one by one
  feed.recent(6).forEach((e, i) => setTimeout(() => meteor(e), 500 + i * 380));
  feed.subscribe((e) => { logItem(e, true); meteor(e); });
});

/* ------------------------------------------------------------------ 4. The pointer lens (gravity, made visible) */
const hero = $('.hero');
const lensEl = $('.lens');
const coord = $('.lens-coord');
if (fine && !reduce) {
  let lx = 0, ly = 0, tx = 0, ty = 0, raf = 0;
  const step = () => {
    lx += (tx - lx) * .2; ly += (ty - ly) * .2;
    lensEl.style.transform = `translate(${lx}px, ${ly}px)`;
    if (Math.abs(tx - lx) + Math.abs(ty - ly) > .2) raf = requestAnimationFrame(step); else raf = 0;
  };
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    tx = e.clientX - r.left; ty = e.clientY - r.top;
    if (!hero.classList.contains('lensing')) { lx = tx; ly = ty; }
    const overChart = e.target.closest('.uranographia');
    hero.classList.toggle('lensing', !!overChart);
    hero.classList.toggle('on-fig', !!e.target.closest('.u-fig.live'));
    // a fake but plausible sky coordinate for the plate under the lens
    const ra = (5 + (tx / r.width) * 1.6), dec = -5 - (ty / r.height - .5) * 18;
    const h = Math.floor(ra), m = Math.floor((ra - h) * 60);
    const dd = Math.trunc(dec), dm = Math.abs(Math.round((dec - dd) * 60));
    coord.textContent = `RA ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m · DEC ${dec < 0 ? '−' : '+'}${String(Math.abs(dd)).padStart(2, '0')}° ${String(dm).padStart(2, '0')}′`;
    if (!raf) raf = requestAnimationFrame(step);
  });
  hero.addEventListener('pointerleave', () => hero.classList.remove('lensing', 'on-fig'));
}

/* ------------------------------------------------------------------ 5. Products: the four plates */
const platesHost = $('[data-plates]');
const arrow = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15L15 5M7 5h8v8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const ringSVG = () => {
  let t = '';
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, l = i % 5 ? 3 : 7; t += `M${50 + Math.cos(a) * 47} ${50 + Math.sin(a) * 47}L${50 + Math.cos(a) * (47 + l)} ${50 + Math.sin(a) * (47 + l)}`; }
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" stroke-width=".6"/><path d="${t}" stroke="currentColor" stroke-width=".6"/><path d="M50 -4L52 0L50 4L48 0Z" fill="currentColor"/></svg>`;
};
PRODUCTS.forEach((sp, i) => {
  const p = byId[sp.id];
  const host = new URL(p.url).host;
  const art = document.createElement('article');
  art.className = 'plate';
  art.dataset.id = p.id;
  art.innerHTML = `
    <a class="plate-frame" href="${p.url}" tabindex="-1" aria-hidden="true">
      <img src="assets/products/${p.id}-plate-600.webp" srcset="assets/products/${p.id}-plate-600.webp 600w, assets/products/${p.id}-plate-1200.webp 1200w"
        sizes="(max-width: 520px) 92vw, (max-width: 1180px) 46vw, 23vw" width="1200" height="1500" loading="lazy" decoding="async" alt="">
      <span class="lens-ring">${ringSVG()}</span>
    </a>
    <div class="plate-meta"><span>Tab. ${ROMAN[i]} · ${sp.latin}</span><span class="status" data-s="${p.status}">${p.status}</span></div>
    <h3><a href="${p.url}" aria-label="${p.name}, ${host}">${p.name}${arrow}</a></h3>
    <p class="line"></p>
    <div class="figure"><b>${p.figure.value}</b><span>${p.figure.label} · since ${p.since}</span></div>
    <div class="acc">
      <h4 style="margin:0"><button class="acc-trigger" type="button" aria-expanded="false" aria-controls="acc-${p.id}" id="acc-t-${p.id}" data-state="closed">
        <span>Catalogue entry</span>
        <svg class="u-ephemeris-star" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 0C6.2 4 8 5.8 12 6C8 6.2 6.2 8 6 12C5.8 8 4 6.2 0 6C4 5.8 5.8 4 6 0Z" fill="currentColor"/></svg>
      </button></h4>
      <div class="acc-content u-ephemeris" id="acc-${p.id}" role="region" aria-labelledby="acc-t-${p.id}" data-state="closed">
        <ul>${(p.facts || []).map((f) => `<li></li>`).join('')}</ul>
        <p class="datum">${sp.datum} · ${host}</p>
      </div>
    </div>`;
  art.querySelector('.line').textContent = p.line;
  art.querySelectorAll('.acc-content li').forEach((li, k) => { li.textContent = p.facts[k]; });
  art.querySelector('img').alt = `Tab. ${ROMAN[i]}, ${sp.latin}: ${p.name} drawn as a constellation, ${sp.datum}, with the real ${p.name} logo in the lens.`;
  platesHost.appendChild(art);
});
// the trigger star moves with the button's state (motion.css: [data-state] > .u-ephemeris-star)
$$('.acc-trigger').forEach((t) => {
  const c = document.getElementById(t.getAttribute('aria-controls'));
  t.addEventListener('click', () => {
    const open = t.getAttribute('aria-expanded') !== 'true';
    t.setAttribute('aria-expanded', String(open));
    t.dataset.state = open ? 'open' : 'closed';
    if (open) {
      c.dataset.state = 'open';
      c.style.setProperty('--radix-accordion-content-height', c.scrollHeight + 'px');
    } else if (reduce) {
      c.dataset.state = 'closed';
    } else {
      c.style.setProperty('--radix-accordion-content-height', c.scrollHeight + 'px');
      c.dataset.state = 'closing';
      c.animate([{ height: c.scrollHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.65,0,.35,1)' })
        .finished.then(() => { if (t.dataset.state === 'closed') c.dataset.state = 'closed'; });
    }
  });
});

// Tilt + glare + lens ring (Lensing). Pointer drives a perspective tilt; release eases back on an overshoot.
if (fine && !reduce) {
  $$('.plate').forEach((pl) => {
    const fr = pl.querySelector('.plate-frame');
    pl.addEventListener('pointermove', (e) => {
      const r = fr.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      fr.style.setProperty('--ry', `${(x - .5) * 9}deg`);
      fr.style.setProperty('--rx', `${(.5 - y) * 9}deg`);
      fr.style.setProperty('--gx', `${x * 100}%`);
      fr.style.setProperty('--gy', `${y * 100}%`);
    });
    pl.addEventListener('pointerenter', () => { pl.classList.add('hot'); globeApi?.focus(pl.dataset.id); markSeek(pl.dataset.id); });
    pl.addEventListener('pointerleave', () => { pl.classList.remove('hot'); fr.style.setProperty('--rx', '0deg'); fr.style.setProperty('--ry', '0deg'); });
  });
}
$$('.plate h3 a').forEach((a) => {
  const pl = a.closest('.plate');
  a.addEventListener('focus', () => pl.classList.add('hot'));
  a.addEventListener('blur', () => pl.classList.remove('hot'));
});
rise($$('.plate-frame'));

/* ------------------------------------------------------------------ 6. Globe (lazy) */
let globeApi = null;
const seek = $('.seek');
const pill = $('.seek-pill');
const seekBtns = $$('.seek button');
function markSeek(id, animate = true) {
  const b = seekBtns.find((x) => x.dataset.focus === id); if (!b) return;
  seekBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  const to = { transform: `translate(${b.offsetLeft}px, ${b.offsetTop - 3}px)`, width: `${b.offsetWidth}px` };
  if (!animate || reduce) { Object.assign(pill.style, to); return; }
  const from = { transform: pill.style.transform || to.transform, width: pill.style.width || to.width };
  pill.animate([from, to], { duration: 550, easing: ORBIT, fill: 'forwards' });
  Object.assign(pill.style, to);
}
requestAnimationFrame(() => markSeek('mcp-emails', false));
addEventListener('resize', () => markSeek(seekBtns.find((b) => b.getAttribute('aria-pressed') === 'true').dataset.focus, false));
seekBtns.forEach((b, i) => {
  b.addEventListener('click', () => { markSeek(b.dataset.focus); globeApi?.focus(b.dataset.focus); });
  b.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const n = seekBtns[(i + (e.key === 'ArrowRight' ? 1 : -1) + seekBtns.length) % seekBtns.length];
    n.focus(); n.click();
  });
});
const globeHost = $('#globe');
const gio = new IntersectionObserver(async (entries) => {
  if (!entries.some((e) => e.isIntersecting) || globeApi) return;
  gio.disconnect();
  const { mountGlobe } = await import('./assets/js/globe.js');
  globeApi = mountGlobe(globeHost, { size: 560 });
  globeHost.tabIndex = 0;
  // keyboard: arrows nudge the globe toward the next product
  globeHost.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const cur = seekBtns.findIndex((b) => b.getAttribute('aria-pressed') === 'true');
    const n = seekBtns[(cur + (e.key === 'ArrowRight' ? 1 : -1) + seekBtns.length) % seekBtns.length];
    n.click();
  });
  if (!reduce) globeHost.animate([{ opacity: 0, transform: 'scale(.92) rotate(-6deg)' }, { opacity: 1, transform: 'none' }], { duration: 1600, easing: OUT });
}, { rootMargin: '300px' });
gio.observe(globeHost);

/* ------------------------------------------------------------------ 7. Obsoletae medals */
const medals = $('[data-medals]');
OBSOLETE.forEach((o) => {
  const p = byId[o.id];
  const li = document.createElement('li');
  li.className = 'medal';
  li.innerHTML = `<button type="button" aria-expanded="false" aria-controls="m-${o.id}">
      <img src="assets/products/obsoleta/${o.id}.webp" width="480" height="480" loading="lazy" decoding="async" alt="">
      <span class="m-name"></span><span class="m-year">${o.latin.toUpperCase()} · ${o.since}</span>
    </button>
    <p class="m-line" id="m-${o.id}" hidden></p>`;
  li.querySelector('.m-name').textContent = o.short || p.name;
  li.querySelector('.m-line').textContent = p.line + (p.figure ? ` ${p.figure.value} ${p.figure.label}.` : '');
  li.querySelector('img').alt = `${p.name}, retired: an obsolete constellation medal${o.id === 'luma' ? ' carrying the real Luma logo' : ''}.`;
  medals.appendChild(li);
});
$$('.medal button').forEach((b) => b.addEventListener('click', () => {
  const open = b.getAttribute('aria-expanded') !== 'true';
  b.setAttribute('aria-expanded', String(open));
  const t = document.getElementById(b.getAttribute('aria-controls'));
  t.hidden = !open;
  if (open && !reduce) t.animate([{ opacity: 0, transform: 'translateY(-6px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 600, easing: OUT });
}));
rise($$('.medal img'), { stagger: 70 });

/* ------------------------------------------------------------------ 8. Ephemeris: inline so fonts apply, then draw on */
const ephHost = $('[data-ephemeris]');
const eio = new IntersectionObserver(async (entries) => {
  if (!entries.some((e) => e.isIntersecting)) return;
  eio.disconnect();
  try {
    const txt = await (await fetch('assets/extras/ephemeris.svg')).text();
    const doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
    const s = doc.documentElement;
    if (s.nodeName !== 'svg') return;
    s.removeAttribute('width'); s.removeAttribute('height');
    ephHost.replaceChildren(document.importNode(s, true));
    if (reduce) return;
    const live = ephHost.querySelector('svg');
    $$('circle', live).forEach((c, i) => {
      const r = +c.getAttribute('r');
      if (r > 20) {
        c.setAttribute('pathLength', 1);
        c.animate([{ strokeDasharray: '0 1' }, { strokeDasharray: '1 0' }], { duration: 1600, delay: i * 50, easing: OUT, fill: 'backwards' });
      }
    });
    $$('text', live).forEach((t, i) => t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 800, delay: 600 + i * 22, fill: 'backwards' }));
  } catch { /* keep the <img> */ }
}, { rootMargin: '100px' });
eio.observe(ephHost);

/* ------------------------------------------------------------------ 9. Scroll-linked drift for the specimens (WAAPI + ViewTimeline) */
if (!reduce && 'ViewTimeline' in window) {
  $$('.specimen').forEach((s, i) => {
    const timeline = new ViewTimeline({ subject: s });
    s.animate({ transform: [`translateY(${80 + i * 40}px) rotate(${i ? 18 : -14}deg)`, `translateY(${-120 - i * 60}px) rotate(${i ? -10 : 22}deg)`] },
      { timeline, rangeStart: 'cover 0%', rangeEnd: 'cover 100%', fill: 'both' });
  });
  $('.beardsley img').animate({ transform: ['translateY(60px)', 'translateY(-20px)'] },
    { timeline: new ViewTimeline({ subject: $('.colophon') }), rangeStart: 'entry 0%', rangeEnd: 'cover 60%', fill: 'both' });
}

/* ------------------------------------------------------------------ 10. Header, magnetic hovers, copy */
const top = $('.top');
const onScroll = () => top.classList.toggle('scrolled', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

if (fine && !reduce) {
  $$('.mag').forEach((m) => {
    m.addEventListener('pointermove', (e) => {
      const r = m.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .32;
      m.style.transform = `translate(${x}px, ${y}px)`;
    });
    m.addEventListener('pointerleave', () => {
      const cur = m.style.transform || 'none';
      m.style.transform = '';
      m.animate([{ transform: cur }, { transform: 'none' }], { duration: 700, easing: ORBIT });
    });
  });
}

const cmd = $('.cmd');
cmd.addEventListener('click', async () => {
  const st = cmd.querySelector('.cmd-state');
  try { await navigator.clipboard.writeText(cmd.dataset.copy); st.textContent = 'Copied'; }
  catch { st.textContent = 'Select'; getSelection().selectAllChildren(cmd.querySelector('code')); }
  if (!reduce) st.animate([{ transform: 'scale(.8)' }, { transform: 'scale(1)' }], { duration: 500, easing: ORBIT });
  setTimeout(() => { st.textContent = 'Copy'; }, 1800);
});

/* ------------------------------------------------------------------ 11. Sound (opt-in): each impact rings a soft bell */
let ac = null, soundOn = false;
const NOTES = { 'mcp-emails': 659.25, 'fun-libs': 783.99, toolrails: 880, harbor: 587.33, 'albretsen.no': 1046.5 };
function chime(product) {
  if (!soundOn || !ac) return;
  const t = ac.currentTime, f = NOTES[product] || 700;
  const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + 2.2);
  [1, 2.76].forEach((k, i) => {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f * k;
    const og = ac.createGain(); og.gain.value = i ? .18 : 1;
    o.connect(og).connect(g); o.start(t); o.stop(t + 2.3);
  });
  g.connect(ac.destination);
}
const soundBtn = $('.sound');
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  if (soundOn && !ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (soundOn) ac.resume();
  soundBtn.setAttribute('aria-pressed', String(soundOn));
  soundBtn.querySelector('.sound-label').textContent = soundOn ? 'Sound on' : 'Sound off';
  if (soundOn) chime('albretsen.no');
});

