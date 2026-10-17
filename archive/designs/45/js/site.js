// Albretsen AS — design 45 "Drift" — the homepage.
// Everything moves on the kit's single hand-rolled spring (assets/motion.js). The live river (three.js)
// loads after first paint; until then, and for reduced motion, the baked stills stand in.

import { content } from '../../_shared/content.js';
import { createFeed } from '../../_shared/feed.js';
import { Spring, PRESETS, surface, buoy, chorus, defineTideSwitch } from '../assets/motion.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const P = '../_shared/products/';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const LOGO = {
  'mcp-emails': P + 'mcp-emails/logo-mark.svg', 'fun-libs': P + 'fun-libs/icon.png', toolrails: P + 'toolrails/icon.svg',
  harbor: null, luma: P + 'luma/logo.png',
  'polyglot-pilot': 'assets/products/standins/polyglot-pilot.svg', pinpoint: 'assets/products/standins/pinpoint.svg',
  webvakt: 'assets/products/standins/webvakt.svg', 'joke-central': 'assets/products/standins/joke-central.svg',
  'tryggere-hyring': 'assets/products/standins/tryggere-hyring.svg', 'early-apps': 'assets/products/standins/early-apps.svg',
};

// ------------------------------------------------------------------ sound (opt-in, synthesised water)
const sound = (() => {
  let ctx = null, on = false;
  const btn = $('.sound');
  btn.addEventListener('click', () => {
    on = !on; btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Sound on. Turn off water sounds' : 'Sound off. Turn on water sounds');
    if (on) { ctx ??= new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); drop(0.8, 1.2); }
  });
  // a droplet: a sine that falls in pitch, with a tiny noise-free "plip" envelope
  function drop(pitch = 1, gain = 1) {
    if (!on || !ctx) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    const base = 520 * pitch * (0.92 + Math.random() * 0.16);
    o.type = 'sine'; o.frequency.setValueAtTime(base * 2.1, t); o.frequency.exponentialRampToValueAtTime(base, t + 0.09);
    f.type = 'lowpass'; f.frequency.value = 2400;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06 * gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(f).connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.35);
  }
  function chord(dark) { [0, 1, 2, 3].forEach((i) => setTimeout(() => drop((dark ? [0.75, 0.6, 0.5, 0.4] : [0.8, 1, 1.2, 1.5])[i], 0.9), i * 110)); }
  return { drop, chord };
})();

// ------------------------------------------------------------------ theme: the Tide turn
defineTideSwitch();
const metaTheme = () => $$('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', document.documentElement.dataset.theme === 'dark' ? '#020907' : '#dcf7f1'));
let river = null;
document.addEventListener('themechange', (e) => {
  const t = e.detail.theme;
  try { localStorage.setItem('drift-theme', t); } catch {}
  river?.setTheme(t);
  sound.chord(t === 'dark');
  tideBeads(t === 'dark', e.target);
  kickFloaters(t === 'dark' ? 1 : -1);
  setTimeout(metaTheme, 50);
});

// A chorus of beads rides the wavefront up the page while the theme turns.
// It has its own view-transition-name, so it draws above both the old and new snapshots.
function tideBeads(dark, from) {
  if (reduce) return;
  const cv = document.createElement('canvas'); cv.className = 'tide-beads'; cv.setAttribute('aria-hidden', 'true');
  Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 120, viewTransitionName: 'tide-beads' });
  document.body.append(cv);
  const dpr = Math.min(devicePixelRatio, 2), W = innerWidth, H = innerHeight; cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const sw = from?.getBoundingClientRect?.() ?? { left: W - 60, top: 20, width: 40, height: 20 };
  const n = Math.round(Math.min(160, W / 7));
  const beads = Array.from({ length: n }, (_, i) => {
    const fromSwitch = i < 14;
    return {
      x: fromSwitch ? sw.left + sw.width / 2 : Math.random() * W, y: fromSwitch ? sw.top + sw.height / 2 : H + 10 + Math.random() * 80,
      vx: fromSwitch ? (Math.random() - 0.7) * 260 : (Math.random() - 0.5) * 30, vy: fromSwitch ? (Math.random() * 1.2 + 0.2) * (dark ? 160 : -120) : -(H * (0.55 + Math.random() * 0.45)),
      r: 2 + Math.pow(Math.random(), 3) * 9, delay: fromSwitch ? 0 : Math.random() * 0.45, phase: Math.random() * 6.28, shade: Math.random(),
    };
  });
  const cols = dark ? ['#87dac9', '#dcf7f1', '#4bc1ad'] : ['#f2fdfa', '#08a28f', '#006154', '#b7ebdf'];
  let t0 = performance.now(), last = t0;
  const frame = (now) => {
    const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
    g.clearRect(0, 0, W, H); let alive = 0;
    for (const b of beads) {
      if (t < b.delay) { alive++; continue; }
      const life = t - b.delay; const fade = Math.max(0, 1 - life / 1.9);
      if (fade <= 0) continue; alive++;
      b.vy *= 1 - 0.9 * dt; b.vx *= 1 - 1.2 * dt; b.x += (b.vx + Math.sin(life * 3 + b.phase) * 24) * dt; b.y += b.vy * dt;
      const c = cols[Math.floor(b.shade * cols.length)];
      g.globalAlpha = fade;
      if (dark) { g.shadowColor = '#87dac9'; g.shadowBlur = b.r * 3; } else { g.shadowColor = 'rgba(3,66,57,.25)'; g.shadowBlur = b.r; }
      const gr = g.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.1, b.x, b.y, b.r);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, c); gr.addColorStop(1, dark ? '#006154' : '#034239');
      g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.r, 0, Math.PI * 2); g.fill();
    }
    if (alive && t < 3) requestAnimationFrame(frame); else cv.remove();
  };
  requestAnimationFrame(frame);
}


