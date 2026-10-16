// voxel-css.js — real voxels built from DOM + CSS 3D transforms only (no WebGL).
// Design 42 "Same Room". Each voxel is a preserve-3d box; only faces that touch air are drawn,
// so a 40-voxel model is ~100 divs. Faces can carry an image (used for the real product logos).
//
//   import { VoxelStage, MODELS } from './voxel-css.js';
//   const stage = new VoxelStage(document.querySelector('#stage'), { model: MODELS.mark, unit: 56 });
//   stage.assemble();          // "Stack Drop": voxels fall in on springs, lowest layer first
//   stage.drift();             // "Edge Drift": the model loosens along the lattice, then settles back
//   stage.destroy();
//
// Drag to orbit (springs back to the resting iso angle on release). Respects prefers-reduced-motion.
// Motion (motion.dev) is optional: pass { motion: window.Motion } to get spring physics; without it
// the module falls back to CSS transitions.

const STYLE_ID = 'vx-css-styles';
const CSS = `
.vx-scene{position:relative;perspective:2400px;perspective-origin:50% 40%;touch-action:none;user-select:none;cursor:grab}
.vx-scene:active{cursor:grabbing}
.vx-world,.vx-model,.vx-vox{position:absolute;left:50%;top:50%;transform-style:preserve-3d}
.vx-face{position:absolute;width:var(--u);height:var(--u);left:calc(var(--u) / -2);top:calc(var(--u) / -2);
  background:var(--c);backface-visibility:hidden;background-size:cover;background-position:center;
  box-shadow:inset 0 0 0 .5px rgb(0 0 0 / .04)}
.vx-face.t{filter:brightness(1.06)}
.vx-face.r{filter:brightness(.86)}
.vx-face.l{filter:brightness(.95)}
.vx-face.b{filter:brightness(.7)}
.vx-face.k{filter:brightness(.8)}
.vx-face.img{filter:none}
.vx-shadow{position:absolute;left:50%;top:50%;border-radius:50%;background:radial-gradient(closest-side,rgb(76 90 42 / .22),transparent);transform-style:preserve-3d}
`;

const FACES = [
  // dir, class, transform (u = half size placeholder)
  [[0, 0, 1], 'l', h => `translateZ(${h}px)`],
  [[0, 0, -1], 'k', h => `rotateY(180deg) translateZ(${h}px)`],
  [[1, 0, 0], 'r', h => `rotateY(90deg) translateZ(${h}px)`],
  [[-1, 0, 0], 'k', h => `rotateY(-90deg) translateZ(${h}px)`],
  [[0, 1, 0], 't', h => `rotateX(90deg) translateZ(${h}px)`],
  [[0, -1, 0], 'b', h => `rotateX(-90deg) translateZ(${h}px)`],
];
const FACE_NAME = { '0,0,1': 'front', '0,0,-1': 'back', '1,0,0': 'right', '-1,0,0': 'left', '0,1,0': 'top', '0,-1,0': 'bottom' };

export class VoxelStage {
  constructor(el, { model, unit = 48, rest = { x: -30, y: -45 }, drag = true, idle = true, motion = globalThis.Motion } = {}) {
    if (!document.getElementById(STYLE_ID)) { const s = document.createElement('style'); s.id = STYLE_ID; s.textContent = CSS; document.head.appendChild(s); }
    this.el = el; this.u = unit; this.rest = rest; this.rot = { ...rest }; this.M = motion;
    this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.classList.add('vx-scene'); el.style.setProperty('--u', unit + 'px');
    this.world = document.createElement('div'); this.world.className = 'vx-world';
    this.modelEl = document.createElement('div'); this.modelEl.className = 'vx-model';
    this.world.appendChild(this.modelEl); el.appendChild(this.world);
    this.load(model);
    this.apply();
    if (drag) this.bindDrag();
    if (idle && !this.reduce) this.idle();
  }

