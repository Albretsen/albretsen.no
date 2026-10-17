// Design 42 · Same Room — page behaviour.
// Motion (window.Motion) is loaded as a deferred classic script before this module runs.
import { content } from '../_shared/content.js';
import { createFeed } from '../_shared/feed.js';
import * as MX from './assets/motion.js';

const $ = (s, r = document) => r.querySelector(s);
const M = globalThis.Motion;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const P = '../_shared/products/';
const A = 'assets/';
const byId = Object.fromEntries(content.products.map(p => [p.id, p]));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------------- sound (opt-in) ---------------- */
const sound = (() => {
  let ctx = null, on = false;
  const btn = $('.sound');
  btn.addEventListener('click', () => {
    on = !on;
    if (on && !ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    btn.setAttribute('aria-pressed', String(on));
    $('.sl', btn).textContent = on ? 'Sound on' : 'Sound off';
    if (on) blip(660, .05);
  });
  // a short wooden "block click": sine + quick pitch drop
  function blip(f = 520, vol = .04) {
    if (!on || !ctx) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .55, t + .09);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .14);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + .16);
  }
  return { blip };
})();

/* ---------------- the seam: a time scrubber between two registered renders ---------------- */
const MILESTONES = [
  { y: 2016, t: 'First app published on Google Play.', img: [] },
  { y: 2019, t: 'Fun Libs ships. Built at 17, from this desk.', img: [[P + 'fun-libs/icon-v4.png', 'Fun Libs v4 icon']] },
  { y: 2021, t: 'Consulting starts, next to the first utility apps.', img: [[A + 'standins/early-apps.webp', '']] },
  { y: 2023, t: 'Tryggere Hyring: background checks for hiring.', img: [[A + 'standins/tryggere-hyring.webp', '']] },
  { y: 2024, t: 'WebVakt and Joke Central.', img: [[A + 'standins/webvakt.webp', ''], [A + 'standins/joke-central.webp', '']] },
  { y: 2025, t: 'Polyglot Pilot and PinPoint.', img: [[A + 'standins/polyglot-pilot.webp', ''], [A + 'standins/pinpoint.webp', '']] },
  { y: 2026, t: 'Albretsen AS. MCP Emails, Toolrails, Harbor and Fun Libs v5.', img: [[P + 'mcp-emails/icon.png', 'MCP Emails'], [P + 'toolrails/icon.svg', 'Toolrails'], [P + 'fun-libs/icon.png', 'Fun Libs']] },
];
const MIN = 4, MAX = 96;                                         // seam limits, in %
const yearAt = pct => 2026 - ((pct - MIN) / (MAX - MIN)) * 10;    // far right = all 2019 room = 2016
const pctOf = y => MIN + ((2026 - y) / 10) * (MAX - MIN);
const milestoneAt = pct => { const y = yearAt(pct) + .5; let m = MILESTONES[0]; for (const s of MILESTONES) if (s.y <= y) m = s; return m; };

