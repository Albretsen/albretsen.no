/* spring-deck.js — a DOM card stack with spring physics. No dependencies (~4 KB).
 *
 * The centrepiece interaction for design 39: product "plates" lie in a stack like
 * glass slides. Drag the top card; throw it and it springs to the back of the stack.
 * Click (or Enter / Space) flips it over to reveal the back face. Arrow keys cycle.
 * Cards behind the top one sit as fading echoes of it (offset, scaled, slightly turned).
 *
 * Markup:
 *   <div class="deck" data-deck>
 *     <article class="deck-card">
 *       <div class="deck-face deck-front">…</div>
 *       <div class="deck-face deck-back">…</div>
 *     </article> …
 *   </div>
 * CSS needed (see motion.css, section "spring deck"): .deck {position:relative}
 *   .deck-card {position:absolute; inset:0; transform-style:preserve-3d}
 *   .deck-face {position:absolute; inset:0; backface-visibility:hidden}
 *   .deck-back {transform:rotateY(180deg)}
 *
 * Usage: import { createSpringDeck } from './spring-deck.js'; createSpringDeck(el, opts)
 */
export function createSpringDeck(root, opts = {}) {
  const o = Object.assign({ stiffness: 260, damping: 24, throwDistance: 110, throwVelocity: 650,
    depthY: 14, depthScale: .045, echoTurn: 1.6, visible: 4 }, opts);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cards = [...root.querySelectorAll(':scope > .deck-card')];
  const S = new Map(); // per-card spring state

  // a 1D spring: x -> target, semi-implicit Euler
  const spring = v => ({ x: v, v: 0, t: v });
  cards.forEach((c, i) => {
    S.set(c, { x: spring(0), y: spring(i * o.depthY), r: spring(0), s: spring(1 - i * o.depthScale),
      f: spring(0), o: spring(i < o.visible ? 1 - i * .22 : 0) });
    c.style.touchAction = 'none';
    c.tabIndex = -1;
  });

  function layout() {
    cards.forEach((c, i) => {
      const s = S.get(c);
      s.y.t = i * o.depthY; s.s.t = 1 - i * o.depthScale;
      s.r.t = i === 0 ? 0 : (i % 2 ? -1 : 1) * o.echoTurn * Math.min(i, 2);
      if (!drag || drag.card !== c) s.x.t = 0;
      s.o.t = i < o.visible ? 1 - i * .22 : 0;
      c.style.zIndex = String(100 - i);
      c.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      c.tabIndex = i === 0 ? 0 : -1;
      c.classList.toggle('is-top', i === 0);
    });
    kick();
  }

  let raf = 0, last = 0;
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  function tick(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now; raf = 0;
    let moving = false;
    for (const c of cards) {
      const s = S.get(c);
      for (const k of ['x', 'y', 'r', 's', 'f', 'o']) {
        const p = s[k];
        if (drag && drag.card === c && (k === 'x' || k === 'r')) continue; // finger owns these
        if (reduce) { p.x = p.t; p.v = 0; continue; }
        const stiff = k === 'f' ? o.stiffness * .7 : o.stiffness;
        p.v += ((p.t - p.x) * stiff - p.v * o.damping) * dt;
        p.x += p.v * dt;
        if (Math.abs(p.v) > .01 || Math.abs(p.t - p.x) > .01) moving = true; else { p.x = p.t; p.v = 0; }
      }
      c.style.transform = `translate3d(${s.x.x}px, ${s.y.x}px, 0) rotate(${s.r.x}deg) scale(${s.s.x}) rotateY(${s.f.x}deg)`;
      c.style.opacity = s.o.x.toFixed(3);
      // let CSS react to how far the card is turned (e.g. a spectral edge while flipping)
      c.style.setProperty('--flip', (Math.abs(Math.sin(s.f.x * Math.PI / 180))).toFixed(3));
      c.style.setProperty('--throw', Math.min(1, Math.abs(s.x.x) / 260).toFixed(3));
    }
    if (moving || drag) raf = requestAnimationFrame(tick);
  }

  // drag + throw
  let drag = null;
  function onDown(e) {
    const c = e.currentTarget; if (c !== cards[0]) return;
    c.setPointerCapture(e.pointerId);
    drag = { card: c, id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, lt: performance.now(), vx: 0, moved: false };
    root.classList.add('is-dragging'); kick();
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const s = S.get(drag.card), dx = e.clientX - drag.x0, now = performance.now();
    if (Math.abs(dx) > 4) drag.moved = true;
    const dt = Math.max(1, now - drag.lt);
    drag.vx = .8 * ((e.clientX - drag.lx) / dt * 1000) + .2 * drag.vx; drag.lx = e.clientX; drag.lt = now;
    s.x.x = dx; s.x.v = drag.vx; s.r.x = dx * .06; s.r.v = 0;
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const c = drag.card, s = S.get(c), dx = e.clientX - drag.x0;
    root.classList.remove('is-dragging');
    if (!drag.moved) { drag = null; flip(); return; }
    const vx = drag.vx;
    const thrown = Math.abs(dx) > o.throwDistance || Math.abs(vx) > o.throwVelocity;
    drag = null;
    if (thrown) sendToBack(Math.sign(dx || vx || 1)); else { s.x.t = 0; s.r.t = 0; kick(); }
  }
  function sendToBack(dir = 1) {
    const c = cards.shift(); cards.push(c);
    const s = S.get(c);
    // swing out past the edge, then the layout spring tucks it in at the back
    s.x.x += dir * 40; s.x.v = dir * 900; s.r.v = dir * 120; s.f.t = 0;
    layout();
    root.dispatchEvent(new CustomEvent('deck:change', { detail: { top: cards[0] } }));
    cards[0].focus({ preventScroll: true });
  }
  function bringFromBack() {
    const c = cards.pop(); cards.unshift(c);
    const s = S.get(c); s.x.x = -260; s.x.v = 0; s.o.x = 0;
    layout();
    root.dispatchEvent(new CustomEvent('deck:change', { detail: { top: cards[0] } }));
  }
  function flip() {
    const s = S.get(cards[0]); s.f.t = s.f.t === 0 ? 180 : 0;
    cards[0].classList.toggle('is-flipped', s.f.t === 180); kick();
  }
  function onKey(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); sendToBack(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); bringFromBack(); }
  }
  cards.forEach(c => {
    c.addEventListener('pointerdown', onDown); c.addEventListener('pointermove', onMove);
    c.addEventListener('pointerup', onUp); c.addEventListener('pointercancel', onUp);
    c.addEventListener('keydown', onKey);
  });
  layout();
  return { next: () => sendToBack(1), prev: bringFromBack, flip, get top() { return cards[0]; } };
}
