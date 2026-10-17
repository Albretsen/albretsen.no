// Six Faces / design 90 — the Honest Die.
// A cube built only from CSS 3D transforms that you can grab, spin and throw.
// It flies, bounces off the edges of its stage, loses energy, and always lands on
// one face, upright, square to you: one true number. No WebGL.
//
//   import { createThrowCube } from './interactive/throw-cube.js'
//   const die = createThrowCube(stageEl, FACES, { size: 280 })
//   stageEl.addEventListener('settle', (e) => console.log(e.detail.face))
//   die.roll()     // a random throw (also: Space / Enter when focused)
//   die.destroy()
//
// FACES: [{ id, kicker, value, label, note, image }] in order front, right, back, left, top, bottom.
// The landing spring uses Motion (motion.dev) when it loads, and a hand-rolled spring otherwise.

const MOTION_URL = 'https://cdn.jsdelivr.net/npm/motion@13.4.6/+esm'
let motionP = null
// never let a slow CDN hold the die in the air: fall back after 900 ms
const getMotion = () => Promise.race([(motionP ||= import(MOTION_URL).catch(() => null)), new Promise((r) => setTimeout(() => r(null), 900))])

// ---------- quaternion helpers (x, y, z, w); CSS space: x right, y down, z toward viewer
const qMul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
]
const qAxis = (x, y, z, ang) => { const l = Math.hypot(x, y, z) || 1, s = Math.sin(ang / 2); return [x / l * s, y / l * s, z / l * s, Math.cos(ang / 2)] }
const qNorm = (q) => { const l = Math.hypot(...q); return q.map((v) => v / l) }
function qSlerp(a, b, t) {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
  if (d < 0) { b = b.map((v) => -v); d = -d }
  if (d > 0.9995) return qNorm(a.map((v, i) => v + (b[i] - v) * t))
  const th = Math.acos(d), s = Math.sin(th)
  return a.map((v, i) => (v * Math.sin((1 - t) * th) + b[i] * Math.sin(t * th)) / s)
}
function qToM(q) { // row-major 3x3
  const [x, y, z, w] = q
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
    [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
    [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
  ]
}
function mToQ(m) {
  const tr = m[0][0] + m[1][1] + m[2][2]; let x, y, z, w
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; w = s / 4; x = (m[2][1] - m[1][2]) / s; y = (m[0][2] - m[2][0]) / s; z = (m[1][0] - m[0][1]) / s }
  else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) { const s = Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2; w = (m[2][1] - m[1][2]) / s; x = s / 4; y = (m[0][1] + m[1][0]) / s; z = (m[0][2] + m[2][0]) / s }
  else if (m[1][1] > m[2][2]) { const s = Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2; w = (m[0][2] - m[2][0]) / s; x = (m[0][1] + m[1][0]) / s; y = s / 4; z = (m[1][2] + m[2][1]) / s }
  else { const s = Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2; w = (m[1][0] - m[0][1]) / s; x = (m[0][2] + m[2][0]) / s; y = (m[1][2] + m[2][1]) / s; z = s / 4 }
  return qNorm([x, y, z, w])
}
const mv = (m, v) => m.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2])
const css = (q) => { const m = qToM(q); return `matrix3d(${m[0][0]},${m[1][0]},${m[2][0]},0,${m[0][1]},${m[1][1]},${m[2][1]},0,${m[0][2]},${m[1][2]},${m[2][2]},0,0,0,0,1)` }

const FACE_DEF = [ // id order: front, right, back, left, top, bottom
  { n: [0, 0, 1], up: [0, -1, 0], t: '' },
  { n: [1, 0, 0], up: [0, -1, 0], t: 'rotateY(90deg)' },
  { n: [0, 0, -1], up: [0, -1, 0], t: 'rotateY(180deg)' },
  { n: [-1, 0, 0], up: [0, -1, 0], t: 'rotateY(-90deg)' },
  { n: [0, -1, 0], up: [0, 0, -1], t: 'rotateX(90deg)' },
  { n: [0, 1, 0], up: [0, 0, 1], t: 'rotateX(-90deg)' },
]
const LIGHT = (() => { const v = [-0.45, -0.7, 0.55], l = Math.hypot(...v); return v.map((x) => x / l) })()

