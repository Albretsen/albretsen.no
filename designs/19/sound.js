// Soft key clicks, synthesised. Nothing is created until the visitor opts in.

let ctx = null, out = null, noise = null

export function startSound() {
  if (ctx) { ctx.resume(); return true }
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return false
  ctx = new AC()
  out = ctx.createGain(); out.gain.value = 0.42
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6200
  out.connect(lp).connect(ctx.destination)
  const len = Math.floor(ctx.sampleRate * 0.05)
  noise = ctx.createBuffer(1, len, ctx.sampleRate)
  const ch = noise.getChannelData(0)
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  return true
}

export function stopSound() { if (ctx) ctx.suspend() }

// kind: 'key' | 'space' | 'end'
export function click(kind = 'key') {
  if (!ctx || ctx.state !== 'running') return
  const t = ctx.currentTime + 0.002
  const src = ctx.createBufferSource(); src.buffer = noise
  src.playbackRate.value = 0.85 + Math.random() * 0.35
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.2
  bp.frequency.value = kind === 'space' ? 1300 : 2600 + Math.random() * 1400
  const g = ctx.createGain()
  const peak = kind === 'space' ? 0.22 : 0.16 + Math.random() * 0.05
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + 0.0015)
  g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'space' ? 0.06 : 0.035))
  src.connect(bp).connect(g).connect(out)
  src.start(t); src.stop(t + 0.07)
  // the soft bottom-out of the key
  const o = ctx.createOscillator(), og = ctx.createGain()
  o.frequency.setValueAtTime(kind === 'end' ? 140 : 210, t)
  o.frequency.exponentialRampToValueAtTime(90, t + 0.03)
  og.gain.setValueAtTime(0.0001, t)
  og.gain.exponentialRampToValueAtTime(kind === 'key' ? 0.05 : 0.09, t + 0.003)
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.045)
  o.connect(og).connect(out)
  o.start(t); o.stop(t + 0.06)
}
