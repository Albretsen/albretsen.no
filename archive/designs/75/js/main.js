// Front Light (design 75): page behaviour. No dependencies.
import { content } from '../../_shared/content.js';
import { createFeed } from '../../_shared/feed.js';
import { initMotion } from '../assets/motion.js';

const $ = (s, r = document) => r.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const P = '../_shared/products/';

const LOGO = {
  'mcp-emails': P + 'mcp-emails/logo-mark.svg',
  'fun-libs': P + 'fun-libs/icon.png',
  'toolrails': P + 'toolrails/icon.svg',
  'harbor': P + 'harbor/harbor-mark.svg',
};
const STATUS = { live: 'Live', building: 'In the making', paused: 'Paused' };
const ALT = {
  'mcp-emails': 'the fjord at sunset',
  'fun-libs': 'a small fjord village of wooden houses',
  'toolrails': 'the sun over the Earth seen from orbit',
  'harbor': 'a still lake mirroring snow peaks',
};
const host = u => u.replace(/^https?:\/\//, '').replace(/\/$/, '');

initMotion({ haze: false });
$('#yr').textContent = String(Math.max(2026, new Date().getFullYear()));

/* ── Hero: haze shader after first paint, name drifts a little with the pointer ── */
const hero = $('.hero');
const startHaze = () => import('../assets/interactive/haze.js').then(({ mountHaze }) => {
  const portrait = matchMedia('(max-aspect-ratio: 4/5)').matches;
  mountHaze($('#haze'), portrait
    ? { src: 'assets/hero/fjord-portrait-1080.webp', sun: [0.52, 0.447], horizon: 0.70 }
    : { src: innerWidth > 1700 ? 'assets/hero/fjord-2400.webp' : 'assets/hero/fjord-1600.webp', sun: [0.466, 0.447], horizon: 0.70 });
});
addEventListener('load', () => ('requestIdleCallback' in window ? requestIdleCallback(startHaze, { timeout: 1500 }) : setTimeout(startHaze, 400)));

if (finePointer && !reduce) {
  const name = $('.hero-name');
  hero.addEventListener('pointermove', e => {
    name.style.setProperty('--px', ((e.clientX / innerWidth) - .5).toFixed(3));
    name.style.setProperty('--py', ((e.clientY / innerHeight) - .5).toFixed(3));
  }, { passive: true });
}

/* ── Live feed: one quiet line at the waterline ── */
{
  const el = $('#feed'), box = $('.feed');
  const fmt = d => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const detail = e => e.ms ? `${e.ms} ms` : e.country ? e.country : e.city ? e.city : e.sha ? e.sha : '';
  const render = e => {
    const d = detail(e);
    el.innerHTML = `<span class="feed-p">Live</span><time datetime="${e.time.toISOString()}">${fmt(e.time)}</time>${e.label} · ${e.text}${d ? ' · ' + d : ''}`;
  };
  try {
    const feed = createFeed();
    const [first] = feed.recent(1);
    if (first) render(first);
    let busy = false;
    feed.subscribe(e => {
      if (busy || document.hidden) return;
      if (reduce) { render(e); return; }
      busy = true; el.classList.add('out');
      setTimeout(() => {
        render(e); el.classList.remove('out');
        box.classList.remove('pulse'); void box.offsetWidth; box.classList.add('pulse');
        busy = false;
      }, 480);
    });
  } catch { /* the line simply stays still */ }
}

/* ── The desk: keys choose the postcard; the postcard turns over ── */
const products = ['mcp-emails', 'fun-libs', 'toolrails', 'harbor'].map(id => content.products.find(p => p.id === id));
const card = $('#card'), turnBtn = $('.turn');
let current = -1;

function setCard(i, animate = true) {
  if (i === current) return;
  current = i;
  const p = products[i], no = String(i + 1).padStart(2, '0');
  const front = card.querySelector('.card-front picture');
  front.querySelector('source').srcset = `assets/products/postcard-${p.id}-800.webp 800w, assets/products/postcard-${p.id}-1500.webp 1500w`;
  const img = front.querySelector('img');
  img.src = `assets/products/postcard-${p.id}-800.jpg`;
  img.alt = `Postcard for ${p.name}: ${ALT[p.id]}, a stamp with the ${p.name} logo, postmarked ${p.figure.value} ${p.figure.label}`;
  const back = card.querySelector('.card-back');
  back.querySelector('.cb-msg').textContent = p.line;
  back.querySelector('.cb-facts').innerHTML = (p.facts || []).map(f => `<li>${f}</li>`).join('');
  const st = back.querySelector('.cb-stamp');
  st.classList.toggle('dark', p.id === 'harbor');
  st.querySelector('img').src = LOGO[p.id];
  st.querySelector('img').alt = `${p.name} logo`;
  back.querySelector('.cb-pm').src = `assets/extras/postmark-${p.since === 2019 ? 2019 : 2026}.svg`;
  back.querySelector('.cb-to').textContent = p.name;
  const a = back.querySelector('.cb-url a');
  a.href = p.url; a.textContent = host(p.url) + ' ↗'; a.rel = 'noopener'; a.target = '_blank';
  back.querySelector('.cb-meta').textContent = `Since ${p.since} · ${STATUS[p.status] || p.status}`;
  // caption
  $('.cap-no').dataset.s = p.status;
  $('.cap-no span').textContent = `${STATUS[p.status] || p.status} · since ${p.since}`;
  const cn = $('.cap-name'); cn.href = p.url; cn.firstChild.textContent = host(p.url) + ' ';
  cn.setAttribute('aria-label', `${p.name} at ${host(p.url)}`);
  $('.cap-fig').innerHTML = `<b>${p.figure.value}</b> ${p.figure.label}`;
  card.setAttribute('aria-label', `${p.name}. ${p.line} ${p.figure.value} ${p.figure.label}. ${(p.facts || []).join(', ')}. ${host(p.url)}.`);
  turn(false);
  if (animate && !reduce) { card.classList.remove('is-dealt'); void card.offsetWidth; card.classList.add('is-dealt'); }
}

function turn(on) {
  card.classList.toggle('is-turned', on);
  turnBtn.setAttribute('aria-pressed', String(on));
  card.querySelector('.card-back').setAttribute('aria-hidden', String(!on));
  card.querySelector('.card-back a').tabIndex = on ? 0 : -1;
}
turnBtn.addEventListener('click', () => turn(!card.classList.contains('is-turned')));
card.addEventListener('click', e => { if (!e.target.closest('a') && !finePointer) turn(!card.classList.contains('is-turned')); });
card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); turn(!card.classList.contains('is-turned')); } });

