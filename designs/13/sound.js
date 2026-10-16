// Ambient generative soundscape, synthesized with Web Audio. Loaded only after
// the visitor turns sound on. A low drone breathes with activity; each real
// event blooms one note from D major pentatonic. No events, no notes.

const PENTA = [0, 2, 4, 7, 9] // D E F# A B
const D4 = 293.66
const hz = (deg, oct) => D4 * 2 ** (oct + (PENTA[((deg % 5) + 5) % 5] + 12 * Math.floor(deg / 5)) / 12)

const VOICE = {
  'mcp-emails': { oct: 1, type: 'sine', gain: 0.05, release: 3.2 },
  'fun-libs': { oct: 0, type: 'triangle', gain: 0.045, release: 2.6 },
  toolrails: { oct: -1, type: 'sine', gain: 0.06, release: 4 },
  'albretsen.no': { oct: -1, type: 'sine', gain: 0.03, release: 2 },
}

export function createSoundscape() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  const ctx = new Ctx()
  const master = ctx.createGain(); master.gain.value = 0
  const comp = ctx.createDynamicsCompressor()
  master.connect(comp).connect(ctx.destination)

  // Room: a synthesized impulse, three seconds of decaying noise.
  const len = Math.floor(ctx.sampleRate * 3)
  const ir = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
  }
  const room = ctx.createConvolver(); room.buffer = ir
  const wet = ctx.createGain(); wet.gain.value = 0.55
  room.connect(wet).connect(master)

  // Echo with a darkening feedback loop.
  const delay = ctx.createDelay(2); delay.delayTime.value = 0.42
  const fb = ctx.createGain(); fb.gain.value = 0.32
  const dark = ctx.createBiquadFilter(); dark.type = 'lowpass'; dark.frequency.value = 2200
  delay.connect(dark).connect(fb).connect(delay)
  dark.connect(room); dark.connect(master)

  const bus = ctx.createGain(); bus.gain.value = 1
  bus.connect(master); bus.connect(room); bus.connect(delay)

  // Drone: D2 + A2, slightly detuned, through a filter that opens with activity.
  const droneFilter = ctx.createBiquadFilter(); droneFilter.type = 'lowpass'; droneFilter.frequency.value = 240; droneFilter.Q.value = 0.7
  const droneGain = ctx.createGain(); droneGain.gain.value = 0.05
  droneFilter.connect(droneGain).connect(master); droneGain.connect(room)
  for (const [f, det] of [[73.42, -4], [73.42, 5], [110, 2], [146.83, -3]]) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.detune.value = det
    const g = ctx.createGain(); g.gain.value = f > 120 ? 0.25 : 0.5
    o.connect(g).connect(droneFilter); o.start()
  }
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05
  const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 60
  lfo.connect(lfoAmt).connect(droneFilter.frequency); lfo.start()

  let activity = 0, last = ctx.currentTime, running = false, lastDeg = 0
  const decay = () => { const now = ctx.currentTime; activity *= Math.exp(-(now - last) / 45); last = now }

  function note(freq, v, at, gainMul = 1) {
    const o = ctx.createOscillator(); o.type = v.type; o.frequency.value = freq
    const g = ctx.createGain(); g.gain.value = 0
    const peak = v.gain * gainMul
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(peak, at + 0.04)
    g.gain.exponentialRampToValueAtTime(peak * 0.35, at + 0.6)
    g.gain.exponentialRampToValueAtTime(0.0001, at + v.release)
    o.connect(g).connect(bus); o.start(at); o.stop(at + v.release + 0.1)
  }

  return {
    start() {
      running = true
      ctx.resume()
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setTargetAtTime(0.9, ctx.currentTime, 1.2)
    },
    stop() {
      running = false
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.4)
      setTimeout(() => { if (!running) ctx.suspend() }, 2500)
    },
    event(e) {
      if (!running) return
      decay(); activity = Math.min(activity + 1, 14)
      const now = ctx.currentTime
      droneFilter.frequency.setTargetAtTime(240 + activity * 55, now, 3)
      droneGain.gain.setTargetAtTime(0.05 + activity * 0.003, now, 3)
      const v = VOICE[e.product] || VOICE['albretsen.no']
      // A small random walk keeps lines melodic rather than random.
      lastDeg = Math.max(-2, Math.min(9, lastDeg + [-2, -1, 1, 2, 0][Math.floor(Math.random() * 5)]))
      if (e.kind === 'deploy') {
        ;[0, 4, 7, 9].forEach((d, i) => note(hz(d, -1), { ...v, release: 6 }, now + i * 0.09, 1.2))
      } else if (e.kind === 'page.served') {
        note(hz(0, -1), v, now, 0.6)
      } else {
        note(hz(lastDeg, v.oct), v, now)
      }
    },
  }
}
