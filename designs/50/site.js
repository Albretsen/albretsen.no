// IR//PEEL: design 50. Hero sticker sheet, scroll-scrubbed peel, products, depth.
import { content } from '../_shared/content.js';
import { createFeed } from '../_shared/feed.js';
import { peelable } from './assets/motion/peel.js';
import { slapIn, irWipe, scrubFrames, playSpark, thermalEasterEgg } from './assets/motion.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
const reduce = () => reduceMQ.matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const idle = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));

/* ---------------------------------------------------------------- sound (opt-in) */
const sfx = (() => {
  let ctx = null, on = false, noise = null;
  const btn = $('#sound');
  function ensure() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  btn.addEventListener('click', () => {
    on = !on; btn.setAttribute('aria-pressed', on); btn.title = on ? 'Sound is on' : 'Sound is off';
    btn.querySelector('b').textContent = on ? 'ON' : 'OFF';
    if (on) { ensure(); ctx.resume(); blip(880, 0.06); }
  });
  function blip(f = 660, dur = 0.05, type = 'square', vol = 0.05) {
    if (!on) return; const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  // vinyl lifting off the liner: band-passed noise sweeping upward, a little crackle
  function rip(big = false) {
    if (!on) return; const t = ctx.currentTime, len = big ? 0.42 : 0.26;
    const s = ctx.createBufferSource(); s.buffer = noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.2;
    bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(big ? 5200 : 6800, t + len);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(big ? 0.32 : 0.22, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    s.connect(bp).connect(g).connect(ctx.destination); s.start(t); s.stop(t + len + 0.05);
  }
  function slap() {
    if (!on) return; const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.12);
    g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.2);
  }
  return { blip, rip, slap, get on() { return on; } };
})();

/* ---------------------------------------------------------------- scramble text */
const GLYPHS = '░▒▓<>/\\[]{}#*+=_-01';
function scramble(el, text = el.dataset.text || el.textContent, dur = 520) {
  el.dataset.text = text;
  if (reduce()) { el.textContent = text; return; }
  cancelAnimationFrame(el._scr);
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const reveal = i / text.length < p * 1.15 - 0.1;
      out += reveal || text[i] === ' ' ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) el._scr = requestAnimationFrame(step); else el.textContent = text;
  };
  el._scr = requestAnimationFrame(step);
}
$$('[data-scramble]').forEach((el) => {
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.addEventListener('pointerenter', () => scramble(el, text, 600));
});

/* ---------------------------------------------------------------- IR lens */
(() => {
  const hero = $('.hero'), plate = $('.hero-plate'), read = $('.lens-read');
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0, active = false, t0 = performance.now();
  const set = () => {
    plate.style.setProperty('--mx', x.toFixed(1) + 'px'); plate.style.setProperty('--my', y.toFixed(1) + 'px');
    const w = hero.clientWidth || 1;
    read.textContent = `IR ${(0.78 + (x / w) * 0.72).toFixed(2)}µm / ${String(Math.round(x)).padStart(4, '0')}:${String(Math.round(y)).padStart(4, '0')}`;
  };
  const home = () => { const r = hero.getBoundingClientRect(); return [r.width * (innerWidth > 1000 ? 0.46 : 0.5), r.height * (innerWidth > 1000 ? 0.5 : 0.3)]; };
  [x, y] = home(); [tx, ty] = [x, y]; set();
  if (reduce()) return;
  const loop = (now) => {
    if (!active) { // drift on its own: slow Lissajous around home
      const [hx, hy] = home(), s = (now - t0) / 1000, r = hero.getBoundingClientRect();
      tx = hx + Math.sin(s * 0.31) * r.width * 0.36; ty = hy + Math.sin(s * 0.47 + 1) * Math.min(r.height, 900) * 0.3;
    }
    x += (tx - x) * 0.12; y += (ty - y) * 0.12; set();
    raf = requestAnimationFrame(loop);
  };
  if (fine) {
    hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; active = true; });
    hero.addEventListener('pointerleave', () => { active = false; t0 = performance.now(); });
  }
  new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting) raf = requestAnimationFrame(loop); }).observe(hero);
})();

