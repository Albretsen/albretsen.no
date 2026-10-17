// The Wardian case — CSS 3D transforms only (no canvas, no WebGL).
// import { createDiorama } from './diorama.js'
// createDiorama(document.querySelector('#case'), { base: '../', interactive: true })
// Requires diorama.css. `base` is the path to the assets/ folder.

const LAYERS = (b) => [
  // [kind, src/opts, x, y(offset up is negative), z, width, extra class]
  { kind: 'fern', x: -150, z: -130, lw: 230, color: '#2f6b33' },
  { kind: 'fern', x: 170, z: -110, lw: 200, color: '#5a9a4c', flip: true },
  { kind: 'img', src: b + 'extras/specimens/capers-merian.webp', x: 20, z: -90, lw: 190, op: .95 },
  { kind: 'mound', x: -40, z: -40, mw: 420, mh: 110 },
  { kind: 'mound', x: 150, z: 40, mw: 260, mh: 70 },
  { kind: 'img', src: b + 'hero/creatures/snail.webp', x: -170, y: -6, z: 10, lw: 120, cls: 'doze', name: 'Harbor' },
  { kind: 'img', src: b + 'hero/creatures/beetle.webp', x: -10, y: -64, z: -20, lw: 140, name: 'Fun Libs' },
  { kind: 'img', src: b + 'hero/creatures/moth.webp', x: 120, y: -190, z: 20, lw: 150, cls: 'flutter', name: 'MCP Emails' },
  { kind: 'mound', x: -120, z: 110, mw: 220, mh: 46 },
  { kind: 'img', src: b + 'hero/creatures/ant.webp', x: 110, y: 0, z: 100, lw: 110, cls: 'trundle', name: 'Toolrails' },
];

export function createDiorama(root, { base = '../', interactive = true, rx = -10, ry = -24 } = {}) {
  root.classList.add('dio');
  const cs = getComputedStyle(root);
  const px = v => parseFloat(cs.getPropertyValue(v));
  const d = px('--d'), rise = px('--rise');
  root.style.setProperty('--roof-len', Math.hypot(d / 2, rise) + 'px');
  root.style.setProperty('--roof-angle', (Math.atan2(d / 2, rise) * 180 / Math.PI) + 'deg');

  const el = (cls, parent, tag = 'div') => { const e = document.createElement(tag); e.className = cls; parent.appendChild(e); return e; };
  const scale = el('dio__scale', root);
  const box = el('dio__case', scale);
  el('dio__face dio__shadow', box);
  ['front', 'back', 'left', 'right', 'top'].forEach(s => el('dio__face dio__plinth dio__plinth--' + s, box));
  el('dio__face dio__floor', box);
  el('dio__pane dio__pane--fb dio__pane--back', box);
  el('dio__pane dio__pane--side dio__pane--left', box);
  el('dio__pane dio__pane--side dio__pane--right', box);
  el('dio__pane dio__roof dio__roof--back', box);

  for (const L of LAYERS(base)) {
    const w = el('dio__layer', box);
    w.style.setProperty('--x', (L.x || 0) + 'px'); w.style.setProperty('--y', (L.y || 0) + 'px'); w.style.setProperty('--z', (L.z || 0) + 'px');
    if (L.kind === 'img') {
      const i = el(L.cls || '', w, 'img'); i.src = L.src; i.alt = L.name ? `${L.name}, as a creature in the terrarium` : ''; i.style.setProperty('--lw', L.lw + 'px');
      if (L.op) i.style.opacity = L.op; if (L.name) w.title = L.name;
    } else if (L.kind === 'fern') {
      const f = el('dio__fern', w); f.style.setProperty('--lw', L.lw + 'px'); f.style.setProperty('--fern-c', L.color); if (L.flip) f.style.transform = 'scaleX(-1) rotate(-8deg)'; else f.style.transform = 'rotate(6deg)';
    } else if (L.kind === 'mound') {
      const m = el('dio__mound', w); m.style.setProperty('--mw', L.mw + 'px'); m.style.setProperty('--mh', L.mh + 'px');
    }
  }
  el('dio__pane dio__pane--fb dio__pane--front', box);
  el('dio__pane dio__roof dio__roof--front', box);
  el('dio__pane dio__gable dio__gable--left', box);
  el('dio__pane dio__gable dio__gable--right', box);
  el('dio__face dio__finial dio__finial--l', box);
  el('dio__face dio__finial dio__finial--r', box);

  const set = (x, y) => { root.style.setProperty('--ry', x + 'deg'); root.style.setProperty('--rx', y + 'deg'); };
  set(ry, rx);
  const fit = () => { const s = Math.min(1, root.parentElement.clientWidth / (px('--w') * 1.5)); root.style.setProperty('--scale', s.toFixed(3)); };
  fit(); addEventListener('resize', fit);
  if (!interactive || matchMedia('(prefers-reduced-motion: reduce)').matches) return { set };
  root.addEventListener('pointermove', e => {
    const r = root.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
    set(ry + nx * 50, rx - ny * 14);
  });
  root.addEventListener('pointerleave', () => set(ry, rx));
  return { set };
}
