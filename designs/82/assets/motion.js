// Q.E.D. motion study (design 82). Dependency-free ES module.
//
//   1. Proof Morph     – any glyph becomes any other: strands resampled + paired, sun sector tweened.
//   2. Fracture Reveal – content splits along a jagged seam, a hairline of dawn light in the crack.
//   3. Dawn Rise       – the sun sector rises from its horizon on first paint; numbers count up after.
//   4. Gravity Settle  – springs with a little overshoot, used by tabs indicator and hover cards.
//   5. Radix-style primitives (accordion, dialog, tooltip, hover card, tabs) driven by data-state,
//      animated in motion.css. Same attributes as Radix, so a React build can swap in @radix-ui.
//   +  Easter egg: type "qed" (or triple-click any [data-qed-mark]) and every glyph on the page
//      falls under gravity, piles up at the bottom, then rises again at "dawn".
//
// All motion respects prefers-reduced-motion.

import { icons, sectorPath, STROKE } from './icons/icons.js';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';
export const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  // critically-damped-ish spring with one soft overshoot ("gravity settle")
  settle: (t) => 1 - Math.exp(-6.5 * t) * Math.cos(7.2 * t),
};

// ------------------------------------------------------------------ 1. Proof Morph
const N = 64;               // samples per strand
const probe = (() => { let p; return () => p || (p = (() => {
  const s = document.createElementNS(NS, 'svg'); s.setAttribute('width', 0); s.setAttribute('height', 0);
  s.style.position = 'absolute'; s.style.visibility = 'hidden';
  const path = document.createElementNS(NS, 'path'); s.appendChild(path); document.body.appendChild(s); return path; })()); })();

function sample(d) {
  const p = probe(); p.setAttribute('d', d);
  const L = p.getTotalLength(); const pts = [];
  for (let i = 0; i < N; i++) { const q = p.getPointAtLength((L * i) / (N - 1)); pts.push([q.x, q.y]); }
  return pts;
}
const centroid = (pts) => pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
const collapsed = (c) => Array.from({ length: N }, () => [c[0], c[1]]);
const cache = new Map();
const strandsOf = (id) => { if (!cache.has(id)) cache.set(id, icons[id].strokes.map(sample)); return cache.get(id); };