setCard(0, false);

const rackEl = $('#rack');
const mountRack = () => import('../assets/interactive/keyrack.js').then(({ mountKeyRack }) => {
  const rack = mountKeyRack(rackEl, { ids: products.map(p => p.id) });
  const slots = [...rack.querySelectorAll('.kr-slot')];
  slots[0].classList.add('is-open');
  slots.forEach((b, i) => {
    b.setAttribute('aria-controls', 'stage');
    b.setAttribute('aria-pressed', String(i === 0));
    b.addEventListener('click', () => {
      // one key is always out: the board never sits empty
      slots.forEach((s, j) => { s.classList.toggle('is-open', j === i); s.setAttribute('aria-pressed', String(j === i)); });
      setCard(i);
      if (innerWidth <= 1100) {
        const r = $('#stage').getBoundingClientRect();
        if (r.top > innerHeight * .6 || r.bottom < 0) $('#stage').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      }
    });
  });
});
new IntersectionObserver((es, io) => { if (es.some(e => e.isIntersecting)) { io.disconnect(); mountRack(); } }, { rootMargin: '600px' }).observe(rackEl);

/* ── Orbit: the photograph settles as it scrolls into view ── */
if (!reduce) {
  const orbit = $('.orbit');
  let on = false, raf = 0;
  const tick = () => {
    raf = 0;
    const r = orbit.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height * .5)));
    orbit.style.setProperty('--o', t.toFixed(3));
  };
  new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) tick(); }).observe(orbit);
  addEventListener('scroll', () => { if (on && !raf) raf = requestAnimationFrame(tick); }, { passive: true });
}

/* ── Cancelled stamps ── */
{
  const retired = content.products.filter(p => p.status === 'retired');
  const tilt = [-3, 2, -1.5, 3.5, -2.5, 1.5, -1];
  $('#stamps').innerHTML = retired.map((p, i) => `
    <li class="stamp" style="--r:${tilt[i % tilt.length]}deg">
      <button type="button" aria-label="${p.name}, ${p.since}, retired. ${p.line}">
        <img src="assets/products/retired/stamp-${p.id}.svg" width="162" height="192" alt="" loading="lazy" decoding="async">
        <span class="stamp-tip" aria-hidden="true"><b>${p.since} · ${p.name}</b>${p.line}</span>
      </button>
    </li>`).join('');
  $('#stamps').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const was = b.classList.contains('is-open');
    document.querySelectorAll('.stamp .is-open').forEach(x => x.classList.remove('is-open'));
    b.classList.toggle('is-open', !was);
  });
}

/* ── Writing ── */
$('#posts').innerHTML = content.posts.map(p => {
  const d = new Date(p.date + 'T12:00:00Z');
  return `<li><a href="/blog/${p.slug}"><span class="t">${p.title}</span><time datetime="${p.date}">${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</time></a></li>`;
}).join('');

/* ── The ticket: tear off the stub to copy the command ── */
{
  const btn = $('#copy'), act = btn.querySelector('.tk-act');
  btn.addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(content.mcpCommand); ok = true; }
    catch {
      const r = document.createRange(); r.selectNodeContents($('#cmd'));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); ok = document.execCommand?.('copy');
    }
    act.textContent = ok ? 'Copied' : 'Select';
    btn.classList.toggle('done', ok);
    setTimeout(() => { act.textContent = 'Copy'; btn.classList.remove('done'); }, 2200);
  });
}

/* ── Review helper: ?from=desk|orbit|archive|writing|close starts the page lower (for stills) ── */
{
  const q = new URLSearchParams(location.search);
  const order = ['hero', 'desk', 'orbit', 'archive', 'writing', 'close'];
  const i = order.indexOf(q.get('from'));
  if (i > 0) order.slice(0, i).forEach(s => { $('.' + s).style.display = 'none'; });
  if (q.has('key')) setTimeout(() => $(`#rack .kr-slot:nth-child(${+q.get('key') + 1})`)?.click(), 1000);
  if (q.has('turn')) setTimeout(() => turn(true), 1400);
}
