// The Vivarium · Albretsen AS · design 54
import { content } from '../../_shared/content.js';
import { createFeed } from '../../_shared/feed.js';
import { germinate, growOnView, bellJar } from '../assets/motion.js';
import { createDiorama } from '../assets/live/diorama.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const P = '../_shared/products/';

/* ---------- the catalogue: facts from content.js, Latin names from the kit ---------- */
const SPECIES = {
  'mcp-emails': { no: '001', latin: 'Noctua epistolaris', common: 'letter moth', creature: 'moth', logo: P + 'mcp-emails/icon.png', diorama: 'MCP Emails' },
  'fun-libs': { no: '002', latin: 'Cerambyx lusor', common: 'two-bar beetle', creature: 'beetle', logo: P + 'fun-libs/icon.png', diorama: 'Fun Libs' },
  'toolrails': { no: '003', latin: 'Lucanus instrumentarius', common: 'rail ant', creature: 'ant', logo: P + 'toolrails/icon.svg', diorama: 'Toolrails' },
  'harbor': { no: '004', latin: 'Scarabaeus custos', common: 'sleeping snail', creature: 'snail', logo: P + 'harbor/harbor-mark.svg', diorama: 'Harbor' },
  'albretsen.no': { latin: 'Campana vitrea', common: 'the glass itself' },
};
const STATUS = { live: 'Live', building: 'Growing', paused: 'Asleep', retired: 'Pressed' };
const products = content.products;
const live = products.filter(p => SPECIES[p.id] && p.status !== 'retired');
const retired = products.filter(p => p.status === 'retired');
const host = u => u.replace(/^https?:\/\//, '').replace(/\/$/, '');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- sound: off until asked; a glass tink and a paper rustle ---------- */
let audio = null;
const soundBtn = $('[data-sound]');
soundBtn.addEventListener('click', () => {
  const on = soundBtn.getAttribute('aria-pressed') !== 'true';
  soundBtn.setAttribute('aria-pressed', String(on));
  $('[data-sound-label]').textContent = on ? 'Sound on' : 'Sound off';
  if (on) { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); tink(); }
});
const soundOn = () => audio && soundBtn.getAttribute('aria-pressed') === 'true';
function tink(pitch = 1) {
  if (!soundOn()) return;
  const t = audio.currentTime;
  [[2637, .09], [3951, .05], [5274, .025]].forEach(([f, g]) => {
    const o = audio.createOscillator(), v = audio.createGain();
    o.type = 'sine'; o.frequency.value = f * pitch;
    v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g, t + 0.004); v.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    o.connect(v).connect(audio.destination); o.start(t); o.stop(t + 1.2);
  });
}
function rustle() {
  if (!soundOn()) return;
  const len = audio.sampleRate * 0.35, buf = audio.createBuffer(1, len, audio.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2) * (0.6 + 0.4 * Math.sin(i / 90));
  const s = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain();
  s.buffer = buf; f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 0.7; g.gain.value = 0.16;
  s.connect(f).connect(g).connect(audio.destination); s.start();
}