/* ---------------------------------------------------------------- sticker sheet */
const sheet = $('#sheet');
const stickers = $$('.stk', sheet);
const countEl = $('#peel-count'), restick = $('#restick');
let peeled = 0;
const updateCount = () => {
  countEl.textContent = peeled === stickers.length ? `${peeled} / ${stickers.length} peeled. Sheet empty.` : `${peeled} / ${stickers.length} peeled`;
  restick.hidden = peeled === 0;
};
const handles = stickers.map((el) => {
  el.dataset.tilt && el.style.setProperty('--tilt', el.dataset.tilt);
  el.addEventListener('pointerdown', () => { sheet.classList.add('is-busy'); sfx.blip(320, 0.03, 'triangle', 0.04); });
  return peelable(el, {
    corner: el.dataset.corner || 'tr', threshold: 0.42,
    onPeel: () => { peeled++; updateCount(); sfx.rip(el.dataset.sound === 'big'); sheet.classList.remove('is-busy'); },
  });
});
slapIn(stickers);
updateCount();
restick.addEventListener('click', async () => {
  sfx.blip(520, 0.08);
  await irWipe({
    midpoint: () => {
      handles.forEach((h) => h.reset());
      stickers.forEach((el) => { el.classList.remove('ir-slap'); void el.offsetWidth; el.classList.add('ir-slap'); });
      peeled = 0; updateCount();
    },
  });
  sfx.slap();
  stickers[0].focus({ preventScroll: true });
});

// sheet tilts toward the pointer, gloss follows
if (fine && !reduce()) {
  const wrap = $('.sheet-wrap');
  wrap.addEventListener('pointermove', (e) => {
    if (sheet.querySelector('.is-peeling')) return;
    const r = wrap.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    sheet.style.setProperty('--ry', (-8 + px * 7).toFixed(2) + 'deg');
    sheet.style.setProperty('--rx', (6 - py * 6).toFixed(2) + 'deg');
    sheet.style.setProperty('--gl', (30 + px * 50).toFixed(1) + '%');
  });
  wrap.addEventListener('pointerleave', () => { sheet.style.removeProperty('--ry'); sheet.style.removeProperty('--rx'); sheet.style.removeProperty('--gl'); });
}
// a gentle hint: the big mark peeks its corner once, a moment after load
if (!reduce()) setTimeout(() => { if (!peeled) { handles[0].peek(0.16); setTimeout(() => handles[0].peek(0), 900); } }, 2200);

/* ---------------------------------------------------------------- copy command (Radix-style tooltip) */
(() => {
  const btn = $('.cmd-copy'), tip = $('#copy-tip'); let timer;
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(btn.dataset.copy); tip.textContent = 'Copied to clipboard'; }
    catch { tip.textContent = 'Select the line and copy it'; }
    sfx.blip(990, 0.05);
    tip.classList.remove('was-open'); tip.dataset.state = 'open';
    clearTimeout(timer); timer = setTimeout(() => { tip.classList.add('was-open'); tip.dataset.state = 'closed'; }, 1600);
  });
})();

