// Escape Vector, site build: the landing-site terrain.
// Extends assets/3d/escape-terrain.js (same heightfield, same contour slicing, CSS 3D only) with:
//   - product beacons: real logo tiles standing on the high ground, billboarded to face the camera
//   - probe lock: when the probe comes near a beacon it locks on and reports it (onProbe)
//   - autopilot: with no pointer for a few seconds the probe tours the beacons by itself
//   - keyboard: arrows steer the probe, Enter follows the locked beacon, G toggles gravity
//   - an offset origin so the world can sit to the right of the headline
import { Spring, loop, reduced } from '../assets/motion.js'

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) }

function heightfield(N, seed) {
  const r = rng(seed)
  const G = 9, lat = Array.from({ length: (G + 1) * (G + 1) }, () => r())
  const vn = (x, y) => {
    const gx = x * G, gy = y * G, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy
    const s = (t) => t * t * (3 - 2 * t), a = lat[iy * (G + 1) + ix], b = lat[iy * (G + 1) + ix + 1], c = lat[(iy + 1) * (G + 1) + ix], d = lat[(iy + 1) * (G + 1) + ix + 1]
    return (a + (b - a) * s(fx)) + ((c + (d - c) * s(fx)) - (a + (b - a) * s(fx))) * s(fy)
  }
  const craters = Array.from({ length: 16 }, (_, i) => ({ x: r(), y: r(), rad: i < 3 ? 0.14 + r() * 0.1 : 0.03 + r() * 0.07, d: 0.6 + r() * 0.5 }))
  const h = new Float32Array(N * N)
  let mn = Infinity, mx = -Infinity
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = i / (N - 1), y = j / (N - 1)
    let v = vn(x * 0.999, y * 0.999) * 0.55 + vn((x * 2.1) % 0.999, (y * 2.1) % 0.999) * 0.07
    v += Math.exp(-(((x - y) * 0.9 + 0.1) ** 2) / 0.02) * 0.35
    for (const c of craters) {
      const dd = Math.hypot(x - c.x, y - c.y) / c.rad
      if (dd < 1.6) v += c.rad * c.d * (dd < 1 ? (dd * dd - 1) * 2.2 : Math.exp(-((dd - 1) ** 2) / 0.05) * 1.3)
    }
    const e = Math.hypot(x - 0.5, y - 0.5) / 0.5
    v *= 1 - Math.min(1, Math.max(0, (e - 0.62) / 0.38)) ** 2
    h[j * N + i] = v; mn = Math.min(mn, v); mx = Math.max(mx, v)
  }
  for (let k = 0; k < h.length; k++) h[k] = (h[k] - mn) / (mx - mn)
  return h
}

function contour(h, N, iso, S) {
  const k = S / (N - 1); let d = ''
  const lerp = (a, b) => (iso - a) / (b - a)
  for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) {
    const a = h[j * N + i], b = h[j * N + i + 1], c = h[(j + 1) * N + i + 1], e = h[(j + 1) * N + i]
    const idx = (a > iso) | ((b > iso) << 1) | ((c > iso) << 2) | ((e > iso) << 3)
    if (idx === 0 || idx === 15) continue
    const T = [(i + lerp(a, b)) * k, j * k], R = [(i + 1) * k, (j + lerp(b, c)) * k], B = [(i + lerp(e, c)) * k, (j + 1) * k], L = [i * k, (j + lerp(a, e)) * k]
    const seg = { 1: [L, T], 2: [T, R], 3: [L, R], 4: [R, B], 5: [L, T, R, B], 6: [T, B], 7: [L, B], 8: [L, B], 9: [T, B], 10: [L, B, T, R], 11: [R, B], 12: [L, R], 13: [T, R], 14: [L, T] }[idx]
    for (let s = 0; s < seg.length; s += 2) d += `M${seg[s][0].toFixed(1)} ${seg[s][1].toFixed(1)}L${seg[s + 1][0].toFixed(1)} ${seg[s + 1][1].toFixed(1)}`
  }
  return d
}

