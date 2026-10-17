// Q.E.D. / Drop 00 — design 82.
// The homepage is one proof: four products add up to one company, and a single glyph
// re-proves itself as you scroll past each of them.
import { content } from '../_shared/content.js';
import { createFeed } from '../_shared/feed.js';
import { iconSVG } from './assets/icons/icons.js';
import { glyph, dawnRise, accordion, dialog, tooltip, hoverCard, easterEgg } from './assets/motion.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const byId = Object.fromEntries(content.products.map((p) => [p.id, p]));

// ── 1. Static glyphs (fixed-size hosts, so mounting them shifts nothing) ─────────────
const inkFor = (el) => (el.closest('.hero, .foot') ? 'var(--qed-paper)' : 'currentColor');
const live = new Map();
$$('[data-g]').forEach((el) => {
  const id = el.dataset.g;
  if (el.closest('.equation') || el.classList.contains('cmd__g')) {
    live.set(el, glyph(el, id, { size: '100%', ink: inkFor(el), duration: 520, fracture: 1 }));
  } else {
    el.innerHTML = iconSVG(id, { size: '100%', ink: inkFor(el), title: false });
  }
});

// ── 2. Hero: the equation proves itself, stroke by stroke ────────────────────────────
const eq = $('.equation');
$$('.qed-glyph', eq).forEach((svg, i) => svg.style.setProperty('--i', i));
requestAnimationFrame(() => eq.classList.add('is-proved'));

// tooltips (Radix-style, one floating element per trigger)
function tip(trigger, text) {
  const t = document.createElement('div');
  t.className = 'qed-float tip mono'; t.textContent = text; document.body.appendChild(t);
  tooltip(trigger, t);
}
$$('[data-tip]').forEach((el) => tip(el, el.dataset.tip));

// hovering a term previews the sum turning into that product
const sum = live.get($('.eq__g--sum'));
$$('.eq__term[data-term]').forEach((a) => {
  a.addEventListener('pointerenter', () => sum.to(a.dataset.term));
  a.addEventListener('focus', () => sum.to(a.dataset.term));
  const back = () => sum.to('mark');
  a.addEventListener('pointerleave', back); a.addEventListener('blur', back);
});

// copy the MCP line: the copy glyph is proved into a check, then back
const copyBtn = $('.cmd__copy'), copyG = live.get($('.cmd__g'));
copyBtn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(content.mcpCommand); } catch { /* clipboard blocked: select it instead */
    const r = document.createRange(); r.selectNodeContents($('#cmd')); getSelection().removeAllRanges(); getSelection().addRange(r);
  }
  copyBtn.setAttribute('aria-label', 'Copied'); copyG.to('check'); chime(2);
  setTimeout(() => { copyG.to('copy'); copyBtn.setAttribute('aria-label', 'Copy command'); }, 1700);
});
$('#cmd').textContent = content.mcpCommand;

// live feed: one quiet line
const feedEl = $('#feed');
const fmt = (e) => `${e.label} — ${e.text}${e.ms ? ` · ${e.ms} ms` : e.country ? ` · ${e.country}` : e.city ? ` · ${e.city}` : ''}`;
const showEvent = (e) => { feedEl.textContent = fmt(e); feedEl.classList.remove('is-in'); void feedEl.offsetWidth; feedEl.classList.add('is-in'); };
const feed = createFeed();
const first = feed.recent(1)[0]; if (first) showEvent(first);
let lastShown = 0;
feed.subscribe((e) => { const now = performance.now(); if (now - lastShown > 2400) { lastShown = now; showEvent(e); } });

// ── 3. Gravity field: the live sheet replaces its poster once it is near ──────────────
const field = $('.field');
new IntersectionObserver(async ([e], io) => {
  if (!e.isIntersecting) return; io.disconnect();
  if (reduce) return; // the poster is the still version of the same scene
  const { gravityGrid } = await import('./assets/interactive/gravity-grid.js');
  gravityGrid($('.field__canvas'), { theme: 'light', bodies: 4 });
  requestAnimationFrame(() => field.classList.add('is-live'));
  field.addEventListener('pointermove', () => field.classList.add('is-touched'), { once: true });
}, { rootMargin: '200px' }).observe(field);

// ── 4. The proof: a single glyph morphs as each product takes the stage ──────────────
const stageEl = $('#stage-g');
const stage = glyph(stageEl, 'mark', { size: '100%', stroke: 0.3, duration: 1050, fracture: 2.2 });
const steps = $$('#stage-steps li');
const items = $$('.item');
const capN = $('#stage-n'), capL = $('#stage-l');
let current = -1;
function setStage(i) {
  if (i === current) return; current = i;
  const it = items[i]; const id = it.dataset.glyphId;
  stage.to(id); chime(i);
  capN.textContent = `Fig. ${it.dataset.n}`; capL.textContent = it.dataset.id ? byId[it.dataset.id].name : 'Q.E.D.';
  for (const c of [capN, capL]) { c.classList.remove('is-in'); void c.offsetWidth; c.classList.add('is-in'); }
  steps.forEach((s, j) => { s.classList.toggle('is-on', j < i); s.classList.toggle('is-now', j === i); });
}
const stageIO = new IntersectionObserver((ents) => {
  for (const e of ents) if (e.isIntersecting) setStage(items.indexOf(e.target));
}, { rootMargin: '-48% 0px -48% 0px' });
items.forEach((it) => stageIO.observe(it));

