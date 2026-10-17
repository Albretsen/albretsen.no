// Design 74: Afterglow Diorama. Page behaviour.
// 1. Pull-back: the full-bleed coast shrinks into the arched box it always was,
//    then the live CSS-3D diorama (real sky over Norway) takes its place.
// 2. Pointer parallax on the four paper layers.
// 3. Products as one day: the background passes morning to night as you scroll,
//    a small dial keeps the hour.
// 4. Live feed line, sign light-up, boulevard lamps, copy, opt-in sound.
import { content } from '../../_shared/content.js';
import { sunPosition } from '../assets/js/diorama.js';
import { lightAt } from '../assets/js/paperworld.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const osloTime = (d = new Date()) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo' });
const osloHours = (d = new Date()) => { const [h, m] = osloTime(d).split(':').map(Number); return h + m / 60; };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------------ sound (opt-in) */
const sound = (() => {
  let ctx = null, on = false;
  const btn = $('.sound'), label = $('.sound-label');
  btn.addEventListener('click', () => {
    on = !on; btn.setAttribute('aria-pressed', String(on)); label.textContent = on ? 'Sound on' : 'Sound off';
    if (on && !ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (on) play('tink');
  });
  function play(kind) {
    if (!on || !ctx) return; const t = ctx.currentTime; const g = ctx.createGain(); g.connect(ctx.destination);
    if (kind === 'tink') { // a small glass lamp switching on
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(1568, t); o.frequency.exponentialRampToValueAtTime(1175, t + 0.25);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(g); o.start(t); o.stop(t + 0.62);
    } else { // card settling: filtered noise, very short
      const n = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate); const d = n.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      const s = ctx.createBufferSource(); s.buffer = n; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
      g.gain.value = 0.18; s.connect(f); f.connect(g); s.start(t);
    }
  }
  return { play };
})();

/* ------------------------------------------------------------ header sky readout */
function readout() {
  const { altitude } = sunPosition(new Date());
  $('.readout-text').textContent = `Norway ${osloTime()} · ${lightAt(altitude).name}`;
  $('.dial-sun').style.transform = `rotate(${(osloHours() - 12) * 15}deg)`;
}
readout(); setInterval(readout, 30000);

/* ------------------------------------------------------------ hero pull-back */
const stage = $('.stage'), wrap = $('.world-wrap'), world = $('.world'), top = $('.top'), dioEl = $('#dio');
const layers = $$('.w-layer').map((p) => ({ img: p.querySelector('img'), depth: +p.dataset.depth }));
// review helpers for headless screenshots: ?p=0.5 freezes the pull-back, ?from=products starts the page there
const Q = new URLSearchParams(location.search); const FORCE_P = Q.has('p') ? +Q.get('p') : null;
if (Q.get('from') === 'products') { document.querySelector('.pull').style.display = 'none'; }
let P = 0, mx = 0, my = 0, geo = null, dio = null, introduced = false;

function measure() {
  const s = stage.getBoundingClientRect(), d = dioEl.getBoundingClientRect();
  const dx = d.left - s.left, dy = d.top - s.top, dw = d.width, dh = d.height;
  geo = { W: s.width, H: s.height, x0: dx + dw * 0.0525, x1: dx + dw * 0.9475, y0: dy + dh * 0.08, y1: dy + dh * 0.936, rx: dw * 0.256, ry: dh * 0.35 };
  geo.sEnd = Math.max((geo.x1 - geo.x0) / geo.W, (geo.y1 - geo.y0) / geo.H);
}

