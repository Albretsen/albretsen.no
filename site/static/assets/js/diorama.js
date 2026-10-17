// diorama.js: the turnable miniature. A shadow box seen through an arched
// opening. Six paper layers stand at different depths; drag (or move the
// pointer) to turn the box and see between them. The sky over the box is the
// real sky over Norway right now: sun altitude and azimuth are computed for
// Oslo (59.91 N, 10.75 E) and the light state is interpolated from that.
//
// Usage:
//   import { mountDiorama } from './js/diorama.js';
//   const d = await mountDiorama(el, { grain: './textures/paper-grain.webp' });
//   d.setAltitude(-2)   // override (e.g. scroll-driven day); d.live() to go back to the real sky
//   d.turn(0.3, 0)      // programmatic turn, -1..1
// No dependencies. Pure DOM + Canvas 2D + CSS 3D transforms (no WebGL needed).
import { drawHero, lightAt, loadGrain, rgba } from './paperworld.js';
const AFTERGLOW = lightAt(-1.5);

export function sunPosition(date = new Date(), lat = 59.91, lon = 10.75) {
  const r = Math.PI / 180; const d = (date.getTime() - 946728000000) / 86400000;
  const g = (357.529 + 0.98560028 * d) * r, q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * r, e = (23.439 - 3.6e-7 * d) * r;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = ((18.697374558 + 24.06570982441908 * d) % 24) * 15; const H = (gmst + lon) * r - ra;
  const la = lat * r; const alt = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(H));
  return { altitude: alt / r, azimuth: ((az / r) + 360) % 360 };
}

const LAYERS = [['sky', -200], ['far', -155], ['sea', -125], ['head', -85], ['blvd', -40], ['near', 0]];
const CSS = `
.dio{--w:min(92vw,1100px);position:relative;width:var(--w);aspect-ratio:16/10;perspective:1500px;perspective-origin:50% 45%;touch-action:pan-y;user-select:none;cursor:grab}
.dio:active{cursor:grabbing}
.dio-box{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .9s cubic-bezier(.2,.8,.2,1)}
.dio-box.is-dragging{transition:none}
.dio-layer{position:absolute;left:0;top:0;width:100%;height:100%;display:block}
.dio-wall{position:absolute;background:#efe2cf}
.dio-frame{position:absolute;inset:0;pointer-events:none;transform:translateZ(1px)}
.dio-frame svg{width:100%;height:100%;display:block;filter:drop-shadow(0 18px 30px rgba(30,16,40,.35))}
.dio-label{position:absolute;left:50%;bottom:-2.6em;transform:translateX(-50%);font:500 11px/1 "Josefin Sans",system-ui,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:var(--dio-ink,#2E2240);white-space:nowrap;opacity:.8}
@media (prefers-reduced-motion:reduce){.dio-box{transition:none}}`;

