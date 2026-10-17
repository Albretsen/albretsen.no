// Escape Vector: contour terrain built from CSS 3D transforms only (no WebGL, no canvas).
// The brief asked for "a shader landscape that reacts to the cursor"; this is the rebellious answer:
// a crater field drawn as ~20 stacked SVG contour slices, each a real DOM plane in 3D.
//   - the cursor tilts and yaws the world on hand-rolled springs
//   - a red probe vector stands on the terrain under the cursor and reads its altitude
//   - press and hold: gravity switches off, slices drift apart; release: they settle with overshoot
//
// import { mountTerrain } from './assets/3d/escape-terrain.js'
// const t = mountTerrain(document.querySelector('#hero-terrain'), { seed: 0x5405b9 })
import { Spring, loop, reduced } from '../motion.js'

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) }

function heightfield(N, seed) {
  const r = rng(seed)
  // value noise lattice
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
    // broad ridge running diagonally, the "highlands"
    v += Math.exp(-(((x - y) * 0.9 + 0.1) ** 2) / 0.02) * 0.35
    for (const c of craters) {
      const dd = Math.hypot(x - c.x, y - c.y) / c.rad
      if (dd < 1.6) v += c.rad * c.d * (dd < 1 ? (dd * dd - 1) * 2.2 : Math.exp(-((dd - 1) ** 2) / 0.05) * 1.3)
    }
    // falloff to an island so slices have edges
    const e = Math.hypot(x - 0.5, y - 0.5) / 0.5
    v *= 1 - Math.min(1, Math.max(0, (e - 0.62) / 0.38)) ** 2
    h[j * N + i] = v; mn = Math.min(mn, v); mx = Math.max(mx, v)
  }
  for (let k = 0; k < h.length; k++) h[k] = (h[k] - mn) / (mx - mn)
  return h
}

// marching squares -> SVG path data for one iso level
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

const CSS = `
.evt{position:relative;width:100%;height:100%;perspective:1400px;perspective-origin:50% 30%;overflow:hidden;touch-action:none;cursor:crosshair;user-select:none}
.evt-world{position:absolute;left:50%;top:56%;transform-style:preserve-3d}
.evt-layer{position:absolute;left:0;top:0;transform-style:preserve-3d;pointer-events:none}
.evt-layer svg{display:block;overflow:visible}
.evt-probe{position:absolute;left:0;top:0;width:2px;transform-origin:50% 0;background:var(--ev-burn,#f34046);pointer-events:none}
.evt-probe::after{content:"";position:absolute;left:-5px;bottom:-6px;width:12px;height:12px;border-radius:50%;background:var(--ev-burn,#f34046)}
.evt-ring{position:absolute;left:0;top:0;border:1.5px solid var(--ev-burn,#f34046);border-radius:50%;pointer-events:none}
.evt-hud{position:absolute;font:500 11px/1.6 var(--ev-mono,ui-monospace,monospace);letter-spacing:.08em;color:#fff;text-transform:uppercase;pointer-events:none;white-space:nowrap}
.evt-hud b{color:var(--ev-burn,#f34046);font-weight:600}`

