// Warm Boot sound: off until the visitor turns it on. Everything is synthesised
// (no files): a low CRT hum that swells on power-on, soft phosphor ticks tuned to a
// pentatonic scale for each check, and a barely-there blip for live events.

let ctx = null, master = null, on = false
const SCALE = [220, 246.94, 277.18, 329.63, 369.99, 440, 493.88] // A major pentatonic-ish

function ensure() {
  if (ctx) return true
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return false
  ctx = new AC()
  master = ctx.createGain(); master.gain.value = 0.5
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200
  master.connect(lp).connect(ctx.destination)
  return true
}

function tone(freq, { dur = 0.12, type = 'sine', gain = 0.06, attack = 0.004, at = 0 } = {}) {
  const t = ctx.currentTime + at
  const o = ctx.createOscillator(), g = ctx.createGain()
  o.type = type; o.frequency.value = freq
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02)
}

export const sound = {
  toggle() {
    on = !on
    if (on && ensure() && ctx.state === 'suspended') ctx.resume()
    return on
  },
  get on() { return on },
  tick(i = 0) { if (!on || !ensure()) return; tone(SCALE[i % SCALE.length] * 2, { dur: 0.09, type: 'triangle', gain: 0.035 }) },
  blip() { if (!on || !ensure()) return; tone(SCALE[5] * 2, { dur: 0.06, gain: 0.018 }) },
  hum() {
    if (!on || !ensure()) return
    const t = ctx.currentTime, o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain()
    o.type = 'sine'; o.frequency.setValueAtTime(55, t); o.frequency.exponentialRampToValueAtTime(110, t + 3.4)
    o2.type = 'sine'; o2.frequency.setValueAtTime(15734 / 4, t) // a quiet nod to the CRT line whine, far down
    const g2 = ctx.createGain(); g2.gain.value = 0.0035
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.07, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.6)
    o.connect(g).connect(master); o2.connect(g2).connect(g)
    o.start(t); o2.start(t); o.stop(t + 4.7); o2.stop(t + 4.7)
  },
}
