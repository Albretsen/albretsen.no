// Cloud Chamber · page wiring.
import { content } from '../../_shared/content.js';
import { createFeed } from '../../_shared/feed.js';
import { decode, settle, tilt, filmIn, fractureReveal } from '../assets/motion.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const P = '../_shared/products/';
const A = 'assets/';

/* ---------------- products ---------------- */
const MEDIA = {
  'mcp-emails': { img: 'products/mcp-emails', logo: 'mcp-emails/logo-mark.svg', alt: 'The MCP Emails app icon set into a chrome dish.' },
  'fun-libs': { img: 'products/fun-libs', logo: 'fun-libs/icon.png', alt: 'The Fun Libs app icon set into a chrome dish.' },
  toolrails: { img: 'products/toolrails', logo: 'toolrails/icon.svg', alt: 'The Toolrails icon set into a chrome dish.' },
  harbor: { img: 'products/harbor', logo: 'harbor/harbor-mark.svg', alt: 'The Harbor mark on its dark tile in a chrome dish.' },
  luma: { img: 'products/luma-800.webp', logo: 'luma/luma-monogram.svg', alt: 'The Luma logo on its cream tile in a chrome dish.' },
  'polyglot-pilot': { img: 'products/standin-polyglot.webp', alt: 'Stand-in: an iridescent torus knot.' },
  pinpoint: { img: 'products/standin-pinpoint.webp', alt: 'Stand-in: a chrome map pin.' },
  webvakt: { img: 'products/standin-webvakt.webp', alt: 'Stand-in: a chrome ring around an iridescent eye.' },
  'joke-central': { img: 'products/standin-jokes.webp', alt: 'Stand-in: a chrome capsule and bead.' },
  'tryggere-hyring': { img: 'products/standin-hyring.webp', alt: 'Stand-in: an iridescent shield.' },
  'early-apps': { img: 'products/standin-early.webp', alt: 'Stand-in: three stacked chrome tiles.' },
};
const STATUS = { live: 'Live', building: 'Building', paused: 'Paused', retired: 'Retired' };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const host = u => u.replace(/^https?:\/\//, '').replace(/\/$/, '');

const active = content.products.filter(p => p.status !== 'retired');
const retired = content.products.filter(p => p.status === 'retired');
$('[data-live-count]').textContent = active.length;
$('[data-retired-count]').textContent = retired.length;

$('[data-plates]').innerHTML = active.map((p, i) => {
  const m = MEDIA[p.id];
  return `<article class="plate cc-sheen${i === 0 ? ' plate--lead' : ''}" aria-labelledby="p-${p.id}">
    <div class="plate__media"><div class="loupe" data-loupe="${A}${m.img}-1600.webp">
      <img src="${A}${m.img}-800.webp" srcset="${A}${m.img}-800.webp 800w, ${A}${m.img}-1600.webp 1600w" sizes="${i === 0 ? '(max-width: 699px) 100vw, 56vw' : '(max-width: 699px) 100vw, (max-width: 1099px) 50vw, 33vw'}" alt="${esc(m.alt)}" loading="lazy" width="800" height="533" data-film>
      <span class="loupe__tick" aria-hidden="true">Specimen ${String(i + 1).padStart(2, '0')}</span>
    </div></div>
    <div class="plate__body">
      <div class="plate__top"><span class="status" data-s="${p.status}">${STATUS[p.status]}</span><span class="label">Since ${p.since}</span></div>
      <h3 class="plate__name" id="p-${p.id}"><img class="plate__logo" src="${P}${m.logo}" alt="" loading="lazy">${esc(p.name)}</h3>
      <p class="plate__line">${esc(p.line)}</p>
      ${p.facts ? `<ul class="facts">${p.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      ${p.figure ? `<p class="figure"><b data-decode>${esc(p.figure.value)}</b><span>${esc(p.figure.label)}</span></p>` : ''}
      ${p.url ? `<a class="plate__link" href="${p.url}" rel="noopener">${host(p.url)}</a>` : ''}
    </div>
  </article>`;
}).join('');

$('[data-acc]').innerHTML = retired.map((p, i) => {
  const m = MEDIA[p.id];
  const src = m.img.endsWith('.webp') ? m.img : `${m.img}-800.webp`;
  return `<li>
    <h4 style="margin:0"><button class="acc__btn" type="button" aria-expanded="false" aria-controls="acc-${p.id}" id="accb-${p.id}">
      <span class="acc__n">R${String(i + 1).padStart(2, '0')}</span><span class="acc__name">${esc(p.name)}</span><span class="acc__yr">${p.since}</span><span class="acc__ico" aria-hidden="true"></span>
    </button></h4>
    <div class="acc__panel" id="acc-${p.id}" role="region" aria-labelledby="accb-${p.id}" hidden>
      <div class="acc__inner"><img src="${A}${src}" alt="${esc(m.alt)}" loading="lazy" width="140" height="140">
        <div><p>${esc(p.line)}</p>${p.figure ? `<p class="figure"><b>${esc(p.figure.value)}</b><span>${esc(p.figure.label)}</span></p>` : ''}</div>
      </div>
    </div>
  </li>`;
}).join('');

// accordion: Radix-style, height animates to a measured --acc-h
$$('.acc__btn').forEach(btn => btn.addEventListener('click', () => {
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  const open = btn.getAttribute('aria-expanded') !== 'true';
  btn.setAttribute('aria-expanded', open);
  if (open) {
    panel.hidden = false; panel.style.setProperty('--acc-h', panel.scrollHeight + 'px'); panel.dataset.state = 'open';
    blip(900 + Math.random() * 200, 0.03);
  } else {
    panel.style.setProperty('--acc-h', panel.scrollHeight + 'px'); panel.dataset.state = 'closed';
    const done = () => { if (panel.dataset.state === 'closed') panel.hidden = true; };
    reduce ? done() : panel.addEventListener('animationend', done, { once: true });
  }
}));

// hover preview: the specimen image trails the pointer over the archive list (desktop)
if (fine && !reduce) {
  const drawer = $('.acc');
  const peek = document.createElement('img'); peek.className = 'peek'; peek.alt = ''; peek.setAttribute('aria-hidden', 'true');
  drawer.appendChild(peek);
  let tx = 0, ty = 0, x = 0, y = 0, on = false, raf = 0;
  const loop = () => { x += (tx - x) * 0.14; y += (ty - y) * 0.14; peek.style.transform = `translate(${x}px, ${y}px) rotate(${(tx - x) * 0.05}deg)`; raf = on || Math.abs(tx - x) > 0.5 ? requestAnimationFrame(loop) : 0; };
  $$('.acc__btn').forEach(btn => btn.addEventListener('pointerenter', () => {
    const img = $(`#${btn.getAttribute('aria-controls')} img`); peek.src = img.src; peek.classList.add('is-on'); on = true; if (!raf) raf = requestAnimationFrame(loop);
  }));
  drawer.addEventListener('pointermove', e => { const r = drawer.getBoundingClientRect(); tx = e.clientX - r.left + 28; ty = e.clientY - r.top - 80; });
  drawer.addEventListener('pointerleave', () => { on = false; peek.classList.remove('is-on'); });
}