export async function mountDiorama(el, { grain = './textures/paper-grain.webp', lat = 59.91, lon = 10.75, label = true, clock = true, frameColor = '#F5EBDC', ink = '#2E2240' } = {}) {
  if (!document.getElementById('dio-css')) { const s = document.createElement('style'); s.id = 'dio-css'; s.textContent = CSS; document.head.appendChild(s); }
  await loadGrain(grain);
  el.classList.add('dio'); el.innerHTML = ''; el.style.setProperty('--dio-ink', ink);
  const box = document.createElement('div'); box.className = 'dio-box'; el.appendChild(box);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const canvases = LAYERS.map(([k, z]) => { const c = document.createElement('canvas'); c.className = 'dio-layer'; c.dataset.layer = k;
    const s = 1; /* same physical size as the box, so the walls hide every edge */ c.style.transform = `translateZ(${z}px) scale(${s})`; box.appendChild(c); return c; });
  // side walls of the box, so turning reveals depth instead of empty space
  const depth = 210; const walls = [
    ['left:0;top:0;height:100%;width:' + depth + 'px;transform-origin:0 50%;transform:rotateY(90deg) translateZ(0)', 0.86],
    ['right:0;top:0;height:100%;width:' + depth + 'px;transform-origin:100% 50%;transform:rotateY(-90deg)', 0.78],
    ['left:0;top:0;width:100%;height:' + depth + 'px;transform-origin:50% 0;transform:rotateX(-90deg)', 0.92],
    ['left:0;bottom:0;width:100%;height:' + depth + 'px;transform-origin:50% 100%;transform:rotateX(90deg)', 0.7]];
  walls.forEach(([css, k]) => { const w = document.createElement('div'); w.className = 'dio-wall'; w.style.cssText = css; w.style.filter = `brightness(${k})`; box.appendChild(w); });
  // the arched proscenium (same arch as the mark)
  const fr = document.createElement('div'); fr.className = 'dio-frame';
  fr.innerHTML = `<svg viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="true"><path fill-rule="evenodd" fill="${frameColor}" d="M-40-40H1640V1040H-40Z M84 936V430A410 350 0 0 1 494 80H1106A410 350 0 0 1 1516 430V936Z"/><path fill="none" stroke="${ink}" stroke-opacity=".85" stroke-width="5" d="M84 936V430A410 350 0 0 1 494 80H1106A410 350 0 0 1 1516 430V936Z"/></svg>`;
  box.appendChild(fr);
  let lab = null; if (label) { lab = document.createElement('div'); lab.className = 'dio-label'; el.appendChild(lab); }

  let override = null, lastAlt = null, lastAz = null, raf = 0;
  // Only the sky and the sea respond to the sun (the palette is fixed), so a sun move redraws two layers, not six.
  const SUN_LAYERS = new Set(['sky', 'sea']);
  function draw(alt, az, sunOnly = false) {
    // The palette is locked to afterglow: only the sun moves, the colours never change.
    const L = { ...AFTERGLOW, sun: '#ffd6a0', sunA: Math.max(0, Math.min(1, (alt + 4) / 4)) };
    const W = el.clientWidth, H = el.clientHeight; if (!W) return;
    // The sun travels through the open sky between the palms and the massif.
    const sunX = 830 + alt * 1.5;
    const sunY = 560 - alt * 14;
    canvases.forEach((c) => { const k = c.dataset.layer;
      const resized = c.width !== Math.round(W * dpr);
      if (sunOnly && !resized && !SUN_LAYERS.has(k)) return;
      if (resized) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
      const ctx = c.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height);
      const s = Math.max(c.width / 1600, c.height / 900); ctx.translate((c.width - 1600 * s) / 2, (c.height - 900 * s) * 0.65); ctx.scale(s, s);
      drawHero(ctx, { light: L, layers: [k], sunX, sunDiscX: sunX, sunY });
      if (k === 'sky' && alt < -5) stars(ctx, Math.min(1, (-5 - alt) / 8)); });

  }
  function stars(ctx, a) { let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 120; i++) { const x = r() * 1600, y = r() * 480, z = r(); ctx.fillStyle = rgba('#fff4e0', a * (0.3 + z * 0.7)); ctx.beginPath(); ctx.arc(x, y, 0.6 + z * 1.3, 0, Math.PI * 2); ctx.fill(); } }
  function tick() { raf = 0; const p = override ?? sunPosition(new Date(), lat, lon); const alt = override ? override.altitude : p.altitude, az = override ? override.azimuth : p.azimuth;
    if (lastAlt == null || Math.abs(alt - lastAlt) > 0.15) { const first = lastAlt == null; lastAlt = alt; lastAz = az; draw(alt, az, !first); } }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };

  // turning: drag, or follow the pointer gently on fine pointers
  let rx = 0, ry = 0, dragging = false, sx = 0, sy = 0, bx = 0, by = 0;
  const apply = () => { box.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; };
  el.addEventListener('pointerdown', (e) => { dragging = true; sx = e.clientX; sy = e.clientY; bx = ry; by = rx; box.classList.add('is-dragging'); el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', (e) => { if (!dragging) return; ry = Math.max(-24, Math.min(24, bx + (e.clientX - sx) * 0.12)); rx = Math.max(-12, Math.min(12, by - (e.clientY - sy) * 0.06)); apply(); });
  const end = () => { if (!dragging) return; dragging = false; box.classList.remove('is-dragging'); ry *= 0.35; rx *= 0.35; apply(); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  const ro = new ResizeObserver(() => { if (el.clientWidth !== lastW) { lastW = el.clientWidth; lastAlt = null; schedule(); } }); let lastW = 0; ro.observe(el);
  const timer = clock ? setInterval(() => { if (override == null) schedule(); }, 30000) : 0;
  schedule();
  return {
    el, sunPosition,
    setAltitude(alt, azimuth) { override = { altitude: alt, azimuth: azimuth ?? (alt > 0 ? 180 + (40 - Math.min(40, alt)) * 2 : 300) }; schedule(); },
    live() { override = null; lastAlt = null; schedule(); },
    turn(x = 0, y = 0) { ry = x * 24; rx = -y * 12; apply(); },
    destroy() { clearInterval(timer); ro.disconnect(); cancelAnimationFrame(raf); el.innerHTML = ''; },
  };
}
