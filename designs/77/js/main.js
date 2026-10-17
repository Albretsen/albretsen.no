// Albretsen AS · design 77 "Shutterlight"
// The hero is one long camera move: scroll is the clock (dawn → golden hour) and
// the camera dollies through the window. Everything heavy loads after first paint.
import { createFeed } from '../../_shared/feed.js';
import { mountDaylight } from './daylight.js';

const $ = s => document.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const scrub = document.documentElement.classList.contains('scrub');
const idle = fn => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 300));

/* ---------------------------------------------------------------- feed */
(function feed(){
  const el = $('#feed .feed__text'); if (!el) return;
  const f = createFeed();
  const ago = d => { const s = Math.max(1, Math.round((Date.now() - d) / 1000));
    return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} h ago`; };
  let current = f.recent(1)[0];
  const text = e => `${e.label}: ${e.text}${e.country ? `, ${e.country}` : ''} · ${ago(e.time)}`;
  const show = e => { current = e; el.textContent = text(e); };
  if (current) show(current);
  f.subscribe(e => {
    if (reduce) return show(e);
    el.classList.add('is-out');
    setTimeout(() => { show(e); el.classList.remove('is-out'); }, 500);
  });
  setInterval(() => current && (el.textContent = text(current)), 15000);
})();

/* ---------------------------------------------------------------- hero */
const VIEWS = ['dawn', 'fjord', 'noon', 'gold'];
const CREDITS = ['View after J. C. Dahl, 1844', 'View after Thomas Fearnley, 1839', 'View after Paul Cézanne, c. 1885', 'View after Claude Lorrain, 1646–47'];
const hero = $('.hero'), stage = $('#stage'), set = $('#set'), geo = $('#geo'), far = $('#far');
const wall = $('#wall'), front = $('#front'), tintWall = $('#tintWall'), tintFront = $('#tintFront'), spill = $('#spill');
const title = $('#titlecard'), credit = $('#credit');
const buttons = [...document.querySelectorAll('.plaque__times button')];

let day = 0, shownIdx = -1, daylight = null, farImgs = [], layersReady = false;

function setHour(t){
  day = t;
  const idx = Math.round(t * 3);
  if (idx !== shownIdx){
    shownIdx = idx;
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === idx)));
    credit.textContent = CREDITS[idx];
  }
  if (!layersReady) return;
  // the room's light: cold blue multiply at dawn, none at noon, amber at the end
  const cold = clamp((1 - t * 2.4) * .42, 0, .42), warm = clamp((t - .66) * 1.5, 0, .42);
  const col = cold >= warm ? '#8a9be0' : '#eaa56c', op = Math.max(cold, warm);
  tintWall.style.background = tintFront.style.background = col;
  tintWall.style.opacity = op.toFixed(3); tintFront.style.opacity = (op * .9).toFixed(3);
  spill.style.opacity = clamp(cold * 1.2 + warm * 1.1).toFixed(3);
  if (daylight) daylight.set(t);
  else farImgs.forEach((im, i) => { im.style.opacity = i === 0 ? 1 : clamp(t * 3 - (i - 1)).toFixed(3); });
}

/* Scroll-scrubbed camera (motion allowed) */
let geom = null;
const forcedP = /[?&]p=/.test(location.search) ? +new URLSearchParams(location.search).get('p') : null; // review helper
function measure(){
  const vw = innerWidth, vh = innerHeight;
  const w = set.offsetWidth, h = set.offsetHeight;
  const cx = set.offsetLeft + w / 2, cy = set.offsetTop + h * .498;
  const apH = .724 * h;
  const end = Math.max(vh * 1.08 / apH, vw * 1.02 / w);
  const cover = Math.min(end, Math.max(vw / w, vh / h) * 1.04);   // the frame fills the screen
  geom = { vw, vh, w, h, cx, cy, end, cover, track: hero.offsetHeight - vh };
}
const pForIdx = i => .06 + (i / 3) * .86;
let raf = 0;
function frame(){
  raf = 0; if (!geom) measure();
  const { vw, vh, cx, cy, end, cover, track } = geom;
  const p = forcedP ?? clamp(-hero.getBoundingClientRect().top / Math.max(1, track));
  // two camera moves: a crane up into the frame until it fills the screen, then a slow dolly to the glass
  const a = smooth(.02, .3, p), b = smooth(.3, .9, p);
  const S = (1 + (cover - 1) * a) * (1 + (end / cover - 1) * b);
  const e = a * .6 + b * .4;
  set.style.transform = `translate3d(${((vw / 2 - cx) * a).toFixed(1)}px, ${((vh / 2 - cy) * a).toFixed(1)}px, 0) scale(${S.toFixed(4)})`;
  far.style.transform = `scale(${(1 - .07 * e).toFixed(4)}) translateY(${(e * 1.5).toFixed(2)}%)`;
  front.style.transform = tintFront.style.transform = `translateY(${(e * 6).toFixed(2)}%) scale(${(1 + .14 * e).toFixed(4)})`;
  const o = 1 - smooth(0, .16, p);
  title.style.opacity = o.toFixed(3);
  title.style.transform = `translateY(${(-p * 140).toFixed(1)}px)`;
  title.style.visibility = o < .01 ? 'hidden' : '';
  setHour(clamp((p - .06) / .86));
}
if (scrub){
  addEventListener('scroll', () => { raf ||= requestAnimationFrame(frame); }, { passive: true });
  addEventListener('resize', () => { geom = null; raf ||= requestAnimationFrame(frame); });
  frame();
}

/* Plaque buttons: in scrub mode they move the camera to that hour; otherwise they swap stills */
const stillsBox = $('#stills');
const stillImgs = [];
function showStill(i){
  if (i > 0 && !stillImgs[i]){
    const im = new Image(); im.alt = ''; im.decoding = 'async';
    im.sizes = getComputedStyle(set).width; im.srcset = `assets/hero/window-${VIEWS[i]}-960.webp 960w, assets/hero/window-${VIEWS[i]}-1600.webp 1600w`;
    stillImgs[i] = im; stillsBox.append(im);
    im.decode().catch(() => {}).then(() => requestAnimationFrame(() => im.classList.add('is-on')));
  }
  stillImgs.forEach((im, k) => im && k !== i && im.classList.remove('is-on'));
  if (stillImgs[i] && stillImgs[i].complete) stillImgs[i].classList.add('is-on');
  setHour(i / 3);
}
buttons.forEach((b, i) => b.addEventListener('click', () => {
  if (scrub){
    if (!geom) measure();
    const top = hero.offsetTop + geom.track * pForIdx(i);
    scrollTo({ top, behavior: 'smooth' });
  } else showStill(i);
}));

/* Upgrade after first paint: the layered set, then the WebGL daylight */
function hasWebGL(){ try { const c = document.createElement('canvas'); return !!(c.getContext('webgl')); } catch { return false; } }
const load = (img, srcset, sizes) => new Promise(r => { img.onload = img.onerror = () => r(); img.decoding = 'async'; img.sizes = sizes; img.srcset = srcset; if (img.complete && img.naturalWidth) r(); });

async function upgrade(){
  if (!scrub) return;                        // reduced motion keeps the still frames
  if (!geom) measure();
  const geoW = geo.offsetWidth * (geom.end > 1.8 ? 1.6 : 1.2);
  const sizes = `${Math.round(geoW)}px`;
  const farWide = geo.offsetWidth * .4 * geom.end * Math.min(2, devicePixelRatio || 1);
  const res = farWide > 1000 ? 1600 : 800;
  const dawn = new Image(); dawn.alt = ''; farImgs.push(dawn); dawn.classList.add('is-on'); far.append(dawn);
  await Promise.all([
    load(wall, 'assets/layers/wall-1200.webp 1200w, assets/layers/wall-2400.webp 2400w', sizes),
    load(front, 'assets/layers/front-1200.webp 1200w, assets/layers/front-2400.webp 2400w', sizes),
    load(dawn, `assets/views/view-dawn-${res}.webp ${res}w`, '40vw'),
  ]);
  const mask = (el, img) => { const u = `url("${img.currentSrc || img.src}")`; el.style.webkitMaskImage = u; el.style.maskImage = u; };
  mask(tintWall, wall); mask(tintFront, front);
  layersReady = true; setHour(day);
  geo.classList.add('is-ready');

  if (hasWebGL()){
    const canvas = document.createElement('canvas'); far.append(canvas);
    try {
      daylight = await mountDaylight(canvas, {
        views: VIEWS.map(v => `assets/views/view-${v}-${res}.webp`),
        dpr: Math.min(3, (devicePixelRatio || 1) * geom.end * .85),
        pointerTarget: stage,
      });
    } catch (err) { daylight = null; }
    if (daylight){
      daylight.set(day, true); canvas.classList.add('is-on');
      new IntersectionObserver(([en]) => daylight.pause(!en.isIntersecting)).observe(hero);
      return;
    }
    canvas.remove();
  }
  // no WebGL: crossfade the four plates
  for (const v of VIEWS.slice(1)){ const im = new Image(); im.alt = ''; im.loading = 'lazy'; im.src = `assets/views/view-${v}-${res}.webp`; im.classList.add('is-on'); im.style.opacity = 0; far.append(im); farImgs.push(im); }
  setHour(day);
}
if (document.readyState === 'complete') idle(upgrade); else addEventListener('load', () => idle(upgrade), { once: true });

/* ---------------------------------------------------------------- postcard */
(function postcard(){
  const card = $('#postcard'), hint = $('#hintText'); if (!card) return;
  card.addEventListener('click', () => {
    card.classList.remove('is-tilting');
    card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
    const flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(flipped));
    card.setAttribute('aria-label', flipped ? 'MCP Emails postcard, back. Turn it back.' : 'MCP Emails postcard. Turn it over.');
    hint.textContent = flipped ? 'Turn it back' : 'Turn the card over';
    if (!reduce){ card.classList.remove('is-flipping'); void card.offsetWidth; card.classList.add('is-flipping');
      setTimeout(() => card.classList.remove('is-flipping'), 950); }
  });
  if (reduce || !matchMedia('(pointer: fine)').matches) return;
  // a light tilt toward the pointer, as if the card were held
  card.addEventListener('pointermove', e => {
    if (card.classList.contains('is-flipping')) return;
    const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    card.classList.add('is-tilting');
    card.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`); card.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
  });
  card.addEventListener('pointerleave', () => {
    card.classList.remove('is-tilting');
    card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
  });
})();

