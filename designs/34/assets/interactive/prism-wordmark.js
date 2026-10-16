// prism-wordmark.js — the hero centrepiece of design 34 "Tension Prism".
//
// A giant wordmark built from ~1,000 SVG triangles on one crystal lattice.
//  • Crystallize: on mount, every facet flies in from a scattered cloud and
//    locks into the lattice, sweeping left → right.
//  • Tension: the pointer is a lens. Facets near it are pushed out, twisted
//    and lit mint, then spring back (damped springs per facet).
//  • Morph: morphTo('FUN LIBS') re-flows the same facets into another word.
//    Each triangle's three vertices are interpolated (true SVG point morph,
//    up-facets can flip into down-facets) along a curved path.
//  • Burst: click/tap blows the word apart from the click point; it reforms.
//
// Usage:
//   import { PrismWordmark } from './prism-wordmark.js';
//   const pw = await PrismWordmark.mount(el, { words: ['ALBRETSEN', 'MCP EMAILS'], cycle: 5000 });
//   pw.morphTo('TOOLRAILS'); pw.burst(); pw.destroy();
// The element should have a width; the SVG fills it and keeps its aspect.
// Requires the Anybody font (Google Fonts) to be loaded on the page.

import { latticeFor, facetShade, inBeam } from './prism-lattice.js';

