// Drift Field: the canvas-2D centrepiece of "Warm Boot".
// An airbrushed topographic field that powers on like a CRT, then drifts.
// Contour lines come from marching squares over 3D simplex noise (x, y, time);
// each level is coloured along the dawn ramp and drawn twice (wide + soft, then
// thin + bright) so it reads as airbrush rather than vector.
//
//   import { mountDriftField } from './assets/generative/drift-field.js'
//   const field = mountDriftField(canvas, { levels: 14 })
//   field.boot(0..1)   // drive from GSAP; 0 = dark, 0.15 = scanline, 1 = full field
//   field.setHour(0..1) // 0 dawn, 0.5 noon, 1 blue hour: re-tints the ramp
//   field.pause(); field.resume(); field.destroy()
//
// No dependencies. Respects prefers-reduced-motion (renders a still frame).

// ---- simplex noise 3D (after Stefan Gustavson, public domain) ----
const F3 = 1 / 3, G3 = 1 / 6
function makeNoise(seed = 83) {
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  let s = seed >>> 0
  for (let i = 255; i > 0; i--) { s = (s * 1664525 + 1013904223) >>> 0; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]] }
  const perm = new Uint8Array(512); for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
  const g = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]]
  return (x, y, z) => {
    const s = (x + y + z) * F3, i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s)
    const t = (i + j + k) * G3, x0 = x - i + t, y0 = y - j + t, z0 = z - k + t
    let i1, j1, k1, i2, j2, k2
    if (x0 >= y0) { if (y0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=1;k2=0 } else if (x0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=0;k2=1 } else { i1=0;j1=0;k1=1;i2=1;j2=0;k2=1 } }
    else { if (y0 < z0) { i1=0;j1=0;k1=1;i2=0;j2=1;k2=1 } else if (x0 < z0) { i1=0;j1=1;k1=0;i2=0;j2=1;k2=1 } else { i1=0;j1=1;k1=0;i2=1;j2=1;k2=0 } }
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3
    const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3
    const ii = i & 255, jj = j & 255, kk = k & 255
    let n = 0
    const c = (xx, yy, zz, gi) => { let t = 0.6 - xx*xx - yy*yy - zz*zz; if (t < 0) return 0; t *= t; const gg = g[gi % 12]; return t * t * (gg[0]*xx + gg[1]*yy + gg[2]*zz) }
    n += c(x0, y0, z0, perm[ii + perm[jj + perm[kk]]])
    n += c(x1, y1, z1, perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]])
    n += c(x2, y2, z2, perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]])
    n += c(x3, y3, z3, perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]])
    return 32 * n
  }
}

// palette ramps (sRGB), low -> high
const RAMPS = {
  dawn:  ['#063645', '#2c4a63', '#8b637f', '#bc6449', '#e8a95c', '#eedbbd'],
  noon:  ['#499d8e', '#8fc4b4', '#e8d6b0', '#e8a95c', '#bc6449', '#7a3a2a'],
  blue:  ['#041419', '#063645', '#25596a', '#499d8e', '#7defda', '#d8fff6'],
}
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const lerp = (a, b, t) => a + (b - a) * t
function rampAt(r, t) {
  const n = r.length - 1, x = Math.min(Math.max(t, 0), 1) * n, i = Math.min(Math.floor(x), n - 1), f = x - i
  const a = hex(r[i]), b = hex(r[i + 1])
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)]
}
function mix3(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)] }

