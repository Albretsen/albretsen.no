/*
  site.js — design 56 "Honest Pixels" · homepage
  Loader (real bytes) → moodboard hero (drag, tidy, render modes) → develop band (scroll) → products.
*/
import { content } from '../../_shared/content.js';
import { createFeed } from '../../_shared/feed.js';
import { mountDither, resolveLoader, sampleLum, loadImage, PALETTE } from '../assets/js/dither.js';
import { moodboard, bayerWipe, countUp, resolveIn, bindScramble } from '../assets/motion.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const gsap = window.gsap;
// ?still renders the calm static version (used for screenshots); same as prefers-reduced-motion
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]still/.test(location.search);
const wide = () => matchMedia('(min-width: 900px) and (pointer: fine)').matches;
if (gsap && window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

/* ---------------- sound: off until asked ---------------- */
const sound = (() => {
  let ctx = null, on = false;
  const btn = $('[data-sound]');
  const blip = (f = 660, d = 0.035, type = 'square', vol = 0.035) => {
    if (!on || !ctx) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(0, t + d); // a hard 1-bit envelope
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d + 0.01);
  };
  btn?.addEventListener('click', () => {
    on = !on; ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (on) ctx.resume();
    btn.setAttribute('aria-pressed', on);
    const label = btn.querySelector('.a56-scramble'); label.textContent = label.dataset.text = on ? 'Sound on' : 'Sound off';
    on && blip(988, 0.05);
  });
  return { blip, tick: () => blip(1320, 0.012, 'square', 0.02) };
})();

/* ---------------- receipt: product events + what the visitor does ---------------- */
const receipt = (() => {
  const ol = $('[data-feed]'); const MAX = 7;
  const hhmm = d => d.toTimeString().slice(0, 8);
  const line = (time, what, meta, cls = '') => {
    const li = document.createElement('li'); li.className = cls;
    li.innerHTML = `<span class="t">${hhmm(time).slice(0, 5)}</span><span></span><span class="m"></span>`;
    li.children[1].textContent = what; li.children[2].textContent = meta || '';
    return li;
  };
  const push = (li, animate = true) => {
    if (!ol) return;
    animate && !reduce && li.classList.add('is-new');
    ol.prepend(li); while (ol.children.length > MAX) ol.lastElementChild.remove();
  };
  const metaOf = e => e.ms ? `${e.ms} ms` : e.country || e.city || (e.sha ? e.sha : '');
  const feed = createFeed();
  feed.recent(MAX).reverse().forEach(e => push(line(e.time, `${e.label}: ${e.text}`, metaOf(e)), false));
  feed.subscribe(e => push(line(e.time, `${e.label}: ${e.text}`, metaOf(e))));
  return { you: (what, meta) => push(line(new Date(), `you: ${what}`, meta, 'you')) };
})();

/* ---------------- ASCII render of a photograph into a canvas (timed, honestly) ---------------- */
const RAMP = ' .,:;-=+*x%#@';
function asciiInto(canvas, img) {
  const r = canvas.getBoundingClientRect(); if (!r.width) return 0;
  const t0 = performance.now(), dpr = Math.min(2, devicePixelRatio || 1);
  const cw = 5.4, ch = 9, cols = Math.ceil(r.width / cw), rows = Math.ceil(r.height / ch);
  canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
  const x = canvas.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const L = sampleLum(img, cols, rows, 1.15);
  x.fillStyle = PALETTE.ink; x.fillRect(0, 0, r.width, r.height);
  x.font = `${Math.round(ch * 0.95)}px "IBM Plex Mono", ui-monospace, Menlo, monospace`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const v = L[j * cols + i], c = RAMP[Math.min(RAMP.length - 1, (v * RAMP.length) | 0)];
    if (c === ' ') continue;
    x.fillStyle = v > 0.9 ? PALETTE.brass : v < 0.35 ? PALETTE.moss : PALETTE.cream2;
    x.fillText(c, i * cw + cw / 2, j * ch + ch / 2);
  }
  return performance.now() - t0;
}

/* ---------------- the board ---------------- */
const board = $('#board');
const tiles = $$('.piece[data-src]', board);
const live = $('.piece--live', board);
let liveCtl = null, mode = 'dither';