(function seam() {
  const el = $('[data-room]'), hero = $('.hero'), yr = $('.yr', el);
  const mYear = $('.m-year'), mText = $('.m-text'), mThumbs = $('.m-thumbs');
  let cur = null, last = 50, touched = false;

  const show = m => {
    if (m === cur) return; cur = m;
    yr.textContent = m.y; mYear.textContent = m.y; mText.textContent = m.t;
    mThumbs.innerHTML = m.img.map(([src, alt]) => `<img src="${src}" alt="${esc(alt)}" width="38" height="44">`).join('');
    el.setAttribute('aria-valuenow', m.y); el.setAttribute('aria-valuetext', `${m.y}: ${m.t}`);
    if (!reduce && M) M.animate(mThumbs.children, { y: [-14, 0], opacity: [0, 1] }, { type: 'spring', stiffness: 380, damping: 18, delay: M.stagger(.05) });
    sound.blip(380 + (m.y - 2016) * 40);
  };
  const COLS = ['#f3d761', '#a5ce6f', '#bae5fd', '#daccf7', '#fed0b2', '#fcbfc2'];
  const shed = p => {
    if (reduce || !M) return;
    const n = Math.min(3, Math.floor(Math.abs(p - last) / 1.5)); if (!n) return;
    for (let i = 0; i < n; i++) {
      const b = document.createElement('i'); b.className = 'seam-bit';
      const s = 6 + Math.random() * 8;
      b.style.cssText = `left:${p}%;top:${18 + Math.random() * 62}%;width:${s}px;height:${s}px;background:${COLS[(Math.random() * COLS.length) | 0]}`;
      el.appendChild(b);
      M.animate(b, { y: [0, -50 - Math.random() * 110], x: [0, (p > last ? -1 : 1) * (10 + Math.random() * 40)], rotate: [0, 90 + Math.random() * 90], opacity: [1, 0] },
        { duration: 1 + Math.random() * .7, ease: [.2, .7, .3, 1] }).finished.then(() => b.remove());
    }
    last = p;
  };
  const render = p => { el.style.setProperty('--seam', p + '%'); hero.style.setProperty('--p', (p / 100).toFixed(3)); show(milestoneAt(p)); shed(p); };

  let pos;
  if (M && !reduce) { pos = M.springValue(50, { stiffness: 220, damping: 26 }); pos.on('change', render); }
  else { let v = 50; pos = { get: () => v, set: n => { v = n; render(n); } }; }
  render(50);

  const clamp = v => Math.max(MIN, Math.min(MAX, v));
  const fromEvent = e => { const r = el.getBoundingClientRect(); return clamp(((e.clientX - r.left) / r.width) * 100); };
  let dragging = false, sx = 0, sy = 0, decided = false;
  el.addEventListener('pointerdown', e => {
    touched = true; dragging = true; decided = e.pointerType !== 'touch'; sx = e.clientX; sy = e.clientY;
    if (decided) { el.setPointerCapture(e.pointerId); pos.set(fromEvent(e)); }
  });
  el.addEventListener('pointermove', e => {
    if (!dragging) return;
    if (!decided) { // touch: only take over horizontal drags, let vertical ones scroll
      if (Math.abs(e.clientX - sx) < 6 && Math.abs(e.clientY - sy) < 6) return;
      if (Math.abs(e.clientY - sy) > Math.abs(e.clientX - sx)) { dragging = false; return; }
      decided = true; el.setPointerCapture(e.pointerId);
    }
    pos.set(fromEvent(e));
  });
  const up = () => { dragging = false; };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);

  // keyboard: step milestone by milestone
  el.addEventListener('keydown', e => {
    const i = MILESTONES.indexOf(cur); let to = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = MILESTONES[Math.min(MILESTONES.length - 1, i + 1)]; // left reveals later years
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = MILESTONES[Math.max(0, i - 1)];
    if (e.key === 'Home') to = MILESTONES[0];
    if (e.key === 'End') to = MILESTONES[MILESTONES.length - 1];
    if (to) { e.preventDefault(); touched = true; pos.set(pctOf(to.y)); }
  });

  // intro sweep: scrub back to 2019, forward to today, settle in the middle
  if (M && !reduce) {
    const steps = [[450, pctOf(2019)], [1350, pctOf(2026) + 4], [2200, 50]];
    steps.forEach(([t, v]) => setTimeout(() => { if (!touched) pos.set(v); }, t));
  }
})();

