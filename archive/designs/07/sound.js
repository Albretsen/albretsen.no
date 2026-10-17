// Blue Hour soundscape. Off until the visitor asks for it.
// A low drone that opens up as activity rises; each real event adds one soft
// note, pitched by product. Nothing plays when nothing happens.

const PENTA = [0, 2, 4, 7, 9] // D major pentatonic, in semitones from D
const REGISTER = { 'toolrails': 50, 'mcp-emails': 62, 'fun-libs': 74, 'albretsen.no': 69 } // MIDI roots
const hz = m => 440 * Math.pow(2, (m - 69) / 12)

function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }

function impulse(ctx, seconds = 3.2) {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2)
  }
  return buf
}

export function createSound() {
  let ctx = null, playing = false, master, filter, drone = [], reverb, wet, activity = 0, decayTimer = null

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    master = ctx.createGain(); master.gain.value = 0
    const comp = ctx.createDynamicsCompressor()
    master.connect(comp).connect(ctx.destination)

    reverb = ctx.createConvolver(); reverb.buffer = impulse(ctx)
    wet = ctx.createGain(); wet.gain.value = 0.7
    reverb.connect(wet).connect(master)

    filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 320; filter.Q.value = 0.6
    const droneGain = ctx.createGain(); droneGain.gain.value = 0.11
    filter.connect(droneGain); droneGain.connect(master); droneGain.connect(reverb)

    for (const [m, det, type, g] of [[38, -4, 'sine', 0.5], [45, 3, 'sine', 0.35], [50, 0, 'triangle', 0.12], [57, 5, 'sine', 0.08]]) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = hz(m); o.detune.value = det
      const og = ctx.createGain(); og.gain.value = g
      o.connect(og).connect(filter); o.start(); drone.push(o)
    }
    // A very slow breath on the filter.
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.045
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 90
    lfo.connect(lfoGain).connect(filter.frequency); lfo.start(); drone.push(lfo)
  }

  function setActivity() {
    if (!ctx) return
    const t = ctx.currentTime
    filter.frequency.cancelScheduledValues(t)
    filter.frequency.setTargetAtTime(320 + Math.min(1, activity) * 1100, t, 4)
  }

  function note(e) {
    const t = ctx.currentTime + 0.02
    const h = hash(e.id + e.kind)
    const root = REGISTER[e.product] ?? 62
    const m = root + PENTA[h % PENTA.length] + (e.product === 'toolrails' && h & 32 ? 12 : 0)
    const voices = e.product === 'albretsen.no' ? [m, m + 7] : [m]
    for (const v of voices) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = hz(v)
      const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = hz(v) * 2.001
      const g = ctx.createGain(); g.gain.value = 0
      const g2 = ctx.createGain(); g2.gain.value = 0.18
      o.connect(g); o2.connect(g2).connect(g)
      const peak = e.kind === 'deploy' ? 0.09 : 0.055
      const len = 2.4 + (h % 7) * 0.35
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(peak, t + 0.04)
      g.gain.exponentialRampToValueAtTime(0.0001, t + len)
      g.connect(reverb); g.connect(master)
      o.start(t); o2.start(t); o.stop(t + len + 0.1); o2.stop(t + len + 0.1)
    }
  }

  return {
    get on() { return playing },
    async start() {
      if (!ctx) build()
      playing = true
      await ctx.resume()
      const t = ctx.currentTime
      master.gain.cancelScheduledValues(t)
      master.gain.setValueAtTime(master.gain.value, t)
      master.gain.linearRampToValueAtTime(0.8, t + 3)
      setActivity()
      clearInterval(decayTimer)
      decayTimer = setInterval(() => { activity *= 0.9; setActivity() }, 6000)
    },
    stop() {
      if (!ctx) return
      playing = false
      const t = ctx.currentTime
      master.gain.cancelScheduledValues(t)
      master.gain.setValueAtTime(master.gain.value, t)
      master.gain.linearRampToValueAtTime(0, t + 1.2)
      clearInterval(decayTimer)
      setTimeout(() => { if (!playing) ctx.suspend() }, 1400)
    },
    event(e) {
      activity = Math.min(1.5, activity + 0.12)
      if (!ctx || !playing) return
      setActivity(); note(e)
    },
  }
}
