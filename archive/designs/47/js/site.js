// Albretsen AS / design 47 "Stille". No build step; ES modules only.
import { content } from '../../_shared/content.js';
import { createFeed } from '../../_shared/feed.js';

document.documentElement.classList.add('js');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const canVT = () => !!document.startViewTransition && !reduced();
const byId = Object.fromEntries(content.products.map((p) => [p.id, p]));

/* ------------------------------------------------------------------ sound (opt-in) */
const sound = (() => {
  let ctx = null, on = false;
  const btn = $('[data-sound]');
  btn.addEventListener('click', () => {
    on = !on;
    btn.setAttribute('aria-pressed', String(on));
    $('.sound__label', btn).textContent = on ? 'Sound on' : 'Sound off';
    if (on) { ctx ||= new AudioContext(); ctx.resume(); tock(0.6); }
  });
  // a ceramic tile set down on a painted board: a short knock and a faint glaze ring
  function tock(level = 1, pitch = 1) {
    if (!on || !ctx) return;
    const t = ctx.currentTime, out = ctx.createGain();
    out.gain.value = 0.22 * level; out.connect(ctx.destination);
    const len = Math.floor(ctx.sampleRate * 0.05), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const n = ctx.createBufferSource(); n.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400 * pitch; bp.Q.value = 1.4;
    n.connect(bp).connect(out); n.start(t);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(2350 * pitch, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.4);
  }
  return { tock };
})();

/* ------------------------------------------------------------------ the visitor log */
(() => {
  const list = $('[data-feed]'); if (!list) return;
  const feed = createFeed();
  const fmt = (d) => d.toTimeString().slice(0, 5);
  const tail = (e) => (e.ms ? `${e.ms} ms` : e.country ? e.country : e.city ? e.city : e.sha ? e.sha : '');
  const row = (e) => {
    const li = document.createElement('li');
    const time = document.createElement('time'); time.dateTime = e.time.toISOString(); time.textContent = fmt(e.time);
    const b = document.createElement('b'); b.textContent = e.label;
    const s = document.createElement('small'); s.textContent = [e.text, tail(e)].filter(Boolean).join(' · ');
    li.append(time, b, s); return li;
  };
  const N = 4;
  feed.recent(N).forEach((e) => list.append(row(e)));
  feed.subscribe((e) => {
    if (reduced()) return; // the calm version keeps a still log
    list.prepend(row(e));
    while (list.children.length > N) list.lastElementChild.remove();
  });
})();

/* ------------------------------------------------------------------ copy the MCP line */
(() => {
  const btn = $('[data-copy]'); if (!btn) return;
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(content.mcpCommand); }
    catch { const r = document.createRange(); r.selectNodeContents($('.tag__cmd')); getSelection().removeAllRanges(); getSelection().addRange(r); }
    btn.classList.remove('is-done'); void btn.offsetWidth; btn.classList.add('is-done');
    btn.textContent = 'Copied'; sound.tock(0.5, 1.3);
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('is-done'); }, 2200);
  });
})();

/* ------------------------------------------------------------------ phone: start the panned photo near MCP Emails */
(() => {
  const sc = $('[data-pan]'); if (!sc) return;
  const place = () => { if (matchMedia('(max-width: 720px)').matches) sc.scrollLeft = sc.scrollWidth * 0.255 - 16; else sc.scrollLeft = 0; };
  place(); addEventListener('load', place, { once: true });
})();

/* ------------------------------------------------------------------ archive: plaster casts (from content.js) */
const RETIRED = ['luma', 'polyglot-pilot', 'pinpoint', 'webvakt', 'joke-central', 'tryggere-hyring', 'early-apps'];
const SHORT = { 'joke-central': 'Joke Central', 'early-apps': 'Early apps' };
(() => {
  const ul = $('[data-casts]'); if (!ul) return;
  for (const id of RETIRED) {
    const p = byId[id];
    const li = document.createElement('li');
    li.className = 'cast'; li.dataset.id = id;
    li.setAttribute('aria-label', `${p.name}, ${p.since}, retired. ${p.line}`);
    li.innerHTML = `<img class="cast__img" src="assets/retired/objects/${id}.webp" width="516" height="392" alt="" loading="lazy" decoding="async" draggable="false">
      <span class="cast__name"></span><span class="cast__meta mono"></span>
      <div class="hc" role="presentation"><b></b><span></span></div>`;
    $('.cast__name', li).textContent = SHORT[id] || p.name;
    $('.cast__meta', li).textContent = `${p.since} · ${p.figure ? `${p.figure.value} ${p.figure.label}` : 'retired'}`;
    $('.hc b', li).textContent = p.name;
    $('.hc span', li).textContent = p.line;
    ul.append(li);
  }
})();