/* ---------------- sound (opt-in) ---------------- */
let audio = null, soundOn = false;
function blip(freq, vol = 0.05, dur = 0.35) {
  if (!soundOn || !audio) return;
  const t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain(), o2 = audio.createOscillator();
  o.type = 'sine'; o.frequency.setValueAtTime(freq, t); o2.type = 'sine'; o2.frequency.setValueAtTime(freq * 2.76, t); // glassy partial
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const g2 = audio.createGain(); g2.gain.value = 0.25;
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(audio.destination);
  o.start(t); o2.start(t); o.stop(t + dur); o2.stop(t + dur);
}
const soundBtn = $('[data-sound]');
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  if (soundOn && !audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio && audio.state === 'suspended') audio.resume();
  soundBtn.setAttribute('aria-pressed', soundOn);
  $('[data-sound-label]').textContent = soundOn ? 'Sound on' : 'Sound off';
  blip(1320, 0.05);
});

/* ---------------- detector log ---------------- */
const logEl = $('[data-log]');
const COLORS = { 'mcp-emails': '#b43481', 'fun-libs': '#e781b7', toolrails: '#5e1942', 'albretsen.no': '#7b606d', impact: '#d64d9d', decay: '#892361' };
let count = 0;
const pad = n => String(n).padStart(2, '0');
const clock = d => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const spiral = 'M6 6c2-1 3 1 1.6 2.2S4 8 4.6 5.6 9 3 10.6 6.4 8.6 11.8 5 11';
function logRow({ color, who, what, t = new Date(), fresh = true }) {
  const li = document.createElement('li');
  if (fresh && !reduce) li.className = 'is-new';
  li.style.setProperty('--c', color);
  li.innerHTML = `<svg class="glyph" viewBox="0 0 12 12" aria-hidden="true"><path d="${spiral}"/></svg><span><span class="who">${esc(who)}</span>${esc(what)}</span><span class="t">${clock(t)}</span>`;
  logEl.prepend(li);
  while (logEl.children.length > 12) logEl.lastElementChild.remove();
  $('[data-count]').textContent = ++count;
}
const tail = e => e.ms ? ` · ${e.ms} ms` : e.country ? ` · ${e.country}` : e.city ? ` · ${e.city}` : e.sha ? ` · ${e.sha}` : '';
const feed = createFeed();
feed.recent(6).reverse().forEach(e => logRow({ color: COLORS[e.product], who: e.label, what: e.text + tail(e), t: e.time, fresh: false }));

