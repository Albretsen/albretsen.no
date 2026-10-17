// Long Light: the homepage. One photograph, one day, one moon that turns the lights on.
import { content } from '../../_shared/content.js';
import { createFeed } from '../../_shared/feed.js';
import { daylong, horizonRise, SWITCH_SVG } from '../assets/motion.js';

const root = document.documentElement;
const $ = s => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const portraitMQ = matchMedia('(max-aspect-ratio: 1/1)');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const hero = $('.hero'), stage = $('#stage');
let canvas = $('#sunline');
const moonBtn = $('#moon'), sunBtn = $('#sunspot'), switchBtn = $('#switch');
const bar = $('#bar');

/* ---------------------------------------------------------------- facts from content.js */
for (const li of document.querySelectorAll('.wall')) {
  const p = content.products.find(x => x.id === li.dataset.id);
  if (!p) continue;
  li.querySelector('[data-k="line"]').textContent = p.line;
  if (p.figure) { li.querySelector('[data-k="value"]').textContent = p.figure.value; li.querySelector('[data-k="label"]').textContent = p.figure.label; }
}
const mail = $('#mail'); mail.href = 'mailto:' + content.email; mail.textContent = content.email;
$('#cmd').textContent = content.mcpCommand;
document.querySelectorAll('.copy')[0].dataset.copy = content.email;
document.querySelectorAll('.copy')[1].dataset.copy = content.mcpCommand;

/* ---------------------------------------------------------------- the sky clock in the header */
const HOURS = [
  [370, '0610', 'First light'], [420, '0700', 'Sunrise'], [570, '0930', 'Morning'], [720, '1200', 'Noon'],
  [930, '1530', 'Afternoon'], [1100, '1820', 'Long light'], [1180, '1940', 'Dusk'], [1260, '2100', 'Blue hour'],
];
const clockT = $('#clock-time'), clockN = $('#clock-name'), clockArc = $('#clock-arc');
const ARC = id => `assets/extras/sun-arcs.svg#arc-${id}`;
let lastClock = '';
function clock(p) {
  let t, id, name;
  if (root.dataset.theme === 'night') { t = '23:30'; id = '2330'; name = 'Lamps on'; }
  else {
    const m = Math.round(370 + p * (1260 - 370));
    const h = HOURS.filter(x => x[0] <= m).pop();
    t = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; id = h[1]; name = h[2];
  }
  if (t + name === lastClock) return; lastClock = t + name;
  clockT.textContent = t; clockN.textContent = name; clockArc.setAttribute('href', ARC(id));
}

/* ---------------------------------------------------------------- Sunline: the photograph, relit */
let sl = null, busy = false, scrollSun = 0.12, sunX = 0.66, sunXTarget = 0.66;
const portrait = () => portraitMQ.matches;
const restX = () => (portrait() ? 0.3 : 0.66);
function sunForScroll() {
  const h = hero.offsetHeight - innerHeight;
  const p = h > 0 ? clamp(scrollY / h) : 0;
  return reduced ? 0.3 : 0.17 + p * (portrait() ? 0.45 : 0.48);
}
function placeSunspot() {
  if (!sl) return;
  const pt = sl.project(sunX, 0.686 - 0.012);
  sunBtn.style.setProperty('--sx', pt.x + 'px'); sunBtn.style.setProperty('--sy', pt.y + 'px');
}

