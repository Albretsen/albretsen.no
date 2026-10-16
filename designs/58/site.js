// Specimen Drop · albretsen.no, design 58.
// Everything that moves runs on the kit's one hand-rolled spring (assets/motion.js).
import { content } from '../_shared/content.js';
import { createFeed, formatTime, describe } from '../_shared/feed.js';
import { Spring, SPRINGS, loop, loupe, herbarium, drift } from './assets/motion.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- specimen data: facts from content.js, habit from the geode ---------- */
const HABIT = {
  'mcp-emails': ['quartz', 'frost'], 'fun-libs': ['quartz', 'citrine'], toolrails: ['twin', 'periwinkle'], harbor: ['octa', 'milky'],
  luma: ['cube', 'rose'], 'polyglot-pilot': ['quartz', 'periwinkle'], pinpoint: ['octa', 'frost'], webvakt: ['quartz', 'frost'],
  'joke-central': ['cube', 'citrine'], 'tryggere-hyring': ['twin', 'milky'], 'early-apps': ['octa', 'periwinkle'],
};
const HABIT_NAME = { quartz: 'Quartz point', twin: 'Twinned point', octa: 'Octahedron', cube: 'Cube' };
const STATUS = { live: 'Live', building: 'Building', paused: 'Paused', retired: 'Retired' };
const SHORT = { 'joke-central': 'Joke Central', 'early-apps': 'Early apps' };
const products = content.products.map((p, i) => ({ ...p, no: String(i + 1).padStart(2, '0'), habit: HABIT[p.id] }));
const byId = Object.fromEntries(products.map((p) => [p.id, p]));
const host = (u) => u.replace(/^https?:\/\//, '').replace(/\/$/, '');

/* ---------- sound (opt-in, synthesised, nothing downloaded) ---------- */
const sound = (() => {
  let ctx = null, on = false;
  const btn = $('[data-sound]');
  btn.addEventListener('click', () => {
    on = !on;
    if (on && !ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { on = false; } }
    ctx?.resume?.();
    btn.setAttribute('aria-pressed', String(on));
    $('.sound-label', btn).textContent = on ? 'Sound on' : 'Sound off';
    if (on) tink(1760, 0.06);
  });
  // glass: a sine plus its inharmonic partial, fast attack, ringing decay
  function tink(f = 1800, g = 0.07, when = 0) {
    if (!on || !ctx) return;
    const t = ctx.currentTime + when, out = ctx.createGain();
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(g, t + 0.004); out.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    out.connect(ctx.destination);
    for (const [m, a] of [[1, 1], [2.76, 0.35], [5.4, 0.12]]) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.frequency.value = f * m; og.gain.value = a; o.connect(og).connect(out); o.start(t); o.stop(t + 1);
    }
  }
  // paper: a short band-passed noise burst, for cards landing
  function paper(g = 0.05) {
    if (!on || !ctx) return;
    const t = ctx.currentTime, len = Math.floor(ctx.sampleRate * 0.09), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), gn = ctx.createGain();
    s.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.8; gn.gain.value = g;
    s.connect(bp).connect(gn).connect(ctx.destination); s.start(t);
  }
  return { tink, paper };
})();

/* ---------- toast + announcements ---------- */
const toastEl = $('[data-toast]'); let toastT;
function toast(msg) {
  toastEl.textContent = msg; toastEl.classList.add('is-on');
  clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('is-on'), 2400);
}
const announce = (msg) => { $('[data-announce]').textContent = msg; };

/* ---------- copy the MCP command (Radix-style tooltip from the trigger edge) ---------- */
{
  const btn = $('[data-copy]'), tip = $('#cmd-tip'); let t;
  btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    try { await navigator.clipboard.writeText(text); tip.textContent = 'Copied. Paste it into a terminal.'; }
    catch { const r = document.createRange(); r.selectNodeContents($('code', btn)); getSelection().removeAllRanges(); getSelection().addRange(r); tip.textContent = 'Selected. Press ⌘C or Ctrl+C.'; }
    tip.dataset.state = 'open'; sound.tink(2350, 0.05);
    clearTimeout(t); t = setTimeout(() => (tip.dataset.state = 'closed'), 1800);
  });
}

