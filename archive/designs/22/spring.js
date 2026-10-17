// A small damped spring. Position and velocity persist between kicks,
// so motion carries inertia when events arrive mid-flight.

export class Spring {
  constructor({ stiffness = 200, damping = 24, mass = 1, value = 0, onUpdate = () => {} } = {}) {
    Object.assign(this, { stiffness, damping, mass, onUpdate })
    this.x = value; this.v = 0; this.target = value; this.raf = 0
    this.step = this.step.bind(this)
  }
  set(value) { this.stop(); this.x = this.target = value; this.v = 0; this.onUpdate(value) }
  to(target) { this.target = target; this.start() }
  kick(dx = 0, dv = 0) { this.x += dx; this.v += dv; this.start() }
  start() { if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(this.step) } }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0 }
  step(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now
    const n = 6, h = dt / n
    for (let i = 0; i < n; i++) {
      const f = -this.stiffness * (this.x - this.target) - this.damping * this.v
      this.v += (f / this.mass) * h
      this.x += this.v * h
    }
    if (Math.abs(this.v) < 0.02 && Math.abs(this.x - this.target) < 0.02) {
      this.x = this.target; this.v = 0; this.raf = 0; this.onUpdate(this.x); return
    }
    this.onUpdate(this.x)
    this.raf = requestAnimationFrame(this.step)
  }
}
