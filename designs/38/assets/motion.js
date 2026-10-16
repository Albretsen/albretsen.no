// motion.js — signature motion for design 38 "Salon Refusé". Web Animations API only, no deps.
// Pair with motion.css. Every function respects prefers-reduced-motion.
//
//   import { lightsUp, uvTorch, swing, rehang, redDot, pressable } from './motion.js'
//
// 1. lightsUp(root)      ENTRANCE  — the gallery's lights come on one track at a time: each light pool
//                                    warms up with a lamp's two-step flicker, then the work under it is
//                                    unveiled top-down with a clip-path inset (Emil Kowalski's reveal:
//                                    1000 ms, cubic-bezier(.77,0,.175,1)).
// 2. uvTorch(frame)      HOVER     — a UV torch follows the pointer and burns a soft hole through the
//                                    finished image into the underdrawing (.uv layer). Radius opens on
//                                    enter (ease-out 360 ms), closes on leave (220 ms). The signature delight.
// 3. swing(frame, kick)  HOVER/TAP — the frame swings on its nail as a real damped pendulum (keyframes are
//                                    sampled from the physics, not hand-eased). Weightless, then tension.
// 4. rehang(out, in)     TRANSITION— the old work is lifted off the wall (rises, shadow grows, fades), the
//                                    new one is dropped onto the nail and settles with a swing.
// 5. redDot(dot)         DETAIL    — the gallery "sold" sticker slaps on: from scale .9 + 2px blur (never
//                                    from 0), overshoot, settle. For products that make money.
// 6. pressable(el)       TACTILE   — buttons dip to .97 on press.

export const EASE = {
  reveal: 'cubic-bezier(.77,0,.175,1)',     // Emil Kowalski, "The Magic of Clip Path"
  out: 'cubic-bezier(.23,1,.32,1)',          // strong ease-out for entering things
  inOut: 'cubic-bezier(.65,0,.35,1)',
}
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------------------------------------------------------------- 1. lights up
export function lightsUp(root = document, { stagger = 160, selector = '[data-lightsup]' } = {}) {
  const items = [...root.querySelectorAll(selector)]
  const run = (el, i) => {
    const pool = el.querySelector('.pool'), art = el.querySelector('.art') || el
    const d = i * stagger
    if (reduced()) { pool?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: d, fill: 'both' }); return }
    pool?.animate(
      [{ opacity: 0 }, { opacity: 0.55, offset: 0.08 }, { opacity: 0.18, offset: 0.13 }, { opacity: 0.8, offset: 0.22 }, { opacity: 0.6, offset: 0.3 }, { opacity: 1 }],
      { duration: 1100, delay: d, easing: 'linear', fill: 'both' })
    art.animate(
      [{ clipPath: 'inset(0 0 100% 0)', filter: 'brightness(.4)' }, { clipPath: 'inset(0 0 0% 0)', filter: 'brightness(1)' }],
      { duration: 1000, delay: d + 260, easing: EASE.reveal, fill: 'both' })
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { run(e.target, items.indexOf(e.target) % 6); io.unobserve(e.target) }
  }), { rootMargin: '0px 0px -100px 0px' })
  items.forEach(el => io.observe(el))
  return () => io.disconnect()
}

// ---------------------------------------------------------------- 2. UV torch
// Markup: <figure class="torch"><img class="lit"><img class="uv"></figure>
export function uvTorch(el, { radius = 150, lag = 0.18 } = {}) {
  const uv = el.querySelector('.uv'); if (!uv) return () => {}
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0, rAnim
  const setR = (to, dur, easing) => {
    const from = getComputedStyle(el).getPropertyValue('--torch-r') || '0px'
    rAnim?.cancel()
    rAnim = el.animate([{ '--torch-r': from }, { '--torch-r': `${to}px` }], { duration: reduced() ? 0 : dur, easing, fill: 'forwards' })
  }
  const loop = () => {
    const k = reduced() ? 1 : Math.min(1, lag * 2.5)
    x += (tx - x) * k; y += (ty - y) * k
    el.style.setProperty('--tx', `${x}px`); el.style.setProperty('--ty', `${y}px`)
    raf = requestAnimationFrame(loop)
  }
  const pos = e => { const r = el.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top }
  const enter = e => { pos(e); x = tx; y = ty; el.classList.add('is-torch'); setR(radius, 360, EASE.out); cancelAnimationFrame(raf); loop() }
  const leave = () => { setR(0, 220, 'ease-in'); setTimeout(() => { if (!el.matches(':hover')) { cancelAnimationFrame(raf); el.classList.remove('is-torch') } }, 240) }
  el.addEventListener('pointerenter', enter); el.addEventListener('pointermove', pos); el.addEventListener('pointerleave', leave)
  // keyboard: focus shows the full underdrawing
  el.addEventListener('focus', () => { el.style.setProperty('--tx', '50%'); el.style.setProperty('--ty', '50%'); setR(Math.hypot(el.clientWidth, el.clientHeight), 500, EASE.out) })
  el.addEventListener('blur', () => setR(0, 220, 'ease-in'))
  return () => { cancelAnimationFrame(raf); el.removeEventListener('pointerenter', enter); el.removeEventListener('pointermove', pos); el.removeEventListener('pointerleave', leave) }
}

