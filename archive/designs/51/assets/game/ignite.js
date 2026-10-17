// IGNITE — the playable introduction for Albretsen AS (design 51, "Sodium Orbit").
//
// A molten spark follows your pointer (or your arrow keys). Fly it through a
// cold lamp and the lamp strikes: it flashes neon pink (hue 0, the seed hue),
// then warms up to sodium orange, exactly the way a real sodium street lamp
// does. Each lamp is a product. Light all of them and the sparks gather into
// the Albretsen mark. Leave it alone and it plays itself (attract mode).
//
// No dependencies. Canvas 2D with additive blending and a typed-array particle
// pool (4096 particles). Pauses offscreen and in hidden tabs. Honours
// prefers-reduced-motion (renders the finished, lit state without animation).
//
// Usage:
//   import { createIgnite } from './ignite.js'
//   const game = createIgnite(canvas, { lamps: [...] })
//   canvas.addEventListener('ignite:strike', e => console.log(e.detail))
//   game.strike('fun-libs')   // light a lamp from a button (keyboard users)
//   game.reset(); game.destroy()
//
// Events (dispatched on the canvas, bubbling):
//   ignite:strike   {id, name, index, litCount, total}
//   ignite:complete {total}
//   ignite:secret   {}   (easter egg: type 2016, or the Konami code)

const TAU = Math.PI * 2;

// Molten ramp: white-hot filament -> sodium -> ember -> neon (seed hue 0) -> cooled night blue
const RAMP = ['#fff4d6', '#ffe196', '#ffc35a', '#fb942a', '#f4742f', '#ef5b36', '#e63281', '#a52a8a', '#4a3f9a', '#234877'];

// Lamps sit ON the Albretsen mark: `m` is a position along the parabolic arc
// (0..1) or 'dot' for the spark at its centre. Light them all and the arc fills in.
// A lamp may instead give plain {x, y} in 0..1 of the canvas.
export const DEFAULT_LAMPS = [
  { id: 'harbor', name: 'Harbor', m: 0.1 },
  { id: 'mcp-emails', name: 'MCP Emails', m: 0.4 },
  { id: 'toolrails', name: 'Toolrails', m: 0.86 },
  { id: 'fun-libs', name: 'Fun Libs', m: 'dot' },
];

function arcPoint(t) {
  const x = (1 - t) ** 2 * 11 + 2 * (1 - t) * t * 32 + t * t * 53;
  const y = (1 - t) ** 2 * 55 + 2 * (1 - t) * t * -29 + t * t * 55;
  return [(x - 32) / 64, (y - 34) / 64];
}

function makeSprite(color, size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const r = size / 2;
  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0, '#ffffff');
  grd.addColorStop(0.12, color);
  grd.addColorStop(0.4, color + '55');
  grd.addColorStop(1, color + '00');
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}

function mix(a, b, t) { return a + (b - a) * t; }
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbMix(h1, h2, t) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  return `rgb(${Math.round(mix(a[0], b[0], t))},${Math.round(mix(a[1], b[1], t))},${Math.round(mix(a[2], b[2], t))})`;
}

// Sample points on the Albretsen mark (parabolic arc + spark) in unit space.
function markPoints(n) {
  const pts = [];
  const arcN = Math.floor(n * 0.82);
  for (let i = 0; i < arcN; i++) {
    const t = i / (arcN - 1);
    // Quadratic: P0(11,55) C(32,-29) P2(53,55) in a 64 box
    const [x, y] = arcPoint(t);
    pts.push([x + (Math.random() - 0.5) * 0.012, y + (Math.random() - 0.5) * 0.012, 0]);
  }
  for (let i = arcN; i < n; i++) {
    const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 0.075;
    pts.push([Math.cos(a) * r, (40 - 34) / 64 + Math.sin(a) * r, 1]);
  }
  return pts;
}

