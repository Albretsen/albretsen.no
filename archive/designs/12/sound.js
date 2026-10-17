// Sound: off until the visitor asks. Everything is synthesised; nothing loads.
// Three gestures only: a struck tone per feed event, a dry tick on focus,
// and an interval when sound is switched on.

const PITCH = { 'mcp-emails': 880, 'fun-libs': 659.25, toolrails: 987.77, 'albretsen.no': 1318.5 }

export function createSound() {
  let ac = null, out = null, on = false

  function ensure() {
    if (ac) return
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    ac = new AC()
    out = ac.createGain(); out.gain.value = 0.9
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200
    out.connect(lp); lp.connect(ac.destination)
  }

  function tone(freq, { at = 0, gain = 0.035, decay = 0.35, type = 'sine' } = {}) {
    if (!on || !ac) return
    const t = ac.currentTime + at
    const o = ac.createOscillator(), g = ac.createGain()
    o.type = type; o.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
    o.connect(g); g.connect(out)
    o.start(t); o.stop(t + decay + 0.02)
  }

  return {
    get on() { return on },
    set(v) {
      on = v
      if (on) { ensure(); ac && ac.resume(); tone(587.33, { gain: 0.03 }); tone(880, { at: 0.09, gain: 0.025 }) }
    },
    event(e) {
      const f = e.kind === 'deploy' ? 440 : (PITCH[e.product] || 880)
      tone(f, { gain: 0.03, decay: 0.5 })
      tone(f * 2.01, { gain: 0.006, decay: 0.18 }) // a faint partial: glass, not bell
    },
    tick() { tone(2400, { gain: 0.012, decay: 0.03, type: 'triangle' }) },
  }
}