export function mountTerrain(el, { seed = 0x5405b9, levels = 20, N = 84, size = 760, color = '#ffffff', accent = '#f34046', hud = true } = {}) {
  if (!document.getElementById('evt-css')) { const st = document.createElement('style'); st.id = 'evt-css'; st.textContent = CSS; document.head.append(st) }
  el.classList.add('evt')
  const h = heightfield(N, seed)
  const world = document.createElement('div'); world.className = 'evt-world'; el.append(world)
  const S = size, half = S / 2
  const layers = []
  // base grid plane
  const grid = document.createElement('div'); grid.className = 'evt-layer'
  grid.innerHTML = `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><g stroke="${color}" stroke-opacity=".12" stroke-width="1">${Array.from({ length: 13 }, (_, i) => `<path d="M${i * S / 12} 0V${S}M0 ${i * S / 12}H${S}"/>`).join('')}</g><rect width="${S}" height="${S}" fill="none" stroke="${color}" stroke-opacity=".35"/></svg>`
  world.append(grid)
  for (let l = 0; l < levels; l++) {
    const iso = (l + 0.5) / levels
    const div = document.createElement('div'); div.className = 'evt-layer'
    const hot = l >= levels - 3
    const op = (0.25 + 0.75 * (l / levels)).toFixed(2)
    div.innerHTML = `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><path d="${contour(h, N, iso, S)}" fill="none" stroke="${hot ? accent : color}" stroke-opacity="${hot ? 1 : op}" stroke-width="${hot ? 1.8 : 1.15}" stroke-linecap="round"/></svg>`
    world.append(div); layers.push({ div, iso, rise: new Spring(0, { stiffness: 90 + l * 3, damping: 13 }) })
  }
  const probe = document.createElement('div'); probe.className = 'evt-probe'; world.append(probe)
  const ring = document.createElement('div'); ring.className = 'evt-ring'; world.append(ring)
  const hudEl = document.createElement('div'); hudEl.className = 'evt-hud'; if (hud) el.append(hudEl)

  const tilt = new Spring(62, { stiffness: 60, damping: 12 }), yaw = new Spring(-28, { stiffness: 50, damping: 11 })
  const gap = new Spring(9, { stiffness: 70, damping: 7 })
  const px = new Spring(0.5, { stiffness: 140, damping: 20 }), py = new Spring(0.5, { stiffness: 140, damping: 20 })
  let scale = 1
  const fit = () => { const r = el.getBoundingClientRect(); scale = Math.min(r.width / (S * 1.55), r.height / (S * 1.05)) }
  fit(); const ro = new ResizeObserver(fit); ro.observe(el)

  const toPlane = (cx, cy) => {
    const r = el.getBoundingClientRect()
    let sx = (cx - (r.left + r.width / 2)) / scale, sy = (cy - (r.top + r.height * 0.56)) / scale
    sy /= Math.max(0.2, Math.cos(tilt.value * Math.PI / 180))
    const a = -yaw.value * Math.PI / 180
    const x = sx * Math.cos(a) - sy * Math.sin(a), y = sx * Math.sin(a) + sy * Math.cos(a)
    return [x / S + 0.5, y / S + 0.5]
  }
  const onMove = (e) => {
    const r = el.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5
    if (!reduced()) { tilt.target = 62 - ny * 14; yaw.target = -28 + nx * 30 }
    const [u, v] = toPlane(e.clientX, e.clientY); px.target = Math.min(1, Math.max(0, u)); py.target = Math.min(1, Math.max(0, v))
  }
  const onDown = () => { gap.target = reduced() ? 9 : 26 }
  const onUp = () => { gap.target = 9 }
  el.addEventListener('pointermove', onMove); el.addEventListener('pointerdown', onDown)
  addEventListener('pointerup', onUp); el.addEventListener('pointerleave', () => { tilt.target = 62; yaw.target = -28 })

  // entrance: slices rise from the floor one after another
  const t0 = performance.now()
  layers.forEach((L, i) => setTimeout(() => (L.rise.target = 1), reduced() ? 0 : 120 + i * 55))
  if (reduced()) layers.forEach((L) => L.rise.set(1))

  const sample = (u, v) => { const i = Math.round(u * (N - 1)), j = Math.round(v * (N - 1)); return h[j * N + i] || 0 }
  const stop = loop((dt) => {
    tilt.step(dt); yaw.step(dt); gap.step(dt); px.step(dt); py.step(dt)
    const breathe = reduced() ? 0 : Math.sin((performance.now() - t0) / 1600) * 0.6
    world.style.transform = `scale(${scale.toFixed(4)}) rotateX(${tilt.value.toFixed(3)}deg) rotateZ(${yaw.value.toFixed(3)}deg) translate(${-half}px, ${-half}px)`
    layers.forEach((L, i) => { L.rise.step(dt); L.div.style.transform = `translateZ(${((i + 1) * (gap.value + breathe) * L.rise.value).toFixed(2)}px)`; L.div.style.opacity = Math.min(1, L.rise.value * 1.5).toFixed(2) })
    const alt = sample(px.value, py.value), lvl = Math.floor(alt * levels)
    const z = (lvl + 1) * gap.value
    const X = px.value * S, Y = py.value * S
    probe.style.height = `${(z + 60).toFixed(1)}px`
    probe.style.transform = `translate3d(${X - 1}px, ${Y}px, 0) rotateX(90deg)`
    ring.style.width = ring.style.height = '44px'
    ring.style.transform = `translate3d(${X - 22}px, ${Y - 22}px, ${z.toFixed(1)}px)`
    if (hud) hudEl.innerHTML = `<b>Probe</b> ${(px.value * 100).toFixed(1).padStart(5, '0')} / ${(py.value * 100).toFixed(1).padStart(5, '0')}<br>Alt ${(alt * 100).toFixed(0).padStart(3, '0')} &nbsp;Lvl ${String(lvl).padStart(2, '0')} &nbsp;G ${gap.value > 12 ? '<b>0.0</b>' : '1.0'}`
    if (hud) { hudEl.style.left = '24px'; hudEl.style.bottom = '20px' }
    return el.isConnected
  })
  return { destroy() { stop(); ro.disconnect(); el.innerHTML = '' }, heightAt: sample }
}