/* ------------------------------------------------------------------ day job + posts */
(() => {
  const dj = $('[data-dayjob]');
  content.dayJob.forEach((t) => { const li = document.createElement('li'); li.textContent = t; dj.append(li); });
  const ol = $('[data-posts]');
  const f = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  content.posts.forEach((p) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="/blog/${p.slug}"><span></span><time datetime="${p.date}"></time></a>`;
    $('span', li).textContent = p.title; $('time', li).textContent = f.format(new Date(p.date));
    ol.append(li);
  });
})();

/* ------------------------------------------------------------------ RESHELVE: drag to rearrange anything */
const NAMES = { 'aniline-cube': 'The violet cube', ...Object.fromEntries(content.products.map((p) => [p.id, SHORT[p.id] || p.name])) };
const live = document.createElement('div');
live.className = 'skip'; live.setAttribute('aria-live', 'polite'); live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)';
document.body.append(live);

const vt = (fn) => {
  if (!canVT()) { fn(); return null; }
  return document.startViewTransition(fn);
};

function reshelve(list, { prefix, onMove, onDrop } = {}) {
  const kids = () => [...list.children];
  const vtName = (el) => `${prefix}-${el.dataset.id}`;
  kids().forEach((el) => {
    el.style.viewTransitionName = vtName(el);
    el.style.viewTransitionClass = 'shelf-item';
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    el.addEventListener('dragstart', (e) => e.preventDefault());
  });
  list.setAttribute('aria-roledescription', 'rearrangeable shelf');

  let drag = null, sx = 0, sy = 0, running = null, moved = false;
  const move = (el, before, extra) => {
    running?.skipTransition?.();
    const t = vt(() => { list.insertBefore(el, before); extra && extra(); });
    running = t; t?.finished.finally(() => { if (running === t) running = null; });
  };
  const announce = (el) => {
    const i = kids().indexOf(el) + 1;
    live.textContent = `${NAMES[el.dataset.id] || el.dataset.id}, position ${i} of ${kids().length}`;
  };

  list.addEventListener('pointerdown', (e) => {
    const el = e.target.closest(`[data-id]`);
    if (!el || el.parentElement !== list || e.button > 0) return;
    if (e.target.closest('a')) return;
    drag = el; sx = e.clientX; sy = e.clientY; moved = false;
  });
  list.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!drag.classList.contains('is-dragging')) {
      if (Math.hypot(dx, dy) < 7) return;
      drag.setPointerCapture(e.pointerId);
      drag.classList.add('is-dragging'); drag.style.viewTransitionName = 'none'; moved = true;
      sound.tock(0.35, 0.8);
    }
    drag.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.max(-5, Math.min(5, dx / 50))}deg)`;
    const target = kids().find((k) => {
      if (k === drag) return false;
      const b = k.getBoundingClientRect();
      return e.clientX > b.left && e.clientX < b.right && e.clientY > b.top - 40 && e.clientY < b.bottom + 40;
    });
    if (!target) return;
    const tb = target.getBoundingClientRect();
    const after = e.clientX > tb.left + tb.width / 2;
    const ref = after ? target.nextElementSibling : target;
    if (ref === drag || ref === drag.nextElementSibling) return;
    const before = drag.getBoundingClientRect();
    drag.style.transform = '';
    const b0 = drag.getBoundingClientRect();
    move(drag, ref, () => onMove && onMove(kids().map((k) => k.dataset.id)));
    const b1 = drag.getBoundingClientRect();
    sx += b1.left - b0.left; sy += b1.top - b0.top; // stay under the pointer after the DOM move
    void before;
    drag.style.transform = `translate(${e.clientX - sx}px, ${e.clientY - sy}px)`;
  });
  const end = () => {
    if (!drag) return;
    const el = drag; drag = null;
    if (!el.classList.contains('is-dragging')) return;
    el.style.viewTransitionName = vtName(el);
    el.style.viewTransitionClass = 'shelf-dropped';
    const t = vt(() => { el.classList.remove('is-dragging'); el.style.transform = ''; });
    if (t) t.finished.finally(() => { el.style.viewTransitionClass = 'shelf-item'; });
    else el.style.viewTransitionClass = 'shelf-item';
    setTimeout(() => sound.tock(1, 1), canVT() ? 260 : 0);
    announce(el);
    onDrop && onDrop(kids().map((k) => k.dataset.id));
  };
  list.addEventListener('pointerup', end);
  list.addEventListener('pointercancel', end);
  // a drag must not also count as a click
  list.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  list.addEventListener('keydown', (e) => {
    const el = e.target.closest('[data-id]');
    if (!el || el.parentElement !== list || !e.altKey) return;
    let ref;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { if (!el.previousElementSibling) return; ref = el.previousElementSibling; }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { if (!el.nextElementSibling) return; ref = el.nextElementSibling.nextElementSibling; }
    else return;
    e.preventDefault();
    el.style.viewTransitionClass = 'shelf-dropped';
    move(el, ref, () => onMove && onMove(kids().map((k) => k.dataset.id)));
    running?.finished.finally(() => { el.style.viewTransitionClass = 'shelf-item'; });
    el.focus(); sound.tock(0.8, 1); announce(el);
    onDrop && onDrop(kids().map((k) => k.dataset.id));
  });
  return { order: () => kids().map((k) => k.dataset.id), list };
}

