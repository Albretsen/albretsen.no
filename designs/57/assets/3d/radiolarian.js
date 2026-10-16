// Escape Vector: a draggable icosahedron made of 20 DOM triangles, CSS 3D transforms only.
// Named after Haeckel's Circogonia icosahedra (1904), the plate it echoes. Throw it: it keeps the
// spin you gave it and decays back to a slow idle on a hand-rolled spring. Click: it comes apart
// along its face normals (zero-g) and reassembles with overshoot.
//
// import { mountRadiolarian } from './assets/3d/radiolarian.js'
// mountRadiolarian(el, { radius: 140, texture: 'assets/img/radiolarian-icosa-ink-450.webp' })
import { Spring, loop, reduced } from '../motion.js'

const PHI = (1 + Math.sqrt(5)) / 2
const V = [[-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0], [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI], [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]]
const F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]]
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm = (a) => mul(a, 1 / Math.hypot(...a))

const CSS = `
.evr{position:relative;width:100%;height:100%;perspective:1000px;touch-action:none;cursor:grab;user-select:none}
.evr:active{cursor:grabbing}
.evr-body{position:absolute;left:50%;top:50%;transform-style:preserve-3d}
.evr-face{position:absolute;left:0;top:0;transform-origin:0 0;clip-path:polygon(50% 0,0 100%,100% 100%);backface-visibility:visible}
.evr-face svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}`

export function mountRadiolarian(el, { radius = 140, texture = null, ink = '#070707', line = '#ffffff', accent = '#f34046', accentFaces = [0, 7, 13] } = {}) {
  if (!document.getElementById('evr-css')) { const st = document.createElement('style'); st.id = 'evr-css'; st.textContent = CSS; document.head.append(st) }
  el.classList.add('evr')
  const body = document.createElement('div'); body.className = 'evr-body'; el.append(body)
  const R = radius / Math.hypot(1, PHI) // circumradius -> unit scale
  const s = 2 * R, h = s * Math.sqrt(3) / 2
  const faces = F.map((f, i) => {
    const [A, B, C] = f.map((k) => mul(V[k], R))
    const eu = mul(sub(C, B), 1 / s)
    const o = sub(A, mul(eu, s / 2))
    const ev = mul(sub(B, o), 1 / h)
    let n = norm(cross(eu, ev))
    const centroid = mul(add(add(A, B), C), 1 / 3)
    if (n[0] * centroid[0] + n[1] * centroid[1] + n[2] * centroid[2] < 0) n = mul(n, -1)
    const m = [...eu, 0, ...ev, 0, ...n, 0]
    const div = document.createElement('div'); div.className = 'evr-face'
    div.style.width = `${s}px`; div.style.height = `${h}px`
    const hot = accentFaces.includes(i)
    const tex = texture && !hot && i % 3 === 1
    div.innerHTML = `<svg viewBox="0 0 ${s} ${h}" preserveAspectRatio="none">
      <polygon points="${s / 2},0 0,${h} ${s},${h}" fill="${hot ? accent : ink}" fill-opacity="${hot ? 0.92 : 0.82}"/>
      ${tex ? `<image href="${texture}" x="${s * 0.05}" y="${h * 0.08}" width="${s * 0.9}" height="${h}" preserveAspectRatio="xMidYMid slice" opacity=".55" style="filter:invert(1)"/>` : ''}
      <polygon points="${s / 2},1.5 1.3,${h - 0.8} ${s - 1.3},${h - 0.8}" fill="none" stroke="${hot ? ink : line}" stroke-width="1.6" stroke-opacity=".9"/>
      <polygon points="${s / 2},${h * 0.42} ${s * 0.32},${h * 0.8} ${s * 0.68},${h * 0.8}" fill="none" stroke="${hot ? ink : line}" stroke-width="1" stroke-opacity=".35"/>
    </svg>`
    body.append(div)
    return { div, m, o, n, burst: new Spring(0, { stiffness: 90, damping: 8 + (i % 5) }) }
  })

  // rotation as a quaternion-free pair of accumulated matrices is overkill here: integrate yaw/pitch velocities
  let rx = -18, ry = 24
  const vx = new Spring(0, { stiffness: 2.2, damping: 2.4 }), vy = new Spring(16, { stiffness: 2.2, damping: 2.4 })
  vy.target = reduced() ? 0 : 16; vx.target = 0
  let drag = null
  el.addEventListener('pointerdown', (e) => { el.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 } })
  el.addEventListener('pointermove', (e) => {
    if (!drag) return
    const now = performance.now(), dt = Math.max(8, now - drag.t) / 1000
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y
    ry += dx * 0.45; rx -= dy * 0.45
    vy.value = (dx * 0.45) / dt; vx.value = (-dy * 0.45) / dt
    vy.velocity = vx.velocity = 0
    drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY; drag.t = now
  })
  el.addEventListener('pointerup', () => {
    if (drag && drag.moved < 6 && !reduced()) { faces.forEach((f) => { f.burst.velocity = 0; f.burst.target = 1; setTimeout(() => (f.burst.target = 0), 380) }) }
    drag = null
  })
  const stop = loop((dt) => {
    if (!drag) { vx.step(dt); vy.step(dt); rx += vx.value * dt; ry += vy.value * dt }
    body.style.transform = `rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`
    faces.forEach((f) => {
      const b = f.burst.step(dt) * radius * 0.55
      const o = add(f.o, mul(f.n, b))
      f.div.style.transform = `matrix3d(${f.m.map((x) => x.toFixed(5)).join(',')},${o.map((x) => x.toFixed(3)).join(',')},1)`
    })
    return el.isConnected
  })
  return { destroy() { stop(); el.innerHTML = '' } }
}