/* ---------------- chamber ---------------- */
const hero = $('.hero');
const canvas = $('[data-chamber]');
let chamber = null, lastImpactLog = 0;
function onImpact({ v, a, b }) {
  if (a === 'decay') { logRow({ color: COLORS.decay, who: 'Decay', what: 'V event, two opposite spirals' }); blip(520, 0.05, 0.8); return; }
  blip(900 + Math.min(v, 30) * 60, Math.min(0.09, 0.012 + v * 0.003), 0.28);
  const now = performance.now(); if (now - lastImpactLog < 450) return; lastImpactLog = now;
  const pair = [a, b].map(x => (x === 'floor' || x === 'wall' || x === 'lid') ? x : x).join(' × ');
  logRow({ color: COLORS.impact, who: 'Impact', what: `${pair} · Δv ${v.toFixed(1)}` });
}
async function startChamber() {
  try {
    const { mountChamber } = await import('./chamber.js');
    chamber = await mountChamber(canvas, { onImpact, settled: new URLSearchParams(location.search).has('settled') });
    hero.classList.add('is-live');
  } catch (err) { $('[data-loader]').remove(); console.warn('chamber unavailable', err); }
}
// first paint is the baked poster; the live chamber arrives after load
const kick = () => ('requestIdleCallback' in window ? requestIdleCallback(startChamber, { timeout: 900 }) : setTimeout(startChamber, 200));
document.readyState === 'complete' ? kick() : addEventListener('load', kick, { once: true });

feed.subscribe(e => {
  logRow({ color: COLORS[e.product], who: e.label, what: e.text + tail(e) });
  if (chamber) { chamber.inject(e); blip(380, 0.018, 0.5); }
});

let zeroG = false;
$('.controls').addEventListener('click', e => {
  const btn = e.target.closest('[data-act]'); if (!btn || !chamber) return;
  const act = btn.dataset.act;
  if (act === 'reset') { zeroG = false; chamber.setGravity(1.1); syncG(); chamber.reset(); }
  if (act === 'fire') chamber.fire();
  if (act === 'gravity') { zeroG = !zeroG; chamber.setGravity(zeroG ? 0 : 1.1); syncG(); }
});
function syncG() { const b = $('[data-act="gravity"]'); b.setAttribute('aria-pressed', zeroG); $('[data-g]').textContent = zeroG ? 'Gravity 0.0 g' : 'Gravity 1.0 g'; }

