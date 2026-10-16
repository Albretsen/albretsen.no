// Sound, synthesized. Off until the visitor turns it on.
// Sonic logo: one clean dot of a note, then four echoes that drift slightly flat
// and lose their brightness. "Dot. Echo, echo, echo, echo."

const PITCH = { 'mcp-emails': 659.25, 'fun-libs': 783.99, toolrails: 987.77, 'albretsen.no': 1174.66 } // E5 G5 B5 D6

export function createSound() {
  let ac = null, out = null

  function ensure() {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)()
      out = ac.createGain(); out.gain.value = 0.5
      const comp = ac.createDynamicsCompressor()
      out.connect(comp).connect(ac.destination)
    }
    if (ac.state === 'suspended') ac.resume()
    return ac
  }

  // one dot: a sine with a quick attack and a soft tail, through a lowpass
  function dot(t, freq, gain, bright) {
    const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter()
    o.type = 'triangle'; o.frequency.setValueAtTime(freq, t)
    f.type = 'lowpass'; f.frequency.setValueAtTime(bright, t); f.Q.value = 0.4
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
    o.connect(f).connect(g).connect(out)
    o.start(t); o.stop(t + 0.55)
  }

  return {
    logo() {
      ensure()
      const t = ac.currentTime + 0.05
      dot(t, 1318.51, 0.32, 6000)                    // the dot (E6)
      for (let k = 1; k <= 4; k++) {                 // the echoes
        const cents = -14 * k
        dot(t + k * 0.21, 1318.51 * 2 ** (cents / 1200), 0.32 * 0.42 ** k, 6000 / (k + 1))
      }
      dot(t + 1.1, 659.25, 0.12, 1800)               // a low full stop, an octave down
    },
    event(product) {
      if (!ac) return
      const t = ac.currentTime + 0.02
      const f = PITCH[product] ?? 880
      dot(t, f, 0.08, 3200)
      dot(t + 0.21, f * 2 ** (-14 / 1200), 0.03, 1600)
    },
    suspend() { if (ac && ac.state === 'running') ac.suspend() },
  }
}