export function mountDriftField(canvas, opts = {}) {
  const ctx = canvas.getContext('2d')
  const noise = makeNoise(opts.seed ?? 83)
  const levels = opts.levels ?? 14
  const cell = opts.cell ?? 9          // CSS px per grid cell
  const speed = opts.speed ?? 0.035    // drift speed
  const scale = opts.scale ?? 0.0021   // feature size
  const mode = opts.mode ?? 'raster'   // 'raster' (scanlines rise into mesas) or 'contour' (topographic)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  let W = 0, H = 0, dpr = 1, cols = 0, rows = 0, field = new Float32Array(0)
  let bootP = opts.boot ?? 1, hour = opts.hour ?? 0, t = opts.time ?? 0, raf = 0, running = true, last = performance.now()
  let px = -1e4, py = -1e4, ppx = -1e4, ppy = -1e4

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2)
    W = canvas.clientWidth || canvas.width; H = canvas.clientHeight || canvas.height
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
    cols = Math.ceil(W / cell) + 1; rows = Math.ceil(H / cell) + 1
    field = new Float32Array(cols * rows)
    draw()
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas)
  const onMove = (e) => { const r = canvas.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top }
  const onLeave = () => { px = py = -1e4 }
  if (opts.interactive !== false) { canvas.addEventListener('pointermove', onMove, { passive: true }); canvas.addEventListener('pointerleave', onLeave) }

  function sample() {
    ppx += (px - ppx) * 0.08; ppy += (py - ppy) * 0.08
    const r2 = (Math.min(W, H) * 0.22) ** 2
    for (let j = 0; j < rows; j++) {
      const y = j * cell
      for (let i = 0; i < cols; i++) {
        const x = i * cell
        // domain-warped fBm: slow continental drift + finer ripples
        const wx = noise(x * scale * 0.5, y * scale * 0.5, t * 0.3) * 60
        const wy = noise(x * scale * 0.5 + 31, y * scale * 0.5 + 17, t * 0.3) * 60
        let v = noise((x + wx) * scale, (y + wy) * scale * 1.6, t) * 0.65
        v += noise((x + wx) * scale * 2.3, (y + wy) * scale * 3.2, t * 1.4) * 0.25
        v += noise(x * scale * 6, y * scale * 8, t * 2) * 0.06
        // perspective tilt: lines bunch up toward a horizon at the top third
        v += (y / H) * 0.55
        // pointer: a warm rise under the cursor
        const dx = x - ppx, dy = y - ppy, d2 = dx * dx + dy * dy
        v += 0.45 * Math.exp(-d2 / r2)
        field[j * cols + i] = v
      }
    }
  }

  // marching squares for one threshold -> array of segments
  function contour(th) {
    const segs = []
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = field[j * cols + i], b = field[j * cols + i + 1], c = field[(j + 1) * cols + i + 1], d = field[(j + 1) * cols + i]
        const idx = (a > th ? 8 : 0) | (b > th ? 4 : 0) | (c > th ? 2 : 0) | (d > th ? 1 : 0)
        if (idx === 0 || idx === 15) continue
        const x = i * cell, y = j * cell
        const top = [x + cell * (th - a) / (b - a), y], right = [x + cell, y + cell * (th - b) / (c - b)]
        const bottom = [x + cell * (th - d) / (c - d), y + cell], left = [x, y + cell * (th - a) / (d - a)]
        switch (idx) {
          case 1: case 14: segs.push(left, bottom); break
          case 2: case 13: segs.push(bottom, right); break
          case 3: case 12: segs.push(left, right); break
          case 4: case 11: segs.push(top, right); break
          case 5: segs.push(left, top, bottom, right); break
          case 6: case 9: segs.push(top, bottom); break
          case 7: case 8: segs.push(left, top); break
          case 10: segs.push(left, bottom, top, right); break
        }
      }
    }
    return segs
  }

  function ramp(t) {
    const a = hour < 0.5 ? RAMPS.dawn : RAMPS.noon, b = hour < 0.5 ? RAMPS.noon : RAMPS.blue
    const f = hour < 0.5 ? hour * 2 : (hour - 0.5) * 2
    return mix3(rampAt(a, t), rampAt(b, t), f)
  }

  // ---- RASTER mode: CRT scanlines that rise into a mesa landscape ----
  const mesa = (v) => {
    // terrace the noise into flat-topped buttes with steep walls
    const k = 3.2, q = Math.floor(v * k), f = v * k - q
    const st = f < 0.78 ? 0 : (f - 0.78) / 0.22
    return (q + st * st * (3 - 2 * st)) / k
  }
  function height(xw, zw) {
    const base = noise(xw * 0.10, zw * 0.10, 3.1) * 0.5 + 0.5
    const n = noise(xw * 0.22, zw * 0.22, 7.7) * 0.6 + noise(xw * 0.6, zw * 0.6, 1.3) * 0.12
    const v = Math.max(0, n + base * 0.7 - 0.22)
    return mesa(v) * 1.15 + noise(xw * 2.2, zw * 2.2, 9) * 0.015
  }
  function skyStops() {
    return hour < 0.5
      ? [['#061a22', 0], ['#20334a', 0.35], ['#6c5577', 0.62], ['#bc6449', 0.84], ['#efc27f', 1]]
      : [['#041419', 0], ['#0a2a36', 0.4], ['#2c4f62', 0.7], ['#6b6a86', 0.9], ['#c99a8a', 1]]
  }
  function drawSky(hor) {
    const c = skyStops()
    const sky = ctx.createLinearGradient(0, 0, 0, hor)
    c.forEach(([col, o]) => sky.addColorStop(o, col))
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hor + 1)
    // banded sun
    const sr = Math.min(W, H) * 0.16, sx = W * (opts.sunX ?? 0.62), sy = hor - sr * 0.35
    const halo = ctx.createRadialGradient(sx, sy, sr * 0.3, sx, sy, sr * 4)
    halo.addColorStop(0, 'rgba(240,170,110,0.35)'); halo.addColorStop(0.5, 'rgba(139,99,127,0.10)'); halo.addColorStop(1, 'rgba(139,99,127,0)')
    ctx.fillStyle = halo; ctx.fillRect(0, 0, W, hor)
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, hor); ctx.clip(); ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.clip()
    const sg = ctx.createLinearGradient(0, sy - sr, 0, sy + sr)
    sg.addColorStop(0, '#fbf3df'); sg.addColorStop(0.5, '#f1cf8e'); sg.addColorStop(1, '#d9875a')
    ctx.fillStyle = sg; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2)
    const sky2 = ctx.createLinearGradient(0, 0, 0, hor); c.forEach(([col, o]) => sky2.addColorStop(o, col))
    ctx.fillStyle = sky2
    for (let b = 0; b < 5; b++) { const y0 = sy - sr * 0.05 + sr * b * 0.15, gh = sr * (0.022 + b * 0.022); ctx.fillRect(sx - sr, y0, sr * 2, gh) }
    ctx.restore()
  }
  function drawRaster() {
    const hor = H * (opts.horizon ?? 0.46)
    const p1 = Math.min(bootP / 0.15, 1)
    const p2 = Math.max(0, (bootP - 0.15) / 0.85)
    const rise = p2 < 0.25 ? 0 : Math.min((p2 - 0.25) / 0.75, 1)
    const amp = (1 - Math.pow(1 - rise, 3)) * H * 0.26  // ease-out cubic
    if (opts.sky !== false && p2 > 0) { ctx.globalAlpha = Math.min(p2 * 2, 1); drawSky(hor); ctx.globalAlpha = 1 }
    const N = opts.lines ?? 64, K = (H - hor) * 1.0, zNear = 1, zFar = 48
    const sweep = hor + (H - hor) * Math.min(p2 * 2.2, 1) // raster reveal, horizon -> viewer
    const step = Math.max(3, Math.round(W / 360))
    const floorFar = hour < 0.5 ? [58, 36, 40] : [10, 38, 48], floorNear = [4, 20, 25]
    if (p2 > 0) { ctx.fillStyle = `rgb(${floorFar.join(',')})`; ctx.fillRect(0, hor, W, H - hor) }
    for (let i = N - 1; i >= 0; i--) {         // far to near (painter)
      const u = i / (N - 1)
      const z = zNear * Math.pow(zFar / zNear, u)
      const base = hor + K / z
      if (p2 <= 0 || (base > sweep && p2 < 1)) continue
      ctx.beginPath()
      let first = true
      for (let x = -step; x <= W + step; x += step) {
        const xw = (x - W / 2) * z / K
        const h = height(xw, z + t * 6)
        const y = base - (h * amp) / z
        if (first) { ctx.moveTo(x, y); first = false } else ctx.lineTo(x, y)
      }
      // occlude what lies behind this ridge
      ctx.lineTo(W + step, H); ctx.lineTo(-step, H); ctx.closePath()
      const depth = 1 - u
      const fc = mix3(floorFar, floorNear, Math.pow(depth, 0.7))
      ctx.fillStyle = `rgb(${fc[0] | 0},${fc[1] | 0},${fc[2] | 0})`
      ctx.fill()
      const [r, g, b] = ramp(0.2 + 0.8 * u)
      const fade = 0.45 + 0.55 * depth
      ctx.strokeStyle = `rgba(${r | 0},${g | 0},${b | 0},${0.14 * fade})`; ctx.lineWidth = 6; ctx.stroke()
      ctx.strokeStyle = `rgba(${Math.min(r + 30, 255) | 0},${Math.min(g + 25, 255) | 0},${Math.min(b + 20, 255) | 0},${0.95 * fade})`; ctx.lineWidth = 0.8 + depth * 1.0; ctx.stroke()
    }
    // phase 1: the single phosphor line opening at the horizon
    if (bootP < 0.22) {
      const w = W * Math.pow(p1, 0.6), a = bootP < 0.15 ? 1 : Math.max(0, 1 - (bootP - 0.15) / 0.07)
      const g = ctx.createLinearGradient(W / 2 - w / 2, 0, W / 2 + w / 2, 0)
      g.addColorStop(0, 'rgba(125,239,218,0)'); g.addColorStop(0.5, `rgba(216,255,246,${0.95 * a})`); g.addColorStop(1, 'rgba(125,239,218,0)')
      ctx.fillStyle = g; ctx.fillRect(W / 2 - w / 2, hor - 1, w, 2)
      ctx.globalAlpha = 0.3 * a; ctx.fillRect(W / 2 - w / 2, hor - 7, w, 14); ctx.globalAlpha = 1
    }
  }

  function draw() {
    if (!W) return
    if (mode === 'raster') { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); drawRaster(); return }
    drawContour()
  }

  function drawContour() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    // phase 1 (0..0.15): a single phosphor scanline opens from the centre
    const p1 = Math.min(bootP / 0.15, 1)
    if (bootP < 0.15) {
      const w = W * Math.pow(p1, 0.6)
      const g = ctx.createLinearGradient(W / 2 - w / 2, 0, W / 2 + w / 2, 0)
      g.addColorStop(0, 'rgba(125,239,218,0)'); g.addColorStop(0.5, 'rgba(216,255,246,0.95)'); g.addColorStop(1, 'rgba(125,239,218,0)')
      ctx.fillStyle = g; ctx.fillRect(W / 2 - w / 2, H / 2 - 1, w, 2)
      ctx.globalAlpha = 0.35; ctx.fillRect(W / 2 - w / 2, H / 2 - 6, w, 12); ctx.globalAlpha = 1
      return
    }
    sample()
    // phase 2 (0.15..1): the raster sweeps down; levels join one by one, on a beat
    const p2 = (bootP - 0.15) / 0.85
    const sweepY = H * Math.min(p2 * 1.35, 1)
    const shownLevels = Math.ceil(levels * Math.min(p2 * 1.15, 1))
    ctx.save()
    ctx.beginPath(); ctx.rect(0, 0, W, sweepY); ctx.clip()
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    for (let l = 0; l < shownLevels; l++) {
      const th = -0.35 + (l / (levels - 1)) * 1.45
      const segs = contour(th)
      if (!segs.length) continue
      const [r, g, b] = ramp(l / (levels - 1))
      ctx.beginPath()
      for (let s = 0; s < segs.length; s += 2) { ctx.moveTo(segs[s][0], segs[s][1]); ctx.lineTo(segs[s + 1][0], segs[s + 1][1]) }
      // airbrush halo
      ctx.strokeStyle = `rgba(${r | 0},${g | 0},${b | 0},0.10)`; ctx.lineWidth = 7; ctx.stroke()
      ctx.strokeStyle = `rgba(${r | 0},${g | 0},${b | 0},0.22)`; ctx.lineWidth = 3; ctx.stroke()
      // core
      ctx.strokeStyle = `rgba(${Math.min(r + 25, 255) | 0},${Math.min(g + 20, 255) | 0},${Math.min(b + 15, 255) | 0},0.9)`; ctx.lineWidth = 1; ctx.stroke()
    }
    ctx.restore()
    // the raster's leading edge
    if (p2 < 0.75) {
      const g = ctx.createLinearGradient(0, sweepY - 40, 0, sweepY)
      g.addColorStop(0, 'rgba(125,239,218,0)'); g.addColorStop(1, 'rgba(125,239,218,0.35)')
      ctx.fillStyle = g; ctx.fillRect(0, sweepY - 40, W, 40)
      ctx.fillStyle = 'rgba(216,255,246,0.9)'; ctx.fillRect(0, sweepY - 1, W, 1.5)
    }
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now
    if (!reduce) t += dt * speed
    draw()
    if (running && !reduce) raf = requestAnimationFrame(frame)
  }
  resize()
  if (!reduce) raf = requestAnimationFrame(frame)

  return {
    boot(v) { bootP = v; if (reduce || !running) draw() },
    setHour(v) { hour = v; if (reduce || !running) draw() },
    pause() { running = false; cancelAnimationFrame(raf) },
    resume() { if (!running && !reduce) { running = true; last = performance.now(); raf = requestAnimationFrame(frame) } },
    destroy() { running = false; cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave) },
  }
}
