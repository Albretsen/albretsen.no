// Homepage behaviour.
// 1. Pull-back: the full-bleed coast shrinks into the arched box it always was,
//    then the live, turnable CSS-3D diorama takes its place.
// 2. Pointer parallax on the four paper layers.
// 3. The sun slider (palette stays in afterglow; only the sun moves).
// 4. Real product events, product names that ink on, retired tooltips,
//    MCP client tabs with copy, opt-in sound.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
// Sun altitude over Oslo right now (same maths as diorama.js, kept here so it loads lazily).
function sunAltitude(date = new Date(), lat = 59.91, lon = 10.75) {
  const r = Math.PI / 180, d = (date.getTime() - 946728000000) / 86400000;
  const g = (357.529 + 0.98560028 * d) * r, q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * r, e = (23.439 - 3.6e-7 * d) * r;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
  const H = (((18.697374558 + 24.06570982441908 * d) % 24) * 15 + lon) * r - ra, la = lat * r;
  return Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(H)) / r;
}

/* ------------------------------------------------------------ sound (opt-in) */
const sound = (() => {
  let ctx = null, on = false;
  const btn = $('.sound'), label = $('.sound-label');
  btn?.addEventListener('click', () => {
    on = !on; btn.setAttribute('aria-pressed', String(on)); label.textContent = on ? 'Sound on' : 'Sound off';
    if (on && !ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (on) play('tink');
  });
  function play(kind) {
    if (!on || !ctx) return; const t = ctx.currentTime; const g = ctx.createGain(); g.connect(ctx.destination);
    if (kind === 'tink') { // a small glass lamp switching on
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(1568, t); o.frequency.exponentialRampToValueAtTime(1175, t + 0.25);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(g); o.start(t); o.stop(t + 0.62);
    } else { // paper settling: filtered noise, very short
      const n = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate); const d = n.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      const s = ctx.createBufferSource(); s.buffer = n; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
      g.gain.value = 0.18; s.connect(f); f.connect(g); s.start(t);
    }
  }
  return { play };
})();

/* ------------------------------------------------------------ hero pull-back */
const stage = $('.stage'), wrap = $('.world-wrap'), world = $('.world'), top = $('.top'), dioEl = $('#dio');
const layers = $$('.w-layer').map((p) => ({ img: p.querySelector('img'), depth: +p.dataset.depth }));
let P = 0, mx = 0, my = 0, geo = null, dio = null, introduced = false, raf = 0;

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
  P = clamp(-sec.top / (sec.height - stage.offsetHeight));
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
  const k = 1 - e;
  for (const { img, depth } of layers) img.style.transform = `translate3d(${mx * depth * 9 * k}px,${my * depth * 4 * k}px,0) scale(${1 + depth * 0.035 * k})`;
  top.classList.toggle('on-paper', P > 0.42);
  const mini = P > 0.86; stage.classList.toggle('is-mini', mini);
  if (mini && dio && !introduced) { introduced = true; dio.turn(-0.55, 0.15); setTimeout(() => dio.turn(0.12, 0.05), 1100); }
}
const schedule = () => { if (!raf) raf = requestAnimationFrame(render); };
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', () => { geo = null; schedule(); });
stage.addEventListener('pointermove', (ev) => { if (ev.pointerType !== 'mouse' || P > 0.5) return; mx = ev.clientX / innerWidth - 0.5; my = ev.clientY / innerHeight - 0.5; schedule(); });
reduce.addEventListener?.('change', () => { geo = null; schedule(); });
render();

