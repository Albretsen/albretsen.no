// Living Town: the diorama camera. Orbit, zoom and pan with soft, critically damped motion,
// plus scripted moves (the opening crane, focus pulls to people and landmarks).
import * as THREE from 'three';

const clamp = THREE.MathUtils.clamp;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const HOME_VIEW = { target: [0.5, 1.5, 15.5], yaw: 0.3, pitch: 0.4, dist: 64 };

/** The overview, framed for the screen's shape (portrait phones need to stand further back). */
export function homeView(aspect) {
  if (aspect < 0.8) return { target: [-1.5, 1.5, 15.5], yaw: 0.22, pitch: 0.48, dist: 96 };
  if (aspect < 1.25) return { ...HOME_VIEW, dist: 78 };
  return HOME_VIEW;
}

export class CameraRig {
  constructor(camera, dom, { reduced = false } = {}) {
    this.camera = camera; this.dom = dom; this.reduced = reduced;
    this.goal = { target: new THREE.Vector3(...HOME_VIEW.target), yaw: HOME_VIEW.yaw, pitch: HOME_VIEW.pitch, dist: HOME_VIEW.dist };
    this.cur = { target: this.goal.target.clone(), yaw: this.goal.yaw, pitch: this.goal.pitch, dist: this.goal.dist };
    this.focusDist = this.goal.dist;
    this.tween = null;
    this.follow = null;            // an Object3D to keep in frame
    this.lastInput = performance.now();
    this.bounds = { x0: -54, x1: 56, z0: 2, z1: 30 };
    this.onInteract = () => {};
    this.onTap = () => {};
    this.onHover = () => {};
    this._bind();
  }

  set(v) {
    if (v.target) this.goal.target.set(...v.target);
    for (const k of ['yaw', 'pitch', 'dist']) if (v[k] != null) this.goal[k] = v[k];
    this.cur.target.copy(this.goal.target); this.cur.yaw = this.goal.yaw; this.cur.pitch = this.goal.pitch; this.cur.dist = this.goal.dist;
  }

  /** Animate to a view over `dur` seconds (a scripted move; user input cancels it). */
  moveTo(v, dur = 1.6) {
    const from = { target: this.goal.target.clone(), yaw: this.goal.yaw, pitch: this.goal.pitch, dist: this.goal.dist };
    let toYaw = v.yaw ?? from.yaw;
    const to = { target: v.target ? new THREE.Vector3(...v.target) : from.target.clone(), yaw: toYaw, pitch: v.pitch ?? from.pitch, dist: v.dist ?? from.dist };
    if (this.reduced) dur = Math.min(dur, 0.01);
    this.tween = { from, to, t: 0, dur: Math.max(0.01, dur) };
  }