/* ---------- growth log (live feed) ---------- */
{
  const list = $('[data-log]'), N = 5;
  const row = (e, isNew) => {
    const li = document.createElement('li'); if (isNew) li.className = 'is-new';
    li.innerHTML = `<time datetime="${e.time.toISOString()}">${formatTime(e.time)}</time><b>${esc(e.label)}</b><span>${esc(describe(e))}</span>`;
    return li;
  };
  const feed = createFeed();
  feed.recent(N).forEach((e) => list.appendChild(row(e)));
  feed.subscribe((e) => {
    if (document.hidden) { list.prepend(row(e)); while (list.children.length > N) list.lastElementChild.remove(); return; }
    const li = row(e, true); list.prepend(li);
    while (list.children.length > N) list.lastElementChild.remove();
    if (reduced) return;
    const y = new Spring(-14, SPRINGS.settle).set(0), o = new Spring(0, SPRINGS.lift).set(1);
    loop((dt) => {
      li.style.transform = `translateY(${y.step(dt).toFixed(2)}px)`; li.style.opacity = clamp(o.step(dt), 0, 1).toFixed(3);
      if (y.done && o.done) { li.style.transform = ''; li.style.opacity = ''; return false; }
    });
    setTimeout(() => li.classList.remove('is-new'), 4000);
  });
}

/* ---------- magnetic buttons ---------- */
for (const el of $$('.magnetic')) {
  if (reduced) break;
  const x = new Spring(0, SPRINGS.lift), y = new Spring(0, SPRINGS.lift); let run = false;
  const go = () => { if (run) return; run = true; loop((dt) => { el.style.translate = `${x.step(dt).toFixed(2)}px ${y.step(dt).toFixed(2)}px`; if (x.done && y.done) { run = false; return false; } }); };
  el.addEventListener('pointermove', (e) => { const b = el.getBoundingClientRect(); x.set((e.clientX - b.left - b.width / 2) * 0.28); y.set((e.clientY - b.top - b.height / 2) * 0.36); go(); });
  el.addEventListener('pointerleave', () => { x.set(0); y.set(0); go(); });
}

/* ---------- hanging specimen label: a pendulum on the same spring ---------- */
const PENDULUM = { stiffness: 38, damping: 2.4, mass: 1 }, HELD = { stiffness: 320, damping: 30, mass: 1 };
const tagRig = $('.tag-rig'), tagEl = $('[data-tag]');
const swing = new Spring(0, PENDULUM);
let swingRun = false;
function swingGo() {
  if (swingRun) return; swingRun = true;
  loop((dt) => { tagRig.style.rotate = `${swing.step(dt).toFixed(2)}deg`; if (swing.done && !tagHeld) { swingRun = false; return false; } });
}
let tagHeld = false;
tagEl.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button')) return;
  tagHeld = true; tagEl.setPointerCapture(e.pointerId); tagEl.classList.add('is-held'); Object.assign(swing, HELD); swingGo();
});
tagEl.addEventListener('pointermove', (e) => {
  if (!tagHeld) return;
  const P = tagRig.offsetParent.getBoundingClientRect();
  const px = P.left + tagRig.offsetLeft + tagRig.offsetWidth / 2, pivotY = P.top + tagRig.offsetTop;
  const a = -Math.atan2(e.clientX - px, Math.max(30, e.clientY - pivotY)) * 180 / Math.PI;
  swing.set(clamp(a, -62, 62));
});
const tagDrop = () => { if (!tagHeld) return; tagHeld = false; tagEl.classList.remove('is-held'); Object.assign(swing, PENDULUM); swing.set(0); sound.tink(1320, 0.04); swingGo(); };
tagEl.addEventListener('pointerup', tagDrop); tagEl.addEventListener('pointercancel', tagDrop);
// a breeze: fast pointer moves across the hero nudge the label
{
  let lastX = null;
  $('.hero').addEventListener('pointermove', (e) => {
    if (reduced || tagHeld || e.pointerType !== 'mouse') return;
    if (lastX != null) { const dx = e.clientX - lastX; if (Math.abs(dx) > 6) { swing.impulse(clamp(-dx * 0.18, -9, 9)); swingGo(); } }
    lastX = e.clientX;
  });
}

