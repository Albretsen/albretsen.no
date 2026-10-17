// Opt-in UI sound, synthesised. Nothing is created until the visitor asks.
// Each event plays the pitch of its row on the score: a minor pentatonic
// scale from A3 upwards, soft triangle plucks, like a music box left on.
const PENTA = [0, 3, 5, 7, 10]

export function createSound() {
  let ctx = null, master = null, on = false

  const ensure = () => {
    if (ctx) return ctx
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain(); master.gain.value = 0.5
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600
    master.connect(lp); lp.connect(ctx.destination)
    return ctx
  }

  function pluck(freq, when = 0, level = 0.07, length = 0.9) {
    const t = ctx.currentTime + when
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(level, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + length)
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = freq
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 2
    const g2 = ctx.createGain(); g2.gain.value = 0.25
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(master)
    o.start(t); o2.start(t); o.stop(t + length + 0.05); o2.stop(t + length + 0.05)
  }

  const freqOf = step => 220 * 2 ** ((PENTA[step % 5] + 12 * Math.floor(step / 5)) / 12)

  return {
    toggle() {
      on = !on
      if (on && ensure()) {
        ctx.resume?.()
        pluck(880, 0, 0.05, 0.18); pluck(1320, 0.07, 0.04, 0.3)
      } else if (ctx) {
        pluck(660, 0, 0.035, 0.2)
      }
      return on
    },
    note(step, chord = false) {
      if (!on || !ctx) return
      pluck(freqOf(step))
      if (chord) { pluck(freqOf(step + 2), 0.04, 0.05, 1.4); pluck(freqOf(step + 4), 0.08, 0.04, 1.6) }
    },
    tick() {
      if (!on || !ctx) return
      const t = ctx.currentTime, len = 0.03
      const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
      const src = ctx.createBufferSource(); src.buffer = buf
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 4
      const g = ctx.createGain(); g.gain.value = 0.05
      src.connect(bp); bp.connect(g); g.connect(master); src.start(t)
    },
  }
}
