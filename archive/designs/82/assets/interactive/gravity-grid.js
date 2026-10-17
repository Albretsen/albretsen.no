// Gravity Grid — the live counterpart of hero/gravity (design 82).
// A sheet of graph paper seen in perspective; a black mass follows the pointer and bends it;
// amber bodies keep their orbits. Canvas 2D, ~4 KB, no dependencies, pauses offscreen.
//
//   import { gravityGrid } from './interactive/gravity-grid.js';
//   const gg = gravityGrid(canvasEl, { theme: 'light' | 'dark', bodies: 3 });
//   gg.destroy();

export function gravityGrid(canvas, { theme = 'light', bodies = 3, spacing = 0.42, mass = 1.05 } = {}) {
  const ctx = canvas.getContext('2d');
  const C = theme === 'dark'
    ? { bg: '#0a0907', line: 'rgba(249,246,242,0.16)', ring: 'rgba(249,246,242,0.35)', sun: '#fea91e', ball: '#000', hi: 'rgba(255,214,150,0.55)' }
    : { bg: '#f1ede7', line: 'rgba(10,9,7,0.22)', ring: 'rgba(10,9,7,0.45)', sun: '#f29a00', ball: '#0a0907', hi: 'rgba(255,255,255,0.55)' };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, dpr = 1, raf = 0, running = true, t0 = performance.now();
  const cam = { y: 2.5, z: -4.6, pitch: 0.5, f: 1.25 };
  const M = { x: 0.6, z: 1.2, tx: 0.6, tz: 1.2 };
  const orbs = Array.from({ length: bodies }, (_, i) => ({ r: [1.7, 2.6, 3.6, 4.4][i % 4], a: i * 2.1 + 0.4, size: [0.12, 0.085, 0.065, 0.05][i % 4] }));

  const h = (x, z) => -mass / Math.sqrt((x - M.x) ** 2 + (z - M.z) ** 2 + 0.36);
  function proj(x, y, z) {
    // camera looks down by `pitch`
    const dy = y - cam.y, dz = z - cam.z;
    const c = Math.cos(cam.pitch), s = Math.sin(cam.pitch);
    const yy = dy * c + dz * s, zz = -dy * s + dz * c;
    if (zz < 0.1) return null;
    const k = (cam.f * H) / zz;
    return [W / 2 + x * k, H / 2 - yy * k, zz];
  }
  function unproject(px, py) {
    // pointer -> point on the flat sheet (y = 0)
    const c = Math.cos(cam.pitch), s = Math.sin(cam.pitch);
    const dx = (px - W / 2) / (cam.f * H), dyv = -(py - H / 2) / (cam.f * H);
    // ray in camera space (dx, dyv, 1) -> world
    const ry = dyv * c - s, rz = dyv * s + c, rx = dx;
    if (ry >= -0.01) return null;
    const t = -cam.y / ry;
    return [rx * t, cam.z + rz * t];
  }
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect(); W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function line(points) {
    ctx.beginPath(); let pen = false;
    for (const p of points) { if (!p) { pen = false; continue; } if (!pen) { ctx.moveTo(p[0], p[1]); pen = true; } else ctx.lineTo(p[0], p[1]); }
    ctx.stroke();
  }
  function frame(now) {
    const t = (now - t0) / 1000;
    M.x += (M.tx - M.x) * 0.06; M.z += (M.tz - M.z) * 0.06;
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    // grid
    ctx.lineWidth = 1; ctx.strokeStyle = C.line;
    const X0 = -9, X1 = 9, Z0 = -2.5, Z1 = 22, step = 0.12;
    for (let x = X0; x <= X1 + 1e-6; x += spacing) {
      const pts = []; for (let z = Z0; z <= Z1; z += step) pts.push(proj(x, h(x, z), z)); line(pts);
    }
    for (let z = Z0; z <= Z1 + 1e-6; z += spacing) {
      const pts = []; for (let x = X0; x <= X1; x += step) pts.push(proj(x, h(x, z), z)); line(pts);
    }
    // fade the far sheet into the sky
    const fog = ctx.createLinearGradient(0, 0, 0, H * 0.45);
    fog.addColorStop(0, C.bg); fog.addColorStop(0.35, C.bg); fog.addColorStop(1, C.bg + '00');
    ctx.fillStyle = fog; ctx.fillRect(0, 0, W, H * 0.45);
    // orbits (one solid in amber, the rest dotted ink — Byrne's notation)
    orbs.forEach((o, i) => {
      const pts = []; for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.05) { const x = M.x + o.r * Math.cos(a), z = M.z + o.r * Math.sin(a); pts.push(proj(x, h(x, z), z)); }
      ctx.setLineDash(i === 0 ? [] : [2, 5]); ctx.strokeStyle = i === 0 ? C.sun : C.ring; ctx.lineWidth = i === 0 ? 1.5 : 1; line(pts); ctx.setLineDash([]);
    });
    // bodies sorted back-to-front with the mass
    const items = orbs.map((o) => {
      if (!reduce) o.a += 0.012 * Math.pow(1.7 / o.r, 1.5);
      const x = M.x + o.r * Math.cos(o.a), z = M.z + o.r * Math.sin(o.a);
      return { p: proj(x, h(x, z) + o.size, z), r: o.size, amber: true };
    });
    items.push({ p: proj(M.x, h(M.x, M.z) + 0.55, M.z), r: 0.62, amber: false });
    items.filter((i) => i.p).sort((a, b) => b.p[2] - a.p[2]).forEach(({ p, r, amber }) => {
      const rad = (cam.f * H * r) / p[2];
      const g = ctx.createRadialGradient(p[0] + rad * 0.35, p[1] - rad * 0.4, rad * 0.05, p[0], p[1], rad);
      if (amber) { g.addColorStop(0, '#ffe0a3'); g.addColorStop(0.45, C.sun); g.addColorStop(1, '#9a5a00'); }
      else { g.addColorStop(0, '#3a3633'); g.addColorStop(0.35, C.ball); g.addColorStop(1, C.ball); }
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], rad, 0, Math.PI * 2); ctx.fill();
      if (!amber) { ctx.fillStyle = C.hi; ctx.beginPath(); ctx.ellipse(p[0] + rad * 0.42, p[1] - rad * 0.45, rad * 0.13, rad * 0.07, -0.7, 0, Math.PI * 2); ctx.fill(); }
    });
    if (running) raf = requestAnimationFrame(frame);
  }
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect(); const q = unproject(e.clientX - r.left, e.clientY - r.top);
    if (q) { M.tx = Math.max(-4, Math.min(4, q[0])); M.tz = Math.max(-0.5, Math.min(7, q[1])); }
  };
  const onLeave = () => { M.tx = 0.6; M.tz = 1.2; };
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerleave', onLeave);
  const io = new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting; if (running && !was) raf = requestAnimationFrame(frame); });
  io.observe(canvas);
  raf = requestAnimationFrame(frame);
  return { destroy() { running = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave); } };
}