/* ---------------- live feed in the robot's speech bubble ---------------- */
(function feed() {
  const list = $('.feed'); const f = createFeed();
  const COL = { 'mcp-emails': '#81bfeb', 'fun-libs': '#fcbfc2', toolrails: '#b9a8e6', 'albretsen.no': '#f3d761' };
  const hm = d => d.toTimeString().slice(0, 5);
  const tail = e => e.ms ? `${e.ms} ms` : e.country || e.city || (e.sha ? e.sha : '');
  const li = e => { const n = document.createElement('li');
    n.innerHTML = `<i class="pd" style="background:${COL[e.product]}"></i><span class="tx">${esc(e.label)} · ${esc(e.text)}${tail(e) ? ' · ' + esc(tail(e)) : ''}</span><span class="tm">${hm(e.time)}</span>`; return n; };
  f.recent(3).forEach(e => list.appendChild(li(e)));
  f.subscribe(e => {
    const n = li(e); list.prepend(n);
    while (list.children.length > 3) list.lastElementChild.remove();
    if (M && !reduce) M.animate(n, { y: [-18, 0], scale: [.96, 1] }, { type: 'spring', stiffness: 380, damping: 18 });
  });
})();

/* ---------------- products ---------------- */
const LIVE = [
  { id: 'mcp-emails', logo: P + 'mcp-emails/icon.png', tint: '#e3f3fd', shadow: '#81bfeb', sticker: A + 'stickers/open-source.svg' },
  { id: 'fun-libs', logo: P + 'fun-libs/icon.png', tint: '#fde6e6', shadow: '#f4a3a8', sticker: A + 'stickers/installs.svg' },
  { id: 'toolrails', logo: P + 'toolrails/icon.svg', tint: '#efe9fc', shadow: '#b9a8e6' },
  { id: 'harbor', logo: P + 'harbor/harbor-mark.svg', tint: '#f7f1dc', shadow: '#d8b736', pad: true },
];
const STATUS = { live: 'live', building: 'building', paused: 'paused' };
(function cards() {
  const ul = $('#cards');
  ul.innerHTML = LIVE.map(L => {
    const p = byId[L.id]; const host = p.url.replace('https://', '');
    return `<li class="card" id="p-${p.id}" data-lift style="--tint:${L.tint};--lift-shadow:${L.shadow}">
      <div class="art">
        <img class="plinth" src="${A}products/${p.id}.webp" srcset="${A}products/${p.id}.webp 600w, ${A}products/${p.id}@2x.webp 1200w" sizes="(min-width:1240px) 22vw, (min-width:700px) 45vw, 92vw" alt="Voxel diorama for ${esc(p.name)} with its real logo" width="600" height="573" loading="lazy">
        ${L.sticker ? `<img class="stk" src="${L.sticker}" alt="" width="477" height="150" loading="lazy" data-bob style="--r:5deg;--t:6s">` : ''}
      </div>
      <div class="body">
        <div class="row"><img class="logo${L.pad ? ' pad' : ''}" src="${L.logo}" alt="" width="34" height="34" loading="lazy"><h3>${esc(p.name)}</h3><span class="st ${p.status}">${STATUS[p.status]}</span></div>
        <p class="ln">${esc(p.line)}</p>
        <div class="fig"><b>${esc(p.figure.value)}</b><span>${esc(p.figure.label)}</span></div>
        <ul class="facts">${p.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
        <div class="go"><a class="pill" href="${p.url}" rel="noopener" data-magnetic><span data-magnetic-label>${host} <span aria-hidden="true">↗</span></span></a></div>
      </div>
    </li>`;
  }).join('');
})();

/* retired list, Radix-style accordion with Layer Unstack */
const RETIRED = ['luma', 'polyglot-pilot', 'pinpoint', 'webvakt', 'joke-central', 'tryggere-hyring', 'early-apps'];
(function retired() {
  const ul = $('.ret-grid');
  ul.innerHTML = RETIRED.map((id, i) => { const p = byId[id];
    return `<li style="--i:${i}"><img src="${A}standins/${id}.webp" alt="" width="64" height="72" loading="lazy"><div><span class="yr">${p.since}</span><b>${esc(p.name)}</b><p>${esc(p.line)}</p></div></li>`; }).join('');
  const btn = $('#ret-btn'), panel = $('#ret-panel');
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    btn.dataset.state = open ? 'open' : 'closed';
    if (open) {
      panel.hidden = false;
      panel.style.setProperty('--radix-accordion-content-height', panel.scrollHeight + 'px');
      panel.dataset.state = 'open';
      sound.blip(520);
    } else {
      panel.style.setProperty('--radix-accordion-content-height', panel.scrollHeight + 'px');
      panel.dataset.state = 'closed';
      const done = () => { if (panel.dataset.state === 'closed') panel.hidden = true; };
      reduce ? done() : panel.addEventListener('animationend', done, { once: true });
      sound.blip(400);
    }
  });
})();

