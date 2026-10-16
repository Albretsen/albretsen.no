/*
  motion.js — design 56 "Honest Pixels" signature animations.
  Requires GSAP 3.13 globals (vendor/gsap.min.js, ScrollTrigger, Draggable, Flip) loaded first.
  Import as an ES module:  import { resolveIn, scramble, bayerWipe, moodboard } from './motion.js'

  Signature set (see ASSETS.md for the references each one was researched from):
    resolveIn(img)       ENTRANCE    image steps from coarse Bayer cells to the real asset as it scrolls in
    scramble(el)         HOVER       label churns through the ASCII ramp, settles left to right
    bayerWipe()          TRANSITION  full-screen 8x8 Bayer-ordered cover / uncover between views
    moodboard(root)      INTERACTION drag pieces of the collage; "tidy" Flips them into a grid; "scatter" throws them back
    countUp(el)          DETAIL      numbers tick in 6 hard steps, never smooth
*/
import { sampleLum, PALETTE, RAMP } from './js/dither.js';

const G = () => window.gsap;
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const BAYER8 = (() => { const b = [[0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26], [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22], [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25], [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]]; return b.map(r => r.map(v => (v + .5) / 64)); })();
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

/* ---------- 1. RESOLVE-IN (entrance) ----------
   A canvas sits over the image. On enter, it renders the image's own pixels as Bayer
   at 32 -> 16 -> 8 -> 4 -> 2 px cells, then dissolves away (6 steps) to show the real file. */