function pair(a, b) {
  // greedy nearest-centroid pairing; leftovers grow from / collapse into their own centroid
  const A = a.map((s) => ({ s, c: centroid(s) })), B = b.map((s) => ({ s, c: centroid(s) }));
  const out = []; const used = new Set();
  for (const x of A) {
    let best = -1, bd = Infinity;
    B.forEach((y, j) => { if (used.has(j)) return; const d = (x.c[0] - y.c[0]) ** 2 + (x.c[1] - y.c[1]) ** 2; if (d < bd) { bd = d; best = j; } });
    if (best >= 0) {
      used.add(best);
      let to = B[best].s;
      // choose direction that travels less
      const fwd = x.s.reduce((acc, p, i) => acc + Math.hypot(p[0] - to[i][0], p[1] - to[i][1]), 0);
      const rev = x.s.reduce((acc, p, i) => acc + Math.hypot(p[0] - to[N - 1 - i][0], p[1] - to[N - 1 - i][1]), 0);
      if (rev < fwd) to = [...to].reverse();
      out.push([x.s, to]);
    } else out.push([x.s, collapsed(x.c)]);
  }
  B.forEach((y, j) => { if (!used.has(j)) out.push([collapsed(y.c), y.s]); });
  return out;
}
const toD = (pts) => 'M' + pts.map((p) => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('L');

/**
 * Mount a morphable glyph into `el`. Returns { to(id), id }.
 * options: size, ink, dawn, duration (ms), fracture (px of seam displacement mid-flight)
 */
export function glyph(el, id, { size = 96, ink = 'currentColor', dawn = 'var(--qed-dawn, #fea91e)', duration = 900, fracture = 1.6, stroke = STROKE } = {}) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', size); svg.setAttribute('height', size);
  svg.setAttribute('fill', 'none'); svg.setAttribute('role', 'img'); svg.classList.add('qed-glyph');
  const sun = document.createElementNS(NS, 'path'); sun.setAttribute('fill', dawn); svg.appendChild(sun);
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('stroke', ink); g.setAttribute('stroke-width', stroke); g.setAttribute('stroke-linejoin', 'miter');
  svg.appendChild(g); el.appendChild(svg);
  let cur = id, raf = 0, curSun = icons[id].sun.slice();
  const paths = [];
  const setStrands = (list) => {
    while (paths.length < list.length) { const p = document.createElementNS(NS, 'path'); g.appendChild(p); paths.push(p); }
    paths.forEach((p, i) => { if (i < list.length) { p.setAttribute('d', toD(list[i])); p.style.display = ''; } else p.style.display = 'none'; });
  };
  setStrands(strandsOf(id)); sun.setAttribute('d', sectorPath(curSun)); svg.setAttribute('aria-label', icons[id].name);

  function to(next) {
    if (next === cur) return Promise.resolve();
    const pairs = pair(strandsOf(cur), strandsOf(next));
    const s0 = curSun.slice(), s1 = icons[next].sun.slice();
    // sun: if one side has no sun, grow/shrink in place
    if (s0[2] === 0) { s0[0] = s1[0]; s0[1] = s1[1]; }
    if (s1[2] === 0) { s1[0] = s0[0]; s1[1] = s0[1]; }
    cur = next; svg.setAttribute('aria-label', icons[next].name);
    cancelAnimationFrame(raf);
    if (reduce()) { setStrands(strandsOf(next)); curSun = icons[next].sun.slice(); sun.setAttribute('d', sectorPath(curSun)); return Promise.resolve(); }
    const t0 = performance.now();
    return new Promise((done) => {
      const tick = (now) => {
        const T = Math.min(1, (now - t0) / duration);
        const frames = pairs.map(([a, b], k) => {
          // stagger each strand a little: the glyph "re-proves" itself stroke by stroke
          const local = Math.min(1, Math.max(0, (T - k * 0.07) / (1 - Math.min(0.35, (pairs.length - 1) * 0.07))));
          const e = ease.inOut(local);
          // fracture: mid-flight, the two halves of each strand shear apart along the normal
          const split = Math.sin(Math.PI * e) * fracture;
          return a.map((p, i) => {
            const side = i < N / 2 ? -1 : 1;
            return [p[0] + (b[i][0] - p[0]) * e + side * split * 0.35, p[1] + (b[i][1] - p[1]) * e - side * split * 0.2];
          });
        });
        setStrands(frames);
        const es = ease.settle(T);
        curSun = s0.map((v, i) => v + (s1[i] - v) * (i === 2 ? es : ease.inOut(T)));
        sun.setAttribute('d', sectorPath([curSun[0], curSun[1], Math.max(0, curSun[2]), curSun[3], curSun[4]]));
        if (T < 1) raf = requestAnimationFrame(tick);
        else { setStrands(strandsOf(next)); curSun = icons[next].sun.slice(); sun.setAttribute('d', sectorPath(curSun)); done(); }
      };
      raf = requestAnimationFrame(tick);
    });
  }
  return { to, get id() { return cur; }, svg };
}

/** Cycle a glyph through a list forever (pauses when offscreen). */
export function cycle(el, ids, opts = {}) {
  const gl = glyph(el, ids[0], opts); let i = 0, visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(el);
  const step = async () => { if (visible && !document.hidden) { i = (i + 1) % ids.length; await gl.to(ids[i]); } setTimeout(step, opts.hold || 1500); };
  setTimeout(step, opts.hold || 1500);
  return gl;
}

// ------------------------------------------------------------------ 2. Fracture Reveal
// <div data-fracture> … </div>  → split into two clipped copies that part along a jagged seam.
export function fractureReveal(el, { duration = 1100, gap = 22 } = {}) {
  if (reduce()) { el.classList.add('is-revealed'); return; }
  const seam = jagged(7);
  el.style.setProperty('--seam-l', `polygon(0 0, ${seam.map(([x, y]) => `${x}% ${y}%`).join(', ')}, 0 100%)`);
  el.style.setProperty('--seam-r', `polygon(100% 0, ${seam.map(([x, y]) => `${x}% ${y}%`).join(', ')}, 100% 100%)`);
  el.style.setProperty('--seam-path', seam.map(([x, y]) => `${x},${y}`).join(' '));
  el.style.setProperty('--fracture-gap', gap + 'px');
  el.style.setProperty('--fracture-dur', duration + 'ms');
  // the seam of light: a non-scaling polyline along the same jagged path
  let seamEl = el.querySelector('.fr-seam');
  if (!seamEl) { seamEl = document.createElementNS(NS, 'svg'); seamEl.classList.add('fr-seam'); el.appendChild(seamEl); }
  seamEl.setAttribute('viewBox', '0 0 100 100'); seamEl.setAttribute('preserveAspectRatio', 'none');
  seamEl.innerHTML = `<polyline points="${seam.map(([x, y]) => `${x},${y}`).join(' ')}" fill="none" stroke="var(--qed-dawn, #fea91e)" stroke-width="2" vector-effect="non-scaling-stroke" style="filter: drop-shadow(0 0 6px var(--qed-dawn, #fea91e))"/>`;
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('is-revealed'); io.disconnect(); } }, { threshold: 0.35 });
  io.observe(el);
}
function jagged(n) {
  // deterministic seam: top→bottom, x around 50% with sharp zigzags (matches the hero fracture)
  const pts = []; let seed = 82;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i <= n; i++) pts.push([+(50 + (rnd() - 0.5) * 9).toFixed(2), +((i / n) * 100).toFixed(2)]);
  return pts;
}