/* ---------------- copy the MCP command ---------------- */
$('.copy').addEventListener('click', async e => {
  const b = e.currentTarget, lab = $('[data-magnetic-label]', b);
  try { await navigator.clipboard.writeText(content.mcpCommand); lab.textContent = 'copied'; b.classList.add('ok'); }
  catch { lab.textContent = 'select it'; }
  sound.blip(700);
  setTimeout(() => { lab.textContent = 'copy'; b.classList.remove('ok'); }, 1600);
});

/* ---------------- motion kit: magnetic pull + stack drop ---------------- */
if (M) MX.magnetic(document);

/* Stack Drop for the cards: they only hide at the moment they are about to play, so nothing can get stuck invisible */
(function drop() {
  if (!M || reduce) return;
  const kids = [...document.querySelectorAll('[data-drop] > *')];
  const io = new IntersectionObserver(es => {
    const go = es.filter(e => e.isIntersecting).map(e => e.target);
    if (!go.length) return;
    go.forEach(el => io.unobserve(el));
    M.animate(go, { opacity: [0, 1], y: [-48, 0], scale: [.92, 1] }, { type: 'spring', stiffness: 380, damping: 18, mass: .8, delay: M.stagger(.07) });
    setTimeout(() => sound.blip(500, .025), 120);
  }, { threshold: .15 });
  kids.forEach(k => io.observe(k));
})();

/* ---------------- CSS-3D voxel stages, loaded when near the viewport ---------------- */
const whenNear = (el, fn) => { const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: '200px' }); io.observe(el); };

whenNear($('#shelf'), async () => {
  const { VoxelStage, MODELS } = await import('./assets/3d/voxel-css.js');
  const host = $('#shelf');
  const unit = Math.max(24, Math.min(52, host.clientWidth / 12.5));
  const stage = new VoxelStage(host, { model: MODELS.shelf(P), unit, rest: { x: -20, y: -26 }, motion: M });
  const ids = ['mcp-emails', 'fun-libs', 'toolrails', 'harbor'];
  stage.items.forEach(it => { if (it.v.id !== undefined) { it.el.classList.add('pick'); it.el.dataset.pid = ids[it.v.id]; } });
  if (!reduce) stage.assemble({ height: 5, stagger: .03 });
  let drop = null, hovered = null;
  host.addEventListener('pointerover', e => {
    const vox = e.target.closest('.vx-vox.pick'); if (!vox || vox === hovered) return;
    hovered = vox; drop && drop(); const it = stage.items.find(i => i.el === vox);
    drop = stage.lift(i => i === it, .5); sound.blip(600 + it.v.id * 60, .03);
  });
  host.addEventListener('pointerleave', () => { drop && drop(); drop = null; hovered = null; });
  let down = null;
  host.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, vox: e.target.closest('.vx-vox.pick') }; }, true);
  host.addEventListener('pointerup', e => {
    if (!down || !down.vox || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const card = document.getElementById('p-' + down.vox.dataset.pid); down = null;
    card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
  });
});

whenNear($('#mark'), async () => {
  const { VoxelStage, MODELS } = await import('./assets/3d/voxel-css.js');
  const stage = new VoxelStage($('#mark'), { model: MODELS.mark, unit: 54, motion: M });
  if (!reduce) stage.assemble();
  let busy = false, n = 0;
  const play = async () => { if (busy) return; busy = true; sound.blip(440); await (n++ % 2 ? stage.assemble() : stage.drift()); busy = false; };
  $('.drop-btn').addEventListener('click', play);
  $('#mark').addEventListener('dblclick', play);
});