async function mountLive() {
  if (liveCtl || !live) return;
  const cv = $('[data-live]', live);
  try {
    liveCtl = await mountDither(cv, { src: 'assets/img/hero/pines-photo@1x.webp', mode: 'bayer', dot: 2, lensR: 72, breath: !reduce,
      dark: PALETTE.deep, light: PALETTE.cream, accent: PALETTE.brass });
    cv.classList.add('is-on'); live.classList.add('is-live');
    // fps, measured, not claimed
    const fpsEl = $('[data-fps]', live); let n = 0, t = performance.now();
    const count = now => { n++; if (now - t > 1000) { fpsEl.textContent = `${Math.round(n * 1000 / (now - t))} fps`; n = 0; t = now; } requestAnimationFrame(count); };
    requestAnimationFrame(count);
  } catch (e) { /* the static Bayer image stays */ }
}

function ensureLayers(p) {
  const stack = $('.stack', p);
  if (!$('.layer--photo', stack)) {
    const im = new Image(); im.className = 'layer layer--photo'; im.alt = ''; im.decoding = 'async';
    im.width = 480; im.height = 600; im.src = `img/truth/${p.dataset.src}.webp`;
    stack.appendChild(im);
  }
  if (!$('.layer--ascii', stack)) {
    const c = document.createElement('canvas'); c.className = 'layer layer--ascii'; c.setAttribute('aria-hidden', 'true');
    stack.appendChild(c);
  }
  return stack;
}
const ready = im => im.complete && im.naturalWidth ? Promise.resolve(im) : new Promise(r => { im.addEventListener('load', () => r(im), { once: true }); im.addEventListener('error', () => r(im), { once: true }); });

function show(stack, layer, delay) {
  const prev = $$('.layer.is-on', stack).filter(l => l !== layer);
  if (layer.classList.contains('is-on') && !prev.length) return;
  layer.style.setProperty('--d', `${delay}s`);
  layer.classList.add('is-on', 'is-top');
  if (reduce) { prev.forEach(l => l.classList.remove('is-on', 'is-top')); layer.classList.remove('is-top'); return; }
  layer.classList.remove('is-entering'); void layer.offsetWidth; layer.classList.add('is-entering');
  layer.addEventListener('animationend', () => {
    layer.classList.remove('is-entering', 'is-top');
    prev.forEach(l => l.classList.remove('is-on', 'is-top'));
  }, { once: true });
}

async function setMode(m) {
  if (m === mode) return; mode = m; board.dataset.mode = m;
  sound.blip(m === 'photo' ? 523 : m === 'ascii' ? 784 : 659, 0.06);
  // tiles
  tiles.forEach(async (p, i) => {
    const stack = ensureLayers(p), cap = $('[data-cap]', p);
    const photo = $('.layer--photo', stack), asc = $('.layer--ascii', stack), dith = $('.layer--dither', stack);
    const delay = i * 0.06;
    if (m === 'dither') { show(stack, dith, delay); cap.textContent = `${p.dataset.hdr} → ${p.dataset.algo}`; return; }
    await ready(photo);
    if (m === 'photo') { show(stack, photo, delay); cap.textContent = `${p.dataset.hdr} → photograph, graded 28%`; return; }
    const ms = asciiInto(asc, photo); show(stack, asc, delay);
    cap.textContent = `${p.dataset.hdr} → ASCII · ${ms.toFixed(1)} ms here`;
    asc.title = `Drawn in your browser in ${ms.toFixed(1)} ms`;
  });
  // the live piece
  if (live) {
    const stack = $('.stack', live), cv = $('[data-live]', stack), photo = $('.layer--photo', stack), cap = $('[data-cap]', live);
    if (m === 'photo') {
      if (!photo.src) photo.src = photo.dataset.src;
      await ready(photo); show(stack, photo, 0); cap.textContent = 'misty_pines.hdr → photograph, graded 28%';
    } else {
      if (liveCtl) liveCtl.mode = m === 'ascii' ? 'ascii' : 'bayer';
      show(stack, liveCtl ? cv : $('.layer--fallback', stack), 0);
      cap.textContent = m === 'ascii' ? 'misty_pines.hdr → ASCII, live' : 'misty_pines.hdr → bayer 8×8, live';
    }
  }
}
// re-draw ASCII tiles when they change size (tidy / scatter / resize)
const ro = new ResizeObserver(entries => {
  if (mode !== 'ascii') return;
  entries.forEach(en => { const p = en.target.closest('.piece'); const ph = $('.layer--photo', p), c = $('.layer--ascii', p); ph?.complete && c && asciiInto(c, ph); });
});
tiles.forEach(p => ro.observe($('.stack', p)));