/* ---------- specimen cards ---------- */
$('[data-cards]').innerHTML = live.map((p, i) => {
  const s = SPECIES[p.id];
  return `<li class="card belljar germinate" style="--i:${i}" id="spec-${p.id}">
    <div class="belljar__body">
      <a class="card__plate" href="${p.url}" target="_blank" rel="noopener" aria-label="${esc(p.name)}, ${host(p.url)} (opens in a new tab)">
        <picture>
          <img src="assets/products/${p.id}@1x.webp" srcset="assets/products/${p.id}@1x.webp 800w, assets/products/${p.id}@2x.webp 1600w" sizes="(min-width: 1100px) 24vw, (min-width: 640px) 46vw, 92vw"
            alt="Specimen No. ${s.no}, ${s.latin}: an old museum drawing pinned to a sheet, with the ${esc(p.name)} logo on its tag." width="800" height="1000" loading="lazy" decoding="async">
        </picture>
        <span class="belljar__glint" aria-hidden="true"></span>
      </a>
      <img class="card__creature" src="assets/hero/creatures/${s.creature}.webp" alt="" aria-hidden="true" loading="lazy">
      <div class="card__meta">
        <p class="card__num mono"><span>No. ${s.no} · since ${p.since}</span><span class="status status--${p.status}">${STATUS[p.status]}</span></p>
        <h3 class="card__name"><img class="card__logo" src="${s.logo}" alt="" width="26" height="26" loading="lazy">${esc(p.name)}</h3>
        <p class="card__latin">${s.latin}</p>
        <p class="card__line">${esc(p.line)}</p>
        ${p.figure ? `<p class="card__fig"><strong>${esc(p.figure.value)}</strong><span class="mono">${esc(p.figure.label)}</span></p>` : ''}
        ${p.facts ? `<ul class="card__facts">${p.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
        <a class="card__link" href="${p.url}" target="_blank" rel="noopener">${host(p.url)}</a>
      </div>
    </div>
  </li>`;
}).join('');

/* ---------- herbarium sheets: turn to read the label ---------- */
$('[data-sheets]').innerHTML = retired.map((p, i) => `<li class="sheet germinate" style="--i:${i}">
  <button class="sheet__btn" type="button" aria-pressed="false" aria-label="${esc(p.name)}, retired. Turn the sheet">
    <span class="sheet__inner">
      <span class="sheet__face"><img src="assets/products/herbarium/${p.id}.svg" alt="" loading="lazy" width="480" height="640"></span>
      <span class="sheet__face sheet__back">
        <span class="mono">Pressed · ${p.since}</span>
        <span class="sheet__name">${esc(p.name)}</span>
        <span class="sheet__line">${esc(p.line)}</span>
        ${p.figure ? `<span class="sheet__fig">${esc(p.figure.value)} ${esc(p.figure.label)}</span>` : ''}
      </span>
    </span>
  </button>
  <span class="sheet__cap">${p.id === 'early-apps' ? 'Early apps' : esc(p.name)} · ${p.since}</span>
</li>`).join('');
$$('.sheet__btn').forEach(b => b.addEventListener('click', () => {
  b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); rustle();
}));

/* ---------- the Wardian case: drag to turn, tap a creature ---------- */
const caseEl = $('#case'), stage = $('[data-stage]');
const dio = createDiorama(caseEl, { base: 'assets/', interactive: false });
const view = { ry: -24, rx: -10, hx: 0, hy: 0 };
const apply = () => dio.set(view.ry + view.hx, view.rx + view.hy);
const LIMIT = { ry: [-78, 38], rx: [-34, 6] };
const clamp = (v, [a, b]) => Math.max(a, Math.min(b, v));

// make each creature a real, focusable control
const creatures = {};
$$('.dio__layer[title]', caseEl).forEach(layer => {
  const name = layer.title; layer.removeAttribute('title');
  const p = live.find(x => SPECIES[x.id].diorama === name); if (!p) return;
  creatures[p.id] = layer;
  layer.dataset.creature = p.id; layer.tabIndex = 0; layer.setAttribute('role', 'button');
  layer.setAttribute('aria-label', `${p.name}, ${SPECIES[p.id].latin}. Read its label`);
  layer.setAttribute('aria-haspopup', 'dialog');
});

let drag = null, moved = false, inertia = 0;
stage.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  cancelAnimationFrame(inertia);
  drag = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, vx: 0, vy: 0, t: performance.now(), id: e.pointerId };
  moved = false;
});
addEventListener('pointermove', e => {
  if (drag && e.pointerId === drag.id) {
    const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly;
    if (!moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) {
      moved = true; stage.setPointerCapture?.(e.pointerId); stage.classList.add('is-dragging'); caseEl.classList.add('is-dragging');
      $('.stage__hint').classList.add('is-gone'); view.hx = view.hy = 0;
    }
    if (moved) {
      const now = performance.now(), dt = Math.max(8, now - drag.t);
      view.ry = clamp(view.ry + dx * 0.32, LIMIT.ry); view.rx = clamp(view.rx - dy * 0.14, LIMIT.rx);
      drag.vx = dx * 0.32 / dt * 16; drag.vy = -dy * 0.14 / dt * 16; drag.t = now; apply();
    }
    drag.lx = e.clientX; drag.ly = e.clientY;
  } else if (!drag && finePointer && !reduced && stage.matches(':hover')) {
    const r = stage.getBoundingClientRect();
    view.hx = ((e.clientX - r.left) / r.width - 0.5) * 12; view.hy = -((e.clientY - r.top) / r.height - 0.5) * 5; apply();
  }
});
const endDrag = () => {
  if (!drag) return;
  const { vx, vy } = drag; drag = null;
  stage.classList.remove('is-dragging');
  if (!moved) return;
  let ivx = vx, ivy = vy;
  const step = () => {
    ivx *= 0.92; ivy *= 0.88;
    view.ry = clamp(view.ry + ivx, LIMIT.ry); view.rx = clamp(view.rx + ivy, LIMIT.rx); apply();
    if (Math.abs(ivx) + Math.abs(ivy) > 0.02 && !reduced) inertia = requestAnimationFrame(step);
    else caseEl.classList.remove('is-dragging');
  };
  step();
};
addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);
stage.addEventListener('pointerleave', () => { if (!drag) { view.hx = view.hy = 0; apply(); } });
stage.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
stage.addEventListener('keydown', e => {
  if (e.target !== stage) return;
  const k = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, 4], ArrowDown: [0, -4] }[e.key];
  if (!k) return; e.preventDefault();
  view.ry = clamp(view.ry + k[0], LIMIT.ry); view.rx = clamp(view.rx + k[1], LIMIT.rx); apply();
});

/* ---------- creature label: a Radix-style popover, side- and origin-aware ---------- */
const pop = $('[data-pop]');
let popFor = null;
function openPop(id, anchor) {
  const p = products.find(x => x.id === id), s = SPECIES[id];
  $('[data-pop-num]', pop).textContent = `Specimen No. ${s.no} · ${STATUS[p.status]}`;
  $('[data-pop-latin]', pop).textContent = s.latin;
  $('[data-pop-title]', pop).textContent = p.name;
  $('[data-pop-logo]', pop).src = s.logo;
  $('[data-pop-line]', pop).textContent = p.line;
  $('[data-pop-fig]', pop).textContent = p.figure?.value || '';
  $('[data-pop-figl]', pop).textContent = p.figure?.label || '';
  $('[data-pop-link]', pop).href = `#spec-${id}`;
  pop.hidden = false;
  const a = (anchor.querySelector('img') || anchor).getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  const cx = a.left + a.width / 2;
  const side = a.top - h - 18 > 8 ? 'top' : 'bottom';
  const left = Math.max(12, Math.min(innerWidth - w - 12, cx - w / 2));
  const top = side === 'top' ? a.top - h - 14 : a.bottom + 14;
  Object.assign(pop.style, { left: left + 'px', top: Math.max(8, top) + 'px' });
  pop.style.setProperty('--ax', (cx - left) + 'px');
  pop.style.setProperty('--origin', `${cx - left}px ${side === 'top' ? '100%' : '0'}`);
  pop.dataset.side = side; pop.dataset.state = 'closed'; void pop.offsetWidth; pop.dataset.state = 'open';
  popFor = anchor;
  anchor.classList.remove('is-picked'); void anchor.offsetWidth; anchor.classList.add('is-picked');
  tink(1 + live.findIndex(x => x.id === id) * 0.06);
  pop.focus({ preventScroll: true });
}
function closePop(returnFocus = true) {
  if (pop.hidden || pop.dataset.state === 'closed') return;
  pop.dataset.state = 'closed';
  setTimeout(() => { if (pop.dataset.state === 'closed') pop.hidden = true; }, reduced ? 0 : 190);
  if (returnFocus && popFor) popFor.focus({ preventScroll: true });
  popFor = null;
}
Object.entries(creatures).forEach(([id, layer]) => {
  layer.addEventListener('click', e => { e.stopPropagation(); popFor === layer ? closePop() : openPop(id, layer); });
  layer.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPop(id, layer); } });
});
$('[data-pop-close]').addEventListener('click', () => closePop());
$('[data-pop-link]').addEventListener('click', () => closePop(false));
addEventListener('keydown', e => { if (e.key === 'Escape') closePop(); });
addEventListener('pointerdown', e => { if (!pop.hidden && !pop.contains(e.target) && !e.target.closest('[data-creature]')) closePop(false); });
addEventListener('scroll', () => closePop(false), { passive: true });

