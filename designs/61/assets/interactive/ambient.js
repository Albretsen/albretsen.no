// Ambient — an opt-in soundscape synthesised live with the Web Audio API (no audio files).
// Three layers: sea (brown noise with a slow swell and a foam hiss), wind (pink noise
// through a wandering band-pass), and a town square far away (an inharmonic bell that
// strikes now and then, sent through a generated reverb).
//
//   import { createAmbient } from './ambient.js'
//   const amb = createAmbient()
//   button.onclick = () => amb.toggle()   // must start from a user gesture
//   amb.setTime(0.8)                      // dusk: more wind, quieter square
//
// Never autoplays. Remember the choice per visitor in localStorage if you like (wrap in try/catch).

export function createAmbient({ volume = 0.5 } = {}) {
  let ctx = null, master = null, on = false, bellTimer = 0, nodes = {}, t = 0.25

  function noiseBuffer(kind, seconds = 6) {
    const n = ctx.sampleRate * seconds, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0)
    let last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5 }
      else { // Paul Kellet's pink filter
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926
      }
    }
    // crossfade the loop seam
    const f = Math.min(4000, n / 4); for (let i = 0; i < f; i++) { const k = i / f; d[n - f + i] = d[n - f + i] * (1 - k) + d[i] * k }
    return buf
  }
  const src = buf => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s }
  const lfo = (freq, depth, target, type = 'sine') => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; const g = ctx.createGain(); g.gain.value = depth; o.connect(g).connect(target); o.start(); return o }

  function reverb(seconds = 3.2) {
    const n = ctx.sampleRate * seconds, ir = ctx.createBuffer(2, n, ctx.sampleRate)
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3) }
    const cv = ctx.createConvolver(); cv.buffer = ir; return cv
  }

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination)
    const brown = noiseBuffer('brown'), pink = noiseBuffer('pink')

    // sea: low roar with a ~11 s swell, plus foam hiss riding the same swell
    const seaG = ctx.createGain(); seaG.gain.value = 0.55; seaG.connect(master)
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520
    const swell = ctx.createGain(); swell.gain.value = 0.55
    src(brown).connect(lp).connect(swell).connect(seaG)
    lfo(0.09, 0.35, swell.gain); lfo(0.031, 0.12, swell.gain)
    const hiss = ctx.createBiquadFilter(); hiss.type = 'bandpass'; hiss.frequency.value = 2400; hiss.Q.value = 0.6
    const foam = ctx.createGain(); foam.gain.value = 0.05
    src(pink).connect(hiss).connect(foam).connect(seaG)
    lfo(0.09, 0.05, foam.gain)

    // wind: wandering band-pass
    const windG = ctx.createGain(); windG.gain.value = 0.18; windG.connect(master)
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.9
    src(pink).connect(bp).connect(windG)
    lfo(0.05, 260, bp.frequency); lfo(0.13, 90, bp.frequency, 'triangle'); lfo(0.07, 0.08, windG.gain)

    // town square: bell through reverb, panned off to one side
    const townG = ctx.createGain(); townG.gain.value = 0.22
    const rv = reverb(); const pan = ctx.createStereoPanner(); pan.pan.value = -0.35
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 1800
    townG.connect(tone).connect(rv).connect(pan).connect(master)
    const dry = ctx.createGain(); dry.gain.value = 0.25; tone.connect(dry).connect(pan)
    nodes = { seaG, windG, townG }
  }

  function bell(at = ctx.currentTime, f0 = 392) {
    for (const [r, a, d] of [[0.5, 0.35, 4], [1, 1, 3], [1.19, 0.5, 2.2], [1.56, 0.35, 1.6], [2, 0.3, 1.4], [2.51, 0.2, 1], [3.01, 0.12, 0.8]]) {
      const o = ctx.createOscillator(); o.frequency.value = f0 * r
      const g = ctx.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(a * 0.12, at + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, at + d)
      o.connect(g).connect(nodes.townG); o.start(at); o.stop(at + d + 0.1)
    }
  }
  function scheduleBells() {
    const strikes = 1 + ((Math.random() * 3) | 0), base = [392, 349.2, 440][(Math.random() * 3) | 0]
    for (let i = 0; i < strikes; i++) bell(ctx.currentTime + 0.2 + i * 1.6, base)
    bellTimer = setTimeout(scheduleBells, 14000 + Math.random() * 18000)
  }

  function applyTime() {
    if (!ctx) return
    const now = ctx.currentTime, dusk = Math.max(0, (t - 0.6) / 0.4), noon = 1 - Math.abs(t - 0.5) * 2
    nodes.windG.gain.setTargetAtTime(0.12 + 0.16 * dusk, now, 1.5)
    nodes.townG.gain.setTargetAtTime(0.12 + 0.18 * noon, now, 1.5)
    nodes.seaG.gain.setTargetAtTime(0.5 + 0.1 * dusk, now, 1.5)
  }

  return {
    async start() {
      if (!ctx) build()
      await ctx.resume(); on = true; applyTime()
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setTargetAtTime(volume, ctx.currentTime, 0.8)
      clearTimeout(bellTimer); bellTimer = setTimeout(scheduleBells, 2500)
    },
    stop() {
      if (!ctx) return; on = false; clearTimeout(bellTimer)
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.4)
      setTimeout(() => { if (!on) ctx.suspend() }, 2000)
    },
    toggle() { return on ? (this.stop(), false) : (this.start(), true) },
    setTime(v) { t = Math.min(1, Math.max(0, v)); applyTime() },
    get playing() { return on },
  }
}
