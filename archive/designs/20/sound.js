// Brev: ambient generative sound, driven by real activity. Off until the
// visitor turns it on. Everything is synthesised; nothing is downloaded.
//
// A low drone (A2, E3) breathes under a slow filter. Activity opens the
// filter. Above the threshold (terskel) a fourth voice joins. Each event rings
// one soft note from its product's own little scale, so the mix of products
// becomes a melody.

const SCALES = {
  'mcp-emails': [440, 523.25, 587.33],     // A4 C5 D5
  'fun-libs': [659.25, 783.99, 880],       // E5 G5 A5
  toolrails: [329.63, 392],                // E4 G4
  'albretsen.no': [220, 293.66],           // A3 D4
}
export const THRESHOLD = 8 // events per minute

export function createSound() {
  let ctx = null, master, drone, filter, wet, extra, lfo, on = false

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext
    ctx = new AC()
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination)

    // Reverb from a synthesised impulse: decaying noise, three seconds.
    const len = ctx.sampleRate * 3, ir = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
    }
    const verb = ctx.createConvolver(); verb.buffer = ir
    wet = ctx.createGain(); wet.gain.value = 0.55
    verb.connect(wet).connect(master)

    filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 260; filter.Q.value = 0.7
    drone = ctx.createGain(); drone.gain.value = 0.16
    filter.connect(drone); drone.connect(master); drone.connect(verb)

    const voice = (f, type, g) => {
      const o = ctx.createOscillator(), v = ctx.createGain()
      o.type = type; o.frequency.value = f; v.gain.value = g
      o.connect(v).connect(filter); o.start(); return v
    }
    voice(110, 'sine', 0.5); voice(110.4, 'triangle', 0.18); voice(164.81, 'sine', 0.3)
    extra = voice(246.94, 'sine', 0) // B3: only above the threshold

    lfo = ctx.createOscillator(); lfo.frequency.value = 0.045
    const depth = ctx.createGain(); depth.gain.value = 90
    lfo.connect(depth).connect(filter.frequency); lfo.start()
    build.verb = verb
  }

  function ring(e) {
    if (!on || !ctx) return
    const set = SCALES[e.product] || SCALES['albretsen.no']
    let h = 0; for (const ch of e.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
    const notes = e.kind === 'deploy' ? set.concat([329.63]) : [set[h % set.length]]
    const t = ctx.currentTime + 0.02
    const level = e.ms ? 0.05 + 0.04 * Math.min(1, e.ms / 900) : 0.07
    for (const f of notes) {
      for (const [mult, g] of [[1, 1], [2.01, 0.25], [3.98, 0.06]]) {
        const o = ctx.createOscillator(), v = ctx.createGain()
        o.type = 'sine'; o.frequency.value = f * mult
        v.gain.setValueAtTime(0, t)
        v.gain.linearRampToValueAtTime(level * g, t + 0.012)
        v.gain.exponentialRampToValueAtTime(0.0001, t + 2.6 / mult + 0.4)
        o.connect(v); v.connect(master); v.connect(build.verb)
        o.start(t); o.stop(t + 3.2)
      }
    }
  }

  function activity(perMinute) {
    if (!ctx) return
    const t = ctx.currentTime
    const open = Math.min(1, perMinute / (THRESHOLD * 2))
    filter.frequency.setTargetAtTime(240 + open * 1100, t, 4)
    extra.gain.setTargetAtTime(perMinute >= THRESHOLD ? 0.22 : 0, t, 6)
  }

  return {
    get on() { return on },
    async toggle() {
      if (!ctx) build()
      on = !on
      const t = ctx.currentTime
      if (on) { await ctx.resume(); master.gain.setTargetAtTime(0.6, t, 1.2) }
      else { master.gain.setTargetAtTime(0, t, 0.3); setTimeout(() => { if (!on) ctx.suspend() }, 1500) }
      return on
    },
    ring, activity,
  }
}
