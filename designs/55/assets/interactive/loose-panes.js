// Plate Nocturne: "Loose panes", the interactive hero asset.
// A museum photograph lies on the table; loose panes of glass rest on top of it.
// Every pane shows the world behind it displaced and slightly magnified, the way a thick plate
// shifts a ray (the same idea as the Albretsen mark). Drag a pane and the refraction travels with it.
// Click the dark and a new spark discharges through the panes. 2D only: DOM + one canvas, no WebGL.
//
//   import { mountLoosePanes } from './loose-panes.js'
//   import { sound } from './sound.js'           // optional
//   const hero = mountLoosePanes(document.querySelector('#hero'), { sound })
//   hero.discharge(0.6)   // fire a spark at 60% of the width
//   hero.destroy()
//
// Options (all optional):
//   photo:  url of a light-on-transparent emulsion (default: the 1886 Moussette lightning)
//   aspect: photo width / height (default 1100/1658)
//   photoH: photo height as a fraction of the root height (default 1.3)
//   focus:  [x, y] where the photo's subject sits in the root, as fractions (default [0.63, 0.52])
//   subjectX: where the subject sits across the photo itself, 0..1 (default 0.56)
//   bg:     background image url (default ember-field@2x.webp)
//   panes:  [{ x, y, w, h, dx, dy, s, label }] fractions of the root; dx/dy displacement, s magnification
//   sound:  object with tink() / spark() / slide() (see sound.js)

const here = new URL('.', import.meta.url);
const asset = (p) => new URL(p, here).href;

const CSS = `
.lp{position:relative;overflow:hidden;background:#090706;touch-action:pan-y;user-select:none;-webkit-user-select:none;cursor:crosshair}
.lp-world{position:absolute;left:0;top:0;transform-origin:0 0;pointer-events:none}
.lp-world>.lp-bg{position:absolute;inset:-6%;background-size:cover;background-position:center}
.lp-world>.lp-photo{position:absolute;background-size:100% 100%;background-repeat:no-repeat}
.lp-world>canvas{position:absolute;left:0;top:0}
.lp-pane{position:absolute;overflow:hidden;border-radius:6px;cursor:grab;touch-action:none;outline:none;
  box-shadow:0 30px 70px rgba(0,0,0,.55),0 4px 10px rgba(0,0,0,.4);transition:box-shadow .3s}
.lp-pane:active{cursor:grabbing}
.lp-pane .lp-world{filter:brightness(1.12) contrast(1.08)}
.lp-pane::before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(116deg,rgba(255,243,226,.13),rgba(255,243,226,.025) 22%,transparent 38%,rgba(255,243,226,.045) 57%,transparent 66%),
  linear-gradient(0deg,rgba(255,177,92,.05),transparent 30%);
  background-size:180% 100%;background-position:var(--sheen,30%) 0;transition:background-position .6s cubic-bezier(.2,.7,.2,1)}
.lp-pane::after{content:"";position:absolute;inset:0;z-index:3;border-radius:inherit;pointer-events:none;
  box-shadow:inset 0 0 0 1px rgba(255,236,214,.55),inset 0 2px 0 rgba(255,246,234,.45),inset 9px 0 12px -8px rgba(255,150,60,.5),inset -9px 0 12px -8px rgba(255,236,214,.12)}
.lp-pane:focus-visible::after{box-shadow:inset 0 0 0 2px #ff7e22}
.lp-pane.is-held{box-shadow:0 44px 90px rgba(0,0,0,.6),0 6px 14px rgba(0,0,0,.45)}
.lp-label{position:absolute;left:12px;bottom:10px;z-index:4;font:500 10px/1 "Geist Mono",ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:rgba(237,231,223,.6);pointer-events:none}
`;

function injectCSS() {
  if (document.getElementById('lp-css')) return;
  const s = document.createElement('style'); s.id = 'lp-css'; s.textContent = CSS; document.head.appendChild(s);
}

// midpoint-displacement bolt from (x0,y0) to (x1,y1)
function bolt(x0, y0, x1, y1, rough, depth, out) {
  if (depth === 0) { out.push([x1, y1]); return; }
  const mx = (x0 + x1) / 2 + (Math.random() - .5) * rough, my = (y0 + y1) / 2 + (Math.random() - .5) * rough * .3;
  bolt(x0, y0, mx, my, rough / 2, depth - 1, out);
  bolt(mx, my, x1, y1, rough / 2, depth - 1, out);
}