/* Radix-style toggle group: role=radiogroup, roving tabindex, arrows/Home/End, thumb in pixel steps */
(function toggleGroup() {
  const g = $('[data-render]'); if (!g) return;
  const items = $$('button', g), thumb = $('.tg__thumb', g);
  const place = b => { thumb.style.width = `${b.offsetWidth}px`; thumb.style.transform = `translateX(${b.offsetLeft}px)`; };
  const select = (b, focus) => {
    items.forEach(x => { const on = x === b; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; });
    place(b); focus && b.focus(); setMode(b.dataset.mode);
  };
  items.forEach((b, i) => {
    b.setAttribute('data-scramble', '');
    b.addEventListener('click', () => select(b));
    b.addEventListener('keydown', e => {
      const k = e.key; let j = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % items.length;
      if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + items.length) % items.length;
      if (k === 'Home') j = 0; if (k === 'End') j = items.length - 1;
      if (j !== null) { e.preventDefault(); select(items[j], true); }
    });
  });
  const cur = () => items.find(b => b.getAttribute('aria-checked') === 'true');
  requestAnimationFrame(() => place(cur()));
  document.fonts?.ready.then(() => place(cur()));
  addEventListener('resize', () => place(cur()));
})();

/* moodboard: drag (pointer or keyboard), tidy / scatter with Flip */
let mb = null;
function wireBoard() {
  if (!gsap || !window.Draggable || !wide()) return;
  mb = moodboard(board);
  const pieces = $$('.a56-piece', board);
  mb.drags.forEach((d, i) => {
    const p = pieces[i]; let sx = 0, sy = 0;
    d.addEventListener('press', () => { sx = d.x; sy = d.y; sound.blip(880, 0.02); });
    d.addEventListener('release', () => {
      const dist = Math.round(Math.hypot(d.x - sx, d.y - sy));
      if (dist > 4) { sound.blip(440, 0.03); receipt.you(`moved ${p.dataset.name}`, `${dist} px`); }
    });
  });
  // keyboard: focus a piece, arrows move it 16 px (shift: 64)
  pieces.forEach((p, i) => {
    p.tabIndex = 0; p.setAttribute('role', 'group');
    p.setAttribute('aria-roledescription', 'movable piece');
    p.setAttribute('aria-label', `${p.dataset.name}. Arrow keys move it.`);
    p.addEventListener('keydown', e => {
      const step = e.shiftKey ? 64 : 16, dx = { ArrowLeft: -step, ArrowRight: step }[e.key] || 0, dy = { ArrowUp: -step, ArrowDown: step }[e.key] || 0;
      if (!dx && !dy) return; e.preventDefault();
      gsap.to(p, { x: `+=${dx}`, y: `+=${dy}`, duration: 0.18, ease: 'steps(3)', onComplete: () => mb.drags[i].update() });
      sound.tick(); receipt.you(`nudged ${p.dataset.name}`, `${Math.abs(dx || dy)} px`);
    });
  });
  const tidyBtn = $('[data-tidy]');
  tidyBtn?.addEventListener('click', () => {
    const tidy = tidyBtn.getAttribute('aria-pressed') !== 'true';
    tidy ? mb.tidy() : mb.scatter();
    tidyBtn.setAttribute('aria-pressed', tidy);
    const l = tidyBtn.querySelector('.a56-scramble'); l.textContent = l.dataset.text = tidy ? 'Scatter' : 'Tidy';
    sound.blip(tidy ? 330 : 990, 0.08); receipt.you(tidy ? 'tidied the board' : 'scattered the board', '');
    setTimeout(() => window.ScrollTrigger?.refresh(), 900);
  });
}

/* copy the MCP command */
$('[data-copy]')?.addEventListener('click', async e => {
  const b = e.currentTarget;
  try { await navigator.clipboard.writeText(content.mcpCommand); b.textContent = 'copied'; } catch { b.textContent = 'select it'; }
  b.classList.add('is-done'); sound.blip(1175, 0.05); receipt.you('copied the command', '');
  setTimeout(() => { b.textContent = 'copy'; b.classList.remove('is-done'); }, 1600);
});
$('[data-cmd]').textContent = content.mcpCommand;