// type a letter of ALBRETSEN to kick it (when the chamber or the page itself has focus)
let heroInView = true;
new IntersectionObserver(([e]) => { heroInView = e.isIntersecting; }).observe(hero);
addEventListener('keydown', e => {
  if (!chamber || e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
  const ae = document.activeElement;
  if (!(ae === canvas || ((ae === document.body || !ae) && heroInView))) return;
  if (chamber.kick(e.key)) e.preventDefault();
});

// mission clock
const t0 = Date.now();
const clk = $('[data-clock]');
setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); clk.textContent = `Chamber 01 · T+${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }, 1000);

/* ---------------- copy command ---------------- */
$$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
  const label = $('[data-copy-label]', btn);
  try { await navigator.clipboard.writeText(btn.dataset.copy); decode(label, { text: 'Copied', duration: 0.5 }); }
  catch { decode(label, { text: 'Select', duration: 0.5 }); }
  blip(1560, 0.04);
  setTimeout(() => decode(label, { text: 'Copy', duration: 0.5 }), 2200);
}));

/* ---------------- micro-interactions ---------------- */
// magnetic hover: element drifts up to 6 px toward the pointer
if (fine && !reduce) $$('.mag').forEach(el => {
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width - 0.5) * 10}px`);
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height - 0.5) * 8}px`);
  });
  el.addEventListener('pointerleave', () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
});

// loupe: circular magnifier that loads the 2x image on first hover
if (fine) $$('[data-loupe]').forEach(el => {
  const lens = document.createElement('div'); lens.className = 'loupe__lens'; el.appendChild(lens);
  const Z = 2.2, half = 90;
  let loaded = false;
  el.addEventListener('pointerenter', () => { if (!loaded) { lens.style.backgroundImage = `url(${el.dataset.loupe})`; loaded = true; } el.classList.add('is-on'); });
  el.addEventListener('pointerleave', () => el.classList.remove('is-on'));
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect(); const img = $('img', el);
    const x = e.clientX - r.left, y = e.clientY - r.top;
    // match object-fit: cover
    const ir = img.naturalWidth ? img.naturalWidth / img.naturalHeight : r.width / r.height;
    let w = r.width, h = r.height; if (r.width / r.height > ir) h = w / ir; else w = h * ir;
    const ox = (r.width - w) / 2, oy = (r.height - h) / 2;
    lens.style.setProperty('--lx', `${x}px`); lens.style.setProperty('--ly', `${y}px`);
    lens.style.backgroundSize = `${w * Z}px ${h * Z}px`;
    lens.style.backgroundPosition = `${-((x - ox) * Z - half)}px ${-((y - oy) * Z - half)}px`;
  });
});

// nav turns solid once the chamber scrolls away
const nav = $('[data-nav]');
const onScroll = () => nav.classList.toggle('is-solid', scrollY > innerHeight * 0.6);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------------- decode (signature) ---------------- */
const dio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { decode(e.target, { duration: e.target.textContent.length > 20 ? 1.4 : 1.1 }); dio.unobserve(e.target); } }), { threshold: 0.5 });
$$('[data-decode]').forEach(el => dio.observe(el));
filmIn($$('[data-film]'));
$$('.plate').forEach(el => tilt(el, { max: 4 }));
tilt($('[data-tilt]'), { max: 14 });

/* ---------------- specimen (three.js, lazy) ---------------- */
const specEl = $('[data-specimen]');
let specimen = null;
const sio = new IntersectionObserver(async ([e]) => {
  if (!e.isIntersecting) return; sio.disconnect();
  try {
    const { mountSpecimen } = await import('../assets/3d/specimen.js');
    specimen = await mountSpecimen(specEl, { fracture: 1 });
    specEl.classList.add('is-live');
    if (window.ScrollTrigger && !reduce) window.ScrollTrigger.create({ trigger: '.company', start: 'top bottom', end: 'bottom top', onUpdate: s => specimen.setFracture(1 - Math.sin(s.progress * Math.PI) * 0.75) });
  } catch (err) { console.warn('specimen unavailable', err); }
}, { rootMargin: '300px 0px' });
sio.observe(specEl);

/* ---------------- GSAP scroll choreography ---------------- */
function gsapReady(fn) { if (window.gsap && window.ScrollTrigger) fn(); else addEventListener('load', () => window.gsap && window.ScrollTrigger && fn(), { once: true }); }
gsapReady(() => {
  const { gsap, ScrollTrigger } = window; gsap.registerPlugin(ScrollTrigger);
  // ?settled starts the chamber from the resting pile and skips entrance choreography (stills, demos)
  const still = reduce || new URLSearchParams(location.search).has('settled');
  if (!still) fractureReveal($('[data-break]'), { start: 'top 95%', end: 'top 35%' });
  if (still) return;
  settle($$('.plate'), { stagger: 0.08, y: -50, scrollTrigger: { trigger: '.plates', start: 'top 85%' } });
  $$('.glass__fig').forEach(fig => gsap.fromTo(fig, { y: 0 }, { y: +fig.dataset.depth, ease: 'none', scrollTrigger: { trigger: '.glass', start: 'top bottom', end: 'bottom top', scrub: 0.8 } }));
  gsap.from('.acc li', { opacity: 0, x: -24, duration: 0.8, ease: 'power3.out', stagger: 0.05, scrollTrigger: { trigger: '.acc', start: 'top 85%' } });
  gsap.to('.company__2016', { yPercent: -30, rotate: -4, ease: 'none', scrollTrigger: { trigger: '.company', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  // the hero copy lifts away as the chamber scrolls out
  gsap.to('.hero__copy', { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 } });
});