export function createIgnite(canvas, options = {}) {
  const opts = {
    lamps: DEFAULT_LAMPS,
    max: 4096,
    attractAfter: 3200, // ms of idle before autopilot takes over
    secretLamp: { id: 'play-2016', name: 'Google Play, 2016', x: 0.36, y: 0.2 },
    markAt: [0.72, 0.5],   // centre of the mark, 0..1 of the canvas
    markScale: 0.62,       // mark size as a fraction of min(width, height)
    ...options,
  };
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sprites = RAMP.map((c) => makeSprite(c));
  const lampSprite = makeSprite('#fb942a', 128);
  const neonSprite = makeSprite('#e63281', 128);
  const coldSprite = makeSprite('#52b5f4', 64);

  // Particle pool (struct of arrays)
  const N = opts.max;
  const px = new Float32Array(N), py = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N);
  const life = new Float32Array(N), maxLife = new Float32Array(N), size = new Float32Array(N), heat = new Float32Array(N);
  const tx = new Float32Array(N), ty = new Float32Array(N), grav = new Float32Array(N), homing = new Uint8Array(N);
  const MARK = 1000;           // the last MARK slots are reserved for the logo formation
  let head = 0, markHead = N - MARK;

  let W = 0, H = 0, dpr = 1;
  const spark = { x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
  let lamps = [];
  let lastInput = -1e9, interacted = false;
  let running = false, visible = true, raf = 0, last = 0, now = 0;
  let complete = false, completeAt = 0, secret = false, shake = 0;
  const keys = new Set();

  function setLamps(list) {
    lamps = list.map((l, i) => ({ ...l, index: i, state: 'cold', t: 0, wob: Math.random() * TAU }));
  }
  setLamps(opts.lamps);

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!spark.x) { spark.x = spark.px = spark.tx = W * 0.3; spark.y = spark.py = spark.ty = H * 0.55; }
  }

  function emit(x, y, vxi, vyi, lifeMs, s, h, home = 0, hx = 0, hy = 0, g = 0.0009) {
    let i;
    if (home) { i = markHead; markHead = markHead + 1 >= N ? N - MARK : markHead + 1; }
    else { i = head; head = (head + 1) % (N - MARK); }
    px[i] = x; py[i] = y; vx[i] = vxi; vy[i] = vyi;
    life[i] = maxLife[i] = lifeMs; size[i] = s; heat[i] = h;
    homing[i] = home; tx[i] = hx; ty[i] = hy; grav[i] = g;
  }

  function burst(x, y, n, speed, hot = 0) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * TAU, sp = speed * (0.25 + Math.random() ** 0.6);
      emit(x, y, Math.cos(a) * sp, Math.sin(a) * sp - speed * 0.2, 500 + Math.random() * 1100, 2.5 + Math.random() * 6, hot);
    }
  }

  function markXY(mx, my) {
    const sc = Math.min(W, H) * opts.markScale;
    return [opts.markAt[0] * W + mx * sc, opts.markAt[1] * H + my * sc];
  }
  function lampPos(l) {
    if (l.m === 'dot') return markXY(0, 6 / 64);
    if (typeof l.m === 'number') return markXY(...arcPoint(l.m));
    return [l.x * W, l.y * H];
  }

  function strike(id, silent = false) {
    const l = lamps.find((q) => q.id === id);
    if (!l || l.state !== 'cold') return false;
    l.state = 'lit'; l.t = now;
    const [x, y] = lampPos(l);
    burst(x, y, reduced ? 0 : 220, 0.55, 0);
    shake = 6;
    const litCount = lamps.filter((q) => q.state === 'lit').length;
    if (!silent) canvas.dispatchEvent(new CustomEvent('ignite:strike', { bubbles: true, detail: { id: l.id, name: l.name, index: l.index, litCount, total: lamps.length } }));
    const core = lamps.filter((q) => !q.secret);
    if (!complete && core.every((q) => q.state === 'lit')) {
      complete = true; completeAt = now;
      formMark();
      canvas.dispatchEvent(new CustomEvent('ignite:complete', { bubbles: true, detail: { total: core.length } }));
    }
    return true;
  }

  function formMark() {
    const pts = markPoints(900);
    for (const [mx, my, isDot] of pts) {
      // each mark particle flies out of the nearest lit lamp
      const [hx, hy] = markXY(mx, my);
      let best = lamps[0], bd = Infinity;
      for (const l of lamps) { const [x, y] = lampPos(l); const d = (x - hx) ** 2 + (y - hy) ** 2; if (d < bd) { bd = d; best = l; } }
      const [x, y] = lampPos(best);
      emit(x, y, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2, 2600 + Math.random() * 900, isDot ? 9 : 6, isDot ? 2 : 0, 1, hx, hy, 0);
    }
  }

  function triggerSecret() {
    if (secret) return;
    secret = true;
    // A meteor shower and a hidden fifth lamp: the first Google Play release.
    for (let k = 0; k < 26; k++) {
      setTimeout(() => {
        const x = Math.random() * W * 1.2, y = -20;
        for (let j = 0; j < 40; j++) emit(x - j * 6, y - j * 3, -1.1 + Math.random() * 0.1, 0.55, 900 + j * 30, 10 - j * 0.2, 1, 0, 0, 0, 0);
      }, k * 110);
    }
    lamps.push({ ...opts.secretLamp, index: lamps.length, state: 'cold', t: now, wob: 0, secret: true });
    canvas.dispatchEvent(new CustomEvent('ignite:secret', { bubbles: true, detail: {} }));
  }

  // ---- input ----
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    spark.tx = e.clientX - r.left; spark.ty = e.clientY - r.top;
    lastInput = now; interacted = true;
  };
  const SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let seqPos = 0, typed = '';
  const onKey = (e) => {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    seqPos = e.key === SEQ[seqPos] ? seqPos + 1 : (e.key === SEQ[0] ? 1 : 0);
    typed = (typed + e.key).slice(-4);
    if (seqPos === SEQ.length || typed === '2016') { seqPos = 0; triggerSecret(); }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key) && canvasInView()) {
      keys.add(e.key); lastInput = now; interacted = true;
    }
  };
  const onKeyUp = (e) => keys.delete(e.key);
  function canvasInView() { const r = canvas.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }

  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onMove);
  addEventListener('keydown', onKey);
  addEventListener('keyup', onKeyUp);
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }, { threshold: 0 });
  io.observe(canvas);
  const onVis = () => { if (!document.hidden) start(); };
  document.addEventListener('visibilitychange', onVis);

  // ---- simulation ----
  function step(dt) {
    // Steering: keys > pointer > autopilot
    const kx = (keys.has('ArrowRight') || keys.has('d')) - (keys.has('ArrowLeft') || keys.has('a'));
    const ky = (keys.has('ArrowDown') || keys.has('s')) - (keys.has('ArrowUp') || keys.has('w'));
    if (kx || ky) { spark.tx = spark.x + kx * 90; spark.ty = spark.y + ky * 90; }
    const idle = now - lastInput > opts.attractAfter;
    if (idle) {
      const cold = lamps.filter((l) => l.state === 'cold' && !l.secret);
      // attract mode: wander toward cold lamps, but only light them before the visitor arrives
      const litN = lamps.filter((l) => l.state === 'lit').length;
      // attract mode demonstrates once: it lights the first lamp, then only drifts
      const target = !interacted && litN === 0 && cold.length ? cold[0] : null;
      const t = now / 1000;
      if (target) { const [x, y] = lampPos(target); spark.tx = x + Math.cos(t * 2) * 30; spark.ty = y + Math.sin(t * 2) * 30; }
      else { spark.tx = W * (0.55 + 0.3 * Math.sin(t * 0.37)); spark.ty = H * (0.45 + 0.25 * Math.sin(t * 0.61 + 1)); }
    }
    // spring toward target
    const k = 0.0009, damp = 0.86;
    spark.vx = (spark.vx + (spark.tx - spark.x) * k * dt) * Math.pow(damp, dt / 16);
    spark.vy = (spark.vy + (spark.ty - spark.y) * k * dt) * Math.pow(damp, dt / 16);
    spark.x += spark.vx * dt / 16; spark.y += spark.vy * dt / 16;
    const speed = Math.hypot(spark.vx, spark.vy);

    // trail: emit along the segment travelled this frame so it stays continuous at any frame rate
    const dist = Math.hypot(spark.x - spark.px, spark.y - spark.py);
    const n = Math.min(48, 2 + Math.floor(dist / 2.5));
    for (let k2 = 0; k2 < n; k2++) {
      const f = k2 / n;
      emit(mix(spark.px, spark.x, f), mix(spark.py, spark.y, f),
        -spark.vx * 0.04 + (Math.random() - 0.5) * 0.3, -spark.vy * 0.04 + (Math.random() - 0.5) * 0.3 - 0.04,
        320 + Math.random() * 640, 4 + Math.random() * 7 + Math.min(8, speed * 0.5), 0);
    }
    spark.px = spark.x; spark.py = spark.y;

    // collisions
    for (const l of lamps) {
      if (l.state !== 'cold') continue;
      const [x, y] = lampPos(l);
      if (Math.hypot(spark.x - x, spark.y - y) < Math.max(26, Math.min(W, H) * 0.045)) {
        if (!interacted && lamps.some((q) => q.state === 'lit')) continue;
        strike(l.id, false);
      }
    }

    // lit lamps shed embers upward
    for (const l of lamps) {
      if (l.state !== 'lit' || Math.random() > 0.07) continue;
      const [x, y] = lampPos(l);
      emit(x + (Math.random() - 0.5) * 14, y, (Math.random() - 0.5) * 0.12, -0.12 - Math.random() * 0.25, 1400 + Math.random() * 1600, 2 + Math.random() * 4, 1, 0, 0, 0, -0.00005);
    }

    // integrate
    for (let i = 0; i < N; i++) {
      if (life[i] <= 0) continue;
      life[i] -= dt;
      if (homing[i]) {
        const a = 1 - life[i] / maxLife[i];
        const pull = Math.min(1, a * 7);
        vx[i] += ((tx[i] - px[i]) * 0.004 * pull - vx[i] * 0.14 * pull) * dt / 16;
        vy[i] += ((ty[i] - py[i]) * 0.004 * pull - vy[i] * 0.14 * pull) * dt / 16;
        if (life[i] < 300) life[i] = complete ? 300 + Math.random() * 40 : life[i]; // hold the mark
      } else {
        vy[i] += grav[i] * dt; // molten droplets fall, embers float
        vx[i] *= Math.pow(0.985, dt / 16); vy[i] *= Math.pow(0.985, dt / 16);
      }
      px[i] += vx[i] * dt / 16 * 3; py[i] += vy[i] * dt / 16 * 3;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (shake > 0.1) { ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); shake *= 0.86; }
    ctx.globalCompositeOperation = 'lighter';

    // lamps
    for (const l of lamps) {
      const [x, y] = lampPos(l);
      const base = Math.max(18, Math.min(W, H) * 0.03);
      if (l.state === 'cold') {
        const p = 0.5 + 0.5 * Math.sin(now / 700 + l.wob);
        ctx.globalAlpha = 0.25 + p * 0.25;
        ctx.drawImage(coldSprite, x - base, y - base, base * 2, base * 2);
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = '#bed4eb'; ctx.lineWidth = 1; ctx.setLineDash([2, 5]);
        ctx.beginPath(); ctx.arc(x, y, base * 0.9 + p * 3, now / 3000 + l.wob, now / 3000 + l.wob + TAU); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#bed4eb'; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill();
      } else {
        // warm-up: neon strike (hue 0) -> sodium over 1.6s
        const a = Math.min(1, (now - l.t) / 1600);
        const ease = 1 - Math.pow(1 - a, 3);
        const flick = a < 0.35 ? (Math.random() > 0.25 ? 1 : 0.35) : 1;
        const r = base * (1.2 + ease * 0.9);
        ctx.globalAlpha = (1 - ease) * flick;
        ctx.drawImage(neonSprite, x - r, y - r, r * 2, r * 2);
        ctx.globalAlpha = ease * (0.85 + 0.15 * Math.sin(now / 300 + l.wob));
        ctx.drawImage(lampSprite, x - r * 1.3, y - r * 1.3, r * 2.6, r * 2.6);
        // shockwave ring
        if (a < 1) {
          ctx.globalAlpha = 1 - a; ctx.strokeStyle = rgbMix('#e63281', '#fb942a', ease); ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(x, y, base + a * base * 8, 0, TAU); ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.fillStyle = '#fff4d6'; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
      }
    }

    // particles
    for (let i = 0; i < N; i++) {
      if (life[i] <= 0) continue;
      const a = 1 - life[i] / maxLife[i];
      const ci = Math.min(RAMP.length - 1, Math.floor((a * 0.85 + heat[i] * 0.12) * RAMP.length));
      const s = size[i] * (homing[i] ? 0.9 : (1 - a * 0.6));
      ctx.globalAlpha = homing[i] ? 0.9 : Math.min(1, (1 - a) * 1.4);
      const spr = homing[i] ? sprites[heat[i] > 1 ? 3 : (a < 0.2 ? 5 : 1)] : sprites[ci];
      ctx.drawImage(spr, px[i] - s / 2, py[i] - s / 2, s, s);
    }

    // the spark itself
    ctx.globalAlpha = 1;
    const sp = 34 + Math.sin(now / 90) * 3;
    ctx.drawImage(sprites[1], spark.x - sp / 2, spark.y - sp / 2, sp, sp);
    ctx.drawImage(sprites[0], spark.x - 7, spark.y - 7, 14, 14);
    ctx.restore();
  }

  function frame(t) {
    raf = 0;
    if (!visible || document.hidden) { running = false; return; }
    const dt = Math.min(48, t - (last || t)); last = t; now = t;
    step(dt); draw();
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running || reduced) return;
    running = true; last = 0; raf = requestAnimationFrame(frame);
  }

  resize();
  if (reduced) {
    // Static, finished state: lamps lit, no motion.
    now = performance.now();
    lamps.forEach((l) => { l.state = 'lit'; l.t = now - 5000; });
    draw();
  } else start();

  return {
    strike: (id) => strike(id),
    // Run the simulation synchronously for `ms` (fixed 16 ms steps) and draw once.
    // Handy for posters, screenshots and tests.
    advance(ms) { for (let t = 0; t < ms; t += 16) { now += 16; step(16); } draw(); },
    secret: triggerSecret,
    // Lamp position in 0..1 canvas units, for placing DOM labels.
    positionOf(id) { const l = lamps.find((q) => q.id === id); if (!l) return null; const [x, y] = lampPos(l); return [x / W, y / H]; },
    reset() { setLamps(opts.lamps); complete = false; secret = false; life.fill(0); interacted = false; },
    get lamps() { return lamps.map(({ id, name, state }) => ({ id, name, state })); },
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onMove);
      removeEventListener('keydown', onKey); removeEventListener('keyup', onKeyUp);
      document.removeEventListener('visibilitychange', onVis);
    },
  };
}