// Shelf and catalogue keep the same order, whichever one you move.
const shelfEl = $('[data-shelf]'), cardsEl = $('[data-cards]'), orderEl = $('[data-order]');
const syncTo = (target, ids) => {
  const map = Object.fromEntries([...target.children].map((c) => [c.dataset.id, c]));
  const want = ids.filter((id) => map[id]);
  const rest = [...target.children].filter((c) => !want.includes(c.dataset.id));
  // keep items the other list does not have (the cube) where they are relative to their neighbours
  const current = [...target.children].map((c) => c.dataset.id);
  if (want.join() === current.filter((id) => want.includes(id)).join()) return;
  const merged = [];
  let wi = 0;
  for (const id of current) merged.push(want.includes(id) ? want[wi++] : id);
  merged.forEach((id) => target.append(map[id]));
  void rest;
};
const describeOrder = (ids) => {
  orderEl.innerHTML = '';
  ids.forEach((id, i) => {
    const b = document.createElement(id === 'aniline-cube' ? 'span' : 'b');
    b.textContent = id === 'aniline-cube' ? '■' : NAMES[id];
    if (id === 'aniline-cube') b.style.color = 'var(--aniline)';
    orderEl.append(b);
    if (i < ids.length - 1) orderEl.append(document.createTextNode('  ·  '));
  });
};
const shelf = reshelve(shelfEl, { prefix: 'obj', onMove: (ids) => syncTo(cardsEl, ids), onDrop: describeOrder });
reshelve(cardsEl, { prefix: 'card', onMove: (ids) => syncTo(shelfEl, ids), onDrop: () => describeOrder(shelf.order()) });
reshelve($('[data-casts]'), { prefix: 'cast' });
describeOrder(shelf.order());