// ------------------------------------------------------------------ settle: Radix-style enter/exit on a spring
// Sets data-state like Radix does, but the motion is the kit's spring (scale + lift + blur from the origin).
function settle(el, { y = 10, scale = 0.94, blur = 6 } = {}) {
  const s = new Spring(0, PRESETS.settle); let want = false;
  s.onChange((v) => {
    const k = Math.max(0, Math.min(1.2, v));
    el.style.opacity = Math.min(1, Math.max(0, v)).toFixed(3);
    el.style.transform = `translate3d(0, ${((1 - k) * y).toFixed(2)}px, 0) scale(${(scale + (1 - scale) * k).toFixed(4)})`;
    el.style.filter = v > 0.97 ? '' : `blur(${((1 - Math.min(1, v)) * blur).toFixed(2)}px)`;
  });
  return {
    open() { want = true; el.hidden = false; el.dataset.state = 'open'; s.to(1); },
    close() { want = false; el.dataset.state = 'closed'; s.to(0).then(() => { if (!want) el.hidden = true; }); },
    get isOpen() { return want; },
  };
}

// ------------------------------------------------------------------ header
const top = $('.top');
const onScroll = () => top.classList.toggle('scrolled', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// ------------------------------------------------------------------ hero copy
if (!reduce) $$('.chorus-line').forEach((el, i) => { const c = chorus(el, { stagger: 34 }); setTimeout(c.play, 180 + i * 230); });

// copy command, with a Radix-style settling tooltip
{
  const btn = $('.copy'), tip = $('#copy-tip'), tipS = settle(tip, { y: 6 });
  let timer;
  btn.addEventListener('click', async () => {
    let ok = true; try { await navigator.clipboard.writeText(content.mcpCommand); } catch { ok = false; }
    tip.textContent = ok ? 'Copied. Paste it into a terminal' : 'Select the line to copy'; tipS.open();
    $('.copy-label', btn).textContent = ok ? 'Copied' : 'Copy'; sound.drop(1.3);
    clearTimeout(timer); timer = setTimeout(() => { tipS.close(); $('.copy-label', btn).textContent = 'Copy'; }, 1800);
  });
}

// live feed: events surface one at a time
{
  const list = $('.feed-list'), feed = createFeed();
  const ago = (d) => { const s = Math.max(1, Math.round((Date.now() - d) / 1000)); return s < 60 ? `${s}s` : `${Math.round(s / 60)}m`; };
  const tail = (e) => e.ms ? `${e.ms} ms` : e.country ?? e.city ?? (e.sha ? e.sha : '');
  const li = (e) => { const el = document.createElement('li'); el.innerHTML = `<span class="fp">${esc(e.label)}</span><span class="ft">${esc(e.text)}${tail(e) ? ' · ' + esc(tail(e)) : ''}</span><span class="fm" data-t="${+e.time}">${ago(e.time)}</span>`; return el; };
  feed.recent(3).forEach((e) => list.append(li(e)));
  feed.subscribe((e) => {
    const el = li(e); list.prepend(el); while (list.children.length > 4) list.lastChild.remove();
    if (!reduce) {
      const s = new Spring(0, PRESETS.buoy);
      s.onChange((v) => { list.style.transform = `translateY(${(v - 1) * 28}px)`; el.style.opacity = v; el.style.filter = v > 0.98 ? '' : `blur(${(1 - v) * 6}px)`; });
      s.to(1);
    }
    sound.drop(e.product === 'fun-libs' ? 1.25 : e.product === 'mcp-emails' ? 1 : 0.85, 0.5);
  });
  setInterval(() => $$('.fm', list).forEach((m) => (m.textContent = ago(+m.dataset.t))), 5000);
}

// ------------------------------------------------------------------ the years (facts only, from content.js)
const YEARS = Array.from({ length: 11 }, (_, i) => 2016 + i);
const byYear = new Map(YEARS.map((y) => [y, []]));
byYear.get(content.history.playDeveloperSince).push({ name: 'First app on Google Play', line: 'Published as an Android developer.' });
byYear.get(content.history.consultingSince).push({ name: 'Consulting begins', line: 'Outside engagements, one at a time.' });
byYear.get(content.history.companySince).push({ name: 'Albretsen AS', line: 'The company is founded.' });
for (const p of content.products) byYear.get(p.since)?.push({ id: p.id, name: p.name, line: p.line, status: p.status });

const rail = $('.tide-rail'), yearsOl = $('.tide-years'), pebble = $('.tide-pebble'), card = $('#tide-card');
yearsOl.innerHTML = YEARS.map((y) => { const n = byYear.get(y).length; return `<li data-year="${y}"><span class="bead ${n > 1 ? 'has' : n ? '' : 'empty'}"></span><span class="yl">${y}</span></li>`; }).join('');
const frac = (i) => 0.02 + 0.96 * (i / (YEARS.length - 1));
$$('li', yearsOl).forEach((li, i) => (li.style.left = (frac(i) * 100) + '%'));
const cardS = settle(card, { y: 14, scale: 0.92, blur: 8 });

let current = YEARS.length - 1;
const px = new Spring(frac(current), PRESETS.buoy);
const tilt = new Spring(0, PRESETS.weightless);
const placePebble = () => {
  const w = rail.clientWidth; const x = px.value * w;
  pebble.style.transform = `translate3d(${x}px, ${Math.sin(px.value * 40) * 3}px, 0) rotate(${(px.velocity * 30).toFixed(2)}deg)`;
  const cw = card.offsetWidth, pad = parseFloat(getComputedStyle(rail.parentElement).paddingLeft);
  const cx = Math.max(-pad + 8, Math.min(w - cw + pad - 8, x - cw / 2));
  card.style.left = (cx + pad) + 'px';
};
px.onChange(placePebble); addEventListener('resize', placePebble);

function renderCard(y) {
  const items = byYear.get(y);
  $('.tc-year', card).innerHTML = `<span>${y}</span><small>${items.length ? items.length + (items.length > 1 ? ' entries' : ' entry') : ''}</small>`;
  $('.tc-list', card).innerHTML = items.length ? items.map((it) => {
    const icon = it.id && LOGO[it.id] ? `<img src="${LOGO[it.id]}" alt="" width="22" height="22" style="${it.id === 'luma' ? 'background:#f4efe6;padding:2px' : ''}">` : `<span class="tc-dot"></span>`;
    return `<li>${icon}<span><b>${esc(it.name)}${it.status === 'retired' ? ' <span class="mono" style="display:inline">· retired</span>' : ''}</b>${esc(it.line)}</span></li>`;
  }).join('') : `<li><span class="tc-dot"></span><span class="tc-quiet">Quiet water. No launches on record.</span></li>`;
}
let hideT;
function showCard() { clearTimeout(hideT); if (!cardS.isOpen) cardS.open(); placePebble(); }
function hideCard(delay = 1400) { clearTimeout(hideT); hideT = setTimeout(() => cardS.close(), delay); }

function select(i, { snap = true, quiet = false } = {}) {
  i = Math.max(0, Math.min(YEARS.length - 1, i));
  if (i !== current) { current = i; if (!quiet) sound.drop(0.7 + i * 0.06, 0.6); }
  const y = YEARS[i];
  rail.setAttribute('aria-valuenow', y); rail.setAttribute('aria-valuetext', `${y}: ${byYear.get(y).map((x) => x.name).join(', ') || 'no launches on record'}`);
  $$('li', yearsOl).forEach((li, k) => li.classList.toggle('on', k === i));
  $$('.pin').forEach((p) => p.classList.toggle('on', +p.dataset.year === y));
  renderCard(y);
  if (snap) px.to(frac(i));
}
select(current, { quiet: true });

// drag the pebble (pointer capture), snap to the nearest year on release with the throw velocity kept
{
  let dragging = false, lastX = 0, lastT = 0, vel = 0;
  const toFrac = (e) => { const r = rail.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
  const nearest = (f) => Math.round(((f - 0.02) / 0.96) * (YEARS.length - 1));
  rail.addEventListener('pointerdown', (e) => { dragging = true; rail.setPointerCapture(e.pointerId); lastX = toFrac(e); lastT = performance.now(); px.to(lastX); select(nearest(lastX), { snap: false }); showCard(); });
  rail.addEventListener('pointermove', (e) => {
    if (!dragging) { if (e.pointerType === 'mouse') { showCard(); } return; }
    const f = toFrac(e), now = performance.now(); vel = (f - lastX) / Math.max(1, now - lastT) * 1000; lastX = f; lastT = now;
    px.to(f); select(nearest(f), { snap: false });
  });
  const end = () => { if (!dragging) return; dragging = false; const proj = Math.max(0, Math.min(1, lastX + vel * 0.12)); select(nearest(proj)); hideCard(2200); };
  rail.addEventListener('pointerup', end); rail.addEventListener('pointercancel', end);
  rail.addEventListener('pointerleave', () => !dragging && hideCard());
  rail.addEventListener('focus', showCard); rail.addEventListener('blur', () => hideCard(200));
  rail.addEventListener('keydown', (e) => {
    const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (k) { e.preventDefault(); select(current + k); showCard(); }
    else if (e.key === 'Home') { e.preventDefault(); select(0); showCard(); }
    else if (e.key === 'End') { e.preventDefault(); select(YEARS.length - 1); showCard(); }
    else if (e.key === 'Escape') hideCard(0);
  });
}

// ------------------------------------------------------------------ the live river (lazy)
function canWebGL() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2')); } catch { return false; } }
async function startRiver() {
  const canvas = $('.river'), pins = $('.year-pins');
  const els = new Map();
  for (const y of YEARS) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pin off'; b.tabIndex = -1; b.dataset.year = y; b.textContent = y;
    b.addEventListener('pointerenter', () => { select(YEARS.indexOf(y)); showCard(); });
    b.addEventListener('pointerleave', () => hideCard());
    b.addEventListener('click', () => { select(YEARS.indexOf(y)); showCard(); hideCard(2600); river?.ripple(); sound.drop(0.6); });
    pins.append(b); els.set(y, b);
  }
  try {
    const { createRiver } = await import('../assets/3d/river.js');
    let first = true;
    river = await createRiver(canvas, {
      theme: document.documentElement.dataset.theme,
      onFrame(list) {
        if (first) { first = false; canvas.classList.add('live'); select(current, { quiet: true }); }
        for (const p of list) {
          const el = els.get(p.year); if (!el) continue;
          const show = p.visible && p.x > 40 && p.x < canvas.clientWidth - 30 && p.y > 70;
          el.classList.toggle('off', !show);
          const lift = 18 + (p.y / canvas.clientHeight) * (p.year === 2026 ? 64 : 40);
          el.style.transform = `translate(${p.x.toFixed(1)}px, ${(p.y - lift).toFixed(1)}px) translate(-50%, -100%)`;
        }
      },
    });
    canvas.addEventListener('pointerdown', () => sound.drop(0.55, 1));
  } catch (err) { canvas.remove(); pins.remove(); }
}
if (!reduce && canWebGL()) {
  const go = () => ('requestIdleCallback' in window ? requestIdleCallback(startRiver, { timeout: 1200 }) : setTimeout(startRiver, 300));
  document.readyState === 'complete' ? go() : addEventListener('load', go, { once: true });
}

// ------------------------------------------------------------------ products
const live = content.products.filter((p) => p.status !== 'retired');
const harborSvg = fetch(P + 'harbor/harbor-mark.svg').then((r) => r.text()).catch(() => '');
$('.tiles').innerHTML = live.map((p) => `
  <li class="tile" data-surface>
    <a class="card" data-surface-item href="${p.url}" rel="noopener" aria-label="${esc(p.name)}: ${esc(p.line)}">
      <div class="card-img drift-gloss">
        <picture>
          <source type="image/avif" srcset="assets/products/${p.id}@1x.avif 1x, assets/products/${p.id}@2x.avif 2x">
          <img src="assets/products/${p.id}@1x.webp" srcset="assets/products/${p.id}@1x.webp 1x, assets/products/${p.id}@2x.webp 2x" alt="" width="800" height="600" loading="lazy" decoding="async">
        </picture>
        <span class="since">Since ${p.since}</span>
        <span class="go" aria-hidden="true"><svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </div>
      <div class="card-body">
        <span class="logo ${p.id === 'harbor' ? 'harbor' : p.id === 'mcp-emails' ? 'pad' : ''}" data-logo="${p.id}">${LOGO[p.id] ? `<img src="${LOGO[p.id]}" alt="" width="40" height="40">` : ''}</span>
        <p class="card-name">${esc(p.name)} <span class="status ${p.status}">${p.status}</span></p>
        <p class="card-line">${esc(p.line)}</p>
        ${p.figure ? `<p class="figure"><b>${esc(p.figure.value)}</b><span>${esc(p.figure.label)}</span></p>` : ''}
        ${p.facts?.length ? `<ul class="facts" role="list">${p.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      </div>
    </a>
  </li>`).join('');
harborSvg.then((s) => { const el = $('[data-logo="harbor"]'); if (el && s) el.innerHTML = s.replace(/<svg /, '<svg aria-hidden="true" '); });
if (!reduce && matchMedia('(hover: hover)').matches) $$('.card').forEach((c) => buoy(c, { lift: 8, tilt: 4, follow: 4 }));

// retired: pebbles on the riverbed, each opens a small settling popover
{
  const retired = content.products.filter((p) => p.status === 'retired');
  const ul = $('.pebbles');
  ul.innerHTML = retired.map((p, i) => `
    <li class="${i > retired.length / 2 ? 'right' : ''}">
      <button class="peb" type="button" aria-expanded="false" aria-controls="pop-${p.id}">
        <img src="${LOGO[p.id]}" alt="" width="28" height="28" style="${p.id === 'luma' ? 'object-fit:contain;padding:3px' : ''}">
        <span>${esc(p.name)}</span><span class="yr">${p.since}</span>
      </button>
      <div class="pop" id="pop-${p.id}" role="region" aria-label="${esc(p.name)}" hidden data-state="closed">
        <b>${esc(p.name)}</b>${esc(p.line)}
        <p class="mono">${p.since}${p.figure ? ` · ${esc(p.figure.value)} ${esc(p.figure.label)}` : ''}${['luma'].includes(p.id) ? '' : ' · icon is a stand-in'}</p>
      </div>
    </li>`).join('');
  let open = null; const pops = new Map($$('.pop', ul).map((el) => [el.id, settle(el)]));
  const close = (btn, focus) => {
    if (!btn) return; const pop = $('#' + btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded', 'false'); pops.get(pop.id).close();
    if (focus) btn.focus(); if (open === btn) open = null;
  };
  $$('.peb', ul).forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (open === btn) return close(btn);
    close(open); const pop = $('#' + btn.getAttribute('aria-controls'));
    pops.get(pop.id).open(); btn.setAttribute('aria-expanded', 'true'); open = btn; sound.drop(0.9);
  }));
  document.addEventListener('click', (e) => { if (open && !e.target.closest('.pop')) close(open); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) close(open, true); });
}

// writing
$('.post-list').innerHTML = content.posts.map((p) => `<li><a href="/blog/${p.slug}"><span class="pt">${esc(p.title)}</span><time datetime="${p.date}">${new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</time></a></li>`).join('');
$('.foot-year').textContent = `${content.history.playDeveloperSince}–${new Date().getFullYear()}`;

// ------------------------------------------------------------------ weightless floaters you can throw
// Each sticker is a body: a weak spring holds it near home, the pointer can grab and fling it, walls bounce.
const floaters = [];
function kickFloaters(dir) { floaters.forEach((f) => { f.vy += dir * (220 + Math.random() * 200); f.vx += (Math.random() - 0.5) * 200; f.vr += (Math.random() - 0.5) * 120; }); wake(); }
let wake = () => {};
{
  const pool = $('.pool');
  const items = $$('.floater', pool).filter((el) => !(innerWidth < 700 && $$('.floater', pool).indexOf(el) > 1));
  $$('.floater', pool).forEach((el) => { if (!items.includes(el)) el.remove(); });
  let W = 0, H = 0;
  const measure = () => { W = pool.clientWidth; H = pool.clientHeight; floaters.forEach((f) => { f.hx = f.home[0] * (W - f.w); f.hy = f.home[1] * (H - f.w); }); };
  items.forEach((el, i) => {
    const home = el.dataset.home.split(',').map(Number);
    const f = { el, home, x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0, w: el.offsetWidth || 150, held: false, phase: i * 1.7 };
    floaters.push(f);
  });
  measure(); floaters.forEach((f) => { f.x = f.hx; f.y = f.hy; });
  new ResizeObserver(() => { floaters.forEach((f) => (f.w = f.el.offsetWidth || f.w)); measure(); wake(); }).observe(pool);
  const draw = (f, t) => { const bob = reduce ? 0 : Math.sin(t * 0.6 + f.phase) * 6; f.el.style.transform = `translate3d(${f.x.toFixed(1)}px, ${(f.y + bob).toFixed(1)}px, 0) rotate(${f.r.toFixed(2)}deg)`; };
  floaters.forEach((f) => draw(f, 0));

  let raf = 0, last = 0, visible = false;
  const step = (now) => {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016); last = now; const t = now / 1000;
    for (const f of floaters) {
      if (!f.held) {
        // weak home spring (weightless) + water drag
        const ax = -4 * (f.x - f.hx) - 1.6 * f.vx, ay = -4 * (f.y - f.hy) - 1.6 * f.vy;
        f.vx += ax * dt; f.vy += ay * dt; f.x += f.vx * dt; f.y += f.vy * dt;
        f.vr += (-6 * f.r - 2.2 * f.vr) * dt; f.r += f.vr * dt;
        if (f.x < 0) { f.x = 0; f.vx = Math.abs(f.vx) * 0.6; } if (f.x > W - f.w) { f.x = W - f.w; f.vx = -Math.abs(f.vx) * 0.6; }
        if (f.y < 0) { f.y = 0; f.vy = Math.abs(f.vy) * 0.6; } if (f.y > H - f.w) { f.y = H - f.w; f.vy = -Math.abs(f.vy) * 0.6; }
      }
      draw(f, t);
    }
    raf = visible ? requestAnimationFrame(step) : 0;
  };
  wake = () => { if (!raf && visible && !reduce) { last = performance.now(); raf = requestAnimationFrame(step); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake(); }).observe(pool);

  for (const f of floaters) {
    let ox = 0, oy = 0, lx = 0, ly = 0, lt = 0;
    f.el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); f.el.setPointerCapture(e.pointerId); f.held = true; const r = pool.getBoundingClientRect();
      ox = e.clientX - r.left - f.x; oy = e.clientY - r.top - f.y; lx = e.clientX; ly = e.clientY; lt = performance.now(); f.vx = f.vy = 0; sound.drop(0.8, 0.6);
    });
    f.el.addEventListener('pointermove', (e) => {
      if (!f.held) return; const r = pool.getBoundingClientRect(), now = performance.now(), dt = Math.max(8, now - lt) / 1000;
      const nvx = (e.clientX - lx) / dt, nvy = (e.clientY - ly) / dt; f.vx = f.vx * 0.5 + nvx * 0.5; f.vy = f.vy * 0.5 + nvy * 0.5;
      f.vr = f.vx * 0.05; f.r = Math.max(-25, Math.min(25, f.r + f.vx * dt * 0.08));
      f.x = e.clientX - r.left - ox; f.y = e.clientY - r.top - oy; lx = e.clientX; ly = e.clientY; lt = now;
      if (reduce) draw(f, 0);
    });
    const drop = () => { if (!f.held) return; f.held = false; f.vx = Math.max(-2600, Math.min(2600, f.vx)); f.vy = Math.max(-2600, Math.min(2600, f.vy)); wake(); };
    f.el.addEventListener('pointerup', drop); f.el.addEventListener('pointercancel', drop);
  }
}

// ------------------------------------------------------------------ magnetic buttons (spring follow)
if (!reduce && matchMedia('(hover: hover)').matches) {
  $$('.magnet').forEach((el) => {
    const x = new Spring(0, PRESETS.buoy), y = new Spring(0, PRESETS.buoy);
    const apply = () => (el.style.transform = `translate3d(${x.value}px, ${y.value}px, 0)`);
    x.onChange(apply); y.onChange(apply);
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); x.to((e.clientX - r.left - r.width / 2) * 0.28); y.to((e.clientY - r.top - r.height / 2) * 0.35); });
    el.addEventListener('pointerleave', () => { x.to(0); y.to(0); });
  });
}

// entrances last, so generated content is included
surface(document, { stagger: 80 });