// pick well-separated high points for the beacons, deterministic
function landingSites(h, N, count) {
  const cand = []
  for (let j = 4; j < N - 4; j += 2) for (let i = 4; i < N - 4; i += 2) {
    const u = i / (N - 1), v = j / (N - 1)
    if (Math.hypot(u - 0.5, v - 0.5) > 0.34) continue
    cand.push({ u, v, a: h[j * N + i] })
  }
  cand.sort((p, q) => q.a - p.a)
  const out = []
  for (const c of cand) {
    if (out.every((o) => Math.hypot(o.u - c.u, o.v - c.v) > 0.27)) out.push(c)
    if (out.length === count) break
  }
  return out
}

const CSS = `
.evt{position:relative;width:100%;height:100%;perspective:1400px;overflow:hidden;cursor:crosshair;user-select:none;-webkit-user-select:none}
.evt-world{position:absolute;transform-style:preserve-3d}
.evt-layer{position:absolute;left:0;top:0;transform-style:preserve-3d;pointer-events:none}
.evt-layer svg{display:block;overflow:visible}
.evt-probe{position:absolute;left:0;top:0;width:2px;transform-origin:50% 0;background:var(--ev-burn);pointer-events:none}
.evt-probe::after{content:"";position:absolute;left:-5px;bottom:-6px;width:12px;height:12px;border-radius:50%;background:var(--ev-burn)}
.evt-ring{position:absolute;left:0;top:0;width:44px;height:44px;border:1.5px solid var(--ev-burn);border-radius:50%;pointer-events:none}
.evt-bcn{position:absolute;left:0;top:0;width:120px;height:150px;transform-origin:50% 100%;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:flex-end}
.evt-bcn .tile{width:58px;height:58px;border-radius:14px;background:#fff;display:grid;place-items:center;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.6);transition:transform .5s var(--ev-spring),box-shadow .3s}
.evt-bcn .tile img{width:76%;height:76%;object-fit:contain;display:block}
.evt-bcn .tile.full img{width:100%;height:100%}
.evt-bcn .lbl{margin-top:8px;font:500 10px/1 var(--ev-mono);letter-spacing:.14em;text-transform:uppercase;color:#fff;background:rgba(7,7,7,.7);padding:4px 6px;white-space:nowrap}
.evt-bcn .stalk{width:1.5px;flex:1;min-height:20px;background:linear-gradient(rgba(255,255,255,.7),rgba(255,255,255,.1))}
.evt-bcn.lock .tile{transform:scale(1.28) translateY(-6px);box-shadow:0 0 0 2px var(--ev-burn),0 18px 40px rgba(0,0,0,.7)}
.evt-bcn.lock .lbl{background:var(--ev-burn);color:var(--ev-ink)}
.evt-bcn.lock .stalk{background:var(--ev-burn)}`