/* ------------------------------------------------------------------ VITRINE: open an object into its catalogue plate */
(() => {
  const dlg = $('[data-vitrine]'); if (!dlg) return;
  const img = $('[data-v-img]'), media = $('.vitrine__media'), logo = $('[data-v-logo]');
  const LOGOS = { 'mcp-emails': 'products/real/mcp-emails-mark.svg', 'fun-libs': 'products/real/fun-libs-icon.png', toolrails: 'products/real/toolrails-icon.svg', harbor: 'products/real/harbor-mark-filled.svg' };
  const LIVE = ['mcp-emails', 'fun-libs', 'toolrails', 'harbor'];
  let source = null;

  function fill(id) {
    const p = byId[id];
    const isLive = LIVE.includes(id), isCube = id === 'aniline-cube';
    media.classList.toggle('is-object', !isLive);
    img.src = isLive ? `assets/products/${id}@2x.webp` : isCube ? 'assets/extras/aniline-cube.webp' : `assets/retired/objects/${id}.webp`;
    img.alt = isCube ? 'A small violet cube.' : `${p.name}, photographed as ${isLive ? 'a glazed tile' : id === 'luma' ? 'a tile with its own wordmark' : 'a plaster cast'}.`;
    logo.hidden = !LOGOS[id]; if (LOGOS[id]) logo.src = `assets/${LOGOS[id]}`;
    $('[data-v-name]').textContent = isCube ? 'Aniline violet' : p.name;
    const status = isCube ? '' : p.status === 'building' ? 'building' : p.status;
    $('[data-v-no]').textContent = isCube ? 'Not catalogued' : `${status} · since ${p.since}`;
    $('[data-v-line]').textContent = isCube
      ? 'The first synthetic dye, made by accident in a London lab in 1856. It is on the shelf as a reminder that chemistry became an industry. It is not for sale.'
      : p.line;
    const fig = $('[data-v-fig]'); fig.innerHTML = '';
    if (p?.figure) { fig.innerHTML = '<span class="card__val"></span> <span class="mono"></span>'; fig.children[0].textContent = p.figure.value; fig.children[1].textContent = p.figure.label; }
    fig.hidden = !p?.figure;
    const facts = $('[data-v-facts]'); facts.innerHTML = '';
    (p?.facts || []).forEach((f) => { const li = document.createElement('li'); li.textContent = f; facts.append(li); });
    const a = $('[data-v-link]');
    a.hidden = !p?.url; if (p?.url) { a.href = p.url; a.textContent = `${p.url.replace('https://', '')} ↗`; }
    $('[data-v-credit]').textContent = isLive
      ? 'Photograph: the real icon as a glazed tile, rendered from primitives in three.js, 40 samples.'
      : isCube ? 'Cut-out, rendered from primitives.' : 'Plaster cast: a stand-in for a retired product with no surviving brand.';
  }

  async function open(id, from) {
    if (id === 'archive') { $('#archive').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }); return; }
    source = from;
    fill(id);
    try { await img.decode(); } catch {}
    sound.tock(0.7, 0.9);
    if (!canVT()) { dlg.showModal(); return; }
    document.documentElement.classList.add('vt-vitrine');
    from.style.viewTransitionName = 'vitrine';
    const t = document.startViewTransition(() => {
      from.style.viewTransitionName = '';
      dlg.showModal();
      img.style.viewTransitionName = 'vitrine';
    });
    t.finished.finally(() => { img.style.viewTransitionName = ''; document.documentElement.classList.remove('vt-vitrine'); });
  }

  function close() {
    if (!dlg.open) return;
    if (!canVT() || !source) { dlg.close(); source?.focus(); return; }
    document.documentElement.classList.add('vt-vitrine');
    img.style.viewTransitionName = 'vitrine';
    const from = source;
    const t = document.startViewTransition(() => {
      img.style.viewTransitionName = '';
      dlg.close();
      from.style.viewTransitionName = 'vitrine';
    });
    t.finished.finally(() => { from.style.viewTransitionName = ''; document.documentElement.classList.remove('vt-vitrine'); from.focus({ preventScroll: true }); });
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]'); if (!b || dlg.contains(b)) return;
    e.preventDefault();
    open(b.dataset.open, b.closest('.card')?.querySelector('.card__photo') || b);
  });
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  $('form', dlg).addEventListener('submit', (e) => { e.preventDefault(); close(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
})();

/* ------------------------------------------------------------------ FLATBED: plates scan in */
(() => {
  const els = $$('.doors__plate, .reading__plate, .foot__gable');
  els.forEach((el) => el.classList.add('flatbed'));
  const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.2 });
  els.forEach((el) => io.observe(el));
})();

/* ------------------------------------------------------------------ magnetic email */
(() => {
  const m = $('[data-magnet]'); if (!m || !matchMedia('(hover: hover)').matches) return;
  m.addEventListener('pointermove', (e) => {
    if (reduced()) return;
    const r = m.getBoundingClientRect();
    m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.12}px, ${(e.clientY - r.top - r.height / 2) * 0.25}px)`;
  });
  m.addEventListener('pointerleave', () => { m.style.transition = 'transform .7s cubic-bezier(.3,1.35,.45,1), color .4s, border-color .4s'; m.style.transform = ''; setTimeout(() => (m.style.transition = ''), 700); });
})();

/* ------------------------------------------------------------------ pick up the shelf: the live three.js scene, on request */
(() => {
  const btn = $('[data-pickup]'), host = $('[data-live]'), cap = $('[data-handle-cap]');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    btn.disabled = true; btn.lastChild.textContent = 'Lifting…';
    try {
      host.hidden = false;
      const { mountShelf } = await import('../assets/three/shelf-live.js');
      await mountShelf(host, {
        view: 'retired',
        onReorder: (ids) => { cap.textContent = `Live. Order: ${ids.map((id) => NAMES[id] || id).join(' · ')}.`; sound.tock(0.6, 0.85); },
      });
      requestAnimationFrame(() => requestAnimationFrame(() => host.classList.add('is-on')));
      btn.classList.add('is-gone');
      cap.textContent = 'Live. Drag a cast along the shelf; the others make room. The stacked casts stay put.';
    } catch (err) {
      btn.disabled = false; btn.lastChild.textContent = 'Pick up the shelf';
      cap.textContent = 'The live scene could not load here. The photograph is the same shelf.';
      host.hidden = true;
    }
  });
})();