/* ------------------------------------------------------------ the miniature and its sun */
const sun = $('#sun'), out = $('#sun-out');
// Always the same width (sign, two digits, one decimal), so the slider never moves.
const fmt = (a) => `${a < 0 ? '−' : '+'}${Math.abs(a).toFixed(1).padStart(4, ' ')}°`;
function showNow() { const a = clamp(sunAltitude(), +sun.min, +sun.max); sun.value = a.toFixed(1); out.textContent = fmt(a); }
showNow();
addEventListener('load', () => idle(async () => {
  const { mountDiorama } = await import('./diorama.js');
  dio = await mountDiorama(dioEl, { grain: '/assets/textures/paper-grain.webp', frameColor: '#F5EBDC', ink: '#2E2240', label: false });
  dioEl.classList.remove('dio-fallback');
  dio.setAltitude(+sun.value);
  geo = null; schedule();
  if (P > 0.86 && !introduced) { introduced = true; dio.turn(0.12, 0.05); }
  let tx = 0.12, ty = 0.05;
  dioEl.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, 0.25], ArrowDown: [0, -0.25] }[e.key];
    if (!step) return; e.preventDefault(); tx = clamp(tx + step[0], -1, 1); ty = clamp(ty + step[1], -1, 1); dio.turn(tx, ty);
  });
  dioEl.addEventListener('pointerup', () => sound.play('card'));
}));
sun.addEventListener('input', () => { const a = +sun.value; dio?.setAltitude(a); out.textContent = fmt(a); });
$('#now').addEventListener('click', () => { showNow(); dio?.setAltitude(+sun.value); sound.play('tink'); });

/* ------------------------------------------------------------ real product events
   Products post anonymised events to the site's Worker. With none yet, the line stays hidden. */
const live = $('.live'), liveText = $('.live-text');
const show = (e) => {
  const extra = e.country ? ` in ${e.country}` : e.ms ? ` · ${e.ms} ms` : '';
  liveText.innerHTML = ''; const b = document.createElement('b'); b.textContent = e.label; liveText.append(b, ` · ${e.text}${extra}`);
  live.hidden = false; live.classList.remove('pulse'); void live.offsetWidth; live.classList.add('pulse');
};
idle(async () => {
  try {
    const r = await fetch('/api/events?limit=1', { headers: { accept: 'application/json' } });
    if (!r.ok) return; const { events = [] } = await r.json(); if (events[0]) show(events[0]);
    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/events/socket`);
    ws.onmessage = (m) => { try { show(JSON.parse(m.data)); } catch {} };
  } catch { /* no feed: keep quiet */ }
});

/* ------------------------------------------------------------ products and retired */
$$('.arch button').forEach((b) => b.addEventListener('click', () => {
  const was = b.getAttribute('aria-expanded') === 'true'; $$('.arch button').forEach((x) => x.setAttribute('aria-expanded', 'false')); b.setAttribute('aria-expanded', String(!was));
}));
addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.arch button').forEach((x) => x.setAttribute('aria-expanded', 'false')); });

const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-lit'); io.unobserve(en.target); } }), { threshold: 0.6 });
$$('.pname').forEach((el) => {
  const t = el.textContent; el.setAttribute('aria-label', t); el.textContent = '';
  [...t].forEach((c, i) => { const s = document.createElement('span'); s.className = 'ch'; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', i); s.textContent = c === ' ' ? ' ' : c; el.appendChild(s); });
  if (reduce.matches) el.classList.add('is-lit'); else io.observe(el);
});

/* ------------------------------------------------------------ MCP: tabs per client, copy */
const tabs = $$('.tab'), panels = $$('.cmd[role="tabpanel"]');
function select(i, focus) {
  tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; panels[j].hidden = i !== j; });
  if (focus) tabs[i].focus();
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => select(i));
  t.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1, Home: -i, End: tabs.length - 1 - i }[e.key];
    if (d === undefined) return; e.preventDefault(); select((i + d + tabs.length) % tabs.length, true);
  });
});
$$('.copy').forEach((btn) => btn.addEventListener('click', async () => {
  const code = btn.parentElement.querySelector('code'), label = btn.querySelector('.copy-label');
  try { await navigator.clipboard.writeText(code.textContent); label.textContent = 'Copied'; }
  catch { const r = document.createRange(); r.selectNodeContents(code); const s = getSelection(); s.removeAllRanges(); s.addRange(r); label.textContent = 'Selected'; }
  btn.classList.add('done'); sound.play('tink');
  setTimeout(() => { btn.classList.remove('done'); label.textContent = 'Copy'; }, 1800);
}));
