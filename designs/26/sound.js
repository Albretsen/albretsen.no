// Widescreen soundscape. Synthesised with Web Audio; no files.
// A low drone on D opens up as activity rises. Each real event strikes one
// note from a D pentatonic lattice: products own registers, deploys ring a chord.
// Silence when nothing happens. Loaded only after the visitor turns sound on.

const PENTA = [0, 2, 5, 7, 9] // D E G A B
const D2 = 73.42
const hz = (oct, step) => D2 * 2 ** (oct + (PENTA[step % 5] + 12 * Math.floor(step / 5)) / 12)

const VOICE = {
  'mcp-emails':   { oct: 3, type: 'sine',     gain: 0.10, decay: 1.6 },
  'fun-libs':     { oct: 2, type: 'triangle', gain: 0.09, decay: 2.2 },
  'toolrails':    { oct: 2, type: 'sine',     gain: 0.10, decay: 2.8 },
  'albretsen.no': { oct: 1, type: 'sine',     gain: 0.07, decay: 3.5 },
}

function hash(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }

export function createSoundscape() {
  const AC = window.AudioContext || window.webkitAudioContext
  let ctx = null, master, send, droneGain, droneFilter
  let level = 0, last = 0

  function build() {
    ctx = new AC()
    master = ctx.createGain(); master.gain.value = 0
    const comp = ctx.createDynamicsCompressor()
    master.connect(comp).connect(ctx.destination)

    // a synthesised room: decaying noise impulse
    const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
    }
    const verb = ctx.createConvolver(); verb.buffer = ir
    const delay = ctx.createDelay(2); delay.delayTime.value = 0.43
    const fb = ctx.createGain(); fb.gain.value = 0.32
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 2400
    send = ctx.createGain(); send.gain.value = 0.55
    send.connect(delay).connect(tone).connect(fb).connect(delay)
    tone.connect(verb); send.connect(verb)
    const wet = ctx.createGain(); wet.gain.value = 0.6
    verb.connect(wet).connect(master)

    // drone
    droneFilter = ctx.createBiquadFilter(); droneFilter.type = 'lowpass'; droneFilter.frequency.value = 260; droneFilter.Q.value = 0.7
    droneGain = ctx.createGain(); droneGain.gain.value = 0.03
    droneFilter.connect(droneGain).connect(master)
    droneGain.connect(send)
    for (const [f, type, g, det] of [[D2, 'sawtooth', 0.18, -4], [D2 * 1.5, 'sawtooth', 0.12, 5], [D2 * 2, 'triangle', 0.22, 2], [D2 / 2, 'sine', 0.5, 0]]) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det
      const og = ctx.createGain(); og.gain.value = g
      o.connect(og).connect(droneFilter); o.start()
    }
    // a slow breath on the drone filter
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.045
    const lg = ctx.createGain(); lg.gain.value = 70
    lfo.connect(lg).connect(droneFilter.frequency); lfo.start()
  }

  function activity() {
    const now = ctx.currentTime
    level *= Math.exp(-(now - last) / 40); last = now
    return 1 - Math.exp(-level / 5) // 0..1
  }

  function strike(freq, type, gain, decay, at, pan) {
    const t = at ?? ctx.currentTime + 0.02
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 2.001
    const g = ctx.createGain(), g2 = ctx.createGain(); g2.gain.value = 0.18
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain, t + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
    o.connect(g); o2.connect(g2).connect(g)
    if (p) { p.pan.value = pan; g.connect(p); p.connect(master); p.connect(send) } else { g.connect(master); g.connect(send) }
    o.start(t); o2.start(t); o.stop(t + decay + 0.1); o2.stop(t + decay + 0.1)
  }

  return {
    start() {
      if (!ctx) build()
      ctx.resume()
      const t = ctx.currentTime
      master.gain.cancelScheduledValues(t)
      master.gain.setTargetAtTime(0.8, t, 0.8)
    },
    stop() {
      if (!ctx) return
      const t = ctx.currentTime
      master.gain.cancelScheduledValues(t)
      master.gain.setTargetAtTime(0, t, 0.25)
      setTimeout(() => { if (master.gain.value < 0.01) ctx.suspend() }, 1500)
    },
    event(e) {
      if (!ctx || ctx.state !== 'running') return
      level += 1
      const a = activity()
      const t = ctx.currentTime
      droneFilter.frequency.setTargetAtTime(260 + 1100 * a, t, 3)
      droneGain.gain.setTargetAtTime(0.03 + 0.05 * a, t, 3)
      const h = hash(e.id + e.kind)
      const pan = ((h >>> 8) % 200) / 100 - 1
      if (e.kind === 'deploy') {
        ;[0, 3, 5, 7].forEach((s, i) => strike(hz(1, s), 'sine', 0.07, 5, t + 0.02 + i * 0.09, pan * 0.5))
        return
      }
      const v = VOICE[e.product] || VOICE['albretsen.no']
      strike(hz(v.oct, h % 7), v.type, v.gain * (0.75 + 0.25 * a), v.decay, undefined, pan * 0.7)
    },
  }
}