let geode = null, current = 0;
const chip = $('[data-chip]');
function placeChip(id) {
  if (!geode) return;
  const xy = geode.project(id); if (!xy) return;
  chip.style.left = `${xy.x}px`; chip.style.top = `${xy.y}px`;
}
function setSpecimen(i, { from = 'nav' } = {}) {
  current = (i + products.length) % products.length;
  const p = products[current];
  $('[data-tag-no]').textContent = `Specimen Nº ${p.no}`;
  const st = $('[data-tag-status]'); st.dataset.status = p.status; st.textContent = STATUS[p.status];
  $('[data-tag-name]').textContent = SHORT[p.id] || p.name;
  $('[data-tag-line]').textContent = p.line;
  $('[data-tag-habit]').textContent = `${HABIT_NAME[p.habit[0]]}, ${p.habit[1]}`;
  $('[data-tag-year]').textContent = `${p.since} · Norway`;
  $('[data-tag-fig]').textContent = p.figure ? p.figure.value : '—';
  $('[data-tag-figlabel]').textContent = p.figure ? p.figure.label : 'no figure kept';
  $('[data-tag-count]').textContent = `${current + 1} / ${products.length}`;
  $('[data-chip-no]').textContent = `Nº ${p.no}`; $('[data-chip-name]').textContent = SHORT[p.id] || p.name;
  swing.impulse(from === 'hover' ? 14 : -26); swingGo();
  if (from === 'nav') {
    announce(`Specimen ${p.no}, ${p.name}, ${STATUS[p.status]}.`);
    if (geode) {
      geode.focus(p.id); geode.highlight(p.id); chip.classList.add('is-on');
      const t0 = performance.now();
      loop(() => { placeChip(p.id); if (performance.now() - t0 > 1600) return false; });
    }
    sound.tink(1500 + current * 60, 0.05);
  }
}
$('[data-tag-prev]').addEventListener('click', () => setSpecimen(current - 1));
$('[data-tag-next]').addEventListener('click', () => setSpecimen(current + 1));

/* ---------- the geode: live three.js, lazy, with a still for first paint ---------- */
const stage = $('#stage');
stage.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setSpecimen(current + 1); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setSpecimen(current - 1); }
});
function webgl() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }
async function mountLive() {
  if (geode || reduced || !webgl()) return;
  try {
    const { mountGeode } = await import('./assets/3d/crystals.js');
    let prev = null;
    geode = await mountGeode(stage, {
      yaw: -0.5, pitch: 0.3, zoom: innerWidth < 600 ? 1.3 : innerWidth < 900 ? 1.15 : 1.02,
      onHover(p) {
        if (!p) { chip.classList.remove('is-on'); return; }
        const i = products.findIndex((d) => d.id === p.id);
        if (i !== current) setSpecimen(i, { from: 'hover' });
        placeChip(p.id); chip.classList.add('is-on');
      },
      onRearrange(order) {
        const now = Object.fromEntries(order.map((o) => [o.id, o.socket]));
        const moved = prev ? order.filter((o) => prev[o.id] !== o.socket).map((o) => SHORT[o.id] || byId[o.id].name) : [];
        prev = now;
        toast(moved.length === 2 ? `Swapped · ${moved[0]} ⇄ ${moved[1]}` : moved.length ? `Re-seated · ${moved[0]}` : 'Re-seated');
        sound.tink(2100, 0.06); sound.tink(2650, 0.04, 0.07);
      },
    });
    // the first onRearrange needs a baseline: read it through a no-op shuffle-free path
    // cross-fade from the still only once the live scene has really drawn
    const ready = () => (geode.renderer.info.render.frame > 3 ? stage.classList.add('is-live') : requestAnimationFrame(ready));
    requestAnimationFrame(ready);
    new IntersectionObserver(([en]) => geode.pause(!en.isIntersecting)).observe(stage);
  } catch (err) { geode = null; }
}
$('[data-shake]').addEventListener('click', () => {
  if (!geode) { mountLive(); return; }
  geode.shuffle(); toast('Shaken · every crystal found a new socket');
  for (let k = 0; k < 7; k++) sound.tink(1400 + Math.random() * 1400, 0.035, 0.18 + k * 0.06);
});
if (!reduced) {
  const start = () => {
    const io = new IntersectionObserver((ents) => { if (ents.some((e) => e.isIntersecting)) { io.disconnect(); mountLive(); } }, { rootMargin: '200px' });
    io.observe(stage);
  };
  if (document.readyState === 'complete') (window.requestIdleCallback || setTimeout)(start, { timeout: 900 });
  else addEventListener('load', () => (window.requestIdleCallback || setTimeout)(start, { timeout: 900 }));
} else {
  $('[data-shake]').hidden = true; $('.stage-hint').textContent = 'Use the label to browse the specimens';
}