// the orientation that shows face i square to the viewer and upright
function faceQ(i) {
  const { n, up: u } = FACE_DEF[i]
  const r = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]] // n x u
  // R*n=(0,0,1), R*u=(0,-1,0), R*r=(1,0,0)  ->  rows of R are r, -u, n
  return mToQ([r, u.map((v) => -v), n.slice()])
}
// land on whichever face is most toward the viewer right now
function settleTarget(q) {
  const m = qToM(q)
  let best = 0, bz = -2
  FACE_DEF.forEach((f, i) => { const z = mv(m, f.n)[2]; if (z > bz) { bz = z; best = i } })
  return { q: faceQ(best), face: best }
}

export function createThrowCube(stage, faces, opts = {}) {
  const size = opts.size || 260
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('tc-stage')
  stage.style.setProperty('--tc-size', size + 'px')
  const shadow = document.createElement('div'); shadow.className = 'tc-shadow'
  const body = document.createElement('div'); body.className = 'tc-body'
  body.tabIndex = 0; body.setAttribute('role', 'button')
  body.setAttribute('aria-label', 'A die with six true numbers. Drag to spin and throw it, or press Space to roll.')
  const cube = document.createElement('div'); cube.className = 'tc-cube'
  const live = document.createElement('p'); live.className = 'tc-live'; live.setAttribute('aria-live', 'polite')
  const faceEls = faces.map((f, i) => {
    const el = document.createElement('div'); el.className = 'tc-face'; el.dataset.face = f.id
    el.style.transform = `${FACE_DEF[i].t} translateZ(calc(var(--tc-size) / 2))`
    if (f.image) el.style.setProperty('--tc-img', `url("${f.image}")`)
    if (f.tone) el.dataset.tone = f.tone
    el.innerHTML = `<span class="tc-kicker">${f.kicker || ''}</span><span class="tc-value">${f.value}</span><span class="tc-label">${f.label || ''}</span>${f.note ? `<span class="tc-note">${f.note}</span>` : ''}`
    cube.appendChild(el); return el
  })
  body.appendChild(cube); stage.append(shadow, body, live)

  let q = qNorm(qMul(qAxis(0, 1, 0, -0.55), qAxis(1, 0, 0, -0.42)))
  let w = [0, 0, 0] // angular velocity, rad/ms, world axis * speed
  let pos = [0, 0], vel = [0, 0]
  let dragging = false, settling = null, raf = 0, last = 0, lastFace = -1
  const hist = []

  function bounds() { const r = stage.getBoundingClientRect(); return [Math.max(0, (r.width - size) / 2), Math.max(0, (r.height - size) / 2)] }
  function paint() {
    const lift = dragging ? 1.06 : 1
    body.style.transform = `translate3d(${pos[0]}px, ${pos[1]}px, 0) scale(${lift})`
    cube.style.transform = css(q)
    const m = qToM(q)
    faceEls.forEach((el, i) => {
      const n = mv(m, FACE_DEF[i].n)
      el.style.setProperty('--tc-lit', Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]).toFixed(3))
    })
    const [bx, by] = bounds()
    const k = (pos[1] + by) / (2 * by + 1) // 0 = thrown high, 1 = on the floor
    shadow.style.transform = `translate3d(${pos[0]}px, ${pos[1] * 0.3}px, 0) scale(${(0.7 + 0.3 * k) * (dragging ? 0.92 : 1)})`
    shadow.style.opacity = (0.55 + 0.45 * k).toFixed(2)
  }

  function step(t) {
    const dt = Math.min(32, t - (last || t)); last = t
    if (!dragging && !settling) {
      const sp = Math.hypot(...w)
      if (sp > 1e-5) q = qNorm(qMul(qAxis(w[0], w[1], w[2], sp * dt), q))
      w = w.map((v) => v * Math.pow(0.998, dt))
      pos = pos.map((p, i) => p + vel[i] * dt)
      vel = vel.map((v) => v * Math.pow(0.9975, dt))
      const [bx, by] = bounds()
      ;[bx, by].forEach((b, i) => {
        if (pos[i] > b) { pos[i] = b; vel[i] = -Math.abs(vel[i]) * 0.55; kick(i) }
        if (pos[i] < -b) { pos[i] = -b; vel[i] = Math.abs(vel[i]) * 0.55; kick(i) }
      })
      if (Math.hypot(...w) < 0.0022 && Math.hypot(...vel) < 0.06) land()
    }
    paint()
    raf = requestAnimationFrame(step)
  }
  // a wall hit converts some linear speed into spin, like a real die
  function kick(axis) { const s = Math.hypot(...vel) * 0.004; w = [w[0] + (axis ? s : 0), w[1] + (axis ? 0 : s), w[2] + s * 0.5] }

  async function land() {
    const from = q, { q: to, face } = settleTarget(q)
    const fromPos = pos.slice()
    settling = true; w = [0, 0, 0]; vel = [0, 0]; stage.dataset.state = 'landing'
    const apply = (p) => { q = qSlerp(from, to, Math.min(1, Math.max(0, p))); pos = fromPos.map((v) => v * (1 - Math.min(1, p))) }
    const M = await getMotion()
    if (!settling) return
    await new Promise((res) => {
      if (M && M.animate) {
        const c = M.animate(0, 1, { type: 'spring', stiffness: 260, damping: 17, mass: 1, onUpdate: apply, onComplete: res })
        settling = c
      } else {
        let k = 0, v = 0; const tick = () => { const a = 260 * (1 - k) - 17 * v; v += a / 60; k += v / 60; apply(k); if (Math.abs(1 - k) > 0.001 || Math.abs(v) > 0.001) requestAnimationFrame(tick); else { apply(1); res() } }; tick()
      }
    })
    q = to; settling = null; stage.dataset.state = 'landed'
    faceEls.forEach((el, i) => el.classList.toggle('is-up', i === face))
    if (face !== lastFace) {
      lastFace = face
      const f = faces[face]
      live.textContent = `${f.value} ${f.label}. ${f.kicker || ''}`
      stage.dispatchEvent(new CustomEvent('settle', { detail: { face: f.id, index: face, data: f } }))
    }
  }

  function cancelSettle() { if (settling && settling.stop) settling.stop(); settling = null }

  body.addEventListener('pointerdown', (e) => {
    cancelSettle(); dragging = true; stage.dataset.state = 'held'; body.setPointerCapture(e.pointerId)
    hist.length = 0; hist.push([e.clientX, e.clientY, performance.now()])
    stage.classList.add('is-grabbing'); faceEls.forEach((el) => el.classList.remove('is-up'))
  })
  body.addEventListener('pointermove', (e) => {
    if (!dragging) return
    const p = hist[hist.length - 1], dx = e.clientX - p[0], dy = e.clientY - p[1]
    const ang = Math.hypot(dx, dy) * 0.0105
    if (ang) q = qNorm(qMul(qAxis(-dy, dx, 0, ang), q))
    pos = [pos[0] + dx * 0.35, pos[1] + dy * 0.35]
    hist.push([e.clientX, e.clientY, performance.now()]); if (hist.length > 6) hist.shift()
  })
  const release = () => {
    if (!dragging) return
    dragging = false; stage.classList.remove('is-grabbing')
    const a = hist[0], b = hist[hist.length - 1], dt = Math.max(16, b[2] - a[2])
    const vx = (b[0] - a[0]) / dt, vy = (b[1] - a[1]) / dt, sp = Math.hypot(vx, vy)
    w = sp > 0.02 ? [-vy * 0.0105, vx * 0.0105, (Math.random() - 0.5) * sp * 0.004] : [0, 0, 0]
    vel = [vx * 0.9, vy * 0.9]
    if (sp <= 0.02) land()
  }
  body.addEventListener('pointerup', release)
  body.addEventListener('pointercancel', release)

  function roll() {
    cancelSettle()
    if (reduce) { // no flight: turn straight to the next face
      q = faceQ((Math.max(0, lastFace) + 1) % 6)
      return land()
    }
    const a = Math.random() * Math.PI * 2, s = 1.6 + Math.random() * 0.8
    vel = [Math.cos(a) * s, -Math.abs(Math.sin(a)) * s]; stage.dataset.state = 'flying'
    w = [(Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.02]
  }
  body.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); roll() } })

  paint()
  raf = requestAnimationFrame(step)
  if (opts.intro !== false && !reduce) setTimeout(roll, opts.introDelay ?? 500)
  else land()
  return { el: body, roll, destroy() { cancelAnimationFrame(raf); cancelSettle(); stage.replaceChildren() } }
}