async function mountGL(again = false) {
  try {
    const { mountSunline } = await import('../assets/interactive/sunline.js');
    const webp = await new Promise(r => { const i = new Image(); i.onload = () => r(true); i.onerror = () => r(false); i.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='; });
    const night = root.dataset.theme === 'night';
    sunX = sunXTarget = restX();
    sl = await mountSunline(canvas, {
      src: webp ? 'assets/interactive/first-light-tex.webp' : 'assets/interactive/first-light-tex.jpg',
      mask: 'assets/interactive/first-light-mask.png',
      focus: portrait() ? [0.12, 0.38] : [0.5, 0.7],   // GL's y runs up: 1 - the CSS object-position y
      sun: 0, sunX, night: night ? 1 : 0,
    });
    canvas.classList.add('ready');
    placeSunspot();
    // first light: the sun comes up to meet the visitor
    if (!night) {
      scrollSun = sunForScroll();
      if (reduced || again) sl.set({ sun: scrollSun });
      else { busy = true; await new Promise(r => setTimeout(r, 500)); await sl.tween({ sun: scrollSun }, 2600); busy = false; sl.set({ sun: sunForScroll() }); }
    }
  } catch (err) {
    hero.classList.add('no-gl');
    if (root.dataset.theme === 'night') nightStill(true);
  }
}
function nightStill(on) {
  const img = $('#nightstill');
  if (on && !img.getAttribute('src')) {
    img.srcset = 'assets/hero/first-light-night-640.webp 640w, assets/hero/first-light-night-1280.webp 1280w, assets/hero/first-light-night-1920.webp 1920w';
    img.sizes = 'max(100vw, 150svh)';
    img.src = 'assets/hero/first-light-night-1280.jpg';
  }
  img.classList.toggle('on', on);
}
portraitMQ.addEventListener('change', () => {
  if (!sl) return;
  sl.destroy(); sl = null;
  const fresh = canvas.cloneNode(); fresh.classList.remove('ready'); canvas.replaceWith(fresh); canvas = fresh;
  mountGL(true);
});

// glitter follows the pointer, eased; only while there is somewhere to go
let follow = 0;
function chase() {
  follow = 0;
  if (!sl) return;
  sunX += (sunXTarget - sunX) * 0.06;
  sl.set({ sunX });
  placeSunspot();
  if (Math.abs(sunXTarget - sunX) > 0.0008) follow = requestAnimationFrame(chase);
}
if (!reduced && matchMedia('(pointer: fine)').matches) {
  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect(), k = (e.clientX - r.left) / r.width;
    sunXTarget = portrait() ? 0.2 + 0.18 * k : 0.5 + 0.32 * k;
    if (!follow) follow = requestAnimationFrame(chase);
  });
  stage.addEventListener('pointerleave', () => { sunXTarget = restX(); if (!follow) follow = requestAnimationFrame(chase); });
}