// ------------------------------------------------------------------ 3. Dawn Rise
// Any [data-dawn] glyph: its sun rises from the horizon; [data-count] numbers count up afterwards.
export function dawnRise(root = document) {
  root.querySelectorAll('[data-dawn]').forEach((el) => el.classList.add('is-dawn'));
  root.querySelectorAll('[data-count]').forEach((el) => {
    const target = el.getAttribute('data-count'); const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    if (!isFinite(num) || reduce()) { el.textContent = target; return; }
    const prefix = target.match(/^[^0-9]*/)[0], suffix = target.match(/[^0-9.,]*$/)[0];
    const commas = target.includes(',');
    const t0 = performance.now() + 500, dur = 1400;
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - t0) / dur));
      const v = Math.round(num * ease.out(t));
      el.textContent = prefix + (commas ? v.toLocaleString('en-US') : v) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// ------------------------------------------------------------------ 5. Radix-style primitives
let uid = 0; const nid = (p) => `${p}-${++uid}`;

export function accordion(root) {
  root.querySelectorAll('[data-acc-item]').forEach((item) => {
    const trig = item.querySelector('[data-acc-trigger]'), panel = item.querySelector('[data-acc-content]');
    const id = nid('acc'); panel.id = id; trig.setAttribute('aria-controls', id);
    const set = (open) => {
      panel.style.setProperty('--qed-content-height', panel.scrollHeight + 'px');
      for (const n of [item, trig, panel]) n.dataset.state = open ? 'open' : 'closed';
      trig.setAttribute('aria-expanded', open); if (open) panel.hidden = false;
    };
    panel.addEventListener('animationend', () => { if (panel.dataset.state === 'closed') panel.hidden = true; });
    set(item.hasAttribute('data-open')); if (!item.hasAttribute('data-open')) panel.hidden = true;
    trig.addEventListener('click', () => {
      const open = item.dataset.state !== 'open';
      if (root.hasAttribute('data-single') && open) root.querySelectorAll('[data-acc-item][data-state=open]').forEach((o) => o !== item && o.querySelector('[data-acc-trigger]').click());
      if (open) { panel.hidden = false; requestAnimationFrame(() => set(true)); } else set(false);
    });
  });
}

export function dialog(trigger, dlg) {
  // <dialog data-qed-dialog> with ::backdrop; opening animates a fracture slit open (see motion.css)
  trigger.addEventListener('click', () => { dlg.dataset.state = 'open'; dlg.showModal(); });
  const close = () => { dlg.dataset.state = 'closed'; dlg.addEventListener('animationend', () => dlg.close(), { once: true }); if (reduce()) dlg.close(); };
  dlg.querySelectorAll('[data-dialog-close]').forEach((b) => b.addEventListener('click', close));
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
}

function floating(trigger, content, { delay = 300, closeDelay = 120, side = 'top' } = {}) {
  let t; content.dataset.side = side; content.dataset.state = 'closed'; content.hidden = true;
  const place = () => {
    const r = trigger.getBoundingClientRect(), c = content.getBoundingClientRect();
    let x = r.left + r.width / 2 - c.width / 2, y = side === 'top' ? r.top - c.height - 10 : r.bottom + 10;
    x = Math.max(8, Math.min(innerWidth - c.width - 8, x));
    content.style.left = x + scrollX + 'px'; content.style.top = y + scrollY + 'px';
  };
  const open = () => { clearTimeout(t); t = setTimeout(() => { content.hidden = false; place(); content.dataset.state = 'open'; }, delay); };
  const shut = () => { clearTimeout(t); t = setTimeout(() => { content.dataset.state = 'closed'; setTimeout(() => { if (content.dataset.state === 'closed') content.hidden = true; }, 160); }, closeDelay); };
  for (const n of [trigger, content]) { n.addEventListener('pointerenter', open); n.addEventListener('pointerleave', shut); }
  trigger.addEventListener('focus', open); trigger.addEventListener('blur', shut);
}
export const tooltip = (trigger, content) => { content.setAttribute('role', 'tooltip'); trigger.setAttribute('aria-describedby', content.id ||= nid('tip')); floating(trigger, content, { delay: 250, side: 'top' }); };
export const hoverCard = (trigger, content) => floating(trigger, content, { delay: 450, closeDelay: 200, side: 'bottom' });

