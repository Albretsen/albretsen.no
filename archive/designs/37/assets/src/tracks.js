// Cloud Chamber — generative bubble-chamber tracks on canvas 2D.
// Charged particles in a magnetic field curl into spirals as they lose energy;
// high-energy tracks are nearly straight; some decay into a V of opposite charges.
// Pure canvas 2D, no dependencies. Used for the hero trails and baked textures.

export const ROSE = ['#0e0409', '#381127', '#5e1942', '#892361', '#b43481', '#d64d9d', '#e781b7', '#f4b0d2', '#f9d3e5', '#fceaf3', '#fff8fb'];

export function rng(seed = 0x04246b) {
  let s = seed >>> 0;
  return () => { s |= 0; s = s + 0x6d2b79f5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// Integrate one particle; returns its polyline. charge: ±1, energy: px of radius.
export function particle({ x, y, angle, energy, charge, loss = 0.994, field = 1, steps = 900, step = 2, minR = 7 }) {
  const pts = [[x, y]];
  let a = angle, r = energy;
  for (let i = 0; i < steps && r > minR; i++) {
    a += charge * field * step / r;
    x += Math.cos(a) * step; y += Math.sin(a) * step;
    r *= loss;
    pts.push([x, y]);
  }
  return pts;
}

export function strokeTrack(ctx, pts, { color = ROSE[4], width = 1, alpha = 0.8, bubbles = true, R = Math.random } = {}) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  if (bubbles) { // condensation droplets along the path
    ctx.fillStyle = color;
    for (let i = 0; i < pts.length; i += 5 + (R() * 9 | 0)) {
      const rr = width * (0.35 + R() * 0.75);
      ctx.beginPath(); ctx.arc(pts[i][0] + (R() - .5) * 1.4, pts[i][1] + (R() - .5) * 1.4, rr, 0, 6.283); ctx.fill();
    }
  }
  ctx.restore();
}

// A full plate: background + N events. opts.theme: 'light' | 'dark'
export function drawPlate(ctx, w, h, { seed = 0x04246b, theme = 'light', events = 34, scale = 1, grid = true } = {}) {
  const R = rng(seed);
  const dark = theme === 'dark';
  const bg = ctx.createRadialGradient(w * .55, h * .45, 0, w * .5, h * .5, Math.hypot(w, h) * .6);
  if (dark) { bg.addColorStop(0, '#2a0c1d'); bg.addColorStop(1, '#0e0409'); }
  else { bg.addColorStop(0, '#fff8fb'); bg.addColorStop(1, '#f9d3e5'); }
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  if (grid) { // fiducial crosses, like the reference marks etched on chamber windows
    ctx.save(); ctx.strokeStyle = dark ? '#5e1942' : '#e781b7'; ctx.globalAlpha = .55; ctx.lineWidth = 1 * scale;
    const g = 120 * scale;
    for (let gx = g / 2; gx < w; gx += g) for (let gy = g / 2; gy < h; gy += g) { ctx.beginPath(); ctx.moveTo(gx - 5 * scale, gy); ctx.lineTo(gx + 5 * scale, gy); ctx.moveTo(gx, gy - 5 * scale); ctx.lineTo(gx, gy + 5 * scale); ctx.stroke(); }
    ctx.restore();
  }
  const palette = dark ? ROSE.slice(4, 10) : ROSE.slice(1, 7);
  // a beam of near-straight primaries entering from the left
  for (let i = 0; i < 7; i++) {
    const y0 = h * (0.2 + R() * 0.6);
    const pts = particle({ x: -20, y: y0, angle: (R() - .5) * 0.08, energy: 9000 * scale, charge: R() < .5 ? 1 : -1, loss: 0.99995, steps: (w + 60) / (2 * scale), step: 2 * scale });
    strokeTrack(ctx, pts, { color: palette[1], width: 0.7 * scale, alpha: 0.5, R });
  }
  for (let e = 0; e < events; e++) {
    const x = w * (0.08 + R() * 0.84), y = h * (0.1 + R() * 0.8);
    const kind = R();
    const base = R() * 6.283;
    const col = palette[(R() * palette.length) | 0];
    if (kind < 0.5) { // V decay: two opposite spirals
      const en = (90 + R() * 260) * scale;
      for (const c of [1, -1]) {
        const pts = particle({ x, y, angle: base + c * (0.25 + R() * 0.4), energy: en * (0.6 + R() * 0.8), charge: c, loss: 0.993 + R() * 0.004, step: 1.6 * scale });
        strokeTrack(ctx, pts, { color: col, width: (0.8 + R() * 0.9) * scale, alpha: 0.85, R });
      }
      ctx.save(); ctx.fillStyle = palette[palette.length - 1]; ctx.globalAlpha = .9; ctx.beginPath(); ctx.arc(x, y, 2.2 * scale, 0, 6.283); ctx.fill(); ctx.restore();
    } else if (kind < 0.85) { // single tight spiral (low-energy electron)
      const pts = particle({ x, y, angle: base, energy: (40 + R() * 140) * scale, charge: R() < .5 ? 1 : -1, loss: 0.990 + R() * 0.006, step: 1.2 * scale });
      strokeTrack(ctx, pts, { color: col, width: (0.6 + R() * 0.6) * scale, alpha: 0.75, R });
    } else { // long gentle arc
      const pts = particle({ x, y, angle: base, energy: (900 + R() * 2400) * scale, charge: R() < .5 ? 1 : -1, loss: 0.9992, steps: 500, step: 2 * scale });
      strokeTrack(ctx, pts, { color: col, width: 0.9 * scale, alpha: 0.6, R });
    }
  }
}
