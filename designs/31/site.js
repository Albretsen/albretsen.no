// Honest Deck — homepage behaviour.
// Hero: the pre-rendered deal (assets/sequence) scrubbed on a canvas by Motion's scroll().
// Products: tilt cards, a lazy live three.js deck, a live feed ("table talk"), and a folded pile you can throw around.
// Signature: keyboard shortcuts with a visible "House rules" sheet (assets/shortcuts.js).
import { animate, stagger, scroll, tilt, ping } from './assets/motion.js';
import { shortcuts } from './assets/shortcuts.js';
import { createFeed } from '../_shared/feed.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
// once(): run fn the first time an element is well into the viewport (60% of it, or `amount` of the screen).
// A plain scroll check (not IntersectionObserver) so captions stay locked to scroll position, like the frames.
const once = (els, fn, amount = 0.3) => {
  let pending = [...els];
  let queued = false;
  const check = () => {
    queued = false;
    pending = pending.filter((el) => {
      const r = el.getBoundingClientRect();
      if (innerHeight - r.top > Math.min(r.height * 0.6, innerHeight * amount) && r.bottom > 0) { fn(el); return false; }
      return true;
    });
    if (!pending.length) removeEventListener('scroll', onS);
  };
  const onS = () => { if (!queued) { queued = true; requestAnimationFrame(check); } };
  addEventListener('scroll', onS, { passive: true });
  addEventListener('resize', onS);
  onS();
};

// deal(): the kit's entrance (assets/motion.js), rewritten on Motion's independent transforms so it composes
// with CSS rotate/translate. Cards leave a deck point, flip face up mid-air (rotateY 180 -> 0) and land on a spring.
function deal(els, { deck, gap = 0.08, from = 'first' } = {}) {
  const o = deck?.getBoundingClientRect();
  const delay = stagger(gap, { from });
  els.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const dx = o ? o.left - (r.left + r.width / 2) : 0, dy = o ? o.top - (r.top + r.height / 2) : 220;
    el.style.transformPerspective = '800px';
    animate(el, { x: [dx, 0], y: [dy, 0], rotateY: [180, 0], rotate: [((i * 37) % 9) - 4, 0], scale: [0.85, 1], opacity: [0, 1] },
      { type: 'spring', stiffness: 170, damping: 19, mass: 0.9, delay: delay(i, els.length), opacity: { duration: 0.25, delay: delay(i, els.length) } });
  });
}

/* ------------------------------------------------------------------ sound (opt-in): a synthesised card snap */
const sound = (() => {
  let on = false, ctx = null;
  const btn = $('#sound');
  const set = (v) => { on = v; btn.setAttribute('aria-pressed', String(v)); btn.querySelector('b').textContent = v ? 'on' : 'off'; if (v) snap(0, 1.2); };
  function snap(delay = 0, gain = 1) {
    if (!on) return;
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime + delay, len = 0.07;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 6);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800 + Math.random() * 1600; bp.Q.value = 1.4;
    const g = ctx.createGain(); g.gain.value = 0.28 * gain;
    src.connect(bp).connect(g).connect(ctx.destination); src.start(t);
  }
  btn.addEventListener('click', () => set(!on));
  return { snap, toggle: () => set(!on), riffle: (n = 8) => { for (let i = 0; i < n; i++) snap(i * 0.055, 0.7); } };
})();

/* ------------------------------------------------------------------ top bar turns solid after the hero */
const bar = $('#bar');
const hero = $('#top');
const onScroll = () => bar.classList.toggle('is-solid', scrollY > hero.offsetHeight - innerHeight * 1.05);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ------------------------------------------------------------------ HERO: image-sequence scrub
   Same idea as assets/motion.js scrubSequence(), extended: coarse-to-fine preloading (every 8th frame first,
   so a fast scroll always has a nearby frame), redraw when a closer frame arrives, a held ending, and a HUD. */
