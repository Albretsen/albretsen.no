/*
  dither.js — Albretsen AS / design 56 "Honest Pixels"
  A dependency-free canvas engine that renders a real photograph as
  1-bit Bayer dither, ASCII, or the photo itself, and moves between them.

  Exports
    mountDither(canvas, opts)  -> controller   live, interactive renderer (lens + breath)
    resolveLoader(root, opts)  -> Promise       the loading moment (real bytes, real progress)

  Everything here is drawn from actual pixels. Nothing is faked.
*/

const BAYER8 = (() => {
  let m = [[0, 2], [3, 1]];
  while (m.length < 8) {
    const n = m.length, out = [];
    for (let y = 0; y < n * 2; y++) {
      out.push([]);
      for (let x = 0; x < n * 2; x++) {
        const b = m[y % n][x % n] * 4;
        out[y].push(b + [[0, 2], [3, 1]][Math.floor(y / n)][Math.floor(x / n)]);
      }
    }
    m = out;
  }
  return Float32Array.from(m.flat(), v => (v + 0.5) / 64);
})();

export const PALETTE = {
  cream: '#f9f2e2', cream2: '#efe5d0', cream3: '#dcd0b8',
  forest: '#14422b', deep: '#052517', ink: '#02130c',
  moss: '#587d50', brass: '#c59a44', brassDeep: '#966b27', pulse: '#e03c63',
};
export const RAMP = '  .,:;-=+*x%#@';

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

export function loadImage(src) {
  return new Promise((res, rej) => {
    const im = new Image(); im.decoding = 'async'; im.crossOrigin = 'anonymous';
    im.onload = () => res(im); im.onerror = rej; im.src = src;
  });
}

/* sample an image (cover-fit) into a luminance grid */
export function sampleLum(img, cols, rows, gamma = 1) {
  cols = Math.max(1, cols | 0); rows = Math.max(1, rows | 0);
  const c = document.createElement('canvas'); c.width = cols; c.height = rows;
  const x = c.getContext('2d', { willReadFrequently: true });
  const ir = img.width / img.height, gr = cols / rows;
  let sw = img.width, sh = img.height, sx = 0, sy = 0;
  if (ir > gr) { sw = img.height * gr; sx = (img.width - sw) / 2; } else { sh = img.width / gr; sy = (img.height - sh) / 2; }
  x.imageSmoothingQuality = 'high';
  x.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
  const d = x.getImageData(0, 0, cols, rows).data, L = new Float32Array(cols * rows);
  let lo = 1, hi = 0;
  for (let i = 0; i < L.length; i++) {
    const v = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
    L[i] = v; if (v < lo) lo = v; if (v > hi) hi = v;
  }
  for (let i = 0; i < L.length; i++) L[i] = Math.pow((L[i] - lo) / (hi - lo + 1e-6), gamma);
  return L;
}

/* 1-bit Bayer into an ImageData at grid resolution (fast: one putImageData, one scaled draw) */
function bayerInto(id, L, cols, rows, dark, light, bias = 0) {
  const p = id.data;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = y * cols + x, on = L[i] + bias > BAYER8[(y & 7) * 8 + (x & 7)];
    const c = on ? light : dark, o = i * 4;
    p[o] = c[0]; p[o + 1] = c[1]; p[o + 2] = c[2]; p[o + 3] = 255;
  }
}

