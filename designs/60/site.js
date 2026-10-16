// site.js — Pocket Planet (design 60). Progressive: the page is complete without this file.
import { tilt, wormhole, popMark, observeSling } from './assets/motion.js';
import { createFeed } from '../_shared/feed.js';
import { chipHTML } from './pile.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => innerWidth <= 760;
const idle = fn => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));

/* ---------------- sound (opt-in, WebAudio, nothing loads until asked) ---------------- */
let audio = null, soundOn = false;
function blip(freq = 660, dur = 0.08, type = 'triangle', vol = 0.05) {
  if (!soundOn || !audio) return;
  const t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.55, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(audio.destination); o.start(t); o.stop(t + dur + 0.02);
}
let lastTick = 0;
const tick = speed => { const n = performance.now(); if (n - lastTick < 70) return; lastTick = n; blip(220 + Math.min(speed, 14) * 30, 0.05, 'sine', Math.min(0.06, 0.012 * speed)); };
$('#sound').addEventListener('click', e => {
  soundOn = !soundOn; e.currentTarget.setAttribute('aria-pressed', soundOn);
  if (soundOn) { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); blip(880, 0.12); setTimeout(() => blip(1320, 0.1), 90); }
});

/* ---------------- magnetic hovers ---------------- */
if (!reduce && matchMedia('(pointer: fine)').matches) {
  $$('.mag').forEach(el => {
    const pull = el.classList.contains('cmd') ? 0.08 : 0.28;
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.classList.add('near'); el.style.translate = `${((e.clientX - r.left - r.width / 2) * pull).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * pull * 1.2).toFixed(1)}px`; });
    el.addEventListener('pointerleave', () => { el.classList.remove('near'); el.style.translate = '0 0'; });
  });
}

/* ---------------- mark pop ---------------- */
const brand = $('#brand');
brand.addEventListener('pointerenter', () => { popMark(brand); blip(990, 0.07); });

/* ---------------- hero stage: tilt + parallax, then the live planet ---------------- */
const hero = $('.hero'), stage = $('#stage');
tilt(stage, { scope: window, ease: 0.08 });

let planet = null, seed = 7;
async function mountLive(s = seed) {
  const host = $('#live');
  const canvas = document.createElement('canvas');
  const { mountPlanet } = await import('./assets/interactive/planet3d.js');
  host.replaceChildren(canvas);
  const p = await mountPlanet(canvas, { scene: 'hero', interactive: true, shiftX: 0.3, seed: s, pixelRatio: Math.min(devicePixelRatio || 1, innerWidth > 1800 ? 1.25 : 2) });
  planet && planet.dispose(); planet = p;
  requestAnimationFrame(() => requestAnimationFrame(() => host.classList.add('on')));
  if (!fpsChecked) { fpsChecked = true; checkFps(); }
}
// if this device cannot hold the live planet at a decent frame rate, fall back to the graded still
let fpsChecked = false;
function checkFps() {
  let n = 0; const t0 = performance.now();
  const step = now => {
    n++;
    if (now - t0 < 2500) return requestAnimationFrame(step);
    if (n / ((now - t0) / 1000) < 28 && planet) { const host = $('#live'); host.classList.remove('on'); setTimeout(() => { planet && planet.dispose(); planet = null; host.replaceChildren(); }, 1400); }
  };
  setTimeout(() => requestAnimationFrame(step), 600);
}
const canLive = () => !/[?&]still/.test(location.search) && !reduce && !narrow() && !(navigator.connection && navigator.connection.saveData) && !!window.WebGLRenderingContext;
if (canLive()) {
  addEventListener('load', () => idle(() => mountLive().catch(() => {})), { once: true });
}

/* where the planet is, in hero coordinates (used to launch activity off its surface) */
function planetOrigin() {
  const hr = hero.getBoundingClientRect();
  if (narrow()) {
    const c = $('.cutout img').getBoundingClientRect();
    return { x: c.left - hr.left + c.width * 0.3, y: c.top - hr.top + c.height * 0.5 };
  }
  const sr = stage.getBoundingClientRect();
  const s = Math.max(sr.width / 1600, sr.height / 900), iw = 1600 * s, ih = 900 * s;
  const cx = sr.left - hr.left + (sr.width - iw) * 0.75 + iw * 0.655, cy = sr.top - hr.top + (sr.height - ih) / 2 + ih * 0.5;
  const R = ih * 0.29, a = Math.PI * (0.92 + Math.random() * 0.25);
  return { x: cx + Math.cos(a) * R, y: cy - Math.sin(a) * R * 0.6 };
}