function render() {
  raf = 0;
  if (reduce.matches) { wrap.style.transform = ''; world.style.clipPath = ''; stage.classList.add('is-mini'); return; }
  if (!geo) measure();
  const sec = stage.parentElement.getBoundingClientRect();
  P = FORCE_P ?? clamp(-sec.top / (sec.height - stage.offsetHeight));
  stage.style.setProperty('--p', P.toFixed(4));
  const e = ease(clamp(P / 0.78));
  const { W, H, x0, x1, y0, y1, rx, ry, sEnd } = geo;
  const s = 1 + (sEnd - 1) * e;
  const cx = W / 2 + ((x0 + x1) / 2 - W / 2) * e, cy = H / 2 + ((y0 + y1) / 2 - H / 2) * e;
  const ox = cx - (W / 2) * s, oy = cy - (H / 2) * s;
  wrap.style.transform = `translate3d(${ox}px,${oy}px,0) scale(${s})`;
  wrap.style.filter = e > 0.02 ? `drop-shadow(0 ${(22 * e) / s}px ${(26 * e) / s}px rgba(30,16,40,${0.34 * e}))` : '';
  const L = (x0 * e - ox) / s, T = (y0 * e - oy) / s, R = (W + (x1 - W) * e - ox) / s, B = (H + (y1 - H) * e - oy) / s;
  const rxl = (rx * e) / s, ryl = (ry * e) / s;
  world.style.clipPath = e > 0.001 ? `inset(${T}px ${W - R}px ${H - B}px ${L}px round ${rxl}px ${rxl}px 0 0 / ${ryl}px ${ryl}px 0 0)` : '';
  // dolly out: near sheets shrink a touch faster than far ones; pointer parallax on top
  const k = 1 - e;
  for (const { img, depth } of layers) img.style.transform = `translate3d(${mx * depth * 9 * k}px,${my * depth * 4 * k}px,0) scale(${1 + depth * 0.035 * k})`;
  top.classList.toggle('on-paper', P > 0.42);
  const mini = P > 0.86; stage.classList.toggle('is-mini', mini);
  if (mini && dio && !introduced) { introduced = true; dio.turn(-0.55, 0.15); setTimeout(() => dio.turn(0.12, 0.05), 1100); }
}
let raf = 0; const schedule = () => { if (!raf) raf = requestAnimationFrame(render); };
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', () => { geo = null; schedule(); });
stage.addEventListener('pointermove', (ev) => { if (ev.pointerType !== 'mouse' || P > 0.5) return; mx = ev.clientX / innerWidth - 0.5; my = ev.clientY / innerHeight - 0.5; schedule(); });
reduce.addEventListener?.('change', () => { geo = null; schedule(); });
render();
/* ------------------------------------------------------------ the live diorama (after first paint) */
const sun = $('#sun'), out = $('#sun-out');
function showNow() { const a = sunPosition().altitude; sun.value = a.toFixed(1); out.textContent = `Now ${osloTime()} · ${lightAt(a).name}`; }
showNow();
const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
addEventListener('load', () => idle(async () => {
  const { mountDiorama } = await import('../assets/js/diorama.js');
  dio = await mountDiorama(dioEl, { grain: 'assets/textures/paper-grain.webp', frameColor: '#F5EBDC', ink: '#2E2240' });
  dioEl.classList.remove('dio-fallback');
  geo = null; schedule();
  if (P > 0.86 && !introduced) { introduced = true; dio.turn(0.12, 0.05); }
  let tx = 0.12, ty = 0.05;
  dioEl.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, 0.25], ArrowDown: [0, -0.25] }[e.key];
    if (!step) return; e.preventDefault(); tx = clamp(tx + step[0], -1, 1); ty = clamp(ty + step[1], -1, 1); dio.turn(tx, ty);
  });
  dioEl.addEventListener('pointerup', () => sound.play('card'));
}));
sun.addEventListener('input', () => { const a = +sun.value; dio?.setAltitude(a); out.textContent = `${cap(lightAt(a).name)} · sun ${a.toFixed(1)}°`; });
$('#now').addEventListener('click', () => { dio?.live(); showNow(); sound.play('tink'); });

/* ------------------------------------------------------------ live feed line */
import('../../_shared/feed.js').then(({ createFeed }) => {
  const feed = createFeed(); const el = $('.live'), txt = $('.live-text');
  const fmt = (e) => { const extra = e.country ? ` in ${e.country}` : e.ms ? ` · ${e.ms} ms` : e.city ? ` · ${e.city}` : ''; return `<b>${e.label}</b> · ${e.text}${extra}`; };
  const show = (e) => { txt.innerHTML = fmt(e); el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); };
  show(feed.recent(1)[0]); feed.subscribe(show);
});