/* ---------------------------------------------------------------- sign sway (tap / keyboard) */
(function sway(){
  const sign = $('#sign'), art = $('.obj--sign'); if (!sign || reduce) return;
  const go = () => { sign.classList.remove('is-swaying'); void sign.offsetWidth; sign.classList.add('is-swaying'); };
  art.addEventListener('pointerdown', go); art.querySelector('a').addEventListener('focus', go);
  sign.addEventListener('animationend', () => sign.classList.remove('is-swaying'));
})();

/* ---------------------------------------------------------------- retired tiles */
(function tiles(){
  const row = $('#tilerow'), line = $('#retiredLine'); if (!row) return;
  const items = [...row.children], mid = (items.length - 1) / 2;
  items.forEach((t, i) => t.style.setProperty('--i', Math.abs(i - mid).toFixed(1)));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ row.classList.add('is-in'); io.disconnect(); } }), { threshold: .3 });
  io.observe(row);
  const btns = [...row.querySelectorAll('button')];
  const pick = b => { btns.forEach(x => x.removeAttribute('aria-current')); b.setAttribute('aria-current', 'true'); line.textContent = b.dataset.line; };
  btns.forEach(b => { b.addEventListener('click', () => pick(b)); b.addEventListener('focus', () => pick(b)); b.addEventListener('pointerenter', () => pick(b)); });
})();

/* ---------------------------------------------------------------- copy command */
(function copy(){
  const btn = $('#copy'), code = $('#cmd'), live = $('#copied'); if (!btn) return;
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(code.textContent.trim()); }
    catch { const r = document.createRange(); r.selectNodeContents(code); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    btn.textContent = 'Copied'; btn.classList.add('is-done'); live.textContent = 'Command copied to the clipboard.';
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('is-done'); live.textContent = ''; }, 1800);
  });
})();

