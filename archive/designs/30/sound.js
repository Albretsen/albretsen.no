// UNCUT soundtrack. Nothing loads, nothing plays until the visitor opts in.
// A low "projector room" bed (two detuned sines + filtered noise) whose filter
// opens as real activity rises; every real event plucks one note through a
// dark tape delay. Quiet hours sound quiet. Nothing is looped or faked.

const SCALE = [0, 3, 5, 7, 10] // minor pentatonic, built on D
const ROOT = 146.83 // D3
const VOICE = { // [octave offset, timbre]
  'mcp-emails': [1, 'sine'],
  'fun-libs': [0, 'triangle'],
  toolrails: [-1, 'sine'],
  'albretsen.no': [0, 'sine'],
}

export function createSound() {
  let ctx = null, master, bedFilter, delayIn, activity = 0, decayTimer = null, on = false

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    master = ctx.createGain(); master.gain.value = 0
    const comp = ctx.createDynamicsCompressor()
    master.connect(comp).connect(ctx.destination)

    // tape-ish delay bus
    delayIn = ctx.createGain(); delayIn.gain.value = 0.55
    const delay = ctx.createDelay(2); delay.delayTime.value = 0.42
    const fb = ctx.createGain(); fb.gain.value = 0.38
    const dark = ctx.createBiquadFilter(); dark.type = 'lowpass'; dark.frequency.value = 1800
    delayIn.connect(delay); delay.connect(dark); dark.connect(fb); fb.connect(delay); dark.connect(master)

    // bed
    bedFilter = ctx.createBiquadFilter(); bedFilter.type = 'lowpass'; bedFilter.frequency.value = 220; bedFilter.Q.value = 0.7
    const bed = ctx.createGain(); bed.gain.value = 0.16
    bedFilter.connect(bed).connect(master)
    for (const [f, d] of [[73.42, -4], [73.42, 5], [110, 2]]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.detune.value = d
      const g = ctx.createGain(); g.gain.value = f > 100 ? 0.25 : 0.5
      o.connect(g).connect(bedFilter); o.start()
    }
    // noise: the air in the room
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), ch = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; ch[i] = last * 3.5 }
    const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true
    const band = ctx.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = 600; band.Q.value = 0.6
    const ng = ctx.createGain(); ng.gain.value = 0.05
    noise.connect(band).connect(ng).connect(master); noise.start()

    // activity decays toward silence; the bed closes as the world goes quiet
    decayTimer = setInterval(() => {
      activity *= 0.94
      bedFilter.frequency.setTargetAtTime(200 + Math.min(activity, 6) * 220, ctx.currentTime, 1.5)
    }, 1000)
  }

  function pluck(e) {
    if (!on || !ctx) return
    const [oct, type] = VOICE[e.product] || [0, 'sine']
    // pitch is chosen by the event's own id so the same event always sounds the same
    let h = 0; for (const c of e.id) h = (h * 31 + c.charCodeAt(0)) >>> 0
    const step = SCALE[h % SCALE.length]
    const f = ROOT * Math.pow(2, oct + step / 12)
    const t = ctx.currentTime + 0.02
    const notes = e.kind === 'deploy' ? [f, f * 1.5, f * 2] : [f]
    for (const freq of notes) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.11, t + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8)
      o.connect(g); g.connect(master); g.connect(delayIn)
      o.start(t); o.stop(t + 2)
    }
    activity += 1
    bedFilter.frequency.setTargetAtTime(200 + Math.min(activity, 6) * 220, ctx.currentTime, 0.6)
  }

  async function set(next) {
    on = next
    if (on && !ctx) build()
    if (!ctx) return
    if (on) await ctx.resume()
    master.gain.setTargetAtTime(on ? 0.6 : 0, ctx.currentTime, on ? 0.8 : 0.15)
    if (!on) setTimeout(() => { if (!on) ctx.suspend() }, 900)
  }

  return { set, pluck, get on() { return on }, stop() { clearInterval(decayTimer); ctx?.close() } }
}