/* the board arrives: pieces are pinned in stepped drops, the headline resolves */
function introBoard() {
  if (!gsap || reduce) return;
  const pieces = $$('.a56-piece', board);
  gsap.from(pieces, { y: -36, opacity: 0, duration: 0.42, ease: 'steps(4)', stagger: { each: 0.055, from: 'random' }, clearProps: 'opacity' });
  gsap.from('.h1__line > span', { clipPath: 'inset(0 100% 0 0)', duration: 0.5, ease: 'steps(8)', stagger: 0.12 });
  gsap.from('.lede, .hint, .hero .eyebrow', { opacity: 0, duration: 0.3, ease: 'steps(3)', stagger: 0.08, delay: 0.35 });
}

/* ---------------- the loader ---------------- */
async function runLoader() {
  const el = $('#loader');
  const finish = () => { el.classList.add('is-done'); el.setAttribute('aria-hidden', 'true'); };
  if (reduce || !gsap || /[?&]noloader/.test(location.search)) { finish(); return; }
  let seen = false; try { seen = sessionStorage.getItem('a56-seen') === '1'; sessionStorage.setItem('a56-seen', '1'); } catch {}
  let skipped = false;
  const skip = new Promise(r => $('[data-skip]', el).addEventListener('click', () => { skipped = true; r(); }, { once: true }));
  addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { $('[data-skip]', el).click(); removeEventListener('keydown', esc); } });
  await Promise.race([
    resolveLoader(el, { src: 'assets/img/hero/pines-photo@2x.webp', preview: 'assets/img/hero/pines-bayer@1x.webp', minMs: seen ? 900 : 2300 })
      .then(() => new Promise(r => setTimeout(r, 380))).catch(() => {}),
    skip,
  ]);
  await new Promise(res => bayerWipe({ mid: () => { finish(); introBoard(); res(); }, cell: 32, color: PALETTE.forest, dur: skipped ? 0.3 : 0.5 }));
}

/* ---------------- develop band: scroll rounds the creek down to one bit ---------------- */
function wireDevelop() {
  const sec = $('.develop'); if (!sec) return;
  const bits = $('[data-bits]', sec), algo = $('[data-algo-now]', sec);
  const share = ['0%', '12%', '25%', '50%', '75%', '100%'];
  const set = s => {
    if (sec.dataset.step === String(s)) return;
    sec.dataset.step = s;
    bits.textContent = share[s];
    algo.textContent = s === 0 ? 'photograph, 24-bit' : s === 5 ? 'atkinson, 1-bit' : 'photograph + atkinson';
    sound.tick();
  };
  if (reduce || !gsap || !window.ScrollTrigger) { set(3); return; }
  set(0);
  const pin = wide();
  window.ScrollTrigger.create({
    trigger: sec, start: pin ? 'top top' : 'top 70%', end: pin ? '+=120%' : 'bottom 30%',
    pin: pin ? $('.develop__pin', sec) : false, scrub: true,
    onUpdate: st => set(Math.min(5, Math.floor(st.progress * 6))),
  });
}