export function mountLoosePanes(root, opts = {}) {
  injectCSS();
  const o = Object.assign({
    photo: asset('../museum/emulsion-spark-1886.webp'), aspect: 1100 / 1658, photoH: 1.3,
    focus: [0.63, 0.52], subjectX: 0.56, bg: asset('../extras/ember-field@2x.webp'),
    panes: [
      { x: .505, y: .25, w: .22, h: .40, dx: .026, dy: 0, s: 1.05, label: 'Pane 1' },
      { x: .585, y: .56, w: .21, h: .30, dx: -.02, dy: .006, s: 1.03, label: 'Pane 2' },
    ],
    sound: null,
  }, opts);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('lp');
  let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2);
  const panes = o.panes.map(p => ({ ...p }));
  const mainCanvas = document.createElement('canvas');
  const mctx = mainCanvas.getContext('2d');
  let pointer = [0.5, 0.5];

  function makeWorld(withCanvas) {
    const w = document.createElement('div'); w.className = 'lp-world';
    w.innerHTML = `<div class="lp-bg" style="background-image:url('${o.bg}')"></div><div class="lp-photo" style="background-image:url('${o.photo}')"></div>`;
    if (withCanvas) w.appendChild(withCanvas);
    return w;
  }
  const world = makeWorld(mainCanvas);
  root.appendChild(world);
  panes.forEach((p, i) => {
    p.el = document.createElement('div'); p.el.className = 'lp-pane'; p.el.tabIndex = 0;
    p.el.setAttribute('role', 'button');
    p.el.setAttribute('aria-label', `${p.label || 'Glass pane ' + (i + 1)}. Drag, or use arrow keys, to move it over the photograph.`);
    p.canvas = document.createElement('canvas'); p.ctx = p.canvas.getContext('2d');
    p.world = makeWorld(null);
    p.el.appendChild(p.world); p.el.appendChild(p.canvas);
    p.canvas.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;z-index:1;filter:brightness(1.15)';
    if (p.label) p.el.insertAdjacentHTML('beforeend', `<span class="lp-label">${p.label}</span>`);
    root.appendChild(p.el);
  });

  function layoutWorld(w) {
    const bh = o.photoH * H, bw = bh * o.aspect;
    const ph = w.querySelector('.lp-photo');
    Object.assign(ph.style, { left: (o.focus[0] * W - o.subjectX * bw) + 'px', top: (o.focus[1] * H - bh / 2) + 'px', width: bw + 'px', height: bh + 'px' });
    w.style.width = W + 'px'; w.style.height = H + 'px';
  }
  function placePane(p) {
    const px = p.x * W, py = p.y * H, pw = p.w * W, ph = p.h * H;
    // parallax: the displacement leans with the pointer, as if the eye moved
    const lean = reduce ? 0 : 1;
    const dx = (p.dx + (pointer[0] - .5) * .012 * lean) * W, dy = (p.dy + (pointer[1] - .5) * .008 * lean) * H;
    Object.assign(p.el.style, { left: px + 'px', top: py + 'px', width: pw + 'px', height: ph + 'px' });
    p.tx = p.s * (-px + dx - pw / 2) + pw / 2; p.ty = p.s * (-py + dy - ph / 2) + ph / 2;
    p.world.style.transform = `translate(${p.tx}px, ${p.ty}px) scale(${p.s})`;
    p.el.style.setProperty('--sheen', (20 + pointer[0] * 60) + '%');
    p.pw = pw; p.ph = ph;
  }
  function resize() {
    const r = root.getBoundingClientRect(); W = r.width; H = r.height;
    mainCanvas.width = W * dpr; mainCanvas.height = H * dpr; mainCanvas.style.width = W + 'px'; mainCanvas.style.height = H + 'px';
    layoutWorld(world);
    panes.forEach(p => {
      layoutWorld(p.world); placePane(p);
      p.canvas.width = p.pw * dpr; p.canvas.height = p.ph * dpr; p.canvas.style.width = p.pw + 'px'; p.canvas.style.height = p.ph + 'px';
    });
  }

  // ---------- sparks ----------
  let sparks = [], raf = 0;
  function discharge(fx = Math.random() * .6 + .3) {
    const x0 = fx * W + (Math.random() - .5) * W * .1, x1 = fx * W + (Math.random() - .5) * W * .25;
    const pts = [[x0, -10]]; bolt(x0, -10, x1, H + 10, W * .22, 8, pts);
    const branches = [];
    for (let k = 0; k < 3; k++) {
      const a = pts[(Math.random() * pts.length * .7) | 0]; const b = [[a[0], a[1]]];
      bolt(a[0], a[1], a[0] + (Math.random() - .5) * W * .25, a[1] + H * (.15 + Math.random() * .2), W * .08, 6, b);
      branches.push(b);
    }
    sparks.push({ pts, branches, t0: performance.now(), life: reduce ? 500 : 900 });
    o.sound && o.sound.spark && o.sound.spark();
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function stroke(ctx, pts, w, a) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.lineWidth = w; ctx.globalAlpha = a; ctx.stroke();
  }
  function frame(now) {
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0); mctx.clearRect(0, 0, W, H);
    mctx.lineJoin = 'round'; mctx.lineCap = 'round';
    sparks = sparks.filter(s => now - s.t0 < s.life);
    for (const s of sparks) {
      const k = (now - s.t0) / s.life;
      const flick = reduce ? 1 : (k < .25 ? (Math.sin(k * 90) > -.3 ? 1 : .25) : 1);
      const a = Math.pow(1 - k, 1.6) * flick;
      mctx.shadowColor = 'rgba(255,126,34,.9)'; mctx.shadowBlur = 24;
      mctx.strokeStyle = '#ff7e22'; stroke(mctx, s.pts, 14, a * .14); stroke(mctx, s.pts, 5.5, a * .9);
      s.branches.forEach(b => stroke(mctx, b, 2.6, a * .7));
      mctx.shadowBlur = 8; mctx.strokeStyle = '#fff3e2'; stroke(mctx, s.pts, 1.6, a);
      s.branches.forEach(b => stroke(mctx, b, .9, a * .7));
    }
    mctx.globalAlpha = 1; mctx.shadowBlur = 0;
    // mirror into each pane, displaced exactly like its DOM world
    for (const p of panes) {
      p.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); p.ctx.clearRect(0, 0, p.pw, p.ph);
      p.ctx.setTransform(dpr * p.s, 0, 0, dpr * p.s, dpr * p.tx, dpr * p.ty);
      p.ctx.drawImage(mainCanvas, 0, 0, W, H);
    }
    raf = sparks.length ? requestAnimationFrame(frame) : 0;
    if (!raf) { mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height); panes.forEach(p => { p.ctx.setTransform(1, 0, 0, 1, 0, 0); p.ctx.clearRect(0, 0, p.canvas.width, p.canvas.height); }); }
  }

  // ---------- interaction ----------
  let drag = null, moved = false;
  function onDown(e) {
    const p = panes.find(q => q.el === e.currentTarget); if (!p) return;
    drag = { p, sx: e.clientX, sy: e.clientY, x: p.x, y: p.y }; moved = false;
    p.el.setPointerCapture(e.pointerId); p.el.classList.add('is-held');
    root.appendChild(p.el); // bring to front
    o.sound && o.sound.tink && o.sound.tink();
    e.stopPropagation();
  }
  function onMove(e) {
    const r = root.getBoundingClientRect();
    pointer = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
    if (drag) {
      const nx = drag.x + (e.clientX - drag.sx) / W, ny = drag.y + (e.clientY - drag.sy) / H;
      drag.p.x = Math.max(-drag.p.w * .5, Math.min(1 - drag.p.w * .5, nx));
      drag.p.y = Math.max(-drag.p.h * .5, Math.min(1 - drag.p.h * .5, ny));
      if (!moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 24) { moved = true; o.sound && o.sound.slide && o.sound.slide(); }
    }
    panes.forEach(placePane);
    if (sparks.length === 0) return;
  }
  function onUp() { if (drag) { drag.p.el.classList.remove('is-held'); drag = null; } }
  function onClick(e) {
    if (e.target.closest('.lp-pane')) return;
    const r = root.getBoundingClientRect(); discharge((e.clientX - r.left) / r.width);
  }
  function onKey(e) {
    const p = panes.find(q => q.el === e.currentTarget); if (!p) return;
    const step = e.shiftKey ? .05 : .01; let hit = true;
    if (e.key === 'ArrowLeft') p.x -= step; else if (e.key === 'ArrowRight') p.x += step;
    else if (e.key === 'ArrowUp') p.y -= step; else if (e.key === 'ArrowDown') p.y += step;
    else if (e.key === 'Enter' || e.key === ' ') discharge(p.x + p.w / 2); else hit = false;
    if (hit) { e.preventDefault(); placePane(p); }
  }
  panes.forEach(p => { p.el.addEventListener('pointerdown', onDown); p.el.addEventListener('keydown', onKey); });
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', onUp);
  root.addEventListener('click', onClick);
  const ro = new ResizeObserver(resize); ro.observe(root);
  resize();

  return {
    discharge,
    destroy() { ro.disconnect(); cancelAnimationFrame(raf); root.innerHTML = ''; root.classList.remove('lp'); },
  };
}