const scrub = (() => {
  if (reduce) { document.documentElement.classList.remove('js-scrub'); return null; }
  document.documentElement.classList.add('js-scrub');
  const canvas = $('#scrub'), ctx = canvas.getContext('2d');
  const ticks = $('#hud-ticks'), hudFrame = $('#hud-frame'), hudCount = $('#hud-count');
  const HOLD = 0.86; // the last 14% of the hero holds on the dealt fan
  let set = null, frames = [], want = 0, shown = -1, stop = null;

  function build() {
    const tall = innerWidth / innerHeight < 0.8;
    const next = tall ? { base: 'assets/sequence/tall', count: 48 } : { base: 'assets/sequence/wide', count: 64 };
    if (set && set.base === next.base) return;
    set = next; frames = new Array(set.count); shown = -1;
    ticks.style.setProperty('--n', set.count);
    ticks.innerHTML = '<i></i>'.repeat(set.count);
    hudCount.textContent = String(set.count - 1).padStart(3, '0');
    const order = [0, set.count - 1];
    for (let step of [8, 4, 2, 1]) for (let i = 0; i < set.count; i += step) if (!order.includes(i)) order.push(i);
    const base = set.base;
    let k = 0;
    const pump = () => {
      // keep 6 requests in flight
      while (k < order.length && frames.filter((f) => f && !f.complete).length < 6) {
        const i = order[k++];
        const img = new Image(); img.decoding = 'async';
        img.onload = img.onerror = () => { if (set.base !== base) return; if (Math.abs(i - want) < Math.abs(shown - want) || shown < 0) draw(); pump(); };
        img.src = `${base}/deal-${String(i).padStart(3, '0')}.webp`;
        frames[i] = img;
      }
    };
    pump();
  }
  const ok = (img) => img && img.complete && img.naturalWidth;
  function nearest(i) {
    for (let d = 0; d < frames.length; d++) { if (ok(frames[i - d])) return i - d; if (ok(frames[i + d])) return i + d; }
    return -1;
  }
  function fit() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(canvas.clientWidth * dpr); canvas.height = Math.round(canvas.clientHeight * dpr);
    shown = -1; draw();
  }
  function draw() {
    const k = nearest(want);
    if (k < 0 || k === shown) return;
    shown = k;
    const img = frames[k], cw = canvas.width, ch = canvas.height, iw = img.naturalWidth, ih = img.naturalHeight;
    // Landscape: fit the full width so the whole fan stays in frame, and extend the sky and floor by
    // stretching the frame's own top and bottom rows into the bands. Portrait: cover (the cascade is narrow).
    const landscape = cw >= ch;
    const s = landscape ? cw / iw : Math.max(cw / iw, ch / ih);
    const w = iw * s, h = ih * s, x = (cw - w) / 2;
    const y = landscape && h < ch ? ch - h : (ch - h) / 2; // bottom-aligned: only the smooth sky gets extended
    if (y > 0) ctx.drawImage(img, 0, 0, iw, 1, x, 0, w, Math.ceil(y) + 1);
    ctx.drawImage(img, x, y, w, h);
    canvas.classList.add('is-ready');
  }
  let lastTick = -1;
  // caption cards are keyed to frames: each one is dealt in for its stretch of the deal and folded away after it
  const intro = $('.hero__intro');
  const beats = [[$('.beat--a'), 0.12, 0.42], [$('.beat--b'), 0.46, 0.76], [$('.beat--c'), 0.8, 2]].map(([el, a, b]) => ({ el, a, b, on: false }));
  function beat(bt, on) {
    if (bt.on === on) return;
    bt.on = on;
    const el = bt.el;
    el.style.transformPerspective = '900px';
    if (on) {
      el.style.visibility = 'visible';
      animate(el, { opacity: [0, 1], y: [70, 0], rotateY: [80, 0] }, { type: 'spring', stiffness: 160, damping: 17, opacity: { duration: 0.25 } });
      sound.snap();
    } else {
      animate(el, { opacity: 0, y: -40, rotateY: -60 }, { duration: 0.28, ease: [0.4, 0, 1, 1] })
        .then(() => { if (!bt.on) el.style.visibility = 'hidden'; });
    }
  }
  function setProgress(p) {
    const n = set.count;
    const k = clamp(p / 0.12, 0, 1);
    intro.style.opacity = String(1 - k);
    intro.style.transform = `translateY(${-k * 18}vh)`;
    intro.style.visibility = k >= 1 ? 'hidden' : '';
    beats.forEach((bt) => beat(bt, p >= bt.a && p < bt.b));
    want = Math.round(clamp(p / HOLD, 0, 1) * (n - 1));
    draw();
    if (want !== lastTick) {
      lastTick = want;
      hudFrame.textContent = String(want).padStart(3, '0');
      [...ticks.children].forEach((t, i) => { t.className = i === want ? 'now' : i < want ? 'on' : ''; });
    }
  }
  build();
  new ResizeObserver(() => { build(); fit(); }).observe(canvas);
  stop = scroll((p) => setProgress(p), { target: hero, offset: ['start start', 'end end'] });
  // J / K step one frame by moving the page to that frame's scroll position
  function step(dir) {
    const n = set.count, range = hero.offsetHeight - innerHeight;
    const f = clamp(want + dir, 0, n - 1);
    scrollTo({ top: hero.offsetTop + (f / (n - 1)) * HOLD * range + 1, behavior: 'instant' });
    sound.snap();
  }
  return { step, destroy: () => stop?.() };
})();

