// Sound for STILLE. Nothing exists until the visitor asks for it.
// The sonic logo: three bells stacked in fifths (an orbit opening outward),
// a rest, then one low tone that lets the silence back in.

const D_PENTA = [0, 2, 4, 7, 9] // D major pentatonic, semitones
const D3 = 146.83

export function createSound() {
  let ctx = null, out = null, on = false

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return false
      ctx = new AC()
      const comp = ctx.createDynamicsCompressor()
      comp.threshold.value = -18; comp.ratio.value = 3
      out = ctx.createGain(); out.gain.value = 0.55
      out.connect(comp).connect(ctx.destination)
    }
    if (ctx.state === 'suspended') ctx.resume()
    return true
  }

  function tone(freq, t, dur, gain, type = 'sine') {
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = type; o.frequency.value = freq
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(out)
    o.start(t); o.stop(t + dur + 0.05)
  }

  function bell(freq, t, dur, gain) {
    tone(freq, t, dur, gain)
    tone(freq * 2.0012, t, dur * 0.55, gain * 0.22)
    tone(freq * 3.0, t, dur * 0.28, gain * 0.07, 'triangle')
  }

  function logo() {
    const t = ctx.currentTime + 0.06
    bell(293.66, t, 1.7, 0.2)        // D4
    bell(440.0, t + 0.17, 1.5, 0.16)  // A4
    bell(659.25, t + 0.34, 1.3, 0.12) // E5
    tone(146.83, t + 1.05, 2.4, 0.11) // D3, after the rest
  }

  // lane 0 is the highest pitch, the visitor's lane the lowest
  function note(lane, lanes) {
    if (!on || !ctx) return
    const step = lanes - 1 - lane
    const semis = D_PENTA[step % 5] + 12 * Math.floor(step / 5)
    const f = D3 * 2 ** (semis / 12)
    bell(f, ctx.currentTime + 0.02, 0.9, 0.07)
  }

  return {
    get on() { return on },
    toggle() {
      if (on) { on = false; if (ctx) ctx.suspend(); return false }
      if (!ensure()) return false
      on = true; logo(); return true
    },
    note,
  }
}