const MINT = '#39FD9E';
const NS = 'http://www.w3.org/2000/svg';
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export class PrismWordmark {
  static async mount(el, opts = {}) {
    try { await document.fonts.load('900 100px Anybody'); } catch {}
    const pw = new PrismWordmark(el, opts);
    pw.start();
    return pw;
  }

  constructor(el, o = {}) {
    this.el = el;
    this.o = { rows: 14, side: 24, tracking: 0.4, radius: 150, cycle: 0, gap: 0.9, ...o };
    this.words = this.o.words || ['ALBRETSEN'];
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // build every word on one lattice, centred by whole lattice steps
    const s = this.o.side;
    this.layouts = new Map();
    let maxW = 0, maxH = 0;
    for (const w of this.words) {
      const L = latticeFor(w, { rows: this.o.rows, side: s, tracking: this.o.tracking });
      this.layouts.set(w, L);
      maxW = Math.max(maxW, L.width); maxH = Math.max(maxH, L.height);
    }
    this.W = Math.ceil(maxW + s); this.H = Math.ceil(maxH + s * 0.9);
    for (const L of this.layouts.values()) {
      const dx = Math.round((this.W - L.width) / 2 / s) * s;
      const dy = Math.round((this.H - L.height) / 2 / (s * 0.866 * 2)) * s * 0.866 * 2;
      for (const t of L.tris) {
        for (let i = 0; i < 6; i += 2) { t.pts[i] += dx; t.pts[i + 1] += dy; }
        t.cx += dx; t.cy += dy;
      }
      L.tris.sort((a, b) => a.cx - b.cx || a.cy - b.cy);
    }
    const N = Math.max(...[...this.layouts.values()].map((L) => L.tris.length));
    this.svg = document.createElementNS(NS, 'svg');
    this.svg.setAttribute('viewBox', `0 0 ${this.W} ${this.H}`);
    this.svg.setAttribute('role', 'img');
    this.svg.setAttribute('aria-label', this.words[0]);
    this.svg.style.cssText = 'display:block;width:100%;height:auto;overflow:visible;touch-action:pan-y';
    this.g = document.createElementNS(NS, 'g');
    this.svg.append(this.g);
    el.append(this.svg);
    // the facet pool
    this.f = [];
    for (let i = 0; i < N; i++) {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('fill', '#fff');
      this.g.append(p);
      this.f.push({
        el: p, from: new Float32Array(6), to: new Float32Array(6), cur: new Float32Array(6),
        vFrom: 0, vTo: 0, t: 1, delay: 0, dur: 1, arc: 0,
        dx: 0, dy: 0, rot: 0, vx: 0, vy: 0, vr: 0, energy: 0, shade: 1, beam: false, lastFill: '',
      });
    }
    this.current = null;
    this.pointer = { x: -1e4, y: -1e4, active: false };
    this._onMove = (e) => this.move(e);
    this._onLeave = () => { this.pointer.active = false; };
    this._onDown = (e) => { const p = this.toLocal(e); this.burst(p.x, p.y); };
    this.svg.addEventListener('pointermove', this._onMove);
    this.svg.addEventListener('pointerleave', this._onLeave);
    this.svg.addEventListener('pointerdown', this._onDown);
  }

  toLocal(e) {
    const r = this.svg.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * this.W, y: ((e.clientY - r.top) / r.height) * this.H };
  }
  move(e) { const p = this.toLocal(e); this.pointer.x = p.x; this.pointer.y = p.y; this.pointer.active = true; }

  start() {
    this.morphTo(this.words[0], { intro: true });
    if (this.o.cycle && !this.reduced) {
      let i = 0;
      this._cycle = setInterval(() => { i = (i + 1) % this.words.length; this.morphTo(this.words[i]); }, this.o.cycle);
    }
    const loop = (t) => { this.frame(t); this._raf = requestAnimationFrame(loop); };
    this._raf = requestAnimationFrame(loop);
  }

  /** Re-flow the facets into `word`. */
  morphTo(word, { intro = false } = {}) {
    const L = this.layouts.get(word);
    if (!L) return;
    this.svg.setAttribute('aria-label', word);
    const now = performance.now();
    const W = this.W, H = this.H;
    this.f.forEach((f, i) => {
      const t = L.tris[i];
      f.from.set(f.cur);
      f.vFrom = intro ? 0 : f.vTo;
      if (intro) {
        // start scattered in a wide cloud, rotated
        const a = Math.random() * Math.PI * 2, r = 0.3 + Math.random() * 0.9;
        const cx = W * 0.5 + Math.cos(a) * W * r * 0.7, cy = H * 0.5 + Math.sin(a) * H * r * 1.6;
        const s = this.o.side * (0.4 + Math.random() * 1.6), rr = Math.random() * 6;
        for (let k = 0; k < 3; k++) {
          const ang = rr + k * 2.094;
          f.from[k * 2] = cx + Math.cos(ang) * s * 0.58; f.from[k * 2 + 1] = cy + Math.sin(ang) * s * 0.58;
        }
      }
      if (t) {
        f.to.set(t.pts); f.vTo = 1;
        f.shade = facetShade(t, W, H); f.beam = inBeam(t, W, H);
      } else {
        // surplus facet: collapse to a point near a random live facet
        const any = L.tris[(Math.random() * L.tris.length) | 0];
        for (let k = 0; k < 6; k += 2) { f.to[k] = any.cx; f.to[k + 1] = any.cy; }
        f.vTo = 0;
      }
      const cx = t ? t.cx : f.to[0];
      f.delay = intro ? (cx / W) * 900 + Math.random() * 260 : (cx / W) * 380 + Math.random() * 140;
      f.dur = intro ? 1200 + Math.random() * 500 : 760 + Math.random() * 260;
      f.arc = (Math.random() - 0.5) * (intro ? 0 : this.o.side * 6);
      f.t0 = now;
      f.t = this.reduced ? 1 : 0;
      if (this.reduced) { f.from.set(f.to); f.vFrom = f.vTo; }
    });
    this.current = word;
  }

  /** Blow the word apart from (x, y) in SVG units; springs pull it back. */
  burst(x = this.W / 2, y = this.H / 2) {
    if (this.reduced) return;
    for (const f of this.f) {
      const cx = (f.cur[0] + f.cur[2] + f.cur[4]) / 3, cy = (f.cur[1] + f.cur[3] + f.cur[5]) / 3;
      const dx = cx - x, dy = cy - y, d = Math.hypot(dx, dy) + 20;
      const k = 2200 / d;
      f.vx += (dx / d) * k * (0.6 + Math.random()); f.vy += (dy / d) * k * (0.6 + Math.random());
      f.vr += (Math.random() - 0.5) * 0.9;
      f.energy = Math.min(1, f.energy + 120 / d);
    }
  }

  frame(now) {
    const R = this.o.radius, P = this.pointer, gap = this.o.gap;
    for (const f of this.f) {
      // morph progress
      let e = 1, moving = false;
      if (f.t < 1) {
        f.t = Math.min(1, Math.max(0, (now - f.t0 - f.delay) / f.dur));
        e = easeInOut(f.t); moving = true;
      }
      const vis = f.vFrom + (f.vTo - f.vFrom) * easeOutExpo(f.t);
      const arc = Math.sin(Math.PI * e) * f.arc;
      let cx = 0, cy = 0;
      for (let k = 0; k < 6; k += 2) {
        f.cur[k] = f.from[k] + (f.to[k] - f.from[k]) * e;
        f.cur[k + 1] = f.from[k + 1] + (f.to[k + 1] - f.from[k + 1]) * e + arc;
        cx += f.cur[k]; cy += f.cur[k + 1];
      }
      cx /= 3; cy /= 3;
      // tension lens
      if (P.active && !this.reduced) {
        const dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy);
        if (d < R) {
          const q = 1 - d / R, push = q * q * 2.4;
          f.vx += (dx / (d + 1)) * push; f.vy += (dy / (d + 1)) * push;
          f.vr += (dx > 0 ? 1 : -1) * q * 0.018;
          f.energy = Math.max(f.energy, q);
        }
      }
      // damped springs back to the lattice
      f.vx = (f.vx - f.dx * 0.06) * 0.84; f.vy = (f.vy - f.dy * 0.06) * 0.84; f.vr = (f.vr - f.rot * 0.07) * 0.82;
      f.dx += f.vx; f.dy += f.vy; f.rot += f.vr;
      f.energy *= 0.965;
      const springing = Math.abs(f.dx) + Math.abs(f.dy) + Math.abs(f.rot) * 30 > 0.05;
      if (!moving && !springing && f.settled) continue;
      f.settled = !moving && !springing;
      // compose: shrink toward centroid (gap + visibility), rotate, offset
      const sc = gap * vis, c = Math.cos(f.rot), s = Math.sin(f.rot);
      let d = '';
      for (let k = 0; k < 6; k += 2) {
        const x = (f.cur[k] - cx) * sc, y = (f.cur[k + 1] - cy) * sc;
        const X = cx + f.dx + x * c - y * s, Y = cy + f.dy + x * s + y * c;
        d += (k ? 'L' : 'M') + X.toFixed(1) + ' ' + Y.toFixed(1);
      }
      f.el.setAttribute('d', d + 'Z');
      const lit = f.beam || f.energy > 0.32;
      const fill = lit ? MINT : '#fff';
      if (fill !== f.lastFill) { f.el.setAttribute('fill', fill); f.lastFill = fill; }
      f.el.setAttribute('fill-opacity', lit ? (0.75 + f.energy * 0.25).toFixed(2) : f.shade.toFixed(2));
    }
  }

  destroy() {
    cancelAnimationFrame(this._raf); clearInterval(this._cycle);
    this.svg.removeEventListener('pointermove', this._onMove);
    this.svg.removeEventListener('pointerleave', this._onLeave);
    this.svg.removeEventListener('pointerdown', this._onDown);
    this.svg.remove();
  }
}