/* ------------------------------------------------------------------ hero entrance: the copy is dealt */
if (!reduce) {
  const intro = $('.hero__intro');
  animate([$('.eyebrow', intro), $('h1', intro), $('.hero__lede', intro)],
    { opacity: [0, 1], y: [40, 0], rotate: [-2, 0] }, { type: 'spring', stiffness: 140, damping: 18, delay: stagger(0.09, { startDelay: 0.1 }) });
  // the status chips fly in from the deck on the floor, flipping face up on the way
  const anchor = document.createElement('div');
  anchor.style.cssText = 'position:absolute;left:50%;top:62%;width:1px;height:1px;pointer-events:none';
  $('.hero__stage').append(anchor);
  $$('.hero__score .chip').forEach((c) => { c.style.opacity = 0; });
  deal($$('.hero__score .chip'), { deck: anchor, gap: 0.09, from: 'first' });
  setTimeout(() => sound.riffle(4), 300);

}

/* copy button */
$$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
  const text = $(btn.dataset.copy).textContent.trim();
  try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied'; } catch { btn.textContent = 'Select it'; }
  btn.classList.add('is-done'); ping(btn); sound.snap();
  setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('is-done'); }, 1600);
}));

/* ------------------------------------------------------------------ products: tilt + orb parallax + reveal */
$$('[data-tilt]').forEach((el) => tilt(el, { max: 7, lift: 8 }));
if (!reduce) {
  const orb = $('.orb');
  scroll(animate(orb, { y: [-60, 140], rotate: [-12, 18] }, { ease: 'linear' }), { target: $('#hand'), offset: ['start end', 'end start'] });
  $$('.pcard').forEach((c) => { c.style.opacity = 0; });
  once([$('.faceup')], (list) => {
    const cards = $$('.pcard', list);
    deal(cards, { gap: 0.09, from: 'first' });
    sound.riffle(cards.length);
  }, 0.12);
}

/* ------------------------------------------------------------------ the live deck (lazy) */
const deckCanvas = $('#deck');
const deckInfo = $('#deck-info');
let deckPromise = null;
function ensureDeck() {
  if (deckPromise) return deckPromise;
  deckPromise = import('./assets/3d/deck-scene.js').then(async ({ createDeck }) => {
    const tall = deckCanvas.clientWidth / Math.max(1, deckCanvas.clientHeight) < 0.9;
    const deck = await createDeck(deckCanvas, { live: true, mood: 'candy', tall });
    deckCanvas.classList.add('is-ready');
    let last;
    (function watch() {
      const h = deck.hovered?.userData?.data;
      if (h !== last) {
        last = h;
        if (h) {
          const fig = h.fig && h.fig !== '—' ? ` <b>${h.fig}</b> ${h.figLabel}.` : '';
          deckInfo.innerHTML = `<b>${h.name}</b> · ${h.status === 'retired' ? 'folded' : h.status}, since ${h.since}.${fig}`;
          sound.snap(0, 0.5);
        } else deckInfo.textContent = 'Hover a card. D deals, S shuffles, F folds.';
      }
      requestAnimationFrame(watch);
    })();
    return deck;
  }).catch((err) => { deckInfo.textContent = 'The live deck needs WebGL. The picture behind this is the same scene.'; console.warn(err); return null; });
  return deckPromise;
}
const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); ensureDeck(); } }, { rootMargin: '400px 0px' });
io.observe(deckCanvas);
const deckAct = (what) => ensureDeck().then((d) => {
  if (!d) return;
  if (what === 'deal') d.deal(); else if (what === 'shuffle') d.shuffle(); else d.collect();
  sound.riffle(what === 'fold' ? 5 : 8);
  ping($(`[data-deck="${what}"]`));
});
$$('[data-deck]').forEach((b) => b.addEventListener('click', () => deckAct(b.dataset.deck)));
const toTable = () => {
  const r = $('#table').getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) $('#table').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
};