export function mountTerrain(el, { seed = 0x5405b9, levels = 20, N = 84, size = 760, color = '#ffffff', accent = '#f34046', beacons = [], origin = [0.5, 0.56], onProbe = () => {}, onFollow = () => {} } = {}) {
  if (!document.getElementById('evt-css')) { const st = document.createElement('style'); st.id = 'evt-css'; st.textContent = CSS; document.head.append(st) }
  el.classList.add('evt')
  const h = heightfield(N, seed)
  const world = document.createElement('div'); world.className = 'evt-world'; el.append(world)
  const S = size, half = S / 2
  const layers = []
  const grid = document.createElement('div'); grid.className = 'evt-layer'
  grid.innerHTML = `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" aria-hidden="true"><g stroke="${color}" stroke-opacity=".12" stroke-width="1">${Array.from({ length: 13 }, (_, i) => `<path d="M${i * S / 12} 0V${S}M0 ${i * S / 12}H${S}"/>`).join('')}</g><rect width="${S}" height="${S}" fill="none" stroke="${color}" stroke-opacity=".35"/></svg>`
  world.append(grid)
  for (let l = 0; l < levels; l++) {
    const iso = (l + 0.5) / levels
    const div = document.createElement('div'); div.className = 'evt-layer'
    const hot = l >= levels - 3
    const op = (0.25 + 0.75 * (l / levels)).toFixed(2)
    div.innerHTML = `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" aria-hidden="true"><path d="${contour(h, N, iso, S)}" fill="none" stroke="${hot ? accent : color}" stroke-opacity="${hot ? 1 : op}" stroke-width="${hot ? 1.8 : 1.15}" stroke-linecap="round"/></svg>`
    world.append(div); layers.push({ div, rise: new Spring(0, { stiffness: 90 + l * 3, damping: 13 }) })
  }
  const probe = document.createElement('div'); probe.className = 'evt-probe'; world.append(probe)
  const ring = document.createElement('div'); ring.className = 'evt-ring'; world.append(ring)

  // beacons
  const sites = landingSites(h, N, beacons.length)
  const bcn = beacons.map((b, i) => {
    const d = document.createElement('div'); d.className = 'evt-bcn'
    d.innerHTML = `<div class="tile${b.full ? ' full' : ''}"><img src="${b.logo}" alt="" draggable="false"></div><span class="lbl">${b.name}</span><span class="stalk"></span>`
    world.append(d)
    return { ...b, ...sites[i], el: d, pop: new Spring(0, { stiffness: 120, damping: 10 }) }
  })

  const tilt = new Spring(62, { stiffness: 60, damping: 12 }), yaw = new Spring(-28, { stiffness: 50, damping: 11 })
  const gap = new Spring(9, { stiffness: 70, damping: 7 })
  const px = new Spring(0.5, { stiffness: 140, damping: 20 }), py = new Spring(0.5, { stiffness: 140, damping: 20 })
  let scale = 1, W = 0, H = 0
  const fit = () => { const r = el.getBoundingClientRect(); W = r.width; H = r.height; const narrow = r.width < 700; scale = Math.min(r.width / (S * (narrow ? 1.12 : 1.58)), r.height / (S * (narrow ? 0.82 : 1.0))) }
  fit(); const ro = new ResizeObserver(fit); ro.observe(el)
  const setOrigin = (o) => { origin = o; world.style.left = `${o[0] * 100}%`; world.style.top = `${o[1] * 100}%`; el.style.perspectiveOrigin = `${o[0] * 100}% 30%` }
  setOrigin(origin)

  const toPlane = (cx, cy) => {
    const r = el.getBoundingClientRect()
    let sx = (cx - (r.left + r.width * origin[0])) / scale, sy = (cy - (r.top + r.height * origin[1])) / scale
    sy /= Math.max(0.2, Math.cos(tilt.value * Math.PI / 180))
    const a = -yaw.value * Math.PI / 180
    const x = sx * Math.cos(a) - sy * Math.sin(a), y = sx * Math.sin(a) + sy * Math.cos(a)
    return [x / S + 0.5, y / S + 0.5]
  }
  const clamp = (v) => Math.min(0.98, Math.max(0.02, v))
  let lastInput = -1e9, gravityOff = false, held = false
  const onMove = (e) => {
    lastInput = performance.now()
    const r = el.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5
    if (!reduced()) { tilt.target = 62 - ny * 14; yaw.target = -28 + nx * 30 }
    const [u, v] = toPlane(e.clientX, e.clientY); px.target = clamp(u); py.target = clamp(v)
  }
  const applyGap = () => { gap.target = reduced() ? 9 : (gravityOff || held) ? 26 : 9 }
  const onDown = (e) => { if (e.button !== 0) return; held = true; applyGap(); downAt = performance.now() }
  let downAt = 0
  const onUp = () => {
    if (!held) return
    held = false; applyGap()
    if (performance.now() - downAt < 220 && locked) onFollow(locked)
  }
  el.addEventListener('pointermove', onMove); el.addEventListener('pointerdown', onDown)
  addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp)
  el.addEventListener('pointerleave', () => { tilt.target = 62; yaw.target = -28 })
  el.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 0.08 : 0.03
    const k = e.key
    if (k.startsWith('Arrow')) {
      e.preventDefault(); lastInput = performance.now()
      if (k === 'ArrowLeft') px.target = clamp(px.target - step)
      if (k === 'ArrowRight') px.target = clamp(px.target + step)
      if (k === 'ArrowUp') py.target = clamp(py.target - step)
      if (k === 'ArrowDown') py.target = clamp(py.target + step)
    } else if (k === 'Enter' && locked) { e.preventDefault(); onFollow(locked) }
    else if (k === 'g' || k === 'G') api.gravity(!gravityOff)
  })

  const t0 = performance.now()
  layers.forEach((L, i) => setTimeout(() => (L.rise.target = 1), reduced() ? 0 : 120 + i * 55))
  bcn.forEach((b, i) => setTimeout(() => (b.pop.target = 1), reduced() ? 0 : 1300 + i * 160))
  if (reduced()) { layers.forEach((L) => L.rise.set(1)); bcn.forEach((b) => b.pop.set(1)) }

  // autopilot: tour the beacons while nobody is steering
  let tour = 0, nextHop = 0
  const sample = (u, v) => { const i = Math.round(u * (N - 1)), j = Math.round(v * (N - 1)); return h[j * N + i] || 0 }
  let locked = null, lastReport = ''
  const stop = loop((dt) => {
    const now = performance.now()
    if (!reduced() && bcn.length && now - lastInput > 3800 && now > nextHop && now - t0 > 2200) {
      const b = bcn[tour++ % bcn.length]; px.target = b.u + 0.012; py.target = b.v + 0.012; nextHop = now + 2900
    }
    tilt.step(dt); yaw.step(dt); gap.step(dt); px.step(dt); py.step(dt)
    const breathe = reduced() ? 0 : Math.sin((now - t0) / 1600) * 0.6
    world.style.transform = `scale(${scale.toFixed(4)}) rotateX(${tilt.value.toFixed(3)}deg) rotateZ(${yaw.value.toFixed(3)}deg) translate(${-half}px, ${-half}px)`
    layers.forEach((L, i) => { L.rise.step(dt); L.div.style.transform = `translateZ(${((i + 1) * (gap.value + breathe) * L.rise.value).toFixed(2)}px)`; L.div.style.opacity = Math.min(1, L.rise.value * 1.5).toFixed(2) })
    const alt = sample(px.value, py.value), lvl = Math.floor(alt * levels)
    const z = (lvl + 1) * gap.value
    const X = px.value * S, Y = py.value * S
    probe.style.height = `${(z + 60).toFixed(1)}px`
    probe.style.transform = `translate3d(${X - 1}px, ${Y}px, 0) rotateX(90deg)`
    ring.style.transform = `translate3d(${X - 22}px, ${Y - 22}px, ${z.toFixed(1)}px)`
    // beacons: stand on their altitude, billboard toward the camera
    let near = null, nd = 0.075
    const inv = `rotateZ(${(-yaw.value).toFixed(3)}deg) rotateX(${(-tilt.value).toFixed(3)}deg)`
    for (const b of bcn) {
      const p = b.pop.step(dt)
      const bz = (Math.floor(b.a * levels) + 1) * gap.value * layers[0].rise.value
      b.el.style.transform = `translate3d(${(b.u * S - 60).toFixed(1)}px, ${(b.v * S - 150).toFixed(1)}px, ${bz.toFixed(1)}px) ${inv} scale(${(p * (W < 700 ? 0.78 : 1.05) / scale).toFixed(3)})`
      b.el.style.opacity = Math.min(1, p).toFixed(2)
      const d = Math.hypot(b.u - px.value, b.v - py.value)
      if (d < nd) { nd = d; near = b }
    }
    if (near !== locked) { if (locked) locked.el.classList.remove('lock'); if (near) near.el.classList.add('lock'); locked = near; el.classList.toggle('is-locked', !!near) }
    const report = `${px.value.toFixed(3)}${py.value.toFixed(3)}${lvl}${gap.value > 12}${locked ? locked.id : ''}`
    if (report !== lastReport) { lastReport = report; onProbe({ u: px.value, v: py.value, alt, lvl, zeroG: gap.value > 12, locked }) }
    return el.isConnected
  })
  const api = {
    destroy() { stop(); ro.disconnect(); el.innerHTML = '' },
    gravity(off) { gravityOff = !!off; applyGap(); return gravityOff },
    get gravityOff() { return gravityOff },
    setOrigin,
    aim(id) { const b = bcn.find((x) => x.id === id); if (b) { lastInput = performance.now(); px.target = b.u + 0.012; py.target = b.v + 0.012 } },
  }
  return api
}