// ---------------------------------------------------------------- 3. swing
// Damped pendulum sampled into keyframes. transform-origin must be the nail (50% -x).
export function pendulumFrames({ kick = 4, length = 0.6, damping = 2.4, duration = 2.2, steps = 60, base = '' } = {}) {
  const w = Math.sqrt(9.8 / length), frames = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * duration
    const a = kick * Math.exp(-damping * t) * Math.sin(w * t + Math.PI / 2) * (i === 0 ? 0 : 1)
    frames.push({ transform: `${base} rotate(${a.toFixed(3)}deg)`, offset: i / steps })
  }
  frames[frames.length - 1].transform = `${base} rotate(0deg)`
  return { frames, duration: duration * 1000 }
}
export function swing(el, kick = 3.2) {
  if (reduced()) return
  const { frames, duration } = pendulumFrames({ kick })
  el.getAnimations().filter(a => a.id === 'swing').forEach(a => a.cancel())
  const a = el.animate(frames, { duration, easing: 'linear', composite: 'add' }); a.id = 'swing'
  return a
}
export function swingOnHover(el) {
  let lastX = 0
  el.addEventListener('pointerenter', e => { const r = el.getBoundingClientRect(); swing(el, (e.clientX < r.left + r.width / 2 ? -1 : 1) * 2.4) })
  el.addEventListener('click', () => swing(el, 5))
}

// ---------------------------------------------------------------- 4. rehang (view transition)
export async function rehang(outEl, inEl) {
  if (reduced()) { outEl.hidden = true; inEl.hidden = false; return }
  await outEl.animate([
    { transform: 'translateY(0) rotate(0)', boxShadow: '0 12px 24px -12px #0008', opacity: 1 },
    { transform: 'translateY(-18px) rotate(-1.2deg)', boxShadow: '0 40px 60px -20px #0006', opacity: 1, offset: 0.55 },
    { transform: 'translateY(-26px) rotate(-1.6deg)', boxShadow: '0 50px 70px -20px #0000', opacity: 0 },
  ], { duration: 520, easing: EASE.inOut, fill: 'forwards' }).finished
  outEl.hidden = true; inEl.hidden = false
  const drop = inEl.animate([
    { transform: 'translateY(-30px)', opacity: 0, filter: 'blur(2px)' },
    { transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' },
  ], { duration: 420, easing: EASE.out, fill: 'backwards' })
  await drop.finished
  swing(inEl, 3.6)
}

// ---------------------------------------------------------------- 5. red dot
export function redDot(el, delay = 0) {
  if (reduced()) return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay, fill: 'both' })
  return el.animate([
    { transform: 'scale(.9) rotate(-8deg)', opacity: 0, filter: 'blur(2px)' },
    { transform: 'scale(1.08) rotate(2deg)', opacity: 1, filter: 'blur(0)', offset: 0.55 },
    { transform: 'scale(1) rotate(0)', opacity: 1 },
  ], { duration: 380, delay, easing: EASE.out, fill: 'both' })
}

// ---------------------------------------------------------------- 6. press
export function pressable(el) {
  const down = () => el.animate([{ transform: 'scale(1)' }, { transform: 'scale(.97)' }], { duration: 120, easing: 'ease-out', fill: 'forwards' })
  const up = () => el.animate([{ transform: 'scale(.97)' }, { transform: 'scale(1)' }], { duration: 200, easing: EASE.out, fill: 'forwards' })
  el.addEventListener('pointerdown', down); el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up)
}