/* ---------------- reroll the planet (WORMHOLE view transition) ---------------- */
const stillPic = $('.still picture');
const stills = [stillPic.innerHTML, `<source type="image/avif" srcset="assets/hero/hero-surface-1600.avif 1600w, assets/hero/hero-surface-3200.avif 3200w" sizes="106vw"><img src="assets/hero/hero-surface-1600.webp" srcset="assets/hero/hero-surface-1600.webp 1600w, assets/hero/hero-surface-3200.webp 3200w" sizes="106vw" alt="" width="1600" height="900">`];
let stillIdx = 0;
const hint = $('#hint'), hintText = hint.textContent;
$('#reroll').addEventListener('click', e => {
  blip(160, 0.4, 'sawtooth', 0.03);
  if (planet) {
    seed = 1 + Math.floor(Math.random() * 9999);
    wormhole(e, () => mountLive(seed));
    hint.textContent = `New planet, seed ${seed}. Same products, different terrain.`;
  } else {
    stillIdx = 1 - stillIdx;
    wormhole(e, () => { stillPic.innerHTML = stills[stillIdx]; });
    hint.textContent = stillIdx ? 'Zoomed in to the surface. Every tower is something shipped.' : hintText;
  }
});

/* ---------------- copy the MCP command ---------------- */
const copyBtn = $('#copy');
copyBtn.addEventListener('click', async () => {
  const text = $('#cmd-text').textContent.trim();
  try { await navigator.clipboard.writeText(text); } catch { const r = document.createRange(); r.selectNodeContents($('#cmd-text')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  copyBtn.textContent = 'Copied'; copyBtn.classList.add('ok'); popMark(brand); blip(1240, 0.09); setTimeout(() => blip(1660, 0.12), 80);
  setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('ok'); }, 1800);
});

/* ---------------- peelable sticker ---------------- */
const since = $('#since');
since.addEventListener('pointerdown', e => {
  e.preventDefault(); since.setPointerCapture(e.pointerId); since.classList.add('dragging');
  const sx = e.clientX, sy = e.clientY; const m = (since.style.translate || '0px 0px').split(' ').map(parseFloat); const ox = m[0] || 0, oy = m[1] || 0;
  const mv = ev => { since.style.translate = `${ox + ev.clientX - sx}px ${oy + ev.clientY - sy}px`; since.style.rotate = `${((ev.clientX - sx) * 0.05).toFixed(1)}deg`; };
  const upFn = () => { since.classList.remove('dragging'); since.removeEventListener('pointermove', mv); blip(520, 0.06); };
  since.addEventListener('pointermove', mv); since.addEventListener('pointerup', upFn, { once: true });
});

/* ---------------- live feed: the pile ---------------- */
const feed = createFeed();
const sr = $('#feed-sr');
const srRender = list => { sr.innerHTML = list.slice(0, 6).map(e => `<li>${e.label}: ${e.text}</li>`).join(''); };
let recent = feed.recent(8);
srRender(recent);