/* ---------------------------------------------------------------- magnetic buttons */
if (fine && !reduce()) $$('.magnetic').forEach((el) => {
  el.style.transition = 'transform 500ms cubic-bezier(.16,1,.3,1)';
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${((e.clientX - r.left) / r.width - 0.5) * 8}px, ${((e.clientY - r.top) / r.height - 0.5) * 8}px)`;
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
});

/* ---------------------------------------------------------------- live feed */
(() => {
  const list = $('#feed'), feed = createFeed(), MAX = 5;
  const hhmmss = (d) => d.toTimeString().slice(0, 8);
  const extra = (e) => e.ms ? `${e.ms} ms` : e.country || (e.sha ? e.sha : e.city) || '';
  const row = (e) => {
    const li = document.createElement('li');
    li.innerHTML = `<time datetime="${e.time.toISOString()}"></time><span class="p" data-p="${e.product}"></span><span class="t"></span><span class="x"></span>`;
    li.children[0].textContent = hhmmss(e.time); li.children[1].textContent = e.label;
    li.children[2].textContent = e.text; li.children[3].textContent = extra(e);
    return li;
  };
  feed.recent(MAX).forEach((e) => list.appendChild(row(e)));
  feed.subscribe((e) => {
    const li = row(e); li.classList.add('new'); list.prepend(li);
    scramble(li.children[2], e.text, 420);
    setTimeout(() => li.classList.remove('new'), 1800);
    while (list.children.length > MAX) list.lastElementChild.remove();
  });
})();
idle(() => playSpark($('#spark')).catch(() => {}));

/* ---------------------------------------------------------------- scrub centrepiece */
(() => {
  const track = $('#scrub'), canvas = $('#scrub-canvas'), steps = $$('.scrub-steps li'), bar = $('#scrub-bar'), no = $('#frame-no');
  if (reduce()) return;
  let started = false;
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting || started) return; started = true; io.disconnect();
    scrubFrames(canvas, {
      count: 40, track,
      src: (i) => `assets/frames/peel-${String(i).padStart(2, '0')}.webp`,
      onProgress: (p, f) => {
        bar.style.setProperty('--p', p.toFixed(3)); no.textContent = String(f).padStart(2, '0');
        const k = p < 0.3 ? 0 : p < 0.66 ? 1 : 2;
        steps.forEach((s, i) => s.classList.toggle('is-on', i === k));
      },
    });
  }, { rootMargin: '100% 0px' }).observe(track);
})();

/* ---------------------------------------------------------------- products */
(() => {
  const grid = $('#prod-grid');
  const live = content.products.filter((p) => ['live', 'building', 'paused'].includes(p.status));
  const host = (u) => u.replace(/^https?:\/\//, '');
  live.forEach((p) => {
    const a = document.createElement('article');
    a.className = 'prod';
    a.innerHTML = `
      <figure class="prod-fig"><div class="tilt">
        <img src="assets/products/${p.id}.webp" srcset="assets/products/${p.id}.webp 1200w, assets/products/${p.id}@2x.webp 2400w" sizes="(max-width: 1000px) 100vw, 55vw" width="1200" height="900" loading="lazy" decoding="async" alt="The ${p.name} logo on a die-cut vinyl sticker, stuck onto an infrared museum plate."></div>
        <div class="holo" aria-hidden="true"></div></figure>
      <div class="prod-body">
        <h3 class="prod-name"></h3>
        <span class="prod-status px" data-s="${p.status}"><i aria-hidden="true"></i>${p.status}</span>
        <p class="prod-line"></p>
        ${p.figure ? `<p class="prod-fig-n"><b></b><span class="px"></span></p>` : ''}
        <ul class="prod-facts"></ul>
        <a class="prod-link ir-chroma" href="${p.url}" rel="noopener"><span>${host(p.url)}</span><span class="prod-since">· since ${p.since}</span></a>
      </div>`;
    const name = a.querySelector('.prod-name'); name.textContent = p.name;
    a.querySelector('.prod-line').textContent = p.line;
    if (p.figure) { a.querySelector('.prod-fig-n b').textContent = p.figure.value; a.querySelector('.prod-fig-n span').textContent = p.figure.label; }
    const ul = a.querySelector('.prod-facts'); (p.facts || []).forEach((f) => { const li = document.createElement('li'); li.textContent = f; ul.appendChild(li); });
    grid.appendChild(a);
    a.addEventListener('pointerenter', () => scramble(name, p.name, 380));
    if (fine && !reduce()) {
      const fig = a.querySelector('.prod-fig');
      fig.addEventListener('pointermove', (e) => {
        const r = fig.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        fig.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg'); fig.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
        fig.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); fig.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      });
      fig.addEventListener('pointerleave', () => ['--rx', '--ry'].forEach((k) => fig.style.removeProperty(k)));
    }
  });
  // SLAP the cards' figures in as they enter
  if (!reduce()) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      e.target.animate([{ opacity: 0, transform: 'translateY(40px) rotate(-1.5deg) scale(1.04)' }, { opacity: 1, transform: 'none' }],
        { duration: 900, easing: 'cubic-bezier(.16,1,.3,1)', delay: (e.target.dataset.i || 0) * 90, fill: 'backwards' });
    }), { threshold: 0.15 });
    $$('.prod', grid).forEach((el, i) => { el.dataset.i = i % 2; io.observe(el); });
  }

  // retired: sticker buttons with Radix-style hover cards
  const STAND = { luma: 'product-luma', 'polyglot-pilot': 'polyglot-pilot', pinpoint: 'pinpoint', webvakt: 'webvakt', 'joke-central': 'joke-central', 'tryggere-hyring': 'tryggere-hyring', 'early-apps': 'early-apps' };
  const rl = $('#retired-list');
  content.products.filter((p) => p.status === 'retired').forEach((p, i) => {
    const li = document.createElement('li'); li.className = 'ret'; li.style.setProperty('--ox', `${10 + (i % 4) * 25}%`);
    const id = `ret-${p.id}`;
    li.innerHTML = `<button type="button" aria-describedby="${id}"><img src="assets/stickers/${STAND[p.id] || 'spark'}.webp" alt="" loading="lazy" width="80" height="80"></button>
      <div class="card" role="tooltip" id="${id}" data-state="closed"><b></b><small class="px"></small><span></span></div>`;
    li.querySelector('button').setAttribute('aria-label', p.name);
    li.querySelector('b').textContent = p.name;
    li.querySelector('small').textContent = `Since ${p.since}${p.figure ? ` / ${p.figure.value} ${p.figure.label}` : ''} / retired`;
    li.querySelector('span').textContent = p.line;
    const card = li.querySelector('.card'), btn = li.querySelector('button');
    let t;
    const open = () => { clearTimeout(t); t = setTimeout(() => { card.dataset.state = 'open'; sfx.blip(440 + i * 60, 0.03); }, 120); };
    const close = () => { clearTimeout(t); card.dataset.state = 'closed'; };
    btn.addEventListener('pointerenter', open); btn.addEventListener('pointerleave', close);
    btn.addEventListener('focus', open); btn.addEventListener('blur', close);
    btn.addEventListener('click', () => (card.dataset.state === 'open' ? close() : open()));
    btn.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    rl.appendChild(li);
  });
})();

/* ---------------------------------------------------------------- depth: day job + voxel */
(() => {
  const ul = $('#dayjob');
  content.dayJob.forEach((d) => { const li = document.createElement('li'); li.textContent = d; ul.appendChild(li); });

  const el = $('#voxel'), seg = $('.seg'), btns = $$('button', seg);
  const poster = Object.assign(document.createElement('img'), { src: 'assets/brand/mark.svg', alt: '', className: 'voxel-poster' });
  el.appendChild(poster);
  let viewer = null;
  const select = (i, focus) => {
    btns.forEach((b, k) => { b.setAttribute('aria-checked', k === i); b.tabIndex = k === i ? 0 : -1; });
    seg.style.setProperty('--i', i); if (focus) btns[i].focus();
    viewer && viewer.setSrc(btns[i].dataset.src); sfx.blip(600 + i * 120, 0.04);
  };
  btns.forEach((b, i) => {
    b.tabIndex = i ? -1 : 0;
    b.addEventListener('click', () => select(i));
    b.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); select((i + 1) % btns.length, true); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); select((i + btns.length - 1) % btns.length, true); }
    });
  });
  new IntersectionObserver(async ([e], io) => {
    if (!e.isIntersecting) return; io.disconnect();
    try {
      const { mountVoxel } = await import('./assets/3d/voxel.js');
      const cur = btns.find((b) => b.getAttribute('aria-checked') === 'true');
      viewer = mountVoxel(el, { src: cur.dataset.src, pixel: 0.4, autoRotate: !reduce() });
      setTimeout(() => poster.remove(), 600);
    } catch { /* keep the poster */ }
  }, { rootMargin: '300px 0px' }).observe(el);
})();

/* ---------------------------------------------------------------- footer + egg */
$$('[data-email-text]').forEach((a) => { a.textContent = content.email; a.href = `mailto:${content.email}`; });
$$('[data-email-link]').forEach((a) => { a.href = `mailto:${content.email}`; });
$('.foot-avail').lastChild.textContent = content.availability;
thermalEasterEgg();
console.log('%c IR//PEEL ', 'background:#f315a2;color:#0d031e;font:12px monospace', 'Some things on this page only show up in infrared. Four letters. You have been doing it all along.');