export function resolveIn(img, { start = 'top 80%', dark = PALETTE.deep, light = PALETTE.cream } = {}) {
  const gsap = G(); if (!gsap || reduce()) return;
  const wrap = img.parentElement; getComputedStyle(wrap).position === 'static' && (wrap.style.position = 'relative');
  const cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
  Object.assign(cv.style, { position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated', pointerEvents: 'none' });
  wrap.appendChild(cv);
  const D = rgb(dark), L = rgb(light);
  const st = { cell: 32, op: 1 };
  let lumCache = {};
  const draw = () => {
    const r = cv.getBoundingClientRect(); if (!img.complete || !r.width) return;
    const cols = Math.max(2, Math.round(r.width / st.cell)), rows = Math.max(2, Math.round(r.height / st.cell));
    const key = cols + 'x' + rows; const lum = lumCache[key] || (lumCache[key] = sampleLum(img, cols, rows, 1.1));
    cv.width = cols; cv.height = rows; const x = cv.getContext('2d'), id = x.createImageData(cols, rows);
    for (let y = 0; y < rows; y++) for (let i = 0; i < cols; i++) {
      const on = lum[y * cols + i] > BAYER8[y & 7][i & 7], c = on ? L : D, o = (y * cols + i) * 4;
      id.data[o] = c[0]; id.data[o + 1] = c[1]; id.data[o + 2] = c[2]; id.data[o + 3] = 255;
    }
    x.putImageData(id, 0, 0); cv.style.opacity = st.op;
  };
  const go = () => {
    const tl = gsap.timeline({ paused: true })
      .to(st, { cell: 2, duration: 1.0, ease: 'steps(5)', onUpdate: draw })
      .to(st, { op: 0, duration: 0.45, ease: 'steps(6)', onUpdate: draw, onComplete: () => cv.remove() });
    const ST = window.ScrollTrigger;
    if (!ST) return tl.play();
    ST.create({ trigger: wrap, start, once: true, onEnter: () => tl.play() });
    ST.refresh();
  };
  draw(); img.complete ? go() : img.addEventListener('load', () => { draw(); go(); }, { once: true });
}

/* ---------- 2. SCRAMBLE (hover) ----------
   Each character churns through the ASCII ramp, then locks, left to right. 18 frames. */
export function scramble(el, { ramp = '@%#x*+=-:.', frames = 18 } = {}) {
  const text = el.dataset.text || (el.dataset.text = el.textContent);
  if (el.dataset.busy || reduce()) return; el.dataset.busy = '';
  let f = 0;
  const tick = () => {
    const lock = Math.floor((f / frames) * text.length);
    el.textContent = [...text].map((c, i) => (i < lock || c === ' ' ? c : ramp[(Math.random() * ramp.length) | 0])).join('');
    if (++f <= frames) setTimeout(tick, 28); else { el.textContent = text; delete el.dataset.busy; }
  };
  tick();
}
export function bindScramble(root = document) {
  root.querySelectorAll('[data-scramble]').forEach(el => {
    const t = el.querySelector('.a56-scramble') || el;
    el.addEventListener('pointerenter', () => scramble(t)); el.addEventListener('focus', () => scramble(t));
  });
}

/* ---------- 3. BAYER WIPE (transition) ----------
   Covers the viewport cell by cell in Bayer order (64 thresholds = 64 frames of order),
   calls mid(), then uncovers in the same order. Returns a GSAP timeline. */
export function bayerWipe({ mid = () => {}, cell = 28, color = PALETTE.forest, dur = 0.55 } = {}) {
  const gsap = G();
  const cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
  Object.assign(cv.style, { position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 9999, pointerEvents: 'none' });
  document.body.appendChild(cv);
  const W = innerWidth, H = innerHeight; cv.width = W; cv.height = H; const x = cv.getContext('2d');
  const cols = Math.ceil(W / cell), rows = Math.ceil(H / cell), st = { p: 0, out: 0 };
  const draw = () => {
    x.clearRect(0, 0, W, H); x.fillStyle = color;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const t = BAYER8[r & 7][c & 7];
      if (st.p > t && !(st.out > t)) x.fillRect(c * cell, r * cell, cell, cell);
    }
  };
  if (reduce()) { mid(); cv.remove(); return gsap ? gsap.timeline() : null; }
  return gsap.timeline({ onComplete: () => cv.remove() })
    .to(st, { p: 1.01, duration: dur, ease: 'none', onUpdate: draw })
    .add(mid)
    .to(st, { out: 1.01, duration: dur, ease: 'none', onUpdate: draw }, '+=0.08');
}

/* ---------- 4. MOODBOARD (interaction) ----------
   root contains .a56-piece children positioned absolutely (left/top in %).
   Pieces drag with inertia-free "hand" physics: lift = hard shadow, slight rotation follows velocity.
   tidy() Flips them into a contact-sheet grid; scatter() Flips them back to their art-directed spots. */
export function moodboard(root) {
  const gsap = G(), { Draggable, Flip } = window;
  gsap.registerPlugin(Draggable, Flip);
  const pieces = [...root.querySelectorAll('.a56-piece')];
  const home = pieces.map(p => ({ left: p.style.left, top: p.style.top, rot: +p.dataset.rot || 0 }));
  pieces.forEach((p, i) => gsap.set(p, { rotation: home[i].rot }));
  let z = 10;
  const drags = pieces.map(p => Draggable.create(p, {
    type: 'x,y', bounds: root, zIndexBoost: false,
    onPress() { p.style.zIndex = ++z; p.classList.add('is-lifted'); gsap.to(p, { scale: 1.03, duration: .15, ease: 'steps(3)' }); },
    onDrag() { gsap.to(p, { rotation: gsap.utils.clamp(-8, 8, this.deltaX * 0.6), duration: .3, ease: 'power2.out', overwrite: 'auto' }); },
    onRelease() { p.classList.remove('is-lifted'); gsap.to(p, { scale: 1, rotation: (Math.random() * 6 - 3), duration: .5, ease: 'back.out(2)' }); },
  })[0]);
  function tidy() {
    const state = Flip.getState(pieces);
    root.classList.add('is-tidy');
    pieces.forEach(p => gsap.set(p, { x: 0, y: 0, rotation: 0 }));
    Flip.from(state, { duration: .7, ease: 'power3.inOut', stagger: .03, absolute: true });
  }
  function scatter() {
    const state = Flip.getState(pieces);
    root.classList.remove('is-tidy');
    pieces.forEach((p, i) => { gsap.set(p, { x: 0, y: 0, rotation: home[i].rot }); });
    Flip.from(state, { duration: .8, ease: 'power3.inOut', stagger: { each: .04, from: 'random' }, absolute: true });
  }
  return { tidy, scatter, drags };
}

/* ---------- 5. COUNT-UP (detail) ----------
   Figures arrive in six hard steps, formatted like the source (keeps $ , + and suffixes). */
export function countUp(el, { steps = 6, duration = .9 } = {}) {
  const gsap = G(); const raw = el.textContent.trim(); const m = raw.match(/[\d,]+/); if (!m || reduce()) return;
  const target = +m[0].replace(/,/g, ''), st = { v: 0 };
  gsap.to(st, { v: target, duration, ease: `steps(${steps})`, scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    onUpdate: () => (el.textContent = raw.replace(m[0], Math.round(st.v).toLocaleString('en-US'))) });
}