/* ---------------- products from content.js ---------------- */
const ASSET = {
  'mcp-emails': { logo: '../_shared/products/mcp-emails/icon.png', bg: 'misty_pines.hdr → ASCII fog' },
  'fun-libs': { logo: '../_shared/products/fun-libs/icon.png', bg: 'birchwood.hdr → bayer 8×8' },
  toolrails: { logo: '../_shared/products/toolrails/icon.svg', bg: 'frozen_lake.hdr → line engraving' },
  harbor: { logo: '../_shared/products/harbor/harbor-mark.svg', bg: 'mossy_forest.hdr → atkinson, brass', mark: true, sticker: 'assets/stickers/status-paused.svg' },
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function renderProducts() {
  const wrap = $('[data-products]'), list = $('[data-retired]');
  const active = content.products.filter(p => ASSET[p.id]);
  wrap.innerHTML = active.map((p, i) => {
    const a = ASSET[p.id], host = p.url ? new URL(p.url).host : '';
    const chip = p.status === 'live' ? '<span class="chip chip--live"><span class="a56-live-dot" aria-hidden="true"></span>live</span>'
      : `<span class="chip chip--${p.status}">${p.status}</span>`;
    return `<article class="prod prod--${p.status}">
      <figure class="prod__fig">
        <div class="prod__img"><img src="assets/img/products/${p.id}@1x.webp" srcset="assets/img/products/${p.id}@1x.webp 1200w, assets/img/products/${p.id}@2x.webp 2400w" sizes="(max-width:899px) 92vw, 46vw" width="1200" height="800" loading="lazy" decoding="async" alt="${esc(p.name)} specimen card with its real logo"></div>
        <figcaption><span>fig. 0${i + 1} / ${esc(p.name)}</span><span>bg: ${esc(a.bg)}</span></figcaption>
        ${a.sticker ? `<img class="prod__sticker a56-sticker" src="${a.sticker}" alt="Paused, not dead. Not live either." width="300" height="120" loading="lazy">` : ''}
      </figure>
      <div class="prod__body">
        <img class="prod__logo${a.mark ? ' prod__logo--mark' : ''}" src="${a.logo}" alt="${esc(p.name)} logo" width="48" height="48" loading="lazy">
        <div>
          <div class="prod__meta">${chip}<span>since ${p.since}</span></div>
          <h3 class="prod__name"><a href="${esc(p.url)}" rel="noopener" data-scramble><span class="a56-scramble">${esc(p.name)}</span></a></h3>
          <p class="prod__line">${esc(p.line)}</p>
        </div>
        ${p.figure ? `<div class="prod__fig-n"><b data-count>${esc(p.figure.value)}</b><span>${esc(p.figure.label)}</span></div>` : '<span></span>'}
        <ul class="prod__facts">${(p.facts || []).map(f => `<li>${esc(f)}</li>`).join('')}${host ? `<li>${esc(host)}</li>` : ''}</ul>
      </div>
    </article>`;
  }).join('');

  const retired = content.products.filter(p => p.status === 'retired');
  list.innerHTML = retired.map(p => {
    const icon = p.id === 'luma' ? `<img class="real" src="../_shared/products/luma/logo.png" alt="Luma logo" width="40" height="40" loading="lazy">`
      : `<img src="assets/retired/${p.id}.svg" alt="" width="40" height="40" loading="lazy">`;
    return `<li class="ret">${icon}<span class="ret__name">${esc(p.name)}</span><span class="ret__year">${p.since}</span><span class="ret__line">${esc(p.line)}${p.figure ? ` <b>${esc(p.figure.value)} ${esc(p.figure.label)}.</b>` : ''}</span><span class="chip chip--retired">retired</span></li>`;
  }).join('');

  // honest tally, counted from the source
  const n = s => content.products.filter(p => p.status === s).length;
  const W = ['None', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven'];
  const tally = $('[data-tally]');
  if (tally) tally.innerHTML = `${W[n('live')]} live. ${W[n('building')]} building. ${W[n('paused')]} paused. <span class="pulse-ink">${W[n('retired')]} retired.</span>`;

  if (gsap && !reduce) {
    $$('[data-count]', wrap).forEach(el => countUp(el));
    $$('.prod__img img', wrap).forEach(im => resolveIn(im, { start: 'top 85%' }));
    // magnetic tilt: the card leans toward the hand
    $$('.prod__fig', wrap).forEach(f => {
      f.addEventListener('pointermove', e => {
        const r = f.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(f, { rotationY: x * 5, rotationX: -y * 5, x: x * 8, y: y * 8, transformPerspective: 900, duration: 0.4, ease: 'power2.out' });
      });
      f.addEventListener('pointerleave', () => gsap.to(f, { rotationY: 0, rotationX: 0, x: 0, y: 0, duration: 0.5, ease: 'back.out(2)' }));
    });
  }
}

/* ---------------- footer: the frozen lake, live ASCII, photo under the lens ---------------- */
function wireStrip() {
  const cv = $('[data-strip]'); if (!cv) return;
  const io = new IntersectionObserver(async ([en]) => {
    if (!en.isIntersecting) return; io.disconnect();
    try {
      await mountDither(cv, { src: 'img/truth/lake-strip.webp', mode: 'ascii', dark: PALETTE.ink, light: PALETTE.cream2, accent: PALETTE.brass, lensR: 96, breath: false, gamma: 0.72 });
      $('.foot__strip-fallback').style.visibility = 'hidden';
    } catch {}
  }, { rootMargin: '300px' });
  io.observe(cv);
}

/* ---------------- boot ---------------- */
renderProducts();
bindScramble(document);
wireBoard();
wireDevelop();
wireStrip();
const loaded = runLoader();
// the live engine starts after the loader so it never competes for the first bytes
loaded.then(() => mountLive());
window.ScrollTrigger && addEventListener('load', () => window.ScrollTrigger.refresh());