/* ------------------------------------------------------------ products: one day */
const HOURS = { 'mcp-emails': '08:00', 'fun-libs': '12:00', toolrails: '18:30', harbor: '21:40' };
const ALT = {
  'mcp-emails': 'The MCP Emails logo on a terracotta sign by the sea, in morning light',
  'fun-libs': 'The Fun Libs icon as a glazed tile in a sunlit wall under a striped awning',
  toolrails: 'The Toolrails icon on a road sign beside a long boulevard of lamps at dusk',
  harbor: 'The Harbor mark on a plaque beside a glowing doorway on a cliff at night',
};
const STATUS = { live: 'Live', building: 'Building', paused: 'Paused' };
const host = (u) => u.replace(/^https?:\/\//, '').replace(/\/$/, '');
const hoursEl = $('#hours');
hoursEl.innerHTML = content.products.filter((p) => HOURS[p.id]).map((p, i) => `
  <li class="hour${p.id === 'harbor' ? ' night' : ''}" data-hour="${HOURS[p.id]}">
    <a class="plate paper-lift" href="${p.url}" tabindex="-1" aria-hidden="true">
      <picture>
        <source type="image/avif" srcset="assets/products/${p.id}-480.avif 480w, assets/products/${p.id}-960.avif 960w" sizes="(max-width: 760px) 92vw, 40vw">
        <source type="image/webp" srcset="assets/products/${p.id}-480.webp 480w, assets/products/${p.id}-960.webp 960w" sizes="(max-width: 760px) 92vw, 40vw">
        <img src="assets/products/${p.id}-480.jpg" width="480" height="600" alt="${ALT[p.id]}" loading="lazy" decoding="async">
      </picture>
    </a>
    <div class="hour-text">
      <p class="time"><span class="vh">At </span>${HOURS[p.id]}</p>
      <h3 class="pname">${p.name}</h3>
      <p class="pline">${p.line}</p>
      ${p.figure ? `<p class="figure"><b>${p.figure.value}</b><span>${p.figure.label}</span></p>` : ''}
      ${p.facts ? `<ul class="facts">${p.facts.map((f) => `<li>${f}</li>`).join('')}</ul>` : ''}
      <p class="meta"><span class="status st-${p.status}">${STATUS[p.status]}</span><span aria-hidden="true">·</span><span>Since ${p.since}</span>
        <a class="go" href="${p.url}">${host(p.url)} <span aria-hidden="true">↗</span></a></p>
    </div>
  </li>`).join('');

const SHORT = { 'joke-central': 'Joke Central', 'early-apps': 'Early apps' };
$('#arches').innerHTML = content.products.filter((p) => p.status === 'retired').map((p, i) => `
  <li class="arch">
    <button type="button" aria-expanded="false" aria-describedby="tip-${i}">
      <img src="assets/products/retired/${p.id}.svg" width="160" height="230" alt="" loading="lazy">
      <span class="arch-name">${SHORT[p.id] || p.name}</span><span class="arch-year">${p.since}</span>
    </button>
    <span class="arch-tip" role="tooltip" id="tip-${i}"><b>${p.name}.</b> ${p.line}${p.figure ? ` ${p.figure.value} ${p.figure.label}.` : ''}</span>
  </li>`).join('');
$$('.arch button').forEach((b) => b.addEventListener('click', () => {
  const was = b.getAttribute('aria-expanded') === 'true'; $$('.arch button').forEach((x) => x.setAttribute('aria-expanded', 'false')); b.setAttribute('aria-expanded', String(!was));
}));
addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.arch button').forEach((x) => x.setAttribute('aria-expanded', 'false')); });

// sign light-up on product names
const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-lit'); io.unobserve(en.target); } }), { threshold: 0.6 });
$$('.pname').forEach((el) => {
  const t = el.textContent; el.setAttribute('aria-label', t); el.textContent = '';
  [...t].forEach((c, i) => { const s = document.createElement('span'); s.className = 'ch'; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', i); s.textContent = c === ' ' ? ' ' : c; el.appendChild(s); });
  if (reduce.matches) el.classList.add('is-lit'); else io.observe(el);
});

// the day passes as you scroll: gradient stops sit on each product's centre
const day = $('.day'), rows = $$('.hour'), clockSun = $('.clock-sun'), clockTime = $('.clock-time');
const SKY = ['#E3ECEA', '#F8E6BE', '#EFBFA8', '#3E3361'];
const TIMES = [8, 12, 18.5, 21 + 40 / 60];
let centers = [];
function paintDay() {
  const d = day.getBoundingClientRect(), H = d.height, top = d.top + scrollY;
  centers = rows.map((r) => { const b = r.getBoundingClientRect(); return b.top + scrollY + b.height / 2; });
  const pc = (y) => `${(((y - top) / H) * 100).toFixed(2)}%`;
  const c = centers;
  const stops = ['#F5EBDC 0%', `#EEEADF ${pc(c[0] - innerHeight * 0.6)}`, `${SKY[0]} ${pc(c[0])}`, `${SKY[1]} ${pc(c[1])}`,
    `#F4D7B2 ${pc((c[1] + c[2]) / 2)}`, `${SKY[2]} ${pc(c[2])}`, `#B58FB4 ${pc(c[2] + (c[3] - c[2]) * 0.42)}`, `#5D4F8C ${pc(c[2] + (c[3] - c[2]) * 0.62)}`,
    `${SKY[3]} ${pc(c[3])}`, `#2E2240 ${pc(c[3] + innerHeight * 0.55)}`, '#2E2240 100%'];
  day.style.background = `linear-gradient(180deg, ${stops.join(', ')})`;
  tickClock();
}
function tickClock() {
  if (!centers.length) return; const y = scrollY + innerHeight / 2; let h = TIMES[0];
  if (y >= centers[centers.length - 1]) h = TIMES[TIMES.length - 1];
  else for (let i = 0; i < centers.length - 1; i++) if (y >= centers[i] && y < centers[i + 1]) h = TIMES[i] + (TIMES[i + 1] - TIMES[i]) * ((y - centers[i]) / (centers[i + 1] - centers[i]));
  clockSun.setAttribute('transform', `rotate(${((h - 12) * 15).toFixed(2)} 100 100)`);
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60 / 10) * 10; clockTime.textContent = `${String(hh + (mm === 60 ? 1 : 0)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`;
}
let craf = 0; addEventListener('scroll', () => { if (!craf) craf = requestAnimationFrame(() => { craf = 0; tickClock(); }); }, { passive: true });
new ResizeObserver(() => paintDay()).observe(day);

/* ------------------------------------------------------------ boulevard: lamps ignite far to near */
idle(async () => {
  const img = $('.boulevard-img'); if (!img) return;
  try {
    const svg = await (await fetch(img.src)).text();
    const box = document.createElement('div'); box.innerHTML = svg; const el = box.querySelector('svg'); if (!el) return;
    el.classList.add('boulevard'); el.setAttribute('aria-hidden', 'true'); el.removeAttribute('role'); el.querySelector('title')?.remove();
    el.setAttribute('width', '100%'); el.removeAttribute('height'); el.style.display = 'block';
    const glows = [...el.querySelectorAll('circle[fill="url(#g)"]')];
    glows.forEach((g, i) => { g.classList.add('lamp-glow'); g.style.setProperty('--i', i); });
    img.replaceWith(el);
    if (reduce.matches) { el.classList.add('is-on'); return; }
    const o = new IntersectionObserver(([en]) => { if (en.isIntersecting) { el.classList.add('is-on'); sound.play('tink'); o.disconnect(); } }, { threshold: 0.6 });
    o.observe(el);
  } catch { /* the image stays */ }
});

/* ------------------------------------------------------------ copy the MCP line */
const copyBtn = $('#copy'), copyLabel = $('.copy-label');
copyBtn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(content.mcpCommand); copyLabel.textContent = 'Copied'; }
  catch { const r = document.createRange(); r.selectNodeContents($('#cmd-text')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); copyLabel.textContent = 'Selected'; }
  copyBtn.classList.add('done'); sound.play('tink');
  setTimeout(() => { copyBtn.classList.remove('done'); copyLabel.textContent = 'Copy'; }, 1800);
});
