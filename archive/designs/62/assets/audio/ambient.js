// Morning Elevation: opt-in ambience, synthesised live with the Web Audio API.
// No audio files are downloaded: wind, a far-off sea and a quiet town square
// at seven (a few birds, one distant bell) are generated from noise and
// oscillators. Nothing plays until the visitor asks for it.
//
//   import { Ambience } from './audio/ambient.js'
//   const amb = new Ambience()
//   button.onclick = () => amb.toggle()           // must start from a user gesture
//   amb.setMix({ wind: .6, sea: .3, square: .5 })  // 0..1 each
//   amb.setTimeOfDay(t)                            // 0..1, follows the sun: birds at dawn, wind at dusk
//
// Respect: starts muted, fades in over 2.5 s, fades out over 1.2 s,
// stops entirely (context suspended) when off or when the tab is hidden.

export class Ambience {
  constructor() {
    this.ctx = null
    this.on = false
    this.mix = { wind: 0.55, sea: 0.3, square: 0.5 }
    this.t = 0.15
    this._timers = []
    this._onVis = () => { if (!this.ctx) return; document.hidden ? this.ctx.suspend() : this.on && this.ctx.resume() }
  }

  _noiseBuffer(kind = 'pink', seconds = 4) {
    const ctx = this.ctx, len = ctx.sampleRate * seconds
    const buf = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1
        if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5 }
        else { // Paul Kellet's refined pink filter
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926
        }
      }
    }
    return buf
  }

  _build() {
    const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    this.master = ctx.createGain(); this.master.gain.value = 0
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18
    this.master.connect(comp).connect(ctx.destination)

    // wind: pink noise, band-passed, cutoff wandering slowly (two detuned LFOs = gusts)
    const wind = ctx.createBufferSource(); wind.buffer = this._noiseBuffer('pink'); wind.loop = true
    const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 420; wf.Q.value = 0.7
    const lfo1 = ctx.createOscillator(); lfo1.frequency.value = 0.07
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.113
    const lg1 = ctx.createGain(); lg1.gain.value = 180; const lg2 = ctx.createGain(); lg2.gain.value = 120
    lfo1.connect(lg1).connect(wf.frequency); lfo2.connect(lg2).connect(wf.frequency)
    this.windGain = ctx.createGain()
    wind.connect(wf).connect(this.windGain).connect(this.master)

    // sea: brown noise through a lowpass, amplitude swelling every ~9 s like a far shoreline
    const sea = ctx.createBufferSource(); sea.buffer = this._noiseBuffer('brown', 6); sea.loop = true
    const sf = ctx.createBiquadFilter(); sf.type = 'lowpass'; sf.frequency.value = 520
    const swell = ctx.createGain(); swell.gain.value = 0.5
    const sl = ctx.createOscillator(); sl.frequency.value = 0.11
    const slg = ctx.createGain(); slg.gain.value = 0.35
    sl.connect(slg).connect(swell.gain)
    this.seaGain = ctx.createGain()
    sea.connect(sf).connect(swell).connect(this.seaGain).connect(this.master)

    // town square: a soft bed of distant room tone plus scheduled events (birds, a bell)
    this.squareGain = ctx.createGain()
    this.squareGain.connect(this.master)
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null
    this.squareBus = ctx.createGain(); this.squareBus.connect(pan || this.squareGain); if (pan) pan.connect(this.squareGain)
    this._pan = pan

    for (const n of [wind, sea, lfo1, lfo2, sl]) n.start()
    this._applyMix()
  }

  _chirp(when) {
    const ctx = this.ctx
    const o = ctx.createOscillator(), g = ctx.createGain(), m = ctx.createOscillator(), mg = ctx.createGain()
    const f = 2600 + Math.random() * 1800
    o.frequency.setValueAtTime(f, when)
    o.frequency.exponentialRampToValueAtTime(f * (0.7 + Math.random() * 0.6), when + 0.09)
    m.frequency.value = 28 + Math.random() * 30; mg.gain.value = 260
    m.connect(mg).connect(o.frequency)
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(0.05, when + 0.012); g.gain.exponentialRampToValueAtTime(0.0008, when + 0.12)
    o.connect(g).connect(this.squareBus)
    if (this._pan) this._pan.pan.setValueAtTime(Math.random() * 1.6 - 0.8, when)
    o.start(when); m.start(when); o.stop(when + 0.14); m.stop(when + 0.14)
  }

  _bell(when) {
    // additive church-bell partials (hum, prime, tierce, quint, nominal), long decay, far away
    const ctx = this.ctx, base = 196
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; lp.connect(this.squareBus)
    for (const [r, a, d] of [[0.5, 0.25, 6], [1, 0.4, 4.5], [1.2, 0.2, 3.5], [1.5, 0.12, 3], [2, 0.22, 2.5], [2.74, 0.06, 1.6]]) {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.frequency.value = base * r
      g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a * 0.08, when + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, when + d)
      o.connect(g).connect(lp); o.start(when); o.stop(when + d + 0.1)
    }
  }

  _schedule() {
    const loop = () => {
      if (!this.on) return
      const now = this.ctx.currentTime
      const dawn = 1 - Math.min(1, Math.abs(this.t - 0.15) * 2.2) // birds love the first light
      const n = Math.random() < 0.35 + dawn * 0.5 ? 1 + Math.floor(Math.random() * 4) : 0
      for (let i = 0; i < n; i++) this._chirp(now + 0.1 + i * (0.12 + Math.random() * 0.1))
      if (Math.random() < 0.035) this._bell(now + 0.3)
      this._timers.push(setTimeout(loop, 900 + Math.random() * 2600))
    }
    loop()
  }

  _applyMix() {
    if (!this.ctx) return
    const now = this.ctx.currentTime, dusk = Math.max(0, this.t - 0.6) * 1.5
    this.windGain.gain.setTargetAtTime(this.mix.wind * (0.5 + dusk) * 0.9, now, 0.8)
    this.seaGain.gain.setTargetAtTime(this.mix.sea * 0.7, now, 0.8)
    this.squareGain.gain.setTargetAtTime(this.mix.square, now, 0.8)
  }

  setMix(m) { Object.assign(this.mix, m); this._applyMix() }
  setTimeOfDay(t) { this.t = t; this._applyMix() }

  async start() {
    if (!this.ctx) this._build()
    await this.ctx.resume()
    this.on = true
    document.addEventListener('visibilitychange', this._onVis)
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now); this.master.gain.setValueAtTime(this.master.gain.value, now)
    this.master.gain.linearRampToValueAtTime(0.9, now + 2.5)
    this._schedule()
  }

  stop() {
    if (!this.ctx) return
    this.on = false
    this._timers.forEach(clearTimeout); this._timers = []
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now); this.master.gain.setValueAtTime(this.master.gain.value, now)
    this.master.gain.linearRampToValueAtTime(0, now + 1.2)
    setTimeout(() => !this.on && this.ctx.suspend(), 1300)
    document.removeEventListener('visibilitychange', this._onVis)
  }

  toggle() { return this.on ? (this.stop(), false) : (this.start(), true) }
}