/* ---------- copy the feeding instructions ---------- */
const tip = $('#copy-tip');
$('[data-copy]').addEventListener('click', async () => {
  let ok = true;
  try { await navigator.clipboard.writeText(content.mcpCommand); } catch { ok = false; const r = document.createRange(); r.selectNodeContents($('[data-cmd]')); getSelection().removeAllRanges(); getSelection().addRange(r); }
  tip.textContent = ok ? 'Copied. Feed it to your agent' : 'Selected. Press Cmd C';
  tip.dataset.state = 'closed'; void tip.offsetWidth; tip.dataset.state = 'open'; tink(1.5);
  clearTimeout(tip._t); tip._t = setTimeout(() => { tip.dataset.state = 'closing'; }, 1800);
});

/* ---------- magnetic hovers ---------- */
if (finePointer && !reduced) $$('.magnetic').forEach(el => {
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.32}px)`;
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
});

/* ---------- loupe over Plate I ---------- */
const frame = $('.plate__frame'), loupe = $('.loupe'), plateImg = $('.plate__img'), ZOOM = 2.5;
if (finePointer) {
  frame.addEventListener('pointerenter', () => { loupe.style.backgroundImage = `url("${plateImg.currentSrc || plateImg.src}")`; loupe.classList.add('is-on'); });
  frame.addEventListener('pointerleave', () => loupe.classList.remove('is-on'));
  frame.addEventListener('pointermove', e => {
    const r = frame.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, R = loupe.offsetWidth / 2;
    loupe.style.left = x + 'px'; loupe.style.top = y + 'px';
    loupe.style.backgroundSize = `${r.width * ZOOM}px ${r.height * ZOOM}px`;
    loupe.style.backgroundPosition = `${R - x * ZOOM}px ${R - y * ZOOM}px`;
  });
}

/* ---------- live feed: the observation tag and the field log ---------- */
const feed = createFeed();
const latinOf = e => SPECIES[e.product]?.latin || e.label;
const tail = e => e.ms ? `${e.ms} ms` : e.country ? e.country : e.sha ? `deploy ${e.sha} · ${e.kb} KB` : e.city ? `${e.city} · ${e.kb} KB` : '';
const hhmm = d => d.toTimeString().slice(0, 5);
const ago = d => { const s = Math.max(0, Math.round((Date.now() - d) / 1000)); return s < 5 ? 'just now' : s < 60 ? `${s} s ago` : s < 3600 ? `${Math.floor(s / 60)} min ago` : hhmm(d); };
const logEl = $('[data-log]');
const logItem = (e, fresh) => `<li class="log__item${fresh ? ' is-in' : ''}"><time datetime="${e.time.toISOString()}">${hhmm(e.time)} · ${esc(e.label)}</time><span class="log__latin">${esc(latinOf(e))}</span><span class="log__what">${esc(e.text)}</span><span class="log__meta">${esc(tail(e))}</span></li>`;
logEl.innerHTML = feed.recent(4).map(e => logItem(e)).join('');
let latest = feed.recent(1)[0];
const obsTag = $('[data-obs]');
function showObs(e, animate) {
  latest = e;
  const set = () => { $('[data-obs-latin]').textContent = latinOf(e); $('[data-obs-text]').textContent = `${e.text}${tail(e) ? ' · ' + tail(e) : ''}`; $('[data-obs-time]').textContent = ago(e.time); };
  if (animate && !reduced) { obsTag.classList.remove('is-new'); void obsTag.offsetWidth; obsTag.classList.add('is-new'); setTimeout(set, 400); } else set();
}
showObs(latest, false);
setInterval(() => { $('[data-obs-time]').textContent = ago(latest.time); }, 1000);
feed.subscribe(e => {
  showObs(e, true);
  logEl.insertAdjacentHTML('afterbegin', logItem(e, !reduced));
  while (logEl.children.length > 4) logEl.lastElementChild.remove();
  const layer = creatures[e.product];
  if (layer && !reduced) { layer.classList.remove('is-picked'); void layer.offsetWidth; layer.classList.add('is-picked'); }
});

/* ---------- the night jar: live three.js, only when near and only if motion is welcome ---------- */
const jar = $('[data-jar]');
if (!reduced && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(async ([en]) => {
    if (!en.isIntersecting) return; io.disconnect();
    try {
      const { createTerrarium } = await import('../assets/live/terrarium.js');
      await createTerrarium($('canvas', jar), { view: 'portrait' });
      requestAnimationFrame(() => jar.classList.add('is-live'));
    } catch (err) { /* the baked still stays */ }
  }, { rootMargin: '300px' });
  io.observe(jar);
}

/* ---------- loading: the germination loader, then the case lands ---------- */
const loader = $('[data-loader]');
function land() {
  if (reduced) { apply(); return; }
  caseEl.classList.add('is-dragging'); dio.set(-62, -20);
  void caseEl.offsetWidth;
  setTimeout(() => {
    caseEl.classList.remove('is-dragging'); caseEl.classList.add('is-landing'); apply();
    setTimeout(() => caseEl.classList.remove('is-landing'), 2300);
  }, 40);
}
async function boot() {
  const decode = $$('img', caseEl).map(i => i.decode?.().catch(() => {}));
  const ready = Promise.race([Promise.all([document.fonts.ready, ...decode]), new Promise(r => setTimeout(r, 4000))]);
  if (window.lottie && loader) {
    document.documentElement.classList.add('is-loading');
    caseEl.classList.add('is-dragging'); dio.set(-62, -20);
    try { await germinate(loader, { src: 'assets/motion/sprout-loader.json', ready, minDuration: reduced ? 500 : 2400 }); } catch { loader.classList.add('is-done'); }
    document.documentElement.classList.remove('is-loading');
  } else {
    await ready; loader?.classList.add('is-done');
  }
  setTimeout(() => loader?.remove(), 1500);
  land();
  growOnView();
  bellJar(document, { max: 6 });
}
boot();
