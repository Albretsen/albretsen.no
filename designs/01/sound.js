// Sound for Bloom Edition. Silent until the visitor opts in. Everything is
// synthesized with Web Audio: no files are loaded.
//
// The sonic logo, "Bloom": a filtered breath that accelerates upward (velocity),
// then three FM bell tones that open into a held fifth (bloom). About two seconds.

const NOTE = { D4: 293.66, A4: 440, D5: 587.33, E5: 659.25, Fs5: 739.99, A5: 880 }
const PING = { 'mcp-emails': NOTE.D5, 'fun-libs': NOTE.A5, toolrails: NOTE.E5, 'albretsen.no': NOTE.Fs5 }

export function createSound() {
  let ctx = null, out = null, on = false, last = 0

  function init() {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return false
    ctx = new AC()
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18; comp.ratio.value = 3
    out = ctx.createGain(); out.gain.value = 0.7
    // a small warm room: feedback delay through a lowpass
    const delay = ctx.createDelay(1); delay.delayTime.value = 0.23
    const fb = ctx.createGain(); fb.gain.value = 0.28
    const damp = ctx.createBiquadFilter(); damp.type = 'lowpass'; damp.frequency.value = 2400
    const wet = ctx.createGain(); wet.gain.value = 0.3
    out.connect(comp)
    out.connect(delay); delay.connect(damp); damp.connect(fb); fb.connect(delay); damp.connect(wet); wet.connect(comp)
    comp.connect(ctx.destination)
    return true
  }

  function bell(f, t, dur, vol) {
    const car = ctx.createOscillator(), mod = ctx.createOscillator()
    const modGain = ctx.createGain(), amp = ctx.createGain()
    car.type = 'sine'; mod.type = 'sine'
    car.frequency.value = f; mod.frequency.value = f * 2.0
    modGain.gain.setValueAtTime(f * 1.6, t)
    modGain.gain.exponentialRampToValueAtTime(f * 0.05, t + dur * 0.6)
    amp.gain.setValueAtTime(0.0001, t)
    amp.gain.exponentialRampToValueAtTime(vol, t + 0.02)
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    mod.connect(modGain); modGain.connect(car.frequency)
    car.connect(amp); amp.connect(out)
    car.start(t); mod.start(t); car.stop(t + dur + 0.05); mod.stop(t + dur + 0.05)
  }

  function pad(f, t, dur, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter()
    o.type = 'triangle'; o.frequency.value = f
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.4)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(lp); lp.connect(g); g.connect(out)
    o.start(t); o.stop(t + dur + 0.05)
  }

  function breath(t, dur) {
    const len = Math.floor(ctx.sampleRate * dur)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource(); src.buffer = buf
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 7
    bp.frequency.setValueAtTime(320, t); bp.frequency.exponentialRampToValueAtTime(3600, t + dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(bp); bp.connect(g); g.connect(out)
    src.start(t); src.stop(t + dur)
  }

  function logo() {
    const t = ctx.currentTime + 0.05
    breath(t, 0.75)
    bell(NOTE.D4, t + 0.62, 1.6, 0.16)
    bell(NOTE.A4, t + 0.78, 1.6, 0.13)
    bell(NOTE.E5, t + 0.94, 1.8, 0.11)
    pad(NOTE.D5, t + 1.0, 1.9, 0.05)
    pad(NOTE.A5, t + 1.05, 1.8, 0.035)
  }

  return {
    get on() { return on },
    async enable() {
      if (!ctx && !init()) return false
      if (ctx.state === 'suspended') await ctx.resume()
      on = true
      logo()
      return true
    },
    async disable() {
      on = false
      if (ctx && ctx.state === 'running') await ctx.suspend()
    },
    ping(e) {
      if (!on || !ctx || document.visibilityState !== 'visible') return
      const now = ctx.currentTime
      if (now - last < 0.5) return
      last = now
      const f = PING[e.product] || NOTE.D5
      if (e.kind === 'deploy') { bell(NOTE.D4, now + 0.02, 1.4, 0.06); bell(NOTE.A4, now + 0.1, 1.4, 0.05); return }
      bell(f, now + 0.02, 0.7, 0.035)
    },
  }
}