  load(model) {
    this.modelEl.textContent = '';
    const vox = model.voxels; const set = new Set(vox.map(v => v.p.join(',')));
    // centre the model on its footprint
    const xs = vox.map(v => v.p[0]), ys = vox.map(v => v.p[1]), zs = vox.map(v => v.p[2]);
    const c = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2];
    this.items = [];
    for (const v of vox) {
      const d = document.createElement('div'); d.className = 'vx-vox'; d.style.setProperty('--c', v.c);
      for (const [n, cls, tf] of FACES) {
        const nb = [v.p[0] + n[0], v.p[1] + n[1], v.p[2] + n[2]].join(',');
        if (set.has(nb) && !v.float) continue;
        const f = document.createElement('i'); f.className = 'vx-face ' + cls;
        const img = v.faces && v.faces[FACE_NAME[n.join(',')]];
        if (img) { f.classList.add('img'); f.style.background = img; }
        f.style.transform = tf(this.u / 2); d.appendChild(f);
      }
      const home = [(v.p[0] - c[0]) * this.u, -(v.p[1] - c[1]) * this.u, (v.p[2] - c[2]) * this.u];
      const item = { el: d, home, off: [0, 0, 0], s: 1, v };
      this.place(item); this.modelEl.appendChild(d); this.items.push(item);
    }
  }

  place(it) { it.el.style.transform = `translate3d(${it.home[0] + it.off[0]}px,${it.home[1] + it.off[1]}px,${it.home[2] + it.off[2]}px) scale3d(${it.s},${it.s},${it.s})`; }
  apply() { this.world.style.transform = `rotateX(${this.rot.x}deg) rotateY(${this.rot.y}deg)`; }

  tween(from, to, opts, onUpdate) {
    if (this.reduce) { onUpdate(to); return Promise.resolve(); }
    if (this.M && this.M.animate) return this.M.animate(from, to, { ...opts, onUpdate }).finished || Promise.resolve();
    // fallback: simple rAF ease-out
    return new Promise(res => { const t0 = performance.now(), dur = (opts.duration || 0.8) * 1000, dl = (opts.delay || 0) * 1000;
      const step = t => { const k = Math.min(1, Math.max(0, (t - t0 - dl) / dur)); const e = 1 - Math.pow(1 - k, 3); onUpdate(from + (to - from) * e); k < 1 ? requestAnimationFrame(step) : res(); }; requestAnimationFrame(step); });
  }

  // "Stack Drop": every voxel falls from above, lowest layer first, landing on a bouncy spring.
  assemble({ height = 7, stagger = 0.045 } = {}) {
    const order = [...this.items].sort((a, b) => (a.v.p[1] - b.v.p[1]) || ((a.v.p[0] + a.v.p[2]) - (b.v.p[0] + b.v.p[2])));
    return Promise.all(order.map((it, i) => {
      it.off = [0, -height * this.u, 0]; it.s = 0.6; this.place(it);
      return this.tween(0, 1, { type: 'spring', stiffness: 260, damping: 17, mass: 0.9, delay: i * stagger }, k => { it.off = [0, -height * this.u * (1 - k), 0]; it.s = 0.6 + 0.4 * Math.min(k, 1.1); this.place(it); });
    }));
  }

  // "Edge Drift": voxels loosen outward along the lattice axes, hang for a beat, then click home.
  async drift({ spread = 0.9 } = {}) {
    const rnd = (i) => { const x = Math.sin(i * 91.7) * 43758.5; return x - Math.floor(x); };
    const tos = this.items.map((it, i) => [it.home[0] * spread * 0.6 + (rnd(i) - 0.5) * this.u, -this.u * (0.6 + rnd(i + 3) * 1.8), it.home[2] * spread * 0.6 + (rnd(i + 7) - 0.5) * this.u]);
    await Promise.all(this.items.map((it, i) => this.tween(0, 1, { type: 'spring', stiffness: 90, damping: 14, delay: i * 0.012 }, k => { it.off = tos[i].map(t => t * k); this.place(it); })));
    await new Promise(r => setTimeout(r, 380));
    await Promise.all(this.items.map((it, i) => this.tween(1, 0, { type: 'spring', stiffness: 320, damping: 20, delay: i * 0.01 }, k => { it.off = tos[i].map(t => t * k); this.place(it); })));
  }

  // lift one voxel (e.g. on hover of a product cube); returns a function that drops it again
  lift(match, by = 0.5) {
    const its = this.items.filter(match);
    its.forEach(it => this.tween(it.off[1], -by * this.u, { type: 'spring', stiffness: 400, damping: 18 }, y => { it.off[1] = y; this.place(it); }));
    return () => its.forEach(it => this.tween(it.off[1], 0, { type: 'spring', stiffness: 400, damping: 22 }, y => { it.off[1] = y; this.place(it); }));
  }

  idle() {
    let t0 = performance.now();
    const loop = t => { if (this.dead) return; if (!this.dragging) { const k = (t - t0) / 1000; this.rot.y = this.rest.y + Math.sin(k * 0.6) * 9; this.rot.x = this.rest.x + Math.sin(k * 0.45) * 2.5; this.apply(); } this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }

  bindDrag() {
    let sx, sy, r0;
    this.onDown = e => { this.dragging = true; sx = e.clientX; sy = e.clientY; r0 = { ...this.rot }; this.el.setPointerCapture(e.pointerId); };
    this.onMove = e => { if (!this.dragging) return; this.rot.y = r0.y + (e.clientX - sx) * 0.45; this.rot.x = Math.max(-80, Math.min(10, r0.x - (e.clientY - sy) * 0.35)); this.apply(); };
    this.onUp = () => {
      if (!this.dragging) return; const from = { ...this.rot };
      this.tween(0, 1, { type: 'spring', stiffness: 120, damping: 16 }, k => { this.rot.y = from.y + (this.rest.y - from.y) * k; this.rot.x = from.x + (this.rest.x - from.x) * k; this.apply(); }).then(() => { this.dragging = false; });
    };
    this.el.addEventListener('pointerdown', this.onDown); this.el.addEventListener('pointermove', this.onMove);
    this.el.addEventListener('pointerup', this.onUp); this.el.addEventListener('pointercancel', this.onUp);
  }

  destroy() { this.dead = true; cancelAnimationFrame(this.raf); this.el.textContent = ''; }
}

