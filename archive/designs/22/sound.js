// Opt-in UI sound, synthesised. Nothing is created until the visitor turns it on.

const NOTES = { 'mcp-emails': 880, 'fun-libs': 659.25, toolrails: 987.77, 'albretsen.no': 523.25 }

export function createSound() {
  let ctx = null, on = false
  function blip(freq, gain = 0.03, dur = 0.14) {
    if (!ctx) return
    const t = ctx.currentTime
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter()
    f.type = 'lowpass'; f.frequency.value = 2200
    o.type = 'sine'
    o.frequency.setValueAtTime(freq, t)
    o.frequency.exponentialRampToValueAtTime(freq * 0.985, t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(f).connect(g).connect(ctx.destination)
    o.start(t); o.stop(t + dur + 0.03)
  }
  return {
    get on() { return on },
    toggle() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext
        if (!AC) return false
        ctx = new AC()
      }
      on = !on
      if (on) { ctx.resume(); blip(659.25, 0.028); setTimeout(() => blip(987.77, 0.022), 80) }
      else blip(493.88, 0.02, 0.12)
      return on
    },
    event(product) { if (on && !document.hidden) blip(NOTES[product] || 740, 0.022, 0.12) },
    ui() { if (on) blip(1318.5, 0.012, 0.05) },
  }
}