/* ------------------------------------------------------------------ table talk: the live feed */
(() => {
  const list = $('#talk');
  const feed = createFeed();
  const COL = { 'mcp-emails': 'var(--hd-apple)', 'fun-libs': 'var(--hd-lemon)', toolrails: 'var(--hd-ice)', 'albretsen.no': 'var(--hd-bubble)' };
  const fmt = (d) => d.toTimeString().slice(0, 8);
  const extra = (e) => e.ms ? `${e.ms} ms` : e.country ? e.country : e.city ? `${e.city}, ${e.kb} KB` : e.sha ? e.sha : '';
  const item = (e) => {
    const li = document.createElement('li');
    li.style.setProperty('--c', COL[e.product] || 'var(--hd-lilac)');
    li.innerHTML = `<i></i><b>${e.label}: ${e.text}</b><span>${fmt(e.time)}${extra(e) ? ' · ' + extra(e) : ''}</span>`;
    return li;
  };
  feed.recent(7).forEach((e) => list.append(item(e)));
  feed.subscribe((e) => {
    const li = item(e);
    list.prepend(li);
    while (list.children.length > 9) list.lastElementChild.remove();
    if (!reduce) animate(li, { opacity: [0, 1], y: [-30, 0], rotateX: [80, 0] }, { type: 'spring', stiffness: 220, damping: 20, opacity: { duration: 0.25 } });
  });
})();

