// motion.js — signature motion for design 42 "Same Room". Requires Motion (motion.dev):
//   <script src="assets/vendor/motion-12.23.12.js"></script>  (exposes window.Motion)
//   <script type="module"> import * as M from './assets/motion.js'; M.init(); </script>
//
// 1. STACK DROP (entrance)   [data-drop]       Blocks fall into place on a short spring, lowest row first.
//                                              Researched from the voxel "assemble" idiom (Codrops' CSS voxel
//                                              renderer, 21st.dev Voxel Form) and Motion's stagger()+inView().
// 2. MAGNETIC PULL (hover)   [data-magnetic]   Buttons/links lean toward the cursor inside a radius; the label
//                                              inside leans further (two springs, 0.35 and 0.6 strength). Spring
//                                              stiffness 150 / damping 15 / mass 0.1 per the community recipe.
// 3. EDGE DRIFT (transition) [data-seam]       The 2019|today split: a draggable edge between two registered
//                                              renders. The edge follows on a spring and sheds little voxels
//                                              that drift upward from the seam as it moves.
// 4. LAYER UNSTACK (state)   [data-state]      Radix-style: content keyed to data-state="open|closed" restacks its
//                                              children one by one (CSS in motion.css, uses --radix-*-height).
// 5. BLOCK LIFT (hover)      [data-lift]       Cards lift one voxel unit and their offset "block shadow" grows,
//                                              as if a voxel was picked off the grid (CSS in motion.css).
//
// Everything respects prefers-reduced-motion.

const M = () => globalThis.Motion;
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function stackDrop(root = document) {
  const { animate, inView, stagger } = M();
  root.querySelectorAll('[data-drop]').forEach(group => {
    const kids = group.matches('[data-drop="self"]') ? [group] : [...group.children];
    if (reduce()) return;
    kids.forEach(k => { k.style.opacity = 0; k.style.transform = 'translateY(-48px) scale(.92)'; });
    inView(group, () => {
      animate(kids, { opacity: [0, 1], y: [-48, 0], scale: [0.92, 1] },
        { type: 'spring', stiffness: 380, damping: 18, mass: 0.8, delay: stagger(0.06) });
    }, { amount: 0.3 });
  });
}

export function magnetic(root = document, { radius = 90, strength = 0.35, inner = 0.6 } = {}) {
  if (reduce() || matchMedia('(pointer: coarse)').matches) return;
  const { springValue, motionValue } = M();
  root.querySelectorAll('[data-magnetic]').forEach(el => {
    const label = el.querySelector('[data-magnetic-label]') || null;
    const cfg = { stiffness: 150, damping: 15, mass: 0.1 };
    const x = springValue(0, cfg), y = springValue(0, cfg), lx = springValue(0, cfg), ly = springValue(0, cfg);
    const render = () => {
      el.style.transform = `translate3d(${x.get()}px, ${y.get()}px, 0)`;
      if (label) label.style.transform = `translate3d(${lx.get()}px, ${ly.get()}px, 0)`;
    };
    [x, y, lx, ly].forEach(v => v.on('change', render));
    const move = e => {
      const r = el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy);
      const reach = Math.max(r.width, r.height) / 2 + radius;
      if (d < reach) { x.set(dx * strength); y.set(dy * strength); lx.set(dx * strength * inner); ly.set(dy * strength * inner); el.dataset.pulled = ''; }
      else if ('pulled' in el.dataset) { x.set(0); y.set(0); lx.set(0); ly.set(0); delete el.dataset.pulled; }
    };
    window.addEventListener('pointermove', move, { passive: true });
  });
}

export function seam(el) {
  // markup: <div data-seam><img class="then"><img class="now"><i class="seam-edge"></i></div>
  const { animate, springValue } = M();
  const edge = el.querySelector('.seam-edge');
  const pos = springValue(50, { stiffness: 220, damping: 26 });
  let last = 50;
  const shed = (p) => {
    if (reduce()) return;
    const r = el.getBoundingClientRect(); const n = Math.min(4, Math.ceil(Math.abs(p - last) / 2));
    for (let i = 0; i < n; i++) {
      const b = document.createElement('i'); b.className = 'seam-bit';
      const cols = ['#f3d761', '#a5ce6f', '#bae5fd', '#daccf7', '#fed0b2'];
      b.style.cssText = `left:${p}%;top:${30 + Math.random() * 55}%;background:${cols[(Math.random() * cols.length) | 0]}`;
      el.appendChild(b);
      animate(b, { y: [0, -60 - Math.random() * 90], x: [0, (Math.random() - 0.5) * 50], rotate: [0, 90], opacity: [1, 0] }, { duration: 1.1 + Math.random() * 0.6, ease: [0.2, 0.7, 0.3, 1] }).finished.then(() => b.remove());
    }
    last = p;
  };
  pos.on('change', p => { el.style.setProperty('--seam', p + '%'); shed(p); });
  el.style.setProperty('--seam', '50%');
  const set = e => { const r = el.getBoundingClientRect(); pos.set(Math.max(4, Math.min(96, ((e.clientX - r.left) / r.width) * 100))); };
  el.addEventListener('pointermove', set);
  el.addEventListener('pointerleave', () => pos.set(50));
  // keyboard: arrow keys move the edge
  el.tabIndex = 0; el.setAttribute('role', 'slider'); el.setAttribute('aria-label', '2019 versus today');
  el.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') pos.set(Math.max(4, pos.get() - 8)); if (e.key === 'ArrowRight') pos.set(Math.min(96, pos.get() + 8)); });
  return { set: v => pos.set(v) };
}

export function init(root = document) {
  if (!M()) { console.warn('motion.js: load vendor/motion-12.23.12.js first'); return; }
  stackDrop(root); magnetic(root);
  root.querySelectorAll('[data-seam]').forEach(seam);
}