/* ---------- stickers: pick up, carry, throw; they dangle while carried ---------- */
function stickers(els, bounds) {
  for (const el of els) {
    const x = new Spring(0, SPRINGS.lift), y = new Spring(0, SPRINGS.lift), r = new Spring(0, { stiffness: 140, damping: 9, mass: 1 }), s = new Spring(1, SPRINGS.lift);
    let held = null, run = false, vx = 0, vy = 0, lt = 0, lx = 0, ly = 0;
    const go = () => {
      if (run) return; run = true;
      loop((dt) => {
        el.style.transform = `translate3d(${x.step(dt).toFixed(1)}px,${y.step(dt).toFixed(1)}px,0) rotate(${r.step(dt).toFixed(2)}deg) scale(${s.step(dt).toFixed(3)})`;
        if (!held && x.done && y.done && r.done && s.done) { run = false; return false; }
      });
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('is-held');
      held = { px: e.clientX, py: e.clientY, x0: x.target, y0: y.target }; lx = e.clientX; ly = e.clientY; lt = performance.now(); vx = vy = 0;
      s.set(1.12); el.style.zIndex = 9; sound.paper(0.03); go();
    });
    el.addEventListener('pointermove', (e) => {
      if (!held) return;
      const now = performance.now(), dtm = Math.max(8, now - lt);
      vx = vx * 0.6 + ((e.clientX - lx) / dtm) * 1000 * 0.4; vy = vy * 0.6 + ((e.clientY - ly) / dtm) * 1000 * 0.4;
      lx = e.clientX; ly = e.clientY; lt = now;
      x.set(held.x0 + e.clientX - held.px); y.set(held.y0 + e.clientY - held.py);
      r.set(clamp(vx * 0.018, -28, 28));
    });
    const drop = () => {
      if (!held) return; held = null; el.classList.remove('is-held'); el.style.zIndex = '';
      // throw: carry the release velocity, but keep the specimen inside the hero
      const B = bounds.getBoundingClientRect(), E = el.getBoundingClientRect();
      const tx = x.target + vx * 0.14, ty = y.target + vy * 0.14;
      const dx = clamp(tx - x.target, B.left - E.left, B.right - E.right), dy = clamp(ty - y.target, B.top + 40 - E.top, B.bottom - E.bottom);
      x.set(x.target + dx); y.set(y.target + dy); x.impulse(vx * 0.2); y.impulse(vy * 0.2);
      r.set(0); r.impulse(clamp(vx * 0.05, -200, 200)); s.set(1); sound.tink(900 + Math.random() * 500, 0.03); go();
    };
    el.addEventListener('pointerup', drop); el.addEventListener('pointercancel', drop);
  }
}
const hero = $('.hero');
stickers($$('.sticker'), hero);
if (!reduced && matchMedia('(pointer: fine)').matches) drift($$('.sticker'), { range: 22 });