  _bind() {
    const el = this.dom;
    const pts = new Map();
    let drag = null, pinch = null, moved = 0, downAt = 0;
    el.addEventListener('pointerdown', (e) => {
      if (e.button > 2) return;
      el.setPointerCapture?.(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = 0; downAt = performance.now();
      if (pts.size === 1) drag = { x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey, type: e.pointerType };
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: this.goal.dist, ang: Math.atan2(b.y - a.y, b.x - a.x), yaw: this.goal.yaw }; drag = null; }
    });
    el.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) { this.onHover(e); return; }
      const p = pts.get(e.pointerId);
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      if (pinch && pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x);
        this.goal.dist = clamp(pinch.dist * pinch.d / Math.max(20, d), 14, 120);
        this.goal.yaw = pinch.yaw - (ang - pinch.ang);
        this._user();
        return;
      }
      if (!drag || moved < 4) return;
      if (drag.type === 'touch' && Math.abs(dy) > Math.abs(dx) * 1.4 && !this._touchEngaged) return; // let vertical swipes scroll the page
      this._touchEngaged = true;
      if (drag.pan) this.pan(dx, dy);
      else { this.goal.yaw -= dx * 0.0042; this.goal.pitch = clamp(this.goal.pitch + dy * 0.0032, 0.06, 1.25); }
      this._user();
    });
    const up = (e) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (pts.size === 0) {
        const tap = moved < 6 && performance.now() - downAt < 450 && e.type === 'pointerup';
        drag = null; this._touchEngaged = false;
        if (tap) this.onTap(e);
      }
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('wheel', (e) => {
      // plain wheel scrolls the page; pinch-to-zoom on a trackpad or ctrl/cmd + wheel zooms the town
      if (!(e.ctrlKey || e.metaKey || this.wheelZoom)) { this.onWheelHint?.(); return; }
      e.preventDefault();
      this.goal.dist = clamp(this.goal.dist * Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), 14, 120);
      this._user();
    }, { passive: false });
    el.addEventListener('dblclick', (e) => this.onDouble?.(e));
  }

  pan(dx, dy) {
    const s = this.goal.dist * 0.0016;
    const yaw = this.goal.yaw;
    const rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    this.goal.target.x -= (dx * rx - dy * fx) * s;
    this.goal.target.z -= (dx * rz - dy * fz) * s;
  }

  zoom(f) { this.goal.dist = clamp(this.goal.dist * f, 14, 120); this._user(); }

  _user() {
    this.tween = null; this.follow = null; this.lastInput = performance.now();
    // keep hand-driven views on the sea side of the town: further round, the camera ends up in the
    // roofs or looking at the edge of the world. Close in (the railing, a person) anything goes.
    const g = this.goal;
    if (g.dist > 18) { g.yaw = clamp(g.yaw, -1.15, 1.15); g.pitch = clamp(g.pitch, 0.12, 1.2); }
    this.onInteract();
  }

  update(dt) {
    const g = this.goal, c = this.cur;
    if (this.tween) {
      const tw = this.tween;
      tw.t += dt / tw.dur;
      const k = ease(Math.min(1, tw.t));
      g.target.lerpVectors(tw.from.target, tw.to.target, k);
      g.yaw = tw.from.yaw + (tw.to.yaw - tw.from.yaw) * k;
      g.pitch = tw.from.pitch + (tw.to.pitch - tw.from.pitch) * k;
      g.dist = tw.from.dist + (tw.to.dist - tw.from.dist) * k;
      if (tw.t >= 1) this.tween = null;
    }
    if (this.follow && !this.tween) {
      const p = this.follow.getWorldPosition(new THREE.Vector3());
      g.target.lerp(p.setY(p.y + 1.0), 1 - Math.exp(-dt * 2.2));
    }
    // keep the eye over the town
    g.target.x = clamp(g.target.x, this.bounds.x0, this.bounds.x1);
    g.target.z = clamp(g.target.z, this.bounds.z0, this.bounds.z1);
    // idle drift: the diorama turns a little on its own
    const idle = (performance.now() - this.lastInput) / 1000;
    if (!this.reduced && !this.tween && !this.follow && idle > 14 && this.drift !== false) g.yaw += Math.sin(idle * 0.05) * dt * 0.012;

    // a non-finite value anywhere (it would empty every frame from then on): back to the overview
    if (!Number.isFinite(g.yaw + g.pitch + g.dist + g.target.x + g.target.y + g.target.z + c.yaw + c.pitch + c.dist + c.target.x + c.target.y + c.target.z)) { this.tween = null; this.follow = null; this.set(HOME_VIEW); }
    const k = 1 - Math.exp(-dt * 7.5);
    c.target.lerp(g.target, k);
    c.yaw += (g.yaw - c.yaw) * k; c.pitch += (g.pitch - c.pitch) * k; c.dist += (g.dist - c.dist) * k;

    const cp = Math.cos(c.pitch);
    this.camera.position.set(
      c.target.x + Math.sin(c.yaw) * cp * c.dist,
      c.target.y + Math.sin(c.pitch) * c.dist,
      c.target.z + Math.cos(c.yaw) * cp * c.dist);
    if (this.camera.position.y < 1.2) this.camera.position.y = 1.2;
    this.camera.lookAt(c.target);
  }
}
