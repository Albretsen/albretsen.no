// Sound: off until asked. Everything is synthesized; nothing is downloaded.
// Sonic logo "the drop": a sine that breaks the surface (pitch glide up),
// then two glassy partials a fifth apart, like a bead of water on chrome.

let ctx = null, out = null

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    out = ctx.createGain()
    out.gain.value = 0.5
    const comp = ctx.createDynamicsCompressor()
    out.connect(comp).connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function blip(t, f0, f1, dur, peak, type = 'sine') {
  const o = ctx.createOscillator(), g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(f0, t)
  o.frequency.exponentialRampToValueAtTime(f1, t + Math.min(0.09, dur * 0.4))
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(out)
  o.start(t); o.stop(t + dur + 0.05)
}

export function sonicLogo() {
  if (!ensure()) return
  const t = ctx.currentTime + 0.03
  blip(t, 330, 990, 0.22, 0.32)              // the drop breaks the surface
  blip(t + 0.16, 1318.5, 1318.5, 0.9, 0.09)  // E6, glass
  blip(t + 0.24, 1975.5, 1975.5, 1.1, 0.05)  // B6, a fifth above
  blip(t + 0.16, 659.25, 659.25, 1.2, 0.07, 'triangle') // body
}

// One quiet drop per event; pitch per product lane (E minor pentatonic).
const LANE_HZ = { 'mcp-emails': 1318.5, 'fun-libs': 987.8, toolrails: 1568, 'albretsen.no': 659.25 }
export function eventDrop(product) {
  if (!ctx) return
  const f = LANE_HZ[product] || 880
  const t = ctx.currentTime + 0.01
  blip(t, f * 0.5, f, 0.18, product === 'albretsen.no' ? 0.08 : 0.035)
}

export function mute() { if (ctx) ctx.suspend() }
