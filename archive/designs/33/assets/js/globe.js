// Uranographia — the celestial globe: an interactive 3D sphere rendered entirely in SVG.
// Every one of the site's 716 stars (four figures + their 113 cluster and 549 dust points) sits on
// the sphere; drag (or swipe) to turn it, release and it keeps spinning with inertia, then settles
// into a slow sidereal drift. Back-facing stars dim; meridians and parallels are re-projected per frame.
//
//   import { mountGlobe } from './assets/js/globe.js';
//   const g = mountGlobe(document.querySelector('#globe'), { size: 560 });
//   g.focus('fun-libs');   // turns the globe until that figure faces the viewer
//
import { PRODUCTS, fieldPoints } from './sky-data.js';
import { NS, el, sparklePath } from './draw.js';

const DEG = Math.PI / 180;
// centre of each figure on the sphere (lon, lat) and its angular size
const SEATS = { 'mcp-emails': [-40, 22, 46], 'fun-libs': [48, 30, 54], 'toolrails': [-10, -34, 44], 'harbor': [100, -18, 42] };

function toXYZ(lon, lat) { return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)]; }

export function mountGlobe(host, { size = 560, ink = '#eceaee', dim = '#737076' } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const R = size / 2 - 18, C = size / 2;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'A celestial globe carrying every star in the Albretsen AS catalogue. Drag to turn it.');
  svg.style.cssText = 'width:100%;height:auto;display:block;cursor:grab;touch-action:none;user-select:none';
  host.appendChild(svg);
  const d = el('defs', {}, svg);
  const rg = el('radialGradient', { id: 'u-globe-shade', cx: '38%', cy: '34%', r: '75%' }, d);
  el('stop', { offset: '0', 'stop-color': '#221f24' }, rg);
  el('stop', { offset: '.7', 'stop-color': '#141215' }, rg);
  el('stop', { offset: '1', 'stop-color': '#0b090c' }, rg);
  el('circle', { cx: C, cy: C, r: R + 12, fill: 'none', stroke: ink, 'stroke-width': .5, opacity: .25 }, svg);
  el('circle', { cx: C, cy: C, r: R, fill: 'url(#u-globe-shade)', stroke: ink, 'stroke-width': .8, 'stroke-opacity': .45 }, svg);
  const gridBack = el('path', { fill: 'none', stroke: ink, 'stroke-width': .4, opacity: .12 }, svg);
  const gridFront = el('path', { fill: 'none', stroke: ink, 'stroke-width': .5, opacity: .3 }, svg);
  const lineBack = el('path', { fill: 'none', stroke: ink, 'stroke-width': .7, opacity: .18, 'stroke-linecap': 'round' }, svg);
  const lineFront = el('path', { fill: 'none', stroke: ink, 'stroke-width': 1, opacity: .7, 'stroke-linecap': 'round' }, svg);
  const dustG = el('g', { fill: ink }, svg);
  const starG = el('g', { fill: ink }, svg);
  // equator ring ticks (fixed, in screen space, editorial)
  let ticks = '';
  for (let i = 0; i < 180; i++) { const a = i / 180 * Math.PI * 2, l = i % 15 === 0 ? 8 : 3.5; ticks += `M${C + Math.cos(a) * (R + 12)} ${C + Math.sin(a) * (R + 12)}L${C + Math.cos(a) * (R + 12 + l)} ${C + Math.sin(a) * (R + 12 + l)}`; }
  el('path', { d: ticks, stroke: ink, 'stroke-width': .5, opacity: .35 }, svg);

  // ---- build sphere points ----
  const pts = []; // {v:[x,y,z], kind, node, m}
  const segs = []; // [i, j]
  PRODUCTS.forEach((p, fi) => {
    const [lon0, lat0, span] = SEATS[p.id];
    const map = (x, y) => toXYZ((lon0 + (x - 50) / 100 * span) * DEG, (lat0 - (y - 50) / 100 * span) * DEG);
    const base = pts.length;
    p.stars.forEach(([x, y, m]) => {
      const g = el('g', {}, starG);
      if (m === 1) el('path', { d: sparklePath(0, 0, 7, 1.2) }, g); else el('circle', { r: { 2: 2.2, 3: 1.6, 4: 1.1 }[m] }, g);
      pts.push({ v: map(x, y), node: g, m, star: true, id: p.id });
    });
    p.lines.forEach(([a, b]) => segs.push([base + a, base + b]));
    if (p.field) fieldPoints(p, fi + 3).forEach(([x, y, r]) => {
      pts.push({ v: map(x, y), node: el('circle', { r: .5 + r * .8 }, dustG), m: 4, star: false, o: .2 + r * .5 });
    });
  });
  // a sprinkling of anonymous background stars to read the sphere's volume
  for (let i = 0; i < 260; i++) {
    const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    pts.push({ v: [s * Math.cos(t), u, s * Math.sin(t)], node: el('circle', { r: .45 + Math.random() * .5 }, dustG), m: 4, star: false, o: .25 });
  }
  const label = el('text', { x: C, y: size - 2, 'text-anchor': 'middle', fill: dim, 'font-family': 'Geist Mono, monospace', 'font-size': 10, 'letter-spacing': 2 }, svg);

  // ---- rotation state ----
  let yaw = -20 * DEG, pitch = 14 * DEG, vy = reduce ? 0 : .0016, vp = 0, dragging = false, lx = 0, ly = 0, target = null;
  const proj = (v) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    let x = v[0] * cy + v[2] * sy, z = -v[0] * sy + v[2] * cy, y = v[1];
    const y2 = y * cp - z * sp, z2 = y * sp + z * cp;
    return [C + x * R, C - y2 * R, z2];
  };
  function grid() {
    let back = '', front = '';
    const add = (arr) => { let pb = null; arr.forEach(([x, y, z], i) => { const cmd = (pb === (z >= 0) && i) ? 'L' : 'M'; const s = `${cmd}${x.toFixed(1)} ${y.toFixed(1)}`; if (z >= 0) front += s; else back += s; pb = z >= 0; }); };
    for (let lon = 0; lon < 180; lon += 20) { const a = []; for (let lat = -90; lat <= 270; lat += 6) a.push(proj(toXYZ(lon * DEG, lat * DEG))); add(a); }
    for (let lat = -60; lat <= 60; lat += 30) { const a = []; for (let lon = 0; lon <= 360; lon += 6) a.push(proj(toXYZ(lon * DEG, lat * DEG))); add(a); }
    gridBack.setAttribute('d', back); gridFront.setAttribute('d', front);
  }
  function frame() {
    if (!dragging) {
      if (target) { // ease toward a focused figure
        const dy = ((target[0] - yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI, dp = target[1] - pitch;
        yaw += dy * .08; pitch += dp * .08; if (Math.abs(dy) + Math.abs(dp) < .002) target = null;
      } else { yaw += vy; pitch += vp; vy += ((reduce ? 0 : .0016) - vy) * .02; vp *= .94; pitch += (14 * DEG - pitch) * .01; }
    }
    pitch = Math.max(-1.2, Math.min(1.2, pitch));
    grid();
    const P = pts.map((p) => proj(p.v));
    let lb = '', lf = '';
    segs.forEach(([a, b]) => { const A = P[a], B = P[b]; const s = `M${A[0].toFixed(1)} ${A[1].toFixed(1)}L${B[0].toFixed(1)} ${B[1].toFixed(1)}`; if (A[2] > 0 && B[2] > 0) lf += s; else lb += s; });
    lineBack.setAttribute('d', lb); lineFront.setAttribute('d', lf);
    let best = null;
    pts.forEach((p, i) => {
      const [x, y, z] = P[i];
      const k = .55 + .45 * Math.max(0, z);
      p.node.setAttribute('transform', p.star ? `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(2)})` : '');
      if (!p.star) { p.node.setAttribute('cx', x.toFixed(1)); p.node.setAttribute('cy', y.toFixed(1)); }
      p.node.setAttribute('opacity', (z >= 0 ? (p.o ?? 1) : (p.o ?? 1) * .22).toFixed(2));
      if (p.star && p.m === 1 && (!best || z > best.z)) best = { z, id: p.id };
    });
    if (best) { const pr = PRODUCTS.find((q) => q.id === best.id); label.textContent = `FACING · ${pr.name.toUpperCase()} · ${pr.figure.toUpperCase()}`; }
    raf = requestAnimationFrame(frame);
  }
  let raf = requestAnimationFrame(frame);

  svg.addEventListener('pointerdown', (e) => { dragging = true; target = null; lx = e.clientX; ly = e.clientY; svg.setPointerCapture(e.pointerId); svg.style.cursor = 'grabbing'; });
  svg.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const k = 1 / R * (svg.viewBox.baseVal.width / svg.getBoundingClientRect().width);
    vy = (e.clientX - lx) * k; vp = (e.clientY - ly) * k; yaw += vy; pitch += vp; lx = e.clientX; ly = e.clientY;
  });
  const up = () => { dragging = false; svg.style.cursor = 'grab'; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);

  return {
    svg,
    focus(id) { const s = SEATS[id]; if (s) target = [-s[0] * DEG, s[1] * DEG]; },
    destroy() { cancelAnimationFrame(raf); svg.remove(); },
  };
}