export function tabs(root) {
  const list = root.querySelector('[role=tablist]'); const ts = [...list.querySelectorAll('[role=tab]')];
  const ind = document.createElement('span'); ind.className = 'qed-tab-indicator'; list.appendChild(ind);
  const panels = ts.map((t) => root.querySelector('#' + t.getAttribute('aria-controls')));
  let x = 0, w = 0, raf;
  const select = (i, animate = true) => {
    ts.forEach((t, j) => { t.setAttribute('aria-selected', i === j); t.dataset.state = i === j ? 'active' : 'inactive'; t.tabIndex = i === j ? 0 : -1;
      panels[j].dataset.state = i === j ? 'active' : 'inactive'; panels[j].hidden = i !== j; });
    const tx = ts[i].offsetLeft, tw = ts[i].offsetWidth; const x0 = x, w0 = w, t0 = performance.now();
    cancelAnimationFrame(raf);
    const tick = (now) => { const t = animate && !reduce() ? Math.min(1, (now - t0) / 650) : 1; const e = ease.settle(t);
      x = x0 + (tx - x0) * e; w = w0 + (tw - w0) * e; ind.style.transform = `translateX(${x}px)`; ind.style.width = w + 'px'; if (t < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  };
  ts.forEach((t, i) => { t.addEventListener('click', () => select(i)); t.addEventListener('keydown', (e) => {
    const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { const n = (i + k + ts.length) % ts.length; ts[n].focus(); select(n); } }); });
  requestAnimationFrame(() => select(Math.max(0, ts.findIndex((t) => t.getAttribute('aria-selected') === 'true')), false));
}

// ------------------------------------------------------------------ Easter egg: Q.E.D.
// Type "qed" or triple-click a [data-qed-mark]. Everything with .qed-glyph (or [data-glyph]) falls,
// piles up on the floor of the viewport, then floats back up to where it was.
export function easterEgg() {
  let buf = '';
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input,textarea,[contenteditable]')) return;
    buf = (buf + e.key.toLowerCase()).slice(-3); if (buf === 'qed') { buf = ''; drop(); }
  });
  document.querySelectorAll('[data-qed-mark]').forEach((m) => m.addEventListener('click', (e) => { if (e.detail === 3) drop(); }));
}
let dropping = false;
export function drop() {
  if (dropping || reduce()) return; dropping = true;
  const els = [...document.querySelectorAll('.qed-glyph, [data-glyph]')].filter((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; });
  const H = innerHeight, g = 2600; const bodies = els.map((el) => {
    const r = el.getBoundingClientRect();
    return { el, y: 0, vy: -120 - Math.random() * 260, x: 0, vx: (Math.random() - 0.5) * 160, rot: 0, vr: (Math.random() - 0.5) * 540, floor: H - r.bottom - Math.random() * 18, top: r.top };
  });
  const banner = document.createElement('div'); banner.className = 'qed-egg-banner'; banner.innerHTML = '<span>Q.E.D.</span><small>which was to be demonstrated</small>';
  document.body.appendChild(banner);
  let last = performance.now(); const start = last;
  const fall = (now) => {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    for (const b of bodies) {
      b.vy += g * dt; b.y += b.vy * dt; b.x += b.vx * dt; b.rot += b.vr * dt;
      if (b.y > b.floor) { b.y = b.floor; b.vy *= -0.32; b.vx *= 0.7; b.vr *= 0.6; if (Math.abs(b.vy) < 40) b.vy = 0; }
      b.el.style.transform = `translate(${b.x}px, ${b.y}px) rotate(${b.rot}deg)`;
    }
    if (now - start < 2600) requestAnimationFrame(fall);
    else {
      // dawn: everything rises back
      banner.classList.add('is-out');
      for (const b of bodies) { b.el.style.transition = 'transform 1.4s cubic-bezier(.2,.8,.2,1)'; b.el.style.transform = ''; }
      setTimeout(() => { for (const b of bodies) b.el.style.transition = ''; banner.remove(); dropping = false; }, 1500);
    }
  };
  requestAnimationFrame(fall);
  console.log('%cQ.E.D.', 'font: 600 20px Geist, system-ui; color: #fea91e');
}