function drawAscii(ctx, L, cols, rows, cw, ch, bg, fg, hi, ramp = RAMP, font = '"IBM Plex Mono", ui-monospace, Menlo, monospace') {
  ctx.fillStyle = bg; ctx.fillRect(0, 0, cols * cw, rows * ch);
  ctx.font = `${Math.round(ch * 0.82)}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const n = ramp.length;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = L[y * cols + x], k = Math.min(n - 1, (v * n) | 0), c = ramp[k];
    if (c === ' ') continue;
    ctx.fillStyle = v > 0.93 && hi ? hi : fg;
    ctx.fillText(c, x * cw + cw / 2, y * ch + ch / 2);
  }
}

function coverRect(img, W, H) {
  const ir = img.width / img.height, r = W / H;
  return ir > r ? [(W - H * ir) / 2, 0, H * ir, H] : [0, (H - W / ir) / 2, W, W / ir];
}

/*
  mountDither(canvas, {
    src,                 photo URL (the truth)
    mode: 'bayer'|'ascii',
    dot: 2,              CSS px per dither cell
    dark, light, accent  palette (hex)
    lens: true,          pointer reveals the real photo through a circular lens
    breath: true,        threshold slowly breathes (+/- 3%) when idle
  })
*/
export async function mountDither(canvas, opts = {}) {
  const o = Object.assign({ mode: 'bayer', dot: 2, dark: PALETTE.deep, light: PALETTE.cream, accent: PALETTE.brass,
    lens: true, breath: true, lensR: 120, gamma: 1.1 }, opts);
  const img = await loadImage(o.src);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let W, H, cols, rows, L, id, grid, gctx, mx = -1e4, my = -1e4, lr = 0, raf, t0 = performance.now(), alive = true;
  const D = hex(o.dark), Li = hex(o.light);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function layout() {
    const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    if (o.mode === 'ascii') { cols = Math.round(W / 8); rows = Math.round(H / 14); }
    else { cols = Math.round(W / o.dot); rows = Math.round(H / o.dot); }
    L = sampleLum(img, cols, rows, o.gamma);
    grid = document.createElement('canvas'); grid.width = cols; grid.height = rows; gctx = grid.getContext('2d');
    id = gctx.createImageData(cols, rows);
  }
  function frame(now) {
    if (!alive) return;
    const t = (now - t0) / 1000;
    const bias = o.breath && !reduce ? Math.sin(t * 2 * Math.PI / 6) * 0.03 : 0; // one breath every 6 s
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
    if (o.mode === 'ascii') {
      drawAscii(ctx, L, cols, rows, W / cols, H / rows, o.dark, o.light, o.accent);
    } else {
      bayerInto(id, L, cols, rows, D, Li, bias); gctx.putImageData(id, 0, 0);
      ctx.drawImage(grid, 0, 0, W, H);
    }
    // lens: the real photograph, uncompressed by style
    lr += ((mx > -1e3 ? o.lensR : 0) - lr) * 0.18;
    if (o.lens && lr > 0.5) {
      ctx.save(); ctx.beginPath(); ctx.arc(mx, my, lr, 0, Math.PI * 2); ctx.clip();
      ctx.imageSmoothingEnabled = true; ctx.drawImage(img, ...coverRect(img, W, H)); ctx.restore();
      ctx.strokeStyle = o.accent; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.arc(mx, my, lr + 6, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    raf = requestAnimationFrame(frame);
  }
  const move = e => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
  const leave = () => { mx = my = -1e4; };
  canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave);
  const ro = new ResizeObserver(layout); ro.observe(canvas);
  layout(); raf = requestAnimationFrame(frame);
  return {
    set mode(m) { o.mode = m; layout(); },
    get mode() { return o.mode; },
    destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); },
  };
}

/*
  resolveLoader(root, { src, preview, minMs })
  The loading moment. The counter shows real bytes of the hero photo as they arrive.
  While they arrive, the (tiny, already-loaded) preview is drawn as coarse ASCII that
  refines with progress:  ASCII 48px -> 24px -> 12px -> Bayer 6px -> 3px -> the photo.
  root must contain: canvas[data-l-canvas], [data-l-count], [data-l-total], [data-l-stage]
*/
export async function resolveLoader(root, { src, preview, minMs = 1400 } = {}) {
  const canvas = root.querySelector('[data-l-canvas]'), ctx = canvas.getContext('2d');
  const elCount = root.querySelector('[data-l-count]'), elTotal = root.querySelector('[data-l-total]'), elStage = root.querySelector('[data-l-stage]');
  const dpr = Math.min(2, devicePixelRatio || 1);
  const r = canvas.getBoundingClientRect(), W = r.width, H = r.height;
  canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const prev = await loadImage(preview);
  const stages = [
    { at: 0.00, kind: 'ascii', cell: 48, label: 'ascii / 48px' },
    { at: 0.18, kind: 'ascii', cell: 24, label: 'ascii / 24px' },
    { at: 0.40, kind: 'ascii', cell: 12, label: 'ascii / 12px' },
    { at: 0.62, kind: 'bayer', cell: 6, label: 'bayer 8x8 / 6px' },
    { at: 0.82, kind: 'bayer', cell: 3, label: 'bayer 8x8 / 3px' },
  ];
  let shown = -1, shownP = 0, target = 0;
  const D = hex(PALETTE.deep), Li = hex(PALETTE.cream);
  function draw(s) {
    if (s.kind === 'ascii') {
      const ch = s.cell, cw = Math.round(ch * 0.6), cols = Math.ceil(W / cw), rows = Math.ceil(H / ch);
      drawAscii(ctx, sampleLum(prev, cols, rows, 1.1), cols, rows, cw, ch, PALETTE.ink, PALETTE.cream2, PALETTE.brass);
    } else {
      const cols = Math.ceil(W / s.cell), rows = Math.ceil(H / s.cell), g = document.createElement('canvas');
      g.width = cols; g.height = rows; const gx = g.getContext('2d'), id = gx.createImageData(cols, rows);
      bayerInto(id, sampleLum(prev, cols, rows, 1.1), cols, rows, D, Li); gx.putImageData(id, 0, 0);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(g, 0, 0, W, H);
    }
    elStage && (elStage.textContent = s.label);
  }
  const t0 = performance.now();
  let raf;
  const tick = () => {
    // displayed progress never runs ahead of the bytes, and never faster than minMs allows
    const timeCap = Math.min(1, (performance.now() - t0) / minMs);
    shownP += (Math.min(target, timeCap) - shownP) * 0.2;
    let k = 0; for (let i = 0; i < stages.length; i++) if (shownP >= stages[i].at) k = i;
    if (k !== shown) { shown = k; draw(stages[k]); }
    elCount && (elCount.textContent = Math.round(shownP * 100).toString().padStart(3, '0'));
    raf = requestAnimationFrame(tick);
  };
  tick();
  // real bytes
  let blob;
  try {
    const res = await fetch(src); const total = +res.headers.get('content-length') || 0;
    elTotal && (elTotal.textContent = total ? `${(total / 1024).toFixed(0)} KB` : 'unknown size');
    if (res.body && total) {
      const rd = res.body.getReader(), parts = []; let got = 0;
      for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; target = got / total; }
      blob = new Blob(parts);
    } else { blob = await res.blob(); }
  } catch (e) { blob = null; }
  target = 1;
  await new Promise(res => { const w = () => (shownP > 0.995 ? res() : requestAnimationFrame(w)); w(); });
  cancelAnimationFrame(raf);
  elCount && (elCount.textContent = '100');
  const photo = blob ? await loadImage(URL.createObjectURL(blob)) : prev;
  // final: Bayer wipe from dither to the photograph
  const cols = Math.ceil(W / 24), rows = Math.ceil(H / 24);
  await new Promise(res => {
    const t1 = performance.now(), dur = 900;
    const step = () => {
      const p = Math.min(1, (performance.now() - t1) / dur);
      ctx.save(); ctx.beginPath();
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (p > BAYER8[(y & 7) * 8 + (x & 7)]) ctx.rect(x * 24, y * 24, 24, 24);
      ctx.clip(); ctx.imageSmoothingEnabled = true; ctx.drawImage(photo, ...coverRect(photo, W, H)); ctx.restore();
      elStage && (elStage.textContent = p < 1 ? 'photograph / resolving' : 'photograph / 100%');
      p < 1 ? requestAnimationFrame(step) : res();
    };
    step();
  });
  return photo;
}