// ---------- models ----------
const B = '#f3d761', L = '#a5ce6f';
const mark = [];
for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) if (!(x === 1 && y === 1 && z === 1)) mark.push({ p: [x, y, z], c: B });
mark.push({ p: [1, 3, 1], c: L, float: true });

// a 4-cube product shelf: the real logos sit on the front faces (pass base path of designs/_shared/products)
function shelf(base = '../../_shared/products/') {
  const logo = (u, bg = '#fff', size = '78%') => `${bg} url(${u}) center / ${size} no-repeat`;
  const v = [];
  for (let x = 0; x < 9; x++) v.push({ p: [x, 0, 0], c: '#e3c99c' });
  const items = [
    { x: 0, c: '#ffffff', f: logo(base + 'mcp-emails/icon.png') },
    { x: 2, c: '#ffffff', f: logo(base + 'fun-libs/icon.png', '#fff', '82%') },
    { x: 4, c: '#ffffff', f: logo(base + 'toolrails/icon.svg') },
    { x: 6, c: '#fbf9f4', f: logo(base + 'harbor/harbor-mark.svg', '#fbf9f4', '70%') },
  ];
  for (const it of items) v.push({ p: [it.x, 1, 0], c: it.c, faces: { front: it.f }, id: it.x / 2, float: true });
  v.push({ p: [8, 1, 0], c: '#daccf7' }, { p: [8, 2, 0], c: '#bae5fd' });
  return v;
}

// tiny 2019 phone and today's stack, for the split hero
const phone2019 = (() => { const v = []; for (let y = 0; y < 3; y++) for (let x = 0; x < 2; x++) v.push({ p: [x, y, 0], c: '#4a4f55' }); v.push({ p: [0, 0, 1], c: '#f3d761', float: true }); return v; })();

export const MODELS = { mark: { voxels: mark }, shelf: (base) => ({ voxels: shelf(base) }), phone2019: { voxels: phone2019 } };