/* ---------- the collection: mounted cards + retired drawer ---------- */
const mounted = ['mcp-emails', 'fun-libs', 'toolrails', 'harbor', 'luma'].map((id) => byId[id]);
const cards = $('[data-cards]');
cards.innerHTML = mounted.map((p) => {
  const img = `assets/products/specimen-${p.id}`;
  return `<article class="card" data-id="${p.id}" tabindex="0" aria-label="Specimen ${p.no}, ${esc(p.name)}. Alt plus arrow keys to move.">
    <figure class="card-mount">
      <img src="${img}.webp" srcset="${img}.webp 800w, ${img}@2x.webp 1600w" sizes="(min-width: 1180px) 19vw, (min-width: 900px) 31vw, (min-width: 560px) 46vw, 92vw" width="800" height="1000" alt="${esc(p.name)} logo, mounted on a specimen card" loading="lazy" decoding="async" draggable="false">
      <div data-loupe><img data-src="${img}@2x.webp" alt="" draggable="false"></div>
    </figure>
    <div class="card-label">
      <div class="card-top"><span class="card-no">Nº ${p.no} · since ${p.since}</span><span class="pill" data-status="${p.status}">${STATUS[p.status]}</span></div>
      <h3 class="card-name">${esc(p.name)}</h3>
      <p class="card-line">${esc(p.line)}</p>
      ${p.figure ? `<p class="card-fig"><b>${esc(p.figure.value)}</b><span class="card-figlabel">${esc(p.figure.label)}</span></p>` : ''}
      ${p.facts ? `<ul class="card-facts">${p.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      ${p.url ? `<a class="card-link" href="${p.url}" rel="noopener">${host(p.url)} <span aria-hidden="true">↗</span></a>` : ''}
    </div>
  </article>`;
}).join('');

const drawer = $('[data-drawer]');
drawer.innerHTML = products.filter((p) => p.status === 'retired' && p.id !== 'luma').map((p) => `
  <li data-id="${p.id}" tabindex="0" aria-label="Retired specimen ${p.no}, ${esc(p.name)}. Alt plus arrow keys to move.">
    <img src="assets/products/retired/${p.id}.svg" width="100" height="100" alt="" loading="lazy" draggable="false">
    <b>${esc(SHORT[p.id] || p.name)}</b>
    <small>Nº ${p.no} · ${p.since} · ${HABIT_NAME[p.habit[0]]}</small>
    <p>${esc(p.line)}</p>
  </li>`).join('');

// links and buttons inside a draggable card stay clickable
for (const g of [cards, drawer]) g.addEventListener('pointerdown', (e) => { if (e.target.closest('a,button')) e.stopPropagation(); }, true);
herbarium(cards, { key: 'albretsen-58-cards', onChange: () => sound.paper(0.05) });
herbarium(drawer, { key: 'albretsen-58-drawer', onChange: () => sound.paper(0.04) });

// keyboard reorder with a view transition (Alt + arrows)
function keyMove(grid, key) {
  grid.addEventListener('keydown', (e) => {
    const el = e.target.closest('[data-id]'); if (!el || el.parentNode !== grid || !e.altKey) return;
    const dir = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : 0;
    if (!dir) return; e.preventDefault();
    const list = [...grid.children], i = list.indexOf(el), j = i + dir; if (j < 0 || j >= list.length) return;
    const mutate = () => { grid.insertBefore(el, dir > 0 ? list[j].nextSibling : list[j]); el.focus(); };
    if (document.startViewTransition && !reduced) {
      list.forEach((n) => (n.style.viewTransitionName = `vt-${n.dataset.id}`));
      const vt = document.startViewTransition(mutate);
      vt.finished.finally(() => list.forEach((n) => (n.style.viewTransitionName = '')));
    } else mutate();
    try { localStorage.setItem(key, JSON.stringify([...grid.children].map((n) => n.dataset.id))); } catch {}
    announce(`${el.querySelector('.card-name, b').textContent} moved to position ${j + 1} of ${list.length}.`);
    sound.paper(0.05);
  });
}
keyMove(cards, 'albretsen-58-cards'); keyMove(drawer, 'albretsen-58-drawer');

// loupe: lean + lens; the 2x plate only loads on first hover
for (const card of $$('.card', cards)) {
  const mount = $('.card-mount', card), lensImg = $('[data-loupe] img', mount);
  if (matchMedia('(pointer: fine)').matches && !reduced) {
    mount.classList.add('loupe'); loupe(mount, { radius: 78, maxTilt: 6 });
    mount.addEventListener('pointerenter', () => { if (!lensImg.src) lensImg.src = lensImg.dataset.src; }, { once: true });
    mount.addEventListener('pointermove', (e) => { const b = mount.getBoundingClientRect(); lensImg.style.transformOrigin = `${(e.clientX - b.left) / b.width * 100}% ${(e.clientY - b.top) / b.height * 100}%`; });
  } else $('[data-loupe]', mount).remove();
}

// cards land like specimens being laid out, the first time they scroll in
if (!reduced && 'IntersectionObserver' in window) {
  const pending = [...$$('.card', cards), ...$$('li', drawer)];
  pending.forEach((el) => (el.style.opacity = 0));
  const io = new IntersectionObserver((ents) => {
    const vis = ents.filter((e) => e.isIntersecting).map((e) => e.target);
    vis.forEach((el, k) => {
      io.unobserve(el);
      const y = new Spring(-30, SPRINGS.settle), r = new Spring((k % 2 ? 1 : -1) * 4, SPRINGS.settle), o = new Spring(0, SPRINGS.lift);
      setTimeout(() => {
        y.set(0); r.set(0); o.set(1);
        loop((dt) => {
          if (el.classList.contains('is-lifted')) { el.style.opacity = ''; return false; }
          el.style.translate = `0 ${y.step(dt).toFixed(2)}px`; el.style.rotate = `${r.step(dt).toFixed(2)}deg`; el.style.opacity = clamp(o.step(dt), 0, 1).toFixed(3);
          if (y.done && r.done && o.done) { el.style.translate = el.style.rotate = el.style.opacity = ''; return false; }
        });
      }, k * 80);
    });
  }, { threshold: 0.15 });
  pending.forEach((el) => io.observe(el));
}

setSpecimen(0, { from: 'init' });