/* ---------------------------------------------------------------- day and night */
switchBtn.innerHTML = SWITCH_SVG;
const footArc = $('#foot-arc'), footHour = $('#foot-hour');
function label() {
  const n = root.dataset.theme === 'night';
  switchBtn.setAttribute('aria-label', n ? 'Switch to day' : 'Switch to night');
  moonBtn.hidden = n; sunBtn.hidden = !n;
  footArc.setAttribute('href', ARC(n ? '2330' : '1820'));
  footHour.textContent = n ? '23:30 · Lamps on' : '18:20 · Long light';
  document.querySelector('meta[name="theme-color"]').content = n ? '#0C1A2B' : '#1B3557';
  lastClock = ''; clock(progress());
}
async function relight(next) {
  if (!sl) { if (hero.classList.contains('no-gl')) nightStill(next === 'night'); return; }
  busy = true;
  if (next === 'night') {
    if (reduced) sl.set({ sun: 0, night: 1 });
    else { await sl.tween({ sun: 0 }, 1000); await sl.tween({ night: 1 }, 1500); }
  } else {
    if (reduced) sl.set({ night: 0, sun: sunForScroll() });
    else { await sl.tween({ night: 0 }, 1300); await sl.tween({ sun: sunForScroll() }, 2000); }
  }
  busy = false;
}
async function setTheme(next, from) {
  if (next === root.dataset.theme) return;
  const apply = () => { root.dataset.theme = next; try { localStorage.setItem('albretsen-theme', next); } catch {} label(); };
  relight(next);
  if (!document.startViewTransition || reduced) return apply();
  const r = from.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const t = document.startViewTransition(apply);
  await t.ready;
  root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
    { duration: 1400, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' });
}
switchBtn.addEventListener('click', () => setTheme(root.dataset.theme === 'night' ? 'day' : 'night', switchBtn));
moonBtn.addEventListener('click', () => { setTheme('night', moonBtn); requestAnimationFrame(() => sunBtn.focus({ preventScroll: true })); });
sunBtn.addEventListener('click', () => { setTheme('day', sunBtn); requestAnimationFrame(() => moonBtn.focus({ preventScroll: true })); });
label();

// a quiet nudge, once per visitor: the moon is a button
let nudged = false; try { nudged = !!localStorage.getItem('albretsen-moon'); } catch {}
if (!nudged && !reduced) setTimeout(() => {
  if (root.dataset.theme === 'night' || scrollY > 40) return;
  moonBtn.classList.add('beckon'); try { localStorage.setItem('albretsen-moon', '1'); } catch {}
  setTimeout(() => moonBtn.classList.remove('beckon'), 6800);
}, 4200);

/* ---------------------------------------------------------------- scroll: one day */
function progress() { const m = root.scrollHeight - innerHeight; return m > 0 ? clamp(scrollY / m) : 0; }
daylong({
  onProgress(p) {
    clock(p);
    bar.classList.toggle('is-solid', scrollY > hero.offsetHeight - 70);
    if (sl && !busy && root.dataset.theme !== 'night') sl.set({ sun: sunForScroll() });
  },
});

/* ---------------------------------------------------------------- arrival */
requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-up')));
horizonRise();
const start = () => mountGL();
if (document.readyState === 'complete') setTimeout(start, 120); else addEventListener('load', () => setTimeout(start, 120), { once: true });

/* ---------------------------------------------------------------- the live line */
const feedEl = $('#feed');
const say = e => {
  const t = e.text.charAt(0).toUpperCase() + e.text.slice(1);
  const where = e.country ? ` in ${e.country}` : e.city ? ` in ${e.city}` : '';
  return `${t}${where} · ${e.label}`;
};
try {
  const feed = createFeed();
  const first = feed.recent(1)[0]; if (first) feedEl.textContent = say(first);
  let lastShown = 0, pending = null, timer = 0;
  const show = e => {
    if (reduced) { feedEl.textContent = say(e); return; }
    feedEl.classList.add('out');
    setTimeout(() => { feedEl.textContent = say(e); feedEl.classList.remove('out'); }, 450);
  };
  feed.subscribe(e => {
    const now = performance.now();
    if (now - lastShown > 5000) { lastShown = now; show(e); }
    else { pending = e; clearTimeout(timer); timer = setTimeout(() => { lastShown = performance.now(); show(pending); }, 5000 - (now - lastShown)); }
  });
} catch {}

/* ---------------------------------------------------------------- product walls: the pointer is a second sun */
for (const a of document.querySelectorAll('.wall__link')) {
  const fig = a.querySelector('.wall__fig');
  a.addEventListener('pointermove', e => {
    const r = fig.getBoundingClientRect();
    fig.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    fig.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  });
}

/* ---------------------------------------------------------------- copy */
const toast = $('#toast'); let toastT = 0;
for (const b of document.querySelectorAll('.copy')) {
  b.addEventListener('click', async () => {
    const lab = b.querySelector('.copy__label');
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch { return; }
    b.classList.add('done'); lab.textContent = 'Copied';
    toast.textContent = b.classList.contains('copy--cmd') ? 'Command copied. Paste it into your terminal.' : 'Address copied.';
    toast.classList.add('on'); clearTimeout(toastT);
    toastT = setTimeout(() => { toast.classList.remove('on'); b.classList.remove('done'); lab.textContent = 'Copy'; }, 2200);
  });
}

// ?frame=<px> pins the hero to a fixed height, for full-page contact sheets of the design
const frame = +new URLSearchParams(location.search).get('frame');
if (frame) { hero.style.height = frame + 'px'; stage.style.height = frame + 'px'; }