let pile = null, paused = false, queue = [];
const pauseBtn = $('#pause');
if (reduce) {
  hint.textContent = 'Latest activity from the products.'; $('#shake').hidden = true;
  // calm static version: the latest events, neatly stacked, updated without motion
  const box = $('#pile-static');
  const draw = () => { box.innerHTML = recent.slice(0, narrow() ? 3 : 6).map(e => `<div class="chip">${chipHTML(e)}</div>`).join(''); };
  draw();
  feed.subscribe(e => { if (paused) return; recent = [e, ...recent].slice(0, 8); srRender(recent); draw(); });
} else {
  idle(async () => {
    const { mountPile } = await import('./pile.js');
    const foot = $('.hero-foot');
    pile = await mountPile({
      hero, layer: $('#pile'), origin: planetOrigin,
      floorInset: () => foot.offsetHeight + 4,
      max: narrow() ? 5 : innerWidth > 1700 ? 18 : 13,
      onLand: tick,
      onStopReturn: () => { const s = $('#stop'); s.classList.remove('gone'); s.classList.add('back'); setTimeout(() => s.classList.remove('back'), 950); blip(700, 0.1); },
    });
    recent.slice(0, narrow() ? 4 : 7).reverse().forEach((e, i) => setTimeout(() => pile.push(e), 500 + i * 420));
    feed.subscribe(e => { recent = [e, ...recent].slice(0, 8); srRender(recent); if (paused) { queue.push(e); return; } pile.push(e); blip(1500, 0.03, 'sine', 0.015); });
  });
}
pauseBtn.addEventListener('click', () => {
  paused = !paused; pauseBtn.setAttribute('aria-pressed', paused);
  if (pile) { paused ? pile.pause() : pile.play(); if (!paused) queue.splice(0).slice(-3).forEach(e => pile.push(e)); }
});
$('#shake').addEventListener('click', () => { if (pile) { pile.play(); pile.shake(); blip(140, 0.3, 'square', 0.02); } });

/* the full stop: knock it loose */
const stop = $('#stop');
stop.addEventListener('click', () => {
  if (!pile || stop.classList.contains('gone')) { popMark(brand); return; }
  pile.play(); pile.adopt(stop); stop.classList.add('gone'); blip(300, 0.2, 'triangle', 0.05);
  hint.textContent = 'You knocked the full stop off. It will find its way back.';
  setTimeout(() => { hint.textContent = hintText; }, 6500);
});

/* ---------------- products: Radix-style tabs + view transition swap ---------------- */
const tablist = $('[role="tablist"]'), tabs = $$('[role="tab"]'), panels = $$('[role="tabpanel"]');
tablist.hidden = false;
panels.forEach((p, i) => { p.hidden = i !== 0; p.tabIndex = 0; });
let current = 0;
function select(i, focus = false) {
  if (i === current) return;
  const run = () => {
    tabs.forEach((t, j) => { const on = j === i; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    panels.forEach((p, j) => { p.hidden = j !== i; });
    current = i;
  };
  if (focus) tabs[i].focus();
  blip(560 + i * 120, 0.07);
  if (document.startViewTransition && !reduce) document.startViewTransition(run); else run();
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => select(i));
  t.addEventListener('keydown', e => {
    const n = tabs.length, k = e.key;
    const to = k === 'ArrowRight' || k === 'ArrowDown' ? (i + 1) % n : k === 'ArrowLeft' || k === 'ArrowUp' ? (i - 1 + n) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
    if (to < 0) return; e.preventDefault(); select(to, true);
  });
});
$$('.plinth').forEach(p => tilt(p, { scope: p }));

/* ---------------- gravity well (lazy) ---------------- */
const wellStage = $('#well-stage');
let orbit = null, frozen = reduce;
const freezeBtn = $('#well-pause');
freezeBtn.setAttribute('aria-pressed', frozen);
const wellIO = new IntersectionObserver(async ([en]) => {
  if (en.isIntersecting && !orbit) {
    orbit = 'loading';
    const { mountOrbit } = await import('./assets/interactive/orbit-physics.js');
    orbit = await mountOrbit($('#well'), { tiltTarget: wellStage, tilt: !reduce, onSpawn: () => blip(900, 0.06) });
    $('#well-poster').remove();
    if (frozen) orbit.pause();
  } else if (orbit && orbit !== 'loading') {
    en.isIntersecting && !frozen ? orbit.play() : orbit.pause();
  }
}, { rootMargin: '200px' });
wellIO.observe(wellStage);
$('#well-shake').addEventListener('click', () => { if (orbit && orbit.shake) { if (frozen) { frozen = false; freezeBtn.setAttribute('aria-pressed', 'false'); orbit.play(); } orbit.shake(); blip(180, 0.25, 'triangle', 0.04); } });
freezeBtn.addEventListener('click', () => { frozen = !frozen; freezeBtn.setAttribute('aria-pressed', frozen); if (orbit && orbit.pause) frozen ? orbit.pause() : orbit.play(); });

/* ---------------- slingshot entrances below the fold ---------------- */
$$('.well-copy > *, .retired-head > *').forEach((el, i) => { el.classList.add('pp-sling'); el.style.setProperty('--i', i % 5); });
observeSling();