// figures count up once, when they are first seen
const figIO = new IntersectionObserver((ents, io) => {
  for (const e of ents) if (e.isIntersecting) { dawnRise(e.target); io.unobserve(e.target); }
}, { threshold: 0.6 });
$$('.figure').forEach((f) => figIO.observe(f));

// ── 5. Spec dialog: opens as a slit of light ─────────────────────────────────────────
const dlg = $('.spec');
const fake = document.createElement('button'); // motion.js wires open via a trigger; we drive it ourselves
dialog(fake, dlg);
function openSpec(id) {
  const p = byId[id];
  $('#spec-pic').innerHTML =
    `<source type="image/avif" srcset="assets/products/${id}-1600.avif"><source type="image/webp" srcset="assets/products/${id}-1600.webp">` +
    `<img src="assets/products/${id}-1600.jpg" width="1600" height="1200" alt="${p.name} logo on its tile">`;
  $('#spec-k').textContent = `${$(`#p-${id}`).dataset.n}. · ${p.status}`;
  $('#spec-h').textContent = p.name;
  $('#spec-line').textContent = p.line;
  const rows = [['Since', p.since], ['Status', p.status], p.figure && [p.figure.label, p.figure.value], p.facts && ['Notes', p.facts.join('<br>')]].filter(Boolean);
  $('#spec-dl').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  const a = $('#spec-url'); a.href = p.url; a.querySelector('span').textContent = p.url.replace('https://', '');
  fake.click();
}
$$('[data-open]').forEach((b) => b.addEventListener('click', () => openSpec(b.dataset.open)));

// ── 6. Retired proofs: coins with hover cards, inside an accordion ───────────────────
const coins = $('#coins');
content.products.filter((p) => p.status === 'retired').forEach((p) => {
  const li = document.createElement('li'); li.className = 'coin' + (p.id === 'luma' ? ' coin--luma' : '');
  const src = p.id === 'luma' ? '../_shared/products/luma/logo.png' : `assets/products/retired/${p.id}.svg`;
  li.innerHTML = `<button type="button" aria-label="${p.name}, ${p.since}, retired"><img src="${src}" width="160" height="160" alt="" loading="lazy"></button>`;
  coins.appendChild(li);
  const card = document.createElement('div'); card.className = 'qed-float hc';
  card.innerHTML = `<b>${p.name}</b><p>${p.line}</p><span class="mono">${p.since} · retired${p.figure ? ` · ${p.figure.value} ${p.figure.label}` : ''}</span>`;
  document.body.appendChild(card);
  hoverCard(li.querySelector('button'), card);
});
accordion($('.acc'));

// ── 7. Sound (opt-in): a soft fifth on every proof step ─────────────────────────────
let ac = null;
const soundBtn = $('#sound');
soundBtn.addEventListener('click', () => {
  const on = soundBtn.getAttribute('aria-pressed') !== 'true';
  soundBtn.setAttribute('aria-pressed', on); soundBtn.querySelector('span').textContent = on ? 'on' : 'off';
  if (on) { ac ||= new AudioContext(); ac.resume(); chime(0); }
});
function chime(step = 0) {
  if (!ac || soundBtn.getAttribute('aria-pressed') !== 'true') return;
  const base = 220 * Math.pow(2, [0, 2, 4, 7, 9][step % 5] / 12);
  const t = ac.currentTime;
  [base, base * 1.5].forEach((f, k) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(k ? 0.018 : 0.03, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    o.connect(g).connect(ac.destination); o.start(t + k * 0.06); o.stop(t + 1.8);
  });
}

// ── 8. Q.E.D.: type it, or triple-click the mark ────────────────────────────────────
easterEgg();

// Review aid: ?y=1200 opens the page scrolled (used for headless screenshots).
const y = new URLSearchParams(location.search).get('y');
if (y) {
  const Y = +y, top = (el) => el.getBoundingClientRect().top;
  const proofTop = top(document.querySelector('.proof'));
  document.documentElement.style.overflow = 'hidden'; document.body.style.transform = `translateY(-${Y}px)`;
  document.querySelector('.stage__inner').style.transform = `translateY(${Math.max(0, Y - proofTop)}px)`;
  const k = items.findIndex((it) => top(it) + it.offsetHeight > Y + innerHeight / 2);
  if (k >= 0) setTimeout(() => setStage(k), 50);
}
const q = new URLSearchParams(location.search);
if (q.get('open')) setTimeout(() => openSpec(q.get('open')), 300);
if (q.has('acc')) setTimeout(() => $('.acc__trig').click(), 300);
console.log('%cΛLBRETSEN ΛS — Drop 00%c\nSome proofs are left to the reader.', 'font: 500 13px Geist, system-ui; letter-spacing: .2em', 'color: #777471');

