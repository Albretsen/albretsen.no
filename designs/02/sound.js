// Each product sings one note of an A major pentatonic, the chord of first light.
// Nothing is created until the visitor opts in.

const NOTES = {
  'mcp-emails': 440.0,    // A4
  'fun-libs': 659.25,     // E5
  toolrails: 554.37,      // C#5
  'albretsen.no': 880.0,  // A5
}

let ctx = null, out = null

function init() {
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  out = ctx.createGain(); out.gain.value = 0.18
  // A short feedback echo: the note goes once round the orbit and fades.
  const delay = ctx.createDelay(1); delay.delayTime.value = 0.38
  const fb = ctx.createGain(); fb.gain.value = 0.32
  const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 2400
  out.connect(ctx.destination)
  out.connect(delay); delay.connect(tone); tone.connect(fb); fb.connect(delay); tone.connect(ctx.destination)
}

export function enable() { if (!ctx) init(); return ctx.resume() }
export function disable() { return ctx ? ctx.suspend() : Promise.resolve() }

export function play(product, kind) {
  if (!ctx || ctx.state !== 'running') return
  const f = NOTES[product] || 440
  const t = ctx.currentTime + 0.01
  const voice = (freq, peak, len, type = 'sine') => {
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = type; o.frequency.value = freq
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(peak, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + len)
    o.connect(g); g.connect(out); o.start(t); o.stop(t + len + 0.05)
  }
  voice(f, 0.5, 1.4)
  voice(f * 2, 0.08, 0.6, 'triangle') // a little air on top
  if (kind === 'deploy') voice(f * 1.5, 0.3, 1.8) // a deploy is a fifth: a small arrival
}