/* ------------------------------------------------------------------ the folded pile: drag, throw, pick up */
const pile = (() => {
  const felt = $('#felt');
  const cards = $$('.fcard', felt);
  const st = cards.map(() => ({ x: 0, y: 0, r: 0, s: 1 }));
  let z = 10;
  const apply = (i) => { const s = st[i]; cards[i].style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.r}deg) scale(${s.s})`; };
  felt.classList.add('is-live');

  function bounds(i) {
    const W = felt.clientWidth, H = felt.clientHeight, w = cards[i].offsetWidth, h = cards[i].offsetHeight;
    return { W, H, w, h, maxX: W - w - 10, maxY: H - h - 10 };
  }
  function layout() {
    cards.forEach((c, i) => {
      const { W, H, w, h } = bounds(i);
      const n = cards.length, narrow = W < 560;
      const cols = narrow ? 4 : n, row = narrow ? (i < 4 ? 0 : 1) : 0, col = narrow ? (i < 4 ? i : i - 4 + 0.5) : i;
      const fx = (col + 0.5) / cols, jitter = Math.sin(i * 12.9898) * 0.5;
      st[i].x = clamp(fx * W - w / 2 + jitter * 18, 10, W - w - 10);
      st[i].y = clamp((narrow ? (row ? 0.62 : 0.3) : 0.48 + Math.sin(i * 1.7) * 0.12) * H - h / 2 + jitter * 24, 10, H - h - 10);
      st[i].r = Math.sin(i * 4.1) * 14;
      c.style.zIndex = i + 1;
      apply(i);
    });
  }
  layout();
  new ResizeObserver(() => cards.forEach((_, i) => { const b = bounds(i); st[i].x = clamp(st[i].x, 10, b.maxX); st[i].y = clamp(st[i].y, 10, b.maxY); apply(i); })).observe(felt);
  // fonts/images can change card heights after first layout
  addEventListener('load', layout);

  const pickName = $('#pickup-name'), pickLine = $('#pickup-line'), pickMeta = $('#pickup-meta'), pickup = $('#pickup');
  function pick(i) {
    const c = cards[i];
    cards.forEach((x) => x.classList.remove('is-picked'));
    c.classList.add('is-picked');
    pickName.textContent = c.dataset.name;
    pickLine.textContent = c.dataset.line;
    pickMeta.textContent = `Since ${c.dataset.since}${c.dataset.fig ? ' · ' + c.dataset.fig : ''} · folded`;
    if (!reduce) animate($('.pickup__text', pickup), { opacity: [0, 1], y: [16, 0], rotateX: [50, 0] }, { type: 'spring', stiffness: 260, damping: 22, opacity: { duration: 0.2 } });
  }

  const anims = [];
  function stopAnims(i) { (anims[i] || []).forEach((a) => a.stop?.()); anims[i] = []; }
  function springTo(i, to, vel = {}) {
    stopAnims(i);
    const s = st[i];
    for (const k of Object.keys(to)) {
      if (reduce) { s[k] = to[k]; apply(i); continue; }
      anims[i].push(animate(s[k], to[k], { type: 'spring', stiffness: k === 'r' ? 120 : 160, damping: k === 'r' ? 10 : 18, velocity: vel[k] || 0, onUpdate: (v) => { s[k] = v; apply(i); } }));
    }
  }

  cards.forEach((c, i) => {
    let drag = null;
    c.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      stopAnims(i);
      c.setPointerCapture(e.pointerId);
      c.style.zIndex = ++z;
      drag = { sx: e.clientX, sy: e.clientY, ox: st[i].x, oy: st[i].y, lx: e.clientX, ly: e.clientY, lt: performance.now(), vx: 0, vy: 0, moved: false };
      springTo(i, { s: 1.08 });
    });
    c.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const now = performance.now(), dt = Math.max(1, now - drag.lt);
      drag.vx = drag.vx * 0.6 + ((e.clientX - drag.lx) / dt) * 1000 * 0.4;
      drag.vy = drag.vy * 0.6 + ((e.clientY - drag.ly) / dt) * 1000 * 0.4;
      drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = now;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (Math.hypot(dx, dy) > 4) drag.moved = true;
      const b = bounds(i);
      st[i].x = clamp(drag.ox + dx, -b.w * 0.3, b.W - b.w * 0.7);
      st[i].y = clamp(drag.oy + dy, -b.h * 0.3, b.H - b.h * 0.7);
      st[i].r = clamp(drag.vx * 0.012, -28, 28);
      apply(i);
    });
    const end = () => {
      if (!drag) return;
      const d = drag; drag = null;
      const b = bounds(i);
      const tx = clamp(st[i].x + d.vx * 0.16, 10, b.maxX), ty = clamp(st[i].y + d.vy * 0.16, 10, b.maxY);
      springTo(i, { x: tx, y: ty, r: Math.sin(i * 4.1 + tx * 0.01) * 14, s: 1 }, { x: d.vx, y: d.vy, r: d.vx * 0.02 });
      if (d.moved) sound.snap(0.12); else { pick(i); sound.snap(); }
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('click', (e) => { if (e.detail === 0) { c.style.zIndex = ++z; pick(i); sound.snap(); } }); // keyboard Enter/Space
    c.addEventListener('keydown', (e) => {
      const m = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }[e.key];
      if (!m) return;
      e.preventDefault();
      const b = bounds(i);
      springTo(i, { x: clamp(st[i].x + m[0], 10, b.maxX), y: clamp(st[i].y + m[1], 10, b.maxY) });
    });
  });

  return { scatter: () => { cards.forEach((_, i) => { const b = bounds(i); springTo(i, { x: Math.random() * b.maxX, y: 10 + Math.random() * (b.maxY - 10), r: (Math.random() - 0.5) * 50 }); }); sound.riffle(7); } };
})();

/* ------------------------------------------------------------------ house rules (signature delight) */
shortcuts([
  { key: 'd', label: 'Deal the live deck', run: () => { toTable(); deckAct('deal'); } },
  { key: 's', label: 'Shuffle, then deal', run: () => { toTable(); deckAct('shuffle'); } },
  { key: 'f', label: 'Fold (collect the deck)', run: () => { toTable(); deckAct('fold'); } },
  { key: 'j', label: 'Hero: one frame back', run: () => scrub?.step(-1) },
  { key: 'k', label: 'Hero: one frame forward', run: () => scrub?.step(1) },
  { key: 'g', label: 'Go to the folded pile and scatter it', run: () => { $('#folded').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); setTimeout(() => pile.scatter(), reduce ? 0 : 500); } },
  { key: 'm', label: 'Sound on or off', run: () => sound.toggle() },
]);
